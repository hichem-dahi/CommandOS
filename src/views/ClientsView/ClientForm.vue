<template>
  <v-card :title="title" class="pa-4">
    <v-text-field
      density="compact"
      :label="$t('name')"
      v-model="model.name"
      :error-messages="getErrorMessages('name')"
      @blur="$v.name.$touch()"
    />
    <v-text-field
      density="compact"
      :label="$t('phone')"
      v-model.trim="model.phone"
      :error-messages="getErrorMessages('phone')"
      @blur="$v.phone.$touch()"
    />
    <v-text-field density="compact" :label="$t('R.C')" v-model.trim="model.rc" />
    <v-text-field
      density="compact"
      :label="$t('NIF')"
      v-model.trim="model.nif"
      :error-messages="getErrorMessages('nif')"
    />
    <v-text-field
      density="compact"
      :label="$t('NIS')"
      v-model.trim="model.nis"
      :error-messages="getErrorMessages('nis')"
    />
    <v-text-field
      density="compact"
      :label="$t('N.ART')"
      v-model.trim="model.art"
      :error-messages="getErrorMessages('art')"
    />
    <v-text-field
      density="compact"
      :label="$t('address')"
      v-model.trim="model.address"
      :error-messages="getErrorMessages('address')"
    />
    <v-text-field density="compact" :label="$t('activity')" v-model.trim="model.activity" />

    <!-- Pass the form and validation as slot props -->
    <slot name="actions"></slot>
  </v-card>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import useVuelidate from '@vuelidate/core'
import { required, minLength, numeric } from '@vuelidate/validators'

const props = defineProps<{ title: string }>()

//TODO: review default model usage
const model = defineModel({
  default: {
    name: '',
    phone: '',
    rc: '',
    nif: null as number | null,
    nis: null as number | null,
    art: null as number | null,
    address: '',
    activity: ''
  }
})

const rules = {
  name: { required, minLength: minLength(3) },
  phone: { required, minLength: minLength(10), numeric },
  nif: { numeric },
  nis: { numeric },
  art: { numeric },
  address: { minLength: minLength(10) }
}

const $v = useVuelidate(
  rules,
  toRef(() => model.value)
)

const getErrorMessages = (field: string) => {
  const v = $v.value[field]
  return !v.$pending && v.$error
    ? [
        v.required?.$invalid ? `${field} is required` : '',
        v.numeric?.$invalid ? `${field} must be numeric` : '',
        v.minLength?.$invalid ? `${field} must be at least 3 digits` : ''
      ].filter(Boolean)
    : []
}
</script>
