import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, KeyRound, LoaderCircle, UserRound } from "lucide-react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const showDemoCredentials = import.meta.env.DEV;
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fillDemoCredentials = () => {
    setUsername("admin");
    setPassword("admin123");
    setError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ username và password.");
      return;
    }

    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);

    try {
      setIsLoading(true);
      const res = await axios.post("/login", form);
      login(res.data);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      const detail = requestError.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item) => item?.msg).filter(Boolean).join(", ")
        : detail;
      const isCredentialError =
        typeof message === "string" &&
        /invalid username|invalid password/i.test(message);

      setError(
        isCredentialError
          ? showDemoCredentials
            ? "Sai tài khoản hoặc mật khẩu. Tài khoản mẫu: admin / admin123"
            : "Sai tài khoản hoặc mật khẩu."
          : typeof message === "string"
            ? message
            : requestError.code === "ERR_NETWORK"
              ? "Không kết nối được dịch vụ nhận diện. Vui lòng thử lại."
              : "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-page__intro">
        <p className="auth-kicker">Banknote Security Workspace</p>
        <h1>Đăng nhập trung tâm điều phối nhận diện tiền giấy quốc tế</h1>
        <p>
          Đăng nhập để theo dõi độ tin cậy mô hình, lịch sử nhận diện và
          cảnh báo nguy cơ tiền giả theo thời gian thực.
        </p>
      </section>

      <div className="auth-card">
        <h2>Cổng quản lý</h2>
        <p className="auth-card__subtitle">
          Chỉ người có quyền mới truy cập được trang giám sát.
        </p>
        {showDemoCredentials && (
          <p className="auth-helper">
            Tài khoản mẫu local: <strong>admin</strong> / <strong>admin123</strong>
          </p>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-field">
            <span>Username</span>
            <div className="auth-input-wrap">
              <UserRound size={16} />
              <input
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              <KeyRound size={16} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </label>

          {error && (
            <p className="auth-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </p>
          )}

          <div className="auth-actions">
            {showDemoCredentials && (
              <button
                type="button"
                className="secondary-btn"
                onClick={fillDemoCredentials}
              >
                Điền tài khoản mẫu
              </button>
            )}

            <button type="submit" className="primary-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoaderCircle size={16} className="spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập hệ thống</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
