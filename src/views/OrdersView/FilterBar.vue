<template>
  <div class="filter-bar d-flex align-center ga-2">
    <v-text-field
      variant="outlined"
      density="compact"
      hide-details
      :append-inner-icon="mdiMagnify"
      @click="openFilterMenu = true"
    >
      <template #default>
        <div class="d-flex ga-2">
          <template v-for="chip in chipConfig" :key="chip.modelKey">
            <v-chip
              v-if="model[chip.modelKey] !== null && model[chip.modelKey] !== undefined"
              size="small"
              closable
              @click:close="model[chip.modelKey] = null"
            >
              {{ $t(kebabCase(chip.enum[model[chip.modelKey]!])) }}
            </v-chip>
          </template>

          <v-chip
            v-if="model.dateRange?.length"
            size="small"
            closable
            @click:close="model.dateRange = []"
          >
            {{ formatDateRange(model.dateRange) }}
          </v-chip>
          <FilterMenu v-model:menu="openFilterMenu" v-model:filters="model" />
        </div>
      </template>
    </v-text-field>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { kebabCase } from 'lodash'
import { mdiMagnify } from '@mdi/js'

import FilterMenu from './FilterMenu.vue'

import { DocumentType, OrderStatus } from '@/models/models'
import type { Filters } from './models/models'

const chipConfig = [
  {
    modelKey: 'docType',
    enum: DocumentType
  },
  {
    modelKey: 'status',
    enum: OrderStatus
  }
] as const

const model = defineModel<Filters>({ required: true })
const openFilterMenu = ref(false)

function formatDateRange(range: string[] | Date[]) {
  if (!range || range.length < 1) return ''

  const start = range[0]
  const end = range[range.length - 1]

  const fmt = (d: string | Date) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(d))

  if (start && end) return `${fmt(start)} → ${fmt(end)}`
  if (start) return `${fmt(start)}`
  return ''
}
</script>
