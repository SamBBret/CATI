import fs from 'node:fs/promises'

import {
  stateDirectory,
  statePath,
} from './paths'

export interface ArticleState {
  slug: string
  rev: string
  publishedAt: string
}

export interface GeneratorState {
  articles: Record<
    string,
    ArticleState
  >
  totalPages: number
}

export async function loadState(): Promise<GeneratorState> {
  try {
    const contents =
      await fs.readFile(
        statePath,
        'utf8',
      )

    const parsed =
      JSON.parse(contents)

    /*
     * Migrate the old state format:
     *
     * {
     *   "article-id": {
     *     "slug": "...",
     *     "rev": "...",
     *     "publishedAt": "..."
     *   }
     * }
     */
    if (
      !parsed.articles &&
      typeof parsed === 'object'
    ) {
      return {
        articles: parsed,
        totalPages: 0,
      }
    }

    return {
      articles:
        parsed.articles || {},

      totalPages:
        parsed.totalPages || 0,
    }
  } catch {
    return {
      articles: {},
      totalPages: 0,
    }
  }
}

export async function saveState(
  state: GeneratorState,
) {
  await fs.mkdir(
    stateDirectory,
    {
      recursive: true,
    },
  )

  await fs.writeFile(
    statePath,
    JSON.stringify(
      state,
      null,
      2,
    ),
    'utf8',
  )
}