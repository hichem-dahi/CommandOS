import type { PGlite } from '@electric-sql/pglite'

export async function deleteProductDB(db: PGlite, productId: string) {
  const query = `
    DELETE FROM public.products
    WHERE id = $1
  `

  try {
    const q = await db.query(query, [productId])
    console.log(`Product with ID ${productId} deleted successfully.`)
    return q
  } catch (error) {
    console.error(`Error deleting product with ID ${productId}:`, error)
  }
}
