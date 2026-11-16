#!/usr/bin/env node

/**
 * Công cụ cào truyện CLI cho Truyện Reader
 * Sử dụng:
 *   node crawl-cli.js "https://truyendocviet1.shop/doc-truyen/tam-thi-nhan-nguoi-tim-xac.html" 20
 */

const readline = require("readline");

const API_BASE = process.env.API_BASE || "http://localhost:8080";

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function main() {
  console.log("==========================================");
  console.log("   CÔNG CỤ CÀO TRUYỆN - TRUYỆN READER    ");
  console.log("==========================================\n");

  let url = process.argv[2];
  let max = process.argv[3];

  if (!url) {
    url = await askQuestion("Nhập link truyện hoặc chương (vd: https://truyendocviet1.shop/...): ");
  }

  if (!url) {
    console.error("Vui lòng nhập đường dẫn hợp lệ!");
    process.exit(1);
  }

  if (!max) {
    const maxInput = await askQuestion("Số chương muốn cào (mặc định: 20): ");
    max = maxInput ? parseInt(maxInput, 10) : 20;
  } else {
    max = parseInt(max, 10);
  }

  console.log(`\nĐang gửi yêu cầu cào tới Backend: ${API_BASE}/api/crawl/stream`);
  console.log(`- Link: ${url}`);
  console.log(`- Tối đa: ${max} chương\n`);

  try {
    const streamUrl = `${API_BASE}/api/crawl/stream?url=${encodeURIComponent(url)}&maxChapters=${max}`;
    const res = await fetch(streamUrl);

    if (!res.ok) {
      throw new Error(`Máy chủ trả về HTTP ${res.status}: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        const dataLine = block
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;

        try {
          const payload = JSON.parse(dataLine.replace("data:", "").trim());
          if (payload.status === "STARTING") {
            console.log(`[BẮT ĐẦU] ${payload.message}`);
          } else if (payload.status === "PROGRESS") {
            console.log(
              `[${payload.current}/${payload.total}] Đã tải: ${payload.chapterTitle}`
            );
          } else if (payload.status === "COMPLETED") {
            console.log(`\n THÀNH CÔNG: ${payload.message}`);
            if (payload.storyId) {
              console.log(` Đọc tại Web: http://localhost:3000/truyen/${payload.storyId}`);
            }
          } else if (payload.status === "ERROR") {
            console.error(`\n LỖI: ${payload.message}`);
          }
        } catch (e) {
          // Bỏ qua JSON parse lỗi từ keep-alive
        }
      }
    }
  } catch (err) {
    console.error("Lỗi khi kết nối đến backend:", err.message);
    console.log("Mẹo: Hãy đảm bảo Spring Boot backend đang chạy tại port 8080!");
  }
}

main();
