import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@presentation/components/Pagination/Pagination";
import AiScenarioRow from "./components/AiScenarioRow";
import FilterBar from "./components/FilterBar";
import { BlockError, BlockEmpty, SkeletonList } from "./components/BlockStates";
import { matchesKeyword } from "./components/helpers";
import useAllRecords from "./hooks/useAllRecords";
import useClientPagination from "./hooks/useClientPagination";
import { getMyAiScenarios } from "@services/learningProfileApi";
import styles from "./LearningProfile.module.css";

const DIFF_ALL = "all";
const DIFF_OPTIONS = [
  { value: "Easy", label: "Dễ" },
  { value: "Medium", label: "Trung bình" },
  { value: "Hard", label: "Khó" },
];

export default function AiScenariosPage() {
  const { records, total, truncated, loading, error, retry } =
    useAllRecords(getMyAiScenarios);

  const [keyword, setKeyword] = useState("");
  const [difficulty, setDifficulty] = useState(DIFF_ALL);

  const searched = useMemo(
    () =>
      records.filter((a) =>
        matchesKeyword(keyword, a.scenarioName, a.courseName),
      ),
    [records, keyword],
  );

  const options = useMemo(
    () => [
      { value: DIFF_ALL, label: "Tất cả", count: searched.length },
      ...DIFF_OPTIONS.map((o) => ({
        ...o,
        count: searched.filter((a) => a.difficulty === o.value).length,
      })),
    ],
    [searched],
  );

  const filtered = useMemo(
    () =>
      difficulty === DIFF_ALL
        ? searched
        : searched.filter((a) => a.difficulty === difficulty),
    [searched, difficulty],
  );

  const paging = useClientPagination(filtered);

  const filtering = keyword.trim() !== "" || difficulty !== DIFF_ALL;
  const clearFilters = () => {
    setKeyword("");
    setDifficulty(DIFF_ALL);
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
            Lịch sử luyện tập AI{loading ? "" : ` (${total})`}
          </h1>
        </div>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <BlockError message={error} onRetry={retry} />
        ) : records.length === 0 ? (
          <BlockEmpty
            icon="fa-robot"
            primary
            title="Chưa có lượt luyện AI scenario nào."
            desc="Khi bạn luyện tập, lịch sử sẽ xuất hiện tại đây."
          />
        ) : (
          <>
            <FilterBar
              keyword={keyword}
              onKeywordChange={(v) => {
                setKeyword(v);
                paging.resetPage();
              }}
              placeholder="Tìm theo tên tình huống hoặc khóa học..."
              filterLabel="Lọc theo độ khó"
              activeFilter={difficulty}
              onFilterChange={(v) => {
                setDifficulty(v);
                paging.resetPage();
              }}
              options={options}
            />

            {truncated && (
              <div className={styles.noticeBar}>
                <i className="fas fa-circle-info" />
                Chỉ tải được 1000 lượt luyện gần nhất, kết quả lọc có thể chưa đầy đủ.
              </div>
            )}

            {filtering && (
              <div className={styles.resultInfo}>
                <i className="fas fa-filter" />
                Tìm thấy <strong>{filtered.length}</strong> lượt luyện phù hợp.
              </div>
            )}

            {filtered.length === 0 ? (
              <div className={styles.blockState}>
                <div className={styles.blockIcon}>
                  <i className="fas fa-magnifying-glass" />
                </div>
                <p className={styles.blockTitle}>Không có lượt luyện phù hợp</p>
                <p className={styles.blockDesc}>
                  Thử đổi từ khóa hoặc chọn độ khó khác.
                </p>
                <button className={styles.clearFilterBtn} onClick={clearFilters}>
                  <i className="fas fa-rotate-left" /> Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className={styles.quizList}>
                  {paging.pageItems.map((a) => (
                    <AiScenarioRow key={a.attemptId} item={a} />
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
                    unitLabel="lượt luyện"
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
