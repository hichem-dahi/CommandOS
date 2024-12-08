import type { PGlite } from '@electric-sql/pglite'

export async function deletePaymentDB(db: PGlite, paymentId: string) {
  const query = `
    DELETE FROM public.payments
    WHERE id = $1
  `

  try {
    return db.query(query, [paymentId])
  } catch (error) {
    console.error(`Error deleting product with ID ${paymentId}:`, error)
  }
}
