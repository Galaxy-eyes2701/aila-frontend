import { useState } from "react";
import styles from "./LearningMaterial.module.css";
import { createDocumentMaterial } from "@services/documentApi";
import { createVideoMaterial } from "@services/videoApi";
import { createQuizMaterial } from "@services/expertQuizApi";
import { resolveApiError } from "@services/api";
import RichTextEditor from "../common/RichTextEditor";

export default function LearningMaterialModal({
  open,
  module,
  onClose,
  onCreated,
  onCreateAiPractice,
}) {
  const [title, setTitle] = useState("");
  const [materialType, setMaterialType] = useState("Video");

  // Document fields
  const [docContent, setDocContent] = useState("");

  // Video fields
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoContent, setVideoContent] = useState("");

  // Quiz fields
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(70);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function isContentEmpty(html) {
    if (!html) return true;
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim().length === 0;
  }

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Tiêu đề không được để trống.");
      return;
    }
    if (trimmedTitle.length < 5 || trimmedTitle.length > 255) {
      setError("Tiêu đề học liệu phải từ 5 đến 255 ký tự.");
      return;
    }

    if (materialType === "AiPractice") {
      onCreateAiPractice({ title: trimmedTitle });
      return;
    }

    // Validation for Video
    if (materialType === "Video") {
      if (!videoUrl.trim()) {
        setError("Đường dẫn Video không được để trống.");
        return;
      }
      if (isContentEmpty(videoContent)) {
        setError("Tóm tắt (mô tả) video không được để trống.");
        return;
      }
      if (videoDuration < 0) {
        setError("Thời lượng không hợp lệ.");
        return;
      }
    }

    // Validation for Document
    if (materialType === "Document") {
      if (isContentEmpty(docContent)) {
        setError("Nội dung tài liệu không được để trống.");
        return;
      }
    }

    // Validation for Quiz
    if (materialType === "Quiz") {
      if (timeLimitMinutes === "" || Number(timeLimitMinutes) <= 0) {
        setError("Thời gian làm bài phải lớn hơn 0 phút.");
        return;
      }
      if (passingScore === "" || Number(passingScore) < 0 || Number(passingScore) > 100) {
        setError("Điểm đạt phải nằm trong khoảng từ 0 đến 100.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      let res;
      if (materialType === "Document") {
        res = await createDocumentMaterial({
          moduleId: module.id,
          title: trimmedTitle,
          content: docContent,
        });
      } else if (materialType === "Video") {
        res = await createVideoMaterial({
          moduleId: module.id,
          title: trimmedTitle,
          videoUrl: videoUrl.trim(),
          durationSeconds: Number(videoDuration),
          content: videoContent,
        });
      } else if (materialType === "Quiz") {
        res = await createQuizMaterial({
          moduleId: module.id,
          title: trimmedTitle,
          timeLimitMinutes: Number(timeLimitMinutes),
          passingScore: Number(passingScore),
          showCorrectAnswersAfterSubmission: showCorrectAnswers,
        });
      }

      if (res && res.success) {
        onCreated(res.data, materialType);
      } else {
        setError(res?.errorMessage || "Không thể tạo học liệu.");
      }
    } catch (err) {
      setError(resolveApiError(err).errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: 640 }}>
        <div className={styles.modalHeader}>
          <h2>Thêm học liệu mới</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.formGroup}>
          <label>Loại học liệu *</label>
          <select
            value={materialType}
            onChange={(e) => {
              setMaterialType(e.target.value);
              setError("");
            }}
          >
            <option value="Video">Video</option>
            <option value="Document">Tài liệu văn bản</option>
            <option value="Quiz">Bài kiểm tra (Quiz)</option>
            <option value="AiPractice">Thực hành AI</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Tiêu đề học liệu *</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            placeholder="Nhập tiêu đề học liệu (5 - 255 ký tự)"
            autoFocus
          />
        </div>

        {/* Fields for Document */}
        {materialType === "Document" && (
          <div className={styles.formGroup}>
            <label>Nội dung tài liệu *</label>
            <RichTextEditor
              value={docContent}
              onChange={setDocContent}
              placeholder="Nhập nội dung tài liệu..."
              disabled={saving}
            />
          </div>
        )}

        {/* Fields for Video */}
        {materialType === "Video" && (
          <>
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
                value={videoDuration}
                onChange={(e) => setVideoDuration(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tóm tắt / Mô tả video *</label>
              <RichTextEditor
                value={videoContent}
                onChange={setVideoContent}
                placeholder="Nhập mô tả video..."
                disabled={saving}
              />
            </div>
          </>
        )}

        {/* Fields for Quiz */}
        {materialType === "Quiz" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label>Thời gian làm bài (phút) *</label>
                <input
                  type="number"
                  min="1"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Điểm đạt (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer", marginTop: "8px" }}>
              <input
                type="checkbox"
                checked={showCorrectAnswers}
                onChange={(e) => setShowCorrectAnswers(e.target.checked)}
              />
              Hiện đáp án đúng sau khi học viên nộp bài
            </label>
          </>
        )}

        {error && (
          <div className={styles.formError} style={{ marginTop: "16px" }}>
            <i className="fas fa-circle-exclamation" /> {error}
          </div>
        )}

        <div className={styles.modalActions} style={{ marginTop: "20px" }}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Đang tạo...
              </>
            ) : materialType === "AiPractice" ? (
              <>
                <i className="fas fa-arrow-right" /> Tiếp tục
              </>
            ) : (
              <>
                <i className="fas fa-plus" /> Tạo học liệu
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}