/**
 * Style manifest — entry point cho toàn bộ CSS (theo pattern của tu-vi-v1).
 * `main.tsx` chỉ cần `import '@/styles'`.
 *
 * Cấu trúc:
 *   base/       — token, reset, layout primitives
 *   utilities/  — class dùng chung (button, card, spinner…)
 *   components/ — style theo component/feature
 *   theme/      — body gradient + dark overrides (PHẢI cuối cascade)
 */

// === Base ===
import './base/variables.css'
import './base/reset.css'
import './base/layout.css'

// === Utilities ===
import './utilities/buttons.css'
import './utilities/cards.css'
import './utilities/misc.css'

// === Components ===
import './components/nav.css'
import './components/form.css'
import './components/footer.css'
import './components/home.css'
import './components/poems.css'

// === Theme (load cuối để đè mọi thứ ở trên) ===
import './theme/body-gradient.css'
import './theme/dark.css'
