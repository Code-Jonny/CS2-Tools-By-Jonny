import fs from 'fs/promises';
import path from 'path';

async function copyExt(sourceDir, ext, targetDir) {
  try {
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(ext)) {
        // Ensure we don't accidentally copy any temporary compilation executables in release
        if (ext === '.exe' && (entry.name.includes('build-script') || entry.name.endsWith('.d'))) {
          continue;
        }
        const srcPath = path.join(sourceDir, entry.name);
        const destPath = path.join(targetDir, entry.name);
        await fs.copyFile(srcPath, destPath);
        console.log(`Copied ${entry.name} to ${path.basename(targetDir)}`);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Warning: Directory not found: ${sourceDir}`);
    } else {
      console.error(`Error reading ${sourceDir}:`, error);
    }
  }
}

async function main() {
  const currentDir = import.meta.dirname;
  const rootDir = path.resolve(currentDir, '..');
  const releaseDir = path.join(rootDir, 'src-tauri', 'target', 'release');
  const bundleDir = path.join(releaseDir, 'bundle');
  const binariesDir = path.join(currentDir, 'binaries');

  // Ensure binaries folder exists
  await fs.mkdir(binariesDir, { recursive: true });

  console.log('Copying NSIS bundle...');
  await copyExt(path.join(bundleDir, 'nsis'), '.exe', binariesDir);

  console.log('Copying MSI bundle...');
  await copyExt(path.join(bundleDir, 'msi'), '.msi', binariesDir);

  console.log('Copying main executable...');
  await copyExt(releaseDir, '.exe', binariesDir);

  console.log('All binaries copied successfully!');
}

main().catch(console.error);
