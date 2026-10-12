<div align="center" dir="rtl">

<img src="assets/logo-wordmark.svg" alt="Drift" height="96" />

**تصفّح بخفة.**

متصفح سطح مكتب صغير وسريع، يدعم العربية (RTL) والإنجليزية من الأساس.

[![CI](https://img.shields.io/github/actions/workflow/status/l7v0l/drift-browser/ci.yml?branch=main&label=CI)](https://github.com/l7v0l/drift-browser/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/l7v0l/drift-browser?include_prereleases)](https://github.com/l7v0l/drift-browser/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-16656B.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-Windows-0A3F43)
![Electron](https://img.shields.io/badge/Electron-44-F4BE4E)

[English](README.md) · العربية

</div>

<p align="center">
  <img src="docs/screenshots/newtab-ar.png" alt="صفحة التبويب الجديد" width="49%" />
  <img src="docs/screenshots/newtab-en-dark.png" alt="الوضع الداكن" width="49%" />
</p>

<div dir="rtl">

## المميزات

- **التبويبات**: فتح وإغلاق وتبديل، سحب لتغيير الترتيب، تثبيت، أيقونة كل موقع، وإعادة فتح آخر تبويب مغلق (`Ctrl+Shift+T`)
- **شريط العنوان**: رجوع وتقدّم وتحديث وإيقاف والرئيسية، وقفل HTTPS. الكلام العادي يبحث عنه بمحرك البحث المختار (Google أو Bing أو DuckDuckGo) مع اقتراحات من السجل والمفضلة
- **صفحة البداية**: الساعة، التاريخ الهجري والميلادي، مربع بحث كبير، واختصارات قابلة للتعديل
- **المفضلة والسجل والتنزيلات**: نجمة وشريط مفضلة، سجل فيه بحث ومسح حسب المدة، ولوحة تنزيلات بشريط تقدّم
- **النوافذ الخاصة**: لا يُحفظ شيء، لا سجل ولا كوكيز ولا جلسة
- **البحث في الصفحة** (`Ctrl+F`) و**التكبير والتصغير** (`Ctrl +` و`-` و`0`)
- **استعادة الجلسة**: ترجع تبويباتك عند فتح Drift
- **خفيف على الذاكرة**: تعليق التبويبات الخاملة تلقائياً، وتحميل كسول، وصفحة `drift://about` تعرض استهلاك الذاكرة لكل تبويب
- **مظهر فاتح وداكن وتلقائي**، وواجهة عربية (الافتراضي، RTL) وإنجليزية
- **تسجيل دخول اختياري** بحساب Google أو Microsoft: يظهر بريدك جاهزاً في صفحات تسجيل الدخول الخاصة بهما (راجع [docs/SIGN_IN.md](docs/SIGN_IN.md))
- **صفحات داخلية**: `drift://settings` و`drift://history` و`drift://bookmarks` و`drift://downloads` و`drift://about`

<p align="center">
  <img src="docs/screenshots/page-ar.png" alt="تصفح صفحة مع شريط المفضلة" width="49%" />
  <img src="docs/screenshots/about-ar.png" alt="صفحة حول واستهلاك الذاكرة" width="49%" />
</p>

### اختصارات لوحة المفاتيح

| الاختصار | الوظيفة |
| --- | --- |
| `Ctrl+T` / `Ctrl+W` | تبويب جديد / إغلاق التبويب |
| `Ctrl+Shift+T` | إعادة فتح التبويب المغلق |
| `Ctrl+L` | التركيز على شريط العنوان |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | التبويب التالي / السابق |
| `Ctrl+F` | البحث في الصفحة |
| `Ctrl +` / `Ctrl -` / `Ctrl 0` | تكبير / تصغير / إعادة |
| `Ctrl+N` / `Ctrl+Shift+N` | نافذة جديدة / نافذة خاصة |
| `F5` / `F11` | تحديث / ملء الشاشة |

## التثبيت

حمّل آخر نسخة من صفحة [**Releases**](https://github.com/l7v0l/drift-browser/releases):

- `Drift-Setup-x.y.z.exe`: ملف التثبيت، ويتحدث تلقائياً من GitHub Releases
- `Drift-x.y.z-portable.exe`: نسخة محمولة بدون تثبيت وبدون تحديث تلقائي

> النسخ غير موقّعة رقمياً حالياً، فقد يعرض Windows SmartScreen تحذيراً أول مرة. اختر **More info ثم Run anyway**.

## التطوير

يحتاج Node.js 22 أو أحدث.

```bash
npm install
npm run dev        # تشغيل بوضع التطوير
npm run typecheck  # فحص TypeScript
npm run lint       # ESLint
npm test           # اختبارات Vitest
npm run dist       # بناء ملف التثبيت والنسخة المحمولة في ./release
```

الكود منظم حسب الميزة، راجع [ARCHITECTURE.md](ARCHITECTURE.md). الخطة القادمة في [ROADMAP.md](ROADMAP.md). المساهمات مرحّب بها، راجع [CONTRIBUTING.md](CONTRIBUTING.md).

## التقنيات

Electron وReact وTypeScript وVite (electron-vite) وTailwind CSS وZustand وelectron-store وelectron-updater وVitest. المواقع تُعرض في `WebContentsView` مع `contextIsolation` و`sandbox` وبدون `nodeIntegration`، وكل التواصل بين الأجزاء عبر IPC محدد ومكتوب الأنواع.

## الترخيص

[MIT](LICENSE)

</div>
