import { spawn } from 'node:child_process';

const useTauri = process.argv.includes('--tauri');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmArguments = useTauri ? ['run', 'tauri', '--', 'dev'] : ['run', 'dev'];

console.log('Modo mocks activo: se usará finanzas.mocks.db.');

const child = spawn(npmCommand, npmArguments, {
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
