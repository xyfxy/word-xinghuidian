import React, { useState } from 'react';
import { Plus, Minus, Settings, Trash2, Merge, SplitSquareHorizontal } from 'lucide-react';
import { TableContent, TableCell } from '../../types';

interface TableEditorProps {
  content: TableContent;
  onChange: (content: TableContent) => void;
  disabled?: boolean;
}

const TableEditor: React.FC<TableEditorProps> = ({ content, onChange, disabled = false }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);

  // 添加行
  const addRow = (index?: number) => {
    const newRow: TableCell[] = content.rows[0].map(() => ({ content: '' }));
    const newRows = [...content.rows];
    if (index !== undefined) {
      newRows.splice(index + 1, 0, newRow);
    } else {
      newRows.push(newRow);
    }
    onChange({ ...content, rows: newRows });
  };

  // 删除行
  const deleteRow = (index: number) => {
    if (content.rows.length <= 1) return;
    const newRows = content.rows.filter((_, i) => i !== index);
    onChange({ ...content, rows: newRows });
  };

  // 添加列
  const addColumn = (index?: number) => {
    const newRows = content.rows.map(row => {
      const newRow = [...row];
      const newCell: TableCell = { content: '' };
      if (index !== undefined) {
        newRow.splice(index + 1, 0, newCell);
      } else {
        newRow.push(newCell);
      }
      return newRow;
    });
    onChange({ ...content, rows: newRows });
  };

  // 删除列
  const deleteColumn = (index: number) => {
    if (content.rows[0].length <= 1) return;
    const newRows = content.rows.map(row => row.filter((_, i) => i !== index));
    onChange({ ...content, rows: newRows });
  };

  // 更新单元格内容
  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...content.rows];
    newRows[rowIndex][colIndex] = { ...newRows[rowIndex][colIndex], content: value };
    onChange({ ...content, rows: newRows });
  };

  // 已删除未使用的 updateCellStyle 函数

  // 更新表格样式
  const updateTableStyle = (style: TableContent['style']) => {
    onChange({ ...content, style });
  };

  // 检查单元格是否被选中
  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  };

  // 切换单元格选择
  const toggleCellSelection = (row: number, col: number) => {
    if (isCellSelected(row, col)) {
      setSelectedCells(selectedCells.filter(cell => !(cell.row === row && cell.col === col)));
    } else {
      setSelectedCells([...selectedCells, {row, col}]);
    }
  };

  // 合并选中的单元格
  const mergeCells = () => {
    if (selectedCells.length < 2) return;

    // 找出选中区域的边界
    const minRow = Math.min(...selectedCells.map(c => c.row));
    const maxRow = Math.max(...selectedCells.map(c => c.row));
    const minCol = Math.min(...selectedCells.map(c => c.col));
    const maxCol = Math.max(...selectedCells.map(c => c.col));

    // 检查是否是矩形选区
    const expectedCells = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    if (selectedCells.length !== expectedCells) {
      alert('请选择一个矩形区域进行合并');
      return;
    }

    // 合并内容
    let mergedContent = '';
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cellContent = content.rows[r][c].content;
        if (cellContent) {
          mergedContent += (mergedContent ? ' ' : '') + cellContent;
        }
      }
    }

    // 创建新的行数据
    const newRows = content.rows.map((row, rowIndex) => {
      return row.map((cell, colIndex) => {
        if (rowIndex === minRow && colIndex === minCol) {
          // 主单元格
          return {
            ...cell,
            content: mergedContent,
            colspan: maxCol - minCol + 1,
            rowspan: maxRow - minRow + 1
          };
        } else if (rowIndex >= minRow && rowIndex <= maxRow && 
                   colIndex >= minCol && colIndex <= maxCol) {
          // 被合并的单元格，标记为隐藏
          return { ...cell, content: '', hidden: true };
        }
        return cell;
      });
    });

    onChange({ ...content, rows: newRows });
    setSelectedCells([]);
  };

  // 拆分单元格
  const splitCell = (rowIndex: number, colIndex: number) => {
    const cell = content.rows[rowIndex][colIndex];
    if (!cell.colspan && !cell.rowspan) return;

    const newRows = [...content.rows];
    
    // 恢复被合并的单元格
    const colspan = cell.colspan || 1;
    const rowspan = cell.rowspan || 1;
    
    for (let r = rowIndex; r < rowIndex + rowspan && r < newRows.length; r++) {
      for (let c = colIndex; c < colIndex + colspan && c < newRows[r].length; c++) {
        if (r === rowIndex && c === colIndex) {
          // 主单元格
          newRows[r][c] = { content: cell.content };
        } else {
          // 恢复隐藏的单元格
          newRows[r][c] = { content: '' };
        }
      }
    }

    onChange({ ...content, rows: newRows });
  };

  const style = content.style || {};

  return (
    <div className="space-y-4">
      {/* 表格设置按钮 */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">表格编辑</h4>
        <button
          onClick={() => setShowSettings(!showSettings)}
          disabled={disabled}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* 表格样式设置面板 */}
      {showSettings && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* 边框样式 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">边框样式</label>
              <select
                value={style.borderStyle || 'solid'}
                onChange={(e) => updateTableStyle({ ...style, borderStyle: e.target.value as any })}
                disabled={disabled}
                className="input-field text-sm"
              >
                <option value="none">无边框</option>
                <option value="solid">实线</option>
                <option value="dashed">虚线</option>
                <option value="dotted">点线</option>
              </select>
            </div>

            {/* 边框宽度 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">边框宽度</label>
              <input
                type="number"
                min="0"
                max="5"
                value={style.borderWidth || 1}
                onChange={(e) => updateTableStyle({ ...style, borderWidth: parseInt(e.target.value) })}
                disabled={disabled || style.borderStyle === 'none'}
                className="input-field text-sm"
              />
            </div>

            {/* 边框颜色 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">边框颜色</label>
              <input
                type="color"
                value={style.borderColor || '#000000'}
                onChange={(e) => updateTableStyle({ ...style, borderColor: e.target.value })}
                disabled={disabled || style.borderStyle === 'none'}
                className="input-field text-sm h-8"
              />
            </div>

            {/* 表格宽度 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">表格宽度</label>
              <select
                value={typeof style.width === 'number' ? 'custom' : style.width || 'full'}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    updateTableStyle({ ...style, width: 500 });
                  } else {
                    updateTableStyle({ ...style, width: e.target.value as any });
                  }
                }}
                disabled={disabled}
                className="input-field text-sm"
              >
                <option value="auto">自适应</option>
                <option value="full">100%</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            {/* 自定义宽度 */}
            {typeof style.width === 'number' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">宽度 (px)</label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={style.width}
                  onChange={(e) => updateTableStyle({ ...style, width: parseInt(e.target.value) })}
                  disabled={disabled}
                  className="input-field text-sm"
                />
              </div>
            )}

            {/* 单元格内边距 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">单元格内边距</label>
              <input
                type="number"
                min="0"
                max="20"
                value={style.cellPadding || 8}
                onChange={(e) => updateTableStyle({ ...style, cellPadding: parseInt(e.target.value) })}
                disabled={disabled}
                className="input-field text-sm"
              />
            </div>

            {/* 标题行数 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">标题行数</label>
              <input
                type="number"
                min="0"
                max={content.rows.length}
                value={style.headerRows || 0}
                onChange={(e) => updateTableStyle({ ...style, headerRows: parseInt(e.target.value) })}
                disabled={disabled}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* 标题行样式 */}
          {(style.headerRows || 0) > 0 && (
            <div className="border-t pt-3">
              <h5 className="text-xs font-medium text-gray-700 mb-2">标题行样式</h5>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">背景色</label>
                  <input
                    type="color"
                    value={style.headerStyle?.backgroundColor || '#f0f0f0'}
                    onChange={(e) => updateTableStyle({
                      ...style,
                      headerStyle: { ...style.headerStyle, backgroundColor: e.target.value }
                    })}
                    disabled={disabled}
                    className="input-field text-sm h-8"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">对齐方式</label>
                  <select
                    value={style.headerStyle?.textAlign || 'center'}
                    onChange={(e) => updateTableStyle({
                      ...style,
                      headerStyle: { ...style.headerStyle, textAlign: e.target.value as any }
                    })}
                    disabled={disabled}
                    className="input-field text-sm"
                  >
                    <option value="left">左对齐</option>
                    <option value="center">居中</option>
                    <option value="right">右对齐</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={style.headerStyle?.fontBold || false}
                      onChange={(e) => updateTableStyle({
                        ...style,
                        headerStyle: { ...style.headerStyle, fontBold: e.target.checked }
                      })}
                      disabled={disabled}
                      className="mr-2"
                    />
                    <span className="text-xs font-medium text-gray-700">加粗</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 合并单元格操作 */}
      {selectedCells.length > 0 && !disabled && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded">
          <span className="text-sm text-gray-600">
            已选中 {selectedCells.length} 个单元格
          </span>
          {selectedCells.length >= 2 && (
            <button
              onClick={mergeCells}
              className="btn-secondary text-sm flex items-center"
            >
              <Merge className="h-3 w-3 mr-1" />
              合并单元格
            </button>
          )}
          <button
            onClick={() => setSelectedCells([])}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            取消选择
          </button>
        </div>
      )}

      {/* 表格编辑区 */}
      <div className="overflow-x-auto table-editor-container">
        <table 
          className="border-collapse"
          style={{
            width: style.width === 'full' ? '100%' : style.width === 'auto' ? 'auto' : `${style.width}px`,
            tableLayout: 'fixed'
          }}>
          <tbody>
            {content.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  const isHeaderRow = style.headerRows && rowIndex < style.headerRows;
                  const cellStyle = cell.style || {};
                  const backgroundColor = cellStyle.backgroundColor || 
                    (isHeaderRow ? style.headerStyle?.backgroundColor : undefined);

                  const isSelected = isCellSelected(rowIndex, colIndex);

                  return (
                    <td
                      key={colIndex}
                      colSpan={cell.colspan}
                      rowSpan={cell.rowspan}
                      className={`relative group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={(e) => {
                        if (!disabled && e.shiftKey) {
                          e.preventDefault();
                          toggleCellSelection(rowIndex, colIndex);
                        }
                      }}
                      style={{
                        display: cell.hidden ? 'none' : undefined,
                        padding: `${style.cellPadding || 8}px`,
                        border: style.borderStyle !== 'none' 
                          ? `${style.borderWidth || 1}px ${style.borderStyle || 'solid'} ${style.borderColor || '#000000'}`
                          : 'none',
                        backgroundColor: isSelected ? '#e0f2fe' : backgroundColor,
                        cursor: !disabled ? 'pointer' : 'default',
                      }}
                    >
                      <input
                        type="text"
                        value={cell.content}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        disabled={disabled}
                        className="w-full p-1 bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500"
                        style={{
                          textAlign: cellStyle.textAlign || (isHeaderRow ? style.headerStyle?.textAlign : undefined) || 'left',
                          fontWeight: (isHeaderRow && style.headerStyle?.fontBold) ? 'bold' : 'normal',
                        }}
                      />

                      {/* 单元格操作按钮 */}
                      {!disabled && (
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                          {/* 拆分按钮（如果单元格已合并） */}
                          {(cell.colspan || cell.rowspan) && (
                            <button
                              onClick={() => splitCell(rowIndex, colIndex)}
                              className="bg-orange-500 text-white p-1 rounded hover:bg-orange-600"
                              title="拆分单元格"
                            >
                              <SplitSquareHorizontal className="h-3 w-3" />
                            </button>
                          )}
                          {/* 行操作按钮 - 只在第一列显示 */}
                          {colIndex === 0 && (
                            <>
                              {/* 删除行按钮 */}
                              {content.rows.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteRow(rowIndex);
                                  }}
                                  className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                                  title="删除行"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                              {/* 添加行按钮 */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addRow(rowIndex);
                                }}
                                className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
                                title="在下方添加行"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </>
                          )}
                          {/* 删除列按钮 - 只在第一行显示 */}
                          {rowIndex === 0 && content.rows[0].length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteColumn(colIndex);
                              }}
                              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                              title="删除列"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          )}
                          {/* 添加列按钮 - 只在第一行显示 */}
                          {rowIndex === 0 && (
                            <button
                              onClick={() => addColumn(colIndex)}
                              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
                              title="添加列"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部操作按钮 */}
      {!disabled && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => addRow()}
              className="btn-secondary text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加行
            </button>
            <button
              onClick={() => addColumn()}
              className="btn-secondary text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加列
            </button>
          </div>
          <p className="text-xs text-gray-500">
            提示：按住 Shift 键点击单元格可以选择多个单元格进行合并
          </p>
        </div>
      )}
    </div>
  );
};

export default TableEditor;