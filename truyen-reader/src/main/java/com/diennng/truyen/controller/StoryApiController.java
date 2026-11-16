package com.diennng.truyen.controller;

import com.diennng.truyen.dto.*;
import com.diennng.truyen.model.Chapter;
import com.diennng.truyen.model.Story;
import com.diennng.truyen.repository.ChapterRepository;
import com.diennng.truyen.repository.StoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class StoryApiController {

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;

    public StoryApiController(StoryRepository storyRepository, ChapterRepository chapterRepository) {
        this.storyRepository = storyRepository;
        this.chapterRepository = chapterRepository;
    }

    // ---------- Danh sách truyện ----------
    @GetMapping("/truyen")
    public List<StoryDto> listStories() {
        List<Story> stories = storyRepository.findAll();
        List<StoryDto> result = new ArrayList<>();
        for (Story s : stories) {
            autoPopulateSourceUrlIfMissing(s);
            int count = chapterRepository.countByStoryId(s.getId());
            int latestNo = chapterRepository.findTopByStoryIdOrderByChapterNoDesc(s.getId())
                    .map(Chapter::getChapterNo).orElse(0);
            result.add(new StoryDto(s.getId(), s.getTitle(), s.getAuthor(), count, s.getSourceUrl(), latestNo));
        }
        return result;
    }

    // ---------- Chi tiết 1 truyện + danh sách chương ----------
    @GetMapping("/truyen/{id}")
    public ResponseEntity<?> storyDetail(@PathVariable Long id) {
        Story story = findStory(id);
        autoPopulateSourceUrlIfMissing(story);
        List<Chapter> chapters = chapterRepository.findByStoryIdOrderByChapterNoAsc(id);
        int latestNo = chapters.isEmpty() ? 0 : chapters.get(chapters.size() - 1).getChapterNo();

        // Build response as a map-like object
        StoryDto storyDto = new StoryDto(story.getId(), story.getTitle(), story.getAuthor(), chapters.size(), story.getSourceUrl(), latestNo);

        List<ChapterSummaryDto> chapterList = new ArrayList<>();
        for (Chapter c : chapters) {
            chapterList.add(new ChapterSummaryDto(c.getChapterNo(), c.getTitle()));
        }

        // Return both in a wrapper
        var response = new java.util.LinkedHashMap<String, Object>();
        response.put("story", storyDto);
        response.put("chapters", chapterList);
        return ResponseEntity.ok(response);
    }

    private void autoPopulateSourceUrlIfMissing(Story story) {
        if (story.getSourceUrl() == null || story.getSourceUrl().trim().isEmpty()) {
            if (story.getTitle().contains("Toàn Cầu Cao Võ")) {
                story.setSourceUrl("https://truyenc.net/truyen/toan-cau-cao-vo");
                storyRepository.save(story);
            } else if (story.getTitle().contains("Tru Tiên")) {
                story.setSourceUrl("https://truyenc.net/truyen/tru-tien");
                storyRepository.save(story);
            } else if (story.getTitle().contains("Tầm Thi Nhân")) {
                story.setSourceUrl("https://truyenc.net/truyen/tam-thi-nhan");
                storyRepository.save(story);
            }
        }
    }

    // ---------- Thêm truyện ----------
    @PostMapping("/truyen")
    public ResponseEntity<StoryDto> addStory(@RequestBody CreateStoryRequest request) {
        String cleanTitle = java.text.Normalizer.normalize(request.getTitle().trim(), java.text.Normalizer.Form.NFC);
        String cleanAuthor = request.getAuthor() != null ? java.text.Normalizer.normalize(request.getAuthor().trim(), java.text.Normalizer.Form.NFC) : "";
        Story story = storyRepository.save(new Story(cleanTitle, cleanAuthor));
        StoryDto dto = new StoryDto(story.getId(), story.getTitle(), story.getAuthor(), 0);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // ---------- Sửa truyện ----------
    @PutMapping("/truyen/{id}")
    public StoryDto updateStory(@PathVariable Long id, @RequestBody CreateStoryRequest request) {
        Story story = findStory(id);
        story.setTitle(java.text.Normalizer.normalize(request.getTitle().trim(), java.text.Normalizer.Form.NFC));
        story.setAuthor(request.getAuthor() != null ? java.text.Normalizer.normalize(request.getAuthor().trim(), java.text.Normalizer.Form.NFC) : "");
        storyRepository.save(story);
        int count = chapterRepository.countByStoryId(id);
        return new StoryDto(story.getId(), story.getTitle(), story.getAuthor(), count);
    }

    // ---------- Xóa truyện ----------
    @DeleteMapping("/truyen/{id}")
    public ResponseEntity<Void> deleteStory(@PathVariable Long id) {
        Story story = findStory(id);
        // Xóa tất cả chương trước
        List<Chapter> chapters = chapterRepository.findByStoryIdOrderByChapterNoAsc(id);
        chapterRepository.deleteAll(chapters);
        storyRepository.delete(story);
        return ResponseEntity.noContent().build();
    }

    // ---------- Đọc chương ----------
    @GetMapping("/truyen/{id}/chuong/{no}")
    public ChapterDto readChapter(@PathVariable Long id, @PathVariable int no) {
        Chapter chapter = chapterRepository.findByStoryIdAndChapterNo(id, no)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không có chương này"));

        // Tách nội dung thành từng đoạn, phục hồi ký tự bị che và chuẩn hoá Unicode NFC
        String[] lines = chapter.getContent().split("\\R");
        List<String> paragraphs = new ArrayList<>();
        for (String line : lines) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                String restored = trimmed.replaceAll("(?i)c\\*", "cu");
                paragraphs.add(java.text.Normalizer.normalize(restored, java.text.Normalizer.Form.NFC));
            }
        }

        ChapterDto dto = new ChapterDto();
        dto.setChapterNo(chapter.getChapterNo());
        dto.setTitle(java.text.Normalizer.normalize(chapter.getTitle(), java.text.Normalizer.Form.NFC));
        dto.setContent(chapter.getContent());
        dto.setParagraphs(paragraphs);
        dto.setHasPrev(chapterRepository.findByStoryIdAndChapterNo(id, no - 1).isPresent());
        dto.setHasNext(chapterRepository.findByStoryIdAndChapterNo(id, no + 1).isPresent());
        dto.setStoryId(chapter.getStory().getId());
        dto.setStoryTitle(chapter.getStory().getTitle());
        return dto;
    }

    // ---------- Thêm chương ----------
    @PostMapping("/truyen/{id}/chuong")
    public ResponseEntity<ChapterDto> addChapter(@PathVariable Long id, @RequestBody CreateChapterRequest request) {
        Story story = findStory(id);

        int nextNo = 1;
        Optional<Chapter> last = chapterRepository.findTopByStoryIdOrderByChapterNoDesc(id);
        if (last.isPresent()) {
            nextNo = last.get().getChapterNo() + 1;
        }

        String cleanTitle = java.text.Normalizer.normalize(request.getTitle().trim(), java.text.Normalizer.Form.NFC);
        String cleanContent = java.text.Normalizer.normalize(request.getContent(), java.text.Normalizer.Form.NFC);
        Chapter chapter = chapterRepository.save(new Chapter(story, nextNo, cleanTitle, cleanContent));

        ChapterDto dto = new ChapterDto();
        dto.setChapterNo(chapter.getChapterNo());
        dto.setTitle(chapter.getTitle());
        dto.setStoryId(id);
        dto.setStoryTitle(story.getTitle());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // ---------- Sửa chương ----------
    @PutMapping("/truyen/{id}/chuong/{no}")
    public ChapterDto updateChapter(@PathVariable Long id, @PathVariable int no, @RequestBody CreateChapterRequest request) {
        Chapter chapter = chapterRepository.findByStoryIdAndChapterNo(id, no)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không có chương này"));
        chapter.setTitle(java.text.Normalizer.normalize(request.getTitle().trim(), java.text.Normalizer.Form.NFC));
        chapter.setContent(java.text.Normalizer.normalize(request.getContent(), java.text.Normalizer.Form.NFC));
        chapterRepository.save(chapter);

        ChapterDto dto = new ChapterDto();
        dto.setChapterNo(chapter.getChapterNo());
        dto.setTitle(chapter.getTitle());
        dto.setStoryId(id);
        dto.setStoryTitle(chapter.getStory().getTitle());
        return dto;
    }

    // ---------- Xóa chương ----------
    @DeleteMapping("/truyen/{id}/chuong/{no}")
    public ResponseEntity<Void> deleteChapter(@PathVariable Long id, @PathVariable int no) {
        Chapter chapter = chapterRepository.findByStoryIdAndChapterNo(id, no)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không có chương này"));
        chapterRepository.delete(chapter);
        return ResponseEntity.noContent().build();
    }

    private Story findStory(Long id) {
        return storyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không có truyện này"));
    }
}
