use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use std::process::Command;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PowerPlan {
    pub guid: String,
    pub name: String,
    pub is_active: bool,
}

#[tauri::command]
pub fn get_power_plans() -> Result<Vec<PowerPlan>, String> {
    // Use cmd /C chcp 65001 to force UTF-8 output, preventing encoding issues with special characters (e.g. Umlaute)
    let output = Command::new("cmd")
        .args(["/C", "chcp 65001 && powercfg /LIST"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut plans = Vec::new();

    for line in stdout.lines() {
        if line.contains("GUID") {
            // Example: Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)
            // Example active: Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced) *
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                let guid = parts[3].to_string();
                let is_active = line.trim().ends_with('*');

                // Extract name: everything between ( and )
                let start_bytes = line.find('(').unwrap_or(0);
                let end_bytes = line.rfind(')').unwrap_or(line.len());

                let name = if start_bytes < end_bytes {
                    line[start_bytes + 1..end_bytes].to_string()
                } else {
                    "Unknown".to_string()
                };

                plans.push(PowerPlan {
                    guid,
                    name,
                    is_active,
                });
            }
        }
    }

    Ok(plans)
}

#[tauri::command]
pub fn set_active_power_plan(guid: String) -> Result<(), String> {
    let output = Command::new("powercfg")
        .arg("/SETACTIVE")
        .arg(&guid)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(())
}
