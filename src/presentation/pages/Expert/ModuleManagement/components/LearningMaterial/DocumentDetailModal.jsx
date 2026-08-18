import { useEffect, useState } from "react";
import styles from "./LearningMaterial.module.css";
import RichTextEditor from "../common/RichTextEditor";

import {
  getDocumentDetail,
  updateDocumentDetail,
  resolveApiError,
} from "@services/documentApi";

export default function DocumentDetailModal({
  open,
  material,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open || !material) return;

    loadDocument();
  }, [open, material]);

  async function loadDocument() {
    try {
      setLoading(true);
      setError("");

      const response = await getDocumentDetail(material.id);

      if (!response.success) {
        setError(response.errorMessage || "Không tải được tài liệu.");
        return;
      }

      setContent(response.data.content ?? "");
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Không thể tải tài liệu.");
    } finally {
      setLoading(false);
    }
  }

  function isContentEmpty(html) {
    if (!html) return true;
    return html.replace(/<[^>]*>/g, "").trim().length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isContentEmpty(content)) {
      setError("Nội dung không được để trống.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await updateDocumentDetail(
        material.id,
        {
          content,
        },
      );

      if (!response.success) {
        setError(response.errorMessage || "Không thể cập nhật tài liệu.");
        return;
      }

      onSuccess(response.data);
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Không thể cập nhật tài liệu.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Chi tiết Tài liệu</h2>

          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Tiêu đề</label>

              <input value={material.title} disabled />
            </div>

            <div className={styles.formGroup}>
              <label>Nội dung</label>

              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Nhập nội dung tài liệu..."
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
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
