'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Pagination } from '@mui/material';
import PDFModal from '@/components/PDFModal'
interface ESResult {
  _source: {
    model: string
    brand: string
    size: string
    currency: string
    designer: string
    category: string
    sub_category: string
    price_range: string
    description: string
    productImage: string
    pdf_id: string
    pdf_num: string
  }
}

interface SearchResponse {
  hits: any[];
  total: {
    relation: string;
    value: number;
  };
  page: number;
  size: number;
}
// PDF云服务配置
const PDF_BASE_URL = 'https://drimagestorage.oss-cn-beijing.aliyuncs.com/pdfs/'
export default function ESSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse>({
    hits: [],
    total: { relation: "eq", value: 0 },
    page: 1,
    size: 10
  });
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  // 在组件顶部添加编辑状态
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editData, setEditData] = useState<ESResult['_source'] | null>(null)
  const [editingId, setEditingId] = useState<string>('')
  const [selectedPDF, setSelectedPDF] = useState<{
    url: string
    page: number
  } | null>(null)

  // 根据pdfid构建完整URL
  const buildPDFUrl = (pdfId: string): string => {
    // 如果pdfId已经包含.pdf后缀就直接用，否则添加
    const fileName = pdfId.endsWith('.pdf') ? pdfId : `${pdfId}.pdf`
    return `${PDF_BASE_URL}${fileName}`
  }

  // 搜索结果点击处理
  const handleResultClick = (item: any) => {
    const pdfId = item._source.pdf_id || item._source.pdfid // ES中存储的PDF ID字段
    if (pdfId) {
      setSelectedPDF({
        url: buildPDFUrl(pdfId),
        page: item._source.pdf_page || item._source.page || 1 // 对应的页码
      })
    }
  }

  const handleEdit = (item: ESResult) => {
    setEditData({ ...item._source })
    setEditingId(item._source.pdf_id)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editData) return

    try {
      const response = await fetch('/api/es/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          data: editData
        })
      })

      if (response.ok) {
        // 重新搜索刷新数据
        await handleSearch(currentPage)
        setIsDialogOpen(false)
        setEditData(null)
      }
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleSearch = async (page = 1) => {
    if (!query.trim()) return

    setLoading(true)
    console.log(page)
    setCurrentPage(page)
    try {
      const url = `/api/es?q=${encodeURIComponent(query)}&page=${page}&size=10`;
      const response = await fetch(`/api/es?q=${encodeURIComponent(query)}&page=${page}&size=10`)
      console.log('请求URL:', url); // 调试1: 检查请求URL
      const data = await response.json()
      setResults(data)
      console.log('API返回数据:', {
        page: data.page,
        size: data.size,
        total: data.total,
        hitsLength: data.hits?.length
      }); // 调试2: 检查返回数据
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil((results.total.value || 0) / 10)

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
              placeholder="搜索产品型号、品牌或设计师"
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

        {results.total.value > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            找到约 {results.total.value} 条结果
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
                      alt={item._source.model || '产品图片'}
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
                  <div className="flex items-center gap-3 mb-2"
                       onClick={() => handleResultClick(item)}
                  >
                    <h3 className="text-xl font-semibold text-blue-600">
                      {item._source.model}
                    </h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                      {item._source.brand}
                    </span>
                  </div>

                  <p className="mb-3 leading-relaxed text-gray-700">
                    {item._source.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">分类：</span>
                      <span className="text-gray-700">
                        {item._source.category} {">"} {item._source.sub_category}
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
                        {item._source.size}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">价格：</span>
                      <span className="font-medium text-green-600">
                        {item._source.price_range} {item._source.currency}
                      </span>
                    </div>
                  </div>

                  {/* PDF信息 */}
                  {(item._source.pdf_id || item._source.pdf_num) && (
                    <div className="mt-3 text-xs text-gray-500">
                      PDF: {item._source.pdf_id} - 第{item._source.pdf_num}页
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200"
                  >
                    修改
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">编辑产品信息</h2>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {editData && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">型号</label>
                    <input
                      value={editData.model}
                      onChange={(e) => setEditData({...editData, model: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">品牌</label>
                    <input
                      value={editData.brand}
                      onChange={(e) => setEditData({...editData, brand: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">分类</label>
                    <input
                      value={editData.category}
                      onChange={(e) => setEditData({...editData, category: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">子分类</label>
                    <input
                      value={editData.sub_category}
                      onChange={(e) => setEditData({...editData, sub_category: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">设计师</label>
                    <input
                      value={editData.designer}
                      onChange={(e) => setEditData({...editData, designer: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">尺寸</label>
                    <input
                      value={editData.size}
                      onChange={(e) => setEditData({...editData, size: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">价格区间</label>
                    <input
                      value={editData.price_range}
                      onChange={(e) => setEditData({...editData, price_range: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">货币</label>
                    <input
                      value={editData.currency}
                      onChange={(e) => setEditData({...editData, currency: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">描述</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
        <PDFModal
          isOpen={!!selectedPDF}
          onClose={() => setSelectedPDF(null)}
          pdfUrl={selectedPDF?.url || ''}
          initialPage={selectedPDF?.page || 1}
        />

        {/* 分页 */}
        {totalPages > 1 && (  // 改为 > 1，而不是 > 0
          <div className="mt-8 flex justify-center">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, page) => handleSearch(page)}
              disabled={loading}
              color="primary"
              size="medium"
              showFirstButton
              showLastButton
            />
          </div>
        )}
      </div>
    </div>
  );
}
