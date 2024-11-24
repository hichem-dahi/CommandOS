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
    <v-col sm="12" md="6">
      <BarcodeScanner v-if="showScanner" @detected="selectProduct" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import useVuelidate from '@vuelidate/core'
import { mdiBarcodeScan } from '@mdi/js'

import CreateOrderlines from './OrdersView/CreateOrderStepper/CreateOrderlines.vue'
import BarcodeScanner from '@/components/BarcodeScanner.vue'

import { useGetProductsApi } from '@/composables/api/products/useGetProductsApi'
import { useInsertOrderlinesApi } from '@/composables/api/orderlines/useInsertOrderlinesApi'
import { useInsertOrderApi } from '@/composables/api/orders/useInsertOrderApi'
import { useInsertPaymentsApi } from '@/composables/api/payments/useInsertPaymentApi'

import {
  cleanForm,
  form,
  orderlinesForm,
  paymentForm,
  resetForm,
  resetPayment
} from './OrdersView/CreateOrderStepper/state'

import type { TablesInsert } from '@/types/database.types'
import { DocumentType, OrderStatus } from '@/models/models'
import { useInsertNotificationApi } from '@/composables/api/notifications/useInsertNotificationApi'
import self from '@/composables/localStore/useSelf'

const getProductsApi = useGetProductsApi()
const insertOrderApi = useInsertOrderApi()
const insertOrderlinesApi = useInsertOrderlinesApi()
const insertPaymentApi = useInsertPaymentsApi()
const insertNotificationApi = useInsertNotificationApi()

const showScanner = ref(false)

const $v = useVuelidate()

const products = computed(() => getProductsApi.data.value || [])
const isLoading = computed(
  () =>
    insertOrderlinesApi.isLoading.value ||
    insertOrderApi.isLoading.value ||
    insertPaymentApi.isLoading.value
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
    insertOrderApi.form.value = { ...(form as TablesInsert<'orders'>) }
    insertOrderApi.execute()
  }
}

watch(
  () => form.total_price,
  (total_price) => {
    paymentForm.amount = total_price
  }
)

watch(
  () => insertOrderApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && insertOrderApi.data.value?.id) {
      insertOrderlinesApi.form.value = orderlinesForm.value.map((o) => ({
        ...o,
        order_id: insertOrderApi.data.value?.id || ''
      }))

      insertOrderlinesApi.execute()

      if (paymentForm?.amount) {
        insertPaymentApi.form.value = {
          ...paymentForm,
          order_id: insertOrderApi.data.value?.id
        } as TablesInsert<'payments'>
        insertPaymentApi.execute()
      }

      resetForm()
      resetPayment()
    }
  }
)

watch(
  [() => insertOrderlinesApi.isSuccess.value, () => insertOrderApi.isSuccess.value],
  ([isSuccess1, isSuccess2]) => {
    const orderlines = insertOrderlinesApi.data.value
    const org_id = self.value.user?.organization_id
    const order = insertOrderApi.data.value

    if (isSuccess1 && isSuccess2 && orderlines && org_id && order) {
      const body =
        orderlines
          .map((line) => {
            const product = products.value.find((prod) => prod.id === line.product_id)
            return product ? `${line.qte} ${product.name}` : `${line.qte} Unknown Product`
          })
          .join(', ') + ` — ${order.total_price} DA`

      insertNotificationApi.form.value = {
        title: `Vente réalisée`,
        body,
        org_id
      }

      insertNotificationApi.execute()
    }
  }
)
</script>
