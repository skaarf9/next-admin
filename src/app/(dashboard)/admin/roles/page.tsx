"use client"
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, Pagination, Stack, MenuItem, Select, SelectChangeEvent,
  Tooltip, Box, Typography, Grid, InputAdornment, FormControl, InputLabel,
  Checkbox, List, ListItem, ListItemText, ListItemButton, ListItemIcon,
  Tab, Tabs, Chip, Avatar, Card, CardContent, CardHeader, CircularProgress,
} from '@mui/material';
import { 
  Edit, Delete, Visibility, Add, Search, Clear, 
  Person, Description, Api, Check, Close 
} from '@mui/icons-material';

import { useAlert } from '@/contexts/AlertContext';

interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

interface Permission {
  id: number;
  code: string;
  description: string;
}

interface RolePermission {
  id: number;
  permission: Permission;
}

interface RolePDFPermission {
  id: number;
  pdfId: number;
  pdfName: string;
  canEdit: boolean;
}

export default function RolesPage() {

  const { showAlert } = useAlert();

  // 状态管理
  const [roles, setRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>({ 
    name: '',
    description: ''
  });
  const [deletingPermission, setDeletingPermission] = useState(null);
  const [addingPermission, setAddingPermission] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState('');
  
  // 模态框状态
  const [openUsersModal, setOpenUsersModal] = useState(false);
  const [openPDFsModal, setOpenPDFsModal] = useState(false);
  const [openPermissionsModal, setOpenPermissionsModal] = useState(false);
  
  // 用户管理相关状态
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roleUsers, setRoleUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // PDF权限管理相关状态
  const [allPDFs, setAllPDFs] = useState<any[]>([]);
  const [rolePDFPermissions, setRolePDFPermissions] = useState<RolePDFPermission[]>([]);
  
  // API权限管理相关状态
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [newPermission, setNewPermission] = useState<Omit<Permission, 'id'>>({
    code: '',
    description: ''
  });

  // 新增加载状态
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingAllUsers, setLoadingAllUsers] = useState(true);
  const [loadingAllPDFs, setLoadingAllPDFs] = useState(true);
  const [loadingAllPermissions, setLoadingAllPermissions] = useState(true);
  const [loadingRoleUsers, setLoadingRoleUsers] = useState(false);
  const [loadingRolePDFs, setLoadingRolePDFs] = useState(false);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);

  
  // 获取JWT token
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

  // 获取角色列表
  const fetchRoles = () => {
    setLoadingRoles(true);
    const token = getTokenFromCookie();
    if (!token) {
      console.error('未找到认证令牌');
      setLoadingRoles(false);
      return;
    }
    
    // 构建查询参数
    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      ...(searchName && { name: searchName })
    });
    
    fetch(`/api/roles?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => {
        setRoles(json.data);
        setTotalPages(json.pagination.totalPages);
        setLoadingRoles(false);
      })
      .catch(error => console.error('获取角色失败:', error));
      setLoadingRoles(false);
  };

  // 获取所有用户
  const fetchAllUsers = () => {
    setLoadingAllUsers(true);
    const token = getTokenFromCookie();
    if (!token) {
      setLoadingAllUsers(false);
      return;
    }
    
    fetch('/api/user?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => {
        setAllUsers(json.data)
        setLoadingAllUsers(false);
      })
      .catch(error => {
        console.error('获取用户失败:', error)
        setLoadingAllUsers(false);
      });
  };
  
  // 获取角色下的用户
  const fetchRoleUsers = (roleId: number) => {
    setLoadingRoleUsers(true);
    const token = getTokenFromCookie();
    if (!token) {
      setLoadingRoleUsers(false);
      return;
    }
    
    fetch(`/api/roles/${roleId}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => {
        setRoleUsers(json);
        setSelectedUsers(json.map((u: User) => u.id));
        setLoadingRoleUsers(false);
      })
      .catch(error => {
        console.error('获取角色用户失败:', error)
        setLoadingRoleUsers(false);
      })
  };
  
  // 获取所有PDF
  const fetchAllPDFs = () => {
    setLoadingAllPDFs(true);
    const token = getTokenFromCookie();
    if (!token) {
      setLoadingAllPDFs(false);
      return;
    }
    
    fetch('/api/pdf?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => {
        setAllPDFs(json.data)
      })
      .catch(error => {
        console.error('获取PDF失败:', error)
      })
      .finally(() => setLoadingAllPDFs(false));
  };
  
  // 获取角色下的PDF权限
  const fetchRolePDFPermissions = (roleId: number) => {
    setLoadingRolePDFs(true);
    const token = getTokenFromCookie();
    if (!token) {
      setLoadingRolePDFs(false);
      return;
    }
    
    fetch(`/api/roles/${roleId}/pdfs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => setRolePDFPermissions(json))
      .catch(error => console.error('获取角色PDF权限失败:', error))
      .finally(() => setLoadingRolePDFs(false));
  };
  
  // 获取所有权限
  const fetchAllPermissions = () => {
    setLoadingAllPermissions(true);
    const token = getTokenFromCookie();
    if (!token) {
      setLoadingAllPermissions(false);
      return;
    }
    console.log('fetching all permissions')
    fetch('/api/permissions?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => setAllPermissions(json.data))
      .catch(error => console.error('获取权限失败:', error))
      .finally(() => setLoadingAllPermissions(false));
  };
  
  // 获取角色下的权限
  const fetchRolePermissions = (roleId: number) => {
    setLoadingRolePermissions(true);
    const token = getTokenFromCookie();
    if (!token) {
      setLoadingRolePermissions(false);
      return;
    }
    
    fetch(`/api/roles/${roleId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(json => {
        setRolePermissions(json)
      })
      .catch(error => console.error('获取角色权限失败:', error))
      .finally(() => setLoadingRolePermissions(false));
  };

  // 初始化数据
  useEffect(() => {
    fetchRoles();
    fetchAllUsers();
    fetchAllPDFs();
    fetchAllPermissions();
  }, [page, pageSize]);

  // 打开编辑模态框
  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setOpenEdit(true);
  };
  
  // 打开删除模态框
  const handleOpenDelete = (role: Role) => {
    setRoleToDelete(role);
    setOpenDelete(true);
  };
  
  // 打开新增模态框
  const handleOpenAdd = () => {
    setOpenAdd(true);
  };
  
  // 打开用户管理模态框
  const handleOpenUsersModal = (role: Role) => {
    setSelectedRole(role);
    fetchRoleUsers(role.id);
    setOpenUsersModal(true);
  };
  
  // 打开PDF权限管理模态框
  const handleOpenPDFsModal = (role: Role) => {
    setSelectedRole(role);
    fetchRolePDFPermissions(role.id);
    setOpenPDFsModal(true);
  };
  
  // 打开API权限管理模态框
  const handleOpenPermissionsModal = (role: Role) => {
    setSelectedRole(role);
    fetchRolePermissions(role.id);
    setOpenPermissionsModal(true);
  };
  
  // 关闭所有模态框
  const handleClose = () => { 
    setOpenEdit(false); 
    setSelectedRole(null); 
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setRoleToDelete(null);
  };

  const handleCloseAdd = () => {
    setOpenAdd(false);
    setNewRole({
      name: '',
      description: ''
    });
  };
  
  const handleCloseUsersModal = () => {
    setOpenUsersModal(false);
    setSelectedRole(null);
    setSelectedUsers([]);
  };
  
  const handleClosePDFsModal = () => {
    setOpenPDFsModal(false);
    setSelectedRole(null);
  };
  
  const handleClosePermissionsModal = () => {
    setOpenPermissionsModal(false);
    setSelectedRole(null);
    setNewPermission({
      code: '',
      description: ''
    });
  };

  // 保存角色
  const handleSave = async () => {
    if (!selectedRole) return;

    const token = getTokenFromCookie();
    if (!token) return;
    
    await fetch(`/api/roles/${selectedRole.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(selectedRole),
    });
    
    handleClose();
    fetchRoles();
  };

  // 创建角色
  const handleCreate = async () => {
    const token = getTokenFromCookie();
    if (!token) return;
    
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRole),
      });
      
      if (response.ok) {
        handleCloseAdd();
        fetchRoles();
      }
    } catch (error) {
      console.error('创建角色失败:', error);
    }
  };

  // 删除角色
  const handleDelete = async () => {
    if (!roleToDelete) return;
    
    const token = getTokenFromCookie();
    if (!token) return;
    
    try {
      const response = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        if (roles.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchRoles();
        }
      }
    } catch (error) {
      console.error('删除角色失败:', error);
    } finally {
      handleCloseDelete();
    }
  };

  // 更新每页行数
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // 重置查询
  const resetSearch = () => {
    setSearchName('');
    setPage(1);
  };
  
  // 切换用户选择
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };
  
  // 保存角色用户关联
  const saveRoleUsers = async () => {
    if (!selectedRole) return;
    
    const token = getTokenFromCookie();
    if (!token) return;
    
    try {
      // 删除所有关联
      await fetch(`/api/roles/${selectedRole.id}/users`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 添加新关联
      await fetch(`/api/roles/${selectedRole.id}/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });
      showAlert('success', '保存用户关联成功');
      fetchRoleUsers(selectedRole.id);
    } catch (error) {
      console.error('保存用户关联失败:', error);
    }
  };

  const deletePDFPermission = async (pdfId: number) => {
    if (!selectedRole) return;
    
    const token = getTokenFromCookie();
    if (!token) return;
    
    try {
      await fetch(`/api/roles/${selectedRole.id}/pdfs/${pdfId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      fetchRolePDFPermissions(selectedRole.id);
    } catch (error) {
      console.error('更新PDF权限失败:', error);
    }
  };
  
  // 更新PDF权限
  const updatePDFPermission = async (pdfId: number, canEdit: boolean) => {
    if (!selectedRole) return;
    
    const token = getTokenFromCookie();
    if (!token) return;
    
    try {
      await fetch(`/api/roles/${selectedRole.id}/pdfs`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pdfId, canEdit }),
      });
      
      fetchRolePDFPermissions(selectedRole.id);
    } catch (error) {
      console.error('更新PDF权限失败:', error);
    }
  };
  

  // 删除权限
  const deletePermission = async (permissionId) => {
    setDeletingPermission(permissionId);
    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 从所有权限列表中移除
        setAllPermissions(allPermissions.filter(p => p.id !== permissionId));
        
        // 如果该权限在角色权限中，也从那里移除
        setRolePermissions(rolePermissions.filter(rp => rp.permission.id !== permissionId));
      }
    } catch (error) {
      console.error('删除权限失败:', error);
    } finally {
      setDeletingPermission(null);
    }
  };

  // 添加权限到当前角色
  const addPermissionToRole = async (permissionId: any) => {
    if (!selectedRole) return;
    
    setAddingPermission(permissionId);
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionId }),
      });
      if (response.ok) {
        // 刷新角色权限
        fetchRolePermissions(selectedRole.id);
      }
    } catch (error) {
      console.error('添加权限到角色失败:', error);
    } finally {
      setAddingPermission(null);
    }
  };

  // 添加新权限
  const addPermission = async () => {
    if (!selectedRole || !newPermission.code) return;
    
    const token = getTokenFromCookie();
    if (!token) return;
    
    try {
      // 创建新权限
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPermission),
      });
      
      if (response.ok) {
        const newPerm = await response.json();
        
        // 将新权限关联到角色
        await fetch(`/api/roles/${selectedRole.id}/permissions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ permissionId: newPerm.id }),
        });
        
        // 重置表单并刷新
        setNewPermission({ code: '', description: '' });
        fetchRolePermissions(selectedRole.id);
        fetchAllPermissions();
      }else{
        const errorData = await response.json();
        showAlert('error', `创建权限失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('添加权限失败:', error);
    }
  };
  
  // 删除权限关联
  const removePermission = async (permissionId: number) => {
    if (!selectedRole) return;
    
    const token = getTokenFromCookie();
    if (!token) return;
    
    try {
      await fetch(`/api/roles/${selectedRole.id}/permissions/${permissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      fetchRolePermissions(selectedRole.id);
    } catch (error) {
      console.error('删除权限失败:', error);
    }
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
          新增角色
        </Button>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <TextField
            size="small"
            placeholder="搜索角色名称"
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
            onClick={fetchRoles}
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
      
      {/* 角色表格 */}
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
              <TableCell sx={{ 
                minWidth: 250,
                position: 'sticky',
                right: 0,
                zIndex: 1,
                fontWeight: 'bold'
              }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map(role => (
              <TableRow key={role.id} hover >
                <TableCell>{role.id}</TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell sx={{ 
                  position: 'sticky',
                  right: 0,
                  backgroundColor: 'background.paper',
                  zIndex: 1
                }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Person />}
                    onClick={() => handleOpenUsersModal(role)}
                    sx={{ mr: 1, color: '#2196f3', borderColor: '#2196f3' }}
                  >
                    用户
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Description />}
                    onClick={() => handleOpenPDFsModal(role)}
                    sx={{ mr: 1, color: '#ff9800', borderColor: '#ff9800' }}
                  >
                    PDF权限
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Api />}
                    onClick={() => handleOpenPermissionsModal(role)}
                    sx={{ mr: 1, color: '#9c27b0', borderColor: '#9c27b0' }}
                  >
                    API权限
                  </Button>
                  
                  <Tooltip title="编辑">
                    <IconButton 
                      onClick={() => handleOpenEdit(role)}
                      sx={{ color: '#ff9800' }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="删除">
                    <IconButton 
                      onClick={() => handleOpenDelete(role)}
                      sx={{ color: '#f44336' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 分页控件 */}
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

      {/* 编辑角色对话框 */}
      <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle >
          编辑角色
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TextField
            margin="dense"
            label="名称"
            fullWidth
            value={selectedRole?.name || ''}
            onChange={e => selectedRole && setSelectedRole({ ...selectedRole, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="描述"
            fullWidth
            multiline
            rows={3}
            value={selectedRole?.description || ''}
            onChange={e => selectedRole && setSelectedRole({ ...selectedRole, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">取消</Button>
          <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: '#4caf50' }}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 新增角色对话框 */}
      <Dialog open={openAdd} onClose={handleCloseAdd} fullWidth maxWidth="sm">
        <DialogTitle>
          新增角色
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TextField
            margin="dense"
            label="名称"
            fullWidth
            value={newRole.name}
            onChange={e => setNewRole({ ...newRole, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="描述"
            fullWidth
            multiline
            rows={3}
            value={newRole.description}
            onChange={e => setNewRole({ ...newRole, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd} variant="outlined">取消</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ backgroundColor: '#4caf50' }}>创建</Button>
        </DialogActions>
      </Dialog>

      {/* 删除角色确认对话框 */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle >
          确认删除角色
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1">
            确定要删除角色 <strong>{roleToDelete?.name}</strong> (ID: {roleToDelete?.id}) 吗？此操作不可逆。
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
      
      {/* 用户管理模态框 */}
      <Dialog 
        open={openUsersModal} 
        onClose={handleCloseUsersModal} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1 }} />
            管理用户 - {selectedRole?.name}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, height: 400 }}>
          <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}>
            {/* 所有用户卡片 */}
            <Grid item xs={6} sx={{ width: '40%'}}>
              <Card 
                variant="outlined" 
                sx={{ 
                  flex: 1, // 让卡片填充可用空间
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: 1,
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ flex: 1, overflow: 'hidden', p: 0 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ p: 2, pb: 1 }}>
                    所有用户 ({allUsers.length})
                  </Typography>
                  
                  {loadingAllUsers || loadingRoleUsers ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: 300 
                    }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <List sx={{ 
                      height: 300, 
                      overflow: 'auto',
                      p: 0
                    }}>
                      {allUsers.map(user => (
                        <ListItem 
                          key={user.id} 
                          disablePadding
                          sx={{ px: 1 }}
                        >
                          <ListItemButton 
                            onClick={() => toggleUserSelection(user.id)}
                            selected={selectedUsers.includes(user.id)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={selectedUsers.includes(user.id)}
                                tabIndex={-1}
                                disableRipple
                              />
                            </ListItemIcon>
                            <ListItemText 
                              primary={user.name} 
                              secondary={user.email} 
                            />
                            <Avatar 
                              src={user.avatar || undefined} 
                              sx={{ width: 32, height: 32 }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* 已选用户卡片 */}
            <Grid item xs={6} sx={{ width: '40%'}}>
              <Card 
                variant="outlined" 
                sx={{ 
                  flex: 1, // 让卡片填充可用空间
                  display: 'flex', 
                  flexDirection: 'column',
                  boxShadow: 1,
                  borderRadius: 2
                }}
              >
                <CardContent sx={{ flex: 1, overflow: 'hidden', p: 0 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ p: 2, pb: 1 }}>
                    已选用户 ({selectedUsers.length})
                  </Typography>
                  
                  {loadingAllUsers || loadingRoleUsers ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: 300 
                    }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <List sx={{ 
                      height: 300, 
                      overflow: 'auto',
                      p: 0
                    }}>
                      {allUsers
                        .filter(user => selectedUsers.includes(user.id))
                        .map(user => (
                          <ListItem 
                            key={user.id} 
                            disablePadding
                            sx={{ px: 1 }}
                          >
                            <ListItemButton 
                              onClick={() => toggleUserSelection(user.id)}
                              sx={{ borderRadius: 1 }}
                            >
                              <ListItemIcon>
                                <Avatar 
                                  src={user.avatar || undefined} 
                                  sx={{ width: 32, height: 32 }}
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={user.name} 
                                secondary={user.email} 
                              />
                            </ListItemButton>
                          </ListItem>
                        ))
                      }
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsersModal} variant="outlined">取消</Button>
          <Button 
            variant="contained" 
            onClick={saveRoleUsers}
            sx={{ backgroundColor: '#4caf50' }}
            disabled={loadingRoleUsers}
          >
            {loadingRoleUsers ? <CircularProgress size={24} /> : '保存用户'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* PDF权限管理模态框 */}
      <Dialog 
        open={openPDFsModal} 
        onClose={handleClosePDFsModal} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Description sx={{ mr: 1 }} />
            PDF权限管理 - {selectedRole?.name}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, height: 400 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            为角色分配PDF访问权限，并设置编辑权限
          </Typography>
          {loadingAllPDFs || loadingRolePDFs ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 300 
            }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>PDF名称</TableCell>
                        <TableCell align="center">访问权限</TableCell>
                        <TableCell align="center">编辑权限</TableCell>
                        <TableCell align="center">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allPDFs.map(pdf => {
                        const permission = rolePDFPermissions.find(p => p.pdfId === pdf.id);
                        return (
                          <TableRow key={pdf.id}>
                            <TableCell>
                              <Typography noWrap sx={{ maxWidth: 300 }}>
                                {pdf.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {permission ? (
                                <Check sx={{ color: 'success.main' }} />
                              ) : (
                                <Close sx={{ color: 'error.main' }} />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {permission?.canEdit ? (
                                <Check sx={{ color: 'success.main' }} />
                              ) : (
                                <Close sx={{ color: 'error.main' }} />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {!permission ? (
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  onClick={() => updatePDFPermission(pdf.id, false)}
                                >
                                  添加权限
                                </Button>
                              ) : (
                                <>
                                  <Button 
                                    variant={permission.canEdit ? "contained" : "outlined"}
                                    size="small"
                                    onClick={() => updatePDFPermission(pdf.id, !permission.canEdit)}
                                    sx={{ mr: 1 }}
                                  >
                                    {permission.canEdit ? '编辑权限' : '仅查看'}
                                  </Button>
                                  {permission.canEdit? (
                                    <Button 
                                      variant="outlined" 
                                      size="small"
                                      color="error"
                                      onClick={() => updatePDFPermission(pdf.id, false)}
                                    >
                                      移除
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="outlined" 
                                      size="small"
                                      color="error"
                                      onClick={() => deletePDFPermission(pdf.id)}
                                    >
                                      移除访问权限
                                    </Button>
                                  )}
                                  
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePDFsModal} variant="outlined">关闭</Button>
        </DialogActions>
      </Dialog>
      
      {/* API权限管理模态框 */}
      <Dialog 
        open={openPermissionsModal} 
        onClose={handleClosePermissionsModal} 
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Api sx={{ mr: 1 }} />
            API权限管理 - {selectedRole?.name}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2, height: 500 }}>
          {/* 使用Flex布局替代Grid */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            height: '100%',
            flexDirection: { xs: 'column', sm: 'row' } // 响应式布局：小屏幕下垂直排列
          }}>
            {/* 左侧区域 - 固定宽度 */}
            <Box sx={{ 
              width: { xs: '100%', sm: '60%' }, 
              display: 'flex', 
              flexDirection: 'column',
              gap: 2,
              height: '100%',
              minHeight: 0
            }}>
              {/* 添加新权限卡片 - 固定高度 */}
              <Card variant="outlined" sx={{ 
                boxShadow: 1, 
                borderRadius: 2,
                flexShrink: 0, // 防止被压缩
              }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    添加新权限
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <TextField
                        fullWidth
                        label="权限代码"
                        value={newPermission.code}
                        onChange={e => setNewPermission({...newPermission, code: e.target.value})}
                        sx={{ mb: 2 }}
                        placeholder="例如: users:read"
                      />
                      <TextField
                        fullWidth
                        label="权限描述"
                        value={newPermission.description}
                        onChange={e => setNewPermission({...newPermission, description: e.target.value})}
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                        placeholder="例如: 允许读取用户信息"
                      />
                      <Button 
                        variant="contained" 
                        onClick={addPermission}
                        fullWidth
                        disabled={!newPermission.code}
                        startIcon={<Add />}
                      >
                        添加权限
                      </Button>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
              
              {/* 所有权限卡片 - 动态高度带滚动 */}
              <Card variant="outlined" sx={{ 
                boxShadow: 1, 
                borderRadius: 2,
                flex: 1,
                minHeight: 300, // 设置最小高度
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ 
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0
                }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ p: 2, pb: 1 }}>
                    所有权限 ({allPermissions.length})
                  </Typography>
                  {loadingAllPermissions ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100%'
                    }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <List sx={{ 
                      overflow: 'auto',
                      height: 'calc(100% - 50px)', // 减去标题高度
                      minHeight: 250, // 列表内容最小高度
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}>
                      {allPermissions.map(permission => (
                        <ListItem key={permission.id} disablePadding secondaryAction={(
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="添加到当前角色">
                              <IconButton
                                size="small"
                                onClick={() => addPermissionToRole(permission.id)}
                                disabled={addingPermission === permission.id}
                                color="primary"
                              >
                                {addingPermission === permission.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <Add fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="删除权限">
                              <IconButton
                                size="small"
                                onClick={() => deletePermission(permission.id)}
                                disabled={deletingPermission === permission.id}
                                color="error"
                              >
                                {deletingPermission === permission.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <Delete fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}>
                          <ListItemButton>
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Chip 
                                    label={permission.code} 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                    color="primary"
                                  />
                                  {permission.description}
                                </Box>
                              } 
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
            
            {/* 右侧区域 - 动态高度带滚动 */}
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0
            }}>
              <Card variant="outlined" sx={{ 
                height: '100%', 
                boxShadow: 1, 
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                <CardContent sx={{ 
                  p: 0, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0
                }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ p: 2, pb: 1 }}>
                    当前角色权限 ({rolePermissions.length})
                  </Typography>
                  {loadingRolePermissions ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      flex: 1,
                      minHeight: 0
                    }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <List sx={{ 
                      flex: 1,
                      overflow: 'auto', 
                      minHeight: 0,
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}>
                      {rolePermissions.map(rp => (
                        <ListItem 
                          key={rp.id} 
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              onClick={() => removePermission(rp.permission.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          }
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': {
                              borderBottom: 'none'
                            }
                          }}
                        >
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Chip 
                                  label={rp.permission.code} 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                  color="success"
                                />
                                {rp.permission.description}
                              </Box>
                            } 
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClosePermissionsModal} 
            variant="outlined"
            startIcon={<Close />}
          >
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}