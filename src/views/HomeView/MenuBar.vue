<template>
  <v-list density="compact" nav>
    <v-list-item
      v-for="item in menuItems"
      :key="item.route"
      :value="item.route"
      :active="route.name === item.route"
      color="#BF360C"
      @click="navigateTo(item.route)"
      slim
    >
      <template v-slot:prepend>
        <v-icon size="small" :icon="item.icon" />
      </template>
      <v-list-item-subtitle class="font-weight-bold">{{ item.label }}</v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import {
  mdiHistory,
  mdiAccountGroupOutline,
  mdiReceiptTextOutline,
  mdiCartOutline,
  mdiPackageVariantClosed
} from '@mdi/js'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const menuItems = computed(() => [
  {
    label: t('clients'),
    route: 'clients',
    icon: mdiAccountGroupOutline,
    color: 'medium-emphasis'
  },
  {
    label: t('products'),
    route: 'warehouse',
    icon: mdiPackageVariantClosed,
    color: 'medium-emphasis'
  },
  {
    label: t('orders'),
    route: 'orders',
    icon: mdiReceiptTextOutline,
    color: 'medium-emphasis'
  },
  {
    label: t('sales'),
    route: 'create-sale',
    icon: mdiCartOutline,
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
