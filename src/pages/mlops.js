import axios from "../api/axios";

export function percent(value) {
  return typeof value === "number" ? `${(value * 100).toFixed(2)}%` : "Chưa đủ dữ liệu";
}

export function number(value, unit = "") {
  return typeof value === "number" ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)}${unit}` : "Chưa đủ dữ liệu";
}

export function date(value) {
  if (!value) return "Chưa ghi nhận";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("vi-VN");
}

export function statusLabel(value) {
  return ({ healthy: "Bình thường", warning: "Cần xem xét", critical: "Nghiêm trọng",
    insufficient_data: "Chưa đủ dữ liệu", candidate: "Ứng viên", diagnostic: "Chẩn đoán",
    approved: "Đã duyệt" })[value] || value || "Chưa có";
}

export async function downloadReport(url, filename) {
  const response = await axios.get(url, { responseType: "blob" });
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(response.data);
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
