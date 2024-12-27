<template>
  <div class="d-flex align-end ga-6">
    <v-date-input
      variant="underlined"
      hide-details
      v-model="dateRange"
      :label="$t('date')"
      max-width="368"
      min-width="150"
      multiple="range"
    />
    <!--<v-btn
      size="small"
      :disabled="!dateRange.length"
      :to="{
        name: 'sales-statement',
        query: {
          from: dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : null,
          to: dateRange[dateRange.length - 1]
            ? format(dateRange[dateRange.length - 1], 'yyyy-MM-dd')
            : null
        }
      }"
    >
      {{ $t('voir relevé') }}
    </v-btn>-->
  </div>

  <v-row class="mt-10">
    <v-col sm="12" md="7">
      <v-list lines="three">
        <template v-for="item in historyItems" :key="item.orderId || item.title">
          <v-list-item>
            <v-list-item-title> <div v-html="item.title"></div> </v-list-item-title>
            <v-list-item-subtitle class="pa-2"> {{ item.summary }} </v-list-item-subtitle>
            <v-list-item-subtitle class="pa-4">
              <div v-html="item.total"></div
            ></v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-list>
      <div class="total pa-4">
        <div>{{ $t('total') }}: <span v-html="productSummary(allOrderlines)"></span> <br /></div>
        <div
          class="pa-4"
          v-html="
            `
              &mdash; Total: ${sum(filteredOrders.map((o) => Number(o.total_price)))} ${t('DA')}<br />
              &mdash; Payé: ${sum(filteredOrders.map((o) => Number(o.paid_price)))} ${t('DA')}<br />
              &mdash; Restant: ${sum(filteredOrders.map((o) => Number(o.total_price) - Number(o.paid_price)))} ${t('DA')}
            `
          "
        ></div>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { groupBy, sortBy, sum } from 'lodash'
import { format } from 'date-fns'
import { useI18n } from 'vue-i18n'

import { useOrdersQuery } from '@/composables/db/orders/useGetOrdersDb'

import type { OrderLineData } from '@/composables/api/orders/useGetOrderApi'

const { t } = useI18n()

const dateRange = ref<Date[]>([new Date(), new Date()]) // Default to today as the range

const { q, params } = useOrdersQuery()

const startDate = computed(() => {
  const date = new Date(dateRange.value[0])
  date.setHours(0, 0, 0, 0) // Set to midnight
  return date
})

const endDate = computed(() => {
  const date = new Date(dateRange.value[dateRange.value.length - 1])
  date.setHours(23, 59, 59, 999) // Set to the last millisecond of the day
  return date
})

watchEffect(() => {
  params.date_gte = startDate.value.toISOString()
  params.date_lte = endDate.value.toISOString()
})

const filteredOrders = computed(() => q.rows.value || [])

const historyItems = computed(() => {
  let groupedSummary = []
  for (const date in groupedOrders.value) {
    const intro = `<span class="text-primary">${format(date, 'dd-MM-yyyy')}</span>`
    const dateSummaryitem = {
      title: `${intro}`,
      summary: productSummary(allOrderlinesByDate.value[date]),
      total: `
        &mdash; Total: ${sum(groupedOrders.value[date].map((o) => Number(o.total_price)))} ${t('DA')}<br>
        &mdash; Payé: ${sum(groupedOrders.value[date].map((o) => Number(o.paid_price)))} ${t('DA')}<br>
        &mdash; Restant: ${sum(groupedOrders.value[date].map((o) => Number(o.total_price - o.paid_price)))} ${t('DA')}
      `
    }
    groupedSummary.push(dateSummaryitem)
  }

  return groupedSummary
})

const groupedOrders = computed(() => {
  return groupBy(sortBy(filteredOrders.value, (t) => new Date(t.date)).reverse(), (t) =>
    new Date(t.date).toDateString()
  )
})

const allOrderlinesByDate = computed(() => {
  const result: Record<string, OrderLineData[]> = {}

  Object.keys(groupedOrders.value).forEach((date) => {
    const ordersForDate = groupedOrders.value[date]
    result[date] = ordersForDate.flatMap((o) => o?.order_lines || [])
  })

  return result
})

const allOrderlines = computed(() => {
  return filteredOrders.value.flatMap((o) => o?.order_lines || []).filter((e) => e)
})

function productSummary(orderlines: OrderLineData[]) {
  if (!orderlines?.length) return
  let productsSummaries: string[] = []
  const orderlinesGrouped = groupBy(orderlines, (o) => o?.product_id)

  for (const productId in orderlinesGrouped) {
    const orderlines = orderlinesGrouped[productId]
    const product = orderlinesGrouped[productId][0]?.product
    const totalQte = sum(orderlines.map((o) => o?.qte))

    productsSummaries.push(`${totalQte}m ${product?.name} `)
  }

  return `${productsSummaries.join(', ')}`
}

function calculateProfit(orderlines: OrderLineData[]) {
  let profit = 0
  orderlines.forEach((o) => {
    if (o?.unit_cost_price) profit += o.total_price - o.qte * o.unit_cost_price
  })
  return profit
}
</script>

<style scoped>
.router-link {
  text-decoration: none;
  color: inherit;
}
</style>
