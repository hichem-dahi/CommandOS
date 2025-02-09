<template>
  <v-card>
    <v-card-actions>
      <v-btn block variant="tonal" :loading="isScanning" color="blue" @click="activateScanner">
        {{ $t('start-scanning') }}
      </v-btn>
    </v-card-actions>
    <v-card-text>
      <video
        ref="videoRef"
        class="barcode-video"
        height="300"
        width="300"
        autoplay
        playsinline
      ></video>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { BarcodeDetector } from 'barcode-detector/pure'

let videoStream: MediaStream | null = null
let intervalId: NodeJS.Timeout | null = null

const emits = defineEmits<{
  (event: 'detected', value: string): void
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isScanning = ref(false)

// Function to activate the barcode scanner
const activateScanner = async () => {
  try {
    if (!videoRef.value) return
    intervalId = setInterval(async () => await detectBarcodes(videoRef.value!), 200)
    onBeforeUnmount(() => (intervalId ? clearInterval(intervalId) : null))
  } catch (err) {
    console.error('Error detecting barcodes:', err)
  }
}

const stopScanner = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    isScanning.value = false
  }
}

onMounted(async () => {
  await setUpVideoRef()
})

async function setUpVideoRef() {
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
  } catch (err) {
    console.error('Error detecting barcodes:', err)
  }
}

const barcodeDetector = new BarcodeDetector()

const detectBarcodes = async (videoElement: HTMLVideoElement) => {
  try {
    isScanning.value = true
    const barcodes = await barcodeDetector.detect(videoElement)
    barcodes.forEach((barcode: { rawValue: string | null | undefined }) => {
      console.log('Detected barcode:', barcode.rawValue)
      if (barcode.rawValue) {
        emits('detected', barcode.rawValue)
        stopScanner()
      }
    })
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
