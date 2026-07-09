// LearningContent.jsx
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { useParams } from "react-router-dom";
import QuizPanel from "./QuizPanel";
import ReportCourseModal from "../Report/ReportCourseModal";
import styles from "./LearningView.module.css";

export default function LearningContent({
  contentLoading,
  currentMaterial,
  onComplete,
  hasNextLesson,
  onNextLesson,
}) {
  const { courseId } = useParams();
  const [showReport, setShowReport] = useState(false);
  const [reportToast, setReportToast] = useState(false);

  useEffect(() => {
    if (!reportToast) return undefined;
    const id = setTimeout(() => setReportToast(false), 3000);
    return () => clearTimeout(id);
  }, [reportToast]);

  if (contentLoading) {
    return (
      <div className={styles.contentArea}>
        <div className={styles.contentSpinner}>
          <i className="fas fa-spinner fa-spin" /> Đang tải nội dung bài học...
        </div>
      </div>
    );
  }

  if (!currentMaterial) {
    return (
      <div className={styles.contentArea}>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            Vui lòng chọn bài học từ danh sách để tiếp tục.
          </p>
        </div>
      </div>
    );
  }

  const type = currentMaterial.type?.toLowerCase() || "";

  return (
    <div className={styles.contentArea}>
      <div className={styles.materialWrapper}>
        <h2 className={styles.materialTitle}>{currentMaterial.title}</h2>

        <div className={styles.playerContainer}>
          {/* ── 1. ĐỊNH DẠNG: VIDEO (Kèm Rich Text mô tả bài học phía dưới) ── */}
          {type.includes("video") && currentMaterial.videoDetails ? (
            <div className={styles.videoSectionWrapper}>
              <div className={styles.videoHolder}>
                <video
                  src={currentMaterial.videoDetails.videoUrl}
                  poster={currentMaterial.videoDetails.thumbnailUrl}
                  controls
                  className={styles.videoPlayer}
                  onEnded={onComplete}
                >
                  {currentMaterial.videoDetails.captionsUrl && (
                    <track
                      src={currentMaterial.videoDetails.captionsUrl}
                      kind="captions"
                      srcLang="vi"
                      label="Tiếng Việt"
                    />
                  )}
                </video>
              </div>

              {currentMaterial.videoDetails.content && (
                <div className={styles.videoDescriptionArea}>
                  <h3 className={styles.subSectionTitle}>
                    <i className="fas fa-list-alt" /> Tổng hợp nội dung & Tài
                    nguyên bài học
                  </h3>
                  <div
                    className={styles.richTextBody}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        currentMaterial.videoDetails.content,
                      ),
                    }}
                  />
                </div>
              )}
            </div>
          ) : /* ── 2. ĐỊNH DẠNG: DOCUMENT (Rich Text hoàn toàn) ── */
          type.includes("document") && currentMaterial.documentDetails ? (
            <div className={styles.documentViewer}>
              {currentMaterial.documentDetails.content ? (
                <div
                  className={styles.richTextBody}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      currentMaterial.documentDetails.content,
                    ),
                  }}
                />
              ) : (
                <div className={styles.documentBody}>
                  Không có nội dung văn bản cho học liệu này.
                </div>
              )}

              {currentMaterial.documentDetails.documentUrl && (
                <div className={styles.downloadSection}>
                  <a
                    href={currentMaterial.documentDetails.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.downloadBtn}
                  >
                    <i className="fas fa-download" /> Tải tài liệu bài học đi
                    kèm
                  </a>
                </div>
              )}
            </div>
          ) : /* ── 3. ĐỊNH DẠNG: QUIZ (Bài kiểm tra) ── */
          type.includes("quiz") ? (
            <QuizPanel
              key={currentMaterial.id}
              courseId={courseId}
              materialId={currentMaterial.id}
            />
          ) : (
            /* ── TRƯỜNG HỢP KHÁC ── */
            <div className={styles.noDetail}>
              Định dạng nội dung chưa được hỗ trợ hoặc không có dữ liệu chi
              tiết.
            </div>
          )}
        </div>

        {/* Nút báo cáo khóa học — hiển thị trước phần đánh dấu hoàn thành */}
        <div className={styles.reportBar}>
          <button
            type="button"
            className={styles.reportBtn}
            onClick={() => setShowReport(true)}
          >
            <i className="fas fa-flag" /> Báo cáo khóa học
          </button>
        </div>

        {/* Action Bar dưới học liệu */}
        <div className={styles.actionBar}>
          <div className={styles.actionLeft}>
            {currentMaterial.isCompleted ? (
              <span className={styles.completedBadge}>
                <i className="fas fa-check-circle" /> Bạn đã hoàn thành học liệu
                này
              </span>
            ) : (
              <button className={styles.completeBtn} onClick={onComplete}>
                <i className="fas fa-check" /> Đánh dấu đã hoàn thành
              </button>
            )}
          </div>

          <div className={styles.actionRight}>
            {hasNextLesson && (
              <button className={styles.nextBtn} onClick={onNextLesson}>
                Bài tiếp theo <i className="fas fa-arrow-right" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showReport && (
        <ReportCourseModal
          courseId={courseId}
          courseName={currentMaterial.courseName}
          onClose={() => setShowReport(false)}
          onSuccess={() => {
            setShowReport(false);
            setReportToast(true);
          }}
        />
      )}

      {reportToast && (
        <div className={styles.reportToast}>
          <i className="fas fa-circle-check" /> Đã gửi báo cáo. Cảm ơn bạn đã
          đóng góp!
        </div>
      )}
    </div>
  );
}
