import api from "@services/api";

/** UC-18: Lấy thông tin gói đăng ký hiện tại của learner */
export async function getCurrentSubscription() {
  const res = await api.get("/learner/subscriptions/current");
  return res.data;
}

/** UC-19: Tạo payment transaction → nhận thông tin QR SePay */
export async function createPayment(subscriptionPlanId) {
  const res = await api.post("/learner/payments", { subscriptionPlanId });
  return res.data;
}

/** UC-20: Lấy lịch sử thanh toán (phân trang + filter ngày) */
export async function getPaymentHistory({ fromDate, toDate, page = 1, pageSize = 10 } = {}) {
  const params = { page, pageSize };
  if (fromDate) params.fromDate = fromDate;
  if (toDate)   params.toDate   = toDate;
  const res = await api.get("/learner/payments", { params });
  return res.data;
}

/** UC-20: Lấy chi tiết một giao dịch thanh toán */
export async function getPaymentDetail(paymentId) {
  const res = await api.get(`/learner/payments/${paymentId}`);
  return res.data;
}
