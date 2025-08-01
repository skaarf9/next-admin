import { NextRequest, NextResponse } from 'next/server'
import { esClient } from '@/lib/elasticsearch'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')

    const result = await esClient.search({
      index: 'products',
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: [
                  "productName^3",
                  "tags^2.5",
                  "brand^2",
                  "productDescription^1.5",
                  "prices.rowHead^1.2",
                  "prices.colHead^1.2",
                  "prices.tableTitle^1"
                ],
                type: "most_fields"
              }
            }
          ],
          filter: [
            {
              range: {
                "prices.productPrice": {
                  gte: minPrice,
                  lte: maxPrice
                }
              }
            }
          ]
        }
      },
      size: 20
    })

    return NextResponse.json(result.hits.hits)
  } catch (error) {
    console.error('ES Error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
