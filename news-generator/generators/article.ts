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

export async function generateArticle(
  slug: string,
  articles: any[],
  state: any,
  force = false,
) {
  const article = articles.find(
    (item) => item.slug === slug,
  )

  if (!article) {
    throw new Error(
      `Article not found: ${slug}`,
    )
  }

  const previous = state[article._id]

  const articlePath = path.join(
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

  if (!changed) {
    console.log(
      `Article unchanged: ${article.title}`,
    )
  } else {
    await writeArticle(article)

    console.log(
      `Generated article: ${article.title}`,
    )
  }

  state[article._id] = {
    slug: article.slug,
    rev: article._rev,
    publishedAt: article.publishedAt,
  }

  /*
   * The article's news card is part of a generated
   * news page, so that page must also be regenerated.
   *
   * We do this separately in the main orchestration
   * rather than duplicating news-generation logic here.
   */

  return {
    changed,
    articleId: article._id,
    slug: article.slug,
  }
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

  const html = template
    .replaceAll(
      '{{META_TITLE}}',
      escapeHtml(metaTitle),
    )
    .replaceAll(
      '{{META_DESCRIPTION}}',
      escapeHtml(metaDescription),
    )
    .replaceAll(
      '{{TITLE}}',
      escapeHtml(article.title),
    )
    .replaceAll(
      '{{SUBTITLE}}',
      escapeHtml(
        article.subtitle || '',
      ),
    )
    .replaceAll(
      '{{AUTHOR}}',
      escapeHtml(
        article.author || '',
      ),
    )
    .replaceAll(
      '{{CATEGORY}}',
      escapeHtml(
        article.category || '',
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
    path.dirname(outputPath),
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
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}