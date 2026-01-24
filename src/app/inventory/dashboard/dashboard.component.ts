import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardMetrics, DashboardService, RevenueDetails, ExpenseDetails, TrendData } from 'src/app/core/services/dashboard/dashboard.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { PageHeaderService } from 'src/app/core/services/page-header/page-header.service';

Chart.register(...registerables);

interface MetricCardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  bgColor: string;
  accentColor: string;
}

interface InventoryItem {
  label: string;
  count: number;
  icon?: string;
  color?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  entityName = 'Dashboard';
  timeFilter: string = 'MONTH';
  timeFilters: string[] = ['TODAY', 'WEEK', 'MONTH', 'YEAR'];

  isLoading: boolean = false;
  error: string | null = null;

  mainMetrics: MetricCardData[] = [];
  secondaryMetrics: MetricCardData[] = [];
  metrics!: DashboardMetrics;

  // Chart instances
  private salesChart?: Chart;
  private pieChart?: Chart;
  private barChart?: Chart;
  private lineChart?: Chart;

  // Chart data
  revenueDetails?: RevenueDetails;
  expenseDetails?: ExpenseDetails;
  trendData?: TrendData;

  // Inventory Items (static)
  inventoryItems: InventoryItem[] = [];
  loading = false;

  constructor(private dashboardService: DashboardService,
    public pageHeaderService: PageHeaderService,
  ) { }

  ngOnInit(): void {
    this.pageHeaderService.setTitle('Dashboard');
    this.loadDashboardData();
    this.loadStockData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }


  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Load main metrics
    this.dashboardService.getDashboardMetrics(this.timeFilter).subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.updateMainMetrics(metrics);
        this.loadChartsData();
      },
      error: (err) => {
        console.error('Error loading dashboard metrics:', err);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.loadDefaultMetrics();
        this.isLoading = false;
      }
    });
  }

  loadStockData(): void {
    this.loading = true;

    this.dashboardService.getStockDetails().subscribe({
      next: (res) => {
        this.inventoryItems = res.data.map(item => ({
          label: item.productName,
          count: item.stockAmount,
          // optional UI helpers
          color: this.getColorByStock(item.stockAmount),
          // icon: this.getIconByProduct(item.productName)
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private getColorByStock(stock: number): string {
    if (stock <= 10) return '#ff4d5028';     // low stock
    if (stock <= 30) return '#faad142c';     // medium
    return '#53c41a21';                      // healthy
  }

  /**
   * Load data for charts
   */
  loadChartsData(): void {
    // Load revenue details
    this.dashboardService.getRevenueDetails(this.timeFilter).subscribe({
      next: (response) => {
        this.revenueDetails = response.data;
        this.checkAndRenderCharts();
      },
      error: (err) => console.error('Error loading revenue details:', err)
    });

    // Load expense details
    this.dashboardService.getExpenseDetails(this.timeFilter).subscribe({
      next: (response) => {
        this.expenseDetails = response.data;
        this.checkAndRenderCharts();
      },
      error: (err) => console.error('Error loading expense details:', err)
    });

    // Load trend data
    this.dashboardService.getTrendData(this.timeFilter).subscribe({
      next: (response) => {
        this.trendData = response.data;
        this.checkAndRenderCharts();
      },
      error: (err) => console.error('Error loading trend data:', err)
    });
  }

  /**
   * Check if all data is loaded and render charts
   */
  checkAndRenderCharts(): void {
    if (this.revenueDetails && this.expenseDetails && this.trendData) {
      this.isLoading = false;
      setTimeout(() => this.initializeCharts(), 100);
    }
  }

  /**
   * Update main metrics with API data
   */
  updateMainMetrics(metrics: DashboardMetrics): void {
    this.mainMetrics = [
      {
        title: 'Total Revenue',
        value: metrics.totalRevenue.formattedValue,
        change: metrics.totalRevenue.formattedChange,
        isPositive: metrics.totalRevenue.isPositive,
        icon: 'dollar-sign',
        bgColor: 'bg-success bg-opacity-10',
        accentColor: 'text-success'
      },
      {
        title: 'Total Expenses',
        value: metrics.totalExpenses.formattedValue,
        change: metrics.totalExpenses.formattedChange,
        isPositive: metrics.totalExpenses.isPositive,
        icon: 'credit-card',
        bgColor: 'bg-danger bg-opacity-10',
        accentColor: 'text-danger'
      },
      {
        title: 'Net Profit',
        value: metrics.netProfit.formattedValue,
        change: metrics.netProfit.formattedChange,
        isPositive: metrics.netProfit.isPositive,
        icon: 'trending-up',
        bgColor: 'bg-primary bg-opacity-10',
        accentColor: 'text-primary'
      },
      {
        title: 'Profit Margin',
        value: metrics.profitMargin.formattedValue,
        change: metrics.profitMargin.formattedChange,
        isPositive: metrics.profitMargin.isPositive,
        icon: 'package',
        bgColor: 'bg-secondary bg-opacity-10',
        accentColor: 'text-secondary'
      },
      {
        title: 'Total Orders',
        value: metrics.totalOrders.formattedValue,
        change: metrics.totalOrders.formattedChange,
        isPositive: metrics.totalOrders.isPositive,
        icon: 'shopping-cart',
        bgColor: 'bg-secondary bg-opacity-10',
        accentColor: 'text-secondary'
      },
      {
        title: 'Total Customers',
        value: metrics.totalCustomers.formattedValue,
        change: metrics.totalCustomers.formattedChange,
        isPositive: metrics.totalCustomers.isPositive,
        icon: 'users',
        bgColor: 'bg-primary bg-opacity-10',
        accentColor: 'text-primary'
      },
      {
        title: 'Total Due',
        value: metrics.totalDue.formattedValue,
        change: metrics.totalDue.formattedChange,
        isPositive: metrics.totalDue.isPositive,
        icon: 'alert-triangle',
        bgColor: 'bg-warning bg-opacity-10',
        accentColor: 'text-warning'
      },
      {
        title: 'Total Owed',
        value: metrics.totalOwed.formattedValue,
        change: metrics.totalOwed.formattedChange,
        isPositive: metrics.totalOwed.isPositive,
        icon: 'dollar-sign',
        bgColor: 'bg-info bg-opacity-10',
        accentColor: 'text-info'
      },
    ];
  }

  /**
   * Load default metrics (fallback)
   */
  loadDefaultMetrics(): void {
    this.mainMetrics = [
      {
        title: 'Total Revenue',
        value: '0.00',
        change: '0%',
        isPositive: true,
        icon: 'dollar-sign',
        bgColor: 'bg-success bg-opacity-10',
        accentColor: 'text-success'
      },
      {
        title: 'Total Expenses',
        value: '0.00',
        change: '0%',
        isPositive: false,
        icon: 'credit-card',
        bgColor: 'bg-danger bg-opacity-10',
        accentColor: 'text-danger'
      },
      {
        title: 'Net Profit',
        value: '0.00',
        change: '0%',
        isPositive: true,
        icon: 'trending-up',
        bgColor: 'bg-primary bg-opacity-10',
        accentColor: 'text-primary'
      },
      {
        title: 'Profit Margin',
        value: '0%',
        change: '0%',
        isPositive: true,
        icon: 'package',
        bgColor: 'bg-secondary bg-opacity-10',
        accentColor: 'text-secondary'
      }
    ];
  }

  /**
   * Set active time filter and reload data
   */
  setTimeFilter(filter: string): void {
    this.timeFilter = filter;
    this.destroyCharts();
    this.loadDashboardData();
  }

  /**
   * Initialize all charts
   */
  initializeCharts(): void {
    this.destroyCharts();

    this.createSalesChart();
    this.createPieChart();
    this.createBarChart();
    this.createLineChart();
  }

  /**
   * Create Sales & Profit Trend Chart
   */
  createSalesChart(): void {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas || !this.trendData) return;

    const dates = this.trendData.revenueTrend.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const revenueData = this.trendData.revenueTrend.map(t => t.amount);
    const expenseData = this.trendData.expenseTrend.map(t => t.amount);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '' + value.toLocaleString()
            }
          }
        }
      }
    };

    this.salesChart = new Chart(canvas, config);
  }

  /**
   * Create Sales by Category Pie Chart
   */
  createPieChart(): void {
    const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!canvas || !this.revenueDetails) return;

    const categories = this.revenueDetails.categoryBreakdown.map(c => c.categoryName);
    const amounts = this.revenueDetails.categoryBreakdown.map(c => c.amount);

    const colors = [
      'rgb(59, 130, 246)',
      'rgb(34, 197, 94)',
      'rgb(251, 146, 60)',
      'rgb(168, 85, 247)',
      'rgb(236, 72, 153)',
      'rgb(14, 165, 233)'
    ];

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `{label}: {value.toLocaleString()}`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new Chart(canvas, config);
  }

  /**
   * Create Weekly Orders Bar Chart
   */
  createBarChart(): void {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    if (!canvas || !this.trendData) return;

    const dates = this.trendData.revenueTrend.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const orderCounts = this.trendData.revenueTrend.map(t => t.count);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [{
          label: 'Orders',
          data: orderCounts,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.barChart = new Chart(canvas, config);
  }

  /**
   * Create Revenue vs Expenses Line Chart
   */
  createLineChart(): void {
    const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!canvas || !this.trendData) return;

    const dates = this.trendData.revenueTrend.map(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const revenueData = this.trendData.revenueTrend.map(t => t.amount);
    const expenseData = this.trendData.expenseTrend.map(t => t.amount);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgb(34, 197, 94)',
            tension: 0.1
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgb(239, 68, 68)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '' + value.toLocaleString()
            }
          }
        }
      }
    };

    this.lineChart = new Chart(canvas, config);
  }

  /**
   * Destroy all chart instances
   */
  destroyCharts(): void {
    if (this.salesChart) {
      this.salesChart.destroy();
      this.salesChart = undefined;
    }
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = undefined;
    }
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = undefined;
    }
    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = undefined;
    }
  }

  /**
   * Get SVG path for icons
   */
  getIconSvg(icon: string): string {
    const icons: { [key: string]: string } = {
      'dollar-sign': 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      'credit-card': 'M1 4h22v16H1z M1 10h22',
      'trending-up': 'M23 6l-9.5 9.5-5-5L1 18 M16 6h7v7',
      'package': 'M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z M2.32 6.16L12 11l9.68-4.84 M12 22.76V11',
      'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
      'shopping-cart': 'M9 2L1 4v2h20V4l-8-2-2 2-2-2z M3 8v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8 M10 12h4',
      'users': 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'
    };
    return icons[icon] || icons['dollar-sign'];
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboardData();
  }
}