import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import api from "../api/axios";

const initialCreateForm = {
  username: "",
  password: "",
  role: "analyst",
  is_active: true,
};

const initialEditForm = {
  username: "",
  password: "",
  role: "analyst",
  is_active: true,
};

function getErrorMessage(requestError, fallbackMessage) {
  const message = requestError.response?.data?.detail;
  return typeof message === "string" ? message : fallbackMessage;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN");
}

function normalizeRole(user) {
  if (user?.role === "admin" || user?.role === "analyst") return user.role;
  return user?.is_admin ? "admin" : "analyst";
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const adminCount = useMemo(
    () => users.filter((user) => normalizeRole(user) === "admin").length,
    [users],
  );

  const activeCount = useMemo(
    () => users.filter((user) => user.is_active).length,
    [users],
  );

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tải danh sách user."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!createForm.username.trim() || !createForm.password.trim()) {
      setError("Username và password không được để trống.");
      return;
    }

    try {
      setIsCreating(true);
      await api.post("/users", {
        username: createForm.username.trim().toLowerCase(),
        password: createForm.password,
        role: createForm.role,
        is_active: createForm.is_active,
      });

      setCreateForm(initialCreateForm);
      setNotice("Tạo user thành công.");
      await fetchUsers();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể tạo user."));
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      username: user.username,
      password: "",
      role: normalizeRole(user),
      is_active: user.is_active,
    });
    setNotice("");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(initialEditForm);
  };

  const handleUpdateUser = async (userId) => {
    setError("");
    setNotice("");

    if (!editForm.username.trim()) {
      setError("Username không được để trống.");
      return;
    }

    const payload = {
      username: editForm.username.trim().toLowerCase(),
      role: editForm.role,
      is_active: editForm.is_active,
      ...(editForm.password.trim() ? { password: editForm.password.trim() } : {}),
    };

    try {
      setSavingId(userId);
      await api.put(`/users/${userId}`, payload);
      setNotice("Cập nhật user thành công.");
      setEditingId(null);
      setEditForm(initialEditForm);
      await fetchUsers();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể cập nhật user."));
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    setError("");
    setNotice("");

    const confirmed = window.confirm(
      `Xoá user "${user.username}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(user.id);
      await api.delete(`/users/${user.id}`);
      setNotice("Đã xoá user.");
      await fetchUsers();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể xoá user."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="users-page fade-in">
      <section className="hero-panel">
        <p className="panel-kicker">Identity Access Control</p>
        <h2>Quản lý tài khoản đăng nhập</h2>
        <p>
          Tạo, chỉnh sửa, kích hoạt/vô hiệu hoá tài khoản để đảm bảo phần đăng
          nhập và quyền truy cập dashboard ổn định.
        </p>
      </section>

      <section className="stats-strip">
        <article className="panel stat-mini">
          <div className="stat-mini__icon">
            <UserCog size={18} />
          </div>
          <div>
            <p>Tổng số tài khoản</p>
            <h3>{users.length}</h3>
          </div>
        </article>

        <article className="panel stat-mini">
          <div className="stat-mini__icon">
            <UserCog size={18} />
          </div>
          <div>
            <p>Tài khoản admin</p>
            <h3>{adminCount}</h3>
          </div>
        </article>

        <article className="panel stat-mini">
          <div className="stat-mini__icon">
            <UserCog size={18} />
          </div>
          <div>
            <p>Tài khoản đang hoạt động</p>
            <h3>{activeCount}</h3>
          </div>
        </article>
      </section>

      {(error || notice) && (
        <section className="panel users-alerts">
          {error ? (
            <p className="inline-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </p>
          ) : null}
          {notice ? <p className="users-notice">{notice}</p> : null}
        </section>
      )}

      <section className="users-layout">
        <article className="panel users-form-panel">
          <div className="panel-title">
            <Plus size={20} />
            <h3>Thêm người dùng</h3>
          </div>

          <form className="users-form" onSubmit={handleCreateUser}>
            <label className="auth-field">
              <span>Username</span>
              <div className="auth-input-wrap">
                <input
                  value={createForm.username}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      username: event.target.value,
                    }))
                  }
                  placeholder="new-user"
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Role</span>
              <select
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    role: event.target.value,
                  }))
                }
              >
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label className="users-toggle">
              <input
                type="checkbox"
                checked={createForm.is_active}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    is_active: event.target.checked,
                  }))
                }
              />
              <span>Tài khoản hoạt động</span>
            </label>

            <button type="submit" className="primary-btn" disabled={isCreating}>
              {isCreating ? (
                <>
                  <LoaderCircle size={16} className="spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Tạo user</span>
                </>
              )}
            </button>
          </form>
        </article>

        <article className="panel users-list-panel">
          <div className="panel-title">
            <UserCog size={20} />
            <h3>Danh sách người dùng</h3>
          </div>

          {isLoading ? (
            <div className="empty-state">
              <LoaderCircle size={18} className="spin" />
              <p>Đang tải dữ liệu user...</p>
            </div>
          ) : null}

          {!isLoading && !users.length ? (
            <div className="empty-state">
              <p>Chưa có user nào.</p>
            </div>
          ) : null}

          {!isLoading && users.length ? (
            <div className="table-wrap">
              <table className="history-table users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Trạng thái</th>
                    <th>Tạo lúc</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isEditing = editingId === user.id;

                    return (
                      <tr key={user.id}>
                        <td>
                          {isEditing ? (
                            <input
                              className="table-input"
                              value={editForm.username}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  username: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            user.username
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              value={editForm.role}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  role: event.target.value,
                                }))
                              }
                            >
                              <option value="analyst">Analyst</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="role-pill">{normalizeRole(user)}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <label className="users-toggle inline">
                              <input
                                type="checkbox"
                                checked={editForm.is_active}
                                onChange={(event) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    is_active: event.target.checked,
                                  }))
                                }
                              />
                              <span>{editForm.is_active ? "Active" : "Inactive"}</span>
                            </label>
                          ) : user.is_active ? (
                            "Active"
                          ) : (
                            "Inactive"
                          )}
                        </td>
                        <td>{formatDateTime(user.created_at)}</td>
                        <td>
                          {isEditing ? (
                            <div className="table-actions">
                              <input
                                className="table-input"
                                type="password"
                                value={editForm.password}
                                onChange={(event) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    password: event.target.value,
                                  }))
                                }
                                placeholder="Đổi mật khẩu (tuỳ chọn)"
                              />
                              <button
                                type="button"
                                className="table-btn"
                                onClick={() => handleUpdateUser(user.id)}
                                disabled={savingId === user.id}
                              >
                                {savingId === user.id ? (
                                  <LoaderCircle size={14} className="spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                              </button>
                              <button
                                type="button"
                                className="table-btn"
                                onClick={cancelEdit}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="table-actions">
                              <button
                                type="button"
                                className="table-btn"
                                onClick={() => startEdit(user)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="table-btn danger"
                                onClick={() => handleDeleteUser(user)}
                                disabled={deletingId === user.id}
                              >
                                {deletingId === user.id ? (
                                  <LoaderCircle size={14} className="spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
