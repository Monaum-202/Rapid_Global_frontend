import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardMetrics, DashboardService } from 'src/app/core/services/dashboard/dashboard.service';

interface MetricCardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  bgColor: string;
  accentColor: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  timeFilter: string = 'MONTH';
  timeFilters: string[] = ['TODAY', 'WEEK', 'MONTH', 'YEAR'];

  isLoading: boolean = false;
  error: string | null = null;

  // Main Metrics Data (will be populated from API)
  mainMetrics: MetricCardData[] = [];
  metrics!: DashboardMetrics;

  // Secondary Metrics Data (static for now, can be extended)
  secondaryMetrics: MetricCardData[] = [
    {
      title: 'Due Amount',
      value: '$12,450',
      change: '3.4%',
      isPositive: false,
      icon: 'alert-triangle',
      bgColor: 'bg-yellow-100',
      accentColor: 'text-yellow-600'
    },
    {
      title: 'Amount Owed',
      value: '$7,320',
      change: '5.1%',
      isPositive: true,
      icon: 'dollar-sign',
      bgColor: 'bg-teal-100',
      accentColor: 'text-teal-600'
    },
    {
      title: 'Total Orders',
      value: '2,314',
      change: '15.8%',
      isPositive: true,
      icon: 'shopping-cart',
      bgColor: 'bg-orange-100',
      accentColor: 'text-orange-600'
    },
    {
      title: 'Customers',
      value: '14,208',
      change: '9.2%',
      isPositive: true,
      icon: 'users',
      bgColor: 'bg-indigo-100',
      accentColor: 'text-indigo-600'
    }
  ];

  // Inventory Items (static)
  inventoryItems = [
    { label: 'Sublimation Paper', count: 6, icon: 'assets/paper-roll.png' },
    { label: 'Supporting Paper', count: 6, icon: 'assets/toilet-roll.png' },
    { label: 'Cyan Ink', count: 14, color: 'cyan' },
    { label: 'Magenta Ink', count: 6, color: 'magenta' },
    { label: 'Yellow Ink', count: 7, color: 'yellow' },
    { label: 'Black Ink', count: 9, color: 'black' }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Load dashboard data from backend
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardMetrics(this.timeFilter).subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.updateMainMetrics(metrics);
        this.isLoading = false;

        // Initialize charts after data is loaded
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.loadDefaultMetrics();
        this.isLoading = false;
      }
    });
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
        bgColor: 'bg-green-100',
        accentColor: 'text-green-600'
      },
      {
        title: 'Total Expenses',
        value: metrics.totalExpenses.formattedValue,
        change: metrics.totalExpenses.formattedChange,
        isPositive: !metrics.totalExpenses.isPositive, // Inverted for expenses
        icon: 'credit-card',
        bgColor: 'bg-red-100',
        accentColor: 'text-red-600'
      },
      {
        title: 'Net Profit',
        value: metrics.netProfit.formattedValue,
        change: metrics.netProfit.formattedChange,
        isPositive: metrics.netProfit.isPositive,
        icon: 'trending-up',
        bgColor: 'bg-blue-100',
        accentColor: 'text-blue-600'
      },
      {
        title: 'Profit Margin',
        value: metrics.profitMargin.formattedValue,
        change: metrics.profitMargin.formattedChange,
        isPositive: metrics.profitMargin.isPositive,
        icon: 'package',
        bgColor: 'bg-purple-100',
        accentColor: 'text-purple-600'
      }
    ];
  }

  /**
   * Load default metrics (fallback)
   */
  loadDefaultMetrics(): void {
    this.mainMetrics = [
      {
        title: 'Total Revenue',
        value: '$0.00',
        change: '0%',
        isPositive: true,
        icon: 'dollar-sign',
        bgColor: 'bg-green-100',
        accentColor: 'text-green-600'
      },
      {
        title: 'Total Expenses',
        value: '$0.00',
        change: '0%',
        isPositive: false,
        icon: 'credit-card',
        bgColor: 'bg-red-100',
        accentColor: 'text-red-600'
      },
      {
        title: 'Net Profit',
        value: '$0.00',
        change: '0%',
        isPositive: true,
        icon: 'trending-up',
        bgColor: 'bg-blue-100',
        accentColor: 'text-blue-600'
      },
      {
        title: 'Profit Margin',
        value: '0%',
        change: '0%',
        isPositive: true,
        icon: 'package',
        bgColor: 'bg-purple-100',
        accentColor: 'text-purple-600'
      }
    ];
  }

  /**
   * Set active time filter and reload data
   */
  setTimeFilter(filter: string): void {
    this.timeFilter = filter;
    this.loadDashboardData();
  }

  /**
   * Initialize all charts
   */
  initializeCharts(): void {
    // Chart initialization logic here
    // You can use the existing chart drawing methods
    // or integrate with a charting library like Chart.js
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