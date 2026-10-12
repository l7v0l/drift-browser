import { Icon } from '@renderer/components/Icon'
import { useExtensions } from './store'

const call = window.drift.invoke

/** Installed extensions as toolbar buttons. Clicking opens the extension's popup. */
export function ExtensionsBar() {
  const items = useExtensions((s) => s.items)
  if (items.length === 0) return null

  return (
    <div className="flex items-center gap-0.5">
      {items.map((ext) => (
        <button
          key={ext.id}
          title={ext.name}
          aria-label={ext.name}
          onClick={() => void call('extensions:open', ext.id)}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface-3"
        >
          {ext.icon ? (
            <img src={ext.icon} alt="" width={20} height={20} className="rounded-sm" />
          ) : (
            <Icon name="puzzle" size={18} />
          )}
        </button>
      ))}
    </div>
  )
}
