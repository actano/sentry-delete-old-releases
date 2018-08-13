const { expect } = require('chai')

const { isReleaseAssociatedWithProject } = require('../lib/is-release-associated-with-project')

const dummyRelease = {
  projects: [
    {
      name: 'Name of project A',
      slug: 'project-A',
    },
    {
      name: 'Name of project B',
      slug: 'project-B',
    },
  ],
}

describe('isReleaseAssociatedWithProject', () => {
  it('should return true', () => {
    const isAssociated = isReleaseAssociatedWithProject('project-B', dummyRelease)
    expect(isAssociated).to.equal(true)
  })

  it('should return false', () => {
    const isAssociated = isReleaseAssociatedWithProject('project-C', dummyRelease)
    expect(isAssociated).to.equal(false)
  })
})
