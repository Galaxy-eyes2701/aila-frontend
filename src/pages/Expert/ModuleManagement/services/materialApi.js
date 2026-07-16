import api from "../../../../utils/api";

export async function getLearningMaterials(moduleId) {
    const res = await api.get(
        `/modules/${moduleId}/learning-materials`
    );

    return res.data;
}

export async function createLearningMaterial(moduleId, payload) {
    const res = await api.post(
        `/modules/${moduleId}/learning-materials`,
        payload
    );

    return res.data;
}

export async function deleteLearningMaterial(moduleId, materialId) {
    const res = await api.delete(
        `/modules/${moduleId}/learning-materials/${materialId}`
    );

    return { success: res.status === 204 };
}

export async function reorderLearningMaterials(moduleId, items) {
    const res = await api.put(
        `/modules/${moduleId}/learning-materials/reorder`,
        { items }
    );
    return res.data;
}