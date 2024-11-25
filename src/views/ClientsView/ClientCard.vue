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
          query: {
            consumer: client.id
          }
        }"
      >
        {{ $t('add-order') }}
      </v-btn>
      <v-btn
        v-if="client.id"
        size="small"
        :append-icon="mdiHistory"
        variant="plain"
        :to="{ name: 'client-history', params: { client_id: client.id } }"
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

import organizations from '@/composables/localStore/useOrganizationsStore'
import { individuals } from '@/composables/localStore/useIndividualsStore'

import { useDeleteIndividualApi } from '@/composables/api/individuals/useDeleteIndividualApi'

import DeleteItemModal from '@/views/OrderView/DeleteItemModal.vue'

import { ConsumerType, type Organization, type Individual } from '@/models/models'
import type { Tables } from '@/types/database.types'

const client = defineModel<Tables<'organizations'> | Tables<'individuals'>>()

const deleteIndividualApi = useDeleteIndividualApi()

const deleteDialog = ref(false)

const consumerType = computed(() =>
  client.value && 'rc' in client.value ? ConsumerType.Organization : ConsumerType.Individual
)

function deleteClient() {
  if (consumerType.value == ConsumerType.Organization && client.value) {
    const index = organizations.value.indexOf(client.value as Organization)
    organizations.value.splice(index, 1)
  } else if (consumerType.value == ConsumerType.Individual && client.value) {
    const index = individuals.value.indexOf(client.value as Individual)
    individuals.value.splice(index, 1)
    deleteIndividualApi.individualId.value = client.value.id
    deleteIndividualApi.execute()
  }
}

watch(
  () => deleteIndividualApi.isSuccess.value,
  (isSuccess) => {
    if (isSuccess) {
      deleteDialog.value = true
    }
  }
)
</script>
