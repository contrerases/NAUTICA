<template>
  <div class="flex flex-col space-y-6 h-full">
    <!-- Encabezado -->
    <PageHeader
      title="Gestión de Trabajadores"
      subtitle="Administra el personal, sus identidades y el valor de hora."
    >
      <template #actions>
        <BaseButton @click="openCreateModal" variant="primary">
          <template #icon>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>


          </template>
          Nuevo Trabajador
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Barra de Filtros Avanzados -->
    <BaseCard padding="base" class="bg-surface-muted border-none w-full">
      <div class="flex flex-row flex-wrap lg:flex-nowrap items-end gap-4 w-full">
        <BaseInput
          v-model="searchQuery"
          id="search-worker"
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
          label="Ingreso Desde"
          class="w-full sm:w-40 flex-shrink-0"
        />

        <BaseInput
          v-model="filterDateTo"
          id="filter-date-to"
          type="date"
          label="Ingreso Hasta"
          class="w-full sm:w-40 flex-shrink-0"
        />

        <div class="w-full sm:w-auto min-w-[200px] flex-shrink-0">
          <BaseSelect v-model="statusFilter" label="Estado">
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </BaseSelect>
        </div>
      </div>
    </BaseCard>

    <!-- Alertas Generales -->
    <div class="flex flex-col gap-3 mb-4" v-if="errorGlobal || successGlobal">
      <BaseAlert 
        v-if="errorGlobal" 
        type="error" 
        :title="'Error'"
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
        :data="filteredWorkers"
        :loading="loading"
        class="h-full"
      >
        <!-- Col Nombre -->
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <Avatar :name="row.name" :photo="row.photo" size="md" color="primary" />
            <div>
              <div class="font-bold text-text-base">{{ row.name }}</div>
              <div class="text-xs text-text-muted">Creado: {{ formatDate(row.created_at) }}</div>
            </div>
          </div>


        </template>

        <!-- Col Documento -->
        <template #cell-document="{ row }">
          <div class="flex items-center gap-2">
            <span v-if="row.rut" class="font-mono text-sm">{{ row.rut }} <span class="text-text-muted text-xs">(RUT)</span></span>
            <span v-else-if="row.dni" class="font-mono text-sm">{{ row.dni }} <span class="text-text-muted text-xs">(DNI)</span></span>
            <span v-else class="text-text-muted italic text-sm">Sin Documento</span>
          </div>


        </template>

        <!-- Col Valor Hora / Sueldo -->
        <template #cell-hourly_rate="{ row }">
          <div class="flex flex-col">
            <template v-if="row.pay_model === 'FIXED_SALARY'">
              <span class="font-mono font-bold text-primary">{{ formatCLP(row.monthly_salary) }}<span class="text-[10px] font-sans text-text-muted"> /mes</span></span>
              <span class="text-[10px] text-text-muted mt-0.5">Sueldo fijo · hora {{ formatCLP(row.hourly_rate) }}</span>
            </template>
            <span v-else class="font-mono font-medium text-emerald-500">{{ formatCLP(row.hourly_rate) }}</span>
          </div>
        </template>

        <!-- Col Valor Hora Extra -->
        <template #cell-overtime="{ row }">
          <div class="flex flex-col">
            <span class="font-mono font-bold text-amber-500">{{ formatCLP(row.hourly_rate * overtimeMultiplier) }}</span>
            <span class="text-[10px] text-text-muted mt-0.5">x{{ overtimeMultiplier }}</span>
          </div>


        </template>

        <!-- Col Ingreso -->
        <template #cell-start_date="{ row }">
          {{ row.start_date || '-' }}


        </template>

        <!-- Col Estado -->
        <template #cell-status="{ row }">
          <BaseBadge :variant="row.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ row.status === 'ACTIVE' ? 'ACTIVO' : 'INACTIVO' }}
          </BaseBadge>


        </template>

        <!-- Col Acciones -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2 justify-end">
            <!-- Botón Adelantos -->
            <IconButton
              color="warning"
              title="Gestionar Adelantos de Dinero"
              @click="openAdvances(row)"
            >
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </IconButton>

            <!-- Botón Ver Detalles -->
            <IconButton
              color="primary"
              title="Resumen General"
              @click="openDetailsModal(row)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </IconButton>

            <!-- Botón Editar -->
            <IconButton
              color="primary"
              title="Editar"
              @click="openEditModal(row)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </IconButton>

            <!-- Botón Cambiar Estado (Soft Delete / Reactivate) -->
            <IconButton
              v-if="row.status === 'ACTIVE'"
              color="warning"
              title="Desactivar Temporalmente"
              @click="toggleStatus(row)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
              </svg>
            </IconButton>
            <IconButton
              v-else
              color="success"
              title="Activar"
              @click="toggleStatus(row)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </IconButton>

            <!-- Botón Eliminar Permanente (Hard Delete) -->
            <IconButton
              color="danger"
              title="Eliminar Permanentemente (Purgar)"
              @click="promptHardDelete(row)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </IconButton>
          </div>


        </template>
      </BaseTable>
    </BaseCard>

    <!-- Modal Formulario de Trabajador -->
    <BaseModal 
      :is-open="isModalOpen" 
      @close="closeModal" 
      :title="isEditing ? 'Editar Trabajador' : 'Nuevo Trabajador'"
      max-width="lg"
    >
      <div class="p-6">
        <BaseAlert 
          v-if="formError" 
          type="error" 
          title="Error en el formulario" 
          :message="formError" 
          class="mb-6"
        />

        <form @submit.prevent="submitForm" class="space-y-5">
          <!-- Nombre Completo -->
          <BaseInput
            v-model="formData.name"
            id="worker-name"
            label="Nombre Completo"
            placeholder="Ej: Juan Pérez"
            required
            :disabled="formLoading"
          />

          <!-- Selector de Documento -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Tipo de Documento (UI Falsa para manejar la lógica internamente) -->
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-text-base ml-1">Tipo de Documento</label>
              <SegmentedToggle
                v-model="docType"
                :disabled="formLoading"
                :options="[
                  { value: 'RUT', label: 'RUT (Chile)' },
                  { value: 'DNI', label: 'DNI (Ext.)' },
                ]"
              />
            </div>

            <!-- Input Documento -->
            <BaseInput
              v-model="documentValue"
              id="worker-doc"
              :label="docType === 'RUT' ? 'Número de RUT' : 'Número de Documento'"
              :placeholder="docType === 'RUT' ? 'Ej: 12345678-9' : 'Ej: AB123456'"
              required
              :disabled="formLoading"
            />
          </div>

          <!-- Modelo de pago -->
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-text-base ml-1">Modelo de pago</label>
            <SegmentedToggle
              v-model="formData.pay_model"
              :disabled="formLoading"
              :options="[
                { value: 'HOURLY', label: 'Por hora' },
                { value: 'FIXED_SALARY', label: 'Sueldo fijo' },
              ]"
            />
            <p class="text-xs text-text-muted ml-1 mt-1">
              <template v-if="formData.pay_model === 'FIXED_SALARY'">
                Sueldo fijo mensual: la jornada normal va incluida en el sueldo. Las horas extra se pagan aparte y los atrasos del mes se descuentan.
              </template>
              <template v-else>
                Se paga por hora trabajada (más las horas extra).
              </template>
            </p>
          </div>

          <!-- Sueldo mensual (solo modelo sueldo fijo) -->
          <MoneyInput
            v-if="formData.pay_model === 'FIXED_SALARY'"
            v-model="formData.monthly_salary"
            id="worker-salary"
            label="Sueldo mensual ($)"
            placeholder="Ej: 500.000"
            :disabled="formLoading"
          />

          <!-- Valor Hora y Fecha Ingreso -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MoneyInput
              v-model="formData.hourly_rate"
              id="worker-rate"
              :label="formData.pay_model === 'FIXED_SALARY' ? 'Valor hora — extras y atrasos ($)' : 'Valor Hora ($)'"
              placeholder="Ej: 5.000"
              :disabled="formLoading"
            />

            <BaseInput
              v-model="formData.start_date"
              id="worker-start"
              type="date"
              label="Fecha de Ingreso"
              required
              :disabled="formLoading"
            />
          </div>

          <!-- Foto del Trabajador (Opcional) -->
          <div>
            <label class="block text-sm font-semibold text-text-base ml-1 mb-1">Foto del Trabajador (Opcional)</label>
            <div class="flex items-center gap-4 border border-surface-border rounded-xl p-3 bg-surface">
              <div v-if="formData.photo" class="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-primary/20">
                <img :src="formData.photo" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-16 h-16 rounded-full shrink-0 flex items-center justify-center bg-body text-text-muted border border-surface-border border-dashed">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>

              <div class="flex-1 mt-1 sm:mt-0 relative group">
                <BaseButton type="button" variant="outline" class="w-full" size="sm" @click="triggerPhotoUpload">
                  {{ formData.photo ? 'Cambiar Foto' : 'Subir Foto' }}
                </BaseButton>
                <input 
                  type="file" 
                  ref="photoInputRef" 
                  accept="image/jpeg, image/png, image/webp" 
                  @change="handlePhotoUpload" 
                  class="hidden"
                />
              </div>

              <!-- Remover Foto Actual -->
              <button 
                v-if="formData.photo" 
                type="button" 
                @click="formData.photo = null" 
                class="shrink-0 p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors border-none"
                title="Eliminar Foto"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>

          <!-- Footer Botones -->
          <div class="flex justify-end gap-3 pt-4 border-t border-surface-border mt-6">
            <BaseButton type="button" variant="outline" @click="closeModal" :disabled="formLoading">
              Cancelar
            </BaseButton>
            <BaseButton type="submit" variant="primary" :is-loading="formLoading">
              {{ isEditing ? 'Guardar Cambios' : 'Crear Trabajador' }}
            </BaseButton>
          </div>
        </form>
      </div>
    </BaseModal>

    <!-- Modal Detalles de Trabajador -->
    <BaseModal 
      :is-open="isDetailsModalOpen" 
      @close="closeDetailsModal" 
      title="Resumen del Trabajador"
      max-width="md"
    >
      <div class="p-6" v-if="selectedWorkerDetails">
        <div class="flex items-center gap-4 mb-6">
          <Avatar :name="selectedWorkerDetails.name" :photo="selectedWorkerDetails.photo" size="lg" color="primary" />
          <div>
            <h3 class="text-xl font-bold text-text-base">{{ selectedWorkerDetails.name }}</h3>
            <BaseBadge :variant="selectedWorkerDetails.status === 'ACTIVE' ? 'success' : 'danger'" class="mt-1">
              {{ selectedWorkerDetails.status === 'ACTIVE' ? 'ACTIVO' : 'INACTIVO' }}
            </BaseBadge>
          </div>
        </div>

        <div class="space-y-5">
          <div class="grid grid-cols-2 gap-4 bg-surface p-4 rounded-xl border border-surface-border">
            <div>
              <p class="text-xs text-text-muted font-semibold uppercase tracking-wider">Documento</p>
              <p class="font-mono text-sm mt-1 text-text-base">{{ selectedWorkerDetails.rut || selectedWorkerDetails.dni || 'No registrado' }}</p>
            </div>
            <div>
              <p class="text-xs text-text-muted font-semibold uppercase tracking-wider">
                {{ selectedWorkerDetails.pay_model === 'FIXED_SALARY' ? 'Valor Hora (extras/atrasos)' : 'Valor Hora' }}
              </p>
              <p class="font-mono text-emerald-500 font-medium mt-1 text-sm">{{ formatCLP(selectedWorkerDetails.hourly_rate) }} / hr</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-text-muted font-semibold uppercase tracking-wider">Modelo de pago</p>
              <p class="mt-1 text-sm text-text-base">
                <template v-if="selectedWorkerDetails.pay_model === 'FIXED_SALARY'">
                  Sueldo fijo — <span class="font-mono text-primary font-semibold">{{ formatCLP(selectedWorkerDetails.monthly_salary) }}</span> / mes
                </template>
                <template v-else>Por hora</template>
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-text-muted font-semibold uppercase tracking-wider">Fecha Ingreso</p>
              <p class="text-sm mt-1 text-text-base">{{ selectedWorkerDetails.start_date ? formatDate(selectedWorkerDetails.start_date) : 'No registrado' }}</p>
            </div>
          </div>
          
          <div>
            <h4 class="text-sm font-bold text-text-base mb-3 flex items-center gap-2">
              <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              Datos de Auditoría
            </h4>
            <div class="bg-body p-4 rounded-xl border border-surface-border space-y-3 text-xs">
              <div class="flex justify-between border-b border-surface-border pb-2">
                <span class="text-text-muted">ID Interno en BD:</span>
                <span class="text-text-base font-mono font-bold">#{{ selectedWorkerDetails.id }}</span>
              </div>
              <div class="flex justify-between border-b border-surface-border pb-2">
                <span class="text-text-muted">Desempeño actual:</span>
                <span class="text-text-base">{{ selectedWorkerDetails.status === 'ACTIVE' ? 'En operaciones' : 'Dado de baja' }}</span>
              </div>
              <div class="flex justify-between border-b border-surface-border pb-2">
                <span class="text-text-muted">Fecha de Creación:</span>
                <span class="text-text-base">{{ formatDateTime(selectedWorkerDetails.created_at) }}</span>
              </div>
              <div class="flex justify-between pb-1">
                <span class="text-text-muted">Última Modificación:</span>
                <span class="text-text-base">{{ selectedWorkerDetails.updated_at ? formatDateTime(selectedWorkerDetails.updated_at) : 'Sin modificaciones' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Botones -->
        <div class="flex justify-end pt-5 mt-2">
          <BaseButton type="button" variant="primary" @click="closeDetailsModal">
            Entendido
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Emergente de Errores (Global UI) -->
    <BaseModal 
      :is-open="isErrorModalOpen" 
      @close="isErrorModalOpen = false" 
      title="Atención requerida"
      type="error"
      max-width="sm"
    >
      <div class="px-2 py-4">
        <p class="text-text-base text-lg font-medium text-center">
          {{ errorModalMessage }}
        </p>
      </div>
      <template #footer>
        <BaseButton variant="secondary" class="w-full" @click="isErrorModalOpen = false">
          Entendido
        </BaseButton>


      </template>
    </BaseModal>
  



    <!-- Modal de Adelantos -->
    <BaseModal
      v-model:is-open="isAdvModalOpen"
      :title="`Adelantos - ${selectedWorkerForAdv?.name}`"
      size="md"
      @close="closeAdvances"
    >
      <div class="space-y-4">
        <form @submit.prevent="submitAdvance" class="space-y-3 bg-surface-muted/50 p-4 rounded-xl border border-surface-border">
          <h4 class="text-sm font-bold text-text-base uppercase tracking-wider">Registrar Nuevo Adelanto</h4>
          <div class="grid grid-cols-2 gap-3">
            <BaseInput v-model="newAdv.date" type="date" required label="Fecha" />
            <MoneyInput v-model="newAdv.amount" label="Monto ($)" placeholder="Ej: 20.000" />
          </div>
          <BaseInput v-model="newAdv.notes" type="text" label="Observación (Opcional)" placeholder="Ej: Transporte, salud..." />
          <BaseButton type="submit" variant="primary" class="w-full" :is-loading="advLoading">Agregar Adelanto</BaseButton>
        </form>

        <div class="mt-4 pt-4 border-t border-surface-border/50">
          <h4 class="text-sm font-bold text-text-base mb-3 flex items-center justify-between">
            <span>Historial Completo</span>
            <span class="text-xs font-normal text-text-muted">Mes actual: {{ formatCLP(totalAdvancesMoth) }}</span>
          </h4>
          <div v-if="advLoadingList" class="text-center py-4 text-text-muted text-sm animate-pulse">Cargando historial...</div>
          <div v-else-if="advances.length === 0" class="text-center py-4 text-text-muted text-sm italic">Sin adelantos registrados.</div>
          <ul v-else class="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            <li v-for="adv in advances" :key="adv.id" class="bg-surface border border-surface-border p-3 rounded-lg shadow-sm">
              <!-- Modo Edición (solo mes en curso) -->
              <div v-if="editingAdvId === adv.id" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <BaseInput v-model="editAdv.date" type="date" required label="Fecha" />
                  <MoneyInput v-model="editAdv.amount" label="Monto ($)" placeholder="Ej: 20.000" />
                </div>
                <BaseInput v-model="editAdv.notes" type="text" label="Observación (Opcional)" placeholder="Ej: Transporte, salud..." />
                <div class="flex justify-end gap-2">
                  <BaseButton type="button" variant="outline" size="sm" @click="cancelEditAdvance" :disabled="advEditLoading">Cancelar</BaseButton>
                  <BaseButton type="button" variant="primary" size="sm" @click="saveEditAdvance" :is-loading="advEditLoading">Guardar</BaseButton>
                </div>
              </div>

              <!-- Modo Lectura -->
              <div v-else class="flex justify-between items-center">
                <div>
                  <strong class="text-emerald-500 font-mono">{{ formatCLP(adv.amount) }}</strong>
                  <p class="text-xs text-text-muted mt-0.5">
                    {{ formatDate(adv.date) }}
                    <span v-if="adv.notes" class="italic">- {{ adv.notes }}</span>
                  </p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <template v-if="isCurrentMonthAdvance(adv)">
                    <button @click="startEditAdvance(adv)" class="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors border-none" title="Editar este adelanto">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button @click="deleteAdvance(adv.id)" class="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors border-none" title="Eliminar este adelanto">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </template>
                  <span v-else class="text-[10px] text-text-muted/70 italic uppercase tracking-wider">mes cerrado</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" class="w-full" @click="closeAdvances">Cerrar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Worker, WorkerAdvance, CreateWorkerDto, UpdateWorkerDto, PayModel } from '@shared/types';
import { formatCLP } from '@shared/utils/money';
import { isValidRut } from '@shared/utils/rut';
import { today, currentMonth, monthOf } from '@shared/utils/date';
import { askConfirm } from '../../composables/useConfirm';
import { api } from '../../api';
import { useConfigStore } from '../../stores/configStore';
import { useAdminStore } from '../../stores/adminStore';
import {
  BaseCard,
  BaseTable,
  BaseButton,
  BaseBadge,
  BaseInput,
  BaseModal,
  BaseAlert,
  BaseSelect,
  PageHeader,
  Avatar,
  IconButton,
  SegmentedToggle,
  MoneyInput,
} from '../../components/ui';

// ================= ESTADO DE LA VISTA =================
const workers = ref<Worker[]>([]);
const loading = ref(true);
const errorGlobal = ref('');
const successGlobal = ref('');
const searchQuery = ref('');
const statusFilter = ref('ALL');
const filterDateFrom = ref('');
const filterDateTo = ref('');

// ================= DEFINICIÓN DE TABLA =================
const configStore = useConfigStore();
const adminStore = useAdminStore();

/** Multiplicador de hora extra vigente (config en camelCase). */
const overtimeMultiplier = computed(() => configStore.config?.overtimeMultiplier ?? 1.5);

const tableColumns = [
  { key: 'name', label: 'Nombre Completo' },
  { key: 'document', label: 'Documento' },
  { key: 'hourly_rate', label: 'Valor Hora' },
  { key: 'overtime', label: 'Hora Extra' },
  { key: 'start_date', label: 'F. Ingreso' },
  { key: 'status', label: 'Estado', align: 'center' as const },
  { key: 'actions', label: 'Acciones', align: 'right' as const }
];

// Filtrado reactivo en el frontend para búsqueda y estado
const filteredWorkers = computed(() => {
  return workers.value.filter(w => {
    // 1. Filtrar por Estado
    if (statusFilter.value !== 'ALL' && w.status !== statusFilter.value) {
      return false;
    }
    
    // 2. Rango de Fechas
    if (w.start_date) {
      if (filterDateFrom.value && w.start_date < filterDateFrom.value) {
        return false;
      }
      if (filterDateTo.value && w.start_date > filterDateTo.value) {
        return false;
      }
    }

    // 3. Filtrar por Búsqueda (Nombre o Documento)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      const matchesSearch = w.name.toLowerCase().includes(q) ||
                            (w.rut && w.rut.toLowerCase().includes(q)) ||
                            (w.dni && w.dni.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    return true;
  });
});

const loadWorkers = async () => {
  loading.value = true;
  errorGlobal.value = '';
  try {
    workers.value = await api.workers.getAll();
  } catch (err: any) {
    console.error('Error cargando trabajadores:', err);
    errorGlobal.value = err.message || 'Error al conectar con la base de datos.';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  loadWorkers();
  if (!configStore.config) {
    await configStore.loadConfig();
  }
});

// ================= ADELANTOS LÓGICA =================
const isAdvModalOpen = ref(false);
const selectedWorkerForAdv = ref<Worker | null>(null);
const newAdv = ref({ amount: 0, date: today(), notes: "" });
const advances = ref<WorkerAdvance[]>([]);
const advLoading = ref(false);
const advLoadingList = ref(false);
/** Total del mes en curso (solo adelantos del mes actual). */
const totalAdvancesMoth = computed(() =>
  advances.value
    .filter((adv) => isCurrentMonthAdvance(adv))
    .reduce((acc, curr) => acc + curr.amount, 0),
);

// Edición inline de un adelanto (solo mes en curso)
const editingAdvId = ref<number | null>(null);
const editAdv = ref({ amount: 0, date: today(), notes: "" });
const advEditLoading = ref(false);

/** ¿El adelanto pertenece al mes en curso? (editable/eliminable). */
const isCurrentMonthAdvance = (adv: WorkerAdvance) => monthOf(adv.date) === currentMonth();

const openAdvances = async (w: Worker) => {
  selectedWorkerForAdv.value = w;
  isAdvModalOpen.value = true;
  newAdv.value = { amount: 0, date: today(), notes: "" };
  cancelEditAdvance();
  await loadAdvances();
};

const closeAdvances = () => {
  isAdvModalOpen.value = false;
  selectedWorkerForAdv.value = null;
  advances.value = [];
  cancelEditAdvance();
};

const loadAdvances = async () => {
  if (!selectedWorkerForAdv.value) return;
  advLoadingList.value = true;
  try {
    const history = await api.workers.advanceHistory(selectedWorkerForAdv.value.id);
    // Historial completo, ordenado por fecha descendente (más reciente primero)
    advances.value = history.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch (e: any) {
    showError("Error al cargar adelantos: " + (e.message || e));
  } finally {
    advLoadingList.value = false;
  }
};

const submitAdvance = async () => {
  if (!selectedWorkerForAdv.value) return;

  advLoading.value = true;
  try {
    await api.workers.addAdvance({
      worker_id: selectedWorkerForAdv.value.id,
      amount: newAdv.value.amount,
      date: newAdv.value.date,
      notes: newAdv.value.notes.trim() || null,
    });
    newAdv.value = { amount: 0, date: today(), notes: "" };
    // El modal de adelantos NO se cierra: solo refresca la lista.
    await loadAdvances();
  } catch (e: any) {
    showError("Error al guardar adelanto: " + (e.message || e));
  } finally {
    advLoading.value = false;
  }
};

const startEditAdvance = (adv: WorkerAdvance) => {
  editingAdvId.value = adv.id;
  editAdv.value = {
    amount: adv.amount,
    date: adv.date,
    notes: adv.notes || "",
  };
};

const cancelEditAdvance = () => {
  editingAdvId.value = null;
  editAdv.value = { amount: 0, date: today(), notes: "" };
};

const saveEditAdvance = async () => {
  if (editingAdvId.value == null) return;

  advEditLoading.value = true;
  try {
    await api.workers.updateAdvance({
      id: editingAdvId.value,
      amount: editAdv.value.amount,
      date: editAdv.value.date,
      notes: editAdv.value.notes.trim() || null,
    });
    cancelEditAdvance();
    // El modal de adelantos NO se cierra: solo refresca la lista.
    await loadAdvances();
  } catch (e: any) {
    showError("Error al actualizar adelanto: " + (e.message || e));
  } finally {
    advEditLoading.value = false;
  }
};

const deleteAdvance = async (id: number) => {
  if (!(await askConfirm({ message: '¿Eliminar este adelanto?', danger: true, confirmText: 'Eliminar' }))) return;
  advLoadingList.value = true;
  try {
    await api.workers.deleteAdvance(id);
    // El modal de adelantos NO se cierra: solo refresca la lista.
    await loadAdvances();
  } catch (e: any) {
    showError("Error al eliminar: " + (e.message || e));
  } finally {
    advLoadingList.value = false;
  }
};

// ================= MODAL LÓGICA =================
const isModalOpen = ref(false);
const isEditing = ref(false);
const formLoading = ref(false);
const formError = ref('');

// Helper UI para Documento
const docType = ref<'RUT' | 'DNI'>('RUT');
const documentValue = ref('');

// Formateador de RUT visual
const formatRut = (rut: string) => {
  let cleanRut = rut.replace(/[^0-9Kk]/g, '').toUpperCase();
  if (cleanRut.length === 0) return '';
  if (cleanRut.length === 1) return cleanRut;
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
};

// Formatea el RUT mientras el administrador escribe
watch(() => documentValue.value, (newVal) => {
  if (docType.value === 'RUT' && newVal) {
    const formatted = formatRut(newVal);
    if (documentValue.value !== formatted) {
      documentValue.value = formatted;
    }
  } else if (docType.value === 'DNI' && newVal) {
    documentValue.value = newVal.toUpperCase();
  }
});

// Limpiar el campo si cambian de tipo
watch(docType, () => {
  documentValue.value = '';
  formError.value = '';
});

// Base del formulario
const initialFormState = {
  id: 0,
  name: '',
  hourly_rate: 0,
  pay_model: 'HOURLY' as PayModel,
  monthly_salary: 0,
  start_date: today(),
  photo: null as string | null
};
const formData = ref({ ...initialFormState });

const resetForm = () => {
  formData.value = { ...initialFormState };
  docType.value = 'RUT';
  documentValue.value = '';
  formError.value = '';
  photoInputRef.value = null;
};

// ================= FOTOS =================
const photoInputRef = ref<HTMLInputElement | null>(null);

const triggerPhotoUpload = () => {
  photoInputRef.value?.click();
};

const handlePhotoUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;

  const file = target.files[0];
  if (!file.type.match('image.*')) {
    formError.value = 'El archivo seleccionado no es una imagen válida.';
    return;
  }
  
  // Limitar a ~2MB por ejemplo, o simplemente permitir base64 si sqlite lo soporta.
  if (file.size > 2 * 1024 * 1024) {
    formError.value = 'La imagen es demasiado grande. Seleccione una menor a 2MB.';
    return;
  }

  const reader = new FileReader();
  reader.onload = (reEvent) => {
    formData.value.photo = reEvent.target?.result as string;
    formError.value = ''; // clears error just in case
  };
  reader.readAsDataURL(file);
};

const removePhoto = () => {
  formData.value.photo = null;
  if (photoInputRef.value) {
    photoInputRef.value.value = '';
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  isModalOpen.value = true;
};

const openEditModal = (worker: Worker) => {
  resetForm();
  isEditing.value = true;
  formData.value = {
    id: worker.id,
    name: worker.name,
    hourly_rate: worker.hourly_rate,
    pay_model: worker.pay_model ?? 'HOURLY',
    monthly_salary: worker.monthly_salary ?? 0,
    start_date: worker.start_date || today(),
    photo: worker.photo || null
  };
  
  if (worker.rut) {
    docType.value = 'RUT';
    documentValue.value = worker.rut;
  } else if (worker.dni) {
    docType.value = 'DNI';
    documentValue.value = worker.dni;
  }
  
  isModalOpen.value = true;
};

const closeModal = () => {
  if (formLoading.value) return;
  isModalOpen.value = false;
};

// Estado de la Alerta Emergent
const isErrorModalOpen = ref(false);
const errorModalMessage = ref('');

const showError = (err: any) => {
  // El cliente `api` ya lanza un Error con el mensaje limpio del backend.
  const message =
    (typeof err === 'string' ? err : err?.message) ||
    'Ocurrió un error inesperado al procesar la solicitud.';

  errorModalMessage.value = message;
  isErrorModalOpen.value = true;
};

// ================= CREAR / ACTUALIZAR =================
const submitForm = async () => {
  formError.value = '';
  
  if (!formData.value.name.trim()) {
    formError.value = 'El nombre es obligatorio.';
    return;
  }
  if (!documentValue.value.trim()) {
    formError.value = `El número de ${docType.value} es obligatorio.`;
    return;
  }

  // Validar RUT (formato + dígito verificador) antes de enviar
  if (docType.value === 'RUT' && !isValidRut(documentValue.value)) {
    formError.value = 'RUT inválido. Verifica el número y el dígito verificador (Ej: 12.345.678-9)';
    return;
  }

  // Preparamos los datos quitando los puntos del RUT
  const cleanRutValue = docType.value === 'RUT' ? documentValue.value.replace(/\./g, '').trim() : null;

  const adminId = adminStore.admin?.id ?? undefined;
  const hourlyRate = Number(formData.value.hourly_rate);
  const payModel = formData.value.pay_model;
  const monthlySalary = payModel === 'FIXED_SALARY' ? Number(formData.value.monthly_salary) : 0;

  if (payModel === 'FIXED_SALARY' && monthlySalary <= 0) {
    formError.value = 'Indica el sueldo mensual (mayor a cero) para el modelo de sueldo fijo.';
    return;
  }

  formLoading.value = true;
  try {
    let msg = '';
    if (isEditing.value) {
      const data: UpdateWorkerDto = {
        name: formData.value.name.trim(),
        hourly_rate: hourlyRate,
        pay_model: payModel,
        monthly_salary: monthlySalary,
        start_date: formData.value.start_date,
        rut: cleanRutValue,
        dni: docType.value === 'DNI' ? documentValue.value.trim() : null,
        photo: formData.value.photo,
      };
      await api.workers.update(formData.value.id, data, adminId);
      msg = 'Trabajador actualizado exitosamente.';
    } else {
      const data: CreateWorkerDto = {
        name: formData.value.name.trim(),
        hourly_rate: hourlyRate,
        pay_model: payModel,
        monthly_salary: monthlySalary,
        start_date: formData.value.start_date,
        rut: cleanRutValue,
        dni: docType.value === 'DNI' ? documentValue.value.trim() : null,
        photo: formData.value.photo,
      };
      await api.workers.create(data);
      msg = 'Trabajador creado exitosamente.';
    }

    // Éxito: cerramos directamente (closeModal() aborta si formLoading sigue en true).
    isModalOpen.value = false;
    successGlobal.value = msg;
    setTimeout(() => successGlobal.value = '', 4000);

    loadWorkers();
  } catch (err: any) {
    showError(err);
  } finally {
    formLoading.value = false;
  }
};

// ================= DESACTIVAR / REACTIVAR (BAJA LÓGICA) =================
const toggleStatus = async (worker: Worker) => {
  const adminId = adminStore.admin?.id ?? undefined;
  const willDeactivate = worker.status === 'ACTIVE';

  try {
    const updated = willDeactivate
      ? await api.workers.deactivate(worker.id, adminId)
      : await api.workers.reactivate(worker.id, adminId);
    // Reflejamos el estado devuelto por el backend
    worker.status = updated.status;
    successGlobal.value = willDeactivate
      ? 'Trabajador desactivado con éxito.'
      : 'Trabajador reactivado con éxito.';
    setTimeout(() => successGlobal.value = '', 4000);
  } catch (err: any) {
    errorGlobal.value = err.message || 'Error cambiando el estado del trabajador.';
  }
};

// ================= ELIMINAR PERMANENTEMENTE (BORRADO FÍSICO) =================
const promptHardDelete = async (worker: Worker) => {
  const confirmed = await askConfirm({
    title: 'Eliminar permanentemente',
    message: `Vas a eliminar a ${worker.name} y TODO su historial de marcaje y adelantos.\nEsta acción NO se puede deshacer.`,
    danger: true,
    confirmText: 'Eliminar definitivamente',
    requireText: 'ELIMINAR',
  });
  if (!confirmed) return;

  try {
    await api.workers.hardDelete(worker.id);
    successGlobal.value = 'Trabajador eliminado permanentemente de la base de datos.';
    setTimeout(() => successGlobal.value = '', 4000);
    loadWorkers(); // Re-fetch the layout completely
  } catch (err: any) {
    errorGlobal.value = err.message || 'Error al intentar purgar el trabajador.';
  }
};

// ================= UTILES =================
const formatDate = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(date);
};

const formatDateTime = (isoString?: string) => {
  if (!isoString) return 'No registrado';
  try {
    const date = new Date(isoString);
    // Verificar si la fecha es inválida (por ejemplo en un mock de BD sin timestamps)
    if (isNaN(date.getTime())) return 'Desconocido';
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  } catch(e) {
    return 'Error de formato';
  }
};

// ================= MODAL DETALLES =================
const isDetailsModalOpen = ref(false);
const selectedWorkerDetails = ref<any>(null); // Usamos any o Worker porque updated_at podría ser null o undefined

const openDetailsModal = (worker: Worker) => {
  selectedWorkerDetails.value = worker;
  isDetailsModalOpen.value = true;
};

const closeDetailsModal = () => {
  isDetailsModalOpen.value = false;
};
</script>
