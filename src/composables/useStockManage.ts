import self from './localStore/useSelf'

import type { OrderLine } from '@/models/models'
import type { TablesInsert } from '@/types/database.types'

// Define the minimal OrderData type
type OrderData = {
  id: string
  order_lines: OrderLine[]
}

const org_id = self.value.current_org?.id

export function processStockMovementsForOrder(order: OrderData, operation: 'deduct' | 'restore') {
  const stockMovements: TablesInsert<'stock_movements'>[] = []

  order.order_lines.forEach((orderLine) => {
    const qteChange = operation === 'deduct' ? -orderLine.qte : orderLine.qte
    stockMovements.push(createStockMovement(orderLine.product_id, qteChange, order.id))
  })

  return stockMovements
}

// Adjust the stock quantity of a product by a given amount
export function updateProductStock(
  product_id: string,
  adjustment: number
): TablesInsert<'stock_movements'> {
  return createStockMovement(product_id, adjustment)
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
