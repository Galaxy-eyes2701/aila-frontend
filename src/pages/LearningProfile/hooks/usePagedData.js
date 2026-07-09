import { useEffect, useState } from "react";

/**
 * Quản lý fetch phân trang server-side (pageIndex 1-based).
 * `fetcher` phải là hàm ổn định: (pageIndex, pageSize) => Promise<PageResult>.
 * setLoading(true) đặt trong event handler (không trong effect) để tránh
 * cascading render và tuân thủ rule react-hooks/set-state-in-effect.
 */
export default function usePagedData(fetcher, pageSizeDefault = 10) {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    fetcher(pageIndex, pageSize)
      .then((res) => {
        if (alive) {
          setData(res);
          setError("");
        }
      })
      .catch((err) => {
        if (alive) setError(err.message || "Không thể tải dữ liệu.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fetcher, pageIndex, pageSize, reloadKey]);

  const goToPage = (n) => {
    setLoading(true);
    setPageIndex(n);
  };
  const changePageSize = (sz) => {
    setLoading(true);
    setPageSize(sz);
    setPageIndex(1);
  };
  const retry = () => {
    setLoading(true);
    setError("");
    setReloadKey((k) => k + 1);
  };

  return { pageIndex, pageSize, data, loading, error, goToPage, changePageSize, retry };
}
