<template>
  <v-radio-group v-model="form.document_type">
    <div v-if="consumerType === ConsumerType.Organization">
      <v-radio :label="$t('invoice')" :value="DocumentType.Invoice" />
      <v-radio :label="$t('proforma')" :value="DocumentType.Proforma" />
    </div>
    <div v-else-if="consumerType === ConsumerType.Individual">
      <v-radio :label="$t('voucher')" :value="DocumentType.Voucher" />
    </div>
    <v-radio :label="$t('delivery-note')" :value="DocumentType.DeliveryNote" />
  </v-radio-group>
  <div v-if="form.document_type && form.document_type != DocumentType.Proforma">
    <v-number-input
      :label="$t('payment')"
      inset
      controlVariant="stacked"
      :error="!$v.paid_price.$pending && $v.paid_price.$error"
      :suffix="`/${form.total_price} ${$t('DA')}`"
      :max="form.total_price"
      :min="0"
      v-model="paymentForm.amount"
    />
    <v-text-field
      v-if="form.org_id"
      :label="$t('payment-method')"
      :error="!$v.payment_method.$pending && $v.payment_method.$error"
      v-model="form.payment_method"
    />
    <CreateDelivery
      v-if="deliveryForm && form.document_type == DocumentType.DeliveryNote"
      v-model:delivery="deliveryForm"
    />
  </div>
  <slot name="actions" :v="$v"></slot>
</template>

<script setup lang="ts">
import useVuelidate from '@vuelidate/core'
import { numeric, requiredIf } from '@vuelidate/validators'

import CreateDelivery from '../CreateDelivery.vue'

import { ConsumerType, DocumentType } from '@/models/models'

import { consumerType, deliveryForm, form, paymentForm } from './state'

const rules = {
  payment_method: {
    required: requiredIf(() => !!form.org_id && form.document_type != DocumentType.Proforma) // required only if company exists
  },
  paid_price: { numeric }
}

const $v = useVuelidate(rules, form)
</script>
