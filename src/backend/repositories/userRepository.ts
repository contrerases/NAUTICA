import { getDatabase } from '../database/connection'

export class UserRepository {
  static findByUsername(username: string): any {
    const db = getDatabase()
    const stmt = db.prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ?')
    const row = stmt.get(username) as any
    
    if (row) {
      return {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        createdAt: row.created_at
      }
    }
    return null
  }

  static countUsers(): number {
    const db = getDatabase()
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users')
    const result = stmt.get() as any
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
