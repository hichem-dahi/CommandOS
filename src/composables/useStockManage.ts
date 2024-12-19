import self from './localStore/useSelf'

import type { OrderLine, Product } from '@/models/models'
import type { TablesInsert } from '@/types/database.types'

// Define the minimal OrderData type
type OrderData = {
  id: string
  order_lines: OrderLine[]
}

const org_id = self.value.current_org?.id

export function processStockMovementsForOrder(
  order: OrderData,
  operation: 'deduct' | 'restore',
  products: Product[]
) {
  const stockMovements: TablesInsert<'stock_movements'>[] = []

  order.order_lines.forEach((orderLine) => {
    const product = products.find((p) => p.id === orderLine.product_id)
    if (product && product.qte !== null && orderLine.qte !== null) {
      const qteChange = operation === 'deduct' ? -orderLine.qte : orderLine.qte

      // Ensure stock quantity does not go negative for deduction
      if (operation === 'restore' || product.qte >= orderLine.qte) {
        product.qte += qteChange // Adjust stock based on the operation
        stockMovements.push(createStockMovement(product.id, qteChange, order.id))
      }
    }
  })

  return stockMovements
}

// Adjust the stock quantity of a product by a given amount
export function updateProductStock(
  product: Product,
  adjustment: number
): TablesInsert<'stock_movements'> {
  product.qte = Math.max(0, Number(product.qte || 0) + Number(adjustment)) // Ensure qte is at least 0
  return createStockMovement(product.id, adjustment)
}

// Create a stock movement entry for tracking changes in stock
export function createStockMovement(
  product_id: string,
  qte_change: number,
  order_id?: string
): TablesInsert<'stock_movements'> {
  return {
    product_id,
    qte_change,
    org_id: org_id || '',
    date: new Date().toISOString(),
    order_id
  }
}
