import { useEffect, useState } from "react";
import styles from "./LearningMaterial.module.css";
import { getVideoDetail, updateVideoDetail, resolveApiError } from "@services/videoApi";
import RichTextEditor from "../common/RichTextEditor";

export default function VideoDetailModal({
  open,
  material,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [videoUrl, setVideoUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open || !material) return;

    loadVideoDetail();
  }, [open, material]);

  async function loadVideoDetail() {
    try {
      setLoading(true);
      setError("");

      const response = await getVideoDetail(material.id);

      if (!response.success) {
        setError(response.errorMessage || "Không tải được thông tin video.");
        return;
      }

      const data = response.data;

      setVideoUrl(data.videoUrl ?? "");
      setDurationSeconds(data.durationSeconds ?? 0);
      setContent(data.content ?? "");
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Không thể tải thông tin Video.");
    } finally {
      setLoading(false);
    }
  }

  function isContentEmpty(html) {
    if (!html) return true;
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!videoUrl.trim()) {
      setError("URL của video không được để trống.");
      return;
    }

    if (isContentEmpty(content)) {
      setError("Tóm tắt video không được để trống.");
      return;
    }

    if (durationSeconds < 0) {
      setError("Thời lượng không hợp lệ.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await updateVideoDetail(material.id, {
        videoUrl: videoUrl.trim(),
        durationSeconds: Number(durationSeconds),
        content,
      });

      if (!response.success) {
        setError(response.errorMessage || "Không thể cập nhật Video.");
        return;
      }

      onSuccess(response.data);
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Chi tiết Video</h2>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingState}>Đang tải thông tin video...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Tiêu đề</label>

              <input value={material.title} disabled />
            </div>

            <div className={styles.formGroup}>
              <label>Đường dẫn Video *</label>

              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Thời lượng (giây)</label>

              <input
                type="number"
                min="0"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tóm tắt / Mô tả video *</label>

              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Nhập mô tả video..."
                disabled={saving}
              />
            </div>
            {error && (
              <div className={styles.formError}>
                <i className="fas fa-circle-exclamation" />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onClose}
                disabled={saving}
              >
                Hủy
              </button>

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-floppy-disk" /> Lưu Video
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
