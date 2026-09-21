import fs from 'node:fs/promises'
import path from 'node:path'

import {
  articleUrl,
  escapeHtml,
  formatDate,
  imageUrl,
  renderPortableText,
} from '../lib/utils'

import {
  newsDirectory,
} from '../lib/paths'

import {
  loadTemplate,
} from '../lib/templates'

import {
  ARTICLES_PER_PAGE,
  SIDEBAR_ARTICLES_COUNT,
} from '../lib/config'

export interface ArticleGenerationResult {
  changed: boolean
  affectedPages: number[]
  sidebarAffected: boolean
}

export async function generateArticle(
  slug: string,
  articles: any[],
  state: any,
  force = false,
): Promise<ArticleGenerationResult> {
  const articleIndex =
    articles.findIndex(
      (item) => item.slug === slug,
    )

  if (articleIndex === -1) {
    throw new Error(
      `Article not found: ${slug}`,
    )
  }

  const article =
    articles[articleIndex]

  const position =
    articleIndex + 1

  const previous =
    state.articles[article._id]

  const articlePath =
    path.join(
      newsDirectory,
      article.slug,
      'index.html',
    )

  const articleExists =
    await fileExists(articlePath)

  const changed =
    force ||
    !previous ||
    previous.rev !== article._rev ||
    previous.slug !== article.slug ||
    !articleExists

  if (changed) {
    await writeArticle(article)

    console.log(
      `Generated article: ${article.title}`,
    )
  } else {
    console.log(
      `Article unchanged: ${article.title}`,
    )
  }

  /*
   * Determine which news listing pages contain
   * the old and new positions.
   */
  const affectedPages = new Set<number>()

  const newPage =
    getPageForPosition(position)

  affectedPages.add(newPage)

  if (previous?.position) {
    const oldPage =
      getPageForPosition(
        previous.position,
      )

    affectedPages.add(oldPage)

    /*
     * If the article moved, all pages between
     * the old and new positions can have shifted.
     */
    if (oldPage !== newPage) {
      const firstPage =
        Math.min(
          oldPage,
          newPage,
        )

      const lastPage =
        Math.max(
          oldPage,
          newPage,
        )

      for (
        let page = firstPage;
        page <= lastPage;
        page++
      ) {
        affectedPages.add(page)
      }
    }
  }

  /*
   * Sidebar contains the latest 5 articles.
   */
  const sidebarAffected =
    force ||
    position <= SIDEBAR_ARTICLES_COUNT ||
    previous?.position <= SIDEBAR_ARTICLES_COUNT

  state.articles[article._id] = {
    slug: article.slug,
    rev: article._rev,
    publishedAt:
      article.publishedAt,
    position,
  }

  return {
    changed,
    affectedPages: [
      ...affectedPages,
    ].sort(
      (a, b) => a - b,
    ),
    sidebarAffected,
  }
}

function getPageForPosition(
  position: number,
) {
  return Math.ceil(
    position /
      ARTICLES_PER_PAGE,
  )
}

async function writeArticle(
  article: any,
) {
  const template =
    await loadTemplate(
      'article.html',
    )

  const bodyHtml =
    renderPortableText(
      article.body,
    )

  const mainImage =
    article.mainImage
      ? `
        <a class="image featured" href="#">
          <img
            src="${imageUrl(article.mainImage)}"
            alt="${escapeHtml(article.title)}"
          />
        </a>
      `
      : ''

  const metaTitle =
    article.seo?.metaTitle ||
    article.title

  const metaDescription =
    article.seo?.metaDescription ||
    article.excerpt ||
    ''

  const html =
    template
      .replaceAll(
        '{{META_TITLE}}',
        escapeHtml(
          metaTitle,
        ),
      )
      .replaceAll(
        '{{META_DESCRIPTION}}',
        escapeHtml(
          metaDescription,
        ),
      )
      .replaceAll(
        '{{TITLE}}',
        escapeHtml(
          article.title,
        ),
      )
      .replaceAll(
        '{{SUBTITLE}}',
        escapeHtml(
          article.subtitle ||
            '',
        ),
      )
      .replaceAll(
        '{{AUTHOR}}',
        escapeHtml(
          article.author ||
            '',
        ),
      )
      .replaceAll(
        '{{CATEGORY}}',
        escapeHtml(
          article.category ||
            '',
        ),
      )
      .replaceAll(
        '{{DATE}}',
        formatDate(
          article.publishedAt,
        ),
      )
      .replaceAll(
        '{{MAIN_IMAGE}}',
        mainImage,
      )
      .replaceAll(
        '{{BODY}}',
        bodyHtml,
      )

  const outputPath =
    path.join(
      newsDirectory,
      article.slug,
      'index.html',
    )

  await fs.mkdir(
    path.dirname(
      outputPath,
    ),
    {
      recursive: true,
    },
  )

  await fs.writeFile(
    outputPath,
    html,
    'utf8',
  )
}

async function fileExists(
  filePath: string,
) {
  try {
    await fs.access(
      filePath,
    )

    return true
  } catch {
    return false
  }
}