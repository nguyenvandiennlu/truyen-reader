package com.diennng.truyen.crawler;

import com.diennng.truyen.dto.RemoteStoryInfoDto;
import com.diennng.truyen.model.Story;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.function.Consumer;

public interface SiteCrawler {

    boolean supports(String url);

    String getSiteName();

    RemoteStoryInfoDto extractRemoteInfo(String url);

    void crawl(String url, int maxChapters, Story story, SseEmitter emitter, ChapterSaver chapterSaver);

    @FunctionalInterface
    interface ChapterSaver {
        void saveChapter(Story story, int chapterNo, String title, String content);
    }
}
