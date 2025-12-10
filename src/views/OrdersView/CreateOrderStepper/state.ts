import { computed, reactive, ref } from 'vue'

import self from '@/composables/localStore/useSelf'

import { ConsumerType, DocumentType, OrderStatus } from '@/models/models'
import type { TablesInsert } from '@/types/database.types'

export type RequiredFields<T> = {
  [K in keyof T as K extends '_deleted' | '_synced' | 'updated_at' | 'id' ? K : never]?: T[K] // Keep these optional
} & {
  [K in keyof T as K extends '_deleted' | '_synced' | 'updated_at' | 'id' ? never : K]-?: T[K] // Make all other fields required
}

const defaultOrderForm = () => ({
  client_id: null,
  delivery_id: null,
  individual_id: null,
  org_id: self.value.current_org?.id || '',
  date: new Date().toISOString(),
  document_type: DocumentType.Voucher,
  index: 0,
  doc_index: null,
  status: OrderStatus.Pending,
  payment_method: 'cash',
  type: 'sale' as 'order' | 'sale',
  paid_price: 0,
  total_price: 0,
  tva: 0,
  ttc: 0,
  reduction: 0
})

const defaultPaymentForm = () => ({
  date: new Date().toISOString(),
  amount: 0,
  order_id: '',
  org_id: self.value.current_org?.id || ''
})

const defaultIndividualForm = () => ({
  id: undefined as string | undefined,
  name: '',
  phone: '',
  org_id: self.value.current_org?.id || ''
})
const defaultClientForm = () => ({
  id: '',
  name: '',
  phone: '',
  rc: '',
  nif: null as number | null,
  nis: null as number | null,
  art: null as number | null,
  address: '',
  activity: '',
  user_id: null,
  org_id: self.value.current_org?.id || ''
})

const defaultOrderlineForm = () => ({
  order_id: '',
  org_id: self.value.current_org?.id || '',
  product_id: '',
  qte: 0,
  total_price: 0,
  unit_cost_price: null,
  unit_price: 0
})

const defaultDeliveryForm = () => ({
  driver_name: '',
  phone: '',
  license_plate: '',
  destination: '',
  org_id: self.value.current_org?.id || ''
})

const form = reactive<RequiredFields<TablesInsert<'orders'>>>(defaultOrderForm())

const individualForm = ref<RequiredFields<TablesInsert<'individuals'>>>(defaultIndividualForm())
const clientForm = ref<RequiredFields<TablesInsert<'organizations'>>>(defaultClientForm())

const orderlinesForm = ref<RequiredFields<TablesInsert<'order_lines'>>[]>([defaultOrderlineForm()])

const deliveryForm = ref<RequiredFields<TablesInsert<'deliveries'>>>(defaultDeliveryForm())

const paymentForm = reactive<RequiredFields<TablesInsert<'payments'>>>(defaultPaymentForm())

const consumerType = ref<ConsumerType>()

const consumerPicked = computed(() => form.individual_id || form.client_id)

function resetOrderForm() {
  Object.assign(form, defaultOrderForm())
  deliveryForm.value = defaultDeliveryForm()
  individualForm.value = defaultIndividualForm()
  Object.assign(paymentForm, defaultPaymentForm())
  orderlinesForm.value = [defaultOrderlineForm()]
}

export {
  form,
  orderlinesForm,
  deliveryForm,
  individualForm,
  clientForm,
  paymentForm,
  consumerType,
  consumerPicked,
  resetOrderForm,
  defaultIndividualForm,
  defaultClientForm
}
