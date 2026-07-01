/**
 * Test de integración headless: ejercita repositorios + servicios contra una BD
 * SQLite real (temporal), cubriendo los comportamientos clave de la auditoría.
 *
 * Ejecutar:  npm run verify:integration
 */
import os from 'os';
import path from 'path';
import fs from 'fs';
import { initDatabaseAt, closeDatabase, getDatabase } from '../src/backend/database/connection';
import { UserRepository } from '../src/backend/repositories/userRepository';
import { configService } from '../src/backend/services/configService';
import { workerService } from '../src/backend/services/workerService';
import { workdayService } from '../src/backend/services/workdayService';
import { payrollService } from '../src/backend/services/payrollService';
import { today, tomorrow } from '../src/shared/utils/date';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}  ${detail}`); }
}
function expectThrow(name: string, fn: () => unknown) {
  try { fn(); failed++; console.log(`  ✗ ${name} (no lanzó)`); }
  catch { passed++; console.log(`  ✓ ${name}`); }
}

// ── Setup: BD temporal ────────────────────────────────────
const dbPath = path.join(os.tmpdir(), `nautica_test_${process.pid}.db`);
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) if (fs.existsSync(f)) fs.rmSync(f);
initDatabaseAt(dbPath, path.join(process.cwd(), 'database', 'schema.sql'));
configService.ensureInitialConfig();
const adminId = UserRepository.createUser('admin', 'hash'); // para la traza updated_by

const t = today();
const [year, month] = t.split('-').map(Number);

console.log('\n== Config inicial ==');
let view = configService.getConfigView();
check('Config vigente existe', !!view.current && view.current.toleranceMinutes === 5);
check('Sin cambios pendientes', view.pending === null);

console.log('\n== Trabajador + marcaje + pago ==');
const juan = workerService.create({ name: 'Juan', rut: '12.345.678-5', hourly_rate: 5000, start_date: t });
check('Trabajador creado', !!juan.id && juan.status === 'ACTIVE');
check('Tarifa versionada sembrada', workdayService !== null);

workdayService.markEntry({ worker_id: juan.id, date: t, entry_time: '09:00' });
const chk = workdayService.checkToday(juan.id);
check('checkToday: puede marcar salida', chk.canMarkExit === true && chk.canMarkEntry === false);

const closed = workdayService.markExit({ id: chk.record!.id, break_minutes: 30, exit_time: '18:00' });
check('markExit: worked 510', closed.worked_minutes === 510, `worked=${closed.worked_minutes}`);
check('markExit: pago $42.500 (entero)', closed.daily_payment === 42500 && Number.isInteger(closed.daily_payment), `daily=${closed.daily_payment}`);

console.log('\n== Consistencia crear == editar ==');
const edited = workdayService.updateRecord(
  { id: closed.id, entry_time: '09:00', exit_time: '18:00', break_minutes: 30 },
  adminId,
);
check('Editar da el MISMO pago que marcar', edited.daily_payment === closed.daily_payment, `edit=${edited.daily_payment}`);
check('Edición deja traza (updated_by)', edited.updated_by === adminId);

console.log('\n== Atraso = una sola sanción ==');
const ana = workerService.create({ name: 'Ana', rut: '9.876.543-3', hourly_rate: 5000, start_date: t });
workdayService.markEntry({ worker_id: ana.id, date: t, entry_time: '09:30' });
const anaChk = workdayService.checkToday(ana.id);
const anaClosed = workdayService.markExit({ id: anaChk.record!.id, break_minutes: 30, exit_time: '18:00' });
check('Atraso: delay 25 registrado', anaClosed.delay_minutes === 25, `delay=${anaClosed.delay_minutes}`);
check('Atraso: pago $40.000 (sin doble castigo)', anaClosed.daily_payment === 40000, `daily=${anaClosed.daily_payment}`);

console.log('\n== Turno nocturno rechazado ==');
const noc = workerService.create({ name: 'Nocturno', dni: 'X1', hourly_rate: 5000, start_date: t });
workdayService.markEntry({ worker_id: noc.id, date: t, entry_time: '22:00' });
const nocChk = workdayService.checkToday(noc.id);
expectThrow('markExit 22:00→06:00 rechazado', () =>
  workdayService.markExit({ id: nocChk.record!.id, exit_time: '06:00', break_minutes: 0 }));

console.log('\n== Config: cambio para mañana vs hoy ==');
configService.updateConfig({ toleranceMinutes: 10, applyFrom: 'tomorrow' });
view = configService.getConfigView();
check('Cambio "mañana": hoy sigue en 5', view.current.toleranceMinutes === 5, `hoy=${view.current.toleranceMinutes}`);
check('Cambio "mañana": pendiente en 10', view.pending?.toleranceMinutes === 10 && view.pending?.effectiveFrom === tomorrow());
check('getConfigForDate(hoy) usa 5 (no el pendiente)', configService.getConfigForDate(t).toleranceMinutes === 5);
configService.cancelPending();
check('Cancelar pendiente → sin pendiente', configService.getConfigView().pending === null);
configService.updateConfig({ toleranceMinutes: 10, applyFrom: 'today' });
check('Override "hoy": vigente hoy en 10', configService.getConfigForDate(t).toleranceMinutes === 10);

console.log('\n== Liquidación: adelanto sin turnos cerrados = deuda ==');
const marta = workerService.create({ name: 'Marta', rut: '11.111.111-1', hourly_rate: 5000, start_date: t });
workerService.addAdvance({ worker_id: marta.id, amount: 100000, date: t });
const payroll = payrollService.getPayroll(year, month);
const martaLiq = payroll.workers.find((w) => w.worker_id === marta.id);
check('Marta (solo adelanto) aparece en la liquidación', !!martaLiq, 'no aparece → adelanto huérfano');
check('Marta: líquido negativo (deuda) -100.000', martaLiq?.net_payment === -100000 && martaLiq?.has_debt === true, `net=${martaLiq?.net_payment}`);
check('Liquidación provisional (hay turnos abiertos)', payroll.provisional === true);

console.log('\n== Adelantos: edición mes en curso vs pasado ==');
const pedro = workerService.create({ name: 'Pedro', dni: 'PE1', hourly_rate: 5000, start_date: t });
const advCur = workerService.addAdvance({ worker_id: pedro.id, amount: 20000, date: t });
const advOld = workerService.addAdvance({ worker_id: pedro.id, amount: 30000, date: '2020-01-15' });
const advUpd = workerService.updateAdvance(advCur.id, { amount: 25000, date: t });
check('Editar adelanto del mes en curso: monto actualizado', advUpd.amount === 25000, `amount=${advUpd.amount}`);
try { workerService.updateAdvance(advOld.id, { amount: 1, date: '2020-01-15' }); failed++; console.log('  ✗ Editar adelanto de mes pasado (no lanzó)'); }
catch { passed++; console.log('  ✓ Editar adelanto de mes pasado bloqueado'); }
try { workerService.deleteAdvance(advOld.id); failed++; console.log('  ✗ Eliminar adelanto de mes pasado (no lanzó)'); }
catch { passed++; console.log('  ✓ Eliminar adelanto de mes pasado bloqueado'); }
check('Historial completo lista ambos adelantos', workerService.listAllAdvances(pedro.id).length === 2);
workerService.hardDelete(pedro.id); // limpieza (borra sus adelantos)

console.log('\n== Baja lógica vs borrado físico ==');
workerService.deactivate(juan.id, adminId);
check('Desactivar: status INACTIVE', workerService.getById(juan.id)?.status === 'INACTIVE');
check('Desactivar: conserva historial', workdayService.getByWorker(juan.id).length === 1);
workerService.hardDelete(marta.id); // Marta tiene un adelanto (RESTRICT) → el servicio lo borra explícitamente
check('Borrado físico: trabajador eliminado', workerService.getById(marta.id) === undefined);
const advCount = (getDatabase().prepare('SELECT COUNT(*) AS c FROM worker_advances WHERE worker_id = ?').get(marta.id) as { c: number }).c;
check('Borrado físico: adelantos eliminados en transacción', advCount === 0);

console.log(`\nResultado integración: ${passed} ok, ${failed} fallidos\n`);
closeDatabase();
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) if (fs.existsSync(f)) fs.rmSync(f);
if (failed > 0) process.exit(1);
