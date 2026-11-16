package com.diennng.truyen.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/audio")
public class AudioApiController {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cache tối đa 300 đoạn gần nhất trong RAM (~10-15MB) để tua lại hoặc nghe lại là tức thì 0ms
    private final Map<String, byte[]> audioCache = Collections.synchronizedMap(
            new LinkedHashMap<String, byte[]>(300, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
                    return size() > 300;
                }
            }
    );

    // Cache JSON dữ liệu âm thanh + word boundary
    private final Map<String, String> jsonCache = Collections.synchronizedMap(
            new LinkedHashMap<String, String>(200, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
                    return size() > 200;
                }
            }
    );

    /**
     * Endpoint tổng hợp âm thanh kèm Word Boundary (mốc thời gian từng từ) để Highlight chữ theo giọng đọc
     * POST /api/audio/synthesize
     */
    @PostMapping(value = "/synthesize", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> synthesizeAudio(@RequestBody Map<String, String> request) {
        String text = request.getOrDefault("text", "").trim();
        String voice = request.getOrDefault("voice", "vi-VN-NamMinhNeural");
        String rate = request.getOrDefault("rate", "+0%");

        if (text.isEmpty()) {
            return ResponseEntity.badRequest().body("{\"error\":\"Text is empty\"}");
        }

        if (text.length() > 3000) {
            text = text.substring(0, 3000);
        }

        String cacheKey = "synth_" + voice + "_" + rate + "_" + text.hashCode();
        String cachedJson = jsonCache.get(cacheKey);
        if (cachedJson != null) {
            return ResponseEntity.ok(cachedJson);
        }

        try {
            ProcessBuilder pb = new ProcessBuilder("python", "scripts/synthesize.py");
            pb.redirectErrorStream(false);
            Process process = pb.start();

            String jsonInput = String.format("{\"text\":%s,\"voice\":%s,\"rate\":%s}",
                    objectMapper.writeValueAsString(text),
                    objectMapper.writeValueAsString(voice),
                    objectMapper.writeValueAsString(rate)
            );

            try (OutputStream os = process.getOutputStream()) {
                os.write(jsonInput.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (InputStream is = process.getInputStream()) {
                is.transferTo(baos);
            }

            process.waitFor();
            String outputJson = baos.toString(StandardCharsets.UTF_8);

            if (outputJson.contains("\"audio\"")) {
                jsonCache.put(cacheKey, outputJson);
                return ResponseEntity.ok(outputJson);
            } else {
                return ResponseEntity.status(500).body(outputJson);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint stream trực tiếp âm thanh từ Microsoft Edge Neural TTS
     * GET /api/audio/stream?text=...&voice=vi-VN-NamMinhNeural&rate=+0%
     */
    @GetMapping(value = "/stream", produces = "audio/mpeg")
    public void streamAudio(
            @RequestParam String text,
            @RequestParam(defaultValue = "vi-VN-NamMinhNeural") String voice,
            @RequestParam(defaultValue = "+0%") String rate,
            HttpServletResponse response) {

        try {
            String decodedText = URLDecoder.decode(text, StandardCharsets.UTF_8).trim();
            if (decodedText.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            if (decodedText.length() > 3000) {
                decodedText = decodedText.substring(0, 3000);
            }

            String cacheKey = voice + "_" + rate + "_" + decodedText.hashCode();
            byte[] cachedBytes = audioCache.get(cacheKey);

            response.setContentType("audio/mpeg");
            response.setHeader("Cache-Control", "public, max-age=86400");
            response.setHeader("Accept-Ranges", "bytes");

            if (cachedBytes != null && cachedBytes.length > 0) {
                response.setContentLength(cachedBytes.length);
                response.getOutputStream().write(cachedBytes);
                response.getOutputStream().flush();
                return;
            }

            ProcessBuilder pb = new ProcessBuilder(
                    "edge-tts",
                    "--text", decodedText,
                    "--voice", voice,
                    "--rate", rate,
                    "--write-media", "-"
            );
            pb.redirectErrorStream(false);
            Process process = pb.start();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (InputStream is = process.getInputStream();
                 OutputStream os = response.getOutputStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                    baos.write(buffer, 0, bytesRead);
                }
                os.flush();
            }

            process.waitFor();

            byte[] generatedBytes = baos.toByteArray();
            if (generatedBytes.length > 0) {
                audioCache.put(cacheKey, generatedBytes);
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
