<template>
  <div class="flex flex-col space-y-6 h-full p-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-extrabold text-text-base">Ajustes del Sistema</h2>
        <p class="text-text-muted mt-1">Configuración global de jornada, tolerancias y permisos.</p>
      </div>
    </div>

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
        type="warning"
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
                v-model="formData.start_hour"
                id="conf-start"
                type="time"
                label="Hora de Inicio Oficial"
                required
                :disabled="configStore.loading"
              />
              <p class="text-xs text-text-muted mt-2">
                Hora base referencial a partir de la cual empezarán a contar los atrasos si se excede la tolerancia.
              </p>
            </div>

            <!-- Hora Salida -->
            <div>
              <BaseInput
                v-model="formData.exit_hour"
                id="conf-exit"
                type="time"
                label="Hora de Salida Oficial"
                required
                :disabled="configStore.loading"
              />
              <p class="text-xs text-text-muted mt-2">
                Hora requerida para el cálculo unificado del total a pagar (jornada máxima).
              </p>
            </div>

            <!-- Tolerancia -->
            <div>
              <BaseInput
                v-model.number="formData.tolerance_minutes"
                id="conf-tol"
                type="number"
                label="Tolerancia de Atraso (min.)"
                required
                min="0"
                :disabled="configStore.loading"
              />
              <p class="text-xs text-text-muted mt-2">
                Margen de gracia al entrar. Un minuto tarde descuenta 1 minuto exacto del pago total.
              </p>
            </div>

            <!-- Tolerancia Marcaje Salida -->
            <div>
              <BaseInput
                v-model.number="formData.exit_tolerance_minutes"
                id="conf-exit-tol"
                type="number"
                label="Tolerancia Marcaje Salida (min.)"
                required
                min="0"
                :disabled="configStore.loading"
              />
              <p class="text-xs text-text-muted mt-2">
                Minutos permitidos para marcar la salida antes de la hora real estipulada.
              </p>
            </div>

            <!-- Colación -->
            <div>
              <BaseInput
                v-model.number="formData.default_break_minutes"
                id="conf-break"
                type="number"
                label="Minutos de Colación Oficial"
                required
                min="0"
                :disabled="configStore.loading"
              />
              <p class="text-xs text-text-muted mt-2">
                Duración del descanso de almuerzo a descontar del tiempo trabajado.
              </p>
            </div>

            <!-- Jornada Base -->
            <div class="sm:col-span-2">
              <BaseInput
                v-model.number="formData.base_daily_hours"
                id="conf-base"
                type="number"
                step="0.1"
                label="Horas de Jornada Base"
                required
                min="0"
                :disabled="configStore.loading"
              />
              <p class="text-xs text-text-muted mt-2">
                Usado para cálculos estándar. Con soporte para decimales, ejemplo: 8.5

              </p>
            </div>
            
            <!-- Valor de Hora Extra -->
            <div class="sm:col-span-2">
              <BaseInput
                v-model.number="formData.overtime_multiplier"
                id="conf-overtime-mult"
                type="number"
                step="0.01"
                label="Multiplicador Global de Hora Extra (Ej: 1.5)"
                required
                min="1.0"
                :disabled="configStore.loading"
              />
              <p class="text-xs text-text-muted mt-2">
                Factor de recargo general para las horas extras. Ejemplo: 1.5 significa 50% de recargo sobre el valor base de la hora del trabajador. ESTOS CAMBIOS ENTRARÁN A REGIR EL DÍA SIGUIENTE.
              </p>
            </div>
            
          </div>

          <div class="mt-4 pt-6 border-t border-surface-border flex justify-end">
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
import { AuthChannels } from '../../../shared/types/ipc';

import BaseCard from '../../components/ui/BaseCard.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseAlert from '../../components/ui/BaseAlert.vue';

const configStore = useConfigStore();
const adminStore = useAdminStore();
const successMsg = ref('');

const formData = ref({
  start_hour: '09:00',
  exit_hour: '18:00',
  tolerance_minutes: 5,
  exit_tolerance_minutes: 15,
  default_break_minutes: 30,
  base_daily_hours: 8.5,
  overtime_rate: 5000,
  overtime_multiplier: 1.5
});

// Sincronizar store state con form local
watch(() => configStore.config, (newConf) => {
  if (newConf) {
    formData.value = {
      start_hour: newConf.start_hour,
      exit_hour: newConf.exit_hour || '18:00',
      tolerance_minutes: newConf.tolerance_minutes,
      exit_tolerance_minutes: newConf.exit_tolerance_minutes !== undefined ? newConf.exit_tolerance_minutes : 15,
      default_break_minutes: newConf.default_break_minutes !== undefined ? newConf.default_break_minutes : 30,
      base_daily_hours: newConf.base_daily_hours,
      overtime_rate: newConf.overtime_rate !== undefined ? newConf.overtime_rate : 5000,
      overtime_multiplier: newConf.overtime_multiplier !== undefined ? newConf.overtime_multiplier : 1.5
    };
  }
}, { deep: true, immediate: true });

const saveConfig = async () => {
  successMsg.value = '';
  const ok = await configStore.updateConfig({
    start_hour: formData.value.start_hour,
    exit_hour: formData.value.exit_hour,
    tolerance_minutes: Number(formData.value.tolerance_minutes),
    exit_tolerance_minutes: Number(formData.value.exit_tolerance_minutes),      
    default_break_minutes: Number(formData.value.default_break_minutes),        
    base_daily_hours: Number(formData.value.base_daily_hours),
    overtime_rate: Number(formData.value.overtime_rate),
    overtime_multiplier: Number(formData.value.overtime_multiplier)
  });

  if (ok) {
    successMsg.value = 'AVISO IMPORTANTE: Los cambios en la configuración (incluido el multiplicador extra) ya fueron guardados. Todos los ajustes aplicarán a las marcaciones desde el SIGUIENTE turno.';
    setTimeout(() => successMsg.value = '', 6000);
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
    const res = await window.electron.invoke(AuthChannels.CHANGE_PASSWORD, {
      username: adminStore.username,
      oldPassword: pwdForm.value.oldPassword,
      newPassword: pwdForm.value.newPassword
    });

    if (res && res.success) {
      pwdSuccess.value = 'Contraseña actualizada exitosamente.';
      pwdForm.value.oldPassword = '';
      pwdForm.value.newPassword = '';
      pwdForm.value.confirmPassword = '';
      setTimeout(() => pwdSuccess.value = '', 4000);
    } else {
      pwdError.value = res?.error || 'Error al cambiar la contraseña';
    }
  } catch (error: any) {
    pwdError.value = error.message || 'Ocurrió un error inesperado';
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
