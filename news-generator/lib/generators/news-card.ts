import fs from 'node:fs/promises'
import path from 'node:path'

import {
  cardDirectory,
} from '../paths'

import {
  loadTemplate,
} from '../templates'

import {
  articleUrl,
  escapeHtml,
  formatDate,
  imageUrl,
} from '../utils'

import {
  type GeneratorState,
} from '../state'

export interface NewsCardResult {
  changed: boolean
  slug: string
}

export async function generateNewsCard(
  article: any,
  state: GeneratorState,
  force = false,
): Promise<NewsCardResult> {
  const previous =
    state.articles[article._id]

  const cardPath =
    path.join(
      cardDirectory,
      `${article.slug}.html`,
    )

  const exists =
    await fileExists(cardPath)

  const changed =
    force ||
    !previous ||
    previous.rev !== article._rev ||
    previous.slug !== article.slug ||
    !exists

  if (!changed) {
    console.log(
      `News card unchanged: ${article.title}`,
    )

    return {
      changed: false,
      slug: article.slug,
    }
  }

  const template =
    await loadTemplate(
      'news-card.html',
    )

  const url =
    articleUrl(
      article.slug,
    )

  const image =
    article.mainImage
      ? `
        <a href="${url}" class="image featured">
          <img
            src="${imageUrl(article.mainImage)}"
            alt="${escapeHtml(article.title)}"
            loading="lazy"
          />
        </a>
      `
      : ''

  const html =
    template
      .replaceAll(
        '{{URL}}',
        escapeHtml(url),
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
          article.subtitle || '',
        ),
      )
      .replaceAll(
        '{{EXCERPT}}',
        escapeHtml(
          article.excerpt || '',
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
        '{{IMAGE}}',
        image,
      )


  await fs.mkdir(
    path.dirname(
      cardPath,
    ),
    {
      recursive: true,
    },
  )

  await fs.writeFile(
    cardPath,
    html,
    'utf8',
  )

  console.log(
    `Generated news card: ${article.title}`,
  )

  return {
    changed: true,
    slug: article.slug,
  }
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