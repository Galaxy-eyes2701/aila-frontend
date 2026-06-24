import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import styles from './ExpertProfile.module.css';

/* ── Skeleton khi đang load ──────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className={styles.layout}>
      {/* Left skeleton */}
      <div className={styles.avatarCard}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonAvatar}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonText}`} style={{ width: '70%', margin: '0 auto 8px' }} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonText}`} style={{ width: '50%', margin: '0 auto' }} />
      </div>
      {/* Right skeleton */}
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

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ExpertProfile() {
  const navigate            = useNavigate();
  const { user }            = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    // Nếu chưa đăng nhập → redirect về login
    if (!localStorage.getItem('accessToken')) {
      navigate('/expert/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get('/experts/me/profile');
        if (res.data.success) {
          setProfile(res.data.data);
        } else {
          setError(res.data.errorMessage || 'Không thể tải thông tin profile.');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/expert/login');
        } else if (err.response?.status === 404) {
          setError('Không tìm thấy thông tin Expert. Vui lòng liên hệ quản trị viên.');
        } else {
          setError('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Trang chủ</Link>
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

        {/* Profile loaded */}
        {!loading && !error && profile && (
          <div className={styles.layout}>

            {/* ── LEFT: Avatar card ── */}
            <div className={styles.avatarCard}>
              <div className={styles.avatarWrap}>
                <img
                  className={styles.avatar}
                  src={profile.avatarUrl || 'https://i.pravatar.cc/120'}
                  alt={profile.fullName}
                />
                <div className={styles.avatarBadge}>
                  <i className="fas fa-check" />
                </div>
              </div>

              <div className={styles.fullName}>{profile.fullName}</div>

              <div className={styles.rolePill}>
                <i className="fas fa-chalkboard-teacher" />
                Expert
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

            {/* ── RIGHT: Detail card ── */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                <div className={styles.infoCardTitle}>
                  <i className="fas fa-id-card" />
                  Thông tin chi tiết
                </div>
              </div>

              <div className={styles.fieldGrid}>
                {/* Full name */}
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>
                    <i className="fas fa-user" /> Họ và tên
                  </div>
                  <div className={styles.fieldValue}>{profile.fullName}</div>
                </div>

                {/* Email */}
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>
                    <i className="fas fa-envelope" /> Email
                  </div>
                  <div className={styles.fieldValue}>{profile.email}</div>
                </div>

                {/* Specialty */}
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>
                    <i className="fas fa-star" /> Chuyên môn
                  </div>
                  <div className={`${styles.fieldValue} ${!profile.specialty ? styles.empty : ''}`}>
                    {profile.specialty || 'Chưa cập nhật'}
                  </div>
                </div>

                {/* Years of experience */}
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>
                    <i className="fas fa-briefcase" /> Kinh nghiệm
                  </div>
                  <div className={styles.fieldValue}>
                    {profile.yearsOfExperience > 0
                      ? `${profile.yearsOfExperience} năm kinh nghiệm`
                      : 'Chưa cập nhật'}
                  </div>
                </div>

                {/* Bio — full width */}
                <div className={styles.fieldFull}>
                  <div className={styles.fieldLabel}>
                    <i className="fas fa-align-left" /> Giới thiệu bản thân
                  </div>
                  {profile.bio
                    ? <p className={styles.bioText}>{profile.bio}</p>
                    : <p className={`${styles.fieldValue} ${styles.empty}`}>Chưa có giới thiệu.</p>}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
