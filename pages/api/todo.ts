import { APIResponseError, Client } from '@notionhq/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import dayjs from 'dayjs'
import { text } from 'stream/consumers'


const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.DATABASE_ID as string


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  try {
    if (req.method === 'GET') {
      const database = await notion.databases.query({
        database_id: databaseId,
        filter: {
          timestamp: 'created_time',
          created_time: {
            after: dayjs().startOf('day').toISOString(),
            before: dayjs().endOf('day').toISOString()
          }
        }
      })
      res.status(200).json({ list: database.results })
    } else if (req.method === 'POST') {
      const { body } = req
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Name: {
            type: 'title',
            title: [
              {
                type: 'text',
                text: {
                  content: body.name,
                  link: null
                }
              }
            ]
          },
          Description: {
            type: 'rich_text',
            rich_text: [
              {
                type: 'text',
                text: {
                  content: body.description,
                  link: null
                }
              }
            ]
          },
          ['High Priority']: {
            type: 'checkbox',
            checkbox: body.is_high_priority || false
          }
        },
      })
      res.status(201).json({ ok: true })
    }
    else {
      res.status(404).json({ error: 'not found path' })
    }
  } catch (error) {
    const apiError = error as APIResponseError
    res.status(500).json({ error: apiError.body })
  }
}
