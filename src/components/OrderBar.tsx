import { resolveOrder, type SongSection } from "@/lib/sections"

interface Props {
  order: string[]
  sections: SongSection[]
  className?: string
}

/**
 * The "Ordine de cântare" guide bar: shows the custom singing sequence as
 * abbreviated chips (S1 › Ref › S2 › …). Renders nothing if no order is set.
 */
export function OrderBar({ order, sections, className = "" }: Props) {
  const resolved = resolveOrder(order, sections)
  if (resolved.length === 0) return null

  return (
    <div className={`flex items-start gap-2.5 flex-wrap ${className}`}>
      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500 mt-1 flex-shrink-0">
        Ordine de cântare
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {resolved.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300 dark:text-gray-600 text-sm leading-none">›</span>}
            <span
              className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono whitespace-nowrap"
              style={{ backgroundColor: `${s.color}1a`, color: s.color }}
            >
              {s.abbr}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
