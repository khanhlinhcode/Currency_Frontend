import { useEffect, useState } from "react";
import { AlertCircle, Brain, Database, LoaderCircle, ShieldCheck } from "lucide-react";
import axios from "../api/axios";

function valueOrFallback(value, fallback = "--") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

export default function ModelInfo() {
  const [data, setData] = useState(null);
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

  return (
    <div className="dashboard-page fade-in">
      <section className="hero-panel">
        <p className="panel-kicker">Model Metadata</p>
        <h2>Thông tin mô hình AI nhận diện tiền giấy</h2>
        <p>
          Theo dõi kiến trúc mô hình, quy mô dữ liệu huấn luyện, số lớp nhận diện và
          mốc huấn luyện gần nhất để kiểm soát chất lượng inference.
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
              <h3>{valueOrFallback(data.model_name)}</h3>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <Database size={18} />
                </span>
                <p>Dataset Size</p>
              </div>
              <h3>{valueOrFallback(data.dataset_size)}</h3>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <ShieldCheck size={18} />
                </span>
                <p>Training Accuracy</p>
              </div>
              <h3>{valueOrFallback(data.training_accuracy)}</h3>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <ShieldCheck size={18} />
                </span>
                <p>Last Training Date</p>
              </div>
              <h3>{valueOrFallback(data.last_training_date)}</h3>
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
                <strong>Framework:</strong> {valueOrFallback(data.framework)}
              </p>
              <p className="model-info-line">
                <strong>Num Classes:</strong> {valueOrFallback(data.num_classes)}
              </p>
              <p className="model-info-line">
                <strong>Confidence Threshold:</strong>{" "}
                {valueOrFallback(data.confidence_threshold)}
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
        </>
      ) : null}
    </div>
  );
}
