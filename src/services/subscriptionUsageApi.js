import api from "@services/api";

/**
 * UC-21: Review Subscription Resource Usage
 * GET /api/learner/subscriptions/resource-usage
 */
export async function getSubscriptionResourceUsage() {
  const res = await api.get("/learner/subscriptions/resource-usage");
  return res.data;
}
