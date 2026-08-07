import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AiEvaluationCard from "../../../components/ExpertEvaluation/AiEvaluationCard";
import ConversationThread from "../../../components/ExpertEvaluation/ConversationThread";
import ExpertResultCard from "../../../components/ExpertEvaluation/ExpertResultCard";
import RequestStatusBadge from "../../../components/ExpertEvaluation/RequestStatusBadge";
import ScenarioPanel from "../../../components/ExpertEvaluation/ScenarioPanel";
import { REQUEST_STATUS } from "../../../constants/expertEvaluation";
import { resolveApiError } from "../../../utils/api";
import { getLearnerEvaluation } from "../../../utils/expertEvaluationApi";
import {
  buildScoreComparison,
  formatDateTime,
  resolveMaterialTitle,
} from "../../../utils/expertEvaluationFormat";
import styles from "./ExpertEvaluationResult.module.css";

/** Các chặng của thanh tiến trình — index tương ứng mức độ hoàn thành. */
const PROGRESS_STEPS = ["Đã gửi", "Đang chấm", "Có kết quả"];

function currentStep(status) {
  if (status === REQUEST_STATUS.COMPLETED) return 2;
  if (status === REQUEST_STATUS.IN_PROGRESS) return 1;
  return 0;
}

/**
 * UC-30 — Learner xem trạng thái & kết quả yêu cầu nhờ chuyên gia đánh giá.
 * Màn hình READ-ONLY tuyệt đối: không có bất kỳ nút sửa/xóa kết quả nào.
 */
export default function ExpertEvaluationResult() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError("");

    try {
      setData(await getLearnerEvaluation(requestId));
    } catch (err) {
      const { status, errorCode, errorMessage } = resolveApiError(err);
      if (status === 401) {
        navigate("/");
        return;
      }
      // 403/404 đều quy về "không tìm thấy" để không lộ dữ liệu của người khác.
      if (status === 404 || status === 403 || errorCode === "EVALUATION_REQUEST_NOT_FOUND") {
        setNotFound(true);
      } else {
        setError(errorMessage || "Không tải được yêu cầu đánh giá. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, navigate]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonGrid}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
          <div className={styles.skeletonBlock} />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.emptyState}>
            <i className="fas fa-file-circle-question" aria-hidden="true" />
            <h2>Không tìm thấy yêu cầu</h2>
            <p>Yêu cầu này không tồn tại hoặc không thuộc về tài khoản của bạn.</p>
            <Link to="/profile/ai-scenarios" className={styles.primaryBtn}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> Về lịch sử thực hành
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.errorBanner} role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            <div>
              <strong>Không tải được dữ liệu</strong>
              <p>{error}</p>
            </div>
            <button type="button" className={styles.retryBtn} onClick={fetchDetail}>
              <i className="fas fa-rotate-right" aria-hidden="true" /> Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const step = currentStep(data.status);
  const isCancelled = data.status === REQUEST_STATUS.CANCELLED;
  const comparison = buildScoreComparison(
    data.expertEvaluation?.overallScore,
    data.aiEvaluation?.finalScore,
  );

  return (
    <div className={styles.page}>
      <div className="container">
        {/* ── Header ── */}
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => navigate(-1)}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" /> Quay lại
          </button>

          <div className={styles.headerMain}>
            <h1 className={styles.pageTitle}>
              {resolveMaterialTitle(data.attempt?.materialTitle)}
            </h1>
            <RequestStatusBadge status={data.status} />
          </div>

          <p className={styles.headerMeta}>
            <span>
              <i className="fas fa-paper-plane" aria-hidden="true" /> Gửi lúc{" "}
              {formatDateTime(data.requestedAt)}
            </span>
            <span>
              <i className="fas fa-user-check" aria-hidden="true" /> Giao lúc{" "}
              {formatDateTime(data.assignedAt, "chưa giao")}
            </span>
            {data.completedAt && (
              <span>
                <i className="fas fa-flag-checkered" aria-hidden="true" /> Hoàn tất{" "}
                {formatDateTime(data.completedAt)}
              </span>
            )}
          </p>
        </header>

        {/* ── Thanh tiến trình ── */}
        {!isCancelled && (
          <ol className={styles.progress} aria-label="Tiến trình yêu cầu đánh giá">
            {PROGRESS_STEPS.map((label, index) => (
              <li
                key={label}
                className={`${styles.progressStep} ${
                  index <= step ? styles.progressDone : ""
                }`}
                aria-current={index === step ? "step" : undefined}
              >
                <span className={styles.progressDot}>
                  {index < step ? (
                    <i className="fas fa-check" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className={styles.progressLabel}>{label}</span>
              </li>
            ))}
          </ol>
        )}

        {/* ── 2 cột kết quả ── */}
        <div className={styles.resultGrid}>
          <AiEvaluationCard aiEvaluation={data.aiEvaluation} />

          {data.status === REQUEST_STATUS.COMPLETED && data.expertEvaluation ? (
            <ExpertResultCard
              evaluation={data.expertEvaluation}
              comparison={comparison}
            />
          ) : (
            <WaitingCard status={data.status} />
          )}
        </div>

        {/* ── Bối cảnh (mặc định thu gọn) ── */}
        <ScenarioPanel attempt={data.attempt} defaultCollapsed />

        {/* ── Hội thoại ── */}
        <ConversationThread conversation={data.conversation} />
      </div>
    </div>
  );
}

/** Cột "Kết quả chuyên gia" khi chưa có kết quả (§5.2). */
function WaitingCard({ status }) {
  const config = {
    [REQUEST_STATUS.PENDING]: {
      icon: "fa-clock",
      tone: styles.waitingNeutral,
      text: "Yêu cầu đang chờ được phân công cho chuyên gia.",
    },
    [REQUEST_STATUS.IN_PROGRESS]: {
      icon: "fa-clock",
      tone: styles.waitingActive,
      text: "Chuyên gia đang xem bài của bạn. Bạn sẽ nhận được kết quả sớm.",
    },
    [REQUEST_STATUS.CANCELLED]: {
      icon: "fa-ban",
      tone: styles.waitingNeutral,
      text: "Yêu cầu này đã bị hủy.",
    },
  }[status] ?? {
    icon: "fa-circle-question",
    tone: styles.waitingNeutral,
    text: "Chưa có kết quả từ chuyên gia.",
  };

  return (
    <section className={`${styles.waitingCard} ${config.tone}`}>
      <i className={`fas ${config.icon}`} aria-hidden="true" />
      <h3>Kết quả chuyên gia</h3>
      <p>{config.text}</p>
    </section>
  );
}
