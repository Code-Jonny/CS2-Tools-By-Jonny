use serde::{Deserialize, Serialize};
use sysinfo::{ProcessesToUpdate, System};

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
use winapi::um::winnt::PROCESS_SET_INFORMATION;

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
pub fn terminate_process(pid: u32) -> Result<(), String> {
    let mut sys = System::new();
    // Wir müssen die Prozesse aktualisieren, um sicherzustellen, dass der Prozess existiert
    // und wir ein aktuelles Handle darauf bekommen.
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let pid = sysinfo::Pid::from_u32(pid);

    // * HINWEIS: `if let` Syntax
    // Das ist eine Kurzform für ein `match`, wenn uns nur der `Some`-Fall interessiert.
    // "Wenn `sys.process(pid)` einen Wert (`Some(process)`) zurückgibt, dann führe den Block aus."
    if let Some(process) = sys.process(pid) {
        // `kill()` sendet das SIGKILL (oder Äquivalent) Signal.
        if process.kill() {
            Ok(())
        } else {
            Err("Failed to kill process".to_string())
        }
    } else {
        Err("Process not found".to_string())
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
/// * `mask` - Eine Bitmaske als String (z.B. "3" für Kerne 0 und 1).
///   Wird als String übergeben, da JavaScripts `Number` (Double Precision Float)
///   bei großen 64-Bit Integers an Genauigkeit verliert.
#[tauri::command]
pub fn set_process_affinity(pid: u32, mask: String) -> Result<(), String> {
    // mask is passed as String because u64 might have issues with JSON serialization/deserialization precision in JS
    // although BigInt exists, passing as string is safer for large bitmasks.

    // * HINWEIS: Parsing
    // Wir parsen den String als `u64` zur Basis 10.
    let mask_val = u64::from_str_radix(&mask, 10).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        // * HINWEIS: Unsafe Block
        // Wir rufen native Windows-APIs auf (`winapi`). Der Compiler kann hier keine Speichersicherheit garantieren.
        unsafe {
            // 1. Prozess-Handle öffnen mit Berechtigung zum Setzen von Informationen.
            let handle = OpenProcess(PROCESS_SET_INFORMATION, FALSE, pid);
            if handle.is_null() {
                return Err("Failed to open process".to_string());
            }

            // Compiler claims SetProcessAffinityMask expects u32, even though it should be DWORD_PTR (usize) on x64.
            // Casting to u32 to satisfy the compiler. This limits affinity to 32 cores.

            // ! WARNUNG: Typ-Casting
            // `SetProcessAffinityMask` erwartet eigentlich `DWORD_PTR` (was auf 64-Bit Systemen `u64` sein sollte).
            // Die `winapi` Crate definiert es hier aber anscheinend als `u32` oder es gibt ein Missverständnis beim Casting.
            // Wenn wir hier auf `u32` casten, verlieren wir die oberen 32 Bits.
            // Das bedeutet, wir können die Affinität für Kerne > 31 nicht setzen!
            // TODO: Prüfen, ob `usize` hier korrekt wäre oder ob die `winapi` Definition veraltet ist.
            let result = SetProcessAffinityMask(handle, mask_val as u32);

            // WICHTIG: Handle immer schließen, um Resource Leaks zu vermeiden.
            CloseHandle(handle);

            if result == 0 {
                return Err("Failed to set affinity".to_string());
            }
            Ok(())
        }
    }
    // Fallback für Nicht-Windows-Systeme
    #[cfg(not(target_os = "windows"))]
    {
        Err("Not supported on this OS".to_string())
    }
}
