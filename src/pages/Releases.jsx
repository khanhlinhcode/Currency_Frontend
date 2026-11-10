import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { date } from "./mlops";

function message(error) {
  return error?.response?.data?.detail || "Thao tác không thành công. Vui lòng tải lại trang.";
}

export default function Releases() {
  const [channels, setChannels] = useState([]);
  const [events, setEvents] = useState([]);
  const [runs, setRuns] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceEvents, setDeviceEvents] = useState([]);
  const [classNames, setClassNames] = useState([]);
  const [reviewLabels, setReviewLabels] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const previewRef = useRef("");
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [name, setName] = useState("");
  const [oneTimeToken, setOneTimeToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [channelResponse, runResponse, deviceResponse] = await Promise.all([
        api.get("/mlops/channels"), api.get("/mlops/runs?status=approved&limit=100"), api.get("/mlops/devices"),
      ]);
      setChannels(channelResponse.data.channels || []);
      setEvents(channelResponse.data.events || []);
      setRuns(runResponse.data.runs || []);
      setDevices(deviceResponse.data.devices || []);
      const activeRun = channelResponse.data.channels?.[0]?.active_run_id;
      if (activeRun) {
        const [eventResponse, manifestResponse] = await Promise.all([
          api.get(`/mlops/device-events?run_id=${encodeURIComponent(activeRun)}&limit=50`),
          api.get(`/mlops/runs/${encodeURIComponent(activeRun)}/artifacts/manifest`),
        ]);
        setDeviceEvents(eventResponse.data.events || []);
        setClassNames(manifestResponse.data.class_names || []);
      } else { setDeviceEvents([]); setClassNames([]); }
      setError("");
    } catch (failure) { setError(message(failure)); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);
  const channel = channels[0];

  async function switchRelease(action) {
    if (!channel || !reason.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const payload = { expected_generation: channel.generation, reason: reason.trim() };
      if (action === "activate") payload.run_id = selected;
      await api.post(`/mlops/channels/${channel.name}/${action}`, payload);
      setReason("");
      setNotice(action === "activate" ? "Đã chuyển kênh phát hành. Thiết bị sẽ nhận bản mới ở lần đồng bộ kế tiếp." : "Đã quay lại bản trước trên kênh phát hành.");
      await refresh();
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }

  async function registerDevice() {
    if (!channel || !name.trim()) return;
    setBusy(true); setError(""); setNotice(""); setOneTimeToken(null);
    try {
      const { data } = await api.post("/mlops/devices", { name: name.trim(), channel: channel.name });
      setOneTimeToken(data);
      setName("");
      await refresh();
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }

  async function revokeDevice(id) {
    setBusy(true); setError(""); setNotice("");
    try {
      await api.post(`/mlops/devices/${id}/revoke`);
      setNotice("Thiết bị đã bị thu hồi quyền cập nhật.");
      await refresh();
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }

  async function reviewEvent(eventId) {
    const actual = reviewLabels[eventId];
    if (!actual) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api.post(`/mlops/device-events/${eventId}/review`, { actual_label: actual });
      setNotice("Đã lưu nhãn người duyệt cho sự kiện thiết bị.");
      await refresh();
    } catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }

  async function viewEvidence(eventId) {
    try {
      const { data } = await api.get(`/mlops/device-events/${eventId}/image`, { responseType: "blob" });
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = URL.createObjectURL(data);
      setPreviewUrl(previewRef.current);
    } catch (failure) { setError(message(failure)); }
  }

  return <div className="dashboard-page fade-in">
    <section className="hero-panel"><p className="panel-kicker">Release Control</p><h2>Phát hành model và đồng bộ thiết bị</h2>
      <p>Chỉ run đã được duyệt với audit dữ liệu sạch và release gate đạt mới được phát hành. Thiết bị kiểm tra phiên bản qua Internet và xác minh SHA-256 trước khi chuyển model.</p>
    </section>
    {error && <section className="panel empty-state error">{error}</section>}
    {notice && <section className="panel"><p>{notice}</p></section>}
    <section className="panel chart-panel"><div className="panel-title"><h3>Kênh hiện tại</h3></div>
      {!channel ? <p>Đang tải kênh phát hành...</p> : <>
        <p><strong>{channel.name}</strong> · thế hệ {channel.generation} · run đang dùng: <strong>{channel.active_run_id || "Chưa có bản được duyệt"}</strong></p>
        <p>Bản trước: {channel.previous_run_id || "Chưa có"} · người cập nhật: {channel.updated_by || "Chưa có"} · {date(channel.updated_at)}</p>
        {!runs.length && <p>Chưa có run nào đủ điều kiện. Model legacy 1.1.0 vẫn là candidate; cần duyệt dữ liệu và đánh giá lại trước khi chọn phiên bản.</p>}
        <div className="history-filter-grid">
          <label className="history-filter-field"><span>Run được duyệt</span><select value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Chọn run</option>{runs.map((run) => <option key={run.run_id} value={run.run_id}>{run.run_id} · {run.model_version}</option>)}
          </select></label>
          <label className="history-filter-field"><span>Lý do thay đổi</span><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: đạt gate và thử nghiệm thiết bị" /></label>
        </div>
        <div className="mlops-actions">
          <button type="button" className="table-btn" disabled={busy || !selected || reason.trim().length < 5} onClick={() => switchRelease("activate")}>Phát hành run đã duyệt</button>
          <button type="button" className="table-btn" disabled={busy || !channel.previous_run_id || reason.trim().length < 5} onClick={() => switchRelease("rollback")}>Quay lại bản trước</button>
        </div>
      </>}
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>Thiết bị</h3></div>
      <p>Đăng ký một lần cho từng thiết bị. Token chỉ hiển thị một lần; lưu vào kho bí mật của thiết bị. Trạng thái cập nhật xuất hiện sau khi thiết bị chạy updater.</p>
      {channel && <div className="mlops-actions"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên thiết bị" aria-label="Tên thiết bị" />
        <button type="button" className="table-btn" disabled={busy || name.trim().length < 3} onClick={registerDevice}>Đăng ký thiết bị</button></div>}
      {oneTimeToken && <div className="panel"><p><strong>Thông tin cấp một lần cho {oneTimeToken.name}</strong></p>
        <p>Device ID: <code>{oneTimeToken.id}</code></p><p>Token: <code className="mlops-secret">{oneTimeToken.token}</code></p>
        <button type="button" className="table-btn" onClick={() => setOneTimeToken(null)}>Đã lưu token an toàn</button></div>}
      {!devices.length ? <p>Chưa đăng ký thiết bị.</p> : <div className="table-wrap"><table className="history-table"><thead><tr><th>Thiết bị</th><th>Kênh</th><th>Trạng thái</th><th>Run / thế hệ</th><th>Lần liên lạc</th><th>Quyền</th></tr></thead><tbody>
        {devices.map((device) => <tr key={device.id}><td>{device.name}<br /><small>{device.id}</small></td><td>{device.channel}</td>
          <td>{device.reported_status || "Chưa kết nối"}</td><td>{device.reported_run_id || "—"} / {device.reported_generation ?? "—"}</td><td>{date(device.last_seen_at)}</td>
          <td>{device.is_active ? <button type="button" className="table-btn" disabled={busy} onClick={() => revokeDevice(device.id)}>Thu hồi</button> : "Đã thu hồi"}</td></tr>)}
      </tbody></table></div>}
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>Nhật ký phát hành</h3></div>
      {!events.length ? <p>Chưa có lần phát hành nào.</p> : <div className="table-wrap"><table className="history-table"><thead><tr><th>Thời gian</th><th>Thao tác</th><th>Run</th><th>Người thực hiện</th><th>Lý do</th></tr></thead><tbody>
        {events.map((event) => <tr key={event.generation}><td>{date(event.occurred_at)}</td><td>{event.action}</td><td>{event.from_run_id || "—"} → {event.to_run_id}</td><td>{event.actor}</td><td>{event.reason}</td></tr>)}
      </tbody></table></div>}
    </section>
    <section className="panel chart-panel"><div className="panel-title"><h3>Dữ liệu dự đoán từ thiết bị</h3></div>
      <p>Metadata dự đoán và ảnh bằng chứng riêng tư được lưu theo từng sự kiện. Chỉ những ảnh đã được kiểm chứng mới có thể gắn nhãn; chỉ số này tách khỏi test accuracy.</p>
      {previewUrl && <div className="panel"><img className="mlops-evidence" src={previewUrl} alt="Ảnh bằng chứng từ thiết bị" /><div><button type="button" className="table-btn" onClick={() => { URL.revokeObjectURL(previewRef.current); previewRef.current = ""; setPreviewUrl(""); }}>Đóng ảnh</button></div></div>}
      {!deviceEvents.length ? <p>Chưa có dữ liệu thiết bị ở run đang phát hành.</p> : <div className="table-wrap"><table className="history-table"><thead><tr><th>Thời gian</th><th>Thiết bị</th><th>Dự đoán</th><th>Confidence</th><th>Nhãn duyệt</th></tr></thead><tbody>
        {deviceEvents.map((event) => <tr key={event.event_id}><td>{date(event.observed_at)}</td><td>{event.device_id}</td><td>{event.prediction}</td><td>{(event.confidence * 100).toFixed(2)}%</td><td>
          {event.has_image ? <button type="button" className="table-btn" onClick={() => viewEvidence(event.event_id)}>Xem ảnh</button> : "Chờ ảnh"}
          {event.actual_label || (event.has_image && <div className="mlops-actions"><select aria-label={`Nhãn cho ${event.event_id}`} value={reviewLabels[event.event_id] || ""} onChange={(change) => setReviewLabels({ ...reviewLabels, [event.event_id]: change.target.value })}>
            <option value="">Chọn nhãn sau khi kiểm chứng</option>{classNames.map((label) => <option key={label} value={label}>{label}</option>)}
          </select><button type="button" className="table-btn" disabled={busy || !reviewLabels[event.event_id]} onClick={() => reviewEvent(event.event_id)}>Lưu duyệt</button></div>)}
        </td></tr>)}
      </tbody></table></div>}
    </section>
  </div>;
}
