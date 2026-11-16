"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, Library, Plus, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CrawlDialog } from "@/components/crawl-dialog"

interface Story {
  id: string
  title: string
  author: string
  chapterCount: number
}

export default function Page() {
  const [stories, setStories] = useState<Story[]>([])
  const [query, setQuery] = useState("")
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  async function loadStories() {
    try {
      setError("")
      const response = await fetch("/api/truyen")
      if (!response.ok) throw new Error("Không thể tải thư viện")
      setStories(await response.json())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Đã có lỗi xảy ra")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadStories()
  }, [])

  const filteredStories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi")
    return stories.filter((story) => story.title.toLocaleLowerCase("vi").includes(normalizedQuery))
  }, [query, stories])

  async function addStory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !author.trim()) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/truyen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), author: author.trim() }),
      })
      if (!response.ok) throw new Error("Không thể thêm truyện")
      const story = (await response.json()) as Story
      setStories((current) => [story, ...current])
      setTitle("")
      setAuthor("")
      setIsDialogOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Đã có lỗi xảy ra")
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteStory(story: Story) {
    if (!window.confirm(`Bạn có chắc muốn xoá “${story.title}” không?`)) return
    try {
      const response = await fetch(`/api/truyen/${story.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Không thể xoá truyện")
      setStories((current) => current.filter((item) => item.id !== story.id))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Đã có lỗi xảy ra")
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Trang chủ Truyện Reader">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen />
            </span>
            <span className="text-xl font-semibold tracking-tight">Truyện Reader</span>
          </Link>

          <div className="flex items-center gap-2">
            <CrawlDialog onStoryCrawled={loadStories} />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={<Button><Plus data-icon="inline-start" />Thêm thủ công</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm truyện mới</DialogTitle>
                  <DialogDescription>Lưu lại một câu chuyện để bắt đầu đọc.</DialogDescription>
                </DialogHeader>
                <form id="add-story-form" onSubmit={addStory} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="story-title">Tên truyện</Label>
                    <Input
                      id="story-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Ví dụ: Mùa hè năm ấy"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="story-author">Tác giả</Label>
                    <Input
                      id="story-author"
                      value={author}
                      onChange={(event) => setAuthor(event.target.value)}
                      placeholder="Nhập tên tác giả"
                      required
                    />
                  </div>
                </form>
                <DialogFooter>
                  <Button type="submit" form="add-story-form" disabled={isSaving}>
                    {isSaving ? "Đang lưu..." : "Lưu truyện"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="mb-10 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">Kho lưu trữ cá nhân</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Thư viện truyện</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Nơi những câu chuyện bạn yêu thích được lưu giữ gọn gàng.
            </p>
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Tìm kiếm truyện"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên truyện..."
              className="h-11 bg-card pl-10"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Đang mở thư viện...</div>
        ) : filteredStories.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStories.map((story) => (
              <Card
                key={story.id}
                className="group flex min-h-48 flex-col border-border/70 bg-card/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/truyen/${story.id}`}
                      className="text-xl font-semibold leading-snug hover:text-primary"
                    >
                      {story.title}
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground">{story.author}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Xoá ${story.title}`}
                    className="shrink-0 text-muted-foreground opacity-60 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={() => void deleteStory(story)}
                  >
                    <Trash2 />
                  </Button>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Badge variant="secondary">{story.chapterCount} chương</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Empty className="min-h-72 border border-dashed border-border/80 bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-primary/10 text-primary">
                <Library />
              </EmptyMedia>
              <EmptyTitle className="text-xl">
                {query ? "Không tìm thấy truyện" : "Chưa có truyện nào"}
              </EmptyTitle>
              <EmptyDescription>
                {query ? "Thử tìm bằng một tên khác." : "Hãy cào truyện từ link hoặc thêm truyện đầu tiên!"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {!query && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <CrawlDialog onStoryCrawled={loadStories} />
                  <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Thêm thủ công
                  </Button>
                </div>
              )}
            </EmptyContent>
          </Empty>
        )}
      </div>
    </main>
  )
}
