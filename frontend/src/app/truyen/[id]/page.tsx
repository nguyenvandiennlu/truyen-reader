import StoryDetailPage from "@/components/story-detail-page"

interface StoryRouteProps {
  params: Promise<{ id: string }>
}

export default async function StoryRoute({ params }: StoryRouteProps) {
  const { id } = await params
  return <StoryDetailPage storyId={id} />
}
