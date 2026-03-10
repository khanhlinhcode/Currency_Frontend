import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertCircle,
  CalendarClock,
  Download,
  Eye,
  FileDown,
  FileText,
  Filter,
  History as HistoryIcon,
  LoaderCircle,
  ScanSearch,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import axios from "../api/axios";

const CURRENCY_OPTIONS = [
  { value: "", label: "Tất cả currency" },
  { value: "vietnam", label: "Vietnam" },
  { value: "usa", label: "USA" },
  { value: "india", label: "India" },
  { value: "unknown", label: "Unknown" },
];

function normalizeConfidence(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return 0;
  return number <= 1 ? number * 100 : number;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "--";
  return date.toLocaleString("vi-VN");
}

function confidenceLevel(percent) {
  if (percent >= 80) return "high";
  if (percent >= 60) return "medium";
  return "low";
}

function buildHistoryParams({ page, pageSize, search, suspicious, currency, dateFrom, dateTo }) {
  const params = {
    page,
    page_size: pageSize,
  };

  if (search.trim()) params.search = search.trim();
  if (suspicious !== "all") params.suspicious = suspicious === "true";
  if (currency) params.currency = currency;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  return params;
}

function getErrorMessage(requestError, fallback) {
  const detail = requestError.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [suspicious, setSuspicious] = useState("all");
  const [currency, setCurrency] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailRecord, setDetailRecord] = useState(null);

  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [suspicious, currency, dateFrom, dateTo, pageSize]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const params = buildHistoryParams({
          page,
          pageSize,
          search: debouncedSearch,
          suspicious,
          currency,
          dateFrom,
          dateTo,
        });

        const res = await axios.get("/history", { params });
        const payload = res.data ?? {};

        setRecords(Array.isArray(payload.items) ? payload.items : []);
        setTotal(Number(payload.total) || 0);
        setPage(Number(payload.page) || 1);
        setPageSize(Number(payload.page_size) || pageSize);
        setTotalPages(Number(payload.total_pages) || 1);
        setError("");
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Không thể tải lịch sử nhận diện."));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currency, dateFrom, dateTo, debouncedSearch, page, pageSize, suspicious]);

  const averageConfidence = useMemo(() => {
    if (!records.length) return 0;
    const totalConfidence = records.reduce(
      (sum, item) => sum + normalizeConfidence(item.confidence),
      0,
    );
    return totalConfidence / records.length;
  }, [records]);

  const openDetail = async (recordId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailRecord(null);

    try {
      const res = await axios.get(`/history/${recordId}`);
      setDetailRecord(res.data ?? null);
    } catch (requestError) {
      setDetailError(
        getErrorMessage(requestError, "Không thể tải chi tiết bản ghi này."),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailRecord(null);
    setDetailError("");
  };

  const exportCsv = async () => {
    try {
      setIsExportingCsv(true);
      const params = buildHistoryParams({
        page,
        pageSize,
        search: debouncedSearch,
        suspicious,
        currency,
        dateFrom,
        dateTo,
      });

      const res = await axios.get("/history/export", {
        params,
        responseType: "blob",
      });

      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "prediction-history.csv";
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể xuất CSV."));
    } finally {
      setIsExportingCsv(false);
    }
  };

  const exportPdf = () => {
    try {
      setIsExportingPdf(true);
      const doc = new jsPDF();

      doc.setFontSize(14);
      doc.text("Prediction History", 14, 14);
      doc.setFontSize(10);
      doc.text(`Generated at: ${new Date().toLocaleString("vi-VN")}`, 14, 20);

      autoTable(doc, {
        startY: 25,
        head: [["File", "Prediction", "Confidence", "Suspicious", "Value", "Created At"]],
        body: records.map((item) => [
          item.filename || "--",
          item.prediction || "--",
          `${normalizeConfidence(item.confidence).toFixed(2)}%`,
          item.suspicious ? "Yes" : "No",
          item.estimated_value ?? "--",
          formatDateTime(item.created_at),
        ]),
      });

      doc.save("prediction-history.pdf");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const canPrevious = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="history-page fade-in">
      <section className="hero-panel">
        <p className="panel-kicker">Verification Ledger</p>
        <h2>Lịch sử nhận diện tiền giấy</h2>
        <p>
          Theo dõi toàn bộ lần dự đoán, confidence và mệnh giá để phục vụ kiểm
          định, đối soát nghiệp vụ và truy vết bất thường.
        </p>
      </section>

      <section className="stats-strip">
        <article className="panel stat-mini">
          <div className="stat-mini__icon">
            <HistoryIcon size={18} />
          </div>
          <div>
            <p>Tổng bản ghi đã lọc</p>
            <h3>{total}</h3>
          </div>
        </article>

        <article className="panel stat-mini">
          <div className="stat-mini__icon">
            <ScanSearch size={18} />
          </div>
          <div>
            <p>Confidence trung bình trang hiện tại</p>
            <h3>{averageConfidence.toFixed(2)}%</h3>
          </div>
        </article>

        <article className="panel stat-mini">
          <div className="stat-mini__icon">
            <CalendarClock size={18} />
          </div>
          <div>
            <p>Bản ghi mới nhất</p>
            <h3>{records[0] ? formatDateTime(records[0].created_at) : "--"}</h3>
          </div>
        </article>
      </section>

      <section className="panel history-filters">
        <div className="panel-title">
          <Filter size={20} />
          <h3>Tìm kiếm và lọc lịch sử</h3>
        </div>

        <div className="history-filter-grid">
          <label className="history-filter-field history-filter-field--search">
            <span>Tìm theo file hoặc loại tiền</span>
            <div className="auth-input-wrap">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ví dụ: IMG_1024 hoặc VN_500000"
              />
            </div>
          </label>

          <label className="history-filter-field">
            <span>Trạng thái nghi vấn</span>
            <select
              value={suspicious}
              onChange={(event) => setSuspicious(event.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="true">Chỉ nghi vấn</option>
              <option value="false">Chỉ bình thường</option>
            </select>
          </label>

          <label className="history-filter-field">
            <span>Currency category</span>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {CURRENCY_OPTIONS.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="history-filter-field">
            <span>Từ ngày</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>Đến ngày</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>Kích thước trang</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value) || 10)}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <div className="history-filter-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={exportCsv}
            disabled={isExportingCsv || isLoading || !records.length}
          >
            {isExportingCsv ? <LoaderCircle size={16} className="spin" /> : <Download size={16} />}
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={exportPdf}
            disabled={isExportingPdf || isLoading || !records.length}
          >
            {isExportingPdf ? <LoaderCircle size={16} className="spin" /> : <FileDown size={16} />}
            <span>Xuất PDF</span>
          </button>
        </div>
      </section>

      <section className="panel history-panel">
        <div className="panel-title">
          <FileText size={20} />
          <h3>Bảng dữ liệu lịch sử</h3>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <LoaderCircle size={18} className="spin" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="empty-state error">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        ) : null}

        {!isLoading && !error && !records.length ? (
          <div className="empty-state">
            <p>Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : null}

        {!isLoading && !error && records.length ? (
          <>
            <div className="table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Dự đoán</th>
                    <th>Confidence</th>
                    <th>Nghi vấn</th>
                    <th>Mệnh giá</th>
                    <th>Thời gian</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((item, index) => {
                    const confidence = normalizeConfidence(item.confidence);

                    return (
                      <tr key={item.id ?? `${item.filename}-${index}`}>
                        <td>{item.filename}</td>
                        <td>{item.prediction}</td>
                        <td>{confidence.toFixed(2)}%</td>
                        <td>
                          <span
                            className={`status-pill ${item.suspicious ? "is-warning" : "is-safe"}`}
                          >
                            {item.suspicious ? "Nghi vấn" : "Bình thường"}
                          </span>
                        </td>
                        <td>{item.estimated_value || "--"}</td>
                        <td>{formatDateTime(item.created_at)}</td>
                        <td>
                          <button
                            type="button"
                            className="table-btn"
                            onClick={() => openDetail(item.id)}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="history-mobile-list">
              {records.map((item, index) => (
                <article
                  className="history-mobile-card"
                  key={(item.id ?? `${item.filename}-${index}`) + "-mobile"}
                >
                  <p>
                    <strong>File:</strong> {item.filename}
                  </p>
                  <p>
                    <strong>Dự đoán:</strong> {item.prediction}
                  </p>
                  <p>
                    <strong>Confidence:</strong> {normalizeConfidence(item.confidence).toFixed(2)}%
                  </p>
                  <p>
                    <strong>Nghi vấn:</strong> {item.suspicious ? "Có" : "Không"}
                  </p>
                  <p>
                    <strong>Mệnh giá:</strong> {item.estimated_value || "--"}
                  </p>
                  <p>
                    <strong>Thời gian:</strong> {formatDateTime(item.created_at)}
                  </p>
                  <button
                    type="button"
                    className="table-btn"
                    onClick={() => openDetail(item.id)}
                  >
                    <Eye size={14} />
                  </button>
                </article>
              ))}
            </div>

            <div className="history-pagination">
              <button
                type="button"
                className="secondary-btn"
                disabled={!canPrevious}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                Trang trước
              </button>

              <p>
                Trang <strong>{page}</strong> / {totalPages} ({total} bản ghi)
              </p>

              <button
                type="button"
                className="secondary-btn"
                disabled={!canNext}
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              >
                Trang sau
              </button>
            </div>
          </>
        ) : null}
      </section>

      {detailOpen ? (
        <div className="modal-overlay" onClick={closeDetail} aria-hidden="true">
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h3>Chi tiết dự đoán</h3>
              <button type="button" className="table-btn" onClick={closeDetail}>
                <X size={14} />
              </button>
            </div>

            {detailLoading ? (
              <div className="empty-state">
                <LoaderCircle size={18} className="spin" />
                <p>Đang tải chi tiết...</p>
              </div>
            ) : null}

            {!detailLoading && detailError ? (
              <div className="empty-state error">
                <AlertCircle size={18} />
                <p>{detailError}</p>
              </div>
            ) : null}

            {!detailLoading && !detailError && detailRecord ? (
              <div className="detail-content">
                {detailRecord.image_url ? (
                  <img
                    src={`${axios.defaults.baseURL}${detailRecord.image_url}`}
                    alt={detailRecord.filename}
                    className="detail-image"
                  />
                ) : null}

                <div className="detail-grid">
                  <p>
                    <strong>File:</strong> {detailRecord.filename}
                  </p>
                  <p>
                    <strong>Dự đoán chính:</strong> {detailRecord.prediction}
                  </p>
                  <p>
                    <strong>Confidence:</strong>{" "}
                    {normalizeConfidence(detailRecord.confidence).toFixed(2)}%
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    {detailRecord.suspicious ? "Nghi vấn" : "Bình thường"}
                  </p>
                  <p>
                    <strong>Mệnh giá:</strong> {detailRecord.estimated_value || "--"}
                  </p>
                  <p>
                    <strong>Người yêu cầu:</strong> {detailRecord.requested_by || "--"}
                  </p>
                </div>

                <div className="top3-list">
                  {(detailRecord.top3 || []).slice(0, 3).map((item, index) => {
                    const score = normalizeConfidence(item.probability);
                    const level = confidenceLevel(score);

                    return (
                      <article className="top3-item" key={`${item.class_name}-${index}-detail`}>
                        <div className="top3-item__head">
                          <span>{item.class_name}</span>
                          <strong>{score.toFixed(2)}%</strong>
                        </div>
                        <div className="confidence-track">
                          <span
                            className={`confidence-fill ${level}`}
                            style={{ width: `${Math.min(score, 100)}%` }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>

                {detailRecord.suspicious ? (
                  <div className="suspicious-warning">
                    <ShieldAlert size={18} />
                    <p>Bản ghi này có confidence thấp, cần kiểm định thủ công.</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
