// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MetricCardData {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  bgColor: string;
  accentColor: string;
}

interface SalesData {
  month: string;
  sales: number;
  profit: number;
  expenses: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface WeeklyData {
  day: string;
  orders: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  timeFilter: string = 'today';

  mainMetrics: MetricCardData[] = [
    {
      title: 'Total Revenue',
      value: '$18,925',
      change: '12.5%',
      isPositive: true,
      icon: 'dollar-sign',
      bgColor: 'bg-green-100',
      accentColor: 'text-green-600'
    },
    {
      title: 'Total Expenses',
      value: '$11,024',
      change: '8.2%',
      isPositive: false,
      icon: 'credit-card',
      bgColor: 'bg-red-100',
      accentColor: 'text-red-600'
    },
    {
      title: 'Net Profit',
      value: '$7,901',
      change: '18.3%',
      isPositive: true,
      icon: 'trending-up',
      bgColor: 'bg-blue-100',
      accentColor: 'text-blue-600'
    },
    {
      title: 'Profit Margin',
      value: '41.7%',
      change: '4.2%',
      isPositive: true,
      icon: 'package',
      bgColor: 'bg-purple-100',
      accentColor: 'text-purple-600'
    }
  ];

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

  inventoryItems = [
    { label: 'Sublimation Paper', count: 6, icon: 'assets/paper-roll.png' },
    { label: 'Supporting Paper', count: 6, icon: 'assets/toilet-roll.png' },
    { label: 'Cyan Ink', count: 14, color: 'cyan' },
    { label: 'Magenta Ink', count: 6, color: 'magenta' },
    { label: 'Yellow Ink', count: 7, color: 'yellow' },
    { label: 'Black Ink', count: 9, color: 'black' }
  ];

  salesData: SalesData[] = [
    { month: 'Jan', sales: 12000, profit: 4200, expenses: 7800 },
    { month: 'Feb', sales: 15000, profit: 5500, expenses: 9500 },
    { month: 'Mar', sales: 13500, profit: 4800, expenses: 8700 },
    { month: 'Apr', sales: 18000, profit: 6800, expenses: 11200 },
    { month: 'May', sales: 16500, profit: 6200, expenses: 10300 },
    { month: 'Jun', sales: 19500, profit: 7800, expenses: 11700 }
  ];

  categoryData: CategoryData[] = [
    { name: 'T-Shirts', value: 35, color: '#ff6b6b' },
    { name: 'Mugs', value: 25, color: '#4ecdc4' },
    { name: 'Banners', value: 20, color: '#45b7d1' },
    { name: 'Bags', value: 12, color: '#f7b731' },
    { name: 'Others', value: 8, color: '#a29bfe' }
  ];

  weeklyData: WeeklyData[] = [
    { day: 'Mon', orders: 45 },
    { day: 'Tue', orders: 52 },
    { day: 'Wed', orders: 38 },
    { day: 'Thu', orders: 65 },
    { day: 'Fri', orders: 58 },
    { day: 'Sat', orders: 72 },
    { day: 'Sun', orders: 48 }
  ];

  bottomStats = [
    { icon: 'users', label: 'Customers', value: '14,208', color: 'text-blue-600' },
    { icon: 'shopping-cart', label: 'Orders', value: '2,314', color: 'text-yellow-600' },
    { icon: 'dollar-sign', label: 'Avg Sale', value: '$1,770', color: 'text-green-600' },
    { icon: 'package', label: 'Avg Item Sale', value: '185', color: 'text-red-600' },
    { icon: 'trending-up', label: 'Total Sale', value: '$35,000', color: 'text-teal-600' },
    { icon: 'eye', label: 'Visitors', value: '11,452', color: 'text-purple-600' }
  ];

  timeFilters = ['today', 'week', 'month', 'year'];

  ngOnInit(): void {
    // Initialize charts after view init
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  setTimeFilter(filter: string): void {
    this.timeFilter = filter;
  }

  initializeCharts(): void {
    this.drawSalesChart();
    this.drawPieChart();
    this.drawBarChart();
    this.drawLineChart();
  }

  drawSalesChart(): void {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find max value for scaling
    const maxValue = Math.max(...this.salesData.map(d => Math.max(d.sales, d.profit)));
    const scale = chartHeight / maxValue;

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw sales area
    ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    this.salesData.forEach((data, index) => {
      const x = padding + (chartWidth / (this.salesData.length - 1)) * index;
      const y = height - padding - data.sales * scale;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw sales line
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 3;
    ctx.beginPath();

    this.salesData.forEach((data, index) => {
      const x = padding + (chartWidth / (this.salesData.length - 1)) * index;
      const y = height - padding - data.sales * scale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw profit area
    ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    this.salesData.forEach((data, index) => {
      const x = padding + (chartWidth / (this.salesData.length - 1)) * index;
      const y = height - padding - data.profit * scale;
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw profit line
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.beginPath();

    this.salesData.forEach((data, index) => {
      const x = padding + (chartWidth / (this.salesData.length - 1)) * index;
      const y = height - padding - data.profit * scale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw x-axis labels
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    this.salesData.forEach((data, index) => {
      const x = padding + (chartWidth / (this.salesData.length - 1)) * index;
      ctx.fillText(data.month, x, height - padding + 20);
    });
  }

  drawPieChart(): void {
    const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const total = this.categoryData.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;

    this.categoryData.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Draw slice
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);

      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.name}`, labelX, labelY);
      ctx.fillText(`${item.value}%`, labelX, labelY + 15);

      currentAngle += sliceAngle;
    });
  }

  drawBarChart(): void {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartHeight = height - padding * 2;
    const barWidth = (width - padding * 2) / this.weeklyData.length - 10;

    ctx.clearRect(0, 0, width, height);

    const maxOrders = Math.max(...this.weeklyData.map(d => d.orders));
    const scale = chartHeight / maxOrders;

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw bars
    this.weeklyData.forEach((data, index) => {
      const x = padding + (barWidth + 10) * index + 5;
      const barHeight = data.orders * scale;
      const y = height - padding - barHeight;

      // Draw bar with rounded top
      ctx.fillStyle = '#45b7d1';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0]);
      ctx.fill();

      // Draw label
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(data.day, x + barWidth / 2, height - padding + 20);
    });
  }

  drawLineChart(): void {
    const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...this.salesData.map(d => Math.max(d.sales, d.expenses)));
    const scale = chartHeight / maxValue;

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw sales line
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 3;
    ctx.beginPath();

    this.salesData.forEach((data, index) => {
      const x = padding + (chartWidth / (this.salesData.length - 1)) * index;
      const y = height - padding - data.sales * scale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      // Draw dot
      ctx.fillStyle = '#4ecdc4';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.stroke();

    // Draw expenses line
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.beginPath();

    this.salesData.forEach((data, index) => {
      const x = padding + (chartWidth / (this.salesData.length - 1)) * index;
      const y = height - padding - data.expenses * scale;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      // Draw dot
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.stroke();

    // Draw x-axis labels
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    this.salesData.forEach((data, index) => {
      const x = padding + (chartWidth / (this.salesData.length - 1)) * index;
      ctx.fillText(data.month, x, height - padding + 20);
    });
  }

  getIconSvg(icon: string): string {
    const icons: { [key: string]: string } = {
      'dollar-sign': 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      'credit-card': 'M1 4h22v16H1z M1 10h22',
      'trending-up': 'M23 6l-9.5 9.5-5-5L1 18 M16 6h7v7',
      'package': 'M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z M2.32 6.16L12 11l9.68-4.84 M12 22.76V11',
      'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
      'shopping-cart': 'M9 2L1 4v2h20V4l-8-2-2 2-2-2z M3 8v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8 M10 12h4',
      'users': 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
      'eye': 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
    };
    return icons[icon] || icons['dollar-sign'];
  }
}