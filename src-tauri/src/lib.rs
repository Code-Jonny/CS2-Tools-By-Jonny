mod power;
mod processes;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            power::get_power_plans,
            power::set_active_power_plan,
            processes::get_processes,
            processes::terminate_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
