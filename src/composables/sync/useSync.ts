import { computed, watch } from 'vue'

import { useProductsSync } from './useProductsSync'
import { useStockMovementsSync } from './useStockMovementsSync'
import { useOrdersSync } from './useOrdersSync'
import { useIndividualsSync } from './useIndividualsSync'
import { useOrganizationsSync } from './useOrganizationsSync'
import { useNotificationsSync } from './useNotificationsSync'

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

  const orgsAndIndivsFinished = computed(
    () => organizationsSync.isFinished.value && individualsSync.isFinished.value
  )
  watch(
    () => productsSync.isFinished.value,
    (isFinished) => {
      if (isFinished) {
        stockMovementsSync.launch()
      }
    }
  )

  watch(orgsAndIndivsFinished, (allFinished) => {
    if (allFinished) {
      ordersSync.launch()
    }
  })

  watch(
    () => ordersSync.isFinished.value,
    (isFinished) => {
      if (isFinished) {
        notificationsSync.launch()
      }
    }
  )
}
