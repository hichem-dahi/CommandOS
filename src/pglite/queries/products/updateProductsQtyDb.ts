import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function updateProductsQtyDb(db: PGliteWithLive, stockMovementsIds: string[]) {
  if (stockMovementsIds.length === 0) return

  const query = `
    SELECT adjust_product_qte(ARRAY[$1]::uuid[])
  `

  const queryValues = [stockMovementsIds]

  try {
    // Execute the query to call the adjust_product_qte function
    const result = await db.query(query, queryValues)
    return result
  } catch {
    throw new Error('Error updating product quantities:')
  }
}
