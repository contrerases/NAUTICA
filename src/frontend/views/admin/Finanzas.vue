<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <PageHeader
      title="Finanzas y Pagos"
      subtitle="Resumen mensual para cálculo de remuneraciones y exportación a Excel."
    >
      <template #actions>
        <BaseButton variant="outline" @click="openAdvanceModal">
          <template #icon-left>
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          </template>
          Ade.
        </BaseButton>
        <BaseButton variant="primary" @click="exportExcel" :disabled="loading || exporting || workers.length === 0 || provisional">
          <template #icon-left>
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </template>
          Exportar Liquidación
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Barra de Filtros -->
    <BaseCard padding="base" class="bg-surface-muted border-none w-full">
      <div class="flex flex-row items-end gap-4 w-full">
        <BaseInput
          v-model="filterMonth"
          id="filter-month"
          type="month"
          label="Mes a Liquidar"
          class="w-64"
        />

        <div class="flex-1 flex justify-end gap-3">
          <StatCard
            label="Monto Total Sueldos"
            :value="formatCLP(totalNet)"
            color="primary"
            class="w-64"
          />
        </div>
      </div>
    </BaseCard>

    <!-- Alertas Generales -->
    <div class="flex flex-col gap-3 mb-4" v-if="errorGlobal || successGlobal">
      <BaseAlert
        v-if="errorGlobal"
        type="error"
        :title="'Error en Finanzas'"
        :message="errorGlobal"
        dismissible
      />
      <BaseAlert
        v-if="successGlobal"
        type="success"
        :title="'Éxito'"
        :message="successGlobal"
        dismissible
      />
    </div>

    <!-- Banner de liquidación provisional -->
    <div class="flex flex-col gap-3 mb-4">
      <div class="text-danger flex flex-col font-bold text-sm bg-danger/10 p-4 rounded-xl border border-danger/20" v-if="provisional">
        <span>⚠️ Atención: esta liquidación es PROVISIONAL. Existen turnos en este mes que aún no tienen hora de salida registrada, por lo que sus pagos todavía no se suman. No podrás exportar hasta darles cierre.</span>
        <span class="font-normal text-xs opacity-90 mt-1 italic">Ve a la pestaña de 'Historial', presiona el botón del lápiz en esos registros y ponles la hora de salida.</span>
      </div>
    </div>

    <!-- Tabla de Finanzas Agrupada -->
    <BaseCard class="flex-1 overflow-hidden" padding="none">
      <BaseTable
        :columns="tableColumns"
        :data="workers"
        @row-click="showWorkerDetails"
        :loading="loading"
        class="h-full"
      >
        <template #cell-worker_name="{ row }">
          <div class="font-bold text-text-base">
            {{ row.worker_name }}
          </div>
        </template>
        <template #cell-days="{ row }">
          {{ row.days_worked }} Días
        </template>
        <template #cell-total_hours="{ row }">
          <span class="text-text-base font-bold">{{ formatDuration(row.total_minutes) }}</span>
        </template>
        <template #cell-overtime="{ row }">
          <span class="text-amber-500 font-bold" v-if="row.overtime_minutes > 0">
            {{ formatDuration(row.overtime_minutes) }}
          </span>
          <span v-else class="text-text-muted/50">-</span>
        </template>
        <template #cell-base_pay="{ row }">
          {{ formatCLP(row.base_payment) }}
        </template>
        <template #cell-overtime_pay="{ row }">
          <span v-if="row.overtime_payment > 0" class="text-amber-500 font-bold">+{{ formatCLP(row.overtime_payment) }}</span>
          <span v-else class="text-text-muted/50">-</span>
        </template>
        <template #cell-advances_amount="{ row }">
          <span v-if="row.advances_amount > 0" class="text-danger font-bold">-{{ formatCLP(row.advances_amount) }}</span>
          <span v-else class="text-text-muted/50">-</span>
        </template>
        <template #cell-total_pay="{ row }">
          <span
            class="font-black text-lg"
            :class="row.has_debt ? 'text-danger' : 'text-primary'"
          >{{ formatCLP(row.net_payment) }}</span>
          <span v-if="row.has_debt" class="block text-[10px] font-bold uppercase text-danger">Deuda</span>
        </template>
      </BaseTable>
    </BaseCard>

    <!-- Modal para el detalle del trabajador -->
    <Teleport to="body">
      <div v-if="selectedWorker" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="bg-surface w-full max-w-4xl rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-full">
          <!-- Cabecera -->
          <div class="px-6 py-4 border-b border-surface-border flex justify-between items-center bg-body">
            <h3 class="text-xl font-bold text-text-base">Detalle de Asistencia: {{ selectedWorker.worker_name }}</h3>
            <button @click="selectedWorker = null" class="text-text-muted hover:text-text-base">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <!-- Cuerpo -->
          <div class="p-6 overflow-y-auto flex-1">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-sm">
              <StatCard label="Días Trabajados" :value="selectedWorker.days_worked" color="neutral" />
              <StatCard label="Horas Totales" :value="formatDuration(selectedWorker.total_minutes)" color="neutral" />
              <StatCard label="Sueldo Base" :value="formatCLP(selectedWorker.base_payment)" color="primary" />
              <StatCard label="Pago Extras" :value="formatCLP(selectedWorker.overtime_payment)" color="warning" />
              <StatCard label="Adelantos (Descuento)" :value="`-${formatCLP(selectedWorker.advances_amount)}`" color="danger" />
              <BaseCard
                class="text-center md:col-span-3 text-body"
                :class="selectedWorker.has_debt ? 'bg-danger border-danger' : 'bg-primary border-primary'"
                padding="sm"
              >
                <span class="block opacity-80 mb-1 text-xs">{{ selectedWorker.has_debt ? 'Deuda del Trabajador' : 'Líquido a Pagar' }}</span>
                <span class="font-black text-2xl">{{ formatCLP(selectedWorker.net_payment) }}</span>
              </BaseCard>
            </div>

            <h4 class="font-bold text-text-base mb-3 border-b border-surface-border pb-2">Registro Diario ({{ filterMonth }})</h4>
            <table class="w-full text-sm text-left border border-surface-border rounded-lg overflow-hidden">
              <thead class="bg-surface-muted text-text-muted uppercase text-xs">
                <tr>
                  <th class="px-4 py-2 border-b border-surface-border">Fecha</th>
                  <th class="px-4 py-2 border-b border-surface-border">Entrada</th>
                  <th class="px-4 py-2 border-b border-surface-border">Salida</th>
                  <th class="px-4 py-2 border-b border-surface-border text-center">H. Base</th>
                  <th class="px-4 py-2 border-b border-surface-border text-center">H. Ext.</th>
                  <th class="px-4 py-2 border-b border-surface-border text-right">Pago Día</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-border">
                <tr v-if="detailLoading">
                  <td colspan="6" class="px-4 py-4 text-center text-text-muted">Cargando registros...</td>
                </tr>
                <tr v-else-if="selectedWorkerRecords.length === 0">
                  <td colspan="6" class="px-4 py-4 text-center text-text-muted">No hay registros trabajados.</td>
                </tr>
                <tr v-for="rec in selectedWorkerRecords" :key="rec.id" class="hover:bg-surface-hover">
                  <td class="px-4 py-2 font-mono">{{ rec.date }}</td>
                  <td class="px-4 py-2">{{ rec.entry_time }}</td>
                  <td class="px-4 py-2">{{ rec.exit_time || '?' }}</td>
                  <td class="px-4 py-2 text-center">{{ rec.worked_minutes !== null ? formatDuration(rec.worked_minutes) : '-' }}</td>
                  <td class="px-4 py-2 text-center text-amber-500">{{ rec.overtime_minutes > 0 ? formatDuration(rec.overtime_minutes) : '-' }}</td>
                  <td class="px-4 py-2 text-right font-bold text-primary">{{ formatCLP(rec.daily_payment || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pie -->
          <div class="px-6 py-4 border-t border-surface-border bg-body flex justify-end">
            <BaseButton variant="secondary" @click="selectedWorker = null">Cerrar</BaseButton>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Registrar Adelanto -->
    <BaseModal
      :is-open="isAdvanceModalOpen"
      @close="isAdvanceModalOpen = false"
      title="Registrar Adelanto"
      max-width="sm"
    >
      <div class="p-6">
        <BaseAlert v-if="advanceError" type="error" :message="advanceError" class="mb-4" />

        <form @submit.prevent="submitAdvance" class="space-y-4">
          <BaseSelect v-model="advanceData.worker_id" label="Trabajador *" required>
            <option value="" disabled>Seleccione trabajador</option>
            <option v-for="w in activeWorkers" :key="w.id" :value="w.id">{{ w.name }}</option>
          </BaseSelect>

          <BaseInput v-model.number="advanceData.amount" type="number" label="Monto del Adelanto ($)" required min="1" step="1" />
          <BaseInput v-model="advanceData.date" type="date" label="Fecha" required />
          <BaseInput v-model="advanceData.notes" type="text" label="Notas/Motivo (Opcional)" />

          <div class="flex justify-end gap-3 pt-4 border-t border-surface-border mt-4">
            <BaseButton type="button" variant="outline" @click="isAdvanceModalOpen = false" :disabled="advanceLoading">Cancelar</BaseButton>
            <BaseButton type="submit" variant="primary" :is-loading="advanceLoading">Registrar</BaseButton>
          </div>
        </form>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { AttendanceRecord, Worker, WorkerLiquidation } from '@shared/types';
import { formatCLP } from '@shared/utils/money';
import { formatDuration } from '@shared/utils/time';
import { today, currentMonth } from '@shared/utils/date';
import { api } from '../../api';

import {
  BaseCard,
  BaseTable,
  BaseButton,
  BaseInput,
  BaseModal,
  BaseAlert,
  BaseSelect,
  PageHeader,
  StatCard,
} from '../../components/ui';

// Variables Reactivas
const workers = ref<WorkerLiquidation[]>([]);
const provisional = ref(false);
const totalGross = ref(0);
const totalAdvances = ref(0);
const totalNet = ref(0);
const activeWorkers = ref<Worker[]>([]); // Para el select de adelantos
const loading = ref(true);
const exporting = ref(false);
const errorGlobal = ref('');
const successGlobal = ref('');
const selectedWorker = ref<WorkerLiquidation | null>(null);

// Selector de mes (YYYY-MM)
const filterMonth = ref(currentMonth());

const monthParts = computed(() => {
  const [y, m] = filterMonth.value.split('-');
  return { year: parseInt(y, 10), month: parseInt(m, 10) };
});

// ================= LIQUIDACIÓN MENSUAL =================
const loadPayroll = async () => {
  if (!filterMonth.value) return;
  loading.value = true;
  errorGlobal.value = '';
  try {
    const { year, month } = monthParts.value;
    const summary = await api.report.payroll(year, month);
    workers.value = summary.workers;
    provisional.value = summary.provisional;
    totalGross.value = summary.total_gross;
    totalAdvances.value = summary.total_advances;
    totalNet.value = summary.total_net;
  } catch (err: any) {
    console.error('Error cargando la liquidación mensual:', err);
    errorGlobal.value = err.message || 'No se pudo cargar la liquidación del mes.';
    workers.value = [];
    provisional.value = false;
    totalGross.value = 0;
    totalAdvances.value = 0;
    totalNet.value = 0;
  } finally {
    loading.value = false;
  }
};

// Trabajadores activos para el selector de adelantos
const loadActiveWorkers = async () => {
  try {
    activeWorkers.value = await api.workers.getActive();
  } catch (err: any) {
    console.error('Error cargando trabajadores activos:', err);
  }
};

// ================= DETALLE POR TRABAJADOR =================
const selectedWorkerRecords = ref<AttendanceRecord[]>([]);
const detailLoading = ref(false);

const showWorkerDetails = async (row: any) => {
  selectedWorker.value = row as WorkerLiquidation;
  selectedWorkerRecords.value = [];
  detailLoading.value = true;
  try {
    const records = await api.attendance.getByWorker(selectedWorker.value.worker_id);
    selectedWorkerRecords.value = records
      .filter((r) => r.date.startsWith(filterMonth.value))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (err: any) {
    console.error('Error cargando el detalle del trabajador:', err);
    errorGlobal.value = err.message || 'No se pudo cargar el detalle del trabajador.';
  } finally {
    detailLoading.value = false;
  }
};

// ================= EXPORTAR A EXCEL =================
const exportExcel = async () => {
  errorGlobal.value = '';
  if (provisional.value) {
    errorGlobal.value = 'No puedes exportar: la liquidación es provisional (hay turnos sin salida).';
    return;
  }
  if (workers.value.length === 0) {
    errorGlobal.value = 'No hay datos para exportar el mes seleccionado.';
    return;
  }

  exporting.value = true;
  try {
    const { year, month } = monthParts.value;
    const result = await api.report.exportExcel(year, month);
    if (result.canceled) {
      successGlobal.value = 'Exportación cancelada.';
    } else {
      successGlobal.value = `Exportación de ${filterMonth.value} guardada en: ${result.path}`;
    }
    setTimeout(() => { successGlobal.value = ''; }, 5000);
  } catch (err: any) {
    console.error('Error al exportar la liquidación:', err);
    errorGlobal.value = err.message || 'Falló la exportación del archivo.';
  } finally {
    exporting.value = false;
  }
};

// ================= ADELANTOS =================
const isAdvanceModalOpen = ref(false);
const advanceLoading = ref(false);
const advanceError = ref('');
const advanceData = ref({
  worker_id: '' as number | '',
  amount: 0,
  date: today(),
  notes: '',
});

const openAdvanceModal = () => {
  advanceError.value = '';
  advanceData.value = { worker_id: '', amount: 0, date: today(), notes: '' };
  isAdvanceModalOpen.value = true;
};

const submitAdvance = async () => {
  advanceError.value = '';

  if (!advanceData.value.worker_id || advanceData.value.amount <= 0) {
    advanceError.value = 'Complete los datos requeridos. El monto debe ser mayor a 0.';
    return;
  }

  advanceLoading.value = true;
  try {
    await api.workers.addAdvance({
      worker_id: Number(advanceData.value.worker_id),
      amount: Math.round(Number(advanceData.value.amount)),
      date: advanceData.value.date,
      notes: advanceData.value.notes || null,
    });

    successGlobal.value = 'Adelanto registrado exitosamente';
    setTimeout(() => (successGlobal.value = ''), 3000);
    isAdvanceModalOpen.value = false;

    // Reiniciar formulario y refrescar la liquidación del mes
    advanceData.value = { worker_id: '', amount: 0, date: today(), notes: '' };
    await loadPayroll();
  } catch (e: any) {
    advanceError.value = e.message || 'Error al registrar el adelanto';
  } finally {
    advanceLoading.value = false;
  }
};

// ================= UI Components Config =================
const tableColumns = [
  { key: 'worker_name', label: 'Trabajador' },
  { key: 'days', label: 'Días Asistidos', align: 'center' as const },
  { key: 'total_hours', label: 'Horas Base', align: 'center' as const },
  { key: 'overtime', label: 'Horas Extra', align: 'center' as const },
  { key: 'base_pay', label: 'Sueldo Base', align: 'right' as const },
  { key: 'overtime_pay', label: 'Pago Extras', align: 'right' as const },
  { key: 'advances_amount', label: 'Adelantos', align: 'right' as const },
  { key: 'total_pay', label: 'Líquido ($)', align: 'right' as const },
];

// Al cambiar el mes, recargar la liquidación
watch(filterMonth, () => {
  loadPayroll();
});

onMounted(() => {
  loadPayroll();
  loadActiveWorkers();
});
</script>
