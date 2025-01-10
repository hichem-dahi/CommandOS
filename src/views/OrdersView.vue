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
import { computed, reactive } from 'vue'
import { mdiPlus } from '@mdi/js'

import { useOrdersQuery, type OrderData } from '@/composables/db/orders/useGetOrdersDb'

import OrderCard from '@/views/OrdersView/OrderCard.vue'
import FilterBar from './OrdersView/FilterBar.vue'

import type { Filters } from './OrdersView/models/models'

const { q, isReady } = useOrdersQuery()
isReady.value = true

const filters = reactive<Filters>({
  docType: null,
  dateRange: []
})
const orders = computed(() => q.rows.value as unknown as OrderData[])
</script>
