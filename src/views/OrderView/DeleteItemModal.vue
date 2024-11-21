<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card :prepend-icon="mdiDeleteOutline">
      <template v-slot:title> Avertissement </template>

      <template v-slot:text>
        <div class="text-center">Are you sure you want to delete this item?</div>
      </template>
      <template v-slot:prepend>
        <v-icon color="red" size="x-large"></v-icon>
      </template>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="emits('close')">
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
import { mdiDeleteOutline } from '@mdi/js'

const dialog = defineModel<boolean>()
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
})
const emits = defineEmits(['close', 'confirm'])
</script>
