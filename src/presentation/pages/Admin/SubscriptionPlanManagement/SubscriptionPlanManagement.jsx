import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveApiError } from '@services/api';
import {
  PLAN_STATUS_LABEL,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPrice,
} from '@services/subscriptionPlan';
import Toast from '@presentation/components/Toast/Toast';
import {
  getAdminSubscriptionPlans,
  updateSubscriptionPlan,
} from "@services/adminSubscriptionPlanApi";
import PlanFormModal from './PlanFormModal';
import PlanStatusDialog from './PlanStatusDialog';
import {
  buildOrderUpdatePayload,
  buildReorderUpdates,
  movePlan,
  nextDisplayOrder,
} from './planOrdering';
import styles from './SubscriptionPlanManagement.module.css';

const COLUMN_COUNT = 11;

export default function SubscriptionPlanManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [formModal, setFormModal] = useState(null); // { mode: 'create' | 'edit', plan }
  const [statusTarget, setStatusTarget] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const res = await getAdminSubscriptionPlans();
      if (res.success) {
        // Giữ nguyên thứ tự API trả về (displayOrder → tierLevel → createdAt).
        setPlans(res.data ?? []);
      } else {
        setPageError(res.errorMessage || 'Không thể tải danh sách gói đăng ký.');
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setPageError(errorMessage || 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const stats = useMemo(() => {
    const active = plans.filter((plan) => plan.status === 'Active').length;
    return { total: plans.length, active, inactive: plans.length - active };
  }, [plans]);

  // Sau MỌI mutation thành công: đóng modal → toast → refetch. Không optimistic-update.
  const handleSaved = (message) => {
    setFormModal(null);
    showToast(message);
    fetchPlans();
  };

  const handlePlanNotFound = () => {
    setFormModal(null);
    showToast('Gói đăng ký không còn tồn tại.', 'error');
    fetchPlans();
  };

  const handleStatusResolved = ({ message, type }) => {
    setStatusTarget(null);
    showToast(message, type);
    fetchPlans();
  };

  // Đổi thứ tự bằng nút mũi tên: cập nhật lạc quan cho bảng nhảy ngay, rồi PUT các gói đổi số.
  const handleMove = async (index, direction) => {
    if (reordering) return;

    const nextPlans = movePlan(plans, index, direction);
    if (!nextPlans) return;

    const updates = buildReorderUpdates(plans, nextPlans);
    if (updates.length === 0) return;

    const previousPlans = plans;
    const orderById = new Map(updates.map(({ plan, displayOrder }) => [plan.id, displayOrder]));

    setPlans(
      nextPlans.map((plan) =>
        orderById.has(plan.id) ? { ...plan, displayOrder: orderById.get(plan.id) } : plan
      )
    );
    setReordering(true);

    try {
      // Chưa có endpoint reorder hàng loạt — PUT tuần tự để lỗi giữa chừng vẫn dừng đúng chỗ.
      for (const { plan, displayOrder } of updates) {
        const res = await updateSubscriptionPlan(
          plan.id,
          buildOrderUpdatePayload(plan, displayOrder)
        );
        if (!res.success) throw new Error(res.errorMessage || '');
      }

      showToast('Đã cập nhật thứ tự hiển thị.');
    } catch (err) {
      setPlans(previousPlans);
      const { errorMessage } = resolveApiError(err);
      showToast(errorMessage || err.message || 'Không thể sắp xếp lại gói đăng ký.', 'error');
    } finally {
      setReordering(false);
      fetchPlans();
    }
  };

  const renderTableBody = () => {
    if (loading) {
      return Array.from({ length: 4 }).map((_, index) => (
        <tr key={`skeleton-${index}`}>
          <td colSpan={COLUMN_COUNT}>
            <div className={styles.skeletonRow} />
          </td>
        </tr>
      ));
    }

    if (pageError) {
      return (
        <tr>
          <td colSpan={COLUMN_COUNT}>
            <div className={styles.errorState} role="alert">
              <i className="fas fa-triangle-exclamation" aria-hidden="true" />
              <p>{pageError}</p>
              <button type="button" className={styles.secondaryButton} onClick={fetchPlans}>
                <i className="fas fa-rotate-right" aria-hidden="true" /> Thử lại
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (plans.length === 0) {
      return (
        <tr>
          <td colSpan={COLUMN_COUNT}>
            <div className={styles.emptyState}>
              <i className="fas fa-layer-group" aria-hidden="true" />
              <p>Chưa có gói đăng ký nào.</p>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setFormModal({ mode: 'create' })}
              >
                <i className="fas fa-plus" aria-hidden="true" /> Tạo gói
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return plans.map((plan, index) => {
      const isActive = plan.status === 'Active';

      return (
        <tr key={plan.id}>
          <td>
            <div className={styles.orderCell}>
              <span className={styles.numeric}>{formatNumber(plan.displayOrder)}</span>
              <div className={styles.orderButtons}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleMove(index, 'up')}
                  disabled={reordering || index === 0}
                  title="Di chuyển lên"
                  aria-label={`Di chuyển gói ${plan.name} lên trên`}
                >
                  <i className="fas fa-arrow-up" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => handleMove(index, 'down')}
                  disabled={reordering || index === plans.length - 1}
                  title="Di chuyển xuống"
                  aria-label={`Di chuyển gói ${plan.name} xuống dưới`}
                >
                  <i className="fas fa-arrow-down" aria-hidden="true" />
                </button>
              </div>
            </div>
          </td>
          <td>{formatNumber(plan.tierLevel)}</td>
          <td>
            <div className={styles.planName}>{plan.name}</div>
            {plan.description && <div className={styles.planDesc}>{plan.description}</div>}
          </td>
          <td className={styles.numeric}>{formatPrice(plan.price)}</td>
          <td>{formatDuration(plan.durationInDays)}</td>
          {/* Bảng quản trị hiển thị số thô — quy ước "Không bao gồm" chỉ dùng ở trang công khai. */}
          <td className={styles.numeric}>{formatNumber(plan.aiTokenLimit)}</td>
          <td className={styles.numeric}>{formatNumber(plan.aiPracticeScenarioLimit)}</td>
          <td className={styles.numeric}>{formatNumber(plan.expertEvaluationLimit)}</td>
          <td>
            <span
              className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeInactive}`}
            >
              <i className="fas fa-circle" aria-hidden="true" />
              {PLAN_STATUS_LABEL[plan.status] ?? plan.status}
            </span>
          </td>
          <td className={styles.muted}>{formatDateTime(plan.updatedAt ?? plan.createdAt)}</td>
          <td>
            <div className={styles.actionsCell}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setFormModal({ mode: 'edit', plan })}
                disabled={reordering}
              >
                <i className="fas fa-pen" aria-hidden="true" /> Sửa
              </button>
              <button
                type="button"
                className={`${styles.secondaryButton} ${isActive ? styles.dangerButton : ''}`}
                onClick={() => setStatusTarget(plan)}
                disabled={reordering}
              >
                <i className={`fas ${isActive ? 'fa-ban' : 'fa-rotate-left'}`} aria-hidden="true" />
                {isActive ? 'Ngừng bán' : 'Mở bán'}
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" aria-hidden="true" />
          <span>Quản lý gói đăng ký</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Quản lý gói đăng ký</h1>
            <p className={styles.headerText}>
              Tạo gói mới, cập nhật giá và quyền lợi, sắp xếp thứ tự hiển thị, mở bán hoặc ngừng
              bán gói trên trang công khai.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={fetchPlans}
              disabled={loading || reordering}
            >
              <i className="fas fa-rotate-right" aria-hidden="true" /> Tải lại
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setFormModal({ mode: 'create' })}
              disabled={loading || reordering}
            >
              <i className="fas fa-plus" aria-hidden="true" /> Tạo gói
            </button>
          </div>
        </section>

        <div className={styles.statRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Tổng số gói</span>
            <strong className={styles.statValue}>{stats.total}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Đang bán</span>
            <strong className={`${styles.statValue} ${styles.statActive}`}>{stats.active}</strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Ngừng bán</span>
            <strong className={`${styles.statValue} ${styles.statInactive}`}>
              {stats.inactive}
            </strong>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Thứ tự</th>
                <th scope="col">Tier</th>
                <th scope="col">Tên gói</th>
                <th scope="col">Giá</th>
                <th scope="col">Thời hạn</th>
                <th scope="col">AI Token</th>
                <th scope="col">AI Practice</th>
                <th scope="col">Đánh giá CG</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Cập nhật lúc</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>

        <p className={styles.footnote}>
          <i className="fas fa-arrow-down-1-9" aria-hidden="true" />
          Thứ tự hiển thị được gán tự động khi tạo gói. Dùng nút mũi tên ở cột{' '}
          <strong>Thứ tự</strong> để sắp xếp lại — số nhỏ hiển thị trước trên trang công khai.
        </p>

        <p className={styles.footnote}>
          <i className="fas fa-circle-info" aria-hidden="true" />
          Thay đổi cấu hình gói chỉ áp dụng cho các lượt mua và gia hạn sau này — các gói đăng ký đã
          bán giữ nguyên quyền lợi tại thời điểm mua.
        </p>
      </div>

      {formModal && (
        <PlanFormModal
          mode={formModal.mode}
          plan={formModal.plan}
          nextDisplayOrder={nextDisplayOrder(plans)}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
          onNotFound={handlePlanNotFound}
        />
      )}

      {statusTarget && (
        <PlanStatusDialog
          plan={statusTarget}
          onClose={() => setStatusTarget(null)}
          onResolved={handleStatusResolved}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
