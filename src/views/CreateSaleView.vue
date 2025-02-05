<template>
  <div class="d-flex align-start flex-wrap ga-8 pa-4">
    <v-btn
      v-if="$vuetify.display.mobile"
      class="my-5"
      variant="tonal"
      size="small"
      :append-icon="mdiBarcodeScan"
      @click="showScanner = !showScanner"
    >
      {{ $t('scan') }}
    </v-btn>
  </div>
  <v-row justify="center">
    <v-col sm="12" md="6">
      <v-card class="py-2 px-2">
        <v-card-title>{{ $t('add-sale') }}</v-card-title>
        <v-card-text>
          <CreateOrderlines> </CreateOrderlines>
          <div class="d-flex justify-end">
            <v-number-input
              density="comfortable"
              variant="outlined"
              max-width="100"
              :label="$t('payment')"
              inset
              controlVariant="stacked"
              :max="form.total_price"
              :min="0"
              v-model="paymentForm.amount"
            />
          </div>
        </v-card-text>

        <v-card-actions class="justify-space-between">
          <v-card-title> {{ $t('total') }}: {{ form.total_price }} {{ $t('DA') }} </v-card-title>
          <v-btn variant="outlined" color="blue" @click="submitSale" :loading="isLoading">{{
            $t('confirm')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

    <v-col v-if="showScanner" sm="12" md="6">
      <BarcodeScanner @detected="selectProduct" />
    </v-col>
  </v-row>

  <v-container>
    <div class="d-flex align-start flex-wrap ga-8 pa-4">
      <v-divider v-if="!$vuetify.display.mobile" vertical />
      <FilterBar v-model="filters" />
    </div>
    <v-row justify="start" v-for="(o, i) in orders" :key="i">
      <v-col sm="12" md="6">
        <OrderCard v-if="o" :order="o" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import useVuelidate from '@vuelidate/core'
import { mdiBarcodeScan } from '@mdi/js'

import { useUpsertOrderlinesDb } from '@/composables/db/orderlines/useUpsertOrderlinesDb'
import { useUpsertOrdersDb } from '@/composables/db/orders/useUpsertOrdersDb'
import { useUpsertPaymentsDb } from '@/composables/db/payments/useUpsertPaymentsDb'
import { useUpsertNotificationsDb } from '@/composables/db/notifications/useUpsertNotificationsDb'
import { useUpdateProductsQtyDb } from '@/composables/db/products/useUpdateProductsQtyDb'
import { useUpsertStockMovementsDb } from '@/composables/db/stockMovements/useUpsertStockMovementsDb'

import { processStockMovementsForOrder } from '@/composables/useStockManage'

import { useOrdersQuery, type OrderData } from '@/composables/db/orders/useGetOrdersDb'
import { useProductsQuery } from '@/composables/db/products/useGetProductsDb'

import self from '@/composables/localStore/useSelf'

import CreateOrderlines from './OrdersView/CreateOrderStepper/CreateOrderlines.vue'
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import OrderCard from './OrdersView/OrderCard.vue'
import FilterBar from './OrdersView/FilterBar.vue'

import {
  cleanForm,
  form,
  orderlinesForm,
  paymentForm,
  resetOrderForm
} from './OrdersView/CreateOrderStepper/state'

import { DocumentType, OrderStatus } from '@/models/models'
import type { Tables, TablesInsert } from '@/types/database.types'
import type { Filters } from './OrdersView/models/models'

const { q: productsQuery } = useProductsQuery()
const { q: ordersQuery, isReady, params } = useOrdersQuery()
params.type = 'sale'
isReady.value = true

const filters = reactive<Filters>({
  docType: null,
  dateRange: []
})

const lastBarcode = ref('')
let buffer = ''

const orders = computed(() => ordersQuery.rows.value as unknown as OrderData[])

const products = computed(() => (productsQuery.rows.value || []) as unknown as Tables<'products'>[])

const upsertOrdersDb = useUpsertOrdersDb()
const upsertOrderlinesDb = useUpsertOrderlinesDb()
const upsertPaymentsDb = useUpsertPaymentsDb()
const upsertStockMovementsDb = useUpsertStockMovementsDb()
const updateProductsQtyDb = useUpdateProductsQtyDb()
const upsertNotificationsDb = useUpsertNotificationsDb()

const showScanner = ref(false)

const $v = useVuelidate()

const isLoading = computed(
  () =>
    upsertOrderlinesDb.isLoading.value ||
    upsertOrdersDb.isLoading.value ||
    upsertPaymentsDb.isLoading.value
)

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    if (buffer) {
      lastBarcode.value = buffer
      selectProduct(lastBarcode.value)
      console.log('Scanned barcode:', buffer)
    }
    buffer = ''
    return
  }

  if (event.key.length === 1) {
    buffer += event.key
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

function selectProduct(barcode: string) {
  // Find the product using the barcode
  const product = products.value.find((p) => p.bar_code === barcode)
  if (!product) return // Exit if no product is found

  // Check if an orderline already exists for this product
  const existingOrderline = orderlinesForm.value?.find((o) => o.product_id === product.id)

  if (existingOrderline) {
    // Increment quantity if the product already exists in the order
    existingOrderline.qte++
  } else {
    // Find an empty orderline or create a new one
    const emptyOrderline = orderlinesForm.value?.find((o) => !o.product_id)

    if (emptyOrderline) {
      // Fill the empty orderline with product details
      Object.assign(emptyOrderline, {
        product_id: product.id,
        qte: 1, // Default quantity
        unit_price: product.price,
        unit_cost_price: product.cost_price,
        total_price: product.price, // Total price
        order_id: '', // Provide an order ID if needed
        org_id: self.value.current_org?.id || ''
      })
    } else {
      // Add a new orderline
      orderlinesForm.value?.push({
        product_id: product.id,
        qte: 1, // Default quantity
        unit_price: product.price,
        unit_cost_price: product.cost_price,
        total_price: product.price, // Total price
        order_id: '', // Provide an order ID if needed
        org_id: self.value.current_org?.id || ''
      })
    }
  }
}
function submitSale() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    cleanForm()
    form.status = OrderStatus.Confirmed
    form.document_type = DocumentType.Voucher
    const org_id = self.value.current_org?.id || ''
    upsertOrdersDb.form.value = [{ ...form, type: 'sale', org_id, _synced: false }]
    upsertOrdersDb.execute()
  }
}

function insertPayment(payment: TablesInsert<'payments'>) {
  const org_id = self.value.current_org?.id || ''

  upsertPaymentsDb.form.value = [
    {
      ...payment,
      org_id,
      _synced: false
    }
  ]
  upsertPaymentsDb.execute()
}

function insertNotification(title: string, body: string) {
  const org_id = self.value.current_org?.id || ''
  upsertNotificationsDb.form.value = [
    {
      title,
      body,
      org_id,
      url: `/order/${upsertOrdersDb.data.value?.[0].id}`,
      _synced: false
    }
  ]
  upsertNotificationsDb.execute()
}

function updateProductQuantities(ids: string[]) {
  updateProductsQtyDb.stockMovementsIds.value = ids
  updateProductsQtyDb.execute()
}

watch(
  () => upsertStockMovementsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      const ids = upsertStockMovementsDb.data.value.map((s) => s.id)
      updateProductQuantities(ids)
    }
  }
)

watch(
  () => form.total_price,
  (total_price) => {
    paymentForm.amount = total_price
  }
)

watch(
  () => upsertOrdersDb.isSuccess.value,
  (isSuccess) => {
    const order = upsertOrdersDb.data.value?.[0]
    const org_id = order?.org_id
    const order_id = order?.id
    if (isSuccess && order_id && org_id) {
      upsertOrderlinesDb.form.value = orderlinesForm.value?.map((o) => ({
        ...o,
        order_id,
        org_id,
        _synced: false
      }))
      upsertOrderlinesDb.execute()
      if (paymentForm.amount > 0) {
        insertPayment({ ...paymentForm, order_id })
      }

      resetOrderForm()
    }
  }
)

watch(
  [() => upsertOrderlinesDb.isSuccess.value, () => upsertOrdersDb.isSuccess.value],
  async ([isSuccess1, isSuccess2]) => {
    const order_lines = upsertOrderlinesDb.data.value
    const order = upsertOrdersDb.data.value?.[0]

    if (isSuccess1 && isSuccess2 && order_lines && order) {
      const data = {
        order_lines,
        id: order.id
      }
      const stockMovements = processStockMovementsForOrder(data, 'deduct')
      upsertStockMovementsDb.form.value = stockMovements.map((s) => ({
        ...s,
        _synced: false // Add the synced property
      }))
      upsertStockMovementsDb.execute()
      const body =
        order_lines
          .map((line) => {
            const product = products.value.find((p) => p.id === line.product_id)
            return product ? `${line.qte} ${product.name}` : `${line.qte} Unknown Product`
          })
          .join(', ') + ` — ${order.total_price} DA`

      insertNotification('Vente réalisée', body)
    }
  }
)
</script>
