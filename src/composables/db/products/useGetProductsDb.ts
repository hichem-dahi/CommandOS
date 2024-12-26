import { useLiveQuery } from '@electric-sql/pglite-vue'
import { ref, computed } from 'vue'

import type { Tables } from '@/types/database.types'
import self from '@/composables/localStore/useSelf'

export interface ProductData extends Tables<'products'> {
  qty?: number
}
const org_id = self.value.current_org?.id

export function useProductQuery() {
  const productId = ref<string | null>(null)

  const query = computed(
    () => `
      SELECT p.*, pq.qty 
      FROM public.products p
      LEFT JOIN public.products_qty pq 
      ON p.id = pq.product_id 
      WHERE p.org_id = $1 
      ${productId.value ? 'AND p.id = $2' : ''} 
      AND o._deleted = false;
    `
  )

  const params = computed(() => (productId.value ? [org_id, productId.value] : [org_id]))

  return {
    q: useLiveQuery<ProductData>(query, params),
    productId
  }
}
