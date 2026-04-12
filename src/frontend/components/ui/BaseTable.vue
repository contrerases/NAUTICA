<template>
  <div class="overflow-x-auto rounded-lg border border-surface-border bg-surface shadow-sm w-full">
    <table class="w-full text-left text-sm text-text-base">
      <thead class="bg-body border-b border-surface-border text-text-muted font-bold uppercase text-xs tracking-wider">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-6 py-4 whitespace-nowrap"
            :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-border">
        <!-- Estado de Carga -->
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-6 py-12 text-center text-text-muted">
            <div class="flex flex-col items-center justify-center space-y-3">
              <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Cargando datos...</span>
            </div>
          </td>
        </tr>
        
        <!-- Estado Vacío -->
        <tr v-else-if="!data.length">
          <td :colspan="columns.length" class="px-6 py-12 text-center text-text-muted">
            <div class="flex flex-col items-center justify-center space-y-2">
              <svg class="w-12 h-12 text-surface-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <span>No se encontraron registros.</span>
            </div>
          </td>
        </tr>
        
        <!-- Filas de Datos -->
        <tr
          v-else
          v-for="(row, idx) in data"
          :key="idx"
          @click="$emit('row-click', row)"
          class="hover:bg-surface-hover transition-colors group cursor-pointer"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-6 py-4 whitespace-nowrap"
            :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
          >
            <!-- Permite inyectar HTML personalizado mediante slots dinámicos basados en la "key" de la columna -->
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

defineProps<{
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
}>();
</script>