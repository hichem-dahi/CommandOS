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
  <div class="invoice-wrapper">
    <div v-if="order" ref="invoice" class="invoice">
      <div class="row-1">
        <div v-for="(value, key) in selfInfo" :key="key">
          <div v-if="key == 'name'">
            <h3>{{ value }}</h3>
          </div>
          <div v-else-if="key == 'activity'">
            <div>{{ value }}</div>
          </div>
          <div v-else>{{ key }}: {{ value }}</div>
        </div>
        <h3 class="type pa-4">
          {{ title }}
          <span v-if="order.doc_index">
            N°: {{ padStart(order.doc_index.toString(), 4, '0') }}/2024
          </span>
        </h3>
        <div class="d-flex justify-space-between align-center ga-4">
          <div>
            <div v-for="(value, key) in consumer" :key="key">{{ key }}: {{ value }}</div>
          </div>
          <div class="mt-6 text-decoration-underline">
            SPA LE: {{ format(order.date, 'dd-MM-yyyy') }}
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
          <tfoot>
            <tr v-for="(value, key) in totalItems" :key="key">
              <td colspan="3" class="no-border"></td>
              <td>
                <strong>{{ key }}</strong>
              </td>
              <td>
                <strong>{{ value }}</strong>
              </td>
              <!-- Replace with actual total -->
            </tr>
          </tfoot>
        </table>
        <div v-if="order?.payment_method" class="payment-method mt-5">
          Mode de payment: {{ order?.payment_method }}
        </div>
        <div v-if="totalWords" class="total-words">
          Arréter la préforma a la somme de: <b>{{ totalWords }}</b>
        </div>
      </div>
      <div
        class="delivery-info row-2"
        v-if="($route.query.type as any) == DocumentType.DeliveryNote"
      >
        <div class="d-flex align-center" v-for="(value, key) in deliveryInfo" :key="key">
          <span class="font-weight-bold">{{ key }}:</span>
          <span>&nbsp;{{ value }}</span>
        </div>
      </div>
    </div>
    <div class="actions no-print">
      <v-btn class="mr-5" @click="print()">print</v-btn>
      <v-btn @click="downloadInvoice()">download</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { pick, round, padStart } from 'lodash'
import html2pdf from 'html2pdf.js'
import n2words from 'n2words'
import { format } from 'date-fns'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { mdiChevronLeft } from '@mdi/js'

import self from '@/composables/localStore/useSelf'

import { ConsumerType, DocumentType } from '@/models/models'
import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'

const route = useRoute()
const invoice = ref()

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
  [route.params.order_id] // Pass route.params.order_id as the parameter
)

const order = computed(() => orderQuery.rows.value?.[0] as unknown as OrderData | undefined)

const title = computed(() => (order.value?.delivery ? 'bon de livraison' : 'facture'))

const consumerType = computed(() =>
  order.value?.client_id ? ConsumerType.Organization : ConsumerType.Individual
)

const totalWords = computed(() => {
  if (consumerType.value === ConsumerType.Individual) return undefined
  let number = totalItems.value['T.T.C'] || 0
  let integerPart = Math.floor(number)
  let decimalPart = number % 1

  let words = n2words(integerPart, { lang: 'fr' })
  if (decimalPart !== 0) {
    words += ' virgule ' + n2words(Math.floor(decimalPart * 10), { lang: 'fr' })
  }
  return `${words} dinars alg`
})

const deliveryInfo = computed(() => {
  const deliveryInfoKeys = ['chauffeur', 'N°tel', 'matricule', 'destination']
  let delivery = {
    ...order.value?.delivery,
    chauffeur: order.value?.delivery?.driver_name,
    'N°tel': order.value?.delivery?.phone
  }
  return pick(delivery, deliveryInfoKeys)
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

const consumer = computed(() => {
  let organization = { ...order.value?.client }
  let individual = order.value?.individual as any

  if (Object.keys(organization).length) {
    organization = { ...organization, client: organization.name } as any
    const desiredOrder = ['client', 'rc', 'nif', 'nis', 'art', 'address', 'activity']
    return pick(organization, desiredOrder)
  } else if (Object.keys(individual).length) {
    individual = { ...individual, client: individual.name }
    const desiredOrder = ['client', 'phone']
    return pick(individual, desiredOrder)
  } else return ''
})

const items = computed(() =>
  order.value?.order_lines?.map((o, i) => {
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
  const isOrganization = consumerType.value == ConsumerType.Organization
  if (isOrganization) {
    return {
      total: order.value?.total_price,
      'T.V.A 19%': round((order.value?.total_price! * 19) / 100, 0),
      'T.T.C': round((order.value?.total_price! * 119) / 100, 0)
    }
  } else
    return {
      total: order.value?.total_price
    }
})

function print() {
  window.print()
}

function downloadInvoice() {
  const invoiceElement = document.querySelector('.invoice') // Select the invoice element
  if (!invoiceElement) return // Ensure the element exists

  // Backup original styles
  const originalMaxWidth = (invoiceElement as any).maxWidth
  const originalTransform = (invoiceElement as any).transform

  // Remove max-width and scale
  ;(invoiceElement as any).style.maxWidth = 'none'
  ;(invoiceElement as any).transform = 'none'

  // Configuration for html2pdf
  const opt = {
    margin: [10, 10, 10, 10], // Margins in mm
    filename: 'invoice.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 }, // Scale for better resolution
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  // Generate and save the PDF
  html2pdf()
    .from(invoiceElement)
    .set(opt)
    .save()
    .then(() => {
      ;(invoiceElement as any).maxWidth = originalMaxWidth
      ;(invoiceElement as any).transform = originalTransform
    })
}
</script>

<style>
.invoice {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-transform: capitalize;
  width: 210mm; /* A4 paper width */
  height: calc(297mm - 20mm); /* A4 height minus top and bottom margins (10mm each) */
  margin: 10mm auto; /* Add 10mm margin on top and bottom, auto for centering */
  white-space: nowrap;
  transform: scale(0.7); /* Scale down for screen display */
  transform-origin: top; /* Ensure scaling happens from the top */

  @media (min-width: 1024px) {
    max-width: 50%;
  }

  table {
    margin-top: 25px;
    width: 100%; /* Ensure table takes full width */
  }

  th,
  td {
    border: 1px solid black;
    border-collapse: collapse;
    padding: 4px 8px;
  }

  .no-border {
    border: none;
  }

  .type {
    margin-top: 5px;
    text-decoration: underline;
    text-align: center;
  }

  .payment-method {
    text-transform: none;
  }

  .total-words {
    text-transform: none;
  }

  .delivery-info {
    max-width: min-content;
    font-size: 12px;
    white-space: nowrap;
    padding: 1rem;
    border: 1px solid slategrey;
  }
}

@media print {
  .invoice {
    width: 210mm; /* A4 width */
    height: calc(297mm - 10mm); /* A4 height minus margins for print */
    margin: auto; /* Keep margins on print */
    transform: none; /* Remove scaling for print */
    max-width: none;
    page-break-inside: avoid; /* Prevent breaking inside the invoice */
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
