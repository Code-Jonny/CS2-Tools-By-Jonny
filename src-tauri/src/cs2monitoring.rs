use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use sysinfo::{ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter};
use winapi::um::winuser::{GetForegroundWindow, GetWindowThreadProcessId};

/// Startet den Hintergrund-Thread, der überwacht, ob CS2 im Vordergrund läuft.
///
/// # Funktionsweise
/// 1. Läuft so lange, bis das `shutdown`-Flag auf `true` gesetzt wird.
/// 2. Prüft jede Sekunde das aktive Fenster und laufende Prozesse.
/// 3. Informiert das Frontend, ob CS2 läuft und fokussiert ist.
pub fn start_monitor_thread(app: AppHandle, shutdown: Arc<AtomicBool>) {
    thread::spawn(move || {
        let _ = app.emit("log-info", "CS2 Monitor Thread started!");

        let mut sys = System::new();

        let mut last_process_running = false;
        let mut last_window_foreground = false;

        while !shutdown.load(Ordering::Relaxed) {
            thread::sleep(Duration::from_millis(1000));

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
        }
    });
}
