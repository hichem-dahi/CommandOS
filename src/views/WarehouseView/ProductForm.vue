<template>
  <v-card class="pa-4">
    <!-- Left column for form fields -->
    <v-text-field
      :label="$t('code')"
      v-model="model.code"
      :error-messages="!$v.code.$pending && $v.code.$error ? $t('Code is required') : ''"
      @blur="$v.code.$touch()"
      density="compact"
    />
    <v-text-field
      :label="$t('name')"
      v-model="model.name"
      :error-messages="!$v.name.$pending && $v.name.$error ? $t('Name is required') : ''"
      @blur="$v.name.$touch()"
      density="compact"
    />
    <v-combobox
      :label="$t('category')"
      :items="categories"
      item-title="name"
      v-model="category"
      @update:model-value="(e) => handleCategoryChange(e)"
      density="comfortable"
    >
    </v-combobox>

    <v-text-field
      :label="$t('quantity')"
      v-model="model.init_qty"
      type="number"
      :error-messages="
        !$v.init_qty.$pending && $v.init_qty.$error ? $t('Quantity must be greater than zero') : ''
      "
      @blur="$v.init_qty.$touch()"
      density="compact"
    />
    <v-text-field
      :label="$t('sell-price')"
      v-model="model.price"
      type="number"
      :error-messages="
        !$v.price.$pending && $v.price.$error ? $t('Price must be greater than zero') : ''
      "
      @blur="$v.price.$touch()"
      density="compact"
    />
    <v-text-field
      :label="$t('cost-price')"
      v-model="model.cost_price"
      type="number"
      :error-messages="
        !$v.cost_price.$pending && $v.cost_price.$error
          ? $t('Cost price must be greater than zero')
          : ''
      "
      @blur="$v.cost_price.$touch()"
      density="compact"
    />

    <div class="d-flex align-start">
      <v-text-field
        hide-details
        :label="$t('barcode')"
        v-model.trim="model.bar_code"
        :prepend-icon="mdiBarcodeScan"
        :append-inner-icon="mdiRefresh"
        :append-icon="mdiEye"
        @click:append-inner="model.bar_code = generateRandomNumber(10)"
        @click:prepend="showScanner = true"
        @click:append="showBarcode = true"
        density="compact"
      />
    </div>
    <BarcodeScannerModal v-model:dialog="showScanner" v-model:barcode="model.bar_code" />
    <BarcodeViewModal
      v-model:dialog="showBarcode"
      v-model:barcode="model.bar_code"
      :product="model"
      density="compact"
    />
    <v-card-actions class="pa-4">
      <slot name="actions" :form="model"></slot>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watchEffect } from 'vue'
import useVuelidate from '@vuelidate/core'
import { required, minValue, numeric } from '@vuelidate/validators'
import { isString } from 'lodash'
import { mdiBarcodeScan, mdiEye, mdiRefresh } from '@mdi/js'

import { useGetProductsCategoriesDb } from '@/composables/db/products/useGetProductsCategoriesDb'

import BarcodeViewModal from './modals/BarcodeViewModal.vue'
import BarcodeScannerModal from './modals/BarcodeScannerModal.vue'

import type { TablesInsert } from '@/types/database.types'

const showScanner = ref(false)
const showBarcode = ref(false)

const { q: categoriesQuery } = useGetProductsCategoriesDb()

const categories = computed(
  () => (categoriesQuery.rows.value || []) as unknown as TablesInsert<'products_categories'>[]
)

const model = defineModel('product', {
  default: {
    code: '',
    name: '',
    org_id: '',
    category_id: '' as string | null,
    init_qty: 0,
    price: 0,
    cost_price: null as number | null,
    bar_code: null as number | null
  }
})

const category = defineModel<TablesInsert<'products_categories'>>('category')

watchEffect((stop) => {
  const existingCategory = categories.value.find((c) => c.id == model.value.category_id)
  if (existingCategory) {
    category.value = existingCategory
    stop(() => {})
  }
})

const rules = {
  code: { required },
  name: { required },
  init_qty: { required, numeric, minValue: minValue(1) },
  price: { required, numeric, minValue: minValue(1) },
  cost_price: { numeric, minValue: minValue(1) }
}

const $v = useVuelidate(
  rules,
  toRef(() => model.value)
)

function handleCategoryChange(item: string | TablesInsert<'products_categories'> | null) {
  if (isString(item)) {
    category.value = { name: item, org_id: '' }
  } else {
    category.value = item || undefined
  }
}

const generateRandomNumber = (length: number) => {
  let result = ''
  const characters = '0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}
</script>
<style scoped>
.barcode-svg {
  width: 100%; /* Make it responsive */
  max-width: 300px; /* Set a maximum width */
  height: auto; /* Maintain aspect ratio */
  image-rendering: crisp-edges; /* Ensure sharp rendering */
}
</style>
