import api from "../../../../utils/api";


export async function createAIPracticeMaterial(payload) {
  const res = await api.post(`/AIPracticeMaterials`, payload);
  return res.data;
}


export async function getAIPracticeMaterialDetail(materialId) {
  const res = await api.get(`/AIPracticeMaterials/${materialId}/edit`);
  return res.data;
}


export async function updateAIPracticeMaterial(materialId, payload) {
  const res = await api.put(`/AIPracticeMaterials/${materialId}`, payload);
  return res.data;
}