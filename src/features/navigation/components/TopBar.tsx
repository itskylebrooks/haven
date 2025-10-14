import { Send } from 'lucide-react'
import { motion } from 'framer-motion'
import Tabs from './Tabs'
import type { Mode } from '../../../lib/types'

type TopBarProps = {
  mode: Mode
  activeTab?: Extract<Mode, 'circles' | 'signals' | 'profile'>
  title?: string | null
  onSelectTab: (tab: Extract<Mode, 'circles' | 'signals' | 'profile'>) => void
  onOpenComposer: () => void
}

const TopBar = ({
  mode,
  activeTab: passedActiveTab,
  onSelectTab,
  onOpenComposer,
  title,
}: TopBarProps) => {
  const showTabs = true

  // Prefer a passed-in activeTab (useful when viewing a trace and we want to
  // highlight the tab according to the trace kind). Fallback to deriving
  // from mode (circles/signals/profile) and default to 'circles'.
  const activeTab =
    passedActiveTab ??
    (['circles', 'signals', 'profile'].includes(mode as string)
      ? (mode as 'circles' | 'signals' | 'profile')
      : 'circles')

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 px-5">
      <span className="text-lg font-semibold tracking-tight text-white">Haven</span>

      {showTabs ? (
        <Tabs activeTab={activeTab} onSelect={onSelectTab} />
      ) : (
        <span className="text-sm text-neutral-400">{title}</span>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onOpenComposer}
        className="grid h-8 w-8 place-items-center rounded-full bg-white text-neutral-950 transition hover:bg-white/90"
        aria-label="Compose trace"
      >
        <Send className="h-4 w-4" />
      </motion.button>
    </header>
  )
}

export default TopBar
