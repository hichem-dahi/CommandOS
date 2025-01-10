<template>
  <v-btn
    class="mt-3 no-print"
    size="small"
    color="grey"
    variant="text"
    :prepend-icon="mdiChevronLeft"
    @click="$router.go(-1)"
    :text="$t('back')"
  />
  <div class="voucher-wrapper" v-if="order">
    <div class="voucher">
      <div class="d-flex justify-space-between align-center">
        <div class="col-1 w-25">
          <div v-for="(value, key) in selfInfo" :key="key">
            <div v-if="value">
              <div v-if="key == 'name'">
                <h3>{{ value }}</h3>
              </div>
              <div v-else-if="key == 'activity'">
                <div>{{ value }}</div>
              </div>
              <div v-else>{{ key }}: {{ value }}</div>
            </div>
          </div>
        </div>
        <h3 class="col-2 flex-grow-1 type">
          {{ title }}
        </h3>
        <div
          class="col-3 w-25 d-flex flex-column justify-space-between align-end align-self-stretch"
        >
          <div></div>
          <div class="individual-info">
            <div v-for="(value, key) in individualInfo" :key="key">
              <span v-if="value">{{ key }}: {{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <table cellpadding="10" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th align="left">N°</th>
            <th align="left">Designation</th>
            <th align="left">Quantity</th>
            <th align="left">Prix HT</th>
            <th align="left">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in items" :key="line.index">
            <td v-for="(value, i) in line" :key="i">
              {{ value }}
            </td>
          </tr>
        </tbody>
        <tfoot class="mt-5">
          <tr
            v-for="(item, key) in totalItems"
            :key="key"
            :class="{ 'font-weight-bold': item.bold }"
          >
            <td colspan="3" class="no-border"></td>
            <td>
              <div>{{ key }}</div>
            </td>
            <td>
              <div>{{ item.value }}</div>
            </td>
            <!-- Replace with actual total -->
          </tr>
        </tfoot>
      </table>
      <div class="total-words">{{ totalWords }}</div>
    </div>
    <div class="actions no-print">
      <v-btn class="mr-5" @click="print()">{{ $t('print') }}</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useRoute } from 'vue-router'
import { pick } from 'lodash'
import n2words from 'n2words'
import { format } from 'date-fns'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { mdiChevronLeft } from '@mdi/js'

import self from '@/composables/localStore/useSelf'

import type { OrderData, OrderLineData } from '@/composables/api/orders/useGetOrderApi'
import type { Tables } from '@/types/database.types'

const route = useRoute()

const paymentQuery = useLiveQuery<Tables<'payments'>>(
  `
    SELECT 
      p.* 
    FROM public.payments p
    WHERE p.id = $1 AND p._deleted = false
  `,
  [route.params.payment_id] // Pass the payment_id from the route as the parameter
)

const payment = computed(() => paymentQuery.rows.value?.[0])

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
    -- Fetching order lines with product details
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
                'product', (
                    SELECT to_jsonb(p)
                    FROM public.products p
                    WHERE p.id = ol.product_id AND p._deleted = false
                    LIMIT 1
                )
            )
        )
        FROM public.order_lines ol
        WHERE ol.order_id = o.id AND ol._deleted = false
    ) AS order_lines,
    -- Fetching delivery details using o.delivery_id
    (
        SELECT to_jsonb(d)
        FROM public.deliveries d
        WHERE d.id = o.delivery_id AND d._deleted = false
        LIMIT 1
    ) AS delivery
  FROM public.orders o
  WHERE o.id = $1 AND o._deleted = false;
  `,
  [toRef(() => payment.value?.order_id)] // Pass route.params.order_id as the parameter
)

const title = computed(() => 'Bon de paiement')

const order = computed(() => orderQuery.rows.value?.[0] as unknown as OrderData | undefined)

const totalWords = computed(() => {
  let number = payment.value?.amount || 0
  let integerPart = Math.floor(number)
  let decimalPart = number % 1
  let words = n2words(integerPart, { lang: 'fr' })

  if (decimalPart !== 0) {
    words += ' virgule ' + n2words(Math.floor(decimalPart * 10), { lang: 'fr' })
  }
  return `${words} dinars alg`
})

const selfInfo = computed(() => {
  let selfInfo = self.value.current_org
  if (!selfInfo) return
  selfInfo = {
    ...selfInfo,
    name: selfInfo.name,
    'R.C': selfInfo.rc,
    'N°tel': selfInfo.phone
  } as any
  const desiredOrder = ['name', 'activity', 'address', 'R.C', 'nif', 'nis', 'art', 'N°tel']
  return pick(selfInfo, desiredOrder)
})

const individualInfo = computed(() => {
  const individualInfoKeys = ['command', 'date', 'nom', 'N°tel']
  let individual = {
    date: format(payment.value?.date || '', 'dd-MM-yyyy p'),
    nom: order.value?.individual?.name,
    command: `N°${order.value?.index}`,
    'N°tel': order.value?.individual?.phone
  }
  return pick(individual, individualInfoKeys)
})

const items = computed(() =>
  order.value?.order_lines.map((o: OrderLineData, i: number) => {
    return {
      index: i,
      product_name: o.product?.name,
      qte: o.qte,
      unit_price: o.unit_price,
      total_price: o.total_price
    }
  })
)

const totalItems = computed(() => {
  return {
    total: {
      value: order.value?.total_price,
      bold: false
    },
    'Montant payé': {
      value: payment.value?.amount,
      bold: true
    }
  }
})

function print() {
  window.print()
}
</script>

<style>
.voucher {
  text-transform: capitalize;
  white-space: nowrap;
  margin: auto;
  transform: scale(0.7); /* Scale down for screen display */
  transform-origin: top; /* Ensure scaling happens from the top */
  max-height: calc(100% / 3);

  @media (min-width: 1024px) {
    /* Target screens larger than 1024px (typical desktop size) */
    max-width: 75%;
  }

  table {
    margin-top: 1.5rem;
  }

  th,
  td {
    border: 1px solid black;
    border-collapse: collapse; /* Ensures borders don't double up */
    padding: 2px 4px;
  }

  .no-border {
    border: none;
  }

  .type {
    text-decoration: underline;
    text-align: center;
  }

  .total-words {
    text-transform: none;
    padding: 1rem;
    text-align: end;
  }

  .delivery-info {
    max-width: min-content;
    font-size: 0.6rem;
    white-space: nowrap;
  }
}

@media print {
  .voucher-wrapper {
    max-height: 100vh; /* Ensure the vouchers fit on one page */
  }

  .voucher {
    font-size: x-small;
    max-width: none;
    margin: 0;
    page-break-inside: avoid; /* Prevent breaking inside voucher */
    transform: none;
    max-height: calc(100vh / 3);
  }

  .no-print {
    display: none;
  }
}

.actions {
  position: fixed;
  bottom: 0;
  right: 0;
  padding: 2rem;
}
</style>
