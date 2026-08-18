import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReportReasons, reportCourse } from "@services/learnerReportApi";
import { reasonLabel, DESCRIPTION_MAX } from "./constants/reportReasons";
import styles from "./ReportCourseModal.module.css";

/**
 * Modal báo cáo khóa học / bài học (UC-33).
 * @param courseId  id khóa học
 * @param courseName tên khóa (hiển thị dưới tiêu đề)
 * @param materialId  id bài học — nếu truyền vào thì báo cáo bài học đó; bỏ trống thì báo cáo cả khóa học
 * @param onClose  đóng modal
 * @param onSuccess gọi khi gửi thành công (parent hiển thị toast)
 */
export default function ReportCourseModal({
  courseId,
  courseName,
  materialId,
  onClose,
  onSuccess,
}) {
  const navigate = useNavigate();

  const [reasons, setReasons] = useState([]);
  const [reasonsError, setReasonsError] = useState(false);

  const [reason, setReason] = useState(null); // number | null
  const [description, setDescription] = useState("");

  const [reasonError, setReasonError] = useState(null);
  const [descError, setDescError] = useState(null);
  const [banner, setBanner] = useState(null); // { type: 'warn'|'error', message }
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dialogRef = useRef(null);

  // Tải danh sách lý do khi mở
  useEffect(() => {
    let alive = true;
    getReportReasons(courseId)
      .then((data) => {
        if (alive) setReasons(data || []);
      })
      .catch((err) => {
        if (!alive) return;
        if (err.errorCode === "UNAUTHORIZED") return navigate("/");
        setReasonsError(true);
      });
    return () => {
      alive = false;
    };
  }, [courseId, navigate]);

  // Đóng bằng Esc + focus vào dialog khi mở
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const overLimit = description.length > DESCRIPTION_MAX;
  const canSubmit = reason != null && !submitting && !alreadyReported && !overLimit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner(null);

    // Validate client (mirror server)
    let valid = true;
    if (reason == null) {
      setReasonError("Vui lòng chọn một lý do.");
      valid = false;
    }
    if (overLimit) {
      setDescError(`Mô tả không được vượt quá ${DESCRIPTION_MAX} ký tự.`);
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      const body = {
        reason,
        description: description.trim() ? description.trim() : null,
      };
      // Có materialId → báo cáo bài học; bỏ trống → báo cáo cả khóa học.
      if (materialId) body.materialId = materialId;
      await reportCourse(courseId, body);
      onSuccess();
    } catch (err) {
      setSubmitting(false);
      switch (err.errorCode) {
        case "INVALID_REASON":
          setReasonError(err.errorMessage || "Lý do không hợp lệ.");
          break;
        case "VALIDATION_ERROR":
          setDescError(
            err.errorMessage ||
              `Mô tả không được vượt quá ${DESCRIPTION_MAX} ký tự.`
          );
          break;
        case "NOT_ENROLLED":
          setBanner({
            type: "warn",
            message:
              err.errorMessage ||
              "Bạn cần tham gia khóa học này trước khi báo cáo.",
          });
          break;
        case "ALREADY_REPORTED":
          setAlreadyReported(true);
          setBanner({
            type: "warn",
            message:
              err.errorMessage ||
              "Bạn đã báo cáo khóa học này và đang chờ xử lý.",
          });
          break;
        case "COURSE_NOT_FOUND":
          setBanner({
            type: "error",
            message: err.errorMessage || "Khóa học không tồn tại.",
          });
          break;
        case "MATERIAL_NOT_FOUND":
          setBanner({
            type: "error",
            message:
              err.errorMessage ||
              "Bài học không tồn tại hoặc không thuộc khóa học này.",
          });
          break;
        case "UNAUTHORIZED":
          navigate("/");
          break;
        default:
          setBanner({
            type: "error",
            message: err.errorMessage || "Không thể gửi báo cáo. Vui lòng thử lại.",
          });
      }
    }
  };

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className={styles.header}>
          <div>
            <h2 id="report-title" className={styles.title}>
              {materialId ? "Báo cáo bài học" : "Báo cáo khóa học"}
            </h2>
            {courseName && <p className={styles.subtitle}>{courseName}</p>}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng"
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit}>
          {banner && (
            <div
              className={`${styles.banner} ${
                banner.type === "error" ? styles.bannerError : styles.bannerWarn
              }`}
            >
              <i className="fas fa-triangle-exclamation" />
              <span>{banner.message}</span>
            </div>
          )}

          {/* ── Lý do (radio, bắt buộc) ── */}
          <fieldset
            className={styles.field}
            aria-invalid={!!reasonError}
            aria-describedby={reasonError ? "reason-error" : undefined}
          >
            <legend className={styles.label}>
              Lý do <span className={styles.required}>*</span>
            </legend>

            {reasonsError ? (
              <p className={styles.loadError}>
                Không tải được danh sách lý do. Vui lòng thử lại.
              </p>
            ) : reasons.length === 0 ? (
              <p className={styles.loadingReasons}>
                <i className="fas fa-spinner fa-spin" /> Đang tải lý do...
              </p>
            ) : (
              <div
                className={`${styles.radioList} ${
                  reasonError ? styles.radioListError : ""
                }`}
              >
                {reasons.map((r) => (
                  <label key={r.id} className={styles.radioItem}>
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.id}
                      checked={reason === r.id}
                      disabled={alreadyReported}
                      onChange={() => {
                        setReason(r.id);
                        setReasonError(null);
                      }}
                    />
                    <span>{reasonLabel(r)}</span>
                  </label>
                ))}
              </div>
            )}

            {reasonError && (
              <p id="reason-error" className={styles.errorText} role="alert">
                <i className="fas fa-circle-exclamation" /> {reasonError}
              </p>
            )}
          </fieldset>

          {/* ── Mô tả (tùy chọn) ── */}
          <div className={styles.field}>
            <label htmlFor="report-desc" className={styles.label}>
              Mô tả <span className={styles.optional}>(tùy chọn)</span>
            </label>
            <textarea
              id="report-desc"
              className={`${styles.textarea} ${
                descError || overLimit ? styles.textareaError : ""
              }`}
              rows={4}
              maxLength={DESCRIPTION_MAX + 100 /* cho phép gõ vượt để hiện lỗi */}
              value={description}
              disabled={alreadyReported}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải (nếu có)..."
              aria-invalid={!!descError || overLimit}
              aria-describedby={descError ? "desc-error" : "desc-counter"}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescError(null);
              }}
            />
            <div className={styles.counterRow}>
              {descError && (
                <span id="desc-error" className={styles.errorText} role="alert">
                  <i className="fas fa-circle-exclamation" /> {descError}
                </span>
              )}
              <span
                id="desc-counter"
                className={`${styles.counter} ${
                  overLimit ? styles.counterOver : ""
                }`}
              >
                {description.length} / {DESCRIPTION_MAX}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={onClose}
            >
              {alreadyReported ? "Đóng" : "Hủy"}
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Đang gửi…
                </>
              ) : (
                <>
                  <i className="fas fa-flag" /> Gửi báo cáo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
