import api, { resolveApiError, normalizeApiResponse } from "../../../../utils/api";
export { resolveApiError };

export async function createAIPracticeMaterial(payload) {
  const res = await api.post(`/AIPracticeMaterials`, payload);
  return normalizeApiResponse(res.data);
}

export async function getAIPracticeMaterialDetail(materialId) {
  const res = await api.get(`/AIPracticeMaterials/${materialId}/edit`);
  return normalizeApiResponse(res.data);
}

export async function updateAIPracticeMaterial(materialId, payload) {
  const res = await api.put(`/AIPracticeMaterials/${materialId}`, payload);
  return normalizeApiResponse(res.data);
}