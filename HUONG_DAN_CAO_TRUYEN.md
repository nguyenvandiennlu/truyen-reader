# Hướng Dẫn Sử Dụng Tính Năng Cào Truyện Tự Động

Tính năng cào truyện đã được tích hợp hoàn chỉnh vào cả **Giao diện Web** (Next.js) lẫn **Dòng lệnh CLI** (Node.js).

---

## 1. Khởi động hệ thống

### Bước 1: Chạy Backend Spring Boot
Mở dự án `truyen-reader` trong IntelliJ IDEA hoặc VS Code và chạy class:
```
com.diennng.truyen.TruyenApplication
```
> Backend sẽ chạy tại cổng `http://localhost:8080`.

### Bước 2: Chạy Frontend Next.js
Mở terminal tại thư mục `frontend`:
```bash
cd c:\Users\quy23\Documents\Downloads\truyen-reader\frontend
npm run dev
```
> Truy cập giao diện đọc truyện tại: `http://localhost:3000`.

---

## 2. Cách 1: Cào truyện trực tiếp từ Giao diện Web (Khuyên dùng)

1. Mở trình duyệt vào `http://localhost:3000`.
2. Trên góc phải (hoặc giữa màn hình nếu thư viện trống), bấm nút **"📥 Cào truyện từ link"**.
3. Dán link truyện hoặc link chương bất kỳ, ví dụ:
   - Link trang truyện: `https://truyendocviet1.shop/doc-truyen/tam-thi-nhan-nguoi-tim-xac.html`
   - Hoặc link đọc chương: `https://truyendocviet1.shop/doc-truyen/tam-thi-nhan-nguoi-tim-xac/read/4891911.html`
4. Chọn số chương muốn cào (mặc định 20 chương, hoặc 50, 100,...).
5. Bấm **"Bắt đầu cào"**:
   - Hệ thống sẽ hiển thị **thanh tiến độ %** và dòng trạng thái tải realtime từng chương (Server-Sent Events).
   - Khi hoàn thành, nút **"Đọc ngay"** sẽ xuất hiện đưa bạn thẳng vào trang đọc truyện!
   - Thư viện sẽ tự động cập nhật truyện mới.

---

## 3. Cách 2: Sử dụng dòng lệnh CLI

Nếu bạn thích dùng dòng lệnh:
```bash
# Cào với tham số link và số chương:
node crawl-cli.js "https://truyendocviet1.shop/doc-truyen/tam-thi-nhan-nguoi-tim-xac.html" 10

# Hoặc chỉ cần gõ lệnh và nhập theo hướng dẫn:
node crawl-cli.js
```

---

## 4. Các điểm nổi bật đã tối ưu

- **Bóc tách thông minh**: Tự động nhận diện slug truyện, tên truyện, tác giả và ID chương từ dữ liệu SSR của web.
- **Tiến trình Realtime (SSE)**: Giao tiếp qua `SseEmitter` báo tiến độ trực tiếp về trình duyệt.
- **Chống trùng lặp**: Nếu truyện đã tồn tại trong database, hệ thống sẽ tự động cập nhật hoặc nối tiếp các chương mới mà không tạo truyện bị trùng.
- **Cơ chế an toàn**: Có độ trễ 400ms giữa mỗi chương để tránh làm nghẽn server nguồn.
