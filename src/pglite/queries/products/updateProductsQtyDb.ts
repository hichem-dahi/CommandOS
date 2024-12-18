import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function updateProductsQtyDb(
  db: PGliteWithLive, // Database connection
  updates: { product_id: string; qte_change: number }[] // Array of updates
) {
  if (updates.length === 0) return

  // Build the query for bulk update
  const query = `
    UPDATE public.products
    SET qte = qte + CASE
      ${updates.map((_, i) => `WHEN id = $${i * 2 + 2} THEN $${i * 2 + 1}::int`).join(' ')}
    END
    WHERE id IN (${updates.map((_, i) => `$${i * 2 + 2}`).join(', ')})
    RETURNING id, qte;
  `

  // Flatten the updates array into the required values for query execution
  const queryValues = updates.flatMap((update) => [
    update.qte_change, // The quantity change
    update.product_id // The product ID
  ])

  try {
    const result = await db.query(query, queryValues)
    return result
  } catch (error) {
    throw new Error('Error updating product quantities')
  }
}
