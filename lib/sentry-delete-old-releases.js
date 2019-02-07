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

function verifyEnvironmentVariables() {
  return !!SENTRY_BASE_URL
    && !!SENTRY_TOKEN
    && !!SENTRY_ORGANIZATION
    && !!SENTRY_PROJECT
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

async function getAllReleasesFromServer() {
  let morePagesAvailable = true
  let paginatedUrl = `${SENTRY_BASE_URL}/api/0/organizations/${SENTRY_ORGANIZATION}/releases/`
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

async function deleteReleaseVersionFromServer(releaseVersion) {
  const endpoint = `${SENTRY_BASE_URL}/api/0/organizations/${SENTRY_ORGANIZATION}/releases/${releaseVersion}/`

  const options = {
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
    },
  }

  console.log(`Deleting ${releaseVersion} ...`)
  await axios.delete(endpoint, options)
  console.log('Done.')
}

async function deleteReleasesOlderThanDays(dryRun) {
  if (!verifyEnvironmentVariables()) {
    throw new Error('Environment variables not set correctly.')
  }

  const releases = await getAllReleasesFromServer()
  console.log('found', releases.length, 'releases') // eslint-disable-line no-console

  const releaseVersionsToDelete = releases
    .filter(release => isReleaseAssociatedWithProject(SENTRY_PROJECT, release))
    .filter(release => isReleaseOlderThanDays(SENTRY_DAYS_TO_KEEP, release))
    .map(getReleaseVersion)

  if (releaseVersionsToDelete.length === 0) {
    console.log(`No releases older than ${SENTRY_DAYS_TO_KEEP} days for project "${SENTRY_PROJECT}" found.`) // eslint-disable-line no-console
    return
  }
  console.log(`Found ${releaseVersionsToDelete.length} release versions to delete.`) // eslint-disable-line no-console

  if (!dryRun) {
    const errors = []
    for (let i = 0; i < releaseVersionsToDelete.length; i += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await deleteReleaseVersionFromServer(releaseVersionsToDelete[i])
      } catch (error) {
        console.log('Error.')
        errors.push(error)
      }
    }
    console.log('-----------------------------------------') // eslint-disable-line no-console
    const deletedReleases = releaseVersionsToDelete.length - errors.length
    console.log(`Deleted ${deletedReleases} releases. ${errors.length} releases were not deleted because the Sentry server rejected the request. Reasons:`)
    errors.forEach((error) => {
      console.log(`* ${error.response.data.detail}`)
    })
  } else {
    console.log('-----------------------------------------') // eslint-disable-line no-console
    console.log('Nothing deleted since this was a dry run.') // eslint-disable-line no-console
  }
}

module.exports = {
  deleteReleasesOlderThanDays,
}
