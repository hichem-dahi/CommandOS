import { createRouter, createWebHistory } from 'vue-router'

import AuthView from '@/views/AuthView.vue'
import HomeView from '@/views/HomeView.vue'
import WarehouseView from '@/views/WarehouseView.vue'
import ClientsView from '@/views/ClientsView.vue'
import OrderView from '@/views/OrderView.vue'
import ProductView from '@/views/ProductView.vue'
import NewProfileView from '@/views/NewProfileView.vue'
import OrdersHistoryView from '@/views/OrdersHistoryView.vue'
import CreateOrder from '@/views/OrdersView/CreateOrder.vue'
import ClientHistoryView from '@/views/ClientsView/ClientHistory.vue'
import CreateClientView from '@/views/ClientsView/CreateClientView.vue'
import ProformaView from '@/views/OrderView/DocumentTemplates/Organization/ProformaView.vue'
import InvoiceView from '@/views/OrderView/DocumentTemplates/Organization/InvoiceView.vue'
import VoucherView from '@/views/OrderView/DocumentTemplates/Individual/VoucherView.vue'
import PaymentVoucher from '@/views/OrderView/DocumentTemplates/PaymentVoucher.vue'
import CreateSaleView from '@/views/CreateSaleView.vue'
import OrganizationsView from '@/views/OrganizationsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: [
        {
          path: '/clients',
          name: 'clients',
          component: ClientsView
        },
        {
          path: '/warehouse',
          name: 'warehouse',
          component: WarehouseView
        },

        {
          path: '/create-order',
          name: 'create-order',
          component: CreateOrder
        },
        {
          path: '/order/:order_id',
          name: 'order',
          component: OrderView
        },
        {
          path: '/client-history',
          name: 'client-history',
          component: ClientHistoryView
        },
        {
          path: '/product/:product_id',
          name: 'product',
          component: ProductView
        },
        {
          path: '/orders-history',
          name: 'orders-history',
          component: OrdersHistoryView
        },
        {
          path: '/create-client',
          name: 'create-client',
          component: CreateClientView
        },
        {
          path: '/create-sale',
          name: 'create-sale',
          component: CreateSaleView
        }
      ]
    },
    {
      path: '/invoice/:order_id',
      name: 'invoice',
      component: InvoiceView
    },
    {
      path: '/voucher/:order_id',
      name: 'voucher',
      component: VoucherView
    },
    {
      path: '/proforma/:proforma_id',
      name: 'proforma',
      component: ProformaView
    },
    {
      path: '/payment/:payment_id',
      name: 'payment',
      component: PaymentVoucher
    },
    {
      path: '/self',
      name: 'self',
      component: NewProfileView
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView
    },
    {
      path: '/organizations',
      name: 'organizations',
      component: OrganizationsView
    }
  ]
})

export default router
