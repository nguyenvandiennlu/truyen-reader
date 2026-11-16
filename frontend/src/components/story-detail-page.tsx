"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, BookOpen, Edit3, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CrawlDialog } from "@/components/crawl-dialog"

interface Story {
  id: string
  title: string
  author: string
  chapterCount: number
  sourceUrl?: string
  latestChapterNo?: number
}
interface Chapter { chapterNo: number; title: string }
interface StoryResponse { story: Story; chapters: Chapter[] }

interface StoryDetailPageProps { storyId: string }

export default function StoryDetailPage({ storyId }: StoryDetailPageProps) {
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [lastChapter, setLastChapter] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [chapterTitle, setChapterTitle] = useState("")
  const [content, setContent] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [editAuthor, setEditAuthor] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  async function loadStory() {
    try {
      setError("")
      const response = await fetch(`/api/truyen/${storyId}`)
      if (!response.ok) throw new Error("Không thể tải thông tin truyện")
      const data = (await response.json()) as StoryResponse
      setStory(data.story)
      setChapters(data.chapters)
      setEditTitle(data.story.title)
      setEditAuthor(data.story.author)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Đã có lỗi xảy ra") } finally { setIsLoading(false) }
  }

  useEffect(() => {
    void loadStory()
    const saved = Number(window.localStorage.getItem(`last-chapter-${storyId}`))
    if (saved > 0) setLastChapter(saved)
  }, [storyId])

  async function addChapter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!chapterTitle.trim() || !content.trim()) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/truyen/${storyId}/chuong`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: chapterTitle.trim(), content: content.trim() }) })
      if (!response.ok) throw new Error("Không thể thêm chương")
      const chapter = (await response.json()) as Chapter
      setChapters((current) => [...current, chapter].sort((a, b) => a.chapterNo - b.chapterNo))
      setStory((current) => current ? { ...current, chapterCount: current.chapterCount + 1 } : current)
      setChapterTitle(""); setContent(""); setIsChapterDialogOpen(false)
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Đã có lỗi xảy ra") } finally { setIsSaving(false) }
  }

  async function deleteChapter(chapter: Chapter) {
    try {
      const response = await fetch(`/api/truyen/${storyId}/chuong/${chapter.chapterNo}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Không thể xoá chương")
      setChapters((current) => current.filter((item) => item.chapterNo !== chapter.chapterNo))
      setStory((current) => current ? { ...current, chapterCount: Math.max(0, current.chapterCount - 1) } : current)
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Đã có lỗi xảy ra") }
  }

  async function updateStory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setIsSaving(true)
    try {
      const response = await fetch(`/api/truyen/${storyId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editTitle.trim(), author: editAuthor.trim() }) })
      if (!response.ok) throw new Error("Không thể cập nhật truyện")
      const updated = (await response.json()) as Story
      setStory(updated); setIsEditDialogOpen(false)
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Đã có lỗi xảy ra") } finally { setIsSaving(false) }
  }

  if (isLoading) return <main className="min-h-screen bg-background py-24 text-center text-muted-foreground">Đang mở truyện...</main>
  if (!story) return <main className="min-h-screen bg-background p-8 text-center"><p role="alert">{error || "Không tìm thấy truyện"}</p></main>
  const continueChapter = lastChapter && chapters.some((chapter) => chapter.chapterNo === lastChapter) ? lastChapter : chapters[0]?.chapterNo

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border/70 bg-card/70 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 lg:px-8"><Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft data-icon="inline-start" /> Thư viện</Link><span className="flex items-center gap-2 text-lg font-semibold"><BookOpen /> Truyện Reader</span></div></header>
    <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
      {error && <p role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <section className="mb-10 flex flex-col gap-6 border-b border-border/70 pb-10 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">Chi tiết truyện</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{story.title}</h1><p className="mt-3 text-muted-foreground">Tác giả: {story.author}</p><Badge variant="secondary" className="mt-4">{chapters.length} chương</Badge></div><div className="flex flex-wrap gap-2">{continueChapter ? (<Link href={`/truyen/${storyId}/chuong/${continueChapter}`}><Button>Đọc tiếp</Button></Link>) : (<Button disabled>Đọc tiếp</Button>)}<CrawlDialog storyId={story.id} storyTitle={story.title} initialUrl={story.sourceUrl} latestChapterNo={chapters.length > 0 ? chapters[chapters.length - 1].chapterNo : 0} onStoryCrawled={loadStory} triggerButton={<Button variant="secondary" className="gap-2 border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 font-medium"><Sparkles className="size-4 text-amber-500" />Cập nhật chương mới</Button>} /><Button variant="outline" onClick={() => setIsChapterDialogOpen(true)}><Plus data-icon="inline-start" />Thêm chương</Button><Button variant="outline" onClick={() => setIsEditDialogOpen(true)}><Edit3 data-icon="inline-start" />Sửa truyện</Button></div></section>
      <section><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-semibold">Danh sách chương</h2><span className="text-sm text-muted-foreground">{chapters.length} chương</span></div>{chapters.length ? <div className="overflow-hidden rounded-xl border border-border/70">{chapters.map((chapter, index) => <div key={chapter.chapterNo} className={`group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-primary/10 ${index % 2 ? "bg-muted/30" : "bg-card/50"}`}><Link href={`/truyen/${storyId}/chuong/${chapter.chapterNo}`} className="min-w-0 flex-1 text-lg hover:text-primary"><span className="text-sm text-muted-foreground">Chương {chapter.chapterNo}: </span>{chapter.title}</Link><AlertDialog><AlertDialogTrigger aria-label={`Xoá chương ${chapter.chapterNo}`}><Trash2 /></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xoá chương này?</AlertDialogTitle><AlertDialogDescription>Chương {chapter.chapterNo}: {chapter.title} sẽ bị xoá vĩnh viễn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Huỷ</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void deleteChapter(chapter)}>Xoá chương</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>)}</div> : <Empty className="border border-dashed border-border/80 bg-card/40 py-16"><EmptyHeader><EmptyMedia variant="icon" className="bg-primary/10 text-primary"><BookOpen /></EmptyMedia><EmptyTitle className="text-xl">Chưa có chương nào</EmptyTitle><EmptyDescription>Thêm chương đầu tiên để bắt đầu câu chuyện.</EmptyDescription></EmptyHeader></Empty>}</section>
    </div>
    <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Thêm chương mới</DialogTitle><DialogDescription>Dán nội dung chương để lưu vào truyện.</DialogDescription></DialogHeader><form id="add-chapter-form" onSubmit={addChapter} className="flex flex-col gap-4"><div className="flex flex-col gap-2"><Label htmlFor="chapter-title">Tên chương</Label><Input id="chapter-title" value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} required /></div><div className="flex flex-col gap-2"><Label htmlFor="chapter-content">Nội dung</Label><Textarea id="chapter-content" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Dán nội dung chương vào đây, mỗi đoạn một dòng" className="min-h-64 resize-y" required /></div></form><DialogFooter><Button type="submit" form="add-chapter-form" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu chương"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent><DialogHeader><DialogTitle>Sửa thông tin truyện</DialogTitle><DialogDescription>Cập nhật tên truyện hoặc tác giả.</DialogDescription></DialogHeader><form id="edit-story-form" onSubmit={updateStory} className="flex flex-col gap-4"><div className="flex flex-col gap-2"><Label htmlFor="edit-title">Tên truyện</Label><Input id="edit-title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required /></div><div className="flex flex-col gap-2"><Label htmlFor="edit-author">Tác giả</Label><Input id="edit-author" value={editAuthor} onChange={(event) => setEditAuthor(event.target.value)} required /></div></form><DialogFooter><Button type="submit" form="edit-story-form" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogFooter></DialogContent></Dialog>
  </main>
}
