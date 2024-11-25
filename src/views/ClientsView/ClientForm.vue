<template>
  <v-card :title="title" class="pa-4">
    <v-text-field
      :label="$t('name')"
      v-model="model.name"
      :error-messages="
        !$v.name.$pending && $v.name.$error
          ? [
              $v.name.$invalid ? 'Name is required' : '',
              $v.name.minLength.$invalid ? 'Name must be at least 3 characters' : ''
            ].filter(Boolean)
          : []
      "
      @blur="$v.name.$touch()"
    />
    <v-text-field
      :label="$t('phone')"
      v-model.trim="model.phone"
      :error-messages="
        !$v.phone.$pending && $v.phone.$error
          ? [
              $v.phone.$invalid ? 'Phone is required' : '',
              $v.phone.numeric.$invalid ? 'Phone must be numeric' : '',
              $v.phone.minLength.$invalid ? 'Phone must be at least 10 digits' : ''
            ].filter(Boolean)
          : []
      "
      @blur="$v.phone.$touch()"
    />
    <v-text-field :label="$t('R.C')" v-model.trim="model.rc" />
    <v-text-field :label="$t('NIF')" v-model.trim="model.nif" />
    <v-text-field :label="$t('NIS')" v-model.trim="model.nis" />
    <v-text-field :label="$t('N.ART')" v-model.trim="model.art" />
    <v-text-field :label="$t('address')" v-model.trim="model.address" />
    <v-text-field :label="$t('activity')" v-model.trim="model.activity" />

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
</script>
