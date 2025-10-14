import type { Mode } from '../lib/types'

type TabKey = Extract<Mode, 'circles' | 'signals' | 'profile'>

type TabsProps = {
  activeTab: TabKey
  onSelect: (tab: TabKey) => void
}

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: 'circles', label: 'Circles' },
  { key: 'signals', label: 'Signals' },
  { key: 'profile', label: 'Profile' },
]

const Tabs = ({ activeTab, onSelect }: TabsProps) => (
  <nav className="flex gap-6 text-sm text-neutral-400">
    {TAB_LABELS.map(({ key, label }) => (
      <button
        key={key}
        onClick={() => onSelect(key)}
        className={`transition-colors ${
          activeTab === key ? 'text-white' : 'hover:text-white'
        }`}
      >
        {label}
      </button>
    ))}
  </nav>
)

export default Tabs
