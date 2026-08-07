import api from "../../../../utils/api";

/**
 * UC-66: Review Expert AI Resource Usage
 * GET /api/experts/me/ai-resource-usage
 */
export async function getExpertAiResourceUsage() {
  const res = await api.get("/experts/me/ai-resource-usage");
  return res.data;
}
