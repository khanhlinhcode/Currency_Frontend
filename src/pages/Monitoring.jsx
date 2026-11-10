import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import axios from "../api/axios";
import { date, number, percent, statusLabel } from "./mlops";

const reasonLabels = {
  "No verified model baseline or fewer than minimum operational samples": "Chưa có baseline model đã xác minh hoặc số mẫu vận hành chưa đạt ngưỡng.",
  "API errors or processing p95 exceeded critical threshold": "Lỗi API hoặc độ trễ p95 vượt ngưỡng nghiêm trọng.",
  "API errors or processing p95 exceeded warning threshold": "Lỗi API hoặc độ trễ p95 vượt ngưỡng cảnh báo.",
  "Private storage usage unavailable": "Chưa đọc được dung lượng kho riêng tư.",
  "Private storage usage exceeded warning threshold": "Dung lượng kho riêng tư vượt ngưỡng cảnh báo.",
  "Model confidence or class mix requires investigation": "Độ tin cậy hoặc phân bố lớp cần được kiểm tra.",
  "Device fleet has offline or outdated installations": "Có thiết bị chưa kết nối hoặc chưa cập nhật bản phát hành.",
  "Device prediction distribution requires investigation": "Phân bố dự đoán trên thiết bị cần được xem xét.",
  "API serving model has not synchronized with release channel": "API chưa đồng bộ model với kênh phát hành.",
};

export default function Monitoring() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const [live, saved] = await Promise.all([
          axios.get("/mlops/monitoring/current"), axios.get("/mlops/monitoring?limit=30"),
        ]);
        if (active) { setCurrent(live.data); setHistory(saved.data.snapshots || []); setError(""); }
      } catch { if (active) setError("Không tải được tín hiệu monitoring."); }
    }
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const chart = [...history].reverse().map((item) => ({
    time: new Date(item.checked_at).toLocaleDateString("vi-VN"),
    p95: item.processing_p95_ms,
    errors: item.api_5xx_24h,
  }));
  return <div className="dashboard-page fade-in">
    <section className="hero-panel"><p className="panel-kicker">Operations & Model Quality</p><h2>Theo dõi staging</h2>
      <p>Tín hiệu dịch vụ và chất lượng model được hiển thị riêng. Không có baseline sạch hoặc chưa đủ mẫu sẽ được ghi là “Chưa đủ dữ liệu”.</p></section>
    {error ? <section className="panel empty-state error">{error}</section> : null}
    {!current ? <section className="panel empty-state">Đang tải tín hiệu...</section> : <>
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel stat-card"><p>Tình trạng tổng</p><h3>{statusLabel(current.status)}</h3><p>{date(current.checked_at)}</p></article>
        <article className="panel stat-card"><p>Drift / chất lượng model</p><h3>{statusLabel(current.drift_status)}</h3><p>{number(current.operational_sample_size)} / {number(current.thresholds?.minimum_model_samples)} mẫu tối thiểu</p></article>
        <article className="panel stat-card"><p>API 5xx · 24 giờ</p><h3>{number(current.api_5xx_24h)}</h3></article>
        <article className="panel stat-card"><p>Dung lượng bucket</p><h3>{current.storage_bytes == null ? "Chưa đo được" : number(current.storage_bytes / 1000000, " MB")}</h3></article>
      </section>
      <section className="panel chart-panel"><div className="panel-title"><h3>Đồng bộ thiết bị</h3></div>
        <p>Kênh phát hành: {current.channel_active_run_id || "Chưa có bản được duyệt"} · Thiết bị đang hoạt động: {number(current.device_total)} · Chưa cập nhật: {number(current.device_outdated)} · Mất kết nối: {number(current.device_offline)}</p>
        <p>Drift thiết bị: {statusLabel(current.device_quality?.status)} · Mẫu: {number(current.device_quality?.sample_size)} / {number(current.thresholds?.minimum_model_samples)} · Confidence thấp: {percent(current.device_quality?.low_confidence_rate)} · JS divergence: {number(current.device_quality?.distribution_js_divergence)}</p>
        <p>Độ đúng đã duyệt trên thiết bị: {percent(current.device_quality?.reviewed_accuracy)} · Số lượt duyệt: {number(current.device_quality?.reviewed_count)} / {number(current.thresholds?.minimum_reviewed_samples)}</p>
      </section>
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel stat-card"><p>Xử lý p95 / p99</p><h3>{number(current.processing_p95_ms, " ms")}</h3><p>p99: {number(current.processing_p99_ms, " ms")}</p></article>
        <article className="panel stat-card"><p>Inference p95 / p99</p><h3>{number(current.inference_p95_ms, " ms")}</h3><p>p99: {number(current.inference_p99_ms, " ms")}</p></article>
        <article className="panel stat-card"><p>Confidence thấp</p><h3>{percent(current.low_confidence_rate)}</h3></article>
        <article className="panel stat-card"><p>Độ đúng đã duyệt</p><h3>{percent(current.reviewed_accuracy)}</h3><p>{number(current.reviewed_count)} / {number(current.thresholds?.minimum_reviewed_samples)} bản ghi tối thiểu</p></article>
      </section>
      <section className="panel chart-panel"><div className="panel-title"><h3>Diễn giải</h3></div>
        <p>Model API {current.model_version} · run {current.serving_run_id || "bootstrap"} · {statusLabel(current.release_status)} · Baseline đã xác minh: {current.baseline_available ? "Có" : "Chưa có"}</p>
        {current.serving_update_error && <p>Lỗi đồng bộ model API: {current.serving_update_error}</p>}
        <p>Class mix JS divergence: {number(current.distribution_js_divergence)}</p>
        {current.reasons?.length ? <ul>{current.reasons.map((reason) => <li key={reason}>{reasonLabels[reason] || reason}</li>)}</ul> : <p>Chưa có tín hiệu vượt ngưỡng.</p>}
      </section>
    </>}
    <section className="panel chart-panel"><div className="panel-title"><h3>Lịch sử snapshot</h3></div>
      {!history.length ? <p>Chưa có snapshot được lưu.</p> : <>
        {chart.some((item) => item.p95 != null) ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={240}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Line type="monotone" dataKey="p95" stroke="#4dd6bf" name="Processing p95 (ms)" /></LineChart></ResponsiveContainer></div> : <p>Chưa có lượt dự đoán vận hành để vẽ độ trễ.</p>}
        <div className="table-wrap"><table className="history-table"><thead><tr><th>Thời gian</th><th>Trạng thái</th><th>Drift</th><th>5xx</th><th>Processing p95</th><th>Mẫu</th></tr></thead>
          <tbody>{history.map((item) => <tr key={item.checked_at}><td>{date(item.checked_at)}</td><td>{statusLabel(item.status)}</td><td>{statusLabel(item.drift_status)}</td><td>{number(item.api_5xx_24h)}</td><td>{number(item.processing_p95_ms, " ms")}</td><td>{number(item.operational_sample_size)}</td></tr>)}</tbody></table></div>
      </>}
    </section>
  </div>;
}
