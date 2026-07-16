import api from "../../../utils/api";

export async function getUsers(params = {}) {
  const res = await api.get("/admin/users", { params });
  return res.data;
}

export async function getUserDetail(userId) {
  const res = await api.get(`/admin/users/${userId}`);
  return res.data;
}

export async function updateUserStatus(userId, isActive) {
  const res = await api.patch(`/admin/users/${userId}/status`, {
    isActive,
  });
  return res.data;
}

export async function createExpertAccount(payload) {
  const res = await api.post("/admin/users/experts", payload);
  return res.data;
}

export async function getUserRoles() {
  const res = await api.get("/admin/users/roles");
  return res.data;
}