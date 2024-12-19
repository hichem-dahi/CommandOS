<template>
  <router-view></router-view>
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { providePGlite } from '@electric-sql/pglite-vue'
import { PGliteWorker } from '@electric-sql/pglite/worker'
import { live, type LiveNamespace } from '@electric-sql/pglite/live'

import { supabase } from './supabase/supabase'

import { useGetProfileApi } from './composables/api/auth/useGetProfileApi'

import self from './composables/localStore/useSelf'

type PGliteWithLive = PGliteWorker & { live: LiveNamespace }

const db = new PGliteWorker(
  new Worker(new URL('./pglite/pglite.ts', import.meta.url), {
    type: 'module'
  }),
  {
    extensions: { live }
  }
) as PGliteWithLive

providePGlite(db)

const router = useRouter()

const getProfileApi = useGetProfileApi()

onMounted(async () => {
  supabase.auth.onAuthStateChange(async (_, _session) => {
    if (_session) {
      self.value.session = _session
      getProfileApi.userId.value = _session.user.id
      getProfileApi.execute()
    } else {
      self.value.session = undefined

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

watch(
  () => getProfileApi.error.value,
  async (error) => {
    if (error) {
      await supabase.auth.signOut()
    }
  }
)
</script>
