<template>
  <v-dialog max-width="400" v-model="dialog">
    <v-card class="pa-4">
      <!-- Show only one barcode in the dialog -->
      <div id="barcode-container" class="barcode-container text-center pa-4">
        <div class="product-title">{{ product.name }}</div>
        <svg ref="barcodeRef"></svg>
      </div>
      <div class="pa-2">
        <v-text-field density="compact" suffix="mm" label="height" v-model="dims.height" />
        <v-text-field density="compact" suffix="mm" label="width" v-model="dims.width" />
        <v-checkbox density="compact" label="reverse" v-model="isReverse"></v-checkbox>
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

const svgToImage = (svg: SVGElement) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  return new Promise<string>((resolve) => {
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height + 32

      if (ctx) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = '#000'
        ctx.font = '16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(props.product.name || '', canvas.width / 2, 16)

        ctx.drawImage(img, 0, 32)
      }
      resolve(canvas.toDataURL('image/png'))
    }
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
         @page {
            size: ${dims.value.height} ${dims.value.width}; /* Set the page size to 40mm by 200mm */
            margin: 0; /* Set margins to 0 to fully utilize the page size */
          }
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
  border: 1px solid #ccc; /* Optional border for visual debugging */
}
</style>
