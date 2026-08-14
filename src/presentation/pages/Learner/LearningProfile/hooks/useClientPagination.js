import { useCallback, useState } from "react";

/**
 * Phân trang trên mảng đã lọc sẵn (client-side), dùng chung với component
 * Pagination. Trang hiện tại được kẹp ngay trong lúc render để khi bộ lọc thu
 * hẹp kết quả không rơi vào trang trống.
 */
export default function useClientPagination(items, pageSizeDefault = 10) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(pageIndex, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setPageIndex(1);
  }, []);
  const resetPage = useCallback(() => setPageIndex(1), []);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    goToPage: setPageIndex,
    changePageSize,
    resetPage,
  };
}
