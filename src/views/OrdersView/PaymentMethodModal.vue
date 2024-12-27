<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-card class="pa-4" :title="$t('add-payment-method')">
      <template v-slot:text>
        <v-text-field label="payment method" v-model="paymentMethod" />
      </template>
      <template v-slot:actions>
        <v-spacer></v-spacer>
        <v-btn @click="dialog = false">{{ $t('cancel') }}</v-btn>
        <v-btn @click="addPaymentMethod">{{ $t('confirm') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'

const props = defineProps<{ order: OrderData }>()
const dialog = defineModel<boolean>('dialog')
const emits = defineEmits(['go-invoice'])

const paymentMethod = ref(props.order.payment_method || '')

function addPaymentMethod() {
  if (props.order.paid_price) {
    //TODO:
    emits('go-invoice')
    dialog.value = false
  }
}
</script>
