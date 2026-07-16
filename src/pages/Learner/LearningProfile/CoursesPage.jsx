import { Link } from "react-router-dom";
import Pagination from "../../../components/Pagination/Pagination";
import CourseCard from "./components/CourseCard";
import { BlockError, BlockEmpty, SkeletonGrid } from "./components/BlockStates";
import usePagedData from "./hooks/usePagedData";
import { getMyCourses } from "./services/learningProfileApi";
import styles from "./LearningProfile.module.css";

export default function CoursesPage() {
  const { pageSize, data, loading, error, goToPage, changePageSize, retry } =
    usePagedData(getMyCourses);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <Link to="/profile" className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Hồ sơ
          </Link>
          <h1 className={styles.pageTitle}>
            Khóa học đã tham gia{data ? ` (${data.totalItems})` : ""}
          </h1>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <BlockError message={error} onRetry={retry} />
        ) : data.items.length === 0 ? (
          <BlockEmpty
            icon="fa-book"
            primary
            title="Bạn chưa tham gia khóa học nào."
            desc="Khám phá các khóa học để bắt đầu học tập."
          />
        ) : (
          <>
            <div className={styles.courseGrid}>
              {data.items.map((en) => (
                <CourseCard key={en.courseId} enrollment={en} />
              ))}
            </div>
            {data.totalPages > 1 && (
              <Pagination
                currentPage={data.pageNumber}
                totalPages={data.totalPages}
                itemsPerPage={pageSize}
                totalItems={data.totalItems}
                onPageChange={goToPage}
                onItemsPerPageChange={changePageSize}
                unitLabel="khóa học"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
