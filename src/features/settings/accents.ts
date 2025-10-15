export type AccentOption = {
  id: string
  label: string
  hsl: string
  hint: string
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'emerald', label: 'Verdant', hsl: '152 76% 46%', hint: 'gentle green' },
  { id: 'amber', label: 'Dawn', hsl: '34 98% 60%', hint: 'warm amber' },
  { id: 'azure', label: 'Harbor', hsl: '204 86% 53%', hint: 'calm blue' },
  { id: 'violet', label: 'Lumen', hsl: '266 79% 68%', hint: 'soft violet' },
  { id: 'magenta', label: 'Pulse', hsl: '321 81% 71%', hint: 'bright magenta' },
]

export const findAccent = (id: string): AccentOption | undefined => ACCENT_OPTIONS.find((option) => option.id === id)
