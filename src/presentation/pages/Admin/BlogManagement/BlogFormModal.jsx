import { useState } from "react";
import { resolveApiError } from "@services/api";
import RichTextEditor from "../../Expert/ModuleManagement/components/common/RichTextEditor";
import styles from "./BlogManagement.module.css";
import { createBlog, updateBlog } from "@services/blogApi";

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isContentEmpty(html) {
  const text = html.replace(/<(.|\n)*?>/g, "").trim();
  return text.length === 0;
}

export default function BlogFormModal({ mode, blog, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: blog?.title ?? "",
    slug: blog?.slug ?? "",
    content: blog?.content ?? "",
    thumbnailUrl: blog?.thumbnailUrl ?? "",
  });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleTitleChange(e) {
    const title = e.target.value;
    setError("");
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setError("");
    if (name === "slug") setSlugTouched(true);
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleContentChange(html) {
    setError("");
    setForm((prev) => ({ ...prev, content: html }));
  }

  function validate() {
    if (!form.title.trim()) return "Tiêu đề không được để trống.";
    if (!form.slug.trim()) return "Slug không được để trống.";
    if (isContentEmpty(form.content)) return "Nội dung không được để trống.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug),
      content: form.content,
      thumbnailUrl: form.thumbnailUrl.trim() || null,
    };

    setSaving(true);
    setError("");

    try {
      const res =
        mode === "create"
          ? await createBlog(payload)
          : await updateBlog(blog.id, payload);

      if (!res.success) {
        setError(res.errorMessage ?? "Không thể lưu bài viết.");
        return;
      }

      onSaved(mode === "create" ? "Đã tạo bài viết mới." : "Đã cập nhật bài viết.");
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    onClose();
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.modalWide}`}>
        <div className={styles.modalHeader}>
          <h2>{mode === "create" ? "Viết bài mới" : "Chỉnh sửa bài viết"}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tiêu đề</label>
            <input
              name="title"
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Tiêu đề bài viết"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label>Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="duong-dan-bai-viet"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Ảnh đại diện (URL)</label>
            <input
              name="thumbnailUrl"
              value={form.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
            {form.thumbnailUrl && (
              <img
                src={form.thumbnailUrl}
                alt="Xem trước"
                className={styles.thumbnailPreview}
              />
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Nội dung</label>
            <RichTextEditor
              value={form.content}
              onChange={handleContentChange}
              placeholder="Nội dung bài viết..."
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
              onClick={handleClose}
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
                  <i className="fas fa-save" /> Lưu bài viết
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}