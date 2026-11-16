package com.diennng.truyen.repository;

import com.diennng.truyen.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoryRepository extends JpaRepository<Story, Long> {
    Optional<Story> findByTitle(String title);
    Optional<Story> findBySourceUrl(String sourceUrl);
}
