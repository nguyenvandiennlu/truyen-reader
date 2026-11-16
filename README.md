# 📚 Truyen Reader & Audio AI — Nền Tảng Đọc Truyện & Sách Nói Thông Minh
### Dự Án Cá Nhân — Nguyễn Văn Điền (Đại Học Nông Lâm TP.HCM - NLU)

<div align="center">
  <!-- Smart Novel & Audio AI Logo SVG -->
  <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="background: #0b0f19; border-radius: 24px; padding: 15px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 30px rgba(245, 158, 11, 0.25);">
    <path d="M20 28 C20 24, 24 20, 30 20 L46 20 C48 20, 50 22, 50 25 L50 78 C50 75, 46 73, 42 73 L26 73 C22 73, 20 75, 20 78 Z" fill="url(#bookGradLeft)" opacity="0.9" />
    <path d="M80 28 C80 24, 76 20, 70 20 L54 20 C52 20, 50 22, 50 25 L50 78 C50 75, 54 73, 58 73 L74 73 C78 73, 80 75, 80 78 Z" fill="url(#bookGradRight)" opacity="0.9" />
    <path d="M50 25 L50 78" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" />
    <!-- Audio Wave lines -->
    <path d="M30 46 L30 52" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
    <path d="M37 40 L37 58" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
    <path d="M44 44 L44 54" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
    <path d="M56 44 L56 54" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
    <path d="M63 38 L63 60" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
    <path d="M70 46 L70 52" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
    <defs>
      <linearGradient id="bookGradLeft" x1="20" y1="20" x2="50" y2="78" gradientUnits="userSpaceOnUse">
        <stop stop-color="#1e293b" />
        <stop offset="1" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="bookGradRight" x1="50" y1="20" x2="80" y2="78" gradientUnits="userSpaceOnUse">
        <stop stop-color="#334155" />
        <stop offset="1" stop-color="#1e293b" />
      </linearGradient>
    </defs>
  </svg>

  <p align="center" style="margin-top: 15px;">
    <strong>Hệ sinh thái đọc truyện trực tuyến hiện đại kết hợp Trí Tuệ Nhân Tạo (Audio AI Neural TTS) và cơ chế cào dữ liệu tự động đa nguồn (Auto Web Crawler).</strong>
  </p>

  <p align="center">
    <a href="https://github.com/nguyenvandiennlu/truyen-reader"><img src="https://img.shields.io/badge/GitHub-Repository-blue?logo=github&style=flat-square" alt="Repo" /></a>
    <img src="https://img.shields.io/badge/Next.js-16.4-black?logo=next.js&style=flat-square" alt="Next.js" />
    <img src="https://img.shields.io/badge/Spring_Boot-3.3.5-brightgreen?logo=springboot&style=flat-square" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/Java-17%2F21-orange?logo=openjdk&style=flat-square" alt="Java" />
    <img src="https://img.shields.io/badge/PostgreSQL-Supabase_Cloud-3ecf8e?logo=supabase&style=flat-square" alt="Supabase" />
    <img src="https://img.shields.io/badge/Python-Edge_TTS_7.3-yellow?logo=python&style=flat-square" alt="Python" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-06b6d4?logo=tailwindcss&style=flat-square" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker&style=flat-square" alt="Docker" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  </p>
</div>

---

## 📖 Giới thiệu dự án

**Truyen Reader & Audio AI** là giải pháp toàn diện cho trải nghiệm đọc truyện và nghe sách nói online chất lượng cao. Dự án giải quyết các vấn đề cố hữu của các trang web đọc truyện truyền thống: quảng cáo rác, giao diện rối mắt, giọng đọc robot thiếu cảm xúc, độ trễ giật lag khi chuyển đoạn và dữ liệu không được đồng bộ đám mây dài hạn.

### Các tính năng cốt lõi nổi bật:
* **🎧 Audio AI Neural TTS Tự Nhiên:**
  * Tích hợp giọng đọc doanh nghiệp cao cấp từ Microsoft Azure/Edge Neural: `vi-VN-NamMinhNeural` (giọng nam trầm ấm, truyền cảm) và `vi-VN-HoaiMyNeural` (giọng nữ thanh thoát, tự nhiên).
  * Điều chỉnh tốc độ đọc linh hoạt từ `0.85x` đến `1.5x` theo thói quen của người nghe.
* **✨ Karaoke Word-by-Word Highlight (60fps):**
  * Tận dụng sự kiện `WordBoundary` từ engine TTS để tính toán mốc thời gian bắt đầu và kết thúc của **từng từ** trong câu.
  * Giọng đọc nói tới chữ nào thì chữ đó **tự động sáng đèn vàng hổ phách nổi bật** (`bg-amber-400 font-bold`) ở tốc độ khung hình 60fps mượt mà.
  * Tự động cuộn trang êm ái (`smooth scroll`) đưa đoạn văn đang đọc vào đúng trung tâm tầm mắt.
* **⚡ Gapless Prefetching & LRU RAM Cache (Độ trễ 0ms):**
  * Tự động tải trước 3 đoạn văn kế tiếp vào bộ nhớ RAM (`Blob URL`). Khi đoạn hiện tại vừa kết thúc, đoạn tiếp theo được phát ngay lập tức không có độ trễ hay khoảng dừng khựng ("chạy 1 đoạn load 1 đoạn").
  * Bộ nhớ đệm **LRU Cache 300 đoạn** trên Spring Boot giúp tua lại hoặc nghe lại phản hồi chỉ trong **1 mili-giây**.
* **🛡️ Singleton Audio Engine:**
  * Quản lý vòng đời âm thanh tập trung, tự động ngắt tiếng khi chuyển chương hoặc thoát trang, triệt tiêu 100% hiện tượng 2 giọng nói phát song song.
* **🕷️ Auto Web Crawler Đa Nguồn (Strategy Pattern):**
  * Thu thập dữ liệu chương truyện tự động với tốc độ cao, hỗ trợ nguồn `truyenc.net` và `truyendocviet1.shop`.
  * Tự động xử lý phông chữ mã hoá, giải mã ký tự cipher font và Base64 sang tiếng Việt nguyên bản chuẩn Unicode NFC.
  * Phát sóng tiến trình cào thời gian thực bằng **Server-Sent Events (SSE)**.
* **☁️ Cloud Native Storage (Supabase PostgreSQL):**
  * Toàn bộ thư viện truyện và hàng ngàn chương được lưu trữ vĩnh viễn trên Supabase Cloud (Singapore), an toàn và không phụ thuộc vào bộ nhớ cục bộ.

---

## 🎨 Kiến Trúc Hệ Thống (Architecture Pipeline)

Quy trình xử lý dữ liệu và luồng âm thanh được thiết kế phân tầng rõ ràng, đảm bảo hiệu năng tối đa:

```
[ Nguồn Truyện Web ] 
        │ (Crawl Strategy / Base64 Decode)
        ▼
[ Spring Boot Crawler Engine ] ──(Lưu trữ vĩnh viễn)──► [ Supabase PostgreSQL Cloud ]
        │                                                          │
        ▼ (REST API / SSE Streams)                                  ▼ (JPA Queries)
[ Next.js Frontend Reader ] ◄──────────────────────────────────────┘
        │
        ├──► 1. Bấm nghe đoạn văn ──► Gửi Text + Voice + Rate
        │                                     │
        │                                     ▼
        │                     [ Audio API & Python Engine ]
        │                                     │
        │                        (Edge TTS WordBoundary)
        │                                     │
        │                                     ▼
        ◄─── Trả về Audio Base64 + Timestamps từng từ [start, end, charStart, charEnd]
        │
        ├──► [ Gapless Prefetch Queue ] : Tải trước đoạn n+1, n+2 vào RAM (0ms trễ)
        └──► [ RequestAnimationFrame Loop (60fps) ] : Highlight chữ vàng chạy theo giọng đọc
```

---

## 🛠️ Chi Tiết Công Nghệ (Tech Stack)

| Phân Vùng | Công Nghệ Sử Dụng | Mục Đích Sử Dụng |
| :--- | :--- | :--- |
| **Giao Diện (Frontend)** | **Next.js 16 (App Router)**, React 19, Turbopack | Server-side Rendering & Client Navigation siêu tốc |
| **Giao Diện & Icon** | **Tailwind CSS v4**, Lucide React, Shadcn/UI | Thiết kế Dark/Light mode tối giản, hiện đại |
| **Máy Chủ (Backend)** | **Spring Boot 3.3.5 (Java 17/21)**, Maven | Cung cấp RESTful API, quản lý Crawler & SSE Streaming |
| **Cơ Sở Dữ Liệu** | **Supabase PostgreSQL 15+** (Singapore) | Lưu trữ đám mây tốc độ cao, Session Pooler IPv4 |
| **Trí Tuệ Nhân Tạo (TTS)** | **Python 3.11**, `edge-tts 7.3.1` | Chuyển văn bản thành giọng nói tự nhiên, trích xuất mốc thời gian |
| **Bộ Cào Dữ Liệu** | **Jsoup**, Strategy Pattern, Jackson JSON | Bóc tách DOM, giải mã mã hóa văn bản, cào tự động |
| **Đóng Gói & Triển Khai** | **Docker Multi-Stage**, Render, Vercel | Đóng gói môi trường kép (Java + Python), deploy miễn phí |

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
truyen-reader/
├── frontend/                              # --- ỨNG DỤNG FRONTEND (Next.js) ---
│   ├── src/
│   │   ├── app/                           # Cấu trúc App Router
│   │   │   ├── truyen/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── chuong/[no]/       # Trang đọc truyện chi tiết
│   │   │   │   │   └── page.tsx           # Trang thông tin truyện & danh sách chương
│   │   │   │   └── page.tsx
│   │   │   ├── globals.css                # Style toàn cục & biến màu sắc
│   │   │   ├── layout.tsx                 # Root layout bọc giao diện
│   │   │   └── page.tsx                   # Trang chủ thư viện truyện
│   │   ├── components/                    # Các thành phần giao diện dùng chung
│   │   │   ├── reader-page.tsx            # Trình đọc chương truyện & Audio AI Player
│   │   │   ├── story-detail-page.tsx      # Quản lý truyện, danh sách chương & nút cào
│   │   │   ├── crawl-dialog.tsx           # Hộp thoại cào dữ liệu với thanh tiến độ SSE
│   │   │   └── app-shell.tsx              # Sidebar điều hướng & danh sách chương nhanh
│   │   └── lib/api.ts                     # Hàm gọi API backend
│   ├── next.config.ts                     # Cấu hình Turbopack & Reverse Proxy API
│   ├── package.json                       # Thư viện phụ thuộc Node.js
│   └── tsconfig.json
│
├── truyen-reader/                         # --- ỨNG DỤNG BACKEND (Spring Boot) ---
│   ├── src/main/java/com/diennng/truyen/
│   │   ├── config/WebConfig.java          # Cấu hình CORS đa miền
│   │   ├── controller/
│   │   │   ├── AudioApiController.java    # API tổng hợp âm thanh & streaming TTS
│   │   │   ├── CrawlController.java       # API cào truyện & phát luồng sự kiện SSE
│   │   │   └── StoryApiController.java    # API CRUD truyện và chương truyện
│   │   ├── crawler/                       # Module cào dữ liệu phân tách (Strategy Pattern)
│   │   │   ├── SiteCrawler.java           # Interface cào chung
│   │   │   ├── TruyenCCrawler.java        # Parser riêng cho truyenc.net
│   │   │   ├── TruyenDocVietCrawler.java  # Parser & giải mã cho truyendocviet1.shop
│   │   │   └── HttpHelper.java            # Tiện ích HTTP request & User-Agent
│   │   ├── model/                         # Entity JPA: Story, Chapter
│   │   ├── repository/                    # Spring Data JPA Repositories
│   │   ├── service/CrawlService.java      # Điều phối tiến trình cào & lưu cơ sở dữ liệu
│   │   └── TruyenApplication.java         # Điểm khởi chạy chính của Spring Boot
│   ├── scripts/
│   │   └── synthesize.py                  # Script Python xử lý Edge TTS WordBoundary
│   ├── src/main/resources/
│   │   └── application.properties         # Cấu hình Supabase PostgreSQL & cổng ứng dụng
│   ├── Dockerfile                         # Đóng gói Multi-stage build (Java 17 + Python 3)
│   ├── .dockerignore
│   └── pom.xml                            # Quản lý dependencies Maven
│
├── .gitignore                             # Cấu hình loại trừ file rác / node_modules
├── LICENSE                                # Giấy phép bản quyền mã nguồn mở MIT
├── PLAN.md                                # Kế hoạch phát triển & Nhật ký cập nhật
└── README.md                              # Tài liệu hướng dẫn sử dụng dự án
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy Local

### Yêu cầu tiên quyết
- **Java**: JDK 17 hoặc 21 trở lên (Đã cài Maven hoặc sử dụng Maven Wrapper).
- **Node.js**: v18+ trở lên & npm.
- **Python**: 3.10+ trở lên.

---

### 1. Khởi chạy Backend (Spring Boot & Audio AI)

1. **Cài đặt thư viện Python TTS:**
   ```bash
   pip install --upgrade edge-tts
   ```
2. **Di chuyển vào thư mục backend:**
   ```bash
   cd truyen-reader
   ```
3. **Kiểm tra file cấu hình `src/main/resources/application.properties`:**
   Ứng dụng đã được cấu hình sẵn kết nối tới cơ sở dữ liệu Supabase PostgreSQL:
   ```properties
   server.port=${PORT:8080}
   spring.datasource.url=${SPRING_DATASOURCE_URL}
   spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
   spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
   ```
4. **Biên dịch và chạy ứng dụng Spring Boot:**
   ```bash
   mvn spring-boot:run
   ```
   _Backend sẽ khởi chạy tại cổng: `http://localhost:8080`_

---

### 2. Khởi chạy Frontend (Next.js)

1. **Mở một cửa sổ Terminal mới và di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   ```
2. **Cài đặt các gói thư viện phụ thuộc:**
   ```bash
   npm install
   ```
3. **Khởi chạy môi trường phát triển Next.js:**
   ```bash
   npm run dev
   ```
   _Giao diện đọc truyện sẵn sàng tại: `http://localhost:3000`_

---

## ☁️ Hướng Dẫn Triển Khai Lên Đám Mây (Deploy Online 24/7 Miễn Phí)

### Bước 1: Đưa mã nguồn lên GitHub
```bash
git remote add origin https://github.com/nguyenvandiennlu/truyen-reader.git
git push -u origin main
```

### Bước 2: Deploy Backend lên Render.com (Miễn phí)
1. Đăng nhập [Render.com](https://render.com) bằng tài khoản GitHub.
2. Nhấn **New +** -> Chọn **Web Service** -> Chọn repository `truyen-reader`.
3. Điền thông số:
   * **Root Directory:** `truyen-reader`
   * **Language / Environment:** `Docker` *(Render sẽ tự động dùng Dockerfile có Java 17 + Python `edge-tts`)*
   * **Region:** Singapore
   * **Instance Type:** Free ($0/tháng)
4. Nhấn **Deploy Web Service** và sao chép URL sau khi hoàn thành (ví dụ: `https://truyen-backend.onrender.com`).

### Bước 3: Deploy Frontend lên Vercel.com (Miễn phí)
1. Đăng nhập [Vercel.com](https://vercel.com) bằng tài khoản GitHub.
2. Nhấn **Add New...** -> **Project** -> Chọn repository `truyen-reader`.
3. Thiết lập thông số:
   * **Root Directory:** Nhấn Edit chọn thư mục `frontend`
   * **Framework Preset:** Giữ nguyên `Next.js`
   * **Environment Variables:** Thêm biến:
     * `BACKEND_URL`: URL Backend trên Render (ví dụ: `https://truyen-backend.onrender.com`)
4. Nhấn **Deploy**. Sau 1 phút, bạn sẽ có liên kết web trực tuyến để đọc truyện trên điện thoại và máy tính bất kỳ lúc nào!

---

## 🔌 Đặc Tả API Endpoints

### 1. Tổng hợp Audio AI kèm mốc thời gian từng từ (Karaoke WordBoundary)
- **Endpoint:** `POST /api/audio/synthesize`
- **Request Body (JSON):**
  ```json
  {
    "text": "Phương Bình hoa nửa giờ, cuối cùng cũng coi như xác định một chuyện.",
    "voice": "vi-VN-NamMinhNeural",
    "rate": "+0%"
  }
  ```
- **Response (JSON 200 OK):**
  ```json
  {
    "audio": "data:audio/mpeg;base64,//NkxAAAAANIA...",
    "words": [
      { "text": "Phương", "start": 0.10, "end": 0.46, "charStart": 0, "charEnd": 6 },
      { "text": "Bình", "start": 0.46, "end": 0.68, "charStart": 7, "charEnd": 11 },
      { "text": "hoa", "start": 0.68, "end": 0.92, "charStart": 12, "charEnd": 15 },
      { "text": "nửa", "start": 0.92, "end": 1.15, "charStart": 16, "charEnd": 19 },
      { "text": "giờ", "start": 1.15, "end": 1.47, "charStart": 20, "charEnd": 23 }
    ]
  }
  ```

### 2. Stream âm thanh trực tiếp (Direct Audio Stream)
- **Endpoint:** `GET /api/audio/stream?text={text}&voice={voice}&rate={rate}`
- **Headers trả về:** `Content-Type: audio/mpeg`, `Cache-Control: public, max-age=86400`.

### 3. Cào truyện thời gian thực (Server-Sent Events)
- **Endpoint:** `GET /api/crawl/stream?url={storyUrl}`
- **Response Event Stream:**
  ```text
  event: START
  data: {"message":"Bắt đầu cào dữ liệu truyện..."}

  event: PROGRESS
  data: {"storyTitle":"Toàn Cầu Cao Võ","current":15,"total":1437,"chapterTitle":"Chương 15:..."}

  event: COMPLETE
  data: {"message":"Hoàn tất cào dữ liệu!"}
  ```

### 4. Quản lý truyện và chương
- `GET /api/truyen` : Lấy danh sách toàn bộ truyện trong kho lưu trữ.
- `GET /api/truyen/{id}` : Lấy thông tin truyện và danh sách tóm tắt các chương.
- `GET /api/truyen/{id}/chuong/{no}` : Lấy nội dung chi tiết của chương truyện kèm trạng thái chương trước/sau.

---

## 🛡️ Bản Quyền (License)

Dự án này được phát hành dưới giấy phép mã nguồn mở **[MIT License](LICENSE)**.

---

## 👨‍💻 Tác Giả & Liên Hệ

Dự án được xây dựng và hoàn thiện bởi:

* **Nguyễn Văn Điền**
* **Trường:** Đại học Nông Lâm TP.HCM (NLU)
* **Mã số sinh viên (MSSV):** `23130061`
* **Email:** [23130061@st.hcmuaf.edu.vn](mailto:23130061@st.hcmuaf.edu.vn)
* **GitHub:** [@nguyenvandiennlu](https://github.com/nguyenvandiennlu)

---

_Cảm ơn bạn đã quan tâm và trải nghiệm dự án Truyen Reader & Audio AI!_ 🎧📚
