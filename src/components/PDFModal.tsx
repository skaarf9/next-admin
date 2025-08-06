import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Button,
  Stack,
  Alert
} from '@mui/material'
import { Close, Download, Refresh, OpenInNew } from '@mui/icons-material'

interface PDFModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  initialPage?: number
}

export default function PDFModal({ isOpen, onClose, pdfUrl, initialPage = 1 }: PDFModalProps) {
  const [viewerType, setViewerType] = useState<'embed' | 'google' | 'newTab'>('embed')
  const [error, setError] = useState<string | null>(null)

  // Google Docs Viewer (备用)
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = 'document.pdf'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }

  const handleViewerChange = (type: 'embed' | 'google' | 'newTab') => {
    if (type === 'newTab') {
      handleOpenInNewTab()
      return
    }
    setViewerType(type)
    setError(null)
  }

  const handleEmbedError = () => {
    setError('浏览器不支持PDF预览，建议使用Chrome、Edge或Firefox浏览器')
  }

  const renderViewer = () => {
    if (viewerType === 'embed') {
      return (
        <object
          data={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${initialPage}&zoom=auto`}
          type="application/pdf"
          width="100%"
          height="100%"
          onError={handleEmbedError}
        >
          <embed
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${initialPage}&zoom=auto`}
            type="application/pdf"
            width="100%"
            height="100%"
          />
          {/* 浏览器不支持时的fallback */}
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              您的浏览器不支持PDF预览
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              建议使用Chrome、Edge或Firefox浏览器获得最佳体验
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
              <Button variant="contained" onClick={handleDownload}>
                下载PDF文件
              </Button>
              <Button variant="outlined" onClick={handleOpenInNewTab}>
                新窗口打开
              </Button>
              <Button variant="outlined" onClick={() => handleViewerChange('google')}>
                尝试Google查看器
              </Button>
            </Stack>
          </Box>
        </object>
      )
    }

    // Google Docs Viewer作为备用
    return (
      <iframe
        src={googleViewerUrl}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        title="PDF文档"
        onError={() => setError('Google查看器加载失败')}
        onLoad={() => setError(null)}
      />
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">PDF文档预览</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* 查看器选择 */}
            <Button
              size="small"
              variant={viewerType === 'embed' ? 'contained' : 'outlined'}
              onClick={() => handleViewerChange('embed')}
            >
              浏览器内置
            </Button>
            <Button
              size="small"
              variant={viewerType === 'google' ? 'contained' : 'outlined'}
              onClick={() => handleViewerChange('google')}
            >
              Google查看器
            </Button>

            <Button
              size="small"
              startIcon={<OpenInNew />}
              onClick={handleOpenInNewTab}
              color="secondary"
            >
              新窗口打开
            </Button>

            <Button
              size="small"
              startIcon={<Download />}
              onClick={handleDownload}
              color="primary"
            >
              下载
            </Button>

            <Button
              size="small"
              startIcon={<Refresh />}
              onClick={() => {
                setError(null)
                // 强制刷新
                window.location.reload()
              }}
            >
              刷新
            </Button>

            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: '80vh' }}>
        {error && (
          <Alert
            severity="warning"
            sx={{ m: 2 }}
            action={
              <Stack direction="row" spacing={1}>
                <Button color="inherit" size="small" onClick={handleOpenInNewTab}>
                  新窗口打开
                </Button>
                <Button color="inherit" size="small" onClick={handleDownload}>
                  直接下载
                </Button>
              </Stack>
            }
          >
            {error}
          </Alert>
        )}

        <Box sx={{ height: error ? 'calc(100% - 80px)' : '100%' }}>
          {renderViewer()}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
