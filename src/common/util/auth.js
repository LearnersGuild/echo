export default function loginURL(options = {}) {
  const redirect = options.redirect ? `?redirect=${encodeURIComponent(options.redirect)}` : ''
  return `${process.env.IDM_BASE_URL}/sign-in${redirect}`
}
