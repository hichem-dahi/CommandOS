<template>
  <v-container fluid class="pt-4">
    <v-row class="align-center">
      <v-col cols="12" class="d-flex align-center">
        <v-btn
          size="small"
          color="grey"
          variant="text"
          :prepend-icon="mdiChevronLeft"
          @click="$router.go(-1)"
          :text="$t('back')"
        />
      </v-col>
    </v-row>
    <div class="text-h5 font-weight-medium ml-2 py-4">{{ title }}</div>

    <v-row v-if="order" class="g-4">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text class="pa-0">
            <OrderTable ref="orderTableRef" :order="order" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="sticky-actions">
          <v-card-text class="d-flex flex-column ga-2">
            <v-btn
              :prepend-icon="mdiCheck"
              :loading="upsertStockMovementsDb.isLoading.value"
              :disabled="!isConfirmable"
              @click="confirmDialog = true"
            >
              {{ $t('confirm') }}
            </v-btn>

            <v-btn
              variant="text"
              :prepend-icon="mdiCashSync"
              :disabled="isCancelled"
              @click="paymentDialog = true"
            >
              {{ $t('payments') }}
            </v-btn>

            <DocumentButtons
              v-if="order"
              :order="order"
              :disabled="!isConfirmed"
              @go-doc-page="goDocPage"
            />

            <v-btn
              v-if="order?.status === OrderStatus.Confirmed"
              variant="text"
              :prepend-icon="mdiCancel"
              @click="cancelDialog = true"
              :text="$t('cancel')"
            />

            <v-divider class="my-2" />

            <PaymentsCard v-if="order.payments?.length" :order="order" :payments="order.payments" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <PaymentModal
      v-if="order"
      :order="order"
      v-model:dialog="paymentDialog"
      :is-loading="upsertPaymentDb.isLoading.value"
      @confirm="addPayment"
    />
    <ConfirmModal
      v-if="order"
      v-model="confirmDialog"
      :is-loading="upsertOrdersDb.isLoading.value"
      @confirm="processOrder"
    />
    <CancelModal
      v-if="order"
      v-model="cancelDialog"
      :is-loading="upsertOrdersDb.isLoading.value"
      @confirm="upsertStockMovements('restore')"
    />
  </v-container>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiCashSync, mdiChevronLeft, mdiCancel, mdiCheck } from '@mdi/js'

import { useUpsertOrdersDb } from '@/composables/db/orders/useUpsertOrdersDb'
import { useUpsertPaymentsDb } from '@/composables/db/payments/useUpsertPaymentsDb'
import { useUpsertStockMovementsDb } from '@/composables/db/stockMovements/useUpsertStockMovementsDb'
import { useUpsertNotificationsDb } from '@/composables/db/notifications/useUpsertNotificationsDb'
import { useUpdateProductsQtyDb } from '@/composables/db/products/useUpdateProductsQtyDb'
import { processStockMovementsForOrder } from '@/composables/useStockManage'

import { useOrdersQuery, type OrderData } from '@/composables/db/orders/useGetOrdersDb'

import self from '@/composables/localStore/useSelf'

import OrderTable from './OrderView/OrderTable.vue'
import PaymentModal from './OrderView/PaymentModal.vue'
import ConfirmModal from './OrderView/ConfirmModal.vue'
import CancelModal from './OrdersView/CancelModal.vue'
import PaymentsCard from './OrderView/PaymentsCard.vue'
import DocumentButtons from './OrderView/DocumentButtons.vue'

import { DocumentType, OrderStatus } from '@/models/models'
import type { TablesInsert } from '@/types/database.types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const { q, params, isReady } = useOrdersQuery()

params.order_id = route.params.order_id as string
isReady.value = true

const order = computed(() => q.rows.value?.[0] as unknown as OrderData | undefined)

const upsertOrdersDb = useUpsertOrdersDb()
const upsertStockMovementsDb = useUpsertStockMovementsDb()
const upsertPaymentDb = useUpsertPaymentsDb()
const updateProductsQtyDb = useUpdateProductsQtyDb()
const upsertNotificationsDb = useUpsertNotificationsDb()

const paymentDialog = ref(false)
const confirmDialog = ref(false)
const cancelDialog = ref(false)

const orderTableRef = ref<InstanceType<typeof OrderTable>>()

const title = computed(() => {
  if (order.value?.document_type == DocumentType.Proforma) {
    return t('preforma')
  } else {
    return `${t(order.value?.type || '')} ${t('N°')} ${order.value?.index}`
  }
})

const isConfirmable = computed(
  () =>
    (orderTableRef.value?.isConfirmable && order.value?.status !== OrderStatus.Confirmed) || false
)

const isConfirmed = computed(() => order.value?.status === OrderStatus.Confirmed)

const isCancelled = computed(() => order.value?.status === OrderStatus.Cancelled)
const isPending = computed(() => order.value?.status === OrderStatus.Pending)

function processOrder() {
  if (isPending.value && !confirmDialog.value) {
    confirmDialog.value = true
    return
  }
  if (isPending.value) {
    upsertStockMovements('deduct')
    return
  }
}

function goDocPage() {
  const routeName = getRouteNameByDocumentType(order.value!.document_type)
  if (routeName) {
    router.push({
      name: routeName,
      params: { order_id: order.value?.id },
      query: { type: order.value!.document_type }
    })
  }
}

function getRouteNameByDocumentType(documentType: DocumentType) {
  switch (documentType) {
    case DocumentType.Proforma:
      return 'preforma'
    case DocumentType.Invoice:
      return 'invoice'
    case DocumentType.Voucher:
      return 'voucher'
    case DocumentType.DeliveryNote:
      return order.value?.client_id ? 'invoice' : 'voucher'
    default:
      return null
  }
}

function upsertStockMovements(operation: 'deduct' | 'restore') {
  if (order.value?.order_lines) {
    const data = {
      order_lines: order.value?.order_lines,
      id: order.value?.id
    }
    const stockMovements = processStockMovementsForOrder(data, operation)
    upsertStockMovementsDb.form.value = stockMovements.map((s) => ({
      ...s,
      _synced: false // Add the synced property
    }))
    upsertStockMovementsDb.execute()
  }
}

function addPayment(payment: TablesInsert<'payments'>) {
  const org_id = self.value.current_org?.id || ''

  upsertPaymentDb.form.value = [{ ...payment, org_id, _synced: false }]
  upsertPaymentDb.execute()
}

function updateProductQuantities(ids: string[]) {
  updateProductsQtyDb.stockMovementsIds.value = ids
  updateProductsQtyDb.execute()
}

function updateOrderStatus(moveType: 'add' | 'sub') {
  const orderStatus = moveType === 'sub' ? OrderStatus.Confirmed : OrderStatus.Cancelled
  upsertOrdersDb.form.value = [{ ...order.value!, status: orderStatus, _synced: false }]
  upsertOrdersDb.execute()
}

function insertNotification(title: string, body: string) {
  const org_id = self.value.current_org?.id || ''
  upsertNotificationsDb.form.value = [
    {
      title,
      body,
      org_id,
      url: `/order/${order.value?.id}`,
      _synced: false
    }
  ]
  upsertNotificationsDb.execute()
}

watch(
  () => upsertStockMovementsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      const updates = upsertStockMovementsDb.data.value.map((s) => s.id)
      const moveType = upsertStockMovementsDb.data.value[0].qte_change > 0 ? 'add' : 'sub'

      updateProductQuantities(updates)
      updateOrderStatus(moveType)
    }
  }
)

watch(
  [() => upsertOrdersDb.isSuccess.value, () => updateProductsQtyDb.isSuccess.value],
  ([isSuccess1, isSuccess2]) => {
    if (!isSuccess1 || !isSuccess2) return

    const data = upsertOrdersDb.data.value?.[0]

    const status = data?.status
    const body =
      order.value?.order_lines
        ?.map((line) => {
          const product = line.product
          return product ? `${line.qte} ${product.name}` : `${line.qte} Unknown Product`
        })
        .join(', ') + ` — ${order.value?.total_price} DA`
    const title = status === OrderStatus.Confirmed ? 'Vente réalisée' : 'Vente annulée'

    insertNotification(title, body)

    cancelDialog.value = false
    confirmDialog.value = false
  }
)

watch(
  () => upsertPaymentDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && upsertPaymentDb.data.value?.[0].amount && order.value) {
      upsertOrdersDb.form.value = [
        {
          ...order.value,
          paid_price:
            Number(order.value?.paid_price || 0) +
            Number(upsertPaymentDb.data.value?.[0].amount || 0),
          _synced: false
        }
      ]
      upsertOrdersDb.execute()
      paymentDialog.value = false
    }
  }
)

watch(
  () => upsertNotificationsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      const data = upsertOrdersDb.data.value?.[0]
      const status = data?.status
      if (status === OrderStatus.Confirmed) {
        confirmDialog.value = false
      }
    }
  }
)
</script>
<style>
.sticky-actions {
  position: sticky;
  top: 16px;
}
</style>
