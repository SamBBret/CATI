import fs from 'node:fs/promises'
import path from 'node:path'

import {
  newsPagesDirectory,
} from '../lib/paths'

import {
  loadTemplate,
} from '../lib/templates'

import {
  articleUrl,
  escapeHtml,
  formatDate,
  getPaginationPages,
  imageUrl,
  newsPageUrl,
} from '../lib/utils'

export async function generateNewsPages(
  articles: any[],
) {
  const newsTemplate =
    await loadTemplate(
      'news.html',
    )

  const cardTemplate =
    await loadTemplate(
      'news-card.html',
    )

  const paginationTemplate =
    await loadTemplate(
      'news-pagination.html',
    )

  const paginationItemTemplate =
    await loadTemplate(
      'news-pagination-item.html',
    )

  const articlesPerPage = 6

  const totalPages = Math.max(
    1,
    Math.ceil(
      articles.length /
        articlesPerPage,
    ),
  )

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {
    const start =
      (page - 1) *
      articlesPerPage

    const pageArticles =
      articles.slice(
        start,
        start +
          articlesPerPage,
      )

    const cards =
      pageArticles
        .map((article) => {
          const url =
            articleUrl(
              article.slug,
            )

          const image =
            article.mainImage
              ? `
                <a
                  href="${url}"
                  class="image featured"
                >
                  <img
                    src="${imageUrl(article.mainImage)}"
                    alt="${escapeHtml(article.title)}"
                  />
                </a>
              `
              : ''

          return cardTemplate
            .replaceAll(
              '{{URL}}',
              url,
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
              '{{EXCERPT}}',
              escapeHtml(
                article.excerpt ||
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
              '{{DATE}}',
              formatDate(
                article.publishedAt,
              ),
            )
            .replaceAll(
              '{{IMAGE}}',
              image,
            )
        })
        .join('\n')

    const paginationItems: string[] =
      []

    if (page > 1) {
      paginationItems.push(
        paginationItemTemplate
          .replaceAll(
            '{{URL}}',
            newsPageUrl(
              page - 1,
            ),
          )
          .replaceAll(
            '{{CLASS}}',
            'previous',
          )
          .replaceAll(
            '{{LABEL}}',
            'Previous',
          ),
      )
    }

    for (
      const number of getPaginationPages(
        page,
        totalPages,
      )
    ) {
      if (
        number === 'ellipsis'
      ) {
        paginationItems.push(
          '<span class="ellipsis">…</span>',
        )

        continue
      }

      paginationItems.push(
        paginationItemTemplate
          .replaceAll(
            '{{URL}}',
            newsPageUrl(
              number,
            ),
          )
          .replaceAll(
            '{{CLASS}}',
            number === page
              ? 'active'
              : '',
          )
          .replaceAll(
            '{{LABEL}}',
            String(number),
          ),
      )
    }

    if (
      page < totalPages
    ) {
      paginationItems.push(
        paginationItemTemplate
          .replaceAll(
            '{{URL}}',
            newsPageUrl(
              page + 1,
            ),
          )
          .replaceAll(
            '{{CLASS}}',
            'next',
          )
          .replaceAll(
            '{{LABEL}}',
            'Next',
          ),
      )
    }

    const pagination =
      paginationTemplate
        .replaceAll(
          '{{PAGINATION}}',
          paginationItems.join(
            '\n\n',
          ),
        )

    const html =
      newsTemplate
        .replaceAll(
          '{{ARTICLES}}',
          cards,
        )
        .replaceAll(
          '{{PAGINATION}}',
          pagination,
        )

    const outputPath =
      path.join(
        newsPagesDirectory,
        String(page),
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

    console.log(
      `Generated news page ${page}/${totalPages}`,
    )
  }
}