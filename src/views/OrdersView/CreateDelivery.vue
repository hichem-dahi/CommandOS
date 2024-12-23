<template>
  <div>
    <!-- Driver Name Field with Error Messages -->
    <v-text-field
      :label="$t('driver')"
      density="compact"
      v-model="form.driver_name"
      :error="!v$.driver_name.$pending && v$.driver_name.$error"
      @blur="v$.driver_name.$touch()"
    />

    <!-- Phone Field with Error Messages -->
    <v-text-field
      :label="$t('phone')"
      density="compact"
      v-model="form.phone"
      :error="!v$.phone.$pending && v$.phone.$error"
      @blur="v$.phone.$touch()"
    />

    <!-- license_plate Field with Error Messages -->
    <v-text-field
      :label="$t('registration-number')"
      density="compact"
      v-model="form.license_plate"
      :error="!v$.license_plate.$pending && v$.license_plate.$error"
      @blur="v$.license_plate.$touch()"
    />

    <!-- Destination Field with Error Messages -->
    <v-text-field
      :label="$t('destination')"
      density="compact"
      v-model="form.destination"
      :error="!v$.destination.$pending && v$.destination.$error"
      @blur="v$.destination.$touch()"
    />
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import useVuelidate from '@vuelidate/core'
import { minLength, numeric, required } from '@vuelidate/validators'

const form = defineModel('delivery', {
  required: true,
  default: {
    driver_name: '',
    phone: '' as string | null,
    license_plate: '',
    destination: ''
  }
})

const rules = {
  driver_name: { required, minLength: minLength(3) },
  phone: {
    numeric,
    minLength: minLength(10)
  },
  license_plate: { required, minLength: minLength(6) },
  destination: { required, minLength: minLength(3) }
}

const v$ = useVuelidate(
  rules,
  toRef(() => form.value)
)
</script>
