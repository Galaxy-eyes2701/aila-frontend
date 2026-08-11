import api from "@services/api";

export async function getAdminCategories() {
  const res = await api.get("/admin/categories");
  return res.data;
}

export async function createAdminCategory(payload) {
  const res = await api.post("/admin/categories", payload);
  return res.data;
}

export async function updateAdminCategory(categoryId, payload) {
  const res = await api.put(`/admin/categories/${categoryId}`, payload);
  return res.data;
}

export async function changeCategoryStatus(categoryId, isActive) {
  const res = await api.patch(`/admin/categories/${categoryId}/status`, {
    isActive,
  });
  return res.data;
}

export async function reorderAdminCategories(categoryIds) {
  const res = await api.put("/admin/categories/reorder", { categoryIds });
  return res.data;
}
