import type { MemoryInfo } from '@shared/types'

export interface ProcessMetric {
  pid: number
  /** Working set in KB, as reported by Electron's app.getAppMetrics(). */
  workingSetKB: number
}

export interface TabProcess {
  id: number
  title: string
  url: string
  pid: number | null
}

const toMB = (kb: number): number => Math.round((kb / 1024) * 10) / 10

/** Tabs sharing one renderer process report that process's memory, so per-tab numbers may overlap. */
export function buildMemoryInfo(metrics: ProcessMetric[], tabs: TabProcess[]): MemoryInfo {
  const byPid = new Map(metrics.map((m) => [m.pid, m.workingSetKB]))
  return {
    totalMB: toMB(metrics.reduce((sum, m) => sum + m.workingSetKB, 0)),
    tabs: tabs.map((t) => {
      const kb = t.pid === null ? undefined : byPid.get(t.pid)
      return {
        id: t.id,
        title: t.title,
        url: t.url,
        memoryMB: kb === undefined ? null : toMB(kb),
        discarded: t.pid === null
      }
    })
  }
}
