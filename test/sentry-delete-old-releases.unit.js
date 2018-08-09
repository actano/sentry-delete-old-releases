const { expect } = require('chai')
const sinon = require('sinon')

const { isReleaseOlderThanDays } = require('../lib/is-older-than-days')

const dummyRelease = {
  dateCreated: '2018-08-03T23:20:09.636Z',
  lastEvent: '2018-08-03T23:20:09.849Z',
  firstEvent: '2018-08-03T23:20:09.849Z',
}

describe('releaseOlderThan', () => {
  let clock

  beforeEach('clock', () => {
    clock = sinon.useFakeTimers({ now: Date.parse('2018-08-09T19:10:09.636Z') })
  })

  afterEach('clock', () => {
    clock.restore()
  })

  it('should return true', () => {
    const isOlder = isReleaseOlderThanDays(4, dummyRelease)
    expect(isOlder).to.equal(true)
  })

  it('should return false', () => {
    const isOlder = isReleaseOlderThanDays(6, dummyRelease)
    expect(isOlder).to.equal(false)
  })
})
