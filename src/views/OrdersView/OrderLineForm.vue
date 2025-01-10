<template>
  <v-row align="end" no-gutters>
    <v-col cols="4">
      <v-select
        class="mr-3"
        :label="$t('product')"
        variant="underlined"
        inset
        :error="!$v.product_id.$pending && $v.product_id.$error"
        :items="availableProducts"
        item-value="id"
        item-title="name"
        v-model="model.product_id"
        hide-no-data
        hide-details
      >
        <template v-slot:selection>
          <span>{{ selectedProduct?.name }}</span>
        </template>
      </v-select>
    </v-col>
    <v-col class="mr-3">
      <v-number-input
        :label="$t('quantity')"
        variant="underlined"
        inset
        :disabled="!model.product_id"
        hide-details
        control-variant="stacked"
        :error="!$v.qte.$pending && $v.qte.$error"
        :suffix="`/${selectedProduct?.qty ?? 0}`"
        :max="selectedProduct?.qty ?? undefined"
        :min="0"
        v-model="model.qte"
      />
    </v-col>
    <v-col class="mr-3">
      <v-number-input
        :label="$t('U.P')"
        variant="underlined"
        inset
        :disabled="!model.qte"
        hide-details
        control-variant="stacked"
        :error="!$v.unit_price.$pending && $v.unit_price.$error"
        :min="0"
        v-model="model.unit_price"
      />
    </v-col>
    <v-col cols="1">
      <v-btn
        v-if="!isNew"
        color="medium-emphasis"
        variant="text"
        :icon="mdiDelete"
        size="small"
        @click="emits('delete', model)"
      />
    </v-col>
  </v-row>
  <slot name="actions" :form="model" :v="$v"></slot>
</template>

<script setup lang="ts">
import { watchEffect, watch, computed, toRef } from 'vue'
import useVuelidate from '@vuelidate/core'
import { minValue, numeric, required } from '@vuelidate/validators'
import { mdiDelete } from '@mdi/js'

import self from '@/composables/localStore/useSelf'

import type { TablesInsert } from '@/types/database.types'
import type { ProductData } from '@/composables/db/products/useGetProductsDb'

const model = defineModel<TablesInsert<'order_lines'>>({
  default: {
    order_id: '',
    product_id: '',
    qte: 0,
    org_id: self.value.current_org?.id || '',
    unit_price: 0,
    total_price: 0,
    unit_cost_price: null as number | null // Optional property
  }
})

const props = defineProps<{
  availableProducts?: ProductData[]
  products: ProductData[]
  isNew: boolean
}>()
const emits = defineEmits(['add', 'delete'])

const orderLineRules = {
  product_id: { required },
  qte: { required, numeric, minValue: minValue(1) },
  unit_price: { required, numeric, minValue: minValue(1) },
  total_price: { required, numeric, minValue: minValue(1) },
  unit_cost_price: {
    numeric,
    minValue: minValue(1)
  }
}

const $v = useVuelidate<TablesInsert<'order_lines'>>(
  orderLineRules,
  toRef(() => model.value)
)

const selectedProduct = computed(() => props.products.find((e) => e.id === model.value.product_id))

watchEffect(() => {
  if (model.value.qte && model.value.unit_price) {
    model.value.total_price = model.value.unit_price * model.value?.qte
  }
})

watch(selectedProduct, (newProduct) => {
  if (newProduct) {
    model.value.unit_price = newProduct.price || 0
    model.value.unit_cost_price = newProduct.cost_price
  }
})
</script>
