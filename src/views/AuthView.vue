<template>
  <div class="d-flex justify-center align-center pa-4" style="height: 100vh">
    <div
      class="inner"
      :class="{ 'w-33': $vuetify.display.lgAndUp, 'w-100': !$vuetify.display.lgAndUp }"
    >
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

        <v-btn block :loading="updateProfileApi.isLoading.value" @click="submitProfile">
          {{ $t('confirm') }}
        </v-btn>
      </div>
      <div v-else-if="step === Steps.SelectOrganization">
        <v-card class="pa-4" :title="$t('pick-organization')">
          <v-list
            :items="organizationsItems"
            item-title="name"
            item-value="id"
            link
            @update:selected="setCurrentOrg"
          />
          <v-list-item
            :append-icon="mdiPlus"
            subtitle="Creé une organization"
            @click="step = Steps.FillOrganizationForm"
          ></v-list-item>
        </v-card>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import useVuelidate from '@vuelidate/core'

import self from '@/composables/localStore/useSelf'

import { useSignUpApi } from '@/composables/api/auth/useSignUpApi'
import { useVerifyCodeApi } from '@/composables/api/auth/useVerifyOtpApi'

import { useUpdateProfileApi } from '@/composables/api/auth/useUpdateProfileApi'
import { useGetProfileApi } from '@/composables/api/auth/useGetProfileApi'

import { useInsertOrganizationApi } from '@/composables/api/organizations/useInsertOrganizationApi'

import ClientForm from './ClientsView/ClientForm.vue'
import { mdiPlus } from '@mdi/js'

enum Steps {
  SendEmail = 1,
  SendCode,
  FillUserForm,
  SelectOrganization,
  FillOrganizationForm
}

const router = useRouter()

const step = ref(Steps.SendEmail)

const signUpApi = useSignUpApi()
const veryifyOtpApi = useVerifyCodeApi()
const updateProfileApi = useUpdateProfileApi()
const getProfileApi = useGetProfileApi()
const insertOrganizationApi = useInsertOrganizationApi()

const organizations = computed(() => getProfileApi.data.value?.organizations || [])

const organizationsItems = computed(() => {
  return organizations.value.flatMap((item) => [item, { type: 'divider', inset: true }])
})

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
  activity: '',
  user_id: ''
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
    insertOrganizationApi.form.value = {
      ...organizationForm.value,
      user_id: self.value.session?.user.id
    }
    insertOrganizationApi.execute()
  }
}

function setCurrentOrg(e: unknown) {
  self.value.current_org = organizations.value?.find((o) => o.id === e[0])
  router.push({
    name: 'home'
  })
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
      getProfileApi.userId.value = veryifyOtpApi.data.value?.user?.id
      getProfileApi.execute()
    }
  }
)

watch(
  () => getProfileApi.isSuccess.value,
  (isSuccess) => {
    const full_name = getProfileApi.data.value?.full_name
    const atlest_one_organization_id = getProfileApi.data.value?.organizations[0]

    if (isSuccess && full_name && atlest_one_organization_id) {
      step.value = Steps.SelectOrganization
    } else if (isSuccess && full_name && !atlest_one_organization_id) {
      step.value = Steps.FillOrganizationForm
    } else if (isSuccess && !full_name) {
      step.value = Steps.FillUserForm
    }
  }
)

watch(
  () => insertOrganizationApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      getProfileApi.execute()
    }
  }
)

watch(
  () => updateProfileApi.isSuccess.value,
  (isSuccess) => {
    const organization = updateProfileApi.data.value?.organizations[0]
    if (isSuccess && !organization) {
      step.value = Steps.FillOrganizationForm
    } else if (isSuccess && organization) {
      step.value = Steps.SelectOrganization
    }
  }
)
</script>
