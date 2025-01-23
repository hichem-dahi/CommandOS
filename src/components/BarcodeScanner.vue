<template>
  <v-card>
    <v-card-title>{{ $t('Scan your barcode') }}</v-card-title>
    <v-card-text>
      <video
        height="300"
        width="300"
        ref="videoRef"
        class="barcode-video"
        autoplay
        playsinline
      ></video>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch } from 'vue'
import { BarcodeDetector } from 'barcode-detector/pure'

const emits = defineEmits<{
  (event: 'detected', value: number): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

let videoStream: MediaStream | null = null

// Function to activate the barcode scanner
const activateScanner = async () => {
  try {
    // Request access to the back camera on Android devices
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment'
      }
    })

    //Launch video camera and set focus continuous
    if (videoRef.value) {
      videoRef.value.srcObject = videoStream
      videoRef.value.setAttribute('playsinline', 'true')
      await videoRef.value.play()

      const track = videoStream.getVideoTracks()[0] as any
      const capabilities = track.getCapabilities() as any
      if (capabilities.focusMode) {
        const focusMode = capabilities.focusMode.includes('continuous')
          ? 'continuous'
          : capabilities.focusMode.includes('auto')
            ? 'auto'
            : null
        if (focusMode) {
          await track.applyConstraints({ advanced: [{ focusMode }] })
        }
      }
    }

    // Initialize BarcodeDetector if supported
    if (!('BarcodeDetector' in globalThis)) {
      console.error('Barcode Detector is not supported by this browser.')
      return
    }
    console.log('Barcode Detector supported!')

    const barcodeDetector = new BarcodeDetector()
    const videoElement = videoRef.value

    const detectBarcodes = async () => {
      if (videoElement) {
        try {
          const barcodes = await barcodeDetector.detect(videoElement)
          if (barcodes.length > 0) {
            barcodes.forEach((barcode: { rawValue: string | null | undefined }) => {
              console.log('Detected barcode:', barcode.rawValue)
              emits('detected', Number(barcode.rawValue))
            })
          }
        } catch (err) {
          console.error('Error detecting barcodes:', err)
        }
      }
    }
    const interval = setInterval(detectBarcodes, 200)
    onBeforeUnmount(() => clearInterval(interval))
  } catch (err) {
    console.error('Error detecting barcodes:', err)
  }
}

const closeScanner = () => {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop())
    videoStream = null
  }
}

watch(videoRef, async (videoRef) => {
  if (videoRef) {
    await activateScanner()
  }
})

onBeforeUnmount(() => {
  closeScanner()
})
</script>

<style scoped>
.barcode-video {
  width: 100%; /* Makes the video fill the available width */
  max-height: 500px; /* Ensures the height does not exceed 500px */
  object-fit: cover; /* Ensures the video scales proportionally to fit the container */
  border: 1px solid #ccc; /* Optional styling for better visuals */
}
</style>
