import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AiEvaluationCard from "../../ExpertEvaluation/components/AiEvaluationCard";
import ConfirmModal from "../../ExpertEvaluation/components/ConfirmModal";
import ConversationThread from "../../ExpertEvaluation/components/ConversationThread";
import ExpertResultCard from "../../ExpertEvaluation/components/ExpertResultCard";
import RequestStatusBadge from "../../ExpertEvaluation/components/RequestStatusBadge";
import ScenarioPanel from "../../ExpertEvaluation/components/ScenarioPanel";
import Toast from "../../../components/Toast/Toast";
import {
  EVALUATION_LIMITS,
  REQUEST_STATUS,
  toToast,
} from "../../../constants/expertEvaluation";
import { resolveApiError } from "../../../utils/api";
import {
  getAssignedRequestDetail,
  provideEvaluation,
} from "../../../utils/expertEvaluationApi";
import {
  buildScoreComparison,
  formatDateTime,
  resolveMaterialTitle,
} from "../../../utils/expertEvaluationFormat";
import styles from "./EvaluationRequestDetail.module.css";

const {
  MIN_SCORE,
  MAX_SCORE,
  SCORE_DECIMALS,
  FEEDBACK_MAX,
  RECOMMENDATION_MAX,
} = EVALUATION_LIMITS;

/** Validate phía client — chặn round-trip, nhưng server vẫn là nguồn chân lý. */
function validateForm({ overallScore, feedback, recommendation }) {
  const errors = {};

  const raw = overallScore.trim();
  if (!raw) {
    errors.overallScore = "Vui lòng nhập điểm đánh giá.";
  } else {
    const value = Number(raw);
    if (Number.isNaN(value)) {
      errors.overallScore = "Điểm phải là một số.";
    } else if (value < MIN_SCORE || value > MAX_SCORE) {
      errors.overallScore = `Điểm phải nằm trong khoảng ${MIN_SCORE} đến ${MAX_SCORE}.`;
    } else {
      const decimals = raw.split(".")[1]?.length ?? 0;
      if (decimals > SCORE_DECIMALS) {
        errors.overallScore = `Điểm chỉ được có tối đa ${SCORE_DECIMALS} chữ số thập phân.`;
      }
    }
  }

  if (!feedback.trim()) {
    errors.feedback = "Phản hồi là bắt buộc và không được để trống.";
  } else if (feedback.length > FEEDBACK_MAX) {
    errors.feedback = `Phản hồi không được dài quá ${FEEDBACK_MAX} ký tự.`;
  }

  if (recommendation.length > RECOMMENDATION_MAX) {
    errors.recommendation = `Khuyến nghị không được dài quá ${RECOMMENDATION_MAX} ký tự.`;
  }

  return errors;
}

const EMPTY_FORM = { overallScore: "", feedback: "", recommendation: "" };

/** UC-63 detail + UC-64 — chuyên gia xem ngữ cảnh và nộp kết quả chấm. */
export default function EvaluationRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoadError("");

    try {
      setData(await getAssignedRequestDetail(requestId));
      setNotFound(false);
    } catch (err) {
      const { status, errorCode, errorMessage } = resolveApiError(err);
      if (status === 401) {
        navigate("/expert/login");
        return;
      }
      if (status === 404 || status === 403 || errorCode === "EVALUATION_REQUEST_NOT_FOUND") {
        setNotFound(true);
      } else {
        setLoadError(errorMessage || "Không tải được yêu cầu. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, navigate]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const errors = validateForm(form);
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError("");

    try {
      await provideEvaluation(requestId, {
        overallScore: Number(form.overallScore),
        feedback: form.feedback,
        recommendation: form.recommendation,
      });
      setConfirmOpen(false);
      setForm(EMPTY_FORM);
      setTouched({});
      setToast({ type: "success", message: "Đã nộp kết quả đánh giá." });
      // Lấy dữ liệu thật từ server thay vì tự dựng state giả.
      await fetchDetail();
    } catch (err) {
      const apiError = resolveApiError(err);
      setConfirmOpen(false);

      if (apiError.errorCode === "VALIDATION_ERROR") {
        setFormError(apiError.errorMessage || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
        return;
      }

      if (apiError.status === 404) {
        setNotFound(true);
        return;
      }

      setToast(toToast(apiError));

      // Người khác / tab khác đã đổi trạng thái -> đồng bộ lại từ server.
      if (
        apiError.errorCode === "ALREADY_EVALUATED" ||
        apiError.errorCode === "INVALID_STATE"
      ) {
        await fetchDetail();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.skeletonHeader} />
          <div className={styles.layout}>
            <div className={styles.skeletonBlock} />
            <div className={styles.skeletonForm} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <i className="fas fa-file-circle-question" aria-hidden="true" />
            <h2>Không tìm thấy yêu cầu</h2>
            <p>Yêu cầu này không tồn tại hoặc không được giao cho bạn.</p>
            <Link to="/expert/evaluation-requests" className={styles.primaryBtn}>
              <i className="fas fa-arrow-left" aria-hidden="true" /> Về danh sách yêu cầu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorBanner} role="alert">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
            <div>
              <strong>Không tải được dữ liệu</strong>
              <p>{loadError}</p>
            </div>
            <button type="button" className={styles.retryBtn} onClick={fetchDetail}>
              <i className="fas fa-rotate-right" aria-hidden="true" /> Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canGrade = data.status === REQUEST_STATUS.IN_PROGRESS;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/expert">Trang chủ Chuyên gia</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <Link to="/expert/evaluation-requests">Yêu cầu đánh giá</Link>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <span>Chi tiết</span>
          </nav>

          <div className={styles.headerMain}>
            <div className={styles.headerTitleGroup}>
              <span className={styles.learnerLine}>
                <i className="fas fa-user-graduate" aria-hidden="true" />
                {data.learnerName}
              </span>
              <h1 className={styles.pageTitle}>
                {resolveMaterialTitle(data.attempt?.materialTitle)}
              </h1>
              <p className={styles.headerMeta}>
                <span>
                  <i className="fas fa-paper-plane" aria-hidden="true" /> Gửi lúc{" "}
                  {formatDateTime(data.requestedAt)}
                </span>
                <span>
                  <i className="fas fa-user-check" aria-hidden="true" /> Giao lúc{" "}
                  {formatDateTime(data.assignedAt, "chưa giao")}
                </span>
              </p>
            </div>
            <RequestStatusBadge status={data.status} />
          </div>
        </header>

        {/* ── 2 cột: ngữ cảnh (trái) + form chấm (phải, sticky) ── */}
        <div className={styles.layout}>
          <div className={styles.contextColumn}>
            <ScenarioPanel attempt={data.attempt} />
            <AiEvaluationCard aiEvaluation={data.aiEvaluation} />
            <ConversationThread conversation={data.conversation} />
          </div>

          <aside className={styles.formColumn}>
            <div className={styles.sticky}>
              {canGrade ? (
                <GradingForm
                  form={form}
                  errors={errors}
                  touched={touched}
                  formError={formError}
                  isValid={isValid}
                  isSubmitting={isSubmitting}
                  onChange={setField}
                  onBlur={(name) => setTouched((t) => ({ ...t, [name]: true }))}
                  onSubmit={() => {
                    setTouched({
                      overallScore: true,
                      feedback: true,
                      recommendation: true,
                    });
                    if (isValid) setConfirmOpen(true);
                  }}
                />
              ) : (
                <ReadOnlyPanel data={data} />
              )}
            </div>
          </aside>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmModal
          title="Nộp kết quả đánh giá?"
          description="Sau khi nộp, kết quả không thể chỉnh sửa hoặc xóa."
          confirmLabel="Nộp kết quả"
          cancelLabel="Xem lại"
          tone="warning"
          icon="fa-clipboard-check"
          busy={isSubmitting}
          onConfirm={handleSubmit}
          onClose={() => setConfirmOpen(false)}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

/** Cột phải khi không ở trạng thái chấm được (§7.2). */
function ReadOnlyPanel({ data }) {
  if (data.status === REQUEST_STATUS.COMPLETED && data.expertEvaluation) {
    return (
      <ExpertResultCard
        evaluation={data.expertEvaluation}
        comparison={buildScoreComparison(
          data.expertEvaluation.overallScore,
          data.aiEvaluation?.finalScore,
        )}
        footnote="Kết quả đã chốt và không thể chỉnh sửa."
      />
    );
  }

  const message =
    data.status === REQUEST_STATUS.CANCELLED
      ? "Yêu cầu đã bị hủy, không thể chấm."
      : "Yêu cầu chưa được phân công.";

  return (
    <div className={styles.neutralPanel}>
      <i className="fas fa-circle-info" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

/** UC-64 — form chấm điểm, chỉ hiển thị khi status === "InProgress". */
function GradingForm({
  form,
  errors,
  touched,
  formError,
  isValid,
  isSubmitting,
  onChange,
  onBlur,
  onSubmit,
}) {
  const showError = (name) => touched[name] && errors[name];

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <h2 className={styles.formTitle}>
        <i className="fas fa-clipboard-check" aria-hidden="true" /> Chấm bài
      </h2>

      {formError && (
        <div className={styles.formError} role="alert">
          <i className="fas fa-circle-exclamation" aria-hidden="true" />
          {formError}
        </div>
      )}

      {/* ── Điểm tổng ── */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="overallScore">
          Điểm tổng <span className={styles.required}>*</span>
        </label>
        <div className={styles.scoreInputWrap}>
          <input
            id="overallScore"
            type="number"
            step="0.01"
            min={MIN_SCORE}
            max={MAX_SCORE}
            className={`${styles.input} ${showError("overallScore") ? styles.inputInvalid : ""}`}
            value={form.overallScore}
            onChange={(e) => onChange("overallScore", e.target.value)}
            onBlur={() => onBlur("overallScore")}
            aria-invalid={showError("overallScore") ? "true" : undefined}
            aria-describedby={
              showError("overallScore") ? "overallScore-error" : "overallScore-hint"
            }
            disabled={isSubmitting}
          />
          <span className={styles.scoreSuffix}>/ {MAX_SCORE}</span>
        </div>
        {showError("overallScore") ? (
          <p className={styles.errorText} id="overallScore-error">
            {errors.overallScore}
          </p>
        ) : (
          <p className={styles.hint} id="overallScore-hint">
            Từ {MIN_SCORE} đến {MAX_SCORE}, tối đa {SCORE_DECIMALS} chữ số thập phân.
          </p>
        )}
      </div>

      {/* ── Phản hồi ── */}
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="feedback">
            Phản hồi <span className={styles.required}>*</span>
          </label>
          <span
            className={`${styles.counter} ${
              form.feedback.length > FEEDBACK_MAX ? styles.counterOver : ""
            }`}
          >
            {form.feedback.length}/{FEEDBACK_MAX}
          </span>
        </div>
        <textarea
          id="feedback"
          rows={6}
          className={`${styles.textarea} ${showError("feedback") ? styles.inputInvalid : ""}`}
          value={form.feedback}
          onChange={(e) => onChange("feedback", e.target.value)}
          onBlur={() => onBlur("feedback")}
          placeholder="Nhận xét chi tiết về bài làm của học viên…"
          aria-invalid={showError("feedback") ? "true" : undefined}
          aria-describedby={showError("feedback") ? "feedback-error" : undefined}
          disabled={isSubmitting}
        />
        {showError("feedback") && (
          <p className={styles.errorText} id="feedback-error">
            {errors.feedback}
          </p>
        )}
      </div>

      {/* ── Khuyến nghị (tùy chọn) ── */}
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="recommendation">
            Khuyến nghị <span className={styles.optional}>(tùy chọn)</span>
          </label>
          <span
            className={`${styles.counter} ${
              form.recommendation.length > RECOMMENDATION_MAX ? styles.counterOver : ""
            }`}
          >
            {form.recommendation.length}/{RECOMMENDATION_MAX}
          </span>
        </div>
        <textarea
          id="recommendation"
          rows={4}
          className={`${styles.textarea} ${
            showError("recommendation") ? styles.inputInvalid : ""
          }`}
          value={form.recommendation}
          onChange={(e) => onChange("recommendation", e.target.value)}
          onBlur={() => onBlur("recommendation")}
          placeholder="Gợi ý hướng cải thiện cho học viên…"
          aria-invalid={showError("recommendation") ? "true" : undefined}
          aria-describedby={
            showError("recommendation") ? "recommendation-error" : undefined
          }
          disabled={isSubmitting}
        />
        {showError("recommendation") && (
          <p className={styles.errorText} id="recommendation-error">
            {errors.recommendation}
          </p>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting && (
          <i className={`fas fa-spinner ${styles.spinner}`} aria-hidden="true" />
        )}
        Nộp kết quả
      </button>

      <p className={styles.warningNote}>
        <i className="fas fa-triangle-exclamation" aria-hidden="true" />
        Kết quả sau khi nộp không thể chỉnh sửa hoặc xóa.
      </p>
    </form>
  );
}
