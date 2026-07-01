<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <PageHeader
      title="Ajustes del Sistema"
      subtitle="Configuración global de jornada, tolerancias y permisos."
    />

    <!-- Alertas -->
    <div class="flex flex-col gap-3 mb-2" v-if="configStore.error || successMsg">
      <BaseAlert 
        v-if="configStore.error" 
        type="error" 
        title="Error al Guardar"
        :message="configStore.error"
        dismissible
      />
      <BaseAlert
        v-if="successMsg"
        type="success"
        title="Configuración Actualizada - Importante"
        :message="successMsg"
        dismissible
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
      <!-- Tarjeta Formulario -->
      <BaseCard class="lg:col-span-2 flex flex-col h-fit" v-if="configStore.config">
        <form @submit.prevent="saveConfig" class="flex flex-col gap-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <!-- Hora inicio -->
            <div>
              <BaseInput
                v-model="formData.startHour"
                id="conf-start"
                type="time"
                label="Hora de Inicio Oficial"
                required
                :disabled="configStore.loading"
                hint="Hora base referencial a partir de la cual empezarán a contar los atrasos si se excede la tolerancia."
              />
            </div>

            <!-- Hora Salida -->
            <div>
              <BaseInput
                v-model="formData.exitHour"
                id="conf-exit"
                type="time"
                label="Hora de Salida Oficial"
                required
                :disabled="configStore.loading"
                hint="Hora requerida para el cálculo unificado del total a pagar (jornada máxima)."
              />
            </div>

            <!-- Tolerancia -->
            <div>
              <BaseInput
                v-model.number="formData.toleranceMinutes"
                id="conf-tol"
                type="number"
                label="Tolerancia de Atraso (min.)"
                required
                min="0"
                :disabled="configStore.loading"
                hint="Margen de gracia al entrar. Un minuto tarde descuenta 1 minuto exacto del pago total."
              />
            </div>

            <!-- Tolerancia Marcaje Salida -->
            <div>
              <BaseInput
                v-model.number="formData.exitToleranceMinutes"
                id="conf-exit-tol"
                type="number"
                label="Tolerancia Marcaje Salida (min.)"
                required
                min="0"
                :disabled="configStore.loading"
                hint="Minutos permitidos para marcar la salida antes de la hora real estipulada."
              />
            </div>

            <!-- Colación -->
            <div>
              <BaseInput
                v-model.number="formData.defaultBreakMinutes"
                id="conf-break"
                type="number"
                label="Minutos de Colación Oficial"
                required
                min="0"
                :disabled="configStore.loading"
                hint="Duración del descanso de almuerzo a descontar del tiempo trabajado."
              />
            </div>

            <!-- Jornada Base -->
            <div class="sm:col-span-2">
              <BaseInput
                v-model.number="formData.baseDailyHours"
                id="conf-base"
                type="number"
                step="0.1"
                label="Horas de Jornada Base"
                required
                min="0"
                :disabled="configStore.loading"
                hint="Usado para cálculos estándar. Con soporte para decimales, ejemplo: 8.5"
              />
            </div>

            <!-- Valor de Hora Extra -->
            <div class="sm:col-span-2">
              <BaseInput
                v-model.number="formData.overtimeMultiplier"
                id="conf-overtime-mult"
                type="number"
                step="0.01"
                label="Multiplicador Global de Hora Extra (Ej: 1.5)"
                required
                min="1.0"
                :disabled="configStore.loading"
                hint="Factor de recargo general para las horas extras. Ejemplo: 1.5 significa 50% de recargo sobre el valor base de la hora del trabajador."
              />
            </div>

          </div>

          <!-- Aplicar desde -->
          <div class="flex flex-col gap-3 pt-2">
            <span class="text-sm font-semibold text-text-base">Aplicar cambios desde</span>
            <div class="flex flex-col sm:flex-row gap-3">
              <label
                class="flex-1 flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="formData.applyFrom === 'tomorrow' ? 'border-primary bg-primary/5' : 'border-surface-border'"
              >
                <input
                  type="radio"
                  value="tomorrow"
                  v-model="formData.applyFrom"
                  :disabled="configStore.loading"
                  class="mt-1"
                />
                <span>
                  <span class="block text-sm font-medium text-text-base">Mañana (recomendado)</span>
                  <span class="block text-xs text-text-muted">Los marcajes de hoy conservan su configuración; el cambio rige desde mañana.</span>
                </span>
              </label>
              <label
                class="flex-1 flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="formData.applyFrom === 'today' ? 'border-primary bg-primary/5' : 'border-surface-border'"
              >
                <input
                  type="radio"
                  value="today"
                  v-model="formData.applyFrom"
                  :disabled="configStore.loading"
                  class="mt-1"
                />
                <span>
                  <span class="block text-sm font-medium text-text-base">Hoy</span>
                  <span class="block text-xs text-text-muted">Aplica de inmediato y afecta el cálculo de los marcajes de hoy.</span>
                </span>
              </label>
            </div>

            <BaseAlert
              v-if="formData.applyFrom === 'today'"
              type="warning"
              title="Atención"
              message="Aplicar desde HOY recalculará los marcajes registrados hoy con los nuevos parámetros."
            />
          </div>

          <div class="mt-4 pt-6 border-t border-surface-border flex items-center justify-between gap-4">
            <p class="text-sm text-text-muted" v-if="configStore.current">
              Vigente desde: <span class="font-medium text-text-base">{{ configStore.current.effectiveFrom }}</span>
            </p>
            <BaseButton type="submit" variant="primary" :is-loading="configStore.loading">
              <template #icon>
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </template>
              Guardar Configuración
            </BaseButton>
          </div>
        </form>
      </BaseCard>

      <!-- Skeleton de Load -->
      <BaseCard v-else class="lg:col-span-2 flex items-center justify-center min-h-[300px]">
        <div class="flex flex-col items-center gap-3 text-text-muted">
          <svg class="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Cargando parámetros...</p>
        </div>
      </BaseCard>

      <!-- Info lateral y Cambio de Contraseña -->
      <div class="flex flex-col space-y-6">
        <!-- Cambio programado (pending) -->
        <BaseCard v-if="configStore.pending" class="bg-warning/5 border-warning/30">
          <h3 class="text-lg font-bold text-warning flex items-center gap-2 mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Cambio programado
          </h3>
          <p class="text-sm text-text-muted mb-4">
            Hay una configuración que entrará en vigencia el
            <span class="font-medium text-text-base">{{ configStore.pending.effectiveFrom }}</span>.
          </p>
          <div class="flex justify-end">
            <BaseButton variant="secondary" :is-loading="cancelLoading" @click="cancelPending">
              Cancelar cambio
            </BaseButton>
          </div>
        </BaseCard>

        <BaseCard class="bg-primary/5 border-primary/20">
          <h3 class="text-lg font-bold text-primary flex items-center gap-2 mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            ¿Cómo funciona la configuración?
          </h3>
          <p class="text-sm text-text-muted mb-4">
            Cada vez que un trabajador **marca su entrada**, el sistema toma una "foto" (snapshot) de estos valores.
          </p>
          <p class="text-sm text-text-muted">
            Esto garantiza que si modificas el valor de hora de un trabajador o las horas base en un futuro, el **historial anterior no se verá afectado**, manteniendo la integridad de auditoría contable.
          </p>
        </BaseCard>

        <!-- Cambio de Contraseña -->
        <BaseCard>
          <h3 class="text-lg font-bold text-text-base mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            Cambiar Contraseña
          </h3>
          
          <BaseAlert 
            v-if="pwdError" 
            type="error" 
            :message="pwdError"
            class="mb-3"
          />
          <BaseAlert 
            v-if="pwdSuccess" 
            type="success" 
            :message="pwdSuccess"
            class="mb-3"
          />

          <form @submit.prevent="changePassword" class="flex flex-col gap-4">
            <BaseInput
              v-model="pwdForm.oldPassword"
              id="pwd-old"
              type="password"
              label="Contraseña Actual"
              required
              :disabled="pwdLoading"
            />
            <BaseInput
              v-model="pwdForm.newPassword"
              id="pwd-new"
              type="password"
              label="Nueva Contraseña"
              required
              :disabled="pwdLoading"
            />
            <BaseInput
              v-model="pwdForm.confirmPassword"
              id="pwd-confirm"
              type="password"
              label="Confirmar Nueva"
              required
              :disabled="pwdLoading"
            />
            
            <div class="flex justify-end mt-2">
              <BaseButton type="submit" variant="primary" :is-loading="pwdLoading">
                Actualizar Clave
              </BaseButton>
            </div>
          </form>
        </BaseCard>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useConfigStore } from '../../stores/configStore';
import { useAdminStore } from '../../stores/adminStore';
import { api } from '../../api';

import { PageHeader, BaseCard, BaseInput, BaseButton, BaseAlert } from '../../components/ui';

const configStore = useConfigStore();
const adminStore = useAdminStore();
const successMsg = ref('');

const formData = ref({
  startHour: '09:00',
  exitHour: '18:00',
  toleranceMinutes: 5,
  exitToleranceMinutes: 15,
  defaultBreakMinutes: 30,
  baseDailyHours: 8.5,
  overtimeMultiplier: 1.5,
  applyFrom: 'tomorrow' as 'today' | 'tomorrow'
});

// Sincronizar store state (config vigente hoy, camelCase) con el form local
watch(() => configStore.config, (newConf) => {
  if (newConf) {
    formData.value = {
      startHour: newConf.startHour,
      exitHour: newConf.exitHour,
      toleranceMinutes: newConf.toleranceMinutes,
      exitToleranceMinutes: newConf.exitToleranceMinutes,
      defaultBreakMinutes: newConf.defaultBreakMinutes,
      baseDailyHours: newConf.baseDailyHours,
      overtimeMultiplier: newConf.overtimeMultiplier,
      applyFrom: 'tomorrow'
    };
  }
}, { deep: true, immediate: true });

const saveConfig = async () => {
  successMsg.value = '';
  const ok = await configStore.updateConfig({
    startHour: formData.value.startHour,
    exitHour: formData.value.exitHour,
    toleranceMinutes: Number(formData.value.toleranceMinutes),
    exitToleranceMinutes: Number(formData.value.exitToleranceMinutes),
    defaultBreakMinutes: Number(formData.value.defaultBreakMinutes),
    baseDailyHours: Number(formData.value.baseDailyHours),
    overtimeMultiplier: Number(formData.value.overtimeMultiplier),
    applyFrom: formData.value.applyFrom
  });

  if (ok) {
    successMsg.value = formData.value.applyFrom === 'today'
      ? 'Configuración guardada. Los cambios aplican desde HOY y recalculan los marcajes registrados hoy.'
      : 'Configuración guardada. Los cambios entrarán en vigencia MAÑANA; los marcajes de hoy conservan su configuración actual.';
    setTimeout(() => successMsg.value = '', 6000);
  }
};

// Cancelar cambio programado (pending)
const cancelLoading = ref(false);
const cancelPending = async () => {
  cancelLoading.value = true;
  try {
    await configStore.cancelPending();
  } catch (error: any) {
    configStore.error = error?.message || 'No se pudo cancelar el cambio programado.';
  } finally {
    cancelLoading.value = false;
  }
};

// Lógica de Contraseña
const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const pwdLoading = ref(false);
const pwdError = ref('');
const pwdSuccess = ref('');

const changePassword = async () => {
  pwdError.value = '';
  pwdSuccess.value = '';

  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    pwdError.value = 'Las contraseñas nuevas no coinciden';
    return;
  }

  if (!adminStore.username) {
    pwdError.value = 'Error de sesión: no se encontró usuario activo.';
    return;
  }

  pwdLoading.value = true;
  try {
    await api.auth.changePassword({
      username: adminStore.username,
      oldPassword: pwdForm.value.oldPassword,
      newPassword: pwdForm.value.newPassword
    });

    pwdSuccess.value = 'Contraseña actualizada exitosamente.';
    pwdForm.value.oldPassword = '';
    pwdForm.value.newPassword = '';
    pwdForm.value.confirmPassword = '';
    setTimeout(() => pwdSuccess.value = '', 4000);
  } catch (error: any) {
    pwdError.value = error?.message || 'Ocurrió un error inesperado';
  } finally {
    pwdLoading.value = false;
  }
};

onMounted(async () => {
  if (!configStore.config) {
    await configStore.loadConfig();
  }
});
</script>
