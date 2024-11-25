<template>
  <div class="w-100 mx-auto">
    <v-row justify="center">
      <v-col sm="12" md="6">
        <ClientForm v-model="form" :title="$t('create-client')">
          <template v-slot:actions>
            <v-btn block @click="submitForm()">{{ $t('confirm') }}</v-btn>
          </template>
        </ClientForm>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'

import { useInsertOrganizationApi } from '@/composables/api/organizations/useInsertOrganizationApi'

import ClientForm from './ClientForm.vue'
import self from '@/composables/localStore/useSelf'

const router = useRouter()

const insertOrganizationApi = useInsertOrganizationApi()

const $v = useVuelidate()

const form = ref({
  name: '',
  phone: '',
  rc: '',
  nif: null as number | null,
  nis: null as number | null,
  art: null as number | null,
  address: '',
  activity: '',
  org_id: ''
})

function submitForm() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    insertOrganizationApi.form.value = { ...form.value, org_id: self.value.user?.organization_id }
    insertOrganizationApi.execute()
  }
}

watch(
  () => insertOrganizationApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      router.go(-1)
    }
  }
)
watch(
  () => insertOrganizationApi.error.value,
  (error) => {}
)
</script>
