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

function Header({ eyebrow, title, children }) {
  return <section className="hero-panel"><p className="panel-kicker">{eyebrow}</p><h2>{title}</h2><p>{children}</p></section>;
}

function SourceNote() {
  return <section className="panel demo-source-note"><strong>Nguồn số liệu:</strong> {evidence.source_note} Model hiện là candidate; các kết quả test cũ có trùng ảnh giữa các tập và chưa xác minh nhóm tờ tiền vật lý.</section>;
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
    <Header eyebrow="Portfolio evidence" title="Tổng quan model và MLOps">Biểu đồ dưới đây lấy từ run chẩn đoán và benchmark đã lưu, để người xem khám phá hệ thống mà không cần đăng nhập.</Header>
    <div className="dashboard-grid dashboard-grid--four">
      <Stat label="Model" value={latest.model_version} detail="Candidate · chưa phê duyệt" />
      <Stat label="Accuracy test cũ" value={percent(latest.accuracy)} detail="Chỉ số chẩn đoán" />
      <Stat label="Macro F1 test cũ" value={percent(latest.macro_f1)} detail="Chỉ số chẩn đoán" />
      <Stat label="Số lớp nhận diện" value={evidence.manifest.class_names.length} detail="3 quốc gia" />
    </div>
    <div className="dashboard-charts-grid">
      <section className="panel chart-panel"><div className="panel-title"><h3>F1 trung bình theo quốc gia · tập test cũ</h3></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={270}><BarChart data={classes}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Bar dataKey="f1" name="F1 (%)" fill="#4dd6bf" /></BarChart></ResponsiveContainer></div>
      </section>
      <section className="panel chart-panel"><div className="panel-title"><h3>Mẫu test theo quốc gia</h3></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={270}><BarChart data={classes}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="samples" name="Số ảnh" fill="#84b6ff" /></BarChart></ResponsiveContainer></div>
      </section>
      <section className="panel chart-panel chart-panel--full"><div className="panel-title"><h3>HTTP p95 trên Render Free · 10/11/2026</h3></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height={280}><LineChart data={benchmarks}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="concurrency" label={{ value: "Số request đồng thời", position: "insideBottom", offset: -2 }} /><YAxis unit=" ms" /><Tooltip /><Legend /><Line type="monotone" dataKey="latency_ms.p95" name="HTTP p95 (ms)" stroke="#f8b367" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
      </section>
    </div>
    <SourceNote />
  </div>;
}

function DemoModelInfo() {
  const m = evidence.manifest;
  return <div className="dashboard-page fade-in">
    <Header eyebrow="Model metadata" title="Thông tin mô hình">Metadata của model đang dùng cho demo và kết quả đánh giá chẩn đoán đã lưu.</Header>
    <div className="dashboard-grid dashboard-grid--four">
      <Stat label="Phiên bản" value={m.version} />
      <Stat label="Kiến trúc" value={m.architecture} />
      <Stat label="Framework" value={m.framework} />
      <Stat label="Trạng thái" value={m.release_status} />
    </div>
    <section className="panel chart-panel"><div className="panel-title"><h3>Thông số đầu vào</h3></div>
      <p>Kích thước: {m.input_size.join(" × ")} · Ngưỡng confidence: {percent(m.confidence_threshold)} · Dataset: {m.dataset_version}</p>
      <p>Test accuracy: {m.test_metrics?.accuracy == null ? "Chưa có kết quả đã duyệt" : percent(m.test_metrics.accuracy)}. Run chẩn đoán cũ đạt {percent(latest.accuracy)} nhưng chưa vượt qua kiểm tra chất lượng dữ liệu.</p>
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>{m.class_names.length} lớp nhận diện</h3></div>
      <div className="classes-grid">{m.class_names.map((name) => <span className="class-chip" key={name}>{name}</span>)}</div>
    </section>
    <SourceNote />
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
    <Header eyebrow="Demo session" title="Lịch sử nhận diện trong phiên">Lượt thử của khách chỉ nằm trong tab trình duyệt này. Ảnh và kết quả không được ghi vào lịch sử backend.</Header>
    <section className="panel chart-panel"><div className="panel-title"><h3>{items.length} lượt thử gần nhất</h3></div>
      {items.length ? <div className="table-wrap"><table className="history-table"><thead><tr><th>Thời gian</th><th>Dự đoán</th><th>Confidence</th><th>Trạng thái</th><th>Model</th></tr></thead><tbody>
        {items.map((item, index) => <tr key={`${item.at}-${index}`}><td>{date(item.at)}</td><td>{item.prediction}</td><td>{percent(item.confidence)}</td><td>{item.suspicious ? "Cần xem lại" : "Bình thường"}</td><td>{item.model_version}</td></tr>)}
      </tbody></table></div> : <p>Chưa có lượt thử trong phiên này. <Link to="/">Chọn ảnh để nhận diện</Link>.</p>}
    </section>
  </div>;
}

function DemoRuns() {
  return <div className="dashboard-page fade-in">
    <Header eyebrow="MLOps registry" title="Hồ sơ huấn luyện và đánh giá">Các run dưới đây là bằng chứng chẩn đoán đã lưu. Chưa có run nào được phê duyệt phát hành.</Header>
    <section className="panel chart-panel"><div className="panel-title"><h3>{runs.length} run đã lưu</h3></div>
      <div className="table-wrap"><table className="history-table"><thead><tr><th>Run</th><th>Ghi nhận</th><th>Model</th><th>Accuracy</th><th>Macro F1</th><th>Gate</th></tr></thead><tbody>
        {runs.map((run) => <tr key={run.run_id}><td><Link to={`/mlops/runs/${run.run_id}`}>{run.run_id}</Link></td><td>{date(run.recorded_at)}</td><td>{run.model_version}</td><td>{percent(run.accuracy)}</td><td>{percent(run.macro_f1)}</td><td>Chưa đánh giá</td></tr>)}
      </tbody></table></div>
    </section><SourceNote />
  </div>;
}

function DemoRunDetail({ run }) {
  const classes = Object.entries(run.evaluation.per_class || {}).map(([name, item]) => ({ name, f1: item.f1 ?? item["f1-score"], support: item.support }));
  return <div className="dashboard-page fade-in">
    <Header eyebrow="MLOps run detail" title={run.run_id}>Model {run.model_version} · {date(run.recorded_at)} · run chẩn đoán, chưa đạt release gate.</Header>
    <div className="dashboard-grid dashboard-grid--four">
      <Stat label="Accuracy" value={percent(run.accuracy)} /><Stat label="Macro F1" value={percent(run.macro_f1)} />
      <Stat label="ECE" value={number(run.ece_10_bins)} /><Stat label="Mẫu test" value={number(run.evaluation.test_samples)} />
    </div>
    <section className="panel chart-panel"><div className="panel-title"><h3>Kiểm tra dữ liệu</h3></div>
      <p>Nhóm tờ tiền vật lý: {run.audit.group_split_verified ? "Đã xác minh" : "Chưa xác minh"} · Ảnh trùng qua các tập: {number(run.audit.exact_cross_split_duplicates)} · Nhóm nhãn mâu thuẫn: {number(run.audit.conflicting_label_groups)}</p>
      <p>Inference p95 đo cục bộ: {number(run.benchmark.p95_ms, " ms")} · {number(run.benchmark.runs)} lượt.</p>
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>F1 theo lớp · tập test cũ</h3></div>
      <div className="table-wrap"><table className="history-table"><thead><tr><th>Lớp</th><th>F1</th><th>Số mẫu</th></tr></thead><tbody>{classes.map((item) => <tr key={item.name}><td>{item.name}</td><td>{percent(item.f1)}</td><td>{number(item.support)}</td></tr>)}</tbody></table></div>
    </section><p><Link to="/mlops/runs">← Tất cả run</Link></p><SourceNote />
  </div>;
}

function DemoCompare() {
  const fields = [["Accuracy", "accuracy"], ["Macro F1", "macro_f1"], ["Accepted coverage", "accepted_coverage"], ["Accepted accuracy", "accepted_accuracy"]];
  return <div className="dashboard-page fade-in">
    <Header eyebrow="Model comparison" title="So sánh các run chẩn đoán">Hai run dùng tập dữ liệu cũ chưa xác minh nhóm vật lý. Chỉ số dưới đây giúp xem quy trình đánh giá, không chứng minh độ chính xác khi triển khai.</Header>
    <section className="panel chart-panel"><div className="table-wrap"><table className="history-table"><thead><tr><th>Chỉ số</th>{runs.map((run) => <th key={run.run_id}>{run.run_id}</th>)}</tr></thead><tbody>
      {fields.map(([label, key]) => <tr key={key}><td>{label}</td>{runs.map((run) => <td key={run.run_id}>{percent(run[key])}</td>)}</tr>)}
      <tr><td>Inference p95 cục bộ</td>{runs.map((run) => <td key={run.run_id}>{number(run.inference_p95_ms, " ms")}</td>)}</tr>
      <tr><td>Group split verified</td>{runs.map((run) => <td key={run.run_id}>{run.group_split_verified ? "Có" : "Chưa"}</td>)}</tr>
    </tbody></table></div></section><SourceNote />
  </div>;
}

function DemoBenchmarks() {
  return <div className="dashboard-page fade-in">
    <Header eyebrow="Performance evidence" title="Benchmark Render Free">Ba phép đo HTTP staging ngày 10/11/2026, mỗi phép đo 100 request. P95 tăng khi số request đồng thời tăng.</Header>
    <div className="dashboard-charts-grid"><section className="panel chart-panel chart-panel--full"><div className="panel-title"><h3>Độ trễ HTTP p50 / p95 theo mức đồng thời</h3></div>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height={300}><LineChart data={benchmarks}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="concurrency" /><YAxis unit=" ms" /><Tooltip /><Legend /><Line dataKey="latency_ms.p50" name="p50" stroke="#4dd6bf" strokeWidth={3} /><Line dataKey="latency_ms.p95" name="p95" stroke="#f8b367" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
    </section></div>
    <section className="panel chart-panel"><div className="table-wrap"><table className="history-table"><thead><tr><th>Đồng thời</th><th>Lượt</th><th>Thành công</th><th>Thông lượng</th><th>HTTP p95</th><th>Inference p95</th></tr></thead><tbody>
      {benchmarks.map((row) => <tr key={row.concurrency}><td>{row.concurrency}</td><td>{row.runs}</td><td>{percent(row.success_rate)}</td><td>{number(row.throughput_rps, " req/s")}</td><td>{number(row.latency_ms.p95, " ms")}</td><td>{number(row.inference_ms.p95, " ms")}</td></tr>)}
    </tbody></table></div></section><SourceNote />
  </div>;
}

function DemoMonitoring() {
  const snapshots = evidence.monitoring.map((item) => ({ ...item, p95: item.operational_signals.processing_p95_ms, errors: item.operational_signals.api_5xx_24h }));
  const current = snapshots.at(-1);
  return <div className="dashboard-page fade-in">
    <Header eyebrow="Operations monitoring" title="Tín hiệu staging đã lưu">Snapshot giám sát ngày 10–11/11/2026. Mẫu vận hành còn quá ít để kết luận drift hoặc độ đúng production.</Header>
    <div className="dashboard-grid dashboard-grid--four"><Stat label="Trạng thái model" value="Chưa đủ dữ liệu" /><Stat label="Mẫu vận hành" value={number(current.operational_signals.operational_sample_size)} /><Stat label="API 5xx · 24 giờ" value={number(current.errors)} /><Stat label="Processing p95" value={number(current.p95, " ms")} /></div>
    <section className="panel chart-panel"><div className="panel-title"><h3>Processing p95 qua các snapshot</h3></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={260}><LineChart data={snapshots}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="checked_at" tickFormatter={(x) => new Date(x).toLocaleDateString("vi-VN")} /><YAxis unit=" ms" /><Tooltip labelFormatter={date} /><Line dataKey="p95" name="p95" stroke="#84b6ff" strokeWidth={3} /></LineChart></ResponsiveContainer></div></section>
    <section className="panel chart-panel"><div className="table-wrap"><table className="history-table"><thead><tr><th>Thời gian</th><th>Monitoring</th><th>Mẫu</th><th>5xx</th><th>p95</th></tr></thead><tbody>{snapshots.map((row) => <tr key={row.checked_at}><td>{date(row.checked_at)}</td><td>Chưa đủ dữ liệu</td><td>{number(row.operational_signals.operational_sample_size)}</td><td>{number(row.errors)}</td><td>{number(row.p95, " ms")}</td></tr>)}</tbody></table></div></section><SourceNote />
  </div>;
}

function DemoReleases() {
  return <div className="dashboard-page fade-in"><Header eyebrow="Release control" title="Phát hành model và thiết bị">Luồng phát hành có kiểm tra dữ liệu, release gate, artifact hash và rollback. Demo này chỉ hiển thị trạng thái đã lưu.</Header>
    <div className="dashboard-grid dashboard-grid--four"><Stat label="Model demo" value={evidence.manifest.version} /><Stat label="Trạng thái" value={evidence.manifest.release_status} /><Stat label="Run chẩn đoán đã lưu" value={runs.length} /><Stat label="Run được duyệt trong snapshot" value="0" /></div>
    <section className="panel chart-panel"><div className="panel-title"><h3>Điều kiện phát hành</h3></div><p>Run mới cần xác minh nhóm tờ tiền vật lý, kiểm tra dữ liệu, đánh giá độc lập và vượt release gate trước khi kích hoạt cho thiết bị.</p><p>Hai run đã lưu đều là chẩn đoán; chưa có bằng chứng đủ điều kiện phát hành.</p></section><SourceNote />
  </div>;
}

function DemoUsers() {
  return <div className="dashboard-page fade-in"><Header eyebrow="Access control" title="Phân quyền hệ thống">Trang demo cho xem chức năng phân quyền. Danh sách tài khoản thật và thao tác tạo, sửa, xóa chỉ dành cho người quản trị.</Header>
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
