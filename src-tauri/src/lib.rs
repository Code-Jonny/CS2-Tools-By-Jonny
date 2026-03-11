mod cs2monitoring;
mod power;
mod processes;
mod vibrance;

use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WindowEvent};

struct AppSettingsState {
    minimize_to_tray: Mutex<bool>,
}

#[tauri::command]
fn set_minimize_to_tray(state: tauri::State<AppSettingsState>, enable: bool) {
    *state.minimize_to_tray.lock().unwrap() = enable;
}

#[tauri::command]
fn show_minimized(window: tauri::WebviewWindow) {
    let _ = window.show();
    let _ = window.minimize();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(move |app| {
            cs2monitoring::start_monitor_thread(app.handle().clone());

            app.manage(AppSettingsState {
                minimize_to_tray: Mutex::new(true),
            });

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            let app_handle = app.handle().clone();
            let window = app.get_webview_window("main").unwrap();

            window.on_window_event(move |event| {
                if let WindowEvent::Resized(_) = event {
                    let window = app_handle.get_webview_window("main").unwrap();
                    if let Ok(true) = window.is_minimized() {
                        let state = app_handle.state::<AppSettingsState>();
                        let minimize_to_tray = *state.minimize_to_tray.lock().unwrap();
                        if minimize_to_tray {
                            let _ = window.hide();
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            power::get_power_plans,
            power::set_active_power_plan,
            processes::get_processes,
            processes::terminate_process,
            processes::get_cpu_count,
            processes::set_process_affinity,
            vibrance::apply_vibrance_to_focused_display,
            vibrance::check_nvidia_gpu,
            set_minimize_to_tray,
            show_minimized
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
