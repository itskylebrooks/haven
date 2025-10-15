import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import Tabs from './Tabs'
import type { Mode } from '../../../lib/types'
import type { CircleNotification, NotificationsState, SignalNotification } from '../types'

type TopBarProps = {
  mode: Mode
  activeTab?: Extract<Mode, 'circles' | 'signals' | 'profile'>
  title?: string | null
  onSelectTab: (tab: Extract<Mode, 'circles' | 'signals' | 'profile'>) => void
  notifications: NotificationsState
  formatTime: (timestamp: number) => string
  onOpenTrace: (traceId: string) => void
  onOpenProfile: (identifier: string) => void
}

const TopBar = ({
  mode,
  activeTab: passedActiveTab,
  onSelectTab,
  notifications,
  formatTime,
  onOpenTrace,
  onOpenProfile,
  title,
}: TopBarProps) => {
  const showTabs = true
  const [isOpen, setIsOpen] = useState(false)
  const [activeNotificationsTab, setActiveNotificationsTab] = useState<'circles' | 'signals'>('circles')
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setIsOpen(false)
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [mode, passedActiveTab])

  // Prefer a passed-in activeTab (useful when viewing a trace and we want to
  // highlight the tab according to the trace kind). Fallback to deriving
  // from mode. Treat 'user' as 'profile' so loading a user/profile route
  // doesn't briefly highlight 'Circles' before the correct tab is applied.
  let derived: Extract<Mode, 'circles' | 'signals' | 'profile'> = 'circles'
  if (mode === 'circles' || mode === 'signals' || mode === 'profile' || mode === 'user') {
    derived = mode === 'user' ? 'profile' : (mode as 'circles' | 'signals' | 'profile')
  }

  const activeTab = passedActiveTab ?? derived
  const hasNotifications = notifications.circles.length > 0 || notifications.signals.length > 0

  const handleCircleClick = (item: CircleNotification) => {
    if (item.type === 'connection') {
      onOpenProfile(item.user.username)
    } else {
      onOpenTrace(item.traceId)
    }
    setIsOpen(false)
  }

  const handleSignalClick = (item: SignalNotification) => {
    onOpenTrace(item.traceId)
    setIsOpen(false)
  }

  const renderCircleNotification = (item: CircleNotification) => {
    const subtitle =
      item.type === 'connection'
        ? 'wants to connect as a friend'
        : item.type === 'resonate'
          ? 'resonated with your circle'
          : 'shared a reflection'

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleCircleClick(item)}
        className="w-full rounded-2xl border border-white/5 bg-white/[0.04] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
      >
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="font-medium text-neutral-200">{item.user.name}</span>
          <span>{formatTime(item.createdAt)}</span>
        </div>
        <div className="mt-1 text-sm text-neutral-200">{subtitle}</div>
        {item.type !== 'connection' && (
          <div className="mt-2 space-y-2">
            <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-400">
              {item.traceText}
            </div>
            {item.type === 'reflection' && (
              <div className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs text-neutral-100">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-emerald-300">
                  Reflection
                </span>
                <p className="mt-1 text-sm text-neutral-100">{item.text}</p>
              </div>
            )}
          </div>
        )}
      </button>
    )
  }

  const renderSignalNotification = (item: SignalNotification) => {
    return (
      <button
        key={item.traceId}
        type="button"
        onClick={() => handleSignalClick(item)}
        className="w-full rounded-2xl border border-white/5 bg-white/[0.04] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-neutral-500">
          <span>Signal</span>
          <span className="normal-case">{formatTime(item.latestActivity)}</span>
        </div>
        <div className="mt-2 text-sm text-neutral-100">{item.traceText}</div>
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
          <span>{item.resonateCount} resonate{item.resonateCount === 1 ? '' : 's'}</span>
          <span>{item.reflections.length} reflection{item.reflections.length === 1 ? '' : 's'}</span>
        </div>
        {item.reflections.length > 0 && (
          <div className="mt-3 space-y-2">
            {item.reflections.map((reflection) => (
              <div key={reflection.id} className="rounded-lg bg-white/5 px-3 py-2 text-xs">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-neutral-500">
                  <span className="text-neutral-300">{reflection.author.name}</span>
                  <span className="normal-case text-neutral-500">{formatTime(reflection.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-200">{reflection.text}</p>
              </div>
            ))}
          </div>
        )}
      </button>
    )
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 px-5">
      <span className="text-lg font-semibold tracking-tight text-white">Haven</span>

      {showTabs ? (
        <Tabs activeTab={activeTab} onSelect={onSelectTab} />
      ) : (
        <span className="text-sm text-neutral-400">{title}</span>
      )}

      <div className="relative">
        <motion.button
          ref={triggerRef}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen((open) => !open)}
          className="relative grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-neutral-100 shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:border-white/30 hover:bg-white/[0.16]"
          aria-label="Open notifications"
          aria-expanded={isOpen}
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.6} />
          {hasNotifications && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(12,12,12,0.9)]" />
          )}
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="absolute right-0 top-12 z-40 w-[320px] rounded-3xl border border-white/10 bg-neutral-950/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-200">Notifications</span>
                {hasNotifications ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                    {notifications.circles.length + notifications.signals.length}
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500">Up to date</span>
                )}
              </div>

              <div className="mt-3 flex rounded-full bg-white/5 p-1 text-xs font-medium">
                {(['circles', 'signals'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveNotificationsTab(tab)}
                    className={`flex-1 rounded-full px-3 py-1 transition ${
                      activeNotificationsTab === tab
                        ? 'bg-white text-neutral-950'
                        : 'text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    {tab === 'circles' ? 'Circles' : 'Signals'}
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                {activeNotificationsTab === 'circles' ? (
                  notifications.circles.length ? (
                    notifications.circles.map(renderCircleNotification)
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-center text-sm text-neutral-400">
                      Your circles are all caught up.
                    </div>
                  )
                ) : notifications.signals.length ? (
                  notifications.signals.map(renderSignalNotification)
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-center text-sm text-neutral-400">
                    No signal activity yet. Share one and invite resonance.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default TopBar
