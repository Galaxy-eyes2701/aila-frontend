import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './AIPricing.module.css';
import Toast from '../../Expert/ModuleManagement/components/Toast';
import {
  getAIPricingConfigs,
  createAIPricingConfig,
  updateAIPricingConfig,
  deleteAIPricingConfig,
} from '@services/aiPricingApi';

const emptyForm = {
  serviceName: '',
  costPerToken: 0,
  costPerRequestUsd: 0,
  currency: 'USD',
  isActive: true,
};

function AIPricingFormModal({ mode, initialData, onClose, onSaved }) {
  const [form, setForm] = useState(initialData ?? emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
    setError('');
  }, [initialData]);

  const validate = () => {
    const serviceName = form.serviceName?.trim() || '';
    if (!serviceName) return 'Tên dịch vụ không được để trống.';
    if (serviceName.length < 2) return 'Tên dịch vụ phải có ít nhất 2 ký tự.';
    if (serviceName.length > 100) return 'Tên dịch vụ không được vượt quá 100 ký tự.';

    const costPerToken = Number(form.costPerToken ?? 0);
    if (isNaN(costPerToken) || costPerToken < 0) {
      return 'Chi phí trên token phải là số dương.';
    }

    const costPerRequest = Number(form.costPerRequestUsd ?? 0);
    if (isNaN(costPerRequest) || costPerRequest < 0) {
      return 'Chi phí trên yêu cầu phải là số dương.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        serviceName: form.serviceName.trim(),
        costPerToken: Number(form.costPerToken || 0),
        costPerRequestUsd: Number(form.costPerRequestUsd || 0),
        currency: form.currency || 'USD',
        isActive: form.isActive ?? true,
      };

      const res =
        mode === 'edit'
          ? await updateAIPricingConfig(initialData.id, payload)
          : await createAIPricingConfig(payload);

      if (res.success) {
        onSaved(res.data);
      } else {
        setError(res.errorMessage || 'Không thể lưu cấu hình giá.');
      }
    } catch (err) {
      setError(err.response?.data?.errorMessage || 'Lỗi kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>
            {mode === 'edit' ? 'Chỉnh sửa cấu hình giá' : 'Tạo cấu hình giá mới'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Tên dịch vụ *</label>
            <input
              value={form.serviceName || ''}
              onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
              placeholder="VD: OpenAI GPT-4, Groq Llama"
              autoFocus
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Chi phí trên Token *</label>
              <input
                type="number"
                step="0.000001"
                min="0"
                value={form.costPerToken ?? 0}
                onChange={(e) =>
                  setForm({ ...form, costPerToken: Number(e.target.value) })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Chi phí trên Yêu cầu (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.costPerRequestUsd ?? 0}
                onChange={(e) =>
                  setForm({ ...form, costPerRequestUsd: Number(e.target.value) })
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Tiền tệ</label>
            <select
              value={form.currency || 'USD'}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="USD">USD</option>
              <option value="VND">VND</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className={styles.formCheckbox}>
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive ?? true}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="isActive">Đang hoạt động</label>
          </div>

          {error && (
            <div className={styles.formError}>
              <i className="fas fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Đang lưu...
                </>
              ) : mode === 'edit' ? (
                'Cập nhật'
              ) : (
                'Tạo cấu hình'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AIPricing() {
  const [pricingConfigs, setPricingConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [busyConfigId, setBusyConfigId] = useState('');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const res = await getAIPricingConfigs();
      if (res.success) {
        setPricingConfigs(res.data ?? []);
      } else {
        setPageError(res.errorMessage || 'Không thể tải cấu hình giá.');
      }
    } catch (err) {
      setPageError(err.response?.data?.errorMessage || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingConfig(null);
  };

  const handleOpenEdit = (config) => {
    setModalMode('edit');
    setEditingConfig(config);
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setEditingConfig(null);
  };

  const handleSaved = async () => {
    handleCloseModal();
    await fetchConfigs();
    showToast(
      modalMode === 'create'
        ? 'Tạo cấu hình giá thành công.'
        : 'Cập nhật cấu hình giá thành công.'
    );
  };

  const handleDelete = async (config) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa cấu hình giá "${config.serviceName}" không?`
      )
    ) {
      return;
    }

    setBusyConfigId(config.id);
    try {
      const res = await deleteAIPricingConfig(config.id);
      if (res.success) {
        setPricingConfigs((prev) => prev.filter((item) => item.id !== config.id));
        showToast('Đã xóa cấu hình giá.');
      } else {
        showToast(res.errorMessage || 'Không thể xóa cấu hình giá.', 'error');
      }
    } catch (err) {
      showToast(
        err.response?.data?.errorMessage || 'Lỗi kết nối máy chủ.',
        'error'
      );
    } finally {
      setBusyConfigId('');
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/admin">Quản trị</Link>
          <i className="fas fa-chevron-right" />
          <span>Cấu hình giá AI</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <h1>Cấu hình giá dịch vụ AI</h1>
            <p className={styles.headerText}>
              Thiết lập chi phí cho các dịch vụ AI để tính toán chi phí ước tính.
            </p>
          </div>

          <button className={styles.primaryButton} onClick={handleOpenCreate}>
            <i className="fas fa-plus" />
            Thêm cấu hình mới
          </button>
        </section>

        <div className={styles.filterBar}>
          <button
            className={styles.secondaryButton}
            onClick={fetchConfigs}
            disabled={loading}
          >
            <i className="fas fa-rotate-right" />
            Tải lại
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên dịch vụ</th>
                <th>Chi phí / Token</th>
                <th>Chi phí / Yêu cầu</th>
                <th>Tiền tệ</th>
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

              {!loading && pageError && (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.errorState}>
                      <i className="fas fa-triangle-exclamation" />
                      <p>{pageError}</p>
                      <button
                        className={styles.secondaryButton}
                        onClick={fetchConfigs}
                      >
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !pageError && pricingConfigs.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <i className="fas fa-tag" />
                      <p>Chưa có cấu hình giá nào. Hãy thêm cấu hình đầu tiên.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !pageError &&
                pricingConfigs.map((config) => (
                  <tr key={config.id}>
                    <td>
                      <span className={styles.serviceName}>
                        {config.serviceName}
                      </span>
                    </td>
                    <td>{(config.costPerToken || 0).toFixed(6)}</td>
                    <td>${(config.costPerRequestUsd || 0).toFixed(4)}</td>
                    <td>{config.currency || 'USD'}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          config.isActive
                            ? styles.statusActive
                            : styles.statusInactive
                        }`}
                      >
                        {config.isActive ? 'Đang hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.iconActionButton}
                          disabled={busyConfigId === config.id}
                          onClick={() => handleOpenEdit(config)}
                          title="Sửa"
                        >
                          <i className="fas fa-pen" />
                        </button>

                        <button
                          className={styles.deleteButton}
                          disabled={busyConfigId === config.id}
                          onClick={() => handleDelete(config)}
                          title="Xóa"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <AIPricingFormModal
          mode={modalMode}
          initialData={modalMode === 'edit' ? editingConfig : { ...emptyForm }}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
