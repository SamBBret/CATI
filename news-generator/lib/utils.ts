import imageUrlBuilder from '@sanity/image-url'
import {toHTML} from '@portabletext/to-html'
import {client} from './sanity'

const imageBuilder =
  imageUrlBuilder(client)

export function imageUrl(source: unknown) {
  return imageBuilder
    .image(source)
    .width(1400)
    .auto('format')
    .url()
}

export function escapeHtml(
  value: string = '',
) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function articleUrl(slug: string) {
  return `/page/news/news-article/${slug}/`
}

export function newsPageUrl(page: number) {
  return `/page/news/news-page/${page}/`
}

export function getPaginationPages(
  currentPage: number,
  totalPages: number,
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from(
      {length: totalPages},
      (_, index) => index + 1,
    )
  }

  const pages = new Set<number>()

  pages.add(1)

  for (
    let number = currentPage - 1;
    number <= currentPage + 1;
    number++
  ) {
    if (
      number >= 1 &&
      number <= totalPages
    ) {
      pages.add(number)
    }
  }

  pages.add(totalPages)

  const sortedPages = [...pages].sort(
    (a, b) => a - b,
  )

  const result: (
    | number
    | 'ellipsis'
  )[] = []

  for (
    let index = 0;
    index < sortedPages.length;
    index++
  ) {
    const number = sortedPages[index]
    const previous =
      sortedPages[index - 1]

    if (
      previous !== undefined &&
      number - previous > 1
    ) {
      result.push('ellipsis')
    }

    result.push(number)
  }

  return result
}

export function renderPortableText(
  body: any,
) {
  if (!body) {
    return ''
  }

  return toHTML(body, {
    components: {
      types: {
        image: ({
          value,
        }: {
          value: unknown
        }) => {
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
          const href =
            value?.href || '#'

          const target =
            value?.blank
              ? ' target="_blank" rel="noopener noreferrer"'
              : ''

          return `
            <a href="${escapeHtml(href)}"${target}>
              ${children}
            </a>
          `
        },
      },
    },
  })
}