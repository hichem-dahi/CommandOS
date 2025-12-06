<template>
  <v-card
    v-if="proforma"
    color="grey-lighten-5"
    class="pa-4"
    hover
    variant="elevated"
    :to="{ name: 'proforma', params: { proforma_id: proforma.id } }"
  >
    <v-card-title>{{ $t('proforma') }}</v-card-title>

    <v-card-subtitle class="proforma-info">
      <div>
        <span class="font-weight-bold">{{ $t('client') }}:</span>
        <span>&nbsp;{{ consumerName }}</span>
      </div>
      <div>
        <span class="font-weight-bold">{{ $t('date') }}:</span>
        <span>&nbsp;{{ format(proforma.date, 'yyyy-MM-dd') }}</span>
      </div>
      <div>
        <span class="font-weight-bold">{{ $t('total') }}:</span>
        <span>&nbsp;{{ proforma.total_price }}DA</span>
      </div>
    </v-card-subtitle>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'

import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'

const proforma = defineModel<OrderData>('proforma')

const consumerName = computed(() => proforma.value?.client?.name)
</script>

<style>
.proforma-info {
  font-size: 0.8rem;
}
</style>
