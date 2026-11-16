package com.diennng.truyen.dto;

public class CrawlRequest {
    private String url;
    private int maxChapters = 20;

    public CrawlRequest() {
    }

    public CrawlRequest(String url, int maxChapters) {
        this.url = url;
        this.maxChapters = maxChapters;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public int getMaxChapters() {
        return maxChapters;
    }

    public void setMaxChapters(int maxChapters) {
        this.maxChapters = maxChapters;
    }
}
