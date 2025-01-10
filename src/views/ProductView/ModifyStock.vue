<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-card class="pa-4" :title="$t('modify-stock')">
      <v-number-input
        :label="$t('quantity')"
        variant="outlined"
        inset
        control-variant="stacked"
        :error="!$v.qte.$pending && $v.qte.$error"
        v-model.number="form.qte"
      />
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="dialog = false">{{ $t('cancel') }}</v-btn>
        <v-btn
          variant="text"
          color="primary"
          :loading="upsertStockMovementsDb.isLoading.value"
          @click="saveStock"
          >{{ $t('confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import useVuelidate from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import { updateProductStock } from '@/composables/useStockManage'
import { useUpsertStockMovementsDb } from '@/composables/db/stockMovements/useUpsertStockMovementsDb'
import { useUpdateProductsQtyDb } from '@/composables/db/products/useUpdateProductsQtyDb'

import type { ProductData } from '@/composables/db/products/useGetProductsDb'

const emits = defineEmits(['success'])
const dialog = defineModel<boolean>()
const props = defineProps<{ product: ProductData }>()

const upsertStockMovementsDb = useUpsertStockMovementsDb()
const updateProductsQtyDb = useUpdateProductsQtyDb()

const notZero = (value: any) => value !== null && value !== undefined && value !== 0

const form = reactive({
  qte: 0
})

const rules = {
  qte: { required, notZero }
}

const $v = useVuelidate(rules, form)

function saveStock() {
  $v.value.$touch()
  if (!$v.value.$invalid && form.qte) {
    const stockMovements = updateProductStock(props.product.id, form.qte)
    upsertStockMovementsDb.form.value = [{ ...stockMovements, _synced: false }]
    upsertStockMovementsDb.execute()
  }
}

watch(
  () => upsertStockMovementsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      updateProductsQtyDb.stockMovementsIds.value = upsertStockMovementsDb.data.value.map(
        (s) => s.id
      )
      updateProductsQtyDb.execute()
    }
  }
)

watch(
  () => updateProductsQtyDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      emits('success')
      dialog.value = false
    }
  }
)
</script>
