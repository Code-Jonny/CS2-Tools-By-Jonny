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
        let _ = app.emit("log-info", "Monitor Thread started!");

        let has_nvidia = NvidiaController::has_nvidia_gpu();
        if !has_nvidia {
            let _ = app.emit(
                "log-warning",
                "No Nvidia GPU detected. Vibrance features will be disabled.",
            );
        }

        let mut sys = System::new();
        // Option to hold the controller if it initializes
        let mut controller = if has_nvidia {
            match NvidiaController::new(&app) {
                Ok(c) => {
                    let _ = app.emit(
                        "log-info",
                        "NvidiaController initialized successfully in monitor thread.",
                    );
                    Some(c)
                }
                Err(e) => {
                    let _ = app.emit(
                        "log-error",
                        format!("Failed to initialize NvidiaController: {}", e),
                    );
                    None
                }
            }
        } else {
            None
        };

        // Track the last set vibrance value to avoid spamming the API
        let mut last_set_vibrance: Option<u32> = None;
        let mut last_process_running = false;
        let mut last_window_foreground = false;

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

            // Refresh processes to ensure we have the latest state
            sys.refresh_processes(ProcessesToUpdate::All, true);

            // 1. Detect Process State
            let mut cs2_is_running = false;
            for (_pid, process) in sys.processes() {
                let name = process.name().to_string_lossy().to_lowercase();
                if name == "cs2.exe" || name == "cs2" {
                    cs2_is_running = true;
                    break;
                }
            }

            if cs2_is_running != last_process_running {
                let status = if cs2_is_running { "started" } else { "stopped" };
                let _ = app.emit("cs2process", status);
                last_process_running = cs2_is_running;
            }

            // 2. Detect Foreground Window State
            let hwnd = unsafe { GetForegroundWindow() };
            let mut is_cs2_foreground = false;

            if !hwnd.is_null() {
                let mut pid_u32 = 0;
                unsafe { GetWindowThreadProcessId(hwnd, &mut pid_u32) };

                let fg_pid = (pid_u32 as usize).into();
                let process_name = sys
                    .process(fg_pid)
                    .map(|p| p.name().to_string_lossy().to_string())
                    .unwrap_or_default();

                let name_lower = process_name.to_lowercase();
                is_cs2_foreground = name_lower == "cs2.exe" || name_lower == "cs2";
            }

            if is_cs2_foreground != last_window_foreground {
                let status = if is_cs2_foreground {
                    "foreground"
                } else {
                    "background"
                };
                let _ = app.emit("cs2window", status);
                last_window_foreground = is_cs2_foreground;
            }

            // --- Vibrance Logic ---
            if !settings.enabled {
                last_set_vibrance = None;
                continue;
            }

            if let Some(ref mut c) = controller {
                let mut current_vibrance_lock = state.current_vibrance.lock().unwrap();

                if is_cs2_foreground {
                    // Only set vibrance if it hasn't been set to this value yet
                    if last_set_vibrance != Some(settings.cs2_vibrance) {
                        let _ = app.emit(
                            "log-info",
                            format!(
                                "CS2 detected in foreground! Changing vibrance to {}...",
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
                                &mut monitor_info as *mut _
                                    as *mut winapi::um::winuser::MONITORINFO,
                            )
                        };

                        if success != 0 {
                            let device_name_c =
                                unsafe { std::ffi::CStr::from_ptr(monitor_info.szDevice.as_ptr()) };
                            let device_name = device_name_c.to_string_lossy().into_owned();

                            if let Err(e) = c.set_vibrance_for_display(
                                &app,
                                &device_name,
                                settings.cs2_vibrance,
                            ) {
                                let _ = app.emit(
                                    "log-error",
                                    format!("Failed to set CS2 vibrance: {}", e),
                                );
                            } else {
                                last_set_vibrance = Some(settings.cs2_vibrance);
                                *current_vibrance_lock = Some(settings.cs2_vibrance);
                            }
                        }
                    }
                } else {
                    // CS2 is NOT foreground.
                    if last_set_vibrance != Some(settings.default_vibrance) {
                        match c.set_vibrance(&app, settings.default_vibrance) {
                            Ok(_) => {
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
