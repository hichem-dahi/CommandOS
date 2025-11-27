<template>
  <div class="d-flex justify-center align-center" style="height: 100vh">
    <div
      class="inner text-center pa-12"
      :class="{ 'w-50': $vuetify.display.lgAndUp, 'w-100': !$vuetify.display.lgAndUp }"
    >
      <div class="w-100 text-center py-12">
        <img class="mx-auto mb-4" src="/logo-aes-cropped.png" height="60" alt="logo" />
      </div>
      <v-btn @click="setFreeMode">{{ $t('free-mode') }}</v-btn>
      <v-card class="py-8 px-6 text-center mx-auto ma-4" elevation="2" max-width="400" width="100%">
        <div v-if="step === Steps.SendEmail">
          <h3 class="text-h6 mb-4">{{ $t('Submit Your Email') }}</h3>

          <v-text-field
            :placeholder="$t('email')"
            :prepend-inner-icon="mdiEmailOutline"
            variant="outlined"
            v-model.trim="form.email"
            :error-messages="isError ? signUpApi.state.value?.error?.message : null"
          ></v-text-field>
          <v-btn color="#37474F" block :loading="signUpApi.isLoading.value" @click="submitEmail">
            {{ $t('confirm') }}
          </v-btn>
        </div>

        <div v-else-if="step === Steps.SendCode">
          <h3 class="text-h6 mb-4">{{ $t('Verify Your Account') }}</h3>

          <div class="text-body-2">
            {{ $t('We sent a verification code to') }} {{ form.email }}<br />
          </div>

          <v-sheet color="surface">
            <v-otp-input
              v-model="form.code"
              variant="solo"
              @update:focused="(e) => (e ? pasteOtpFromClipboard : null)"
              :error-messages="isError ? veryifyOtpApi.state.value?.error?.message : null"
            ></v-otp-input>
            <div class="text-red text-caption">
              {{ veryifyOtpApi.state.value?.error?.message }}
            </div>
          </v-sheet>

          <v-btn
            class="my-4"
            color="gray"
            :loading="veryifyOtpApi.isLoading.value"
            @click="submitCode"
          >
            {{ $t('confirm') }}
          </v-btn>

          <div class="text-caption text-medium-emphasis">
            <a v-if="codeTimer === 0" href="#" @click.prevent="submitEmail">{{ $t('Resend') }}</a>
            <span v-else>
              {{ $t('wait-to-resend').replace('xx', codeTimer.toString()) }}
            </span>
          </div>
        </div>

        <div v-else-if="step === Steps.FillUserForm">
          <h3 class="text-h6 mb-4">{{ $t('Complete Your Profile') }}</h3>

          <v-text-field :label="$t('name')" v-model="form.full_name" />
          <v-text-field :label="$t('phone')" v-model="form.phone" />

          <div v-if="isError" class="text-red text-caption">
            {{ updateProfileApi.state.value?.error?.message }}
          </div>
          <v-btn block :loading="updateProfileApi.isLoading.value" @click="submitProfile">
            {{ $t('confirm') }}
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { mdiEmailOutline } from '@mdi/js'

import self, { Subscription } from '@/composables/localStore/useSelf'

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
const isError = ref(false)

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

const codeTimer = ref(30)
let interval: NodeJS.Timeout | null = null

onMounted(() => {
  const session = self.value.session
  if (session?.user) {
    step.value = Steps.FillUserForm
    getProfileApi.userId.value = session.user.id
    getProfileApi.execute()
  }
})

const errorMessage = computed(
  () =>
    signUpApi.state.value?.error?.message ||
    getProfileApi.state.value?.error?.message ||
    veryifyOtpApi.state.value?.error?.message ||
    updateProfileApi.state.value?.error?.message
)

function setFreeMode() {
  self.value.subscription = Subscription.FREE
  router.push({ name: 'organizations' })
}

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

const startTimer = () => {
  if (interval) clearInterval(interval) // Clear previous timer if exists
  codeTimer.value = 30
  interval = setInterval(() => {
    if (codeTimer.value > 0) {
      codeTimer.value--
    } else {
      clearInterval(interval!)
    }
  }, 1000)
}

const pasteOtpFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (/^\d{6}$/.test(text)) {
      // Assuming a 6-digit OTP
      form.code = text
      submitCode()
    }
  } catch (error) {
    console.error('Clipboard read failed:', error)
  }
}

watch(
  () => signUpApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      if (step.value == Steps.SendEmail) step.value = Steps.SendCode
      startTimer()
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
      self.value.user = getProfileApi.data.value || undefined
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

watch(errorMessage, (errorMessage) => {
  if (errorMessage) {
    isError.value = true
    setTimeout(() => (isError.value = false), 2000)
  }
})
</script>
