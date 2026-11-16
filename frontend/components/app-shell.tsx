"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { BookOpen, ChevronRight, Library, Menu, Moon, Settings, Sun, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const currentChapters = [
  { no: 1, title: "Khởi đầu" },
  { no: 2, title: "Một ngày mới" },
  { no: 3, title: "Gặp gỡ" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const isReading = pathname.startsWith("/truyen/")
  const storyId = pathname.split("/")[2]

  function toggleTheme() {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    document.documentElement.classList.toggle("dark", nextIsDark)
  }

  const closeMobile = () => setIsMobileOpen(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" onClick={closeMobile} className="flex items-center gap-3" aria-label="Trang chủ Truyện Reader">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"><BookOpen /></span>
            <span className="font-serif text-xl font-semibold tracking-tight">Truyện Reader</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeMobile} aria-label="Đóng menu"><X /></Button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-4" aria-label="Điều hướng chính">
          <Link href="/" onClick={closeMobile} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === "/" && "bg-sidebar-accent text-sidebar-accent-foreground")}>
            <Library data-icon="inline-start" />
            Thư viện
          </Link>

          {isReading && storyId && (
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55"><BookOpen data-icon="inline-start" /> Đang đọc</div>
              <p className="truncate px-3 py-2 font-serif text-base font-semibold">Truyện đang đọc</p>
              <div className="flex flex-col gap-1 border-l border-sidebar-border ml-4 pl-3">
                {currentChapters.map((chapter) => (
                  <Link key={chapter.no} href={`/truyen/${storyId}/chuong/${chapter.no}`} onClick={closeMobile} className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    Chương {chapter.no}
                    <ChevronRight />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-4 text-xs leading-5 text-sidebar-foreground/55">Đọc chậm lại, để câu chuyện ở lại lâu hơn.</div>
      </aside>

      {isMobileOpen && <button type="button" aria-label="Đóng menu" className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden" onClick={closeMobile} />}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileOpen(true)} aria-label="Mở menu"><Menu /></Button>
            <Link href="/" className="flex items-center gap-2 lg:hidden"><BookOpen className="text-primary" /><span className="font-serif font-semibold">Truyện Reader</span></Link>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={isDark ? "Bật chế độ sáng" : "Bật chế độ tối"}>{isDark ? <Sun /> : <Moon />}</Button>
            <Button variant="ghost" size="icon" aria-label="Cài đặt"><Settings /></Button>
          </div>
        </header>
        <main className="app-page-transition">{children}</main>
      </div>
    </div>
  )
}
