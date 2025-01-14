import { computed } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import self from '@/composables/localStore/useSelf'
import type { Tables } from '@/types/database.types'

export function useGetProductsCategoriesDb() {
  const org_id = self.value.current_org?.id

  const query = computed(
    () => `
      SELECT *
      FROM public.products_categories
      WHERE org_id = $1 
      AND _deleted = false;
    `
  )

  const params = computed(() => [org_id])

  return {
    q: useLiveQuery<Tables<'products_categories'>>(query, params)
  }
}
