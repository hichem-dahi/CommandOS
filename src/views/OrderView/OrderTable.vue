<!-- eslint-disable vue/valid-v-slot -->
<template>
  <v-data-table
    v-if="order"
    :items="items"
    :headers="headers"
    style="background-color: #fefefe"
    hide-default-footer
  >
    <template v-slot:top>
      <v-card class="pb-2 d-flex align-center" color="#F7F7F7" elevation="0">
        <div class="col-1 d-flex justify-space-between w-75">
          <v-card-title>
            <div class="text-medium-emphasis text-subtitle-2">
              <div>{{ consumerName }}</div>
            </div>
            <div class="text-medium-emphasis text-subtitle-2">
              {{ format(order.date, 'yyyy-MM-dd') }}
            </div>
          </v-card-title>
        </div>
        <v-divider class="mx-4" inset vertical />
        <div class="col-2">
          <v-dialog v-if="isPending" v-model="newlineDialog" max-width="400">
            <template v-slot:activator="{ props }">
              <v-btn
                variant="text"
                size="small"
                :append-icon="mdiPlus"
                color="primary"
                :disabled="!availableProducts.length"
                v-bind="props"
              >
                New product
              </v-btn>
            </template>
            <v-card class="pa-4 pb-0">
              <v-card-title>{{ $t('add-product') }}</v-card-title>
              <v-card-text>
                <OrderLineForm
                  v-model="newOrderline"
                  :is-new="true"
                  :availableProducts="availableProducts"
                  :products="products"
                >
                  <template v-slot:actions="{ form, v }">
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        variant="text"
                        size="small"
                        color="blue"
                        @click="addOrderline(form, v)"
                      >
                        {{ $t('add') }}
                      </v-btn>
                    </v-card-actions>
                  </template>
                </OrderLineForm>
              </v-card-text>
            </v-card>
          </v-dialog>
          <div>
            <v-chip v-if="isConfirmed" variant="tonal" color="green">{{ $t('confirmed') }}</v-chip>
            <v-chip v-else-if="isCancelled" variant="tonal" color="red">
              {{ $t('cancelled') }}
            </v-chip>
          </div>
        </div>
      </v-card>
    </template>
    <template v-if="isPending" v-slot:item.qte="{ item }">
      <v-number-input
        v-if="isNumber(proxyOrderlines?.[item.index]?.qte)"
        class="number-input"
        type="number"
        width="150"
        hide-details
        inset
        variant="outlined"
        density="compact"
        :min="0"
        :suffix="`/${item.product?.qty}`"
        :error="proxyOrderlines[item.index].qte! > item.product?.qty!"
        counter="50"
        v-model="proxyOrderlines[item.index].qte"
      />
    </template>
    <template v-if="isPending" v-slot:item.actions="{ item }">
      <v-btn
        color="medium-emphasis"
        variant="text"
        size="small"
        :icon="mdiDelete"
        @click="deleteItem(item)"
      />
      <DeleteItemModal v-model="deleteDialog" @close="closeDelete" @confirm="deleteItemConfirm" />
    </template>
  </v-data-table>
  <v-card class="pa-4 pb-2" elevation="0">
    <div class="total-info d-flex justify-end">
      <div class="info">
        <div v-for="(value, key) in totalItems" :key="key">
          <div>
            <span class="font-weight-medium"> {{ $t(key) }}:&nbsp; </span>
            <span :class="{ 'text-red': key === 'remaining' }">{{ value }} DA</span>
          </div>
        </div>
      </div>
    </div>
    <v-card-actions v-if="isPending" class="justify-end mt-6">
      <v-btn :disabled="!isModified" variant="text" size="small" @click="cancelEdit">
        {{ $t('cancel') }}
      </v-btn>
      <v-btn
        :disabled="!isModfiable"
        :loading="isLoading"
        variant="text"
        color="blue"
        size="small"
        @click="confirmEdit"
      >
        {{ $t('save') }}
      </v-btn>
    </v-card-actions>
  </v-card>
  <v-snackbar
    v-model="isSuccess"
    :timeout="2000"
    color="success"
    text="Order was modified succesfully."
  />
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { cloneDeep, isEqual, isNumber, sum } from 'lodash'
import { mdiDelete, mdiPlus } from '@mdi/js'

import { useUpsertOrderlinesDb } from '@/composables/db/orderlines/useUpsertOrderlinesDb'
import { useUpsertOrdersDb } from '@/composables/db/orders/useUpsertOrdersDb'
import { useSoftDeleteOrderlinesDb } from '@/composables/db/orderlines/useSoftDeleteOrderlinesDb'
import { useProductQuery } from '@/composables/db/products/useGetProductsDb'

import self from '@/composables/localStore/useSelf'

import OrderLineForm from '@/views/OrdersView/OrderLineForm.vue'
import DeleteItemModal from './DeleteItemModal.vue'

import { ConsumerType, OrderStatus } from '@/models/models'
import type { Validation } from '@vuelidate/core'
import type { Tables, TablesInsert } from '@/types/database.types'
import type { OrderData, OrderlineData } from '@/composables/db/orders/useGetOrdersDb'

const { t } = useI18n()

const props = defineProps<{ order: OrderData }>()

const { q: productsQuery } = useProductQuery()

const softDeleteOrderlinesDb = useSoftDeleteOrderlinesDb()
const upsertOrderlinesDb = useUpsertOrderlinesDb()
const upsertOrderDb = useUpsertOrdersDb()

const newlineDialog = ref(false)
const deleteDialog = ref(false)
const isSuccess = ref(false)
const proxyOrder = ref(cloneDeep(props.order))
const proxyOrderlines = ref(proxyOrder.value.order_lines || [])
const selectedOrderlineIndex = ref<number>()
const newOrderline = ref({
  product_id: '',
  order_id: '',
  org_id: self.value.current_org?.id || '',
  qte: 0,
  unit_price: 0,
  total_price: 0,
  unit_cost_price: null
})

const headers = computed(
  () =>
    [
      {
        title: t('product'),
        align: 'start',
        sortable: false,
        key: 'product_name'
      },
      { title: t('quantity'), key: 'qte', align: 'start' },
      { title: t('U.P'), key: 'unit_price' },
      { title: t('C.P'), key: 'unit_cost_price' },
      { title: t('total'), key: 'total_price' },
      { title: '', key: 'actions' }
    ] as any
)

const isLoading = computed(
  () => softDeleteOrderlinesDb.isLoading.value || upsertOrderlinesDb.isLoading.value
)

const isModified = computed(() => {
  const filteredOrderlines = (orderlines: OrderlineData[]) =>
    orderlines.map(({ product_id, qte, unit_cost_price }) => ({
      product_id,
      qte,
      unit_cost_price
    }))

  return !isEqual(
    filteredOrderlines(props.order.order_lines || []),
    filteredOrderlines(proxyOrderlines.value || [])
  )
})

const isModfiable = computed(() => isModified.value && isValidOrderlines.value)

const isValidOrderlines = computed(() =>
  proxyOrderlines.value?.every((o) => o.product !== null && o.qte <= (o.product.qty || 0))
)

const consumerName = computed(() => props.order.client?.name || props.order.individual?.name)

const consumerType = computed(() =>
  props.order?.client_id ? ConsumerType.Organization : ConsumerType.Individual
)

const isConfirmed = computed(() => props.order.status === OrderStatus.Confirmed)
const isCancelled = computed(() => props.order.status === OrderStatus.Cancelled)
const isPending = computed(() => props.order.status === OrderStatus.Pending)

const isConfirmable = computed(() => !isModified.value && isValidOrderlines.value)

const totalItems = computed(() => {
  return {
    remaining: (props.order.total_price || 0) - (props.order.paid_price || 0),
    total: props.order.total_price
  }
})

const items = computed(
  () =>
    proxyOrderlines.value?.map((o, i) => {
      const product = o.product
      return {
        index: i,
        product: product,
        product_name: product?.name,
        qte: o.qte,
        unit_price: o.unit_price,
        unit_cost_price: o.unit_cost_price,
        total_price: o.total_price
      }
    }) || []
)

const products = computed(
  () => (productsQuery.rows?.value || []) as unknown as Tables<'products'>[]
)

const availableProducts = computed(() =>
  products.value.filter((e) => {
    const alreadySelected = proxyOrderlines.value?.map((ol) => ol.product_id)
    return !alreadySelected?.includes(e.id)
  })
)

const deleteItem = (item: (typeof items.value)[0]) => {
  selectedOrderlineIndex.value = item.index
  deleteDialog.value = true
}

const deleteItemConfirm = () => {
  if (isNumber(selectedOrderlineIndex.value)) {
    proxyOrderlines.value?.splice(selectedOrderlineIndex.value, 1)
    closeDelete()
  }
}

const closeDelete = () => {
  selectedOrderlineIndex.value = undefined
  deleteDialog.value = false
}

function addOrderline(form: TablesInsert<'order_lines'>, v: Validation) {
  v.$touch()
  if (!v.$invalid) {
    const product = products.value.find((p) => p.id === form.product_id)
    if (!product) return
    proxyOrderlines.value?.push({ ...form, product } as OrderlineData)
    newlineDialog.value = false
  }
}

function cancelEdit() {
  proxyOrderlines.value = cloneDeep(props.order.order_lines || [])
}

function confirmEdit() {
  softDeleteOrderlinesDb.ids.value = (props.order.order_lines || []).map((ol) => ol.id)
  softDeleteOrderlinesDb.execute()
}

watch(
  () => softDeleteOrderlinesDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      upsertOrderlinesDb.form.value = proxyOrderlines.value?.map(({ product, ...rest }) => {
        rest.order_id = props.order.id
        return { ...rest, _synced: false, _deleted: false }
      })
      upsertOrderlinesDb.execute()
    }
  }
)

watch(
  () => upsertOrderlinesDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && upsertOrderlinesDb.data.value) {
      const total_price = sum(upsertOrderlinesDb.data.value.map((o) => Number(o.total_price)))

      if (props.order)
        upsertOrderDb.form.value = [
          {
            ...props.order,
            total_price,
            tva: total_price * 0.19,
            ttc: total_price * 1.19,
            _synced: false
          }
        ]
      upsertOrderDb.execute()
    }
  }
)

watch(
  proxyOrderlines,
  (orderLines) => {
    if (!proxyOrder.value || !orderLines) return
    proxyOrder.value.total_price = sum(
      orderLines.map((e) => {
        e.total_price = Number(e.qte) * Number(e.unit_price)
        return e.total_price
      })
    )
  },
  {
    deep: true
  }
)

defineExpose({
  isConfirmable
})
</script>

<style>
.number-input {
  max-width: 70px;
  min-width: 50px;
  .v-field__append-inner {
    display: none;
  }
}

.total-info {
  text-transform: cDbtalize;
  font-size: 0.85rem;
  padding: 0 1rem;
}
</style>
