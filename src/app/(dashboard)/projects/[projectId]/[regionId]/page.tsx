"use client"
import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Pagination,
  Box,
  Typography,
  InputAdornment,
  Chip,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select, MenuItem
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Search,
  Clear,
  ArrowBack,
  LocationOn,
  Business,
  History,
  Download,
  Visibility,
  Upload
} from "@mui/icons-material";
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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [targetCurrency, setTargetCurrency] = useState('CNY');
  const [exchangeRates, setExchangeRates] = useState({
    CNY: 1,
    USD: 0.14,
    EUR: 0.13,
    GBP: 0.11
  });
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
  const [loading, setLoading] = useState(false);
  const [newVersion, setNewVersion] = useState<Omit<Version, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>>({
    version: '',
    description: '',
    status: 'DRAFT',
    creator: '',
    fileSize: ''
  });
  const [pageSize, setPageSize] = useState(10);
  const [searchVersion, setSearchVersion] = useState('');

  const fetchData = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchVersion && { searchVersion })
      });

      // 并行请求项目信息、区域信息和版本列表
      const [projectResponse, regionResponse, versionsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/regions/${regionId}`),
        fetch(`/api/projects/${projectId}/regions/${regionId}/versions?${params}`)
      ]);

      // 处理项目信息
      if (projectResponse.ok) {
        const projectResult = await projectResponse.json();
        setProject(projectResult || null);
      } else {
        const projectError = await projectResponse.json();
        console.error('获取项目信息失败:', projectError.error);
      }

      // 处理区域信息
      if (regionResponse.ok) {
        const regionResult = await regionResponse.json();
        setRegion(regionResult || null);
      } else {
        const regionError = await regionResponse.json();
        console.error('获取区域信息失败:', regionError.error);
        setRegion(null);
      }

      // 处理版本列表
      if (versionsResponse.ok) {
        const versionsResult = await versionsResponse.json();
        setVersions(versionsResult.data || []);
        setTotalPages(Math.ceil((versionsResult.total || 0) / pageSize));
      } else {
        const versionsError = await versionsResponse.json();
        console.error('获取版本列表失败:', versionsError.error);
        setVersions([]);
        setTotalPages(1);
      }

    } catch (error) {
      console.error('请求失败:', error);
      setProject(null);
      setRegion(null);
      setVersions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
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
      status: 'DRAFT',
      creator: '',
      fileSize: ''
    });
  };


  const handleCreate = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/projects/${projectId}/regions/${regionId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVersion)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('创建版本成功:', result);
        handleCloseAdd();
        fetchData();
      } else {
        const error = await response.json();
        console.error('创建版本失败:', error.error);
        // 可选：显示错误提示
      }
    } catch (error) {
      console.error('创建版本请求失败:', error);
      // 可选：显示错误提示
    } finally {
      setLoading(false);
    }
  };



  const handleDownload = (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('下载版本:', version);
    // 这里可以增加下载计数
  };

  const handleExport = (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportDialogOpen(true);
  };

  const handleConfirmExport = () => {
    // 执行导出逻辑
    console.log('导出目标货币:', targetCurrency);
    console.log('汇率设置:', exchangeRates);
    setExportDialogOpen(false);
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

  // @ts-ignore
  return (
    <Box sx={{ p: 2 }}>
      {/* 面包屑导航 */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => router.push('/projects')}
          onMouseEnter={() => router.prefetch(`/projects`)}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Business sx={{ mr: 0.5 }} fontSize="inherit" />
          项目管理
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={() => router.push(`/projects/${projectId}`)}
          onMouseEnter={() => router.prefetch(`/projects/${projectId}`)}
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
              onMouseEnter={() => router.prefetch(`/projects/${projectId}`)}
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
                      title="阅览"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleExport(version, e)}
                      sx={{ mr: 0.5 }}
                      title="导出"
                      disabled={version.status === '草稿'}
                    >
                      <Download fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleUploadOriginal(version, e)}
                      sx={{ mr: 0.5 }}
                      title="上传原版"
                    >
                      <Upload fontSize="small" />
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
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>导出设置</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>目标货币</InputLabel>
              <Select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                label="目标货币"
              >
                <MenuItem value="CNY">人民币 (CNY)</MenuItem>
                <MenuItem value="USD">美元 (USD)</MenuItem>
                <MenuItem value="EUR">欧元 (EUR)</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>汇率设置 (转换为{targetCurrency})</Typography>
            {Object.entries(exchangeRates).map(([currency, rate]) => (
              <TextField
                key={currency}
                label={`${currency} 汇率`}
                type="number"
                value={rate}
                onChange={(e) => setExchangeRates(prev => ({
                  ...prev,
                  [currency]: parseFloat(e.target.value) || 0
                }))}
                fullWidth
                sx={{ mb: 1 }}
                inputProps={{ step: 0.01 }}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>取消</Button>
            <Button onClick={handleConfirmExport} variant="contained">确认导出</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
