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
import {
  getAIPricingConfigs,
  createAIPricingConfig,
  updateAIPricingConfig,
  deleteAIPricingConfig,
} from '@services/aiPricingApi';

/* ─────────────────────────────────────────────
   Pricing form modal (inline)
───────────────────────────────────────────── */
const emptyForm = {
  modelId: '',
  serviceName: '',
  costPerInputToken: '',
  costPerOutputToken: '',
  currency: 'USD',
  isActive: true,
};

function PricingFormModal({ mode, initialData, onClose, onSaved }) {
  const [form, setForm]   = useState(initialData ?? emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initialData ?? emptyForm); setError(''); }, [initialData]);

  const validate = () => {
    const name = form.serviceName?.trim() || '';
    if (!name) return 'Tên dịch vụ không được để trống.';
    if (name.length < 2) return 'Tên dịch vụ phải có ít nhất 2 ký tự.';
    if (Number(form.costPerInputToken) < 0)  return 'Chi phí Input Token không được âm.';
    if (Number(form.costPerOutputToken) < 0) return 'Chi phí Output Token không được âm.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        modelId:            form.modelId?.trim() || '',
        serviceName:        form.serviceName.trim(),
        costPerInputToken:  Number(form.costPerInputToken  || 0),
        costPerOutputToken: Number(form.costPerOutputToken || 0),
        currency:           form.currency || 'USD',
        isActive:           form.isActive ?? true,
      };
      const res = mode === 'edit'
        ? await updateAIPricingConfig(initialData.id, payload)
        : await createAIPricingConfig(payload);
      if (res.success) onSaved(res.data);
      else setError(res.errorMessage || 'Không thể lưu cấu hình giá.');
    } catch { setError('Lỗi kết nối máy chủ.'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{mode === 'edit' ? 'Chỉnh sửa cấu hình giá' : 'Tạo cấu hình giá mới'}</h2>
          <button className={styles.closeButton} onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label>Model ID</label>
            <input value={form.modelId || ''} onChange={(e) => setForm({ ...form, modelId: e.target.value })}
              placeholder="VD: llama-3.3-70b-versatile" />
          </div>
          <div className={styles.formGroup}>
            <label>Tên dịch vụ *</label>
            <input value={form.serviceName || ''} onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
              placeholder="VD: Groq, OpenAI GPT-4" autoFocus required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Chi phí / Input Token (USD) *</label>
              <input
                type="text"
                value={form.costPerInputToken ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*([eE][+-]?[0-9]*)?$/.test(value)) {
                    setForm({ ...form, costPerInputToken: value });
                  }
                }}
                placeholder="5.9e-7 hoặc 0.00000059"
                required />
            </div>
            <div className={styles.formGroup}>
              <label>Chi phí / Output Token (USD) *</label>
              <input
                type="text"
                value={form.costPerOutputToken ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*([eE][+-]?[0-9]*)?$/.test(value)) {
                    setForm({ ...form, costPerOutputToken: value });
                  }
                }}
                placeholder="7.9e-7 hoặc 0.00000079"
                required />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Tiền tệ</label>
            <select value={form.currency || 'USD'} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              <option value="USD">USD</option>
              <option value="VND">VND</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className={styles.formCheckbox}>
            <input type="checkbox" id="isActive" checked={form.isActive ?? true}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <label htmlFor="isActive">Đang hoạt động</label>
          </div>
          {error && (
            <div className={styles.formError}>
              <i className="fas fa-circle-exclamation" /><span>{error}</span>
            </div>
          )}
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Đang lưu...</> : mode === 'edit' ? 'Cập nhật' : 'Tạo cấu hình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export default function AIReports() {
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'pricing'

  /* ── Reports state ── */
  const [resourceConsumption, setResourceConsumption] = useState(null);
  const [consumptionTrend,    setConsumptionTrend]    = useState(null);
  const [serviceBreakdown,    setServiceBreakdown]    = useState(null);
  const [topConsumers,        setTopConsumers]        = useState(null);
  const [reportsLoading,  setReportsLoading]  = useState(true);
  const [reportsError,    setReportsError]    = useState('');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');

  /* ── Pricing state ── */
  const [pricingConfigs, setPricingConfigs] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError,   setPricingError]   = useState('');
  const [modalMode,      setModalMode]      = useState(null);
  const [editingConfig,  setEditingConfig]  = useState(null);
  const [busyId,         setBusyId]         = useState('');

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  /* ── Helpers ── */
  const formatVND = (v) => v == null ? '—'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(v);
  const formatNum = (v) => v == null ? '—'
    : new Intl.NumberFormat('vi-VN').format(Math.round(v));

  /* ── Fetch reports ── */
  const fetchReports = useCallback(async () => {
    setReportsLoading(true); setReportsError('');
    try {
      const [consumption, trend, breakdown, topUsers] = await Promise.all([
        getAIResourceConsumptionReport(startDate, endDate),
        getAIConsumptionTrend(startDate, endDate, 'day'),
        getAIServiceBreakdown(startDate, endDate),
        getAITopConsumers(startDate, endDate, 10),
      ]);
      if (consumption.success) setResourceConsumption(consumption.data);
      else { setReportsError(consumption.errorMessage || 'Không thể tải báo cáo.'); return; }
      if (trend.success)     setConsumptionTrend(trend.data);
      if (breakdown.success) setServiceBreakdown(breakdown.data);
      if (topUsers.success)  setTopConsumers(topUsers.data);
    } catch (err) {
      setReportsError(err.message || 'Lỗi kết nối máy chủ.');
    } finally { setReportsLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  /* ── Fetch pricing ── */
  const fetchPricing = useCallback(async () => {
    setPricingLoading(true); setPricingError('');
    try {
      const res = await getAIPricingConfigs();
      if (res.success) setPricingConfigs(res.data?.items ?? []);
      else setPricingError(res.errorMessage || 'Không thể tải cấu hình giá.');
    } catch { setPricingError('Lỗi kết nối máy chủ.'); }
    finally { setPricingLoading(false); }
  }, []);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);

  /* ── Pricing CRUD ── */
  const handleSaved = async () => {
    const msg = modalMode === 'create' ? 'Tạo cấu hình giá thành công.' : 'Cập nhật cấu hình giá thành công.';
    setModalMode(null); setEditingConfig(null);
    await fetchPricing();
    showToast(msg);
  };

  const handleDelete = async (config) => {
    if (!window.confirm(`Xóa cấu hình giá "${config.serviceName}"?`)) return;
    setBusyId(config.id);
    try {
      const res = await deleteAIPricingConfig(config.id);
      if (res.success) { setPricingConfigs(prev => prev.filter(c => c.id !== config.id)); showToast('Đã xóa cấu hình giá.'); }
      else showToast(res.errorMessage || 'Không thể xóa.', 'error');
    } catch { showToast('Lỗi kết nối máy chủ.', 'error'); }
    finally { setBusyId(''); }
  };

  /* ────────────────────────────── RENDER ────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className="container">

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Quản lý AI</span>
        </div>

        {/* Header */}
        <section className={styles.headerBand}>
          <div>
            <h1>Quản lý hệ thống AI</h1>
            <p className={styles.headerText}>
              Theo dõi tiêu thụ tài nguyên AI và cấu hình đơn giá dịch vụ.
            </p>
          </div>
          {activeTab === 'pricing' && (
            <button className={styles.primaryButton} onClick={() => { setModalMode('create'); setEditingConfig(null); }}>
              <i className="fas fa-plus" /> Thêm cấu hình mới
            </button>
          )}
        </section>

        {/* Tabs */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'reports' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="fas fa-chart-bar" /> Báo cáo tiêu thụ
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'pricing' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <i className="fas fa-coins" /> Cấu hình đơn giá
          </button>
        </div>

        {/* ═══════════════ TAB: REPORTS ═══════════════ */}
        {activeTab === 'reports' && (
          <>
            {/* Date filter */}
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
                <button className={styles.primaryButton} onClick={fetchReports}>
                  <i className="fas fa-filter" /> Lọc
                </button>
              </div>
              <div className={styles.filterActions}>
                <button 
                  className={styles.secondaryButton} 
                  onClick={fetchReports}
                  disabled={reportsLoading}
                >
                  <i className={reportsLoading ? "fas fa-spinner fa-spin" : "fas fa-sync-alt"} /> 
                  {reportsLoading ? "Đang tải..." : "Tải lại"}
                </button>
                <button className={styles.secondaryButton} onClick={() => { setStartDate(''); setEndDate(''); }}>
                  <i className="fas fa-times" /> Xóa bộ lọc
                </button>
              </div>
            </div>

            {reportsError ? (
              <div className={styles.errorState}>
                <i className="fas fa-triangle-exclamation" />
                <p>{reportsError}</p>
                <button className={styles.secondaryButton} onClick={fetchReports}>Thử lại</button>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className={styles.summaryCards}>
                  {reportsLoading ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={styles.cardSkeleton}>
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLine} style={{ width: '70%' }} />
                    </div>
                  )) : (
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

                {/* Trend */}
                <section className={styles.section}>
                  <h2>Xu hướng tiêu thụ (Ngày)</h2>
                  {reportsLoading ? <div className={styles.chartSkeleton}><div className={styles.skeletonLine} style={{ height: '200px' }} /></div>
                    : consumptionTrend?.dataPoints?.length > 0 ? (
                      <div className={styles.tableScroll}>
                        <table><thead><tr>
                          <th>Ngày</th><th>Tổng Tokens</th><th>Prompt</th><th>Completion</th>
                          <th>Requests</th><th>Chi phí USD</th><th>Chi phí VND</th>
                        </tr></thead><tbody>
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
                        </tbody></table>
                      </div>
                    ) : <div className={styles.emptyState}><i className="fas fa-chart-line" /><p>Không có dữ liệu xu hướng.</p></div>}
                </section>

                {/* Service breakdown */}
                <section className={styles.section}>
                  <h2>Cơ cấu tỷ trọng theo dịch vụ</h2>
                  {reportsLoading ? <div className={styles.chartSkeleton}><div className={styles.skeletonLine} style={{ height: '200px' }} /></div>
                    : serviceBreakdown?.services?.length > 0 ? (
                      <div className={styles.tableScroll}>
                        <table><thead><tr>
                          <th>Dịch vụ</th><th>Tổng Tokens</th><th>Requests</th>
                          <th>Chi phí USD</th><th>Chi phí VND</th><th>Tỷ lệ %</th>
                        </tr></thead><tbody>
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
                        </tbody></table>
                      </div>
                    ) : <div className={styles.emptyState}><i className="fas fa-chart-pie" /><p>Không có dữ liệu phân tích dịch vụ.</p></div>}
                </section>

                {/* Top consumers */}
                <section className={styles.section}>
                  <h2>Top 10 người tiêu thụ nhiều nhất</h2>
                  {reportsLoading ? (
                    <div className={styles.tableSkeleton}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.skeletonRow}><div className={styles.skeletonLine} /></div>
                      ))}
                    </div>
                  ) : topConsumers?.topUsers?.length > 0 ? (
                    <div className={styles.tableScroll}>
                      <table><thead><tr>
                        <th>#</th><th>Tên / Email</th><th>Vai trò</th>
                        <th>Tổng Tokens</th><th>Requests</th><th>Chi phí USD</th><th>Chi phí VND</th>
                      </tr></thead><tbody>
                        {topConsumers.topUsers.map((item, i) => (
                          <tr key={i}>
                            <td className={styles.rankCell}><span className={styles.rank}>#{i + 1}</span></td>
                            <td>
                              <div>{item.fullName || '—'}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted,#6b7280)' }}>{item.email}</div>
                            </td>
                            <td>{item.role || '—'}</td>
                            <td>{formatNum(item.totalTokens)}</td>
                            <td>{formatNum(item.requestCount)}</td>
                            <td>${(item.estimatedCostUsd || 0).toFixed(4)}</td>
                            <td>{formatVND(item.estimatedCostVnd)}</td>
                          </tr>
                        ))}
                      </tbody></table>
                    </div>
                  ) : <div className={styles.emptyState}><i className="fas fa-users" /><p>Không có dữ liệu người tiêu thụ.</p></div>}
                </section>
              </>
            )}
          </>
        )}

        {/* ═══════════════ TAB: PRICING ═══════════════ */}
        {activeTab === 'pricing' && (
          <>
            {/* Default Pricing Configuration */}
            <section className={styles.defaultConfigSection}>
              <div className={styles.defaultConfigHeader}>
                <h2>
                  <i className="fas fa-cog" />
                  Cấu hình đơn giá mặc định
                </h2>
                <p className={styles.defaultConfigDesc}>
                  Đơn giá mặc định được sử dụng cho báo cáo AI khi không có cấu hình cụ thể nào được kích hoạt.
                </p>
              </div>
              
              <div className={styles.defaultConfigGrid}>
                <div className={styles.defaultConfigCard}>
                  <label>Model AI mặc định</label>
                  <input
                    type="text"
                    value="llama-3.3-70b-versatile"
                    disabled
                    className={styles.disabledInput}
                  />
                  <small>Model được sử dụng khi không có config nào active</small>
                </div>
                
                
                
                <div className={styles.defaultConfigCard}>
                  <label>Chi phí Input Token mặc định</label>
                  <div className={styles.defaultPriceGroup}>
                    <input
                      type="text"
                      value="0.00000059"
                      disabled
                      className={styles.disabledInput}
                    />
                    <div className={styles.priceConversion}>
                      <span>≈ $0.59 / 1M tokens</span>
                      <span>≈ 14,986 VND / 1M tokens</span>
                    </div>
                  </div>
                  <small>Groq Llama 70B Input Token pricing</small>
                </div>
                
                <div className={styles.defaultConfigCard}>
                  <label>Chi phí Output Token mặc định</label>
                  <div className={styles.defaultPriceGroup}>
                    <input
                      type="text"
                      value="0.00000079"
                      disabled
                      className={styles.disabledInput}
                    />
                    <div className={styles.priceConversion}>
                      <span>≈ $0.79 / 1M tokens</span>
                      <span>≈ 20,066 VND / 1M tokens</span>
                    </div>
                  </div>
                  <small>Groq Llama 70B Output Token pricing</small>
                </div>
              </div>
              
             
            </section>

            

            {pricingError ? (
              <div className={styles.errorState}>
                <i className="fas fa-triangle-exclamation" />
                <p>{pricingError}</p>
                <button className={styles.secondaryButton} onClick={fetchPricing}>Thử lại</button>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Model ID</th>
                      <th>Tên dịch vụ</th>
                      <th>Input / 1M (USD)</th>
                      <th>Output / 1M (USD)</th>
                      <th>Tiền tệ</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingLoading && Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}><td colSpan={7}><div className={styles.skeletonRow}><div className={styles.skeletonLine} /></div></td></tr>
                    ))}
                    {!pricingLoading && pricingConfigs.length === 0 && (
                      <tr><td colSpan={7}>
                        <div className={styles.emptyState}>
                          <i className="fas fa-tag" /><p>Chưa có cấu hình giá nào.</p>
                        </div>
                      </td></tr>
                    )}
                    {!pricingLoading && pricingConfigs.map((cfg) => (
                      <tr key={cfg.id}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{cfg.modelId || '—'}</span></td>
                        <td><strong>{cfg.serviceName}</strong></td>
                        <td>${(cfg.costPer1MInputTokens  || 0).toFixed(4)}</td>
                        <td>${(cfg.costPer1MOutputTokens || 0).toFixed(4)}</td>
                        <td>{cfg.currency || 'USD'}</td>
                        <td>
                          <span className={`${styles.badge} ${cfg.isActive ? styles.statusActive : styles.statusInactive}`}>
                            {cfg.isActive ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            <button className={styles.iconActionButton} disabled={busyId === cfg.id}
                              onClick={() => { setModalMode('edit'); setEditingConfig(cfg); }} title="Sửa">
                              <i className="fas fa-pen" />
                            </button>
                            <button className={styles.deleteButton} disabled={busyId === cfg.id}
                              onClick={() => handleDelete(cfg)} title="Xóa">
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>

      {/* Pricing modal */}
      {modalMode && (
        <PricingFormModal
          mode={modalMode}
          initialData={modalMode === 'edit' ? editingConfig : { ...emptyForm }}
          onClose={() => { setModalMode(null); setEditingConfig(null); }}
          onSaved={handleSaved}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
