<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-text-base">Finanzas y Pagos</h2>
        <p class="text-text-muted mt-1">Resumen mensual para cálculo de remuneraciones y exportación (CSV Excel).</p>
      </div>
      <div class="flex flex-row gap-3">
        <BaseButton variant="outline" @click="isAdvanceModalOpen = true">
          <template #icon-left>
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          </template>
          Ade.
        </BaseButton>
        <BaseButton variant="primary" @click="exportToCSV" :disabled="loading || computedStats.length === 0 || hasUnclosed">
          <template #icon-left>
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </template>
          Exportar Liquidación CSV
        </BaseButton>
      </div>
    </div>

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

        <div class="flex-1 flex justify-end gap-3 font-mono text-sm">
          <div class="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
            <span class="block text-text-muted text-xs font-bold uppercase mb-1">Monto Total Sueldos</span>
            <span class="text-lg font-black text-primary">${{ formatMoney(totalPayroll) }}</span>
          </div>
        </div>
      </div>
    </BaseCard>

    <div class="flex flex-col gap-3 mb-4">
      <div class="text-danger flex flex-col font-bold text-sm bg-danger/10 p-4 rounded-xl border border-danger/20" v-if="hasUnclosed">
        <span>⚠️ Atención: Existen turnos en este mes que aún no tienen hora de salida registrada. No podrás liquidar ni exportar sus pagos hasta darles un cierre.</span>
        <span class="font-normal mt-2 text-text-base">Trabajadores con salida pendiente: <strong class="text-danger">{{ unclosedRecords.map(r => `${r.worker_name} (${r.date})`).join(', ') }}</strong></span>
        <span class="font-normal text-xs opacity-90 mt-1 italic">Ve a la pestaña de 'Historial', presiona el botón del lápiz en esos registros y ponles la hora de salida.</span>
      </div>
    </div>
    <!-- Tabla de Finanzas Agrupada -->
    <BaseCard class="flex-1 overflow-hidden" padding="none">
      <BaseTable
        :columns="tableColumns"
        :data="computedStats"
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
          <span class="text-text-base font-bold">{{ (row.total_minutes / 60).toFixed(2) }} h</span>
        </template>
        <template #cell-overtime="{ row }">
          <span class="text-amber-500 font-bold" v-if="row.total_overtime > 0">
            {{ (row.total_overtime / 60).toFixed(2) }} h
          </span>
          <span v-else class="text-text-muted/50">-</span>
        </template>
        <template #cell-base_pay="{ row }">
          ${{ formatMoney(row.base_payment) }}
        </template>
        <template #cell-overtime_pay="{ row }">
          <span v-if="row.overtime_payment > 0" class="text-amber-500 font-bold">+${{ formatMoney(row.overtime_payment) }}</span>
          <span v-else class="text-text-muted/50">-</span>
        </template>
        <template #cell-advances_amount="{ row }">
          <span v-if="row.advances_amount > 0" class="text-danger font-bold">-${{ formatMoney(row.advances_amount) }}</span>
          <span v-else class="text-text-muted/50">-</span>
        </template>
        <template #cell-total_pay="{ row }">
          <span class="text-primary font-black text-lg">${{ formatMoney(row.total_payment) }}</span>
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
              <BaseCard class="text-center" padding="sm"><span class="block text-text-muted mb-1 text-xs">Días Trabajados</span><span class="font-bold text-lg">{{ selectedWorker.days_worked }}</span></BaseCard>
              <BaseCard class="text-center" padding="sm"><span class="block text-text-muted mb-1 text-xs">Horas Totales</span><span class="font-bold text-lg">{{ (selectedWorker.total_minutes / 60).toFixed(2) }}h</span></BaseCard>
              <BaseCard class="text-center bg-primary/10 border-primary/20" padding="sm"><span class="block text-primary font-bold mb-1 text-xs">Sueldo Base</span><span class="font-black text-lg">${{ formatMoney(selectedWorker.base_payment) }}</span></BaseCard>
              <BaseCard class="text-center bg-amber-500/10 border-amber-500/20" padding="sm"><span class="block text-amber-500 font-bold mb-1 text-xs">Pago Extras</span><span class="font-black text-lg">${{ formatMoney(selectedWorker.overtime_payment) }}</span></BaseCard>
              <BaseCard class="text-center bg-danger/10 border-danger/20" padding="sm"><span class="block text-danger font-bold mb-1 text-xs">Adelantos (Descuento)</span><span class="font-black text-lg">-${{ formatMoney(selectedWorker.advances_amount) }}</span></BaseCard>
              <BaseCard class="text-center bg-primary border-primary md:col-span-3 text-body" padding="sm"><span class="block opacity-80 mb-1 text-xs">Líquido a Pagar</span><span class="font-black text-2xl">${{ formatMoney(selectedWorker.total_payment) }}</span></BaseCard>
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
                <tr v-if="selectedWorkerRecords.length === 0">
                  <td colspan="6" class="px-4 py-4 text-center text-text-muted">No hay registros trabajados.</td>
                </tr>
                <tr v-for="rec in selectedWorkerRecords" :key="rec.id" class="hover:bg-surface-hover">
                  <td class="px-4 py-2 font-mono">{{ rec.date }}</td>
                  <td class="px-4 py-2">{{ rec.entry_time }}</td>
                  <td class="px-4 py-2">{{ rec.exit_time || '?' }}</td>
                  <td class="px-4 py-2 text-center">{{ ((rec.worked_minutes || 0) / 60).toFixed(2) }}h</td>
                  <td class="px-4 py-2 text-center text-amber-500">{{ rec.overtime_minutes > 0 ? (rec.overtime_minutes / 60).toFixed(2) + 'h' : '-' }}</td>
                  <td class="px-4 py-2 text-right font-bold text-primary">${{ formatMoney(rec.daily_payment || 0) }}</td>
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
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-text-base">Trabajador <span class="text-danger">*</span></label>
            <select v-model="advanceData.worker_id" required class="w-full h-[42px] block border border-surface-border rounded-lg bg-surface text-text-base text-sm shadow-sm transition-all outline-none px-4 focus:border-primary focus:ring-2 focus:ring-primary/20">
              <option value="" disabled>Seleccione trabajador</option>
              <!-- Usará los trabajadores listados en computedStats para el modal de manera simple -->
              <option v-for="w in workersList" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>

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
import { AttendanceChannels, WorkerChannels } from '../../../shared/types/ipc';

import BaseCard from '../../components/ui/BaseCard.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import BaseAlert from '../../components/ui/BaseAlert.vue';

interface AttendanceRecord {
  id: number;
  worker_id: number;
  worker_name: string;
  date: string;
  entry_time: string;
  exit_time: string | null;
  status: string;
  worked_minutes: number | null;
  overtime_minutes: number;
  overtime_payment: number;
  daily_payment: number | null;
}

interface WorkerAdvance {
  id: number;
  worker_id: number;
  amount: number;
  date: string;
  notes: string;
}

interface WorkerStat {
  worker_id: number;
  worker_name: string;
  days_worked: number;
  total_minutes: number;
  total_overtime: number;
  base_payment: number;
  overtime_payment: number;
  advances_amount: number;
  total_payment: number;
}

// Variables Reactivas
const attendances = ref<AttendanceRecord[]>([]);
const advancesInfo = ref<WorkerAdvance[]>([]);
const workersList = ref<{id: number, name: string}[]>([]); // Para el select de adelantos
const loading = ref(true);
const errorGlobal = ref('');
const successGlobal = ref('');
const selectedWorker = ref<WorkerStat | null>(null);

// Formulario de Adelantos
const isAdvanceModalOpen = ref(false);
const advanceLoading = ref(false);
const advanceError = ref('');
const strRawNow = new Date().toLocaleDateString('sv-SE', {timeZone: 'America/Santiago'});
const advanceData = ref({
  worker_id: '',
  amount: 0,
  date: strRawNow,
  notes: ''
});

const submitAdvance = async () => {
  advanceLoading.value = true;
  advanceError.value = '';
  
  if (!advanceData.value.worker_id || advanceData.value.amount <= 0) {
    advanceError.value = 'Complete los datos requeridos. El monto debe ser mayor a 0.';
    advanceLoading.value = false;
    return;
  }
  
  try {
    const payload = {
      worker_id: Number(advanceData.value.worker_id),
      amount: Number(advanceData.value.amount),
      date: advanceData.value.date,
      notes: advanceData.value.notes
    };
    
    // Asumimos que workerHandlers / WorkerChannels tiene implementado ADVANCE_ADD
    const result = await window.electron.invoke(WorkerChannels.ADVANCE_ADD, payload);
    if (!result.ok) {
       throw new Error(result.error);
    }
    
    successGlobal.value = 'Adelanto registrado exitosamente';
    setTimeout(() => successGlobal.value = '', 3000);
    isAdvanceModalOpen.value = false;
    
    // Reiniciar formulario y refrescar data
    advanceData.value = { worker_id: '', amount: 0, date: strRawNow, notes: '' };
    await fetchAdvancesForMonth();
  } catch (e: any) {
    advanceError.value = e.message || 'Error al registrar el adelanto';
  } finally {
    advanceLoading.value = false;
  }
};

const todayRaw = new Date();
const getYearMonth = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
};
const filterMonth = ref(getYearMonth(todayRaw));

const getDaysOfMonth = (yM: string): string[] => {
  if (!yM || !yM.includes('-')) return [];
  const [yearStr, monthStr] = yM.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const cur = new Date(year, month - 1, i);
    days.push(`${yearStr}-${monthStr}-${i.toString().padStart(2, '0')}`);
  }
  return days;
};

// Compute status block
const unclosedRecords = computed(() => {
  if (!filterMonth.value) return [];
  return attendances.value.filter(a => 
    (a.status === 'OPEN' || a.status === 'PENDING') && a.date.startsWith(filterMonth.value)
  );
});

const hasUnclosed = computed(() => unclosedRecords.value.length > 0);

// Agrupamos el inventario local obtenido
const computedStats = computed<WorkerStat[]>(() => {
  const daysInMonth = getDaysOfMonth(filterMonth.value);

  const validRecords = attendances.value.filter(a =>
    a.status === 'CLOSED' &&
    a.date.startsWith(filterMonth.value) &&
    a.worked_minutes !== null
  );

  const acc: Record<number, WorkerStat> = {};

  validRecords.forEach(rec => {
    if (!acc[rec.worker_id]) {
      // Sumar los adelantos de este mes para el trabajador
      const advancesSum = advancesInfo.value
        .filter(adv => adv.worker_id === rec.worker_id)
        .reduce((sum, adv) => sum + adv.amount, 0);

      acc[rec.worker_id] = {
        worker_id: rec.worker_id,
        worker_name: rec.worker_name,
        days_worked: 0,
        total_minutes: 0,
        total_overtime: 0,
        base_payment: 0,
        overtime_payment: 0,
        advances_amount: advancesSum,
        total_payment: 0
      };
    }
    
    const baseP = (rec.daily_payment || 0) - (rec.overtime_payment || 0);

    acc[rec.worker_id].days_worked += 1;
    acc[rec.worker_id].total_minutes += (rec.worked_minutes || 0);
    acc[rec.worker_id].total_overtime += (rec.overtime_minutes || 0);
    acc[rec.worker_id].base_payment += baseP;
    acc[rec.worker_id].overtime_payment += rec.overtime_payment;
  });

  // Calculate final total payment applying advances
  Object.values(acc).forEach(stat => {
    const rawTotal = stat.base_payment + stat.overtime_payment;
    stat.total_payment = Math.max(0, rawTotal - stat.advances_amount);
  });

  return Object.values(acc).sort((a,b) => b.total_payment - a.total_payment);
});

const selectedWorkerRecords = computed(() => {
  if (!selectedWorker.value) return [];
  return attendances.value
    .filter(a => a.worker_id === selectedWorker.value!.worker_id && a.date.startsWith(filterMonth.value))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

const showWorkerDetails = (row: any) => {
  selectedWorker.value = row as WorkerStat;
};

const totalPayroll = computed(() => {
  return computedStats.value.reduce((sum, stat) => sum + stat.total_payment, 0);
});

// Utilidades
const formatMoney = (val: number) => {
  return Math.round(val).toLocaleString('es-CL');
};

// Fetch data logic
const fetchAdvancesForMonth = async () => {
  if (!filterMonth.value) return;
  const [y, m] = filterMonth.value.split('-');
  try {
    const res = await window.electron.invoke(WorkerChannels.ADVANCE_LIST_ALL, { year: parseInt(y, 10), month: parseInt(m, 10) });
    if (res.ok) {
      advancesInfo.value = res.data || [];
    } else {
      console.error("Error cargando adelantos:", res.error);
    }
  } catch(e) {
    console.error(e);
  }
};

// Data Fetching
const fetchAll = async () => {
  loading.value = true;
  errorGlobal.value = '';
  try {
    await fetchAdvancesForMonth();
    const data = await window.electron.invoke(AttendanceChannels.GET_ALL);
    attendances.value = data || [];
    
    // Poblar trabajadores
    const wData = await window.electron.invoke(WorkerChannels.GET_ACTIVE);
    if(wData) workersList.value = wData.map((w: any) => ({id: w.id, name: w.name}));
    
  } catch (err: any) {
    console.error(err);
    errorGlobal.value = 'No se pudieron cargar los registros: ' + (err.message || 'Error desconocido');
  } finally {
    loading.value = false;
  }
};

watch(filterMonth, () => {
  fetchAdvancesForMonth();
});

// Exportacion a CSV nativa (abre en Excel)
const exportToCSV = () => {
  try {
    if (hasUnclosed.value) {
      errorGlobal.value = "No puedes exportar porque hay asistencias abiertas en el mes seleccionado.";
      return;
    }
    const stats = computedStats.value;
    if (stats.length === 0) {
      errorGlobal.value = "No hay datos para exportar el mes seleccionado.";
      return;
    }

    const headers = ["Trabajador", "Dias Trabajados", "Total Horas (Base)", "Horas Extras", "Pago Base ($)", "Pago Extras ($)", "Descuento Adelantos ($)", "Liquidacion Total ($)"];
    
    // Armar lineas CSV encapsulando texto con comillas y usando separador punto y coma para Excel ES
    const rows = stats.map(s => {
      const hBase = (s.total_minutes / 60).toFixed(2);
      const hExtra = (s.total_overtime / 60).toFixed(2);
      return `"${s.worker_name}";${s.days_worked};${hBase};${hExtra};${Math.round(s.base_payment)};${Math.round(s.overtime_payment)};${Math.round(s.advances_amount)};${Math.round(s.total_payment)}`;
    });

    const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n"); // uFEFF BOM para chars UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Liquidacion_Nautica_${filterMonth.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    successGlobal.value = `Exportación de ${filterMonth.value} exitosa.`;
    setTimeout(() => { successGlobal.value = ''; }, 3000);
  } catch (err: any) {
    errorGlobal.value = "Fallo la creación del archivo: " + err.message;
  }
};

// UI Components Config
const tableColumns = [
  { key: 'worker_name', label: 'Trabajador' },
  { key: 'days', label: 'Días Asistidos', align: 'center' as const },
  { key: 'total_hours', label: 'Horas Base', align: 'center' as const },
  { key: 'overtime', label: 'Horas Extra', align: 'center' as const },
  { key: 'base_pay', label: 'Sueldo Base', align: 'right' as const },
  { key: 'overtime_pay', label: 'Pago Extras', align: 'right' as const },
  { key: 'advances_amount', label: 'Adelantos', align: 'right' as const },
  { key: 'total_pay', label: 'Líquido ($)', align: 'right' as const }
];

onMounted(() => {
  fetchAll();
});
</script>
