interface CostAnalysisModalProps {
  open: boolean
  onClose: () => void
  projectId?: string
  projectName?: string
}

export default function CostAnalysisModal({
                                            open,
                                            onClose,
                                            projectId,
                                            projectName
                                          }: CostAnalysisModalProps) {
  const [tabValue, setTabValue] = useState(0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">成本分析 - {projectName}</h2>
        </div>
        <div className="p-6">
          <p>项目ID: {projectId}</p>
          <p>成本分析内容</p>
        </div>
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
