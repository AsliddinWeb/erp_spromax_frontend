// Global date utility — barcha vaqtlar Asia/Tashkent (UTC+5) da ko'rsatiladi

const TZ = 'Asia/Tashkent'

/**
 * Sana + vaqtni formatlash: "27.02.2026 18:06"
 */
export function formatDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('ru-RU', {
    timeZone: TZ,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Faqat sana: "27.02.2026"
 */
export function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('ru-RU', {
    timeZone: TZ,
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

/**
 * Faqat vaqt: "18:06"
 */
export function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString('ru-RU', {
    timeZone: TZ,
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Bugungi sana (Tashkent) → "2026-02-27"  (input[type=date] uchun)
 */
export function todayISO() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TZ })
}

/**
 * Hozirgi vaqt (Tashkent) → "2026-02-27T18:06"  (input[type=datetime-local] uchun)
 */
export function nowLocalISO() {
  const d = new Date()
  const date = d.toLocaleDateString('sv-SE', { timeZone: TZ })
  const time = d.toLocaleTimeString('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
  return `${date}T${time}`
}

/**
 * Oy boshi → "2026-02-01"
 */
export function startOfMonthISO() {
  const d = new Date()
  const year = d.toLocaleDateString('sv-SE', { timeZone: TZ }).slice(0, 4)
  const month = d.toLocaleDateString('sv-SE', { timeZone: TZ }).slice(5, 7)
  return `${year}-${month}-01`
}

/**
 * Yil boshi → "2026-01-01"
 */
export function startOfYearISO() {
  const year = new Date().toLocaleDateString('sv-SE', { timeZone: TZ }).slice(0, 4)
  return `${year}-01-01`
}