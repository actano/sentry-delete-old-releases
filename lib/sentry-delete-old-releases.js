const https = require('https')
const http = require('http')
const url = require('url')

const { isReleaseOlderThanDays } = require('./is-release-older-than-days')

const {
  SENTRY_BASE_URL, SENTRY_TOKEN, SENTRY_ORGANIZATION, SENTRY_DAYS_TO_KEEP,
} = process.env
const parsedUrl = SENTRY_BASE_URL ? url.parse(SENTRY_BASE_URL) : {}
const SENTRY_HOST = parsedUrl.host
const REQUEST = parsedUrl.protocol === 'https:' ? https : http

function verifyEnvironmentVariables() {
  return !!SENTRY_BASE_URL
    && !!SENTRY_TOKEN
    && !!SENTRY_ORGANIZATION
    && !!SENTRY_HOST
    && !!SENTRY_DAYS_TO_KEEP
}

function getAllReleasesFromServer() {
  const options = {
    host: SENTRY_HOST,
    path: `/api/0/organizations/${SENTRY_ORGANIZATION}/releases/`,
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
    },
  }

  return new Promise((resolve, reject) => {
    REQUEST
      .get(options, (res) => {
        const { statusCode } = res
        const contentType = res.headers['content-type']

        let error
        if (statusCode !== 200) {
          error = new Error(`Request Failed. Status Code: ${statusCode}`)
        } else if (!/^application\/json/.test(contentType)) {
          error = new Error('Invalid content-type.\n' +
            `Expected application/json but received ${contentType}`)
        }

        if (error) {
          console.error(error.message) // eslint-disable-line no-console
          // consume response data to free up memory
          res.resume()
          reject(error)
        }

        let response = ''
        res.on('data', (data) => {
          response += data
        })
        res.on('end', () => resolve(JSON.parse(response)))
      })
      .on('error', (e) => {
        console.error(`Got error: ${e.message}`) // eslint-disable-line no-console
        reject(e)
      })
  })
}

function getReleaseVersion(release) {
  return release.version
}

function deleteReleaseVersionFromServer(releaseVersion) {
  const deleteOptions = {
    host: SENTRY_HOST,
    path: `/api/0/organizations/${SENTRY_ORGANIZATION}/releases/${releaseVersion}/`,
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
    },
    method: 'DELETE',
  }

  return new Promise((resolve, reject) => {
    REQUEST
      .request(deleteOptions, (res) => {
        const { statusCode } = res

        if (statusCode !== 200) {
          const error = new Error(`Request Failed. Status Code: ${statusCode}`)
          console.error(error.message) // eslint-disable-line no-console
          // consume response data to free up memory
          res.resume()
          reject(error)
        }
      })
      .on('error', (e) => {
        console.error(`Got error: ${e.message}`) // eslint-disable-line no-console
        reject(e)
      })
    resolve()
  })
}

async function deleteReleasesOlderThanDays(dryRun) {
  if (!verifyEnvironmentVariables()) {
    throw new Error('Environment variables not set correctly.')
  }

  const releases = await getAllReleasesFromServer()
  const releaseVersionsToDelete = releases
    .filter(release => isReleaseOlderThanDays(SENTRY_DAYS_TO_KEEP, release))
    .map(getReleaseVersion)

  console.log('Release versions to delete:')
  releaseVersionsToDelete.map(console.log)

  if (!dryRun) {
    const statusCode = await deleteReleaseVersionFromServer(releaseVersionsToDelete)
    console.log('Done. Statuscode: ', statusCode) // eslint-disable-line no-console
  } else {
    console.log('-----------------------------------------')
    console.log('Nothing deleted since this was a dry run.')
  }
}

module.exports = {
  deleteReleasesOlderThanDays,
}
