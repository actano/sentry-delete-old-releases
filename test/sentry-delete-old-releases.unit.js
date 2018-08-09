const sinon = require('sinon')
const { expect } = require('chai')
const https = require('https')

const { deleteOldReleases, getAllReleasesFromServer } = require('../lib/sentry-delete-old-releases')

const dummyReleases = [
  {
    dateReleased: null,
    newGroups: 0,
    url: null,
    ref: '6ba09a7c53235ee8a8fa5ee4c1ca8ca886e7fdbb',
    lastDeploy: null,
    deployCount: null,
    dateCreated: '2018-08-03T23:20:19.512Z',
    lastEvent: null,
    version: '2.0rc2',
    firstEvent: null,
    lastCommit: null,
    shortVersion: '2.0rc2',
    authors: [],
    owner: null,
    commitCount: null,
    data: {},
    projects: [
      {
        name: 'Pump Station',
        slug: 'pump-station',
      },
    ],
  },
  {
    dateReleased: null,
    newGroups: 0,
    url: null,
    ref: null,
    lastDeploy: null,
    deployCount: null,
    dateCreated: '2018-08-03T23:20:09.636Z',
    lastEvent: '2018-08-03T23:20:09.849Z',
    version: '45a19e9fc1f1e78108eeee6c42ce5e0e5aa31422',
    firstEvent: '2018-08-03T23:20:09.849Z',
    lastCommit: null,
    shortVersion: '45a19e9',
    authors: [],
    owner: null,
    commitCount: null,
    data: {},
    projects: [
      {
        name: 'Prime Mover',
        slug: 'prime-mover',
      },
    ],
  },
  {
    dateReleased: null,
    newGroups: 0,
    url: null,
    ref: null,
    lastDeploy: null,
    deployCount: null,
    dateCreated: '2018-08-03T23:20:05.526Z',
    lastEvent: '2018-08-03T23:20:05.931Z',
    version: '33b3446b581282e7848ea5a3a9aa3939edf2f8d6',
    firstEvent: '2018-08-03T23:20:05.931Z',
    lastCommit: null,
    shortVersion: '33b3446',
    authors: [],
    owner: null,
    commitCount: null,
    data: {},
    projects: [
      {
        name: 'Pump Station',
        slug: 'pump-station',
      },
    ],
  },
]

describe('getAllReleasesFromServer', () => {
  let getAllReleasesStub
  beforeEach(() => {
    getAllReleasesStub = sinon.stub(https, 'request').returns(dummyReleases)
  })

  afterEach(() => {
    https.request.restore()
  })
  it('should get all releases', () => {
    const releases = getAllReleasesFromServer()
    expect(releases).to.deep.equal(dummyReleases)
  })
})
