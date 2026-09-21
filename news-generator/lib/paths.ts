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
  'news',
  'news-article',
)

export const newsPagesDirectory = path.join(
  pageDirectory,
  'news',
  'news-page',
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
  'articles.json',
)