import {
  AsYouTypeFormatter,
  PhoneNumberFormat,
  PhoneNumberUtil
} from 'google-libphonenumber'

const phoneUtil = PhoneNumberUtil.getInstance()

export function formatPartialPhoneNumber(str, countryCode = 'US') {
  if (!str) {
    return ''
  }
  const formatter = new AsYouTypeFormatter(countryCode)
  formatter.clear()
  let formatted
  str.toString().split('').forEach(d => {
    formatted = formatter.inputDigit(d)
  })
  return formatted
}

export function stripNonE164Chars(str) {
  if (!str) {
    return ''
  }
  return str.toString().replace(/[^+\d]/g, '')
}

export function phoneNumberAsE164(str, countryCode = 'US') {
  const phoneDigits = stripNonE164Chars(str)
  if (phoneDigits.length < 10) {
    throw new Error('Phone numbers must be at least 10 digits.')
  }
  const phoneNumber = phoneUtil.parse(phoneDigits, countryCode)
  return phoneUtil.format(phoneNumber, PhoneNumberFormat.E164)
}
