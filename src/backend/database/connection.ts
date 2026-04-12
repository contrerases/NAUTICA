import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * Conexión singleton a la base de datos SQLite (usando better-sqlite3)
 */

let db: Database.Database | null = null

/**
 * Obtiene la ruta del archivo de base de datos
 */
function getDatabasePath() {
  if (app.isPackaged) {
    const userDataPath = app.getPath('userData')
    return path.join(userDataPath, 'nautica.db')
  } else {
    return path.join(process.cwd(), 'nautica.db')
  }
}

/**
 * Inicializa la base de datos
 */
async function initDatabase() {
  if (db) {
    return db
  }

  const dbPath = getDatabasePath()
  const isFirstRun = !fs.existsSync(dbPath)

  console.log(`[DB] Inicializando base de datos en: ${dbPath}`)
  console.log(`[DB] Primera ejecución: ${isFirstRun}`)

  // Conectar usando better-sqlite3
  db = new Database(dbPath, {
    // verbose: console.log // útil para debug
  })

  // Configurar pragmas críticos de rendimiento
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  if (isFirstRun) {
    console.log('[DB] Ejecutando migraciones iniciales...')
    runMigrations(db)
  }

  console.log('[DB] Base de datos inicializada correctamente')
  return db
}

function forceRunMigrations(database: Database.Database) {
  // Limpiamos las tablas actuales 
  try {
    database.exec(`
      PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS attendance_records;
      DROP TABLE IF EXISTS worker_advances;
      DROP TABLE IF EXISTS workers;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS app_config;
      PRAGMA foreign_keys = ON;
    `);
    runMigrations(database);
  } catch (error) {
    console.error("Error forzando re-seed:", error);
  }
}

function runMigrations(database: Database.Database) {
  let sqlPath
  if (app.isPackaged) {
    sqlPath = path.join(process.resourcesPath, 'database', 'nautica_jornada.sql')
  } else {
    sqlPath = path.join(process.cwd(), 'database', 'nautica_jornada.sql')       
  }

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Archivo de migraciones no encontrado: ${sqlPath}`)
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8')
  database.exec(sql)
  console.log('[DB] Esquema base ejecutado correctamente')

  // Ejecutar script de semillas (datos de prueba/configuración)
  let seedsPath
  if (app.isPackaged) {
    seedsPath = path.join(process.resourcesPath, 'database', 'seeds.sql')
  } else {
    seedsPath = path.join(process.cwd(), 'database', 'seeds.sql')
  }

  if (fs.existsSync(seedsPath)) {
    const seedsSql = fs.readFileSync(seedsPath, 'utf-8')
    const statements = seedsSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (let i = 0; i < statements.length; i++) {
      try {
        database.exec(statements[i]);
      } catch (err: any) {
        console.error(`[DB] Error en el seed statement ${i}:`, err.message);
        console.error(`[DB] Statement fallido: ${statements[i].substring(0, 100)}...`);
      }
    }
    console.log('[DB] Seeds ejecutados correctamente')
  } else {
    console.warn('[DB] Archivo de seeds no encontrado, omitiendo...', seedsPath)
  }
}

/**
 * Mocks de compatibilidad. better-sqlite3 autoguarda,
 * por lo que no es necesario exportar buffers a disco.
 */
function saveDatabase() {
  // Ya no hace nada, SQLite escribe a disco directamente
}

function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llamar a initDatabase() primero.')
  }
  return db
}

function closeDatabase() {
  if (db) {
    console.log('[DB] Cerrando conexión...')
    db.pragma('wal_checkpoint(RESTART)') // Forza a consolidar el log a la DB antes de cerrar
    db.close()
    db = null
  }
}

export {
  initDatabase,
  saveDatabase,
  getDatabase,
  closeDatabase
}
