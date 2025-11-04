export class BackendPaginator {
  currentPage = 0;   // zero-based for frontend
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  from = 0;
  to = 0;

  constructor(pageSize: number = 10) {
    this.pageSize = pageSize;
  }

  updateFromResponse(response: any) {
    this.currentPage = response.current_page - 1; // backend is 1-based
    this.pageSize = response.per_page;
    this.totalElements = response.total;
    this.totalPages = response.last_page;
    this.from = response.from;
    this.to = response.to;
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) this.currentPage++;
  }

  previousPage() {
    if (this.currentPage > 0) this.currentPage--;
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) this.currentPage = page;
  }

  getPageNumbers(maxVisiblePages: number = 5): number[] {
    if (this.totalPages <= maxVisiblePages) return Array.from({ length: this.totalPages }, (_, i) => i);

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(0, this.currentPage - half);
    let end = Math.min(this.totalPages - 1, start + maxVisiblePages - 1);

    if (end - start < maxVisiblePages - 1) start = Math.max(0, end - maxVisiblePages + 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
