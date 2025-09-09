import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryComponent } from './inventory/inventory.component';
import { DashboardComponent } from './inventory/dashboard/dashboard.component';
import { AllOrdersComponent } from './inventory/orders/all-orders/all-orders.component';
import { SideNavComponent } from './inventory/side-nav/side-nav.component';
import { CustomerComponent } from './inventory/customer/customer.component';
import { SupplierComponent } from './inventory/supplier/supplier.component';

const routes: Routes = [
  { path: '', redirectTo: '/inventory', pathMatch: 'full' },
  { path: 'inventory',component: InventoryComponent,children: [
    { path: '', component: DashboardComponent },
    {path: 'dashboard', component: DashboardComponent},
    {path: 'all-orders',component: AllOrdersComponent},
    {path: 'side-bar',component:SideNavComponent},
    {path: 'customers',component:CustomerComponent},
  {path: 'suppliers',component:SupplierComponent}]
  },
  { path: '**', redirectTo: '/inventory' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
