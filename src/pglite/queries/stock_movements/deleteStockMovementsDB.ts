import type { StockMovement } from '@/models/models'
import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function deleteStockMovementsDB(db: PGliteWithLive, ids: string[]) {
  const query = `
    DELETE public.stock_movements
    WHERE id = ANY($1::uuid[])
  `

  try {
    // Execute the query with the provided IDs
    return db.query<StockMovement>(query, [ids])
  } catch (error) {
    console.error(`Error soft-deleting StockMovements with IDs ${ids.join(', ')}:`, error)
  }
}
