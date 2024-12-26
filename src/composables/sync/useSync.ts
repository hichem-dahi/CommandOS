import { computed, watch } from 'vue'

import { useProductsSync } from './useProductsSync'
import { useStockMovementsSync } from './useStockMovementsSync'
import { useOrdersSync } from './useOrdersSync'
import { useIndividualsSync } from './useIndividualsSync'
import { useOrganizationsSync } from './useOrganizationsSync'
import { useNotificationsSync } from './useNotificationsSync'
import { useDeliveriesSync } from './useDeliveriesSync'
import { useProductsQtySync } from './useProductsQtySync'

import { useUpdateProductsQteRpc } from '../api/products/useUpdateProductsQteRpc'

export interface MaxDateResult {
  max_date: string | null
}

export function useSync() {
  const deliveriesSync = useDeliveriesSync()
  const individualsSync = useIndividualsSync()
  const organizationsSync = useOrganizationsSync()
  const ordersSync = useOrdersSync()
  const productsSync = useProductsSync()
  const stockMovementsSync = useStockMovementsSync()
  const productsQtySync = useProductsQtySync()
  const notificationsSync = useNotificationsSync()

  const updateProductsQteRpc = useUpdateProductsQteRpc()

  productsSync.launch()
  organizationsSync.launch()
  individualsSync.launch()
  deliveriesSync.launch()

  const isFinished = computed(
    () =>
      deliveriesSync.isFinished.value &&
      organizationsSync.isFinished.value &&
      individualsSync.isFinished.value &&
      productsSync.isFinished.value
  )

  watch(isFinished, (isFinished) => {
    if (isFinished) {
      ordersSync.launch()
    }
  })

  watch(
    () => ordersSync.isFinished.value,
    (isFinished) => {
      if (isFinished) {
        stockMovementsSync.launch()
        notificationsSync.launch()
      }
    }
  )

  watch(
    () => stockMovementsSync.pushedStockMovements.value,
    (pushedStockMovements) => {
      if (pushedStockMovements) {
        updateProductsQteRpc.stockMovementsIds.value = pushedStockMovements.map((s) => s.id)
        updateProductsQteRpc.execute()
      }
    }
  )

  watch(
    () => updateProductsQteRpc.isSuccess.value,
    (isSuccess) => {
      if (isSuccess) {
        productsQtySync.launch()
      }
    }
  )
}
