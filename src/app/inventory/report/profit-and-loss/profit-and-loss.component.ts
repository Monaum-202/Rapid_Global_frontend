import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-profit-and-loss',
  templateUrl: './profit-and-loss.component.html',
  styleUrls: ['./profit-and-loss.component.css']
})
export class ProfitAndLossComponent implements OnInit, AfterViewInit {

  formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

  purchases = [
  {date:'2025-09-05', desc:'Paper purchase', amount:50000, tag:'material'},
  {date:'2025-09-10', desc:'Color inks', amount:30000, tag:'material'},
  {date:'2025-10-02', desc:'Paper purchase', amount:60000, tag:'material'},
];

sales = [
  {date:'2025-09-20', desc:'Printed cloth order #001', amount:200000, tag:'sale'},
  {date:'2025-10-15', desc:'Printed cloth order #002', amount:180000, tag:'sale'},
];

jobMaterialUsage = [
  {date:'2025-09-20', job:'#001', desc:'Materials for job #001', amount:90000, tag:'cogs'},
  {date:'2025-10-15', job:'#002', desc:'Materials for job #002', amount:80000, tag:'cogs'},
];

salaries = [
  {date:'2025-09-30', desc:'Salaries Sep', amount:40000, tag:'salary'},
  {date:'2025-10-31', desc:'Salaries Oct', amount:45000, tag:'salary'},
];

expenses = [
  {date:'2025-09-12', desc:'Office rent', amount:20000, tag:'expense'},
  {date:'2025-10-18', desc:'Machine maintenance', amount:15000, tag:'expense'},
  {date:'2025-10-20', desc:'Electricity', amount:12000, tag:'expense'},
];

  chart: Chart | null = null;

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Initialize with full data range
    this.render();
  }

  parseDate(d: string): Date {
    return new Date(d + 'T00:00:00');
  }

  inRange(dateStr: string, from: Date | null, to: Date | null): boolean {
    const d = this.parseDate(dateStr);
    if(from && d < from) return false;
    if(to && d > to) return false;
    return true;
  }

  formatBdt(n: number): string {
    return '৳ ' + n.toLocaleString('en-BD');
  }

  calculate(from: string | null = null, to: string | null = null) {
    const fromDate = from ? this.parseDate(from) : null;
    const toDate = to ? this.parseDate(to) : null;

    const filtered = (arr: any[]) => arr.filter(t => this.inRange(t.date, fromDate, toDate));

    const totalSales = filtered(this.sales).reduce((s,x) => s + x.amount, 0);
    const totalCogs = filtered(this.jobMaterialUsage).reduce((s,x) => s + x.amount, 0);
    const totalSalaries = filtered(this.salaries).reduce((s,x) => s + x.amount, 0);
    const totalExpenses = filtered(this.expenses).reduce((s,x) => s + x.amount, 0);
    const totalPurchases = filtered(this.purchases).reduce((s,x) => s + x.amount, 0);

    const grossProfit = totalSales - totalCogs;
    const operatingExpenses = totalSalaries + totalExpenses;
    const netProfit = grossProfit - operatingExpenses;

    return {
      totalSales, totalCogs, totalSalaries, totalExpenses, totalPurchases,
      grossProfit, operatingExpenses, netProfit,
      txns: [
        ...filtered(this.sales).map(t => ({...t, type:'Sale'})),
        ...filtered(this.purchases).map(t => ({...t, type:'Purchase'})),
        ...filtered(this.jobMaterialUsage).map(t => ({...t, type:'COGS'})),
        ...filtered(this.salaries).map(t => ({...t, type:'Salary'})),
        ...filtered(this.expenses).map(t => ({...t, type:'Expense'}))
      ].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    };
  }

  render(from: string | null = null, to: string | null = null): void {
    const r = this.calculate(from, to);

    const totalSalesEl = document.getElementById('totalSales');
    const cogsEl = document.getElementById('cogs');
    const opexEl = document.getElementById('opex');
    const netProfitEl = document.getElementById('netProfit');

    if(totalSalesEl) totalSalesEl.innerText = this.formatBdt(r.totalSales);
    if(cogsEl) cogsEl.innerText = this.formatBdt(r.totalCogs);
    if(opexEl) opexEl.innerText = this.formatBdt(r.operatingExpenses);
    if(netProfitEl) netProfitEl.innerText = this.formatBdt(r.netProfit);

    // Summary
    const sum = document.getElementById('summaryList');
    if(sum) {
      sum.innerHTML = '';
      const items = [
        ['Gross Profit', r.grossProfit],
        ['Total Purchases (materials bought)', r.totalPurchases],
        ['Total Salaries', r.totalSalaries],
        ['Other Expenses', r.totalExpenses]
      ];
      items.forEach(it => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${it[0]}:</strong> ${this.formatBdt(it[1] as number)}`;
        sum.appendChild(li);
      });
    }

    // Transactions table
    const tbody = document.getElementById('txnTable');
    if(tbody) {
      tbody.innerHTML = '';
      r.txns.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${t.date}</td><td>${t.type}</td><td>${t.desc || (t as any).job || ''}</td><td>${this.formatBdt(t.amount)}</td><td>${t.tag || ''}</td>`;
        tbody.appendChild(tr);
      });
    }

    // Chart
    this.renderChart(r.txns);
  }

  renderChart(txns: any[]): void {
    const months: {[key: string]: {revenue: number, cogs: number, expenses: number}} = {};

    const pushMonth = (dateStr: string, series: 'revenue' | 'cogs' | 'expenses', value: number) => {
      const d = new Date(dateStr + 'T00:00:00');
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      months[key] = months[key] || {revenue: 0, cogs: 0, expenses: 0};
      months[key][series] += value;
    };

    txns.forEach(t => {
      if(t.type === 'Sale') pushMonth(t.date, 'revenue', t.amount);
      if(t.type === 'COGS') pushMonth(t.date, 'cogs', t.amount);
      if(t.type === 'Salary' || t.type === 'Expense' || t.type === 'Purchase') {
        pushMonth(t.date, 'expenses', t.amount);
      }
    });

    const labels = Object.keys(months).sort();
    const revenueData = labels.map(k => months[k].revenue);
    const cogsData = labels.map(k => months[k].cogs);
    const expensesData = labels.map(k => months[k].expenses);

    const ctx = document.getElementById('profitChart') as HTMLCanvasElement;
    if(ctx) {
      if(this.chart) this.chart.destroy();
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {label: 'Revenue', data: revenueData, stack: 'stack1'},
            {label: 'COGS', data: cogsData, stack: 'stack1'},
            {label: 'Expenses', data: expensesData, stack: 'stack1'}
          ]
        },
        options: {
          responsive: true,
          interaction: {mode: 'index', intersect: false},
          plugins: {legend: {position: 'top'}},
          scales: {y: {beginAtZero: true}}
        }
      });
    }
  }

  onApply(): void {
    const startEl = document.getElementById('start') as HTMLInputElement;
    const endEl = document.getElementById('end') as HTMLInputElement;
    const s = startEl?.value;
    const e = endEl?.value;
    this.render(s || null, e || null);
  }

  onReset(): void {
    const startEl = document.getElementById('start') as HTMLInputElement;
    const endEl = document.getElementById('end') as HTMLInputElement;
    if(startEl) startEl.value = '';
    if(endEl) endEl.value = '';
    this.render();
  }

  exportCsv(): void {
    const startEl = document.getElementById('start') as HTMLInputElement;
    const endEl = document.getElementById('end') as HTMLInputElement;
    const r = this.calculate(startEl?.value, endEl?.value);
    const rows = [['Date', 'Type', 'Description', 'Amount', 'Tag']];
    r.txns.forEach(t => rows.push([t.date, t.type, t.desc || '', t.amount.toString(), t.tag || '']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}