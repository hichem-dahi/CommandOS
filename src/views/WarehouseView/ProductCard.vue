<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <v-card
    v-if="product"
    class="pb-4"
    hover
    :title="product?.name"
    :to="{ name: 'product', params: { product_id: product?.id } }"
  >
    <v-card-subtitle class="text-caption">
      <span class="font-weight-bold">{{ $t('code') }}:</span>
      <span>&nbsp;{{ product?.code }}</span
      ><br />
      <span class="font-weight-bold">{{ $t('quantity') }}:</span>
      <span>&nbsp;{{ product?.qte }}</span
      ><br />
      <span class="font-weight-bold">{{ $t('U.P') }}:</span>
      <span>&nbsp;{{ product?.price }} DA</span>
      <div v-if="product?.cost_price">
        <span class="font-weight-bold">{{ $t('C.P') }}:</span>
        <span>&nbsp;{{ product?.cost_price }} DA</span>
      </div>
    </v-card-subtitle>

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
      <ProductForm v-model="proxyForm">
        <template v-slot:actions>
          <v-btn block :loading="upsertProductsDb.isLoading.value" @click="editProduct()">
            {{ $t('confirm') }}
          </v-btn>
        </template>
      </ProductForm>
    </v-dialog>
  </v-card>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { mdiDotsVertical } from '@mdi/js'
import { clone } from 'lodash'
import useVuelidate from '@vuelidate/core'

import { useUpsertProductsDb } from '@/composables/db/products/useUpsertProductsDb'
import { useSoftDeleteProductsDB } from '@/composables/db/products/useSoftDeleteProductsDb'

import DeleteItemModal from '@/views/OrderView/DeleteItemModal.vue'
import ProductForm from './ProductForm.vue'

import type { Product } from '@/models/models'

const $v = useVuelidate()

const product = defineModel<Product>()
const proxyForm = ref(clone(product.value))

const upsertProductsDb = useUpsertProductsDb()
const softDeleteProductDB = useSoftDeleteProductsDB()

const deleteDialog = ref(false)
const editDialog = ref(false)

async function editProduct() {
  $v.value.$touch()
  if (!$v.value.$invalid && proxyForm.value) {
    upsertProductsDb.form.value = [{ ...proxyForm.value, _synced: false }]
    upsertProductsDb.execute()
  }
}

async function deleteProduct() {
  softDeleteProductDB.ids.value = [product.value?.id || '']
  softDeleteProductDB.execute()
}

watch(
  () => upsertProductsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      editDialog.value = false
    }
  }
)
</script>
