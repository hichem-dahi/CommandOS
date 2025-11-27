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
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#4F46E5',
          secondary: '#334155',
          background: '#F8FAFC',
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
          primary: '#6366F1',
          secondary: '#94A3B8',
          background: '#0B1220',
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
