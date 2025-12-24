
// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryComponent } from './inventory/inventory.component';
import { DashboardComponent } from './inventory/dashboard/dashboard.component';
import { AllOrdersComponent } from './inventory/orders/all-orders/all-orders.component';
import { SideNavComponent } from './inventory/side-nav/side-nav.component';
import { SupplierComponent } from './inventory/supplier/supplier.component';
import { CustomerPaymentComponent } from './inventory/sales/customer-payment/customer-payment.component';
import { SalesReturnComponent } from './inventory/sales/sales-return/sales-return.component';
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
import { ExpensesComponent } from './inventory/accounts/expenses/expenses.component';
// import { EstimateComponent } from './inventory/sales/estimate/estimate.component';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { EmployeeComponent } from './inventory/master/employee/employee.component';
import { PaymentMethodComponent } from './inventory/master/payment-method/payment-method.component';
import { TransectionCategoryComponent } from './inventory/master/transection-category/transection-category.component';
import { UserComponent } from './inventory/master/user/user/user.component';
import { ProfileComponent } from './inventory/master/user/profile/profile.component';
import { IncomeComponent } from './inventory/accounts/income/income.component';
import { UnitComponent } from './inventory/master/unit/unit.component';
import { CustomerComponent } from './inventory/sales/customer/customer.component';
import { SalesListComponent } from './inventory/sales/sales-list/sales-list.component';
import { ProductComponent } from './inventory/master/product/product.component';
import { EstimateListComponent } from './inventory/sales/estimate-list/estimate-list.component';
import { IncomeReportComponent } from './inventory/report/income-report/income-report.component';
import { FinancialReportComponent } from './inventory/report/financial-report/financial-report.component';
import { BOMListComponent } from './inventory/production/bomlist/bomlist.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Add this
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent},

      // Master / Configuration
      { path: 'employee', component: EmployeeComponent },
      { path: 'payment-method', component: PaymentMethodComponent },
      { path: 'transection-catregory', component: TransectionCategoryComponent},
      { path: 'user', component: UserComponent},
      { path: 'unit', component: UnitComponent},
      { path: 'product', component: ProductComponent},


      // Sales
      { path: 'sales-list', component: SalesListComponent },
      { path: 'customer', component: CustomerComponent },
      { path: 'customer-payment', component: CustomerPaymentComponent },
      { path: 'sales-return', component: SalesReturnComponent },
      { path: 'estimate', component: EstimateListComponent },

      // Purchases
      { path: 'purchase-list', component: PurchasesListComponent },
      { path: 'supplier', component: SuppliersComponent },
      { path: 'supplier-payment', component: SupplierPaymentComponent },
      { path: 'purchase-return', component: PurchasesReturnsComponent },

      //Production
      { path: 'bill-of-materials', component: BOMListComponent },

      // Reports
      { path: 'inventory-report', component: InventoryReportsComponent },
      { path: 'purchase-report', component: PurchaseReportsComponent },
      { path: 'sales-report', component: SalesReportsComponent },
      { path: 'income-report', component: IncomeReportComponent },
      { path: 'financial-report', component: FinancialReportComponent },
      { path: 'profit-loss-statement', component: ProfitAndLossComponent },

      // Inventory
      { path: 'stock-details', component: StockDetailsComponent },
      { path: 'stock-list', component: StockListComponent },

      // Accounts
      { path: 'expenses', component: ExpensesComponent },
      { path: 'incomes', component: IncomeComponent},

      { path: 'all-orders', component: AllOrdersComponent },
      { path: 'side-bar', component: SideNavComponent },
      { path: 'suppliers', component: SupplierComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }