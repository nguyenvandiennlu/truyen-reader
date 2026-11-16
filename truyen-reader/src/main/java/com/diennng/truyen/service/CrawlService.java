package com.diennng.truyen.service;

import com.diennng.truyen.crawler.SiteCrawler;
import com.diennng.truyen.dto.CrawlProgressEvent;
import com.diennng.truyen.dto.RemoteStoryInfoDto;
import com.diennng.truyen.model.Chapter;
import com.diennng.truyen.model.Story;
import com.diennng.truyen.repository.ChapterRepository;
import com.diennng.truyen.repository.StoryRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.text.Normalizer;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
public class CrawlService {

    private final List<SiteCrawler> crawlers;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final EntityManager entityManager;

    public CrawlService(List<SiteCrawler> crawlers,
                        StoryRepository storyRepository,
                        ChapterRepository chapterRepository,
                        EntityManager entityManager) {
        this.crawlers = crawlers;
        this.storyRepository = storyRepository;
        this.chapterRepository = chapterRepository;
        this.entityManager = entityManager;
    }

    /**
     * Lấy thông tin đối soát chương giữa CSDL Supabase và web nguồn
     */
    public RemoteStoryInfoDto getRemoteStoryInfo(Long storyId, String url) {
        RemoteStoryInfoDto info = new RemoteStoryInfoDto();
        Story story = null;
        if (storyId != null) {
            story = storyRepository.findById(storyId).orElse(null);
        }

        String targetUrl = url;
        if ((targetUrl == null || targetUrl.trim().isEmpty()) && story != null) {
            targetUrl = story.getSourceUrl();
        }

        // Tự động tìm truyện theo sourceUrl nếu chưa có storyId
        if (story == null && targetUrl != null && !targetUrl.trim().isEmpty()) {
            String clean = targetUrl.trim();
            story = storyRepository.findBySourceUrl(clean).orElse(null);
            if (story == null && clean.contains("/truyen/")) {
                String potentialSlug = clean.replaceAll(".*/truyen/([^/?#]+).*", "$1");
                String potentialBaseUrl = "https://truyenc.net/truyen/" + potentialSlug;
                story = storyRepository.findBySourceUrl(potentialBaseUrl).orElse(null);
            }
        }

        if (story != null) {
            populateLocalStoryInfo(info, story);
            if (targetUrl == null || targetUrl.trim().isEmpty()) {
                targetUrl = story.getSourceUrl();
            }
        }

        if (targetUrl == null || targetUrl.trim().isEmpty()) {
            return info;
        }

        SiteCrawler crawler = findCrawler(targetUrl);
        if (crawler != null) {
            RemoteStoryInfoDto remoteData = crawler.extractRemoteInfo(targetUrl);
            if (remoteData.getStoryTitle() != null && !remoteData.getStoryTitle().isEmpty()) {
                info.setStoryTitle(remoteData.getStoryTitle());
                if (story == null) {
                    story = storyRepository.findByTitle(remoteData.getStoryTitle()).orElse(null);
                    if (story != null) {
                        populateLocalStoryInfo(info, story);
                    }
                }
            }
            if (remoteData.getAuthor() != null) info.setAuthor(remoteData.getAuthor());
            if (remoteData.getSourceUrl() != null) info.setSourceUrl(remoteData.getSourceUrl());
            info.setRemoteMaxChapter(remoteData.getRemoteMaxChapter());
            int missing = Math.max(0, remoteData.getRemoteMaxChapter() - info.getLatestLocalChapter());
            info.setMissingChapters(missing);
        }

        return info;
    }

    private void populateLocalStoryInfo(RemoteStoryInfoDto info, Story story) {
        info.setStoryId(story.getId());
        info.setStoryTitle(story.getTitle());
        info.setAuthor(story.getAuthor());
        int count = chapterRepository.countByStoryId(story.getId());
        int latest = chapterRepository.findTopByStoryIdOrderByChapterNoDesc(story.getId())
                .map(Chapter::getChapterNo).orElse(0);
        info.setLocalChapterCount(count);
        info.setLatestLocalChapter(latest);
        info.setSourceUrl(story.getSourceUrl());
    }

    public void startCrawlAsync(String url, int maxChapters, SseEmitter emitter) {
        CompletableFuture.runAsync(() -> {
            try {
                if (url == null || url.trim().isEmpty()) {
                    sendEvent(emitter, CrawlProgressEvent.error("Đường dẫn truyện không được để trống"));
                    emitter.complete();
                    return;
                }

                String cleanUrl = url.trim();
                SiteCrawler crawler = findCrawler(cleanUrl);
                if (crawler == null) {
                    sendEvent(emitter, CrawlProgressEvent.error("Chưa hỗ trợ cào từ nguồn này. Hiện hỗ trợ truyenc.net và truyendocviet1.shop"));
                    emitter.complete();
                    return;
                }

                // Lấy thông tin cơ bản để tạo/tìm Story
                RemoteStoryInfoDto info = crawler.extractRemoteInfo(cleanUrl);
                String title = (info.getStoryTitle() != null && !info.getStoryTitle().isEmpty())
                        ? info.getStoryTitle()
                        : "Truyện mới";
                String author = (info.getAuthor() != null) ? info.getAuthor() : "Đang cập nhật";
                String sourceUrl = (info.getSourceUrl() != null) ? info.getSourceUrl() : cleanUrl;

                Story story = getOrCreateStory(title, author, sourceUrl);

                // Bắt đầu cào
                crawler.crawl(cleanUrl, maxChapters, story, emitter, this::saveOrUpdateChapter);

            } catch (Exception e) {
                sendEvent(emitter, CrawlProgressEvent.error("Lỗi xảy ra trong quá trình cào: " + e.getMessage()));
                emitter.complete();
            } finally {
                cleanupMemory();
            }
        });
    }

    public void updateStoryAsync(Long storyId, int maxChapters, SseEmitter emitter) {
        CompletableFuture.runAsync(() -> {
            try {
                Optional<Story> storyOpt = storyRepository.findById(storyId);
                if (storyOpt.isEmpty()) {
                    sendEvent(emitter, CrawlProgressEvent.error("Không tìm thấy truyện trong hệ thống"));
                    emitter.complete();
                    return;
                }
                Story story = storyOpt.get();
                String sourceUrl = story.getSourceUrl();
                if (sourceUrl == null || sourceUrl.trim().isEmpty()) {
                    sendEvent(emitter, CrawlProgressEvent.error("Truyện này chưa có link nguồn. Vui lòng nhập link để cào truyện!"));
                    emitter.complete();
                    return;
                }

                int latestNo = chapterRepository.findTopByStoryIdOrderByChapterNoDesc(storyId)
                        .map(Chapter::getChapterNo).orElse(0);
                int nextNo = latestNo + 1;
                sendEvent(emitter, CrawlProgressEvent.starting("Truyện “" + story.getTitle() + "” hiện có " + latestNo + " chương. Bắt đầu cập nhật từ chương " + nextNo + "..."));

                String targetUrl = sourceUrl;
                if (sourceUrl.contains("truyenc.net") || sourceUrl.contains("truyenc")) {
                    String slug = sourceUrl.replaceAll(".*/truyen/([^/?#]+).*", "$1");
                    targetUrl = "https://truyenc.net/truyen/" + slug + "/chuong-" + nextNo;
                }

                startCrawlAsync(targetUrl, maxChapters, emitter);

            } catch (Exception e) {
                sendEvent(emitter, CrawlProgressEvent.error("Lỗi khi cập nhật chương: " + e.getMessage()));
                emitter.complete();
            }
        });
    }

    public SiteCrawler findCrawler(String url) {
        if (url == null) return null;
        for (SiteCrawler crawler : crawlers) {
            if (crawler.supports(url)) {
                return crawler;
            }
        }
        return null;
    }

    private Story getOrCreateStory(String title, String author, String sourceUrl) {
        String cleanTitle = Normalizer.normalize(title.trim(), Normalizer.Form.NFC);
        String cleanAuthor = author != null ? Normalizer.normalize(author.trim(), Normalizer.Form.NFC) : "Đang cập nhật";
        Optional<Story> existing = storyRepository.findByTitle(cleanTitle);
        if (existing.isPresent()) {
            Story s = existing.get();
            if ((s.getSourceUrl() == null || s.getSourceUrl().trim().isEmpty()) && sourceUrl != null) {
                s.setSourceUrl(sourceUrl);
                storyRepository.save(s);
            }
            return s;
        }
        Story newStory = new Story(cleanTitle, cleanAuthor, sourceUrl);
        return storyRepository.save(newStory);
    }

    @Transactional
    public void saveOrUpdateChapter(Story story, int chapterNo, String title, String content) {
        String cleanTitle = Normalizer.normalize(title.trim(), Normalizer.Form.NFC);
        String cleanContent = Normalizer.normalize(content, Normalizer.Form.NFC);
        Optional<Chapter> existing = chapterRepository.findByStoryIdAndChapterNo(story.getId(), chapterNo);
        if (existing.isPresent()) {
            Chapter c = existing.get();
            c.setTitle(cleanTitle);
            c.setContent(cleanContent);
            chapterRepository.save(c);
        } else {
            Chapter newChapter = new Chapter(story, chapterNo, cleanTitle, cleanContent);
            chapterRepository.save(newChapter);
        }
        try {
            entityManager.flush();
            entityManager.clear();
        } catch (Exception ignored) {
        }
    }

    private void cleanupMemory() {
        try {
            if (entityManager != null) {
                entityManager.clear();
            }
            System.gc();
        } catch (Exception ignored) {
        }
    }

    private void sendEvent(SseEmitter emitter, CrawlProgressEvent event) {
        try {
            emitter.send(SseEmitter.event().data(event));
        } catch (Exception ignored) {
        }
    }
}
