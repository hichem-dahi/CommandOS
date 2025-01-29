<template>
  <div class="filters d-flex flex-wrap align-end ga-6">
    <v-text-field
      variant="underlined"
      hide-details
      v-model="model.name"
      max-width="368"
      min-width="200"
      :placeholder="labels"
      clearable
    />
    <v-btn variant="text" size="small" :append-icon="mdiBarcodeScan" @click="showScanner = true">{{
      $t('scan')
    }}</v-btn>
    <BarcodeScannerModal v-model:barcode="model.barcode" v-model:dialog="showScanner" />

    <v-chip v-if="model.barcode" :value="!!model.barcode" closable @click:close="clearBarcode">
      {{ model.barcode }}
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiBarcodeScan } from '@mdi/js'

import BarcodeScannerModal from './modals/BarcodeScannerModal.vue'

const { t } = useI18n()

const model = defineModel<{ name: string | null; barcode: string | null }>({ required: true })

const showScanner = ref(false)

const labels = computed(() => `${t('code')}, ${t('name')}, ${t('category')}`)

const clearBarcode = () => {
  model.value.barcode = null
}
</script>
