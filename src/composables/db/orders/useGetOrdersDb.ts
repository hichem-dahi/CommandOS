import { computed, reactive, ref } from 'vue'
import { useLiveQuery } from '@electric-sql/pglite-vue'

import self from '@/composables/localStore/useSelf'

import type { Tables } from '@/types/database.types'
import type { ProductData } from '../products/useGetProductsDb'
import type { DocumentType, OrderStatus } from '@/models/models'

export interface OrderData extends Tables<'orders'> {
  individual?: Tables<'individuals'>
  client?: Tables<'organizations'>
  payments?: Tables<'payments'>[]
  order_lines?: OrderlineData[]
  delivery?: Tables<'deliveries'>
}

export interface OrderlineData extends Tables<'order_lines'> {
  product: ProductData
}

export function useOrdersQuery() {
  const org_id = self.value.current_org?.id

  const params = reactive({
    order_id: null as string | null,
    client_id: null as string | null,
    individual_id: null as string | null,
    doc_type: null as DocumentType | null,
    date_gte: null as string | null,
    date_lte: null as string | null,
    type: null as 'order' | 'sale' | null,
    status: null as OrderStatus | null
  })

  const isReady = ref(false)

  const query = computed(() => {
    let queryConditions = `
      WHERE o.org_id = '${org_id}' AND o._deleted = false
    `

    if (params.order_id) {
      queryConditions += ` AND o.id = '${params.order_id}'`
    }

    if (params.individual_id) {
      queryConditions += ` AND o.individual_id = '${params.individual_id}'`
    }

    if (params.client_id) {
      queryConditions += ` AND o.client_id = '${params.client_id}'`
    }
    if (params.doc_type) {
      queryConditions += ` AND o.document_type = '${params.doc_type}'`
    }

    if (params.date_gte) {
      queryConditions += ` AND o.date >= '${params.date_gte}'`
    }

    if (params.date_lte) {
      queryConditions += ` AND o.date <= '${params.date_lte}'`
    }

    if (params.type) {
      queryConditions += ` AND o.type = '${params.type}'`
    }
    if (params.status !== null && params.status !== undefined) {
      queryConditions += ` AND o.status = '${params.status}'`
    }

    return isReady.value
      ? `
    WITH ordered_orders AS (
      SELECT
        o.*,
        (
            SELECT to_jsonb(i)
            FROM public.individuals i
            WHERE i.id = o.individual_id AND i._deleted = false
            LIMIT 1
        ) AS individual,
        (
            SELECT to_jsonb(org)
            FROM public.organizations org
            WHERE org.id = o.client_id AND org._deleted = false
            LIMIT 1
        ) AS client,
        (
            SELECT jsonb_agg(p)
            FROM public.payments p
            WHERE p.order_id = o.id AND p._deleted = false
        ) AS payments,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ol.id,
                    'order_id', ol.order_id,
                    'product_id', ol.product_id,
                    'org_id', ol.org_id,
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
                        'qty', COALESCE(pq.qty, 0),
                        'org_id', p.org_id,
                        'bar_code', p.bar_code,
                        'updated_at', p.updated_at,
                        '_synced', p._synced,
                        '_deleted', p._deleted
                      )
                      FROM public.products p
                      LEFT JOIN public.products_qty pq ON pq.id = p.id
                      WHERE p.id = ol.product_id AND p._deleted = false
                      LIMIT 1
                  )
                )
            )
            FROM public.order_lines ol
            WHERE ol.order_id = o.id AND ol._deleted = false
        ) AS order_lines,
        (
            SELECT to_jsonb(d)
            FROM public.deliveries d
            WHERE d.id = o.delivery_id AND d._deleted = false
            LIMIT 1
        ) AS delivery
      FROM public.orders o
      ${queryConditions}
    )
    SELECT * FROM ordered_orders
    ORDER BY date DESC NULLS LAST;
    `
      : ''
  })

  return { q: useLiveQuery<OrderData>(query, []), params, isReady }
}
