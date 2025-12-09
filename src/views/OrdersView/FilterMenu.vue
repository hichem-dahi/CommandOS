<template>
  <v-menu v-model="open" :close-on-content-click="false">
    <template #activator="{ props }">
      <div v-bind="props"></div>
    </template>

    <v-card class="pa-3 d-flex flex-column ga-4" width="280">
      <v-date-input
        multiple="range"
        density="compact"
        variant="outlined"
        hide-details
        prepend-icon=""
        :prepend-inner-icon="mdiCalendar"
        v-model="filters.dateRange"
        :label="$t('date')"
        :max="new Date()"
      />
      <v-select
        density="compact"
        variant="outlined"
        hide-details
        :items="statusItems"
        v-model="filters.status"
        :label="$t('status')"
        clearable
      />
      <v-select
        density="compact"
        variant="outlined"
        hide-details
        :items="docItems"
        v-model="filters.docType"
        :label="$t('document-type')"
        clearable
      />
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { kebabCase } from 'lodash'

import { mdiCalendar } from '@mdi/js'

import { DocumentType, OrderStatus } from '@/models/models'
import type { Filters } from './models/models'

const { t } = useI18n()

const filters = defineModel<Filters>('filters', {
  default: {
    docType: null,
    dateRange: [],
    status: null
  }
})
const open = defineModel<boolean>('menu')

const docItems = [
  { title: t(kebabCase(DocumentType[1])), value: DocumentType.Invoice },
  { title: t(kebabCase(DocumentType[2])), value: DocumentType.DeliveryNote },
  { title: t(kebabCase(DocumentType[3])), value: DocumentType.Voucher },
  { title: t(kebabCase(DocumentType[4])), value: DocumentType.Proforma }
]

const statusItems = [
  { title: t(kebabCase(OrderStatus[0])), value: OrderStatus.Pending },
  { title: t(kebabCase(OrderStatus[1])), value: OrderStatus.Confirmed },
  { title: t(kebabCase(OrderStatus[2])), value: OrderStatus.Cancelled }
]
</script>
