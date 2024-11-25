<template>
  <div class="pa-0">
    <OrderLineForm
      v-for="(_, i) in orderlinesForm"
      :key="i"
      v-model="orderlinesForm[i]"
      :is-new="i == 0"
      :products="products"
      :availableProducts="availableProducts"
      @delete="deleteOrderline"
    />

    <v-btn
      class="mt-6"
      size="small"
      block
      variant="text"
      :text="$t('add')"
      :append-icon="mdiPlus"
      @click="addEmptyOrderline"
    />
  </div>
  <slot name="actions" :v="$v"></slot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import { mdiPlus } from '@mdi/js'

import OrderLineForm from '@/views/OrdersView/OrderLineForm.vue'

import { useGetProductsApi } from '@/composables/api/products/useGetProductsApi'

import type { OrderLine } from '@/models/models'

import { orderlinesForm } from './state'

const $v = useVuelidate()

const getProductsApi = useGetProductsApi()

const products = computed(() => getProductsApi.data.value || [])

const availableProducts = computed(() =>
  products.value.filter((e) => {
    const alreadySelected = orderlinesForm.value.map((ol) => ol.product_id)
    return !alreadySelected.includes(e.id)
  })
)

function addEmptyOrderline() {
  orderlinesForm.value.push({
    product_id: '',
    qte: 0,
    unit_price: 0,
    total_price: 0,
    order_id: '',
    unit_cost_price: null
  })
}
addEmptyOrderline()

function deleteOrderline(orderLine: OrderLine) {
  const index = orderlinesForm.value.indexOf(orderLine)
  orderlinesForm.value.splice(index, 1)
}
</script>
