use anyhow::{anyhow, Result};
use nvapi::{sys, PhysicalGpu};
use std::mem;
use tauri::{AppHandle, Emitter};

// Define the DVC struct as it is missing in nvapi-sys 0.1.3
/// Struktur für Digital Vibrance Control (DVC) Informationen.
///
/// Diese Struktur ist in der verwendeten Version von `nvapi-sys` nicht enthalten,
/// daher definieren wir sie manuell, um mit der C-API von Nvidia zu kommunizieren.
///
/// # Rust-Konzepte
/// * `#[repr(C)]`: Zwingt den Compiler, das Speicherlayout von C zu verwenden.
///   Das ist essenziell, wenn man Daten an C-Funktionen übergibt, da Rust sonst
///   Felder im Speicher umordnen könnte (für Padding/Alignment).
#[repr(C)]
#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy)]
struct NV_DISPLAY_DVC_INFO_EX {
    version: u32,
    current_level: u32,
    min_level: u32,
    max_level: u32,
    default_level: u32,
}

impl NV_DISPLAY_DVC_INFO_EX {
    fn new() -> Self {
        Self {
            // * HINWEIS: Versionierung in C-APIs
            // Viele Windows/Treiber-APIs nutzen das `version`-Feld, um die Größe des Structs
            // und die API-Version zu kodieren.
            // `mem::size_of::<Self>()`: Größe des Structs in Bytes.
            // `(1 << 16)`: Ein Versions-Bitflag (spezifisch für NvAPI).
            version: mem::size_of::<Self>() as u32 | (1 << 16),
            current_level: 0,
            min_level: 0,
            max_level: 0,
            default_level: 0,
        }
    }
}

// Function pointer types for the raw NvAPI calls
// * HINWEIS: Funktionszeiger
// Wir definieren Typen für C-Funktionen, die wir dynamisch zur Laufzeit laden.
// `unsafe extern "C"`:
// - `unsafe`: Der Aufruf kann Speicherfehler verursachen (Rust prüft hier nichts).
// - `extern "C"`: Verwendet die C-Aufrufkonvention (ABI).
#[allow(improper_ctypes_definitions)]
type NvAPIDispGetDVCInfoEx = unsafe extern "C" fn(
    h_nv_display: sys::handles::NvDisplayHandle,
    output_id: u32,
    p_dvc_info: *mut NV_DISPLAY_DVC_INFO_EX,
) -> sys::status::NvAPI_Status;

#[allow(improper_ctypes_definitions)]
type NvAPIDispSetDVCLevelEx = unsafe extern "C" fn(
    h_nv_display: sys::handles::NvDisplayHandle,
    output_id: u32,
    p_dvc_info: *mut NV_DISPLAY_DVC_INFO_EX,
) -> sys::status::NvAPI_Status;

// Magic IDs for the functions
// Diese IDs identifizieren die Funktionen in der NvAPI DLL.
const NVAPI_DISP_GET_DVC_INFO_EX_ID: u32 = 0x0e45002d;
const NVAPI_DISP_SET_DVC_LEVEL_EX_ID: u32 = 0x4a82c2b1;
const NVAPI_GET_ASSOCIATED_NVIDIA_DISPLAY_HANDLE_ID: u32 = 0x35c29134;

#[allow(improper_ctypes_definitions)]
type NvAPIGetAssociatedNvidiaDisplayHandle = unsafe extern "C" fn(
    sz_display_name: *const i8,
    p_nv_display_handle: *mut sys::handles::NvDisplayHandle,
) -> sys::status::NvAPI_Status;

/// Controller for NVIDIA GPU operations.
///
/// Kapselt die Low-Level NvAPI Aufrufe in einer sicheren Rust-Schnittstelle.
pub struct NvidiaController;

impl NvidiaController {
    /// Initializes the NVIDIA controller.
    ///
    /// Performs a single `nvapi::initialize()` call and verifies that at least one
    /// NVIDIA GPU is present, so callers do not need a separate `has_nvidia_gpu()`
    /// guard before constructing this type.
    pub fn new(app: &AppHandle) -> Result<Self> {
        let _ = app.emit("log-info", "Initializing NvAPI...");

        // Initialize the NvAPI library.
        // `map_err`: Wandelt den NvAPI-Fehler in einen `anyhow::Error` um,
        // damit wir eine verständliche Fehlermeldung zurückgeben können.
        nvapi::initialize().map_err(|e| {
            anyhow!(
                "Failed to initialize NvAPI: {}. Is the NVIDIA driver installed?",
                e
            )
        })?;

        // Verify GPU presence in the same init path to avoid a second
        // driver round-trip when callers previously called has_nvidia_gpu() first.
        let gpus = PhysicalGpu::enumerate()
            .map_err(|e| anyhow!("Failed to enumerate NVIDIA GPUs: {}", e))?;
        if gpus.is_empty() {
            return Err(anyhow!("No NVIDIA GPU found"));
        }

        let _ = app.emit("log-info", "NvAPI initialized successfully.");
        Ok(Self)
    }

    /// Checks if an NVIDIA GPU is present.
    pub fn has_nvidia_gpu() -> bool {
        // * HINWEIS: Pattern Matching
        // Wir prüfen verschachtelt:
        // 1. Konnte NvAPI initialisiert werden?
        // 2. Wenn ja, gibt es physische GPUs?
        match nvapi::initialize() {
            Ok(_) => match PhysicalGpu::enumerate() {
                Ok(gpus) => !gpus.is_empty(),
                Err(_) => false,
            },
            Err(_) => false,
        }
    }

    /// Sets the digital vibrance level for a specific display.
    ///
    /// # Arguments
    ///
    /// * `display_name` - The name of the display (e.g., "\\.\DISPLAY1").
    /// * `level` - The vibrance level to set (0-100).
    pub fn set_vibrance_for_display(
        &mut self,
        app: &AppHandle,
        display_name: &str,
        level: u32,
    ) -> Result<()> {
        if level > 100 {
            return Err(anyhow!("Vibrance level must be between 0 and 100"));
        }

        // * HINWEIS: Unsafe Block
        // Hier interagieren wir direkt mit C-Pointern und rohem Speicher.
        // Wir müssen manuell sicherstellen, dass Pointer gültig sind und Speicher korrekt initialisiert ist.
        unsafe {
            // Load NvAPI_GetAssociatedNvidiaDisplayHandle
            // Wir fragen die NvAPI nach der Adresse der Funktion anhand ihrer ID.
            let get_handle_res =
                sys::nvapi::nvapi_QueryInterface(NVAPI_GET_ASSOCIATED_NVIDIA_DISPLAY_HANDLE_ID);
            if get_handle_res.is_err() {
                return Err(anyhow!("NvAPI_GetAssociatedNvidiaDisplayHandle not found"));
            }
            let get_handle_addr = get_handle_res.unwrap();

            // `mem::transmute`: Der gefährlichste Cast in Rust.
            // Er interpretiert die Bits einer Speicheradresse einfach als einen anderen Typ (hier Funktionszeiger).
            // Wenn die Signatur nicht stimmt -> Undefined Behavior (Absturz).
            let get_handle: NvAPIGetAssociatedNvidiaDisplayHandle = mem::transmute(get_handle_addr);

            // Konvertierung von Rust String (`&str`) zu C-String (`CString`).
            // Rust Strings sind nicht null-terminiert, C Strings schon.
            let c_name = std::ffi::CString::new(display_name)?;

            // Log output for debugging
            let _ = app.emit(
                "log-info",
                format!("Attempting to get handle for display: '{}'", display_name),
            );

            // `mem::zeroed()`: Erstellt ein leeres Handle-Objekt, das von der C-Funktion gefüllt wird.
            let mut handle: sys::handles::NvDisplayHandle = mem::zeroed();

            // Aufruf der C-Funktion
            let status = get_handle(c_name.as_ptr(), &mut handle);

            if status != sys::status::NVAPI_OK {
                let _ = app.emit(
                    "log-error",
                    format!(
                        "NvAPI Error getting handle for '{}': {:?}",
                        display_name, status
                    ),
                );
                return Err(anyhow!(
                    "Failed to get handle for display {}: {:?}",
                    display_name,
                    status
                ));
            }

            let _ = app.emit(
                "log-info",
                format!(
                    "Successfully got handle for '{}'. Setting DVC now...",
                    display_name
                ),
            );
            self.set_dvc_for_handle(app, handle, level)?;
        }

        Ok(())
    }

    /// Interne Hilfsfunktion zum Setzen der Vibrance für ein spezifisches Handle.
    fn set_dvc_for_handle(
        &self,
        app: &AppHandle,
        handle: sys::handles::NvDisplayHandle,
        level_percent: u32,
    ) -> Result<()> {
        unsafe {
            // Load NvAPI_Disp_GetDVCInfoEx
            let get_dvc_res = sys::nvapi::nvapi_QueryInterface(NVAPI_DISP_GET_DVC_INFO_EX_ID);
            if get_dvc_res.is_err() {
                return Err(anyhow!("NvAPI_Disp_GetDVCInfoEx not found"));
            }
            let get_dvc_addr = get_dvc_res.unwrap();
            let get_dvc: NvAPIDispGetDVCInfoEx = mem::transmute(get_dvc_addr);

            // Load NvAPI_Disp_SetDVCLevelEx
            let set_dvc_res = sys::nvapi::nvapi_QueryInterface(NVAPI_DISP_SET_DVC_LEVEL_EX_ID);
            if set_dvc_res.is_err() {
                return Err(anyhow!("NvAPI_Disp_SetDVCLevelEx not found"));
            }
            let set_dvc_addr = set_dvc_res.unwrap();
            let set_dvc: NvAPIDispSetDVCLevelEx = mem::transmute(set_dvc_addr);

            // Prepare struct
            let mut dvc_info = NV_DISPLAY_DVC_INFO_EX::new();

            // Get current info to find min/max
            // outputId is usually 0 for the default output of the handle
            let status = get_dvc(handle, 0, &mut dvc_info);
            if status != sys::status::NVAPI_OK {
                return Err(anyhow!("Failed to get DVC info: {:?}", status));
            }

            let _ = app.emit(
                "log-info",
                format!(
                    "DVC Info: min={}, max={}, current={}, default={}",
                    dvc_info.min_level,
                    dvc_info.max_level,
                    dvc_info.current_level,
                    dvc_info.default_level
                ),
            );

            // Calculate new level
            // Map 0-100 to min-max
            // * HINWEIS: Lineare Interpolation
            // Die API verwendet interne Werte (z.B. 0-63), wir wollen Prozent (0-100).
            // Formel: min + (prozent * (max - min) / 100)
            // saturating_sub guards against wrap-around if NvAPI returns min > max.
            // saturating_mul guards against overflow if NvAPI returns an unexpectedly large range.
            let range = dvc_info.max_level.saturating_sub(dvc_info.min_level);
            let new_val = dvc_info
                .min_level
                .saturating_add(level_percent.saturating_mul(range) / 100);

            dvc_info.current_level = new_val;

            // Set new level
            let status = set_dvc(handle, 0, &mut dvc_info);
            if status != sys::status::NVAPI_OK {
                return Err(anyhow!("Failed to set DVC level: {:?}", status));
            }
        }
        Ok(())
    }
}
use winapi::um::winuser::{
    GetForegroundWindow, GetMonitorInfoA, MonitorFromWindow, MONITORINFOEXA,
    MONITOR_DEFAULTTONEAREST,
};

#[tauri::command]
pub fn check_nvidia_gpu() -> bool {
    NvidiaController::has_nvidia_gpu()
}

#[tauri::command]
pub fn apply_vibrance_to_focused_display(app: AppHandle, level: u32) -> Result<String, String> {
    // NvidiaController::new() initializes NvAPI and checks GPU presence in one step.
    let mut controller = NvidiaController::new(&app).map_err(|e| e.to_string())?;

    let hwnd = unsafe { GetForegroundWindow() };
    if hwnd.is_null() {
        return Err("No foreground window".into());
    }

    let hmonitor = unsafe { MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST) };
    let mut monitor_info: MONITORINFOEXA = unsafe { std::mem::zeroed() };
    monitor_info.cbSize = std::mem::size_of::<MONITORINFOEXA>() as u32;

    let success = unsafe {
        GetMonitorInfoA(
            hmonitor,
            &mut monitor_info as *mut _ as *mut winapi::um::winuser::MONITORINFO,
        )
    };

    if success != 0 {
        let device_name_c = unsafe { std::ffi::CStr::from_ptr(monitor_info.szDevice.as_ptr()) };
        let device_name = device_name_c.to_string_lossy().into_owned();
        match controller.set_vibrance_for_display(&app, &device_name, level) {
            Ok(_) => Ok(device_name),
            Err(e) => Err(e.to_string()),
        }
    } else {
        Err("Failed to get monitor info".into())
    }
}

#[tauri::command]
pub fn apply_vibrance(app: AppHandle, display_name: String, level: u32) -> Result<(), String> {
    // NvidiaController::new() initializes NvAPI and checks GPU presence in one step.
    let mut controller = NvidiaController::new(&app).map_err(|e| e.to_string())?;

    controller
        .set_vibrance_for_display(&app, &display_name, level)
        .map_err(|e| e.to_string())
}
