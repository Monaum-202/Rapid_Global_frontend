import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InventoryComponent } from './inventory/inventory.component';
import { DashboardComponent } from './inventory/dashboard/dashboard.component';
import { AllOrdersComponent } from './inventory/orders/all-orders/all-orders.component';
import { PendingOrdersComponent } from './inventory/orders/pending-orders/pending-orders.component';
import { CompleteOrdersComponent } from './inventory/orders/complete-orders/complete-orders.component';
import { SideNavComponent } from './inventory/side-nav/side-nav.component';
import { SupplierComponent } from './inventory/supplier/supplier.component';
// import { SalesListComponent } from './inventory/sales/sales-list/sales-list.component';
import { CustomerPaymentComponent } from './inventory/sales/customer-payment/customer-payment.component';
import { SalesReturnComponent } from './inventory/sales/sales-return/sales-return.component';
// import { CustomersComponent } from './inventory/sales/customers/customers.component';
// import { CustomerComponent } from './inventory/customer/customer.component';
import { PurchasesListComponent } from './inventory/purchases/purchases-list/purchases-list.component';
import { PurchasesReturnsComponent } from './inventory/purchases/purchases-returns/purchases-returns.component';
import { SupplierPaymentComponent } from './inventory/purchases/supplier-payment/supplier-payment.component';
import { InventoryReportsComponent } from './inventory/report/inventory-reports/inventory-reports.component';
import { PurchaseReportsComponent } from './inventory/report/purchase-reports/purchase-reports.component';
import { SalesReportsComponent } from './inventory/report/sales-reports/sales-reports.component';
import { PaymentReportsComponent } from './inventory/report/payment-reports/payment-reports.component';
import { StockDetailsComponent } from './inventory/inventoryMenu/stock-details/stock-details.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProfitAndLossComponent } from './inventory/report/profit-and-loss/profit-and-loss.component';
import { ExpensesComponent } from './inventory/accounts/expenses/expenses.component';
// import { EstimateComponent } from './inventory/sales/estimate/estimate.component';
import { SuppliersComponent } from './inventory/purchases/suppliers/suppliers.component';
import { LoginComponent } from './auth/login/login.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { EmployeeComponent } from './inventory/master/employee/employee.component';
import { AuthInterceptorService } from './core/services/auth-interceptor.service';
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

@NgModule({
  declarations: [
    AppComponent,
    InventoryComponent,
    DashboardComponent,
    AllOrdersComponent,
    PendingOrdersComponent,
    CompleteOrdersComponent,
    SideNavComponent,
    // CustomerComponent,
    SupplierComponent,
    // SalesListComponent,
    CustomerPaymentComponent,
    SalesReturnComponent,
    // CustomersComponent,
    PurchasesListComponent,
    PurchasesReturnsComponent,
    SuppliersComponent,
    SupplierPaymentComponent,
    InventoryReportsComponent,
    PurchaseReportsComponent,
    SalesReportsComponent,
    PaymentReportsComponent,
    StockDetailsComponent,
    ProfitAndLossComponent,
    ExpensesComponent,
    // EstimateComponent,
    LoginComponent,
    EmployeeComponent,
    PaymentMethodComponent,
    TransectionCategoryComponent,
    UserComponent,
    ProfileComponent,
    IncomeComponent,
    UnitComponent,
    CustomerComponent,
    SalesListComponent,
    ProductComponent,
    EstimateListComponent,
    IncomeReportComponent,
    FinancialReportComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    // ✅ Register the interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
