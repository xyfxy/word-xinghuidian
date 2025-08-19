import React from 'react';
import { ContentBlock } from '../../types';
import useEditorStore from '../../stores/editorStore';

interface BlockFormatPanelProps {
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
}

const FONT_FAMILIES = [
  // 基础中文字体
  '宋体', '新宋体', '仿宋', '仿宋_GB2312', '楷体', '楷体_GB2312', '黑体',
  // 微软字体
  '微软雅黑', '微软雅黑 Light',
  // 华文字体
  '华文宋体', '华文仿宋', '华文楷体', '华文细黑', '华文黑体', '华文中宋',
  // 方正字体
  '方正姚体', '方正舒体',
  // 其他中文字体
  '隶书', '幼圆', '等线', '等线 Light',
  // 英文字体
  'Arial', 'Times New Roman', 'Calibri', 'Cambria', 'Georgia', 
  'Verdana', 'Trebuchet MS', 'Tahoma', 'Helvetica', 'Courier New', 
  'Consolas', 'Garamond'
];

const FONT_SIZES: { [key: string]: number } = {
  '初号': 42, '小初': 36, '一号': 26, '小一': 24, '二号': 22, '小二': 18,
  '三号': 16, '小三': 15, '四号': 14, '小四': 12, '五号': 10.5, '小五': 9
};

const BlockFormatPanel: React.FC<BlockFormatPanelProps> = ({ block, onUpdate }) => {
  const { currentTemplate } = useEditorStore();

  if (!block.format || block.format.useGlobalFormat || !currentTemplate) {
    return null;
  }
  
  const globalFormat = currentTemplate.format;
  const blockFormat = block.format;
  
  // 调试：打印字体信息
  console.log(`内容块 "${block.title}" 的格式:`, {
    blockFormat,
    blockFontFamily: blockFormat.font?.family,
    globalFontFamily: globalFormat.font.family,
    actualValue: blockFormat.font?.family || globalFormat.font.family
  });

  const handleFontChange = <K extends keyof NonNullable<typeof blockFormat.font>>(key: K, value: NonNullable<typeof blockFormat.font>[K]) => {
    onUpdate({ format: { ...blockFormat, font: { ...(blockFormat.font || {}), [key]: value } } });
  };
  
  const handleNumberChange = (value: string, callback: (num: number) => void) => {
    if (value === '') {
      callback(undefined as any);
    } else {
      const num = Number(value);
      if (!isNaN(num)) {
        callback(num);
      }
    }
  };
  
  const handleParagraphChange = <K extends keyof NonNullable<typeof blockFormat.paragraph>>(key: K, value: NonNullable<typeof blockFormat.paragraph>[K]) => {
     onUpdate({ format: { ...blockFormat, paragraph: { ...(blockFormat.paragraph || {}), [key]: value } } });
  };

  const handleIndentChange = <K extends keyof NonNullable<NonNullable<typeof blockFormat.paragraph>['indent']>>(key: K, value: number | string) => {
     const currentParagraph = blockFormat.paragraph || {};
     const currentIndent = currentParagraph.indent || {};
     onUpdate({ format: { ...blockFormat, paragraph: { ...currentParagraph, indent: { ...currentIndent, [key]: value } } } });
  };

  const handleBorderChange = (key: 'style' | 'color' | 'size' | 'space', value: string | number) => {
    const currentParagraph = blockFormat.paragraph || {};
    const currentBorder = currentParagraph.border || {};
    const currentBottom = currentBorder.bottom || {};

    // 为 size 和 space 提供默认值，以防 style 或 color 先被设置
    const newBottom = {
      style: currentBottom.style || 'none',
      color: currentBottom.color || '#000000',
      size: currentBottom.size || 1,
      space: currentBottom.space || 1,
      [key]: value,
    };
    
    // 如果样式设置为 'none'，则清除整个 bottom 对象
    if (newBottom.style === 'none') {
        onUpdate({
            format: {
                ...blockFormat,
                paragraph: { ...currentParagraph, border: { ...currentBorder, bottom: undefined } },
            },
        });
    } else {
        onUpdate({
            format: {
                ...blockFormat,
                paragraph: { ...currentParagraph, border: { ...currentBorder, bottom: newBottom } },
            },
        });
    }
  };

  const getSizeName = (size?: number) => {
    if (size === undefined) return '';
    return Object.keys(FONT_SIZES).find(name => FONT_SIZES[name] === size) || '';
  };

  return (
    <div className="border-t border-b border-gray-200 my-4 py-4 px-1">
      <p className="text-sm font-semibold text-gray-800 mb-3">自定义块格式</p>
      
      {block.type === 'two-column' && (
        <div className="space-y-3 mb-4">
            <p className="text-xs font-medium text-gray-600">双栏设置</p>
            <div>
              <label htmlFor={`column-ratio-${block.id}`} className="label-text">
                左栏宽度: {Math.round((block.format.columnRatio || 0.5) * 100)}%
              </label>
              <input
                type="range"
                id={`column-ratio-${block.id}`}
                min="10"
                max="90"
                value={(block.format.columnRatio || 0.5) * 100}
                onChange={(e) => onUpdate({ format: { ...blockFormat, columnRatio: Number(e.target.value) / 100 }})}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
        </div>
      )}

      {/* 标题格式设置 */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600">标题格式分离</p>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={blockFormat.enableHeadingFormat || false}
              onChange={(e) => onUpdate({ 
                format: { 
                  ...blockFormat, 
                  enableHeadingFormat: e.target.checked,
                  headingFormat: e.target.checked ? (blockFormat.headingFormat || {}) : undefined
                }
              })}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">启用</span>
          </label>
        </div>
        <p className="text-xs text-gray-500">
          启用后，标题（如一级标题、二级标题等）和正文可以使用不同的格式设置
        </p>
      </div>

      {blockFormat.enableHeadingFormat && (
        <div className="border-l-4 border-blue-200 pl-4 mb-4 space-y-3">
          <p className="text-xs font-medium text-blue-600">标题专用格式</p>
          
          {/* 标题级别选择 */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => onUpdate({ 
                format: { 
                  ...blockFormat, 
                  currentHeadingLevel: 'h1'
                }
              })}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                (blockFormat.currentHeadingLevel || 'h1') === 'h1' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              一级标题
            </button>
            <button
              onClick={() => onUpdate({ 
                format: { 
                  ...blockFormat, 
                  currentHeadingLevel: 'h2'
                }
              })}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                blockFormat.currentHeadingLevel === 'h2' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              二级标题
            </button>
            <button
              onClick={() => onUpdate({ 
                format: { 
                  ...blockFormat, 
                  currentHeadingLevel: 'h3'
                }
              })}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                blockFormat.currentHeadingLevel === 'h3' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              三级标题
            </button>
          </div>
          
          {/* 当前级别标题字体设置 */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600">
              {blockFormat.currentHeadingLevel === 'h2' ? '二级' : 
               blockFormat.currentHeadingLevel === 'h3' ? '三级' : '一级'}标题字体
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`heading-font-family-${block.id}`} className="label-text">字体</label>
                <select
                  id={`heading-font-family-${block.id}`}
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.font?.family ||
                    globalFormat.font.family
                  }
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              font: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.font || {}), 
                                family: e.target.value 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="input-field"
                >
                  {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`heading-font-size-name-${block.id}`} className="label-text">字号</label>
                <select
                  id={`heading-font-size-name-${block.id}`}
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.font?.size ?? ''
                  }
                  onChange={(e) => handleNumberChange(e.target.value, (num) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              font: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.font || {}), 
                                size: num 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  })}
                  className="input-field"
                >
                  <option value="" disabled={getSizeName(blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.font?.size) !== ''}>选择字号</option>
                  {Object.entries(FONT_SIZES).map(([name, value]) => (
                    <option key={name} value={value}>{name} ({value}pt)</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label htmlFor={`heading-font-size-${block.id}`} className="label-text">字号 (pt)</label>
                <input
                  type="number"
                  id={`heading-font-size-${block.id}`}
                  placeholder={String(globalFormat.font.size)}
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.font?.size ?? ''
                  }
                  onChange={(e) => handleNumberChange(e.target.value, (num) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              font: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.font || {}), 
                                size: num 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  })}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor={`heading-color-${block.id}`} className="label-text">颜色</label>
                <input
                  type="color"
                  id={`heading-color-${block.id}`}
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.font?.color ||
                    globalFormat.font.color
                  }
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              font: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.font || {}), 
                                color: e.target.value 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="input-field h-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.font?.bold || false
                  } 
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              font: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.font || {}), 
                                bold: e.target.checked 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="form-checkbox" 
                />
                <span className="ml-2">加粗</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.font?.italic || false
                  } 
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              font: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.font || {}), 
                                italic: e.target.checked 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="form-checkbox" 
                />
                <span className="ml-2">斜体</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.font?.underline || false
                  } 
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              font: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.font || {}), 
                                underline: e.target.checked 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="form-checkbox" 
                />
                <span className="ml-2">下划线</span>
              </label>
            </div>
          </div>

          {/* 标题段落设置 */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600">标题段落</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`heading-alignment-${block.id}`} className="label-text">对齐方式</label>
                <select 
                  id={`heading-alignment-${block.id}`} 
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.paragraph?.alignment ||
                    globalFormat.paragraph.alignment
                  } 
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              paragraph: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.paragraph || {}), 
                                alignment: e.target.value as any 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="input-field"
                >
                  <option value="left">左对齐</option>
                  <option value="center">居中</option>
                  <option value="right">右对齐</option>
                  <option value="justify">两端对齐</option>
                </select>
              </div>
              <div>
                <label htmlFor={`heading-line-height-${block.id}`} className="label-text">行高</label>
                <input 
                  type="number" 
                  step="0.1"
                  id={`heading-line-height-${block.id}`} 
                  placeholder={String(globalFormat.paragraph.lineHeight)} 
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.paragraph?.lineHeight ?? ''
                  } 
                  onChange={(e) => handleNumberChange(e.target.value, (num) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              paragraph: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.paragraph || {}), 
                                lineHeight: num 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  })}
                  className="input-field" 
                />
              </div>
            </div>
            
            {/* 标题缩进设置 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">标题缩进</p>
              <div className="flex items-center space-x-1">
                <label htmlFor={`heading-indent-first-${block.id}`} className="label-text w-12">首行</label>
                <input 
                  type="number" 
                  id={`heading-indent-first-${block.id}`} 
                  placeholder={String(globalFormat.paragraph.indent.firstLine)} 
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.paragraph?.indent?.firstLine ?? ''
                  } 
                  onChange={(e) => handleNumberChange(e.target.value, (num) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              paragraph: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.paragraph || {}), 
                                indent: { 
                                  ...(blockFormat.headingFormat?.levels?.[level]?.paragraph?.indent || {}), 
                                  firstLine: num 
                                } 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  })}
                  className="input-field" 
                />
                <select 
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.paragraph?.indent?.firstLineUnit || 'pt'
                  } 
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              paragraph: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.paragraph || {}), 
                                indent: { 
                                  ...(blockFormat.headingFormat?.levels?.[level]?.paragraph?.indent || {}), 
                                  firstLineUnit: e.target.value as any 
                                } 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="input-field"
                >
                  <option value="pt">pt</option>
                  <option value="cm">cm</option>
                  <option value="px">px</option>
                  <option value="char">字符</option>
                </select>
              </div>
              <div className="flex items-center space-x-1">
                <label htmlFor={`heading-indent-left-${block.id}`} className="label-text w-12">左侧</label>
                <input 
                  type="number" 
                  id={`heading-indent-left-${block.id}`} 
                  placeholder={String(globalFormat.paragraph.indent.left)} 
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.paragraph?.indent?.left ?? ''
                  } 
                  onChange={(e) => handleNumberChange(e.target.value, (num) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              paragraph: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.paragraph || {}), 
                                indent: { 
                                  ...(blockFormat.headingFormat?.levels?.[level]?.paragraph?.indent || {}), 
                                  left: num 
                                } 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  })}
                  className="input-field" 
                />
                <select 
                  value={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.paragraph?.indent?.leftUnit || 'pt'
                  } 
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              paragraph: { 
                                ...(blockFormat.headingFormat?.levels?.[level]?.paragraph || {}), 
                                indent: { 
                                  ...(blockFormat.headingFormat?.levels?.[level]?.paragraph?.indent || {}), 
                                  leftUnit: e.target.value as any 
                                } 
                              }
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="input-field"
                >
                  <option value="pt">pt</option>
                  <option value="cm">cm</option>
                  <option value="px">px</option>
                  <option value="char">字符</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 当前级别标题空行设置 */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600">
              {blockFormat.currentHeadingLevel === 'h2' ? '二级' : 
               blockFormat.currentHeadingLevel === 'h3' ? '三级' : '一级'}标题空行
            </p>
            
            {/* 除第一个标题外向上空一行 */}
            <div>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.addSpaceBeforeExceptFirst || false
                  } 
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              addSpaceBeforeExceptFirst: e.target.checked,
                              // 如果启用了除第一个外空行，则禁用所有标题空行
                              addSpaceBeforeAll: e.target.checked ? false : blockFormat.headingFormat?.levels?.[level]?.addSpaceBeforeAll
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="form-checkbox h-4 w-4 text-blue-600" 
                />
                <span className="ml-2 text-sm text-gray-700">除第一个此级标题外向上空一行</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                启用后，文档中除第一个此级标题外，其他同级标题上方会自动添加一个空行
              </p>
            </div>
            
            {/* 所有标题上面空一行 */}
            <div>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={
                    blockFormat.headingFormat?.levels?.[blockFormat.currentHeadingLevel || 'h1']?.addSpaceBeforeAll || false
                  } 
                  onChange={(e) => {
                    const level = blockFormat.currentHeadingLevel || 'h1';
                    onUpdate({ 
                      format: { 
                        ...blockFormat, 
                        headingFormat: { 
                          ...blockFormat.headingFormat,
                          levels: {
                            ...blockFormat.headingFormat?.levels,
                            [level]: {
                              ...blockFormat.headingFormat?.levels?.[level],
                              addSpaceBeforeAll: e.target.checked,
                              // 如果启用了所有标题空行，则禁用除第一个外空行
                              addSpaceBeforeExceptFirst: e.target.checked ? false : blockFormat.headingFormat?.levels?.[level]?.addSpaceBeforeExceptFirst
                            }
                          }
                        } 
                      } 
                    });
                  }}
                  className="form-checkbox h-4 w-4 text-blue-600" 
                />
                <span className="ml-2 text-sm text-gray-700">所有此级标题上面空一行</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                启用后，文档中所有此级标题（包括第一个）上方都会自动添加一个空行
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 正文字体设置 */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-600">{blockFormat.enableHeadingFormat ? '正文字体' : '字体'}</p>
        <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`font-family-${block.id}`} className="label-text">字体</label>
              <select
                id={`font-family-${block.id}`}
                value={blockFormat.font?.family || globalFormat.font.family}
                onChange={(e) => handleFontChange('family', e.target.value)}
                className="input-field"
              >
                {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>
            <div>
                <label htmlFor={`font-size-name-${block.id}`} className="label-text">字号</label>
                <select
                  id={`font-size-name-${block.id}`}
                  value={blockFormat.font?.size ?? ''}
                  onChange={(e) => handleNumberChange(e.target.value, (num) => handleFontChange('size', num))}
                  className="input-field"
                >
                  <option value="" disabled={getSizeName(blockFormat.font?.size) !== ''}>选择字号</option>
                  {Object.entries(FONT_SIZES).map(([name, value]) => (
                    <option key={name} value={value}>{name} ({value}pt)</option>
                  ))}
                </select>
            </div>
            <div className="col-span-2">
                <label htmlFor={`font-size-${block.id}`} className="label-text">字号 (pt)</label>
                <input
                    type="number"
                    id={`font-size-${block.id}`}
                    placeholder={String(globalFormat.font.size)}
                    value={blockFormat.font?.size ?? ''}
                    onChange={(e) => handleNumberChange(e.target.value, (num) => handleFontChange('size', num))}
                    className="input-field"
                />
            </div>
            <div>
                <label htmlFor={`color-${block.id}`} className="label-text">颜色</label>
                <input
                    type="color"
                    id={`color-${block.id}`}
                    value={blockFormat.font?.color || globalFormat.font.color}
                    onChange={(e) => handleFontChange('color', e.target.value)}
                    className="input-field h-10"
                />
            </div>
        </div>
        <div className="flex items-center space-x-4">
             <label className="flex items-center">
                <input type="checkbox" checked={blockFormat.font?.bold || false} onChange={(e) => handleFontChange('bold', e.target.checked)} className="form-checkbox" />
                <span className="ml-2">加粗</span>
             </label>
             <label className="flex items-center">
                <input type="checkbox" checked={blockFormat.font?.italic || false} onChange={(e) => handleFontChange('italic', e.target.checked)} className="form-checkbox" />
                <span className="ml-2">斜体</span>
             </label>
             <label className="flex items-center">
                <input type="checkbox" checked={blockFormat.font?.underline || false} onChange={(e) => handleFontChange('underline', e.target.checked)} className="form-checkbox" />
                <span className="ml-2">下划线</span>
             </label>
        </div>
      </div>

      {/* 正文段落设置 */}
      <div className="mt-4 space-y-3">
        <p className="text-xs font-medium text-gray-600">{blockFormat.enableHeadingFormat ? '正文段落' : '段落'}</p>
        <div className="grid grid-cols-2 gap-3">
           <div>
              <label htmlFor={`line-height-${block.id}`} className="label-text">行高</label>
              <input type="number" id={`line-height-${block.id}`} placeholder={String(globalFormat.paragraph.lineHeight)} value={blockFormat.paragraph?.lineHeight ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleParagraphChange('lineHeight', num))} className="input-field" />
           </div>
           <div>
              <label htmlFor={`spacing-${block.id}`} className="label-text">段后距 (pt)</label>
              <input type="number" id={`spacing-${block.id}`} placeholder={String(globalFormat.paragraph.paragraphSpacing)} value={blockFormat.paragraph?.paragraphSpacing ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleParagraphChange('paragraphSpacing', num))} className="input-field" />
           </div>
           <div>
              <label htmlFor={`space-before-${block.id}`} className="label-text">段前距 (pt)</label>
              <input type="number" id={`space-before-${block.id}`} placeholder={String(globalFormat.paragraph.spaceBefore)} value={blockFormat.paragraph?.spaceBefore ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleParagraphChange('spaceBefore', num))} className="input-field" />
           </div>
           <div className="col-span-2">
              <label htmlFor={`alignment-${block.id}`} className="label-text">对齐方式</label>
              <select id={`alignment-${block.id}`} value={blockFormat.paragraph?.alignment || globalFormat.paragraph.alignment} onChange={(e) => handleParagraphChange('alignment', e.target.value as any)} className="input-field">
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
                <option value="justify">两端对齐</option>
              </select>
           </div>
        </div>
      </div>

      {/* 正文缩进设置 */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-600">{blockFormat.enableHeadingFormat ? '正文缩进' : '缩进'}</p>
        <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-1">
              <label htmlFor={`indent-first-${block.id}`} className="label-text w-12">首行</label>
              <input type="number" id={`indent-first-${block.id}`} placeholder={String(globalFormat.paragraph.indent.firstLine)} value={blockFormat.paragraph?.indent?.firstLine ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleIndentChange('firstLine', num))} className="input-field" />
              <select 
                value={blockFormat.paragraph?.indent?.firstLineUnit || 'pt'} 
                onChange={(e) => handleIndentChange('firstLineUnit', e.target.value as any)}
                className="input-field"
              >
                <option value="pt">pt</option>
                <option value="cm">cm</option>
                <option value="px">px</option>
                <option value="char">字符</option>
              </select>
            </div>
            <div className="flex items-center space-x-1">
              <label htmlFor={`indent-left-${block.id}`} className="label-text w-12">左侧</label>
              <input type="number" id={`indent-left-${block.id}`} placeholder={String(globalFormat.paragraph.indent.left)} value={blockFormat.paragraph?.indent?.left ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleIndentChange('left', num))} className="input-field" />
              <select 
                value={blockFormat.paragraph?.indent?.leftUnit || 'pt'} 
                onChange={(e) => handleIndentChange('leftUnit', e.target.value as any)}
                className="input-field"
              >
                <option value="pt">pt</option>
                <option value="cm">cm</option>
                <option value="px">px</option>
                <option value="char">字符</option>
              </select>
            </div>
            <div className="flex items-center space-x-1">
              <label htmlFor={`indent-right-${block.id}`} className="label-text w-12">右侧</label>
              <input type="number" id={`indent-right-${block.id}`} placeholder={String(globalFormat.paragraph.indent.right)} value={blockFormat.paragraph?.indent?.right ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleIndentChange('right', num))} className="input-field" />
              <select 
                value={blockFormat.paragraph?.indent?.rightUnit || 'pt'} 
                onChange={(e) => handleIndentChange('rightUnit', e.target.value as any)}
                className="input-field"
              >
                <option value="pt">pt</option>
                <option value="cm">cm</option>
                <option value="px">px</option>
                <option value="char">字符</option>
              </select>
            </div>
        </div>
      </div>

      {/* 边框设置 */}
      <div className="mt-4 space-y-3">
        <p className="text-xs font-medium text-gray-600">下边框</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`border-style-${block.id}`} className="label-text">样式</label>
            <select
              id={`border-style-${block.id}`}
              value={blockFormat.paragraph?.border?.bottom?.style || 'none'}
              onChange={(e) => handleBorderChange('style', e.target.value)}
              className="input-field"
            >
              <option value="none">无</option>
              <option value="single">单线</option>
              <option value="double">双线</option>
              <option value="thickThin">上粗下细</option>
            </select>
          </div>
          <div>
            <label htmlFor={`border-color-${block.id}`} className="label-text">颜色</label>
            <input
              type="color"
              id={`border-color-${block.id}`}
              value={blockFormat.paragraph?.border?.bottom?.color || '#000000'}
              onChange={(e) => handleBorderChange('color', e.target.value)}
              className="input-field h-10"
            />
          </div>
          <div>
            <label htmlFor={`border-size-${block.id}`} className="label-text">粗细 (pt)</label>
            <input
              type="number"
              id={`border-size-${block.id}`}
              value={blockFormat.paragraph?.border?.bottom?.size ?? 1}
              onChange={(e) => handleNumberChange(e.target.value, (num) => handleBorderChange('size', num))}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor={`border-space-${block.id}`} className="label-text">间距 (pt)</label>
            <input
              type="number"
              id={`border-space-${block.id}`}
              value={blockFormat.paragraph?.border?.bottom?.space ?? 1}
              onChange={(e) => handleNumberChange(e.target.value, (num) => handleBorderChange('space', num))}
              className="input-field"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default BlockFormatPanel; 