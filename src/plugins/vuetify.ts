// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'

import 'vuetify/styles'

import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { VDateInput } from 'vuetify/labs/components'

export default createVuetify({
  components: { VDateInput },
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
          primary: '#3E3D54', // brand
          secondary: '#64748B', // slightly darker for contrast
          background: '#F6F6F5', // good soft neutral
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
          primary: '#A5A4C5', // lighter version of your brand color for dark mode
          secondary: '#94A3B8', // fine for dark mode
          background: '#0F172A', // true dark (slate-900)
          surface: '#1E293B', // slate-800, deep but visible
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
