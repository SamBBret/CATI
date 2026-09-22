import path from 'node:path'

export const websiteDirectory = path.resolve(
  process.cwd(),
  '..',
  'Website',
)

export const pageDirectory = path.join(
  websiteDirectory,
  'page',
)

export const newsDirectory = path.join(
  pageDirectory,
  'news'
)


export const articleDirectory = path.join(
  newsDirectory,
  'news-article',
)

export const cardDirectory = path.join(
  newsDirectory,
  'news-cards',
)

export const sidebarPath = path.join(
  pageDirectory,
  'snipets',
  'newssidebar.html',
)

export const templatesDirectory = path.join(
  process.cwd(),
  'templates',
)

export const stateDirectory = path.join(
  process.cwd(),
  'state',
)

export const statePath = path.join(
  stateDirectory,
  'state.json',
)