// Lightweight gibberish check for name fields -- no dictionary or external
// API, just enough to reject obvious keyboard-mash/bot input ("asdkjaskjd",
// "11111", "xxxxxxxx") while staying permissive of real, unusual names.
// False positives are possible on some real short/consonant-heavy names;
// that tradeoff was a deliberate choice over the cost and false-positive
// rate of a real name-verification service.

const ALLOWED_CHARS = /^[\p{L}][\p{L}\s'-]*$/u
const HAS_VOWEL = /[aeiouAEIOUÀ-ÿ]/
const REPEATED_CHAR = /(.)\1{3,}/

// Adjacent-key runs on a QWERTY keyboard -- "qwerty", "asdfgh", "zxcvbn" and
// similar are extremely common test/bot filler that a plain vowel check
// doesn't catch (they often contain real vowels). Checked as substrings so
// "asdf" inside a longer string still trips it.
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

function isKeyboardRun(lower: string): boolean {
  return KEYBOARD_ROWS.some(
    (row) => row.includes(lower) || [...row].reverse().join('').includes(lower),
  )
}

export function isPlausibleName(value: string): boolean {
  const trimmed = value.trim()
  const letters = trimmed.replace(/[\s'-]/g, '')

  if (trimmed.length < 2 || trimmed.length > 50) return false
  if (!ALLOWED_CHARS.test(trimmed)) return false
  if (REPEATED_CHAR.test(trimmed)) return false
  if (letters.length >= 4 && isKeyboardRun(letters.toLowerCase())) return false
  // Vowel check only kicks in past 2 letters -- initials/short real names
  // ("Vy", "Ng") shouldn't get flagged just for being short.
  if (letters.length > 2 && !HAS_VOWEL.test(trimmed)) return false

  return true
}
