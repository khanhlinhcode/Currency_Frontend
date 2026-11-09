import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { date, number, percent, statusLabel } from "./mlops";

export default function MLOpsRuns() {
  const [runs, setRuns] = useState([]);
  const [total, setTotal] = useState(0);
  const [modelVersion, setModelVersion] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ limit: "100" });
    if (modelVersion.trim()) params.set("model_version", modelVersion.trim());
    if (status) params.set("status", status);
    axios.get(`/mlops/runs?${params}`)
      .then(({ data }) => { if (active) { setRuns(data.runs || []); setTotal(data.total || 0); setError(""); } })
      .catch(() => { if (active) setError("Không tải được hồ sơ MLOps."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [modelVersion, status]);

  return <div className="dashboard-page fade-in">
    <section className="hero-panel"><p className="panel-kicker">MLOps Registry</p>
      <h2>Hồ sơ huấn luyện và đánh giá</h2>
      <p>Metadata được truy vấn từ PostgreSQL; bằng chứng và artifact lưu trong kho riêng tư. Run chẩn đoán không phải kết quả phát hành.</p>
    </section>
    <section className="panel history-filters"><div className="history-filter-grid">
      <label className="history-filter-field"><span>Phiên bản model</span><input value={modelVersion} onChange={(event) => setModelVersion(event.target.value)} placeholder="Ví dụ: 1.1.0" /></label>
      <label className="history-filter-field"><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="">Tất cả</option><option value="diagnostic">Chẩn đoán</option><option value="candidate">Ứng viên</option><option value="approved">Đã duyệt</option>
      </select></label>
    </div></section>
    <section className="panel chart-panel"><div className="panel-title"><h3>{number(total)} run</h3></div>
      {loading ? <p>Đang tải...</p> : error ? <p className="mlops-error">{error}</p> : !runs.length ? <p>Chưa có run phù hợp.</p> :
      <div className="table-wrap"><table className="history-table"><thead><tr><th>Run</th><th>Ghi nhận</th><th>Model / Dataset</th><th>Trạng thái</th><th>Test accuracy</th><th>Macro F1</th><th>Gate</th></tr></thead>
        <tbody>{runs.map((run) => <tr key={run.run_id}>
          <td><Link to={`/mlops/runs/${encodeURIComponent(run.run_id)}`}>{run.run_id}</Link></td>
          <td>{date(run.recorded_at)}</td><td>{run.model_version}<br />{run.dataset_version}</td>
          <td>{statusLabel(run.status)}</td><td>{percent(run.accuracy)}</td><td>{percent(run.macro_f1)}</td>
          <td>{run.release_gate_passed == null ? "Chưa đánh giá" : run.release_gate_passed ? "Đạt" : "Không đạt"}</td>
        </tr>)}</tbody></table></div>}
    </section>
  </div>;
}
