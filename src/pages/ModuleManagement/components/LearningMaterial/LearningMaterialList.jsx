import { useEffect, useState } from "react";
import styles from "./LearningMaterial.module.css";
import LearningMaterialItem from "./LearningMaterialItem";
import {
  getLearningMaterials,
  deleteLearningMaterial,
} from "../../services/materialApi";

export default function LearningMaterialList({
  moduleId,
  onCreate,
  onEdit,
  refreshKey,
  onDeleted, // (success: boolean, message?: string) => void
}) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, [moduleId, refreshKey]);

  async function load() {
    try {
      setLoading(true);
      const res = await getLearningMaterials(moduleId);
      if (res.success) setMaterials(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(material) {
    if (!window.confirm(`Xóa học liệu "${material.title}"?`)) return;
    try {
      const res = await deleteLearningMaterial(moduleId, material.id);
      if (res.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== material.id));
        onDeleted?.(true);
      } else {
        onDeleted?.(false, "Không thể xóa học liệu.");
      }
    } catch (err) {
      onDeleted?.(
        false,
        err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.",
      );
    }
  }

  if (loading) return <p>Đang tải học liệu...</p>;

  return (
    <div>
      {materials.length === 0 ? (
        <div className={styles.empty}>Chưa có học liệu</div>
      ) : (
        <div className={styles.list}>
          {materials.map((item) => (
            <LearningMaterialItem
              key={item.id}
              material={item}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      <button className={styles.addButton} onClick={onCreate}>
        <i className="fas fa-plus" /> Thêm học liệu
      </button>
    </div>
  );
}