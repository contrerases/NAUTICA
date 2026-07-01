<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <PageHeader title="Panel Principal" subtitle="Resumen general y estadísticas rápidas de hoy.">
      <template #actions>
        <div class="text-right">
          <p class="text-xs font-bold text-text-muted uppercase tracking-wider">Bruto del Mes</p>
          <p class="text-2xl font-black text-text-base tracking-tight">{{ monthGrossLabel }}</p>
        </div>
      </template>
    </PageHeader>

    <!-- Alerta de error de carga -->
    <BaseAlert v-if="pageError" type="error" :message="pageError" />

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
          <EmptyState v-if="!loading && todayAttendancesList.length === 0" message="No hay marcajes para hoy" />
          
          <div 
            v-for="(rec, index) in todayAttendancesList" 
            :key="index"
            class="flex items-center justify-between p-4 border-b border-surface-border last:border-b-0 hover:bg-surface-hover/50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <Avatar :name="rec.worker_name" :color="rec.status === 'CLOSED' ? 'success' : 'warning'" />
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
                <button 
                  v-if="isCurrentMonth(rec.date)"
                  @click="openEditModal(rec)" 
                  class="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors ml-1"
                  title="Editar tiempos"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
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
              <Avatar :name="rec.worker_name" color="danger" />
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

    <!-- Modal Editar Tiempos -->
    <BaseModal 
      :is-open="isEditModalOpen" 
      @close="closeEditModal" 
      title="Editar Registro de Asistencia"
      max-width="sm"
    >
      <div class="p-6">
        <BaseAlert v-if="editError" type="error" :message="editError" class="mb-4" />
        
        <form @submit.prevent="submitEdit" class="space-y-4">
          <p class="text-sm text-text-muted mb-4">Modificando registro de <strong>{{ editData.worker_name }}</strong> el <strong>{{ formatDateLocale(editData.date) }}</strong>.</p>
          
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model="editData.entry_time" type="time" label="Hora Entrada" required />
            <BaseInput v-model="editData.exit_time" type="time" label="Hora Salida" />
          </div>
          
          <div class="flex justify-end gap-3 pt-4 border-t border-surface-border mt-4">
            <BaseButton type="button" variant="outline" @click="closeEditModal" :disabled="editLoading">Cancelar</BaseButton>
            <BaseButton type="submit" variant="primary" :is-loading="editLoading">Guardar</BaseButton>
          </div>
        </form>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  BaseCard,
  BaseModal,
  BaseInput,
  BaseButton,
  BaseAlert,
  PageHeader,
  Avatar,
  EmptyState,
} from '../../components/ui';
import { api } from '../../api';
import { useAdminStore } from '../../stores/adminStore';
import type { AttendanceRecord, DashboardStats } from '@shared/types';
import { formatCLP } from '@shared/utils/money';
import { isCurrentMonth as isCurrentMonthTz } from '@shared/utils/date';

const router = useRouter();
const adminStore = useAdminStore();

const loading = ref(true);
const pageError = ref('');

// KPIs calculados por el backend
const stats = ref<DashboardStats>({
  today_active_shifts: 0,
  today_closed_shifts: 0,
  missing_exits: 0,
  month_gross: 0,
});
// Denominador de la tarjeta de asistencia (plantilla activa)
const activeWorkersCount = ref(0);
// Listas de detalle
const todayAttendancesList = ref<AttendanceRecord[]>([]);
const missingExitsList = ref<AttendanceRecord[]>([]);

// Fecha de hoy en la zona del negocio (America/Santiago)
const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });

// Data loading
const loadDashboardData = async () => {
  loading.value = true;
  pageError.value = '';
  try {
    const [dashboard, activeWorkers, allRecords, missing] = await Promise.all([
      api.report.dashboard(),
      api.workers.getActive(),
      api.attendance.getAll(),
      api.attendance.getMissing(),
    ]);

    stats.value = dashboard;
    activeWorkersCount.value = activeWorkers.length;
    todayAttendancesList.value = allRecords.filter((a) => a.date === todayStr);
    missingExitsList.value = missing;
  } catch (error: any) {
    pageError.value = error?.message || 'Error al cargar los datos del panel';
    console.error('Error fetching dashboard metrics', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
});

// Métricas derivadas de los KPIs del backend
const countTodayAttendances = computed(
  () => stats.value.today_active_shifts + stats.value.today_closed_shifts,
);
const countActiveWorkers = computed(() => activeWorkersCount.value);
const countOpenShifts = computed(() => stats.value.today_active_shifts);
const countMissingExits = computed(() => stats.value.missing_exits);
const monthGrossLabel = computed(() => formatCLP(stats.value.month_gross));

const percentPresent = computed(() => {
  const total = countActiveWorkers.value;
  const present = countTodayAttendances.value;
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
});

const goToAnomalies = () => {
  router.push('/admin/historial');
};

const formatDateLocale = (isoStr: string) => {
  if (!isoStr) return '';
  const [, month, day] = isoStr.split('-');
  return `${day}/${month}`;
};
// ================= EDITAR REGISTRO =================
const isEditModalOpen = ref(false);
const editLoading = ref(false);
const editError = ref('');
const editData = ref({
  id: 0,
  worker_name: '',
  date: '',
  entry_time: '',
  exit_time: ''
});

const isCurrentMonth = (dateStr: string) => {
  if (!dateStr) return false;
  return isCurrentMonthTz(dateStr);
};

const openEditModal = (row: AttendanceRecord) => {
  editError.value = '';
  editData.value = {
    id: row.id,
    worker_name: row.worker_name ?? '',
    date: row.date,
    entry_time: row.entry_time || '',
    exit_time: row.exit_time || ''
  };
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const submitEdit = async () => {
  editLoading.value = true;
  editError.value = '';

  try {
    await api.attendance.updateRecord({
      id: editData.value.id,
      entry_time: editData.value.entry_time,
      exit_time: editData.value.exit_time || null,
      adminId: adminStore.admin?.id ?? undefined,
    });

    closeEditModal();
    await loadDashboardData(); // Refresh main lists
  } catch (e: any) {
    editError.value = e.message || 'Error al actualizar el registro';
  } finally {
    editLoading.value = false;
  }
};
</script>
