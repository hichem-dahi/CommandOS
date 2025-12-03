<template>
  <div>
    <div class="orders-wrapper">
      <div class="orders-table">
        <OrdersTable :orders="orders">
          <template #title>
            <div class="d-flex flex-wrap justify-space-between align-center">
              <div class="text-h5 pa-4">{{ $t('orders-list') }}</div>
              <v-btn
                variant="tonal"
                size="small"
                :append-icon="mdiPlus"
                :to="{ name: 'create-order' }"
              >
                {{ $t('add-order') }}
              </v-btn>
            </div>
          </template>
          <template #top>
            <div><FilterBar v-model="filters" /></div>
          </template>
        </OrdersTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { mdiPlus } from '@mdi/js'

import { useOrdersQuery, type OrderData } from '@/composables/db/orders/useGetOrdersDb'

import OrdersTable from './OrdersView/OrdersTable.vue'
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
  dateRange: [thirtyDaysAgo, today],
  status: null
})

const orders = computed(() => (q.rows.value || []) as unknown as OrderData[])

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
  params.status = filters.status
})
</script>
