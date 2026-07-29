import { useState } from "react";
import styles from "./LearningMaterial.module.css";
import { createLearningMaterial } from "../../services/materialApi"; // ← đúng tên

export default function LearningMaterialModal({
  open,
  module,
  onClose,
  onCreated,
  onCreateAiPractice,
}) {
  const [title, setTitle] = useState("");
  const [materialType, setMaterialType] = useState("Video");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const materialTypeMap = { Video: 0, Document: 1, Quiz: 2, AiPractice: 3 };

  if (!open) return null;

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Tiêu đề không được để trống.");
      return;
    }

    // Thực hành AI có luồng tạo riêng (Scenario, Difficulty, Step
    // Guidance/Prompt Template, Scoring Criteria...) khác với 3 loại
    // học liệu còn lại nên không gọi createLearningMaterial ở đây —
    // chuyển sang modal riêng để điền đầy đủ thông tin.
    if (materialType === "AiPractice") {
      onCreateAiPractice({ title: title.trim() });
      setTitle("");
      setMaterialType("Video");
      setError("");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await createLearningMaterial(module.id, {
        title: title.trim(),
        materialType: materialTypeMap[materialType],
        orderIndex: 0,
      });
      if (res.success) {
        setTitle("");
        setMaterialType("Video");
        onCreated(res.data); 
      } else {
        setError(res.errorMessage || "Không thể tạo học liệu.");
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Thêm học liệu</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.formGroup}>
          <label>Tiêu đề</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            placeholder="Nhập tên học liệu"
            autoFocus
          />
        </div>

        <div className={styles.formGroup}>
          <label>Loại học liệu</label>
          <select
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
          >
            <option value="Video">Video</option>
            <option value="Document">Tài liệu</option>
            <option value="Quiz">Câu hỏi</option>
            <option value="AiPractice">Thực hành AI</option>
          </select>
        </div>

        {error && (
          <div className={styles.formError}>
            <i className="fas fa-circle-exclamation" /> {error}
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
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
                <i className="fas fa-plus" /> Tạo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}