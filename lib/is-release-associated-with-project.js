function isReleaseAssociatedWithProject(projectSlug, release) {
  const { projects } = release
  return !!projects.find(project => project.slug === projectSlug)
}

module.exports = {
  isReleaseAssociatedWithProject,
}
