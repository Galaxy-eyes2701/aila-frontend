import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@presentation/components/Pagination/Pagination";
import CourseCard from "./components/CourseCard";
import FilterBar from "./components/FilterBar";
import { BlockError, BlockEmpty, SkeletonGrid } from "./components/BlockStates";
import { matchesKeyword } from "./components/helpers";
import useAllRecords from "./hooks/useAllRecords";
import useClientPagination from "./hooks/useClientPagination";
import { getMyCourses } from "@services/learningProfileApi";
import styles from "./LearningProfile.module.css";

const STATUS_ALL = "all";
const STATUS_LEARNING = "learning";
const STATUS_COMPLETED = "completed";

const isCompleted = (en) => en.status === "Completed";

export default function CoursesPage() {
  const { records, total, truncated, loading, error, retry } =
    useAllRecords(getMyCourses);

  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState(STATUS_ALL);

  // Lọc theo từ khóa trước để số đếm trên chip phản ánh đúng kết quả sẽ thấy.
  const searched = useMemo(
    () =>
      records.filter((en) =>
        matchesKeyword(keyword, en.courseName, en.categoryName),
      ),
    [records, keyword],
  );

  const counts = useMemo(
    () => ({
      [STATUS_ALL]: searched.length,
      [STATUS_LEARNING]: searched.filter((en) => !isCompleted(en)).length,
      [STATUS_COMPLETED]: searched.filter(isCompleted).length,
    }),
    [searched],
  );

  const filtered = useMemo(() => {
    if (status === STATUS_LEARNING) return searched.filter((en) => !isCompleted(en));
    if (status === STATUS_COMPLETED) return searched.filter(isCompleted);
    return searched;
  }, [searched, status]);

  const paging = useClientPagination(filtered);

  const filtering = keyword.trim() !== "" || status !== STATUS_ALL;
  const clearFilters = () => {
    setKeyword("");
    setStatus(STATUS_ALL);
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
            Khóa học đã tham gia{loading ? "" : ` (${total})`}
          </h1>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <BlockError message={error} onRetry={retry} />
        ) : records.length === 0 ? (
          <BlockEmpty
            icon="fa-book"
            primary
            title="Bạn chưa tham gia khóa học nào."
            desc="Khám phá các khóa học để bắt đầu học tập."
          />
        ) : (
          <>
            <FilterBar
              keyword={keyword}
              onKeywordChange={(v) => {
                setKeyword(v);
                paging.resetPage();
              }}
              placeholder="Tìm theo tên khóa học hoặc danh mục..."
              filterLabel="Lọc theo trạng thái"
              activeFilter={status}
              onFilterChange={(v) => {
                setStatus(v);
                paging.resetPage();
              }}
              options={[
                { value: STATUS_ALL, label: "Tất cả", count: counts[STATUS_ALL] },
                {
                  value: STATUS_LEARNING,
                  label: "Đang học",
                  count: counts[STATUS_LEARNING],
                },
                {
                  value: STATUS_COMPLETED,
                  label: "Hoàn thành",
                  count: counts[STATUS_COMPLETED],
                },
              ]}
            />

            {truncated && (
              <div className={styles.noticeBar}>
                <i className="fas fa-circle-info" />
                Chỉ tải được 1000 khóa học gần nhất, kết quả lọc có thể chưa đầy đủ.
              </div>
            )}

            {filtering && (
              <div className={styles.resultInfo}>
                <i className="fas fa-filter" />
                Tìm thấy <strong>{filtered.length}</strong> khóa học phù hợp.
              </div>
            )}

            {filtered.length === 0 ? (
              <div className={styles.blockState}>
                <div className={styles.blockIcon}>
                  <i className="fas fa-magnifying-glass" />
                </div>
                <p className={styles.blockTitle}>Không có khóa học phù hợp</p>
                <p className={styles.blockDesc}>
                  Thử đổi từ khóa hoặc chọn trạng thái khác.
                </p>
                <button className={styles.clearFilterBtn} onClick={clearFilters}>
                  <i className="fas fa-rotate-left" /> Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className={styles.courseGrid}>
                  {paging.pageItems.map((en) => (
                    <CourseCard key={en.courseId} enrollment={en} />
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
                    unitLabel="khóa học"
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
