import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { modalVariants } from '../lib/animation'

type EditProfileModalProps = {
  isOpen: boolean
  name: string
  bio?: string
  username: string
  onClose: () => void
  onSave: (name: string, bio: string, username: string) => void
}

const EditProfileModal = ({ isOpen, name, bio, username, onClose, onSave }: EditProfileModalProps) => {
  const [draftName, setDraftName] = useState(name)
  const [draftBio, setDraftBio] = useState(bio ?? '')
  const [draftUsername, setDraftUsername] = useState(username)
  const nameRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDraftName(name)
      setDraftBio(bio ?? '')
      setDraftUsername(username)
      setTimeout(() => nameRef.current?.focus(), 10)
    }
  }, [isOpen, name, bio, username])

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={modalVariants.backdrop.initial}
      animate={modalVariants.backdrop.animate}
      exit={modalVariants.backdrop.exit}
    >
      <motion.div
        className="w-[90%] max-w-md space-y-4 rounded-2xl border border-white/10 bg-black p-6 shadow-lg"
        initial={modalVariants.panel.initial}
        animate={modalVariants.panel.animate}
        exit={modalVariants.panel.exit}
      >
        <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Name</label>
            <input
              ref={nameRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-black px-3 py-2 text-neutral-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Username</label>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">@</span>
              <input
                value={draftUsername}
                onChange={(e) => setDraftUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                className="w-full rounded-md border border-white/10 bg-black px-3 py-2 text-neutral-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Bio</label>
            <textarea
              value={draftBio}
              onChange={(e) => setDraftBio(e.target.value)}
              className="h-24 w-full resize-none rounded-md border border-white/10 bg-black p-3 text-neutral-100"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-neutral-400 hover:text-white">Cancel</button>
          <button
            onClick={() => onSave(draftName.trim(), draftBio.trim(), draftUsername.trim())}
            className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white/80"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default EditProfileModal
