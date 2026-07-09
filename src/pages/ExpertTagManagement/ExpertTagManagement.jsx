import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './ExpertTagManagement.module.css';

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
      {message}
    </div>
  );
}

/* ── Status Badge ──────────────────────────────────────────────────────────── */
function StatusBadge({ tag }) {
  if (tag.isPublished) {
    return (
      <span className={`${styles.badge} ${styles.badgeGreen}`}>
        <i className="fas fa-check-circle" /> Đã duyệt
      </span>
    );
  }
  const status = tag.publishRequest?.status;
  if (status === 'Pending') {
    return (
      <span className={`${styles.badge} ${styles.badgeYellow}`}>
        <i className="fas fa-clock" /> Chờ duyệt
      </span>
    );
  }
  if (status === 'Rejected') {
    return (
      <span className={`${styles.badge} ${styles.badgeRed}`}>
        <i className="fas fa-times-circle" /> Bị từ chối
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.badgeGray}`}>
      <i className="fas fa-pencil-alt" /> Chưa gửi duyệt
    </span>
  );
}

/* ── Create Tag Modal ──────────────────────────────────────────────────────── */
function CreateTagModal({ onClose, onCreated }) {
  const [name,    setName]    = useState('');
  const [code,    setCode]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  // Auto-generate code from name
  const handleNameChange = e => {
    const val = e.target.value;
    setName(val);
    setCode(
      val.trim()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
    );
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên tag không được để trống.'); return; }
    if (!code.trim()) { setError('Code tag không được để trống.'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await api.post('/tags/custom', { name: name.trim(), code: code.trim() });
      if (res.data.success) {
        onCreated(res.data.data);
      } else {
        setError(res.data.errorMessage || 'Tạo tag thất bại.');
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <i className="fas fa-plus-circle" /> Tạo tag tùy chỉnh
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.infoBox}>
              <i className="fas fa-info-circle" />
              Tag mới sẽ ở trạng thái <strong>chưa duyệt</strong>. Sau khi tạo, bạn có thể gửi yêu cầu xét duyệt để tag xuất hiện công khai.
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-tag" /> Tên tag *
              </label>
              <input
                className={styles.formInput}
                value={name}
                onChange={handleNameChange}
                placeholder="VD: Machine Learning"
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-code" /> Code tag *
                <span className={styles.labelHint}>(tự động tạo từ tên)</span>
              </label>
              <input
                className={styles.formInput}
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                placeholder="VD: machine-learning"
              />
            </div>

            {error && (
              <div className={styles.formError}>
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving
                ? <><span className={styles.spinner} /> Đang tạo...</>
                : <><i className="fas fa-plus" /> Tạo tag</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Request Verification Modal ────────────────────────────────────────────── */
function RequestVerificationModal({ tag, onClose, onRequested }) {
  const [note,   setNote]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/tags/${tag.id}/request-verification`, {
        note: note.trim() || null,
      });
      if (res.data.success) {
        onRequested(res.data.data);
      } else {
        setError(res.data.errorMessage || 'Gửi yêu cầu thất bại.');
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <i className="fas fa-paper-plane" /> Gửi yêu cầu xét duyệt
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.tagPreviewBox}>
              <span className={styles.tagPreviewLabel}>Tag:</span>
              <span className={styles.tagPreviewName}>{tag.name}</span>
              <code className={styles.tagPreviewCode}>{tag.code}</code>
            </div>

            <div className={styles.infoBox}>
              <i className="fas fa-info-circle" />
              Yêu cầu sẽ được admin xem xét. Sau khi được duyệt, tag sẽ xuất hiện công khai và có thể dùng trong khóa học.
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="fas fa-comment-alt" /> Ghi chú cho admin
                <span className={styles.labelHint}>(không bắt buộc)</span>
              </label>
              <textarea
                className={styles.formTextarea}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Mô tả ngắn về tag này, lý do muốn thêm vào hệ thống..."
                autoFocus
              />
            </div>

            {error && (
              <div className={styles.formError}>
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving
                ? <><span className={styles.spinner} /> Đang gửi...</>
                : <><i className="fas fa-paper-plane" /> Gửi yêu cầu</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Tag Row ───────────────────────────────────────────────────────────────── */
function TagRow({ tag, onRequestVerification }) {
  const canRequest = !tag.isPublished && tag.publishRequest?.status !== 'Pending';

  return (
    <div className={styles.tagRow}>
      <div className={styles.tagRowBody}>
        <div className={styles.tagRowTop}>
          <StatusBadge tag={tag} />
          <span className={styles.tagDate}>
            <i className="fas fa-calendar" />
            {new Date(tag.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div className={styles.tagRowName}>{tag.name}</div>
        <code className={styles.tagRowCode}>{tag.code}</code>

        {tag.publishRequest?.status === 'Rejected' && tag.publishRequest.note && (
          <div className={styles.rejectedNote}>
            <i className="fas fa-exclamation-triangle" />
            <span>Lý do từ chối: {tag.publishRequest.note}</span>
          </div>
        )}

        {tag.publishRequest?.status === 'Pending' && (
          <div className={styles.pendingNote}>
            <i className="fas fa-clock" />
            <span>Đã gửi yêu cầu xét duyệt — đang chờ admin phê duyệt.</span>
          </div>
        )}
      </div>

      <div className={styles.tagRowActions}>
        {canRequest && (
          <button
            className={styles.btnRequest}
            onClick={() => onRequestVerification(tag)}
            title="Gửi yêu cầu xét duyệt"
          >
            <i className="fas fa-paper-plane" /> Gửi duyệt
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function ExpertTagManagement() {
  const navigate = useNavigate();

  const [tags,    setTags]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [showCreate,  setShowCreate]  = useState(false);
  const [verifyTag,   setVerifyTag]   = useState(null); // tag object
  const [toast,       setToast]       = useState(null);
  const [filter,      setFilter]      = useState('all'); // 'all' | 'published' | 'pending' | 'draft'

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/tags/me');
      if (res.data.success) setTags(res.data.data ?? []);
    } catch (err) {
      if (err.response?.status === 401) navigate('/expert/login');
      else setError('Không tải được danh sách tag. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const handleCreated = newTag => {
    setShowCreate(false);
    setTags(prev => [newTag, ...prev]);
    showToast(`Tạo tag "${newTag.name}" thành công!`);
  };

  const handleRequested = updatedTag => {
    setVerifyTag(null);
    setTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t));
    showToast(`Đã gửi yêu cầu xét duyệt cho tag "${updatedTag.name}".`);
  };

  const filteredTags = tags.filter(tag => {
    if (filter === 'published') return tag.isPublished;
    if (filter === 'pending')   return !tag.isPublished && tag.publishRequest?.status === 'Pending';
    if (filter === 'draft')     return !tag.isPublished && tag.publishRequest?.status !== 'Pending';
    return true;
  });

  const publishedCount = tags.filter(t => t.isPublished).length;
  const pendingCount   = tags.filter(t => !t.isPublished && t.publishRequest?.status === 'Pending').length;
  const draftCount     = tags.filter(t => !t.isPublished && t.publishRequest?.status !== 'Pending').length;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.breadcrumb}>
              <Link to="/expert">Trang chủ</Link>
              <i className="fas fa-chevron-right" />
              <span>Tạo Tag</span>
            </div>
            <h1 className={styles.pageTitle}>
              <i className="fas fa-hashtag" /> Tạo Tag
            </h1>
            <p className={styles.pageSubtitle}>
              Tạo tag tùy chỉnh và gửi yêu cầu xét duyệt để sử dụng trong khóa học.
            </p>
          </div>
          <button className={styles.btnCreate} onClick={() => setShowCreate(true)}>
            <i className="fas fa-plus" /> Tạo tag mới
          </button>
        </div>

        {/* ── STATS BAR ──────────────────────────────────────── */}
        <div className={styles.statsBar}>
          <div className={`${styles.statChip}`}>
            <span className={styles.statNum}>{tags.length}</span>
            <span className={styles.statLbl}>Tổng tag</span>
          </div>
          <div className={`${styles.statChip} ${styles.statGreen}`}>
            <span className={styles.statNum}>{publishedCount}</span>
            <span className={styles.statLbl}>Đã duyệt</span>
          </div>
          <div className={`${styles.statChip} ${styles.statYellow}`}>
            <span className={styles.statNum}>{pendingCount}</span>
            <span className={styles.statLbl}>Chờ duyệt</span>
          </div>
          <div className={`${styles.statChip} ${styles.statGray}`}>
            <span className={styles.statNum}>{draftCount}</span>
            <span className={styles.statLbl}>Chưa gửi</span>
          </div>
        </div>

        {/* ── FILTER TABS ────────────────────────────────────── */}
        <div className={styles.filterBar}>
          {[
            { value: 'all',       label: 'Tất cả'    },
            { value: 'published', label: 'Đã duyệt'  },
            { value: 'pending',   label: 'Chờ duyệt' },
            { value: 'draft',     label: 'Chưa gửi'  },
          ].map(tab => (
            <button
              key={tab.value}
              className={`${styles.filterTab} ${filter === tab.value ? styles.filterTabActive : ''}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ────────────────────────────────────────── */}
        {loading ? (
          <div className={styles.loadingWrap}>
            {[1,2,3,4].map(i => <div key={i} className={styles.skRow} />)}
          </div>
        ) : error ? (
          <div className={styles.errorBox}>
            <i className="fas fa-exclamation-triangle" />
            <p>{error}</p>
            <button className={styles.btnRetry} onClick={fetchTags}>
              <i className="fas fa-rotate-right" /> Thử lại
            </button>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><i className="fas fa-hashtag" /></div>
            <h3>{filter !== 'all' ? 'Không có tag nào ở trạng thái này' : 'Bạn chưa có tag nào'}</h3>
            <p>
              {filter !== 'all'
                ? 'Thử chọn bộ lọc khác.'
                : 'Tạo tag tùy chỉnh để gắn vào các khóa học của bạn.'}
            </p>
            {filter === 'all' && (
              <button className={styles.btnCreate} onClick={() => setShowCreate(true)}>
                <i className="fas fa-plus" /> Tạo tag đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tagList}>
            {filteredTags.map(tag => (
              <TagRow
                key={tag.id}
                tag={tag}
                onRequestVerification={setVerifyTag}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── MODALS ───────────────────────────────────────────── */}
      {showCreate && (
        <CreateTagModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {verifyTag && (
        <RequestVerificationModal
          tag={verifyTag}
          onClose={() => setVerifyTag(null)}
          onRequested={handleRequested}
        />
      )}

      {/* ── TOAST ────────────────────────────────────────────── */}
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
