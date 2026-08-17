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
  getAdminSubscriptionStatistics,
  updateSubscriptionPlan,
} from '@services/adminSubscriptionPlanApi';
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
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'statistics'

  /* ── Tab 1: Plans state ── */
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [formModal, setFormModal] = useState(null); // { mode: 'create' | 'edit', plan }
  const [statusTarget, setStatusTarget] = useState(null);
  const [reordering, setReordering] = useState(false);

  /* ── Tab 2: Statistics state ── */
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  /* ── Formatters ── */
  const formatVND = (v) =>
    v == null
      ? '—'
      : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(v);

  const formatNum = (v) =>
    v == null ? '—' : new Intl.NumberFormat('vi-VN').format(Math.round(v));

  /* ── Fetch Plans ── */
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const res = await getAdminSubscriptionPlans();
      if (res.success) {
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

  /* ── Fetch Statistics ── */
  const fetchStatistics = useCallback(async () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setStatsError('Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
      return;
    }

    setStatsLoading(true);
    setStatsError('');

    try {
      const res = await getAdminSubscriptionStatistics({
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
      });

      if (res.success) {
        setStatsData(res.data ?? null);
      } else {
        setStatsError(res.errorMessage || 'Không thể tải báo cáo thống kê.');
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setStatsError(errorMessage || 'Lỗi kết nối máy chủ khi lấy dữ liệu thống kê.');
    } finally {
      setStatsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics();
    }
  }, [activeTab, fetchStatistics]);

  const stats = useMemo(() => {
    const active = plans.filter((plan) => plan.status === 'Active').length;
    return { total: plans.length, active, inactive: plans.length - active };
  }, [plans]);

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
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" aria-hidden="true" />
          <span>Quản lý gói đăng ký</span>
        </div>

        {/* Header Band */}
        <section className={styles.headerBand}>
          <div>
            <h1>Quản lý gói đăng ký</h1>
            <p className={styles.headerText}>
              Cấu hình các gói đăng ký, theo dõi lượt người dùng mua gói và thống kê tổng doanh thu thu được từ hệ thống.
            </p>
          </div>

          <div className={styles.headerActions}>
            {activeTab === 'plans' && (
              <>
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
              </>
            )}

            {activeTab === 'statistics' && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={fetchStatistics}
                disabled={statsLoading}
              >
                <i className={statsLoading ? 'fas fa-spinner fa-spin' : 'fas fa-rotate-right'} aria-hidden="true" />
                {statsLoading ? 'Đang tải...' : 'Tải lại'}
              </button>
            )}
          </div>
        </section>

        {/* Tab Navigation */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'plans' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            <i className="fas fa-layer-group" aria-hidden="true" /> Cấu hình gói đăng ký
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'statistics' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <i className="fas fa-chart-line" aria-hidden="true" /> Thống kê & Doanh thu
          </button>
        </div>

        {/* ═══════════════ TAB 1: PLANS ═══════════════ */}
        {activeTab === 'plans' && (
          <>
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
          </>
        )}

        {/* ═══════════════ TAB 2: STATISTICS ═══════════════ */}
        {activeTab === 'statistics' && (
          <>
            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <div className={styles.dateRangeGroup}>
                <div className={styles.dateInput}>
                  <label>Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className={styles.dateInput}>
                  <label>Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={fetchStatistics}
                  disabled={statsLoading}
                >
                  <i className="fas fa-filter" aria-hidden="true" /> Lọc dữ liệu
                </button>
              </div>

              <div className={styles.filterActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  <i className="fas fa-times" aria-hidden="true" /> Xóa bộ lọc
                </button>
              </div>
            </div>

            {statsError ? (
              <div className={styles.errorState}>
                <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                <p>{statsError}</p>
                <button type="button" className={styles.secondaryButton} onClick={fetchStatistics}>
                  Thử lại
                </button>
              </div>
            ) : (
              <>
                {/* Metric Summary Cards */}
                <div className={styles.summaryCards}>
                  {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={styles.cardSkeleton}>
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonLine} style={{ width: '60%' }} />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className={styles.summaryCard}>
                        <div className={`${styles.cardIcon} ${styles.iconRevenue}`}>
                          <i className="fas fa-sack-dollar" aria-hidden="true" />
                        </div>
                        <div className={styles.cardContent}>
                          <span className={styles.cardLabel}>Tổng doanh thu</span>
                          <strong className={styles.cardValue}>{formatVND(statsData?.totalRevenue)}</strong>
                        </div>
                      </div>

                      <div className={styles.summaryCard}>
                        <div className={`${styles.cardIcon} ${styles.iconTransactions}`}>
                          <i className="fas fa-cart-shopping" aria-hidden="true" />
                        </div>
                        <div className={styles.cardContent}>
                          <span className={styles.cardLabel}>Lượt mua thành công</span>
                          <strong className={styles.cardValue}>{formatNum(statsData?.totalTransactions)}</strong>
                        </div>
                      </div>

                      <div className={styles.summaryCard}>
                        <div className={`${styles.cardIcon} ${styles.iconUsers}`}>
                          <i className="fas fa-users" aria-hidden="true" />
                        </div>
                        <div className={styles.cardContent}>
                          <span className={styles.cardLabel}>Học viên đã mua gói</span>
                          <strong className={styles.cardValue}>{formatNum(statsData?.totalUniqueBuyers)}</strong>
                        </div>
                      </div>

                      <div className={styles.summaryCard}>
                        <div className={`${styles.cardIcon} ${styles.iconActiveSub}`}>
                          <i className="fas fa-id-card" aria-hidden="true" />
                        </div>
                        <div className={styles.cardContent}>
                          <span className={styles.cardLabel}>Gói đang hoạt động</span>
                          <strong className={styles.cardValue}>{formatNum(statsData?.activeSubscriptionsCount)}</strong>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Section 1: Revenue breakdown by plan */}
                <section className={styles.section}>
                  <h2><i className="fas fa-pie-chart" aria-hidden="true" /> Cơ cấu doanh thu & lượt mua theo gói</h2>
                  {statsLoading ? (
                    <div className={styles.tableSkeleton}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={styles.skeletonRow}>
                          <div className={styles.skeletonLine} />
                        </div>
                      ))}
                    </div>
                  ) : statsData?.planBreakdowns?.length > 0 ? (
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th scope="col">Tier</th>
                            <th scope="col">Tên gói đăng ký</th>
                            <th scope="col">Giá hiện tại</th>
                            <th scope="col">Tổng lượt mua</th>
                            <th scope="col">Tổng doanh thu</th>
                            <th scope="col">Số gói đang hoạt động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.planBreakdowns.map((planStat) => (
                            <tr key={planStat.planId}>
                              <td>Tier {planStat.tierLevel}</td>
                              <td><strong>{planStat.planName}</strong></td>
                              <td className={styles.numeric}>{formatPrice(planStat.currentPrice)}</td>
                              <td className={styles.numeric}>{formatNum(planStat.totalPurchases)}</td>
                              <td className={`${styles.numeric} ${styles.highlightValue}`}>
                                {formatVND(planStat.totalRevenue)}
                              </td>
                              <td className={styles.numeric}>
                                <span className={styles.badgeActiveCount}>
                                  {formatNum(planStat.activeCount)} gói
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <i className="fas fa-box-open" aria-hidden="true" />
                      <p>Chưa có dữ liệu thống kê cho các gói.</p>
                    </div>
                  )}
                </section>

                {/* Section 2: Revenue trend over time */}
                <section className={styles.section}>
                  <h2><i className="fas fa-arrow-trend-up" aria-hidden="true" /> Xu hướng doanh thu theo thời gian</h2>
                  {statsLoading ? (
                    <div className={styles.tableSkeleton}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={styles.skeletonRow}>
                          <div className={styles.skeletonLine} />
                        </div>
                      ))}
                    </div>
                  ) : statsData?.revenueTrends?.length > 0 ? (
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th scope="col">Ngày thanh toán</th>
                            <th scope="col">Số lượt giao dịch</th>
                            <th scope="col">Doanh thu trong ngày</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.revenueTrends.map((trend, i) => (
                            <tr key={i}>
                              <td>{trend.date}</td>
                              <td className={styles.numeric}>{formatNum(trend.transactionCount)}</td>
                              <td className={`${styles.numeric} ${styles.highlightValue}`}>
                                {formatVND(trend.revenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <i className="fas fa-chart-area" aria-hidden="true" />
                      <p>Không có dữ liệu xu hướng doanh thu trong khoảng thời gian này.</p>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
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
