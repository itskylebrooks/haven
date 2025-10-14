type EmptyStateProps = {
  message: string
}

const EmptyState = ({ message }: EmptyStateProps) => (
  <p className="pt-10 text-center text-sm text-neutral-500">{message}</p>
)

export default EmptyState
