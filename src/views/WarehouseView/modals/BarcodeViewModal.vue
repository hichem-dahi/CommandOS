<template>
  <v-dialog max-width="400" v-model="dialog">
    <v-card class="pa-4">
      <!-- Show only one barcode in the dialog -->
      <div id="barcode-container" class="barcode-container">
        <svg ref="barcodeRef"></svg>
      </div>
      <div class="pa-2">
        <v-checkbox hide-details density="compact" :label="$t('reverse')" v-model="isReverse" />
      </div>
      <v-btn @click="printBarcode">{{ $t('print') }}</v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

import { constructBarcodeRefSvg } from '@/helpers/constructBarcodeSvg'

import type { TablesInsert } from '@/types/database.types'

const dialog = defineModel<boolean>('dialog')
const model = defineModel<string | null>('barcode')
const props = defineProps<{ product: TablesInsert<'products'> }>()

const barcodeRef = ref<SVGSVGElement | null>(null)
const isReverse = ref(false)

watchEffect(() => {
  //TODO: to refactor
  if (barcodeRef.value) {
    if (model.value) {
      constructBarcodeRefSvg(barcodeRef.value, model.value, props.product)
    } else {
      barcodeRef.value.innerHTML = ''
    }
  }
})

const printBarcode = async () => {
  // Convert the SVG element to an image
  const el = document.getElementById('barcode-container')

  // Create a new window for printing
  const printWindow = window.open('', '', 'width=800,height=600')
  if (!printWindow) {
    console.error('Failed to open print window')
    return
  }

  // Write the HTML content to the new window
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Image</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: end;
            width: 100%;
            height: 100%;
          }
          .barcode-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            margin: auto;
            text-align: center;
            width: 100%;
            border: 1px solid #dddddd; /* Optional border for visual debugging */
            margin: 0;
            padding: 0;
          }
          @media print {
            svg {
              width: 100% !important;
              height: 100% !important; /* Maintain aspect ratio */
              max-height: 100% !important; /* Maintain aspect ratio */
              max-width: 100% !important;
              margin: 0;
              padding: 0;
              image-rendering: pixelated;
            }
          }
        </style>
      </head>
      <body>
        ${el?.outerHTML}
      </body>
    </html>
  `)

  // Wait for the image to load before printing
  printWindow.print()
  printWindow.close() // Ensure the document is fully written
}
</script>

<style scoped>
.barcode-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: auto;
  text-align: center;
  border: 1px solid #dddddd; /* Optional border for visual debugging */
}
</style>
