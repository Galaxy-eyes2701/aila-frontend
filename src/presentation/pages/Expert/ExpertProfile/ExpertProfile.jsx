import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@services/api';
import { DEFAULT_AVATAR } from '@infrastructure/constants/defaultAvatar';
import styles from './ExpertProfile.module.css';

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className={styles.layout}>
      <div className={styles.avatarCard}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonAvatar}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonText}`} style={{ width: '70%', margin: '0 auto 8px' }} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonText}`} style={{ width: '50%', margin: '0 auto' }} />
      </div>
      <div className={styles.infoCard}>
        <div className={styles.infoCardHeader}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonText}`} style={{ width: 160, height: 18 }} />
        </div>
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[80, 60, 90, 55, 100].map((w, i) => (
            <div key={i} className={`${styles.skeletonBlock} ${styles.skeletonText}`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
      {message}
    </div>
  );
}

/* ── Password Modal ─────────────────────────────────────────────────────── */
function PasswordModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const handleChange = (e) => {
    setModalError('');
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword.trim()) {
      setModalError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!form.newPassword.trim()) {
      setModalError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (form.newPassword.length < 8) {
      setModalError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setModalError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const res = await api.put('/profile/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      if (res.data.success) {
        onSaved();
      } else {
        const errorCode = res.data.errorCode;
        setModalError(
          errorCode === 'WRONG_PASSWORD'
            ? 'Mật khẩu hiện tại không đúng.'
            : errorCode === 'VALIDATION_ERROR'
              ? 'Mật khẩu mới không hợp lệ.'
              : errorCode === 'ACCOUNT_INACTIVE'
                ? 'Tài khoản đã bị vô hiệu hóa.'
                : res.data.errorMessage || 'Đổi mật khẩu thất bại.'
        );
      }
    } catch (err) {
      const errorCode = err.response?.data?.errorCode;
      setModalError(
        errorCode === 'WRONG_PASSWORD'
          ? 'Mật khẩu hiện tại không đúng.'
          : errorCode === 'VALIDATION_ERROR'
            ? 'Mật khẩu mới không hợp lệ.'
            : errorCode === 'ACCOUNT_INACTIVE'
              ? 'Tài khoản đã bị vô hiệu hóa.'
              : err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <i className="fas fa-key" />
            Đổi mật khẩu
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-lock" /> Mật khẩu hiện tại
              </label>
              <input
                name="currentPassword"
                type="password"
                className={styles.formInput}
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-lock" /> Mật khẩu mới
              </label>
              <input
                name="newPassword"
                type="password"
                className={styles.formInput}
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Ít nhất 8 ký tự"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-check-circle" /> Xác nhận mật khẩu mới
              </label>
              <input
                name="confirmPassword"
                type="password"
                className={styles.formInput}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            {modalError && (
              <div className={styles.modalError}>
                <i className="fas fa-exclamation-circle" />
                {modalError}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving
                ? <><span className={styles.saveSpinner} /> Đang lưu...</>
                : <><i className="fas fa-save" /> Lưu mật khẩu</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Modal ───────────────────────────────────────────────────────────── */
function EditModal({ profile, onClose, onSaved }) {
  const [form, setForm]         = useState({
    fullName:          profile.fullName         ?? '',
    avatarUrl:         profile.avatarUrl         ?? '',
    bio:               profile.bio               ?? '',
    specialty:         profile.specialty         ?? '',
    yearsOfExperience: profile.yearsOfExperience ?? 0,
  });
  const [saving, setSaving]     = useState(false);
  const [modalError, setModalError] = useState('');

  const handleChange = (e) => {
    setModalError('');
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'yearsOfExperience' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setModalError('Họ và tên không được để trống.');
      return;
    }

    setSaving(true);
    setModalError('');
    try {
      const res = await api.put('/experts/profile', {
        fullName:          form.fullName.trim(),
        avatarUrl:         form.avatarUrl.trim() || null,
        bio:               form.bio.trim()       || null,
        specialty:         form.specialty.trim() || null,
        yearsOfExperience: form.yearsOfExperience,
      });

      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('profile-updated'));
        onSaved();       // đóng modal + reload profile
      } else {
        setModalError(res.data.errorMessage || 'Cập nhật thất bại.');
      }
    } catch (err) {
      setModalError(
        err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Đóng khi click overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <i className="fas fa-user-edit" />
            Chỉnh sửa hồ sơ
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>

            {/* Họ tên + Avatar URL */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-user" /> Họ và tên *
              </label>
              <input
                name="fullName"
                className={styles.formInput}
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-image" /> URL ảnh đại diện
              </label>
              <input
                name="avatarUrl"
                className={styles.formInput}
                value={form.avatarUrl}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {/* Chuyên môn + Số năm KN */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <i className="fas fa-star" /> Chuyên môn
                </label>
                <input
                  name="specialty"
                  className={styles.formInput}
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder="Machine Learning, NLP,..."
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <i className="fas fa-briefcase" /> Số năm kinh nghiệm
                </label>
                <input
                  name="yearsOfExperience"
                  type="number"
                  min="0"
                  max="50"
                  className={styles.formInput}
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Bio */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-align-left" /> Giới thiệu bản thân
              </label>
              <textarea
                name="bio"
                className={styles.formTextarea}
                value={form.bio}
                onChange={handleChange}
                placeholder="Mô tả ngắn về bản thân, kinh nghiệm, thành tích..."
              />
            </div>

            {/* Error */}
            {modalError && (
              <div className={styles.modalError}>
                <i className="fas fa-exclamation-circle" />
                {modalError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving
                ? <><span className={styles.saveSpinner} /> Đang lưu...</>
                : <><i className="fas fa-save" /> Lưu thay đổi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
export default function ExpertProfile() {
  const navigate              = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast]       = useState(null); // { message, type }

  const fetchProfile = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/expert/login');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/experts/me/profile');
      if (res.data.success) {
        setProfile(res.data.data);
      } else {
        setError(res.data.errorMessage || 'Không thể tải thông tin profile.');
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/expert/login');
      else if (err.response?.status === 404)
        setError('Không tìm thấy thông tin Expert.');
      else setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaved = () => {
    setShowEdit(false);
    setToast({ message: 'Cập nhật hồ sơ thành công!', type: 'success' });
    fetchProfile(); // reload dữ liệu mới
  };

  const handlePasswordSaved = () => {
    setShowPassword(false);
    setToast({ message: 'Đổi mật khẩu thành công!', type: 'success' });
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/expert">Trang chủ</Link>
          <i className="fas fa-chevron-right" />
          <span>Hồ sơ cá nhân</span>
        </div>

        {/* Loading */}
        {loading && <ProfileSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div className={styles.infoCard}>
            <div className={styles.stateBox}>
              <div className={styles.stateIcon}><i className="fas fa-user-slash" /></div>
              <p className={styles.stateTitle}>Không thể tải hồ sơ</p>
              <p className={styles.stateDesc}>{error}</p>
            </div>
          </div>
        )}

        {/* Profile */}
        {!loading && !error && profile && (
          <div className={styles.layout}>

            {/* ── LEFT ── */}
            <div className={styles.avatarCard}>
              <div className={styles.avatarWrap}>
                <img
                  className={styles.avatar}
                  src={profile.avatarUrl || DEFAULT_AVATAR}
                  alt={profile.fullName}
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
                <div className={styles.avatarBadge}>
                  <i className="fas fa-check" />
                </div>
              </div>

              <div className={styles.fullName}>{profile.fullName}</div>

              <div className={styles.rolePill}>
                <i className="fas fa-chalkboard-teacher" /> Chuyên gia
              </div>

              <div className={styles.emailRow}>
                <i className="fas fa-envelope" />
                <span>{profile.email}</span>
              </div>

              <hr className={styles.divider} />

              <div className={styles.statRow}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{profile.yearsOfExperience ?? 0}</div>
                  <div className={styles.statLabel}>Năm KN</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>
                    {profile.specialty ? profile.specialty.split(',').length : '—'}
                  </div>
                  <div className={styles.statLabel}>Chuyên môn</div>
                </div>
              </div>
            </div>

            {/* ── RIGHT ── */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <div className={styles.infoCardTitle}>
                  <i className="fas fa-id-card" /> Thông tin chi tiết
                </div>
                <div className={styles.headerActions}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => setShowPassword(true)}
                  >
                    <i className="fas fa-key" /> Đổi mật khẩu
                  </button>
                  <button
                    className={styles.editBtn}
                    onClick={() => setShowEdit(true)}
                  >
                    <i className="fas fa-pen" /> Chỉnh sửa
                  </button>
                </div>
              </div>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <div className={styles.fieldLabel}><i className="fas fa-user" /> Họ và tên</div>
                  <div className={styles.fieldValue}>{profile.fullName}</div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel}><i className="fas fa-envelope" /> Email</div>
                  <div className={styles.fieldValue}>{profile.email}</div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel}><i className="fas fa-star" /> Chuyên môn</div>
                  <div className={`${styles.fieldValue} ${!profile.specialty ? styles.empty : ''}`}>
                    {profile.specialty || 'Chưa cập nhật'}
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel}><i className="fas fa-briefcase" /> Kinh nghiệm</div>
                  <div className={styles.fieldValue}>
                    {profile.yearsOfExperience > 0
                      ? `${profile.yearsOfExperience} năm kinh nghiệm`
                      : 'Chưa cập nhật'}
                  </div>
                </div>

                <div className={styles.fieldFull}>
                  <div className={styles.fieldLabel}><i className="fas fa-align-left" /> Giới thiệu bản thân</div>
                  {profile.bio
                    ? <p className={styles.bioText}>{profile.bio}</p>
                    : <p className={`${styles.fieldValue} ${styles.empty}`}>Chưa có giới thiệu.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEdit && profile && (
        <EditModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}

      {showPassword && (
        <PasswordModal
          onClose={() => setShowPassword(false)}
          onSaved={handlePasswordSaved}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}