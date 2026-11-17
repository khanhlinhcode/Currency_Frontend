# Currency AI frontend

React/Vite dashboard cho hệ thống nhận dạng **mệnh giá** tiền giấy. [Staging](https://currency-ai-free-dashboard.onrender.com/) chạy trên Render Static Sites và gọi [Currency AI API staging](https://currency-ai-free-staging.onrender.com/ready). Model hiện tại là `1.1.0` dạng **candidate**; giao diện không được dùng để tuyên bố model đã đạt chất lượng production.

## Trang và phân quyền

- Khách xem staging: vào trang nhận diện và thử ảnh ngay, không cần đăng nhập; ảnh/kết quả demo không được lưu vào lịch sử.
- Bản demo CV đặt `VITE_DEMO_ONLY=true`: chỉ mở trang nhận diện; `/login` và các link quản trị chuyển về `/`. Backend vẫn kiểm tra quyền cho API dữ liệu và quản trị.
- Bản quản trị khi tắt `VITE_DEMO_ONLY`: người dùng đã đăng nhập xem lịch sử, dashboard vận hành và thông tin model.
- Admin trong bản quản trị: quản lý tài khoản, **MLOps Runs**, Run Detail, Compare Models, Benchmark, Monitoring và **Phát hành & thiết bị**.
- Test-set metrics, reviewed accuracy và benchmark latency là ba loại số liệu khác nhau. Khi thiếu baseline hoặc chưa đủ mẫu, giao diện hiển thị **“Chưa đủ dữ liệu”**. Kích hoạt/rollback chỉ nhận run đã được backend phê duyệt; dashboard không thể vượt release gate.

Staging cho khách dự đoán tối đa 30 lượt mỗi phút trên một API instance, không ghi ảnh hay lịch sử của khách; API dữ liệu và quản trị vẫn yêu cầu đăng nhập. Khi mở lại bản quản trị, admin có thể đổi model đã được duyệt và rollback trên trang phát hành mà không sửa code. **Train lại, duyệt dữ liệu và tạo approved run vẫn cần quy trình backend**, chưa có nút train tự động trong frontend. Xem [backend README](https://github.com/khanhlinhcode/Currency_Backend/blob/main/README.md) và [release-control runbook](https://github.com/khanhlinhcode/Currency_Backend/blob/main/docs/release-control-runbook.md).

## Chạy cục bộ

```bash
npm ci
npm run dev
```

Mặc định API development ở `http://127.0.0.1:8000`. Để dùng API khác, đặt `VITE_API_URL` trước khi **build**; URL này là thông tin công khai trong bundle, không chứa secret. Đặt `VITE_APP_ENV=staging` để hiển thị hướng dẫn demo trên trang dự đoán.

Để mở lại giao diện đăng nhập và quản trị, build với `VITE_DEMO_ONLY=false` hoặc bỏ biến này. Giá trị này được nhúng khi build, nên cần build/deploy lại frontend. `render.free.yaml` bật chế độ demo cho link CV.

```bash
npm run lint
npm run build
```

Các biến môi trường được nhúng vào bản build Vite; đổi API URL cần build/deploy lại frontend. Model được phát hành qua backend release channel, không cần build lại frontend nếu hợp đồng input/lớp tương thích.

## Trạng thái và giới hạn (11/11/2026)

Frontend staging và CI đã hoạt động. Dữ liệu backend còn 10.106 ảnh thiếu `group_id` có căn cứ; chưa có dataset v2 được chốt và model được duyệt. Các trang MLOps vì vậy là công cụ theo dõi và kiểm soát phát hành, **chưa chứng minh accuracy production**. Hiệu năng đo trên Render Free và giới hạn backup/thiết bị được ghi trong [báo cáo backend](https://github.com/khanhlinhcode/Currency_Backend/blob/main/docs/validation-report.md).
