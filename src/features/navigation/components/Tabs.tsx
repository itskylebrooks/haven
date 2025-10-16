import { motion } from 'framer-motion'
// Local tab key type; allow a 'none' state when no tab is active
type TabKey = 'circles' | 'signals' | 'profile' | 'none'

type TabsProps = {
  activeTab: TabKey
  onSelect: (tab: Exclude<TabKey, 'none'>) => void
}

const TAB_LABELS: { key: Exclude<TabKey, 'none'>; label: string }[] = [
  { key: 'circles', label: 'Circles' },
  { key: 'signals', label: 'Signals' },
  { key: 'profile', label: 'Profile' },
]

const Tabs = ({ activeTab, onSelect }: TabsProps) => (
  <nav className="relative flex gap-6 text-sm text-neutral-400">
    {TAB_LABELS.map(({ key, label }) => {
      const isActive = activeTab === key
      return (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`relative pb-1 transition-colors ${isActive ? 'text-white' : 'hover:text-white'}`}
        >
          {label}
          {isActive && (
            <motion.span
              layoutId="tab-underline"
              className="absolute -bottom-[2px] left-0 right-0 h-[2px] rounded-full bg-[var(--accent-color)]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />)
          }
        </button>
      )
    })}
  </nav>
)

export default Tabs
