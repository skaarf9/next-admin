"use client"
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, Pagination, Stack, MenuItem, Select, SelectChangeEvent,
  Tooltip, Box, Typography
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false); // 新增删除对话框状态
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null); // 新增待删除用户状态
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize]);

  // 提取获取用户函数以便复用
  const fetchUsers = () => {
    fetch(`/api/user?page=${page}&limit=${pageSize}`)
      .then(res => res.json())
      .then(json => {
        setUsers(json.data);
        setTotalPages(json.pagination.totalPages);
      });
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setOpenEdit(true);
  };
  
  // 打开删除确认对话框
  const handleOpenDelete = (user: User) => {
    setUserToDelete(user);
    setOpenDelete(true);
  };
  
  const handleClose = () => { 
    setOpenEdit(false); 
    setSelectedUser(null); 
  };

  // 关闭删除对话框
  const handleCloseDelete = () => {
    setOpenDelete(false);
    setUserToDelete(null);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    await fetch(`/api/user/${selectedUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedUser),
    });
    handleClose();
    fetchUsers(); // 刷新数据
  };

  // 实现删除功能
  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/user/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除用户失败');
      }
      
      // 如果删除的是当前页的唯一用户且不是第一页，则返回上一页
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchUsers(); // 刷新数据
      }
    } catch (error) {
      console.error('删除用户时出错:', error);
    } finally {
      handleCloseDelete();
    }
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    setPageSize(Number(event.target.value));
    setPage(1); // 重置到第一页
  };

  // 截断长文本显示
  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength 
      ? `${text.substring(0, maxLength)}...` 
      : text;
  };

  return (
    <Paper sx={{ 
      p: 2, 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <TableContainer sx={{ 
        flex: 1,
        overflowX: 'auto',
        position: 'relative'
      }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 80 }}>ID</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
              <TableCell sx={{ minWidth: 200 }}>Email</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Phone</TableCell>
              <TableCell sx={{ minWidth: 300 }}>Avatar URL</TableCell>
              <TableCell sx={{ minWidth: 300 }}>Bio</TableCell>
              <TableCell sx={{ 
                minWidth: 150,
                position: 'sticky',
                right: 0,
                backgroundColor: 'background.paper',
                zIndex: 1
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} hover>
                <TableCell>{user.id}</TableCell>
                <TableCell>
                  <Tooltip title={user.name} placement="top">
                    <Typography sx={{ maxWidth: 150 }} noWrap>
                      {truncateText(user.name, 20)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={user.email} placement="top">
                    <Typography sx={{ maxWidth: 200 }} noWrap>
                      {truncateText(user.email, 25)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={user.phone || ''} placement="top">
                    <Typography sx={{ maxWidth: 150 }} noWrap>
                      {truncateText(user.phone, 15)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={user.avatar || ''} placement="top">
                    <Typography sx={{ maxWidth: 300 }} noWrap>
                      {truncateText(user.avatar, 40)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={user.bio || ''} placement="top">
                    <Typography sx={{ maxWidth: 300 }} noWrap>
                      {truncateText(user.bio, 50)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ 
                  position: 'sticky',
                  right: 0,
                  backgroundColor: 'background.paper',
                  zIndex: 1
                }}>
                  <IconButton onClick={() => handleOpenEdit(user)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleOpenDelete(user)}>
                    <Delete fontSize="small" />
                  </IconButton>
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
          <Typography variant="body2">Rows per page:</Typography>
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
          />
        </Stack>
      </Box>

      {/* 编辑用户对话框 */}
      <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent dividers>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={selectedUser?.name || ''}
            onChange={e => selectedUser && setSelectedUser({ ...selectedUser, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            value={selectedUser?.email || ''}
            onChange={e => selectedUser && setSelectedUser({ ...selectedUser, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={selectedUser?.phone || ''}
            onChange={e => selectedUser && setSelectedUser({ ...selectedUser, phone: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Avatar URL"
            fullWidth
            value={selectedUser?.avatar || ''}
            onChange={e => selectedUser && setSelectedUser({ ...selectedUser, avatar: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Bio"
            fullWidth
            multiline
            rows={3}
            value={selectedUser?.bio || ''}
            onChange={e => selectedUser && setSelectedUser({ ...selectedUser, bio: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* 删除用户确认对话框 */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>确认删除用户</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            确定要删除用户 <strong>{userToDelete?.name}</strong> (ID: {userToDelete?.id}) 吗？此操作不可逆。
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
    </Paper>
  );
}