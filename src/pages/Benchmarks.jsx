import { useEffect, useState } from "react";
import axios from "../api/axios";
import { date, number, percent } from "./mlops";

export default function Benchmarks() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    axios.get("/mlops/benchmarks")
      .then(({ data }) => setBenchmarks(data.benchmarks || []))
      .catch(() => setError("Không tải được benchmark đã lưu."));
  }, []);
  const visible = benchmarks.filter((row) => !filter || String(row.concurrency) === filter);
  async function openDetail(id) {
    try {
      const { data } = await axios.get(`/mlops/benchmarks/${encodeURIComponent(id)}`);
      setSelected({ id, report: data });
    } catch { setError("Không tải được báo cáo benchmark."); }
  }
  function downloadSelected() {
    const blob = new Blob([JSON.stringify(selected.report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `${selected.id}.json`; link.click();
    URL.revokeObjectURL(url);
  }
  return <div className="dashboard-page fade-in">
    <section className="hero-panel"><p className="panel-kicker">Performance Evidence</p><h2>Benchmark staging</h2>
      <p>Số đo HTTP từ các lần chạy có điều kiện xác định. Đây là kết quả staging, không phải cam kết SLA; cold start cần đo riêng.</p></section>
    <section className="panel history-filters"><label className="history-filter-field"><span>Mức đồng thời</span><select value={filter} onChange={(event) => setFilter(event.target.value)}>
      <option value="">Tất cả</option><option value="1">1</option><option value="4">4</option><option value="8">8</option>
    </select></label></section>
    {error ? <section className="panel empty-state error">{error}</section> : null}
    <section className="panel chart-panel">{!visible.length ? <p>Chưa có benchmark phù hợp trong registry.</p> :
      <div className="table-wrap"><table className="history-table"><thead><tr><th>Đo lúc</th><th>Model</th><th>Đồng thời</th><th>Thành công</th><th>Thông lượng</th><th>HTTP p50/p95/p99</th><th>Chi tiết</th></tr></thead>
        <tbody>{visible.map((row) => <tr key={row.benchmark_id}>
          <td>{date(row.measured_at || row.recorded_at)}</td><td>{row.model_version}</td><td>{number(row.concurrency)}</td>
          <td>{number(row.runs)} lượt · {percent(row.success_rate)}</td><td>{number(row.throughput_rps, " req/s")}</td>
          <td>{number(row.latency_ms?.p50)} / {number(row.latency_ms?.p95)} / {number(row.latency_ms?.p99)} ms</td>
          <td><button type="button" className="table-btn" onClick={() => openDetail(row.benchmark_id)}>Xem</button></td>
        </tr>)}</tbody></table></div>}</section>
    {selected ? <section className="panel chart-panel"><div className="panel-title"><h3>{selected.id}</h3></div>
      <p>Ảnh riêng biệt: {number(selected.report.unique_image_count)} · Lỗi: {number(selected.report.errors)} · Warmup: {number(selected.report.warmups)}</p>
      <p>Server processing p95: {number(selected.report.server_processing_ms?.p95, " ms")} · Queue p95: {number(selected.report.queue_ms?.p95, " ms")} · Model inference p95: {number(selected.report.inference_ms?.p95, " ms")}</p>
      <button type="button" className="table-btn" onClick={downloadSelected}>Tải báo cáo JSON</button>
    </section> : null}
  </div>;
}
