import { useCallback, useEffect, useState } from "react";

/** Số bản ghi mỗi lần gọi API và trần số trang được tải. */
const FETCH_PAGE_SIZE = 100;
const MAX_FETCH_PAGES = 10;

/**
 * Tải toàn bộ dữ liệu của học viên để lọc/tìm kiếm phía client.
 *
 * BE hiện chỉ nhận `pageIndex` + `pageSize`, không có tham số tìm kiếm, nên
 * muốn lọc chính xác trên toàn bộ dữ liệu thì phải nạp hết rồi lọc tại chỗ.
 * Trần MAX_FETCH_PAGES tránh nạp vô hạn; khi vượt trần `truncated` = true để
 * màn hình báo cho người dùng biết kết quả lọc chưa đầy đủ.
 *
 * `fetcher` phải là hàm ổn định: (pageIndex, pageSize) => Promise<PageResult>.
 */
export default function useAllRecords(fetcher) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const first = await fetcher(1, FETCH_PAGE_SIZE);
        const totalPages = first?.totalPages || 1;
        const fetchPages = Math.min(totalPages, MAX_FETCH_PAGES);

        // Các trang còn lại tải song song — dữ liệu học viên thường chỉ 1–2 trang.
        const rest = await Promise.all(
          Array.from({ length: fetchPages - 1 }, (_, i) =>
            fetcher(i + 2, FETCH_PAGE_SIZE),
          ),
        );
        if (!alive) return;

        const items = [
          ...(first?.items || []),
          ...rest.flatMap((p) => p?.items || []),
        ];
        setRecords(items);
        // Tổng do server báo — khác items.length khi bị cắt bớt vì trần trang.
        setTotal(first?.totalItems ?? items.length);
        setTruncated(totalPages > fetchPages);
        setError("");
      } catch (err) {
        if (alive) setError(err.message || "Không thể tải dữ liệu.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fetcher, reloadKey]);

  const retry = useCallback(() => {
    setLoading(true);
    setError("");
    setReloadKey((k) => k + 1);
  }, []);

  return { records, total, truncated, loading, error, retry };
}
