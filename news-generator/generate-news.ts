import {getPublishedArticles} from './lib/sanity'
import {
  loadState,
  saveState,
} from './lib/state'

import {
  generateArticle,
} from './generators/article'

import {
  generateNewsCard,
} from './generators/news-card'

import {
  generateNewsIndex,
} from './generators/news-index'

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
          'Usage: npm run generate:article -- <slug> [force]',
        )
      }

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

      const articleResult =
        await generateArticle(
          slug,
          articles,
          state,
          force,
        )

      if(articleResult.changed){
        const cardResult =
          await generateNewsCard(
            article,
            state,
            force,
          )
        await generateNewsIndex(articles)
        
        if (cardResult.changed) {
            await generateSidebar(articles)
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

      if (result.cardChanged){          
        await generateSidebar(articles)
        await generateNewsIndex(articles)
      }

      break
    }

    case 'cards': {
      const result = 
      await generateNewsCards(
        articles,
        state,
        force,
      )

      if (result.cardChanged){
        await generateNewsIndex(articles)
        await generateSidebar(articles)
      }

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

      if (result.cardChanged) {
        await generateNewsIndex(articles)
        await generateSidebar(
          articles,
        )
      }

      break
    }

    default:
      throw new Error(
        `Unknown command: ${command}`,
      )
  }

  state.totalPages =
    Math.max(
      1,
      Math.ceil(
        articles.length /
          ARTICLES_PER_PAGE,
      ),
    )

  updateState(
    state,
    articles,
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
  let cardChanged = false
  for (
    const article of articles
  ) {
    const articleResult =
      await generateArticle(
        article.slug,
        articles,
        state,
        force,
      )

    var cardResult
    if(articleResult.changed){
      cardResult =
        await generateNewsCard(
          article,
          state,
          force,
        )

      if (cardResult) {
       cardChanged = true
      }
    }
  }

  return {
    cardChanged
  }
}

async function generateNewsCards(
  articles: any[],
  state: any,
  force: boolean,
) {
  let cardChanged = false

  for (
    const article of articles
  ) {
    const result =
      await generateNewsCard(
        article,
        state,
        force,
      )
    if (result.changed){
      cardChanged = true
    }
  }
  return{ 
    cardChanged 
  }
}

function updateState(
  state: any,
  articles: any[],
) {
  const currentArticles: Record<
    string,
    {
      slug: string
      rev: string
      publishedAt: string
    }
  > = {}

    articles.forEach((article, index) =>{
      currentArticles[
        article._id
      ] = {
        slug:
          article.slug,

        rev:
          article._rev,

        publishedAt:
          article.publishedAt
      }
    });


  state.articles =
    currentArticles

  state.totalPages =
    Math.max(
      1,
      Math.ceil(
        articles.length /
          ARTICLES_PER_PAGE,
      ),
    )
}

main().catch(
  (error) => {
    console.error(error)
    process.exit(1)
  },
)

