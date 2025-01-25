<template>
  <div class="d-flex align-start flex-wrap ga-8 pa-4">
    <v-btn
      class="my-5"
      variant="tonal"
      size="small"
      :append-icon="mdiPlus"
      :to="{ name: 'create-order' }"
    >
      {{ $t('add-order') }}
    </v-btn>
    <v-divider v-if="!$vuetify.display.mobile" vertical />
    <FilterBar v-model="filters" />
  </div>
  <v-container>
    <v-row v-for="(o, i) in orders" :key="i">
      <v-col sm="12" md="6">
        <OrderCard v-if="o" :order="o" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { mdiPlus } from '@mdi/js'

import { useOrdersQuery, type OrderData } from '@/composables/db/orders/useGetOrdersDb'

import OrderCard from '@/views/OrdersView/OrderCard.vue'
import FilterBar from './OrdersView/FilterBar.vue'

import type { Filters } from './OrdersView/models/models'

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const { q, isReady, params } = useOrdersQuery()
params.type = 'order'
isReady.value = true

const filters = reactive<Filters>({
  docType: null,
  dateRange: [thirtyDaysAgo, today]
})

const orders = computed(() => q.rows.value as unknown as OrderData[])

const startDate = computed(() => {
  const date = new Date(filters.dateRange[0])
  if (isNaN(date.getTime())) {
    return null
  }
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
})

const endDate = computed(() => {
  const date = new Date(filters.dateRange[filters.dateRange.length - 1])
  if (isNaN(date.getTime())) {
    return null
  }
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
})

watchEffect(() => {
  params.date_gte = startDate.value
  params.date_lte = endDate.value
  params.doc_type = filters.docType
})
</script>
