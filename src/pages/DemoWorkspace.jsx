import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import evidence from "../data/demoEvidence.json";
import { readDemoHistory } from "../demoHistory";

const runs = [...evidence.runs].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
const latest = runs[0];
const benchmarks = evidence.benchmarks;
const percent = (value) => typeof value === "number" ? `${(value * 100).toFixed(2)}%` : "Chưa có";
const number = (value, unit = "") => typeof value === "number" ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)}${unit}` : "Chưa có";
const date = (value) => value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
const country = (name) => name.startsWith("INR") ? "Ấn Độ" : name.startsWith("USA") ? "Hoa Kỳ" : "Việt Nam";

function Header({ title, children }) {
  return <header className="demo-header"><h2>{title}</h2><p>{children}</p></header>;
}

function Stat({ label, value, detail }) {
  return <article className="panel stat-card"><p>{label}</p><h3>{value}</h3>{detail && <p>{detail}</p>}</article>;
}

function countryMetrics(run) {
  const groups = {};
  for (const [label, item] of Object.entries(run.evaluation.per_class || {})) {
    const key = country(label);
    groups[key] ||= { name: key, f1Sum: 0, classes: 0, samples: 0 };
    groups[key].f1Sum += item.f1 ?? item["f1-score"] ?? 0;
    groups[key].classes += 1;
    groups[key].samples += item.support || 0;
  }
  return Object.values(groups).map((row) => ({ name: row.name, f1: +(row.f1Sum / row.classes * 100).toFixed(2), samples: row.samples }));
}

function DemoDashboard() {
  const classes = useMemo(() => countryMetrics(latest), []);
  return <div className="dashboard-page fade-in">
    <Header title="Tổng quan hiệu năng">Các chỉ số và biểu đồ từ bản đánh giá model, cùng phép đo hiệu năng của hệ thống.</Header>
    <div className="dashboard-grid dashboard-grid--four">
      <Stat label="Phiên bản model" value={latest.model_version} detail="Trạng thái candidate" />
      <Stat label="Accuracy · tập đánh giá" value={percent(latest.accuracy)} detail="Run ngày 08/11/2026" />
      <Stat label="Macro F1 · tập đánh giá" value={percent(latest.macro_f1)} detail="Run ngày 08/11/2026" />
      <Stat label="Số lớp nhận diện" value={evidence.manifest.class_names.length} detail="3 quốc gia" />
    </div>
    <div className="dashboard-charts-grid">
      <section className="panel chart-panel"><div className="panel-title"><h3>F1 trung bình theo quốc gia</h3></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={270}><BarChart data={classes}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Bar dataKey="f1" name="F1 (%)" fill="#0071e3" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </section>
      <section className="panel chart-panel"><div className="panel-title"><h3>Mẫu test theo quốc gia</h3></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={270}><BarChart data={classes}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="samples" name="Số ảnh" fill="#e59a38" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </section>
      <section className="panel chart-panel chart-panel--full"><div className="panel-title"><h3>Độ trễ HTTP p95 · staging</h3></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={280}><LineChart data={benchmarks}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="concurrency" label={{ value: "Số request đồng thời", position: "insideBottom", offset: -2 }} /><YAxis unit=" ms" /><Tooltip /><Legend /><Line type="monotone" dataKey="latency_ms.p95" name="HTTP p95 (ms)" stroke="#e59a38" strokeWidth={3} dot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
      </section>
    </div>
  </div>;
}

function DemoModelInfo() {
  const m = evidence.manifest;
  return <div className="dashboard-page fade-in">
    <Header title="Thông tin mô hình">Kiến trúc, đầu vào và phạm vi nhận diện của phiên bản đang sử dụng.</Header>
    <div className="dashboard-grid dashboard-grid--four">
      <Stat label="Phiên bản" value={m.version} />
      <Stat label="Kiến trúc" value={m.architecture} />
      <Stat label="Framework" value={m.framework} />
      <Stat label="Trạng thái" value={m.release_status} />
    </div>
    <section className="panel chart-panel"><div className="panel-title"><h3>Thông số đầu vào</h3></div>
      <p>Kích thước: {m.input_size.join(" × ")} · Ngưỡng confidence: {percent(m.confidence_threshold)} · Dataset: {m.dataset_version}</p>
      <p>Accuracy trong run đánh giá: {percent(latest.accuracy)}. Trạng thái phát hành hiện tại: {m.release_status}.</p>
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>{m.class_names.length} lớp nhận diện</h3></div>
      <div className="classes-grid">{m.class_names.map((name) => <span className="class-chip" key={name}>{name}</span>)}</div>
    </section>
    <details className="panel evaluation-disclosure"><summary>Về phương pháp đánh giá</summary><p>{evidence.source_note} Các chỉ số trình bày trên demo là kết quả nghiên cứu của model candidate, chưa phải kết quả phát hành chính thức.</p></details>
  </div>;
}

function DemoHistory() {
  const [items, setItems] = useState(readDemoHistory);
  useEffect(() => {
    const refresh = () => setItems(readDemoHistory());
    window.addEventListener("prediction-created", refresh);
    return () => window.removeEventListener("prediction-created", refresh);
  }, []);
  return <div className="dashboard-page fade-in">
    <Header title="Lịch sử nhận diện">Các lần thử gần đây trong phiên trình duyệt này.</Header>
    <section className="panel chart-panel"><div className="panel-title"><h3>{items.length} lượt thử gần nhất</h3></div>
      {items.length ? <div className="table-wrap"><table className="history-table"><thead><tr><th>Thời gian</th><th>Dự đoán</th><th>Confidence</th><th>Trạng thái</th><th>Model</th></tr></thead><tbody>
        {items.map((item, index) => <tr key={`${item.at}-${index}`}><td>{date(item.at)}</td><td>{item.prediction}</td><td>{percent(item.confidence)}</td><td>{item.suspicious ? "Cần xem lại" : "Bình thường"}</td><td>{item.model_version}</td></tr>)}
      </tbody></table></div> : <p>Chưa có lượt thử trong phiên này. <Link to="/">Chọn ảnh để nhận diện</Link>.</p>}
    </section>
  </div>;
}

function DemoRuns() {
  return <div className="dashboard-page fade-in">
    <Header title="Hồ sơ huấn luyện">Theo dõi phiên bản model, thời điểm đánh giá và kết quả của từng run.</Header>
    <section className="panel chart-panel"><div className="panel-title"><h3>{runs.length} run đã lưu</h3></div>
      <div className="table-wrap"><table className="history-table"><thead><tr><th>Run</th><th>Ghi nhận</th><th>Model</th><th>Accuracy</th><th>Macro F1</th><th>Trạng thái</th></tr></thead><tbody>
        {runs.map((run) => <tr key={run.run_id}><td><Link to={`/mlops/runs/${run.run_id}`}>{run.run_id}</Link></td><td>{date(run.recorded_at)}</td><td>{run.model_version}</td><td>{percent(run.accuracy)}</td><td>{percent(run.macro_f1)}</td><td>Candidate</td></tr>)}
      </tbody></table></div>
    </section>
  </div>;
}

function DemoRunDetail({ run }) {
  const classes = Object.entries(run.evaluation.per_class || {}).map(([name, item]) => ({ name, f1: item.f1 ?? item["f1-score"], support: item.support }));
  return <div className="dashboard-page fade-in">
    <Header title={run.run_id}>Model {run.model_version} · Đánh giá lúc {date(run.recorded_at)}.</Header>
    <div className="dashboard-grid dashboard-grid--four">
      <Stat label="Accuracy" value={percent(run.accuracy)} /><Stat label="Macro F1" value={percent(run.macro_f1)} />
      <Stat label="ECE" value={number(run.ece_10_bins)} /><Stat label="Mẫu test" value={number(run.evaluation.test_samples)} />
    </div>
    <section className="panel chart-panel"><div className="panel-title"><h3>Hiệu năng inference</h3></div><p>Độ trễ p95 cục bộ: {number(run.benchmark.p95_ms, " ms")} · {number(run.benchmark.runs)} lượt đo.</p></section>
    <section className="panel chart-panel"><div className="panel-title"><h3>F1 theo lớp</h3></div>
      <div className="table-wrap"><table className="history-table"><thead><tr><th>Lớp</th><th>F1</th><th>Số mẫu</th></tr></thead><tbody>{classes.map((item) => <tr key={item.name}><td>{item.name}</td><td>{percent(item.f1)}</td><td>{number(item.support)}</td></tr>)}</tbody></table></div>
    </section><p><Link to="/mlops/runs">← Tất cả run</Link></p>
  </div>;
}

function DemoCompare() {
  const fields = [["Accuracy", "accuracy"], ["Macro F1", "macro_f1"], ["Accepted coverage", "accepted_coverage"], ["Accepted accuracy", "accepted_accuracy"]];
  return <div className="dashboard-page fade-in">
    <Header title="So sánh model">Đối chiếu các chỉ số đánh giá và thời gian inference giữa các run đã lưu.</Header>
    <section className="panel chart-panel"><div className="table-wrap"><table className="history-table"><thead><tr><th>Chỉ số</th>{runs.map((run) => <th key={run.run_id}>{run.run_id}</th>)}</tr></thead><tbody>
      {fields.map(([label, key]) => <tr key={key}><td>{label}</td>{runs.map((run) => <td key={run.run_id}>{percent(run[key])}</td>)}</tr>)}
      <tr><td>Inference p95 cục bộ</td>{runs.map((run) => <td key={run.run_id}>{number(run.inference_p95_ms, " ms")}</td>)}</tr>
    </tbody></table></div></section>
  </div>;
}

function DemoBenchmarks() {
  return <div className="dashboard-page fade-in">
    <Header title="Benchmark hệ thống">Độ trễ và thông lượng HTTP trên môi trường staging, đo ở ba mức tải ngày 10/11/2026.</Header>
    <div className="dashboard-charts-grid"><section className="panel chart-panel chart-panel--full"><div className="panel-title"><h3>Độ trễ HTTP p50 / p95 theo mức đồng thời</h3></div>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height={300}><LineChart data={benchmarks}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="concurrency" /><YAxis unit=" ms" /><Tooltip /><Legend /><Line dataKey="latency_ms.p50" name="p50" stroke="#0071e3" strokeWidth={3} dot={{ r: 5 }} /><Line dataKey="latency_ms.p95" name="p95" stroke="#e59a38" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
    </section></div>
    <section className="panel chart-panel"><div className="table-wrap"><table className="history-table"><thead><tr><th>Đồng thời</th><th>Lượt</th><th>Thành công</th><th>Thông lượng</th><th>HTTP p95</th><th>Inference p95</th></tr></thead><tbody>
      {benchmarks.map((row) => <tr key={row.concurrency}><td>{row.concurrency}</td><td>{row.runs}</td><td>{percent(row.success_rate)}</td><td>{number(row.throughput_rps, " req/s")}</td><td>{number(row.latency_ms.p95, " ms")}</td><td>{number(row.inference_ms.p95, " ms")}</td></tr>)}
    </tbody></table></div></section>
  </div>;
}

function DemoMonitoring() {
  const snapshots = evidence.monitoring.map((item) => ({ ...item, p95: item.operational_signals.processing_p95_ms, errors: item.operational_signals.api_5xx_24h }));
  const current = snapshots.at(-1);
  return <div className="dashboard-page fade-in">
    <Header title="Giám sát vận hành">Tổng hợp các tín hiệu staging đã ghi nhận trong ngày 10–11/11/2026.</Header>
    <div className="dashboard-grid dashboard-grid--four"><Stat label="Snapshot đã lưu" value={snapshots.length} /><Stat label="Mẫu vận hành" value={number(current.operational_signals.operational_sample_size)} /><Stat label="API 5xx · 24 giờ" value={number(current.errors)} /><Stat label="Processing p95" value={number(current.p95, " ms")} /></div>
    <section className="panel chart-panel"><div className="panel-title"><h3>Processing p95 qua các snapshot</h3></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={260}><LineChart data={snapshots}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="checked_at" tickFormatter={(x) => new Date(x).toLocaleDateString("vi-VN")} /><YAxis unit=" ms" /><Tooltip labelFormatter={date} /><Line dataKey="p95" name="p95" stroke="#0071e3" strokeWidth={3} dot={{ r: 5 }} /></LineChart></ResponsiveContainer></div></section>
    <section className="panel chart-panel"><div className="table-wrap"><table className="history-table"><thead><tr><th>Thời gian</th><th>Mẫu</th><th>5xx</th><th>p95</th></tr></thead><tbody>{snapshots.map((row) => <tr key={row.checked_at}><td>{date(row.checked_at)}</td><td>{number(row.operational_signals.operational_sample_size)}</td><td>{number(row.errors)}</td><td>{number(row.p95, " ms")}</td></tr>)}</tbody></table></div></section>
  </div>;
}

function DemoReleases() {
  return <div className="dashboard-page fade-in"><Header title="Phát hành và thiết bị">Quản lý phiên bản model qua các bước kiểm định, phát hành và triển khai tới thiết bị.</Header>
    <div className="dashboard-grid dashboard-grid--four"><Stat label="Phiên bản model" value={evidence.manifest.version} /><Stat label="Trạng thái" value={evidence.manifest.release_status} /><Stat label="Run đánh giá" value={runs.length} /><Stat label="Run đã phát hành" value="0" /></div>
    <section className="panel chart-panel"><div className="panel-title"><h3>Quy trình phát hành</h3></div><p>Model trải qua đánh giá dữ liệu, release gate, kiểm tra artifact và khả năng rollback trước khi kích hoạt trên thiết bị.</p><p>Phiên bản đang hiển thị có trạng thái candidate và chưa được phát hành.</p></section>
  </div>;
}

function DemoUsers() {
  return <div className="dashboard-page fade-in"><Header title="Phân quyền hệ thống">Mỗi vai trò có phạm vi truy cập riêng cho nhận diện, phân tích và vận hành model.</Header>
    <section className="panel chart-panel"><div className="table-wrap"><table className="history-table"><thead><tr><th>Vai trò</th><th>Quyền trong hệ thống</th><th>Quyền trên demo</th></tr></thead><tbody><tr><td>Khách</td><td>Thử nhận diện ảnh</td><td>Xem toàn bộ báo cáo đã công bố</td></tr><tr><td>Analyst</td><td>Đối soát lịch sử và thống kê</td><td>Chỉ xem</td></tr><tr><td>Admin</td><td>Quản lý người dùng, MLOps và phát hành</td><td>Chỉ xem</td></tr></tbody></table></div></section>
  </div>;
}

export default function DemoWorkspace() {
  const { pathname } = useLocation();
  if (pathname === "/history") return <DemoHistory />;
  if (pathname === "/dashboard") return <DemoDashboard />;
  if (pathname === "/model-info") return <DemoModelInfo />;
  if (pathname === "/users") return <DemoUsers />;
  if (pathname === "/mlops/runs") return <DemoRuns />;
  if (pathname.startsWith("/mlops/runs/")) {
    const run = runs.find((item) => item.run_id === decodeURIComponent(pathname.split("/").at(-1)));
    return run ? <DemoRunDetail run={run} /> : <Navigate to="/mlops/runs" replace />;
  }
  if (pathname === "/mlops/compare") return <DemoCompare />;
  if (pathname === "/mlops/benchmarks") return <DemoBenchmarks />;
  if (pathname === "/mlops/monitoring") return <DemoMonitoring />;
  if (pathname === "/mlops/releases") return <DemoReleases />;
  return <Navigate to="/" replace />;
}
