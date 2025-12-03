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
  <div class="product-wrapper">
    <div class="product-table">
      <ProductTable v-if="product" :product="product" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { mdiChevronLeft } from '@mdi/js'

import { useProductsQuery } from '@/composables/db/products/useGetProductsDb'

import ProductTable from './ProductView/ProductTable.vue'

const route = useRoute()

const { q, product_id } = useProductsQuery()

product_id.value = route.params.product_id as string

const product = computed(() => q.rows.value?.[0])
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
