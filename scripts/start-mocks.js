import { spawn } from 'node:child_process';

const useTauri = process.argv.includes('--tauri');
const npmArguments = useTauri ? ['run', 'tauri', '--', 'dev'] : ['run', 'dev'];
const isWindows = process.platform === 'win32';
const command = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'npm';
const commandArguments = isWindows
  ? ['/d', '/s', '/c', useTauri ? 'npm run tauri -- dev' : 'npm run dev']
  : npmArguments;

console.log('Modo mocks activo: se usará finanzas.mocks.db.');

const child = spawn(command, commandArguments, {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_USE_MOCK_DB: 'true',
    VITE_SEED_MOCKS: 'force'
  }
});

child.on('error', (error) => {
  console.error('No se pudo iniciar Fintrack con datos mock.', error);
  process.exitCode = 1;
});

child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
