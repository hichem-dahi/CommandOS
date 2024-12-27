<template>
  <v-card class="pa-4">
    <template v-slot:title>{{ $t('payments') }}</template>
    <v-list density="compact" class="overflow-y" style="max-height: 200px">
      <template v-for="item in paymentItems" :key="item.id">
        <v-list-item>
          <template v-slot:subtitle> <div v-html="item.subtitle" /> </template>
          <template v-slot:append>
            <v-btn
              variant="text"
              size="small"
              color="light-blue"
              :icon="mdiOpenInNew"
              :to="{
                name: 'payment',
                params: { payment_id: item.id }
              }"
            >
            </v-btn>
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { mdiOpenInNew } from '@mdi/js'

import type { Payment } from '@/models/models'
import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'

const props = defineProps<{ order: OrderData; payments: Payment[] }>()

const paymentItems = computed(() => {
  const lines: { id: string; subtitle: string }[] = []
  props.payments.forEach((p) => {
    const line = `<span class="text-primary">${format(p.date, 'dd-MM-yyyy p')}</span>&nbsp;&nbsp; ${p.amount}DA`
    lines.push({
      id: p.id,
      subtitle: line
    })
  })

  return lines
})
</script>
