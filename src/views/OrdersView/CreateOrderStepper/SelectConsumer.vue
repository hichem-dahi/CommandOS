<template>
  <div class="pa-4">
    <v-radio-group v-model="consumerType">
      <v-radio :label="$t('company')" :value="ConsumerType.Organization" />
      <v-radio :label="$t('individual')" :value="ConsumerType.Individual" />
    </v-radio-group>

    <div v-if="consumerType == ConsumerType.Individual && individualForm">
      <v-combobox
        :label="$t('name')"
        :items="individuals"
        :error="!v2$.name.$pending && v2$.name.$error"
        v-model="individualForm.name"
        :item-props="itemProps"
        @update:model-value="handleCustomerChange"
      />
      <v-text-field
        :label="$t('phone')"
        :error="!v2$.phone.$pending && v2$.phone.$error"
        v-model="individualForm.phone"
      />
    </div>
    <v-select
      v-else-if="consumerType == ConsumerType.Organization"
      :label="$t('client')"
      :items="organizationsItems"
      :error="!v1$.$pending && v1$.$error"
      item-title="name"
      item-value="id"
      v-model="form.client_id"
    />
  </div>
  <slot name="actions" :v="v$"></slot>
</template>

<script setup lang="ts">
import { computed, reactive, toRef } from 'vue'
import { isString } from 'lodash'
import useVuelidate from '@vuelidate/core'
import { minLength, numeric, required } from '@vuelidate/validators'

import { ConsumerType } from '@/models/models'
import type { Tables, TablesInsert } from '@/types/database.types'

import { form, consumerType, individualForm } from './state'

const props = defineProps<{
  readonly individuals: ReadonlyArray<Tables<'individuals'>>
  readonly clients: ReadonlyArray<Tables<'organizations'>>
}>()

const model = defineModel<TablesInsert<'individuals'>>({ required: true })

const formClient = reactive({
  client_id: toRef(() => form.client_id)
})

const rules1 = {
  client_id: {
    required
  }
}

const rules2 = {
  name: {
    required
  },
  phone: {
    numeric,
    minLength: minLength(10)
  }
}

// Initialize the Vuelidate validation instance
const v1$ = useVuelidate(rules1, formClient)

const v2$ = useVuelidate(
  rules2,
  toRef(() => model.value)
)

const v$ = computed(() =>
  consumerType.value === ConsumerType.Organization ? v1$.value : v2$.value
)

const organizationsItems = computed(() =>
  props.clients.map((c) => {
    return { id: c.id, name: c.name }
  })
)

const itemProps = (item: any) => {
  if (isString(item)) return item
  return {
    title: item.name,
    subtitle: item.phone
  }
}

function handleCustomerChange(item: any) {
  if (!individualForm.value) return

  individualForm.value.name = ''
  individualForm.value.phone = ''

  const existingIndividual = item?.id
    ? props.individuals.find((individual) => individual.id === item.id)
    : null

  if (existingIndividual) {
    individualForm.value = { ...existingIndividual }
  } else if (isString(item)) {
    individualForm.value.name = item
  }
}
</script>
