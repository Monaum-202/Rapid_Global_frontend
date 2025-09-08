import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InventoryComponent } from './inventory/inventory.component';
import { DashboardComponent } from './inventory/dashboard/dashboard.component';
import { AllOrdersComponent } from './inventory/orders/all-orders/all-orders.component';
import { PendingOrdersComponent } from './inventory/orders/pending-orders/pending-orders.component';
import { CompleteOrdersComponent } from './inventory/orders/complete-orders/complete-orders.component';

@NgModule({
  declarations: [
    AppComponent,
    InventoryComponent,
    DashboardComponent,
    AllOrdersComponent,
    PendingOrdersComponent,
    CompleteOrdersComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
