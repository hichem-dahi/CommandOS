import { useLocalStorage } from '@vueuse/core'

import type { Session } from '@supabase/supabase-js'

import type { ProfileData } from '../api/auth/useGetProfileApi'
import type { Tables } from '@/types/database.types'

interface Profile {
  user?: ProfileData
  session?: Session
  current_org: Tables<'organizations'> | undefined
  subscription?: Subscription
}

export enum Subscription {
  FREE = 0,
  PAID
}

const self = useLocalStorage<Profile>('self', {
  user: undefined,
  session: undefined,
  current_org: undefined,
  subscription: undefined
})

export function resetLocalAuth() {
  self.value = {
    user: undefined,
    session: undefined,
    current_org: undefined,
    subscription: undefined
  }
}

export default self
