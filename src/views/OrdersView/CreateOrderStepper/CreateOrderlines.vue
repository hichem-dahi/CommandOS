<template>
  <div class="pa-2">
    <template v-for="(_, i) in orderlinesForm" :key="i">
      <OrderlineForm
        class="my-4"
        v-if="orderlinesForm?.[i]"
        v-model="orderlinesForm[i]"
        :is-new="i == 0"
        :products="products"
        :availableProducts="availableProducts"
        @delete="deleteOrderline"
      />
    </template>
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

import self from '@/composables/localStore/useSelf'

import { useProductsQuery, type ProductData } from '@/composables/db/products/useGetProductsDb'

import OrderlineForm from '@/views/OrdersView/OrderlineForm.vue'

import { orderlinesForm } from './state'
import type { Tables } from '@/types/database.types'

const $v = useVuelidate()

const { q: productsQuery } = useProductsQuery()

const products = computed(() => (productsQuery?.rows.value || []) as unknown as ProductData[])

const availableProducts = computed(() =>
  products.value.filter((e) => {
    const alreadySelected = orderlinesForm.value?.map((ol) => ol.product_id)
    return !alreadySelected?.includes(e.id)
  })
)

function addEmptyOrderline() {
  orderlinesForm.value?.push({
    product_id: '',
    qte: 0,
    unit_price: 0,
    total_price: 0,
    order_id: '',
    org_id: self.value.current_org?.id || '',
    unit_cost_price: null
  })
}

function deleteOrderline(orderLine: Tables<'order_lines'>) {
  const index = orderlinesForm.value?.indexOf(orderLine) || 0
  orderlinesForm.value?.splice(index, 1)
}
</script>
