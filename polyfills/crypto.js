import { pbkdf2 } from '@noble/hashes/pbkdf2'
import { sha512 } from '@noble/hashes/sha512'
import { randomBytes } from '@noble/hashes/utils'

export const pbkdf2Sync = (password, salt, c, dkLen) => {
  return Buffer.from(pbkdf2(sha512, password, salt, { c, dkLen }))
}

export const randomFillSync = (buffer) => {
  const randomValues = randomBytes(buffer.length)
  buffer.set(randomValues)
  return buffer
}

export default { randomFillSync }
