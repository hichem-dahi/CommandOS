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
import { required, requiredIf } from '@vuelidate/validators'

import CreateDelivery from '../CreateDelivery.vue'

import { ConsumerType, DocumentType } from '@/models/models'

import { consumerType, deliveryForm, form } from './state'

const rules = {
  document_type: { required },
  payment_method: {
    required: requiredIf(() => !!form.client_id && form.document_type != DocumentType.Proforma) // required only if company exists
  }
}

const $v = useVuelidate(rules, form)
</script>
