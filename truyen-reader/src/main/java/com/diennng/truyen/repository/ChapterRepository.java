package com.diennng.truyen.repository;

import com.diennng.truyen.model.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// Spring đọc TÊN method để tự sinh câu truy vấn:
//   findByStoryIdOrderByChapterNoAsc  ->  WHERE story.id = ? ORDER BY chapterNo ASC
public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    List<Chapter> findByStoryIdOrderByChapterNoAsc(Long storyId);

    Optional<Chapter> findByStoryIdAndChapterNo(Long storyId, int chapterNo);

    // Đếm số chương nhanh không cần load toàn bộ nội dung nặng
    int countByStoryId(Long storyId);

    // Chương có số lớn nhất của truyện (để biết thêm chương mới thì đánh số mấy)
    Optional<Chapter> findTopByStoryIdOrderByChapterNoDesc(Long storyId);
}
