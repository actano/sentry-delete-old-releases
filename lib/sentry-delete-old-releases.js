const https = require('https')
const http = require('http')
const url = require('url')
const parseLinkHeader = require('parse-link-header')
const axios = require('axios')

const { isReleaseOlderThanDays } = require('./is-release-older-than-days')
const { isReleaseAssociatedWithProject } = require('./is-release-associated-with-project')

const {
  SENTRY_BASE_URL,
  SENTRY_TOKEN,
  SENTRY_ORGANIZATION,
  SENTRY_PROJECT,
  SENTRY_DAYS_TO_KEEP,
} = process.env
const parsedUrl = SENTRY_BASE_URL ? url.parse(SENTRY_BASE_URL) : {}
const SENTRY_HOST = parsedUrl.host
const REQUEST = parsedUrl.protocol === 'https:' ? https : http

function verifyEnvironmentVariables() {
  return !!SENTRY_BASE_URL
    && !!SENTRY_TOKEN
    && !!SENTRY_ORGANIZATION
    && !!SENTRY_PROJECT
    && !!SENTRY_HOST
    && !!SENTRY_DAYS_TO_KEEP
}

async function getReleaseFromServerPaginated(paginatedUrl) {
  const options = {
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
    },
  }
  console.log('fetching url', paginatedUrl)
  const res = await axios.get(paginatedUrl, options)
  const { data, status } = res
  const contentType = res.headers['content-type']

  if (status !== 200) {
    throw new Error(`Request Failed. Status Code: ${status}`)
  } else if (!/^application\/json/.test(contentType)) {
    throw new Error('Invalid content-type.\n' +
      `Expected application/json but received ${contentType}`)
  }

  const linkHeader = parseLinkHeader(res.headers.link)

  return {
    linkHeader,
    data,
  }
}

async function getAllReleasesFromServer(releaseEndpoint) {
  let morePagesAvailable = true
  let paginatedUrl = releaseEndpoint
  let allData = []

  while (morePagesAvailable) {
    // We have to fetch pages one by one
    // eslint-disable-next-line no-await-in-loop
    const { data, linkHeader } = await getReleaseFromServerPaginated(paginatedUrl)

    allData = allData.concat(data)

    // the parsedHeader contains strings only
    morePagesAvailable = (linkHeader.next.results === 'true')
    paginatedUrl = linkHeader.next.url
  }

  return allData
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

  const releaseEndpoint = `${SENTRY_BASE_URL}/api/0/organizations/${SENTRY_ORGANIZATION}/releases/`
  const releases = await getAllReleasesFromServer(releaseEndpoint)
  console.log('found', releases.length, 'releases') // eslint-disable-line no-console

  const releaseVersionsToDelete = releases
    .filter(release => isReleaseAssociatedWithProject(SENTRY_PROJECT, release))
    .filter(release => isReleaseOlderThanDays(SENTRY_DAYS_TO_KEEP, release))
    .map(getReleaseVersion)

  if (releaseVersionsToDelete.length === 0) {
    console.log(`No releases older than ${SENTRY_DAYS_TO_KEEP} days for project "${SENTRY_PROJECT}" found.`) // eslint-disable-line no-console
    return
  }
  console.log(`Found ${releaseVersionsToDelete.length} release versions to delete, specifically:`) // eslint-disable-line no-console
  releaseVersionsToDelete.map(version => console.log(version)) // eslint-disable-line no-console

  if (!dryRun) {
    const statusCode = await deleteReleaseVersionFromServer(releaseVersionsToDelete)
    console.log('Done. Statuscode: ', statusCode) // eslint-disable-line no-console
  } else {
    console.log('-----------------------------------------') // eslint-disable-line no-console
    console.log('Nothing deleted since this was a dry run.') // eslint-disable-line no-console
  }
}

module.exports = {
  deleteReleasesOlderThanDays,
}
