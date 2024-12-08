import type { PGlite } from '@electric-sql/pglite'

export async function deleteProductDB(db: PGlite, productId: string) {
  const query = `
    DELETE FROM public.products
    WHERE id = $1
  `

  try {
    return db.query(query, [productId])
  } catch (error) {
    console.error(`Error deleting product with ID ${productId}:`, error)
  }
}