<template>
  <div class="d-flex align-start flex-wrap ga-8 pa-4">
    <v-btn class="my-5" variant="tonal" size="small" :append-icon="mdiPlus" @click="dialog = true">
      {{ $t('add-product') }}
    </v-btn>
    <v-dialog max-width="400px" v-model="dialog">
      <ProductForm v-model="form">
        <template v-slot:actions>
          <v-btn block :loading="upsertProductsDb.isLoading.value" @click="submitForm()">
            {{ $t('add') }}
          </v-btn>
        </template>
      </ProductForm>
    </v-dialog>
    <v-divider v-if="!$vuetify.display.mobile" vertical />
    <FilterBar v-model="filters" />
  </div>
  <v-container>
    <v-row>
      <v-col v-for="(_, i) in filteredProducts" :key="i" sm="12" md="3">
        <ProductCard v-model="filteredProducts[i]" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { mdiPlus } from '@mdi/js'
import { injectPGlite } from '@electric-sql/pglite-vue'

import self from '@/composables/localStore/useSelf'

import { useProductsSync } from '@/composables/sync/useProductsSync'
import { useUpsertProductsDb } from '@/composables/db/products/useUpsertProductsDb'

import ProductForm from '@/views/WarehouseView/ProductForm.vue'
import ProductCard from '@/views/WarehouseView/ProductCard.vue'
import FilterBar from './WarehouseView/FilterBar.vue'

const db = injectPGlite()

const $v = useVuelidate()

const { products } = useProductsSync()

const upsertProductsDb = useUpsertProductsDb()

const dialog = ref(false)

const filters = reactive({
  name: null,
  barcode: null
})

const form = ref({
  code: '',
  name: '',
  org_id: '',
  qte: 0,
  price: 0,
  cost_price: null as number | null,
  bar_code: null as number | null
})

const filteredProducts = computed(() =>
  products.value?.filter((o) => {
    const name = filters.name ? o.name.includes(filters.name) : true
    const barcode = filters.barcode && o.bar_code ? o.bar_code === filters.barcode : true
    return name && barcode
  })
)

async function submitForm() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    const org_id = self.value.user?.organization_id
    if (org_id) {
      upsertProductsDb.form.value = [
        {
          ...form.value,
          org_id,
          _synced: false
        }
      ]
      upsertProductsDb.execute(db)
    }
  }
}

watch(
  () => upsertProductsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      dialog.value = false
    }
  }
)
</script>
