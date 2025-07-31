"use client"
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Pagination, Box, Typography, InputAdornment, Chip,
  Breadcrumbs, Link, Card, CardContent, Grid, Tooltip, Tabs, Tab
} from "@mui/material";
import { Edit, Delete, Add, Search, Clear, ArrowBack, LocationOn, Business, Analytics } from "@mui/icons-material";
import { useRouter, useParams } from 'next/navigation';

interface Region {
  id: number;
  name: string;
  description: string;
  address: string;
  status: string;
  manager: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  manager: string;
  status: string;
}

export default function ProjectRegionsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [page, setPage] = useState(1);
  const [previewTab, setPreviewTab] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionToDelete, setRegionToDelete] = useState<Region | null>(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [newRegion, setNewRegion] = useState<Omit<Region, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    address: '',
    status: 'PENDING',
    manager: ''
  });
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState('');

// 2. 添加处理函数（第130行左右，其他处理函数后面）
  const handleOpenPreview = (project: Project) => {
    setPreviewProject(project);
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setPreviewProject(null);
  };
  const fetchData = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchName && { searchName })
      });

      // 并行请求项目信息和区域列表
      const [projectResponse, regionsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/regions?${params}`)
      ]);

      console.log('项目响应:', projectResponse);
      console.log('区域响应:', regionsResponse);

      // 处理项目信息
      if (projectResponse.ok) {
        const projectResult = await projectResponse.json();
        setProject(projectResult || null);
      } else {
        const projectError = await projectResponse.json();
        console.error('获取项目信息失败:', projectError.error);
      }

      // 处理区域列表
      if (regionsResponse.ok) {
        const regionsResult = await regionsResponse.json();
        console.log(regionsResult.data)
        setRegions(regionsResult.data || []);
        setTotalPages(regionsResult.pagination?.totalPages || 1);
      } else {
        const regionsError = await regionsResponse.json();
        console.error('获取区域列表失败:', regionsError.error);
        setRegions([]);
        setTotalPages(1);
      }

    } catch (error) {
      console.error('请求失败:', error);
      setProject(null);
      setRegions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, page, pageSize, searchName]);

  const handleOpenEdit = (region: Region) => {
    setSelectedRegion(region);
    setOpenEdit(true);
  };

  const handleOpenDelete = (region: Region) => {
    setRegionToDelete(region);
    setOpenDelete(true);
  };

  const handleOpenAdd = () => {
    setOpenAdd(true);
  };

  const handleClose = () => {
    setOpenEdit(false);
    setSelectedRegion(null);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setRegionToDelete(null);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
    setNewRegion({
      name: '',
      description: '',
      address: '',
      status: 'PENDING',
      manager: ''
    });
  };


  const handleCreate = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/projects/${projectId}/regions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRegion,
          // id: parseInt(projectId)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建失败');
      }

      const result = await response.json();
      console.log('创建区域成功:', result);

      // 重置表单
      setNewRegion({ address: "", manager: "", status: "", name: '', description: '' });
      handleCloseAdd();

      // 刷新数据
      await fetchData();

    } catch (error) {
      console.error('创建区域失败:', error);
      // 可选：显示错误提示
      // toast.error(error.message || '创建区域失败');
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = () => {
    console.log('删除区域:', regionToDelete);
    handleCloseDelete();
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case 'COMPLETED': return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case 'PAUSED': return { backgroundColor: '#fff3e0', color: '#f57c00' };
      default: return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
    }
  };

  const handleRowClick = (regionId: number) => {
    router.push(`/projects/${projectId}/${regionId}`);
  };

  if (!project) {
    return <Typography>项目不存在</Typography>;
  }

  // @ts-ignore
  // @ts-ignore
  return (
    <Box sx={{ p: 2 }}>
      {/* 面包屑导航 */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => router.push('/projects')}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Business sx={{ mr: 0.5 }} fontSize="inherit" />
          项目管理
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOn sx={{ mr: 0.5 }} fontSize="inherit" />
          {project.name} - 区域列表
        </Typography>
      </Breadcrumbs>

      {/* 项目信息卡片 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                {project.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {project.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">
                  项目经理: {project.manager}
                </Typography>
                <Chip
                  label={project.status}
                  size="small"
                  sx={{
                    ...getStatusColor(project.status),
                    fontWeight: 'medium'
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => router.push('/projects')}
                >
                  返回项目列表
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{
        p: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 300px)',
        borderRadius: 2,
        boxShadow: 3
      }}>
        {/* 顶部工具栏 */}
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
            新增区域
          </Button>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <TextField
              size="small"
              placeholder="搜索区域名称"
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

            <Button
              variant="contained"
              onClick={fetchData}
              startIcon={<Search />}
              sx={{ backgroundColor: '#1976d2' }}
            >
              查询
            </Button>

            <Button
              variant="outlined"
              onClick={() => setSearchName('')}
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
              <TableRow>
                <TableCell sx={{ minWidth: 80, fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>区域名称</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>地址</TableCell>
                <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>状态</TableCell>
                <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>负责人</TableCell>
                <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>创建日期</TableCell>
                <TableCell sx={{
                  minWidth: 150,
                  position: 'sticky',
                  right: 0,
                  zIndex: 1,
                  fontWeight: 'bold',
                  backgroundColor: 'white'
                }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {regions.map(region => (
                <TableRow
                  key={region.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(region.id)}
                >
                  <TableCell>{region.id}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      {region.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {region.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ mr: 1, color: '#666', fontSize: '1rem' }} />
                      <Typography variant="body2">{region.address}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={region.status}
                      size="small"
                      sx={{
                        ...getStatusColor(region.status),
                        fontWeight: 'medium',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell>{region.manager}</TableCell>
                  <TableCell>{formatDate(region.createdAt)}</TableCell>
                  <TableCell sx={{
                    position: 'sticky',
                    right: 0,
                    backgroundColor: 'white',
                    zIndex: 1
                  }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPreview(project);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <Tooltip title="预览小计">
                        <Analytics fontSize="small" />
                      </Tooltip>
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(region);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDelete(region);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 分页 */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
          pt: 2,
          borderTop: '1px solid #eee'
        }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>


        <Dialog open={openPreview} onClose={handleClosePreview} maxWidth="xl" fullWidth>
          <DialogTitle>项目预览小计 - {previewProject?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ p: 2 }}>
              {/* 项目总览 */}
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                项目总览
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                    <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>1,250</Typography>
                    <Typography variant="body2" color="text.secondary">家具总数量（件）</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                    <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>¥85.6万</Typography>
                    <Typography variant="body2" color="text.secondary">总成本</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                    <Typography variant="h4" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>¥128.4万</Typography>
                    <Typography variant="body2" color="text.secondary">总售价</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                    <Typography variant="h4" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>¥42.8万</Typography>
                    <Typography variant="body2" color="text.secondary">毛利润</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Tab导航 */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={previewTab} onChange={(e, newValue) => setPreviewTab(newValue)}>
                  <Tab label="品牌统计" />
                  <Tab label="家具种类" />
                </Tabs>
              </Box>

              {previewTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      品牌统计
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label="12个品牌" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                      <Chip label="1,250件家具" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                      <Chip label="成本¥85.6万" size="small" sx={{ bgcolor: '#fff3e0', color: '#f57c00' }} />
                      <Chip label="售价¥128.4万" size="small" sx={{ bgcolor: '#e8f5e8', color: '#2e7d32' }} />
                      <Chip label="毛利¥42.8万" size="small" sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2' }} />
                    </Box>
                  </Box>

                  <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>品牌名称</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>家具数量</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>涉及区域</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>成本金额</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>售价金额</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>毛利金额</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>毛利率</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { name: '宜家(IKEA)', count: 385, regions: ['办公区域A', '休息区C'], cost: 245000, price: 367500, profit: 122500 },
                          { name: 'Herman Miller', count: 156, regions: ['会议室B', '接待区D'], cost: 198000, price: 297000, profit: 99000 },
                          { name: 'Steelcase', count: 298, regions: ['办公区域A', '接待区D'], cost: 167000, price: 250500, profit: 83500 },
                          { name: 'Haworth', count: 234, regions: ['会议室B', '休息区C'], cost: 134000, price: 201000, profit: 67000 },
                          { name: 'Knoll', count: 177, regions: ['接待区D'], cost: 112000, price: 168000, profit: 56000 }
                        ].map((brand, index) => {
                          const profitRate = ((brand.profit / brand.cost) * 100).toFixed(1);
                          return (
                            <TableRow key={index} hover>
                              <TableCell><Typography sx={{ fontWeight: 'medium' }}>{brand.name}</Typography></TableCell>
                              <TableCell align="center">
                                <Chip label={`${brand.count} 件`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                              </TableCell>
                              <TableCell align="center">{brand.regions.length} 个区域</TableCell>
                              <TableCell align="right">
                                <Typography sx={{ color: '#f57c00', fontWeight: 'medium' }}>¥{(brand.cost / 10000).toFixed(1)}万</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography sx={{ color: '#2e7d32', fontWeight: 'medium' }}>¥{(brand.price / 10000).toFixed(1)}万</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography sx={{ color: '#7b1fa2', fontWeight: 'medium' }}>¥{(brand.profit / 10000).toFixed(1)}万</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={`${profitRate}%`} size="small"
                                      sx={{ bgcolor: parseFloat(profitRate) > 40 ? '#e8f5e8' : '#fff3e0',
                                        color: parseFloat(profitRate) > 40 ? '#2e7d32' : '#f57c00' }} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {previewTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      家具种类统计
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label="18种家具" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                      <Chip label="1,250件家具" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                      <Chip label="成本¥85.6万" size="small" sx={{ bgcolor: '#fff3e0', color: '#f57c00' }} />
                      <Chip label="售价¥128.4万" size="small" sx={{ bgcolor: '#e8f5e8', color: '#2e7d32' }} />
                      <Chip label="毛利¥42.8万" size="small" sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2' }} />
                    </Box>
                  </Box>

                  <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>家具种类</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>数量</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>涉及品牌</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>涉及区域</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>成本金额</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>售价金额</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>毛利金额</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>毛利率</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { name: '办公椅', count: 456, brands: 8, regions: 4, cost: 298000, price: 447000, profit: 149000 },
                          { name: '办公桌', count: 234, brands: 6, regions: 4, cost: 187000, price: 280500, profit: 93500 },
                          { name: '会议桌', count: 45, brands: 4, regions: 2, cost: 89000, price: 133500, profit: 44500 },
                          { name: '文件柜', count: 167, brands: 5, regions: 3, cost: 78000, price: 117000, profit: 39000 },
                          { name: '沙发', count: 89, brands: 6, regions: 3, cost: 134000, price: 201000, profit: 67000 },
                          { name: '茶几', count: 67, brands: 4, regions: 2, cost: 45000, price: 67500, profit: 22500 },
                          { name: '书架', count: 123, brands: 3, regions: 3, cost: 67000, price: 100500, profit: 33500 },
                          { name: '接待台', count: 12, brands: 2, regions: 1, cost: 23000, price: 34500, profit: 11500 }
                        ].map((category, index) => {
                          const profitRate = ((category.profit / category.cost) * 100).toFixed(1);
                          return (
                            <TableRow key={index} hover>
                              <TableCell><Typography sx={{ fontWeight: 'medium' }}>{category.name}</Typography></TableCell>
                              <TableCell align="center">
                                <Chip label={`${category.count} 件`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                              </TableCell>
                              <TableCell align="center">{category.brands} 个</TableCell>
                              <TableCell align="center">{category.regions} 个</TableCell>
                              <TableCell align="right">
                                <Typography sx={{ color: '#f57c00', fontWeight: 'medium' }}>¥{(category.cost / 10000).toFixed(1)}万</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography sx={{ color: '#2e7d32', fontWeight: 'medium' }}>¥{(category.price / 10000).toFixed(1)}万</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography sx={{ color: '#7b1fa2', fontWeight: 'medium' }}>¥{(category.profit / 10000).toFixed(1)}万</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label={`${profitRate}%`} size="small"
                                      sx={{ bgcolor: parseFloat(profitRate) > 40 ? '#e8f5e8' : '#fff3e0',
                                        color: parseFloat(profitRate) > 40 ? '#2e7d32' : '#f57c00' }} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}


            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClosePreview} variant="outlined">关闭</Button>
            <Button variant="contained" sx={{ ml: 1 }}>导出报表</Button>
          </DialogActions>
        </Dialog>


        {/* 新增对话框 */}
        <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
          <DialogTitle>新增区域</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="区域名称"
              fullWidth
              variant="outlined"
              value={newRegion.name}
              onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="区域描述"
              fullWidth
              variant="outlined"
              value={newRegion.description}
              onChange={(e) => setNewRegion({ ...newRegion, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="地址"
              fullWidth
              variant="outlined"
              value={newRegion.address}
              onChange={(e) => setNewRegion({ ...newRegion, address: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="负责人"
              fullWidth
              variant="outlined"
              value={newRegion.manager}
              onChange={(e) => setNewRegion({ ...newRegion, manager: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAdd}>取消</Button>
            <Button onClick={handleCreate} variant="contained">创建</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
