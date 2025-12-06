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
  <div class="proforma-wrapper">
    <div v-if="proforma" ref="proforma" class="proforma">
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
        <h3 class="type">{{ title }}</h3>
        <div class="d-flex justify-space-between ga-4">
          <div>
            <div v-for="(value, key) in organizationInfo" :key="key">{{ key }}: {{ value }}</div>
          </div>
          <div class="date">SPA LE: {{ format(proforma.date, 'dd-MM-yyyy') }}</div>
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
        <div class="total-words">{{ totalWords }}</div>
      </div>
    </div>
    <div class="actions no-print">
      <v-btn class="mr-5" @click="print()">print</v-btn>
      <v-btn @click="downloadProforma()">download</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { pick, round } from 'lodash'
import html2pdf from 'html2pdf.js'
import n2words from 'n2words'
import { mdiChevronLeft } from '@mdi/js'
import { format } from 'date-fns'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import self from '@/composables/localStore/useSelf'

import { ConsumerType } from '@/models/models'
import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'

const route = useRoute()

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

const proforma = computed(() => orderQuery.rows.value?.[0] as unknown as OrderData | undefined)

const title = computed(() => 'Facture préforma')

const consumerType = computed(() =>
  proforma.value?.client_id ? ConsumerType.Organization : ConsumerType.Individual
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

const organizationInfo = computed(() => {
  let client = proforma.value?.client

  if (client) {
    client = { ...client, client: client.name } as any
    const desiredOrder = ['client', 'rc', 'nif', 'nis', 'art', 'address', 'activity']
    return pick(client, desiredOrder)
  } else return undefined
})

const items = computed(() =>
  proforma.value?.order_lines?.map((o, i) => {
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
    total: proforma.value?.total_price,
    'T.V.A 19%': round((proforma.value?.total_price! * 19) / 100, 0),
    'T.T.C': round((proforma.value?.total_price! * 119) / 100, 0)
  }
})

function print() {
  window.print()
}

function downloadProforma() {
  const proformaElement = document.querySelector('.proforma') // Select the proforma element
  if (!proformaElement) return // Ensure the element exists

  // Backup original styles
  const originalMaxWidth = (proformaElement as any).maxWidth
  const originalTransform = (proformaElement as any).transform

  // Remove max-width and scale
  ;(proformaElement as any).style.maxWidth = 'none'
  ;(proformaElement as any).transform = 'none'

  // Configuration for html2pdf
  const opt = {
    margin: [10, 10, 10, 10], // Margins in mm
    filename: 'proforma.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 }, // Scale for better resolution
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  // Generate and save the PDF
  html2pdf()
    .from(proformaElement)
    .set(opt)
    .save()
    .then(() => {
      // Restore original styles after download
      ;(proformaElement as any).maxWidth = originalMaxWidth
      ;(proformaElement as any).transform = originalTransform
    })
}
</script>

<style>
.proforma {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-transform: capitalize;
  aspect-ratio: 1 / 1.414; /* Aspect ratio for A4 size */
  overflow-y: auto; /* Add scroll to the wrapper if content exceeds the height */
  margin: auto;
  white-space: nowrap;
  transform: scale(0.7); /* Scale down the element */
  transform-origin: top; /* Ensure scaling happens from the top */

  @media (min-width: 1024px) {
    /* Target screens larger than 1024px (typical desktop size) */
    max-width: 50%;
  }

  table {
    margin-top: 25px;
  }

  th,
  td {
    border: 1px solid black;
    border-collapse: collapse; /* Ensures borders don't double up */
    padding: 4px 8px;
  }

  .no-border {
    border: none;
  }

  .date {
    text-decoration: underline;
    margin: 1rem 1rem 0 0;
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
    padding: 1rem;
    text-align: end;
  }
}

@media print {
  .proforma {
    max-width: none;
    transform: none;
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
