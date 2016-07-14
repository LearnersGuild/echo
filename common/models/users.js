export function getProfileUrlForUser(user) {
  const githubPhotos = (((user || {}).authProviderProfiles || {}).githubOAuth2 || {}).photos
  return githubPhotos && githubPhotos.length ? githubPhotos[0].value : null
}
