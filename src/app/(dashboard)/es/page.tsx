'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ESResult {
  _source: {
    productName: string
    productImage: string
    productDescription: string
    smallCategory: string
    bigCategory: string
    priceRange: string
    designer: string
    dimensions: string
    currency: string
  }
}

interface SearchResponse {
  hits: ESResult[]
  total: number
  page: number
  size: number
}

export default function ESSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse>({ hits: [], total: 0, page: 1, size: 10 })
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = async (page = 1) => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/es?q=${encodeURIComponent(query)}&page=${page}&size=10`)
      const data = await response.json()
      console.log(data)
      setResults({
        hits: data, // data就是hits数组
        total: data.length, // 或者从API返回中获取真实total
        page: page,
        size: 10
      })
      setCurrentPage(page)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(results.total / results.size)

  return (
    <div className="min-h-screen bg-white">
      {/* 搜索框 */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <div className="mx-auto max-w-4xl pt-6">
          <div className="flex items-center rounded-full border border-gray-300 px-4 py-2 transition-shadow hover:shadow-md">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(1)}
              className="flex-1 text-base outline-none"
              placeholder="搜索供应商或产品"
            />
            <button
              onClick={() => handleSearch(1)}
              disabled={loading}
              className="ml-3 p-2 text-gray-600 hover:text-gray-800"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 结果区域 */}
      <div className="mx-auto max-w-4xl px-4">
        {loading && <div className="mb-4 text-gray-600">搜索中...</div>}

        {results.total > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            找到约 {results.total} 条结果
          </div>
        )}

        <div className="grid gap-6">
          {results.hits.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex gap-6">
                {/* 产品图片 */}
                <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {item._source.productImage ? (
                    <Image
                      src={item._source.productImage}
                      alt={item._source.productName || '产品图片'}
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs">暂无图片</div>
                  )}
                </div>


                {/* 产品信息 */}
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-blue-600">
                    {item._source.productName}
                  </h3>

                  <p className="mb-3 leading-relaxed text-gray-700">
                    {item._source.productDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">分类：</span>
                      <span className="text-gray-700">
                        {item._source.bigCategory} {">"}{" "}
                        {item._source.smallCategory}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">设计师：</span>
                      <span className="text-gray-700">
                        {item._source.designer}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">尺寸：</span>
                      <span className="text-gray-700">
                        {item._source.dimensions}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">价格：</span>
                      <span className="font-medium text-green-600">
                        {item._source.priceRange} {item._source.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => handleSearch(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              上一页
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handleSearch(page)}
                  disabled={loading}
                  className={`rounded border px-3 py-1 ${
                    currentPage === page
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => handleSearch(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
