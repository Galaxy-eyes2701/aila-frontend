import { useState } from "react";
import { resolveApiError } from "@services/api";
import styles from "./UserManagement.module.css";
import { createExpertAccount } from "@services/userApi";

const emptyForm = { email: "", fullName: "", password: "" };

export default function CreateExpertModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setError("");
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (!form.email.trim()) return "Email không được để trống.";
    if (!form.fullName.trim()) return "Họ và tên không được để trống.";
    if (form.password.length < 8)
      return "Mật khẩu phải có ít nhất 8 ký tự.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const valMsg = validate();
    if (valMsg) {
      setError(valMsg);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await createExpertAccount({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        password: form.password,
      });

      if (!res.success) {
        setError(res.errorMessage ?? "Không thể tạo tài khoản Chuyên gia.");
        return;
      }

      setForm(emptyForm);
      onCreated(res.data);
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setError(errorMessage || "Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    setForm(emptyForm);
    setError("");
    onClose();
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Tạo tài khoản Chuyên gia</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Họ tên</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="expert@example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mật khẩu</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Tối thiểu 8 ký tự"
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
                  <i className="fas fa-spinner fa-spin" /> Đang tạo...
                </>
              ) : (
                <>
                  <i className="fas fa-plus" /> Tạo tài khoản
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}