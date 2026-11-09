import { useEffect, useState } from "react";
import axios from "../api/axios";
import { number, percent, statusLabel } from "./mlops";

const metrics = [
  ["Accuracy tập test", "accuracy", percent], ["Macro F1", "macro_f1", percent],
  ["ECE", "ece_10_bins", number], ["Accepted coverage", "accepted_coverage", percent],
  ["Accepted accuracy", "accepted_accuracy", percent],
];

export default function CompareModels() {
  const [runs, setRuns] = useState([]);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/mlops/runs?limit=100")
      .then(({ data }) => setRuns(data.runs || []))
      .catch(() => setError("Không tải được danh sách run."));
  }, []);
  useEffect(() => {
    if (!leftId || !rightId) return;
    let active = true;
    Promise.all([leftId, rightId].map((id) => axios.get(`/mlops/runs/${encodeURIComponent(id)}`)))
      .then((responses) => { if (active) { setDetails(responses.map((response) => response.data)); setError(""); } })
      .catch(() => { if (active) setError("Không tải được báo cáo so sánh."); });
    return () => { active = false; };
  }, [leftId, rightId]);

  const [left, right] = leftId && rightId ? details || [] : [];
  const comparable = left && right && left.summary.dataset_version === right.summary.dataset_version
    && left.artifacts.audit?.dataset_manifest_verified && right.artifacts.audit?.dataset_manifest_verified;
  return <div className="dashboard-page fade-in">
    <section className="hero-panel"><p className="panel-kicker">Model Comparison</p><h2>So sánh hai lần đánh giá</h2>
      <p>Chỉ so sánh chất lượng như cùng một phép đo khi cả hai run dùng cùng dataset đã xác minh. Benchmark cần cùng phần cứng và điều kiện tải.</p></section>
    <section className="panel history-filters"><div className="history-filter-grid">
      {[[leftId, setLeftId, "Run A"], [rightId, setRightId, "Run B"]].map(([value, setter, label]) =>
        <label className="history-filter-field" key={label}><span>{label}</span><select value={value} onChange={(event) => setter(event.target.value)}>
          <option value="">Chọn run</option>{runs.map((run) => <option key={run.run_id} value={run.run_id}>{run.run_id} · {run.model_version}</option>)}
        </select></label>)}
    </div></section>
    {error ? <section className="panel empty-state error">{error}</section> : null}
    {left && right ? <>
      {!comparable ? <section className="panel mlops-warning">Hai run chưa có cùng dataset v2 được xác minh; không suy ra model nào tốt hơn từ các chỉ số này.</section> : null}
      <section className="panel chart-panel"><div className="table-wrap"><table className="history-table"><thead><tr><th>Chỉ số</th><th>{left.summary.model_version} · {statusLabel(left.summary.status)}</th><th>{right.summary.model_version} · {statusLabel(right.summary.status)}</th></tr></thead>
        <tbody><tr><td>Dataset</td><td>{left.summary.dataset_version}</td><td>{right.summary.dataset_version}</td></tr>
          {metrics.map(([label, field, format]) => <tr key={field}><td>{label}</td><td>{format(left.artifacts.evaluation?.[field])}</td><td>{format(right.artifacts.evaluation?.[field])}</td></tr>)}
          <tr><td>Inference p95</td><td>{number(left.artifacts.benchmark?.p95_ms, " ms")}</td><td>{number(right.artifacts.benchmark?.p95_ms, " ms")}</td></tr>
          <tr><td>Release gate</td><td>{left.artifacts.release_gate?.passed ? "Đạt" : "Chưa đạt"}</td><td>{right.artifacts.release_gate?.passed ? "Đạt" : "Chưa đạt"}</td></tr>
        </tbody></table></div></section>
    </> : <section className="panel empty-state">Chọn hai run để xem chỉ số.</section>}
  </div>;
}
