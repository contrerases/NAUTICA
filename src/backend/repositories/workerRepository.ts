import { getDatabase } from '../database/connection';
import type { Worker, CreateWorkerDto, UpdateWorkerDto, WorkerIdentityDto, WorkerStatus } from '../../shared/types/worker';

export class WorkerRepository {
  getAll(): Worker[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM workers ORDER BY name ASC').all() as Worker[];
  }

  getActive(): Worker[] {
    const db = getDatabase();
    return db.prepare("SELECT * FROM workers WHERE status = 'ACTIVE' ORDER BY name ASC").all() as Worker[];
  }

  findById(id: number): Worker | undefined {
    const db = getDatabase();
    return db.prepare('SELECT * FROM workers WHERE id = ?').get(id) as Worker | undefined;
  }

  findByIdentity(identity: WorkerIdentityDto): Worker | undefined {
    const db = getDatabase();
    if (identity.documentType === 'RUT') {
      return db.prepare("SELECT * FROM workers WHERE rut = ? AND status = 'ACTIVE'").get(identity.documentValue) as Worker | undefined;
    } else {
      return db.prepare("SELECT * FROM workers WHERE dni = ? AND status = 'ACTIVE'").get(identity.documentValue) as Worker | undefined;
    }
  }

  create(data: CreateWorkerDto): Worker {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO workers (name, rut, dni, photo, hourly_rate, start_date)
      VALUES (@name, @rut, @dni, @photo, @hourly_rate, @start_date)
    `);

    try {
      const info = stmt.run({
        name: data.name,
        rut: data.rut || null,
        dni: data.dni || null,
        photo: data.photo || null,
        hourly_rate: data.hourly_rate,
        start_date: data.start_date
      });
      return this.findById(info.lastInsertRowid as number)!;
    } catch (e: any) {
      if (e.message && e.message.includes('UNIQUE constraint failed')) {
        if (e.message.includes('rut')) throw new Error('El RUT ingresado ya está asociado a otro trabajador.');
        if (e.message.includes('dni')) throw new Error('El DNI ingresado ya está asociado a otro trabajador.');
        throw new Error('El documento ingresado ya está registrado.');
      }
      throw e;
    }
  }

  update(id: number, data: UpdateWorkerDto, adminId?: number): Worker | undefined {
    const worker = this.findById(id);
    if (!worker) return undefined;

    const db = getDatabase();
    const updates: string[] = [];
    const params: any = { id };

    if (data.name !== undefined) { updates.push('name = @name'); params.name = data.name; }
    if (data.rut !== undefined) { updates.push('rut = @rut'); params.rut = data.rut || null; }
    if (data.dni !== undefined) { updates.push('dni = @dni'); params.dni = data.dni || null; }
    if (data.photo !== undefined) { updates.push('photo = @photo'); params.photo = data.photo || null; }
    if (data.hourly_rate !== undefined) { updates.push('hourly_rate = @hourly_rate'); params.hourly_rate = data.hourly_rate; }
    if (data.start_date !== undefined) { updates.push('start_date = @start_date'); params.start_date = data.start_date; }
    if (data.status !== undefined) { updates.push('status = @status'); params.status = data.status; }

    updates.push("updated_at = datetime('now', 'localtime')");

    if (adminId) {
      updates.push('updated_by = @adminId');
      params.adminId = adminId;
    }

    if (updates.length > 0) {
      const sql = `UPDATE workers SET ${updates.join(', ')} WHERE id = @id`;
      const stmt = db.prepare(sql);
      try {
        stmt.run(params);
      } catch (e: any) {
        if (e.message && e.message.includes('UNIQUE constraint failed')) {
          if (e.message.includes('rut')) throw new Error('El RUT ingresado ya está asociado a otro trabajador.');
          if (e.message.includes('dni')) throw new Error('El DNI ingresado ya está asociado a otro trabajador.');
          throw new Error('El documento ingresado ya está registrado.');
        }
        throw e;
      }
    }

    return this.findById(id);
  }

  changeStatus(id: number, status: WorkerStatus, adminId?: number): boolean {
    const worker = this.findById(id);
    if (!worker) return false;

    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE workers
      SET status = ?, updated_at = datetime('now', 'localtime'), updated_by = ?
      WHERE id = ?
    `);
    stmt.run(status, adminId || null, id);
    return true;
  }

  hardDelete(id: number): boolean {
    const worker = this.findById(id);
    if (!worker) return false;

    const db = getDatabase();

    const deleteTransaction = db.transaction(() => {
      db.prepare("DELETE FROM attendance_records WHERE worker_id = ?").run(id);
      db.prepare("DELETE FROM workers WHERE id = ?").run(id);
    });

    deleteTransaction();
    return true;
  }
}

export const workerRepository = new WorkerRepository();
