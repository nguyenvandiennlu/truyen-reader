package com.diennng.truyen.crawler;

import com.diennng.truyen.dto.CrawlProgressEvent;
import com.diennng.truyen.dto.RemoteStoryInfoDto;
import com.diennng.truyen.model.Story;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.text.Normalizer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TruyenCCrawler implements SiteCrawler {

    private final HttpHelper httpHelper;

    public TruyenCCrawler(HttpHelper httpHelper) {
        this.httpHelper = httpHelper;
    }

    @Override
    public boolean supports(String url) {
        return url != null && (url.contains("truyenc.net") || url.contains("truyenc"));
    }

    @Override
    public String getSiteName() {
        return "TruyenC";
    }

    @Override
    public RemoteStoryInfoDto extractRemoteInfo(String url) {
        RemoteStoryInfoDto info = new RemoteStoryInfoDto();
        Pattern pattern = Pattern.compile("/truyen/([^/?#]+)");
        Matcher matcher = pattern.matcher(url.trim());
        if (!matcher.find()) {
            return info;
        }

        String slug = matcher.group(1);
        String pageUrl = "https://truyenc.net/truyen/" + slug;
        info.setSourceUrl(pageUrl);

        try {
            String html = httpHelper.fetchHtml(pageUrl);

            Matcher titleMatcher = Pattern.compile("<h1[^>]*>([^<]+)</h1>", Pattern.CASE_INSENSITIVE).matcher(html);
            if (titleMatcher.find()) {
                info.setStoryTitle(Normalizer.normalize(titleMatcher.group(1).trim(), Normalizer.Form.NFC));
            }

            Matcher authorMatcher = Pattern.compile("href=\"/tac-gia/[^\"]*\">([^<]+)</a>", Pattern.CASE_INSENSITIVE).matcher(html);
            if (authorMatcher.find()) {
                info.setAuthor(Normalizer.normalize(authorMatcher.group(1).trim(), Normalizer.Form.NFC));
            }

            Matcher chMatcher = Pattern.compile("/chuong-(\\d+)").matcher(html);
            int maxCh = 0;
            while (chMatcher.find()) {
                try {
                    int no = Integer.parseInt(chMatcher.group(1));
                    if (no > maxCh) maxCh = no;
                } catch (NumberFormatException ignored) {}
            }
            info.setRemoteMaxChapter(maxCh);

        } catch (Exception ignored) {
        }

        return info;
    }

    @Override
    public void crawl(String url, int maxChapters, Story story, SseEmitter emitter, ChapterSaver chapterSaver) {
        try {
            sendEvent(emitter, CrawlProgressEvent.starting("Đang kết nối đến truyenc.net..."));

            Pattern pattern = Pattern.compile("/truyen/([^/?#]+)(?:/chuong-(\\d+))?");
            Matcher matcher = pattern.matcher(url);

            if (!matcher.find()) {
                sendEvent(emitter, CrawlProgressEvent.error("Đường dẫn không hợp lệ. Vui lòng nhập link dạng: https://truyenc.net/truyen/{ten-truyen} hoặc /chuong-1"));
                emitter.complete();
                return;
            }

            String slug = matcher.group(1);
            int startChapter = 1;
            if (matcher.group(2) != null && !matcher.group(2).isEmpty()) {
                startChapter = Integer.parseInt(matcher.group(2));
            }

            sendEvent(emitter, CrawlProgressEvent.starting("Bắt đầu cào truyện: “" + story.getTitle() + "” từ chương " + startChapter));

            int limit = (maxChapters <= 0) ? 1000 : maxChapters;
            int currentChapterNo = startChapter;
            int count = 0;
            int consecutiveMissing = 0;
            final int MAX_CONSECUTIVE_MISSING = 5;

            while (count < limit && consecutiveMissing < MAX_CONSECUTIVE_MISSING) {
                String chapterUrl = "https://truyenc.net/truyen/" + slug + "/chuong-" + currentChapterNo;

                try {
                    String chapterHtml;
                    try {
                        chapterHtml = httpHelper.fetchHtml(chapterUrl);
                    } catch (IOException ioEx) {
                        consecutiveMissing++;
                        currentChapterNo++;
                        Thread.sleep(300);
                        continue;
                    }

                    String chapterTitle = "Chương " + currentChapterNo;
                    Matcher chTitleMatcher = Pattern.compile("<h1[^>]*>([^<]+)</h1>", Pattern.CASE_INSENSITIVE).matcher(chapterHtml);
                    if (chTitleMatcher.find()) {
                        String rawTitle = chTitleMatcher.group(1).trim();
                        rawTitle = rawTitle.replaceAll("^(Chương\\s*\\d+\\s*:\\s*)+", "Chương " + currentChapterNo + ": ");
                        chapterTitle = rawTitle;
                    }

                    Matcher articleMatcher = Pattern.compile("<article[^>]*class=\"[^\"]*reader-content[^\"]*\"[^>]*>([\\s\\S]*?)</article>", Pattern.CASE_INSENSITIVE).matcher(chapterHtml);
                    if (!articleMatcher.find()) {
                        consecutiveMissing++;
                        currentChapterNo++;
                        Thread.sleep(300);
                        continue;
                    }

                    String rawContent = articleMatcher.group(1);
                    String cleanContent = cleanHtmlContent(rawContent);

                    if (cleanContent.trim().isEmpty()) {
                        consecutiveMissing++;
                        currentChapterNo++;
                        Thread.sleep(300);
                        continue;
                    }

                    consecutiveMissing = 0;
                    count++;
                    chapterSaver.saveChapter(story, currentChapterNo, chapterTitle, cleanContent);

                    sendEvent(emitter, CrawlProgressEvent.progress(
                            story.getId(),
                            story.getTitle(),
                            currentChapterNo,
                            chapterTitle,
                            count,
                            limit,
                            "Đã tải thành công: " + chapterTitle
                    ));

                    Integer nextChapterFromPage = null;
                    Matcher nextMatcher = Pattern.compile("<a\\b[^>]*href=[\"'][^\"']*/chuong-(\\d+)[\"'][^>]*>[\\s\\S]*?(?:Chương sau|Tiếp theo|Sau|Tiếp|&rarr;|→)[\\s\\S]*?</a>", Pattern.CASE_INSENSITIVE).matcher(chapterHtml);
                    if (nextMatcher.find()) {
                        try {
                            nextChapterFromPage = Integer.parseInt(nextMatcher.group(1));
                        } catch (NumberFormatException ignored) {}
                    }

                    if (nextChapterFromPage != null && nextChapterFromPage > currentChapterNo) {
                        currentChapterNo = nextChapterFromPage;
                    } else {
                        currentChapterNo++;
                    }

                    Thread.sleep(700);

                } catch (Exception ex) {
                    sendEvent(emitter, CrawlProgressEvent.error("Lỗi khi tải chương " + currentChapterNo + ": " + ex.getMessage()));
                    break;
                }
            }

            if (count == 0) {
                sendEvent(emitter, CrawlProgressEvent.error("Không tìm thấy nội dung chương nào để tải!"));
            } else {
                sendEvent(emitter, CrawlProgressEvent.completed(
                        story.getId(),
                        story.getTitle(),
                        count,
                        "Hoàn thành cào " + count + " chương của truyện “" + story.getTitle() + "” từ TruyenC!"
                ));
            }
            emitter.complete();

        } catch (Exception e) {
            sendEvent(emitter, CrawlProgressEvent.error("Lỗi: " + e.getMessage()));
            emitter.complete();
        }
    }

    private String cleanHtmlContent(String html) {
        if (html == null) return "";
        String text = html.replaceAll("(?i)<script[\\s\\S]*?</script>", "");
        text = text.replaceAll("(?i)<style[\\s\\S]*?</style>", "");
        text = text.replaceAll("(?i)<p[^>]*>", "\n");
        text = text.replaceAll("(?i)</p>", "\n");
        text = text.replaceAll("(?i)<br\\s*/?>", "\n");
        text = text.replaceAll("<[^>]+>", " ");
        text = text.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
        text = text.replaceAll("[ \t]+", " ");
        text = text.replaceAll("(?m)^\\s+$", "");
        text = text.replaceAll("\n{3,}", "\n\n");
        text = Normalizer.normalize(text.trim(), Normalizer.Form.NFC);
        return text;
    }

    private void sendEvent(SseEmitter emitter, CrawlProgressEvent event) {
        try {
            emitter.send(SseEmitter.event().data(event));
        } catch (Exception ignored) {
        }
    }
}
