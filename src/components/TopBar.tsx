import { ArrowLeft, Send } from 'lucide-react'
import Tabs from './Tabs'
import type { Mode } from '../lib/types'
import { motion } from 'framer-motion'

type TopBarProps = {
  mode: Mode
  title?: string | null
  canGoBack: boolean
  onBack: () => void
  onSelectTab: (tab: Extract<Mode, 'circles' | 'signals' | 'profile'>) => void
  onOpenComposer: () => void
}

const TopBar = ({
  mode,
  canGoBack,
  onBack,
  onSelectTab,
  onOpenComposer,
  title,
}: TopBarProps) => {
  const showTabs = mode === 'circles' || mode === 'signals' || mode === 'profile'

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 px-5">
      {canGoBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      ) : (
        <span className="text-lg font-semibold tracking-tight text-white">
          Haven
        </span>
      )}

      {showTabs ? (
        <Tabs activeTab={mode} onSelect={onSelectTab} />
      ) : (
        <span className="text-sm text-neutral-400">{title}</span>
      )}

      {mode !== 'user' && mode !== 'trace' ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenComposer}
          className="grid h-8 w-8 place-items-center rounded-full bg-white text-neutral-950 transition hover:bg-white/90"
          aria-label="Compose trace"
        >
          <Send className="h-4 w-4" />
        </motion.button>
      ) : (
        <div className="h-8 w-8" />
      )}
    </header>
  )
}

export default TopBar
