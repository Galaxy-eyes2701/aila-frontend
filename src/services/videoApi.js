import api, { resolveApiError, normalizeApiResponse } from "@services/api";
export { resolveApiError };

export const getVideoDetail = async (materialId) => {
    const response = await api.get(`/video-materials/${materialId}`);
    return normalizeApiResponse(response.data);
};

export const createVideoMaterial = async (payload) => {
    const response = await api.post("/video-materials", payload);
    return normalizeApiResponse(response.data);
};

export const updateVideoDetail = async (materialId, payload) => {
    const response = await api.put(`/video-materials/${materialId}`, payload);
    return normalizeApiResponse(response.data);
};