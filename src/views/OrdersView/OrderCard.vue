<template>
  <v-card
    v-if="order"
    color="grey-lighten-5"
    class="pa-4"
    hover
    variant="elevated"
    :to="{ name: 'order', params: { order_id: order.id } }"
  >
    <template v-slot:title> {{ $t('order') }} {{ $t('N°') }} {{ order.index }} </template>

    <template v-slot:text>
      <div class="order-info py-0">
        <div v-if="consumerName">
          <span class="font-weight-bold">{{ $t('client') }}:</span>
          <span>&nbsp;{{ consumerName }}</span>
        </div>
        <div>
          <span class="font-weight-bold">{{ $t('date') }}:</span>
          <span>&nbsp;{{ format(order.date, 'yyyy-MM-dd') }}</span>
        </div>
        <div>
          <span class="font-weight-bold">{{ $t('total') }}:</span>
          <span>&nbsp;{{ order.total_price }} {{ $t('DA') }}</span>
        </div>
        <div>
          <span class="font-weight-bold">{{ $t('remaining') }}:</span>
          <span class="text-red">
            &nbsp;{{ order.total_price - order.paid_price }} {{ $t('DA') }}
          </span>
        </div>
      </div>
    </template>
    <v-card-actions v-if="docTitle" class="py-0">
      <v-spacer></v-spacer>
      <v-btn variant="text" size="x-small">
        {{ docTitle }}
      </v-btn>
    </v-card-actions>
    <template v-if="order.status !== OrderStatus.Pending" v-slot:append>
      <v-chip v-if="isConfirmed" variant="tonal" color="green">{{ $t('confirmed') }}</v-chip>
      <v-chip v-else-if="isCancelled" variant="tonal" color="red">{{ $t('cancelled') }}</v-chip>
    </template>
    <template v-else v-slot:append>
      <v-menu>
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
      :isLoading="deleteOrdersDb.isLoading.value"
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
import { mdiDotsVertical } from '@mdi/js'

import { useDeleteOrdersDb } from '@/composables/db/orders/useDeleteOrderDb'

import DeleteItemModal from '@/views/OrderView/DeleteItemModal.vue'

import { DocumentType, OrderStatus } from '@/models/models'
import { type OrderData } from '@/composables/db/orders/useGetOrdersDb'

const props = defineProps<{
  order: OrderData
}>()

const { t } = useI18n()

const deleteOrdersDb = useDeleteOrdersDb()

const deleteDialog = ref(false)

const docTitle = computed(() =>
  props.order.doc_index
    ? `${t(kebabCase(DocumentType[props.order.document_type]))} ${t('N°')} ${props.order.doc_index}`
    : null
)

const consumerName = computed(() => props.order.client?.name || props.order.individual?.name)

const isConfirmed = computed(() => props.order?.status === OrderStatus.Confirmed)
const isCancelled = computed(() => props.order?.status === OrderStatus.Cancelled)

function deleteOrder() {
  deleteOrdersDb.ids.value = [props.order.id]
  deleteOrdersDb.execute()
}

watch(
  () => deleteOrdersDb.isSuccess.value,
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
</style>
