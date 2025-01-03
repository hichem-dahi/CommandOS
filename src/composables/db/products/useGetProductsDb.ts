import { ref, computed } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import self from '@/composables/localStore/useSelf'

import type { Tables } from '@/types/database.types'

export interface ProductData extends Tables<'products'> {
  qty?: number
}

export function useProductQuery() {
  const org_id = self.value.current_org?.id
  const product_id = ref<string | null>(null)

  const query = computed(
    () => `
      SELECT p.*, pq.qty 
      FROM public.products p
      LEFT JOIN public.products_qty pq 
      ON p.id = pq.id 
      WHERE p.org_id = $1 
      ${product_id.value ? 'AND p.id = $2' : ''} 
      AND p._deleted = false;
    `
  )

  const params = computed(() => (product_id.value ? [org_id, product_id.value] : [org_id]))

  return {
    q: useLiveQuery<ProductData>(query, params),
    product_id
  }
}
