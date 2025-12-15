mod power;
mod processes;
mod vibrance;
mod monitor;

use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let vibrance_state = Arc::new(monitor::VibranceState::new());
    let vibrance_state_clone = vibrance_state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(move |app| {
            app.manage(vibrance_state);
            monitor::start_monitor_thread(vibrance_state_clone);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            power::get_power_plans,
            power::set_active_power_plan,
            processes::get_processes,
            processes::terminate_process,
            monitor::set_vibrance_settings,
            monitor::check_nvidia_gpu
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
