<template>
  <router-view></router-view>
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { watchOnce } from '@vueuse/core'

import { supabase } from './supabase/supabase'

import { useGetProfileApi } from './composables/api/auth/useGetProfileApi'

import self from './composables/localStore/useSelf'

const router = useRouter()

const getProfileApi = useGetProfileApi()

onMounted(() => {
  supabase.auth.onAuthStateChange(async (_, _session) => {
    if (_session) {
      self.value.session = _session
      getProfileApi.userId.value = _session.user.id
      getProfileApi.execute()
    } else {
      router.push('/auth')
    }
  })
})

watch(
  () => getProfileApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess && getProfileApi.data.value) {
      self.value.user = getProfileApi.data.value
    }
  }
)
</script>
