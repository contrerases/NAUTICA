const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/backend/index.ts');
let code = fs.readFileSync(file, 'utf8');

const injection = `
import * as fsLog from 'fs';
import * as pathLog from 'path';
setTimeout(() => {
  try {
    const logFile = pathLog.join(app.getPath('userData'), 'diag.log');
    fsLog.writeFileSync(logFile, '[START]\\n');
    const oErr = console.error.bind(console);
    console.error = (...args) => {
      fsLog.appendFileSync(logFile, '[ERR] ' + args.join(' ') + '\\n');
      oErr(...args);
    };
    process.on('uncaughtException', e => fsLog.appendFileSync(logFile, '[FATAL] ' + (e.stack||e) + '\\n'));
  } catch(e){}
}, Number(100));
`;

code = code.replace("import { registerConfigHandlers } from './ipc/configHandlers'", "import { registerConfigHandlers } from './ipc/configHandlers'\n" + injection);
fs.writeFileSync(file, code);
