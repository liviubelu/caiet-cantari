import { handoutResponse } from "@/lib/handout-response"

export const dynamic = "force-dynamic"

// [name] is the download filename (e.g. "El e Fântâna.pdf"); it's only there so
// the browser's PDF viewer names the saved file correctly. The song is loaded
// from [id].
export async function GET(req: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id } = await params
  return handoutResponse(id, req.url)
}
