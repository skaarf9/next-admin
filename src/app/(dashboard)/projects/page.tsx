"use client"
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Pagination, Stack, MenuItem, Select, SelectChangeEvent,
  Tooltip, Box, Typography, Grid, InputAdornment, FormControl, InputLabel,
  Chip, Tabs, Tab
} from "@mui/material";
import { Edit, Delete, Add, Search, Clear, FolderOpen } from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from 'next/navigation';
// 在文件顶部导入
import CostAnalysisModal from '@/components/cost/CostAnalysisModal';
import { Analytics } from '@mui/icons-material';

// 1. 修改接口定义（第24行左右）
interface Project {
  id: number;
  name: string;
  description: string | null;
  regionCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  manager: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [openPreview, setOpenPreview] = useState(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [previewTab, setPreviewTab] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    regionCount: 0,
    status: 'PENDING',
    manager: ''
  });
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);


  // 2. 在组件内部添加状态映射（第45行左右，fetchProjects函数前）
  const statusMap = {
    'PENDING': '待开始',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'PAUSED': '暂停'
  };

  const statusOptions = [
    { value: 'PENDING', label: '待开始' },
    { value: 'IN_PROGRESS', label: '进行中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'PAUSED', label: '暂停' }
  ];

  const fetchProjects = async () => {
    try {
      // setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchName && { searchName })
      });

      const response = await fetch(`/api/projects?${params}`);
      const result = await response.json();

      if (response.ok) {
        setProjects(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        console.error('获取项目列表失败:', result.error);
      }
    } catch (error) {
      console.error('请求失败:', error);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, pageSize, searchName]);

  const handleOpenEdit = (project: Project) => {
    setSelectedProject(project);
    setOpenEdit(true);
  };

  const handleOpenDelete = (project: Project) => {
    setProjectToDelete(project);
    setOpenDelete(true);
  };

  const handleOpenAdd = () => {
    setOpenAdd(true);
  };

  const handleClose = () => {
    setOpenEdit(false);
    setSelectedProject(null);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setProjectToDelete(null);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
    setNewProject({
      name: '',
      description: '',
      regionCount: 0,
      status: 'PENDING',
      manager: ''
    });
  };

  const handleSave = async () => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedProject.name,
          description: selectedProject.description,
          status: selectedProject.status,
          manager: selectedProject.manager
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('保存项目成功:', result);
        handleClose();
        fetchProjects();
      } else {
        console.error('保存项目失败:', result.error);
      }
    } catch (error) {
      console.error('保存项目失败:', error);
    } finally {
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description,
          status: newProject.status,
          manager: newProject.manager
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('创建项目成功:', result);
        handleCloseAdd();
        fetchProjects();
      } else {
        console.error('创建项目失败:', result.error);
      }
    } catch (error) {
      console.error('创建项目失败:', error);
    } finally {
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        console.log('删除项目成功:', result);
        handleCloseDelete();
        fetchProjects();
      } else {
        console.error('删除项目失败:', result.error);
      }
    } catch (error) {
      console.error('删除项目失败:', error);
    } finally {
    }
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };
  const handleOpenPreview = (project: Project) => {
    setPreviewProject(project);
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setPreviewProject(null);
  };
  const resetSearch = () => {
    setSearchName('');
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case 'COMPLETED': return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case 'PENDING': return { backgroundColor: '#fff3e0', color: '#f57c00' };
      case 'PAUSED': return { backgroundColor: '#ffebee', color: '#d32f2f' };
      default: return { backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  const handleRowClick = (projectId: number) => {
    router.push(`/projects/${projectId}`);
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
          新增项目
        </Button>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <TextField
            size="small"
            placeholder="搜索项目名称"
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
            onClick={fetchProjects}
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
            <TableRow>
              <TableCell sx={{ minWidth: 80, fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>项目名称</TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>区域数量</TableCell>
              <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>状态</TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>项目经理</TableCell>
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
            {projects.map(project => (
              <TableRow
                key={project.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(project.id)}
              >
                <TableCell>{project.id}</TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 'medium', mb: 0.5 }}>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {project.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderOpen sx={{ mr: 1, color: '#666', fontSize: '1rem' }} />
                    <Typography>{project.regionCount} 个区域</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusMap[project.status as keyof typeof statusMap]}
                    size="small"
                    sx={{
                      ...getStatusColor(project.status),
                      fontWeight: 'medium',
                      fontSize: '0.75rem'
                    }}
                  />
                </TableCell>
                <TableCell>{project.manager}</TableCell>
                <TableCell>{formatDate(project.createdAt)}</TableCell>
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
                      handleOpenEdit(project);
                    }}
                    sx={{ mr: 1 }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDelete(project);
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
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 2,
        pt: 2,
        borderTop: '1px solid #eee'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">每页显示:</Typography>
          <Select
            size="small"
            value={pageSize}
            onChange={handlePageSizeChange}
            sx={{ minWidth: 80 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </Box>
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
                <Tab label="区域明细" />
                <Tab label="品牌统计" />
                <Tab label="家具种类" />
              </Tabs>
            </Box>

            {previewTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    区域明细
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="4个区域" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
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
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>区域名称</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>家具数量</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>品牌数</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>种类数</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>成本金额</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>售价金额</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>毛利金额</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>毛利率</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { name: '办公区域A', count: 320, brands: 8, categories: 12, cost: 218000, price: 327000, profit: 109000 },
                        { name: '会议室B', count: 180, brands: 5, categories: 8, cost: 156000, price: 234000, profit: 78000 },
                        { name: '休息区C', count: 245, brands: 6, categories: 10, cost: 167000, price: 250500, profit: 83500 },
                        { name: '接待区D', count: 505, brands: 10, categories: 15, cost: 315000, price: 472500, profit: 157500 }
                      ].map((region, index) => {
                        const profitRate = ((region.profit / region.cost) * 100).toFixed(1);
                        return (
                          <TableRow key={index} hover>
                            <TableCell><Typography sx={{ fontWeight: 'medium' }}>{region.name}</Typography></TableCell>
                            <TableCell align="center">
                              <Chip label={`${region.count} 件`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
                            </TableCell>
                            <TableCell align="center">{region.brands} 个</TableCell>
                            <TableCell align="center">{region.categories} 类</TableCell>
                            <TableCell align="right">
                              <Typography sx={{ color: '#f57c00', fontWeight: 'medium' }}>¥{(region.cost / 10000).toFixed(1)}万</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ color: '#2e7d32', fontWeight: 'medium' }}>¥{(region.price / 10000).toFixed(1)}万</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ color: '#7b1fa2', fontWeight: 'medium' }}>¥{(region.profit / 10000).toFixed(1)}万</Typography>
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

            {previewTab === 2 && (
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

      <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
        <DialogTitle>新增项目</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="项目名称"
            fullWidth
            variant="outlined"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="项目描述"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProject.description || ''}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>项目状态</InputLabel>
            <Select
              value={newProject.status}
              label="项目状态"
              onChange={(e) => setNewProject({ ...newProject, status: e.target.value as Project['status'] })}
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="项目经理"
            fullWidth
            variant="outlined"
            value={newProject.manager}
            onChange={(e) => setNewProject({ ...newProject, manager: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd}>取消</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!newProject.name || !newProject.manager}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEdit} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>编辑项目</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="项目名称"
            fullWidth
            variant="outlined"
            value={selectedProject?.name || ''}
            onChange={(e) => setSelectedProject(prev => prev ? { ...prev, name: e.target.value } : null)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="dense"
            label="项目描述"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={selectedProject?.description || ''}
            onChange={(e) => setSelectedProject(prev => prev ? { ...prev, description: e.target.value } : null)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>项目状态</InputLabel>
            <Select
              value={selectedProject?.status || 'PENDING'}
              label="项目状态"
              onChange={(e) => setSelectedProject(prev => prev ? { ...prev, status: e.target.value as Project['status'] } : null)}
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="项目经理"
            fullWidth
            variant="outlined"
            value={selectedProject?.manager || ''}
            onChange={(e) => setSelectedProject(prev => prev ? { ...prev, manager: e.target.value } : null)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!selectedProject?.name || !selectedProject?.manager}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除项目 &#34;{projectToDelete?.name}&#34; 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
