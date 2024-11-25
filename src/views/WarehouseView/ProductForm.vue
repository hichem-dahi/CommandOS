<template>
  <v-card class="pa-4">
    <!-- Left column for form fields -->
    <v-text-field
      :label="$t('code')"
      v-model="model.code"
      :error-messages="!$v.code.$pending && $v.code.$error ? $t('Code is required') : ''"
      @blur="$v.code.$touch()"
    />
    <v-text-field
      :label="$t('name')"
      v-model="model.name"
      :error-messages="!$v.name.$pending && $v.name.$error ? $t('Name is required') : ''"
      @blur="$v.name.$touch()"
    />
    <v-text-field
      :label="$t('quantity')"
      v-model="model.qte"
      type="number"
      :error-messages="
        !$v.qte.$pending && $v.qte.$error ? $t('Quantity must be greater than zero') : ''
      "
      @blur="$v.qte.$touch()"
    />
    <v-text-field
      :label="$t('price')"
      v-model="model.price"
      type="number"
      :error-messages="
        !$v.price.$pending && $v.price.$error ? $t('Price must be greater than zero') : ''
      "
      @blur="$v.price.$touch()"
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
    />

    <div class="d-flex align-start">
      <v-text-field
        hide-details
        :label="$t('bar-code')"
        v-model.trim="model.bar_code"
        :prepend-icon="mdiBarcodeScan"
        :append-inner-icon="mdiRefresh"
        :append-icon="mdiEye"
        @click:append-inner="model.bar_code = generateRandomNumber(10)"
        @click:prepend="showScanner = true"
        @click:append="showBarcode = true"
      />
    </div>
    <BarcodeScannerModal v-model:dialog="showScanner" v-model:barcode="model.bar_code" />
    <BarcodeViewModal
      v-model:dialog="showBarcode"
      v-model:barcode="model.bar_code"
      :product="model"
    />
    <v-card-actions class="pa-4">
      <slot name="actions" :form="model"></slot>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import useVuelidate from '@vuelidate/core'
import { required, minValue, numeric } from '@vuelidate/validators'
import { mdiBarcodeScan, mdiEye, mdiRefresh } from '@mdi/js'

import BarcodeViewModal from './modals/BarcodeViewModal.vue'

import self from '@/composables/localStore/useSelf'

import BarcodeScannerModal from './modals/BarcodeScannerModal.vue'

const showScanner = ref(false)
const showBarcode = ref(false)

const model = defineModel({
  default: {
    code: '',
    name: '',
    org_id: '',
    qte: 0,
    price: 0,
    cost_price: null as number | null,
    bar_code: null as number | null
  }
})

const rules = {
  code: { required },
  name: { required },
  qte: { required, numeric, minValue: minValue(1) },
  price: { required, numeric, minValue: minValue(1) },
  cost_price: { numeric, minValue: minValue(1) }
}

const $v = useVuelidate(
  rules,
  toRef(() => model.value)
)

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
