<template>
  <v-stepper v-model="step">
    <template v-slot:default>
      <v-stepper-header>
        <template v-for="n in numericSteps" :key="`${n}-step`">
          <div>
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
            <SelectConsumer
              v-if="individualForm"
              v-model="individualForm"
              :individuals="individuals"
              :clients="organizations"
            >
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
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import self from '@/composables/localStore/useSelf'

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
  resetOrderForm,
  orderlinesForm,
  deliveryForm,
  individualForm,
  paymentForm
} from './CreateOrderStepper/state'

import type { Validation } from '@vuelidate/core'
import type { Tables, TablesInsert } from '@/types/database.types'

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

const organizationsQuery = useLiveQuery<Tables<'organizations'>>(
  'SELECT * FROM public.organizations WHERE _deleted = false AND org_id = $1;',
  [self.value.current_org?.id]
)

const individualsQuery = useLiveQuery<Tables<'individuals'>>(
  'SELECT * FROM public.individuals WHERE _deleted = false AND org_id = $1;',
  [self.value.current_org?.id]
)

const individuals = computed(() => individualsQuery.rows.value || [])
const organizations = computed(() => organizationsQuery.rows.value || [])

const step = ref(Steps.SelectConsumer)

const consumerPicked = computed(() => route.query.client_id || route.query.individual_id)

const isLoading = computed(
  () =>
    upsertOrdersDb.isLoading.value ||
    upsertDeliveriesDb.isLoading.value ||
    upsertIndividualsDb.isLoading.value ||
    upsertOrderlinesDb.isLoading.value
)

watchEffect(() => {
  const client_id = route.query.client_id
  const individual_id = route.query.individual_id

  const organization = organizations.value?.find((c) => c.id === client_id)
  const individual = individuals.value?.find((i) => i.id === individual_id)

  if (organization) {
    form.client_id = organization.id
    step.value = Steps.CreateOrder
  } else if (individual) {
    individualForm.value = individual
    step.value = Steps.CreateOrder
  }
})

function nextStep(v: Validation) {
  v.$touch()
  if (!v.$invalid) {
    if (step.value === Steps.ExtraInfo) {
      cleanForm()
      upsertOrdersDb.form.value = [{ ...form, _synced: false }]
      upsertDelivery(deliveryForm.value)
      upsertIndividual(individualForm.value)
      return
    }

    step.value++
  }
}

const isReadyUpsertOrdersDb = computed(
  () => upsertIndividualsDb.isReady.value && upsertDeliveriesDb.isReady.value
)

watch(isReadyUpsertOrdersDb, (isReady) => {
  if (isReady && upsertOrdersDb.form.value?.[0]) {
    if (upsertIndividualsDb.data.value?.[0]) {
      upsertOrdersDb.form.value[0].individual_id = upsertIndividualsDb.data.value[0].id
    }
    if (upsertDeliveriesDb.data.value?.[0]) {
      upsertOrdersDb.form.value[0].delivery_id = upsertDeliveriesDb.data.value[0].id
    }
    upsertOrdersDb.execute()
  }
})

watch(
  () => upsertOrdersDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && upsertOrdersDb.data.value?.[0].id) {
      upsertOrderlines(orderlinesForm.value)
      if (paymentForm.amount > 0) {
        const amount = Number(paymentForm.amount)
        const order_id = upsertOrdersDb.data.value?.[0].id
        upsertPayment({ ...paymentForm, order_id, amount })
      }
      resetOrderForm()
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

function upsertPayment(form?: TablesInsert<'payments'>) {
  if (form)
    upsertPaymentDb.form.value = [
      {
        ...form,
        _synced: false
      }
    ]
  upsertPaymentDb.execute()
}

function upsertIndividual(form?: TablesInsert<'individuals'>) {
  if (form) upsertIndividualsDb.form.value = [{ ...form, _synced: false }]
  upsertIndividualsDb.execute()
}

function upsertOrderlines(form?: TablesInsert<'order_lines'>[]) {
  if (form)
    upsertOrderlinesDb.form.value = form.map((o) => ({
      ...o,
      order_id: upsertOrdersDb.data.value?.[0].id || '',
      _synced: false
    }))
  upsertOrderlinesDb.execute()
}

function upsertDelivery(form?: TablesInsert<'deliveries'>) {
  if (form) upsertDeliveriesDb.form.value = [{ ...form, _synced: false }]
  upsertDeliveriesDb.execute()
}
</script>
