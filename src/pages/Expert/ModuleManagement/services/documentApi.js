import api, { resolveApiError, normalizeApiResponse } from "../../../../utils/api";
export { resolveApiError };

export const getDocumentDetail = async (materialId) => {
  const response = await api.get(`/document-materials/${materialId}`);
  return normalizeApiResponse(response.data);
};

export const updateDocumentDetail = async (materialId, payload) => {
  const response = await api.put(`/document-materials/${materialId}`, payload);
  return normalizeApiResponse(response.data);
};