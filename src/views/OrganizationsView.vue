<template>
  <div class="d-flex justify-center align-center pa-4" style="height: 100vh">
    <div
      class="inner"
      :class="{ 'w-33': $vuetify.display.lgAndUp, 'w-100': !$vuetify.display.lgAndUp }"
    >
      <div v-if="fillOrganizationForm">
        <v-btn
          class="mt-3"
          size="small"
          color="grey"
          variant="text"
          :prepend-icon="mdiChevronLeft"
          @click="fillOrganizationForm = false"
          :text="$t('back')"
        />
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
      <div v-else>
        <v-card class="pa-4" :title="$t('pick-organization')">
          <v-list
            :items="organizations"
            item-title="name"
            item-value="id"
            link
            @update:selected="setCurrentOrg"
          />
          <v-list-item
            @click="fillOrganizationForm = true"
            :append-icon="mdiPlus"
            subtitle="Creé une organization"
          ></v-list-item>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import useVuelidate from '@vuelidate/core'
import { mdiChevronLeft, mdiPlus } from '@mdi/js'

import { useInsertOrganizationApi } from '@/composables/api/organizations/useInsertOrganizationApi'
import { useGetProfileApi } from '@/composables/api/auth/useGetProfileApi'

import self from '@/composables/localStore/useSelf'

import ClientForm from './ClientsView/ClientForm.vue'

const router = useRouter()

const $v = useVuelidate()

const insertOrganizationApi = useInsertOrganizationApi()
const getProfileApi = useGetProfileApi()

const fillOrganizationForm = ref(false)

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

const organizations = computed(() => self.value.user?.organizations)

function setCurrentOrg(payload: unknown) {
  self.value.current_org = organizations.value?.find((o) => o.id === (payload as string[])[0])
  router.push({
    name: 'home'
  })
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

watch(
  () => insertOrganizationApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      const session = self.value.session
      if (session?.user) {
        getProfileApi.userId.value = session.user.id
        getProfileApi.execute()
      }
    }
  }
)

watch(
  () => getProfileApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) fillOrganizationForm.value = false
  }
)
</script>
