"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Minus,
  Plus,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface WordTimestamp {
  text: string
  start: number
  end: number
  charStart: number
  charEnd: number
}

interface AudioPayload {
  audio: string
  words: WordTimestamp[]
}

interface ChapterData {
  chapterNo: number
  title: string
  content: string
  paragraphs: string[]
  hasPrev: boolean
  hasNext: boolean
  storyId: string
  storyTitle: string
}

interface ReaderPageProps {
  storyId: string
  chapterNo: number
}

const DEFAULT_FONT_SIZE = 19
const MIN_FONT_SIZE = 16
const MAX_FONT_SIZE = 26

function cleanVietnamese(text: string): string {
  if (!text) return ""
  let s = text.replace(/c\*/gi, "cu")
  s = s.replace(/đuợc/g, "được")
       .replace(/uợ/g, "ượ")
       .replace(/uờ/g, "ườ")
       .replace(/uớ/g, "ước")
       .replace(/uơ/g, "ươ")
  s = s.normalize("NFC")
  return s
}

const DEFAULT_PROD_URL = "https://truyen-reader-dtc9.onrender.com"
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? DEFAULT_PROD_URL
    : "")
).replace(/\/$/, "")

// Singleton Audio duy nhất trên toàn trình duyệt để triệt tiêu vĩnh viễn lỗi 2 giọng đọc song song
let globalAudio: HTMLAudioElement | null = null

function getGlobalAudio(): HTMLAudioElement {
  if (typeof window === "undefined") return null as unknown as HTMLAudioElement
  if (!globalAudio) {
    globalAudio = new Audio()
  }
  return globalAudio
}

function stopGlobalAudio() {
  if (globalAudio) {
    globalAudio.pause()
    globalAudio.removeAttribute("src")
    globalAudio.onended = null
    globalAudio.onerror = null
    globalAudio.ontimeupdate = null
    globalAudio.currentTime = 0
  }
}

export default function ReaderPage({ storyId, chapterNo }: ReaderPageProps) {
  const router = useRouter()
  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")

  const paragraphs = useMemo(() => {
    if (!chapter?.paragraphs) return []
    return chapter.paragraphs.map(cleanVietnamese).filter((p) => p.trim().length > 0)
  }, [chapter])

  // Audio AI TTS States
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentParagraph, setCurrentParagraph] = useState<number | null>(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [voice, setVoice] = useState("vi-VN-NamMinhNeural") // Mặc định: Nam Minh
  const [rate, setRate] = useState("+0%") // Tốc độ đọc
  const [showAudioBar, setShowAudioBar] = useState(false)

  // Real-time Karaoke Word Highlight States
  const [currentWords, setCurrentWords] = useState<WordTimestamp[]>([])
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1)
  const currentWordsRef = useRef<WordTimestamp[]>([])

  const synthCacheRef = useRef<Map<number, AudioPayload>>(new Map())
  const prefetchPromisesRef = useRef<Map<number, Promise<AudioPayload | null>>>(new Map())
  const activePlayIdRef = useRef<number>(0)

  // Tải trước (prefetch) âm thanh + mốc thời gian từng từ vào RAM
  const prefetchAudio = useCallback((idx: number, v = voice, r = rate): Promise<AudioPayload | null> => {
    if (idx < 0 || idx >= paragraphs.length) return Promise.resolve(null)
    if (synthCacheRef.current.has(idx)) {
      return Promise.resolve(synthCacheRef.current.get(idx)!)
    }
    // Nếu đoạn này đang được tải ngầm, tái sử dụng Promise để các tác vụ cùng đợi
    if (prefetchPromisesRef.current.has(idx)) {
      return prefetchPromisesRef.current.get(idx)!
    }

    const textToRead = paragraphs[idx]
    const promise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/audio/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToRead, voice: v, rate: r })
        })
        if (!res.ok) throw new Error("Audio synth failed")
        const data = (await res.json()) as AudioPayload
        synthCacheRef.current.set(idx, data)
        return data
      } catch {
        return null
      } finally {
        prefetchPromisesRef.current.delete(idx)
      }
    })()

    prefetchPromisesRef.current.set(idx, promise)
    return promise
  }, [paragraphs, voice, rate])

  // Tự động tải trước 2 đoạn đầu tiên ngay khi mở chương để bấm Play là phát tức thì 0s
  useEffect(() => {
    if (paragraphs.length > 0) {
      prefetchAudio(0)
      if (paragraphs.length > 1) prefetchAudio(1)
    }
  }, [paragraphs, prefetchAudio])

  // Dọn dẹp cache khi đổi giọng hoặc đổi tốc độ
  const clearAudioCache = () => {
    synthCacheRef.current.clear()
    prefetchPromisesRef.current.clear()
    setCurrentWords([])
    currentWordsRef.current = []
    setActiveWordIndex(-1)
  }

  // Dọn dẹp âm thanh khi unmount hoặc rời trang
  useEffect(() => {
    const handleUnload = () => {
      stopGlobalAudio()
    }
    window.addEventListener("beforeunload", handleUnload)
    window.addEventListener("pagehide", handleUnload)
    return () => {
      window.removeEventListener("beforeunload", handleUnload)
      window.removeEventListener("pagehide", handleUnload)
      stopAudio()
    }
  }, [])

  // Vòng lặp cập nhật từ đang đọc theo thời gian thực (60fps mượt mà)
  useEffect(() => {
    if (!isPlaying) {
      setActiveWordIndex(-1)
      return
    }

    let animId: number
    const updateWord = () => {
      const audio = getGlobalAudio()
      if (audio && !audio.paused) {
        const cur = audio.currentTime
        const words = currentWordsRef.current
        if (words && words.length > 0) {
          const idx = words.findIndex((w) => cur >= w.start && cur <= w.end)
          if (idx !== -1) {
            setActiveWordIndex(idx)
          }
        }
      }
      animId = requestAnimationFrame(updateWord)
    }

    animId = requestAnimationFrame(updateWord)
    return () => cancelAnimationFrame(animId)
  }, [isPlaying])

  // Tự động tải trước 2 đoạn đầu tiên ngay khi mở chương truyện
  useEffect(() => {
    if (paragraphs.length > 0) {
      prefetchAudio(0)
      prefetchAudio(1)
    }
  }, [paragraphs, prefetchAudio])

  useEffect(() => {
    const savedSize = Number(window.localStorage.getItem("reader-font-size"))
    if (savedSize >= MIN_FONT_SIZE && savedSize <= MAX_FONT_SIZE) setFontSize(savedSize)
  }, [])

  useEffect(() => {
    window.localStorage.setItem("reader-font-size", String(fontSize))
  }, [fontSize])

  useEffect(() => {
    window.localStorage.setItem(`last-chapter-${storyId}`, String(chapterNo))
    const controller = new AbortController()
    setChapter(null)
    setError("")
    setProgress(0)
    stopAudio()

    fetch(`${API_BASE}/api/truyen/${storyId}/chuong/${chapterNo}?t=${Date.now()}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    })
      .then((response) => {
        if (!response.ok) throw new Error("Không thể tải chương truyện")
        return response.json() as Promise<ChapterData>
      })
      .then(setChapter)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return
        setError(fetchError instanceof Error ? fetchError.message : "Đã có lỗi xảy ra")
      })

    window.scrollTo({ top: 0, behavior: "smooth" })
    return () => {
      controller.abort()
      stopAudio()
    }
  }, [storyId, chapterNo])

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 100)
    }
    updateProgress()
    window.addEventListener("scroll", updateProgress, { passive: true })
    return () => window.removeEventListener("scroll", updateProgress)
  }, [chapter])

  const goToChapter = (nextNo: number) => {
    stopAudio()
    router.push(`/truyen/${storyId}/chuong/${nextNo}`)
  }

  // ---------- Audio AI Controls ----------
  const playParagraph = async (index: number) => {
    if (index < 0 || index >= paragraphs.length) {
      if (index >= paragraphs.length && chapter?.hasNext) {
        // Tự chuyển sang chương sau khi đọc hết chương
        if (window.confirm("Đã đọc hết chương. Bạn có muốn chuyển sang chương tiếp theo không?")) {
          goToChapter(chapterNo + 1)
        } else {
          stopAudio()
        }
      } else {
        stopAudio()
      }
      return
    }

    const playId = ++activePlayIdRef.current
    setCurrentParagraph(index)
    setIsPlaying(true)
    setShowAudioBar(true)
    setActiveWordIndex(-1)

    // Triệt tiêu ngay lập tức bất kỳ âm thanh nào đang phát dở
    stopGlobalAudio()
    const audio = getGlobalAudio()

    // Cuộn mượt đến đoạn đang đọc
    const el = document.getElementById(`p${index}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    // ⚡ TẢI TRƯỚC 4 ĐOẠN TIẾP THEO VÀO BỘ NHỚ RAM NGAY BÂY GIỜ
    prefetchAudio(index + 1)
    prefetchAudio(index + 2)
    prefetchAudio(index + 3)
    prefetchAudio(index + 4)

    // Dọn dẹp bớt các payload cũ để giải phóng RAM
    if (index > 5) {
      for (const k of synthCacheRef.current.keys()) {
        if (k < index - 3) synthCacheRef.current.delete(k)
      }
    }

    let payload = synthCacheRef.current.get(index)
    if (!payload) {
      setIsBuffering(true)
      // Mở khoá Audio Context của trình duyệt trước khi chờ mạng bất đồng bộ
      try {
        audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
        audio.play().catch(() => {})
      } catch {}
      payload = (await prefetchAudio(index)) || undefined
      // Nếu người dùng đã bấm đoạn khác hoặc chuyển chương trong lúc đợi tải -> Huỷ bỏ
      if (activePlayIdRef.current !== playId) return
    }

    if (activePlayIdRef.current !== playId) return
    setIsBuffering(false)

    audio.pause()
    audio.onended = null
    audio.onerror = null

    if (payload && payload.audio) {
      audio.src = payload.audio
      setCurrentWords(payload.words || [])
      currentWordsRef.current = payload.words || []
    } else {
      const text = paragraphs[index]
      audio.src = `${API_BASE}/api/audio/stream?text=${encodeURIComponent(text)}&voice=${voice}&rate=${encodeURIComponent(rate)}`
      setCurrentWords([])
      currentWordsRef.current = []
    }

    audio.onended = () => {
      // Chỉ tự động nhảy đoạn tiếp theo nếu phiên phát này vẫn đang là phiên hợp lệ
      if (activePlayIdRef.current === playId) {
        setActiveWordIndex(-1)
        playParagraph(index + 1)
      }
    }

    // NẾU LỖI: Dừng lại, KHÔNG tự ý nhảy đoạn liên tiếp
    audio.onerror = (e) => {
      console.warn("Audio error on paragraph", index, e)
      setIsBuffering(false)
      setIsPlaying(false)
      setActiveWordIndex(-1)
    }

    audio.play().catch((err) => {
      console.warn("Audio play blocked by browser:", err)
      setIsBuffering(false)
      setIsPlaying(false)
      setActiveWordIndex(-1)
    })
  }

  const togglePlay = () => {
    if (isPlaying) {
      stopGlobalAudio()
      setIsPlaying(false)
    } else {
      const audio = getGlobalAudio()
      if (currentParagraph !== null && audio.src) {
        audio.play().catch(() => {})
        setIsPlaying(true)
      } else {
        playParagraph(0)
      }
    }
  }

  const stopAudio = () => {
    activePlayIdRef.current++
    stopGlobalAudio()
    clearAudioCache()
    setIsPlaying(false)
    setCurrentParagraph(null)
    setIsBuffering(false)
    setActiveWordIndex(-1)
  }

  const nextParagraph = () => {
    playParagraph((currentParagraph ?? -1) + 1)
  }

  const prevParagraph = () => {
    playParagraph(Math.max(0, (currentParagraph ?? 1) - 1))
  }

  // Hàm render nội dung đoạn văn kèm Highlight chữ vàng theo giọng đọc (Karaoke Word Highlight)
  const renderParagraphContent = (text: string, isCurrent: boolean) => {
    if (!isCurrent || currentWords.length === 0) {
      return text
    }

    const segments: React.ReactNode[] = []
    let lastIndex = 0

    currentWords.forEach((w, i) => {
      if (w.charStart === -1 || w.charEnd === -1) return

      // Phần ký tự / khoảng trắng / dấu câu nằm trước từ này
      if (w.charStart > lastIndex) {
        segments.push(
          <span key={`pre-${i}`}>{text.substring(lastIndex, w.charStart)}</span>
        )
      }

      const isWordActive = i === activeWordIndex
      segments.push(
        <span
          key={`w-${i}`}
          className={
            isWordActive
              ? "bg-amber-400 text-neutral-950 font-bold px-1.5 py-0.5 rounded shadow-sm ring-2 ring-amber-400/60 scale-105 inline-block transition-transform duration-75"
              : "transition-colors duration-150"
          }
        >
          {text.substring(w.charStart, w.charEnd)}
        </span>
      )
      lastIndex = w.charEnd
    })

    // Phần văn bản còn lại sau từ cuối cùng (dấu chấm, phẩy...)
    if (lastIndex < text.length) {
      segments.push(<span key="post-last">{text.substring(lastIndex)}</span>)
    }

    return segments
  }

  // Phím tắt điều hướng bàn phím
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === "ArrowLeft" && chapter?.hasPrev && !isPlaying) goToChapter(chapterNo - 1)
      if (event.key === "ArrowRight" && chapter?.hasNext && !isPlaying) goToChapter(chapterNo + 1)
      if (event.code === "Space" && showAudioBar) {
        event.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [chapter, chapterNo, isPlaying, showAudioBar, currentParagraph])

  const navigation = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/70 py-4">
      <Button variant="outline" size="sm" disabled={!chapter?.hasPrev} onClick={() => goToChapter(chapterNo - 1)}>
        <ArrowLeft data-icon="inline-start" /> Trước
      </Button>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 p-1" aria-label="Điều chỉnh cỡ chữ">
          <Button variant="ghost" size="sm" aria-label="Giảm cỡ chữ" disabled={fontSize <= MIN_FONT_SIZE} onClick={() => setFontSize((size) => Math.max(MIN_FONT_SIZE, size - 1))}><Minus className="size-3.5" /></Button>
          <span className="min-w-12 text-center text-xs text-muted-foreground">{fontSize}px</span>
          <Button variant="ghost" size="sm" aria-label="Tăng cỡ chữ" disabled={fontSize >= MAX_FONT_SIZE} onClick={() => setFontSize((size) => Math.min(MAX_FONT_SIZE, size + 1))}><Plus className="size-3.5" /></Button>
        </div>
      </div>
      <Button variant="outline" size="sm" disabled={!chapter?.hasNext} onClick={() => goToChapter(chapterNo + 1)}>
        Sau <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  )

  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      <div className="fixed inset-x-0 top-0 z-10 h-1 bg-primary/10" aria-hidden="true">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pb-6 pt-8 sm:px-8">
        <Link href={`/truyen/${storyId}`} className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> <span className="truncate">{chapter?.storyTitle ?? "Quay lại truyện"}</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Nút bật/tắt Audio AI */}
          <Button
            variant={showAudioBar ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (!showAudioBar) {
                setShowAudioBar(true)
                if (currentParagraph === null) playParagraph(0)
              } else {
                stopAudio()
                setShowAudioBar(false)
              }
            }}
            className="gap-1.5 text-xs font-medium"
          >
            <Sparkles className="size-3.5 text-amber-500" />
            {showAudioBar ? "Đang bật giọng AI" : "🔊 Nghe giọng AI"}
          </Button>

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BookOpen className="size-3.5" /> {progress}%
          </span>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center my-12 max-w-lg mx-auto">
            <p className="text-base font-semibold text-destructive mb-2">{error}</p>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Dữ liệu trên Supabase vẫn an toàn 100%. Máy chủ đám mây (Render Free) có thể mất 20–30 giây để thức giấc sau 15 phút nghỉ.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError("")
                window.location.reload()
              }}
              className="gap-2"
            >
              🔄 Bấm vào đây để tải lại chương
            </Button>
          </div>
        ) : chapter ? (
          <>
            <header className="mb-8 text-center sm:mb-10">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">Chương {chapter.chapterNo}</p>
              <h1 className="font-sans text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{chapter.title?.normalize("NFC")}</h1>
            </header>

            {navigation}

            <div
              className="py-10 leading-[1.95] text-foreground/90 sm:py-14 font-sans tracking-normal select-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              {paragraphs.map((paragraph, index) => {
                const isCurrent = currentParagraph === index
                return (
                  <p
                    id={`p${index}`}
                    key={`p${index}`}
                    onClick={() => {
                      setShowAudioBar(true)
                      playParagraph(index)
                    }}
                    title="Bấm để nghe đọc từ đoạn này"
                    className={`mb-6 last:mb-0 transition-all duration-300 rounded-xl p-3 cursor-pointer ${
                      isCurrent
                        ? "bg-amber-500/10 border-l-4 border-amber-500 pl-4 text-foreground font-medium shadow-sm ring-1 ring-amber-500/25"
                        : "hover:bg-muted/40 hover:pl-3.5 hover:border-l-2 hover:border-muted-foreground/30"
                    }`}
                  >
                    {renderParagraphContent(paragraph, isCurrent)}
                  </p>
                )
              })}
            </div>

            {navigation}
          </>
        ) : (
          <div className="py-24 text-center text-muted-foreground">Đang mở chương truyện...</div>
        )}
      </article>

      {/* Floating Audio Bar cố định dưới màn hình khi bật nghe đọc */}
      {showAudioBar && (
        <div className="fixed bottom-5 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 max-w-2xl w-full z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur-lg">
            
            {/* Cụm điều khiển Play / Pause / Next / Prev */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full shrink-0"
                onClick={prevParagraph}
                disabled={currentParagraph === null || currentParagraph <= 0}
                title="Đoạn trước"
              >
                <SkipBack className="size-4" />
              </Button>

              <Button
                size="icon"
                className="size-11 rounded-full shrink-0 bg-primary text-primary-foreground shadow-md hover:scale-105 transition-transform"
                onClick={togglePlay}
                title={isPlaying ? "Tạm dừng" : "Tiếp tục đọc"}
              >
                {isBuffering ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5 ml-0.5" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-full shrink-0"
                onClick={nextParagraph}
                disabled={currentParagraph === null || currentParagraph >= paragraphs.length - 1}
                title="Đoạn sau"
              >
                <SkipForward className="size-4" />
              </Button>

              <div className="ml-1 text-xs font-medium text-muted-foreground min-w-[70px]">
                {currentParagraph !== null ? (
                  <span className="flex items-center gap-1.5">
                    <span>Đoạn {currentParagraph + 1}/{paragraphs.length}</span>
                    {isBuffering && <span className="text-[11px] text-amber-500 font-semibold animate-pulse">(Đang tải...)</span>}
                  </span>
                ) : (
                  <span>Sẵn sàng</span>
                )}
              </div>
            </div>

            {/* Cụm chọn giọng & tốc độ & Dừng */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Chọn giọng Nam Minh / Hoài My */}
              <select
                value={voice}
                onChange={(e) => {
                  const newVoice = e.target.value
                  clearAudioCache()
                  setVoice(newVoice)
                  if (currentParagraph !== null) {
                    setTimeout(() => playParagraph(currentParagraph), 50)
                  }
                }}
                className="h-8 rounded-lg border border-border/70 bg-card px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                title="Chọn giọng đọc"
              >
                <option value="vi-VN-NamMinhNeural">🎙️ Nam Minh (Nam)</option>
                <option value="vi-VN-HoaiMyNeural">🎙️ Hoài My (Nữ)</option>
              </select>

              {/* Chọn tốc độ đọc */}
              <select
                value={rate}
                onChange={(e) => {
                  const newRate = e.target.value
                  clearAudioCache()
                  setRate(newRate)
                  if (currentParagraph !== null) {
                    setTimeout(() => playParagraph(currentParagraph), 50)
                  }
                }}
                className="h-8 rounded-lg border border-border/70 bg-card px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                title="Tốc độ đọc"
              >
                <option value="-15%">0.85x</option>
                <option value="+0%">1.0x</option>
                <option value="+15%">1.15x</option>
                <option value="+25%">1.25x</option>
                <option value="+50%">1.5x</option>
              </select>

              {/* Nút đóng / dừng */}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => {
                  stopAudio()
                  setShowAudioBar(false)
                }}
                title="Tắt thanh phát âm thanh"
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            </div>

          </div>
        </div>
      )}
    </main>
  )
}
