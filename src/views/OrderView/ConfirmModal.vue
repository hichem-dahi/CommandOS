<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card :prepend-icon="mdiCheckCircle">
      <template v-slot:title> Confirmer </template>
      <template v-slot:text>
        <div>Vous ne pourrez plus modifier cette commande après cela. Voulez-vous continuer ?</div>
      </template>
      <template v-slot:prepend>
        <v-icon color="green" size="42" />
      </template>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="dialog = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn color="blue-darken-1" variant="text" :loading="isLoading" @click="emits('confirm')">
          {{ $t('confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { mdiCheckCircle } from '@mdi/js'

const emits = defineEmits(['confirm'])
const props = defineProps<{ isLoading: boolean }>()
const dialog = defineModel<boolean>()
</script>
<style scoped>
.v-card {
  white-space: normal;
}
</style>
