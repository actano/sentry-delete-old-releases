const { deleteReleasesOlderThanDays } = require('./lib/sentry-delete-old-releases')

deleteReleasesOlderThanDays()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
