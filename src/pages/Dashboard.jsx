import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  LoaderCircle,
  Radar,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "../api/axios";

const PIE_COLORS = ["#4dd6bf", "#f8b367", "#ff8f8f", "#84b6ff", "#d1b0ff", "#9be17c"];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMetric(value) {
  if (typeof value === "number") {
    return new Intl.NumberFormat("vi-VN").format(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return new Intl.NumberFormat("vi-VN").format(parsed);
    }
    return value;
  }

  return "--";
}

function shortDateLabel(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async (withLoading = false) => {
    try {
      if (withLoading) setIsLoading(true);
      const res = await axios.get("/stats");
      setStats(res.data ?? {});
      setError("");
    } catch (requestError) {
      const message = requestError.response?.data?.detail;
      setError(
        typeof message === "string"
          ? message
          : "Không thể tải dữ liệu dashboard.",
      );
    } finally {
      if (withLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);

    const refreshInterval = window.setInterval(() => {
      fetchStats(false);
    }, 15000);

    const onPredictionCreated = () => {
      fetchStats(false);
    };

    const onWindowFocus = () => {
      fetchStats(false);
    };

    window.addEventListener("prediction-created", onPredictionCreated);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("prediction-created", onPredictionCreated);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [fetchStats]);

  const totalPredictions = toNumber(stats?.total_predictions);
  const suspiciousCount = toNumber(stats?.suspicious_count);
  const normalCount = Math.max(totalPredictions - suspiciousCount, 0);

  const currencyDistributionData = useMemo(() => {
    const distribution = stats?.currency_distribution || {};
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value: toNumber(value),
    }));
  }, [stats?.currency_distribution]);

  const predictionsOverTimeData = useMemo(() => {
    const rows = Array.isArray(stats?.predictions_per_day)
      ? stats.predictions_per_day
      : [];

    return rows.map((item) => ({
      date: item.date,
      count: toNumber(item.count),
    }));
  }, [stats?.predictions_per_day]);

  const suspiciousVsNormalData = useMemo(
    () => [
      { name: "Normal", count: normalCount },
      { name: "Suspicious", count: suspiciousCount },
    ],
    [normalCount, suspiciousCount],
  );

  return (
    <div className="dashboard-page fade-in">
      <section className="hero-panel">
        <p className="panel-kicker">Operations Command Center</p>
        <h2>Dashboard phân tích mô hình nhận diện tiền giấy</h2>
        <p>
          Theo dõi lượt nhận diện, tốc độ xử lý và độ đúng trên các bản ghi đã được kiểm tra.
          Các trường hợp cần xem lại chỉ phản ánh độ tin cậy thấp, không xác thực tiền giả.
          {stats?.legacy_predictions ? ` Có ${stats.legacy_predictions} bản ghi cũ chưa xác minh và không tính vào các chỉ số này.` : ""}
        </p>
      </section>

      {isLoading ? (
        <section className="panel empty-state">
          <LoaderCircle size={18} className="spin" />
          <p>Đang tải thống kê...</p>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section className="panel empty-state error">
          <AlertCircle size={18} />
          <p>{error}</p>
        </section>
      ) : null}

      {!isLoading && !error ? (
        <>
          <section className="dashboard-grid dashboard-grid--four">
            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <Radar size={18} />
                </span>
                <p>Tổng lượt nhận diện</p>
              </div>
              <h3>{formatMetric(stats?.total_predictions)}</h3>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <TrendingUp size={18} />
                </span>
                <p>Inference p95 · 1000 lượt gần nhất</p>
              </div>
              <h3>{stats?.inference_latency?.p95_ms == null ? "--" : `${formatMetric(stats.inference_latency.p95_ms)} ms`}</h3>
              <p>{formatMetric(stats?.inference_latency_sample_size)} lượt có đo riêng model</p>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <ShieldAlert size={18} />
                </span>
                <p>Cần xem lại</p>
              </div>
              <h3>{formatMetric(suspiciousCount)}</h3>
            </article>

            <article className="panel stat-card">
              <div className="stat-card__head">
                <span className="stat-card__icon">
                  <TrendingUp size={18} />
                </span>
                <p>Số loại tiền đã nhận diện</p>
              </div>
              <h3>{formatMetric(stats?.detected_currencies_count)}</h3>
            </article>
          </section>

          <section className="dashboard-grid dashboard-grid--four">
            <article className="panel stat-card">
              <div className="stat-card__head"><p>Model đang chạy</p></div>
              <h3>{stats?.model_version || "--"}</h3>
            </article>
            <article className="panel stat-card">
              <div className="stat-card__head"><p>Chờ model p95</p></div>
              <h3>{stats?.queue_latency?.p95_ms == null ? "--" : `${formatMetric(stats.queue_latency.p95_ms)} ms`}</h3>
              <p>{formatMetric(stats?.inference_latency_sample_size)} lượt có đo hàng đợi</p>
            </article>
            <article className="panel stat-card">
              <div className="stat-card__head"><p>Tổng xử lý p95</p></div>
              <h3>{stats?.processing_latency?.p95_ms == null ? "--" : `${formatMetric(stats.processing_latency.p95_ms)} ms`}</h3>
            </article>
            <article className="panel stat-card">
              <div className="stat-card__head"><p>Độ đúng bản ghi đã duyệt</p></div>
              <h3>{stats?.reviewed_accuracy == null ? "--" : `${(stats.reviewed_accuracy * 100).toFixed(1)}%`}</h3>
              <p>{formatMetric(stats?.reviewed_count)} bản ghi; không đại diện cho test set</p>
            </article>
          </section>

          <section className="dashboard-charts-grid">
            <article className="panel chart-panel">
              <div className="panel-title">
                <Radar size={18} />
                <h3>Currency Distribution (Pie)</h3>
              </div>

              {!currencyDistributionData.length ? (
                <div className="empty-state">
                  <p>Chưa có dữ liệu phân bố loại tiền.</p>
                </div>
              ) : (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={290}>
                    <PieChart>
                      <Pie
                        data={currencyDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={92}
                        label
                      >
                        {currencyDistributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="panel chart-panel">
              <div className="panel-title">
                <TrendingUp size={18} />
                <h3>Predictions Over Time (Line)</h3>
              </div>

              {!predictionsOverTimeData.length ? (
                <div className="empty-state">
                  <p>Chưa có dữ liệu theo ngày.</p>
                </div>
              ) : (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={290}>
                    <LineChart data={predictionsOverTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,220,210,0.18)" />
                      <XAxis dataKey="date" tickFormatter={shortDateLabel} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#4dd6bf"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        name="Predictions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="panel chart-panel chart-panel--full">
              <div className="panel-title">
                <ShieldAlert size={18} />
                <h3>Suspicious vs Normal (Bar)</h3>
              </div>

              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={suspiciousVsNormalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(170,220,210,0.18)" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {suspiciousVsNormalData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.name === "Suspicious" ? "#ff8f8f" : "#4dd6bf"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
