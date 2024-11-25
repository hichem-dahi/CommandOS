<template>
  <div class="d-flex justify-center align-center pa-4" style="height: 100vh">
    <div class="inner flex-grow-1">
      <div v-if="step === Steps.SendEmail">
        <v-text-field label="email" v-model="form.email" />
        <v-btn block :loading="signUpApi.isLoading.value" @click="submitEmail">
          {{ $t('confirm') }}
        </v-btn>
      </div>
      <div v-else-if="step === Steps.SendCode">
        <v-otp-input label="code" v-model="form.code" />
        <v-btn block :loading="veryifyOtpApi.isLoading.value" @click="submitCode">
          {{ $t('confirm') }}
        </v-btn>
      </div>
      <div v-else-if="step === Steps.FillUserForm">
        <v-text-field :label="$t('name')" v-model="form.full_name" />
        <v-text-field :label="$t('phone')" v-model="form.phone" />

        <v-btn block :loading="updateProfileApi.isLoading.value" @click="submitProfile">{{
          $t('confirm')
        }}</v-btn>
      </div>
      <div v-else-if="step === Steps.FillOrganizationForm">
        <ClientForm :title="$t('your-informations')" v-model="organizationForm">
          <template v-slot:actions>
            <v-btn
              block
              :loading="insertOrganizationApi.isLoading.value"
              @click="submitOrganization"
              >{{ $t('confirm') }}
            </v-btn>
          </template>
        </ClientForm>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import useVuelidate from '@vuelidate/core'

import self from '@/composables/localStore/useSelf'

import { useSignUpApi } from '@/composables/api/auth/useSignUpApi'
import { useVerifyCodeApi } from '@/composables/api/auth/useVerifyOtpApi'
import { useUpdateProfileApi } from '@/composables/api/auth/useUpdateProfileApi'
import { useGetProfileApi } from '@/composables/api/auth/useGetProfileApi'
import { useInsertOrganizationApi } from '@/composables/api/organizations/useInsertOrganizationApi'

import ClientForm from './ClientsView/ClientForm.vue'

enum Steps {
  SendEmail = 1,
  SendCode,
  FillUserForm,
  FillOrganizationForm
}

const router = useRouter()

const step = ref(Steps.SendEmail)

const signUpApi = useSignUpApi()
const veryifyOtpApi = useVerifyCodeApi()
const updateProfileApi = useUpdateProfileApi()
const getProfileApi = useGetProfileApi()
const insertOrganizationApi = useInsertOrganizationApi()

const $v = useVuelidate()

const form = reactive({
  email: '',
  code: '',
  full_name: '',
  phone: ''
})

const organizationForm = ref({
  name: '',
  phone: '',
  rc: '',
  nif: null as number | null,
  nis: null as number | null,
  art: null as number | null,
  address: '',
  activity: ''
})

onMounted(() => {
  const session = self.value.session
  if (session?.user) {
    step.value = Steps.FillUserForm
    getProfileApi.userId.value = session.user.id
    getProfileApi.execute()
  }
})

function submitEmail() {
  signUpApi.params.email = form.email
  signUpApi.execute()
}

function submitCode() {
  veryifyOtpApi.params.email = form.email
  veryifyOtpApi.params.code = form.code
  veryifyOtpApi.execute()
}

function submitProfile() {
  updateProfileApi.form.value = {
    id: self.value.session?.user.id,
    full_name: form.full_name,
    phone: form.phone
  }
  updateProfileApi.execute()
}

function submitOrganization() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    insertOrganizationApi.form.value = organizationForm.value
    insertOrganizationApi.execute()
  }
}

watch(
  () => signUpApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && step.value == Steps.SendEmail) {
      step.value = Steps.SendCode
    }
  }
)

watch(
  () => veryifyOtpApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && step.value == Steps.SendCode) {
      step.value = Steps.FillUserForm
      getProfileApi.userId.value = veryifyOtpApi.state.value?.data.user?.id
      getProfileApi.execute()
    }
  }
)

watch(
  () => getProfileApi.isSuccess.value,
  (isSuccess) => {
    const full_name = getProfileApi.data.value?.full_name
    const organization_id = getProfileApi.data.value?.organization_id

    if (isSuccess && full_name && organization_id) {
      router.push({ name: 'home' })
    } else if (isSuccess && full_name && !organization_id) {
      step.value = Steps.FillOrganizationForm
    } else if (isSuccess && !full_name) {
      step.value = Steps.FillUserForm
    }
  }
)

watch(
  () => insertOrganizationApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && insertOrganizationApi.data.value) {
      updateProfileApi.form.value = {
        id: self.value.session?.user.id,
        organization_id: insertOrganizationApi.data.value.id
      }
      updateProfileApi.execute()
    }
  }
)

watch(
  () => updateProfileApi.isSuccess.value,
  (isSuccess) => {
    const organization_id = updateProfileApi.data.value?.organization_id
    if (isSuccess && !organization_id) {
      step.value = Steps.FillOrganizationForm
    } else if (isSuccess && organization_id) {
      router.push({ name: 'home' })
    }
  }
)
</script>
