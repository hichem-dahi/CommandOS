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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isString } from 'lodash'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import { useUpsertOrdersDb } from '@/composables/db/orders/useUpsertOrdersDb'
import { useUpsertDeliveriesDb } from '@/composables/db/deliveries/useUpsertDeliveriesDb'
import { useUpsertOrderlinesDb } from '@/composables/db/orderlines/useUpsertOrderlinesDb'
import { useUpsertPaymentsDb } from '@/composables/db/payments/useUpsertPaymentsDb'
import { useUpsertIndividualsDb } from '@/composables/db/individuals/useUpsertIndividualsDb'

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
import { DocumentType, type Individual, type Organization } from '@/models/models'
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

const upsertOrdersDb = useUpsertOrdersDb()
const upsertDeliveriesDb = useUpsertDeliveriesDb()
const upsertIndividualsDb = useUpsertIndividualsDb()
const upsertOrderlinesDb = useUpsertOrderlinesDb()
const upsertPaymentDb = useUpsertPaymentsDb()

const organizationsQuery = useLiveQuery('SELECT * FROM public.organizations;', [])
const individualsQuery = useLiveQuery('SELECT * FROM public.individuals;', [])

const individuals = computed(() => individualsQuery.rows.value as unknown as Individual[])
const organizations = computed(() => organizationsQuery.rows.value as unknown as Organization[])

const step = ref(Steps.SelectConsumer)

const consumerPicked = computed(() => route.query.consumer)

const isLoading = computed(
  () =>
    upsertOrdersDb.isLoading.value ||
    upsertDeliveriesDb.isLoading.value ||
    upsertIndividualsDb.isLoading.value ||
    upsertOrderlinesDb.isLoading.value
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
      upsertOrdersDb.form.value = [{ ...(form as TablesInsert<'orders'>), _synced: false }]
      if (form.document_type === DocumentType.DeliveryNote) {
        upsertDelivery(deliveryForm.value)
      }

      if (individualForm.value && !upsertOrdersDb.form.value[0].individual_id) {
        const { id, ...form } = individualForm.value
        if (form.org_id) upsertIndividual(form as TablesInsert<'individuals'>)
        return
      }
      upsertOrdersDb.execute()

      return
    }

    step.value++
  }
}

const isReadyUpsertOrdersDb = computed(() => {
  const deliveryId = upsertDeliveriesDb.data.value?.[0]?.id
  const deliveryFormId = upsertOrdersDb.form.value?.[0]?.delivery_id
  const individualId = upsertIndividualsDb.data.value?.[0]?.id
  const individualFormId = upsertOrdersDb.form.value?.[0]?.individual_id

  // Check if `delivery_id` is required
  const isDeliveryValid = deliveryId ? !!deliveryFormId : true

  // Check if `individual_id` is required
  const isIndividualValid = individualId ? !!individualFormId : true

  // Return true only if both conditions are satisfied
  return isDeliveryValid && isIndividualValid
})

watch(
  () => upsertDeliveriesDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && upsertDeliveriesDb.data.value?.[0]) {
      Object.assign({}, upsertOrdersDb.form.value?.[0], {
        delivery_id: upsertDeliveriesDb.data.value?.[0].id
      })
    }
  }
)

watch(
  () => upsertIndividualsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && upsertIndividualsDb.data.value) {
      if (upsertOrdersDb.form.value?.[0]) {
        Object.assign({}, upsertOrdersDb.form.value?.[0], {
          individual_id: upsertIndividualsDb.data.value[0].id
        })
      }
    }
  }
)

watch(isReadyUpsertOrdersDb, (isReady) => {
  if (isReady) upsertOrdersDb.execute()
})

watch(
  () => upsertOrdersDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && upsertOrdersDb.data.value?.[0].id) {
      upsertOrderlines(orderlinesForm.value)
      if (paymentForm?.amount) {
        const amount = Number(paymentForm.amount) // Default to 0 if conversion fails
        const order_id = upsertOrdersDb.data.value?.[0].id
        upsertPayment({ ...paymentForm, order_id, amount })
      }
      resetForm()
      resetPayment()
    }
  }
)

watch(
  [() => upsertOrderlinesDb.isSuccess.value, () => upsertPaymentDb.isSuccess.value],
  (isSuccess1, isSuccess2) => {
    const isSuccess2Valid = upsertPaymentDb.data.value?.[0].id ? isSuccess2 : true
    if (isSuccess1 && isSuccess2Valid) {
      router.go(-1)
    }
  }
)

function upsertPayment(form: TablesInsert<'payments'>) {
  upsertPaymentDb.form.value = [
    {
      ...form,
      _synced: false
    }
  ]
  upsertPaymentDb.execute()
}

function upsertIndividual(form: TablesInsert<'individuals'>) {
  upsertIndividualsDb.form.value = [{ ...form, _synced: false }]
  upsertIndividualsDb.execute()
}

function upsertOrderlines(form: TablesInsert<'order_lines'>[]) {
  upsertOrderlinesDb.form.value = form.map((o) => ({
    ...o,
    order_id: upsertOrdersDb.data.value?.[0].id || '',
    _synced: false
  }))
  upsertOrderlinesDb.execute()
}

function upsertDelivery(delivery: TablesInsert<'deliveries'>) {
  upsertDeliveriesDb.form.value = [{ ...delivery, _synced: false }]
  upsertDeliveriesDb.execute()
}
</script>
