<!-- eslint-disable vue/valid-v-slot -->
<template>
  <v-data-table v-if="product" :items="items" :headers="headers" style="background-color: #fefefe">
    <template v-slot:top>
      <v-card class="pb-2 d-flex align-end" color="#F7F7F7" elevation="0">
        <div class="col-1 d-flex justify-space-between w-75">
          <div>
            <v-card-title>
              <div>{{ product?.name }}</div>
            </v-card-title>
            <v-card-subtitle class="text-body-2">
              <span>{{ $t('code') }}:</span>
              <span>&nbsp;{{ product?.code }}</span> <br />

              <span>{{ $t('U.P') }}:</span>
              <span>&nbsp;{{ product?.price }} DA</span> <br />

              <div v-if="product?.cost_price">
                <span>{{ $t('C.P') }}:</span>
                <span>&nbsp;{{ product?.cost_price }} DA</span>
              </div>

              <span>{{ $t('quantity') }}:</span>
              <span>&nbsp;{{ product?.qte }}</span> <br />
            </v-card-subtitle>
          </div>
        </div>
        <div class="col-2">
          <v-btn variant="text" color="primary" size="small" @click="modifyStockDialog = true">
            {{ $t('modify-stock') }}
          </v-btn>
          <ModifyStock
            v-model="modifyStockDialog"
            :product="product"
            @success="getStockMovementsApi.execute()"
          />
        </div>
      </v-card>
    </template>
    <template v-slot:item.order="{ item }">
      <v-btn
        v-if="item.order"
        variant="text"
        size="small"
        color="light-blue"
        :icon="mdiOpenInNew"
        :to="{ name: 'order', params: { order_id: item.order } }"
      >
      </v-btn>
    </template>
    <template v-slot:item.date="{ item }">
      <div class="text-no-wrap">{{ format(item.date, 'yyyy-MM-dd') }}</div>
      <div class="text-no-wrap">{{ format(item.date, 'p') }}</div>
    </template>
  </v-data-table>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { sortBy } from 'lodash'

import { mdiOpenInNew } from '@mdi/js'

import { useGetStockMovementsApi } from '@/composables/api/stockMovements/useGetStockMovementsApi'

import ModifyStock from './ModifyStock.vue'

import type { Product } from '@/models/models'

const props = defineProps<{ product: Product }>()

const { t } = useI18n()

const getStockMovementsApi = useGetStockMovementsApi()

const modifyStockDialog = ref(false)

onMounted(() => {
  getStockMovementsApi.productId.value = props.product.id
  getStockMovementsApi.execute()
})

const stockMovements = computed(() => getStockMovementsApi.data.value)

const items = computed(() =>
  sortBy(
    stockMovements.value?.map((s, i) => {
      return {
        id: s.id,
        date: s.date,
        qte: s.qte_change,
        order: s.order_id
      }
    }),
    (t) => new Date(t.date)
  ).reverse()
)

const headers = computed(
  () =>
    [
      {
        title: t('date'),
        align: 'start',
        sortable: false,
        key: 'date'
      },
      {
        title: t('quantity'),
        key: 'qte',
        align: 'start',
        value: (item: (typeof items.value)[0]) => {
          const number = Number(item.qte)
          return `${number >= 0 ? '+' : ''}${number}`
        }
      },
      { title: t('order'), key: 'order' }
    ] as any
)
</script>
