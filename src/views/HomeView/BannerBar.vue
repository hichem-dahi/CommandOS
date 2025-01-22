<template>
  <v-banner
    v-if="deferredPrompt"
    class="text-left"
    position="fixed"
    bg-color="blue"
    style="bottom: 0; z-index: 10000"
  >
    Get our free app. It won't take up space on your phone and also works offline!
    <template v-slot:actions>
      <v-btn variant="text" @click="dismiss">Dismiss</v-btn>
      <v-btn variant="text" @click="install">Install</v-btn>
    </template>
  </v-banner>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const deferredPrompt = ref()

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
  })
})

async function install() {
  deferredPrompt.value.prompt()
}

async function dismiss() {
  deferredPrompt.value = null
}
</script>
