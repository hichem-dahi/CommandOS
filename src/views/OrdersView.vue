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
    <v-row v-for="(_, i) in filteredOrders" :key="i">
      <v-col sm="12" md="6">
        <OrderCard :order="filteredOrders[i]" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { isSameDay } from 'date-fns'
import { mdiPlus } from '@mdi/js'

import { useOrderQuery } from '@/composables/db/orders/useGetOrdersDb'

import OrderCard from '@/views/OrdersView/OrderCard.vue'
import FilterBar from './OrdersView/FilterBar.vue'

import type { Filters } from './OrdersView/models/models'
import type { OrderData } from '@/composables/api/orders/useGetOrdersApi'

const { q } = useOrderQuery()

const filters = reactive<Filters>({
  docType: null,
  dateRange: []
})

const filteredOrders = computed(
  () =>
    (q.rows.value?.filter((o) => {
      const docFilter = filters.docType ? o.document_type === filters.docType : true
      const dateFilter = filters.dateRange.length
        ? filters.dateRange.some((selectedDate) => isSameDay(o.date, selectedDate))
        : true

      return docFilter && dateFilter
    }) || []) as unknown as OrderData[]
)
</script>
