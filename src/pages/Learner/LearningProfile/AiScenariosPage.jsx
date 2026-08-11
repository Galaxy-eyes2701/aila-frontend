import { Link } from "react-router-dom";
import Pagination from "../../../components/Pagination/Pagination";
import AiScenarioRow from "./components/AiScenarioRow";
import { BlockError, BlockEmpty, SkeletonList } from "./components/BlockStates";
import usePagedData from "./hooks/usePagedData";
import { getMyAiScenarios } from "./services/learningProfileApi";
import styles from "./LearningProfile.module.css";

export default function AiScenariosPage() {
  const { pageSize, data, loading, error, goToPage, changePageSize, retry } =
    usePagedData(getMyAiScenarios);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <Link to="/profile" className={styles.backLink}>
            <i className="fas fa-arrow-left" /> Hồ sơ
          </Link>
          <h1 className={styles.pageTitle}>
            Lịch sử luyện tập AI{data ? ` (${data.totalItems})` : ""}
          </h1>
        </div>

        {loading ? (
          <SkeletonList />
        ) : error ? (
          <BlockError message={error} onRetry={retry} />
        ) : data.items.length === 0 ? (
          <BlockEmpty
            icon="fa-robot"
            primary
            title="Chưa có lượt luyện AI scenario nào."
            desc="Khi bạn luyện tập, lịch sử sẽ xuất hiện tại đây."
          />
        ) : (
          <>
            <div className={styles.quizList}>
              {data.items.map((a) => (
                <AiScenarioRow key={a.attemptId} item={a} />
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
                unitLabel="lượt luyện"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
