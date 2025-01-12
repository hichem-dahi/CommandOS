<template>
  <v-tabs v-model="tab" :items="menuItems" align-tabs="center" slider-color="#0d2c40">
    <template v-slot:tab="{ item }">
      <v-tab
        :prepend-icon="item.icon"
        :text="item.label"
        :value="item.route"
        class="text-none"
        @click="navigateTo(item.route)"
      ></v-tab>
    </template>
  </v-tabs>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { mdiAccountGroup, mdiHistory, mdiWarehouse, mdiReceiptText, mdiCart } from '@mdi/js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const tab = ref(route.name)

const menuItems = computed(() => [
  {
    label: t('clients'),
    route: 'clients',
    icon: mdiAccountGroup,
    color: 'medium-emphasis',
    component: 'ClientsComponent'
  },
  {
    label: t('warehouse'),
    route: 'warehouse',
    icon: mdiWarehouse,
    color: 'medium-emphasis',
    component: 'WarehouseComponent'
  },
  {
    label: t('orders'),
    route: 'orders',
    icon: mdiReceiptText,
    color: 'medium-emphasis',
    component: 'OrdersComponent'
  },

  {
    label: t('sales'),
    route: 'create-sale',
    icon: mdiCart,
    color: 'medium-emphasis',
    component: 'SalesComponent'
  },
  {
    label: t('history'),
    route: 'orders-history',
    icon: mdiHistory,
    color: 'medium-emphasis',
    component: 'HistoryComponent'
  }
])

function navigateTo(route: string) {
  router.push({ name: route })
}
</script>
