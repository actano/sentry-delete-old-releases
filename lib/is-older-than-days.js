// This function doesn't respect time zones
function isReleaseOlderThanDays(days, release) {
  const now = Date.now()
  const releaseDate = new Date(release.dateCreated).getTime()
  const releaseDatePlusDays = releaseDate + (1000 * 60 * 60 * 24 * days)
  return releaseDatePlusDays < now
}

module.exports = {
  isReleaseOlderThanDays,
}
