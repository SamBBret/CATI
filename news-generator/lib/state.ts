import fs from 'node:fs/promises'
import {stateDirectory, statePath} from './paths'

export interface ArticleState {
  slug: string
  rev: string
  publishedAt: string
}

export type GeneratorState = Record<
  string,
  ArticleState
>

export async function loadState(): Promise<GeneratorState> {
  try {
    const contents = await fs.readFile(
      statePath,
      'utf8',
    )

    return JSON.parse(contents)
  } catch {
    return {}
  }
}

export async function saveState(
  state: GeneratorState,
) {
  await fs.mkdir(stateDirectory, {
    recursive: true,
  })

  await fs.writeFile(
    statePath,
    JSON.stringify(state, null, 2),
    'utf8',
  )
}