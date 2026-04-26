use serde::{Deserialize, Serialize};
use sysinfo::{ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter};

// * HINWEIS: Conditional Compilation
// Diese Importe werden nur kompiliert, wenn das Zielbetriebssystem Windows ist.
// Das verhindert Kompilierfehler auf Linux oder macOS, da `winapi` dort nicht existiert.
#[cfg(target_os = "windows")]
use winapi::shared::minwindef::FALSE;
#[cfg(target_os = "windows")]
use winapi::um::handleapi::CloseHandle;
#[cfg(target_os = "windows")]
use winapi::um::processthreadsapi::OpenProcess;
#[cfg(target_os = "windows")]
use winapi::um::winbase::SetProcessAffinityMask;
#[cfg(target_os = "windows")]
use winapi::um::winnt::{PROCESS_SET_INFORMATION, PROCESS_TERMINATE};

/// Informationen über einen laufenden Prozess.
///
/// Wird an das Frontend gesendet.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub memory: u64,
}

/// Ruft eine Liste aller laufenden Prozesse ab.
///
/// # Returns
/// * `Vec<ProcessInfo>`: Eine Liste mit PID, Name und Speicherverbrauch aller Prozesse.
#[tauri::command]
pub fn get_processes() -> Vec<ProcessInfo> {
    // * HINWEIS: `sysinfo` Crate
    // Wir nutzen `sysinfo` als plattformübergreifende Bibliothek, um Systeminformationen zu sammeln.
    // `System::new()` initialisiert die Struktur, lädt aber noch keine Daten.
    let mut sys = System::new();

    // * PERFORMANCE: Gezieltes Update
    // `refresh_processes` lädt die Prozessliste neu.
    // `ProcessesToUpdate::All` holt alle Prozesse.
    // `true` (zweites Argument) bedeutet, dass auch Speicherinformationen aktualisiert werden sollen.
    sys.refresh_processes(ProcessesToUpdate::All, true);

    // * HINWEIS: Iterator-Kette (Functional Programming)
    // 1. `sys.processes()` gibt eine HashMap zurück (PID -> Process).
    // 2. `.iter()` erstellt einen Iterator über die Einträge.
    // 3. `.map(...)` transformiert jeden Eintrag in unser `ProcessInfo` Struct.
    // 4. `.collect()` sammelt die Ergebnisse in einen `Vec`.
    sys.processes()
        .iter()
        .map(|(pid, process)| ProcessInfo {
            pid: pid.as_u32(),
            // `to_string_lossy()`: Konvertiert den OS-spezifischen String (OsStr) in einen UTF-8 String.
            // Falls ungültige Zeichen enthalten sind, werden sie ersetzt.
            // `into_owned()`: Erstellt einen `String` (Heap) aus dem `Cow` (Copy-on-Write) Rückgabewert.
            name: process.name().to_string_lossy().into_owned(),
            memory: process.memory(),
        })
        .collect()
}

/// Beendet einen Prozess anhand seiner PID.
///
/// # Arguments
/// * `pid` - Die Prozess-ID des zu beendenden Prozesses.
#[tauri::command]
pub fn terminate_process(app: AppHandle, pid: u32) -> Result<(), String> {
    // * SECURITY: Block termination of Windows system processes (System Idle Process and System).
    // These PIDs are always reserved by the OS and must never be killed by user-space apps.
    if pid == 0 || pid == 4 {
        let err_msg = format!(
            "Refusing to terminate protected system process with PID {}",
            pid
        );
        let _ = app.emit("log-error", &err_msg);
        return Err(err_msg);
    }

    // * SECURITY: Prevent the app from killing its own process.
    if pid == std::process::id() {
        let err_msg = "Refusing to terminate own process".to_string();
        let _ = app.emit("log-error", &err_msg);
        return Err(err_msg);
    }

    // * SECURITY: On Windows, verify we hold PROCESS_TERMINATE rights before proceeding.
    // OpenProcess will return NULL if the caller's token lacks sufficient privileges,
    // giving us an explicit permission check rather than relying on a silent kill failure.
    #[cfg(target_os = "windows")]
    {
        unsafe {
            let handle = OpenProcess(PROCESS_TERMINATE, FALSE, pid);
            if handle.is_null() {
                let err_msg = format!(
                    "Permission denied: cannot open process with PID {} for termination",
                    pid
                );
                let _ = app.emit("log-error", &err_msg);
                return Err(err_msg);
            }
            // Close the probe handle immediately; sysinfo will open its own handle below.
            CloseHandle(handle);
        }
    }

    let mut sys = System::new();
    // Wir müssen die Prozesse aktualisieren, um sicherzustellen, dass der Prozess existiert
    // und wir ein aktuelles Handle darauf bekommen.
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let sys_pid = sysinfo::Pid::from_u32(pid);

    // * HINWEIS: `if let` Syntax
    // Das ist eine Kurzform für ein `match`, wenn uns nur der `Some`-Fall interessiert.
    // "Wenn `sys.process(sys_pid)` einen Wert (`Some(process)`) zurückgibt, dann führe den Block aus."
    if let Some(process) = sys.process(sys_pid) {
        // `kill()` sendet das SIGKILL (oder Äquivalent) Signal.
        if process.kill() {
            Ok(())
        } else {
            let err_msg = format!("Failed to kill process with PID {}", pid);
            let _ = app.emit("log-error", &err_msg);
            Err(err_msg)
        }
    } else {
        let err_msg = format!("Process with PID {} not found", pid);
        let _ = app.emit("log-error", &err_msg);
        Err(err_msg)
    }
}

/// Gibt die Anzahl der logischen CPU-Kerne zurück.
#[tauri::command]
pub fn get_cpu_count() -> usize {
    let mut sys = System::new();
    // Lädt CPU-Informationen (inkl. Anzahl der Kerne).
    sys.refresh_cpu_all();
    sys.cpus().len()
}

/// Setzt die CPU-Affinität (Zugehörigkeit) für einen Prozess.
///
/// Bestimmt, auf welchen CPU-Kernen ein Prozess ausgeführt werden darf.
///
/// # Arguments
/// * `pid` - Die Prozess-ID.
/// * `cores` - Eine Liste der CPU-Kerne, die verwendet werden sollen.
#[tauri::command]
pub fn set_process_affinity(app: AppHandle, pid: u32, cores: Vec<u32>) -> Result<(), String> {
    if cores.is_empty() {
        let err_msg = format!("No cores specified for PID {}", pid);
        let _ = app.emit("log-error", &err_msg);
        return Err(err_msg);
    }

    let mut mask_val: u64 = 0;
    for core in &cores {
        if *core >= 64 {
            let err_msg = format!("Core index {} is too high (max 63) for PID {}", core, pid);
            let _ = app.emit("log-error", &err_msg);
            return Err(err_msg);
        }
        mask_val |= 1 << core;
    }

    let _ = app.emit(
        "log-info",
        format!(
            "Setting affinity for PID {} to Cores {:?} (Mask: {}, Binary: {:b})",
            pid, cores, mask_val, mask_val
        ),
    );

    #[cfg(target_os = "windows")]
    {
        // * HINWEIS: Unsafe Block
        // Wir rufen native Windows-APIs auf (`winapi`). Der Compiler kann hier keine Speichersicherheit garantieren.
        unsafe {
            // 1. Prozess-Handle öffnen mit Berechtigung zum Setzen von Informationen.
            let handle = OpenProcess(PROCESS_SET_INFORMATION, FALSE, pid);
            if handle.is_null() {
                let err_msg = format!("Failed to open process with PID {} to set affinity", pid);
                let _ = app.emit("log-error", &err_msg);
                return Err(err_msg);
            }

            // * FIX: SetProcessAffinityMask expects a specific integer type (DWORD_PTR).
            // Usually usize on 64-bit, but sometimes u32 depending on target/winapi version.
            // Using `as _` lets rustc infer the correct cast target type automatically.
            let result = SetProcessAffinityMask(handle, mask_val as _);

            // WICHTIG: Handle immer schließen, um Resource Leaks zu vermeiden.
            CloseHandle(handle);

            if result == 0 {
                let err_msg = format!("Failed to set affinity for PID {}", pid);
                let _ = app.emit("log-error", &err_msg);
                return Err(err_msg);
            }
            Ok(())
        }
    }
    // Fallback für Nicht-Windows-Systeme
    #[cfg(not(target_os = "windows"))]
    {
        let err_msg = "Setting process affinity is not supported on this OS".to_string();
        let _ = app.emit("log-error", &err_msg);
        Err(err_msg)
    }
}
