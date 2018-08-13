const { deleteReleasesOlderThanDays } = require('./lib/sentry-delete-old-releases')

const dryRun = !!process.argv[2]

deleteReleasesOlderThanDays(dryRun)
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
