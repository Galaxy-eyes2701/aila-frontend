import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { resolveApiError } from '../../../utils/api';
import { hasValidSession } from '../../../utils/token';
import {
  PLAN_UNAVAILABLE_MESSAGE,
  formatDuration,
  formatLimit,
  formatPrice,
} from '../../../utils/subscriptionPlan';
import Toast from '../../../components/Toast/Toast';
import {
  getPublicSubscriptionPlanById,
  getPublicSubscriptionPlans,
} from './services/subscriptionPlanApi';
import styles from './SubscriptionPlans.module.css';

// Trang mua/thanh toán nằm ngoài phạm vi milestone này (§9) — FE chỉ chịu trách nhiệm tới bước điều hướng.
const purchaseRoute = (planId) => `/subscription-plans/${planId}/checkout`;

const BENEFITS = [
  { key: 'aiTokenLimit', icon: 'fa-bolt', label: 'AI Token' },
  { key: 'aiPracticeScenarioLimit', icon: 'fa-comments', label: 'Lượt AI Practice' },
  { key: 'expertEvaluationLimit', icon: 'fa-user-check', label: 'Lượt đánh giá chuyên gia' },
];

function PlanCard({ plan, checking, disabled, onBuy }) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHead}>
        <h2 className={styles.cardName}>{plan.name}</h2>
        <div className={styles.cardPrice}>
          <span className={styles.priceValue}>{formatPrice(plan.price)}</span>
          <span className={styles.priceUnit}>/ {formatDuration(plan.durationInDays)}</span>
        </div>
      </header>

      {/* description === null → không render, tuyệt đối không in "null" hay "-" */}
      {plan.description && <p className={styles.cardDesc}>{plan.description}</p>}

      <ul className={styles.benefits}>
        {BENEFITS.map(({ key, icon, label }) => (
          <li key={key}>
            <i className={`fas ${icon}`} aria-hidden="true" />
            <span className={styles.benefitLabel}>{label}</span>
            <span className={styles.benefitValue}>{formatLimit(plan[key])}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={styles.buyButton}
        onClick={() => onBuy(plan)}
        disabled={disabled}
        aria-label={`Mua gói ${plan.name}`}
      >
        {checking ? (
          <>
            <i className="fas fa-spinner fa-spin" aria-hidden="true" /> Đang kiểm tra...
          </>
        ) : (
          'Mua ngay'
        )}
      </button>
    </article>
  );
}

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { openLogin } = useOutletContext() ?? {};

  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');
  const [checkingPlanId, setCheckingPlanId] = useState('');
  const [toast, setToast] = useState(null);

  // Gói đang chờ mua trong lúc người dùng đăng nhập ở pop-up.
  const pendingPlanIdRef = useRef('');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const fetchPlans = useCallback(async () => {
    setStatus('loading');
    setLoadError('');

    try {
      const res = await getPublicSubscriptionPlans();
      if (res.success) {
        // Giữ nguyên thứ tự API trả về — FE không sort lại (AC-09.2).
        setPlans(res.data ?? []);
        setStatus('ready');
      } else {
        setLoadError(res.errorMessage || 'Không thể tải danh sách gói đăng ký.');
        setStatus('error');
      }
    } catch (err) {
      const { errorMessage } = resolveApiError(err);
      setLoadError(errorMessage || 'Không thể tải danh sách gói đăng ký. Vui lòng thử lại.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  /** Bước re-check bắt buộc trước khi sang trang mua (§2.3). */
  const startPurchase = useCallback(
    async (planId) => {
      setCheckingPlanId(planId);
      try {
        const res = await getPublicSubscriptionPlanById(planId);
        if (res.success) {
          navigate(purchaseRoute(planId));
          return;
        }

        showToast(res.errorMessage || PLAN_UNAVAILABLE_MESSAGE, 'error');
        fetchPlans();
      } catch (err) {
        const { status: httpStatus } = resolveApiError(err);

        if (httpStatus === 404) {
          // PLAN_NOT_FOUND và PLAN_NOT_AVAILABLE hiển thị như nhau.
          showToast(PLAN_UNAVAILABLE_MESSAGE, 'error');
          fetchPlans();
        } else if (httpStatus === 401) {
          logout();
          pendingPlanIdRef.current = planId;
          openLogin?.();
        } else {
          showToast('Không kiểm tra được gói đăng ký. Vui lòng thử lại.', 'error');
        }
      } finally {
        setCheckingPlanId('');
      }
    },
    [fetchPlans, logout, navigate, openLogin, showToast]
  );

  const handleBuyNow = useCallback(
    (plan) => {
      // Token hết hạn được xử lý y như chưa đăng nhập — kiểm tra TRƯỚC khi coi là đã đăng nhập.
      if (!hasValidSession()) {
        if (localStorage.getItem('accessToken')) logout();

        pendingPlanIdRef.current = plan.id;

        if (openLogin) {
          openLogin();
        } else {
          showToast('Vui lòng đăng nhập để mua gói đăng ký.', 'error');
        }
        return;
      }

      startPurchase(plan.id);
    },
    [logout, openLogin, showToast, startPurchase]
  );

  // Đăng nhập thành công trong pop-up → chạy tiếp nhánh mua đang chờ.
  // Đăng nhập thất bại / đóng pop-up → không có gì xảy ra, ở nguyên trang.
  useEffect(() => {
    if (!user || !pendingPlanIdRef.current || !hasValidSession()) return;

    const planId = pendingPlanIdRef.current;
    pendingPlanIdRef.current = '';
    startPurchase(planId);
  }, [user, startPurchase]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <i className="fas fa-gem" aria-hidden="true" /> Gói đăng ký
          </div>
          <h1>
            Chọn gói phù hợp với <em>hành trình học AI</em> của bạn
          </h1>
          <p>
            Mở khóa AI Token, lượt luyện tập cùng AI và lượt đánh giá từ chuyên gia — nâng cấp bất
            cứ lúc nào.
          </p>
        </div>
      </section>

      <div className={styles.content}>
        <div className="container">
          {status === 'error' && (
            <div className={styles.errorBanner} role="alert">
              <i className="fas fa-triangle-exclamation" aria-hidden="true" />
              <p>{loadError}</p>
              <button type="button" className={styles.retryButton} onClick={fetchPlans}>
                <i className="fas fa-rotate-right" aria-hidden="true" /> Thử lại
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div className={styles.grid} aria-hidden="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={styles.skeleton} />
              ))}
            </div>
          )}

          {status === 'ready' && plans.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <i className="fas fa-box-open" aria-hidden="true" />
              </div>
              <h2>Hiện chưa có gói đăng ký nào.</h2>
              <p>Vui lòng quay lại sau — các gói mới sẽ được cập nhật tại đây.</p>
            </div>
          )}

          {status === 'ready' && plans.length > 0 && (
            <div className={styles.grid}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  checking={checkingPlanId === plan.id}
                  disabled={Boolean(checkingPlanId)}
                  onBuy={handleBuyNow}
                />
              ))}
            </div>
          )}

          <p className={styles.footnote}>
            <i className="fas fa-circle-info" aria-hidden="true" />
            Quyền lợi của gói được ghi nhận tại thời điểm mua và không thay đổi trong suốt thời hạn
            sử dụng.
          </p>
        </div>
      </div>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
