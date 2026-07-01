import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

/**
 * Conexión singleton a SQLite (better-sqlite3).
 * El esquema es idempotente (CREATE ... IF NOT EXISTS), así que se ejecuta en
 * cada arranque sin riesgo. El sembrado de datos (config inicial, admin) lo
 * hacen los servicios al iniciar.
 */

let db: Database.Database | null = null

function getDatabasePath(): string {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'nautica.db')
  }
  return path.join(process.cwd(), 'nautica.db')
}

function getSchemaPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'database', 'schema.sql')
  }
  return path.join(process.cwd(), 'database', 'schema.sql')
}

export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = getDatabasePath()
  console.log(`[DB] Inicializando base de datos en: ${dbPath}`)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  const schemaPath = getSchemaPath()
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Esquema no encontrado: ${schemaPath}`)
  }
  db.exec(fs.readFileSync(schemaPath, 'utf-8'))
  console.log('[DB] Esquema aplicado correctamente')

  return db
}

/**
 * Inicializa la BD en una ruta explícita sin depender de Electron.
 * Uso: pruebas de integración headless.
 */
export function initDatabaseAt(dbPath: string, schemaPath: string): Database.Database {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(schemaPath, 'utf-8'))
  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Base de datos no inicializada. Llamar a initDatabase() primero.')
  return db
}

/** Copia la base de datos a `destPath` (consolidando el WAL primero). Para respaldos. */
export function backupDatabase(destPath: string): void {
  if (!db) throw new Error('Base de datos no inicializada.')
  db.pragma('wal_checkpoint(TRUNCATE)')
  fs.copyFileSync(getDatabasePath(), destPath)
}

export function closeDatabase(): void {
  if (db) {
    console.log('[DB] Cerrando conexión...')
    db.pragma('wal_checkpoint(RESTART)')
    db.close()
    db = null
  }
}
