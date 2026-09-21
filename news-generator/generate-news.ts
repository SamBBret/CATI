import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import {toHTML} from '@portabletext/to-html'
import fs from 'node:fs/promises'
import path from 'node:path'

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET

if (!projectId || !dataset) {
  throw new Error('Missing SANITY_PROJECT_ID or SANITY_DATASET')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-09-20',
  useCdn: true,
})

const imageBuilder = imageUrlBuilder(client)

const websiteDirectory = path.resolve(process.cwd(), '..', 'Website')
const pageDirectory = path.join(websiteDirectory, 'page')
const newsDirectory = path.join(pageDirectory, 'news/news-article')
const newsDirectoryUrl = '/Website/page/news/news-article/'

function imageUrl(source: unknown) {
  return imageBuilder
    .image(source)
    .width(1400)
    .auto('format')
    .url()
}

const portableTextComponents = {
  types: {
    image: ({value}: {value: unknown}) => {
        const url = imageUrl(value)

        if (!url) {
            return ''
        }

        return `
            <figure class="image featured">
                <img
                    src="${url}"
                    alt=""
                    loading="lazy"
                />
            </figure>
            `
    },
  },

  marks: {
    link: ({
      children,
      value,
    }: {
      children: string
      value?: {
        href?: string
        blank?: boolean
      }
    }) => {
      const href = value?.href || '#'
      const target = value?.blank
        ? ' target="_blank" rel="noopener noreferrer"'
        : ''

      return `<a href="${escapeHtml(href)}"${target}>${children}</a>`
    },
  },
}

function escapeHtml(value: string = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

async function main() {
  const articles = await client.fetch(`
    *[_type == "article" && defined(publishedAt)]
      | order(publishedAt desc) {
        _id,
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

  if (!articles.length) {
    console.log('No published articles found.')
    return
  }

  const templatePath = path.join(
    process.cwd(),
    'templates',
    'article.html',
  )

  const template = await fs.readFile(templatePath, 'utf8')

  for (const article of articles) {
    if (!article.slug) {
      console.warn(`Skipping "${article.title}" because it has no slug.`)
      continue
    }

    const articlePath = path.join(
      newsDirectory,
      article.slug,
      'index.html',
    )

    await fs.mkdir(path.dirname(articlePath), {
      recursive: true,
    })

    const bodyHtml = article.body
    ? toHTML(article.body, {
        components: portableTextComponents,
        })
    : ''

    const mainImage = article.mainImage
      ? `<a class="image featured" href="#">
\t\t\t\t\t\t\t\t\t<img src="${imageUrl(article.mainImage)}" alt="${escapeHtml(article.title)}" />
\t\t\t\t\t\t\t\t</a>`
      : ''

    const metaTitle =
      article.seo?.metaTitle ||
      article.title

    const metaDescription =
      article.seo?.metaDescription ||
      article.excerpt ||
      ''

    const html = template
      .replaceAll('{{META_TITLE}}', escapeHtml(metaTitle))
      .replaceAll('{{META_DESCRIPTION}}', escapeHtml(metaDescription))
      .replaceAll('{{TITLE}}', escapeHtml(article.title))
      .replaceAll('{{SUBTITLE}}', escapeHtml(article.subtitle || ''))
      .replaceAll('{{AUTHOR}}', escapeHtml(article.author || ''))
      .replaceAll('{{CATEGORY}}', escapeHtml(article.category || ''))
      .replaceAll('{{DATE}}', formatDate(article.publishedAt))
      .replaceAll('{{MAIN_IMAGE}}', mainImage)
      .replaceAll('{{BODY}}', bodyHtml)

    await fs.writeFile(articlePath, html, 'utf8')

    console.log(`Generated: ${articlePath}`)
  }

  // Generate paginated news listing
  const newsTemplatePath = path.join(
    process.cwd(),
    'templates',
    'news.html',
  )

  const cardTemplatePath = path.join(
    process.cwd(),
    'templates',
    'news-card.html',
  )

  const paginationTemplatePath = path.join(
    process.cwd(),
    'templates',
    'news-pagination.html',
  )

  const paginationItemTemplatePath = path.join(
    process.cwd(),
    'templates',
    'news-pagination-item.html',
  )

  const newsTemplate = await fs.readFile(
    newsTemplatePath,
    'utf8',
  )

  const cardTemplate = await fs.readFile(
    cardTemplatePath,
    'utf8',
  )

  const paginationTemplate = await fs.readFile(
    paginationTemplatePath,
    'utf8',
  )

  const paginationItemTemplate = await fs.readFile(
    paginationItemTemplatePath,
    'utf8',
  )

  const articlesPerPage = 3
  const totalPages = Math.ceil(
    articles.length / articlesPerPage,
  )

  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * articlesPerPage
    const pageArticles = articles.slice(
      start,
      start + articlesPerPage,
    )

    const cards = pageArticles
      .map((article) => {
        if (!article.slug) {
          return ''
        }

        const url = `/page/news/news-article/${article.slug}/`

        const image = article.mainImage
          ? `<a href="${url}" class="image featured">
				<img src="${imageUrl(article.mainImage)}" alt="${escapeHtml(article.title)}" />
			</a>`
          : ''

        return cardTemplate
            .replaceAll('{{URL}}', url)
            .replaceAll('{{TITLE}}', escapeHtml(article.title),)
            .replaceAll('{{SUBTITLE}}', escapeHtml(article.subtitle || ''),)
            .replaceAll('{{EXCERPT}}', escapeHtml(article.excerpt || ''),)
            .replaceAll('{{AUTHOR}}', escapeHtml(article.author || ''),)
            .replaceAll('{{DATE}}', formatDate(article.publishedAt),)
          .replaceAll('{{IMAGE}}', image)
      })
      .join('\n')

    const paginationItems: string[] = []

    if (page > 1) {
      const previousUrl = `/page/news/news-page/${page - 1}/`

      paginationItems.push(
        paginationItemTemplate
          .replaceAll('{{URL}}', previousUrl)
          .replaceAll('{{CLASS}}', 'previous')
          .replaceAll('{{LABEL}}', 'Previous'),
      )
    }

    for (let number = 1; number <= totalPages; number++) {
      const pageUrl = `/page/news/news-page/${number}/`

      paginationItems.push(
        paginationItemTemplate
          .replaceAll('{{URL}}', pageUrl)
          .replaceAll(
            '{{CLASS}}',
            number === page ? 'active' : '',
          )
          .replaceAll(
            '{{LABEL}}',
            String(number),
          ),
      )
    }

    if (page < totalPages) {
      paginationItems.push(
        paginationItemTemplate
          .replaceAll(
            '{{URL}}',
            `/page/news/news-page/${page + 1}/`,
          )
          .replaceAll('{{CLASS}}', 'next')
          .replaceAll('{{LABEL}}', 'Next'),
      )
    }

    const pagination = paginationTemplate
      .replaceAll(
        '{{PAGINATION}}',
        paginationItems.join('\n\n'),
      )

    const newsHtml = newsTemplate
      .replaceAll('{{ARTICLES}}', cards)
      .replaceAll('{{PAGINATION}}', pagination)

    const newsPath =
        path.resolve(
            process.cwd(),
            '..',
            'Website',
            'page',
            'news/news-page',
            String(page),
            'index.html',
          )

    await fs.mkdir(
      path.dirname(newsPath),
      {recursive: true},
    )

    await fs.writeFile(
      newsPath,
      newsHtml,
      'utf8',
    )

    console.log(
      `Generated news page ${page}/${totalPages}: ${newsPath}`,
    )
  }

// Generate news sidebar
  const sidebarTemplatePath = path.join(
    process.cwd(),
    'templates',
    'sidebar.html',
  )

  const sidebarItemTemplatePath = path.join(
    process.cwd(),
    'templates',
    'sidebar-item.html',
  )

  const sidebarTemplate = await fs.readFile(
    sidebarTemplatePath,
    'utf8',
  )

  const sidebarItemTemplate = await fs.readFile(
    sidebarItemTemplatePath,
    'utf8',
  )

  const sidebarArticles = articles
    .slice(0, 5)
    .map((article) => {
      if (!article.slug) {
        return ''
      }

      const url = `/page/news/news-article/${article.slug}/`

      return sidebarItemTemplate
        .replaceAll('{{URL}}', url)
        .replaceAll('{{TITLE}}', escapeHtml(article.title))
        .replaceAll(
          '{{DATE}}',
          formatDate(article.publishedAt),
        )
    })
    .join('\n')

  const sidebarHtml = sidebarTemplate
    .replaceAll('{{ARTICLES}}', sidebarArticles)

  const sidebarPath = path.resolve(
    process.cwd(),
    '..',
    'Website',
    'page',
    'snipets',
    'newssidebar.html',
  )

  await fs.writeFile(
    sidebarPath,
    sidebarHtml,
    'utf8',
  )

  console.log(`Generated news sidebar: ${sidebarPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})