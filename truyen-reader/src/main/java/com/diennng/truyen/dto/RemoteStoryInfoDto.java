package com.diennng.truyen.dto;

public class RemoteStoryInfoDto {
    private Long storyId;
    private String storyTitle;
    private String author;
    private int localChapterCount;
    private int latestLocalChapter;
    private int remoteMaxChapter;
    private int missingChapters;
    private String sourceUrl;

    public RemoteStoryInfoDto() {}

    public Long getStoryId() { return storyId; }
    public void setStoryId(Long storyId) { this.storyId = storyId; }

    public String getStoryTitle() { return storyTitle; }
    public void setStoryTitle(String storyTitle) { this.storyTitle = storyTitle; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public int getLocalChapterCount() { return localChapterCount; }
    public void setLocalChapterCount(int localChapterCount) { this.localChapterCount = localChapterCount; }

    public int getLatestLocalChapter() { return latestLocalChapter; }
    public void setLatestLocalChapter(int latestLocalChapter) { this.latestLocalChapter = latestLocalChapter; }

    public int getRemoteMaxChapter() { return remoteMaxChapter; }
    public void setRemoteMaxChapter(int remoteMaxChapter) { this.remoteMaxChapter = remoteMaxChapter; }

    public int getMissingChapters() { return missingChapters; }
    public void setMissingChapters(int missingChapters) { this.missingChapters = missingChapters; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
}
