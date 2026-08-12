interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="error-message" data-testid="error-message">
      <p className="timeline-status">{message}</p>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          再試行
        </button>
      )}
    </div>
  )
}
