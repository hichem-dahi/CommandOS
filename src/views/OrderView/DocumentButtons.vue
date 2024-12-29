<template>
  <template v-for="(docType, index) in documentTypes" :key="index">
    <v-btn
      variant="text"
      :prepend-icon="docType.icon"
      :disabled="disabled"
      @click="goDocPage"
      target="_blank"
      :text="$t(docType.label)"
      v-if="order?.document_type === docType.type"
    />
  </template>
</template>

<script setup lang="ts">
import { mdiInvoice, mdiReceiptText, mdiTruckCheck, mdiNote } from '@mdi/js'
import { DocumentType } from '@/models/models'

import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'

defineProps<{ readonly order: OrderData; disabled: boolean }>()

const emit = defineEmits(['go-doc-page'])

const documentTypes = [
  { type: DocumentType.Invoice, icon: mdiReceiptText, label: 'invoice' },
  { type: DocumentType.DeliveryNote, icon: mdiTruckCheck, label: 'delivery-note' },
  { type: DocumentType.Voucher, icon: mdiInvoice, label: 'voucher' },
  { type: DocumentType.Proforma, icon: mdiNote, label: 'proforma' }
]

function goDocPage() {
  emit('go-doc-page')
}
</script>
