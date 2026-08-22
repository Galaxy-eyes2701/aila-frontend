import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { resolveApiError } from "@services/api";
import styles from "./ModuleManagement.module.css";
import Toast from "./components/Toast";
import ModuleSkeleton from "./components/ModuleSkeleton";
import ModuleModal from "./components/ModuleModal";
import ModuleCard from "./components/ModuleCard";
import LearningMaterialModal from "./components/LearningMaterial/LearningMaterialModal";
import VideoDetailModal from "./components/LearningMaterial/VideoDetailModal";
import DocumentDetailModal from "./components/LearningMaterial/DocumentDetailModal";
import { getMaterialModalType } from "@infrastructure/constants/materialType";
import QuizDetailModal from "./components/LearningMaterial/QuizDetailModal";
import AIPracticeMaterialModal from "./components/LearningMaterial/AIPracticeMaterialModal";
import ConfirmModal from "./components/ConfirmModal";

const emptyForm = {
  title: "",
  description: "",
};

export default function ModuleManagement() {
  const { courseId: rawCourseId } = useParams();
  const navigate = useNavigate();
  const courseId = rawCourseId?.replace(/^:/, "");
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [materialModal, setMaterialModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [materialDetailModal, setMaterialDetailModal] = useState(null);
  const [pendingCallback, setPendingCallback] = useState(null);
  const [aiPracticeModal, setAiPracticeModal] = useState(null); // { title }
  const [deleteTargetModule, setDeleteTargetModule] = useState(null);

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.orderIndex - b.orderIndex),
    [modules],
  );

  const stats = useMemo(() => {
    const materialCount = modules.reduce(
      (sum, module) => sum + (module.materialCount ?? 0),
      0,
    );
    return { materialCount };
  }, [modules]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const fetchModules = useCallback(async () => {
    if (!courseId) {
      setPageError("Không tìm thấy mã khóa học.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError("");
    try {
      const res = await api.get(`/courses/${courseId}/modules`);
      if (res.data.success) {
        setModules(res.data.data ?? []);
        setHasOrderChanges(false);
      } else {
        setPageError(
          res.data.errorMessage || "Không thể tải danh sách học phần.",
        );
      }
    } catch (error) {
      if (error.response?.status === 401) navigate("/expert/login");
      else if (error.response?.status === 403)
        setPageError("Bạn không có quyền quản lý học phần của khóa học này.");
      else if (error.response?.status === 404)
        setPageError("Không tìm thấy khóa học.");
      else setPageError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    if (rawCourseId?.startsWith(":") && courseId) {
      navigate(`/expert/courses/${courseId}/modules`, { replace: true });
    }
  }, [courseId, navigate, rawCourseId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const openCreateModal = () => {
    setModal({ mode: "create", module: null });
    setForm(emptyForm);
    setFormError("");
  };

  const openEditModal = (module) => {
    setModal({ mode: "edit", module });
    setForm({
      title: module.title ?? "",
      description: module.description ?? "",
    });
    setFormError("");
  };

  const closeModal = (force = false) => {
    if (saving && !force) return;
    setModal(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormError("");
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setFormError("Tiêu đề học phần không được để trống.");
      return;
    }

    setSaving(true);
    setFormError("");
    const mode = modal.mode;
    const payload = {
      title,
      description: form.description.trim() || null,
      orderIndex:
        mode === "create" ? modules.length + 1 : modal.module.orderIndex,
    };

    try {
      const res =
        mode === "create"
          ? await api.post(`/courses/${courseId}/modules`, payload)
          : await api.put(
              `/courses/${courseId}/modules/${modal.module.id}`,
              payload,
            );

      if (!res.data.success) {
        setFormError(res.data.errorMessage || "Không thể lưu học phần.");
        return;
      }

      closeModal(true);
      await fetchModules();
      showToast(
        mode === "create" ? "Đã tạo học phần mới." : "Đã cập nhật học phần.",
      );
    } catch (error) {
      const { errorMessage } = resolveApiError(error);
      setFormError(
        errorMessage || "Lỗi kết nối máy chủ. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (module) => {
    setDeleteTargetModule(module);
  };

  const confirmDeleteModule = async () => {
    if (!deleteTargetModule) return;
    const target = deleteTargetModule;

    setBusyId(target.id);
    try {
      const res = await api.delete(`/courses/${courseId}/modules/${target.id}`);
      if (!res.data?.success) {
        showToast(
          res.data?.errorMessage || "Không thể xóa học phần.",
          "error",
        );
        return;
      }

      setModules((current) => current.filter((item) => item.id !== target.id));
      setHasOrderChanges(true);
      showToast("Đã xóa học phần.");
      setDeleteTargetModule(null);
    } catch (error) {
      const { errorMessage } = resolveApiError(error);
      showToast(
        errorMessage || "Không thể xóa học phần.",
        "error",
      );
    } finally {
      setBusyId("");
    }
  };

  const moveModule = (moduleId, direction) => {
    const index = sortedModules.findIndex((module) => module.id === moduleId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= sortedModules.length) return;

    const nextModules = [...sortedModules];
    const [moved] = nextModules.splice(index, 1);
    nextModules.splice(nextIndex, 0, moved);

    setModules(
      nextModules.map((module, order) => ({
        ...module,
        orderIndex: order + 1,
      })),
    );
    setHasOrderChanges(true);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const items = sortedModules.map((module, index) => ({
        moduleId: module.id,
        newOrderIndex: index + 1,
      }));
      const res = await api.put(`/courses/${courseId}/modules/reorder`, {
        items,
      });
      if (res.data.success) {
        setHasOrderChanges(false);
        showToast("Đã lưu thứ tự học phần.");
      } else {
        showToast(
          res.data.errorMessage || "Không thể lưu thứ tự học phần.",
          "error",
        );
      }
    } catch (error) {
      const { errorMessage } = resolveApiError(error);
      showToast(
        errorMessage || "Lỗi kết nối máy chủ.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/expert">Chuyên gia</Link>
          <i className="fas fa-chevron-right" />
          <Link to="/expert/courses">Quản lý khóa học</Link>
          <i className="fas fa-chevron-right" />
          <span>Quản lý học phần</span>
        </div>

        <section className={styles.headerBand}>
          <div>
            <p className={styles.eyebrow}>Mã khóa học: {courseId}</p>
            <h1>Quản lý học phần khóa học</h1>
            <p className={styles.headerText}>
              Tạo học phần học, cập nhật nội dung, công khai và sắp xếp thứ tự học
              tập cho khóa học.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              className={styles.secondaryButton}
              onClick={() => navigate("/expert/courses")}
            >
              <i className="fas fa-arrow-left" /> Quay lại
            </button>
            <button className={styles.primaryButton} onClick={openCreateModal}>
              <i className="fas fa-plus" /> Thêm học phần
            </button>
          </div>
        </section>

        <section className={styles.summaryGrid} aria-label="Thống kê học phần">
          <div className={styles.summaryItem}>
            <span>Tổng học phần</span>
            <strong>{modules.length}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Học liệu</span>
            <strong>{stats.materialCount}</strong>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Danh sách học phần</h2>
              <p>Sắp xếp theo thứ tự hiển thị trong khóa học.</p>
            </div>
            <div className={styles.panelActions}>
              <button
                className={styles.secondaryButton}
                onClick={fetchModules}
                disabled={loading}
              >
                <i className="fas fa-rotate-right" />
                Tải lại
              </button>
              <button
                className={styles.primaryButton}
                onClick={saveOrder}
                disabled={!hasOrderChanges || saving}
              >
                <i className="fas fa-list-ol" />
                Lưu thứ tự
              </button>
            </div>
          </div>

          {loading && <ModuleSkeleton />}

          {!loading && pageError && (
            <div className={styles.emptyState}>
              <i className="fas fa-triangle-exclamation" />
              <h3>Không thể tải học phần</h3>
              <p>{pageError}</p>
              <button className={styles.secondaryButton} onClick={fetchModules}>
                Thử lại
              </button>
            </div>
          )}

          {!loading && !pageError && sortedModules.length === 0 && (
            <div className={styles.emptyState}>
              <i className="fas fa-layer-group" />
              <h3>Chưa có học phần nào</h3>
              <p>Tạo học phần đầu tiên để bắt đầu xây dựng nội dung khóa học.</p>
              <button
                className={styles.primaryButton}
                onClick={openCreateModal}
              >
                <i className="fas fa-plus" />
                Thêm học phần
              </button>
            </div>
          )}

          {!loading && !pageError && sortedModules.length > 0 && (
            <div className={styles.moduleStack}>
              {sortedModules.map((module, index) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  index={index}
                  totalModules={sortedModules.length}
                  busy={busyId === module.id}
                  actions={{
                    onMove: moveModule,
                    onEdit: openEditModal,
                    onDelete: handleDelete,
                    onCreateMaterial: (module) => {
                      setSelectedModule(module);
                      setMaterialModal(true);
                    },
                    onEditMaterial: (material, onDone) => {
                      const type = getMaterialModalType(material);
                      setPendingCallback(() => onDone);

                      if (type === "AiPractice") {
                        setAiPracticeModal({ mode: "edit", material });
                        return;
                      }

                      setMaterialDetailModal({ type, material });
                    },
                    onMaterialDeleted: (success, message) => {
                      if (success) {
                        showToast(message || "Đã xóa học liệu.");
                        fetchModules();
                      } else {
                        showToast(
                          message || "Không thể xóa học liệu.",
                          "error",
                        );
                      }
                    },
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {modal && (
        <ModuleModal
          mode={modal.mode}
          form={form}
          saving={saving}
          error={formError}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {materialModal && (
        <LearningMaterialModal
          open={materialModal}
          module={selectedModule}
          onClose={() => {
            setMaterialModal(false);
            setSelectedModule(null);
          }}
          onCreated={(material, materialType) => {
            setMaterialModal(false);
            setSelectedModule(null);
            if (materialType === "Quiz") {
              const matId = material?.materialId || material?.id;
              setMaterialDetailModal({
                type: "Quiz",
                material: { id: matId, title: material?.title },
              });
            }
            fetchModules();
          }}
          onCreateAiPractice={({ title }) => {
            setMaterialModal(false);
            setAiPracticeModal({ mode: "create", title });
            // Giữ selectedModule để AIPracticeMaterialModal dùng module.id
          }}
        />
      )}

      {aiPracticeModal && (
        <AIPracticeMaterialModal
          open={!!aiPracticeModal}
          module={selectedModule}
          material={
            aiPracticeModal.mode === "edit" ? aiPracticeModal.material : null
          }
          initialTitle={
            aiPracticeModal.mode === "create" ? aiPracticeModal.title : ""
          }
          onClose={() => {
            setAiPracticeModal(null);
            setSelectedModule(null);
            pendingCallback?.();
            setPendingCallback(null);
          }}
          onSuccess={() => {
            const wasEdit = aiPracticeModal.mode === "edit";
            setAiPracticeModal(null);
            setSelectedModule(null);
            pendingCallback?.();
            setPendingCallback(null);
            fetchModules();
            showToast(
              wasEdit
                ? "Đã cập nhật học liệu Thực hành AI."
                : "Đã tạo học liệu Thực hành AI.",
            );
          }}
        />
      )}
      <VideoDetailModal
        open={materialDetailModal?.type === "Video"}
        material={materialDetailModal?.material}
        onClose={() => setMaterialDetailModal(null)}
        onSuccess={() => {
          setMaterialDetailModal(null);
          pendingCallback?.();
          setPendingCallback(null);
          fetchModules();
          showToast("Đã cập nhật Video.");
        }}
      />
      <DocumentDetailModal
        open={materialDetailModal?.type === "Document"}
        material={materialDetailModal?.material}
        onClose={() => setMaterialDetailModal(null)}
        onSuccess={() => {
          setMaterialDetailModal(null);
          pendingCallback?.();
          setPendingCallback(null);
          fetchModules();
          showToast("Đã cập nhật tài liệu.");
        }}
      />
      <QuizDetailModal
        open={materialDetailModal?.type === "Quiz"}
        material={materialDetailModal?.material}
        onClose={() => {
          setMaterialDetailModal(null);
          pendingCallback?.();
          setPendingCallback(null);
          fetchModules();
        }}
        onSuccess={() => {
          setMaterialDetailModal(null);
          pendingCallback?.();
          setPendingCallback(null);
          fetchModules();
          showToast("Đã cập nhật Quiz.");
        }}
      />
      <ConfirmModal
        open={!!deleteTargetModule}
        title={`Xóa học phần "${deleteTargetModule?.title}"?`}
        description="Tất cả học liệu bên trong học phần này sẽ bị xóa theo. Bạn có chắc chắn muốn xóa?"
        confirmLabel="Xóa học phần"
        cancelLabel="Hủy"
        tone="danger"
        busy={busyId === deleteTargetModule?.id}
        onConfirm={confirmDeleteModule}
        onClose={() => setDeleteTargetModule(null)}
      />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}