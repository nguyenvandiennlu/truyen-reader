package com.diennng.truyen.controller;

import com.diennng.truyen.dto.CrawlRequest;
import com.diennng.truyen.dto.RemoteStoryInfoDto;
import com.diennng.truyen.service.CrawlService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/crawl")
public class CrawlController {

    private final CrawlService crawlService;

    public CrawlController(CrawlService crawlService) {
        this.crawlService = crawlService;
    }

    /**
     * Endpoint kiểm tra thông tin truyện từ web nguồn (tổng số chương nguồn, số chương trong DB, số chương thiếu)
     * GET /api/crawl/info?storyId=...&url=...
     */
    @GetMapping("/info")
    public RemoteStoryInfoDto getStoryInfo(@RequestParam(required = false) Long storyId,
                                           @RequestParam(required = false) String url) {
        return crawlService.getRemoteStoryInfo(storyId, url);
    }

    /**
     * Endpoint SSE cho Web UI (EventSource)
     * GET /api/crawl/stream?url=...&maxChapters=20
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamCrawl(@RequestParam String url,
                                  @RequestParam(defaultValue = "20") int maxChapters,
                                  HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        // Timeout 2 giờ cho quá trình cào dài hàng ngàn chương
        SseEmitter emitter = new SseEmitter(7200_000L);
        emitter.onCompletion(() -> {});
        emitter.onTimeout(emitter::complete);
        emitter.onError((e) -> emitter.complete());
        crawlService.startCrawlAsync(url, maxChapters, emitter);
        return emitter;
    }

    /**
     * Endpoint SSE tự động cập nhật các chương mới nhất cho truyện đã có
     * GET /api/crawl/update/{storyId}?maxChapters=100
     */
    @GetMapping(value = "/update/{storyId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter updateStory(@PathVariable Long storyId,
                                  @RequestParam(defaultValue = "100") int maxChapters,
                                  HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Connection", "keep-alive");
        SseEmitter emitter = new SseEmitter(7200_000L);
        emitter.onCompletion(() -> {});
        emitter.onTimeout(emitter::complete);
        emitter.onError((e) -> emitter.complete());
        crawlService.updateStoryAsync(storyId, maxChapters, emitter);
        return emitter;
    }

    /**
     * Endpoint POST nhận JSON cho CLI hoặc script
     * POST /api/crawl
     */
    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter postCrawl(@RequestBody CrawlRequest request) {
        SseEmitter emitter = new SseEmitter(7200_000L);
        emitter.onCompletion(() -> {});
        emitter.onTimeout(emitter::complete);
        emitter.onError((e) -> emitter.complete());
        crawlService.startCrawlAsync(request.getUrl(), request.getMaxChapters(), emitter);
        return emitter;
    }
}
