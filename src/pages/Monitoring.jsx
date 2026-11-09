import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import axios from "../api/axios";
import { date, number, percent, statusLabel } from "./mlops";

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
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel stat-card"><p>Xử lý p95 / p99</p><h3>{number(current.processing_p95_ms, " ms")}</h3><p>p99: {number(current.processing_p99_ms, " ms")}</p></article>
        <article className="panel stat-card"><p>Inference p95 / p99</p><h3>{number(current.inference_p95_ms, " ms")}</h3><p>p99: {number(current.inference_p99_ms, " ms")}</p></article>
        <article className="panel stat-card"><p>Confidence thấp</p><h3>{percent(current.low_confidence_rate)}</h3></article>
        <article className="panel stat-card"><p>Độ đúng đã duyệt</p><h3>{percent(current.reviewed_accuracy)}</h3><p>{number(current.reviewed_count)} / {number(current.thresholds?.minimum_reviewed_samples)} bản ghi tối thiểu</p></article>
      </section>
      <section className="panel chart-panel"><div className="panel-title"><h3>Diễn giải</h3></div>
        <p>Model {current.model_version} · {statusLabel(current.release_status)} · Baseline đã xác minh: {current.baseline_available ? "Có" : "Chưa có"}</p>
        <p>Class mix JS divergence: {number(current.distribution_js_divergence)}</p>
        {current.reasons?.length ? <ul>{current.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p>Chưa có tín hiệu vượt ngưỡng.</p>}
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
