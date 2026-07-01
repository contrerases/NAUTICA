<template>
  <div class="min-h-screen bg-body flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
    
    <!-- Elementos decorativos (Fondo) -->
    <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-light/5 rounded-full blur-3xl shadow-2xl pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl shadow-2xl pointer-events-none"></div>

    <!-- Botón Acceso Administrador (Oculto sutilmente en la esquina) -->
    <div class="absolute top-6 right-8 z-20">
      <BaseButton variant="ghost" size="sm" @click="goToAdmin" class="text-text-muted/50 hover:text-primary">
        <template #icon-left>
          <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </template>
        Admin
      </BaseButton>
    </div>

    <div class="relative z-10 w-full max-w-4xl flex flex-col items-center">

      <!-- Logo -->
      <img :src="logoUrl" alt="Náutica Botes Inflables" class="w-28 h-28 mb-6 object-contain drop-shadow-md select-none" />

      <!-- Reloj Digital en Vivo -->
      <div class="text-center mb-10 select-none">
        <h1 class="text-7xl md:text-9xl font-black text-text-base tracking-tighter tabular-nums drop-shadow-sm">
          {{ currentTime }}
        </h1>
        <p class="text-xl md:text-2xl text-text-muted font-bold mt-4 uppercase tracking-widest">
          {{ currentDate }}
        </p>
      </div>

      <!-- Tarjeta Principal de Marcaje -->
      <BaseCard class="w-full max-w-xl shadow-2xl border-t-8 border-t-primary rounded-2xl relative overflow-visible">
        
        <!-- Icono central sobresaliendo -->
        <div class="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <div class="bg-surface border-4 border-body rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
            <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>

        <div class="pt-12 px-6 pb-8 md:px-10 flex flex-col items-center space-y-8">
          <div class="text-center space-y-2 w-full">
            <h2 class="text-3xl font-extrabold text-text-base">Centro de Asistencia</h2>
            <p class="text-text-muted font-medium">Ingresa tu RUT o Escanea tu credencial</p>
          </div>

          <!-- Alerta inline para formato inválido -->
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <BaseAlert
              v-if="validationError"
              type="warning"
              :message="validationError"
              class="w-full"
            />
          </Transition>

          <form @submit.prevent="handleIdentify" class="w-full space-y-6">
            
            <!-- Selector de Tipo de Documento -->
            <SegmentedToggle
              v-model="docType"
              :options="[
                { value: 'RUT', label: 'RUT (Nacional)' },
                { value: 'DNI', label: 'DNI / Pasaporte' },
              ]"
            />

            <div class="relative">
              <BaseInput
                id="document"
                v-model="documentNumber"
                :placeholder="docType === 'RUT' ? 'Ej: 12345678-9' : 'Ej: AB123456'"
                :disabled="isLoading"
                autocomplete="off"
                autofocus
                :error="inputError"
                @input="handleInput"
                class="text-center text-3xl font-black tracking-widest h-20 shadow-inner bg-surface-hover/50 placeholder:font-medium placeholder:tracking-normal w-full"
              />
            </div>

            <BaseButton
              type="submit"
              size="lg"
              class="w-full h-16 text-xl font-bold uppercase tracking-wide rounded-xl shadow-primary/30 shadow-lg"
              :isLoading="isLoading"
              :disabled="!documentNumber || isLoading"
            >
              <template #icon-left v-if="!isLoading">
                <svg class="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                </svg>
              </template>
              Identificarse
            </BaseButton>
          </form>
          
          <div class="w-full pt-6 border-t border-surface-border text-center">
            <p class="text-sm text-text-muted">
              ¿Problemas para marcar? Consulta con el supervisor.
            </p>
          </div>
        </div>
      </BaseCard>

    </div>

    <!-- Modal de Error: Trabajador no encontrado o bloqueado -->
    <BaseModal
      :isOpen="isErrorModalOpen"
      :title="errorModalTitle"
      type="error"
      @close="closeErrorModal"
    >
      <p class="text-lg">
        {{ errorModalMessage }}
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="closeErrorModal" class="w-full sm:w-auto">
          Entendido
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal de Acción: Marcar Entrada/Salida -->
    <BaseModal
      :isOpen="isActionModalOpen"
      :title="currentAttendance ? 'Registro de Salida' : 'Registro de Entrada'"
      @close="closeActionModal"
    >
      <div v-if="identifiedWorker" class="flex flex-col gap-6 py-2">
        <div class="text-center">
          <Avatar
            :name="identifiedWorker.name"
            :photo="identifiedWorker.photo"
            size="xl"
            color="primary"
            class="mx-auto mb-3 shadow-md"
          />
          <h3 class="text-2xl font-extrabold text-text-base leading-tight">{{ identifiedWorker.name }}</h3>
          <p class="text-sm font-medium mt-1 uppercase tracking-wider text-text-muted" v-if="identifiedWorker.rut || identifiedWorker.dni">
            {{ docType }}: <span class="font-mono">{{ identifiedWorker.rut || identifiedWorker.dni }}</span>
          </p>
        </div>

        <div class="bg-surface-muted border border-surface-border rounded-xl p-4 flex flex-col items-center">
          <span class="text-xs text-text-muted font-bold tracking-widest uppercase mb-1">Hora Actual</span>
          <span class="text-4xl font-black font-mono text-primary tracking-tight">{{ currentTime }}</span>
        </div>

        <!-- Opciones exclusivas de Salida -->
        <div v-if="currentAttendance" class="space-y-4 pt-2">
          <div class="flex items-center justify-center p-4 border-2 border-surface-border rounded-xl bg-surface transition-all hover:bg-surface-hover cursor-pointer" @click="breakMinutes = breakMinutes === 30 ? 0 : 30">
            <input 
              type="checkbox" 
              id="colacion-checkbox"
              class="w-6 h-6 rounded border-surface-border text-primary focus:ring-primary focus:ring-2 cursor-pointer transition-all"
              :checked="breakMinutes > 0"
              @change.stop="breakMinutes = ($event.target as HTMLInputElement).checked ? 1 : 0"
            />
            <label for="colacion-checkbox" class="ml-3 text-lg font-extrabold text-text-base cursor-pointer uppercase tracking-tight">
              SÍ, TOMÉ COLACIÓN
            </label>
          </div>
          <p class="text-xs text-center text-text-muted">
            La hora de entrada registrada fue a las <span class="font-bold underline">{{ currentAttendance.entry_time }}</span>.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3 w-full">
          <BaseButton variant="outline" @click="closeActionModal" class="flex-1" :disabled="actionLoading">
            Cancelar
          </BaseButton>
          <BaseButton 
            variant="primary" 
            @click="submitAttendance" 
            class="flex-1 text-lg uppercase tracking-wide shadow-lg shadow-primary/20"
            :isLoading="actionLoading"
            :disabled="actionLoading"
          >
            {{ currentAttendance ? 'Confirmar Salida' : 'Marcar Entrada' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Modal de Éxito: Entrada/Salida -->
    <BaseModal
      :isOpen="isSuccessModalOpen"
      title="¡Registro Exitoso!"
      type="success"
      @close="isSuccessModalOpen = false"
    >
      <div class="py-4">
        <p class="text-xl font-bold text-center text-text-base">
          {{ successModalMessage }}
        </p>

        <!-- Resumen del día (solo al cerrar la jornada) -->
        <div v-if="daySummary" class="mt-5 bg-surface-muted border border-surface-border rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-text-muted uppercase tracking-wide">Tiempo trabajado</span>
            <span class="text-lg font-black text-text-base tabular-nums">{{ daySummary.worked }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-text-muted uppercase tracking-wide">Total del día</span>
            <span class="text-lg font-black text-primary tabular-nums">{{ daySummary.payment }}</span>
          </div>
          <div v-if="daySummary.overtimeMinutes > 0" class="flex items-center justify-between">
            <span class="text-sm font-medium text-text-muted uppercase tracking-wide">Horas extra</span>
            <span class="text-base font-bold text-text-base tabular-nums">{{ formatDuration(daySummary.overtimeMinutes) }}</span>
          </div>
          <div v-if="daySummary.delayMinutes > 0" class="flex items-center justify-between">
            <span class="text-sm font-medium text-text-muted uppercase tracking-wide">Atraso</span>
            <span class="text-base font-bold text-text-base tabular-nums">{{ formatDuration(daySummary.delayMinutes) }}</span>
          </div>
        </div>

        <p class="text-center text-sm mt-3 text-text-muted animate-pulse">Cerrando automáticamente...</p>
      </div>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseAlert from '../components/ui/BaseAlert.vue'
import { Avatar, SegmentedToggle } from '../components/ui'
import { api } from '../api'
import logoUrl from '../assets/logo.png'
import type { Worker, AttendanceRecord } from '@shared/types'
import { formatCLP } from '@shared/utils/money'
import { formatDuration } from '@shared/utils/time'

const router = useRouter()

// Lógica del Reloj Digital
const currentTime = ref('00:00:00')
const currentDate = ref('Cargando fecha...')
let timer: number

const updateTime = () => {
  const now = new Date()
  
  currentTime.value = now.toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  })
  
  currentDate.value = now.toLocaleDateString('es-CL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

onMounted(() => {
  updateTime()
  timer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

// Lógica del Formulario
const docType = ref<'RUT' | 'DNI'>('RUT')
const documentNumber = ref('')
const isLoading = ref(false)
const validationError = ref('')
const inputError = ref('')

// Estado del Modal de Errores Críticos
const isErrorModalOpen = ref(false)
const errorModalTitle = ref('')
const errorModalMessage = ref('')

// Limpiar errores al cambiar tipo de documento o escribir
watch(docType, () => {
  documentNumber.value = ''
  
  inputError.value = ''
})

// Formateador de RUT visual
const formatRut = (rut: string) => {
  let cleanRut = rut.replace(/[^0-9Kk]/g, '').toUpperCase()
  if (cleanRut.length === 0) return ''
  if (cleanRut.length === 1) return cleanRut
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formattedBody}-${dv}`
}

const handleInput = () => {
  if (validationError.value || inputError.value) {
    
    inputError.value = ''
  }
  
  if (docType.value === 'RUT') {
    documentNumber.value = formatRut(documentNumber.value)
  } else {
    documentNumber.value = documentNumber.value.toUpperCase()
  }
}

// Búsqueda del Trabajador
const handleIdentify = async () => {
  // Limpiar estados de error
  
  inputError.value = ''
  
  const doc = documentNumber.value.trim()

  // 1. Caso Límite: Campo Vacío
  if (!doc) {
    inputError.value = 'El documento es obligatorio'
    return
  }

  // 2. Caso Límite: Longitud mínima/máxima para evitar basura y overflows
  if (doc.length < 5) {
    validationError.value = 'El documento ingresado es demasiado corto.'
    return
  }
  if (doc.length > 20) {
    validationError.value = 'El documento ingresado excede el largo permitido.'
    return
  }

  // 3. Caso Límite: Formato básico RUT chileno
  if (docType.value === 'RUT') {
    const rutRegex = /^[0-9]{1,2}(\.[0-9]{3})*-[0-9K]$/;
    if (!rutRegex.test(doc)) {
      validationError.value = 'Formato de RUT inválido. Ingresa números y guión (Ej: 12.345.678-9)'
      return
    }
  }

  // Preparamos el RUT sin puntos para la DB
  const finalDoc = docType.value === 'RUT' ? doc.replace(/\./g, '') : doc;

  // Comienza la petición
  isLoading.value = true

  try {
    const result = await api.workers.identify({
      documentType: docType.value,
      documentValue: finalDoc,
    });

    if (!result.found || !result.worker) {
      showErrorModal(
        'Trabajador No Encontrado',
        `No existe ningún registro asociado al ${docType.value}: ${doc}. Consulta con administración si eres un empleado nuevo.`
      );
      documentNumber.value = '';
      return;
    }

    const worker = result.worker;

    if (worker.status !== 'ACTIVE') {
      showErrorModal(
        'Acceso Restringido',
        `El trabajador ${worker.name} no tiene permisos activos para marcar asistencia actualmente.`
      );
      documentNumber.value = '';
      return;
    }

    // 4. Verificar el estado actual de asistencia del trabajador para hoy
    const status = await api.attendance.checkToday(worker.id);

    // Jornada ya cerrada: tiene registro pero no puede marcar ni entrada ni salida.
    if (status.hasRecord && !status.canMarkEntry && !status.canMarkExit) {
      showErrorModal(
        'Jornada Completada',
        `El trabajador ${worker.name} ya registró su entrada y salida completas por el día de hoy.`
      );
      documentNumber.value = '';
      return;
    }

    identifiedWorker.value = worker;
    // Si puede marcar salida, hay un turno abierto que exponemos como registro actual.
    currentAttendance.value = status.canMarkExit ? status.record ?? null : null;
    isActionModalOpen.value = true;
    breakMinutes.value = 0; // reset
    documentNumber.value = ''; // Clean input
  } catch (error: any) {
    showErrorModal('Error del Sistema', 'Ocurrió un error al conectar con la base de datos: ' + (error?.message ?? ''));
  } finally {
    isLoading.value = false;
  }
}

// ================= ACCIONES DE ASISTENCIA (MODAL) =================
const identifiedWorker = ref<Worker | null>(null);
const currentAttendance = ref<AttendanceRecord | null>(null);
const isActionModalOpen = ref(false);
const breakMinutes = ref(0); // 0 o 30
const actionLoading = ref(false);

const isSuccessModalOpen = ref(false);
const successModalMessage = ref('');

// Resumen del día que se muestra tras cerrar la jornada (marcar salida).
interface DaySummary {
  worked: string;   // formatDuration(worked_minutes)
  payment: string;  // formatCLP(daily_payment)
  overtimeMinutes: number;
  delayMinutes: number;
}
const daySummary = ref<DaySummary | null>(null);

const closeActionModal = () => {
  if (actionLoading.value) return;
  isActionModalOpen.value = false;
  identifiedWorker.value = null;
  currentAttendance.value = null;
}

const submitAttendance = async () => {
  if (!identifiedWorker.value) return;

  const workerName = identifiedWorker.value.name;
  actionLoading.value = true;

  try {
    if (currentAttendance.value) {
      // Marcar Salida — el registro devuelto ya trae el resumen del día.
      const record = await api.attendance.markExit({
        id: currentAttendance.value.id,
        break_minutes: breakMinutes.value,
      });
      actionLoading.value = false;
      closeActionModal();
      showSuccessFeedback(`Salida registrada correctamente para ${workerName}.`, record);
    } else {
      // Marcar Entrada
      await api.attendance.markEntry({
        worker_id: identifiedWorker.value.id,
      });
      actionLoading.value = false;
      closeActionModal();
      showSuccessFeedback(`Entrada registrada correctamente para ${workerName}.`);
    }
  } catch (error: any) {
    actionLoading.value = false;
    showErrorModal('Error al registrar', error?.message || 'No se pudo guardar la asistencia.');
  }
}

const showSuccessFeedback = (msg: string, record?: AttendanceRecord) => {
  successModalMessage.value = msg;
  // Armamos el resumen del día a partir del registro devuelto (solo al marcar salida).
  daySummary.value =
    record && record.worked_minutes != null
      ? {
          worked: formatDuration(record.worked_minutes),
          payment: formatCLP(record.daily_payment ?? 0),
          overtimeMinutes: record.overtime_minutes,
          delayMinutes: record.delay_minutes,
        }
      : null;
  isSuccessModalOpen.value = true;
  documentNumber.value = '';
  setTimeout(() => {
    isSuccessModalOpen.value = false;
    daySummary.value = null;
    document.getElementById('document')?.focus();
  }, 2500); // 2.5 segundos y se cierra solo
}

const showErrorModal = (title: string, message: string) => {
  errorModalTitle.value = title
  errorModalMessage.value = message
  isErrorModalOpen.value = true
}

const closeErrorModal = () => {
  isErrorModalOpen.value = false
  // Re-enfocar automáticamente el input para que sigan escaneando
  document.getElementById('document')?.focus()
}

const goToAdmin = () => {
  router.push({ name: 'LoginAdmin' })
}
</script>
