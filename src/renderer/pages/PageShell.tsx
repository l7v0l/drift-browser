import { useEffect, type ReactNode } from 'react'

interface Props {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export function PageShell({ title, actions, children }: Props) {
  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2">{actions}</div>
      </header>
      {children}
    </main>
  )
}

export const btn =
  'rounded-full bg-surface px-4 py-1.5 transition-colors duration-150 hover:bg-surface-3 disabled:opacity-40'
export const btnAccent =
  'rounded-full bg-coral px-4 py-1.5 text-white transition-opacity duration-150 hover:opacity-90'
export const field =
  'rounded-full border border-line bg-surface px-4 py-2 outline-none transition-shadow duration-150 focus:ring-[3px] focus:ring-ring focus:border-accent'
