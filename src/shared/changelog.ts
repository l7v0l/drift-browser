export interface ChangelogEntry {
  version: string
  date: string
  items: { ar: string; en: string }[]
}

/** Newest first. Shown in the "What's new" window after an update. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.3.0',
    date: '2026-10-13',
    items: [
      {
        ar: 'حاجب إعلانات ومتتبعات مدمج: درع في الشريط يعرض عدد المحجوب',
        en: 'Built-in ad and tracker blocker: a shield in the toolbar shows how many were blocked'
      },
      {
        ar: 'تشغيل أو إيقاف الحجب لكل موقع أو لكل المتصفح',
        en: 'Turn blocking on or off per site, or for the whole browser'
      }
    ]
  },
  {
    version: '0.2.0',
    date: '2026-10-13',
    items: [
      {
        ar: 'مدير كلمات المرور: يحفظ كلمات مرور المواقع ويملؤها تلقائياً',
        en: 'Password manager: saves site passwords and fills them in'
      },
      {
        ar: 'الإضافات: ثبّت إضافات من متجر Chrome وتظهر أيقوناتها في الشريط',
        en: 'Extensions: install from the Chrome Web Store, icons appear in the toolbar'
      },
      { ar: 'العرض المقسّم: صفحتان جنباً إلى جنب', en: 'Split view: two pages side by side' },
      {
        ar: 'قائمة التبويب: كتم الصوت، تكرار، تثبيت، إغلاق الباقي',
        en: 'Tab menu: mute, duplicate, pin, close others'
      },
      {
        ar: 'قائمة رئيسية جديدة مرتبة مع اختصاراتها',
        en: 'A new, organised main menu with shortcuts'
      },
      {
        ar: 'شاشة بداية جديدة، ونافذة «الجديد» بعد كل تحديث',
        en: 'A new startup screen and a changelog window after every update'
      }
    ]
  }
]

/** Compare dotted numeric versions: negative when a < b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** Entries newer than `lastSeen` and not newer than `current` (at most three, newest first). */
export function changelogSince(lastSeen: string, current: string): ChangelogEntry[] {
  return CHANGELOG.filter(
    (e) => compareVersions(e.version, lastSeen) > 0 && compareVersions(e.version, current) <= 0
  ).slice(0, 3)
}
