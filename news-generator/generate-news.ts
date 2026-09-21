import {getPublishedArticles} from './lib/sanity'
import {
  loadState,
  saveState,
} from './lib/state'

import {
  generateArticle,
} from './generators/article'

import {
  generateNewsPages,
} from './generators/news'

import {
  generateSidebar,
} from './generators/sidebar'

import {
  ARTICLES_PER_PAGE,
} from './lib/config'

async function main() {
  console.log(
    'Generator started.',
  )

  const command =
    process.argv[2] || 'all'

  const args =
    process.argv.slice(3)

  const force =
    args.includes('force')

  const positionalArgs =
    args.filter(
      (arg) =>
        !arg.startsWith('--'),
    )

  const articles =
    await getPublishedArticles()

  console.log(
    `Found ${articles.length} published articles.`,
  )

  const state =
    await loadState()

  switch (command) {
    case 'article': {
      const slug =
        positionalArgs[0]

      if (!slug) {
        throw new Error(
          'Usage: npm run generate:article -- <slug> [--force]',
        )
      }

      const result =
        await generateArticle(
          slug,
          articles,
          state,
          force,
        )

      if (
        result.changed ||
        force
      ) {
        await generateNewsPages(
          articles,
          result.affectedPages,
        )

        if (
          result.sidebarAffected
        ) {
          await generateSidebar(
            articles,
          )
        }
      }

      break
    }

    case 'articles': {
      const result =
        await generateArticles(
          articles,
          state,
          force,
        )

      if (force) {
        await generateNewsPages(
          articles,
        )

        await generateSidebar(
          articles,
        )
      } else if (
        result.changedArticles > 0
      ) {
        await generateNewsPages(
          articles,
          [
            ...result.affectedPages,
          ],
        )

        if (
          result.sidebarAffected
        ) {
          await generateSidebar(
            articles,
          )
        }
      } else {
        console.log(
          'No article changes detected. News pages and sidebar are up to date.',
        )
      }

      break
    }

    case 'news': {
      await generateNewsPages(
        articles,
      )

      break
    }

    case 'sidebar': {
      await generateSidebar(
        articles,
      )

      break
    }

    case 'all': {
      const result =
        await generateArticles(
          articles,
          state,
          force,
        )

      if (force) {
        await generateNewsPages(
          articles,
        )

        await generateSidebar(
          articles,
        )
      } else if (
        result.changedArticles > 0
      ) {
        await generateNewsPages(
          articles,
          [
            ...result.affectedPages,
          ],
        )

        if (
          result.sidebarAffected
        ) {
          await generateSidebar(
            articles,
          )
        }
      } else {
        console.log(
          'No article changes detected. Nothing to regenerate.',
        )
      }

      break
    }

    default:
      throw new Error(
        `Unknown command: ${command}`,
      )
  }

  /*
   * Store the current number of news pages.
   */
  state.totalPages =
    Math.max(
      1,
      Math.ceil(
        articles.length / ARTICLES_PER_PAGE,
      ),
    )

  await saveState(
    state,
  )
}

async function generateArticles(
  articles: any[],
  state: any,
  force: boolean,
) {
  const affectedPages =
    new Set<number>()

  let changedArticles = 0
  let sidebarAffected = false

  for (
    const article of articles
  ) {
    const result =
      await generateArticle(
        article.slug,
        articles,
        state,
        force,
      )

    if (result.changed) {
      changedArticles++
    }

    for (
      const page
      of result.affectedPages
    ) {
      if (
        result.changed ||
        force
      ) {
        affectedPages.add(
          page,
        )
      }
    }

    if (
      result.changed &&
      result.sidebarAffected
    ) {
      sidebarAffected = true
    }
  }

  return {
    changedArticles,
    affectedPages,
    sidebarAffected,
  }
}

main().catch(
  (error) => {
    console.error(error)
    process.exit(1)
  },
)