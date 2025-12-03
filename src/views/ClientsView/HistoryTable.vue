<!-- eslint-disable vue/valid-v-slot -->
<template>
  <v-data-table :items="historyItems" :headers="headers" style="background-color: #fefefe">
    <template v-slot:top>
      <v-card class="pb-2 d-flex align-end" color="#F7F7F7" elevation="0">
        <div class="col-1 d-flex justify-space-between w-75">
          <v-card-title>
            <div>{{ client?.name }}</div>
            <div class="text-medium-emphasis text-subtitle-2">
              {{ $t('phone') }}: {{ client?.phone }}
            </div>
          </v-card-title>
        </div>
      </v-card>
    </template>
    <template v-slot:item.date="{ item }">
      <div class="text-no-wrap">
        {{ format(item.date, 'yyyy-MM-dd') }}
      </div>
      <div class="text-no-wrap text-grey text-caption">
        {{ format(item.date, 'p') }}
      </div>
    </template>
    <template v-slot:item.details="{ item }">
      <span class="text-caption text-no-wrap">
        {{ item.details?.join(', ') }}
      </span>
    </template>
    <template v-slot:item.status="{ item }">
      <v-chip
        v-if="item.status === OrderStatus.Confirmed"
        size="small"
        variant="tonal"
        color="green"
      >
        {{ $t('confirmed') }}
      </v-chip>
      <v-chip
        v-else-if="item.status === OrderStatus.Cancelled"
        size="small"
        variant="tonal"
        color="red"
      >
        {{ $t('cancelled') }}
      </v-chip>
    </template>

    <template v-slot:item.order="{ item }">
      <v-btn
        v-if="item.orderId"
        variant="text"
        size="small"
        color="light-blue"
        :icon="mdiOpenInNew"
        :to="{ name: 'order', params: { order_id: item.orderId } }"
      >
      </v-btn>
    </template>
  </v-data-table>
</template>
<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { sortBy } from 'lodash'
import { mdiOpenInNew } from '@mdi/js'

import { useOrdersQuery } from '@/composables/db/orders/useGetOrdersDb'

import { OrderStatus } from '@/models/models'
import { useLiveQuery } from '@electric-sql/pglite-vue'

const { t } = useI18n()
const route = useRoute()

const { q, params, isReady } = useOrdersQuery()

watchEffect(() => {
  params.client_id = route.query.client_id as string
  params.individual_id = route.query.individual_id as string
  isReady.value = true
})

const orders = computed(() => q.rows.value)

const clientQuery = useLiveQuery(
  `SELECT * FROM public.organizations
    WHERE id = $1
    AND _deleted = false
    LIMIT 1;`,
  [route.query.client_id as string]
)

const individualQuery = useLiveQuery(
  `SELECT * FROM public.individuals
    WHERE id = $1
    AND _deleted = false
    LIMIT 1;`,
  [route.query.individual_id as string]
)

const client = computed(() => clientQuery.rows.value?.[0] || individualQuery.rows.value?.[0])

const historyItems = computed(() => {
  const clientOrders = orders.value
  if (!clientOrders) return

  const items = clientOrders.map((o) => {
    const orderLinesInfo = o.order_lines?.map((ol) => {
      const info = { qte: ol.qte, product: ol.product?.name }
      return `${info.qte} ${info.product}`
    })

    const total = o.total_price || 0
    const remaining = total - o.paid_price

    return {
      date: o.date,
      index: `${t('N°')}${o.index}`,
      details: orderLinesInfo,
      total,
      remaining,
      status: o.status,
      orderId: o.id
    }
  })

  return sortBy(items, (t) => new Date(t.date)).reverse()
})

const headers = computed(
  () =>
    [
      {
        title: t('date'),
        align: 'start',
        sortable: false,
        key: 'date'
      },
      { title: t('order'), key: 'index' },
      { title: t('details'), key: 'details' },
      { title: `${t('total')} (DA)`, key: 'total' },
      { title: `${t('remaining')} (DA)`, key: 'remaining' },
      { title: `${t('status')}`, key: 'status' },
      { title: ``, key: 'order' }
    ] as const
)
</script>
