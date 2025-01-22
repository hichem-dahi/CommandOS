<template>
  <div class="w-100 mx-auto">
    <v-row justify="center">
      <v-col sm="12" md="5">
        <v-card class="pa-4" elevation="1">
          <template v-slot:title>
            {{ $t('profile') }}
          </template>
          <v-text-field :label="$t('name')" v-model="userForm.full_name" />
          <v-text-field :label="$t('phone')" v-model="userForm.phone" />

          <v-btn block :loading="updateProfileApi.isLoading.value" @click="submitProfile">
            {{ $t('confirm') }}
          </v-btn>
        </v-card>
      </v-col>
      <v-col sm="12" md="5">
        <ClientForm v-model="organizationForm" :title="$t('your-informations')">
          <template v-slot:actions>
            <v-btn
              block
              :loading="upsertOrganizationsApi.isLoading.value"
              @click="submitNewProfile()"
            >
              {{ $t('confirm') }}
            </v-btn>
          </template>
        </ClientForm>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive, watch, watchEffect } from 'vue'
import useVuelidate from '@vuelidate/core'

import self from '@/composables/localStore/useSelf'

import { useUpdateProfileApi } from '@/composables/api/auth/useUpdateProfileApi'
import { useUpsertOrganizationsApi } from '@/composables/api/organizations/useUpsertOrganizationsApi'

import ClientForm from './ClientsView/ClientForm.vue'
import type { Tables } from '@/types/database.types'

const $v = useVuelidate()

const userForm = reactive({
  full_name: '',
  phone: ''
})

const organizationForm = reactive({
  name: '',
  phone: '',
  rc: '',
  nif: null as number | null,
  nis: null as number | null,
  art: null as number | null,
  address: '',
  activity: ''
})

const updateProfileApi = useUpdateProfileApi()
const upsertOrganizationsApi = useUpsertOrganizationsApi()

watchEffect(() => {
  Object.assign(userForm, {
    full_name: self.value.user?.full_name,
    phone: self.value.user?.phone
  })
  Object.assign(organizationForm, self.value.current_org)
})

function submitProfile() {
  updateProfileApi.form.value = {
    id: self.value.user?.id,
    full_name: userForm.full_name,
    phone: userForm.phone
  }
  updateProfileApi.execute()
}

function submitNewProfile() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    upsertOrganizationsApi.form.value = [organizationForm] as Tables<'organizations'>[]
    upsertOrganizationsApi.execute()
  }
}

watch(
  () => upsertOrganizationsApi.isSuccess.value,
  (isSuccess) => {
    const org = upsertOrganizationsApi.data.value?.[0]
    if (isSuccess && org?.id && self.value.user) {
      self.value.current_org = org
    }
  }
)
</script>
