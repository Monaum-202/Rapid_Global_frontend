import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryComponent } from './inventory/inventory.component';
import { DashboardComponent } from './inventory/dashboard/dashboard.component';
import { AllOrdersComponent } from './inventory/orders/all-orders/all-orders.component';
import { SideNavComponent } from './inventory/side-nav/side-nav.component';
import { SupplierComponent } from './inventory/supplier/supplier.component';

import { SalesListComponent } from './inventory/sales/sales-list/sales-list.component';
import { CustomerPaymentComponent } from './inventory/sales/customer-payment/customer-payment.component';
import { SalesReturnComponent } from './inventory/sales/sales-return/sales-return.component';
import { CustomersComponent } from './inventory/sales/customers/customers.component';
import { PurchasesListComponent } from './inventory/purchases/purchases-list/purchases-list.component';
import { SupplierPaymentComponent } from './inventory/purchases/supplier-payment/supplier-payment.component';
import { PurchasesReturnsComponent } from './inventory/purchases/purchases-returns/purchases-returns.component';
import { SuppliersComponent } from './inventory/purchases/suppliers/suppliers.component';
import { InventoryReportsComponent } from './inventory/report/inventory-reports/inventory-reports.component';
import { StockListComponent } from './inventory/inventoryMenu/stock-list/stock-list.component';
import { StockDetailsComponent } from './inventory/inventoryMenu/stock-details/stock-details.component';
import { PurchaseReportsComponent } from './inventory/report/purchase-reports/purchase-reports.component';
import { SalesReportsComponent } from './inventory/report/sales-reports/sales-reports.component';
import { ProfitAndLossComponent } from './inventory/report/profit-and-loss/profit-and-loss.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'inventory',component: InventoryComponent,children: [
    { path: '', component: DashboardComponent },


    //Dashboard
    {path: 'dashboard', component: DashboardComponent},

    //Sales
    {path: 'sales-list',component:SalesListComponent},
    {path: 'customer',component:CustomersComponent},
    {path: 'customer-payment',component:CustomerPaymentComponent},
    {path: 'sales-return',component:SalesReturnComponent},

    //Purchases
    {path: 'purchase-list',component:PurchasesListComponent},
    {path: 'supplier',component:SuppliersComponent},
    {path: 'supplier-payment',component:SupplierPaymentComponent},
    {path: 'purchase-return',component:PurchasesReturnsComponent},


    //Reports

    {path: 'inventory-report',component:InventoryReportsComponent},
    {path: 'purchase-report',component:PurchaseReportsComponent},
    {path: 'sales-report',component:SalesReportsComponent},
    {path: 'payment-report',component:PurchasesReturnsComponent},
    {path: 'profit-loss-statement',component:ProfitAndLossComponent},

    //Inventory
    {path: 'stock-details',component:StockDetailsComponent},
    {path: 'stock-list',component:StockListComponent},
    {path: 'purchase-report',component:SuppliersComponent},
    {path: 'sales-report',component:SupplierPaymentComponent},
    {path: 'payment-report',component:PurchasesReturnsComponent},

    {path: 'all-orders',component: AllOrdersComponent},
    {path: 'side-bar',component:SideNavComponent},
    {path: 'suppliers',component:SupplierComponent},
  ]
  },
  { path: '**', redirectTo: '/inventory' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
