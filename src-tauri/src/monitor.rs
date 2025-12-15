use crate::vibrance::NvidiaController;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use sysinfo::{ProcessesToUpdate, System};
use tauri::State;
use winapi::um::winuser::{GetForegroundWindow, GetWindowThreadProcessId};

#[derive(Clone, Debug)]
pub struct VibranceSettings {
    pub enabled: bool,
    pub default_vibrance: u32,
    pub cs2_vibrance: u32,
}

impl Default for VibranceSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            default_vibrance: 50,
            cs2_vibrance: 100,
        }
    }
}

pub struct VibranceState {
    pub settings: Mutex<VibranceSettings>,
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

pub fn start_monitor_thread(state: Arc<VibranceState>) {
    thread::spawn(move || {
        let mut sys = System::new();
        let mut controller = match NvidiaController::new() {
            Ok(c) => c,
            Err(e) => {
                eprintln!("Failed to initialize NvidiaController: {}", e);
                return;
            }
        };

        loop {
            thread::sleep(Duration::from_secs(1));

            let settings = {
                let lock = state.settings.lock().unwrap();
                lock.clone()
            };

            if !settings.enabled {
                // If disabled, maybe we should reset to default?
                // For now, just do nothing.
                continue;
            }

            // Check foreground window
            let hwnd = unsafe { GetForegroundWindow() };
            if hwnd.is_null() {
                continue;
            }

            let mut pid_u32 = 0;
            unsafe { GetWindowThreadProcessId(hwnd, &mut pid_u32) };

            let pid = sysinfo::Pid::from_u32(pid_u32);

            // Refresh processes to ensure we have the latest state
            sys.refresh_processes(ProcessesToUpdate::All, true);

            let process_name = sys
                .process(pid)
                .map(|p| p.name().to_string_lossy().to_string())
                .unwrap_or_default();

            let target_vibrance = if process_name.to_lowercase() == "cs2.exe" {
                settings.cs2_vibrance
            } else {
                settings.default_vibrance
            };

            let mut current_vibrance_lock = state.current_vibrance.lock().unwrap();
            if *current_vibrance_lock != Some(target_vibrance) {
                match controller.set_vibrance(target_vibrance) {
                    Ok(_) => {
                        *current_vibrance_lock = Some(target_vibrance);
                        // println!("Set vibrance to {}", target_vibrance);
                    }
                    Err(e) => eprintln!("Failed to set vibrance: {}", e),
                }
            }
        }
    });
}

#[tauri::command]
pub fn set_vibrance_settings(
    state: State<Arc<VibranceState>>,
    enabled: bool,
    default_vibrance: u32,
    cs2_vibrance: u32,
) {
    let mut settings = state.settings.lock().unwrap();
    settings.enabled = enabled;
    settings.default_vibrance = default_vibrance;
    settings.cs2_vibrance = cs2_vibrance;

    // Reset current vibrance so it gets reapplied immediately
    let mut current = state.current_vibrance.lock().unwrap();
    *current = None;
}

#[tauri::command]
pub fn check_nvidia_gpu() -> bool {
    NvidiaController::has_nvidia_gpu()
}
