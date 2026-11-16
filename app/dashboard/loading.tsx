export default function LoadingDashboard() {
  return (
    <div className="max-w-6xl mx-auto p-6 animate-pulse">
      <div className="h-6 w-48 bg-neutral-200 rounded mb-4" />
      <div className="grid grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-neutral-100 h-24" />
        ))}
      </div>
    </div>
  )
}