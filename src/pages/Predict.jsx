import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Webcam from "react-webcam";
import {
  Camera,
  CircleAlert,
  CircleCheckBig,
  CircleDollarSign,
  FileImage,
  LoaderCircle,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import api from "../api/axios";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME = {
  "image/jpeg": [],
  "image/png": [],
  "image/webp": [],
};

function confidenceToPercent(value) {
  const confidence = Number(value ?? 0);
  if (!Number.isFinite(confidence)) return 0;
  return confidence <= 1 ? confidence * 100 : confidence;
}

function confidenceLevel(percent) {
  if (percent >= 80) return "high";
  if (percent >= 60) return "medium";
  return "low";
}

function validateImageFile(file) {
  if (!file) return "Không tìm thấy file upload.";

  if (!(file.type in ACCEPTED_MIME)) {
    return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Dung lượng ảnh vượt quá 10MB.";
  }

  return "";
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "N/A";
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function dataUrlToFile(dataUrl, fileName) {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}

export default function Predict() {
  const webcamRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  const runPrediction = useCallback(async (inputFile) => {
    const validationError = validateImageFile(inputFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsPredicting(true);

    const formData = new FormData();
    formData.append("file", inputFile);

    try {
      const res = await api.post("/predict", formData);
      setResult(res.data);
      window.dispatchEvent(new CustomEvent("prediction-created"));
    } catch (requestError) {
      const message = requestError.response?.data?.detail;
      setError(
        typeof message === "string"
          ? message
          : "Không thể nhận diện ảnh. Hãy kiểm tra API backend.",
      );
    } finally {
      setIsPredicting(false);
    }
  }, []);

  const attachFile = useCallback((nextFile, forcedPreview) => {
    setFile(nextFile);
    setResult(null);
    setError("");

    setPreviewUrl((currentPreview) => {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }

      if (forcedPreview) return forcedPreview;
      return URL.createObjectURL(nextFile);
    });
  }, []);

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        const firstRejectedFile = fileRejections[0]?.file;
        const message = validateImageFile(firstRejectedFile) || "File upload không hợp lệ.";
        setError(message);
        return;
      }

      const nextFile = acceptedFiles[0];
      if (!nextFile) return;

      const message = validateImageFile(nextFile);
      if (message) {
        setError(message);
        return;
      }

      attachFile(nextFile);
      runPrediction(nextFile);
    },
    [attachFile, runPrediction],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxFiles: 1,
    multiple: false,
  });

  const handleCaptureFromCamera = () => {
    const screenshot = webcamRef.current?.getScreenshot();

    if (!screenshot) {
      setError("Không thể chụp ảnh từ camera. Vui lòng thử lại.");
      return;
    }

    const capturedFile = dataUrlToFile(screenshot, `camera-capture-${Date.now()}.jpg`);
    attachFile(capturedFile, screenshot);
    runPrediction(capturedFile);
    setIsCameraOpen(false);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError("");
    setPreviewUrl((currentPreview) => {
      if (currentPreview && currentPreview.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return "";
    });
  };

  const confidencePercent = useMemo(
    () => confidenceToPercent(result?.confidence),
    [result?.confidence],
  );

  const confidenceClass = confidenceLevel(confidencePercent);
  const topPredictions = Array.isArray(result?.top3) ? result.top3 : [];
  const likelyNonBanknote = /background/i.test(result?.prediction || "");

  return (
    <div className="predict-page fade-in">
      <section className="hero-panel">
        <p className="panel-kicker">AI-Powered Detection Pipeline</p>
        <h2>Nhận diện mệnh giá tiền giấy của nhiều quốc gia chỉ với một ảnh</h2>
        <p>
          Nạp ảnh từ kéo-thả hoặc camera trực tiếp. Hệ thống sẽ tự chạy nhận diện
          và trả về dự đoán chính, confidence và top-3 lớp.
        </p>
      </section>

      <section className="predict-grid">
        <article className="panel upload-panel">
          <div className="panel-title">
            <FileImage size={20} />
            <h3>Upload / Camera Detection</h3>
          </div>

          <div className="camera-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsCameraOpen((currentState) => !currentState)}
              disabled={isPredicting}
            >
              <Camera size={16} />
              <span>{isCameraOpen ? "Đóng camera" : "Use Camera"}</span>
            </button>

            {file ? (
              <button type="button" className="secondary-btn" onClick={clearFile}>
                <X size={16} />
                <span>Xóa ảnh</span>
              </button>
            ) : null}
          </div>

          {isCameraOpen ? (
            <div className="camera-panel">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="camera-preview"
                onUserMediaError={() =>
                  setError("Không truy cập được camera. Hãy kiểm tra quyền camera trên trình duyệt.")
                }
                videoConstraints={{
                  facingMode: "environment",
                }}
              />

              <button
                type="button"
                className="primary-btn"
                onClick={handleCaptureFromCamera}
                disabled={isPredicting}
              >
                {isPredicting ? (
                  <>
                    <LoaderCircle size={16} className="spin" />
                    <span>Đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Capture & Predict</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`upload-dropzone ${isDragActive ? "is-drag-active" : ""} ${
                isDragReject ? "is-reject" : ""
              } ${previewUrl ? "has-preview" : ""}`}
            >
              <input {...getInputProps()} />

              {previewUrl ? (
                <img src={previewUrl} alt="Banknote preview" className="upload-preview" />
              ) : (
                <div className="upload-empty">
                  <Upload size={28} />
                  <p>Kéo thả hoặc nhấn để chọn ảnh tiền giấy</p>
                  <span>Định dạng hỗ trợ: JPG, PNG, WEBP • Tối đa 10MB</span>
                </div>
              )}
            </div>
          )}

          <div className="upload-actions">
            <p>{file ? `Ảnh đã chọn: ${file.name}` : "Chưa chọn ảnh"}</p>
          </div>

          {error ? (
            <p className="inline-error">
              <ShieldAlert size={15} />
              <span>{error}</span>
            </p>
          ) : null}

          {isPredicting ? (
            <div className="predict-loading">
              <LoaderCircle size={18} className="spin" />
              <p>Model đang chạy inference, vui lòng chờ...</p>
            </div>
          ) : null}
        </article>

        <article className="panel info-panel">
          <div className="panel-title">
            <CircleCheckBig size={20} />
            <h3>Quy trình đề xuất</h3>
          </div>
          <ul>
            <li>Upload: kéo-thả hoặc click chọn ảnh, hệ thống tự nhận diện ngay.</li>
            <li>Camera: mở camera, căn chỉnh khung hình rồi Capture & Predict.</li>
            <li>Đặt tờ tiền trên nền phẳng, đủ sáng để tăng độ chính xác.</li>
            <li>Dùng dashboard để theo dõi xu hướng nghi vấn theo thời gian.</li>
          </ul>
        </article>
      </section>

      {result ? (
        <section className="panel result-panel fade-up">
          <div className="panel-title">
            <CircleDollarSign size={20} />
            <h3>Kết quả nhận diện</h3>
          </div>

          <article className="main-prediction-card">
            <p className="result-label">Dự đoán chính</p>
            <h2>{result.prediction || "Không xác định"}</h2>
            <p className="main-prediction-sub">
              Giá trị ước tính: <strong>{formatMoney(result.estimated_value)}</strong>
            </p>
          </article>

          <div className="confidence-block">
            <div className="confidence-head">
              <span>Độ tin cậy mô hình</span>
              <strong>{confidencePercent.toFixed(2)}%</strong>
            </div>
            <div className="confidence-track">
              <span
                className={`confidence-fill ${confidenceClass}`}
                style={{ width: `${Math.min(confidencePercent, 100)}%` }}
              />
            </div>
          </div>

          {(result.suspicious || likelyNonBanknote) && (
            <div className="suspicious-warning">
              <CircleAlert size={18} />
              <p>
                Độ tin cậy thấp hoặc mẫu ảnh có dấu hiệu không phải tiền giấy.
                Cần kiểm tra thủ công. Hệ thống này không xác thực tiền thật hoặc tiền giả.
              </p>
            </div>
          )}

          <p className="result-label">
            Model {result.model_version || "--"} · Chờ {Math.round((result.queue_time || 0) * 1000)} ms · Inference {Math.round((result.inference_time || 0) * 1000)} ms ·
            Tổng xử lý {Math.round((result.processing_time || 0) * 1000)} ms
          </p>

          <div className="top3-section">
            <div className="panel-title">
              <ScanLine size={18} />
              <h3>Top-3 dự đoán</h3>
            </div>

            <div className="top3-list">
              {topPredictions.slice(0, 3).map((item, index) => {
                const score = confidenceToPercent(item.probability);
                const level = confidenceLevel(score);

                return (
                  <article className="top3-item" key={`${item.class_name}-${index}`}>
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
          </div>
        </section>
      ) : null}
    </div>
  );
}
