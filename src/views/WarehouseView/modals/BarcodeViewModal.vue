<template>
  <v-dialog max-width="400" v-model="dialog">
    <v-card class="pa-4">
      <!-- Show only one barcode in the dialog -->
      <div id="barcode-container" class="barcode-container text-center pa-4">
        <div class="product-title">{{ product.name }}</div>
        <svg ref="barcodeRef"></svg>
      </div>
      <v-btn @click="printBarcode">{{ $t('print') }}</v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import JsBarcode from 'jsbarcode'
import printJS from 'print-js'

import type { TablesUpdate } from '@/types/database.types'

const dialog = defineModel<boolean>('dialog')
const model = defineModel<number | null>('barcode')

const props = defineProps<{ product: TablesUpdate<'products'> }>()

const barcodeRef = ref<SVGSVGElement | null>(null)

const printBarcodeAsImage = async (svgElement: SVGElement) => {
  const imageUrl = await svgToImage(svgElement)
  printJS({
    printable: imageUrl,
    type: 'image',
    style: `
    @media print {
      @page {
        size: 50mm 30mm; /* Set the page size */
        margin: 0; /* Remove page margins */
      }

      body {
        display: flex;
        justify-content: center; /* Center horizontally */
        align-items: center;    /* Center vertically */
        margin: 0;
        padding: 0;
        height: 100vh; /* Ensure the body fills the page for vertical centering */
      }

      img {
        display: block;
        margin: 0;
        width: 40mm; /* Set the width of the image */
        height: 20mm; /* Set the height of the image */
      }
    }
  `,
    scanStyles: false
  })
}

const printBarcode = async () => {
  if (barcodeRef.value) {
    await printBarcodeAsImage(barcodeRef.value)
  } else {
    console.error('Barcode element not found!')
  }
}
watchEffect(() => {
  if (barcodeRef.value) {
    if (model.value) {
      JsBarcode(barcodeRef.value, model.value.toString(), {
        text: `${props.product.price} DA`,
        width: 2, // Narrower bars for clarity
        height: 60, // Adjust height for barcode
        fontSize: 14, // Font size for text below barcode
        margin: 10 // Spacing around barcode
      })
    } else {
      barcodeRef.value.innerHTML = ''
    }
  }
})

const svgToImage = (svgElement: SVGElement) => {
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const img = new Image()

  return new Promise((resolve) => {
    img.onload = () => {
      // Set canvas dimensions
      const textHeight = 32 // Adequate space for the text
      canvas.width = img.width
      canvas.height = img.height + textHeight
      if (context) {
        // Fill background (optional, if a white background is needed)
        context.fillStyle = '#fff'
        context.fillRect(0, 0, canvas.width, canvas.height)

        // Add product name (text) at the top
        context.fillStyle = '#000' // Text color
        context.font = '16px Arial' // Font style and size
        context.textAlign = 'center'
        context.textBaseline = 'middle' // Ensure text is centered vertically
        context.fillText(props.product.name || '', canvas.width / 2, textHeight / 2)

        // Draw the SVG image below the text
        context.drawImage(img, 0, textHeight)
      }
      // Convert canvas to base64 PNG
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`
  })
}
</script>

<style scoped>
.barcode-svg {
  image-rendering: crisp-edges; /* Ensure sharp rendering */
}
.barcode-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: auto;
  text-align: center;
  border: 1px solid #ccc; /* Optional border for visual debugging */
}
</style>
