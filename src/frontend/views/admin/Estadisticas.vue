<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-text-base">Estadísticas y Reportes</h2>
        <p class="text-text-muted mt-1">Resumen semanal para cálculo de remuneraciones y exportación (CSV Excel).</p>
      </div>
      <div>
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
          v-model="filterWeek"
          id="filter-week"
          type="week"
          label="Semana a Liquidar"
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
      <p class="text-danger flex font-bold" v-if="hasUnclosed">
        ⚠️ Atención: Hay asistencias pendientes de cerrar (OPEN/PENDING) en la semana seleccionada. No podrás exportar los pagos hasta que todos los turnos estén cerrados.
      </p>
    </div>
    <!-- Tabla de Estadisticas Agrupada -->
    <BaseCard class="flex-1 overflow-hidden" padding="none">
      <BaseTable
        :columns="tableColumns"
        :data="computedStats"
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
        <template #cell-total_pay="{ row }">
          <span class="text-primary font-black text-lg">${{ formatMoney(row.total_payment) }}</span>
        </template>
      </BaseTable>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { AttendanceChannels } from '../../../shared/types/ipc';

import BaseCard from '../../components/ui/BaseCard.vue';
import BaseTable from '../../components/ui/BaseTable.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';

interface AttendanceRecord {
  id: number;
  worker_id: number;
  worker_name: string;
  date: string;
  status: string;
  worked_minutes: number | null;
  overtime_minutes: number;
  overtime_payment: number;
  daily_payment: number | null;
}

interface WorkerStat {
  worker_id: number;
  worker_name: string;
  days_worked: number;
  total_minutes: number;
  total_overtime: number;
  base_payment: number;
  overtime_payment: number;
  total_payment: number;
}

// Variables Reactivas
const attendances = ref<AttendanceRecord[]>([]);
const loading = ref(true);
const errorGlobal = ref('');
const successGlobal = ref('');

const todayRaw = new Date();
// Get current week in YYYY-Www format
const getISOWeekAndYear = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}
const filterWeek = ref(getISOWeekAndYear(todayRaw));

const getDaysOfWeek = (yWv: string): string[] => {
  if (!yWv || !yWv.includes('-W')) return [];
  const [yearStr, weekStr] = yWv.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  
  const d = new Date(Date.UTC(year, 0, 1));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  d.setUTCDate(d.getUTCDate() + (7 * (week - 1)));
  d.setUTCDate(d.getUTCDate() - 3);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(d);
    cur.setUTCDate(d.getUTCDate() + i);
    days.push(cur.toISOString().split('T')[0]); // Se usa as is porque calculamos en base ISO
  }
  return days;
};

// Compute status block
const hasUnclosed = computed(() => {
  if (!filterWeek.value) return false;
  const daysInWeek = getDaysOfWeek(filterWeek.value);
  return attendances.value.some(a => 
    (a.status === 'OPEN' || a.status === 'PENDING') && daysInWeek.includes(a.date)
  );
});

// Agrupamos el inventario local obtenido
const computedStats = computed<WorkerStat[]>(() => {
  const daysInWeek = getDaysOfWeek(filterWeek.value);

  // Filtramos asistencias cerradas de esta semana
  const validRecords = attendances.value.filter(a =>
    a.status === 'CLOSED' &&
    daysInWeek.includes(a.date) &&
    a.worked_minutes !== null
  );

  const acc: Record<number, WorkerStat> = {};

  validRecords.forEach(rec => {
    if (!acc[rec.worker_id]) {
      acc[rec.worker_id] = {
        worker_id: rec.worker_id,
        worker_name: rec.worker_name,
        days_worked: 0,
        total_minutes: 0,
        total_overtime: 0,
        base_payment: 0,
        overtime_payment: 0,
        total_payment: 0
      };
    }
    
    const baseP = (rec.daily_payment || 0) - (rec.overtime_payment || 0);

    acc[rec.worker_id].days_worked += 1;
    acc[rec.worker_id].total_minutes += (rec.worked_minutes || 0);
    acc[rec.worker_id].total_overtime += (rec.overtime_minutes || 0);
    acc[rec.worker_id].base_payment += baseP;
    acc[rec.worker_id].overtime_payment += rec.overtime_payment;
    acc[rec.worker_id].total_payment += (rec.daily_payment || 0);
  });

  return Object.values(acc).sort((a,b) => b.total_payment - a.total_payment);
});

const totalPayroll = computed(() => {
  return computedStats.value.reduce((sum, stat) => sum + stat.total_payment, 0);
});

// Utilidades
const formatMoney = (val: number) => {
  return Math.round(val).toLocaleString('es-CL');
};

// Data Fetching
const fetchAll = async () => {
  loading.value = true;
  errorGlobal.value = '';
  try {
    const data = await window.electron.invoke(AttendanceChannels.GET_ALL);
    attendances.value = data || [];
  } catch (err: any) {
    console.error(err);
    errorGlobal.value = 'No se pudieron cargar los registros: ' + (err.message || 'Error desconocido');
  } finally {
    loading.value = false;
  }
};

// Exportacion a CSV nativa (abre en Excel)
const exportToCSV = () => {
  try {
    if (hasUnclosed.value) {
      errorGlobal.value = "No puedes exportar porque hay asistencias abiertas en la semana seleccionada.";
      return;
    }
    const stats = computedStats.value;
    if (stats.length === 0) {
      errorGlobal.value = "No hay datos para exportar el mes seleccionado.";
      return;
    }

    const headers = ["Trabajador", "Dias Trabajados", "Total Horas (Base)", "Horas Extras", "Pago Base ($)", "Pago Extras ($)", "Liquidacion Total ($)"];
    
    // Armar lineas CSV encapsulando texto con comillas y usando separador punto y coma para Excel ES
    const rows = stats.map(s => {
      const hBase = (s.total_minutes / 60).toFixed(2);
      const hExtra = (s.total_overtime / 60).toFixed(2);
      return `"${s.worker_name}";${s.days_worked};${hBase};${hExtra};${Math.round(s.base_payment)};${Math.round(s.overtime_payment)};${Math.round(s.total_payment)}`;
    });

    const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n"); // uFEFF BOM para chars UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Liquidacion_Nautica_${filterWeek.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    successGlobal.value = `Exportación de ${filterWeek.value} exitosa.`;
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
  { key: 'total_pay', label: 'Líquido ($)', align: 'right' as const }
];

onMounted(() => {
  fetchAll();
});
</script>
