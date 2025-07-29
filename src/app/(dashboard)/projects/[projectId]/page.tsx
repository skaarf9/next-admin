"use client"
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Pagination, Box, Typography, InputAdornment, Chip,
  Breadcrumbs, Link, Card, CardContent, Grid
} from '@mui/material';
import { Edit, Delete, Add, Search, Clear, ArrowBack, LocationOn, Business } from '@mui/icons-material';
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

  const [project, setProject] = useState<Project | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionToDelete, setRegionToDelete] = useState<Region | null>(null);
  const [newRegion, setNewRegion] = useState<Omit<Region, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    address: '',
    status: '待开始',
    manager: ''
  });
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState('');

  // 模拟项目数据
  const mockProjects: Record<string, Project> = {
    '1': { id: 1, name: 'BOKE', description: '博科项目', manager: '张经理', status: '进行中' },
    '2': { id: 2, name: 'BKHQ', description: '博科总部项目', manager: '李经理', status: '进行中' },
    '3': { id: 3, name: 'SHZX', description: '上海中心项目', manager: '王经理', status: '待开始' }
  };

  // 模拟区域数据
  const mockRegions: Record<string, Region[]> = {
    '1': [
      { id: 1, name: '华东区域', description: '华东地区业务区域', address: '上海市浦东新区', status: '进行中', manager: '陈主管', createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' },
      { id: 2, name: '华南区域', description: '华南地区业务区域', address: '广州市天河区', status: '进行中', manager: '刘主管', createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' },
      { id: 3, name: '华北区域', description: '华北地区业务区域', address: '北京市朝阳区', status: '待开始', manager: '赵主管', createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' },
      { id: 4, name: '西南区域', description: '西南地区业务区域', address: '成都市高新区', status: '已完成', manager: '孙主管', createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' }
    ],
    '2': [
      { id: 5, name: '总部大楼A区', description: '总部办公区域A', address: '上海市静安区南京西路', status: '进行中', manager: '周主管', createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' },
      { id: 6, name: '总部大楼B区', description: '总部办公区域B', address: '上海市静安区南京西路', status: '进行中', manager: '吴主管', createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' }
    ],
    '3': [
      { id: 7, name: '上海中心东塔', description: '东塔办公区域', address: '上海市浦东新区陆家嘴', status: '待开始', manager: '郑主管', createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' },
      { id: 8, name: '上海中心西塔', description: '西塔办公区域', address: '上海市浦东新区陆家嘴', status: '待开始', manager: '钱主管', createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' }
    ]
  };

  const fetchData = () => {
    const currentProject = mockProjects[projectId];
    const currentRegions = mockRegions[projectId] || [];

    setProject(currentProject);

    const filteredRegions = currentRegions.filter(region =>
      region.name.toLowerCase().includes(searchName.toLowerCase())
    );
    setRegions(filteredRegions);
    setTotalPages(Math.ceil(filteredRegions.length / pageSize));
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
      status: '待开始',
      manager: ''
    });
  };

  const handleSave = () => {
    console.log('保存区域:', selectedRegion);
    handleClose();
    fetchData();
  };

  const handleCreate = () => {
    console.log('创建区域:', newRegion);
    handleCloseAdd();
    fetchData();
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
      case '进行中': return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case '已完成': return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case '待开始': return { backgroundColor: '#fff3e0', color: '#f57c00' };
      default: return { backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  const handleRowClick = (regionId: number) => {
    router.push(`/projects/${projectId}/${regionId}`);
  };

  if (!project) {
    return <Typography>项目不存在</Typography>;
  }

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
