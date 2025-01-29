<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <BarcodeScanner @detected="handleDetected" />
      <v-card-actions>
        <v-btn variant="text" @click="dialog = false">{{ $t('Close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import BarcodeScanner from '@/components/BarcodeScanner.vue'

const dialog = defineModel<boolean>('dialog')
const model = defineModel<string | null>('barcode')

const handleDetected = (barcode: string) => {
  model.value = barcode
  dialog.value = false
}
</script>

<style scoped>
.barcode-video {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: contain; /* Ensure the video scales properly */
}
</style>
