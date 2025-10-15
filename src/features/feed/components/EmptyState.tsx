import { motion } from 'framer-motion'

type EmptyStateProps = {
  message: string
}

const EmptyState = ({ message }: EmptyStateProps) => (
  <motion.p
    className="pt-10 text-center text-sm text-neutral-500"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
    exit={{ opacity: 0, y: -6, transition: { duration: 0.14 } }}
  >
    {message}
  </motion.p>
)

export default EmptyState
