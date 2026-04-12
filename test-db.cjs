const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('nautica.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const sql = fs.readFileSync('database/nautica_jornada.sql', 'utf-8');
const seeds = fs.readFileSync('database/seeds.sql', 'utf-8');

try {
  db.exec(`PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS attendance_records;
      DROP TABLE IF EXISTS worker_advances;
      DROP TABLE IF EXISTS workers;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS app_config;
      PRAGMA foreign_keys = ON;`);
  console.log("Dropped tables.");
  db.exec(sql);
  console.log("Schema created.");
  
  const seedStatements = seeds.split(';');
  for(let i=0; i<seedStatements.length; i++) {
    const s = seedStatements[i].trim();
    if(s) {
       try {
         db.exec(s);
       } catch (e) {
         console.error("FAIL ON STATEMENT " + i + ": " + e.message);
         console.error(s.substring(0, 100) + "...");
       }
    }
  }
} catch (e) {
  console.error("Overall error: ", e);
}
