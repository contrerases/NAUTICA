<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <PageHeader
      title="Historial de Asistencia"
      subtitle="Revisa el registro de marcajes, horas de entrada, salida y tiempo trabajado."
    >
      <template #actions>
        <BaseButton variant="primary" @click="openCreateModal">
          <template #icon-left>
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          </template>
          Agregar Registro Manual
        </BaseButton>
      </template>
    </PageHeader>

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

        <BaseSelect
          v-model="filterStatus"
          label="Estado de Turno"
          class="w-full sm:w-auto min-w-[200px] flex-shrink-0"
        >
          <option value="ALL">Todos los Registros</option>
          <option value="CLOSED">Completados (Cerrados)</option>
          <option value="OPEN">En Turno (Abiertos)</option>
          <option value="PENDING">Pendientes (Sin Salida)</option>
          <option value="ANOMALY">Anomalías (A revisar)</option>
        </BaseSelect>
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
          <TimeBadge :time="row.entry_time" variant="entry" />
        </template>

        <!-- Salida -->
        <template #cell-exit_time="{ row }">
          <TimeBadge :time="row.exit_time" variant="exit">
            <template #empty>
              <span class="text-xs text-text-muted italic flex items-center justify-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                En turno
              </span>
            </template>
          </TimeBadge>
        </template>

        <!-- Horas Trabajadas -->
        <template #cell-worked_hours="{ row }">
          <span v-if="row.worked_minutes !== null && row.worked_minutes !== undefined" class="font-bold text-text-base">
            {{ formatDuration(row.worked_minutes) }}
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
        
      
        <!-- Acciones -->
        <template #cell-actions="{ row }">
          <IconButton
            color="primary"
            title="Editar Tiempos"
            @click="openEditModal(row)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </IconButton>
        </template>
      </BaseTable>
    </BaseCard>

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
          <p class="text-sm text-text-muted mb-4">Modificando registro de <strong>{{ editData.worker_name }}</strong> el <strong>{{ formatDate(editData.date) }}</strong>.</p>
          
          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model="editData.entry_time" type="time" label="Hora Entrada" required />
            <BaseInput v-model="editData.exit_time" type="time" label="Hora Salida" />
          </div>
          
          <div class="flex items-center gap-2 mt-4 bg-surface-border p-3 rounded-lg">
            <input type="checkbox" id="edit-colacion" v-model="editData.tomo_colacion" class="w-4 h-4 accent-primary bg-surface border-surface-border rounded focus:ring-primary focus:ring-2">
            <label for="edit-colacion" class="text-sm font-medium text-text-base cursor-pointer">
              Tomó su media hora de colación
            </label>
          </div>
          
          <div class="flex justify-end gap-3 pt-4 border-t border-surface-border mt-4">
            <BaseButton type="button" variant="outline" @click="closeEditModal" :disabled="editLoading">Cancelar</BaseButton>
            <BaseButton type="submit" variant="primary" :is-loading="editLoading">Guardar</BaseButton>
          </div>
        </form>
      </div>
    </BaseModal>

    <!-- Modal Agregar Manual -->
    <BaseModal 
      :is-open="isCreateModalOpen" 
      @close="closeCreateModal" 
      title="Agregar Registro Manual"
      max-width="sm"
    >
      <div class="p-6">
        <BaseAlert v-if="createError" type="error" :message="createError" class="mb-4" />
        
        <form @submit.prevent="submitCreate" class="space-y-4">
          <p class="text-sm text-text-muted mb-4">Ingresar un registro manualmente para el mes y trabajador seleccionado.</p>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-text-base">Trabajador <span class="text-danger">*</span></label>
            <BaseSelect v-model="createData.worker_id" required>
              <option value="" disabled>Seleccione trabajador</option>
              <option v-for="w in workers" :key="w.id" :value="w.id">{{ w.name }} ({{ w.rut || w.dni }})</option>
            </BaseSelect>
          </div>

          <BaseInput v-model="createData.date" type="date" label="Fecha del Turno" required />

          <div class="grid grid-cols-2 gap-4">
            <BaseInput v-model="createData.entry_time" type="time" label="Hora Entrada" required />
            <BaseInput v-model="createData.exit_time" type="time" label="Hora Salida (Opcional)" />
          </div>
          
          <div class="flex items-center gap-2 mt-4 bg-surface-border p-3 rounded-lg" v-if="createData.exit_time">
            <input type="checkbox" id="create-colacion" v-model="createData.tomo_colacion" class="w-4 h-4 accent-primary bg-surface border-surface-border rounded focus:ring-primary focus:ring-2">
            <label for="create-colacion" class="text-sm font-medium text-text-base cursor-pointer">
              Tomó su media hora de colación
            </label>
          </div>
          
          <div class="flex justify-end gap-3 pt-4 border-t border-surface-border mt-4">
            <BaseButton type="button" variant="outline" @click="closeCreateModal" :disabled="createLoading">Cancelar</BaseButton>
            <BaseButton type="submit" variant="primary" :is-loading="createLoading">Registrar</BaseButton>
          </div>
        </form>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import type { AttendanceRecord, Worker } from '@shared/types';
import { formatDuration } from '@shared/utils/time';
import { today, addDays } from '@shared/utils/date';
import { askConfirm } from '../../composables/useConfirm';
import { api } from '../../api';
import { useAdminStore } from '../../stores/adminStore';

import {
  BaseCard,
  BaseTable,
  BaseBadge,
  BaseInput,
  BaseAlert,
  BaseModal,
  BaseButton,
  BaseSelect,
  PageHeader,
  TimeBadge,
  IconButton,
} from '../../components/ui';

// Estado de la Vista
const route = useRoute();
const adminStore = useAdminStore();

const attendances = ref<AttendanceRecord[]>([]);
const workers = ref<Worker[]>([]);
const loading = ref(true);
const errorGlobal = ref('');
const successGlobal = ref('');

// Filtros
const searchQuery = ref('');
const filterStatus = ref(route.query.filter === 'anomalies' ? 'ANOMALY' : 'ALL');

// Por defecto mostrar el día anterior (zona horaria del negocio)
const todayStr = today();
const yesterdayStr = addDays(todayStr, -1);

const filterDateFrom = ref(yesterdayStr);
const filterDateTo = ref(yesterdayStr);

// Columnas de la tabla
const tableColumns = [
  { key: 'worker_name', label: 'Trabajador' },
  { key: 'date', label: 'Fecha' },
  { key: 'entry_time', label: 'Hora Entrada', align: 'center' as const },
  { key: 'exit_time', label: 'Hora Salida', align: 'center' as const },
  { key: 'worked_hours', label: 'Total Horas', align: 'center' as const },
  { key: 'status', label: 'Estado del Turno', align: 'center' as const },
  { key: 'actions', label: 'Acc.', align: 'center' as const }
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
    } else if (filterStatus.value === 'PENDING') {
      // "Pendientes (Sin Salida)" = turnos abiertos de días anteriores (olvidó marcar salida)
      result = result.filter(a => a.status === 'OPEN' && a.date < todayStr);
    } else {
      result = result.filter(a => a.status === filterStatus.value);
    }
  }

  // 3. Filtrar por Nombre del trabajador
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter(a =>
      a.worker_name != null && a.worker_name.toLowerCase().includes(q)
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
    // Listado completo de registros
    attendances.value = await api.attendance.getAll();

    // Trabajadores activos para el modal de alta manual
    workers.value = await api.workers.getActive();
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
// ================= EDITAR REGISTRO =================
const isEditModalOpen = ref(false);
const editLoading = ref(false);
const editError = ref('');
const editData = ref({
  id: 0,
  worker_name: '',
  date: '',
  entry_time: '',
  exit_time: '',
  tomo_colacion: true
});

const openEditModal = (row: AttendanceRecord) => {
  editError.value = '';
  editData.value = {
    id: row.id,
    worker_name: row.worker_name || '',
    date: row.date,
    entry_time: row.entry_time || '',
    exit_time: row.exit_time || '',
    tomo_colacion: row.break_minutes > 0
  };
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const submitEdit = async () => {
  editLoading.value = true;
  editError.value = '';
  
  if (editData.value.exit_time && editData.value.exit_time <= editData.value.entry_time) {
    editError.value = 'La hora de salida no puede ser igual o anterior a la hora de entrada.';
    editLoading.value = false;
    return;
  }

  // Se permite corregir registros de cualquier mes; el backend guarda la traza
  // de auditoría (updated_by). Pedimos confirmación explícita antes de guardar.
  if (!(await askConfirm({ title: 'Corregir registro', message: 'Vas a corregir un registro de asistencia. El cambio queda registrado con tu usuario. ¿Deseas continuar?', confirmText: 'Corregir' }))) {
    editLoading.value = false;
    return;
  }

  try {
    await api.attendance.updateRecord({
      id: editData.value.id,
      entry_time: editData.value.entry_time,
      exit_time: editData.value.exit_time || null,
      break_minutes: editData.value.tomo_colacion ? 30 : 0,
      adminId: adminStore.admin?.id ?? undefined,
    });

    // Éxito: cerrar el modal y mostrar el aviso de éxito. Si falla, el modal
    // permanece abierto (ver catch) para poder reintentar.
    closeEditModal();
    successGlobal.value = 'Registro actualizado correctamente';
    setTimeout(() => successGlobal.value = '', 3000);
    loadAttendances();
  } catch (e: any) {
    editError.value = e.message || 'Error al actualizar el registro';
  } finally {
    editLoading.value = false;
  }
};

// ================= AGREGAR REGISTRO MANUAL =================
const isCreateModalOpen = ref(false);
const createLoading = ref(false);
const createError = ref('');
const createData = ref({
  worker_id: '',
  date: todayStr,
  entry_time: '09:00',
  exit_time: '',
  tomo_colacion: true
});

const openCreateModal = () => {
  createError.value = '';
  createData.value = {
    worker_id: '',
    date: todayStr,
    entry_time: '09:00',
    exit_time: '',
    tomo_colacion: true
  };
  isCreateModalOpen.value = true;
};

const closeCreateModal = () => {
  isCreateModalOpen.value = false;
};

const submitCreate = async () => {
  createLoading.value = true;
  createError.value = '';
  
  if (!createData.value.worker_id) {
    createError.value = 'Debe seleccionar un trabajador';
    createLoading.value = false;
    return;
  }
  
  if (createData.value.exit_time && createData.value.exit_time <= createData.value.entry_time) {
    createError.value = 'La hora de salida no puede ser igual o anterior a la hora de entrada.';
    createLoading.value = false;
    return;
  }

  // El alta manual puede ser de cualquier mes/fecha; el backend guarda la traza.
  // Confirmamos porque es una intervención manual sobre el historial.
  if (!(await askConfirm({ title: 'Crear registro manual', message: 'Vas a crear un registro de asistencia manualmente. El cambio queda registrado con tu usuario. ¿Deseas continuar?', confirmText: 'Crear' }))) {
    createLoading.value = false;
    return;
  }

  try {
    // Alta manual del turno completo en una sola llamada.
    await api.attendance.createManual({
      worker_id: Number(createData.value.worker_id),
      date: createData.value.date,
      entry_time: createData.value.entry_time,
      exit_time: createData.value.exit_time || null,
      break_minutes: createData.value.tomo_colacion ? 30 : 0,
      adminId: adminStore.admin?.id ?? undefined,
    });

    // Éxito: cerrar el modal y mostrar el aviso de éxito. Si falla, el modal
    // permanece abierto (ver catch) para poder reintentar.
    closeCreateModal();
    successGlobal.value = 'Registro agregado manualmente';
    setTimeout(() => successGlobal.value = '', 3000);
    loadAttendances();
  } catch (e: any) {
    createError.value = e.message || 'Error al agregar el registro manual';
  } finally {
    createLoading.value = false;
  }
};
</script>
