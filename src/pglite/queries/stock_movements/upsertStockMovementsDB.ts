import type { PGlite } from '@electric-sql/pglite'
import type { TablesInsert } from '@/types/database.types'

export async function upsertStockMovementsDB(
  db: PGlite,
  stockMovements: (TablesInsert<'stock_movements'> & {
    _synced?: boolean
  })[]
) {
  const query = `
    INSERT INTO public.stock_movements (
      id,
      product_id,
      qte_change,
      date,
      order_id,
      updated_at,
      _synced
    )
    VALUES ${stockMovements
      .map(
        (_, i) => `(
          COALESCE($${i * 7 + 1}, gen_random_uuid()), 
          $${i * 7 + 2}, 
          $${i * 7 + 3}, 
          $${i * 7 + 4}, 
          $${i * 7 + 5}, 
          $${i * 7 + 6}, 
          COALESCE($${i * 7 + 7}, true)
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
      _synced = COALESCE(EXCLUDED._synced, true)
    RETURNING *;
  `

  const values = stockMovements.flatMap((movement) => [
    movement.id || null, // Use null to generate a new ID if not provided
    movement.product_id,
    movement.qte_change,
    movement.date,
    movement.order_id || null, // Allow null for orders
    movement.updated_at,
    movement._synced ?? true // Default to true if not provided
  ])

  try {
    return await db.query(query, values)
  } catch (error) {
    console.error('Error upserting stock movements:', error)
    throw error
  }
}
