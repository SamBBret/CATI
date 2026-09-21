import fs from 'node:fs/promises'

import {
  sidebarPath,
} from '../lib/paths'

import {
  loadTemplate,
} from '../lib/templates'

import {
  articleUrl,
  escapeHtml,
  formatDate,
} from '../lib/utils'

import {
  SIDEBAR_ARTICLES_COUNT,
} from '../lib/config'

export async function generateSidebar(
  articles: any[],
) {
  const sidebarTemplate =
    await loadTemplate(
      'sidebar.html',
    )

  const itemTemplate =
    await loadTemplate(
      'sidebar-item.html',
    )

  const sidebarArticles =
    articles
      .slice(0, SIDEBAR_ARTICLES_COUNT)
      .map((article) => {
        return itemTemplate
          .replaceAll(
            '{{URL}}',
            articleUrl(
              article.slug,
            ),
          )
          .replaceAll(
            '{{TITLE}}',
            escapeHtml(
              article.title,
            ),
          )
          .replaceAll(
            '{{DATE}}',
            formatDate(
              article.publishedAt,
            ),
          )
      })
      .join('\n')

  const html =
    sidebarTemplate
      .replaceAll(
        '{{ARTICLES}}',
        sidebarArticles,
      )

  await fs.mkdir(
    require('node:path').dirname(
      sidebarPath,
    ),
    {
      recursive: true,
    },
  )

  await fs.writeFile(
    sidebarPath,
    html,
    'utf8',
  )

  console.log(
    `Generated news sidebar: ${sidebarPath}`,
  )
}