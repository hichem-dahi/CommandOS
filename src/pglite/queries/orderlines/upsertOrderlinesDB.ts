import type { PGlite } from '@electric-sql/pglite'
import type { TablesInsert } from '@/types/database.types'

export async function upsertOrderlinesDB(
  db: PGlite,
  orderlines: (TablesInsert<'order_lines'> & {
    _synced?: boolean
  })[]
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
      _synced
    )
    VALUES ${orderlines
      .map(
        (_, i) => `(
          COALESCE($${i * 9 + 1}, gen_random_uuid()), 
          $${i * 9 + 2}, 
          $${i * 9 + 3}, 
          $${i * 9 + 4}, 
          $${i * 9 + 5}, 
          $${i * 9 + 6}, 
          $${i * 9 + 7}, 
          $${i * 9 + 8}, 
          COALESCE($${i * 9 + 9}, true)
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
      _synced = COALESCE(EXCLUDED._synced, true)
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
    orderline._synced ?? true // Default to true if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting orderlines:', error)
  }
}
