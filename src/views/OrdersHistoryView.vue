<template>
  <v-date-input
    variant="underlined"
    hide-details
    v-model="dateRange"
    :label="$t('date')"
    max-width="368"
    min-width="150"
    multiple="range"
  />
  <v-row class="mt-10">
    <v-col sm="12" md="6">
      <v-list density="compact" class="overflow-y" style="max-height: 200px">
        <template v-for="item in historyItems" :key="item.orderId || item.title">
          <v-list-item>
            <v-list-item-subtitle>
              <div v-html="item.subtitle"></div>
            </v-list-item-subtitle>
          </v-list-item>
        </template>
      </v-list>
      <div class="total text-end pa-4" v-if="allOrderlines">
        {{ t('total') }}:
        <span v-html="productSummary(allOrderlines)"></span>
        &mdash;
        <span>
          <span class="text-blue">{{ t('revenue') }}:</span>
          {{ `${sum(filteredOrders.map((o) => Number(o.paid_price)))} ${t('DA')}` }},
          <span class="text-green">{{ t('profit') }}:</span>
          {{ `${calculateProfit(allOrderlines)} ${t('DA')}` }}
        </span>
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { groupBy, sortBy, sum } from 'lodash'
import { format } from 'date-fns'
import { useI18n } from 'vue-i18n'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import { type OrderData } from '@/composables/api/orders/useGetOrderApi'

import type { OrderLineData } from '@/composables/api/orders/useGetOrderApi'

const { t } = useI18n()

const dateRange = ref<Date[]>([])

const orderQuery = useLiveQuery<OrderData>(
  `SELECT
    o.*,
    -- Fetching individual data as a separate field
    (
        SELECT to_jsonb(i)
        FROM public.individuals i
        WHERE i.id = o.individual_id AND i._deleted = false
        LIMIT 1
    ) AS individual,
    -- Fetching client data as a separate field
    (
        SELECT to_jsonb(org)
        FROM public.organizations org
        WHERE org.id = o.client_id AND org._deleted = false
        LIMIT 1
    ) AS client,
    -- Fetching payments as an array of JSON objects
    (
        SELECT jsonb_agg(p)
        FROM public.payments p
        WHERE p.order_id = o.id AND p._deleted = false
    ) AS payments,
    -- Fetching order lines as an array of JSON objects with product details
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ol.id,
                'order_id', ol.order_id,
                'product_id', ol.product_id,
                'qte', ol.qte,
                'unit_price', ol.unit_price,
                'unit_cost_price', ol.unit_cost_price,
                'total_price', ol.total_price,
                'updated_at', ol.updated_at,
                '_deleted', ol._deleted,
                '_synced', ol._synced,
                'product', (
                    SELECT to_jsonb(p)
                    FROM public.products p
                    WHERE p.id = ol.product_id AND p._deleted = false
                )
            )
        )
        FROM public.order_lines ol
        WHERE ol.order_id = o.id AND ol._deleted = false
    ) AS order_lines
  FROM public.orders o
  WHERE o._deleted = false
  AND o.date >= $1 AND o.date <= $2; -- Date range filter
  `,
  [dateRange.value[0], dateRange.value[dateRange.value.length - 1]] // Pass the reactive date range as query parameters
)

const filteredOrders = computed(() => orderQuery.rows.value || [])

const historyItems = computed(() => {
  let groupedSummary = []
  for (const date in groupedOrders.value) {
    const intro = `<span class="text-primary">${format(date, 'dd-MM-yyyy')}</span>&nbsp;&nbsp;`
    const totalBenefits = calculateProfit(allOrderlinesByDate.value[date])
    const totalPaid = sum(groupedOrders.value[date].map((o) => Number(o.paid_price)))

    const dateSummaryitem = {
      subtitle: `${intro} ${productSummary(allOrderlinesByDate.value[date])}
      &mdash; ${t('revenue')}: ${totalPaid} ${t('DA')}, ${t('profit')}: ${totalBenefits} ${t('DA')}`
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
    result[date] = ordersForDate.flatMap((o) => o?.order_lines)
  })

  return result
})

const allOrderlines = computed(() => {
  return filteredOrders.value.flatMap((o) => o?.order_lines).filter((e) => e)
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
