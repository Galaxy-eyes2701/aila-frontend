import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import useAuth from '@state/hooks/useAuth';
import { resolveApiError } from '@services/api';
import { hasValidSession } from '@services/token';
import {
  PLAN_UNAVAILABLE_MESSAGE,
  formatDuration,
  formatLimit,
  formatPrice,
} from '@services/subscriptionPlan';
import Toast from '@presentation/components/Toast/Toast';
import {
  getPublicSubscriptionPlanById,
  getPublicSubscriptionPlans,
} from "@services/learnerSubscriptionPlanApi";
import { getCurrentSubscription } from "@services/subscriptionApi";
import styles from './SubscriptionPlans.module.css';

const purchaseRoute = (planId) => `/subscription-plans/${planId}/checkout`;

const BENEFITS = [
  { key: 'aiTokenLimit', icon: 'fa-bolt', label: 'AI Token' },
  { key: 'aiPracticeScenarioLimit', icon: 'fa-comments', label: 'Lượt AI Practice' },
  { key: 'expertEvaluationLimit', icon: 'fa-user-check', label: 'Lượt đánh giá chuyên gia' },
];

/**
 * Trạng thái nút mua theo `purchaseAction` — BE so tier của gói với gói đang active rồi trả
 * sẵn kết quả, nên endpoint công khai không phải lộ tierLevel.
 * RENEW = trùng tier với gói đang dùng → không mở lượt mua (không hỗ trợ gia hạn).
 * BLOCKED = gói tier thấp hơn gói đang dùng (BR-05).
 */
const PURCHASE_ACTIONS = {
  BUY: { label: 'Mua ngay', disabled: false, icon: 'fa-gem' },
  UPGRADE: { label: 'Nâng cấp', disabled: false, icon: 'fa-arrow-up-right-dots' },
  RENEW: {
    label: 'Đang sử dụng', disabled: true, icon: 'fa-circle-check',
    note: 'Gói đang hoạt động'
  },
  BLOCKED: {
    label: 'Không khả dụng', disabled: true, icon: 'fa-lock',
    note: 'Không thể mua gói có cấp thấp hơn gói đang hoạt động'
  },
};

function resolveBuyLabel(purchaseAction) {
  return PURCHASE_ACTIONS[purchaseAction] ?? PURCHASE_ACTIONS.BUY;
}

function PlanCard({ plan, checking, anyChecking, isCurrentPlan, onBuy }) {
  const {
    label: buyLabel,
    disabled: tierDisabled,
    icon: buyIcon,
    note: disabledNote,
  } = resolveBuyLabel(plan.purchaseAction);

  const isDisabled = anyChecking || tierDisabled;

  return (
    <article className={`${styles.card} ${isCurrentPlan ? styles.cardCurrent : ''}`}>
      {isCurrentPlan && (
        <div className={styles.currentBadge}>
          <i className="fas fa-circle-check" aria-hidden="true" /> Gói hiện tại
        </div>
      )}

      <header className={styles.cardHead}>
        <h2 className={styles.cardName}>{plan.name}</h2>
        <div className={styles.cardPrice}>
          <span className={styles.priceValue}>{formatPrice(plan.price)}</span>
          <span className={styles.priceUnit}>/ {formatDuration(plan.durationInDays)}</span>
        </div>
      </header>

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

      {tierDisabled ? (
        <div className={styles.disabledNote} role="note">
          <i className={`fas ${buyIcon}`} aria-hidden="true" />
          {disabledNote}
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.buyButton} ${isCurrentPlan ? styles.buyButtonRenew : ''}`}
          onClick={() => onBuy(plan)}
          disabled={isDisabled}
          aria-label={`${buyLabel} gói ${plan.name}`}
        >
          {checking ? (
            <><i className="fas fa-spinner fa-spin" aria-hidden="true" /> Đang kiểm tra...</>
          ) : (
            <>
              <i className={`fas ${buyIcon}`} aria-hidden="true" />
              {' '}{buyLabel}
            </>
          )}
        </button>
      )}
    </article>
  );
}

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { openLogin } = useOutletContext() ?? {};

  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [checkingPlanId, setCheckingPlanId] = useState('');
  const [toast, setToast] = useState(null);

  // Gói đang active (chỉ fetch khi user đã login)
  const [activeSub, setActiveSub] = useState(null); // null = chưa fetch / không có

  const pendingPlanIdRef = useRef('');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Fetch danh sách gói
  const fetchPlans = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const res = await getPublicSubscriptionPlans();
      if (res.success) {
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

  // Fetch gói đang active của learner (nếu đã login)
  const fetchActiveSub = useCallback(async () => {
    if (!user || !hasValidSession()) return;
    try {
      const res = await getCurrentSubscription();
      if (res.success) setActiveSub(res.data);
    } catch { /* im lặng — không block trang */ }
  }, [user]);

  // purchaseAction được BE tính theo caller nên phải fetch lại khi đăng nhập / đăng xuất,
  // nếu không nút mua sẽ giữ trạng thái của phiên trước.
  useEffect(() => { fetchPlans(); }, [fetchPlans, user]);
  useEffect(() => { fetchActiveSub(); }, [fetchActiveSub]);

  // Re-fetch active sub khi user thay đổi (đăng nhập / đăng xuất)
  useEffect(() => {
    if (!user) setActiveSub(null);
  }, [user]);

  /** Re-check plan trước khi navigate sang checkout */
  const startPurchase = useCallback(async (planId) => {
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
  }, [fetchPlans, logout, navigate, openLogin, showToast]);

  const handleBuyNow = useCallback((plan) => {
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
  }, [logout, openLogin, showToast, startPurchase]);

  // Sau khi đăng nhập xong → chạy tiếp pending purchase
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

          {/* Banner gói đang active */}
          {activeSub?.hasActiveSubscription && (
            <div className={styles.activeSubBanner}>
              <i className="fas fa-circle-check" aria-hidden="true" />
              <span>
                Gói hiện tại của bạn: <strong>{activeSub.subscriptionPlanName}</strong>
                {' '}— còn <strong>{activeSub.remainingDays} ngày</strong>
              </span>
              <Link to="/profile/subscription" className={styles.activeSubLink}>
                Xem chi tiết <i className="fas fa-arrow-right" />
              </Link>
            </div>
          )}

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
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
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
                  anyChecking={Boolean(checkingPlanId)}
                  // RENEW = trùng tier với gói đang dùng → chính là gói hiện tại
                  isCurrentPlan={plan.purchaseAction === 'RENEW'}
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
