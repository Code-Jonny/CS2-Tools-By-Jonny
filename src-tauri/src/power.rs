use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use std::process::Command;

/// Konstante für Windows-Prozess-Erstellung.
///
/// `0x08000000` ist das Flag `CREATE_NO_WINDOW`.
/// Es verhindert, dass beim Ausführen von Befehlen kurzzeitig ein schwarzes Konsolenfenster aufpoppt.
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Repräsentiert einen Windows-Energiesparplan.
///
/// # Rust-Konzepte
/// * `#[derive(...)]`: Diese Makros generieren automatisch Code für das Struct.
///   * `Serialize`, `Deserialize`: Ermöglicht die Umwandlung in/aus JSON (wichtig für die Kommunikation mit dem Frontend).
///   * `Debug`: Ermöglicht die Ausgabe mit `println!("{:?}", plan)`.
///   * `Clone`: Erlaubt das Erstellen einer Kopie des Objekts mit `.clone()`.
/// * `#[serde(rename_all = "camelCase")]`: Konvertiert Rust-Style (`is_active`) automatisch in JS-Style (`isActive`) für das JSON.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PowerPlan {
    pub guid: String,
    pub name: String,
    pub is_active: bool,
}

/// Ruft alle verfügbaren Energiesparpläne ab.
///
/// Diese Funktion führt den Windows-Befehl `powercfg /LIST` aus und parst dessen Ausgabe.
///
/// # Returns
/// * `Result<Vec<PowerPlan>, String>`:
///   * `Ok(Vec<PowerPlan>)`: Eine Liste der gefundenen Pläne bei Erfolg.
///   * `Err(String)`: Eine Fehlermeldung, falls der Befehl fehlschlägt.
#[tauri::command]
pub fn get_power_plans() -> Result<Vec<PowerPlan>, String> {
    // * HINWEIS: Encoding-Problemumgehung
    // Windows-Konsolen verwenden standardmäßig oft Codepages wie CP850 oder CP1252.
    // Rust erwartet aber UTF-8. `chcp 65001` stellt die Konsole temporär auf UTF-8 um,
    // damit Sonderzeichen (wie Umlaute in "Ausbalanciert") korrekt gelesen werden.
    let output = Command::new("cmd")
        .args(["/C", "chcp 65001 && powercfg /LIST"])
        .creation_flags(CREATE_NO_WINDOW) // Verhindert das Aufpoppen des Fensters
        .output()
        .map_err(|e| e.to_string())?; // ? Konvertiert Systemfehler (io::Error) in einen String für das Result

    // * HINWEIS: Fehlerprüfung
    // Auch wenn der Befehl ausgeführt wurde (`Ok`), kann er einen Fehlercode zurückgegeben haben (z.B. Befehl nicht gefunden).
    if !output.status.success() {
        // `String::from_utf8_lossy`: Konvertiert Bytes in einen String. Ungültige UTF-8-Sequenzen werden durch  ersetzt, statt abzustürzen.
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut plans = Vec::new();

    // * HINWEIS: Parsing-Logik
    // Wir iterieren Zeile für Zeile durch die Ausgabe.
    // Rusts String-Handling ist sehr strikt bezüglich UTF-8, aber hier arbeiten wir mit Slices (`&str`),
    // was sehr effizient ist, da keine Daten kopiert werden müssen (bis zum `to_string()`).
    for line in stdout.lines() {
        if line.contains("GUID") {
            // Beispielzeile: "Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)"
            // Beispiel aktiv: "Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced) *"

            // `split_whitespace` teilt den String an Leerzeichen/Tabs auf.
            // `collect` sammelt die Teile in einen Vektor.
            let parts: Vec<&str> = line.split_whitespace().collect();

            // Wir erwarten mindestens: "Power", "Scheme", "GUID:", "<GUID>", "(Name)..."
            if parts.len() >= 4 {
                // Die GUID ist immer das 4. Element (Index 3).
                let guid = parts[3].to_string();

                // Wenn die Zeile mit '*' endet, ist dieser Plan aktiv.
                let is_active = line.trim().ends_with('*');

                // * HINWEIS: Namensextraktion
                // Der Name steht in Klammern. Wir suchen die Positionen von '(' und ')'.
                // `unwrap_or(0)`: Wenn '(' nicht gefunden wird, nehmen wir 0 an (Fallback).
                // Das ist sicherer als `unwrap()`, was bei fehlendem Zeichen panicken (abstürzen) würde.
                let start_bytes = line.find('(').unwrap_or(0);
                let end_bytes = line.rfind(')').unwrap_or(line.len());

                let name = if start_bytes < end_bytes {
                    // String Slicing: Wir schneiden den Teil zwischen den Klammern aus.
                    // `to_string()` erstellt hier eine neue, unabhängige Kopie des Strings (Heap-Allokation).
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

/// Setzt den aktiven Energiesparplan.
///
/// # Arguments
/// * `guid` - Die GUID des zu aktivierenden Plans als String.
#[tauri::command]
pub fn set_active_power_plan(guid: String) -> Result<(), String> {
    // ? ALTERNATIVE: Warum `powercfg` direkt und nicht `cmd /C`?
    // Hier brauchen wir kein `chcp` (keine Textausgabe, die wir parsen müssen),
    // also rufen wir das Programm direkt auf. Das ist effizienter und sicherer.
    let output = Command::new("powercfg")
        .arg("/SETACTIVE")
        .arg(&guid) // Wir leihen (`&`) die GUID nur aus, da `arg` eine Referenz erwartet.
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    // `Ok(())` ist der "Unit Type" in Rust (ähnlich `void` in C/Java),
    // bedeutet hier: "Erfolgreich, aber kein Rückgabewert".
    Ok(())
}
