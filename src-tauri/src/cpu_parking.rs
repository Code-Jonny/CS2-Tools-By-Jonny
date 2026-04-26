use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use std::process::Command;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CoreParkingState {
    pub ac_value: u32,
    pub dc_value: u32,
}

/// Retrieves the current CPU core parking settings for the active power plan.
/// Returns the current AC and DC minimal core percentages (0-100).
#[tauri::command]
pub fn get_core_parking_status() -> Result<CoreParkingState, String> {
    let output = Command::new("cmd")
        .args([
            "/C",
            "chcp 65001 && powercfg /qh SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 0cc5b647-c1df-4637-891a-dec35c318583",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // The last two lines with "0x" contain the AC and DC indices
    let hex_lines: Vec<&str> = stdout.lines().filter(|l| l.contains("0x")).collect();

    if hex_lines.len() >= 2 {
        let ac_line = hex_lines[hex_lines.len() - 2];
        let dc_line = hex_lines[hex_lines.len() - 1];

        let parse_hex = |line: &str| -> Option<u32> {
            let pos = line.find("0x")?;
            // powercfg output may have extra characters after the hex value, such as spaces or carriage returns
            let hex_str = line[pos + 2..].trim();
            u32::from_str_radix(hex_str, 16).ok()
        };

        if let (Some(ac_value), Some(dc_value)) = (parse_hex(ac_line), parse_hex(dc_line)) {
            return Ok(CoreParkingState { ac_value, dc_value });
        }
    }

    Err("Failed to parse core parking status from powercfg output.".into())
}

/// Sets the CPU core parking minimal cores value (0-100) for the active power plan.
/// A value of 100% means core parking is deactivated (all cores are unparked).
#[tauri::command]
pub fn set_core_parking_status(ac_value: u32, dc_value: u32) -> Result<(), String> {
    let subgroups = [
        "54533251-82be-4824-96c1-47b60b740d00",
        "0cc5b647-c1df-4637-891a-dec35c318583",
    ];

    // Set AC value
    let ac_output = Command::new("powercfg")
        .args([
            "/setacvalueindex",
            "SCHEME_CURRENT",
            subgroups[0],
            subgroups[1],
            &ac_value.to_string(),
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !ac_output.status.success() {
        return Err(String::from_utf8_lossy(&ac_output.stderr).to_string());
    }

    // Set DC value
    let dc_output = Command::new("powercfg")
        .args([
            "/setdcvalueindex",
            "SCHEME_CURRENT",
            subgroups[0],
            subgroups[1],
            &dc_value.to_string(),
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !dc_output.status.success() {
        return Err(String::from_utf8_lossy(&dc_output.stderr).to_string());
    }

    // Apply the active scheme
    let apply_output = Command::new("powercfg")
        .args(["/setactive", "SCHEME_CURRENT"])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !apply_output.status.success() {
        return Err(String::from_utf8_lossy(&apply_output.stderr).to_string());
    }

    Ok(())
}
