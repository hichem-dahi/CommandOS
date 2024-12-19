import { reactive, ref, watchEffect } from 'vue'
import { round, sum } from 'lodash'

import self from '@/composables/localStore/useSelf'

import { ConsumerType, DocumentType, OrderStatus } from '@/models/models'

const consumerType = ref<ConsumerType>()

const defaultForm = () => ({
  client_id: undefined as string | undefined,
  delivery_id: undefined as string | undefined,
  individual_id: undefined as string | undefined,
  org_id: self.value.current_org,
  date: new Date().toISOString(),
  document_type: 0,
  doc_index: null,
  status: OrderStatus.Pending,
  payment_method: null,
  paid_price: 0 as any,
  total_price: 0,
  tva: 0,
  ttc: 0
})

const form = reactive(defaultForm())

const paymentForm = reactive({
  date: new Date().toISOString(),
  amount: null as number | null
})

const orderlinesForm = ref<
  {
    id?: string | undefined
    order_id: string
    product_id: string
    qte: number
    total_price: number
    unit_cost_price: number | null | undefined
    unit_price: number
  }[]
>([])

const deliveryForm = ref({
  driver_name: '',
  phone: null,
  license_plate: '',
  destination: ''
})

const individualForm = ref({
  id: undefined as string | undefined,
  name: '',
  phone: null as string | null,
  org_id: self.value.current_org
})

function cleanForm() {
  if (!form.document_type) return
  switch (form.document_type) {
    case DocumentType.Proforma:
      form.paid_price = undefined
      break

    default:
      break
  }

  if (consumerType.value === ConsumerType.Organization) {
    individualForm.value = undefined as any
    form.tva = round(form.total_price * 0.19, 0)
    form.ttc = round(form.total_price * 1.19, 0)
  } else if (consumerType.value === ConsumerType.Individual) {
    form.client_id = undefined as any
  }
}

function resetForm() {
  Object.assign(form, defaultForm())
}

function resetPayment() {
  Object.assign(paymentForm, {
    date: new Date(),
    amount: null
  })
}

watchEffect(() => {
  form.total_price = sum(orderlinesForm.value.map((e) => e.total_price))

  if (paymentForm.amount && paymentForm.amount > 0) {
    form.paid_price = form.total_price - (form.total_price - paymentForm.amount)
  }

  if (individualForm.value.id) {
    form.individual_id = individualForm.value.id
  }
})

export {
  form,
  orderlinesForm,
  deliveryForm,
  individualForm,
  paymentForm,
  consumerType,
  cleanForm,
  resetForm,
  resetPayment
}
