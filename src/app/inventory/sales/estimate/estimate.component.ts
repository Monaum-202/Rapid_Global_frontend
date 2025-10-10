import { Component, OnInit } from '@angular/core';

interface EstimateItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Estimate {
  id: string;
  items: EstimateItem[];
  date: string;
  buyer: string;
  mobile?: string;
  subtotal: number;
  vat: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
}

@Component({
  selector: 'app-estimate',
  templateUrl: './estimate.component.html',
  styleUrls: ['./estimate.component.css']
})
export class EstimateComponent implements OnInit {
  estimates: Estimate[] = [];
  filteredEstimates: Estimate[] = [];
  selectedEstimate: Estimate | null = null;

  // Form data
  formData: Estimate = this.getEmptyFormData();
  isEditMode = false;

  // Item currently being added
  currentItem: EstimateItem = {
    name: '',
    quantity: 1,
    unitPrice: 0,
    total: 0
  };

  // Table settings
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';

  ngOnInit(): void {
    this.loadInitialData();
    this.filterEstimates();
  }

  loadInitialData(): void {
    this.estimates = [
      {
        id: '#PR-00002',
        items: [{ name: 'Cloth', quantity: 10, unitPrice: 155.1, total: 1551 }],
        date: '2021-03-12',
        buyer: 'Monaum Hossain',
        mobile: '01712345678',
        subtotal: 1551,
        vat: 0,
        tax: 0,
        discount: 0,
        total: 1551,
      },
      {
        id: '#PR-00003',
        items: [
          { name: 'Printer Ink', quantity: 5, unitPrice: 320.5, total: 1602.5 },
          { name: 'A4 Paper (Ream)', quantity: 10, unitPrice: 180, total: 1800 }
        ],
        date: '2021-03-15',
        buyer: 'Melissa Brown',
        mobile: '01887654321',
        subtotal: 3402.5,
        vat: 0,
        tax: 0,
        discount: 100,
        total: 3302.5,
      },
      {
        id: '#PR-00004',
        items: [{ name: 'Office Chair', quantity: 2, unitPrice: 4500, total: 9000 }],
        date: '2021-03-20',
        buyer: 'John Doe',
        mobile: '01911223344',
        subtotal: 9000,
        vat: 0,
        tax: 0,
        discount: 500,
        total: 8500,
      }
    ];
  }

  getEmptyFormData(): Estimate {
    return {
      id: '',
      items: [],
      date: '',
      buyer: '',
      subtotal: 0,
      vat: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: ''
    };
  }

  // Item management
  calculateItemTotal(): void {
    this.currentItem.total = this.currentItem.quantity * this.currentItem.unitPrice;
  }

  addItemToList(): void {
    if (this.currentItem.name && this.currentItem.quantity > 0 && this.currentItem.unitPrice > 0) {
      this.formData.items.push({ ...this.currentItem });
      this.currentItem = { name: '', quantity: 1, unitPrice: 0, total: 0 };
      this.calculateTotals();
    }
  }

  removeItem(index: number): void {
    this.formData.items.splice(index, 1);
    this.calculateTotals();
  }

  // Price calculations
  calculateTotals(): void {
    this.formData.subtotal = this.formData.items.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const vatAmount = (this.formData.subtotal * this.formData.vat) / 100;
    const taxAmount = (this.formData.subtotal * this.formData.tax) / 100;

    this.formData.total = this.formData.subtotal + vatAmount + taxAmount - this.formData.discount;
  }

  // Search and filter
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.currentPage = 1;
    this.filterEstimates();
  }

  filterEstimates(): void {
    if (!this.searchTerm) {
      this.filteredEstimates = [...this.estimates];
    } else {
      this.filteredEstimates = this.estimates.filter(e =>
        e.id.toLowerCase().includes(this.searchTerm) ||
        e.buyer.toLowerCase().includes(this.searchTerm) ||
        e.items.some(item => item.name.toLowerCase().includes(this.searchTerm))
      );
    }
  }

  // Pagination
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value, 10);
    this.currentPage = 1;
  }

  get paginatedEstimates(): Estimate[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEstimates.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredEstimates.length / this.pageSize);
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
    this.currentItem = { name: '', quantity: 1, unitPrice: 0, total: 0 };
  }

  openEditModal(estimate: Estimate): void {
    this.isEditMode = true;
    this.formData = { ...estimate, items: [...estimate.items] };
  }

  openViewModal(estimate: Estimate): void {
    this.selectedEstimate = estimate;
  }


  // Form submission
  onSubmit(): void {
    if (this.formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (this.isEditMode) {
      const index = this.estimates.findIndex(p => p.id === this.formData.id);
      if (index !== -1) {
        this.estimates[index] = { ...this.formData };
      }
    } else {
      const newId = this.generateNewId();
      this.formData.id = newId;
      this.estimates.unshift({ ...this.formData });
    }

    this.filterEstimates();
    this.closeModal('expadd');
  }

  generateNewId(): string {
    const maxId = this.estimates.reduce((max, p) => {
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

  getItemsDisplay(items: EstimateItem[]): string {
    return items.map(item => `${item.name} (${item.quantity})`).join(', ');
  }

  get showingText(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredEstimates.length);
    return `Showing ${start} to ${end} of ${this.filteredEstimates.length} entries`;
  }

  approvePayment(): void {
    if (this.selectedEstimate) {
      const estimate = this.estimates.find(p => p.id === this.selectedEstimate!.id);
      if (estimate) {
        this.filterEstimates();
        this.closeModal('estimateModal');
      }
    }
  }

  printEstimateMemo(): void {
    if (!this.selectedEstimate) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const estimate = this.selectedEstimate;
    const currentDate = new Date().toLocaleDateString('en-GB');

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Estimate Memo - ${estimate.id}</title>
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
          <div class="memo-title">PURCHASE MEMO</div>
        </div>

        <div class="memo-info">
          <div class="info-group">
            <div class="info-label">Estimate ID</div>
            <div class="info-value">${estimate.id}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Date</div>
            <div class="info-value">${this.formatDate(estimate.date)}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Print Date</div>
            <div class="info-value">${currentDate}</div>
          </div>
        </div>

        <div class="compact-layout">
          <div class="compact-section">
            <div class="section-title">Estimate Info</div>
            <table class="details-table">
              <tr><td>Items:</td><td>${estimate.items}</td></tr>
              <tr><td>Supplier:</td><td>${estimate.buyer}</td></tr>
              <tr>
                <td>Status:</td>
              </tr>
            </table>
          </div>

          <div class="payment-section">
            <div class="section-title">Payment Details</div>
            <div class="payment-row">
              <span>Total:</span>
              <span>${estimate.total.toFixed(2)}</span>
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

}