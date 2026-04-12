import { getDatabase } from '../database/connection'
import type { WorkerAdvance, CreateWorkerAdvanceDto } from '../../shared/types/worker'

export class AdvanceRepository {
  createAdvance(data: CreateWorkerAdvanceDto): WorkerAdvance {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO worker_advances (worker_id, amount, date, notes)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(data.worker_id, data.amount, data.date, data.notes || null)
    return this.getAdvanceById(result.lastInsertRowid as number)!
  }

  getAdvanceById(id: number): WorkerAdvance | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM worker_advances WHERE id = ?')
    return stmt.get(id) as WorkerAdvance || null
  }

  getAdvancesByWorkerAndMonth(workerId: number, year: number, month: number): WorkerAdvance[] {
    const db = getDatabase()
    const monthStr = month.toString().padStart(2, '0')
    const pattern = `${year}-${monthStr}-%`
    
    const stmt = db.prepare(`
      SELECT * FROM worker_advances 
      WHERE worker_id = ? AND date LIKE ? 
      ORDER BY date DESC, created_at DESC
    `)
    return stmt.all(workerId, pattern) as WorkerAdvance[]
  }

  getAdvancesByMonth(year: number, month: number): WorkerAdvance[] {
    const db = getDatabase()
    const monthStr = month.toString().padStart(2, '0')
    const pattern = `${year}-${monthStr}-%`
    
    const stmt = db.prepare(`
      SELECT * FROM worker_advances 
      WHERE date LIKE ? 
      ORDER BY date DESC, created_at DESC
    `)
    return stmt.all(pattern) as WorkerAdvance[]
  }

  deleteAdvance(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM worker_advances WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

export const advanceRepository = new AdvanceRepository()
