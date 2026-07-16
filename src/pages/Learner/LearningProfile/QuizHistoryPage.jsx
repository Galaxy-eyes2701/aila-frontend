import { Link } from "react-router-dom";
import Pagination from "../../../components/Pagination/Pagination";
import QuizHistoryRow from "./components/QuizHistoryRow";
import { BlockError, BlockEmpty, SkeletonList } from "./components/BlockStates";
import usePagedData from "./hooks/usePagedData";
import { getMyQuizHistory } from "./services/learningProfileApi";
import styles from "./LearningProfile.module.css";

export default function QuizHistoryPage() {
  const { pageSize, data, loading, error, goToPage, changePageSize, retry } =
    usePagedData(getMyQuizHistory);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <Link to="/profile" className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Hồ sơ
          </Link>
          <h1 className={styles.pageTitle}>
            Lịch sử quiz đã làm{data ? ` (${data.totalItems})` : ""}
          </h1>
        </div>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <BlockError message={error} onRetry={retry} />
        ) : data.items.length === 0 ? (
          <BlockEmpty
            icon="fa-clipboard"
            primary
            title="Bạn chưa làm bài quiz nào."
            desc="Hoàn thành các bài kiểm tra trong khóa học để xem lịch sử tại đây."
          />
        ) : (
          <>
            <div className={styles.quizList}>
              {data.items.map((q) => (
                <QuizHistoryRow key={q.attemptId} item={q} />
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
                unitLabel="lượt làm"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
