import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const targetPath = path.join(
  projectRoot,
  'src-tauri',
  'gen',
  'android',
  'app',
  'src',
  'main',
  'java',
  'com',
  'fintrack',
  'app',
  'MainActivity.kt'
);
const appDir = path.join(projectRoot, 'src-tauri', 'gen', 'android', 'app');
const gradlePath = path.join(appDir, 'build.gradle.kts');
const tauriPropsPath = path.join(appDir, 'tauri.properties');

const requiredImports = [
  'import androidx.core.view.WindowCompat',
  'import androidx.core.view.WindowInsetsCompat',
  'import androidx.core.view.WindowInsetsControllerCompat'
];

function ensureImports(lines) {
  const existing = new Set(lines.filter((line) => line.startsWith('import ')));
  const missing = requiredImports.filter((imp) => !existing.has(imp));
  if (missing.length === 0) {
    return lines;
  }
  const lastImportIndex = lines.reduce((idx, line, i) => (line.startsWith('import ') ? i : idx), -1);
  const insertAt = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
  const next = [...lines];
  next.splice(insertAt, 0, ...missing);
  return next;
}

function ensureOnCreateBody(lines) {
  const onCreateIndex = lines.findIndex((line) => line.includes('override fun onCreate'));
  if (onCreateIndex === -1) {
    return lines;
  }
  const hasHideCall = lines.some((line) => line.trim() === 'hideSystemBars()');
  if (hasHideCall) {
    return lines;
  }
  const superIndex = lines.findIndex((line, i) => i > onCreateIndex && line.includes('super.onCreate'));
  if (superIndex === -1) {
    return lines;
  }
  const next = [...lines];
  next.splice(superIndex + 1, 0, '    hideSystemBars()');
  return next;
}

function ensureFocusOverride(lines) {
  if (lines.some((line) => line.includes('override fun onWindowFocusChanged'))) {
    return lines;
  }
  const classEndIndex = lines.findLastIndex((line) => line.trim() === '}');
  if (classEndIndex === -1) {
    return lines;
  }
  const block = [
    '',
    '  override fun onWindowFocusChanged(hasFocus: Boolean) {',
    '    super.onWindowFocusChanged(hasFocus)',
    '    if (hasFocus) {',
    '      hideSystemBars()',
    '    }',
    '  }',
    '',
    '  private fun hideSystemBars() {',
    '    WindowCompat.setDecorFitsSystemWindows(window, false)',
    '    val controller = WindowInsetsControllerCompat(window, window.decorView)',
    '    controller.hide(WindowInsetsCompat.Type.systemBars())',
    '    controller.systemBarsBehavior =',
    '      WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE',
    '  }'
  ];
  const next = [...lines];
  next.splice(classEndIndex, 0, ...block);
  return next;
}

function ensureHideSystemBars(lines) {
  if (lines.some((line) => line.includes('fun hideSystemBars'))) {
    return lines;
  }
  return ensureFocusOverride(lines);
}

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

function computeVersionCode(version) {
  const parts = version.split('.').map((part) => Number.parseInt(part, 10));
  const [major = 0, minor = 0, patch = 0] = parts;
  return major * 10000 + minor * 100 + patch;
}

function writeTauriProperties() {
  if (!fs.existsSync(appDir)) {
    console.log('[android-immersive] Android app directory not found, skipping tauri.properties.');
    return;
  }
  const version = readPackageVersion();
  const versionCode = computeVersionCode(version);
  const contents = `tauri.android.versionCode=${versionCode}\n` +
    `tauri.android.versionName=${version}\n`;
  fs.writeFileSync(tauriPropsPath, contents, 'utf8');
  console.log('[android-immersive] Wrote tauri.properties');
}

function patchMainActivity() {
  if (!fs.existsSync(targetPath)) {
    console.log('[android-immersive] MainActivity not found, skipping.');
    return;
  }

  const original = fs.readFileSync(targetPath, 'utf8');
  let lines = original.split(/\r?\n/);

  lines = ensureImports(lines);
  lines = ensureOnCreateBody(lines);
  lines = ensureHideSystemBars(lines);

  const next = lines.join('\n');
  if (next !== original) {
    fs.writeFileSync(targetPath, next, 'utf8');
    console.log('[android-immersive] Patched MainActivity.kt');
  } else {
    console.log('[android-immersive] MainActivity.kt already patched');
  }
}

function patchGradleSigning() {
  if (!fs.existsSync(gradlePath)) {
    console.log('[android-immersive] build.gradle.kts not found, skipping signing config.');
    return;
  }
  let content = fs.readFileSync(gradlePath, 'utf8');
  if (!content.includes('releaseSigningAvailable')) {
    const signingBlock = `
    val releaseSigningAvailable =
        !System.getenv("ANDROID_KEYSTORE_PATH").isNullOrBlank() &&
        !System.getenv("ANDROID_KEYSTORE_PASSWORD").isNullOrBlank() &&
        !System.getenv("ANDROID_KEY_ALIAS").isNullOrBlank() &&
        !System.getenv("ANDROID_KEY_PASSWORD").isNullOrBlank()

    if (releaseSigningAvailable) {
        signingConfigs {
            create("release") {
                storeFile = file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }
`;
    content = content.replace('android {\n', `android {\n${signingBlock}`);
  }

  if (!content.includes('signingConfig = signingConfigs.getByName("release")')) {
    content = content.replace(
      'getByName("release") {\n',
      'getByName("release") {\n            if (releaseSigningAvailable) {\n                signingConfig = signingConfigs.getByName("release")\n            }\n'
    );
  }

  fs.writeFileSync(gradlePath, content, 'utf8');
  console.log('[android-immersive] Patched build.gradle.kts signing config');
}

function patchFile() {
  writeTauriProperties();
  patchMainActivity();
  patchGradleSigning();
}

patchFile();
