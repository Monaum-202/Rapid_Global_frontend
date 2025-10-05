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

  exportToPDF() {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const htmlContent = this.generatePrintableHTML();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  exportToWord() {
    const htmlContent = this.generateExportHTML();
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Purchase_Report_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportToExcel() {
    let csvContent = '';
    
    if (this.viewType === 'item') {
      csvContent = 'Date,Supplier,Item,Quantity,Unit Price,Total\n';
      this.filteredPurchases.forEach(p => {
        csvContent += `${p.date},${p.supplier},${p.item},${p.quantity},${p.unitPrice},${p.total}\n`;
      });
      csvContent += `,,,,Total,${this.totalAmount}\n`;
    } else {
      csvContent = 'Day,Date,Number of Purchases,Total Amount\n';
      this.dateWiseData.forEach(d => {
        csvContent += `${d.day},${d.date},${d.purchaseCount},${d.totalAmount}\n`;
      });
      csvContent += `,,,Total,${this.totalAmount}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Purchase_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private generatePrintableHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h2 { text-align: center; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #343a40; color: white; }
          tfoot { font-weight: bold; }
          .meta { margin-bottom: 15px; }
        </style>
      </head>
      <body>
        ${this.generateExportHTML()}
      </body>
      </html>
    `;
  }

  private generateExportHTML(): string {
    const dateRange = this.startDate && this.endDate 
      ? `<p class="meta"><strong>Period:</strong> ${this.startDate} to ${this.endDate}</p>`
      : '';
    
    let tableHTML = '';
    
    if (this.viewType === 'item') {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredPurchases.map(p => `
              <tr>
                <td>${p.date}</td>
                <td>${p.supplier}</td>
                <td>${p.item}</td>
                <td>${p.quantity}</td>
                <td>${p.unitPrice.toFixed(2)}</td>
                <td>${p.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right;">Total:</td>
              <td>${this.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th>Number of Purchases</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${this.dateWiseData.map(d => `
              <tr>
                <td>${d.day}</td>
                <td>${d.date}</td>
                <td>${d.purchaseCount}</td>
                <td>${d.totalAmount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align: right;">Total:</td>
              <td>${this.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    return `
      <h2>📅 Purchase Report</h2>
      <p class="meta"><strong>Report Type:</strong> ${this.viewType === 'item' ? 'Item Wise' : 'Date Wise'}</p>
      ${dateRange}
      ${tableHTML}
    `;
  }

}