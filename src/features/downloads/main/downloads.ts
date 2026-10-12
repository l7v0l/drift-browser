import { existsSync } from 'node:fs'
import { join, parse } from 'node:path'
import { app, shell, type DownloadItem, type Session } from 'electron'
import type { DownloadInfo } from '@shared/types'
import { store } from '../../../main/store'

const NOTIFY_INTERVAL_MS = 250
const MAX_SAVED = 200

type Listener = (items: DownloadInfo[]) => void

function uniquePath(dir: string, filename: string): string {
  const { name, ext } = parse(filename)
  let candidate = join(dir, filename)
  for (let n = 1; existsSync(candidate); n++) candidate = join(dir, `${name} (${n})${ext}`)
  return candidate
}

/** Tracks downloads for one session. Private sessions pass persist: false and keep nothing on disk. */
export class DownloadManager {
  private items: DownloadInfo[]
  private live = new Map<number, DownloadItem>()
  private listeners = new Set<Listener>()
  private seq: number
  private lastNotify = 0
  private pending: NodeJS.Timeout | null = null

  constructor(
    session: Session,
    private readonly persist: boolean
  ) {
    this.items = persist ? store.get('downloads') : []
    this.seq = this.items.reduce((max, d) => Math.max(max, d.id), 0)
    session.on('will-download', (_event, item) => this.track(item))
  }

  list = (): DownloadInfo[] => this.items

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  open(id: number): void {
    const d = this.items.find((i) => i.id === id)
    if (d?.state === 'completed' && existsSync(d.savePath)) void shell.openPath(d.savePath)
  }

  show(id: number): void {
    const d = this.items.find((i) => i.id === id)
    if (d) shell.showItemInFolder(d.savePath)
  }

  cancel(id: number): void {
    this.live.get(id)?.cancel()
  }

  /** Remove finished entries; running downloads stay. */
  clear(): void {
    this.items = this.items.filter((i) => i.state === 'progressing')
    this.save()
    this.notify(true)
  }

  private track(item: DownloadItem): void {
    const savePath = uniquePath(app.getPath('downloads'), item.getFilename())
    item.setSavePath(savePath)
    const info: DownloadInfo = {
      id: ++this.seq,
      filename: parse(savePath).base,
      url: item.getURL(),
      savePath,
      received: 0,
      total: item.getTotalBytes(),
      state: 'progressing',
      paused: false,
      startedAt: Date.now()
    }
    this.items.unshift(info)
    this.live.set(info.id, item)

    item.on('updated', (_e, state) => {
      info.received = item.getReceivedBytes()
      info.total = item.getTotalBytes()
      info.paused = item.isPaused()
      if (state === 'interrupted') info.state = 'interrupted'
      this.notify()
    })
    item.once('done', (_e, state) => {
      info.received = item.getReceivedBytes()
      info.state =
        state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted'
      this.live.delete(info.id)
      this.save()
      this.notify(true)
    })
    this.notify(true)
  }

  private save(): void {
    if (this.persist) store.set('downloads', this.items.slice(0, MAX_SAVED))
  }

  /** Progress events are frequent; throttle UI pushes unless forced. */
  private notify(force = false): void {
    const now = Date.now()
    if (!force && now - this.lastNotify < NOTIFY_INTERVAL_MS) {
      this.pending ??= setTimeout(() => {
        this.pending = null
        this.notify(true)
      }, NOTIFY_INTERVAL_MS)
      return
    }
    this.lastNotify = now
    for (const l of this.listeners) l([...this.items])
  }
}
