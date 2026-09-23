import fs from 'node:fs/promises'
import path from 'node:path'

import {
  escapeHtml,
  formatDate,
  imageUrl,
  renderPortableText,
} from '../utils'

import {
  articleDirectory,
} from '../paths'

import {
  loadTemplate,
} from '../templates'

export interface ArticleGenerationResult {
  changed: boolean
}

export async function generateArticle(
  slug: string,
  articles: any[],
  state: any,
  force = false,
): Promise<ArticleGenerationResult> {
  const article =
    articles.find(
      (item) =>
        item.slug === slug,
    )

  if (!article) {
    throw new Error(
      `Article not found: ${slug}`,
    )
  }

  const previous =
    state.articles[
      article._id
    ]

  const articlePath =
    path.join(
      articleDirectory,
      article.slug,
      'index.html',
    )

  const articleExists =
    await fileExists(
      articlePath,
    )

  const changed =
    force ||
    !previous ||
    previous.rev !== article._rev ||
    previous.slug !== article.slug ||
    !articleExists

  if (changed) {
    await writeArticle(
      article,
    )

    console.log(
      `Generated article: ${article.title} `,
    )
  } else {
    console.log(
      `Article unchanged: ${article.title}`,
    )
  }

  /*
   * Update generator state.
   *
   * Position is deliberately NOT stored here.
   * The current position is determined from the
   * ordered Sanity query when news-index.json
   * is generated.
   */

  return {
    changed,
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
      articleDirectory,
      'news-article',
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