import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PolicyViolations.module.css';
import Toast from '../../Expert/ModuleManagement/components/Toast';
import Pagination from '@presentation/components/Pagination/Pagination';
import { getAIPolicyViolations } from '@services/aiReportsApi';

function ViolationDetailModal({ violation, onClose }) {
  if (!violation) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Chi tiết vi phạm chính sách</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.detailRow}>
            <label>ID Vi phạm</label>
            <p>{violation.id}</p>
          </div>

          <div className={styles.detailRow}>
            <label>Người dùng</label>
            <p>{violation.userIdentifier || '—'}</p>
          </div>

          <div className={styles.detailRow}>
            <label>Loại vi phạm</label>
            <p>
              <span className={styles.violationType}>
                {violation.violationType || '—'}
              </span>
            </p>
          </div>

          <div className={styles.detailRow}>
            <label>Mô tả</label>
            <p className={styles.descriptionText}>{violation.description || '—'}</p>
          </div>

          <div className={styles.detailRow}>
            <label>Ngày phát hiện</label>
            <p>
              {violation.detectedAt
                ? new Date(violation.detectedAt).toLocaleString('vi-VN')
                : '—'}
            </p>
          </div>

          <div className={styles.detailRow}>
            <label>Trạng thái</label>
            <p>
              <span className={styles.statusBadge}>
                {violation.status || 'Chưa xử lý'}
              </span>
            </p>
          </div>

          {violation.context && (
            <div className={styles.detailRow}>
              <label>Bối cảnh</label>
              <p className={styles.contextText}>{violation.context}</p>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.primaryButton} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PolicyViolations() {
  const [violations, setViolations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState(null);

  // Filters
  const [violationType, setViolationType] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const res = await getAIPolicyViolations(violationType || undefined, pageNumber, pageSize);
      if (res.success) {
        setViolations(res.data);
      } else {
        setPageError(res.errorMessage || 'Không thể tải danh sách vi phạm.');
        setViolations(null);
      }
    } catch (err) {
      setPageError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [violationType, pageNumber, pageSize]);

  useEffect(() => {
    fetchViolations();
  }, [fetchViolations]);

  const handleFilterChange = () => {
    setPageNumber(1);
    fetchViolations();
  };

  const handleViewDetail = (violation) => {
    setSelectedViolation(violation);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Vi phạm chính sách AI</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Vi phạm chính sách AI</h1>
            <p className={styles.headerText}>
              Giám sát và quản lý các vi phạm chính sách AI được phát hiện trên nền tảng.
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label>Loại vi phạm</label>
            <select
              value={violationType}
              onChange={(e) => setViolationType(e.target.value)}
            >
              <option value="">Tất cả loại</option>
              <option value="ContentViolation">Vi phạm nội dung</option>
              <option value="RateLimitViolation">Vượt quá giới hạn tỷ lệ</option>
              <option value="UnauthorizedAccess">Truy cập trái phép</option>
              <option value="MaliciousIntent">Ý định xấu</option>
              <option value="Other">Khác</option>
            </select>
            <button className={styles.primaryButton} onClick={handleFilterChange}>
              <i className="fas fa-filter" />
              Lọc
            </button>
          </div>

          <button
            className={styles.secondaryButton}
            onClick={() => {
              setViolationType('');
              setPageNumber(1);
            }}
          >
            <i className="fas fa-rotate-right" />
            Xóa bộ lọc
          </button>
        </div>

        {pageError && (
          <div className={styles.errorState}>
            <i className="fas fa-triangle-exclamation" />
            <p>{pageError}</p>
            <button className={styles.secondaryButton} onClick={fetchViolations}>
              Thử lại
            </button>
          </div>
        )}

        {!pageError && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Loại vi phạm</th>
                  <th>Mô tả</th>
                  <th>Ngày phát hiện</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className={styles.loadingRow}>
                      <td colSpan={6}>
                        <div className={styles.skeletonRow}>
                          <div className={styles.skeletonLine} />
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && violations?.items && violations.items.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className={styles.emptyState}>
                        <i className="fas fa-shield-check" />
                        <p>
                          {violationType
                            ? 'Không tìm thấy vi phạm nào phù hợp.'
                            : 'Không có vi phạm chính sách nào được ghi nhận.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  violations?.items &&
                  violations.items.length > 0 &&
                  violations.items.map((violation) => (
                    <tr key={violation.id}>
                      <td className={styles.userCell}>
                        {violation.userIdentifier || '—'}
                      </td>
                      <td>
                        <span className={styles.violationType}>
                          {violation.violationType || '—'}
                        </span>
                      </td>
                      <td className={styles.descriptionCell}>
                        {violation.description || '—'}
                      </td>
                      <td>
                        {violation.detectedAt
                          ? new Date(violation.detectedAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td>
                        <span className={styles.statusBadge}>
                          {violation.status || 'Chưa xử lý'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.detailButton}
                          onClick={() => handleViewDetail(violation)}
                        >
                          <i className="fas fa-eye" />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading &&
          !pageError &&
          violations &&
          violations.totalPages > 1 && (
            <Pagination
              currentPage={pageNumber}
              totalPages={violations.totalPages}
              itemsPerPage={pageSize}
              totalItems={violations.totalItems}
              onPageChange={setPageNumber}
              onItemsPerPageChange={(n) => {
                setPageSize(n);
                setPageNumber(1);
              }}
              unitLabel="vi phạm"
            />
          )}
      </div>

      {selectedViolation && (
        <ViolationDetailModal
          violation={selectedViolation}
          onClose={() => setSelectedViolation(null)}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
