"use client"
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, Pagination, Stack, MenuItem, Select, SelectChangeEvent,
  Tooltip, Box, Typography, Link, Grid, InputAdornment, FormControl, InputLabel
} from '@mui/material';
import { Edit, Delete, Visibility, Add, Search, Clear } from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface ProductPDF {
  id: number;
  name: string;
  pdfUrl: string;
  pageCount: number;
  discountFactor: number;
  createdAt: string;
  updatedAt: string;
}

export default function PDFsPage() {
  const [pdfs, setPdfs] = useState<ProductPDF[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<ProductPDF | null>(null);
  const [pdfToDelete, setPdfToDelete] = useState<ProductPDF | null>(null);
  const [newPdf, setNewPdf] = useState<Omit<ProductPDF, 'id' | 'createdAt' | 'updatedAt'>>({ 
    name: '',
    pdfUrl: '',
    pageCount: 0,
    discountFactor: 1
  });
  const [pageSize, setPageSize] = useState(10);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pdfPermissions, setPdfPermissions] = useState<any[]>([]);
  const [searchName, setSearchName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Get token from client-side cookies
  const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  // 从cookie中获取并解析JWT (client-side)
  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) return;

    try {
      // Client-side JWT decoding (without verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      setUser(payload);
      setIsAdmin((payload.roles as string[])?.includes('admin') || false);
      setPdfPermissions(payload.pdfPermissions || []);
    } catch (error) {
      console.error('JWT解析失败:', error);
    }
  }, []);

  const canEditPdf = (pdfId: number) => {
    if (isAdmin) return true;
    
    // 查找特定PDF的权限
    const permission = pdfPermissions.find(p => p.pdfId === pdfId);
    return permission?.canEdit || false;
  };

  const fetchPdfs = () => {
    const token = getTokenFromCookie();
    if (!token) {
      console.error('未找到认证令牌');
      return;
    }
    
    // 构建查询参数
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...(searchName && { name: searchName }),
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() })
    });
    
    fetch(`/api/pdf?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => {
        setPdfs(json.data);
        setTotalPages(json.pagination.totalPages);
      })
      .catch(error => console.error('获取PDF失败:', error));
  };

  useEffect(() => {
    fetchPdfs();
  }, [page, pageSize]);

  const handleOpenEdit = (pdf: ProductPDF) => {
    if (!canEditPdf(pdf.id)) return;
    setSelectedPdf(pdf);
    setOpenEdit(true);
  };
  
  const handleOpenDelete = (pdf: ProductPDF) => {
    if (!canEditPdf(pdf.id)) return;
    setPdfToDelete(pdf);
    setOpenDelete(true);
  };
  
  const handleOpenAdd = () => {
    setOpenAdd(true);
  };
  
  const handleClose = () => { 
    setOpenEdit(false); 
    setSelectedPdf(null); 
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setPdfToDelete(null);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
    setNewPdf({
      name: '',
      pdfUrl: '',
      pageCount: 0,
      discountFactor: 1
    });
  };

  const handleSave = async () => {
    if (!selectedPdf) return;

    // 直接从cookie获取token
    const token = getTokenFromCookie();
    
    if (!token) {
      console.error('未找到认证令牌');
      handleClose();
      return;
    }
    
    await fetch(`/api/pdf/${selectedPdf.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(selectedPdf),
    });
    
    handleClose();
    fetchPdfs();
  };

  const handleCreate = async () => {
    const token = getTokenFromCookie();
    
    if (!token) {
      console.error('未找到认证令牌');
      handleCloseAdd();
      return;
    }
    
    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPdf),
      });
      
      if (!response.ok) {
        throw new Error('创建PDF失败');
      }
      
      handleCloseAdd();
      fetchPdfs();
    } catch (error) {
      console.error('创建PDF时出错:', error);
    }
  };

  const handleDelete = async () => {
    if (!pdfToDelete) return;
    
    const token = getTokenFromCookie();
    if (!token) {
      console.error('未找到认证令牌');
      handleCloseDelete();
      return;
    }
    try {
      const response = await fetch(`/api/pdf/${pdfToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除PDF失败');
      }
      
      if (pdfs.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchPdfs();
      }
    } catch (error) {
      console.error('删除PDF时出错:', error);
    } finally {
      handleCloseDelete();
    }
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // 重置查询条件
  const resetSearch = () => {
    setSearchName('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  return (
    <Paper sx={{ 
      p: 2, 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: 2,
      boxShadow: 3
    }}>
      {/* 顶部工具栏 - 新增按钮和查询表单 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{ 
            backgroundColor: '#4caf50',
            '&:hover': { backgroundColor: '#388e3c' }
          }}
        >
          新增PDF
        </Button>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <TextField
            size="small"
            placeholder="搜索PDF名称"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchName && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchName('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 250 }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>创建时间:</Typography>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="开始日期"
              className="date-picker"
              wrapperClassName="date-picker-wrapper"
              customInput={
                <TextField 
                  size="small" 
                  sx={{ width: 150 }} 
                  InputProps={{ readOnly: true }}
                />
              }
            />
            <Typography variant="body2">至</Typography>
            <DatePicker
              selected={endDate}
              onChange={(date: any) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText="结束日期"
              className="date-picker"
              wrapperClassName="date-picker-wrapper"
              customInput={
                <TextField 
                  size="small" 
                  sx={{ width: 150 }} 
                  InputProps={{ readOnly: true }}
                />
              }
            />
          </Box>
          
          <Button 
            variant="contained" 
            onClick={fetchPdfs}
            startIcon={<Search />}
            sx={{ backgroundColor: '#1976d2' }}
          >
            查询
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={resetSearch}
            startIcon={<Clear />}
          >
            重置
          </Button>
        </Box>
      </Box>
      
      <TableContainer sx={{ 
        flex: 1,
        overflowX: 'auto',
        position: 'relative',
        borderRadius: 1
      }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow >
              <TableCell sx={{ minWidth: 80, fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>名称</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>页数</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>折扣系数</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>创建日期</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>更新日期</TableCell>
              <TableCell sx={{ 
                minWidth: 150,
                position: 'sticky',
                right: 0,
                zIndex: 1,
                fontWeight: 'bold'
              }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pdfs.map(pdf => (
              <TableRow key={pdf.id} hover>
                <TableCell>{pdf.id}</TableCell>
                <TableCell>
                  <Tooltip title={pdf.name} placement="top">
                    <Typography sx={{ maxWidth: 200 }} noWrap>
                      {pdf.name}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>{pdf.pageCount}</TableCell>
                <TableCell>{pdf.discountFactor.toFixed(2)}</TableCell>
                <TableCell>{formatDate(pdf.createdAt)}</TableCell>
                <TableCell>{formatDate(pdf.updatedAt)}</TableCell>
                <TableCell sx={{ 
                  position: 'sticky',
                  right: 0,
                  backgroundColor: 'background.paper',
                  zIndex: 1
                }}>
                  <Tooltip title="查看PDF">
                    <IconButton 
                      component={Link} 
                      href={pdf.pdfUrl} 
                      target="_blank"
                      rel="noopener"
                      sx={{ color: '#2196f3' }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={canEditPdf(pdf.id) ? "编辑" : "无编辑权限"}>
                    <span>
                      <IconButton 
                        onClick={() => handleOpenEdit(pdf)}
                        disabled={!canEditPdf(pdf.id)}
                        sx={{ color: canEditPdf(pdf.id) ? '#ff9800' : '#bdbdbd' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title={canEditPdf(pdf.id) ? "删除" : "无删除权限"}>
                    <span>
                      <IconButton 
                        onClick={() => handleOpenDelete(pdf)}
                        disabled={!canEditPdf(pdf.id)}
                        sx={{ color: canEditPdf(pdf.id) ? '#f44336' : '#bdbdbd' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mt: 2,
        flexWrap: 'wrap'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">每页行数:</Typography>
          <Select
            value={pageSize}
            onChange={handlePageSizeChange}
            size="small"
            sx={{ 
              height: 32,
              '& .MuiSelect-select': { py: 0.5 }
            }}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </Box>
        
        <Stack direction="row" spacing={2} alignItems="center">
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(_, v) => setPage(v)} 
            size="small"
            sx={{ mt: 1 }}
            color="primary"
          />
        </Stack>
      </Box>

      {/* 编辑PDF对话框 */}
      <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle >
          编辑PDF
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TextField
            margin="dense"
            label="名称"
            fullWidth
            value={selectedPdf?.name || ''}
            onChange={e => selectedPdf && setSelectedPdf({ ...selectedPdf, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="PDF URL"
            fullWidth
            value={selectedPdf?.pdfUrl || ''}
            onChange={e => selectedPdf && setSelectedPdf({ ...selectedPdf, pdfUrl: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="页数"
            fullWidth
            type="number"
            value={selectedPdf?.pageCount || 0}
            onChange={e => selectedPdf && setSelectedPdf({ 
              ...selectedPdf, 
              pageCount: parseInt(e.target.value) || 0 
            })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="折扣系数"
            fullWidth
            type="number"
            step="0.01"
            value={selectedPdf?.discountFactor || 1}
            onChange={e => selectedPdf && setSelectedPdf({ 
              ...selectedPdf, 
              discountFactor: parseFloat(e.target.value) || 1 
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">取消</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#4caf50' }}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 新增PDF对话框 */}
      <Dialog open={openAdd} onClose={handleCloseAdd} fullWidth maxWidth="sm">
        <DialogTitle >
          新增PDF
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TextField
            margin="dense"
            label="名称"
            fullWidth
            value={newPdf.name}
            onChange={e => setNewPdf({ ...newPdf, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="PDF URL"
            fullWidth
            value={newPdf.pdfUrl}
            onChange={e => setNewPdf({ ...newPdf, pdfUrl: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="页数"
            fullWidth
            type="number"
            value={newPdf.pageCount}
            onChange={e => setNewPdf({ 
              ...newPdf, 
              pageCount: parseInt(e.target.value) || 0 
            })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="折扣系数"
            fullWidth
            type="number"
            step="0.01"
            value={newPdf.discountFactor}
            onChange={e => setNewPdf({ 
              ...newPdf, 
              discountFactor: parseFloat(e.target.value) || 1 
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd} variant="outlined">取消</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ backgroundColor: '#4caf50' }}>创建</Button>
        </DialogActions>
      </Dialog>

      {/* 删除PDF确认对话框 */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle >
          确认删除PDF
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1">
            确定要删除PDF <strong>{pdfToDelete?.name}</strong> (ID: {pdfToDelete?.id}) 吗？此操作不可逆。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} variant="outlined">取消</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
      
      <style jsx global>{`
        .date-picker-wrapper {
          display: inline-block;
        }
        .date-picker {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
        }
      `}</style>
    </Paper>
  );
}