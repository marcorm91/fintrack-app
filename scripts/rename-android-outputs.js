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

function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function pickOutputFile(ext) {
  const files = walkFiles(outputsRoot).filter((file) => {
    const lower = file.toLowerCase();
    return (
      lower.endsWith(ext) &&
      !lower.includes('androidtest') &&
      !lower.includes('unsigned')
    );
  });
  if (files.length === 0) {
    return null;
  }

  const scored = files
    .map((file) => {
      const lower = file.toLowerCase();
      let score = 0;
      if (lower.includes(`${path.sep}release${path.sep}`)) score += 30;
      if (lower.includes('universal')) score += 10;
      if (lower.includes('app-release')) score += 20;
      return { file, score };
    })
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  return scored[0]?.file ?? files.sort()[0];
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
  const requiredSigningVariables = [
    'ANDROID_KEYSTORE_PATH',
    'ANDROID_KEYSTORE_PASSWORD',
    'ANDROID_KEY_ALIAS',
    'ANDROID_KEY_PASSWORD'
  ];
  const missingSigningVariables = requiredSigningVariables.filter(
    (name) => !process.env[name]?.trim()
  );
  if (missingSigningVariables.length > 0) {
    throw new Error(
      `Android release signing is incomplete. Missing: ${missingSigningVariables.join(', ')}`
    );
  }

  const version = readPackageVersion();
  const apkFile = pickOutputFile('.apk');
  const aabFile = pickOutputFile('.aab');

  if (!apkFile && !aabFile) {
    throw new Error('No signed Android APK or AAB was found. Unsigned outputs are not published.');
  }

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
