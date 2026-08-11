import api from "@services/api";

export async function getBlogs({ search, pageNumber = 1, pageSize = 10 } = {}) {
  const res = await api.get("/admin/blogs", {
    params: { search, pageNumber, pageSize },
  });
  return res.data;
}

export async function getBlogDetail(id) {
  const res = await api.get(`/admin/blogs/${id}`);
  return res.data;
}

export async function createBlog(payload) {
  const res = await api.post("/admin/blogs", payload);
  return res.data;
}

export async function updateBlog(id, payload) {
  const res = await api.put(`/admin/blogs/${id}`, { blogId: id, ...payload });
  return res.data;
}

export async function deleteBlog(id) {
  const res = await api.delete(`/admin/blogs/${id}`);
  return res.data;
}

export async function publishBlog(id) {
  const res = await api.put(`/admin/blogs/${id}/publish`);
  return res.data;
}

export async function unpublishBlog(id) {
  const res = await api.put(`/admin/blogs/${id}/unpublish`);
  return res.data;
}