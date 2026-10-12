import { describe, expect, it } from 'vitest'
import { buildMemoryInfo } from '@features/about/main/memory'
import { pickIdleTabs } from '@features/tabs/main/discard'
import { nextZoom } from '@features/tabs/main/zoom'

const MIN = 60_000
const tab = (id: number, lastActive: number, over: object = {}) => ({
  id,
  lastActive,
  loaded: true,
  busy: false,
  ...over
})

describe('pickIdleTabs', () => {
  const now = 100 * MIN
  it('picks only idle, loaded, non-busy background tabs', () => {
    const tabs = [
      tab(1, now - 40 * MIN),
      tab(2, now - 40 * MIN, { busy: true }),
      tab(3, now - 40 * MIN, { loaded: false }),
      tab(4, now - 5 * MIN),
      tab(5, now - 90 * MIN)
    ]
    expect(pickIdleTabs(tabs, 5, now, 30 * MIN)).toEqual([1])
  })
})

describe('nextZoom', () => {
  it('steps along the ladder and clamps', () => {
    expect(nextZoom(1, 'in')).toBe(1.1)
    expect(nextZoom(1, 'out')).toBe(0.9)
    expect(nextZoom(1.25, 'reset')).toBe(1)
    expect(nextZoom(5, 'in')).toBe(5)
    expect(nextZoom(0.25, 'out')).toBe(0.25)
  })
})

describe('buildMemoryInfo', () => {
  it('sums all processes and maps tabs to their process', () => {
    const info = buildMemoryInfo(
      [
        { pid: 1, workingSetKB: 2048 },
        { pid: 2, workingSetKB: 10240 }
      ],
      [
        { id: 1, title: 'A', url: 'u', pid: 2 },
        { id: 2, title: 'B', url: 'v', pid: null }
      ]
    )
    expect(info.totalMB).toBe(12)
    expect(info.tabs[0]).toMatchObject({ memoryMB: 10, discarded: false })
    expect(info.tabs[1]).toMatchObject({ memoryMB: null, discarded: true })
  })
})
