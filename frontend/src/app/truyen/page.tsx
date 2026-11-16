// Trang thư viện truyện — placeholder, sẽ thay bằng component từ v0.dev
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStories, type StoryDto } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStories()
      .then(setStories)
      .catch((err) => console.error("Lỗi tải truyện:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-center">Đang tải...</p>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Thư viện truyện</h1>

      <div className="space-y-3">
        {stories.map((s) => (
          <Link key={s.id} href={`/truyen/${s.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>{s.title}</CardTitle>
                <CardDescription>
                  {s.author || "Không rõ tác giả"} · {s.chapterCount} chương
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}

        {stories.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            Chưa có truyện nào. Hãy thêm truyện đầu tiên!
          </p>
        )}
      </div>
    </main>
  );
}
