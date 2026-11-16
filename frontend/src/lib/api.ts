// API helper — tự động gọi thẳng Render trên production hoặc localhost khi phát triển
const DEFAULT_PROD_URL = "https://truyen-reader-dtc9.onrender.com";
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? DEFAULT_PROD_URL
    : "")
).replace(/\/$/, "") + "/api";

// ---------- TypeScript types ----------

export interface StoryDto {
  id: number;
  title: string;
  author: string;
  chapterCount: number;
}

export interface ChapterSummaryDto {
  chapterNo: number;
  title: string;
}

export interface StoryDetailResponse {
  story: StoryDto;
  chapters: ChapterSummaryDto[];
}

export interface ChapterDto {
  chapterNo: number;
  title: string;
  content: string;
  paragraphs: string[];
  hasPrev: boolean;
  hasNext: boolean;
  storyId: number;
  storyTitle: string;
}

export interface CreateStoryRequest {
  title: string;
  author: string;
}

export interface CreateChapterRequest {
  title: string;
  content: string;
}

// ---------- API functions ----------

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  // DELETE returns 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Truyện
export async function getStories(): Promise<StoryDto[]> {
  return fetchJson<StoryDto[]>(`${API_BASE}/truyen`);
}

export async function getStoryDetail(id: number): Promise<StoryDetailResponse> {
  return fetchJson<StoryDetailResponse>(`${API_BASE}/truyen/${id}`);
}

export async function createStory(data: CreateStoryRequest): Promise<StoryDto> {
  return fetchJson<StoryDto>(`${API_BASE}/truyen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateStory(id: number, data: CreateStoryRequest): Promise<StoryDto> {
  return fetchJson<StoryDto>(`${API_BASE}/truyen/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteStory(id: number): Promise<void> {
  return fetchJson<void>(`${API_BASE}/truyen/${id}`, { method: "DELETE" });
}

// Chương
export async function getChapter(storyId: number, chapterNo: number): Promise<ChapterDto> {
  return fetchJson<ChapterDto>(`${API_BASE}/truyen/${storyId}/chuong/${chapterNo}`);
}

export async function createChapter(storyId: number, data: CreateChapterRequest): Promise<ChapterDto> {
  return fetchJson<ChapterDto>(`${API_BASE}/truyen/${storyId}/chuong`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateChapter(storyId: number, chapterNo: number, data: CreateChapterRequest): Promise<ChapterDto> {
  return fetchJson<ChapterDto>(`${API_BASE}/truyen/${storyId}/chuong/${chapterNo}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteChapter(storyId: number, chapterNo: number): Promise<void> {
  return fetchJson<void>(`${API_BASE}/truyen/${storyId}/chuong/${chapterNo}`, { method: "DELETE" });
}
