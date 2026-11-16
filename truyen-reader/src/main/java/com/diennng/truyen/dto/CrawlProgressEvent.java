package com.diennng.truyen.dto;

public class CrawlProgressEvent {
    private String status;      // STARTING, PROGRESS, COMPLETED, ERROR
    private Long storyId;
    private String storyTitle;
    private int chapterNo;
    private String chapterTitle;
    private int current;
    private int total;
    private String message;

    public CrawlProgressEvent() {
    }

    public CrawlProgressEvent(String status, String message) {
        this.status = status;
        this.message = message;
    }

    public static CrawlProgressEvent starting(String message) {
        return new CrawlProgressEvent("STARTING", message);
    }

    public static CrawlProgressEvent progress(Long storyId, String storyTitle, int chapterNo, String chapterTitle, int current, int total, String message) {
        CrawlProgressEvent event = new CrawlProgressEvent("PROGRESS", message);
        event.storyId = storyId;
        event.storyTitle = storyTitle;
        event.chapterNo = chapterNo;
        event.chapterTitle = chapterTitle;
        event.current = current;
        event.total = total;
        return event;
    }

    public static CrawlProgressEvent completed(Long storyId, String storyTitle, int totalCrawled, String message) {
        CrawlProgressEvent event = new CrawlProgressEvent("COMPLETED", message);
        event.storyId = storyId;
        event.storyTitle = storyTitle;
        event.current = totalCrawled;
        event.total = totalCrawled;
        return event;
    }

    public static CrawlProgressEvent error(String message) {
        return new CrawlProgressEvent("ERROR", message);
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getStoryId() {
        return storyId;
    }

    public void setStoryId(Long storyId) {
        this.storyId = storyId;
    }

    public String getStoryTitle() {
        return storyTitle;
    }

    public void setStoryTitle(String storyTitle) {
        this.storyTitle = storyTitle;
    }

    public int getChapterNo() {
        return chapterNo;
    }

    public void setChapterNo(int chapterNo) {
        this.chapterNo = chapterNo;
    }

    public String getChapterTitle() {
        return chapterTitle;
    }

    public void setChapterTitle(String chapterTitle) {
        this.chapterTitle = chapterTitle;
    }

    public int getCurrent() {
        return current;
    }

    public void setCurrent(int current) {
        this.current = current;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
