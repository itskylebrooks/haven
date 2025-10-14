import { Send } from 'lucide-react'
import Tabs from './Tabs'
import type { Mode } from '../lib/types'
import { motion } from 'framer-motion'

type TopBarProps = {
  mode: Mode
  title?: string | null
  onSelectTab: (tab: Extract<Mode, 'circles' | 'signals' | 'profile'>) => void
  onOpenComposer: () => void
}

const TopBar = ({
  mode,
  onSelectTab,
  onOpenComposer,
  title,
}: TopBarProps) => {
  const showTabs = ['circles', 'signals', 'profile'].includes(mode as string)

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 px-5">
      <span className="text-lg font-semibold tracking-tight text-white">Haven</span>

      {showTabs ? (
        <Tabs
          activeTab={mode as 'circles' | 'signals' | 'profile'}
          onSelect={onSelectTab}
        />
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
