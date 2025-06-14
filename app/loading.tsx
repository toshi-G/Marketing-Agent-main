import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    </div>
  )
}
