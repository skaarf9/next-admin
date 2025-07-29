"use client"
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Pagination, Stack, MenuItem, Select, SelectChangeEvent,
  Tooltip, Box, Typography, Grid, InputAdornment, FormControl, InputLabel
} from '@mui/material';
import { Edit, Delete, Add, Search, Clear } from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Brand {
  id: number;
  name: string;
  country: string;
  discount: number;
  contact: string;
  createdAt: string;
  updatedAt: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [newBrand, setNewBrand] = useState<Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    country: '',
    discount: 0,
    contact: ''
  });
  const [pageSize, setPageSize] = useState(10);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [brandPermissions, setBrandPermissions] = useState<any[]>([]);
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
      setBrandPermissions(payload.brandPermissions || []);
    } catch (error) {
      console.error('JWT解析失败:', error);
    }
  }, []);

  const canEditBrand = (brandId: number) => {
    if (isAdmin) return true;

    // 查找特定品牌的权限
    const permission = brandPermissions.find(p => p.brandId === brandId);
    return permission?.canEdit || false;
  };

  const fetchBrands = () => {
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

    fetch(`/api/brands?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('返回的不是JSON格式');
        }
        return res.json();
      })
      .then(json => {
        setBrands(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
      })
      .catch(error => {
        console.error('获取品牌失败:', error);
        // 设置默认值避免页面崩溃
        setBrands([]);
        setTotalPages(1);
      });
  };

  useEffect(() => {
    fetchBrands();
  }, [page, pageSize]);

  const handleOpenEdit = (brand: Brand) => {
    if (!canEditBrand(brand.id)) return;
    setSelectedBrand(brand);
    setOpenEdit(true);
  };

  const handleOpenDelete = (brand: Brand) => {
    if (!canEditBrand(brand.id)) return;
    setBrandToDelete(brand);
    setOpenDelete(true);
  };

  const handleOpenAdd = () => {
    setOpenAdd(true);
  };

  const handleClose = () => {
    setOpenEdit(false);
    setSelectedBrand(null);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setBrandToDelete(null);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
    setNewBrand({
      name: '',
      country: '',
      discount: 0,
      contact: ''
    });
  };

  const handleSave = async () => {
    if (!selectedBrand) return;

    // 直接从cookie获取token
    const token = getTokenFromCookie();

    if (!token) {
      console.error('未找到认证令牌');
      handleClose();
      return;
    }

    await fetch(`/api/brands/${selectedBrand.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(selectedBrand),
    });

    handleClose();
    fetchBrands();
  };

  const handleCreate = async () => {
    const token = getTokenFromCookie();

    if (!token) {
      console.error('未找到认证令牌');
      handleCloseAdd();
      return;
    }

    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBrand),
      });

      if (!response.ok) {
        throw new Error('创建品牌失败');
      }

      handleCloseAdd();
      fetchBrands();
    } catch (error) {
      console.error('创建品牌时出错:', error);
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    const token = getTokenFromCookie();
    if (!token) {
      console.error('未找到认证令牌');
      handleCloseDelete();
      return;
    }
    try {
      const response = await fetch(`/api/brands/${brandToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('删除品牌失败');
      }

      if (brands.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchBrands();
      }
    } catch (error) {
      console.error('删除品牌时出错:', error);
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
          新增品牌
        </Button>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <TextField
            size="small"
            placeholder="搜索品牌名称"
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
            onClick={fetchBrands}
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
              <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>品牌名</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>国家</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>折扣(%)</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>联系人</TableCell>
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
            {brands.map(brand => (
              <TableRow key={brand.id} hover>
                <TableCell>{brand.id}</TableCell>
                <TableCell>
                  <Tooltip title={brand.name} placement="top">
                    <Typography sx={{ maxWidth: 200 }} noWrap>
                      {brand.name}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>{brand.country}</TableCell>
                <TableCell>{brand.discount}%</TableCell>
                <TableCell>{brand.contact}</TableCell>
                <TableCell>{formatDate(brand.createdAt)}</TableCell>
                <TableCell>{formatDate(brand.updatedAt)}</TableCell>
                <TableCell sx={{
                  position: 'sticky',
                  right: 0,
                  backgroundColor: 'background.paper',
                  zIndex: 1
                }}>
                  <Tooltip title={canEditBrand(brand.id) ? "编辑" : "无编辑权限"}>
                    <span>
                      <IconButton
                        onClick={() => handleOpenEdit(brand)}
                        disabled={!canEditBrand(brand.id)}
                        sx={{ color: canEditBrand(brand.id) ? '#ff9800' : '#bdbdbd' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  <Tooltip title={canEditBrand(brand.id) ? "删除" : "无删除权限"}>
                    <span>
                      <IconButton
                        onClick={() => handleOpenDelete(brand)}
                        disabled={!canEditBrand(brand.id)}
                        sx={{ color: canEditBrand(brand.id) ? '#f44336' : '#bdbdbd' }}
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

      {/* 编辑品牌对话框 */}
      <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle >
          编辑品牌
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TextField
            margin="dense"
            label="品牌名"
            fullWidth
            value={selectedBrand?.name || ''}
            onChange={e => selectedBrand && setSelectedBrand({ ...selectedBrand, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="国家"
            fullWidth
            value={selectedBrand?.country || ''}
            onChange={e => selectedBrand && setSelectedBrand({ ...selectedBrand, country: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="折扣(%)"
            fullWidth
            type="number"
            value={selectedBrand?.discount || 0}
            onChange={e => selectedBrand && setSelectedBrand({
              ...selectedBrand,
              discount: parseInt(e.target.value) || 0
            })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="联系人"
            fullWidth
            value={selectedBrand?.contact || ''}
            onChange={e => selectedBrand && setSelectedBrand({
              ...selectedBrand,
              contact: e.target.value
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">取消</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#4caf50' }}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 新增品牌对话框 */}
      <Dialog open={openAdd} onClose={handleCloseAdd} fullWidth maxWidth="sm">
        <DialogTitle >
          新增品牌
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TextField
            margin="dense"
            label="品牌名"
            fullWidth
            value={newBrand.name}
            onChange={e => setNewBrand({ ...newBrand, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="国家"
            fullWidth
            value={newBrand.country}
            onChange={e => setNewBrand({ ...newBrand, country: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="折扣(%)"
            fullWidth
            type="number"
            value={newBrand.discount}
            onChange={e => setNewBrand({
              ...newBrand,
              discount: parseInt(e.target.value) || 0
            })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="联系人"
            fullWidth
            value={newBrand.contact}
            onChange={e => setNewBrand({
              ...newBrand,
              contact: e.target.value
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd} variant="outlined">取消</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ backgroundColor: '#4caf50' }}>创建</Button>
        </DialogActions>
      </Dialog>

      {/* 删除品牌确认对话框 */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle >
          确认删除品牌
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1">
            确定要删除品牌 <strong>{brandToDelete?.name}</strong> (ID: {brandToDelete?.id}) 吗？此操作不可逆。
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
