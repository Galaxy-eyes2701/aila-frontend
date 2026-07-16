import { useState } from "react";
import styles from "./UserManagement.module.css";
import { createExpertAccount } from "../services/userApi";

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
    if (!form.fullName.trim()) return "Họ tên không được để trống.";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim()))
      return "Email không hợp lệ.";

    if (form.password.length < 8)
      return "Mật khẩu phải có ít nhất 8 ký tự.";

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
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
        setError(res.errorMessage ?? "Không thể tạo tài khoản Expert.");
        return;
      }

      setForm(emptyForm);
      onCreated(res.data);
    } catch (err) {
      setError(
        err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.",
      );
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
          <h2>Tạo tài khoản Expert</h2>
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