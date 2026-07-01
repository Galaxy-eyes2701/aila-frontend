// LearningContent.jsx
import DOMPurify from "dompurify";
import styles from "./LearningView.module.css";

export default function LearningContent({
  contentLoading,
  currentMaterial,
  onComplete,
  hasNextLesson,
  onNextLesson,
}) {
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
          ) : (
            /* ── TRƯỜNG HỢP KHÁC ── */
            <div className={styles.noDetail}>
              Định dạng nội dung chưa được hỗ trợ hoặc không có dữ liệu chi
              tiết.
            </div>
          )}
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
    </div>
  );
}
