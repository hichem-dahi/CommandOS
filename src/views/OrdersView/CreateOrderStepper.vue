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
            <SelectConsumer :individuals="individuals" :clients="organizations">
              <template v-slot:actions="{ v }">
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn @click="nextStep(v)">{{ $t('next') }}</v-btn>
                </v-card-actions>
              </template>
            </SelectConsumer>
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
import { computed, ref, watch } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import self from '@/composables/localStore/useSelf'

import { useUpsertDeliveriesDb } from '@/composables/db/deliveries/useUpsertDeliveriesDb'
import { useUpsertIndividualsDb } from '@/composables/db/individuals/useUpsertIndividualsDb'

import SelectConsumer from './CreateOrderStepper/SelectConsumer.vue'
import ExtraInfo from './CreateOrderStepper/ExtraInfo.vue'

import {
  form,
  deliveryForm,
  individualForm,
  clientForm,
  consumerType
} from './CreateOrderStepper/state'

import type { Validation } from '@vuelidate/core'
import type { Tables, TablesInsert } from '@/types/database.types'
import { ConsumerType, DocumentType } from '@/models/models'

enum Steps {
  SelectConsumer = 1,
  ExtraInfo
}

const numericSteps: Steps[] = Object.values(Steps).filter(
  (value) => typeof value === 'number'
) as Steps[]

const emits = defineEmits(['success'])

const upsertDeliveriesDb = useUpsertDeliveriesDb()
const upsertIndividualsDb = useUpsertIndividualsDb()

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

const isLoading = computed(
  () => upsertDeliveriesDb.isLoading.value || upsertIndividualsDb.isLoading.value
)

async function nextStep(v: Validation) {
  v.$touch()
  if (!v.$invalid) {
    if (step.value === Steps.ExtraInfo) {
      if (form.document_type === DocumentType.DeliveryNote) {
        const state = await upsertDelivery(deliveryForm.value)
        const deliveryId = state?.rows[0].id
        if (deliveryId) form.delivery_id = deliveryId
      }
      if (consumerType.value === ConsumerType.Organization) {
        if (clientForm.value.id) form.client_id = clientForm.value.id
      } else if (consumerType.value === ConsumerType.Individual) {
        const individualId = await getIndividual(individualForm.value)
        if (individualId) form.individual_id = individualId
      }

      emits('success')
      return
    }
    step.value++
  }
}

async function getIndividual(individual: TablesInsert<'individuals'>): Promise<string | undefined> {
  const existingClient = individuals.value.find(
    (i) => i.name === individual.name || i.id === individual.id
  )
  if (existingClient) {
    return existingClient.id
  } else {
    const state = await upsertIndividual(individual)
    return state?.rows[0].id
  }
}

function upsertIndividual(form?: TablesInsert<'individuals'>) {
  if (form) upsertIndividualsDb.form.value = [{ ...form, _synced: false }]
  return upsertIndividualsDb.execute()
}

function upsertDelivery(form?: TablesInsert<'deliveries'>) {
  if (form) upsertDeliveriesDb.form.value = [{ ...form, _synced: false }]
  return upsertDeliveriesDb.execute()
}

watch(consumerType, (newVal) => {
  if (newVal === ConsumerType.Organization) {
    form.document_type = DocumentType.Invoice
  } else if (newVal === ConsumerType.Individual) {
    form.document_type = DocumentType.Voucher
  }
})
</script>
