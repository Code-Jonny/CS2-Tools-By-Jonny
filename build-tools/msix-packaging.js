import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// process.cwd() zeigt auf das Projekt-Hauptverzeichnis (wo pnpm ausgeführt wird)
const rootDir = process.cwd();
const binariesDir = path.join(rootDir, 'build-tools', 'binaries');

// Lese Version aus tauri.conf.json
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
const appVersion = tauriConf.version;

// Ensure version is 4 parts for MSIX (e.g., 2.1.0.0)
const msixVersion = appVersion.split('.').length === 3 ? `${appVersion}.0` : appVersion;

// Ensure binaries folder exists
if (!fs.existsSync(binariesDir)) {
  fs.mkdirSync(binariesDir, { recursive: true });
}

// Update AppxManifest.xml
const manifestPath = path.join(rootDir, 'build-tools', 'msix-packaging', 'AppxManifest.xml');
let manifestContent = fs.readFileSync(manifestPath, 'utf8');
manifestContent = manifestContent.replace(/(<Identity[^>]*Version=")[^"]+("[^>]*>)/s, `$1${msixVersion}$2`);
fs.writeFileSync(manifestPath, manifestContent, 'utf8');
console.log(`Updated AppxManifest.xml version to ${msixVersion}`);

// Passe diese Namen an deine App an!
const APP_EXE_NAME = 'CS2ToolsByJonny.exe';
const MSIX_OUTPUT_NAME = `CS2ToolsByJonny_${appVersion}.msix`;

// Pfade definieren
const exePath = path.join(binariesDir, APP_EXE_NAME);
const msixTemplateDir = path.join(rootDir, 'build-tools', 'msix-packaging');
const destExePath = path.join(msixTemplateDir, APP_EXE_NAME);
const outputMsix = path.join(binariesDir, MSIX_OUTPUT_NAME);

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