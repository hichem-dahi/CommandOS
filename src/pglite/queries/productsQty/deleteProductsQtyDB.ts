import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function deleteProductsQtyDB(db: PGliteWithLive, ids: string[]) {
  const query = `
    DELETE FROM public.products_qty
    WHERE id = ANY($1::uuid[])
  `

  try {
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error deleting productQty with ID ${ids}:`, error)
  }
}
