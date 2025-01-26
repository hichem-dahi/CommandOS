<template>
  <div class="d-flex align-start flex-wrap ga-8 pa-4">
    <v-btn class="my-5" variant="tonal" size="small" :append-icon="mdiPlus" @click="toggleDialog">
      {{ $t('add-product') }}
    </v-btn>
    <v-dialog max-width="400px" v-model="dialog">
      <ProductForm v-model:product="form" v-model:category="categoryForm">
        <template v-slot:actions>
          <v-btn block :loading="upsertDataDb.isLoading.value" @click="submitForm">
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
      <v-col v-for="product in filteredProducts" :key="product.id" sm="12" md="3">
        <ProductCard :product="product" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { mdiPlus } from '@mdi/js'

import self from '@/composables/localStore/useSelf'

import { useProductsQuery, type ProductData } from '@/composables/db/products/useGetProductsDb'
import { useUpsertDataDb } from '@/composables/db/useUpsertDataDb'

import ProductForm from '@/views/WarehouseView/ProductForm.vue'
import ProductCard from '@/views/WarehouseView/ProductCard.vue'
import FilterBar from './WarehouseView/FilterBar.vue'

import type { TablesInsert } from '@/types/database.types'

const $v = useVuelidate()

const { q: productsQuery } = useProductsQuery()

const products = computed(() => (productsQuery.rows.value || []) as unknown as ProductData[])

const upsertDataDb = useUpsertDataDb()

const dialog = ref(false)

const filters = reactive({
  name: null,
  barcode: null
})

const defaultProductForm = () => ({
  code: '',
  name: '',
  category_id: '',
  org_id: '',
  init_qty: 0,
  price: 0,
  cost_price: null as number | null,
  bar_code: null as number | null
})

const form = ref(defaultProductForm())

const categoryForm = ref<TablesInsert<'products_categories'>>({
  name: '',
  org_id: self.value.current_org?.id || ''
})

const filteredProducts = computed(() =>
  products.value?.filter((product) => {
    const productStr = JSON.stringify(product)
    const matchesName = productStr ? productStr.includes(filters.name || '') : true
    const matchesBarcode =
      filters.barcode && product.bar_code ? product.bar_code == filters.barcode : true

    return matchesName && matchesBarcode
  })
)

function toggleDialog() {
  dialog.value = !dialog.value
}

async function submitForm() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    const org_id = self.value.current_org?.id || ''

    await upsertProductsCategoriesDb({
      ...categoryForm.value,
      org_id,
      _synced: false
    })

    const category_id = upsertDataDb.data.value?.[0].id || categoryForm.value.id
    await upsertProductsDb({ ...form.value, org_id, category_id })
    form.value = defaultProductForm()
    dialog.value = false
  }
}

async function upsertProductsCategoriesDb(categoryData: TablesInsert<'products_categories'>) {
  await upsertDataDb.execute([{ ...categoryData, _synced: false }], 'products_categories')
}

async function upsertProductsDb(productData: TablesInsert<'products'>) {
  await upsertDataDb.execute([{ ...productData, _synced: false }], 'products')
}
</script>
