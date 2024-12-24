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
  const el = await svgToImage(svg) // Ensure this returns a base64 string or image URL

  // Create a new window or document to print
  const printWindow = window.open('', '', 'width=800,height=600')
  printWindow!.document.write(`
    <html>
      <head>
        <title>Print Image</title>
        <style>
          @page {
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          img {
            height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${el}" alt="SVG Image"/>
      </body>
    </html>
  `)

  // Trigger the print dialog
  printWindow!.document.close()
  printWindow!.print()
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
