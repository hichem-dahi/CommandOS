import type { OrderLineData } from '@/composables/api/orders/useGetOrderApi'
import self from '@/composables/localStore/useSelf'
import type { Tables } from '@/types/database.types'
import { useLiveQuery } from '@electric-sql/pglite-vue'
import { ref, computed } from 'vue'

interface OrderData extends Tables<'orders'> {
  individual?: Tables<'individuals'>
  client?: Tables<'organizations'>
  payments?: Tables<'payments'>[]
  order_lines?: OrderLineData[]
  delivery?: Tables<'deliveries'>
}

const org_id = self.value.current_org?.id

export function useOrderQuery() {
  const orderId = ref<string>()

  const query = computed(
    () => `
    SELECT
      o.*,
      -- Fetching individual data as a separate field
      (
          SELECT to_jsonb(i)
          FROM public.individuals i
          WHERE i.id = o.individual_id AND i._deleted = false
          LIMIT 1
      ) AS individual,
      -- Fetching client data as a separate field
      (
          SELECT to_jsonb(org)
          FROM public.organizations org
          WHERE org.id = o.client_id AND org._deleted = false
          LIMIT 1
      ) AS client,
      -- Fetching payments as an array of JSON objects
      (
          SELECT jsonb_agg(p)
          FROM public.payments p
          WHERE p.order_id = o.id AND p._deleted = false
      ) AS payments,
      -- Fetching order lines with product details
      (
          SELECT jsonb_agg(
              jsonb_build_object(
                  'id', ol.id,
                  'order_id', ol.order_id,
                  'product_id', ol.product_id,
                  'qte', ol.qte,
                  'unit_price', ol.unit_price,
                  'unit_cost_price', ol.unit_cost_price,
                  'total_price', ol.total_price,
                  'product', (
                    SELECT jsonb_build_object(
                      'id', p.id,
                      'code', p.code,
                      'name', p.name,
                      'price', p.price,
                      'cost_price', p.cost_price,
                      'qty', COALESCE(pq.qty, 0), -- Default to 0 if qty is null
                      'org_id', p.org_id,
                      'bar_code', p.bar_code,
                      'updated_at', p.updated_at,
                      '_synced', p._synced,
                      '_deleted', p._deleted
                    )
                    FROM public.products p
                    LEFT JOIN public.products_qty pq ON pq.product_id = p.id
                    WHERE p.id = ol.product_id AND p._deleted = false
                    LIMIT 1
                )
              )
          )
          FROM public.order_lines ol
          WHERE ol.order_id = o.id AND ol._deleted = false
      ) AS order_lines,
      -- Fetching delivery details using o.delivery_id
      (
          SELECT to_jsonb(d)
          FROM public.deliveries d
          WHERE d.id = o.delivery_id AND d._deleted = false
          LIMIT 1
      ) AS delivery
    FROM public.orders o
    WHERE o.org_id = $1 ${orderId.value ? 'AND o.id = $2' : ''} 
    AND o._deleted = false;
  `
  )

  const params = computed(() => (orderId.value ? [org_id, orderId.value] : [org_id]))

  return { q: useLiveQuery<OrderData>(query, params), orderId }
}
