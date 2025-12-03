<!-- eslint-disable vue/valid-v-slot -->
<template>
  <v-card variant="text" width="100%">
    <template v-slot:title>
      <slot name="title"></slot>
    </template>

    <template v-slot:text>
      <slot name="top"></slot>
    </template>

    <v-data-table :items="items" :headers="headers" density="comfortable" hover>
      <template #item.order="{ item }">
        <v-tooltip :text="$t('view-order')">
          <template #activator="{ props }">
            <v-btn
              v-if="item"
              v-bind="props"
              variant="text"
              size="small"
              color="primary"
              :to="{ name: 'order', params: { order_id: item.id } }"
              class="text-capitalize"
            >
              <v-icon :icon="mdiOpenInNew" size="18" />
            </v-btn>
          </template>
        </v-tooltip>
      </template>

      <template #item.date="{ item }">
        <div class="text-no-wrap">
          {{ format(item.date, 'yyyy-MM-dd') }}
        </div>
        <div class="text-no-wrap text-grey text-caption">
          {{ format(item.date, 'p') }}
        </div>
      </template>
      <template #item.details="{ item }">
        <div class="text-caption">
          {{ item.details }}
        </div>
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip
          v-if="statusChipMap[item.status]"
          size="small"
          variant="tonal"
          :color="statusChipMap[item.status].color"
        >
          {{ $t(statusChipMap[item.status].label) }}
        </v-chip>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { groupBy, sortBy, sum } from 'lodash'
import { mdiOpenInNew } from '@mdi/js'

import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'
import type { OrderLineData } from '@/composables/api/orders/useGetOrderApi'
import { OrderStatus } from '@/models/models'

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const props = defineProps<{ orders: OrderData[] }>()

const { t } = useI18n()

const items = computed(() =>
  sortBy(
    props.orders.map((o) => {
      return {
        id: o.id,
        date: o.date,
        details: productSummary(o.order_lines || []),
        total: o.total_price,
        reduction: o.reduction || 0,
        remaining: (o.total_price || 0) - (o.paid_price || 0),
        status: o.status as OrderStatus
      }
    }),
    (t) => new Date(t.date)
  ).reverse()
)

const headers = computed(
  () =>
    [
      {
        title: t('date'),
        align: 'start',
        sortable: false,
        key: 'date'
      },
      {
        title: t('details'),
        align: 'start',
        sortable: false,
        key: 'details'
      },
      {
        title: t('reduction'),
        align: 'start',
        key: 'reduction'
      },
      {
        title: t('remaining'),
        align: 'start',
        key: 'remaining'
      },
      {
        title: t('total'),
        align: 'start',
        key: 'total'
      },
      { title: `${t('status')}`, key: 'status' },
      { title: ``, key: 'order' }
    ] as const
)

const statusChipMap: Record<OrderStatus, { color: string; label: string }> = {
  [OrderStatus.Pending]: { color: 'grey', label: 'pending' },
  [OrderStatus.Confirmed]: { color: 'green', label: 'confirmed' },
  [OrderStatus.Cancelled]: { color: 'red', label: 'cancelled' }
}

function productSummary(orderlines: OrderLineData[]) {
  if (!orderlines?.length) return
  let productsSummaries: string[] = []
  const orderlinesGrouped = groupBy(orderlines, (o) => o?.product_id)

  for (const productId in orderlinesGrouped) {
    const orderlines = orderlinesGrouped[productId]
    const product = orderlinesGrouped[productId][0]?.product
    const totalQte = sum(orderlines.map((o) => o?.qte))

    productsSummaries.push(`${totalQte} ${product?.name}`)
  }

  return `${productsSummaries.join(', ')}`
}
</script>
