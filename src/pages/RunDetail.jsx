import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../api/axios";
import { date, downloadReport, number, percent, statusLabel } from "./mlops";

export default function RunDetail() {
  const { runId } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    axios.get(`/mlops/runs/${encodeURIComponent(runId)}`)
      .then(({ data }) => { if (active) setDetail(data); })
      .catch(() => { if (active) setError("Không tải được run hoặc bằng chứng đã lưu."); });
    return () => { active = false; };
  }, [runId]);
  if (error) return <section className="panel empty-state error">{error}</section>;
  if (!detail) return <section className="panel empty-state">Đang tải hồ sơ run...</section>;
  const { summary, artifacts } = detail;
  const evaluation = artifacts.evaluation || {};
  const audit = artifacts.audit || {};
  const benchmark = artifacts.benchmark || {};
  const gate = artifacts.release_gate;
  const perClass = evaluation.per_class || {};
  const base = `/mlops/runs/${encodeURIComponent(runId)}`;
  const reports = ["run", "manifest", "audit", "evaluation", "benchmark", "training_config", "quality_gates", "release_gate"];

  return <div className="dashboard-page fade-in">
    <section className="hero-panel"><p className="panel-kicker">MLOps Run Detail</p>
      <h2>{summary.run_id}</h2><p>Model {summary.model_version} · Dataset {summary.dataset_version} · {statusLabel(summary.status)} · {date(summary.recorded_at)}</p>
      {summary.status === "diagnostic" ? <p>Run này dùng tập dữ liệu cũ; các chỉ số chỉ phục vụ chẩn đoán.</p> : null}
    </section>
    <section className="dashboard-grid dashboard-grid--four">
      <article className="panel stat-card"><p>Test accuracy</p><h3>{percent(evaluation.accuracy)}</h3></article>
      <article className="panel stat-card"><p>Macro F1</p><h3>{percent(evaluation.macro_f1)}</h3></article>
      <article className="panel stat-card"><p>ECE</p><h3>{number(evaluation.ece_10_bins)}</h3></article>
      <article className="panel stat-card"><p>Accepted coverage</p><h3>{percent(evaluation.accepted_coverage)}</h3></article>
    </section>
    <section className="dashboard-grid dashboard-grid--four">
      <article className="panel stat-card"><p>Inference p50</p><h3>{number(benchmark.p50_ms, " ms")}</h3></article>
      <article className="panel stat-card"><p>Inference p95</p><h3>{number(benchmark.p95_ms, " ms")}</h3></article>
      <article className="panel stat-card"><p>Inference p99</p><h3>{number(benchmark.p99_ms, " ms")}</h3></article>
      <article className="panel stat-card"><p>Số lượt benchmark</p><h3>{number(benchmark.runs)}</h3></article>
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>Bằng chứng dữ liệu và phát hành</h3></div>
      <p>Audit nhóm vật lý: {audit.group_split_verified ? "Đạt" : "Chưa xác minh"} · Manifest v2: {audit.dataset_manifest_verified ? "Đạt" : "Chưa có"} · Ảnh trùng qua split: {number(audit.exact_cross_split_duplicates)} · Nhóm nhãn mâu thuẫn: {number(audit.conflicting_label_groups)}</p>
      <p>Release gate: {gate ? gate.passed ? "Đạt" : "Không đạt" : "Chưa đánh giá"} · Git commit: {summary.git_commit || "Chưa ghi nhận"}</p>
      {gate?.failures?.length ? <ul>{gate.failures.map((failure) => <li key={failure}>{failure}</li>)}</ul> : null}
      <p><Link to="/mlops/compare">So sánh với model khác</Link></p>
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>Chỉ số từng lớp trên tập test</h3></div>
      {!Object.keys(perClass).length ? <p>Chưa có dữ liệu từng lớp.</p> : <div className="table-wrap"><table className="history-table"><thead><tr><th>Lớp</th><th>Precision</th><th>Recall</th><th>F1</th><th>Số ảnh</th></tr></thead>
        <tbody>{Object.entries(perClass).map(([label, value]) => <tr key={label}><td>{label}</td><td>{percent(value.precision)}</td><td>{percent(value.recall)}</td><td>{percent(value["f1-score"])}</td><td>{number(value.support)}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>Tải báo cáo đã kiểm hash</h3></div>
      <div className="mlops-actions">{reports.filter((name) => name === "run" || artifacts[name]).map((name) =>
        <button type="button" className="table-btn" key={name} onClick={() => downloadReport(`${base}/artifacts/${name}`, `${runId}-${name}.json`).catch(() => setError("Không tải được artifact."))}>{name}.json</button>)}
        {Object.keys(perClass).length ? <button type="button" className="table-btn" onClick={() => downloadReport(`${base}/metrics.csv`, `${runId}-metrics.csv`).catch(() => setError("Không tải được CSV."))}>metrics.csv</button> : null}
        {artifacts.training_config ? <button type="button" className="table-btn" onClick={() => downloadReport(`${base}/artifacts/training_history`, `${runId}-training-history.csv`).catch(() => setError("Không tải được lịch sử epoch."))}>training-history.csv</button> : null}
      </div>
    </section>
  </div>;
}
