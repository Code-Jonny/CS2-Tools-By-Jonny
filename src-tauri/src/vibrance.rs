use anyhow::{anyhow, Context, Result};
use log::{debug, info, warn};
use nvapi::{sys, ConnectedIdsFlags, PhysicalGpu};
use std::mem;

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
    pub fn new() -> Result<Self> {
        debug!("Initializing NvAPI...");

        // Initialize the NvAPI library.
        // `map_err`: Wandelt den NvAPI-Fehler in einen `anyhow::Error` um,
        // damit wir eine verständliche Fehlermeldung zurückgeben können.
        nvapi::initialize().map_err(|e| {
            anyhow!(
                "Failed to initialize NvAPI: {}. Is the NVIDIA driver installed?",
                e
            )
        })?;

        info!("NvAPI initialized successfully.");
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
    pub fn set_vibrance_for_display(&mut self, display_name: &str, level: u32) -> Result<()> {
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
            println!("Attempting to get handle for display: '{}'", display_name);

            // `mem::zeroed()`: Erstellt ein leeres Handle-Objekt, das von der C-Funktion gefüllt wird.
            let mut handle: sys::handles::NvDisplayHandle = mem::zeroed();

            // Aufruf der C-Funktion
            let status = get_handle(c_name.as_ptr(), &mut handle);

            if status != sys::status::NVAPI_OK {
                println!(
                    "NvAPI Error getting handle for '{}': {:?}",
                    display_name, status
                );
                return Err(anyhow!(
                    "Failed to get handle for display {}: {:?}",
                    display_name,
                    status
                ));
            }

            println!(
                "Successfully got handle for '{}'. Setting DVC now...",
                display_name
            );
            self.set_dvc_for_handle(handle, level)?;
        }

        Ok(())
    }

    /// Sets the digital vibrance level for all connected NVIDIA displays.
    ///
    /// # Arguments
    ///
    /// * `level` - The vibrance level to set (0-100).
    pub fn set_vibrance(&mut self, level: u32) -> Result<()> {
        if level > 100 {
            return Err(anyhow!("Vibrance level must be between 0 and 100"));
        }

        // 1. Enumerate Physical GPUs (as requested by user, and for logging)
        // `context`: Fügt dem Fehler zusätzliche Informationen hinzu ("Failed to enumerate GPUs").
        let gpus = PhysicalGpu::enumerate().context("Failed to enumerate GPUs")?;
        if gpus.is_empty() {
            return Err(anyhow!("No NVIDIA GPUs found."));
        }

        for gpu in &gpus {
            // 2. Get connected displays for this GPU
            let connected_ids = gpu
                .display_ids_connected(ConnectedIdsFlags::empty())
                .unwrap_or_default();
            debug!(
                "GPU {:?} has {} connected display(s)",
                gpu,
                connected_ids.len()
            );
        }

        // 3. Set Digital Vibrance (DVC)
        let mut success_count = 0;
        let mut i = 0;
        loop {
            let mut handle: sys::handles::NvDisplayHandle = unsafe { mem::zeroed() };
            // Wir iterieren über alle Display-Handles (0, 1, 2...), bis die API "End Enumeration" meldet.
            let status = unsafe { sys::dispcontrol::NvAPI_EnumNvidiaDisplayHandle(i, &mut handle) };

            if status == sys::status::NVAPI_END_ENUMERATION {
                break;
            }
            if status != sys::status::NVAPI_OK {
                warn!(
                    "EnumNvidiaDisplayHandle failed at index {}: {:?}",
                    i, status
                );
                break;
            }

            debug!("Found Display Handle at index {}", i);

            // Attempt to set DVC for this display handle
            match self.set_dvc_for_handle(handle, level) {
                Ok(_) => {
                    info!("Successfully set vibrance for display handle index {}", i);
                    success_count += 1;
                }
                Err(e) => {
                    warn!(
                        "Failed to set vibrance for display handle index {}: {}",
                        i, e
                    );
                }
            }

            i += 1;
        }

        if success_count == 0 {
            warn!("No displays were updated. This might be because no displays support DVC or no displays are connected.");
        } else {
            info!("Updated vibrance on {} display(s).", success_count);
        }

        Ok(())
    }

    /// Interne Hilfsfunktion zum Setzen der Vibrance für ein spezifisches Handle.
    fn set_dvc_for_handle(
        &self,
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

            debug!(
                "DVC Info: min={}, max={}, current={}, default={}",
                dvc_info.min_level,
                dvc_info.max_level,
                dvc_info.current_level,
                dvc_info.default_level
            );

            // Calculate new level
            // Map 0-100 to min-max
            // * HINWEIS: Lineare Interpolation
            // Die API verwendet interne Werte (z.B. 0-63), wir wollen Prozent (0-100).
            // Formel: min + (prozent * (max - min) / 100)
            let range = dvc_info.max_level - dvc_info.min_level;
            let new_val = dvc_info.min_level + (level_percent * range / 100);

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
