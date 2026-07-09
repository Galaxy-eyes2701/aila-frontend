export function getMaterialModalType(material) {
  if (material.materialType === "Video") return "Video";
  if (material.materialType === "Document") return "Document";
  return null;
}