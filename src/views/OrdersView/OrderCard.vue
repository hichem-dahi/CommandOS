<template>
  <v-card
    v-if="order"
    class="pa-4 order-card"
    hover
    variant="elevated"
    :to="{ name: 'order', params: { order_id: order.id } }"
  >
    <template v-slot:title> {{ $t(order.type) }} {{ $t('N°') }} {{ order.index }} </template>

    <template v-slot:subtitle>
      <div class="d-flex align-center ga-3 text-caption">
        <div v-if="consumerName" class="d-flex align-center ga-1">
          <v-icon size="16" :icon="mdiAccount" />
          <span>{{ consumerName }}</span>
        </div>
        <div class="d-flex align-center ga-1">
          <v-icon size="16" :icon="mdiCalendar" />
          <span>{{ format(order.date, 'yyyy-MM-dd, p') }}</span>
        </div>
      </div>
    </template>

    <template v-slot:text>
      <div class="py-1">
        <v-row class="align-end">
          <v-col cols="12" sm="6" class="py-1">
            <div class="text-caption">{{ $t('total') }}</div>
            <div class="text-h6">{{ order.total_price }} {{ $t('DA') }}</div>
            <div class="text-caption mt-2">{{ $t('reduction') }}</div>
            <div>{{ order.reduction || 0 }} {{ $t('DA') }}</div>
          </v-col>
          <v-col cols="12" sm="6" class="py-1">
            <div class="text-caption">{{ $t('paid') }}</div>
            <div>{{ order.paid_price || 0 }} {{ $t('DA') }}</div>
            <div class="text-caption mt-2">{{ $t('remaining') }}</div>
            <div>{{ remainingAmount }} {{ $t('DA') }}</div>
          </v-col>
        </v-row>
      </div>
    </template>

    <v-card-actions v-if="docTitle" class="py-0">
      <v-spacer></v-spacer>
      <v-btn variant="text" color="primary" size="x-small" :prepend-icon="mdiFileDocument">
        {{ docTitle }}
      </v-btn>
    </v-card-actions>
    <template v-slot:append>
      <v-chip v-if="isConfirmed" variant="tonal" color="primary">{{ $t('confirmed') }}</v-chip>
      <v-chip v-else-if="isCancelled" variant="tonal" color="grey">{{ $t('cancelled') }}</v-chip>
      <v-chip v-else-if="isPending" variant="tonal" color="secondary">{{
        $t('unconfirmed')
      }}</v-chip>
      <v-menu v-if="isPending">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            @click.prevent
            variant="text"
            size="small"
            :icon="mdiDotsVertical"
          />
        </template>
        <v-list density="compact">
          <v-list-item density="compact" @click="deleteDialog = true">
            <v-list-item-title>{{ $t('delete') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    <DeleteItemModal
      v-model="deleteDialog"
      :isLoading="softDeleteOrdersDb.isLoading.value"
      @confirm="deleteOrder"
      @close="deleteDialog = false"
    />
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { kebabCase } from 'lodash'

import { mdiDotsVertical, mdiAccount, mdiCalendar, mdiFileDocument } from '@mdi/js'

import { useSoftDeleteOrdersDb } from '@/composables/db/orders/useSoftDeleteOrdersDb'

import DeleteItemModal from '@/views/OrderView/DeleteItemModal.vue'

import { DocumentType, OrderStatus } from '@/models/models'
import { type OrderData } from '@/composables/db/orders/useGetOrdersDb'

const props = defineProps<{
  order: OrderData
}>()

const { t } = useI18n()

const softDeleteOrdersDb = useSoftDeleteOrdersDb()

const deleteDialog = ref(false)

const docTitle = computed(() =>
  props.order.doc_index
    ? `${t(kebabCase(DocumentType[props.order.document_type]))} ${t('N°')} ${props.order.doc_index}`
    : null
)

const consumerName = computed(() => props.order.client?.name || props.order.individual?.name)

const isConfirmed = computed(() => props.order?.status === OrderStatus.Confirmed)
const isCancelled = computed(() => props.order?.status === OrderStatus.Cancelled)
const isPending = computed(() => props.order?.status === OrderStatus.Pending)

const remainingAmount = computed(
  () => (props.order.total_price || 0) - (props.order.paid_price || 0)
)

const paidPercent = computed(() => {
  const total = Number(props.order.total_price || 0)
  const paid = Number(props.order.paid_price || 0)
  if (!total) return 0
  const ratio = (paid / total) * 100
  return Math.max(0, Math.min(100, Math.round(ratio)))
})

function deleteOrder() {
  softDeleteOrdersDb.ids.value = [props.order.id]
  softDeleteOrdersDb.execute()
}

watch(
  () => softDeleteOrdersDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      deleteDialog.value = false
    }
  }
)
</script>

<style>
.order-info {
  font-size: 0.8rem;
}
/* Subtle left border and hover elevation for blue/grey palette */
.order-card {
  border-left: 4px solid rgb(var(--v-theme-primary));
}
</style>
