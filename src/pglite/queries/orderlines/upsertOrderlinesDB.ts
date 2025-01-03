import type { TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertOrderlinesDB(
  db: PGliteWithLive,
  orderlines: TablesInsert<'order_lines'>[]
) {
  if (!orderlines?.length) return
  const query = `
    INSERT INTO public.order_lines (
      id,
      order_id,
      product_id,
      org_id,
      qte,
      total_price,
      unit_cost_price,
      unit_price,
      updated_at,
      _synced,
      _deleted
    )
    VALUES ${orderlines
      .map(
        (_, i) => `(
          COALESCE($${i * 11 + 1}, gen_random_uuid()), 
          $${i * 11 + 2}, 
          $${i * 11 + 3}, 
          $${i * 11 + 4}, 
          $${i * 11 + 5}, 
          $${i * 11 + 6}, 
          $${i * 11 + 7}, 
          $${i * 11 + 8}, 
          $${i * 11 + 9}, 
          COALESCE($${i * 11 + 10}, true),
          COALESCE($${i * 11 + 11}, false)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      order_id = EXCLUDED.order_id,
      product_id = EXCLUDED.product_id,
      qte = EXCLUDED.qte,
      total_price = EXCLUDED.total_price,
      unit_cost_price = EXCLUDED.unit_cost_price,
      unit_price = EXCLUDED.unit_price,
      updated_at = EXCLUDED.updated_at,
      _synced = COALESCE(EXCLUDED._synced, true),
      _deleted = COALESCE(EXCLUDED._deleted, false)
    RETURNING *;
  `

  const values = orderlines.flatMap((orderline) => [
    orderline.id || null,
    orderline.order_id,
    orderline.product_id,
    orderline.org_id,
    orderline.qte,
    orderline.total_price,
    orderline.unit_cost_price ?? null, // Default to null if not provided
    orderline.unit_price,
    orderline.updated_at || '0001-01-01 00:00:00+00',
    orderline._synced ?? true, // Default to true if not provided
    orderline._deleted ?? false // Default to false if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting orderlines:', error)
  }
}
