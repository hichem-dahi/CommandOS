<template>
  <v-stepper v-model="step">
    <template v-slot:default>
      <v-stepper-header>
        <template v-for="n in numericSteps" :key="`${n}-step`">
          <div v-if="n == Steps.SelectConsumer && consumerPicked ? false : true">
            <v-stepper-item :complete="step > n" :step="`Step {{ n }}`" :value="n">
            </v-stepper-item>

            <v-divider v-if="n !== numericSteps[numericSteps.length - 1]" :key="n" />
          </div>
        </template>
      </v-stepper-header>

      <v-stepper-window>
        <form>
          <!-- Step 1: SelectConsumer - Only displayed if no consumer in route query -->
          <v-stepper-window-item :value="Steps.SelectConsumer">
            <SelectConsumer :individuals="individuals" :clients="organizations">
              <template v-slot:actions="{ v }">
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn @click="nextStep(v)">{{ $t('next') }}</v-btn>
                </v-card-actions>
              </template>
            </SelectConsumer>
          </v-stepper-window-item>

          <!-- Step 2: CreateOrder -->
          <v-stepper-window-item :value="Steps.CreateOrder">
            <CreateOrderlines>
              <template v-slot:actions="{ v }">
                <v-card-actions>
                  <v-btn v-if="!consumerPicked" @click="step--">{{ $t('back') }}</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn @click="nextStep(v)">{{ $t('next') }}</v-btn>
                </v-card-actions>
              </template>
            </CreateOrderlines>
          </v-stepper-window-item>

          <!-- Step 3: ExtraInfo -->
          <v-stepper-window-item :value="Steps.ExtraInfo">
            <ExtraInfo>
              <template v-slot:actions="{ v }">
                <v-card-actions>
                  <v-btn @click="step--">{{ $t('back') }}</v-btn>
                  <v-spacer></v-spacer>
                  <v-btn :loading="isLoading" @click="nextStep(v)">
                    {{ $t('confirm') }}
                  </v-btn>
                </v-card-actions>
              </template>
            </ExtraInfo>
          </v-stepper-window-item>
        </form>
      </v-stepper-window>
    </template>
  </v-stepper>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isString } from 'lodash'

import { useInsertOrderApi } from '@/composables/api/orders/useInsertOrderApi'
import { useInsertDeliveryApi } from '@/composables/api/deliveries/useInsertDeliveryApi'
import { useInsertIndividualApi } from '@/composables/api/individuals/useInsertIndividualApi'
import { useInsertOrderlinesApi } from '@/composables/api/orderlines/useInsertOrderlinesApi'
import { useInsertPaymentsApi } from '@/composables/api/payments/useInsertPaymentApi'

import { useGetIndividualsApi } from '@/composables/api/individuals/useGetIndividualsApi'
import { useGetOrganizationsApi } from '@/composables/api/organizations/useGetOrganizationsApi'

import SelectConsumer from './CreateOrderStepper/SelectConsumer.vue'
import CreateOrderlines from './CreateOrderStepper/CreateOrderlines.vue'
import ExtraInfo from './CreateOrderStepper/ExtraInfo.vue'

import {
  form,
  cleanForm,
  resetForm,
  resetPayment,
  orderlinesForm,
  deliveryForm,
  individualForm,
  paymentForm
} from './CreateOrderStepper/state'

import type { Validation } from '@vuelidate/core'
import { DocumentType } from '@/models/models'
import type { TablesInsert } from '@/types/database.types'

enum Steps {
  SelectConsumer = 1,
  CreateOrder,
  ExtraInfo
}

const numericSteps: Steps[] = Object.values(Steps).filter(
  (value) => typeof value === 'number'
) as Steps[]

defineEmits(['success'])

const route = useRoute()
const router = useRouter()

const insertOrderApi = useInsertOrderApi()
const insertDeliveryApi = useInsertDeliveryApi()
const insertIndividualApi = useInsertIndividualApi()
const insertOrderlinesApi = useInsertOrderlinesApi()
const insertPaymentApi = useInsertPaymentsApi()
const getOrganizationsApi = useGetOrganizationsApi()
const getIndividualsApi = useGetIndividualsApi()
getOrganizationsApi.execute()
getIndividualsApi.execute()

const step = ref(Steps.SelectConsumer)

const organizations = computed(() => getOrganizationsApi.data.value || [])
const individuals = computed(() => getIndividualsApi.data.value || [])

const consumerPicked = computed(() => route.query.consumer)

const isLoading = computed(
  () =>
    insertOrderApi.isLoading.value ||
    insertDeliveryApi.isLoading.value ||
    insertIndividualApi.isLoading.value ||
    insertOrderlinesApi.isLoading.value
)

onMounted(() => {
  const consumer = route.query.consumer

  if (isString(consumer)) {
    // Check if the consumer is a company
    const organization = organizations.value.find((c) => c.id === consumer)
    if (organization) {
      form.org_id = organization.id
    } else {
      // Check if the consumer is an individual
      const individual = individuals.value.find((i) => i.id === consumer)
      if (individual) {
        individualForm.value = individual
      }
    }

    // Skip "SelectConsumer" step and start from step 2
    step.value = Steps.CreateOrder
  }
})

function nextStep(v: Validation) {
  v.$touch()
  if (!v.$invalid) {
    if (step.value === Steps.ExtraInfo) {
      cleanForm()
      insertOrderApi.form.value = { ...(form as TablesInsert<'orders'>) }
      if (form.document_type === DocumentType.DeliveryNote) {
        insertDelivery(deliveryForm.value)
      }

      if (individualForm.value && !insertOrderApi.form.value.individual_id) {
        const { id, ...form } = individualForm.value
        if (form.org_id) insertIndividual(form as TablesInsert<'individuals'>)
        return
      }
      insertOrderApi.execute()

      return
    }

    step.value++
  }
}

const isReadyInsertOrderApi = computed(() => {
  const deliveryId = insertDeliveryApi.data.value?.id
  const deliveryFormId = insertOrderApi.form.value?.delivery_id
  const individualId = insertIndividualApi.data.value?.id
  const individualFormId = insertOrderApi.form.value?.individual_id

  // Check if `delivery_id` is required
  const isDeliveryValid = deliveryId ? !!deliveryFormId : true

  // Check if `individual_id` is required
  const isIndividualValid = individualId ? !!individualFormId : true

  // Return true only if both conditions are satisfied
  return isDeliveryValid && isIndividualValid
})

watch(
  () => insertDeliveryApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && insertDeliveryApi.data.value) {
      Object.assign(insertOrderApi.form.value!, {
        delivery_id: insertDeliveryApi.data.value.id
      })
    }
  }
)

watch(
  () => insertIndividualApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && insertIndividualApi.data.value) {
      if (insertOrderApi.form.value) {
        Object.assign(insertOrderApi.form.value, {
          individual_id: insertIndividualApi.data.value.id
        })
      }
    }
  }
)

watch(isReadyInsertOrderApi, (isReady) => {
  if (isReady) insertOrderApi.execute()
})

watch(
  () => insertOrderApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && insertOrderApi.data.value?.id) {
      insertOrderlines(orderlinesForm.value)
      if (paymentForm?.amount) {
        const amount = Number(paymentForm.amount) // Default to 0 if conversion fails
        const order_id = insertOrderApi.data.value?.id
        insertPayment({ ...paymentForm, order_id, amount })
      }
      resetForm()
      resetPayment()
    }
  }
)

watch(
  [() => insertOrderlinesApi.isSuccess.value, () => insertPaymentApi.isSuccess.value],
  (isSuccess1, isSuccess2) => {
    const isSuccess2Valid = insertPaymentApi.data.value?.id ? isSuccess2 : true
    if (isSuccess1 && isSuccess2Valid) {
      router.go(-1)
    }
  }
)
function insertPayment(form: TablesInsert<'payments'>) {
  insertPaymentApi.form.value = {
    ...form
  }
  insertPaymentApi.execute()
}

function insertIndividual(form: TablesInsert<'individuals'>) {
  insertIndividualApi.form.value = { ...form }
  insertIndividualApi.execute()
}

function insertOrder() {
  insertOrderApi.execute()
}

function insertOrderlines(form: TablesInsert<'order_lines'>[]) {
  insertOrderlinesApi.form.value = form.map((o) => ({
    ...o,
    order_id: insertOrderApi.data.value?.id || ''
  }))
  insertOrderlinesApi.execute()
}

function insertDelivery(delivery: TablesInsert<'deliveries'>) {
  insertDeliveryApi.form.value = { ...delivery }
  insertDeliveryApi.execute()
}
</script>
