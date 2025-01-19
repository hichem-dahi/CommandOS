<template>
  <div class="d-flex justify-center align-center" style="height: 100vh">
    <div
      class="inner text-center pa-12"
      :class="{ 'w-33': $vuetify.display.lgAndUp, 'w-100': !$vuetify.display.lgAndUp }"
    >
      <div class="w-100 text-center py-12">
        <img class="mx-auto mb-4" src="/logo-cropped.png" height="80" alt="logo" />
      </div>
      <div v-if="step === Steps.SendEmail">
        <v-text-field label="email" v-model.trim="form.email" />
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import self from '@/composables/localStore/useSelf'

import { useSignUpApi } from '@/composables/api/auth/useSignUpApi'
import { useVerifyCodeApi } from '@/composables/api/auth/useVerifyOtpApi'

import { useUpdateProfileApi } from '@/composables/api/auth/useUpdateProfileApi'
import { useGetProfileApi } from '@/composables/api/auth/useGetProfileApi'

enum Steps {
  SendEmail = 1,
  SendCode,
  FillUserForm
}

const router = useRouter()

const step = ref(Steps.SendEmail)

const signUpApi = useSignUpApi()
const veryifyOtpApi = useVerifyCodeApi()
const getProfileApi = useGetProfileApi()
const updateProfileApi = useUpdateProfileApi()

const form = reactive({
  email: '',
  code: '',
  full_name: '',
  phone: ''
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
  signUpApi.params.email = form.email.toLowerCase()
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

    if (isSuccess && !full_name) {
      step.value = Steps.FillUserForm
    } else if (isSuccess && full_name) {
      router.push({ name: 'organizations' })
    }
  }
)

watch(
  () => updateProfileApi.isSuccess.value,
  (isSuccess) => {
    const full_name = updateProfileApi.data.value?.full_name
    if (isSuccess && full_name) {
      router.push({ name: 'organizations' })
    }
  }
)
</script>
