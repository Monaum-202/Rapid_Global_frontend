import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
interface InventoryRecord {
date: string;
month: string;
in: number;
use: number;
stock: number;
}

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css']
})
export class StockDetailsComponent  implements OnInit {
fromDate: string = '';
toDate: string = '';
allData: InventoryRecord[] = [
{ date: '2025-01-15', month: 'January', in: 100, use: 30, stock: 70 },
{ date: '2025-02-10', month: 'February', in: 50, use: 25, stock: 95 },
{ date: '2025-03-05', month: 'March', in: 80, use: 40, stock: 135 },
{ date: '2025-04-12', month: 'April', in: 60, use: 35, stock: 160 },
{ date: '2025-05-20', month: 'May', in: 90, use: 45, stock: 205 },
{ date: '2025-06-18', month: 'June', in: 70, use: 30, stock: 245 },
{ date: '2025-07-25', month: 'July', in: 85, use: 50, stock: 280 },
{ date: '2025-08-14', month: 'August', in: 95, use: 40, stock: 335 },
{ date: '2025-09-08', month: 'September', in: 75, use: 35, stock: 375 },
{ date: '2025-10-11', month: 'October', in: 65, use: 28, stock: 412 }
];
filteredData: InventoryRecord[] = [];
ngOnInit() {
this.filteredData = [...this.allData];
}
filterData() {
if (!this.fromDate && !this.toDate) {
this.filteredData = [...this.allData];
return;
}
this.filteredData = this.allData.filter(record => {
  const recordDate = new Date(record.date);
  const from = this.fromDate ? new Date(this.fromDate) : null;
  const to = this.toDate ? new Date(this.toDate) : null;

  if (from && to) {
    return recordDate >= from && recordDate <= to;
  } else if (from) {
    return recordDate >= from;
  } else if (to) {
    return recordDate <= to;
  }
  return true;
});
}
clearFilter() {
this.fromDate = '';
this.toDate = '';
this.filteredData = [...this.allData];
}
getTotalIn(): number {
return this.filteredData.reduce((sum, record) => sum + record.in, 0);
}
getTotalUse(): number {
return this.filteredData.reduce((sum, record) => sum + record.use, 0);
}
getCurrentStock(): number {
if (this.filteredData.length === 0) return 0;
return this.filteredData[this.filteredData.length - 1].stock;
}
}