import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET

if (!projectId || !dataset) {
  throw new Error(
    'Missing SANITY_PROJECT_ID or SANITY_DATASET',
  )
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-09-20',
  useCdn: false,
})

export async function getPublishedArticles() {
  return client.fetch(`
    *[
      _type == "article" &&
      defined(publishedAt)
    ]
    | order(publishedAt desc) {
      _id,
      _rev,
      title,
      "slug": slug.current,
      subtitle,
      excerpt,
      body,
      mainImage,
      publishedAt,
      "author": author->name,
      "category": category->name,
      tags,
      seo
    }
  `)
}