import fs from 'node:fs/promises'
import path from 'node:path'

import {newsDirectory} from '../lib/paths'
import {articleUrl} from '../lib/utils'
import {ARTICLES_PER_PAGE} from '../lib/config'

export async function generateNewsIndex(
  articles: any[],
) {
  const totalArticles =
    articles.length

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalArticles /
          ARTICLES_PER_PAGE,
      ),
    )

  const index = {
    articlesPerPage:
      ARTICLES_PER_PAGE,

    totalArticles,

    totalPages,

    articles:
      articles.map(
        (
          article,
          index,
        ) => ({
          number:
            index + 1,

          date:
            article.publishedAt,

          card:
            `/page/news/news-cards/${article.slug}.html`,
        }),
      ),
  }

  await fs.mkdir(
    newsDirectory,
    {
      recursive: true,
    },
  )

  const outputPath =
    path.join(
      newsDirectory,
      'news-index.json',
    )

  await fs.writeFile(
    outputPath,
    JSON.stringify(
      index,
      null,
      2,
    ),
    'utf8',
  )

  console.log(
    `Generated news index: ${totalArticles} articles, ${totalPages} pages.`,
  )
}