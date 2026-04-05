<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-text-base">Panel Principal</h2>
        <p class="text-text-muted mt-1">Resumen general y estadísticas rápidas de hoy.</p>
      </div>
    </div>

    <!-- Indicadores KPI de Negocio (Cards A/C style) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- Indicador A: Termómetro de Presentismo -->
      <BaseCard padding="base" class="flex flex-col border-l-4 border-l-emerald-500 shadow-emerald-500/10 shadow-lg">
        <p class="text-sm font-bold text-text-muted uppercase tracking-wider">Asistencia de Hoy</p>
        <div class="flex items-end justify-between mt-2 flex-1">
          <div class="flex flex-col">
            <p class="text-4xl font-black text-text-base">{{ countTodayAttendances }} <span class="text-xl text-text-muted font-bold">/ {{ countActiveWorkers }}</span></p>
            <p class="text-sm mt-1 text-emerald-500 font-medium">{{ percentPresent }}% de la plantilla conectada</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-4 ring-emerald-500/5">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
        </div>
      </BaseCard>

      <!-- Indicador B: Total de Turnos Abiertos (En Terreno) -->
      <BaseCard padding="base" class="flex flex-col border-l-4 border-l-warning shadow-warning/10 shadow-lg">
        <p class="text-sm font-bold text-text-muted uppercase tracking-wider">Plantilla en Terreno</p>
        <div class="flex items-end justify-between mt-2 flex-1">
          <div class="flex flex-col">
            <p class="text-4xl font-black text-warning tracking-tight">{{ countOpenShifts }}<span class="text-lg ml-1 font-bold">trabajadores</span></p>
            <p class="text-sm mt-1 text-text-muted font-medium">Marcajes sin hora de salida</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning ring-4 ring-warning/5">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
      </BaseCard>

      <!-- Indicador C: Alertas de Faltantes de Salida -->
      <BaseCard padding="base" class="flex flex-col border-l-4 border-l-danger shadow-danger/10 shadow-lg relative overflow-hidden group hover:border-danger hover:ring-1 hover:ring-danger cursor-pointer transition-all" @click="goToAnomalies">
        <div class="absolute -right-6 -bottom-6 text-danger/5 w-32 h-32 transform group-hover:scale-110 transition-transform">
          <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <p class="text-sm font-bold text-danger uppercase tracking-wider">Salidas Faltantes (Anomalías)</p>
        <div class="flex items-end justify-between mt-2 flex-1 relative z-10">
          <div class="flex flex-col">
            <p class="text-4xl font-black text-text-base">{{ countMissingExits }}</p>
            <p class="text-sm mt-1 text-danger font-bold flex items-center gap-1">Revisar registro histórico <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></p>
          </div>
        </div>
      </BaseCard>

    </div>

    <!-- Gráfico o Sección visual -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 mt-6">
      
      <!-- Panel de Accesos Recientes -->
      <BaseCard class="flex flex-col h-full overflow-hidden" padding="none">
        <div class="p-5 border-b border-surface-border">
          <h3 class="text-lg font-bold text-text-base">Entradas y Salidas de Hoy</h3>
          <p class="text-sm text-text-muted">Desglose de trabajadores en el día.</p>
        </div>
        <div class="p-0 overflow-y-auto">
          <!-- Si no hay loading ni datos -->
          <div v-if="!loading && todayAttendancesList.length === 0" class="p-8 text-center text-text-muted italic">
            No hay marcajes para hoy
          </div>
          
          <div 
            v-for="(rec, index) in todayAttendancesList" 
            :key="index"
            class="flex items-center justify-between p-4 border-b border-surface-border last:border-b-0 hover:bg-surface-hover/50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" 
                   :class="rec.status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-warning/20 text-warning'"
              >
                {{ rec.worker_name ? rec.worker_name.charAt(0) : '?' }}
              </div>
              <div>
                <p class="font-bold text-sm text-text-base">{{ rec.worker_name }}</p>
                <p class="text-xs text-text-muted mt-0.5">{{ formatDateLocale(rec.date) }}</p>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold py-1 px-2 rounded-md font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  ENTRADA: {{ rec.entry_time }}
                </span>
                <span
                  class="text-xs font-bold py-1 px-2 rounded-md font-mono bg-danger/10 text-danger border border-danger/20"
                  :class="{ 'opacity-0 select-none': rec.status !== 'CLOSED' }"
                >
                  SALIDA: {{ rec.exit_time || '00:00' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

<!-- Panel de Salidas Faltantes -->
      <BaseCard class="flex flex-col h-full bg-danger/5 relative overflow-hidden group" padding="none">
        <div class="p-5 border-b border-danger/20">
          <h3 class="text-lg font-bold text-danger">⚠️ Salidas Faltantes</h3>
          <p class="text-sm text-danger/80">Turnos abiertos de días anteriores sin cerrar.</p>
        </div>
        <div class="p-0 overflow-y-auto">
          <!-- Si no hay datos -->
          <div v-if="!loading && missingExitsList.length === 0" class="p-8 text-center text-emerald-500 font-bold">
            ¡Todo al día! No hay turnos pendientes.
          </div>

          <div
            v-for="(rec, index) in missingExitsList"
            :key="index"
            class="flex items-center justify-between p-4 border-b border-surface-border last:border-b-0 hover:bg-danger/10 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold bg-danger/20 text-danger">
                {{ rec.worker_name ? rec.worker_name.charAt(0) : '?' }}
              </div>
              <div>
                <p class="font-bold text-sm text-text-base">{{ rec.worker_name }}</p>
                <p class="text-xs text-danger font-medium mt-0.5">{{ formatDateLocale(rec.date) }} • {{ rec.entry_time }}</p>
              </div>
            </div>
            <div>
              <button @click="goToAnomalies" class="text-xs font-bold py-1 px-3 rounded-md bg-danger text-white hover:bg-danger-hover transition-all">
                REVISAR
              </button>
            </div>
          </div>
        </div>
      </BaseCard>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from '../../components/ui/BaseCard.vue';
import { WorkerChannels, AttendanceChannels } from '../../../shared/types/ipc';

const router = useRouter();
const loading = ref(true);
const localWorkers = ref<any[]>([]);
const localAttendances = ref<any[]>([]);

// Data loading
const loadDashboardData = async () => {
  loading.value = true;
  try {
    const [workersData, attendanceData] = await Promise.all([
      window.electron.invoke(WorkerChannels.GET_ALL).catch(() => []),
      window.electron.invoke(AttendanceChannels.GET_ALL).catch(() => [])
    ]);

    localWorkers.value = workersData || [];
    localAttendances.value = attendanceData || [];
  } catch (error) {
    console.error('Error fetching dashboard metrics', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
});

// Computed Metrics
const countActiveWorkers = computed(() => {
  return localWorkers.value.filter(w => w.status === 'ACTIVE').length;
});

const todayStr = new Date().toLocaleDateString('sv-SE', {timeZone: 'America/Santiago'});

const countTodayAttendances = computed(() => {
  return localAttendances.value.filter(a => a.date === todayStr).length;
});

const countOpenShifts = computed(() => {
  return localAttendances.value.filter(a => a.status === 'OPEN').length;
});

const percentPresent = computed(() => {
  const total = countActiveWorkers.value;
  const present = countTodayAttendances.value;
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
});

// Anomalías (ahora enfocado en Faltantes por marcar Salida)
const countAnomalies = computed(() => {
  return localAttendances.value.filter(a => a.status === 'OPEN' && a.date < todayStr).length;
});

const goToAnomalies = () => {
  // router.push('/admin/historial?filter=anomalies');
  router.push('/admin/historial');
};

const countMissingExits = computed(() => countAnomalies.value);

const sumTotalHours = computed(() => {
  // Sólo calcula sobre los CLOSED (este cálculo podría delegarse al backend luego)
  let sum = 0;
  localAttendances.value.forEach(a => {
    if (a.worked_minutes !== null && a.worked_minutes !== undefined) {
      sum += Number(a.worked_minutes) / 60;
    }
  });
  return sum.toFixed(1);
});

// Tablas parciales
const todayAttendancesList = computed(() => {
  return localAttendances.value.filter(a => a.date === todayStr);
});

const missingExitsList = computed(() => {
  return localAttendances.value.filter(a => a.status === 'OPEN' && a.date < todayStr);
});

// Format Utils
const getTodayDate = () => {
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date());
};

const formatDateLocale = (isoStr: string) => {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('-');
  return `${day}/${month}`;
};
</script>
