
import { Component, HostListener, OnInit } from '@angular/core';

interface Payment {
  id: string;
  customerName: string;
  paymentDate: string;
  orderId: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'Check';
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  notes?: string;
}

interface TableColumn {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-supplier-payment',
  templateUrl: './supplier-payment.component.html',
  styleUrls: ['./supplier-payment.component.css']
})
export class SupplierPaymentComponent implements OnInit {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  selectedPayment: Payment | null = null;

  // Column visibility configuration
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', visible: true },
    { key: 'customerName', label: 'CUSTOMER NAME', visible: true },
    { key: 'paymentDate', label: 'PAYMENT DATE', visible: true },
    { key: 'orderId', label: 'ORDER ID', visible: true },
    { key: 'amount', label: 'AMOUNT', visible: true },
    { key: 'paymentMethod', label: 'PAYMENT METHOD', visible: false },
    { key: 'paymentStatus', label: 'STATUS', visible: false }
  ];

  // Form data
  formData: any = this.getEmptyFormData();
  isEditMode = false;

  // Table settings
  pageSize = 10;
  currentPage = 1;
  searchTerm = '';
  showColumnDropdown = false;

  ngOnInit(): void {
    this.loadInitialData();
    this.filterPayments();
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
      customerName: '',
      paymentDate: '',
      orderId: '',
      amount: 0,
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
      notes: ''
    };
  }

  // Column visibility methods
  toggleColumnDropdown(): void {
    this.showColumnDropdown = !this.showColumnDropdown;
  }

  get visibleColumns(): TableColumn[] {
    return this.columns.filter(col => col.visible);
  }

  getVisibleColumnsCount(): number {
    return this.visibleColumns.length + 1; // +1 for actions column
  }

  // Search and filter
  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.currentPage = 1;
    this.filterPayments();
  }

  filterPayments(): void {
    if (!this.searchTerm) {
      this.filteredPayments = [...this.payments];
    } else {
      this.filteredPayments = this.payments.filter(p =>
        p.id.toLowerCase().includes(this.searchTerm) ||
        p.customerName.toLowerCase().includes(this.searchTerm) ||
        p.orderId.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  // Pagination
  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = parseInt(select.value);
    this.currentPage = 1;
  }

  get paginatedPayments(): Payment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredPayments.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPayments.length / this.pageSize);
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
  }

  getCellValue(payment: Payment, columnKey: string): any {
    switch(columnKey) {
      case 'id': return payment.id;
      case 'customerName': return payment.customerName;
      case 'paymentDate': return this.formatDate(payment.paymentDate);
      case 'orderId': return payment.orderId;
      case 'amount': return `$${payment.amount.toFixed(2)}`;
      case 'paymentMethod': return payment.paymentMethod;
      case 'paymentStatus': return payment.paymentStatus;
      default: return '';
    }
  }

  openEditModal(payment: Payment): void {
    this.isEditMode = true;
    this.formData = { ...payment };
  }

  openViewModal(payment: Payment): void {
    this.selectedPayment = payment;
  }

  // Form submission
  onSubmit(): void {
    if (!this.formData.customerName || !this.formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (this.isEditMode) {
      const index = this.payments.findIndex(p => p.id === this.formData.id);
      if (index !== -1) {
        this.payments[index] = { ...this.formData };
      }
    } else {
      const newId = this.generateNewId();
      this.formData.id = newId;
      this.payments.unshift({ ...this.formData });
    }

    this.filterPayments();
    this.closeModal('expadd');
  }

  generateNewId(): string {
    const maxId = this.payments.reduce((max, p) => {
      const num = parseInt(p.id.replace('#PAY-', ''));
      return num > max ? num : max;
    }, 0);
    return `#PAY-${String(maxId + 1).padStart(5, '0')}`;
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

  get showingText(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredPayments.length);
    return `Showing ${start} to ${end} of ${this.filteredPayments.length} entries`;
  }

  approvePayment(): void {
    if (this.selectedPayment) {
      const payment = this.payments.find(p => p.id === this.selectedPayment!.id);
      if (payment) {
        payment.paymentStatus = 'Paid';
        this.filterPayments();
        this.closeModal('paymentModal');
      }
    }
  }

  printPaymentReceipt(): void {
    if (!this.selectedPayment) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const payment = this.selectedPayment;
    const currentDate = new Date().toLocaleDateString('en-GB');

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Receipt - ${payment.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background: white;
          font-size: 12px;
          line-height: 1.2;
        }
        .receipt-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 15px;
          border: 2px solid #000;
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
        .receipt-title {
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }
        .receipt-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 10px;
          background: #f5f5f5;
        }
        .info-group {
          flex: 1;
        }
        .info-label {
          font-weight: bold;
          color: #555;
          font-size: 9px;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 11px;
          color: #000;
          font-weight: 500;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .details-table td {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .details-table td:first-child {
          font-weight: 600;
          color: #555;
          width: 40%;
        }
        .amount-box {
          background: #000;
          color: #fff;
          padding: 15px;
          text-align: center;
          margin: 20px 0;
        }
        .amount-box .label {
          font-size: 12px;
          margin-bottom: 5px;
        }
        .amount-box .value {
          font-size: 24px;
          font-weight: bold;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 10px;
        }
        .signature-section {
          margin-top: 30px;
          text-align: right;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin-left: auto;
          margin-top: 40px;
          margin-bottom: 5px;
        }
        @media print {
          body { padding: 10px; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="company-name">RAPID GLOBAL</div>
          <div class="receipt-title">PAYMENT RECEIPT</div>
        </div>

        <div class="receipt-info">
          <div class="info-group">
            <div class="info-label">Receipt ID</div>
            <div class="info-value">${payment.id}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Payment Date</div>
            <div class="info-value">${this.formatDate(payment.paymentDate)}</div>
          </div>
          <div class="info-group">
            <div class="info-label">Print Date</div>
            <div class="info-value">${currentDate}</div>
          </div>
        </div>

        <table class="details-table">
          <tr>
            <td>Customer Name:</td>
            <td>${payment.customerName}</td>
          </tr>
          <tr>
            <td>Order ID:</td>
            <td>${payment.orderId}</td>
          </tr>
          <tr>
            <td>Payment Method:</td>
            <td>${payment.paymentMethod}</td>
          </tr>
          <tr>
            <td>Payment Status:</td>
            <td>${payment.paymentStatus}</td>
          </tr>
        </table>

        <div class="amount-box">
          <div class="label">Amount Paid</div>
          <div class="value">$${payment.amount.toFixed(2)}</div>
        </div>

        ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}

        <div class="signature-section">
          <div class="signature-line"></div>
          <div>Authorized Signature</div>
        </div>

        <div class="footer">
          <p><strong>Rapid Global</strong> - Thank you for your payment</p>
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
    this.payments = [
      {
        id: '#PAY-00001',
        customerName: 'Cloth Supplier',
        paymentDate: '2021-03-12',
        orderId: '#PR-00002',
        amount: 1551,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Paid'
      },
      {
        id: '#PAY-00002',
        customerName: 'Toy Supplier',
        paymentDate: '2021-03-16',
        orderId: '#PR-00003',
        amount: 1551,
        paymentMethod: 'Cash',
        paymentStatus: 'Pending'
      },
      {
        id: '#PAY-00003',
        customerName: 'Footwear Supplier',
        paymentDate: '2021-03-12',
        orderId: '#PR-00002',
        amount: 1200,
        paymentMethod: 'Card',
        paymentStatus: 'Paid'
      },
      {
        id: '#PAY-00004',
        customerName: 'Office Supplies Co.',
        paymentDate: '2021-03-15',
        orderId: '#PR-00003',
        amount: 3302.5,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Paid'
      },
      {
        id: '#PAY-00005',
        customerName: 'BuildRight Hardware',
        paymentDate: '2021-04-02',
        orderId: '#PR-00004',
        amount: 5000,
        paymentMethod: 'Check',
        paymentStatus: 'Paid'
      },
      {
        id: '#PAY-00006',
        customerName: 'Tech Haven',
        paymentDate: '2021-04-12',
        orderId: '#PR-00005',
        amount: 150000,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Paid'
      },
      {
        id: '#PAY-00007',
        customerName: 'Cloth World',
        paymentDate: '2021-04-20',
        orderId: '#PR-00006',
        amount: 7000,
        paymentMethod: 'Cash',
        paymentStatus: 'Pending'
      },
      {
        id: '#PAY-00008',
        customerName: 'EcoPack Ltd.',
        paymentDate: '2021-05-01',
        orderId: '#PR-00007',
        amount: 2000,
        paymentMethod: 'Card',
        paymentStatus: 'Paid'
      }
    ];
  }
}