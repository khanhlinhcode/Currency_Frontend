import { useContext, useEffect, useState } from "react";
import { AlertCircle, Brain, Database, LoaderCircle, ShieldCheck } from "lucide-react";
import axios from "../api/axios";
import AuthContext from "../context/AuthContext";

function valueOrFallback(value, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

export default function ModelInfo() {
  const { isAdmin } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [runs, setRuns] = useState([]);
  const [runError, setRunError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get("/model-info");
        setData(res.data ?? {});
      } catch (requestError) {
        const message = requestError.response?.data?.detail;
        setError(typeof message === "string" ? message : "Không thể tải thông tin mô hình.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchModelInfo();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    axios.get("/mlops/runs")
      .then((response) => setRuns(response.data?.runs || []))
      .catch(() => setRunError("Không thể tải hồ sơ MLOps đã lưu."));
  }, [isAdmin]);

  return (
    <div className="dashboard-page fade-in">
      <section className="hero-panel">
        <p className="panel-kicker">Model Metadata</p>
        <h2>Thông tin mô hình AI nhận diện tiền giấy</h2>
        <p>
          Phiên bản model, nhãn và bộ dữ liệu được lấy từ manifest phát hành cùng model.
          Chỉ số test sẽ xuất hiện khi có kết quả đánh giá thật được ghi vào manifest.
        </p>
      </section>

      {isLoading ? (
        <section className="panel empty-state">
          <LoaderCircle size={18} className="spin" />
          <p>Đang tải model metadata...</p>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section className="panel empty-state error">
          <AlertCircle size={18} />
          <p>{error}</p>
        </section>
      ) : null}

      {!isLoading && !error && data ? (
        <>
          <section className="dashboard-grid dashboard-grid--four">
            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <Brain size={18} />
                </span>
                <p>Model</p>
              </div>
              <h3>{valueOrFallback(data.model_version)}</h3>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <Database size={18} />
                </span>
                <p>Dataset Version</p>
              </div>
              <h3>{valueOrFallback(data.dataset_version)}</h3>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <ShieldCheck size={18} />
                </span>
                <p>Test Accuracy</p>
              </div>
              <h3>{data.test_metrics?.accuracy == null ? "Chưa đánh giá" : `${(data.test_metrics.accuracy * 100).toFixed(2)}%`}</h3>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <ShieldCheck size={18} />
                </span>
                <p>Số lớp</p>
              </div>
              <h3>{valueOrFallback(data.num_classes)}</h3>
            </article>
          </section>

          <section className="dashboard-charts-grid">
            <article className="panel chart-panel">
              <div className="panel-title">
                <Brain size={18} />
                <h3>Kiến trúc mô hình</h3>
              </div>
              <p className="model-info-line">
                <strong>Architecture:</strong> {valueOrFallback(data.architecture)}
              </p>
              <p className="model-info-line">
                <strong>Trạng thái phát hành:</strong> {valueOrFallback(data.release_status)}
              </p>
              <p className="model-info-line">
                <strong>Framework:</strong> {valueOrFallback(data.framework)}
              </p>
              <p className="model-info-line">
                <strong>Num Classes:</strong> {valueOrFallback(data.num_classes)}
              </p>
              <p className="model-info-line">
                <strong>Confidence Threshold:</strong>{" "}
                {valueOrFallback(data.confidence_threshold)}
              </p>
              <p className="model-info-line">
                <strong>Test macro F1:</strong> {data.test_metrics?.macro_f1 == null ? "Chưa đánh giá" : `${(data.test_metrics.macro_f1 * 100).toFixed(2)}%`}
              </p>
              <p className="model-info-line">
                <strong>ECE (10 bins):</strong> {data.test_metrics?.ece_10_bins == null ? "Chưa đánh giá" : data.test_metrics.ece_10_bins.toFixed(3)}
              </p>
              <p className="model-info-line">
                <strong>Accuracy khi confidence đạt ngưỡng:</strong> {data.test_metrics?.accepted_accuracy == null ? "Chưa đánh giá" : `${(data.test_metrics.accepted_accuracy * 100).toFixed(2)}%`}
              </p>
            </article>

            <article className="panel chart-panel chart-panel--full">
              <div className="panel-title">
                <Database size={18} />
                <h3>Danh sách classes</h3>
              </div>

              <div className="classes-grid">
                {(data.classes || []).map((item) => (
                  <span className="class-chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          </section>

          {isAdmin ? (
            <section className="panel chart-panel">
              <div className="panel-title"><Database size={18} /><h3>Hồ sơ huấn luyện và đánh giá đã lưu</h3></div>
              {runError ? <p>{runError}</p> : runs.length ? (
                <div className="classes-grid">
                  {runs.map((run) => (
                    <article className="panel" key={run.run_id}>
                      <strong>{run.run_id}</strong>
                      <p>Trạng thái: {run.status} · Model: {run.model_version}</p>
                      <p>Dataset: {run.dataset_version} · Nhóm đã xác minh: {run.group_split_verified ? "Có" : "Chưa"}</p>
                      <p>Accuracy: {run.accuracy == null ? "--" : `${(run.accuracy * 100).toFixed(2)}%`} · Macro F1: {run.macro_f1 == null ? "--" : `${(run.macro_f1 * 100).toFixed(2)}%`}</p>
                      <p>Inference p95: {run.inference_p95_ms == null ? "--" : `${run.inference_p95_ms.toFixed(1)} ms`}</p>
                    </article>
                  ))}
                </div>
              ) : <p>Chưa có run nào được lưu lên kho riêng. Model hiện tại vẫn là candidate.</p>}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
