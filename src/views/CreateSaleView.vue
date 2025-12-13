<template>
  <v-card class="px-8 py-4" elevation="2">
    <div class="text-h4 py-8 px-4">
      {{ $t('add-sale') }}
    </div>
    <v-row>
      <v-col>
        <v-sheet class="d-flex align-end pa-4 ga-6 flex-wrap" rounded="lg">
          <!-- Title -->
          <div class="text-h6 font-weight-medium text-capitalize">{{ $t('options') }}:</div>

          <!-- Consumer Selector -->
          <div class="d-flex align-center ga-3">
            <v-btn
              v-if="!consumerPicked"
              variant="tonal"
              color="primary"
              @click="clientDialog = true"
            >
              {{ $t('add-client') }}
            </v-btn>

            <v-chip
              v-else
              closable
              size="small"
              color="primary"
              variant="flat"
              @click:close="resetClient"
            >
              {{ $t('client') }}:
              {{ form.individual_id ? individualForm.name : clientForm.name }}
            </v-chip>

            <!-- Dialog -->
            <v-dialog v-model="clientDialog" max-width="500">
              <CreateOrderStepper @success="clientDialog = false" />
            </v-dialog>
          </div>

          <!-- Divider between sections -->
          <v-divider vertical class="mx-2" />

          <!-- Transaction Type Radios -->
          <v-radio-group v-model="form.type" hide-details inline class="d-flex align-center">
            <v-radio :label="$t('sale')" value="sale" />

            <v-tooltip :disabled="!!consumerPicked" text="Select a consumer first">
              <template #activator="{ props }">
                <v-radio
                  v-bind="props"
                  :label="$t('order')"
                  value="order"
                  :disabled="!consumerPicked"
                />
              </template>
            </v-tooltip>
          </v-radio-group>
        </v-sheet>
      </v-col>
    </v-row>
    <v-divider />
    <v-row no-gutters>
      <v-col cols="12" md="7" align-self="center">
        <CreateOrderlines />
      </v-col>
      <v-divider class="mx-auto" vertical />
      <!-- RIGHT SUMMARY -->
      <v-col cols="12" md="4">
        <v-card variant="text" class="pa-4">
          <v-card-subtitle class="text-body-1 mb-1">
            {{ $t('total') }}
          </v-card-subtitle>

          <v-card-title class="text-h4 mb-4">
            <span class="text-primary">{{ form.total_price }}</span> {{ $t('DA') }}
          </v-card-title>

          <v-card-text class="d-flex flex-column">
            <v-number-input
              class="orderline-input"
              density="compact"
              max-width="160"
              variant="underlined"
              :label="$t('payment')"
              :max="form.total_price"
              v-model="paymentForm.amount"
            />

            <v-number-input
              class="orderline-input"
              density="compact"
              max-width="160"
              variant="underlined"
              :label="$t('reduction')"
              :max="form.total_price"
              v-model="form.reduction"
            />
            <v-chip v-if="toPay > 0" variant="text" size="small" color="warning">
              {{ $t('remaining') }}: {{ toPay }} {{ $t('DA') }}
            </v-chip>
            <v-divider class="my-4"></v-divider>
          </v-card-text>

          <v-card-actions class="flex-column justify-end ga-2">
            <v-btn
              color="primary"
              variant="flat"
              rounded
              block
              @click="submitSale"
              :loading="isLoading"
            >
              {{ $t('confirm') }}
            </v-btn>

            <v-btn color="secondary" variant="tonal" rounded block @click="handleReset">
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

    <v-row>
      <v-col>
        <!-- FOOTER ACTIONS -->
        <div class="d-flex justify-space-between">
          <div class="d-flex ga-2 flex-wrap">
            <v-chip
              v-for="(_, i) in savedSales"
              :key="i"
              @click="restoreSale(i)"
              size="small"
              color="secondary"
              variant="tonal"
            >
              {{ $t('sale') }} #{{ i }}
            </v-chip>
          </div>
          <v-btn
            variant="text"
            :prepend-icon="mdiClockOutline"
            color="info"
            @click="saveSale"
            rounded
            density="compact"
            size="small"
          >
            {{ $t('save-for-later') }}</v-btn
          >
        </div>
      </v-col>
    </v-row>
    <v-divider class="mt-8 mb-16" />
    <OrdersTable :orders="orders">
      <template #title>
        <div class="d-flex justify-space-between align-center">
          <div class="text-h5 pa-4">{{ $t('sales-list') }}</div>
        </div>
      </template>
      <template #top>
        <div class="d-flex align-center justify-space-between flex-wrap ga-4">
          <FilterBar class="flex-grow-1" v-model="filters" />

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
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import useVuelidate from '@vuelidate/core'
import { cloneDeep, sum } from 'lodash'
import { useLocalStorage } from '@vueuse/core'
import { mdiClockOutline } from '@mdi/js'

import { useUpsertDataDb } from '@/composables/db/useUpsertDataDb'
import { useUpdateProductsQtyDb } from '@/composables/db/products/useUpdateProductsQtyDb'
import { useProductsQuery } from '@/composables/db/products/useGetProductsDb'
import { useOrdersQuery, type OrderData } from '@/composables/db/orders/useGetOrdersDb'

import { processStockMovementsForOrder } from '@/composables/useStockManage'
import { useOrdersFilters } from './OrdersView/composables/useOrdersFilters'

import self from '@/composables/localStore/useSelf'

import CreateOrderlines from './OrdersView/CreateOrderStepper/CreateOrderlines.vue'
import CreateOrderStepper from './OrdersView/CreateOrderStepper.vue'
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import FilterBar from './OrdersView/FilterBar.vue'
import OrdersTable from './OrdersView/OrdersTable.vue'

import {
  clientForm,
  consumerPicked,
  form,
  individualForm,
  orderlinesForm,
  paymentForm,
  resetOrderForm,
  type RequiredFields
} from './OrdersView/CreateOrderStepper/state'

import { OrderStatus } from '@/models/models'
import type { Tables, TablesInsert } from '@/types/database.types'

const $v = useVuelidate()
const savedSales = useLocalStorage('savedSales', [] as any[])

const upsertOrdersDb = useUpsertDataDb<Tables<'orders'>>('orders')
const upsertOrderlinesDb = useUpsertDataDb<Tables<'order_lines'>>('order_lines')
const upsertPaymentsDb = useUpsertDataDb<Tables<'payments'>>('payments')
const upsertStockMovementsDb = useUpsertDataDb<Tables<'stock_movements'>>('stock_movements')
const updateProductsQtyDb = useUpdateProductsQtyDb()
const upsertNotificationsDb = useUpsertDataDb<Tables<'notifications'>>('notifications')

const { q: productsQuery } = useProductsQuery()
const { q: ordersQuery, isReady, params } = useOrdersQuery()
isReady.value = true
const { filters, startDate, endDate } = useOrdersFilters()

watchEffect(() => {
  params.date_gte = startDate.value
  params.date_lte = endDate.value
  params.doc_type = filters.docType
  params.status = filters.status
})

const lastBarcode = ref('')
const showScanner = ref(false)
const clientDialog = ref(false)
const buffer = ref('')

const orders = computed(() => (ordersQuery.rows.value || []) as OrderData[])
const products = computed(() => productsQuery.rows.value || [])
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
const toPay = computed(() => Math.max(0, form.total_price - Number(paymentForm.amount || 0)))

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
  const order = {
    ...form,
    individual: individualForm.value,
    client: clientForm.value,
    order_lines: orderlinesForm.value,
    _synced: false
  }
  savedSales.value.push(order)
  resetOrderForm()
}

function restoreSale(i: number) {
  const { individual, client, order_lines, ...sale } = savedSales.value[i]
  if (sale) {
    if (individual) {
      individualForm.value = { ...individual }
    }
    if (client) {
      clientForm.value = { ...client }
    }
    if (order_lines) {
      orderlinesForm.value = cloneDeep(order_lines)
    }
    Object.assign(form, sale)

    savedSales.value.splice(i, 1)
  }
}

function submitSale() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    if (form.type === 'sale') {
      form.status = OrderStatus.Confirmed
    } else if (form.type === 'order') {
      form.status = OrderStatus.Pending
    }

    upsertOrdersDb.execute([{ ...form, _synced: false }])
  }
}

function handleReset() {
  resetOrderForm()
  $v.value.$reset()
}

function resetClient() {
  form.individual_id = null
  form.client_id = null
}

function insertPayment(payment: TablesInsert<'payments'>) {
  upsertPaymentsDb.execute([
    {
      ...payment,
      _synced: false
    }
  ])
}

function updateProductQuantities(ids: string[]) {
  updateProductsQtyDb.stockMovementsIds.value = ids
  updateProductsQtyDb.execute()
}

function insertNotification(title: string, body: string) {
  upsertNotificationsDb.execute([
    {
      title,
      body,
      org_id: '',
      url: `/order/${upsertOrdersDb.data.value?.[0].id}`,
      _synced: false
    }
  ])
}

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

upsertOrdersDb.onSuccess((data) => {
  const order = data[0]
  const order_id = order?.id
  if (order_id) {
    upsertOrderlinesDb.execute(
      orderlinesForm.value?.map((o) => ({
        ...o,
        order_id,
        _synced: false
      }))
    )

    if (paymentForm.amount > 0) {
      insertPayment({ ...paymentForm, order_id })
    }

    resetOrderForm()
    $v.value.$reset()
  }
})

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
      upsertStockMovementsDb.execute(
        stockMovements.map((s) => ({
          ...s,
          _synced: false // Add the synced property
        }))
      )
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

watchEffect(() => {
  form.total_price = sum(orderlinesForm.value?.map((e) => e.total_price)) - (form.reduction || 0)

  if (paymentForm.amount && paymentForm.amount > 0) {
    form.paid_price = paymentForm.amount
  }
})
</script>
