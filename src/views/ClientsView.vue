<template>
  <v-btn
    class="my-5"
    variant="tonal"
    size="small"
    :append-icon="mdiPlus"
    :to="{ name: 'create-client' }"
    >{{ $t('add-client') }}
  </v-btn>
  <v-row v-for="(_, i) in organizations" :key="i">
    <v-col sm="12" md="6">
      <ClientCard v-model="organizations[i]" />
    </v-col>
  </v-row>
  <v-row v-for="(_, i) in individuals" :key="i">
    <v-col sm="12" md="6">
      <ClientCard v-model="individuals[i]" />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { mdiPlus } from '@mdi/js'

import { useOrganizationsSync } from '@/composables/sync/useOrganizationsSync'
import { useIndividualsSync } from '@/composables/sync/useIndividualsSync'

import ClientCard from '@/views/ClientsView/ClientCard.vue'

import type { Individual, Organization } from '@/models/models'
import type { Tables } from '@/types/database.types'

useOrganizationsSync().launch()
useIndividualsSync().launch()

const organizationsQuery = useLiveQuery<Tables<'organizations'>>(
  'SELECT * FROM public.organizations;',
  []
)
const individualsQuery = useLiveQuery<Tables<'individuals'>>(
  'SELECT * FROM public.individuals;',
  []
)

const individuals = computed(() => individualsQuery.rows.value as unknown as Individual[])
const organizations = computed(() => organizationsQuery.rows.value as unknown as Organization[])
</script>
