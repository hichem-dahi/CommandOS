// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'

import { VDateInput } from 'vuetify/labs/VDateInput'
import { VNumberInput } from 'vuetify/labs/VNumberInput'

import 'vuetify/styles'

import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

export default createVuetify({
  components: { VDateInput, VNumberInput },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
})
