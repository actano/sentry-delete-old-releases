const https = require('https')

// TODO: possible remove prepening 'https://' from host
const SENTRY_HOST = process.env('SENTRY_HOST')
const TOKEN = process.env('SENTRY_TOKEN')

const options = {
  host: SENTRY_HOST,
  path: '/api/0/organizations/actano/releases/',
  headers: {
    'Authorization': 'Bearer ' + TOKEN,
  }
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
        response += data;
      })
      res.on('end', () => {
        console.log(response);
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

export {
  getAllReleasesFromServer,
  // deleteReleasesFromServer,
  deleteOldReleases,
}
