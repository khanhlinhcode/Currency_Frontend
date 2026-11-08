# Currency Frontend

🌐 FRONTEND – HỆ THỐNG NHẬN DIỆN TIỀN GIẤY

⸻

📌 Giới thiệu

Frontend được xây dựng bằng ReactJS, đóng vai trò giao diện người dùng trong hệ thống nhận diện tiền giấy.
Ứng dụng cho phép người dùng tải ảnh hoặc sử dụng camera để gửi dữ liệu đến backend và hiển thị kết quả dự đoán từ mô hình AI.

⸻

🧠 Công nghệ sử dụng
• ReactJS
• Vite
• Axios
• HTML / CSS / SCSS

⸻

📂 Cấu trúc thư mục
currency-frontend/
│
├── src/
│ ├── components/ # UI components
│ ├── pages/ # các trang chính (Predict, History, Dashboard)
│ ├── services/ # gọi API (Axios)
│ └── App.jsx
│
├── public/
├── package.json
└── vite.config.js

🚀 Cài đặt & chạy Frontend

1️⃣ Di chuyển vào thư mục

cd currency-frontend

2️⃣ Cài thư viện

npm install

3️⃣ Chạy ứng dụng

npm run dev

4️⃣ Truy cập ứng dụng
http://localhost:5173

🔗 Kết nối Backend

Frontend gửi request đến backend FastAPI thông qua Axios.

👉 URL mặc định: http://127.0.0.1:8000

User → Upload ảnh
↓
Frontend (React)
↓
Gửi API (Axios)
↓
Backend (FastAPI + AI)
↓
Nhận JSON
↓
Hiển thị kết quả

## Run (Local)

```bash
nvm use
npm install
npm run dev
```

`nvm run dev` is not valid for Vite projects. Use `npm run dev`.

## Build

```bash
npm run lint
npm run build
```

## API URL

Frontend uses:

- `http://127.0.0.1:8000` in development, or `VITE_API_URL` at build time.

Configure the production API URL in Vercel environment variables. Admin credentials are provisioned only through backend environment variables.

## Added Features

- Predict page with drag-drop upload, preview, loading state, top-3 confidence bars, suspicious warning.
- History page with search, filters, pagination, detail modal, CSV/PDF export.
- Dashboard with summary cards and analytics charts (pie/bar/line).
- Role-based route protection (`admin` / `analyst`) and session status indicator.
- Model Info page with architecture, dataset, classes, and training metadata.
- Deployment docs and configs: Vercel, Render, Railway.

# Currency_Frontend
