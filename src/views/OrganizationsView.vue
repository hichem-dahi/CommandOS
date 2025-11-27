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
            @update:selected="setCurrentOrg"
          >
            <template #item="{ props }">
              <v-list-item v-bind="props">
                <template #append>
                  <v-btn
                    variant="text"
                    :icon="mdiDelete"
                    color="error"
                    @click.stop="selectedOrgToDelete(props.value)"
                  />
                  <DeleteItemModal
                    v-model="deleteDialog"
                    @close="deleteDialog = false"
                    @confirm="deleteOrganization(selectedOrg)"
                  />
                </template>
              </v-list-item>
            </template>
          </v-list>

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
import { injectPGlite, useLiveQuery } from '@electric-sql/pglite-vue'
import useVuelidate from '@vuelidate/core'
import { mdiChevronLeft, mdiDelete, mdiPlus } from '@mdi/js'

import { useInsertOrganizationApi } from '@/composables/api/organizations/useInsertOrganizationApi'
import { useGetProfileApi } from '@/composables/api/auth/useGetProfileApi'

import { upsertOrganizationDB } from '@/pglite/queries/organizations/upsertOrganizationDB'
import { useSoftDeleteOrganizationsDB } from '@/composables/db/organizations/useSoftDeleteOrganizationsDb'

import self, { Subscription } from '@/composables/localStore/useSelf'

import ClientForm from './ClientsView/ClientForm.vue'
import DeleteItemModal from './OrderView/DeleteItemModal.vue'

import type { Tables } from '@/types/database.types'

const db = injectPGlite()
const router = useRouter()

const $v = useVuelidate()

const insertOrganizationApi = useInsertOrganizationApi()
const softDeleteOrganizationsDb = useSoftDeleteOrganizationsDB()

const getProfileApi = useGetProfileApi()

const deleteDialog = ref(false)
const selectedOrg = ref<string>()
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

const organizationsQuery = useLiveQuery<Tables<'organizations'>>(
  'SELECT * FROM public.organizations WHERE _deleted = false AND org_id IS NULL',
  []
)

const organizations = computed(() => organizationsQuery.rows.value)

function setCurrentOrg(payload: unknown) {
  self.value.current_org = organizations.value?.find((o) => o.id === (payload as string[])[0])
  router.push({
    name: 'home'
  })
}

function selectedOrgToDelete(id: string) {
  selectedOrg.value = id
  deleteDialog.value = true
}

function deleteOrganization(id: string | undefined) {
  if (!id) return
  softDeleteOrganizationsDb.ids.value = [id]
  softDeleteOrganizationsDb.execute()
}

async function submitOrganization() {
  $v.value.$touch()
  if (!$v.value.$invalid) {
    const form = { ...organizationForm.value, user_id: self.value.session?.user.id }
    if (self.value.subscription === Subscription.PAID) {
      insertOrganizationApi.form.value = { ...form }
      insertOrganizationApi.execute()
    } else if (db) {
      await upsertOrganizationDB(db, { ...form })
      fillOrganizationForm.value = false
    }
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
    if (isSuccess && getProfileApi.data.value) {
      self.value.user = getProfileApi.data.value
      fillOrganizationForm.value = false
    }
  }
)

watch(
  () => softDeleteOrganizationsDb.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      deleteDialog.value = false
      selectedOrg.value = undefined
      fillOrganizationForm.value = false
    }
  }
)
</script>
