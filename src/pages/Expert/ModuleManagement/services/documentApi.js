import api from "../../../../utils/api";

export const getDocumentDetail = async (materialId) => {
  const response = await api.get(`/document-materials/${materialId}`);

  return response.data;
};

export const updateDocumentDetail = async (materialId, payload) => {
  const response = await api.put(`/document-materials/${materialId}`, payload);

  return response.data;
};
