<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-text-base">Historial de Asistencia</h2>
        <p class="text-text-muted mt-1">Revisa el registro de marcajes, horas de entrada, salida y tiempo trabajado.</p>
      </div>
    </div>

    <!-- Barra de Filtros Avanzados -->
    <BaseCard padding="base" class="bg-surface-muted border-none w-full">
      <div class="flex flex-row flex-wrap lg:flex-nowrap items-end gap-4 w-full">
        <BaseInput
          v-model="searchQuery"
          id="search-attendance"
          label="Buscar Trabajador"
          placeholder="Buscar por nombre o doc..."
          class="flex-1 min-w-[200px]"
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </template>
        </BaseInput>

        <BaseInput
          v-model="filterDateFrom"
          id="filter-date-from"
          type="date"
          label="Desde"
          class="w-full sm:w-40 flex-shrink-0"
        />

        <BaseInput
          v-model="filterDateTo"
          id="filter-date-to"
          type="date"
          label="Hasta"
          class="w-full sm:w-40 flex-shrink-0"
        />

        <div class="w-full sm:w-auto min-w-[200px] flex-shrink-0 space-y-1">
          <label class="block text-sm font-semibold text-text-base ml-1">Estado de Turno</label>
          <select 
            v-model="filterStatus"
            class="w-full h-[42px] block border border-surface-border rounded-lg bg-surface text-text-base text-sm shadow-sm transition-all outline-none px-4 focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Todos los Registros</option>
            <option value="CLOSED">Completados (Cerrados)</option>
            <option value="OPEN">En Turno (Abiertos)</option>
            <option value="PENDING">Pendientes (Sin Salida)</option>
            <option value="ANOMALY">Anomalías (A revisar)</option>
          </select>
        </div>
      </div>
    </BaseCard>

    <!-- Alertas Generales -->
    <div class="flex flex-col gap-3 mb-4" v-if="errorGlobal || successGlobal">
      <BaseAlert 
        v-if="errorGlobal" 
        type="error" 
        :title="'Error Cargando Historial'"
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

    <!-- Tabla -->
    <BaseCard class="flex-1 overflow-hidden" padding="none">
      <BaseTable
        :columns="tableColumns"
        :data="filteredAttendances"
        :loading="loading"
        class="h-full"
      >
        <!-- Trabajador -->
        <template #cell-worker_name="{ row }">
          <div class="font-bold text-text-base">{{ row.worker_name }}</div>
          <div class="text-xs text-text-muted font-mono" v-if="row.rut || row.dni">{{ row.rut || row.dni }}</div>
        </template>

        <!-- Fecha -->
        <template #cell-date="{ row }">
          {{ formatDate(row.date) }}
        </template>

        <!-- Entrada -->
        <template #cell-entry_time="{ row }">
          <span class="font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
            {{ row.entry_time }}
          </span>
        </template>

        <!-- Salida -->
        <template #cell-exit_time="{ row }">
          <span v-if="row.exit_time" class="font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
            {{ row.exit_time }}
          </span>
          <span v-else class="text-xs text-text-muted italic flex items-center justify-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            En turno
          </span>
        </template>

        <!-- Horas Trabajadas -->
        <template #cell-worked_hours="{ row }">
          <span v-if="row.worked_minutes !== null && row.worked_minutes !== undefined" class="font-bold text-text-base">
            {{ (row.worked_minutes / 60).toFixed(2) }} hrs
          </span>
          <span v-else class="text-text-muted/50">-</span>
        </template>

        <!-- Estado -->
        <template #cell-status="{ row }">
          <div class="flex items-center gap-2 justify-center">
            <BaseBadge :variant="row.status === 'CLOSED' ? 'success' : (row.status === 'OPEN' ? (row.date < todayStr ? 'danger' : 'warning') : 'danger')">
              {{ row.status === 'CLOSED' ? 'COMPLETADO' : (row.status === 'OPEN' ? (row.date < todayStr ? 'NO MARCÓ SALIDA' : 'EN TURNO') : 'PENDIENTE') }}
            </BaseBadge>
            <!-- Badge adicional de Anomalia -->
            <span v-if="row.status === 'CLOSED' && (row.worked_minutes / 60 < 1 || row.worked_minutes / 60 > 15)" 
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-danger/20 text-danger border border-danger/30 font-bold text-[10px]"
                  title="Anomalía de Tiempo (Muy corto o excesivo)"
            >
              !
            </span>
          </div>
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
import BaseBadge from '../../components/ui/BaseBadge.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseAlert from '../../components/ui/BaseAlert.vue';

// Estado de la Vista
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

const attendances = ref<any[]>([]);
const loading = ref(true);
const errorGlobal = ref('');
const successGlobal = ref('');

// Filtros
const searchQuery = ref('');
const filterStatus = ref(route.query.filter === 'anomalies' ? 'ANOMALY' : 'ALL');

// Por defecto mostrar el día anterior
const yesterdayRaw = new Date();
yesterdayRaw.setDate(yesterdayRaw.getDate() - 1);
const yesterdayStr = yesterdayRaw.toLocaleDateString('sv-SE', {timeZone: 'America/Santiago'});

const todayRaw = new Date();
const todayStr = todayRaw.toLocaleDateString('sv-SE', {timeZone: 'America/Santiago'});

const filterDateFrom = ref(yesterdayStr);
const filterDateTo = ref(yesterdayStr);

// Columnas de la tabla
const tableColumns = [
  { key: 'worker_name', label: 'Trabajador' },
  { key: 'date', label: 'Fecha' },
  { key: 'entry_time', label: 'Hora Entrada', align: 'center' as const },
  { key: 'exit_time', label: 'Hora Salida', align: 'center' as const },
  { key: 'worked_hours', label: 'Total Horas', align: 'center' as const },
  { key: 'status', label: 'Estado del Turno', align: 'center' as const }
];

// Lógica de Filtros Completos
const filteredAttendances = computed(() => {
  let result = attendances.value;

  // 1. Filtrar por rango de fechas (Ignora registros vacíos)
  const dFrom = filterDateFrom.value;
  const dTo = filterDateTo.value;
  if (dFrom) result = result.filter(a => a.date >= dFrom);
  if (dTo) result = result.filter(a => a.date <= dTo);

  // 2. Filtrar por estado / anomalías
  if (filterStatus.value !== 'ALL') {
    if (filterStatus.value === 'ANOMALY') {
      // Consideramos anomalía si es un turno cerrado pero con horas irrazonables (>15h o <1h)
      result = result.filter(a => a.status === 'CLOSED' && a.worked_minutes !== null && ((Number(a.worked_minutes) / 60) < 1 || (Number(a.worked_minutes) / 60) > 15));
    } else {
      // OPEN, CLOSED o PENDING
      result = result.filter(a => a.status === filterStatus.value);
    }
  }

  // 3. Filtrar por Nombre/RUT/DNI
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(a =>
      (a.worker_name && a.worker_name.toLowerCase().includes(q)) ||
      (a.rut && a.rut.toLowerCase().includes(q)) ||
      (a.dni && a.dni.toLowerCase().includes(q))
    );
  }

  // Retornamos la sublista (Ordenada desde base de datos, no la tocamos)
  return result;
});

// Obtener los datos del historial
const loadAttendances = async () => {
  loading.value = true;
  errorGlobal.value = '';
  try {
    const data = await window.electron.invoke(AttendanceChannels.GET_ALL);
    attendances.value = data || [];
  } catch (err: any) {
    console.error('Error cargando historial de asistencias:', err);
    errorGlobal.value = err.message || 'Error al conectar con la base de datos.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAttendances();
});

// Utils
const formatDate = (isoString?: string) => {
  if (!isoString) return '';
  const [year, month, day] = isoString.split('-');
  return `${day}/${month}/${year}`;
};
</script>
