import api, { resolveApiError, normalizeApiResponse } from "../../../../utils/api";
export { resolveApiError };

export async function getLearningMaterials(moduleId) {
    const res = await api.get(`/modules/${moduleId}/learning-materials`);
    return normalizeApiResponse(res.data);
}

export async function createLearningMaterial(moduleId, payload) {
    const res = await api.post(`/modules/${moduleId}/learning-materials`, payload);
    return normalizeApiResponse(res.data);
}

export async function deleteLearningMaterial(moduleId, materialId) {
    const res = await api.delete(`/modules/${moduleId}/learning-materials/${materialId}`);
    return { success: res.status === 204 }; // giữ nguyên
}

export async function reorderLearningMaterials(moduleId, items) {
    const res = await api.put(`/modules/${moduleId}/learning-materials/reorder`, { items });
    return normalizeApiResponse(res.data);
}