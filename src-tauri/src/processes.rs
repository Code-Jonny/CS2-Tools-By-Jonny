use serde::{Deserialize, Serialize};
use sysinfo::{ProcessesToUpdate, System};

#[cfg(target_os = "windows")]
use winapi::shared::minwindef::FALSE;
#[cfg(target_os = "windows")]
use winapi::um::handleapi::CloseHandle;
#[cfg(target_os = "windows")]
use winapi::um::processthreadsapi::OpenProcess;
#[cfg(target_os = "windows")]
use winapi::um::winbase::SetProcessAffinityMask;
#[cfg(target_os = "windows")]
use winapi::um::winnt::PROCESS_SET_INFORMATION;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub memory: u64,
}

#[tauri::command]
pub fn get_processes() -> Vec<ProcessInfo> {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    sys.processes()
        .iter()
        .map(|(pid, process)| ProcessInfo {
            pid: pid.as_u32(),
            name: process.name().to_string_lossy().into_owned(),
            memory: process.memory(),
        })
        .collect()
}

#[tauri::command]
pub fn terminate_process(pid: u32) -> Result<(), String> {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let pid = sysinfo::Pid::from_u32(pid);

    if let Some(process) = sys.process(pid) {
        if process.kill() {
            Ok(())
        } else {
            Err("Failed to kill process".to_string())
        }
    } else {
        Err("Process not found".to_string())
    }
}

#[tauri::command]
pub fn get_cpu_count() -> usize {
    let mut sys = System::new();
    sys.refresh_cpu_all();
    sys.cpus().len()
}

#[tauri::command]
pub fn set_process_affinity(pid: u32, mask: String) -> Result<(), String> {
    // mask is passed as String because u64 might have issues with JSON serialization/deserialization precision in JS
    // although BigInt exists, passing as string is safer for large bitmasks.
    let mask_val = u64::from_str_radix(&mask, 10).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        unsafe {
            let handle = OpenProcess(PROCESS_SET_INFORMATION, FALSE, pid);
            if handle.is_null() {
                return Err("Failed to open process".to_string());
            }

            // Compiler claims SetProcessAffinityMask expects u32, even though it should be DWORD_PTR (usize) on x64.
            // Casting to u32 to satisfy the compiler. This limits affinity to 32 cores.
            let result = SetProcessAffinityMask(handle, mask_val as u32);

            CloseHandle(handle);

            if result == 0 {
                return Err("Failed to set affinity".to_string());
            }
            Ok(())
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Not supported on this OS".to_string())
    }
}
