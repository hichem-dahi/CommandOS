<!-- eslint-disable vue/valid-v-slot -->
<template>
  <v-data-table
    :items="items"
    :headers="headers"
    density="comfortable"
    hover
    class="bg-white rounded-lg"
  >
    <template #top>
      <v-card
        color="#F7F7F7"
        elevation="0"
        class="px-4 py-3 d-flex align-center justify-space-between"
      >
        <div class="d-flex align-center gap-4">
          <v-avatar size="64" color="grey-lighten-3">
            <v-icon size="32" color="grey" :icon="mdiCart"></v-icon>
          </v-avatar>
        </div>
      </v-card>

      <v-divider class="my-2" />
    </template>

    <template #item.order="{ item }">
      <v-tooltip text="View order">
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
  </v-data-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { groupBy, sortBy, sum } from 'lodash'
import { mdiCart, mdiOpenInNew } from '@mdi/js'

import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'
import type { OrderLineData } from '@/composables/api/orders/useGetOrderApi'

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const { t } = useI18n()
const props = defineProps<{ orders: OrderData[] }>()

const items = computed(() =>
  sortBy(
    props.orders.map((o) => {
      return {
        id: o.id,
        date: o.date,
        details: productSummary(o.order_lines || []),
        total: o.total_price,
        reduction: o.reduction || 0,
        remaining: (o.total_price || 0) - (o.paid_price || 0)
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
        title: t('total'),
        align: 'start',
        key: 'total'
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
      }
    ] as any
)

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
