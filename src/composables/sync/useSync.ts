import { computed, ref, watch } from 'vue'

import { useProductsSync } from './useProductsSync'
import { useStockMovementsSync } from './useStockMovementsSync'
import { useOrdersSync } from './useOrdersSync'
import { useIndividualsSync } from './useIndividualsSync'
import { useOrganizationsSync } from './useOrganizationsSync'
import { useNotificationsSync } from './useNotificationsSync'
import { useUpdateProductsQteRpc } from '../api/products/useUpdateProductsQteRpc'
import { useDeliveriesSync } from './useDeliveriesSync'

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
  const notificationsSync = useNotificationsSync()
  const updateProductsQteRpc = useUpdateProductsQteRpc()

  const newProductsIds = ref<string[]>()

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
    [() => productsSync.queriesReady.value, () => productsSync.productsToSync.value],
    ([queriesReady, productsSync], _, stop) => {
      if (queriesReady && productsSync) {
        newProductsIds.value = productsSync.filter((p) => p.updated_at).map((p) => p.id)
        stop(() => {})
      }
    }
  )

  watch(
    () => stockMovementsSync.pushedStockMovements.value,
    (pushedStockMovements) => {
      if (pushedStockMovements) {
        // Filter stock movements that belong to products needing sync
        updateProductsQteRpc.stockMovementsIds.value = pushedStockMovements
          .filter((s) => !newProductsIds.value?.includes(s.product_id))
          .map((s) => s.id)

        // Execute the update
        updateProductsQteRpc.execute()
      }
    }
  )
}
