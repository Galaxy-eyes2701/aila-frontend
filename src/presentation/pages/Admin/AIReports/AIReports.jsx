import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './AIReports.module.css';
import Toast from '../../Expert/ModuleManagement/components/Toast';
import {
  getAIResourceConsumptionReport,
  getAIConsumptionTrend,
  getAIServiceBreakdown,
  getAITopConsumers,
} from '@services/aiReportsApi';

export default function AIReports() {
  const [resourceConsumption, setResourceConsumption] = useState(null);
  const [consumptionTrend, setConsumptionTrend]       = useState(null);
  const [serviceBreakdown, setServiceBreakdown]       = useState(null);
  const [topConsumers, setTopConsumers]               = useState(null);

  const [loading,   setLoading]   = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast,     setToast]     = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [consumption, trend, breakdown, topUsers] = await Promise.all([
        getAIResourceConsumptionReport(startDate, endDate),
        getAIConsumptionTrend(startDate, endDate, 'day'),
        getAIServiceBreakdown(startDate, endDate),
        getAITopConsumers(startDate, endDate, 10),
      ]);

      if (consumption.success) setResourceConsumption(consumption.data);
      else { setPageError(consumption.errorMessage || 'Không thể tải báo cáo.'); return; }

      if (trend.success)     setConsumptionTrend(trend.data);
      if (breakdown.success) setServiceBreakdown(breakdown.data);
      if (topUsers.success)  setTopConsumers(topUsers.data);
    } catch (err) {
      setPageError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleFilter = () => { fetchReports(); };

  const formatVND = (value) => {
    if (value == null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(value);
  };
  const formatNum = (value) => {
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
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className={styles.dateInput}>
              <label>Đến ngày</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button className={styles.primaryButton} onClick={handleFilter}>
              <i className="fas fa-filter" /> Lọc
            </button>
          </div>
          <button className={styles.secondaryButton} onClick={() => { setStartDate(''); setEndDate(''); }}>
            <i className="fas fa-rotate-right" /> Xóa bộ lọc
          </button>
        </div>

        {pageError && (
          <div className={styles.errorState}>
            <i className="fas fa-triangle-exclamation" />
            <p>{pageError}</p>
            <button className={styles.secondaryButton} onClick={fetchReports}>Thử lại</button>
          </div>
        )}

        {!pageError && (
          <>
            {/* Summary Cards */}
            <div className={styles.summaryCards}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.cardSkeleton}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLine} style={{ width: '70%' }} />
                  </div>
                ))
              ) : (
                <>
                  <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}><i className="fas fa-circle-nodes" /></div>
                    <div className={styles.cardContent}>
                      <p className={styles.cardLabel}>Tổng Tokens</p>
                      <p className={styles.cardValue}>{formatNum(resourceConsumption?.totalTokens)}</p>
                    </div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}><i className="fas fa-dollar-sign" /></div>
                    <div className={styles.cardContent}>
                      <p className={styles.cardLabel}>Chi phí ước tính (USD)</p>
                      <p className={styles.cardValue}>${(resourceConsumption?.totalEstimatedCostUsd || 0).toFixed(4)}</p>
                    </div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}><i className="fas fa-coins" /></div>
                    <div className={styles.cardContent}>
                      <p className={styles.cardLabel}>Chi phí ước tính (VND)</p>
                      <p className={styles.cardValue}>{formatVND(resourceConsumption?.totalEstimatedCostVnd)}</p>
                    </div>
                  </div>
                  <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}><i className="fas fa-paper-plane" /></div>
                    <div className={styles.cardContent}>
                      <p className={styles.cardLabel}>Tổng requests</p>
                      <p className={styles.cardValue}>{formatNum(resourceConsumption?.totalRequests)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Consumption Trend */}
            <section className={styles.section}>
              <h2>Xu hướng tiêu thụ (Ngày)</h2>
              {loading ? (
                <div className={styles.chartSkeleton}><div className={styles.skeletonLine} style={{ height: '200px' }} /></div>
              ) : consumptionTrend?.dataPoints?.length > 0 ? (
                <div className={styles.trendTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Tổng Tokens</th>
                        <th>Prompt Tokens</th>
                        <th>Completion Tokens</th>
                        <th>Requests</th>
                        <th>Chi phí USD</th>
                        <th>Chi phí VND</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumptionTrend.dataPoints.map((item, i) => (
                        <tr key={i}>
                          <td>{item.date || '—'}</td>
                          <td>{formatNum(item.totalTokens)}</td>
                          <td>{formatNum(item.promptTokens)}</td>
                          <td>{formatNum(item.completionTokens)}</td>
                          <td>{formatNum(item.totalRequests)}</td>
                          <td>${(item.estimatedCostUsd || 0).toFixed(4)}</td>
                          <td>{formatVND(item.estimatedCostVnd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-chart-line" /><p>Không có dữ liệu xu hướng.</p>
                </div>
              )}
            </section>

            {/* Service Breakdown */}
            <section className={styles.section}>
              <h2>Cơ cấu tỷ trọng theo dịch vụ</h2>
              {loading ? (
                <div className={styles.chartSkeleton}><div className={styles.skeletonLine} style={{ height: '200px' }} /></div>
              ) : serviceBreakdown?.services?.length > 0 ? (
                <div className={styles.breakdownTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Tổng Tokens</th>
                        <th>Requests</th>
                        <th>Chi phí USD</th>
                        <th>Chi phí VND</th>
                        <th>Tỷ lệ %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceBreakdown.services.map((item, i) => (
                        <tr key={i}>
                          <td>{item.displayName || item.serviceType || '—'}</td>
                          <td>{formatNum(item.totalTokens)}</td>
                          <td>{formatNum(item.requestCount)}</td>
                          <td>${(item.estimatedCostUsd || 0).toFixed(4)}</td>
                          <td>{formatVND(item.estimatedCostVnd)}</td>
                          <td>{(item.percentage || 0).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-chart-pie" /><p>Không có dữ liệu phân tích dịch vụ.</p>
                </div>
              )}
            </section>

            {/* Top Consumers */}
            <section className={styles.section}>
              <h2>Top 10 người tiêu thụ nhiều nhất</h2>
              {loading ? (
                <div className={styles.tableSkeleton}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={styles.skeletonRow}><div className={styles.skeletonLine} /></div>
                  ))}
                </div>
              ) : topConsumers?.topUsers?.length > 0 ? (
                <div className={styles.topConsumersTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Xếp hạng</th>
                        <th>Tên / Email</th>
                        <th>Vai trò</th>
                        <th>Tổng Tokens</th>
                        <th>Requests</th>
                        <th>Chi phí USD</th>
                        <th>Chi phí VND</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topConsumers.topUsers.map((item, i) => (
                        <tr key={i}>
                          <td className={styles.rankCell}><span className={styles.rank}>#{i + 1}</span></td>
                          <td>
                            <div>{item.fullName || '—'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.email}</div>
                          </td>
                          <td>{item.role || '—'}</td>
                          <td>{formatNum(item.totalTokens)}</td>
                          <td>{formatNum(item.requestCount)}</td>
                          <td>${(item.estimatedCostUsd || 0).toFixed(4)}</td>
                          <td>{formatVND(item.estimatedCostVnd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <i className="fas fa-users" /><p>Không có dữ liệu người tiêu thụ.</p>
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
