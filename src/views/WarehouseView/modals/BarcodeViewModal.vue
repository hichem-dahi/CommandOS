<template>
  <v-dialog max-width="400" v-model="dialog">
    <v-card class="pa-4">
      <!-- Show only one barcode in the dialog -->
      <div id="barcode-container" class="barcode-container text-center pa-4">
        <div class="product-title">{{ product.name }}</div>
        <svg ref="barcodeRef"></svg>
      </div>
      <div class="pa-2">
        <v-checkbox hide-details density="compact" label="dimensions" v-model="isModifyDims" />
        <div class="dims-input d-flex ga-5 pa-2" v-if="isModifyDims">
          <v-text-field
            hide-details
            density="compact"
            type="number"
            suffix="mm"
            :label="$t('height')"
            v-model="dims.height"
          />
          <v-text-field
            hide-details
            density="compact"
            type="number"
            suffix="mm"
            :label="$t('width')"
            v-model="dims.width"
          />
        </div>
        <v-checkbox hide-details density="compact" :label="$t('reverse')" v-model="isReverse" />
      </div>
      <v-btn @click="printBarcode">{{ $t('print') }}</v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import JsBarcode from 'jsbarcode'

import type { TablesInsert } from '@/types/database.types'

const dialog = defineModel<boolean>('dialog')
const model = defineModel<number | string | null>('barcode')

const props = defineProps<{ product: TablesInsert<'products'> }>()

const barcodeRef = ref<SVGSVGElement | null>(null)

const dims = ref({
  height: 20,
  width: 40
})

const isReverse = ref(false)
const isModifyDims = ref(false)

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
        height: 40, // Adjust height for barcode
        fontSize: 14, // Font size for text below barcode
        margin: 8, // Spacing around barcode
        fontOptions: 'bold'
      })
    } else {
      barcodeRef.value.innerHTML = ''
    }
  }
})

const svgToImage = (svg: SVGElement, scaleFactor: number = 2) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  return new Promise<string>((resolve) => {
    img.onload = () => {
      // Scale the canvas dimensions
      canvas.width = img.width * scaleFactor
      canvas.height = (img.height + 32) * scaleFactor

      if (ctx) {
        // Scale the drawing operations
        ctx.scale(scaleFactor, scaleFactor)

        // Fill the background
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor)

        // Draw the text
        ctx.fillStyle = '#000'
        ctx.font = 'bold 16px Arial' // Font size is not scaled here
        ctx.textAlign = 'center'
        ctx.fillText(props.product.name || '', canvas.width / scaleFactor / 2, 16)

        // Draw the image
        ctx.drawImage(img, 0, 20)
      }

      // Resolve with the data URL of the high-resolution image
      resolve(canvas.toDataURL('image/png', 1.0)) // 1.0 is the highest quality
    }

    // Convert SVG to data URL and set it as the image source
    img.src = `data:image/svg+xml;base64,${btoa(new XMLSerializer().serializeToString(svg))}`
  })
}

const printBarcodeAsImage = async (svg: SVGElement) => {
  // Convert the SVG element to an image
  const el = await svgToImage(svg) // Ensure this returns a base64 string or image URL

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
            align-items: center;
            width: 100%;
            height: 100%;
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
           ${
             isReverse.value
               ? `
            transform: rotate(90deg); /* Rotate the image if isReverse is true */
            transform-origin: center; /* Set rotation pivot point */
          `
               : ''
           }
          }
        </style>
      </head>
      <body>
        <img id="printImage" src="${el}" alt="SVG Image"/>
      </body>
    </html>
  `)

  // Wait for the image to load before printing
  printWindow.document.close() // Ensure the document is fully written
  const printImage = printWindow.document.getElementById('printImage') as HTMLImageElement

  printImage.onload = () => {
    printWindow.print()
    printWindow.close()
  }

  // Optional: Close the print window after printing (user experience consideration)
  printImage.onerror = () => {
    console.error('Failed to load the image for printing')
  }
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
  border: 1px solid #dddddd; /* Optional border for visual debugging */
}
</style>
