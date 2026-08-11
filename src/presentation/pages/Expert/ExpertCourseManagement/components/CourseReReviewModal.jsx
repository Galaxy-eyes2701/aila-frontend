import { useEffect, useState } from 'react';
import styles from '../ExpertCourseManagement.module.css';
import { submitReReviewRequest, getMyReReviewRequests } from "@services/courseReviewApi";

const STATUS_STYLE = {
  Pending:  { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
  Approved: { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' },
  Rejected: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
};
const STATUS_LABEL = { Pending: 'Đang chờ', Approved: 'Đã duyệt', Rejected: 'Từ chối' };

export default function CourseReReviewModal({ course, onClose, onSubmitted }) {
  const [reason,         setReason]         = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    getMyReReviewRequests()
      .then(res => {
        if (res.success) {
          const forThisCourse = (res.data ?? []).filter(r => r.courseId === course.id);
          setHistory(forThisCourse);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [course.id]);

  const hasPending = history.some(r => r.status === 'Pending');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!reason.trim())             { setError('Vui lòng nhập lý do yêu cầu.'); return; }
    if (reason.trim().length > 1000){ setError('Lý do không được vượt quá 1000 ký tự.'); return; }
    setSaving(true); setError('');
    try {
      const res = await submitReReviewRequest(course.id, reason.trim());
      if (res.success) { onSubmitted?.(); onClose(); }
      else setError(res.errorMessage || 'Gửi yêu cầu thất bại.');
    } catch (err) {
      setError(err.response?.data?.errorMessage || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 560 }}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <i className="fas fa-file-signature" /> Yêu cầu xem xét lại khóa học
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.infoBoxBlue} style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#9a3412' }}>
            <i className="fas fa-lock" />
            <span>
              Khóa học <strong>"{course.name}"</strong> đang bị khoá do vi phạm nội quy.
              Bạn cần giải trình để admin xem xét mở lại.
            </span>
          </div>

          {/* Lịch sử requests */}
          {!historyLoading && history.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                <i className="fas fa-history" /> Lịch sử yêu cầu
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(r => (
                  <div key={r.id} style={{
                    padding: '10px 12px', border: '1px solid #e5e7eb',
                    borderRadius: 8, background: '#f9fafb', fontSize: 13,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{r.reason}</span>
                      <span style={{ ...STATUS_STYLE[r.status], padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                    {r.reviewComment && (
                      <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
                        <i className="fas fa-comment-alt" /> Phản hồi admin: {r.reviewComment}
                      </div>
                    )}
                    <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasPending ? (
            <div className={styles.infoBoxBlue}>
              <i className="fas fa-clock" />
              Bạn đã có yêu cầu đang chờ admin xem xét. Vui lòng chờ phản hồi.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <i className="fas fa-comment-alt" /> Lý do yêu cầu mở lại *
                </label>
                <textarea
                  className={styles.formTextarea}
                  value={reason}
                  onChange={e => { setReason(e.target.value); setError(''); }}
                  placeholder="Giải thích lý do bạn muốn mở lại khóa học, cam kết chỉnh sửa nội dung vi phạm..."
                  rows={4}
                  maxLength={1000}
                />
                <span className={styles.charCount}>{reason.trim().length}/1000</span>
              </div>
              {error && (
                <div className={styles.formError}>
                  <i className="fas fa-exclamation-circle" /> {error}
                </div>
              )}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={onClose}>Hủy</button>
                <button type="submit" className={styles.btnSave} disabled={saving}>
                  {saving
                    ? <><span className={styles.spinner} /> Đang gửi...</>
                    : <><i className="fas fa-paper-plane" /> Gửi yêu cầu</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
