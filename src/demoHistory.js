const KEY = "banknote-demo-history";

export function readDemoHistory() {
  try {
    const rows = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function rememberDemoPrediction(result) {
  const row = {
    at: new Date().toISOString(),
    prediction: String(result.prediction || "Không xác định"),
    confidence: Number(result.confidence) || 0,
    model_version: String(result.model_version || "--"),
    suspicious: Boolean(result.suspicious),
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify([row, ...readDemoHistory()].slice(0, 20)));
  } catch {
    // Prediction still succeeds if browser storage is unavailable.
  }
}
