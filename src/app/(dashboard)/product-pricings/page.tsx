"use client"
import React, { useEffect, useState, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  TextField, Pagination, Stack, MenuItem, Select, SelectChangeEvent,
  Tooltip, Box, Typography, Menu, Snackbar, Alert, TablePagination,
  Checkbox, CircularProgress
} from '@mui/material';
import { Edit, Delete, History, Add, CloudUpload, CloudDownload } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { getUserId } from '@/utils/auth';
import { useAlert } from '@/contexts/AlertContext';

// 定义产品定价接口
interface ProductPricing {
  id?: number;
  itemCode: string;
  itemCodeBase: string;
  category?: string;
  subCategory?: string;
  referenceImageUrl?: string;
  location?: string;
  brand?: string;
  productName?: string;
  materialDescription?: string;
  materialImageUrl?: string;
  quantity: number;
  comments?: string;
  internalNote?: string;
  listPriceEur?: number;
  listPriceUsd?: number;
  listPriceRmb?: number;
  listPriceGbp?: number;
  supplierDiscount?: number;
  costLocalCurrency?: number;
  exchangeRate?: number;
  targetGp?: number;
  usdBudget1?: number;
  kerryPrice?: number;
  unitBudget?: number;
  totalBudget?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 定义历史记录接口
interface PricingHistory {
  id: number;
  productPricingId: number;
  changedAt: string;
  changeType: string;
  changedBy: string;
  [key: string]: any; // 允许动态访问其他字段
}

export default function ProductPricingPage() {

  const { showAlert } = useAlert();

  const router = useRouter();
  const [pricings, setPricings] = useState<ProductPricing[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<ProductPricing | null>(null);
  const [pricingToDelete, setPricingToDelete] = useState<ProductPricing | null>(null);
  const [histories, setHistories] = useState<PricingHistory[]>([]);
  const [historyColumn, setHistoryColumn] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{mouseX: number, mouseY: number, row: ProductPricing, column: string} | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]); // 选中的行ID
  const [allSelected, setAllSelected] = useState(false); // 是否全选当前页
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 });
  

    // 监听滚动位置
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        setScrollPosition({
          left: tableContainerRef.current.scrollLeft,
          top: tableContainerRef.current.scrollTop
        });
      }
    };
    
    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // 处理行选择
  const handleRowSelect = (id: number) => {
    const selectedIndex = selectedRows.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selectedRows, id];
    } else {
      newSelected = selectedRows.filter(rowId => rowId !== id);
    }

    setSelectedRows(newSelected);
    setAllSelected(newSelected.length === pricings.length && pricings.length > 0);
  };

  // 处理全选
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = pricings.map(p => p.id!);
      setSelectedRows(newSelected);
      setAllSelected(true);
    } else {
      setSelectedRows([]);
      setAllSelected(false);
    }
  };

  // 导出Excel
  const handleExportExcel = () => {
    if (selectedRows.length === 0) {
      showSnackbar('请至少选择一行数据进行导出', 'warning');
      return;
    }

    // 获取选中的数据
    const dataToExport = pricings.filter(p => selectedRows.includes(p.id!));
    
    // 准备导出数据
    const exportData = dataToExport.map(item => ({
      '产品代码': item.itemCode,
      '基础产品代码': item.itemCodeBase,
      '类别': item.category,
      '子类别': item.subCategory,
      '参考图片': item.referenceImageUrl,
      '位置': item.location,
      '品牌': item.brand,
      '产品名称': item.productName,
      '材料描述': item.materialDescription,
      '材料图片': item.materialImageUrl,
      '数量': item.quantity,
      '备注': item.comments,
      '内部注释': item.internalNote,
      '欧元标价': item.listPriceEur,
      '美元标价': item.listPriceUsd,
      '人民币标价': item.listPriceRmb,
      '英镑标价': item.listPriceGbp,
      '供应商折扣': item.supplierDiscount,
      '本币成本价': item.costLocalCurrency,
      '汇率': item.exchangeRate,
      '目标毛利率': item.targetGp ? `${(item.targetGp * 100).toFixed(2)}%` : '',
      '美元预算1': item.usdBudget1,
      'Kerry价格': item.kerryPrice,
      '单位预算': item.unitBudget,
      '总预算': item.totalBudget,
      '创建时间': item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
      '更新时间': item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, '产品定价数据');
    
    // 导出文件
    XLSX.writeFile(wb, `产品定价数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
    
    showSnackbar(`已导出 ${selectedRows.length} 条数据`, 'success');
  };

  // 导入Excel
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    setImportDialogOpen(true);
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!importFile) return;
    
    setImporting(true);
    setImportProgress(0);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // 获取第一个工作表
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          let successCount = 0;
          let errorCount = 0;
          
          // 处理每一行数据
          for (let i = 0; i < jsonData.length; i++) {
            try {
              const row: any = jsonData[i];
              
              // 转换数据格式
              const importItem: Partial<ProductPricing> = {
                itemCode: row['产品代码']?.toString() || '',
                itemCodeBase: row['基础产品代码']?.toString() || '',
                category: row['类别']?.toString(),
                subCategory: row['子类别']?.toString(),
                referenceImageUrl: row['参考图片']?.toString(),
                location: row['位置']?.toString(),
                brand: row['品牌']?.toString(),
                productName: row['产品名称']?.toString(),
                materialDescription: row['材料描述']?.toString(),
                materialImageUrl: row['材料图片']?.toString(),
                quantity: Number(row['数量']) || 1,
                comments: row['备注']?.toString(),
                internalNote: row['内部注释']?.toString(),
                listPriceEur: row['欧元标价'] ? Number(row['欧元标价']) : undefined,
                listPriceUsd: row['美元标价'] ? Number(row['美元标价']) : undefined,
                listPriceRmb: row['人民币标价'] ? Number(row['人民币标价']) : undefined,
                listPriceGbp: row['英镑标价'] ? Number(row['英镑标价']) : undefined,
                supplierDiscount: row['供应商折扣'] ? Number(row['供应商折扣']) : undefined,
                costLocalCurrency: row['本币成本价'] ? Number(row['本币成本价']) : undefined,
                exchangeRate: row['汇率'] ? Number(row['汇率']) : undefined,
                targetGp: row['目标毛利率'] ? parseFloat(row['目标毛利率'].replace('%', '')) / 100 : undefined,
                usdBudget1: row['美元预算1'] ? Number(row['美元预算1']) : undefined,
                kerryPrice: row['Kerry价格'] ? Number(row['Kerry价格']) : undefined,
                unitBudget: row['单位预算'] ? Number(row['单位预算']) : undefined,
                totalBudget: row['总预算'] ? Number(row['总预算']) : undefined
              };
              
              // 调用API创建产品定价
              const response = await fetch('/api/product-pricings', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': await getUserId() || 'system',
                },
                body: JSON.stringify(importItem)
              });
              
              if (response.ok) {
                successCount++;
              } else {
                console.error(`导入失败 (行 ${i + 2}):`, await response.text());
                errorCount++;
              }
              
              // 更新进度
              setImportProgress(Math.round(((i + 1) / jsonData.length) * 100));
            } catch (error) {
              console.error(`导入失败 (行 ${i + 2}):`, error);
              errorCount++;
            }
          }
          
          showSnackbar(
            `导入完成! 成功: ${successCount}, 失败: ${errorCount}`,
            errorCount === 0 ? 'success' : 'warning'
          );
          
          // 刷新数据
          fetchPricings();
        } catch (error) {
          console.error('处理Excel文件失败:', error);
          showSnackbar('处理Excel文件失败', 'error');
        } finally {
          setImporting(false);
          setImportDialogOpen(false);
          setImportFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('导入失败:', error);
      showSnackbar('导入失败', 'error');
      setImporting(false);
    }
  };


  // 取消导入
  const handleCancelImport = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 货币格式显示
  const formatCurrency = (value?: number, currency: string = 'EUR') => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // 获取产品定价数据
  const fetchPricings = () => {
    fetch(`/api/product-pricings?page=${page + 1}&limit=${rowsPerPage}`)
      .then(res => res.json())
      .then(json => {
        setPricings(json.data);
        setTotalCount(json.pagination.total);
      })
      .catch(error => {
        showSnackbar('获取数据失败: ' + error.message, 'error');
      });
  };

  // 获取历史数据
const fetchHistories = (id: number, column?: string) => {
  let url = `/api/product-pricings/${id}/histories`;
  if (column) url += `?column=${column}`;
  
  fetch(url)
    .then(res => res.json())
    .then(json => {
      setHistories(json.data);
    })
    .catch(error => {
      showSnackbar('获取历史记录失败: ' + error.message, 'error');
    });
};

  useEffect(() => {
    fetchPricings();
  }, [page, rowsPerPage]);

  const handleOpenEdit = (pricing?: ProductPricing) => {
    setSelectedPricing(pricing || {
      itemCode: '',
      itemCodeBase: '',
      quantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setOpenEdit(true);
  };

  const handleOpenDelete = (pricing: ProductPricing) => {
    setPricingToDelete(pricing);
    setOpenDelete(true);
  };

  const handleOpenHistory = (pricing: ProductPricing, column?: string) => {
    setSelectedPricing(pricing);
    setHistoryColumn(column || null);
    fetchHistories(pricing.id, column);
    setOpenHistory(true);
  };

  const handleClose = () => { 
    setOpenEdit(false); 
    setSelectedPricing(null); 
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setPricingToDelete(null);
  };

  const handleCloseHistory = () => {
    setOpenHistory(false);
    setHistories([]);
    setHistoryColumn(null);
  };

  const handleSave = async () => {
    if (!selectedPricing) return;
    
    // 基本验证
    if (!selectedPricing.itemCode || !selectedPricing.itemCodeBase) {
      showSnackbar('产品代码和基础代码是必填项', 'error');
      return;
    }

    const method = selectedPricing.id ? 'PUT' : 'POST';
    const url = selectedPricing.id 
      ? `/api/product-pricings/${selectedPricing.id}` 
      : '/api/product-pricings';
    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': await getUserId() || 'system',
        },
        body: JSON.stringify(selectedPricing),
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      showSnackbar(`产品定价${selectedPricing.id ? '更新' : '创建'}成功`, 'success');
      handleClose();
      fetchPricings();
    } catch (error) {
      showSnackbar(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!pricingToDelete) return;
    
    try {
      const response = await fetch(`/api/product-pricings/${pricingToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error(await response.text());
      
      showSnackbar('产品定价删除成功', 'success');
      handleCloseDelete();
      
      // 如果删除的是当前页的最后一条记录且不是第一页，则返回上一页
      if (pricings.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        fetchPricings();
      }
    } catch (error) {
      showSnackbar(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    showAlert(severity, message);
  };


  // 处理右键点击
  const handleContextMenu = (event: React.MouseEvent, row: ProductPricing, columnId: string) => {
    event.preventDefault();
    
    // 获取表格容器位置
    const containerRect = tableContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    // 计算相对位置（考虑滚动偏移）
    const relativeX = event.clientX - containerRect.left + scrollPosition.left;
    const relativeY = event.clientY - containerRect.top + scrollPosition.top;
    
    setContextMenu(
      contextMenu === null
        ? { 
            mouseX: event.clientX, 
            mouseY: event.clientY,
            relativeX,
            relativeY,
            row, 
            column: columnId 
          }
        : null,
    );
  };

  // 关闭上下文菜单
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // 打开列历史
  const handleOpenColumnHistory = () => {
    if (contextMenu) {
      handleOpenHistory(contextMenu.row, contextMenu.column);
      handleCloseContextMenu();
    }
  };

  // 截断长文本显示
  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength 
      ? `${text.substring(0, maxLength)}...` 
      : text;
  };

  // 主要显示字段
  const mainColumns = [
    // 基础信息
    { id: 'itemCode', label: '产品代码', width: 120 },
    { id: 'itemCodeBase', label: '基础产品代码', width: 120 },
    { id: 'category', label: '类别', width: 100 },
    { id: 'subCategory', label: '子类别', width: 120 },
    { id: 'referenceImageUrl', label: '参考图片', width: 180, format: (v: any) => truncateText(v, 30) },
    { id: 'location', label: '位置', width: 120 },
    { id: 'brand', label: '品牌', width: 120 },
    { id: 'productName', label: '产品名称', width: 180 },
    
    // 材料信息
    { id: 'materialDescription', label: '材料描述', width: 200, format: (v: any) => truncateText(v, 30) },
    { id: 'materialImageUrl', label: '材料图片', width: 180, format: (v: any) => truncateText(v, 30) },
    
    // 数量与备注
    { id: 'quantity', label: '数量', width: 80, align: 'right' as const },
    { id: 'comments', label: '备注', width: 150, format: (v: any) => truncateText(v, 20) },
    { id: 'internalNote', label: '内部注释', width: 150, format: (v: any) => truncateText(v, 20) },
    
    // 价格信息
    { id: 'listPriceEur', label: '欧元标价', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v, 'EUR') },
    { id: 'listPriceUsd', label: '美元标价', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v, 'USD') },
    { id: 'listPriceRmb', label: '人民币标价', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v, 'CNY') },
    { id: 'listPriceGbp', label: '英镑标价', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v, 'GBP') },
    { id: 'supplierDiscount', label: '供应商折扣', width: 120, align: 'right' as const, format: (v: any) => v ? `${(v * 100).toFixed(1)}%` : '-' },
    { id: 'costLocalCurrency', label: '本币成本价', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v) },
    { id: 'exchangeRate', label: '汇率', width: 100, align: 'right' as const },
    { id: 'targetGp', label: '目标毛利率', width: 120, align: 'right' as const, format: (v: any) => v ? `${(v * 100).toFixed(1)}%` : '-' },
    
    // 预算信息
    { id: 'usdBudget1', label: '美元预算1', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v, 'USD') },
    { id: 'kerryPrice', label: 'Kerry价格', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v) },
    { id: 'unitBudget', label: '单位预算', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v) },
    { id: 'totalBudget', label: '总预算', width: 120, align: 'right' as const, format: (v: any) => formatCurrency(v) },
    
    // 系统信息
    { 
      id: 'createdAt', 
      label: '创建时间', 
      width: 180,
      format: (v: any) => v ? new Date(v).toLocaleString() : '-' 
    },
    { 
      id: 'updatedAt', 
      label: '更新时间', 
      width: 180,
      format: (v: any) => v ? new Date(v).toLocaleString() : '-' 
    }
  ];


  // 历史记录显示的字段（根据上下文决定）
  const historyColumns = historyColumn 
    ? [historyColumn] 
    : ['changedAt', 'changedBy', 'changeType', ...mainColumns.map(col => col.id)];

  return (
    <Paper sx={{ 
      p: 2, 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 2,
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Typography variant="h6">产品定价管理</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
          >
            导入Excel
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
              onChange={handleImportExcel}
            />
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<CloudDownload />}
            onClick={handleExportExcel}
            disabled={selectedRows.length === 0}
          >
            导出Excel ({selectedRows.length})
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => handleOpenEdit()}
          >
            添加新产品定价
          </Button>
        </Box>
      </Box>

      <TableContainer ref={tableContainerRef}
        sx={{ 
          flex: 1, 
          overflowX: 'auto',
          position: 'relative',
          '& .sticky-left': {
            position: 'sticky',
            left: 0,
            zIndex: 2,
            backgroundColor: 'background.paper',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)'
          },
          '& .sticky-right': {
            position: 'sticky',
            right: 0,
            zIndex: 2,
            backgroundColor: 'background.paper',
            boxShadow: '-2px 0 4px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Table sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow>
              {/* 新增选择列 */}
              <TableCell padding="checkbox" sx={{ 
                position: 'sticky',
                left: 0,
                backgroundColor: 'background.paper',
                zIndex: 2
              }}>
                <Checkbox
                  color="primary"
                  indeterminate={selectedRows.length > 0 && selectedRows.length < pricings.length}
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {mainColumns.map(column => (
                <TableCell 
                  key={column.id}
                  sx={{ 
                    minWidth: column.width,
                    fontWeight: 'bold',
                    textAlign: column.align || 'left'
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell sx={{ 
                minWidth: 150,
                fontWeight: 'bold',
                position: 'sticky',
                right: 0,
                backgroundColor: 'background.paper',
                zIndex: 1
              }}>
                操作
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pricings.map(pricing => (
              <TableRow key={pricing.id} hover>
                <TableCell padding="checkbox" sx={{ 
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'background.paper',
                  zIndex: 2
                }}>
                  <Checkbox
                    color="primary"
                    checked={selectedRows.includes(pricing.id!)}
                    onChange={() => handleRowSelect(pricing.id!)}
                  />
                </TableCell>
                {mainColumns.map(column => (
                  <TableCell 
                    key={`${pricing.id}-${column.id}`}
                    sx={{ 
                      textAlign: column.align || 'left',
                      cursor: 'context-menu'
                    }}
                    onContextMenu={(e) => handleContextMenu(e, pricing, column.id)}
                  >
                    <Tooltip 
                      title={column.format 
                        ? column.format(pricing[column.id as keyof ProductPricing]) 
                        : pricing[column.id as keyof ProductPricing] || ''
                      } 
                      placement="top"
                    >
                      <Typography sx={{ 
                        maxWidth: column.width,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {truncateText(
                          column.format 
                            ? column.format(pricing[column.id as keyof ProductPricing]) 
                            : String(pricing[column.id as keyof ProductPricing] || '-'),
                          20
                        )}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                ))}
                <TableCell sx={{ 
                  position: 'sticky',
                  right: 0,
                  backgroundColor: 'background.paper',
                  zIndex: 1
                }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="查看历史">
                      <IconButton onClick={() => handleOpenHistory(pricing)}>
                        <History fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="编辑">
                      <IconButton onClick={() => handleOpenEdit(pricing)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除">
                      <IconButton onClick={() => handleOpenDelete(pricing)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="每页行数:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 共 ${count} 条`}
        sx={{ mt: 'auto' }}
      />

      {/* 导入对话框 */}
      <Dialog open={importDialogOpen} onClose={handleCancelImport}>
        <DialogTitle>导入Excel数据</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 400, p: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              文件: {importFile?.name || '无文件'}
            </Typography>
            
            {importing ? (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  导入中... {importProgress}%
                </Typography>
                <Box sx={{ width: '100%', height: 8, bgcolor: 'divider', borderRadius: 4 }}>
                  <Box 
                    sx={{ 
                      height: '100%', 
                      bgcolor: 'primary.main', 
                      borderRadius: 4,
                      width: `${importProgress}%` 
                    }} 
                  />
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  确定要导入此文件吗？
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  注意: 导入将创建新的产品定价记录，不会更新现有记录。
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelImport} 
            disabled={importing}
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirmImport} 
            variant="contained" 
            disabled={importing || !importFile}
          >
            开始导入
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑产品定价对话框 */}
      <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{selectedPricing?.id ? `编辑产品定价 (ID: ${selectedPricing.id})`  : '创建新产品定价'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              margin="dense"
              label="产品代码"
              fullWidth
              required
              value={selectedPricing?.itemCode || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, itemCode: e.target.value })}
            />
            <TextField
              margin="dense"
              label="基础产品代码"
              fullWidth
              required
              value={selectedPricing?.itemCodeBase || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, itemCodeBase: e.target.value })}
            />
            <TextField
              margin="dense"
              label="类别"
              fullWidth
              value={selectedPricing?.category || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, category: e.target.value })}
            />
            <TextField
              margin="dense"
              label="子类别"
              fullWidth
              value={selectedPricing?.subCategory || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, subCategory: e.target.value })}
            />
            <TextField
              margin="dense"
              label="品牌"
              fullWidth
              value={selectedPricing?.brand || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, brand: e.target.value })}
            />
            <TextField
              margin="dense"
              label="产品名称"
              fullWidth
              value={selectedPricing?.productName || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, productName: e.target.value })}
            />
            <TextField
              margin="dense"
              label="数量"
              fullWidth
              type="number"
              value={selectedPricing?.quantity || 1}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, quantity: parseInt(e.target.value) || 1 })}
            />
            <TextField
              margin="dense"
              label="欧元标价"
              fullWidth
              type="number"
              value={selectedPricing?.listPriceEur || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, listPriceEur: parseFloat(e.target.value) })}
            />
            <TextField
              margin="dense"
              label="本币成本价"
              fullWidth
              type="number"
              value={selectedPricing?.costLocalCurrency || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, costLocalCurrency: parseFloat(e.target.value) })}
            />
            <TextField
              margin="dense"
              label="汇率"
              fullWidth
              type="number"
              step="0.0001"
              value={selectedPricing?.exchangeRate || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, exchangeRate: parseFloat(e.target.value) })}
            />
            <TextField
              margin="dense"
              label="目标毛利率 (%)"
              fullWidth
              type="number"
              value={selectedPricing?.targetGp ? selectedPricing.targetGp * 100 : ''}
              onChange={e => selectedPricing && setSelectedPricing({ 
                ...selectedPricing, 
                targetGp: parseFloat(e.target.value) / 100 
              })}
            />
            <TextField
              margin="dense"
              label="参考图片链接"
              fullWidth
              value={selectedPricing?.referenceImageUrl || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, referenceImageUrl: e.target.value })}
            />
            <TextField
              margin="dense"
              label="位置"
              fullWidth
              value={selectedPricing?.location || ''}
              onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, location: e.target.value })}
            />
          </Box>
          <TextField
            margin="dense"
            label="材料描述"
            fullWidth
            multiline
            rows={2}
            value={selectedPricing?.materialDescription || ''}
            onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, materialDescription: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="备注"
            fullWidth
            multiline
            rows={2}
            value={selectedPricing?.comments || ''}
            onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, comments: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="内部注释"
            fullWidth
            multiline
            rows={2}
            value={selectedPricing?.internalNote || ''}
            onChange={e => selectedPricing && setSelectedPricing({ ...selectedPricing, internalNote: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button variant="contained" onClick={handleSave}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>确认删除产品定价</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            确定要删除产品 <strong>{pricingToDelete?.productName || pricingToDelete?.itemCode}</strong> (ID: {pricingToDelete?.id}) 吗？此操作不可逆。
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

      {/* 历史记录对话框 */}
      <Dialog 
        open={openHistory} 
        onClose={handleCloseHistory} 
        fullWidth 
        maxWidth="lg"
        sx={{ '& .MuiDialog-paper': { height: '80vh' } }}
      >
        <DialogTitle>
          {selectedPricing?.productName || selectedPricing?.itemCode} 的变更历史
          {historyColumn && ` (${mainColumns.find(col => col.id === historyColumn)?.label || historyColumn})`}
        </DialogTitle>
        <DialogContent dividers sx={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            产品ID: {selectedPricing?.id} | 当前版本: {selectedPricing?.updatedAt && new Date(selectedPricing.updatedAt).toLocaleString()}
          </Typography>
          
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>变更时间</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>操作人</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>操作类型</TableCell>
                  
                  {!historyColumn && mainColumns.map(column => (
                    <TableCell key={column.id} sx={{ fontWeight: 'bold', minWidth: column.width }}>
                      {column.label}
                    </TableCell>
                  ))}
                  
                  {historyColumn && (
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {mainColumns.find(col => col.id === historyColumn)?.label || historyColumn}
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {histories.map(history => (
                  <TableRow key={history.id}>
                    <TableCell>
                      {new Date(history.changedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{history.changedBy}</TableCell>
                    <TableCell>
                      {history.changeType === 'CREATE' ? '创建' : 
                      history.changeType === 'UPDATE' ? '更新' : '删除'}
                    </TableCell>
                    
                    {!historyColumn && mainColumns.map(column => {
                      const value = history[column.id as keyof typeof history];
                      return (
                        <TableCell key={column.id}>
                          {column.format ? column.format(value) : value || '-'}
                        </TableCell>
                      );
                    })}
                    
                    {historyColumn && (
                      <TableCell>
                        {(() => {
                          const columnDef = mainColumns.find(col => col.id === historyColumn);
                          const value = history[historyColumn as keyof typeof history];
                          return columnDef?.format ? columnDef.format(value) : value || '-';
                        })()}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 上下文菜单 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleOpenColumnHistory}>
          查看 "{mainColumns.find(col => col.id === contextMenu?.column)?.label || contextMenu?.column}" 历史
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu) {
            handleOpenHistory(contextMenu.row);
            handleCloseContextMenu();
          }
        }}>
          查看完整历史
        </MenuItem>
      </Menu>
    </Paper>
  );
}

