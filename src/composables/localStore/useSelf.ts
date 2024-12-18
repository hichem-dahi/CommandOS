import { useLocalStorage } from '@vueuse/core'

import type { Session } from '@supabase/supabase-js'

import type { ProfileData } from '../api/auth/useGetProfileApi'
import type { Tables } from '@/types/database.types'

interface Profile {
  user?: ProfileData
  session?: Session
  organization: Tables<'organizations'> | undefined
}

const self = useLocalStorage<Profile>('self', {
  user: undefined,
  session: undefined,
  organization: undefined
})

export default self
