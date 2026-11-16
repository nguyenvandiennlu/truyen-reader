"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, BookOpen, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

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

export default function ReaderPage({ storyId, chapterNo }: ReaderPageProps) {
  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")

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

    fetch(`/api/truyen/${storyId}/chuong/${chapterNo}`, { signal: controller.signal })
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
    return () => controller.abort()
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

  const paragraphs = useMemo(() => chapter?.paragraphs ?? [], [chapter])
  const goToChapter = (nextNo: number) => {
    window.location.href = `/truyen/${storyId}/chuong/${nextNo}`
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === "ArrowLeft" && chapter?.hasPrev) goToChapter(chapterNo - 1)
      if (event.key === "ArrowRight" && chapter?.hasNext) goToChapter(chapterNo + 1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [chapter, chapterNo])

  const navigation = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/70 py-4">
      <Button variant="outline" size="sm" disabled={!chapter?.hasPrev} onClick={() => goToChapter(chapterNo - 1)}>
        <ArrowLeft data-icon="inline-start" /> Trước
      </Button>
      <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-card/60 p-1" aria-label="Điều chỉnh cỡ chữ">
        <Button variant="ghost" size="sm" aria-label="Giảm cỡ chữ" disabled={fontSize <= MIN_FONT_SIZE} onClick={() => setFontSize((size) => Math.max(MIN_FONT_SIZE, size - 1))}><Minus /></Button>
        <span className="min-w-12 text-center text-xs text-muted-foreground">{fontSize}px</span>
        <Button variant="ghost" size="sm" aria-label="Tăng cỡ chữ" disabled={fontSize >= MAX_FONT_SIZE} onClick={() => setFontSize((size) => Math.min(MAX_FONT_SIZE, size + 1))}><Plus /></Button>
      </div>
      <Button variant="outline" size="sm" disabled={!chapter?.hasNext} onClick={() => goToChapter(chapterNo + 1)}>
        Sau <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  )

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-x-0 top-0 z-10 h-1 bg-primary/10" aria-hidden="true"><Progress value={progress} className="h-1 rounded-none" /></div>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 pb-8 pt-10 sm:px-8">
        <Link href={`/truyen/${storyId}`} className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft /> <span className="truncate">{chapter?.storyTitle ?? "Quay lại truyện"}</span>
        </Link>
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><BookOpen /> {progress}%</span>
      </header>
      <article className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
        {error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : chapter ? <>
          <header className="mb-8 text-center sm:mb-10"><p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">Chương {chapter.chapterNo}</p><h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{chapter.title}</h1></header>
          {navigation}
          <div className="py-10 font-serif leading-[1.95] text-foreground/90 sm:py-14" style={{ fontSize: `${fontSize}px` }}>
            {paragraphs.map((paragraph, index) => <p id={`p${index}`} key={`p${index}`} className="mb-6 last:mb-0">{paragraph}</p>)}
          </div>
          {navigation}
        </> : <div className="py-24 text-center text-muted-foreground">Đang mở chương truyện...</div>}
      </article>
    </main>
  )
}
