<template>
  <v-btn
    class="mt-3"
    size="small"
    color="grey"
    variant="text"
    :prepend-icon="mdiChevronLeft"
    @click="$router.go(-1)"
    :text="$t('back')"
  />
  <div class="text-h5 pa-4 my-4">{{ $t('stock-sheet') }}: {{ product?.name }}</div>
  <div class="product-wrapper">
    <div class="product-table border">
      <ProductTable v-if="product" :product="product" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { mdiChevronLeft } from '@mdi/js'

import { useProductQuery } from '@/composables/db/products/useGetProductsDb'

import ProductTable from './ProductView/ProductTable.vue'

import type { Product } from '@/models/models'

const route = useRoute()

const { q, productId } = useProductQuery()

productId.value = route.params.product_id

const product = computed(() => (q.rows.value?.[0] as unknown as Product) || undefined)
</script>

<style>
.product-wrapper {
  display: flex;
  width: 100%;
  justify-content: space-between;
}

.product-table {
  min-width: 60%;
}
</style>
