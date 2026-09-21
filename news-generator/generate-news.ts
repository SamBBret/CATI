import {getPublishedArticles} from './lib/sanity'
import {loadState, saveState} from './lib/state'
import {generateArticle} from './generators/article'
import {generateNewsPages} from './generators/news'
import {generateSidebar} from './generators/sidebar'

async function main() {
  const command = process.argv[2] || 'all'
  const args = process.argv.slice(3)

  const force = args.includes('force')
  const positionalArgs = args.filter(
    (arg) => !arg.startsWith('--'),
  )

  const articles = await getPublishedArticles()
  const state = await loadState()

  switch (command) {
    case 'article': {
      const slug = positionalArgs[0]

      if (!slug) {
        throw new Error(
          'Usage: npm run generate:article -- <slug> [--force]',
        )
      }

      const result = await generateArticle(
        slug,
        articles,
        state,
        force,
      )

      if (result.changed || force) {
        await generateNewsPages(articles)
        await generateSidebar(articles)
      }

      break
    }

    case 'articles': {
        const result = await generateArticles(
            articles,
            state,
            force,
        )

        if (force) {
            await generateNewsPages(articles)
            await generateSidebar(articles)
        } else if (result.changedArticles.length > 0) {
            await generateNewsPages(articles)
            await generateSidebar(articles)
        } else {
            console.log(
            'No article changes detected. News pages and sidebar are up to date.',
            )
        }

        break
    }

    case 'news': {
      await generateNewsPages(articles)
      break
    }

    case 'sidebar': {
      await generateSidebar(articles)
      break
    }

    case 'all': {
      await generateArticles(
        articles,
        state,
        force,
      )

      await generateNewsPages(articles)
      await generateSidebar(articles)

      break
    }

    default:
      throw new Error(
        `Unknown command: ${command}`,
      )
  }

  await saveState(state)
}

async function generateArticles(
  articles: any[],
  state: any,
  force: boolean,
) {
  const changedArticles: any[] = []

  for (const article of articles) {
    const result = await generateArticle(
      article.slug,
      articles,
      state,
      force,
    )

    if (result.changed) {
      changedArticles.push(article)
    }
  }

  return {
    changedArticles,
  }
}