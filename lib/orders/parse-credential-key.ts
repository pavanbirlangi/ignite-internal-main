// Some products deliver an account login instead of a license key. The admin uploads those as a
// single "key" in the form `email:::password`. `:::` was chosen because an email address can never
// contain a colon, and real license keys don't use it. Split on the FIRST occurrence only, so a
// password may itself contain colons (even `:::`).
export const CREDENTIAL_KEY_SEPARATOR = ':::'

export interface CredentialKey {
  email: string
  password: string
}

export function parseCredentialKey(key: string): CredentialKey | null {
  const separatorIndex = key.indexOf(CREDENTIAL_KEY_SEPARATOR)
  if (separatorIndex !== -1) {
    const email = key.slice(0, separatorIndex).trim()
    const password = key.slice(separatorIndex + CREDENTIAL_KEY_SEPARATOR.length)
    if (email && password) return { email, password }
    return null
  }

  // Legacy Shopify-era format: "<email>name@mail.com<password>xyz".
  const emailTagStart = key.indexOf('<email>')
  const passwordTagStart = key.indexOf('<password>')
  if (emailTagStart === -1 || passwordTagStart === -1) return null

  const email = key
    .substring(emailTagStart + '<email>'.length, passwordTagStart)
    .trim()
  const password = key.substring(passwordTagStart + '<password>'.length).trim()
  if (!email && !password) return null
  return { email, password }
}
