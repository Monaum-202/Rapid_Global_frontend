import { Component, HostListener, OnInit } from '@angular/core';

interface PurchaseItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Purchase {
  id: string;
  items: PurchaseItem[];
  date: string;
  supplier: string;
  subtotal: number;
  vat: number;
  tax: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partial' | 'Unpaid';
  purchaseStatus: 'Received' | 'Pending' | 'Cancelled';
  orderBy: string;
  notes?: string;
}

interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-purchases-list',
  templateUrl: './purchases-list.component.html',
  styleUrls: ['./purchases-list.component.css']
})
export class PurchasesListComponent implements OnInit {
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  selectedPurchase: Purchase | null = null;

    // Column visibility configuration
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', visible: true },
    { key: 'items', label: 'ITEMS', visible: false },
    { key: 'date', label: 'DATE', visible: true },
    { key: 'supplier', label: 'SUPPLIER', visible: true },
    { key: 'subtotal', label: 'SUBTOTAL', visible: false },
    { key: 'vat', label: 'VAT', visible: false },
    { key: 'tax', label: 'TAX', visible: false },
    { key: 'discount', label: 'DISCOUNT', visible: false },
    { key: 'total', label: 'TOTAL', visible: true },
    { key: 'paid', label: 'PAID', visible: false },
    { key: 'balance', label: 'BALANCE', visible: false },
    { key: 'paymentStatus', label: 'PAYMENT', visible: true },
    { key: 'purchaseStatus', label: 'STATUS', visible: false },
    { key: 'orderBy', label: 'ORDER BY', visible: false }
  ];

  // Form data
  formData: any = this.getEmptyFormData();
  isEditMode = false;

  // Items management
  currentItem: PurchaseItem = {
    name: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  };

  // Table settings
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  showColumnDropdown = false;

  ngOnInit(): void {
    this.loadInitialData();
    this.filterPurchases();
  }

   @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.dropdown');

    if (dropdown && !dropdown.contains(target)) {
      this.showColumnDropdown = false;
    }
  }

  getEmptyFormData(): any {
    return {
      id: '',
      items: [],
      date: '',
      supplier: '',
      subtotal: 0,
      vat: 0,
      tax: 0,
      discount: 0,
      total: 0,
      paid: 0,
      balance: 0,
      paymentStatus: 'Unpaid',
      purchaseStatus: 'Pending',
      orderBy: '',
      notes: ''
    };
  }

  // Column visibility methods
  toggleColumnDropdown(): void {
    this.showColumnDropdown = !this.showColumnDropdown;
  }

  toggleColumnVisibility(column: TableColumn): void {
    column.visible = !column.visible;
  }

  get visibleColumns(): TableColumn[] {
    return this.columns.filter(col => col.visible);
  }

  getVisibleColumnsCount(): number {
    return this.visibleColumns.length + 1; // +1 for actions column
  }

  // Item management
  calculateItemTotal(): void {
    this.currentItem.total = this.currentItem.quantity * this.currentItem.unitPrice;
  }

  addItemToList(): void {
    if (this.currentItem.name && this.currentItem.quantity > 0 && this.currentItem.unitPrice > 0) {
      this.formData.items.push({ ...this.currentItem });
      this.currentItem = {
        name: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      };
      this.calculateTotals();
    }
  }

  removeItem(index: number): void {
    this.formData.items.splice(index, 1);
    this.calculateTotals();
  }

  // Price calculations
  calculateTotals(): void {
    // Calculate subtotal from items
    this.formData.subtotal = this.formData.items.reduce(
      (sum: number, item: PurchaseItem) => sum + item.total,
      0
    );

    // Calculate total with VAT, tax, and discount
    const vatAmount = (this.formData.subtotal * this.formData.vat) / 100;
    const taxAmount = (this.formData.subtotal * this.formData.tax) / 100;

    this.formData.total = this.formData.subtotal + vatAmount + taxAmount - this.formData.discount;

    // Calculate balance
    this.formData.balance = this.formData.total - this.formData.paid;

    // Auto-update payment status
    if (this.formData.balance <= 0 && this.formData.paid > 0) {
      this.formData.paymentStatus = 'Paid';
    } else if (this.formData.paid > 0 && this.formData.balance > 0) {
      this.formData.paymentStatus = 'Partial';
    } else if (this.formData.paid === 0) {
      this.formData.paymentStatus = 'Unpaid';
    }
  }

  // Search and filter
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.currentPage = 1;
    this.filterPurchases();
  }

  filterPurchases(): void {
    if (!this.searchTerm) {
      this.filteredPurchases = [...this.purchases];
    } else {
      this.filteredPurchases = this.purchases.filter(p =>
        p.id.toLowerCase().includes(this.searchTerm) ||
        p.supplier.toLowerCase().includes(this.searchTerm) ||
        p.items.some(item => item.name.toLowerCase().includes(this.searchTerm))
      );
    }
  }

  // Pagination
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value);
    this.currentPage = 1;
  }

  get paginatedPurchases(): Purchase[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredPurchases.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPurchases.length / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Modal operations
  openAddModal(): void {
    this.isEditMode = false;
    this.formData = this.getEmptyFormData();
    this.currentItem = {
      name: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
  }

  getCellValue(purchase: Purchase, columnKey: string): any {
    switch(columnKey) {
      case 'id': return purchase.id;
      case 'items': return this.getItemsDisplay(purchase.items);
      case 'date': return this.formatDate(purchase.date);
      case 'supplier': return purchase.supplier;
      case 'subtotal': return `$${purchase.subtotal.toFixed(2)}`;
      case 'vat': return `${purchase.vat}%`;
      case 'tax': return `${purchase.tax}%`;
      case 'discount': return `$${purchase.discount.toFixed(2)}`;
      case 'total': return `$${purchase.total.toFixed(2)}`;
      case 'paid': return `$${purchase.paid.toFixed(2)}`;
      case 'balance': return `$${purchase.balance.toFixed(2)}`;
      case 'paymentStatus': return purchase.paymentStatus;
      case 'purchaseStatus': return purchase.purchaseStatus;
      case 'orderBy': return purchase.orderBy;
      default: return '';
    }
  }


  openEditModal(purchase: Purchase): void {
    this.isEditMode = true;
    this.formData = { ...purchase, items: [...purchase.items] };
  }

  openViewModal(purchase: Purchase): void {
    this.selectedPurchase = purchase;
  }

  // Form submission
  onSubmit(): void {
    if (this.formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (this.isEditMode) {
      const index = this.purchases.findIndex(p => p.id === this.formData.id);
      if (index !== -1) {
        this.purchases[index] = { ...this.formData };
      }
    } else {
      const newId = this.generateNewId();
      this.formData.id = newId;
      this.purchases.unshift({ ...this.formData });
    }

    this.filterPurchases();
    this.closeModal('expadd');
  }

  generateNewId(): string {
    const maxId = this.purchases.reduce((max, p) => {
      const num = parseInt(p.id.replace('#PR-', ''));
      return num > max ? num : max;
    }, 0);
    return `#PR-${String(maxId + 1).padStart(5, '0')}`;
  }

  // Utility methods
  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }

  getItemsDisplay(items: PurchaseItem[]): string {
    return items.map(item => `${item.name} (${item.quantity})`).join(', ');
  }

  get showingText(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredPurchases.length);
    return `Showing ${start} to ${end} of ${this.filteredPurchases.length} entries`;
  }

  approvePayment(): void {
    if (this.selectedPurchase) {
      const purchase = this.purchases.find(p => p.id === this.selectedPurchase!.id);
      if (purchase) {
        purchase.paymentStatus = 'Paid';
        purchase.paid = purchase.total;
        purchase.balance = 0;
        this.filterPurchases();
        this.closeModal('purchaseModal');
      }
    }
  }

  printPurchaseMemo(): void {
    if (!this.selectedPurchase) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const purchase = this.selectedPurchase;
    const currentDate = new Date().toLocaleDateString('en-GB');

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Memo - ${purchase.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background: white;
          font-size: 12px;
          line-height: 1.2;
        }
        .memo-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 15px;
          page-break-inside: avoid;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .company-name {
          font-size: 20px;
          font-weight: bold;
          color: #000;
          margin-bottom: 2px;
        }
        .memo-title {
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }
        .memo-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 10px;
          background: #f5f5f5;
          border-left: 3px solid #000;
          gap: 10px;
        }
        .info-group {
          flex: 1;
        }
        .info-label {
          font-weight: bold;
          color: #555;
          font-size: 9px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .info-value {
          font-size: 11px;
          color: #000;
          font-weight: 500;
        }
        .details-section {
          margin: 15px 0;
        }
        .section-title {
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #000;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 11px;
        }
        .details-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #eee;
          vertical-align: top;
        }
        .details-table td:first-child {
          font-weight: 600;
          color: #555;
          width: 30%;
        }
        .payment-section {
          background: #f9f9f9;
          padding: 12px;
          margin: 15px 0;
          border: 1px solid #ddd;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 11px;
        }
        .payment-row.total {
          border-top: 1px solid #000;
          margin-top: 6px;
          padding-top: 8px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }
        .status-paid { background: #28a745; color: white; }
        .status-pending { background: #dc3545; color: white; }
        .status-partial { background: #ffc107; color: #000; }
        .status-unpaid { background: #6c757d; color: white; }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 10px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 25px;
        }
        .signature-box {
          text-align: center;
          width: 45%;
          font-size: 10px;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-bottom: 4px;
          padding-top: 25px;
        }
        .compact-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }
        .compact-section {
          border: 1px solid #eee;
          padding: 8px;
        }
        @media print {
          body { padding: 10px; margin: 0; }
          .memo-container { border: 1px solid #000; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="memo-container">
        <div class="header">
          <div class="company-name">RAPID GLOBAL</div>
          <div class="memo-title">SELL MEMO</div>
        </div>

        <div class="memo-info">
          <div class="info-group">
            <div class="info-label">Purchase ID</div>
            <div class="info-value">${purchase.id}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Date</div>
            <div class="info-value">${this.formatDate(purchase.date)}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Print Date</div>
            <div class="info-value">${currentDate}</div>
          </div>
        </div>

        <div class="compact-layout">
          <div class="compact-section">
            <div class="section-title">Purchase Info</div>
            <table class="details-table">
              <tr><td>Items:</td><td>${purchase.items}</td></tr>
              <tr><td>Supplier:</td><td>${purchase.supplier}</td></tr>
              <tr><td>Ordered By:</td><td>${purchase.orderBy}</td></tr>
              <tr>
                <td>Status:</td>
                <td>
                  <span class="status-badge status-${purchase.purchaseStatus.toLowerCase()}">
                    ${purchase.purchaseStatus}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div class="payment-section">
            <div class="section-title">Payment Details</div>
            <div class="payment-row">
              <span>Total:</span>
              <span>${purchase.total.toFixed(2)}</span>
            </div>
            <div class="payment-row">
              <span>Paid:</span>
              <span>${purchase.paid.toFixed(2)}</span>
            </div>
            <div class="payment-row">
              <span>Balance:</span>
              <span>${purchase.balance.toFixed(2)}</span>
            </div>
            <div class="payment-row total">
              <span>Status:</span>
              <span class="status-badge status-${purchase.paymentStatus.toLowerCase()}">
                ${purchase.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>Authorized Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>Supplier Signature</div>
          </div>
        </div>

        <div class="footer">
          <p><strong>Rapid Global</strong> - Thank you for your business</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 100);
        }
      </script>
    </body>
    </html>
  `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }

    loadInitialData(): void {
    // Convert old data format to new format
    this.purchases = [
      {
        id: '#PR-00002',
        items: [{ name: 'Cloth', quantity: 10, unitPrice: 155.1, total: 1551 }],
        date: '2021-03-12',
        supplier: 'Cloth Supplier',
        subtotal: 1551,
        vat: 0,
        tax: 0,
        discount: 0,
        total: 1551,
        paid: 1500,
        balance: 51,
        paymentStatus: 'Pending',
        purchaseStatus: 'Received',
        orderBy: 'Jean Dyer'
      },
      {
        id: '#PR-00003',
        items: [
          { name: 'Printer Ink', quantity: 5, unitPrice: 320.5, total: 1602.5 },
          { name: 'A4 Paper (Ream)', quantity: 10, unitPrice: 180, total: 1800 }
        ],
        date: '2021-03-15',
        supplier: 'Office Supplies Co.',
        subtotal: 3402.5,
        vat: 0,
        tax: 0,
        discount: 100,
        total: 3302.5,
        paid: 3302.5,
        balance: 0,
        paymentStatus: 'Paid',
        purchaseStatus: 'Received',
        orderBy: 'Maria Gomez'
      },
      {
        id: '#PR-00004',
        items: [
          { name: 'Steel Rods', quantity: 50, unitPrice: 110.75, total: 5537.5 },
          { name: 'Nails Pack', quantity: 100, unitPrice: 15, total: 1500 }
        ],
        date: '2021-04-02',
        supplier: 'BuildRight Hardware',
        subtotal: 7037.5,
        vat: 0,
        tax: 0,
        discount: 37.5,
        total: 7000,
        paid: 5000,
        balance: 2000,
        paymentStatus: 'Partial',
        purchaseStatus: 'Received',
        orderBy: 'Richard Hale'
      },
      {
        id: '#PR-00005',
        items: [
          { name: 'Laptop', quantity: 2, unitPrice: 75000, total: 150000 },
          { name: 'Mouse', quantity: 5, unitPrice: 800, total: 4000 }
        ],
        date: '2021-04-12',
        supplier: 'Tech Haven',
        subtotal: 154000,
        vat: 0,
        tax: 0,
        discount: 4000,
        total: 150000,
        paid: 150000,
        balance: 0,
        paymentStatus: 'Paid',
        purchaseStatus: 'Received',
        orderBy: 'Sarah Wilson'
      },
      {
        id: '#PR-00006',
        items: [
          { name: 'Cotton Fabric Roll', quantity: 25, unitPrice: 210.25, total: 5256.25 },
          { name: 'Buttons (Pack of 100)', quantity: 15, unitPrice: 150, total: 2250 }
        ],
        date: '2021-04-20',
        supplier: 'Cloth World',
        subtotal: 7506.25,
        vat: 0,
        tax: 0,
        discount: 0,
        total: 7506.25,
        paid: 7000,
        balance: 506.25,
        paymentStatus: 'Pending',
        purchaseStatus: 'Received',
        orderBy: 'Jean Dyer'
      },
      {
        id: '#PR-00007',
        items: [
          { name: 'Plastic Bottles', quantity: 200, unitPrice: 18.5, total: 3700 },
          { name: 'Bottle Caps', quantity: 200, unitPrice: 2, total: 400 }
        ],
        date: '2021-05-01',
        supplier: 'EcoPack Ltd.',
        subtotal: 4100,
        vat: 0,
        tax: 0,
        discount: 100,
        total: 4000,
        paid: 2000,
        balance: 2000,
        paymentStatus: 'Partial',
        purchaseStatus: 'Received',
        orderBy: 'Tom Harris'
      },
      {
        id: '#PR-00008',
        items: [
          { name: 'PVC Pipe', quantity: 60, unitPrice: 95, total: 5700 },
          { name: 'Pipe Connector', quantity: 30, unitPrice: 45, total: 1350 }
        ],
        date: '2021-05-14',
        supplier: 'PipeZone',
        subtotal: 7050,
        vat: 0,
        tax: 0,
        discount: 50,
        total: 7000,
        paid: 7000,
        balance: 0,
        paymentStatus: 'Paid',
        purchaseStatus: 'Received',
        orderBy: 'Sophie Lane'
      },
      {
        id: '#PR-00009',
        items: [
          { name: 'Toner Cartridge', quantity: 4, unitPrice: 3500, total: 14000 },
          { name: 'Stapler', quantity: 10, unitPrice: 250, total: 2500 }
        ],
        date: '2021-05-25',
        supplier: 'Stationery World',
        subtotal: 16500,
        vat: 0,
        tax: 0,
        discount: 500,
        total: 16000,
        paid: 8000,
        balance: 8000,
        paymentStatus: 'Partial',
        purchaseStatus: 'Received',
        orderBy: 'Michael Ross'
      },
      {
        id: '#PR-00010',
        items: [
          { name: 'Wood Planks', quantity: 80, unitPrice: 220, total: 17600 },
          { name: 'Glue Pack', quantity: 25, unitPrice: 90, total: 2250 }
        ],
        date: '2021-06-10',
        supplier: 'WoodCraft Depot',
        subtotal: 19850,
        vat: 0,
        tax: 0,
        discount: 850,
        total: 19000,
        paid: 19000,
        balance: 0,
        paymentStatus: 'Paid',
        purchaseStatus: 'Received',
        orderBy: 'Olivia Chen'
      },
      {
        id: '#PR-00011',
        items: [
          { name: 'LED Light', quantity: 40, unitPrice: 250, total: 10000 },
          { name: 'Wiring Cable (Roll)', quantity: 10, unitPrice: 1200, total: 12000 }
        ],
        date: '2021-06-22',
        supplier: 'ElectroMart',
        subtotal: 22000,
        vat: 0,
        tax: 0,
        discount: 2000,
        total: 20000,
        paid: 15000,
        balance: 5000,
        paymentStatus: 'Pending',
        purchaseStatus: 'Received',
        orderBy: 'James Carter'
      },
      {
        id: '#PR-00012',
        items: [
          { name: 'Paint Bucket (20L)', quantity: 6, unitPrice: 950, total: 5700 },
          { name: 'Paint Brush Set', quantity: 8, unitPrice: 300, total: 2400 },
          { name: 'Thinner (5L)', quantity: 4, unitPrice: 600, total: 2400 }
        ],
        date: '2021-07-05',
        supplier: 'ColorMix Supplies',
        subtotal: 10500,
        vat: 0,
        tax: 0,
        discount: 500,
        total: 10000,
        paid: 10000,
        balance: 0,
        paymentStatus: 'Paid',
        purchaseStatus: 'Received',
        orderBy: 'Emma Brown'
      },
      {
        id: '#PR-00013',
        items: [
          { name: 'Cleaning Mop', quantity: 10, unitPrice: 350, total: 3500 },
          { name: 'Detergent (5L)', quantity: 5, unitPrice: 500, total: 2500 },
          { name: 'Gloves (Pair)', quantity: 15, unitPrice: 100, total: 1500 }
        ],
        date: '2021-07-15',
        supplier: 'Clean & Care Ltd.',
        subtotal: 7500,
        vat: 0,
        tax: 0,
        discount: 0,
        total: 7500,
        paid: 5000,
        balance: 2500,
        paymentStatus: 'Partial',
        purchaseStatus: 'Received',
        orderBy: 'Daniel Edwards'
      }
    ];
  }

}

















// import { Component, OnInit } from '@angular/core';

// interface Purchase {
//   id: string;
//   items: string;
//   date: string;
//   supplier: string;
//   supplier: string;
//   total: number;
//   paid: number;
//   balance: number;
//   paymentStatus: 'Unpaid' | 'Partial' | 'Paid' | 'Pending';
//   purchaseStatus: 'Pending' | 'Received' | 'Cancelled';
//   orderBy: string;
//   other?: number;
// }

// @Component({
//   selector: 'app-purchases-list',
//   templateUrl: './purchases-list.component.html',
//   styleUrls: ['./purchases-list.component.css'],
// })
// export class PurchasesListComponent implements OnInit {
//   purchases: Purchase[] = [];
//   filteredPurchases: Purchase[] = [];
//   selectedPurchase: Purchase | null = null;

//   // Form model
//   purchaseForm: Purchase = this.getEmptyPurchase();
//   isEditMode = false;

//   // Pagination and filtering
//   searchQuery = '';
//   entriesPerPage = 10;
//   currentPage = 1;

//   ngOnInit() {
//     this.loadInitialData();
//     this.filterPurchases();
//   }

//   loadInitialData() {
//     // Initialize with sample data
//     this.purchases = [
//       {
//         id: '#PR-00002',
//         items: 'Cloth',
//         date: '12/03/2021',
//         supplier: 'Cloth Supplier',
//         supplier: 'Cloth Supplier',
//         total: 1551,
//         paid: 1500,
//         balance: 51,
//         paymentStatus: 'Pending',
//         purchaseStatus: 'Received',
//         orderBy: 'Jean Dyer',
//       },
//       {
//         id: '#PR-00004',
//         items: 'Cycle',
//         date: '16/03/2021',
//         supplier: 'Toy Supplier',
//         supplier: 'Toy Supplier',
//         total: 1551,
//         paid: 0,
//         balance: 1551,
//         paymentStatus: 'Pending',
//         purchaseStatus: 'Pending',
//         orderBy: 'John Smith',
//       },
//       {
//         id: '#PR-00005',
//         items: 'Footwear',
//         date: '12/03/2021',
//         supplier: 'Footwear Suf',
//         supplier: 'Footwear Suf',
//         total: 1200,
//         paid: 1200,
//         balance: 0,
//         paymentStatus: 'Paid',
//         purchaseStatus: 'Received',
//         orderBy: 'Sarah Johnson',
//       },
//       {
//         id: '#PR-00006',
//         items: 'Electronics',
//         date: '18/03/2021',
//         supplier: 'Tech World',
//         supplier: 'ElectroHub Ltd',
//         total: 3250,
//         paid: 3000,
//         balance: 250,
//         paymentStatus: 'Partial',
//         purchaseStatus: 'Received',
//         orderBy: 'Michael Green',
//       },
//       {
//         id: '#PR-00007',
//         items: 'Furniture',
//         date: '20/03/2021',
//         supplier: 'Home Decor',
//         supplier: 'WoodWorks Co',
//         total: 8200,
//         paid: 8200,
//         balance: 0,
//         paymentStatus: 'Paid',
//         purchaseStatus: 'Received',
//         orderBy: 'Rachel Adams',
//       },
//       {
//         id: '#PR-00008',
//         items: 'Stationery',
//         date: '22/03/2021',
//         supplier: 'Office Mart',
//         supplier: 'PaperSource Ltd',
//         total: 780,
//         paid: 0,
//         balance: 780,
//         paymentStatus: 'Pending',
//         purchaseStatus: 'Pending',
//         orderBy: 'Alex Carter',
//       },
//       {
//         id: '#PR-00009',
//         items: 'Groceries',
//         date: '25/03/2021',
//         supplier: 'SuperMart',
//         supplier: 'FreshFoods Supply',
//         total: 2150,
//         paid: 2150,
//         balance: 0,
//         paymentStatus: 'Paid',
//         purchaseStatus: 'Received',
//         orderBy: 'Emma White',
//       },
//       {
//         id: '#PR-00010',
//         items: 'Beverages',
//         date: '27/03/2021',
//         supplier: 'Cool Drinks',
//         supplier: 'DrinkCo Beverages',
//         total: 1340,
//         paid: 1000,
//         balance: 340,
//         paymentStatus: 'Partial',
//         purchaseStatus: 'Received',
//         orderBy: 'Daniel Moore',
//       },
//       {
//         id: '#PR-00011',
//         items: 'Cosmetics',
//         date: '30/03/2021',
//         supplier: 'Beauty Corner',
//         supplier: 'GlowCare Ltd',
//         total: 2760,
//         paid: 0,
//         balance: 2760,
//         paymentStatus: 'Pending',
//         purchaseStatus: 'Pending',
//         orderBy: 'Sophia Davis',
//       },
//       {
//         id: '#PR-00012',
//         items: 'Books',
//         date: '02/04/2021',
//         supplier: 'City Library',
//         supplier: 'EduPress',
//         total: 1900,
//         paid: 1900,
//         balance: 0,
//         paymentStatus: 'Paid',
//         purchaseStatus: 'Received',
//         orderBy: 'Ethan Walker',
//       },
//       {
//         id: '#PR-00013',
//         items: 'Kitchenware',
//         date: '04/04/2021',
//         supplier: 'Home Essentials',
//         supplier: 'CookMate Co',
//         total: 2480,
//         paid: 2000,
//         balance: 480,
//         paymentStatus: 'Partial',
//         purchaseStatus: 'Received',
//         orderBy: 'Lily Roberts',
//       },
//       {
//         id: '#PR-00014',
//         items: 'Toys',
//         date: '06/04/2021',
//         supplier: 'Kids Planet',
//         supplier: 'Toy Supplier',
//         total: 3650,
//         paid: 0,
//         balance: 3650,
//         paymentStatus: 'Pending',
//         purchaseStatus: 'Pending',
//         orderBy: 'James Turner',
//       },
//       {
//         id: '#PR-00015',
//         items: 'Medicines',
//         date: '08/04/2021',
//         supplier: 'Health Plus',
//         supplier: 'PharmaOne',
//         total: 4800,
//         paid: 4800,
//         balance: 0,
//         paymentStatus: 'Paid',
//         purchaseStatus: 'Received',
//         orderBy: 'Olivia Martin',
//       },

//     ];
//   }

//   getEmptyPurchase(): Purchase {
//     return {
//       id: '',
//       items: '',
//       date: '',
//       supplier: '',
//       supplier: '',
//       total: 0,
//       paid: 0,
//       balance: 0,
//       paymentStatus: 'Unpaid',
//       purchaseStatus: 'Pending',
//       orderBy: '',
//       other: 0,
//     };
//   }

//   // Search and filter
//   onSearch(query: string) {
//     this.searchQuery = query.toLowerCase();
//     this.currentPage = 1;
//     this.filterPurchases();
//   }

//   filterPurchases() {
//     if (!this.searchQuery) {
//       this.filteredPurchases = [...this.purchases];
//     } else {
//       this.filteredPurchases = this.purchases.filter(
//         (p) =>
//           p.id.toLowerCase().includes(this.searchQuery) ||
//           p.items.toLowerCase().includes(this.searchQuery) ||
//           p.supplier.toLowerCase().includes(this.searchQuery) ||
//           p.supplier.toLowerCase().includes(this.searchQuery)
//       );
//     }
//   }

//   // Pagination
//   onEntriesPerPageChange(value: number) {
//     this.entriesPerPage = value;
//     this.currentPage = 1;
//   }

//   get paginatedPurchases(): Purchase[] {
//     const start = (this.currentPage - 1) * this.entriesPerPage;
//     const end = start + this.entriesPerPage;
//     return this.filteredPurchases.slice(start, end);
//   }

//   get totalPages(): number {
//     return Math.ceil(this.filteredPurchases.length / this.entriesPerPage);
//   }

//   changePage(page: number) {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//     }
//   }

//   get showingInfo(): string {
//     const start = (this.currentPage - 1) * this.entriesPerPage + 1;
//     const end = Math.min(
//       start + this.entriesPerPage - 1,
//       this.filteredPurchases.length
//     );
//     return `Showing ${start} to ${end} of ${this.filteredPurchases.length} entries`;
//   }

//   // CRUD Operations
//   openAddModal() {
//     this.isEditMode = false;
//     this.purchaseForm = this.getEmptyPurchase();
//   }

//   openEditModal(purchase: Purchase) {
//     this.isEditMode = true;
//     this.purchaseForm = { ...purchase };
//   }

//   viewPurchase(purchase: Purchase) {
//     this.selectedPurchase = { ...purchase };
//   }

//   onTotalOrPaidChange() {
//     const total = this.purchaseForm.total || 0;
//     const paid = this.purchaseForm.paid || 0;
//     this.purchaseForm.balance = total - paid;

//     // Auto-update payment status
//     if (paid === 0) {
//       this.purchaseForm.paymentStatus = 'Unpaid';
//     } else if (paid >= total) {
//       this.purchaseForm.paymentStatus = 'Paid';
//     } else {
//       this.purchaseForm.paymentStatus = 'Partial';
//     }
//   }

//   savePurchase() {
//     if (this.isEditMode) {
//       // Update existing purchase
//       const index = this.purchases.findIndex(
//         (p) => p.id === this.purchaseForm.id
//       );
//       if (index !== -1) {
//         this.purchases[index] = { ...this.purchaseForm };
//       }
//     } else {
//       // Add new purchase
//       const newId = this.generateNewId();
//       this.purchaseForm.id = newId;
//       this.purchaseForm.supplier = this.purchaseForm.supplier; // Set supplier same as supplier
//       this.purchases.unshift({ ...this.purchaseForm });
//     }

//     this.filterPurchases();
//     this.resetForm();
//   }

//   generateNewId(): string {
//     const numbers = this.purchases
//       .map((p) => parseInt(p.id.replace('#PR-', '')))
//       .filter((n) => !isNaN(n));

//     const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
//     const newNumber = (maxNumber + 1).toString().padStart(5, '0');
//     return `#PR-${newNumber}`;
//   }

//   resetForm() {
//     this.purchaseForm = this.getEmptyPurchase();
//     this.isEditMode = false;
//   }

//   deletePurchase(id: string) {
//     if (confirm('Are you sure you want to delete this purchase?')) {
//       this.purchases = this.purchases.filter((p) => p.id !== id);
//       this.filterPurchases();
//     }
//   }

//   approvePurchase(purchase: Purchase) {
//     const index = this.purchases.findIndex((p) => p.id === purchase.id);
//     if (index !== -1) {
//       this.purchases[index].purchaseStatus = 'Received';
//       this.purchases[index].paymentStatus = 'Paid';
//       this.purchases[index].paid = this.purchases[index].total;
//       this.purchases[index].balance = 0;
//       this.selectedPurchase = { ...this.purchases[index] };
//       this.filterPurchases();
//     }
//   }

//   // Helper methods for template
//   getStatusClass(status: string): string {
//     switch (status.toLowerCase()) {
//       case 'paid':
//       case 'received':
//         return 'good';
//       case 'pending':
//       case 'partial':
//         return 'bad';
//       case 'unpaid':
//       case 'cancelled':
//         return 'bad';
//       default:
//         return '';
//     }
//   }
// }
