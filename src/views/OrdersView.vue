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
        <OrderCard v-model:order="filteredOrders[i]" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { isSameDay } from 'date-fns'
import { mdiPlus } from '@mdi/js'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import { useOrdersSync } from '@/composables/sync/useOrdersSync'

import OrderCard from '@/views/OrdersView/OrderCard.vue'
import FilterBar from './OrdersView/FilterBar.vue'

import type { Filters } from './OrdersView/models/models'

const orders = useLiveQuery(
  `SELECT 
    o.*, 
    -- Fetching individual data as a separate field
    (
        SELECT to_jsonb(i)
        FROM public.individuals i
        WHERE i.id = o.individual_id
        LIMIT 1
    ) AS individual,
    -- Fetching client data as a separate field
    (
        SELECT to_jsonb(org)
        FROM public.organizations org
        WHERE org.id = o.client_id
        LIMIT 1
    ) AS client
  FROM public.orders o;  
`,
  []
)

useOrdersSync()

const filters = reactive<Filters>({
  docType: null,
  dateRange: []
})

const filteredOrders = computed(
  () =>
    orders.rows.value?.filter((o) => {
      const docFilter = filters.docType ? o.document_type === filters.docType : true
      const dateFilter = filters.dateRange.length
        ? filters.dateRange.some((selectedDate) => isSameDay(o.date, selectedDate))
        : true

      return docFilter && dateFilter
    }) || []
)
</script>
