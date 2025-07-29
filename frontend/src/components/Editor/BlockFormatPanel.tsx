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

      {/* 字体设置 */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-600">字体</p>
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
                  value={blockFormat.font?.size || ''}
                  onChange={(e) => handleFontChange('size', Number(e.target.value))}
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
                    value={blockFormat.font?.size || ''}
                    onChange={(e) => handleFontChange('size', Number(e.target.value))}
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

      {/* 段落设置 */}
      <div className="mt-4 space-y-3">
        <p className="text-xs font-medium text-gray-600">段落</p>
        <div className="grid grid-cols-2 gap-3">
           <div>
              <label htmlFor={`line-height-${block.id}`} className="label-text">行高</label>
              <input type="number" id={`line-height-${block.id}`} placeholder={String(globalFormat.paragraph.lineHeight)} value={blockFormat.paragraph?.lineHeight || ''} onChange={(e) => handleParagraphChange('lineHeight', Number(e.target.value))} className="input-field" />
           </div>
           <div>
              <label htmlFor={`spacing-${block.id}`} className="label-text">段后距 (pt)</label>
              <input type="number" id={`spacing-${block.id}`} placeholder={String(globalFormat.paragraph.paragraphSpacing)} value={blockFormat.paragraph?.paragraphSpacing || ''} onChange={(e) => handleParagraphChange('paragraphSpacing', Number(e.target.value))} className="input-field" />
           </div>
           <div>
              <label htmlFor={`space-before-${block.id}`} className="label-text">段前距 (pt)</label>
              <input type="number" id={`space-before-${block.id}`} placeholder={String(globalFormat.paragraph.spaceBefore)} value={blockFormat.paragraph?.spaceBefore || ''} onChange={(e) => handleParagraphChange('spaceBefore', Number(e.target.value))} className="input-field" />
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

      {/* 缩进设置 */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-600">缩进</p>
        <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-1">
              <label htmlFor={`indent-first-${block.id}`} className="label-text w-12">首行</label>
              <input type="number" id={`indent-first-${block.id}`} placeholder={String(globalFormat.paragraph.indent.firstLine)} value={blockFormat.paragraph?.indent?.firstLine || ''} onChange={(e) => handleIndentChange('firstLine', Number(e.target.value))} className="input-field" />
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
              <input type="number" id={`indent-left-${block.id}`} placeholder={String(globalFormat.paragraph.indent.left)} value={blockFormat.paragraph?.indent?.left || ''} onChange={(e) => handleIndentChange('left', Number(e.target.value))} className="input-field" />
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
              <input type="number" id={`indent-right-${block.id}`} placeholder={String(globalFormat.paragraph.indent.right)} value={blockFormat.paragraph?.indent?.right || ''} onChange={(e) => handleIndentChange('right', Number(e.target.value))} className="input-field" />
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
              value={blockFormat.paragraph?.border?.bottom?.size || 1}
              onChange={(e) => handleBorderChange('size', Number(e.target.value))}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor={`border-space-${block.id}`} className="label-text">间距 (pt)</label>
            <input
              type="number"
              id={`border-space-${block.id}`}
              value={blockFormat.paragraph?.border?.bottom?.space || 1}
              onChange={(e) => handleBorderChange('space', Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default BlockFormatPanel; 