import ReaderPage from "@/components/reader-page"

interface ReaderRouteProps {
  params: Promise<{ id: string; no: string }>
}

export default async function ChapterRoute({ params }: ReaderRouteProps) {
  const { id, no } = await params
  return <ReaderPage storyId={id} chapterNo={Number(no) || 1} />
}
