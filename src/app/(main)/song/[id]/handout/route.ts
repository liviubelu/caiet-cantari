import { handoutResponse } from "@/lib/handout-response"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return handoutResponse(id, req.url)
}
