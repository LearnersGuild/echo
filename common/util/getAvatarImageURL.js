export default function getAvatarImageURL(user, size = 50) {
  if (!user.handle) {
    throw new Error('Cannot get avatar URL -- user has no handle')
  }
  return `https://github.com/${user.handle}.png?s=${size}`
}
