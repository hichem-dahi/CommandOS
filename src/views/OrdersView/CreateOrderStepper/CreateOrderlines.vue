<template>
  <div class="pa-0">
    <template v-for="(_, i) in orderlinesForm" :key="i">
      <OrderLineForm
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
import { useLiveQuery } from '@electric-sql/pglite-vue'

import self from '@/composables/localStore/useSelf'

import OrderLineForm from '@/views/OrdersView/OrderLineForm.vue'

import type { OrderLine, Product } from '@/models/models'
import type { Tables } from '@/types/database.types'

import { orderlinesForm } from './state'

const $v = useVuelidate()

const productsQuery = useLiveQuery<Tables<'products'>>(
  'SELECT * FROM public.products WHERE org_id = $1;',
  [self.value.current_org?.id]
)

const products = computed(() => (productsQuery?.rows.value || []) as unknown as Product[])

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
    unit_cost_price: null
  })
}

function deleteOrderline(orderLine: OrderLine) {
  const index = orderlinesForm.value?.indexOf(orderLine) || 0
  orderlinesForm.value?.splice(index, 1)
}
</script>
