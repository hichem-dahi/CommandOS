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
          <v-list-item elevation="1">
            <v-list-item-title> <div v-html="item.title"></div> </v-list-item-title>
            <v-list-item-subtitle class="py-2 text-high-emphasis opacity-100">
              {{ item.summary }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="pt-2 text-caption">
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
              Total: ${sum(filteredOrders.map((o) => Number(o.total_price)))} ${t('DA')}<br />
              Payé: ${sum(filteredOrders.map((o) => Number(o.paid_price)))} ${t('DA')}<br />
              Restant: ${sum(filteredOrders.map((o) => Number(o.total_price) - Number(o.paid_price)))} ${t('DA')}<br>
              <span class='text-green-darken-4'>Bénefice: ${calculateProfit(filteredOrders)} ${t('DA')}</span> 
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

import { useOrdersQuery, type OrderData } from '@/composables/db/orders/useGetOrdersDb'

import type { OrderLineData } from '@/composables/api/orders/useGetOrderApi'

const { t } = useI18n()

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30) // Subtract 30 days

const dateRange = ref<Date[]>([thirtyDaysAgo, today]) // Set the range to 30 days before today to today

const { q, params, isReady } = useOrdersQuery()
isReady.value = true

const startDate = computed(() => {
  const date = new Date(dateRange.value[0])
  if (isNaN(date.getTime())) {
    return null // Return null if the date is invalid
  }
  date.setHours(0, 0, 0, 0) // Set to midnight
  return date.toISOString()
})

const endDate = computed(() => {
  const date = new Date(dateRange.value[dateRange.value.length - 1])
  if (isNaN(date.getTime())) {
    return null // Return null if the date is invalid
  }
  date.setHours(23, 59, 59, 999) // Set to the last millisecond of the day
  return date.toISOString()
})

watchEffect(() => {
  params.date_gte = startDate.value
  params.date_lte = endDate.value
})

const filteredOrders = computed(() => (q.rows.value || []) as unknown as OrderData[])

const historyItems = computed(() => {
  let groupedSummary = []
  for (const date in groupedOrders.value) {
    const intro = `<span class="text-primary">${format(date, 'dd-MM-yyyy')}</span>`
    const dateSummaryitem = {
      title: `${intro}`,
      summary: productSummary(allOrderlinesByDate.value[date]),
      total: `
        Total: ${sum(groupedOrders.value[date].map((o) => Number(o.total_price)))} ${t('DA')}<br>
        <span class='text-green-darken-4'> Bénefice: ${calculateProfit(groupedOrders.value[date])} ${t('DA')} </span>
      `
    }
    groupedSummary.push(dateSummaryitem)
  }

  return groupedSummary
})

const groupedOrders = computed(() =>
  groupBy(sortBy(filteredOrders.value, (t) => new Date(t.date)).reverse(), (t) =>
    new Date(t.date).toDateString()
  )
)

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

    productsSummaries.push(`${totalQte} ${product?.name}`)
  }

  return `${productsSummaries.join(', ')}`
}

function calculateProfit(orderlines: OrderData[]) {
  let profit = 0
  orderlines.forEach((o) => {
    if (o.order_lines)
      profit += o.total_price - sum(o.order_lines.map((l) => l.qte * (l.unit_cost_price || 0)))
  })

  return profit
}
</script>

<style>
.router-link {
  text-decoration: none;
  color: inherit;
}

.v-list-item--three-line .v-list-item-subtitle {
  -webkit-line-clamp: 5 !important;
}
</style>
