import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@presentation/components/Pagination/Pagination";
import QuizHistoryRow from "./components/QuizHistoryRow";
import FilterBar from "./components/FilterBar";
import { BlockError, BlockEmpty, SkeletonList } from "./components/BlockStates";
import { matchesKeyword } from "./components/helpers";
import useAllRecords from "./hooks/useAllRecords";
import useClientPagination from "./hooks/useClientPagination";
import { getMyQuizHistory } from "@services/learningProfileApi";
import styles from "./LearningProfile.module.css";

const RESULT_ALL = "all";
const RESULT_PASSED = "passed";
const RESULT_FAILED = "failed";

export default function QuizHistoryPage() {
  const { records, total, truncated, loading, error, retry } =
    useAllRecords(getMyQuizHistory);

  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState(RESULT_ALL);

  const searched = useMemo(
    () =>
      records.filter((q) =>
        matchesKeyword(keyword, q.quizTitle, q.courseName),
      ),
    [records, keyword],
  );

  const counts = useMemo(
    () => ({
      [RESULT_ALL]: searched.length,
      [RESULT_PASSED]: searched.filter((q) => q.isPassed).length,
      [RESULT_FAILED]: searched.filter((q) => !q.isPassed).length,
    }),
    [searched],
  );

  const filtered = useMemo(() => {
    if (result === RESULT_PASSED) return searched.filter((q) => q.isPassed);
    if (result === RESULT_FAILED) return searched.filter((q) => !q.isPassed);
    return searched;
  }, [searched, result]);

  const paging = useClientPagination(filtered);

  const filtering = keyword.trim() !== "" || result !== RESULT_ALL;
  const clearFilters = () => {
    setKeyword("");
    setResult(RESULT_ALL);
    paging.resetPage();
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <Link to="/profile" className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Hồ sơ
          </Link>
          <h1 className={styles.pageTitle}>
            Lịch sử bài kiểm tra{loading ? "" : ` (${total})`}
          </h1>
        </div>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <BlockError message={error} onRetry={retry} />
        ) : records.length === 0 ? (
          <BlockEmpty
            icon="fa-clipboard"
            primary
            title="Bạn chưa làm bài kiểm tra nào."
            desc="Hoàn thành các bài kiểm tra trong khóa học để xem lịch sử tại đây."
          />
        ) : (
          <>
            <FilterBar
              keyword={keyword}
              onKeywordChange={(v) => {
                setKeyword(v);
                paging.resetPage();
              }}
              placeholder="Tìm theo tên bài kiểm tra hoặc khóa học..."
              filterLabel="Lọc theo kết quả"
              activeFilter={result}
              onFilterChange={(v) => {
                setResult(v);
                paging.resetPage();
              }}
              options={[
                { value: RESULT_ALL, label: "Tất cả", count: counts[RESULT_ALL] },
                { value: RESULT_PASSED, label: "Đạt", count: counts[RESULT_PASSED] },
                {
                  value: RESULT_FAILED,
                  label: "Chưa đạt",
                  count: counts[RESULT_FAILED],
                },
              ]}
            />

            {truncated && (
              <div className={styles.noticeBar}>
                <i className="fas fa-circle-info" />
                Chỉ tải được 1000 lượt làm gần nhất, kết quả lọc có thể chưa đầy đủ.
              </div>
            )}

            {filtering && (
              <div className={styles.resultInfo}>
                <i className="fas fa-filter" />
                Tìm thấy <strong>{filtered.length}</strong> lượt làm phù hợp.
              </div>
            )}

            {filtered.length === 0 ? (
              <div className={styles.blockState}>
                <div className={styles.blockIcon}>
                  <i className="fas fa-magnifying-glass" />
                </div>
                <p className={styles.blockTitle}>Không có bài kiểm tra phù hợp</p>
                <p className={styles.blockDesc}>
                  Thử đổi từ khóa hoặc chọn kết quả khác.
                </p>
                <button className={styles.clearFilterBtn} onClick={clearFilters}>
                  <i className="fas fa-rotate-left" /> Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className={styles.quizList}>
                  {paging.pageItems.map((q) => (
                    <QuizHistoryRow key={q.attemptId} item={q} />
                  ))}
                </div>
                {paging.totalPages > 1 && (
                  <Pagination
                    currentPage={paging.currentPage}
                    totalPages={paging.totalPages}
                    itemsPerPage={paging.pageSize}
                    totalItems={paging.totalItems}
                    onPageChange={paging.goToPage}
                    onItemsPerPageChange={paging.changePageSize}
                    unitLabel="lượt làm"
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
