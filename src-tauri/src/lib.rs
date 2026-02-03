mod monitor;
mod power;
mod processes;
mod vibrance;

use std::sync::Arc;
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

/// Der Einstiegspunkt für die Tauri-Anwendung.
///
/// Diese Funktion konfiguriert und startet die Anwendung. Sie registriert Plugins,
/// initialisiert den globalen Zustand (State) und definiert die Befehle (Commands),
/// die vom Frontend (JavaScript/TypeScript) aufgerufen werden können.
///
/// # Rust-Konzepte für Einsteiger
/// * **Builder Pattern:** Tauri nutzt intensiv das Builder-Pattern (`tauri::Builder::default()...`),
///   um die Konfiguration Schritt für Schritt aufzubauen.
/// * **Closure:** Der `setup`-Block verwendet eine Closure (`|app| { ... }`), eine anonyme Funktion,
///   die Code ausführt, sobald die App initialisiert ist.
/// * **Arc (Atomic Reference Counting):** Wird verwendet, um Daten sicher zwischen Threads zu teilen.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // * HINWEIS: Initialisierung des Vibrance-Status.
    // Wir erstellen eine neue Instanz von `VibranceState` und verpacken sie in ein `Arc`.
    // `Arc` (Atomic Reference Counted) ist ein intelligenter Zeiger, der es ermöglicht,
    // denselben Speicherbereich sicher von mehreren Threads aus zu besitzen.
    // Wenn der letzte `Arc` zerstört wird, wird auch der Speicher freigegeben.
    let vibrance_state = Arc::new(monitor::VibranceState::new());

    // * HINWEIS: Klonen des Arc-Pointers für den Monitor-Thread.
    // In Rust bedeutet `clone()` bei einem `Arc` NICHT, dass die Daten tief kopiert werden.
    // Stattdessen wird nur der Referenzzähler erhöht. Beide Variablen (`vibrance_state` und
    // `vibrance_state_clone`) zeigen auf denselben Speicherbereich im Heap.
    // Dies ist notwendig, weil wir den State an zwei Orte übergeben müssen:
    // 1. An Tauri (via `app.manage`), damit Commands darauf zugreifen können.
    // 2. An den Hintergrund-Thread (`monitor::start_monitor_thread`), der ihn periodisch nutzt.
    let vibrance_state_clone = vibrance_state.clone();

    tauri::Builder::default()
        // * HINWEIS: Plugin-Registrierung
        // Hier werden offizielle Tauri-Plugins geladen.
        // `tauri_plugin_log`: Ermöglicht Logging (Konsolenausgabe, Dateien).
        .plugin(tauri_plugin_log::Builder::default().build())
        // `tauri_plugin_autostart`: Ermöglicht es der App, beim Systemstart automatisch zu starten.
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]), // Argumente für den Autostart (hier leer)
        ))
        // `tauri_plugin_store`: Bietet einen persistenten Key-Value-Store (ähnlich `localStorage` im Web, aber als Datei).
        .plugin(tauri_plugin_store::Builder::default().build())
        // * HINWEIS: Setup-Hook
        // Dieser Block wird ausgeführt, nachdem die App gebaut wurde, aber bevor sie läuft.
        // Das `move`-Schlüsselwort vor der Closure ist essenziell: Es zwingt die Closure,
        // Besitz (Ownership) von Variablen aus der Umgebung (hier `vibrance_state` und `vibrance_state_clone`)
        // zu übernehmen. Ohne `move` würde Rust sich beschweren, dass die Variablen vielleicht
        // nicht lange genug leben.
        .setup(move |app| {
            // * HINWEIS: State Management in Tauri
            // `app.manage` registriert den `vibrance_state` im internen State-Container von Tauri.
            // Dadurch können wir später in unseren Commands (z.B. `set_vibrance_settings`)
            // einfach via `tauri::State<VibranceState>` auf diese Daten zugreifen.
            // Rusts Typsystem garantiert, dass wir genau diesen Typ wiederbekommen.
            app.manage(vibrance_state);

            // * HINWEIS: Starten des Hintergrund-Threads
            // Wir übergeben den geklonten Arc-Pointer an den Monitor-Thread.
            // Da `vibrance_state_clone` hier "bewegt" (moved) wird, kann es danach in dieser
            // Funktion nicht mehr verwendet werden. Das ist okay, da wir es nur hier brauchen.
            monitor::start_monitor_thread(vibrance_state_clone);

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
        // * HINWEIS: Command Handler
        // Hier werden die Rust-Funktionen registriert, die vom Frontend (JavaScript) aufgerufen werden können.
        // Das Makro `tauri::generate_handler!` erzeugt den notwendigen Glue-Code, um JSON-Daten
        // zwischen der Webview und Rust zu serialisieren/deserialisieren.
        .invoke_handler(tauri::generate_handler![
            power::get_power_plans,
            power::set_active_power_plan,
            processes::get_processes,
            processes::terminate_process,
            processes::get_cpu_count,
            processes::set_process_affinity,
            monitor::set_vibrance_settings,
            monitor::check_nvidia_gpu,
            set_minimize_to_tray
        ])
        // * HINWEIS: Start der Anwendung
        // `run` startet die Event-Loop. Diese Funktion kehrt normalerweise nicht zurück,
        // bis die Anwendung beendet wird.
        .run(tauri::generate_context!())
        // ! FEHLER-HANDLING: `expect`
        // Wenn `run` einen Fehler zurückgibt (z.B. weil zwei Instanzen gleichzeitig laufen wollen),
        // wird das Programm hier hart beendet (Panic) und die Nachricht ausgegeben.
        // Für eine Top-Level-Funktion wie `main` oder `run` ist das oft akzeptabel,
        // in Bibliotheks-Code sollte man Fehler aber lieber weiterreichen (`Result`).
        .expect("error while running tauri application");
}
