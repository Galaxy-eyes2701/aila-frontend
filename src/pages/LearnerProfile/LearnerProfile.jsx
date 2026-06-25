import { useEffect, useState } from 'react';
import api from '../../utils/api';
import styles from './LearnerProfile.module.css';

/* ── Helpers ── */
const LEARNER_TYPE_LABELS = {
  Student: 'Học sinh / Sinh viên',
  OfficeWorker: 'Nhân viên văn phòng',
  Freelancer: 'Freelancer',
  BusinessOwner: 'Chủ doanh nghiệp',
  CivilServant: 'Công chức / Viên chức',
  Retired: 'Hưu trí',
};

const KNOWLEDGE_LEVEL_LABELS = {
  Beginner: 'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
};

function getInitials(fullName) {
  if (!fullName) return '?';
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[words.length - 1][0] + words[0][0]).toUpperCase();
}

/* ── Skeleton ── */
function ProfileSkeleton() {
  return (
    <div>
      <div className={`${styles.skeletonBlock}`} style={{ height: 160, borderRadius: 16, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className={styles.card}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[100, 80, 100, 60, 100].map((w, i) => (
              <div key={i} className={styles.skeletonBlock} style={{ height: 42, width: `${w}%`, borderRadius: 8 }} />
            ))}
          </div>
        </div>
        <div className={styles.card}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[100, 100].map((w, i) => (
              <div key={i} className={styles.skeletonBlock} style={{ height: 72, width: `${w}%`, borderRadius: 8 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Component ── */
export default function LearnerProfile() {
  const [profile, setProfile] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '', avatarUrl: '', learnerType: '', knowledgeLevel: '', learningGoals: [],
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      setLoadError('no_token');
      setLoading(false);
      return;
    }

    let cancelled = false;
    Promise.all([api.get('/profile/learner/me'), api.get('/tags')])
      .then(([profileRes, tagsRes]) => {
        if (cancelled) return;
        if (profileRes.data.success) setProfile(profileRes.data.data);
        else setLoadError(profileRes.data.errorMessage || 'Không thể tải thông tin profile.');
        if (tagsRes.data.success) setTags(tagsRes.data.data);
      })
      .catch(err => {
        if (cancelled) return;
        if (err.response?.status === 401) setLoadError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        else setLoadError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const handleEditStart = () => {
    setForm({
      fullName: profile.fullName || '',
      avatarUrl: profile.avatarUrl || '',
      learnerType: profile.learner.learnerType || '',
      knowledgeLevel: profile.learner.knowledgeLevel || '',
      learningGoals: profile.learner.learningGoals.map(g => g.id),
    });
    setSaveError('');
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const toggleGoal = (tagId) =>
    setForm(f => ({
      ...f,
      learningGoals: f.learningGoals.includes(tagId)
        ? f.learningGoals.filter(id => id !== tagId)
        : [...f.learningGoals, tagId],
    }));

  const handleSaveProfile = async () => {
    if (!form.fullName.trim()) { setSaveError('Họ và tên không được để trống.'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await api.put('/learner/profile', {
        fullName: form.fullName.trim(),
        avatarUrl: form.avatarUrl.trim() || null,
        learnerType: form.learnerType || null,
        knowledgeLevel: form.knowledgeLevel || null,
        learningGoals: form.learningGoals,
      });
      if (res.data.success) {
        setProfile(prev => ({
          ...prev,
          fullName: form.fullName.trim(),
          avatarUrl: form.avatarUrl.trim() || null,
          learner: {
            ...prev.learner,
            learnerType: form.learnerType || null,
            knowledgeLevel: form.knowledgeLevel || null,
            learningGoals: tags.filter(t => form.learningGoals.includes(t.id)).map(t => ({ id: t.id, name: t.name })),
          },
        }));
        setIsEditing(false);
        setSaveSuccess(true);
      } else {
        const c = res.data.errorCode;
        setSaveError(
          c === 'VALIDATION_ERROR' ? 'Dữ liệu không hợp lệ.' :
            c === 'ACCOUNT_INACTIVE' ? 'Tài khoản bị vô hiệu hóa.' :
              c === 'UNPUBLISHED_TAG' ? 'Một số tag chưa được duyệt, vui lòng chọn lại.' :
                res.data.errorMessage || 'Cập nhật thất bại.'
        );
      }
    } catch (err) {
      const c = err.response?.data?.errorCode;
      setSaveError(
        c === 'UNPUBLISHED_TAG' ? 'Một số tag chưa được duyệt, vui lòng chọn lại.' :
          c === 'ACCOUNT_INACTIVE' ? 'Tài khoản bị vô hiệu hóa.' :
            'Lỗi kết nối máy chủ. Vui lòng thử lại.'
      );
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.newPassword) { setPwError('Mật khẩu mới không được để trống.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Mật khẩu xác nhận không khớp.'); return; }
    setPwSaving(true); setPwError('');
    try {
      const res = await api.put('/profile/change-password', {
        currentPassword: pwForm.currentPassword || null,
        newPassword: pwForm.newPassword,
      });
      if (res.data.success) {
        setPwSuccess(true);
        setShowPwForm(false);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const c = res.data.errorCode;
        setPwError(
          c === 'WRONG_PASSWORD' ? 'Mật khẩu hiện tại không đúng.' :
            c === 'VALIDATION_ERROR' ? 'Mật khẩu mới không hợp lệ (phải đủ độ mạnh).' :
              c === 'ACCOUNT_INACTIVE' ? 'Tài khoản bị vô hiệu hóa.' :
                res.data.errorMessage || 'Đổi mật khẩu thất bại.'
        );
      }
    } catch (err) {
      const c = err.response?.data?.errorCode;
      setPwError(c === 'WRONG_PASSWORD' ? 'Mật khẩu hiện tại không đúng.' : 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally { setPwSaving(false); }
  };

  /* ── Chưa đăng nhập ── */
  if (loadError === 'no_token') {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.card}>
            <div className={styles.stateBox}>
              <div className={styles.stateIcon}><i className="fas fa-user-lock" /></div>
              <p className={styles.stateTitle}>Bạn chưa đăng nhập</p>
              <p className={styles.stateDesc}>Vui lòng đăng nhập để xem hồ sơ cá nhân.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">

        {loading && <ProfileSkeleton />}

        {!loading && loadError && loadError !== 'no_token' && (
          <div className={styles.card}>
            <div className={styles.stateBox}>
              <div className={styles.stateIcon}><i className="fas fa-user-slash" /></div>
              <p className={styles.stateTitle}>Không thể tải hồ sơ</p>
              <p className={styles.stateDesc}>{loadError}</p>
            </div>
          </div>
        )}

        {!loading && !loadError && profile && (
          <>
            {saveSuccess && !isEditing && (
              <div className={styles.successBanner}>
                <i className="fas fa-check-circle" /> Cập nhật thông tin thành công!
              </div>
            )}

            {/* ── Profile Header Card ── */}
            <div className={styles.profileCard}>
              <div className={styles.banner} />
              <div className={styles.headerRow}>
                <div className={styles.avatarWrap}>
                  {profile.avatarUrl
                    ? <img className={styles.avatarImg} src={profile.avatarUrl} alt={profile.fullName} />
                    : <div className={styles.avatarInitials}>{getInitials(profile.fullName)}</div>
                  }
                  <div className={styles.avatarOnline} />
                </div>
                <div className={styles.headerInfo}>
                  <h1 className={styles.headerName}>{profile.fullName}</h1>
                  <div className={styles.headerMeta}>
                    <span className={styles.metaItem}>
                      <i className="fas fa-user-graduate" /> Học viên
                    </span>
                    <span className={styles.metaDot}>·</span>
                    <span className={styles.metaItem}>
                      <i className="fas fa-calendar-alt" /> Tham gia 01/2026
                    </span>
                  </div>
                  <span className={styles.verifiedBadge}>
                    <i className="fas fa-check-circle" /> Đã xác thực
                  </span>
                </div>
                <div className={styles.headerActions}>
                  <button className={styles.btnPrimary} onClick={handleEditStart}>
                    <i className="fas fa-pen" /> Sửa thông tin
                  </button>

                </div>
              </div>
            </div>

            {/* ── Content Grid ── */}
            <div className={styles.contentGrid}>

              {/* LEFT: Thông tin cá nhân */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>
                    <i className="fas fa-user" /> Thông tin cá nhân
                  </span>
                  {!isEditing && (
                    <button className={styles.iconBtn} onClick={handleEditStart}>
                      <i className="fas fa-pen" />
                    </button>
                  )}
                </div>

                <div className={styles.cardBody}>

                  {/* ── VIEW ── */}
                  {!isEditing && (
                    <>
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldItem}>
                          <label className={styles.fieldLabel}>HỌ VÀ TÊN</label>
                          <div className={styles.fieldBox}>{profile.fullName}</div>
                        </div>
                        <div className={styles.fieldItem}>
                          <label className={styles.fieldLabel}>LOẠI HỌC VIÊN</label>
                          <div className={styles.fieldBox}>
                            {profile.learner.learnerType
                              ? LEARNER_TYPE_LABELS[profile.learner.learnerType]
                              : <span className={styles.fieldEmpty}>Chưa cập nhật</span>}
                          </div>
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.fieldItemFull}>
                          <label className={styles.fieldLabel}>EMAIL</label>
                          <div className={`${styles.fieldBox} ${styles.fieldBoxRow}`}>
                            <span>{profile.email}</span>
                            <span className={styles.verifiedTag}>
                              <i className="fas fa-check" /> Xác thực
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.fieldItem}>
                          <label className={styles.fieldLabel}>TRÌNH ĐỘ KIẾN THỨC</label>
                          <div className={styles.fieldBox}>
                            {profile.learner.knowledgeLevel
                              ? KNOWLEDGE_LEVEL_LABELS[profile.learner.knowledgeLevel]
                              : <span className={styles.fieldEmpty}>Chưa cập nhật</span>}
                          </div>
                        </div>
                        <div className={styles.fieldItem}>
                          <label className={styles.fieldLabel}>ẢNH ĐẠI DIỆN (URL)</label>
                          <div className={styles.fieldBox}>
                            {profile.avatarUrl
                              ? <span className={styles.urlText}>{profile.avatarUrl}</span>
                              : <span className={styles.fieldEmpty}>Chưa cập nhật</span>}
                          </div>
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.fieldItemFull}>
                          <label className={styles.fieldLabel}>MỤC TIÊU HỌC TẬP</label>
                          <div className={`${styles.fieldBox} ${styles.fieldBoxTags}`}>
                            {profile.learner.learningGoals.length > 0
                              ? profile.learner.learningGoals.map(g => (
                                <span key={g.id} className={styles.tagChip}>{g.name}</span>
                              ))
                              : <span className={styles.fieldEmpty}>Chưa chọn mục tiêu.</span>}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── EDIT ── */}
                  {isEditing && (
                    <>
                      <div className={styles.fieldRow}>
                        <div className={styles.fieldItem}>
                          <label className={styles.fieldLabel}>
                            HỌ VÀ TÊN <span className={styles.required}>*</span>
                          </label>
                          <input
                            className={styles.fieldBox}
                            value={form.fullName}
                            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                          />
                        </div>
                        <div className={styles.fieldItem}>
                          <label className={styles.fieldLabel}>LOẠI HỌC VIÊN</label>
                          <select
                            className={styles.fieldBox}
                            value={form.learnerType}
                            onChange={e => setForm(f => ({ ...f, learnerType: e.target.value }))}
                          >
                            <option value="">-- Chọn loại --</option>
                            {Object.entries(LEARNER_TYPE_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.fieldItemFull}>
                          <label className={styles.fieldLabel}>EMAIL</label>
                          <div className={`${styles.fieldBox} ${styles.fieldBoxDisabled}`}>{profile.email}</div>
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.fieldItem}>
                          <label className={styles.fieldLabel}>TRÌNH ĐỘ KIẾN THỨC</label>
                          <select
                            className={styles.fieldBox}
                            value={form.knowledgeLevel}
                            onChange={e => setForm(f => ({ ...f, knowledgeLevel: e.target.value }))}
                          >
                            <option value="">-- Chọn trình độ --</option>
                            {Object.entries(KNOWLEDGE_LEVEL_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.fieldItem}>
                          <label className={styles.fieldLabel}>ẢNH ĐẠI DIỆN (URL)</label>
                          <input
                            className={styles.fieldBox}
                            placeholder="https://..."
                            value={form.avatarUrl}
                            onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                          />
                        </div>
                      </div>

                      {tags.length > 0 && (
                        <div className={styles.fieldRow}>
                          <div className={styles.fieldItemFull}>
                            <label className={styles.fieldLabel}>MỤC TIÊU HỌC TẬP</label>
                            <div className={styles.tagCheckboxGrid}>
                              {tags.map(tag => {
                                const checked = form.learningGoals.includes(tag.id);
                                return (
                                  <button
                                    key={tag.id}
                                    type="button"
                                    className={`${styles.tagToggle} ${checked ? styles.tagToggleActive : ''}`}
                                    onClick={() => toggleGoal(tag.id)}
                                  >
                                    {checked && <i className="fas fa-check" />}
                                    {tag.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {saveError && (
                        <div className={styles.formError}>
                          <i className="fas fa-exclamation-circle" /> {saveError}
                        </div>
                      )}

                      <div className={styles.formActions}>
                        <button
                          className={styles.btnOutline}
                          onClick={() => { setIsEditing(false); setSaveError(''); }}
                          disabled={saving}
                        >
                          Hủy
                        </button>
                        <button className={styles.btnPrimary} onClick={handleSaveProfile} disabled={saving}>
                          {saving
                            ? <><i className="fas fa-spinner fa-spin" /> Đang lưu...</>
                            : <><i className="fas fa-save" /> Lưu thay đổi</>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT: Bảo mật tài khoản */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>
                    <i className="fas fa-shield-alt" /> Bảo mật tài khoản
                  </span>
                </div>
                <div className={styles.cardBody}>

                  {/* Mật khẩu */}
                  <div className={styles.securityItem}>
                    <div className={styles.securityIconWrap}>
                      <i className="fas fa-lock" />
                    </div>
                    <div className={styles.securityInfo}>
                      <div className={styles.securityTitle}>Mật khẩu</div>
                      {!showPwForm && !pwSuccess && (
                        <div className={styles.securityDesc}>Bảo vệ tài khoản bằng mật khẩu mạnh.</div>
                      )}
                      {!showPwForm && pwSuccess && (
                        <div className={styles.securitySuccess}>
                          <i className="fas fa-check-circle" /> Đổi mật khẩu thành công!
                        </div>
                      )}
                    </div>
                    {!showPwForm && (
                      <button className={styles.btnSmall} onClick={() => { setShowPwForm(true); setPwSuccess(false); }}>
                        Đổi
                      </button>
                    )}
                  </div>

                  {showPwForm && (
                    <div className={styles.pwFormWrap}>
                      <div className={styles.fieldItem} style={{ marginBottom: 12 }}>
                        <label className={styles.fieldLabel}>MẬT KHẨU HIỆN TẠI</label>
                        <input className={styles.fieldBox} type="password"
                          value={pwForm.currentPassword}
                          onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
                      </div>
                      <div className={styles.fieldItem} style={{ marginBottom: 12 }}>
                        <label className={styles.fieldLabel}>MẬT KHẨU MỚI <span className={styles.required}>*</span></label>
                        <input className={styles.fieldBox} type="password"
                          value={pwForm.newPassword}
                          onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
                      </div>
                      <div className={styles.fieldItem} style={{ marginBottom: 12 }}>
                        <label className={styles.fieldLabel}>XÁC NHẬN MẬT KHẨU <span className={styles.required}>*</span></label>
                        <input className={styles.fieldBox} type="password"
                          value={pwForm.confirmPassword}
                          onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                      </div>
                      {pwError && (
                        <div className={styles.formError}>
                          <i className="fas fa-exclamation-circle" /> {pwError}
                        </div>
                      )}
                      <div className={styles.formActions}>
                        <button className={styles.btnOutline}
                          onClick={() => { setShowPwForm(false); setPwError(''); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                          disabled={pwSaving}>
                          Hủy
                        </button>
                        <button className={styles.btnPrimary} onClick={handleChangePassword} disabled={pwSaving}>
                          {pwSaving
                            ? <><i className="fas fa-spinner fa-spin" /> Đang xử lý...</>
                            : <><i className="fas fa-key" /> Đổi mật khẩu</>}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={styles.securityDivider} />

                  {/* Email xác thực */}
                  <div className={styles.securityItem}>
                    <div className={`${styles.securityIconWrap} ${styles.securityIconGreen}`}>
                      <i className="fas fa-envelope" />
                    </div>
                    <div className={styles.securityInfo}>
                      <div className={styles.securityTitle}>Email xác thực</div>
                      <div className={styles.securitySuccess}>
                        <i className="fas fa-check-circle" /> Đã xác thực
                      </div>
                      <div className={styles.securityEmail}>{profile.email}</div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
