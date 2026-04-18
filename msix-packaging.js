import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Passe diese Namen an deine App an!
const APP_EXE_NAME = 'CS2ToolsByJonny.exe';
const MSIX_OUTPUT_NAME = 'CS2ToolsByJonny.msix';

// process.cwd() zeigt auf das Projekt-Hauptverzeichnis (wo pnpm ausgeführt wird)
const rootDir = process.cwd();

// Pfade definieren
const exePath = path.join(rootDir, 'src-tauri/target/release', APP_EXE_NAME);
const msixTemplateDir = path.join(rootDir, 'msix-packaging');
const destExePath = path.join(msixTemplateDir, APP_EXE_NAME);
const outputMsix = path.join(rootDir, MSIX_OUTPUT_NAME);

// --- HILFSFUNKTION: Sucht den Pfad zur makeappx.exe ---
function getMakeAppxPath() {
  const sdkBaseDir = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';

  // Wenn der Ordner nicht existiert, versuchen wir es mit dem Standardbefehl (Fallback)
  if (!fs.existsSync(sdkBaseDir)) return 'makeappx';

  // Lese alle Ordner, die mit "10." beginnen (die SDK-Versionen)
  const versions = fs.readdirSync(sdkBaseDir).filter(dir => dir.startsWith('10.'));

  if (versions.length === 0) return 'makeappx';

  // Sortiere absteigend, um die neueste SDK-Version zu nutzen
  versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  // Baue den kompletten Pfad für 64-Bit-Systeme zusammen
  const makeAppxPath = path.join(sdkBaseDir, versions[0], 'x64', 'makeappx.exe');

  // Gebe den Pfad in Anführungszeichen zurück (wichtig für Leerzeichen im Pfad!)
  return fs.existsSync(makeAppxPath) ? `"${makeAppxPath}"` : 'makeappx';
}

try {
  console.log('Kopiere Tauri-Executable in den MSIX-Ordner...');
  fs.copyFileSync(exePath, destExePath);

  console.log('Suche Windows SDK...');
  const makeappxCmd = getMakeAppxPath();
  console.log(`Verwende makeappx unter: ${makeappxCmd}`);

  console.log('Erstelle MSIX Package...');
  execSync(`${makeappxCmd} pack /d "${msixTemplateDir}" /p "${outputMsix}" /o`, { stdio: 'inherit' });

  console.log(`\nErfolg! MSIX wurde erstellt: ${outputMsix}`);
} catch (error) {
  console.error('\nFehler beim Erstellen der MSIX:', error.message);
  process.exit(1);
}