import { useEffect, useMemo, useState } from "react";
import styles from "./LearningMaterial.module.css";
import LearningMaterialItem from "./LearningMaterialItem";
import {
  getLearningMaterials,
  deleteLearningMaterial,
  reorderLearningMaterials,
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
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => a.orderIndex - b.orderIndex),
    [materials],
  );

  useEffect(() => {
    load();
  }, [moduleId, refreshKey]);

  async function load() {
    try {
      setLoading(true);
      const res = await getLearningMaterials(moduleId);
      if (res.success) {
        setMaterials(res.data ?? []);
        setHasOrderChanges(false);
      }
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

  function moveMaterial(materialId, direction) {
    const index = sortedMaterials.findIndex((m) => m.id === materialId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= sortedMaterials.length)
      return;

    const reordered = [...sortedMaterials];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);

    setMaterials(
      reordered.map((m, i) => ({ ...m, orderIndex: i + 1 })),
    );
    setHasOrderChanges(true);
  }

  async function saveOrder() {
    setSavingOrder(true);
    try {
      const items = sortedMaterials.map((m, i) => ({
        materialId: m.id,
        newOrderIndex: i + 1,
      }));

      const res = await reorderLearningMaterials(moduleId, items);
      if (res.success) {
        setHasOrderChanges(false);
        onDeleted?.(true, "Đã lưu thứ tự học liệu."); // tái sử dụng toast callback có sẵn
        await load();
      } else {
        onDeleted?.(false, res.errorMessage ?? "Không thể lưu thứ tự học liệu.");
      }
    } catch (err) {
      onDeleted?.(
        false,
        err.response?.data?.errorMessage ?? "Lỗi kết nối máy chủ.",
      );
    } finally {
      setSavingOrder(false);
    }
  }

  if (loading) return <p>Đang tải học liệu...</p>;

  return (
    <div>
      {sortedMaterials.length === 0 ? (
        <div className={styles.empty}>Chưa có học liệu</div>
      ) : (
        <div className={styles.list}>
          {sortedMaterials.map((item, index) => (
            <LearningMaterialItem
              key={item.id}
              material={item}
              index={index}
              totalMaterials={sortedMaterials.length}
              onMove={moveMaterial}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className={styles.addButton} onClick={onCreate}>
          <i className="fas fa-plus" /> Thêm học liệu
        </button>

        {hasOrderChanges && (
          <button
            className={styles.saveOrderButton}
            onClick={saveOrder}
            disabled={savingOrder}
          >
            <i className="fas fa-list-ol" />
            {savingOrder ? "Đang lưu..." : "Lưu thứ tự"}
          </button>
        )}
      </div>
    </div>
  );
}