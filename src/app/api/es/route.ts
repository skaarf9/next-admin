import { NextRequest, NextResponse } from 'next/server'
import { esClient } from '@/lib/elasticsearch'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const minPrice = parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999')
    const page = parseInt(searchParams.get('page') || '1')      // 添加这行
    const size = parseInt(searchParams.get('size') || '10')     // 添加这行

    // 构建查询条件
    const searchQuery: any = {
      index: 'p',
      size: size,                    // 使用动态size
      from: (page - 1) * size,       // 添加分页偏移量
      query: {
        bool: {
          must: [],
          filter: []
        }
      }
    }

    // 如果有搜索关键词，添加多字段搜索
    if (query.trim()) {
      searchQuery.query.bool.must.push({
        multi_match: {
          query: query,
          fields: [
            "model^3",           // 产品型号，权重最高
            "brand^2.5",         // 品牌
            "designer^2",        // 设计师
            "description^1.5",   // 描述
            "category^1.2",      // 类别
            "sub_category^1.2"   // 子类别
          ],
          type: "best_fields",
          fuzziness: "AUTO"
        }
      })
    } else {
      // 如果没有搜索词，匹配所有文档
      searchQuery.query.bool.must.push({
        match_all: {}
      })
    }

    // 价格过滤 - 简化版本，先检查字段是否存在
    if (minPrice > 0 || maxPrice < 999999) {
      searchQuery.query.bool.filter.push({
        script: {
          script: {
            source: `
              if (!doc.containsKey('price_range') || doc['price_range'].size() == 0) return false;
              String priceRange = doc['price_range'].value;
              if (priceRange == null || priceRange.isEmpty()) return false;
              
              int dashIndex = priceRange.indexOf('-');
              if (dashIndex <= 0) return false;
              
              try {
                String minStr = priceRange.substring(0, dashIndex);
                String maxStr = priceRange.substring(dashIndex + 1);
                double minPriceInDoc = Double.parseDouble(minStr);
                double maxPriceInDoc = Double.parseDouble(maxStr);
                return maxPriceInDoc >= params.minPrice && minPriceInDoc <= params.maxPrice;
              } catch (Exception e) {
                return false;
              }
            `,
            params: {
              minPrice: minPrice,
              maxPrice: maxPrice
            }
          }
        }
      })
    }

    // 简化排序，只使用评分
    searchQuery.sort = ["_score"]

    const result = await esClient.search(searchQuery)

    // 处理返回结果
    const processedHits = result.hits.hits.map((hit: any) => {
      const source = hit._source
      let minPrice = 0
      let maxPrice = 0

      if (source.price_range) {
        const prices = source.price_range.split('-')
        if (prices.length >= 2) {
          minPrice = parseFloat(prices[0]) || 0
          maxPrice = parseFloat(prices[1]) || 0
        }
      }

      return {
        ...hit,
        _source: {
          ...source,
          parsedMinPrice: minPrice,
          parsedMaxPrice: maxPrice
        }
      }
    })

    return NextResponse.json({
      hits: processedHits,
      total: result.hits.total,
      took: result.took,
      page,        // 返回当前页
      size,        // 返回每页大小
    })

  } catch (error) {
    console.error('ES Error:', error)
    return NextResponse.json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
