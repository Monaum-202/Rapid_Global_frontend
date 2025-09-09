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
import { CustomerComponent } from './inventory/customer/customer.component';
import { SupplierComponent } from './inventory/supplier/supplier.component';

@NgModule({
  declarations: [
    AppComponent,
    InventoryComponent,
    DashboardComponent,
    AllOrdersComponent,
    PendingOrdersComponent,
    CompleteOrdersComponent,
    SideNavComponent,
    CustomerComponent,
    SupplierComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
