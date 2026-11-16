"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Terminal,
  Layers,
  Database,
  Radio,
  Clock,
  RefreshCw,
  Globe,
  HardDrive,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

interface CrawlProgressEvent {
  status: "STARTING" | "PROGRESS" | "COMPLETED" | "ERROR"
  storyId?: number
  storyTitle?: string
  chapterNo?: number
  chapterTitle?: string
  current?: number
  total?: number
  message?: string
}

interface RemoteStoryInfo {
  storyId?: number
  storyTitle?: string
  author?: string
  localChapterCount?: number
  latestLocalChapter?: number
  remoteMaxChapter?: number
  missingChapters?: number
  sourceUrl?: string
}

interface LogEntry {
  time: string
  text: string
  type: "info" | "success" | "warn" | "error"
}

interface CrawlDialogProps {
  onStoryCrawled?: () => void
  storyId?: string | number
  storyTitle?: string
  initialUrl?: string
  latestChapterNo?: number
  triggerButton?: React.ReactElement
}

export function CrawlDialog({
  onStoryCrawled,
  storyId,
  storyTitle,
  initialUrl = "",
  latestChapterNo = 0,
  triggerButton,
}: CrawlDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState(initialUrl)
  const [crawlMode, setCrawlMode] = useState<"all" | "custom">("all")
  const [maxChapters, setMaxChapters] = useState("100")
  const [isCrawling, setIsCrawling] = useState(false)
  const [remoteInfo, setRemoteInfo] = useState<RemoteStoryInfo | null>(null)
  const [isLoadingInfo, setIsLoadingInfo] = useState(false)
  const [progress, setProgress] = useState<CrawlProgressEvent | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)
  const logsEndRef = useRef<HTMLDivElement | null>(null)

  const isUpdateMode = Boolean(storyId)

  // Tự động kiểm tra số chương trên web nguồn khi mở dialog
  useEffect(() => {
    if (isOpen) {
      const apiHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? `http://${window.location.hostname}:8080`
        : ""
      const query = isUpdateMode && storyId
        ? `storyId=${storyId}`
        : url.trim()
        ? `url=${encodeURIComponent(url.trim())}`
        : ""

      if (query) {
        setIsLoadingInfo(true)
        fetch(`${apiHost}/api/crawl/info?${query}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data: RemoteStoryInfo | null) => {
            if (data) {
              setRemoteInfo(data)
              if (data.missingChapters && data.missingChapters > 0) {
                setMaxChapters(String(data.missingChapters))
              }
            }
          })
          .catch(() => {})
          .finally(() => setIsLoadingInfo(false))
      }
    }
  }, [isOpen, storyId, url, isUpdateMode])

  useEffect(() => {
    if (initialUrl && !url) {
      setUrl(initialUrl)
    }
  }, [initialUrl])

  function formatCurrentTime(): string {
    const d = new Date()
    return d.toTimeString().split(" ")[0]
  }

  function addLog(text: string, type: LogEntry["type"] = "info") {
    setLogs((prev) => [...prev.slice(-40), { time: formatCurrentTime(), text, type }])
  }

  // Tự động cuộn xuống log mới nhất
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  function resetState() {
    if (!isUpdateMode) {
      setUrl("")
    }
    setCrawlMode("all")
    setMaxChapters("100")
    setIsCrawling(false)
    setProgress(null)
    setLogs([])
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open && isCrawling) {
      if (!window.confirm("Quá trình cào đang thực hiện. Bạn có chắc muốn đóng? Quá trình sẽ tiếp tục chạy ngầm trong máy chủ.")) {
        return
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setIsCrawling(false)
    }
    setIsOpen(open)
    if (!open) {
      resetState()
    }
  }

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  function startCrawl(e: React.FormEvent) {
    e.preventDefault()

    const apiHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? `http://${window.location.hostname}:8080`
      : ""

    // Nếu chọn cào tất cả: lấy missingChapters hoặc 1000 chương
    let limit = 1000
    if (crawlMode === "all") {
      limit = remoteInfo?.missingChapters && remoteInfo.missingChapters > 0
        ? remoteInfo.missingChapters
        : 1000
    } else {
      limit = parseInt(maxChapters, 10) || 100
    }

    let streamUrl = ""
    if (isUpdateMode && storyId) {
      streamUrl = `${apiHost}/api/crawl/update/${storyId}?maxChapters=${limit}`
      addLog(`Bắt đầu cập nhật chương mới cho “${storyTitle || "truyện"}”...`, "info")
    } else {
      if (!url.trim()) return
      streamUrl = `${apiHost}/api/crawl/stream?url=${encodeURIComponent(url.trim())}&maxChapters=${limit}`
      addLog("Bắt đầu kết nối đến máy chủ...", "info")
    }

    setIsCrawling(true)
    setProgress({ status: "STARTING", message: "Đang khởi tạo kết nối và kiểm tra chương trong DB..." })

    const es = new EventSource(streamUrl)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as CrawlProgressEvent
        setProgress(data)

        if (data.message) {
          let logType: LogEntry["type"] = "info"
          if (data.status === "COMPLETED") logType = "success"
          else if (data.status === "ERROR") logType = "error"
          else if (data.message.includes("không tồn tại") || data.message.includes("lỗi") || data.message.includes("nhảy")) {
            logType = "warn"
          } else if (data.status === "PROGRESS") {
            logType = "success"
          }
          addLog(data.message, logType)
        }

        if (data.status === "COMPLETED") {
          setIsCrawling(false)
          if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
          }
          addLog("Đã hoàn tất quá trình cào và giải phóng toàn bộ kết nối & bộ nhớ đệm.", "info")
          if (onStoryCrawled) {
            onStoryCrawled()
          }
        } else if (data.status === "ERROR") {
          setIsCrawling(false)
          if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
          }
        }
      } catch (err) {
        console.error("Lỗi đọc dữ liệu SSE:", err)
      }
    }

    es.onerror = () => {
      // Nếu EventSource đang ở trạng thái CONNECTING, trình duyệt đang tự động kết nối lại
      if (es.readyState === EventSource.CONNECTING) {
        addLog("Tín hiệu chập chờn, đang tự động kết nối lại với máy chủ...", "warn")
        return
      }

      setIsCrawling(false)
      setProgress({
        status: "ERROR",
        message: "Mất kết nối với máy chủ khi đang cào dữ liệu. Dữ liệu các chương đã cào vẫn được lưu đầy đủ trên Supabase.",
      })
      addLog("Mất kết nối SSE với máy chủ. Các chương đã tải về vẫn được bảo toàn trong cơ sở dữ liệu.", "error")
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (onStoryCrawled) {
        onStoryCrawled()
      }
    }
  }

  // Tính toán phần trăm tiến độ
  const percent =
    progress?.current && progress?.total && progress.total > 0
      ? Math.min(Math.round((progress.current / progress.total) * 100), 100)
      : progress?.status === "COMPLETED"
      ? 100
      : 0

  // Xác định bước hiện tại trong quy trình
  const step =
    progress?.status === "COMPLETED"
      ? 3
      : progress?.status === "PROGRESS"
      ? 2
      : isCrawling
      ? 1
      : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          triggerButton ? (
            triggerButton
          ) : (
            <Button variant="outline" className="gap-2 border-primary/30 hover:border-primary">
              <Download className="size-4 text-primary" />
              <span>Cào truyện từ link</span>
            </Button>
          )
        }
      />
      {/* Khóa chặt độ rộng dialog không bị co dãn khi tên chương dài */}
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg md:max-w-xl overflow-hidden box-border">
        <DialogHeader className="min-w-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold truncate">
            <Sparkles className="size-5 text-amber-500 shrink-0" />
            <span className="truncate">{isUpdateMode ? `Cập nhật: ${storyTitle}` : "Cào truyện tự động vào thư viện"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {isUpdateMode
              ? "Tự động so sánh số chương trên web nguồn và máy bạn để tải các chương mới nhất."
              : "Hỗ trợ cào từ truyenc.net và truyendocviet1.shop. Tự động phục hồi ký tự bị che và lưu vĩnh viễn vào máy."}
          </DialogDescription>
        </DialogHeader>

        {!isCrawling && progress?.status !== "COMPLETED" ? (
          <form id="crawl-form" onSubmit={startCrawl} className="flex flex-col gap-4 py-2 min-w-0">
            {/* Khung thống kê số chương giữa máy và web nguồn */}
            <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs space-y-2.5">
              <div className="flex justify-between items-center min-w-0">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <HardDrive className="size-3.5 text-primary" /> Trong máy hiện có:
                </span>
                <span className="font-bold text-foreground">
                  {remoteInfo?.latestLocalChapter ?? latestChapterNo} chương
                </span>
              </div>

              <div className="flex justify-between items-center min-w-0">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <Globe className="size-3.5 text-blue-500" /> Trên web nguồn ({remoteInfo?.sourceUrl?.includes("truyenc") ? "truyenc.net" : "web nguồn"}):
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {isLoadingInfo ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" /> Đang kiểm tra...
                    </span>
                  ) : remoteInfo?.remoteMaxChapter ? (
                    `${remoteInfo.remoteMaxChapter} chương`
                  ) : (
                    "Đang kiểm tra..."
                  )}
                </span>
              </div>

              {remoteInfo && (remoteInfo.missingChapters ?? 0) > 0 && (
                <div className="flex justify-between items-center border-t border-border/50 pt-2 min-w-0">
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 shrink-0">
                    <Zap className="size-3.5" /> Chưa tải về:
                  </span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                    {remoteInfo.missingChapters} chương mới
                  </span>
                </div>
              )}
            </div>

            {!isUpdateMode && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="crawl-url" className="font-medium">
                  Đường dẫn truyện hoặc chương cần cào
                </Label>
                <Input
                  id="crawl-url"
                  type="url"
                  placeholder="https://truyenc.net/truyen/toan-cau-cao-vo hoặc /chuong-159"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Mục chọn Cào tất cả hoặc Tùy chỉnh */}
            <div className="flex flex-col gap-2.5">
              <Label className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                Chế độ tải chương
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCrawlMode("all")}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                    crawlMode === "all"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border/70 bg-card hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Zap className="size-3.5 text-amber-500" />
                    Cào tất cả chương mới
                  </div>
                  <span className="text-[11px] opacity-80">
                    {remoteInfo?.missingChapters
                      ? `Tải toàn bộ ${remoteInfo.missingChapters} chương còn lại`
                      : "Tải đến chương cuối cùng"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCrawlMode("custom")}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                    crawlMode === "custom"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border/70 bg-card hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Layers className="size-3.5 text-primary" />
                    Tùy chỉnh số lượng
                  </div>
                  <span className="text-[11px] opacity-80">Chỉ tải số chương bạn chọn</span>
                </button>
              </div>

              {crawlMode === "custom" && (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="crawl-max"
                    type="number"
                    min="1"
                    max="1000"
                    value={maxChapters}
                    onChange={(e) => setMaxChapters(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-xs text-muted-foreground">chương mỗi lần (tối đa 1000)</span>
                </div>
              )}
            </div>

            {progress?.status === "ERROR" && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive min-w-0">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="break-words min-w-0 flex-1">{progress.message}</span>
              </div>
            )}
          </form>
        ) : (
          <div className="flex flex-col gap-3 py-2 min-w-0">
            {/* Thanh các bước (Process Stepper) */}
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-muted/30 p-2 text-xs">
              <div
                className={`flex items-center gap-2 rounded-lg p-2 min-w-0 transition-colors ${
                  step >= 1 ? "bg-background text-primary font-medium shadow-sm" : "text-muted-foreground"
                }`}
              >
                {step > 1 ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <Radio className="size-4 animate-pulse shrink-0 text-primary" />
                )}
                <span className="truncate">1. Kết nối nguồn</span>
              </div>

              <div
                className={`flex items-center gap-2 rounded-lg p-2 min-w-0 transition-colors ${
                  step >= 2 ? "bg-background text-primary font-medium shadow-sm" : "text-muted-foreground"
                }`}
              >
                {step > 2 ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : step === 2 ? (
                  <Loader2 className="size-4 animate-spin shrink-0 text-amber-500" />
                ) : (
                  <Layers className="size-4 shrink-0" />
                )}
                <span className="truncate">2. Tải ({percent}%)</span>
              </div>

              <div
                className={`flex items-center gap-2 rounded-lg p-2 min-w-0 transition-colors ${
                  step >= 3 ? "bg-background text-emerald-600 font-medium shadow-sm" : "text-muted-foreground"
                }`}
              >
                {step >= 3 ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <Database className="size-4 shrink-0" />
                )}
                <span className="truncate">3. Lưu DB</span>
              </div>
            </div>

            {/* Tiến độ và % trực quan - Khóa chặt width và bọc chữ */}
            <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-sm min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {step === 3 ? (
                    <span className="inline-flex size-2 shrink-0 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="inline-flex size-2 shrink-0 rounded-full bg-amber-500 animate-ping" />
                  )}
                  <span className="text-xs font-semibold truncate min-w-0 flex-1">
                    {progress?.status === "COMPLETED"
                      ? "Hoàn tất toàn bộ!"
                      : progress?.status === "ERROR"
                      ? "Có lỗi xảy ra"
                      : progress?.message || "Đang xử lý dữ liệu..."}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-xl font-bold tracking-tight text-primary">{percent}%</span>
                  {progress?.total ? (
                    <span className="text-[11px] text-muted-foreground">
                      ({progress.current || 0}/{progress.total})
                    </span>
                  ) : null}
                </div>
              </div>

              <Progress value={percent} className="h-2.5 transition-all duration-300" />

              {/* Chi tiết chương hiện tại - Truncate có kiểm soát */}
              {progress?.storyTitle && (
                <div className="mt-2.5 flex flex-col gap-1 border-t border-border/50 pt-2 text-xs text-muted-foreground min-w-0">
                  <div className="flex items-center justify-between min-w-0">
                    <span className="shrink-0 mr-2">Truyện:</span>
                    <span className="font-semibold text-foreground truncate text-right">{progress.storyTitle}</span>
                  </div>
                  {progress.chapterTitle && (
                    <div className="flex items-center justify-between min-w-0">
                      <span className="shrink-0 mr-2">Chương vừa tải:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 truncate text-right">
                        {progress.chapterTitle}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Terminal Live Activity Logs - Khóa chặt width và ngắt dòng tự động */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <Terminal className="size-3" />
                  Nhật ký tiến trình
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Tự động cập nhật
                </span>
              </div>
              <div className="h-36 overflow-y-auto overflow-x-hidden rounded-lg border border-border/70 bg-zinc-950 p-2.5 font-mono text-[11px] leading-relaxed text-zinc-300 shadow-inner w-full min-w-0">
                {logs.length === 0 ? (
                  <span className="text-zinc-500 italic">Đang chờ nhận tín hiệu từ máy chủ...</span>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 py-0.5 min-w-0 w-full">
                      <span className="shrink-0 text-zinc-500">[{log.time}]</span>
                      <span
                        className={`min-w-0 flex-1 break-all whitespace-normal ${
                          log.type === "success"
                            ? "text-emerald-400 font-medium"
                            : log.type === "warn"
                            ? "text-amber-400"
                            : log.type === "error"
                            ? "text-red-400 font-semibold"
                            : "text-zinc-200"
                        }`}
                      >
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Banner khi hoàn tất */}
            {progress?.status === "COMPLETED" && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 min-w-0">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="font-medium truncate">{progress.message || "Đã lưu truyện thành công vào thư viện!"}</span>
              </div>
            )}

            {/* Banner khi có lỗi */}
            {progress?.status === "ERROR" && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive min-w-0">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="break-words min-w-0 flex-1">{progress.message}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end pt-1">
          {!progress && !isCrawling && (
            <Button type="submit" form="crawl-form" className="gap-2 font-medium">
              {isUpdateMode ? (
                <>
                  <RefreshCw className="size-4" />
                  {crawlMode === "all" && remoteInfo?.missingChapters
                    ? `Cào tất cả ${remoteInfo.missingChapters} chương mới`
                    : "Cập nhật ngay"}
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  {crawlMode === "all" && remoteInfo?.missingChapters
                    ? `Cào tất cả ${remoteInfo.missingChapters} chương`
                    : "Bắt đầu cào"}
                </>
              )}
            </Button>
          )}

          {isCrawling && (
            <Button disabled className="gap-2 font-medium">
              <Loader2 className="size-4 animate-spin" />
              Đang cào dữ liệu...
            </Button>
          )}

          {progress?.status === "COMPLETED" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  resetState()
                }}
              >
                Đóng
              </Button>
              {progress.storyId && (
                <Button
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                  onClick={() => {
                    const targetStoryId = progress.storyId
                    setIsOpen(false)
                    resetState()
                    router.push(`/truyen/${targetStoryId}`)
                  }}
                >
                  Đọc ngay
                  <ExternalLink className="size-4" />
                </Button>
              )}
            </>
          )}

          {progress?.status === "ERROR" && !isCrawling && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  resetState()
                }}
              >
                Đóng
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setProgress(null)
                  // Kích hoạt nạp lại info để người dùng thấy các chương đã lưu
                  setIsLoadingInfo(true)
                  const apiHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
                    ? `http://${window.location.hostname}:8080`
                    : ""
                  const query = isUpdateMode && storyId
                    ? `storyId=${storyId}`
                    : url.trim()
                    ? `url=${encodeURIComponent(url.trim())}`
                    : ""
                  if (query) {
                    fetch(`${apiHost}/api/crawl/info?${query}`)
                      .then((res) => (res.ok ? res.json() : null))
                      .then((data: RemoteStoryInfo | null) => {
                        if (data) setRemoteInfo(data)
                      })
                      .catch(() => {})
                      .finally(() => setIsLoadingInfo(false))
                  } else {
                    setIsLoadingInfo(false)
                  }
                }}
              >
                Kiểm tra & Cào tiếp
              </Button>
              {progress.storyId && (
                <Button
                  className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                  onClick={() => {
                    const targetStoryId = progress.storyId
                    setIsOpen(false)
                    resetState()
                    router.push(`/truyen/${targetStoryId}`)
                  }}
                >
                  Đọc ngay ({progress.current} chương)
                  <ExternalLink className="size-4" />
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
