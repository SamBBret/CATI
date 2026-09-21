import {defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

        defineField({
      name: 'subtitle',
      title: 'Sub-Title',
      type: 'string',
    }),

    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
    }),

    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
    name: 'tags',
    title: 'Tags',
    type: 'array',
    of: [{type: 'string'}],
    options: {
        layout: 'tags',
    },
    }),

    defineField({
    name: 'body',
    title: 'Body',
    type: 'array',
    of: [
        {
        type: 'block',
        styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
            {title: 'Heading 4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
        ],
        lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
        ],
        marks: {
            decorators: [
            {title: 'Strong', value: 'strong'},
            {title: 'Emphasis', value: 'em'},
            {title: 'Underline', value: 'underline'},
            {title: 'Code', value: 'code'},
            ],
            annotations: [
            {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (Rule) =>
                    Rule.required(),
                }),
                defineField({
                    name: 'blank',
                    title: 'Open in new tab',
                    type: 'boolean',
                    initialValue: false,
                }),
                ],
            },
            ],
        },
        },

        {
        type: 'image',
        options: {
            hotspot: true,
        },
        },
    ],
    }),

    defineField({
        name: 'publishedAt',
        title: 'Publication date',
        type: 'datetime',
        validation: (Rule) => Rule.required(),
    }),

    defineField({
    name: 'seo',
    title: 'SEO',
    type: 'object',
    fields: [
        defineField({
        name: 'metaTitle',
        title: 'Meta title',
        type: 'string',
        validation: (Rule) => Rule.max(60),
        }),

        defineField({
        name: 'metaDescription',
        title: 'Meta description',
        type: 'text',
        rows: 3,
        validation: (Rule) => Rule.max(160),
        }),

        defineField({
        name: 'socialImage',
        title: 'Social sharing image',
        type: 'image',
        options: {
            hotspot: true,
        },
        }),
    ],
    }),
  ],
})