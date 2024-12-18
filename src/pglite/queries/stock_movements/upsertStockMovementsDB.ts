import type { TablesInsert } from '@/types/database.types'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function upsertStockMovementsDB(
  db: PGliteWithLive,
  stockMovements: (TablesInsert<'stock_movements'> & {
    _synced?: boolean
  })[]
) {
  if (!stockMovements?.length) return
  const query = `
    INSERT INTO public.stock_movements (
      id,
      product_id,
      qte_change,
      date,
      order_id,
      org_id,
      updated_at,
      _synced
    )
    VALUES ${stockMovements
      .map(
        (_, i) => `(
          COALESCE($${i * 8 + 1}, gen_random_uuid()), 
          $${i * 8 + 2}, 
          $${i * 8 + 3}, 
          $${i * 8 + 4}, 
          $${i * 8 + 5}, 
          $${i * 8 + 6}, 
          $${i * 8 + 7}, 
          COALESCE($${i * 8 + 8}, true)
        )`
      )
      .join(', ')}
    ON CONFLICT (id)
    DO UPDATE SET
      product_id = EXCLUDED.product_id,
      qte_change = EXCLUDED.qte_change,
      date = EXCLUDED.date,
      order_id = EXCLUDED.order_id,
      updated_at = EXCLUDED.updated_at,
      org_id = EXCLUDED.org_id,
      _synced = COALESCE(EXCLUDED._synced, true)
    RETURNING *;
  `

  const values = stockMovements.flatMap((movement) => [
    movement.id || null, // Use null to generate a new ID if not provided
    movement.product_id,
    movement.qte_change,
    movement.date,
    movement.order_id || null, // Allow null for orders
    movement.org_id,
    movement.updated_at,
    movement._synced ?? true // Default to true if not provided
  ])

  try {
    return db.query(query, values)
  } catch (error) {
    console.error('Error upserting stock movements:', error)
    throw error
  }
}
