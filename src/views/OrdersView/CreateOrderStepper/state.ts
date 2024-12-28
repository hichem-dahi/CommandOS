import { reactive, ref, watchEffect } from 'vue'
import { round, sum } from 'lodash'

import self from '@/composables/localStore/useSelf'

import { ConsumerType, DocumentType, OrderStatus } from '@/models/models'
import type { TablesInsert } from '@/types/database.types'

type RequiredFields<T> = {
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
  document_type: 0,
  index: 0,
  doc_index: null,
  status: OrderStatus.Pending,
  payment_method: null,
  paid_price: 0,
  total_price: 0,
  tva: 0,
  ttc: 0
})

const defaultPaymentForm = () => ({
  date: new Date().toISOString(),
  amount: 0,
  order_id: ''
})

const defaultIndividualForm = () => ({
  id: undefined as string | undefined,
  name: '',
  phone: '',
  org_id: self.value.current_org?.id || ''
})

const defaultOrderlineForm = () => ({
  id: undefined as string | undefined,
  order_id: '',
  product_id: '',
  qte: 0,
  total_price: 0,
  unit_cost_price: null as number | null,
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

const individualForm = ref<RequiredFields<TablesInsert<'individuals'>> | undefined>(
  defaultIndividualForm()
)

const orderlinesForm = ref<RequiredFields<TablesInsert<'order_lines'>>[] | undefined>([
  defaultOrderlineForm()
])

const deliveryForm = ref<RequiredFields<TablesInsert<'deliveries'>> | undefined>(
  defaultDeliveryForm()
)

const paymentForm = reactive<RequiredFields<TablesInsert<'payments'>>>(defaultPaymentForm())

const consumerType = ref<ConsumerType>()

function cleanForm() {
  if (form.document_type === DocumentType.Proforma) {
    form.paid_price = 0
  }

  if (form.document_type !== DocumentType.DeliveryNote) {
    deliveryForm.value = undefined
  }

  if (consumerType.value === ConsumerType.Organization) {
    individualForm.value = undefined
    const taxMultiplier = 0.19
    form.tva = round(form.total_price * taxMultiplier, 0)
    form.ttc = round(form.total_price * (1 + taxMultiplier), 0)
  } else if (consumerType.value === ConsumerType.Individual) {
    form.client_id = null
  }
}

function resetOrderForm() {
  Object.assign(form, defaultOrderForm())
  deliveryForm.value = defaultDeliveryForm()
  individualForm.value = defaultIndividualForm()
  Object.assign(paymentForm, defaultOrderlineForm())
}

watchEffect(() => {
  form.total_price = sum(orderlinesForm.value?.map((e) => e.total_price))

  if (paymentForm.amount && paymentForm.amount > 0) {
    form.paid_price = form.total_price - (form.total_price - paymentForm.amount)
  }

  if (individualForm.value?.id) {
    form.individual_id = individualForm.value.id
  }
  consumerType.value = form.individual_id ? ConsumerType.Individual : ConsumerType.Organization
})

export {
  form,
  orderlinesForm,
  deliveryForm,
  individualForm,
  paymentForm,
  consumerType,
  cleanForm,
  resetOrderForm,
  defaultIndividualForm
}
