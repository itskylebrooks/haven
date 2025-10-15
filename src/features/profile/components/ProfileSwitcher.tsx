import type { TraceType } from '../../../lib/types'

type Props = {
  current: TraceType
  onChange: (kind: TraceType) => void
}

const ProfileSwitcher = ({ current, onChange }: Props) => {
  return (
    <div className="inline-flex rounded-full border border-[hsl(var(--accent-hsl)_/_0.25)] bg-black p-1 text-sm">
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
                ? 'bg-[var(--accent-color)] text-neutral-900'
                : 'text-neutral-300 hover:text-white hover:bg-[hsl(var(--accent-hsl)_/_0.12)]')
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
