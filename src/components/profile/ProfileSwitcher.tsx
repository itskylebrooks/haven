import type { TraceType } from '../../lib/types'

type Props = {
  current: TraceType
  onChange: (kind: TraceType) => void
}

const ProfileSwitcher = ({ current, onChange }: Props) => {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-black p-1 text-sm">
      {(
        [
          { key: 'circle', label: 'Circles' },
          { key: 'signal', label: 'Signals' },
        ] as const
      ).map(({ key, label }) => {
        const active = current === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={
              'px-3 py-1.5 rounded-full transition-colors ' +
              (active
                ? 'bg-white text-neutral-900'
                : 'text-neutral-300 hover:text-white hover:bg-white/10')
            }
            aria-pressed={active}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default ProfileSwitcher

