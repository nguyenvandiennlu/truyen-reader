package com.diennng.truyen.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

// @Entity: class này ứng với 1 bảng trong database (bảng STORY).
// Mỗi field là 1 cột, mỗi object là 1 dòng.
@Entity
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private String sourceUrl;

    // JPA bắt buộc phải có constructor rỗng
    protected Story() {
    }

    public Story(String title, String author) {
        this.title = title;
        this.author = author;
    }

    public Story(String title, String author, String sourceUrl) {
        this.title = title;
        this.author = author;
        this.sourceUrl = sourceUrl;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }
}
