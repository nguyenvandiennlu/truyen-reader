package com.diennng.truyen.dto;

public class ChapterSummaryDto {
    private int chapterNo;
    private String title;

    public ChapterSummaryDto() {}

    public ChapterSummaryDto(int chapterNo, String title) {
        this.chapterNo = chapterNo;
        this.title = title;
    }

    public int getChapterNo() { return chapterNo; }
    public void setChapterNo(int chapterNo) { this.chapterNo = chapterNo; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
