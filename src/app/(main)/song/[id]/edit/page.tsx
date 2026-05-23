export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { songs } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { auth, canEditSongs } from "@/auth"
import { notFound, redirect } from "next/navigation"
import { SongForm } from "@/components/SongForm"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSongPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id || !canEditSongs(session.user.role)) redirect("/")

  const { id } = await params
  const [song] = await db.select().from(songs).where(eq(songs.id, id)).limit(1)
  if (!song) notFound()

  return (
    <div>
      <div className="px-4 pt-12 lg:pt-6 pb-4">
        <h1 className="text-[28px] font-display font-bold text-gray-900">Editează melodia</h1>
      </div>
      <div className="px-4">
        <SongForm
          songId={id}
          initialValues={{
            title: song.title,
            content: song.content,
            category: song.category ?? "",
            defaultKey: song.defaultKey ?? "",
          }}
        />
      </div>
    </div>
  )
}
