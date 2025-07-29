"use client"
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Pagination, Box, Typography, InputAdornment, Chip,
  Breadcrumbs, Link, Card, CardContent, Grid, Divider
} from '@mui/material';
import { Edit, Delete, Add, Search, Clear, ArrowBack, LocationOn, Business, History, Download, Visibility } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';

interface Version {
  id: number;
  version: string;
  description: string;
  status: string;
  creator: string;
  fileSize: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Region {
  id: number;
  name: string;
  description: string;
  address: string;
  status: string;
  manager: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

export default function RegionVersionsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const regionId = params.regionId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<Version | null>(null);
  const [newVersion, setNewVersion] = useState<Omit<Version, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>>({
    version: '',
    description: '',
    status: '草稿',
    creator: '',
    fileSize: ''
  });
  const [pageSize, setPageSize] = useState(10);
  const [searchVersion, setSearchVersion] = useState('');

  // 模拟项目数据
  const mockProjects: Record<string, Project> = {
    '1': { id: 1, name: 'BOKE', description: '博科项目' },
    '2': { id: 2, name: 'BKHQ', description: '博科总部项目' },
    '3': { id: 3, name: 'SHZX', description: '上海中心项目' }
  };

  // 模拟区域数据
  const mockRegions: Record<string, Record<string, Region>> = {
    '1': {
      '1': { id: 1, name: '华东区域', description: '华东地区业务区域', address: '上海市浦东新区', status: '进行中', manager: '陈主管' },
      '2': { id: 2, name: '华南区域', description: '华南地区业务区域', address: '广州市天河区', status: '进行中', manager: '刘主管' },
      '3': { id: 3, name: '华北区域', description: '华北地区业务区域', address: '北京市朝阳区', status: '待开始', manager: '赵主管' },
      '4': { id: 4, name: '西南区域', description: '西南地区业务区域', address: '成都市高新区', status: '已完成', manager: '孙主管' }
    },
    '2': {
      '5': { id: 5, name: '总部大楼A区', description: '总部办公区域A', address: '上海市静安区南京西路', status: '进行中', manager: '周主管' },
      '6': { id: 6, name: '总部大楼B区', description: '总部办公区域B', address: '上海市静安区南京西路', status: '进行中', manager: '吴主管' }
    },
    '3': {
      '7': { id: 7, name: '上海中心东塔', description: '东塔办公区域', address: '上海市浦东新区陆家嘴', status: '待开始', manager: '郑主管' },
      '8': { id: 8, name: '上海中心西塔', description: '西塔办公区域', address: '上海市浦东新区陆家嘴', status: '待开始', manager: '钱主管' }
    }
  };

  // 模拟版本数据
  const mockVersions: Record<string, Version[]> = {
    '1': [
      { id: 1, version: 'v1.0.0', description: '初始版本', status: '已发布', creator: '张开发', fileSize: '2.5MB', downloadCount: 15, createdAt: '2025-07-20T00:00:00Z', updatedAt: '2025-07-20T00:00:00Z' },
      { id: 2, version: 'v1.1.0', description: '功能优化版本', status: '已发布', creator: '李开发', fileSize: '2.8MB', downloadCount: 8, createdAt: '2025-07-25T00:00:00Z', updatedAt: '2025-07-25T00:00:00Z' },
      { id: 3, version: 'v1.2.0', description: '修复bug版本', status: '测试中', creator: '王开发', fileSize: '3.1MB', downloadCount: 0, createdAt: '2025-07-28T00:00:00Z', updatedAt: '2025-07-28T00:00:00Z' }
    ],
    '2': [
      { id: 4, version: 'v2.0.0', description: '重构版本', status: '已发布', creator: '陈开发', fileSize: '4.2MB', downloadCount: 22, createdAt: '2025-07-15T00:00:00Z', updatedAt: '2025-07-15T00:00:00Z' },
      { id: 5, version: 'v2.1.0', description: '新增功能', status: '草稿', creator: '刘开发', fileSize: '4.5MB', downloadCount: 0, createdAt: '2025-07-26T00:00:00Z', updatedAt: '2025-07-26T00:00:00Z' }
    ],
    '3': [
      { id: 6, version: 'v3.0.0', description: '全新架构', status: '开发中', creator: '赵开发', fileSize: '5.1MB', downloadCount: 0, createdAt: '2025-07-22T00:00:00Z', updatedAt: '2025-07-22T00:00:00Z' }
    ]
  };

  const fetchData = () => {
    const currentProject = mockProjects[projectId];
    const currentRegion = mockRegions[projectId]?.[regionId];
    const currentVersions = mockVersions[regionId] || [];

    setProject(currentProject);
    setRegion(currentRegion);

    const filteredVersions = currentVersions.filter(version =>
      version.version.toLowerCase().includes(searchVersion.toLowerCase()) ||
      version.description.toLowerCase().includes(searchVersion.toLowerCase())
    );
    setVersions(filteredVersions);
    setTotalPages(Math.ceil(filteredVersions.length / pageSize));
  };

  useEffect(() => {
    fetchData();
  }, [projectId, regionId, page, pageSize, searchVersion]);

  const handleOpenEdit = (version: Version) => {
    setSelectedVersion(version);
    setOpenEdit(true);
  };

  const handleOpenDelete = (version: Version) => {
    setVersionToDelete(version);
    setOpenDelete(true);
  };

  const handleOpenAdd = () => {
    setOpenAdd(true);
  };

  const handleClose = () => {
    setOpenEdit(false);
    setSelectedVersion(null);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setVersionToDelete(null);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
    setNewVersion({
      version: '',
      description: '',
      status: '草稿',
      creator: '',
      fileSize: ''
    });
  };

  const handleSave = () => {
    console.log('保存版本:', selectedVersion);
    handleClose();
    fetchData();
  };

  const handleCreate = () => {
    console.log('创建版本:', newVersion);
    handleCloseAdd();
    fetchData();
  };

  const handleDelete = () => {
    console.log('删除版本:', versionToDelete);
    handleCloseDelete();
    fetchData();
  };

  const handleDownload = (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('下载版本:', version);
    // 这里可以增加下载计数
  };

  const handlePreview = (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('预览版本:', version);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已发布': return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
      case '测试中': return { backgroundColor: '#fff3e0', color: '#f57c00' };
      case '开发中': return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case '草稿': return { backgroundColor: '#f5f5f5', color: '#666' };
      default: return { backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  if (!project || !region) {
    return <Typography>项目或区域不存在</Typography>;
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
        <Link
          component="button"
          variant="body1"
          onClick={() => router.push(`/projects/${projectId}`)}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <LocationOn sx={{ mr: 0.5 }} fontSize="inherit" />
          {project.name}
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <History sx={{ mr: 0.5 }} fontSize="inherit" />
          {region.name} - 版本历史
        </Typography>
      </Breadcrumbs>

      {/* 项目和区域信息卡片 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                项目信息
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {project.name} - {project.description}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                区域信息
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {region.name} - {region.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  负责人: {region.manager}
                </Typography>
                <Chip
                  label={region.status}
                  size="small"
                  sx={{
                    ...getStatusColor(region.status),
                    fontWeight: 'medium'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              版本历史
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              返回区域列表
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{
        p: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 400px)',
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
            新增版本
          </Button>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <TextField
              size="small"
              placeholder="搜索版本号或描述"
              value={searchVersion}
              onChange={(e) => setSearchVersion(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchVersion && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchVersion('')}>
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
              onClick={() => setSearchVersion('')}
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
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 80, fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>版本号</TableCell>
                <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>描述</TableCell>
                <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>状态</TableCell>
                <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>创建者</TableCell>
                <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>文件大小</TableCell>
                <TableCell sx={{ minWidth: 100, fontWeight: 'bold' }}>下载次数</TableCell>
                <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>创建时间</TableCell>
                <TableCell sx={{
                  minWidth: 180,
                  position: 'sticky',
                  right: 0,
                  zIndex: 1,
                  fontWeight: 'bold',
                  backgroundColor: 'white'
                }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map(version => (
                <TableRow key={version.id} hover>
                  <TableCell>{version.id}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                      {version.version}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {version.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={version.status}
                      size="small"
                      sx={{
                        ...getStatusColor(version.status),
                        fontWeight: 'medium',
                        fontSize: '0.75rem'
                      }}
                    />
                  </TableCell>
                  <TableCell>{version.creator}</TableCell>
                  <TableCell>{version.fileSize}</TableCell>
                  <TableCell>
                    <Typography sx={{ color: version.downloadCount > 0 ? '#1976d2' : '#666' }}>
                      {version.downloadCount}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(version.createdAt)}</TableCell>
                  <TableCell sx={{
                    position: 'sticky',
                    right: 0,
                    backgroundColor: 'white',
                    zIndex: 1
                  }}>
                    <IconButton
                      size="small"
                      onClick={(e) => handlePreview(version, e)}
                      sx={{ mr: 0.5 }}
                      title="预览"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDownload(version, e)}
                      sx={{ mr: 0.5 }}
                      title="下载"
                      disabled={version.status === '草稿'}
                    >
                      <Download fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(version);
                      }}
                      sx={{ mr: 0.5 }}
                      title="编辑"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDelete(version);
                      }}
                      title="删除"
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

        {/* 新增版本对话框 */}
        <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
          <DialogTitle>新增版本</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="版本号"
              fullWidth
              variant="outlined"
              value={newVersion.version}
              onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="如: v1.0.0"
            />
            <TextField
              margin="dense"
              label="版本描述"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={newVersion.description}
              onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="创建者"
              fullWidth
              variant="outlined"
              value={newVersion.creator}
              onChange={(e) => setNewVersion({ ...newVersion, creator: e.target.value })}
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
