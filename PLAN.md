# PLAN - Web đọc truyện cá nhân (Truyen Reader)

> **Cập nhật mới nhất**: Rạng sáng 17/11/2026  
> **Trạng thái**: Đã chuyển đổi kiến trúc Frontend Hiện đại (Next.js 16) + Backend REST API / SSE (Spring Boot) + Cơ sở dữ liệu Cloud (Supabase PostgreSQL). Đã cào và lưu trữ thành công bộ truyện "Toàn Cầu Cao Võ" (1.432 chương).

---

## 1. Mục tiêu dự án
Web đọc truyện cá nhân mượt mà, lưu trữ vĩnh viễn trên Cloud miễn phí (không tốn dung lượng máy tính), cào tự động từ các nguồn web truyện, hỗ trợ đọc ban đêm và mở rộng nghe audio AI highlight từng từ.

---

## 2. Kiến trúc & Công nghệ hiện tại

- **Frontend**: Next.js 16 (App Router, Turbopack, React 19, Tailwind CSS v4, Base UI).
  - Cổng chạy: `http://localhost:3000`
- **Backend**: Spring Boot 3.3.5, Java 21, Spring Data JPA, HikariCP, Server-Sent Events (SSE).
  - Cổng chạy: `http://localhost:8080`
- **Database**: Supabase PostgreSQL 15+ (Cloud Free-tier).
  - Kết nối qua Session Pooler IPv4: `aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`
  - Kiểu nội dung chương: `TEXT` (chuẩn PostgreSQL, không giới hạn độ dài).
- **Crawl Engine**: Phân rã theo **Strategy Pattern** linh hoạt:
  - `SiteCrawler`: Interface chuẩn hóa cho mọi trang web truyện.
  - `TruyenCCrawler`: Phụ trách riêng cho `truyenc.net`.
  - `TruyenDocVietCrawler`: Phụ trách riêng cho `truyendocviet1.shop` (giải mã ký tự che, Base64).
  - `HttpHelper`: Tái sử dụng HTTP client, User-Agent và timeout.
  - `CrawlService`: Điều phối nghiệp vụ, quản lý bộ nhớ và streaming SSE thời gian thực.

---

## 3. Cấu trúc thư mục dự án

```
truyen-reader/
├── PLAN.md                               # File kế hoạch tổng thể này
├── frontend/                             # Giao diện Next.js 16 hiện đại
│   ├── src/
│   │   ├── app/                          # App Router (Trang chủ, chi tiết truyện, đọc chương)
│   │   │   ├── page.tsx                  # Thư viện truyện
│   │   │   └── truyen/[id]/              # Chi tiết & Đọc chương
│   │   └── components/
│   │       ├── crawl-dialog.tsx          # Hộp thoại cào truyện & xem tiến trình SSE
│   │       ├── story-detail-page.tsx     # Chi tiết truyện & nút Cập nhật chương mới
│   │       └── reading-view.tsx          # Giao diện đọc truyện
│   └── package.json
└── truyen-reader/                        # Backend Spring Boot 3.3.5
    ├── pom.xml                           # Khai báo thư viện (Spring Web, PostgreSQL, Jsoup)
    └── src/main/
        ├── java/com/diennng/truyen/
        │   ├── TruyenApplication.java    # Điểm khởi chạy
        │   ├── config/WebConfig.java     # Cấu hình CORS cho Frontend
        │   ├── model/                    # Entity (Story, Chapter)
        │   ├── repository/               # StoryRepository, ChapterRepository
        │   ├── controller/               # StoryApiController, CrawlController
        │   ├── service/CrawlService.java # Engine cào dữ liệu & streaming SSE
        │   └── dto/                      # Các Data Transfer Objects
        └── resources/
            └── application.properties    # Cấu hình kết nối Supabase Cloud Pooler
```

---

## 4. Nhật ký công việc đã hoàn thành (Tối 16/11 - Sáng 17/11/2026)

### A. Di chuyển Database lên Supabase Cloud (PostgreSQL)
- [x] Chuyển đổi toàn bộ cấu hình từ H2 database cục bộ sang **Supabase PostgreSQL Cloud** để giải phóng RAM và ổ cứng máy.
- [x] Thiết lập kết nối **IPv4 Session Pooler** (`aws-1-ap-southeast-1.pooler.supabase.com:5432`).
- [x] Khắc phục triệt để lỗi Hibernate Large Object OID (`PSQLException: Large Objects may not be used in auto-commit mode`) bằng cách chuyển ánh xạ cột `content` sang `TEXT` với `@JdbcTypeCode(SqlTypes.LONGVARCHAR)`.
- [x] Xác thực toàn bộ bảng `story` và `chapter` đã tạo và vận hành mượt mà trên Cloud.

### B. Nâng cấp Engine cào truyện & Trải nghiệm người dùng
- [x] **Xây dựng API Thống kê số chương (`/api/crawl/info`)**:
  - Tự động đối chiếu số chương đã có trong Supabase và số chương hiện có trên web nguồn (`truyenc.net`).
  - Hiển thị trực quan: **Trong máy** | **Trên web nguồn** | **Chưa tải về**.
- [x] **Tính năng Cào tất cả chương mới**:
  - Tự động tính toán số chương còn thiếu và cào từ chương mới nhất đến chương cuối cùng chỉ với 1 click.
  - Tùy chọn cào tùy chỉnh số lượng nếu muốn tải theo đợt.
- [x] **Nút "⚡ Cập nhật chương mới"**: Tích hợp ngay trên trang chi tiết truyện, tự tìm link nguồn và cào nối tiếp các chương mới nhất.
- [x] **Khắc phục giao diện Dialog cào truyện bị kéo giãn**:
  - Khóa độ rộng hộp thoại (`max-w-xl`), thêm `break-all` và `min-w-0` để tiêu đề chương dài không bao giờ làm tràn màn hình.
- [x] **Khắc phục lỗi ngắt kết nối SSE (Mất kết nối máy chủ)**:
  - Tăng thời gian Timeout của SSE lên **2 giờ** (`7200_000L`) phục vụ các đợt cào dài hàng ngàn chương.
  - Xử lý trạng thái Reconnecting thông minh, bổ sung nút **Kiểm tra & Cào tiếp** và **Đọc ngay**.
  - Tối ưu bộ nhớ heap định kỳ (`flush()`, `clear()`, `System.gc()`) để chống tràn RAM khi cào lớn.
- [x] **Cào thành công bộ truyện "Toàn Cầu Cao Võ"**: Toàn bộ **1.432 chương** (đến chương cuối 1437) đã được lưu trữ an toàn trên Supabase.

### C. Sửa lỗi Frontend Next.js 16 & Dọn dẹp mã nguồn Backend
- [x] Sửa lỗi đệ quy vô hạn `Call Stack 54` tại router `src/app/truyen/[id]/page.tsx`.
- [x] Gỡ bỏ các cờ thử nghiệm không tương thích trong `next.config.ts`.
- [x] Sửa lỗi Base UI `<Button>` xung đột với thẻ `<Link>`.
- [x] **Dọn dẹp triệt để các class và thư viện dư thừa**:
  - Gỡ bỏ `StoryController.java` (HTML MVC cũ) và toàn bộ thư mục `templates/`, `static/`.
  - Gỡ bỏ `DataSeeder.java` và thư mục database cục bộ `data/`.
  - Gỡ bỏ thư viện `spring-boot-starter-thymeleaf` và `h2` trong `pom.xml`.
  - Backend trở thành REST API thuần túy, sạch sẽ và tối ưu tốc độ compile.

---

## 5. Kế hoạch tiếp theo (Roadmap)

### Giai đoạn tiếp theo 1: Tiện ích đọc truyện (Reader UX) & Audio AI
- [x] **Tích hợp Audio AI (Microsoft Edge Neural: Nam Minh & Hoài My)**:
  - Mặc định giọng **Nam Minh** (trầm ấm, tự nhiên, 0% CPU server, không tốn ổ cứng).
  - Tùy chọn chuyển đổi sang giọng **Hoài My** (nữ) và điều chỉnh tốc độ đọc (0.85x, 1.0x, 1.15x, 1.25x, 1.5x).
  - **Highlight tương tác thời gian thực & Karaoke từng từ**:
    - Đoạn văn đang đọc được viền sáng màu hổ phách/vàng ấm, tự động cuộn giữa màn hình.
    - **Highlight chữ vàng chạy theo giọng đọc (Word-by-word Karaoke)**: Giọng đọc nói tới chữ nào thì chữ đó lập tức sáng đèn vàng nổi bật (`bg-amber-400 font-bold`) ở tốc độ 60fps mượt mà.
  - Bấm vào bất kỳ đoạn nào trên trang để nghe đọc ngay từ đoạn đó.
  - **Pipeline Tải trước (Gapless Prefetching & LRU Memory Cache)**: Tải trước 3 đoạn kế tiếp vào RAM dưới dạng Blob URL, loại bỏ hoàn toàn độ trễ giữa các đoạn ("chạy 1 đoạn load 1 đoạn"), đọc nối tiếp mượt mà 0ms.
  - Tự động chuyển tiếp đoạn kế tiếp và hỏi chuyển chương khi đọc hết.
- [ ] **Lưu vị trí đọc (Reading Progress)**: Tự động ghi nhớ chương và vị trí đang đọc dở (lưu Supabase hoặc LocalStorage).
- [ ] **Tùy chỉnh giao diện đọc**: Thanh công cụ chỉnh cỡ chữ, font chữ (serif/sans-serif), màu nền (Sáng, Tối, Vàng giấy Sepia).
- [ ] **Mục lục chương nhanh**: Drawer/Sidebar danh sách chương nhảy nhanh đến chương cần đọc.

### Giai đoạn tiếp theo 2: Mở rộng nguồn cào
- [ ] Hỗ trợ thêm nguồn: Tangthuvien, TruyenFull.
- [ ] Cơ chế tự động lên lịch cào chương mới định kỳ cho các truyện đang ra.

### Giai đoạn tiếp theo 3: Audio AI & Highlight chữ
- [ ] Tích hợp Web Speech API đọc thử bằng giọng trình duyệt.
- [ ] Tích hợp Edge TTS tạo file audio mp3 + timestamp từng từ để highlight chữ chạy theo giọng đọc.
