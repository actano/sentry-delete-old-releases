const https = require('https')
const url = require('url')

const { SENTRY_BASE_URL, SENTRY_TOKEN, SENTRY_ORGANIZATION } = process.env
const parsedUrl = url.parse(SENTRY_BASE_URL)
const SENTRY_HOST = parsedUrl.host
// TOOD: Handle both http and https

const options = {
  host: SENTRY_HOST,
  path: `/api/0/organizations/${SENTRY_ORGANIZATION}/releases/`,
  headers: {
    Authorization: `Bearer ${SENTRY_TOKEN}`,
  },
}

function getAllReleasesFromServer() {
  return https
    .get(options, (res) => {
      const { statusCode } = res
      const contentType = res.headers['content-type']

      let error
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
          `Status Code: ${statusCode}`)
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
          `Expected application/json but received ${contentType}`)
      }

      if (error) {
        console.error(error.message)
        // consume response data to free up memory
        res.resume()
        return
      }

      let response
      res.on('data', (data) => {
        response += data
      })
      res.on('end', () => {
        console.log(response)
        return response
      })
    })
    .on('error', (e) => {
      console.error(`Got error: ${e.message}`)
    })
}


function deleteOldReleases() {
  const releases = getAllReleasesFromServer()
  console.log(releases)
  // const releasesToDelete = filterOldReleases(releases, 85)
  // return yield* deleteReleasesFromServer(releasesToDelete)
}

module.exports = {
  getAllReleasesFromServer,
  // deleteReleasesFromServer,
  deleteOldReleases,
}
