interface Props {
  size?: number
  className?: string
}

export function ChurchIcon({ size = 14, className = "" }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Christian cross: vertical full height, horizontal bar at upper third */}
      <path d="M12 2v20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7 8h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
