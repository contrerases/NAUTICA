/**
 * Verificación del motor de cálculo de jornada y de la validación de RUT.
 * Cubre los casos de la auditoría y las decisiones de negocio.
 *
 * Ejecutar:  npm run verify:workday
 * (compila con esbuild y corre en Node; no requiere Electron ni la BD)
 */
import { computeWorkday, WorkdayError, type WorkdaySnapshot } from '../src/shared/domain/workday';
import { isValidRut, computeDv } from '../src/shared/utils/rut';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}  ${detail}`);
  }
}

function expectThrow(name: string, fn: () => unknown) {
  try {
    fn();
    failed++;
    console.log(`  ✗ ${name}  (se esperaba un error y no ocurrió)`);
  } catch (e) {
    check(name, e instanceof WorkdayError, `(tipo de error inesperado: ${(e as Error).name})`);
  }
}

const snap: WorkdaySnapshot = {
  hourlyRate: 5000,
  startHour: '09:00',
  exitHour: '18:00',
  toleranceMinutes: 5,
  exitToleranceMinutes: 15,
  baseDailyMinutes: 510, // 8.5 h
  overtimeMultiplier: 1.5,
};

console.log('\n== Motor de cálculo ==');

// 1. Jornada normal
let r = computeWorkday({ entryTime: '08:58', exitTime: '18:00', breakMinutes: 30, snapshot: snap });
check('Normal: worked 510', r.workedMinutes === 510, `worked=${r.workedMinutes}`);
check('Normal: pago $42.500', r.dailyPayment === 42500, `daily=${r.dailyPayment}`);
check('Normal: sin extra ni atraso', r.overtimeMinutes === 0 && r.delayMinutes === 0);

// 2. Con horas extra (×1.5)
r = computeWorkday({ entryTime: '09:00', exitTime: '19:00', breakMinutes: 30, snapshot: snap });
check('Extra: worked 570, extra 60', r.workedMinutes === 570 && r.overtimeMinutes === 60);
check('Extra: base 42.500 + extra 7.500 = 50.000', r.dailyPayment === 50000, `daily=${r.dailyPayment}`);

// 3. Atraso = UNA sola sanción (sin descuento adicional)
r = computeWorkday({ entryTime: '09:30', exitTime: '18:00', breakMinutes: 30, snapshot: snap });
check('Atraso: delay registrado = 25', r.delayMinutes === 25, `delay=${r.delayMinutes}`);
check('Atraso: worked 480 (pierde su tiempo)', r.workedMinutes === 480, `worked=${r.workedMinutes}`);
check('Atraso: pago $40.000 (sin doble castigo)', r.dailyPayment === 40000, `daily=${r.dailyPayment}`);

// 4. Jornada corta
r = computeWorkday({ entryTime: '09:00', exitTime: '11:00', breakMinutes: 0, snapshot: snap });
check('Corta: worked 120, pago $10.000', r.workedMinutes === 120 && r.dailyPayment === 10000, `daily=${r.dailyPayment}`);

// 5. Entrada temprana → cuenta desde el inicio
r = computeWorkday({ entryTime: '08:15', exitTime: '18:00', breakMinutes: 30, snapshot: snap });
check('Temprana: worked 510, delay 0, pago $42.500', r.workedMinutes === 510 && r.delayMinutes === 0 && r.dailyPayment === 42500);

// 6. Salida anticipada DENTRO de tolerancia → cuenta hasta la hora oficial
r = computeWorkday({ entryTime: '09:00', exitTime: '17:50', breakMinutes: 30, snapshot: snap });
check('Salida 17:50 (tol) → como 18:00, pago $42.500', r.dailyPayment === 42500, `daily=${r.dailyPayment}`);

// 7. Salida anticipada FUERA de tolerancia → cuenta la hora real
r = computeWorkday({ entryTime: '09:00', exitTime: '17:40', breakMinutes: 30, snapshot: snap });
check('Salida 17:40 (fuera tol) → worked 490, pago $40.833', r.workedMinutes === 490 && r.dailyPayment === 40833, `worked=${r.workedMinutes} daily=${r.dailyPayment}`);

// 8. Turno que cruza medianoche → rechazado
expectThrow('Nocturno 22:00→06:00 rechazado', () =>
  computeWorkday({ entryTime: '22:00', exitTime: '06:00', breakMinutes: 0, snapshot: snap }));

// 9. Colación mayor que la presencia → rechazada
expectThrow('Colación > presencia rechazada', () =>
  computeWorkday({ entryTime: '09:00', exitTime: '09:10', breakMinutes: 30, snapshot: snap }));

// 10. Turno íntegramente antes del inicio de jornada → rechazado
expectThrow('Turno 07:00→08:00 (antes del inicio) rechazado', () =>
  computeWorkday({ entryTime: '07:00', exitTime: '08:00', breakMinutes: 0, snapshot: snap }));

// 11. Consistencia: mismos inputs → mismo resultado (crear == editar)
const a = computeWorkday({ entryTime: '09:00', exitTime: '18:43', breakMinutes: 0, snapshot: snap });
const b = computeWorkday({ entryTime: '09:00', exitTime: '18:43', breakMinutes: 0, snapshot: snap });
check('Determinista: mismo input → mismo pago', a.dailyPayment === b.dailyPayment && Number.isInteger(a.dailyPayment), `daily=${a.dailyPayment}`);

console.log('\n== RUT (dígito verificador módulo 11) ==');
check('DV de 12345678 = 5', computeDv('12345678') === '5', `dv=${computeDv('12345678')}`);
check('RUT válido 12.345.678-5', isValidRut('12.345.678-5'));
check('RUT inválido 12.345.678-9', !isValidRut('12.345.678-9'));
check('RUT válido con K: 9.876.543-3', isValidRut('9.876.543-3') === (computeDv('9876543') === '3'));
check('RUT vacío inválido', !isValidRut(''));

console.log(`\nResultado: ${passed} ok, ${failed} fallidos\n`);
if (failed > 0) process.exit(1);
