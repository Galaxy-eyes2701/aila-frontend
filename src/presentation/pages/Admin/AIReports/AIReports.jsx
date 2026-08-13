import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './AIReports.module.css';
import Toast from '../../Expert/ModuleManagement/components/Toast';
import Pagination from '@presentation/components/Pagination/Pagination';
import {
  getAIResourceConsumptionReport,
  getAIConsumptionTrend,
  getAIServiceBreakdown,
  getAITopConsumers,
  getAIPolicyViolations,
} from '@services/aiReportsApi';

export default function AIReports() {
  // State for report data
  const [resourceConsumption, setResourceConsumption] = useState(null);
  const [consumptionTrend, setConsumptionTrend] = useState(null);
  const [serviceBreakdown, setServiceBreakdown] = useState(null);
  const [topConsumers, setTopConsumers] = useState(null);
  const [policyViolations, setPolicyViolations] = useState(null);

  // State for UI
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState(null);

  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination for violations
  const [violationPageNumber, setViolationPageNumber] = useState(1);
  const [violationPageSize, setViolationPageSize] = useState(10);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Fetch all reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const [consumption, trend, breakdown, topUsers, violations] = await Promise.all([
        getAIResourceConsumptionReport(startDate, endDate),
        getAIConsumptionTrend(startDate, endDate, 'day'),
        getAIServiceBreakdown(startDate, endDate),
        getAITopConsumers(startDate, endDate, 10),
        getAIPolicyViolations(undefined, violationPageNumber, violationPageSize),
      ]);

      if (consumption.success) {
        setResourceConsumption(consumption.data);
      } else {
        setPageError(consumption.errorMessage || 'Không thể tải báo cáo tiêu thụ tài nguyên.');
        setResourceConsumption(null);
      }

      if (trend.success) {
        setConsumptionTrend(trend.data);
      } else {
        setConsumptionTrend(null);
      }

      if (breakdown.success) {
        setServiceBreakdown(breakdown.data);
      } else {
        setServiceBreakdown(null);
      }

      if (topUsers.success) {
        setTopConsumers(topUsers.data);
      } else {
        setTopConsumers(null);
      }

      if (violations.success) {
        setPolicyViolations(violations.data);
      } else {
        setPolicyViolations(null);
      }
    } catch (err) {
      setPageError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, violationPageNumber, violationPageSize]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = () => {
    setViolationPageNumber(1);
    fetchReports();
  };

  // Format currency (VND)
  const formatVND = (value) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Format number
  const formatNumber = (value) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('vi-VN').format(Math.round(value));
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Báo cáo tiêu thụ AI</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Báo cáo tiêu thụ tài nguyên AI</h1>
            <p className={styles.headerText}>
              Theo dõi mức tiêu thụ tài nguyên AI, chi phí ước tính và các vi phạm chính sách.
            </p>
          </div>
        </section>

        {/* Date Range Filter */}
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
            <button className={styles.primaryButton} onClick={handleFilterChange}>
              <i className="fas fa-filter" />
              Lọc
            </button>
          </div>

          <button
            className={styles.secondaryButton}
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            <i className="fas fa-rotate-right" />
            Xóa bộ lọc
          </button>
        </div>

        {/* Resource Consumption Summary */}
        {pageError && (
          <div className={styles.errorState}>
            <i className="fas fa-triangle-exclamation" />
            <p>{pageError}</p>
            <button className={styles.secondaryButton} onClick={fetchReports}>
              Thử lại
            </button>
          </div>
        )}

        {!pageError && (
          <>
            {/* Summary Cards */}
            <div className={styles.summaryCards}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className={styles.cardSkeleton}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLine} style={{ width: '70%' }} />
                  </div>
                ))
              ) : (
                <>
                  <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}>
                      <i className="fas fa-circle-nodes" />
                    </div>
                    <div className={styles.cardContent}>
                      <p className={styles.cardLabel}>Tổng Tokens</p>
                      <p className={styles.cardValue}>
                        {formatNumber(resourceConsumption?.totalTokensUsed)}
                      </p>
                    </div>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}>
                      <i className="fas fa-dollar-sign" />
                    </div>
                    <div className={styles.cardContent}>
                      <p className={styles.cardLabel}>Chi phí ước tính (USD)</p>
                      <p className={styles.cardValue}>
                        ${(resourceConsumption?.estimatedCostUsd || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}>
                      <i className="fas fa-coins" />
                    </div>
                    <div className={styles.cardContent}>
                      <p className={styles.cardLabel}>Chi phí ước tính (VND)</p>
                      <p className={styles.cardValue}>
                        {formatVND(resourceConsumption?.estimatedCostVnd)}
                      </p>
                    </div>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}>
                      <i className="fas fa-users" />
                    </div>
                    <div className={styles.cardContent}>
                      <p className={styles.cardLabel}>Số người dùng</p>
                      <p className={styles.cardValue}>
                        {formatNumber(resourceConsumption?.uniqueUsersCount)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Consumption Trend Section */}
            <section className={styles.section}>
              <h2>Xu hướng tiêu thụ (Ngày)</h2>
              {loading ? (
                <div className={styles.chartSkeleton}>
                  <div className={styles.skeletonLine} style={{ height: '300px' }} />
                </div>
              ) : consumptionTrend?.items && consumptionTrend.items.length > 0 ? (
                <div className={styles.trendTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Tokens tiêu thụ</th>
                        <th>Chi phí USD</th>
                        <th>Chi phí VND</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumptionTrend.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.period || '—'}</td>
                          <td>{formatNumber(item.tokensUsed)}</td>
                          <td>${(item.costUsd || 0).toFixed(2)}</td>
                          <td>{formatVND(item.costVnd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-chart-line" />
                  <p>Không có dữ liệu xu hướng.</p>
                </div>
              )}
            </section>

            {/* Service Breakdown Section */}
            <section className={styles.section}>
              <h2>Cơ cấu tỷ trọng theo dịch vụ</h2>
              {loading ? (
                <div className={styles.chartSkeleton}>
                  <div className={styles.skeletonLine} style={{ height: '250px' }} />
                </div>
              ) : serviceBreakdown?.items && serviceBreakdown.items.length > 0 ? (
                <div className={styles.breakdownTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Tokens</th>
                        <th>Chi phí USD</th>
                        <th>Chi phí VND</th>
                        <th>Tỷ lệ %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceBreakdown.items.map((item, i) => {
                        const totalCost =
                          serviceBreakdown.items.reduce((sum, s) => sum + (s.costUsd || 0), 0) ||
                          1;
                        const percentage = ((item.costUsd || 0) / totalCost) * 100;
                        return (
                          <tr key={i}>
                            <td>{item.serviceName || '—'}</td>
                            <td>{formatNumber(item.tokensUsed)}</td>
                            <td>${(item.costUsd || 0).toFixed(2)}</td>
                            <td>{formatVND(item.costVnd)}</td>
                            <td>{percentage.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-chart-pie" />
                  <p>Không có dữ liệu phân tích dịch vụ.</p>
                </div>
              )}
            </section>

            {/* Top Consumers Section */}
            <section className={styles.section}>
              <h2>Top 10 người tiêu thụ nhiều nhất</h2>
              {loading ? (
                <div className={styles.tableSkeleton}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className={styles.skeletonRow}>
                      <div className={styles.skeletonLine} />
                    </div>
                  ))}
                </div>
              ) : topConsumers?.items && topConsumers.items.length > 0 ? (
                <div className={styles.topConsumersTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Xếp hạng</th>
                        <th>Email / Tên</th>
                        <th>Tokens tiêu thụ</th>
                        <th>Chi phí USD</th>
                        <th>Chi phí VND</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topConsumers.items.map((item, i) => (
                        <tr key={i}>
                          <td className={styles.rankCell}>
                            <span className={styles.rank}>#{i + 1}</span>
                          </td>
                          <td>{item.userIdentifier || '—'}</td>
                          <td>{formatNumber(item.tokensUsed)}</td>
                          <td>${(item.costUsd || 0).toFixed(2)}</td>
                          <td>{formatVND(item.costVnd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-users" />
                  <p>Không có dữ liệu người tiêu thụ.</p>
                </div>
              )}
            </section>

            {/* Policy Violations Section */}
            <section className={styles.section}>
              <h2>Vi phạm chính sách AI</h2>
              {loading ? (
                <div className={styles.tableSkeleton}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className={styles.skeletonRow}>
                      <div className={styles.skeletonLine} />
                    </div>
                  ))}
                </div>
              ) : policyViolations?.items && policyViolations.items.length > 0 ? (
                <>
                  <div className={styles.violationsTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Người dùng</th>
                          <th>Loại vi phạm</th>
                          <th>Mô tả</th>
                          <th>Ngày phát hiện</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policyViolations.items.map((violation) => (
                          <tr key={violation.id}>
                            <td>{violation.userIdentifier || '—'}</td>
                            <td>
                              <span className={styles.violationType}>
                                {violation.violationType || '—'}
                              </span>
                            </td>
                            <td className={styles.descriptionCell}>
                              {violation.description || '—'}
                            </td>
                            <td>{new Date(violation.detectedAt).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <span className={styles.statusBadge}>
                                {violation.status || 'Chưa xử lý'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {policyViolations.totalPages > 1 && (
                    <Pagination
                      currentPage={violationPageNumber}
                      totalPages={policyViolations.totalPages}
                      itemsPerPage={violationPageSize}
                      totalItems={policyViolations.totalItems}
                      onPageChange={setViolationPageNumber}
                      onItemsPerPageChange={(n) => {
                        setViolationPageSize(n);
                        setViolationPageNumber(1);
                      }}
                      unitLabel="vi phạm"
                    />
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-shield-check" />
                  <p>Không có vi phạm chính sách nào.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
