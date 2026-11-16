package com.diennng.truyen.dto;

public class StoryDto {
    private Long id;
    private String title;
    private String author;
    private int chapterCount;
    private String sourceUrl;
    private int latestChapterNo;

    public StoryDto() {}

    public StoryDto(Long id, String title, String author, int chapterCount) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.chapterCount = chapterCount;
    }

    public StoryDto(Long id, String title, String author, int chapterCount, String sourceUrl, int latestChapterNo) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.chapterCount = chapterCount;
        this.sourceUrl = sourceUrl;
        this.latestChapterNo = latestChapterNo;
    }

    // getters and setters for all fields
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public int getChapterCount() { return chapterCount; }
    public void setChapterCount(int chapterCount) { this.chapterCount = chapterCount; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public int getLatestChapterNo() { return latestChapterNo; }
    public void setLatestChapterNo(int latestChapterNo) { this.latestChapterNo = latestChapterNo; }
}
