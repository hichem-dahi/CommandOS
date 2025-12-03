// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'

import 'vuetify/styles'

import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { VDateInput, VStepperVertical } from 'vuetify/labs/components'

export default createVuetify({
  components: { VDateInput, VStepperVertical },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#3e3d54',
          secondary: '#334155',
          background: '#f6f6f5ff',
          surface: '#FFFFFF',
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
          info: '#0EA5E9'
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#3e3d54',
          secondary: '#94A3B8',
          background: '#faf5eaff',
          surface: '#111827',
          success: '#22C55E',
          warning: '#FBBF24',
          error: '#F87171',
          info: '#38BDF8'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      color: 'primary',
      variant: 'flat',
      rounded: 'lg'
    }
  }
})
