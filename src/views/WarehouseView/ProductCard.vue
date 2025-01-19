<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <v-card
    v-if="product"
    class="pb-4"
    hover
    :title="title"
    :to="{ name: 'product', params: { product_id: product?.id } }"
  >
    <template v-slot:subtitle>
      <span class="text-caption">{{ category }}</span>
    </template>
    <v-card-text class="text-caption text-medium-emphasis">
      <span class="font-weight-bold">{{ $t('code') }}:</span>
      <span>&nbsp;{{ product?.code }}</span
      ><br />
      <span class="font-weight-bold">{{ $t('quantity') }}:</span>
      <span>&nbsp;{{ product?.qty }}</span
      ><br />
      <span class="font-weight-bold">{{ $t('U.P') }}:</span>
      <span>&nbsp;{{ product?.price }} DA</span>
      <div v-if="product?.cost_price">
        <span class="font-weight-bold">{{ $t('C.P') }}:</span>
        <span>&nbsp;{{ product?.cost_price }} DA</span>
      </div>
    </v-card-text>

    <template v-slot:append>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            @click.prevent
            variant="text"
            size="small"
            :icon="mdiDotsVertical"
          />
        </template>
        <v-list density="compact">
          <v-list-item density="compact" @click="deleteDialog = true">
            <v-list-item-title>{{ $t('delete') }}</v-list-item-title>
          </v-list-item>
          <v-list-item density="compact" @click="editDialog = true">
            <v-list-item-title>{{ $t('modify') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    <DeleteItemModal
      v-model="deleteDialog"
      @confirm="deleteProduct"
      @close="deleteDialog = false"
    />
    <v-dialog max-width="500px" v-model="editDialog">
      <ProductForm v-model:product="proxyForm" v-model:category="categoryForm">
        <template v-slot:actions>
          <v-btn block :loading="upsertDataDb.isLoading.value" @click="submitForm()">
            {{ $t('confirm') }}
          </v-btn>
        </template>
      </ProductForm>
    </v-dialog>
  </v-card>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { mdiDotsVertical } from '@mdi/js'
import { clone } from 'lodash'
import useVuelidate from '@vuelidate/core'

import { useUpsertDataDb } from '@/composables/db/useUpsertDataDb'
import { useSoftDeleteProductsDB } from '@/composables/db/products/useSoftDeleteProductsDb'

import self from '@/composables/localStore/useSelf'

import DeleteItemModal from '@/views/OrderView/DeleteItemModal.vue'
import ProductForm from './ProductForm.vue'

import type { ProductData } from '@/composables/db/products/useGetProductsDb'
import type { TablesInsert } from '@/types/database.types'

const $v = useVuelidate()

const props = defineProps<{ product: ProductData }>()

const proxyForm = ref(clone(props.product))
const categoryForm = ref<TablesInsert<'products_categories'> | undefined>({
  name: '',
  org_id: self.value.current_org?.id || ''
})

const upsertDataDb = useUpsertDataDb()

const softDeleteProductDB = useSoftDeleteProductsDB()

const deleteDialog = ref(false)
const editDialog = ref(false)

const title = computed(() => `${props.product.name}`)

const category = computed(() => props.product.category || '')

async function deleteProduct() {
  softDeleteProductDB.ids.value = [props.product.id || '']
  softDeleteProductDB.execute()
}

async function submitForm() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    let productsCategories

    if (categoryForm.value?.name && !categoryForm.value?.id)
      productsCategories = await upsertProductsCategoriesDb({
        ...categoryForm.value
      })

    //TODO: using upsertDataDb for multiple tables is problematic
    const category_id = productsCategories?.[0].id || categoryForm.value?.id
    const { qty, category, ...form } = proxyForm.value

    await upsertProductsDb({ ...form, category_id })
    editDialog.value = false
  }
}

async function upsertProductsCategoriesDb(categoryData: TablesInsert<'products_categories'>) {
  await upsertDataDb.execute([{ ...categoryData, _synced: false }], 'products_categories')
  return (upsertDataDb.data.value || []) as TablesInsert<'products_categories'>[]
}

async function upsertProductsDb(productData: TablesInsert<'products'>) {
  await upsertDataDb.execute([{ ...productData, _synced: false }], 'products')
  return (upsertDataDb.data.value || []) as TablesInsert<'products'>[]
}
</script>
