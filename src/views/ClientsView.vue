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

import self from '@/composables/localStore/useSelf'

import ClientCard from '@/views/ClientsView/ClientCard.vue'

import type { Tables } from '@/types/database.types'

const organizationsQuery = useLiveQuery<Tables<'organizations'>>(
  'SELECT * FROM public.organizations WHERE _deleted = false AND org_id = $1;',
  [self.value.current_org?.id]
)

const individualsQuery = useLiveQuery<Tables<'individuals'>>(
  'SELECT * FROM public.individuals WHERE _deleted = false AND org_id = $1;',
  [self.value.current_org?.id]
)

const individuals = computed(
  () => individualsQuery.rows.value as unknown as Tables<'individuals'>[]
)
const organizations = computed(
  () => organizationsQuery.rows.value as unknown as Tables<'organizations'>[]
)
</script>
