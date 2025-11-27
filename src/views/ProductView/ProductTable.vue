<!-- eslint-disable vue/valid-v-slot -->
<template>
  <v-data-table
    v-if="product"
    :items="items"
    :headers="headers"
    density="comfortable"
    hover
    class="bg-white rounded-lg"
  >
    <template #top>
      <v-card
        color="#F7F7F7"
        elevation="0"
        class="px-4 py-3 d-flex align-center justify-space-between"
      >
        <div class="d-flex align-center gap-4">
          <v-avatar size="64" color="grey-lighten-3">
            <v-icon size="32" color="grey" :icon="mdiPackageVariant"></v-icon>
          </v-avatar>

          <div>
            <v-card-title class="text-h6 font-weight-medium mb-1">
              {{ product?.name }}
            </v-card-title>
            <v-card-subtitle class="text-body-2">
              <div class="d-flex flex-wrap align-center ga-2">
                <v-chip variant="outlined" rounded="xl" size="small" label>
                  {{ $t('code') }}: {{ product?.code }}
                </v-chip>
                <v-chip variant="outlined" rounded="xl" size="small" label>
                  {{ $t('U.P') }}: {{ product?.price }} DA
                </v-chip>
                <v-chip
                  variant="outlined"
                  rounded="xl"
                  v-if="product?.cost_price"
                  size="small"
                  label
                >
                  {{ $t('C.P') }}: {{ product?.cost_price }} DA
                </v-chip>
                <v-chip variant="outlined" rounded="xl" size="small" label>
                  {{ $t('quantity') }}: {{ product?.qty }}
                </v-chip>
              </div>
            </v-card-subtitle>
          </div>
        </div>

        <v-tooltip text="Modify product stock" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              color="primary"
              size="small"
              prepend-icon="mdi-pencil"
              @click="modifyStockDialog = true"
            >
              {{ $t('modify-stock') }}
            </v-btn>
          </template>
        </v-tooltip>

        <ModifyStock v-model="modifyStockDialog" :product="product" />
      </v-card>

      <v-divider class="my-2" />
    </template>

    <template #item.order="{ item }">
      <v-tooltip text="View order">
        <template #activator="{ props }">
          <v-btn
            v-if="item.order"
            v-bind="props"
            variant="text"
            size="small"
            color="primary"
            :to="{ name: 'order', params: { order_id: item.order } }"
            class="text-capitalize"
          >
            <v-icon :icon="mdiOpenInNew" size="18" />
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <template #item.date="{ item }">
      <div class="text-no-wrap">
        {{ format(item.date, 'yyyy-MM-dd') }}
      </div>
      <div class="text-no-wrap text-grey text-caption">
        {{ format(item.date, 'p') }}
      </div>
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { sortBy } from 'lodash'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { mdiOpenInNew, mdiPackageVariant } from '@mdi/js'

import ModifyStock from './ModifyStock.vue'

import type { Tables } from '@/types/database.types'
import type { ProductData } from '@/composables/db/products/useGetProductsDb'

const props = defineProps<{ product: ProductData }>()

const { t } = useI18n()

const stockMovementsQuery = useLiveQuery<Tables<'stock_movements'>>(
  'SELECT * FROM public.stock_movements WHERE product_id = $1;',
  [toRef(() => props.product.id)]
)

const stockMovements = computed(() => stockMovementsQuery.rows.value)
const modifyStockDialog = ref(false)

const items = computed(() =>
  sortBy(
    stockMovements.value?.map((s) => {
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
