use crate::vibrance::NvidiaController;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::{ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter, State};
use winapi::um::winuser::{
    GetForegroundWindow, GetMonitorInfoA, GetWindowThreadProcessId, MonitorFromWindow,
    MONITORINFOEXA, MONITOR_DEFAULTTONEAREST,
};

/// Konfiguration für die digitale Vibrance (Farbsättigung).
///
/// # Rust-Konzepte
/// * `derive(Clone, Debug)`: Generiert automatisch Code, um das Struct zu kopieren (`Clone`)
///   und für Debug-Ausgaben zu formatieren (`Debug`).
#[derive(Clone, Debug)]
pub struct VibranceSettings {
    pub enabled: bool,
    pub default_vibrance: u32,
    pub cs2_vibrance: u32,
    pub polling_rate: u64,
}

impl Default for VibranceSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            default_vibrance: 50,
            cs2_vibrance: 100,
            polling_rate: 1000,
        }
    }
}

/// Der globale Zustand für das Vibrance-Monitoring.
///
/// # Architektur
/// Dieser State wird zwischen dem Haupt-Thread (Tauri Commands) und dem
/// Hintergrund-Monitor-Thread geteilt.
///
/// # Thread-Sicherheit
/// * `Mutex<T>`: "Mutual Exclusion". Um die Daten zu ändern oder zu lesen, muss ein Thread
///   zuerst den "Lock" erhalten. Das garantiert, dass nie zwei Threads gleichzeitig schreiben.
pub struct VibranceState {
    pub settings: Mutex<VibranceSettings>,
    /// Speichert den aktuell gesetzten Vibrance-Wert, um unnötige API-Aufrufe zu vermeiden.
    /// `Option<u32>`: Kann `Some(wert)` oder `None` (noch nicht gesetzt) sein.
    pub current_vibrance: Mutex<Option<u32>>, // To avoid setting it repeatedly
}

impl VibranceState {
    pub fn new() -> Self {
        Self {
            settings: Mutex::new(VibranceSettings::default()),
            current_vibrance: Mutex::new(None),
        }
    }
}

/// Startet den Hintergrund-Thread, der überwacht, ob CS2 im Vordergrund läuft.
///
/// # Arguments
/// * `state` - Ein `Arc` (Atomic Reference Counted) Pointer auf den gemeinsamen Zustand.
///
/// # Funktionsweise
/// 1. Prüft auf Nvidia GPU.
/// 2. Startet eine Endlosschleife (`loop`).
/// 3. Prüft jede Sekunde das aktive Fenster.
/// 4. Passt die Vibrance an, wenn CS2 fokussiert ist.
pub fn start_monitor_thread(app: AppHandle, state: Arc<VibranceState>) {
    // * HINWEIS: `thread::spawn(move || ...)`
    // `move` überträgt den Besitz (Ownership) von `state` an den neuen Thread.
    // Da `state` ein `Arc` ist, wird nur der Referenzzähler erhöht, nicht die Daten kopiert.
    thread::spawn(move || {
        let _ = app.emit("log-info", "Vibrance Monitor Thread started!");
        // Check if Nvidia GPU is present before starting the loop
        if !NvidiaController::has_nvidia_gpu() {
            let _ = app.emit(
                "log-warning",
                "No Nvidia GPU detected. Vibrance monitor thread will not start.",
            );
            return;
        }

        let mut sys = System::new();
        // * HINWEIS: Fehlerbehandlung mit `match`
        // Wir versuchen, den Controller zu initialisieren. Wenn es fehlschlägt (`Err`),
        // beenden wir den Thread, um Abstürze zu vermeiden.
        let mut controller = match NvidiaController::new(&app) {
            Ok(c) => {
                let _ = app.emit(
                    "log-info",
                    "NvidiaController initialized successfully in monitor thread.",
                );
                c
            }
            Err(e) => {
                let _ = app.emit(
                    "log-error",
                    format!("Failed to initialize NvidiaController: {}", e),
                );
                return;
            }
        };

        // Track the last set vibrance value to avoid spamming the API
        let mut last_set_vibrance: Option<u32> = None;

        loop {
            // * HINWEIS: Scope für den Lock
            // Wir holen uns die Settings in einem eigenen Block.
            // Sobald `lock` "out of scope" geht (am Ende der Zuweisung), wird der Mutex wieder freigegeben.
            // Das ist wichtig, damit wir den Lock nicht während der langen Operationen unten halten.
            let settings = {
                // `unwrap()`: Wir gehen davon aus, dass kein anderer Thread panict, während er den Lock hält.
                let lock = state.settings.lock().unwrap();
                lock.clone()
            };

            // ? STRATEGIE: Polling
            // Wir prüfen entsprechend der eingestellten Rate.
            let polling_rate = if settings.polling_rate > 0 {
                settings.polling_rate
            } else {
                1000
            };
            thread::sleep(Duration::from_millis(polling_rate));

            if !settings.enabled {
                // If disabled, reset tracker so when re-enabled we enforce value
                last_set_vibrance = None;
                continue;
            }

            // * HINWEIS: Unsafe Code
            // Der Aufruf von Windows-APIs (`GetForegroundWindow`) ist "unsafe", da der Rust-Compiler
            // nicht garantieren kann, dass die C-Bibliothek speichersicher arbeitet.
            // Wir als Entwickler müssen sicherstellen, dass wir die API korrekt nutzen.
            let hwnd = unsafe { GetForegroundWindow() };
            if hwnd.is_null() {
                continue;
            }

            let mut pid_u32 = 0;
            // Wir übergeben einen Pointer (`&mut`) auf `pid_u32` an Windows, damit Windows dort die ID reinschreibt.
            unsafe { GetWindowThreadProcessId(hwnd, &mut pid_u32) };

            let pid = (pid_u32 as usize).into();

            // Refresh processes to ensure we have the latest state
            sys.refresh_processes(ProcessesToUpdate::All, true);

            let process_name = sys
                .process(pid)
                .map(|p| p.name().to_string_lossy().to_string())
                .unwrap_or_default(); // Safer default

            // Debugging output
            let name_lower = process_name.to_lowercase();
            let is_cs2 = name_lower == "cs2.exe" || name_lower == "cs2";

            let _ = app.emit(
                "log-info",
                format!(
                    "Foreground: '{}' (PID: {}) | Match CS2: {} | Enabled: {}",
                    process_name, pid, is_cs2, settings.enabled
                ),
            );

            // Access shared state to update UI/Cache if needed
            let mut current_vibrance_lock = state.current_vibrance.lock().unwrap();

            if is_cs2 {
                // Only set vibrance if it hasn't been set to this value yet
                if last_set_vibrance != Some(settings.cs2_vibrance) {
                    let _ = app.emit(
                        "log-info",
                        format!(
                            "CS2 detected! Changing vibrance to {}...",
                            settings.cs2_vibrance
                        ),
                    );

                    let hmonitor = unsafe { MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST) };

                    // * HINWEIS: Initialisierung von C-Structs
                    // `std::mem::zeroed()` erstellt ein mit Nullen gefülltes Struct.
                    // Das ist notwendig, weil Windows-APIs oft initialisierten Speicher erwarten.
                    let mut monitor_info: MONITORINFOEXA = unsafe { std::mem::zeroed() };
                    monitor_info.cbSize = std::mem::size_of::<MONITORINFOEXA>() as u32;

                    let success = unsafe {
                        GetMonitorInfoA(
                            hmonitor,
                            // Cast auf den generischen MONITORINFO Typ, den die API erwartet
                            &mut monitor_info as *mut _ as *mut winapi::um::winuser::MONITORINFO,
                        )
                    };

                    if success != 0 {
                        // Konvertierung von C-String (null-terminiert) zu Rust String
                        let device_name_c =
                            unsafe { std::ffi::CStr::from_ptr(monitor_info.szDevice.as_ptr()) };
                        let device_name = device_name_c.to_string_lossy().into_owned();

                        // 2. Set CS2 vibrance on that monitor
                        if let Err(e) = controller.set_vibrance_for_display(
                            &app,
                            &device_name,
                            settings.cs2_vibrance,
                        ) {
                            let _ = app.emit(
                                "log-error",
                                format!(
                                    "Failed to set CS2 vibrance for display {}: {}",
                                    device_name, e
                                ),
                            );
                        } else {
                            let _ = app.emit(
                                "log-info",
                                format!("Successfully set CS2 vibrance on {}", device_name),
                            );
                            last_set_vibrance = Some(settings.cs2_vibrance);
                            *current_vibrance_lock = Some(settings.cs2_vibrance);
                        }
                    }
                }
            } else {
                // CS2 is NOT foreground.
                // Revert to default if needed (and only if not already default)
                if last_set_vibrance != Some(settings.default_vibrance) {
                    match controller.set_vibrance(&app, settings.default_vibrance) {
                        Ok(_) => {
                            // Only log sparingly or on change
                            let _ = app.emit(
                                "log-info",
                                format!(
                                    "Reverted to default vibrance: {}",
                                    settings.default_vibrance
                                ),
                            );
                            last_set_vibrance = Some(settings.default_vibrance);
                            *current_vibrance_lock = Some(settings.default_vibrance);
                        }
                        Err(e) => {
                            let _ = app.emit(
                                "log-error",
                                format!("Failed to set default vibrance: {}", e),
                            );
                        }
                    }
                }
            }
        }
    });
}

/// Tauri Command: Aktualisiert die Vibrance-Einstellungen.
///
/// Wird vom Frontend aufgerufen.
#[tauri::command]
pub fn set_vibrance_settings(
    app: AppHandle,
    state: State<Arc<VibranceState>>,
    enabled: bool,
    default_vibrance: u32,
    cs2_vibrance: u32,
    polling_rate: u64,
) {
    let _ = app.emit(
        "log-info",
        format!(
            "Received set_vibrance_settings: enabled={}, default={}, cs2={}, polling_rate={}",
            enabled, default_vibrance, cs2_vibrance, polling_rate
        ),
    );

    // * HINWEIS: Locking
    // Wir blockieren den Mutex kurzzeitig, um die Werte zu schreiben.
    let mut settings = state.settings.lock().unwrap();
    settings.enabled = enabled;
    settings.default_vibrance = default_vibrance;
    settings.cs2_vibrance = cs2_vibrance;
    settings.polling_rate = polling_rate;

    // Reset current vibrance so it gets reapplied immediately
    // ! WICHTIG: Wir setzen den Cache zurück (`None`), damit der Monitor-Thread
    // beim nächsten Durchlauf die neuen Werte erzwingt.
    let mut current = state.current_vibrance.lock().unwrap();
    *current = None;
}

#[tauri::command]
pub fn check_nvidia_gpu() -> bool {
    NvidiaController::has_nvidia_gpu()
}
