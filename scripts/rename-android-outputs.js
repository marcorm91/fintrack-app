import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const outputsRoot = path.join(
  projectRoot,
  'src-tauri',
  'gen',
  'android',
  'app',
  'build',
  'outputs'
);
const artifactsDir = path.join(projectRoot, 'artifacts', 'android');

function readPackageVersion() {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return '0.0.0';
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function pickReleaseFile(dir, ext) {
  if (!fs.existsSync(dir)) {
    return null;
  }
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith(ext));
  if (files.length === 0) {
    return null;
  }
  const preferred = files.find((file) => file.toLowerCase() === `app-release${ext}`);
  return preferred ?? files.sort()[0];
}

function copyOutput(filePath, targetName) {
  if (!filePath) {
    return null;
  }
  fs.mkdirSync(artifactsDir, { recursive: true });
  const destPath = path.join(artifactsDir, targetName);
  fs.copyFileSync(filePath, destPath);
  return destPath;
}

function renameOutputs() {
  const version = readPackageVersion();
  const apkDir = path.join(outputsRoot, 'apk', 'release');
  const aabDir = path.join(outputsRoot, 'bundle', 'release');

  const apkFile = pickReleaseFile(apkDir, '.apk');
  const aabFile = pickReleaseFile(aabDir, '.aab');

  const apkDest = copyOutput(apkFile, `Fintrack_${version}_android.apk`);
  const aabDest = copyOutput(aabFile, `Fintrack_${version}_android.aab`);

  if (apkDest) {
    console.log(`[android-outputs] APK -> ${apkDest}`);
  } else {
    console.log('[android-outputs] No APK found to copy.');
  }

  if (aabDest) {
    console.log(`[android-outputs] AAB -> ${aabDest}`);
  } else {
    console.log('[android-outputs] No AAB found to copy.');
  }
}

renameOutputs();
