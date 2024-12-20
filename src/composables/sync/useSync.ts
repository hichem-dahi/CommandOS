import { computed, watch } from 'vue'

import { useProductsSync } from './useProductsSync'
import { useStockMovementsSync } from './useStockMovementsSync'
import { useOrdersSync } from './useOrdersSync'
import { useIndividualsSync } from './useIndividualsSync'
import { useOrganizationsSync } from './useOrganizationsSync'
import { useNotificationsSync } from './useNotificationsSync'

export interface MaxDateResult {
  max_date: string | null
}

export function useSync() {
  const individualsSync = useIndividualsSync()
  const organizationsSync = useOrganizationsSync()
  const ordersSync = useOrdersSync()
  const productsSync = useProductsSync()
  const stockMovementsSync = useStockMovementsSync()
  const notificationsSync = useNotificationsSync()

  productsSync.launch()
  organizationsSync.launch()
  individualsSync.launch()

  const isFinished = computed(
    () =>
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
}
