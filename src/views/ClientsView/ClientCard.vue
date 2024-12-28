<template>
  <v-card
    v-if="client"
    class="pa-4 pb-0 mx-auto"
    :prepend-icon="consumerType == ConsumerType.Organization ? mdiDomain : mdiAccount"
    :title="client?.name"
  >
    <v-card-subtitle style="line-height: 150%">
      <div v-if="'address' in client">{{ $t('address') }}: {{ client?.address }}</div>
      <div>
        {{ $t('phone') }}: <a :href="`tel:${client?.phone}`">{{ client?.phone }}</a>
      </div>
    </v-card-subtitle>

    <v-card-actions class="ma-0 pa-0">
      <v-spacer></v-spacer>
      <v-btn
        class="my-5"
        size="small"
        variant="plain"
        :append-icon="mdiPlus"
        :to="{
          name: 'create-order',
          query:
            consumerType === ConsumerType.Organization
              ? { client_id: client.id }
              : { individual_id: client.id }
        }"
      >
        {{ $t('add-order') }}
      </v-btn>
      <v-btn
        v-if="client.id"
        size="small"
        :append-icon="mdiHistory"
        variant="plain"
        :to="{
          name: 'client-history',
          query:
            consumerType === ConsumerType.Organization
              ? { client_id: client.id }
              : { individual_id: client.id }
        }"
      >
        {{ $t('history') }}
      </v-btn>
    </v-card-actions>

    <template v-slot:append>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn class="ml-auto" v-bind="props" variant="text" :icon="mdiDotsVertical" />
        </template>
        <v-list density="compact">
          <v-list-item density="compact" @click="deleteDialog = true">
            <v-list-item-title>{{ $t('delete') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    <DeleteItemModal v-model="deleteDialog" @confirm="deleteClient" @close="deleteDialog = false" />
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mdiAccount, mdiDomain, mdiDotsVertical, mdiHistory, mdiPlus } from '@mdi/js'

import DeleteItemModal from '@/views/OrderView/DeleteItemModal.vue'

import { useSoftDeleteIndividualsDb } from '@/composables/db/individuals/useSoftDeleteIndividualsDb'
import { useSoftDeleteOrganizationsDB } from '@/composables/db/organizations/useSoftDeleteOrganizationsDb'

import { ConsumerType, type Organization, type Individual } from '@/models/models'

const client = defineModel<Organization | Individual>()

const softDeleteIndividualsDb = useSoftDeleteIndividualsDb()
const softDeleteOrganizationsDb = useSoftDeleteOrganizationsDB()

const deleteDialog = ref(false)

const consumerType = computed(() =>
  client.value && 'rc' in client.value ? ConsumerType.Organization : ConsumerType.Individual
)

function deleteClient() {
  if (consumerType.value == ConsumerType.Organization && client.value) {
    softDeleteOrganizationsDb.ids.value = [client.value.id]
    softDeleteOrganizationsDb.execute()
  } else if (consumerType.value == ConsumerType.Individual && client.value) {
    softDeleteIndividualsDb.ids.value = [client.value.id]
    softDeleteIndividualsDb.execute()
  }
}

watch(
  [() => softDeleteIndividualsDb.isSuccess.value, () => softDeleteOrganizationsDb.isSuccess.value],
  ([isSuccess1, isSuccess2]) => {
    if (isSuccess1 || isSuccess2) {
      deleteDialog.value = true
    }
  }
)
</script>
