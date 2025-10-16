import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Palette, ShieldCheck, MonitorSmartphone, Power, Trash2 } from 'lucide-react'
import { ACCENT_OPTIONS } from '../accents'

type ProfileDraft = {
  name: string
  bio: string
  username: string
  avatar: string | null
}

type SaveResult = { ok: true } | { ok: false; error: string }

type SettingsPageProps = {
  onBack: () => void
  profile: {
    name: string
    bio?: string
    username: string
    avatar?: string | null
  }
  savingProfile: boolean
  onSaveProfile: (payload: ProfileDraft) => Promise<SaveResult>
  accentId: string
  onChangeAccent: (id: string) => Promise<void> | void
  profileVisibility: 'public' | 'link'
  onChangeProfileVisibility: (value: 'public' | 'link') => Promise<void> | void
  resettingDemo: boolean
  onResetDemo: () => Promise<void>
  version: string
}

const fieldCard = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

const SettingsPage = ({
  onBack,
  profile,
  savingProfile,
  onSaveProfile,
  accentId,
  onChangeAccent,
  profileVisibility,
  onChangeProfileVisibility,
  resettingDemo,
  onResetDemo,
  version: _version,
}: SettingsPageProps) => {
  const [draft, setDraft] = useState<ProfileDraft>({
    name: profile.name,
    bio: profile.bio ?? '',
    username: profile.username,
    avatar: profile.avatar ?? null,
  })
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  })

  useEffect(() => {
    setDraft({
      name: profile.name,
      bio: profile.bio ?? '',
      username: profile.username,
      avatar: profile.avatar ?? null,
    })
    setStatus({ type: 'idle', message: '' })
  }, [profile.name, profile.bio, profile.username, profile.avatar])

  const trimmed = useMemo(() => {
    return {
      name: draft.name.trim(),
      bio: draft.bio.trim(),
      username: draft.username.trim().toLowerCase(),
      avatar: draft.avatar,
    }
  }, [draft])

  const hasProfileChanges = useMemo(() => {
    return (
      trimmed.name !== (profile.name ?? '') ||
      trimmed.bio !== (profile.bio ?? '') ||
      trimmed.username !== profile.username ||
      trimmed.avatar !== (profile.avatar ?? null)
    )
  }, [trimmed, profile.name, profile.bio, profile.username, profile.avatar])

  const canSaveProfile =
    hasProfileChanges && trimmed.name.length > 0 && trimmed.username.length > 0 && !savingProfile

  const handleSaveProfile = async () => {
    if (!canSaveProfile) return
    setStatus({ type: 'idle', message: '' })
    const result = await onSaveProfile(trimmed)
    if (result.ok) {
      setStatus({ type: 'success', message: 'Profile updated' })
    } else {
      setStatus({ type: 'error', message: result.error })
    }
  }

  const selectedAccent = ACCENT_OPTIONS.find((option) => option.id === accentId) ?? ACCENT_OPTIONS[0]

  const year = new Date().getFullYear()

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-10">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-2">
        <motion.h1
          className="text-3xl font-semibold text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          Settings
        </motion.h1>
        <motion.p
          className="text-sm text-neutral-400"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut', delay: 0.05 }}
        >
          Tune your presence, color, and safety preferences. Changes apply in real time.
        </motion.p>
      </div>

      <div className="space-y-8">
        <motion.section
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_45px_rgba(8,8,8,0.4)]"
          variants={fieldCard}
          initial="initial"
          animate="animate"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">Profile</h2>
              <p className="text-sm text-neutral-400">Update details others see across Haven.</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">Avatar</label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-900">
                  {draft.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.avatar} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">None</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-full border border-[hsl(var(--accent-hsl)_/_0.25)] px-4 py-2 text-sm text-neutral-950 bg-[var(--accent-color)] transition hover:brightness-110">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => {
                          setDraft((prev) => ({ ...prev, avatar: reader.result as string }))
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                    Upload
                  </label>
                  {draft.avatar && (
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, avatar: null }))}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:border-[var(--accent-color)] hover:bg-[hsl(var(--accent-hsl)_/_0.12)]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Square images look best. Leave empty for the default mask.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">Display name</label>
              <input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-neutral-100 transition focus-visible:border-[var(--accent-color)] focus-visible:shadow-[0_0_0_4px_hsl(var(--accent-hsl)_/_0.12)]"
                placeholder="How should Haven address you?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">Username</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-neutral-200 focus-within:border-[var(--accent-color)] focus-within:shadow-[0_0_0_4px_hsl(var(--accent-hsl)_/_0.12)]">
                <span className="text-neutral-500">@</span>
                <input
                  value={draft.username}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      username: event.target.value.replace(/\s+/g, '').toLowerCase(),
                    }))
                  }
                  className="flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                  placeholder="username"
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500">Usernames are unique and lowercase. Links update instantly.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-300">Bio</label>
              <textarea
                value={draft.bio}
                onChange={(event) => setDraft((prev) => ({ ...prev, bio: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-neutral-100 transition focus-visible:border-[var(--accent-color)] focus-visible:shadow-[0_0_0_4px_hsl(var(--accent-hsl)_/_0.12)]"
                placeholder="Share a sentence or two about what you’re cultivating."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <AnimatePresence>
              {status.type !== 'idle' && (
                <motion.span
                  key={status.type}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className={`text-sm ${
                    status.type === 'success' ? 'text-[var(--accent-color)]' : 'text-red-400'
                  }`}
                >
                  {status.message}
                </motion.span>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    name: profile.name,
                    bio: profile.bio ?? '',
                    username: profile.username,
                    avatar: profile.avatar ?? null,
                  })
                }
                disabled={!hasProfileChanges || savingProfile}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-300 transition enabled:hover:border-white/20 enabled:hover:text-white disabled:opacity-40"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!canSaveProfile}
                className="rounded-full bg-[var(--accent-color)] px-5 py-2 text-sm font-medium text-neutral-900 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[hsl(var(--accent-hsl)_/_0.35)] disabled:text-neutral-700"
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_45px_rgba(8,8,8,0.35)]"
          variants={fieldCard}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.04 }}
        >
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-white/60" />
            <div>
              <h2 className="text-lg font-medium text-white">Accent</h2>
              <p className="text-sm text-neutral-400">Pick the hue for focus rings and notifications.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {ACCENT_OPTIONS.map((option) => {
              const isActive = option.id === selectedAccent.id
              return (
                <button
                  key={option.id}
                  onClick={() => onChangeAccent(option.id)}
                  type="button"
                  className={`relative flex h-20 flex-col items-start justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-[var(--accent-color)] bg-[hsl(var(--accent-hsl)_/_0.12)] shadow-[0_12px_30px_rgba(0,0,0,0.35)]'
                      : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-sm font-medium text-white">{option.label}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">{option.hint}</span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-4 top-4 h-5 w-5 rounded-full border border-white/15"
                    style={{ background: `hsl(${option.hsl})` }}
                  />
                </button>
              )
            })}
          </div>
        </motion.section>

        <motion.section
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_45px_rgba(8,8,8,0.35)] space-y-5"
          variants={fieldCard}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.08 }}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-white/60" />
            <div>
              <h2 className="text-lg font-medium text-white">Visibility</h2>
              <p className="text-sm text-neutral-400">Decide who can see your profile.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <VisibilityToggle
              label="Visible to everyone"
              description="Your profile is discoverable to friends and circles."
              checked={profileVisibility === 'public'}
              onSelect={() => onChangeProfileVisibility('public')}
            />
            <VisibilityToggle
              label="Only with a direct link"
              description="Keep things quiet. Only people with your profile link can view it."
              checked={profileVisibility === 'link'}
              onSelect={() => onChangeProfileVisibility('link')}
            />
          </div>
        </motion.section>

        <motion.section
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_45px_rgba(8,8,8,0.35)] space-y-4"
          variants={fieldCard}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.12 }}
        >
          <div className="flex items-center gap-3">
            <MonitorSmartphone className="h-5 w-5 text-white/60" />
            <div>
              <h2 className="text-lg font-medium text-white">Devices</h2>
              <p className="text-sm text-neutral-400">Stay signed in on studio, desktop, and mobile.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-neutral-400">
            Device timeline is brewing. We’ll let you review active sessions soon.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-400 opacity-60"
            >
              <Power className="h-4 w-4" />
              Log out everywhere
            </button>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-red-400 opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          </div>
        </motion.section>

        <motion.section
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_45px_rgba(8,8,8,0.35)] space-y-4"
          variants={fieldCard}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.16 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">Reset demo data</h2>
              <p className="text-sm text-neutral-400">
                Clear the local story and reseed Haven with fresh voices.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!resettingDemo) void onResetDemo()
              }}
              className="rounded-full bg-[var(--accent-color)] px-5 py-2 text-sm font-medium text-black transition hover:brightness-110"
              disabled={resettingDemo}
            >
              {resettingDemo ? 'Resetting…' : 'Reset now'}
            </button>
          </div>
        </motion.section>
      </div>

      <motion.footer
        className="pt-6 text-xs text-neutral-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <span>
            © {year}{' '}
            <a href="https://itskylebrooks.vercel.app" target="_blank" rel="noreferrer noopener" className="hover:text-white">
              Kyle Brooks
            </a>
            . All rights reserved.
          </span>
          <nav className="flex items-center gap-4 text-neutral-400">
            <a href="https://itskylebrooks.vercel.app/imprint" className="hover:text-white" target="_blank" rel="noreferrer noopener">Imprint</a>
            <a href="https://itskylebrooks.vercel.app/privacy" className="hover:text-white" target="_blank" rel="noreferrer noopener">Privacy Policy</a>
            <a href="https://itskylebrooks.vercel.app/license" className="hover:text-white" target="_blank" rel="noreferrer noopener">License</a>
          </nav>
        </div>
      </motion.footer>
    </div>
  )
}

type VisibilityToggleProps = {
  label: string
  description: string
  checked: boolean
  onSelect: () => void
}

const VisibilityToggle = ({ label, description, checked, onSelect }: VisibilityToggleProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
      checked
        ? 'border-[var(--accent-color)] bg-[hsl(var(--accent-hsl)_/_0.12)] text-white'
        : 'border-white/10 bg-black/40 text-neutral-300 hover:border-white/20 hover:bg-white/[0.05]'
    }`}
  >
    <div>
      <div className="text-sm font-medium">{label}</div>
      <p className="mt-1 text-xs text-neutral-400">{description}</p>
    </div>
    <span
      className={`ml-4 flex h-5 w-5 items-center justify-center rounded-full border ${
        checked ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' : 'border-white/15'
      }`}
    >
      {checked && <span className="h-2 w-2 rounded-full bg-black" />}
    </span>
  </button>
)

export default SettingsPage
