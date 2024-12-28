import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function updateProductsQtyDb(db: PGliteWithLive, stockMovementsIds: string[]) {
  if (stockMovementsIds.length === 0) return

  // Generate placeholders dynamically for the UUID array
  const placeholders = stockMovementsIds.map((_, index) => `$${index + 1}`).join(', ')

  const query = `
    SELECT public.adjust_product_qte(ARRAY[${placeholders}]::uuid[])
  `

  try {
    // Execute the query with spread parameters for each UUID
    const result = await db.query(query, stockMovementsIds)
    return result
  } catch (error) {
    console.error('Error updating product quantities:', error)
    throw new Error('Error updating product quantities:')
  }
}
