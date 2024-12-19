import type { TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertOrderlinesDB(
  db: PGliteWithLive,
  orderlines: TablesInsert<'order_lines'>[]
) {
  const query = `
    INSERT INTO public.order_lines (
      id,
      order_id,
      product_id,
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
          COALESCE($${i * 10 + 1}, gen_random_uuid()), 
          $${i * 10 + 2}, 
          $${i * 10 + 3}, 
          $${i * 10 + 4}, 
          $${i * 10 + 5}, 
          $${i * 10 + 6}, 
          $${i * 10 + 7}, 
          $${i * 10 + 8}, 
          COALESCE($${i * 10 + 9}, true),
          COALESCE($${i * 10 + 10}, false)
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
    orderline.qte,
    orderline.total_price,
    orderline.unit_cost_price ?? null, // Default to null if not provided
    orderline.unit_price,
    orderline.updated_at,
    orderline._synced ?? true, // Default to true if not provided
    orderline._deleted ?? false // Default to false if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting orderlines:', error)
  }
}
