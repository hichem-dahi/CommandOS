<template>
  <v-btn
    ref="bt"
    variant="text"
    :prepend-icon="docType.icon"
    :disabled="disabled"
    @click="goDocPage"
    target="_blank"
    :text="$t(docType.label)"
  />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { mdiInvoice, mdiReceiptText, mdiTruckCheck, mdiNote } from '@mdi/js'

import type { OrderData } from '@/composables/db/orders/useGetOrdersDb'
import { DocumentType } from '@/models/models'

const documentTypes = [
  { type: DocumentType.Invoice, icon: mdiReceiptText, label: 'invoice' },
  { type: DocumentType.DeliveryNote, icon: mdiTruckCheck, label: 'delivery-note' },
  { type: DocumentType.Voucher, icon: mdiInvoice, label: 'voucher' },
  { type: DocumentType.Proforma, icon: mdiNote, label: 'proforma' }
]

const props = defineProps<{ readonly order: OrderData; disabled: boolean }>()

const emit = defineEmits(['go-doc-page'])

const docType = ref(documentTypes.find((d) => props.order.doc_index == d.type))

watchEffect(() => {
  docType.value = documentTypes.find((d) => props.order.document_type == d.type)
})

function goDocPage() {
  emit('go-doc-page')
}
</script>
