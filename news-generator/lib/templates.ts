import fs from 'node:fs/promises'
import path from 'node:path'
import {templatesDirectory} from './paths'

export async function loadTemplate(
  filename: string,
) {
  return fs.readFile(
    path.join(
      templatesDirectory,
      filename,
    ),
    'utf8',
  )
}