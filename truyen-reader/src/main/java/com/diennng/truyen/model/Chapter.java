package com.diennng.truyen.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nhiều chương thuộc về 1 truyện -> cột story_id trỏ sang bảng STORY
    @ManyToOne(optional = false)
    private Story story;

    // Số thứ tự chương: 1, 2, 3, ...
    private int chapterNo;

    private String title;

    // Lưu kiểu TEXT chuẩn cho cả PostgreSQL và H2 (tránh lỗi OID large object trên Postgres)
    @Column(nullable = false, columnDefinition = "TEXT")
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String content;

    protected Chapter() {
    }

    public Chapter(Story story, int chapterNo, String title, String content) {
        this.story = story;
        this.chapterNo = chapterNo;
        this.title = title;
        this.content = content;
    }

    public Long getId() {
        return id;
    }

    public Story getStory() {
        return story;
    }

    public int getChapterNo() {
        return chapterNo;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public void setChapterNo(int chapterNo) {
        this.chapterNo = chapterNo;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
