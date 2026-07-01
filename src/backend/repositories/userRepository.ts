import { getDatabase } from '../database/connection'

export interface UserRow {
  id: number
  username: string
  passwordHash: string
  createdAt: string
}

export class UserRepository {
  static findByUsername(username: string): UserRow | null {
    const db = getDatabase()
    const row = db
      .prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ?')
      .get(username) as { id: number; username: string; password_hash: string; created_at: string } | undefined

    if (!row) return null
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    }
  }

  static countUsers(): number {
    const db = getDatabase()
    const result = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    return result.count
  }

  static createUser(username: string, passwordHash: string): number {
    const db = getDatabase()
    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    const info = stmt.run(username, passwordHash)
    return info.lastInsertRowid as number
  }

  static updatePassword(username: string, passwordHash: string): void {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE username = ?')
    stmt.run(passwordHash, username)
  }
}
