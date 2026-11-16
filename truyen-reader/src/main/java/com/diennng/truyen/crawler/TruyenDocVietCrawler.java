package com.diennng.truyen.crawler;

import com.diennng.truyen.dto.CrawlProgressEvent;
import com.diennng.truyen.dto.RemoteStoryInfoDto;
import com.diennng.truyen.model.Story;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.text.Normalizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TruyenDocVietCrawler implements SiteCrawler {

    private final HttpHelper httpHelper;
    private final ObjectMapper objectMapper;

    public TruyenDocVietCrawler(HttpHelper httpHelper) {
        this.httpHelper = httpHelper;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public boolean supports(String url) {
        return url != null && (url.contains("truyendocviet1.shop") || url.contains("truyendocviet"));
    }

    @Override
    public String getSiteName() {
        return "TruyenDocViet";
    }

    @Override
    public RemoteStoryInfoDto extractRemoteInfo(String url) {
        RemoteStoryInfoDto info = new RemoteStoryInfoDto();
        String slug = extractSlugFromUrl(url.trim());
        if (slug == null) {
            return info;
        }

        try {
            String chaptersPageUrl = "https://truyendocviet1.shop/doc-truyen/" + slug + "/read/chapters.html";
            String chaptersHtml = httpHelper.fetchHtml(chaptersPageUrl);
            JsonNode rootJson = parseInitialData(chaptersHtml);
            if (rootJson != null) {
                JsonNode currentBook = rootJson.path("CurrentBook");
                if (!currentBook.isMissingNode() && currentBook.has("ContentTitle")) {
                    info.setStoryTitle(Normalizer.normalize(currentBook.path("ContentTitle").asText(""), Normalizer.Form.NFC));
                    JsonNode authors = currentBook.path("ListAuthors");
                    if (authors.isArray() && authors.size() > 0) {
                        info.setAuthor(Normalizer.normalize(authors.get(0).path("ContentTitle").asText("Đang cập nhật"), Normalizer.Form.NFC));
                    }
                }

                JsonNode arrChapters = rootJson.path("PageData").path("arrChapters");
                if (arrChapters.isArray()) {
                    info.setRemoteMaxChapter(arrChapters.size());
                }
            }
            info.setSourceUrl("https://truyendocviet1.shop/doc-truyen/" + slug + ".html");
        } catch (Exception ignored) {
        }

        return info;
    }

    @Override
    public void crawl(String url, int maxChapters, Story story, SseEmitter emitter, ChapterSaver chapterSaver) {
        try {
            sendEvent(emitter, CrawlProgressEvent.starting("Đang kết nối đến truyendocviet1.shop..."));

            String slug = extractSlugFromUrl(url);
            String firstChapterId = extractChapterIdFromUrl(url);

            if (slug == null || slug.isEmpty()) {
                sendEvent(emitter, CrawlProgressEvent.error("Không nhận dạng được slug truyện từ URL: " + url));
                emitter.complete();
                return;
            }

            if (firstChapterId == null || firstChapterId.isEmpty()) {
                sendEvent(emitter, CrawlProgressEvent.starting("Đang tải danh sách chương của truyện..."));
                String chaptersPageUrl = "https://truyendocviet1.shop/doc-truyen/" + slug + "/read/chapters.html";
                String chaptersHtml = httpHelper.fetchHtml(chaptersPageUrl);
                JsonNode rootJson = parseInitialData(chaptersHtml);

                if (rootJson != null) {
                    JsonNode arrChapters = rootJson.path("PageData").path("arrChapters");
                    if (arrChapters.isArray() && arrChapters.size() > 0) {
                        firstChapterId = arrChapters.get(0).path("_id").asText(null);
                    }
                }
            }

            if (firstChapterId == null || firstChapterId.isEmpty()) {
                sendEvent(emitter, CrawlProgressEvent.error("Không tìm thấy chương nào để bắt đầu cào!"));
                emitter.complete();
                return;
            }

            sendEvent(emitter, CrawlProgressEvent.starting("Bắt đầu cào truyện: “" + story.getTitle() + "”"));

            String currentChapterId = firstChapterId;
            int count = 0;
            int limit = (maxChapters <= 0) ? 1000 : maxChapters;

            while (currentChapterId != null && !currentChapterId.isEmpty() && count < limit) {
                count++;
                String chapterUrl = "https://truyendocviet1.shop/doc-truyen/" + slug + "/read/" + currentChapterId + ".html";

                try {
                    String chapterHtml = httpHelper.fetchHtml(chapterUrl);
                    JsonNode chapterJson = parseInitialData(chapterHtml);

                    if (chapterJson == null) {
                        sendEvent(emitter, CrawlProgressEvent.error("Không bóc tách được dữ liệu chương tại: " + chapterUrl));
                        break;
                    }

                    JsonNode pageData = chapterJson.path("PageData");
                    JsonNode chapterInfo = pageData.path("chapterInfo");

                    if (chapterInfo.isMissingNode()) {
                        sendEvent(emitter, CrawlProgressEvent.error("Không tìm thấy chapterInfo trong dữ liệu chương " + count));
                        break;
                    }

                    String chapterTitle = cleanHtmlContent(chapterInfo.path("ContentTitle").asText("Chương " + count));
                    int order = chapterInfo.path("ContentOrder").asInt(count);
                    String rawContent = chapterInfo.path("Description").asText("");
                    String content = cleanHtmlContent(rawContent);

                    chapterSaver.saveChapter(story, order, chapterTitle, content);

                    sendEvent(emitter, CrawlProgressEvent.progress(
                            story.getId(),
                            story.getTitle(),
                            order,
                            chapterTitle,
                            count,
                            limit,
                            "Đã tải thành công: " + chapterTitle
                    ));

                    JsonNode nextChapterInfo = pageData.path("nextChapterInfo");
                    if (!nextChapterInfo.isMissingNode() && nextChapterInfo.has("_id")) {
                        currentChapterId = nextChapterInfo.path("_id").asText(null);
                    } else {
                        currentChapterId = null;
                    }

                    Thread.sleep(700);

                } catch (Exception e) {
                    sendEvent(emitter, CrawlProgressEvent.error("Lỗi khi tải chương " + count + ": " + e.getMessage()));
                    break;
                }
            }

            sendEvent(emitter, CrawlProgressEvent.completed(
                    story.getId(),
                    story.getTitle(),
                    count,
                    "Hoàn thành cào " + count + " chương của truyện “" + story.getTitle() + "”!"
            ));
            emitter.complete();

        } catch (Exception e) {
            sendEvent(emitter, CrawlProgressEvent.error("Lỗi: " + e.getMessage()));
            emitter.complete();
        }
    }

    private String extractSlugFromUrl(String url) {
        Pattern pattern = Pattern.compile("/doc-truyen/([^/\\.]+)(?:\\.html|/read/.*)?");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String extractChapterIdFromUrl(String url) {
        Pattern pattern = Pattern.compile("/read/([0-9]+)\\.html");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private JsonNode parseInitialData(String html) {
        if (html == null) return null;
        try {
            int markerIndex = html.indexOf("window.__INITIAL_DATA__");
            if (markerIndex == -1) {
                return null;
            }
            int startIndex = html.indexOf("{", markerIndex);
            if (startIndex == -1) {
                return null;
            }
            int endIndex = html.indexOf("</script>", startIndex);
            if (endIndex == -1) {
                return null;
            }
            String jsonStr = html.substring(startIndex, endIndex).trim();
            return objectMapper.readTree(jsonStr);
        } catch (Exception e) {
            return null;
        }
    }

    private String cleanHtmlContent(String html) {
        if (html == null) return "";
        String s = html.replaceAll("(?i)<br\\s*/?>", "\n");
        s = s.replaceAll("<[^>]+>", "");
        s = s.replace("&amp;", "&")
             .replace("&lt;", "<")
             .replace("&gt;", ">")
             .replace("&quot;", "\"")
             .replace("&#39;", "'")
             .replace("&nbsp;", " ")
             .replace("&hellip;", "…")
             .replace("&#8230;", "…")
             .replace("&mdash;", "—")
             .replace("&ndash;", "–")
             .replace("&ldquo;", "“")
             .replace("&rdquo;", "”")
             .replace("&lsquo;", "‘")
             .replace("&rsquo;", "’");
        // Phục hồi ký tự u bị che dấu sao (c*́ng -> cúng, c*̉a -> của, c*̃ng -> cũng, c*̀ng -> cùng...)
        s = s.replaceAll("(?i)c\\*", "cu");
        s = Normalizer.normalize(s, Normalizer.Form.NFC);
        return s.trim();
    }

    private void sendEvent(SseEmitter emitter, CrawlProgressEvent event) {
        try {
            emitter.send(SseEmitter.event().data(event));
        } catch (Exception ignored) {
        }
    }
}
