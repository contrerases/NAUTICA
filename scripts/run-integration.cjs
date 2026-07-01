/**
 * Runner portable del test de integración: compila con esbuild y lo ejecuta con
 * Electron en modo Node (ELECTRON_RUN_AS_NODE), para usar el mismo ABI con el que
 * se compiló better-sqlite3. Funciona igual en bash y en cmd.
 */
const path = require('path');
const fs = require('fs');
const { buildSync } = require('esbuild');
const { spawnSync } = require('child_process');

const out = path.join(__dirname, '.int.cjs');
buildSync({
  entryPoints: [path.join(__dirname, 'verify_integration.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: out,
  external: ['electron', 'better-sqlite3', 'exceljs', 'bcryptjs'],
});

const electronPath = require('electron'); // en Node puro, exporta la ruta al binario
const res = spawnSync(electronPath, [out], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
});
fs.rmSync(out, { force: true });
process.exit(res.status ?? 1);
