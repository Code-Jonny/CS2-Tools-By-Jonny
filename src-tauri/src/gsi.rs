use axum::{extract::State, routing::post, Json, Router};
use rodio::{OutputStreamBuilder, Sink};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use tauri::{AppHandle, Emitter};
use tauri_plugin_store::StoreExt;
use tokio::task::JoinHandle;

// --- GSI Payload Structs ---
#[derive(Debug, Deserialize, Serialize, Default, Clone)]
pub struct GsiPayload {
    pub provider: Option<Provider>,
    pub map: Option<Map>,
    pub round: Option<Round>,
    pub player: Option<Player>,
}

#[derive(Debug, Deserialize, Serialize, Default, Clone)]
pub struct Provider {
    pub name: Option<String>,
    pub appid: Option<u32>,
    pub version: Option<u32>,
    pub steamid: Option<String>,
    pub timestamp: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize, Default, Clone)]
pub struct Map {
    pub mode: Option<String>,
    pub name: Option<String>,
    pub phase: Option<String>,
    pub round: Option<u32>,
    pub team_ct: Option<TeamStats>,
    pub team_t: Option<TeamStats>,
}

#[derive(Debug, Deserialize, Serialize, Default, Clone)]
pub struct TeamStats {
    pub score: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize, Default, Clone)]
pub struct Round {
    pub phase: Option<String>,
    pub bomb: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Default, Clone)]
pub struct Player {
    pub steamid: Option<String>,
    pub name: Option<String>,
    pub clan: Option<String>,
    pub team: Option<String>,
    pub activity: Option<String>,
}

// --- App State ---
struct AppState {
    app_handle: AppHandle,
    stream: Arc<rodio::OutputStream>,
    bomb_countdown_task: tokio::sync::Mutex<Option<JoinHandle<()>>>,
}

// --- Tauri Commands ---

#[tauri::command]
pub fn auto_detect_cs2_path() -> Result<String, String> {
    let steam_dir = steamlocate::SteamDir::locate()
        .map_err(|e| format!("Steam installation not found: {}", e))?;

    let cs2_app = steam_dir
        .find_app(730)
        .map_err(|e| format!("Failed to locate CS2: {}", e))?
        .ok_or_else(|| "CS2 not found in Steam library".to_string())?;

    let path_str = cs2_app
        .1
        .path()
        .join("steamapps")
        .join("common")
        .join(&cs2_app.0.install_dir)
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?
        .to_string();

    Ok(path_str)
}

#[tauri::command]
pub fn install_gsi_config(cs2_path: String) -> Result<String, String> {
    let config_dir = PathBuf::from(&cs2_path)
        .join("game")
        .join("csgo")
        .join("cfg");

    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let config_vdf = r#""CS2ToolsByJonny"
{
 "uri" "http://127.0.0.1:31337"
 "timeout" "5.0"
 "buffer"  "0.0"
 "throttle" "0.25"
 "heartbeat" "30.0"
 "data"
 {
   "provider"            "1"
   "map"                 "1"
   "round"               "1"
   "player_id"           "1"
   "player_state"        "1"
  }
}"#;

    let config_file_path = config_dir.join("gamestate_integration_cs2tools.cfg");
    fs::write(&config_file_path, config_vdf)
        .map_err(|e| format!("Failed to write GSI config file: {}", e))?;

    let file_path_str = config_file_path
        .to_str()
        .ok_or_else(|| "Invalid file path encoding".to_string())?
        .to_string();

    Ok(format!(
        "GSI config installed successfully at: {}",
        file_path_str
    ))
}

// --- HTTP Server ---

pub fn start_gsi_server(app_handle: AppHandle) {
    thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().expect("Failed to create tokio runtime");
        rt.block_on(async {
            let stream = Arc::new(
                OutputStreamBuilder::open_default_stream()
                    .expect("Failed to create audio output stream"),
            );

            let shared_state = Arc::new(AppState {
                app_handle,
                stream,
                bomb_countdown_task: tokio::sync::Mutex::new(None),
            });

            let app = Router::new()
                .route("/", post(handle_gsi_post))
                .with_state(shared_state);

            let listener = tokio::net::TcpListener::bind("127.0.0.1:31337")
                .await
                .expect("Failed to bind GSI port 31337");

            println!("GSI Server listening on {}", listener.local_addr().unwrap());
            axum::serve(listener, app).await.unwrap();
        });
    });
}

async fn handle_gsi_post(State(state): State<Arc<AppState>>, Json(payload): Json<GsiPayload>) {
    let _ = state.app_handle.emit("gsi-update", &payload);

    let is_bomb_timer_enabled = state
        .app_handle
        .store("settings.json")
        .map_or(false, |store| {
            store
                .get("bombTimerEnabled")
                .and_then(|v| v.as_bool())
                .unwrap_or(false)
        });

    if let Some(round) = &payload.round {
        if let Some(bomb_state) = &round.bomb {
            match bomb_state.as_str() {
                "planted" => {
                    if let Some(task) = state.bomb_countdown_task.lock().await.take() {
                        task.abort();
                    }

                    if !is_bomb_timer_enabled {
                        return;
                    }

                    let stream = Arc::clone(&state.stream);
                    let task = tokio::spawn(async move {
                        for second in 0..40 {
                            let sink = Sink::connect_new(stream.mixer());
                            let source = rodio::source::SineWave::new(440.0);
                            use rodio::Source;
                            sink.append(
                                source.take_duration(std::time::Duration::from_millis(100)),
                            );
                            sink.sleep_until_end();

                            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

                            let remaining = 40 - second - 1;
                            println!("Bomb countdown: {} seconds remaining", remaining);
                        }
                    });

                    *state.bomb_countdown_task.lock().await = Some(task);
                }
                "defused" | "exploded" => {
                    if let Some(task) = state.bomb_countdown_task.lock().await.take() {
                        task.abort();
                    }
                    println!("Bomb {} - countdown cancelled", bomb_state);
                }
                _ => {}
            }
        }
    }
}
