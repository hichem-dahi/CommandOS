<template>
  <v-row class="align-center mb-2">
    <v-col cols="12" class="d-flex align-center justify-space-between">
      <v-btn
        v-if="$vuetify.display.mobile"
        variant="tonal"
        size="small"
        :append-icon="mdiBarcodeScan"
        @click="showScanner = !showScanner"
      >
        {{ $t('scan') }}
      </v-btn>
    </v-col>
  </v-row>

  <v-row no-gutters>
    <v-col cols="12" md="8">
      <v-card class="d-flex flex-column h-100" variant="text">
        <v-card-title>{{ $t('add-sale') }}</v-card-title>

        <v-card-text>
          <CreateOrderlines />
        </v-card-text>

        <v-card-actions class="justify-space-between">
          <div class="d-flex ga-2">
            <v-chip v-for="(_, i) in savedSales" :key="i" @click="restoreSale(i)">
              {{ $t('sale') }} #{{ i }}
            </v-chip>
          </div>
          <v-btn variant="flat" color="info" @click="saveSale">
            {{ $t('save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

    <v-col cols="12" md="4">
      <v-card variant="text" class="sticky-summary">
        <v-card-subtitle>
          {{ $t('total') }}
        </v-card-subtitle>
        <v-card-title class="text-h3">
          <span class="text-primary">{{ form.total_price }}</span> {{ $t('DA') }}
        </v-card-title>
        <v-card-text class="d-flex flex-column ga-2">
          <v-number-input
            class="orderline-input"
            density="compact"
            max-width="120"
            variant="outlined"
            :label="$t('payment')"
            :max="form.total_price"
            :min="0"
            v-model="paymentForm.amount"
          />
          <v-number-input
            class="orderline-input"
            density="compact"
            max-width="120"
            variant="outlined"
            :label="$t('reduction')"
            :max="form.total_price"
            :min="0"
            v-model="form.reduction"
          />
          <div class="d-flex flex-wrap ga-2 mb-2">
            <v-chip size="small" color="primary" variant="tonal">
              {{ $t('total') }}: {{ form.total_price }} {{ $t('DA') }}
            </v-chip>
            <v-chip size="small" color="secondary" variant="tonal">
              {{ $t('reduction') }}: {{ form.reduction || 0 }} {{ $t('DA') }}
            </v-chip>
            <v-chip v-if="toPay > 0" size="small" color="error" variant="tonal">
              {{ $t('remaining') }}: {{ toPay }} {{ $t('DA') }}
            </v-chip>

            <v-chip v-else size="small" color="success" variant="tonal">
              {{ $t('paid') }}
            </v-chip>
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="flat" color="primary" @click="submitSale" :loading="isLoading">
            {{ $t('confirm') }}
          </v-btn>

          <v-btn variant="tonal" color="secondary" @click="handleReset">
            {{ $t('reset') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>

    <v-col v-if="showScanner" cols="12">
      <v-card>
        <v-card-text>
          <BarcodeScanner @detected="(v) => selectProduct(v, orderlinesForm)" />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
  <v-divider class="my-3" />
  <div class="orders-wrapper">
    <div class="orders-table">
      <OrdersTable :orders="orders">
        <template #title>
          <div class="d-flex justify-space-between align-center">
            <div class="text-h5 pa-4">{{ $t('sales-list') }}</div>
          </div>
        </template>
        <template #top>
          <div class="d-flex align-center justify-space-between flex-wrap ga-4">
            <FilterBar v-model="filters" />

            <div class="d-flex align-center ga-2">
              <v-chip size="small" color="primary" variant="tonal">
                {{ ordersCount }}
              </v-chip>
              <v-chip size="small" color="secondary" variant="tonal">
                {{ $t('total') }}: {{ ordersTotal }} {{ $t('DA') }}
              </v-chip>
            </div>
          </div>
        </template>
      </OrdersTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch, watchEffect } from 'vue'
import useVuelidate from '@vuelidate/core'
import { cloneDeep } from 'lodash'
import { useLocalStorage } from '@vueuse/core'
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
import FilterBar from './OrdersView/FilterBar.vue'
import OrdersTable from './OrdersView/OrdersTable.vue'

import {
  cleanForm,
  form,
  orderlinesForm,
  paymentForm,
  resetOrderForm,
  type RequiredFields
} from './OrdersView/CreateOrderStepper/state'

import { DocumentType, OrderStatus } from '@/models/models'
import type { Tables, TablesInsert } from '@/types/database.types'
import type { Filters } from './OrdersView/models/models'

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const { q: productsQuery } = useProductsQuery()
const { q: ordersQuery, isReady, params } = useOrdersQuery()
params.type = 'sale'
isReady.value = true

const filters = reactive<Filters>({
  docType: null,
  dateRange: [thirtyDaysAgo, today],
  status: null
})

const startDate = computed(() => {
  const date = new Date(filters.dateRange[0])
  if (isNaN(date.getTime())) {
    return null
  }
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
})

const endDate = computed(() => {
  const date = new Date(filters.dateRange[filters.dateRange.length - 1])
  if (isNaN(date.getTime())) {
    return null
  }
  date.setHours(23, 59, 59, 999)
  return date.toISOString()
})

watchEffect(() => {
  params.date_gte = startDate.value
  params.date_lte = endDate.value
  params.doc_type = filters.docType
  params.status = filters.status
})

const lastBarcode = ref('')

let buffer = ref('')

const orders = computed(() => (ordersQuery.rows.value || []) as unknown as OrderData[])
const products = computed(() => (productsQuery.rows.value || []) as unknown as Tables<'products'>[])

const upsertOrdersDb = useUpsertOrdersDb()
const upsertOrderlinesDb = useUpsertOrderlinesDb()
const upsertPaymentsDb = useUpsertPaymentsDb()
const upsertStockMovementsDb = useUpsertStockMovementsDb()
const updateProductsQtyDb = useUpdateProductsQtyDb()
const upsertNotificationsDb = useUpsertNotificationsDb()

const savedSales = useLocalStorage('savedSales', [] as any[])

const showScanner = ref(false)

const $v = useVuelidate()

const isLoading = computed(
  () =>
    upsertOrderlinesDb.isLoading.value ||
    upsertOrdersDb.isLoading.value ||
    upsertPaymentsDb.isLoading.value
)

const ordersCount = computed(() => orders.value?.length || 0)
const ordersTotal = computed(() =>
  (orders.value || []).reduce((sum, o) => sum + Number(o.total_price || 0), 0)
)

const netTotal = computed(() => Number(form.total_price || 0) - Number(form.reduction || 0))
const toPay = computed(() => Math.max(0, netTotal.value - Number(paymentForm.amount || 0)))

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    if (buffer.value) {
      lastBarcode.value = buffer.value
      orderlinesForm.value = selectProduct(lastBarcode.value, orderlinesForm.value)
      console.log('Scanned barcode:', buffer)
    }
    buffer.value = ''
    return
  }

  if (event.key.length === 1) {
    buffer.value += event.key
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

function selectProduct(
  barcode: string,
  orderlines: RequiredFields<TablesInsert<'order_lines'>>[]
): RequiredFields<TablesInsert<'order_lines'>>[] {
  const orderlinesTmp = cloneDeep(orderlines)

  // Find the product using the barcode
  const product = products.value.find((p) => p.bar_code === barcode)
  if (!product) return orderlinesTmp

  // Check if an orderline already exists for this product
  const existingOrderline = orderlinesTmp.find((o) => o.product_id === product.id)

  if (existingOrderline) {
    // Increment quantity if the product already exists in the order
    existingOrderline.qte++
  } else {
    // Find an empty orderline or create a new one
    const emptyOrderline = orderlinesTmp.find((o) => !o.product_id)

    const baseOrderline = {
      product_id: product.id,
      qte: 1,
      unit_price: product.price,
      unit_cost_price: product.cost_price,
      total_price: product.price,
      order_id: '',
      org_id: self.value.current_org?.id || ''
    }

    if (emptyOrderline) {
      Object.assign(emptyOrderline, baseOrderline)
    } else {
      orderlinesTmp.push(baseOrderline)
    }
  }

  return orderlinesTmp
}

function saveSale() {
  const org_id = self.value.current_org?.id || ''
  const order = { ...form, order_lines: orderlinesForm.value, type: 'sale', org_id, _synced: false }
  savedSales.value.push(order)
  resetOrderForm()
}

function restoreSale(i: number) {
  const savedOrder = savedSales.value[i]
  if (savedOrder) {
    Object.assign(form, savedOrder)

    if (savedOrder.order_lines) {
      orderlinesForm.value = cloneDeep(savedOrder.order_lines)
    }

    savedSales.value.splice(i, 1)
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

function handleReset() {
  resetOrderForm()
  $v.value.$reset()
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
      $v.value.$reset()
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
