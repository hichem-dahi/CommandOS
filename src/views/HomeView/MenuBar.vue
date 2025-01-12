<template>
  <v-tabs v-model="tab" align-tabs="center" slider-color="#f78166">
    <v-tab
      v-for="item in menuItems"
      :key="item.route"
      :value="item.route"
      :prepend-icon="item.icon"
      class="text-none"
      @click="navigateTo(item.route)"
    >
      {{ item.label }}
    </v-tab>
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
    color: 'medium-emphasis'
  },
  {
    label: t('warehouse'),
    route: 'warehouse',
    icon: mdiWarehouse,
    color: 'medium-emphasis'
  },
  {
    label: t('orders'),
    route: 'orders',
    icon: mdiReceiptText,
    color: 'medium-emphasis'
  },

  {
    label: t('sales'),
    route: 'create-sale',
    icon: mdiCart,
    color: 'medium-emphasis'
  },
  {
    label: t('history'),
    route: 'orders-history',
    icon: mdiHistory,
    color: 'medium-emphasis'
  }
])

function navigateTo(route: string) {
  router.push({ name: route })
}
</script>
