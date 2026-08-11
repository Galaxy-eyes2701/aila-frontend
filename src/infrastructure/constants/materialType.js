export function getMaterialModalType(material) {
  if (material.materialType === "Video") return "Video";
  if (material.materialType === "Document") return "Document";
  if (material.materialType === "Quiz")       return "Quiz";
  if (material.materialType === "AiPractice") return "AiPractice";
  return null;
}