import type { PGliteWithLive } from '@electric-sql/pglite/live'

export async function deleteProductsDB(db: PGliteWithLive, ids: string[]) {
  const query = `
    DELETE FROM public.products
    WHERE id = ANY($1::uuid[])
  `

  try {
    return db.query(query, [ids])
  } catch (error) {
    console.error(`Error deleting product with ID ${ids}:`, error)
  }
}
