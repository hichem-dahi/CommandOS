<template>
  <div class="d-flex align-start flex-wrap ga-8 pa-4">
    <v-btn
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
        <CreateOrderlines> </CreateOrderlines>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-number-input
            class="ml-auto"
            max-width="200"
            :label="$t('payment')"
            inset
            controlVariant="stacked"
            :suffix="`/${form.total_price} ${$t('DA')}`"
            :max="form.total_price"
            :min="0"
            v-model="paymentForm.amount"
          />
          <v-spacer></v-spacer>

          <v-btn variant="text" color="blue" @click="submitSale" :loading="isLoading">{{
            $t('submit')
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col v-if="showScanner" @detected="selectProduct" sm="12" md="6">
      <BarcodeScanner />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import useVuelidate from '@vuelidate/core'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { mdiBarcodeScan } from '@mdi/js'

import { useUpsertOrderlinesDb } from '@/composables/db/orderlines/useUpsertOrderlinesDb'
import { useUpsertOrdersDb } from '@/composables/db/orders/useUpsertOrdersDb'
import { useUpsertPaymentsDb } from '@/composables/db/payments/useUpsertPaymentsDb'
import { useUpsertNotificationsDb } from '@/composables/db/notifications/useUpsertNotificationsDb'
import { useUpdateProductsQtyDb } from '@/composables/db/products/useUpdateProductsQtyDb'
import { useUpsertStockMovementsDb } from '@/composables/db/stockMovements/useUpsertStockMovementsDb'

import { processStockMovementsForOrder } from '@/composables/useStockManage'

import self from '@/composables/localStore/useSelf'

import CreateOrderlines from './OrdersView/CreateOrderStepper/CreateOrderlines.vue'
import BarcodeScanner from '@/components/BarcodeScanner.vue'

import {
  cleanForm,
  form,
  orderlinesForm,
  paymentForm,
  resetForm,
  resetPayment
} from './OrdersView/CreateOrderStepper/state'

import { DocumentType, OrderStatus, type Product } from '@/models/models'
import type { Tables, TablesInsert } from '@/types/database.types'

const productsQuery = useLiveQuery<Tables<'products'>>(
  'SELECT * FROM public.products WHERE _deleted = false;',
  []
)

const products = computed(() => (productsQuery.rows.value || []) as unknown as Product[])

const upsertOrdersDb = useUpsertOrdersDb()
const upsertOrderlinesDb = useUpsertOrderlinesDb()
const upsertPaymentsDb = useUpsertPaymentsDb()

const upsertStockMovementsDb = useUpsertStockMovementsDb()
const upsertPaymentDb = useUpsertPaymentsDb()
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

function selectProduct(barcode: number) {
  // Find the product using the barcode
  const product = products.value.find((p) => p.bar_code == barcode)
  if (!product) return // Exit if no product is found

  // Check if an orderline already exists for this product
  const existingOrderline = orderlinesForm.value.some((o) => o.product_id === product.id)

  if (existingOrderline) {
    // Increment the quantity if theorderline exists
    return
  } else {
    // Find an empty orderline (no product_id assigned)
    const emptyOrderline = orderlinesForm.value.find((o) => !o.product_id)

    if (emptyOrderline) {
      // Fill the empty orderline with product details
      emptyOrderline.product_id = product.id
      emptyOrderline.qte = 1 // Default quantity
    } else {
      // No empty orderline, so add a new one
      orderlinesForm.value.push({
        product_id: product.id,
        qte: 1, // Default quantity
        unit_price: 0,
        unit_cost_price: 0,
        total_price: 0, // Total price
        order_id: '' // Provide an order ID if needed
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
    const org_id = self.value.user?.organization_id
    if (org_id) {
      upsertOrdersDb.form.value = [{ ...form, org_id, _synced: false }]
      upsertOrdersDb.execute()
    }
  }
}

function insertPayment(payment: TablesInsert<'payments'>) {
  upsertPaymentsDb.form.value = [
    {
      ...payment,
      _synced: false
    }
  ]
  upsertPaymentsDb.execute()
}

function insertNotification(title: string, body: string) {
  const org_id = self.value.user?.organization_id || ''
  upsertNotificationsDb.form.value = [
    {
      title,
      body,
      org_id,
      _synced: false
    }
  ]
  upsertNotificationsDb.execute()
}

function updateProductQuantities(updates: { product_id: string; qte_change: number }[]) {
  updateProductsQtyDb.form.value = updates
  updateProductsQtyDb.execute()
}

watch(
  () => upsertStockMovementsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      const updates = upsertStockMovementsDb.data.value.map((s) => ({
        product_id: s.product_id,
        qte_change: s.qte_change
      }))
      updateProductQuantities(updates)
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
    const order_id = upsertOrdersDb.data.value?.[0].id
    if (isSuccess && order_id) {
      upsertOrderlinesDb.form.value = orderlinesForm.value.map((o) => ({
        ...o,
        order_id,
        _synced: false
      }))
      upsertOrderlinesDb.execute()

      if (paymentForm.amount) {
        insertPayment({ ...paymentForm, amount: paymentForm.amount ?? 0, order_id })
      }

      resetForm()
      resetPayment()
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
      const stockMovements = processStockMovementsForOrder(data, 'deduct', products.value)
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
