import { Component, OnInit } from '@angular/core';

interface Purchase {
  date: string;
  supplier: string;
  item: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface DateWiseSummary {
  date: string;
  day: number;
  totalAmount: number;
  purchaseCount: number;
}

@Component({
  selector: 'app-purchase-reports',
  templateUrl: './purchase-reports.component.html',
  styleUrls: ['./purchase-reports.component.css']
})

export class PurchaseReportsComponent {
  startDate: string = '';
  endDate: string = '';
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  totalAmount: number = 0;
  viewType: string = 'item'; // 'item' or 'date'
  dateWiseData: DateWiseSummary[] = [];

  constructor() {
    // Mock purchase data
    this.purchases = [
      { date: '2025-10-01', supplier: 'ABC Traders', item: 'Cement', quantity: 100, unitPrice: 550, total: 55000 },
      { date: '2025-10-02', supplier: 'BuildMax Ltd', item: 'Bricks', quantity: 500, unitPrice: 12, total: 6000 },
      { date: '2025-10-02', supplier: 'SteelCo', item: 'Iron Rod', quantity: 50, unitPrice: 1200, total: 60000 },
      { date: '2025-10-03', supplier: 'PaintPro', item: 'Paint', quantity: 30, unitPrice: 850, total: 25500 },
      { date: '2025-10-04', supplier: 'ABC Traders', item: 'Sand', quantity: 200, unitPrice: 80, total: 16000 },
      { date: '2025-10-07', supplier: 'WoodWorks', item: 'Plywood', quantity: 80, unitPrice: 1800, total: 144000 },
      { date: '2025-10-08', supplier: 'OfficeWorld', item: 'Paper', quantity: 120, unitPrice: 420, total: 50400 },
      { date: '2025-10-09', supplier: 'BuildMax Ltd', item: 'Bricks', quantity: 750, unitPrice: 11.5, total: 8625 },
      { date: '2025-10-10', supplier: 'ColorCraft', item: 'Color', quantity: 25, unitPrice: 350, total: 8750 },
      { date: '2025-10-11', supplier: 'SteelCo', item: 'Iron Rod', quantity: 35, unitPrice: 1250, total: 43750 },
      { date: '2025-10-12', supplier: 'ABC Traders', item: 'Cement', quantity: 150, unitPrice: 545, total: 81750 },
      { date: '2025-10-13', supplier: 'PaintPro', item: 'Paint', quantity: 45, unitPrice: 830, total: 37350 },
      { date: '2025-10-14', supplier: 'Global Supplies', item: 'Glass', quantity: 20, unitPrice: 2200, total: 44000 },
      { date: '2025-10-15', supplier: 'OfficeWorld', item: 'Paper', quantity: 90, unitPrice: 440, total: 39600 },
      { date: '2025-10-16', supplier: 'ColorCraft', item: 'Color', quantity: 60, unitPrice: 310, total: 18600 },
      { date: '2025-10-17', supplier: 'BuildMax Ltd', item: 'Gravel', quantity: 300, unitPrice: 65, total: 19500 },
      { date: '2025-10-18', supplier: 'PlumbEasy', item: 'PVC Pipes', quantity: 100, unitPrice: 280, total: 28000 },
      { date: '2025-10-19', supplier: 'ABC Traders', item: 'Sand', quantity: 180, unitPrice: 82, total: 14760 },
      { date: '2025-10-20', supplier: 'WoodWorks', item: 'Timber', quantity: 60, unitPrice: 950, total: 57000 },
      { date: '2025-10-21', supplier: 'ElectroPower', item: 'Electrical Wires', quantity: 200, unitPrice: 45, total: 9000 },
      { date: '2025-10-22', supplier: 'ColorCraft', item: 'Color', quantity: 35, unitPrice: 340, total: 11900 },
      { date: '2025-10-23', supplier: 'OfficeWorld', item: 'Paper', quantity: 200, unitPrice: 410, total: 82000 },
      { date: '2025-10-24', supplier: 'RoofMasters', item: 'Roof Tiles', quantity: 400, unitPrice: 110, total: 44000 },
      { date: '2025-10-25', supplier: 'SteelCo', item: 'Steel Beams', quantity: 15, unitPrice: 4500, total: 67500 },
      { date: '2025-10-26', supplier: 'PaintPro', item: 'Primer', quantity: 20, unitPrice: 720, total: 14400 }
    ];
    this.filteredPurchases = this.purchases;
    this.calculateTotal();
    this.prepareDateWiseData();
  }

  filterByDate() {
    if (!this.startDate || !this.endDate) {
      this.filteredPurchases = this.purchases;
    } else {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      this.filteredPurchases = this.purchases.filter(p => {
        const d = new Date(p.date);
        return d >= start && d <= end;
      });
    }
    this.calculateTotal();
    this.prepareDateWiseData();
  }

  calculateTotal() {
    this.totalAmount = this.filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  }

  onViewTypeChange() {
    if (this.viewType === 'date') {
      this.prepareDateWiseData();
    }
  }

  prepareDateWiseData() {
    // Group purchases by date
    const grouped = new Map<string, Purchase[]>();

    this.filteredPurchases.forEach(p => {
      if (!grouped.has(p.date)) {
        grouped.set(p.date, []);
      }
      grouped.get(p.date)!.push(p);
    });

    // Create date-wise summary
    const summaries: DateWiseSummary[] = [];
    grouped.forEach((purchases, date) => {
      const day = new Date(date).getDate();
      const totalAmount = purchases.reduce((sum, p) => sum + p.total, 0);
      summaries.push({
        date,
        day,
        totalAmount,
        purchaseCount: purchases.length
      });
    });

    // Sort by day
    this.dateWiseData = summaries.sort((a, b) => a.day - b.day);
  }
}