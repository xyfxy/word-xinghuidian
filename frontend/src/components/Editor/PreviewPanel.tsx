import React, { useEffect, useState } from 'react';
import { DocumentTemplate, ContentBlock, ImageContent, PageBreakContent, TableContent } from '../../types';
import '../../styles/preview.css';

interface PreviewPanelProps {
    template: DocumentTemplate;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ template }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error] = useState<string | null>(null);

    // 字体fallback映射函数 - 移到组件顶层
    const getFontFamilyWithFallback = (fontFamily: string): string => {
        const fontFallbacks: { [key: string]: string } = {
            '宋体': `"${fontFamily}", "宋体", "SimSun", "STSong", serif`,
            '仿宋': `"仿宋", "FangSong", "仿宋_GB2312", "FangSong_GB2312", "STFangsong", "华文仿宋", serif`,
            '仿宋_GB2312': `"仿宋_GB2312", "FangSong_GB2312", "仿宋", "FangSong", "STFangsong", "华文仿宋", serif`,
            'FangSong': `"FangSong", "仿宋", "仿宋_GB2312", "FangSong_GB2312", "STFangsong", "华文仿宋", serif`,
            '黑体': `"${fontFamily}", "黑体", "SimHei", "STHeiti", sans-serif`,
            '楷体': `"${fontFamily}", "楷体", "KaiTi", "STKaiti", serif`,
            '微软雅黑': `"${fontFamily}", "微软雅黑", "Microsoft YaHei", sans-serif`,
            '华文细黑': `"${fontFamily}", "华文细黑", "STXihei", sans-serif`,
            '华文楷体': `"${fontFamily}", "华文楷体", "STKaiti", serif`,
            '华文宋体': `"${fontFamily}", "华文宋体", "STSong", serif`,
            '华文仿宋': `"${fontFamily}", "华文仿宋", "STFangsong", serif`,
            '华文中宋': `"${fontFamily}", "华文中宋", "STZhongsong", serif`,
            '华文琥珀': `"${fontFamily}", "华文琥珀", "STHupo", serif`,
            '华文新魏': `"${fontFamily}", "华文新魏", "STXinwei", serif`,
            '华文隶书': `"${fontFamily}", "华文隶书", "STLiti", serif`,
            '华文行楷': `"${fontFamily}", "华文行楷", "STXingkai", serif`,
            '方正姚体': `"${fontFamily}", "方正姚体", "FZYaoti", serif`,
            '方正舒体': `"${fontFamily}", "方正舒体", "FZShuTi", serif`,
            '隶书': `"${fontFamily}", "隶书", "LiSu", serif`,
            '幼圆': `"${fontFamily}", "幼圆", "YouYuan", serif`
        };
        
        // 查找匹配的字体
        for (const [key, fallback] of Object.entries(fontFallbacks)) {
            if (fontFamily.includes(key)) {
                return fallback;
            }
        }
        
        // 检查是否是英文字体
        const englishFonts = ['Arial', 'Times New Roman', 'Calibri', 'Verdana', 'Georgia', 'Helvetica'];
        const isEnglishFont = englishFonts.some(font => fontFamily.includes(font));
        
        if (isEnglishFont) {
            return `"${fontFamily}", sans-serif`;
        } else {
            // 未知的中文字体，提供通用的中文字体fallback
            return `"${fontFamily}", "宋体", "SimSun", serif`;
        }
    };

    useEffect(() => {
        // 模拟预览生成过程
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [template]);

    // 将像素转换为 CSS 单位
    const convertUnit = (value: number, unit: string, fontSize?: number) => {
        switch (unit) {
            case 'pt':
                return `${value}pt`;
            case 'cm':
                return `${value}cm`;
            case 'px':
                return `${value}px`;
            case 'char':
                // 字符宽度通常等于字体大小，对于中文字体这是最准确的计算方式
                const charWidth = fontSize || 14; // 默认14pt
                return `${value * charWidth}pt`;
            default:
                return `${value}px`;
        }
    };

    // 已删除未使用的 stripHtmlFormatting 函数

    // 检查内容块是否包含标题
    const hasHeading = (content: string) => {
        if (!content || typeof content !== 'string') return false;
        
        // 检查HTML标题标签 (h1-h6)
        const htmlHeadingRegex = /<h[1-6](\s|>)/i;
        
        return htmlHeadingRegex.test(content);
    };


    // 渲染内容块
    const renderContentBlock = (block: ContentBlock) => {
        const blockStyle: React.CSSProperties = {
            marginBottom: '16px',
            position: 'relative',
        };

        // 应用字体样式
        const fontStyle: React.CSSProperties = {};
        if (block.format.useGlobalFormat !== false) {
            // 使用全局样式
            const globalFontFamily = template.format.font.family;
            fontStyle.fontFamily = getFontFamilyWithFallback(globalFontFamily);
            fontStyle.fontSize = `${template.format.font.size}pt`;
            fontStyle.color = template.format.font.color;
            if (template.format.font.bold) fontStyle.fontWeight = 'bold';
            if (template.format.font.italic) fontStyle.fontStyle = 'italic';
            if (template.format.font.underline) fontStyle.textDecoration = 'underline';
        } else if (block.format?.font) {
            // 使用块级样式
            if (block.format.font.family) {
                fontStyle.fontFamily = getFontFamilyWithFallback(block.format.font.family);
            }
            if (block.format.font.size) fontStyle.fontSize = `${block.format.font.size}pt`;
            if (block.format.font.color) fontStyle.color = block.format.font.color;
            if (block.format.font.bold) fontStyle.fontWeight = 'bold';
            if (block.format.font.italic) fontStyle.fontStyle = 'italic';
            if (block.format.font.underline) fontStyle.textDecoration = 'underline';
        }

        // 应用段落样式
        const paragraphStyle: React.CSSProperties = {};
        
        // 获取当前有效字体大小
        let currentFontSize = template.format.font.size; // 默认使用全局字体大小
        if (block.format.font && block.format.font.size) {
            currentFontSize = block.format.font.size; // 如果有块级字体大小，优先使用
        }
        
        if (block.format.useGlobalFormat !== false) {
            // 使用全局段落样式
            paragraphStyle.textAlign = template.format.paragraph.alignment;
            paragraphStyle.lineHeight = template.format.paragraph.lineHeight;
            paragraphStyle.marginBottom = `${template.format.paragraph.paragraphSpacing}pt`;
            if (template.format.paragraph.indent.firstLine) {
                paragraphStyle.textIndent = convertUnit(
                    template.format.paragraph.indent.firstLine,
                    template.format.paragraph.indent.firstLineUnit || 'pt',
                    currentFontSize
                );
            }
            if (template.format.paragraph.indent.left) {
                paragraphStyle.paddingLeft = convertUnit(
                    template.format.paragraph.indent.left,
                    template.format.paragraph.indent.leftUnit || 'pt',
                    currentFontSize
                );
            }
            if (template.format.paragraph.indent.right) {
                paragraphStyle.paddingRight = convertUnit(
                    template.format.paragraph.indent.right,
                    template.format.paragraph.indent.rightUnit || 'pt',
                    currentFontSize
                );
            }
        } else if (block.format.paragraph) {
            // 使用块级段落样式
            if (block.format.paragraph.alignment) paragraphStyle.textAlign = block.format.paragraph.alignment;
            if (block.format.paragraph.lineHeight) paragraphStyle.lineHeight = block.format.paragraph.lineHeight;
            if (block.format.paragraph.paragraphSpacing) paragraphStyle.marginBottom = `${block.format.paragraph.paragraphSpacing}pt`;
            if (block.format.paragraph.indent) {
                if (block.format.paragraph.indent.firstLine) {
                    paragraphStyle.textIndent = convertUnit(
                        block.format.paragraph.indent.firstLine,
                        block.format.paragraph.indent.firstLineUnit || 'pt',
                        currentFontSize
                    );
                }
                if (block.format.paragraph.indent.left) {
                    paragraphStyle.paddingLeft = convertUnit(
                        block.format.paragraph.indent.left,
                        block.format.paragraph.indent.leftUnit || 'pt',
                        currentFontSize
                    );
                }
                if (block.format.paragraph.indent.right) {
                    paragraphStyle.paddingRight = convertUnit(
                        block.format.paragraph.indent.right,
                        block.format.paragraph.indent.rightUnit || 'pt',
                        currentFontSize
                    );
                }
            }
        }

        // 边框样式
        if (block.format.paragraph?.border?.bottom) {
            const border = block.format.paragraph.border.bottom;
            let borderValue = '';
            switch (border.style) {
                case 'single':
                    borderValue = `${border.size}px solid ${border.color}`;
                    break;
                case 'double':
                    borderValue = `${border.size}px double ${border.color}`;
                    break;
                case 'thickThin':
                    // 实现粗细线效果，使用CSS的border-image或多重边框
                    const borderSize = border.size || 2;
                    paragraphStyle.borderBottom = `${borderSize}px solid ${border.color}`;
                    paragraphStyle.boxShadow = `0 ${borderSize + 1}px 0 0 ${border.color}`;
                    break;
                default:
                    borderValue = 'none';
            }
            if (border.style !== 'thickThin' && borderValue !== 'none') {
                paragraphStyle.borderBottom = borderValue;
            }
            if (border.style !== 'none') {
                paragraphStyle.paddingBottom = `${border.space}pt`;
            }
        }

        if (block.type === 'text') {
            const rawContent = typeof block.content === 'string' ? block.content : '';
            
            // 始终保留HTML格式，让HTML样式优先
            const content = rawContent;
            
            // 创建一个包装样式，不设置可能冲突的属性
            const wrapperStyle: React.CSSProperties = {
                ...blockStyle,
                ...paragraphStyle,
            };
            
            // 根据是否使用全局格式来决定默认样式
            const shouldUseGlobal = block.format?.useGlobalFormat !== false;
            const defaultFontStyle = shouldUseGlobal ? {
                fontFamily: getFontFamilyWithFallback(template.format.font.family),
                fontSize: `${template.format.font.size}pt`,
                color: template.format.font.color,
                fontWeight: (template.format.font.bold ? 'bold' : 'normal') as any,
                fontStyle: template.format.font.italic ? 'italic' : 'normal',
                textDecoration: template.format.font.underline ? 'underline' : 'none',
            } : {
                // 当使用块级样式时，确保字体样式被正确应用
                fontFamily: fontStyle.fontFamily || getFontFamilyWithFallback('宋体'),
                fontSize: fontStyle.fontSize || '12pt',
                color: fontStyle.color || '#000000',
                fontWeight: fontStyle.fontWeight || 'normal' as any,
                fontStyle: fontStyle.fontStyle || 'normal',
                textDecoration: fontStyle.textDecoration || 'none',
            };
            
            
            // 设置默认样式，HTML内联样式和语义标签会自动覆盖
            const contentStyle: React.CSSProperties = {
                margin: 0,
                padding: 0,
                lineHeight: 'inherit',
                ...defaultFontStyle,
            };

            // 如果启用了标题格式分离，生成标题样式
            let headingStyles = '';
            if (block.format?.enableHeadingFormat && block.format?.headingFormat) {
                const headingFormat = block.format.headingFormat;
                const blockId = `block-${block.id}`;
                
                // 生成分级标题样式的辅助函数
                const generateLevelStyle = (level: 'h1' | 'h2' | 'h3') => {
                    // 获取当前级别的格式设置（优先使用分级格式，然后是统一标题格式，最后是正文/全局格式）
                    const levelFormat = headingFormat.levels?.[level];
                    
                    const fontFamily = levelFormat?.font?.family || 
                        headingFormat.font?.family || 
                        (shouldUseGlobal ? template.format.font.family : (block.format.font?.family || template.format.font.family));
                    const fontSize = levelFormat?.font?.size || 
                        headingFormat.font?.size || 
                        (shouldUseGlobal ? template.format.font.size : (block.format.font?.size || template.format.font.size));
                    const color = levelFormat?.font?.color || 
                        headingFormat.font?.color || 
                        (shouldUseGlobal ? template.format.font.color : (block.format.font?.color || template.format.font.color));
                    const bold = levelFormat?.font?.bold !== undefined ? levelFormat.font.bold : 
                        (headingFormat.font?.bold !== undefined ? headingFormat.font.bold : 
                        (shouldUseGlobal ? template.format.font.bold : (block.format.font?.bold || template.format.font.bold)));
                    const italic = levelFormat?.font?.italic !== undefined ? levelFormat.font.italic : 
                        (headingFormat.font?.italic !== undefined ? headingFormat.font.italic : 
                        (shouldUseGlobal ? template.format.font.italic : (block.format.font?.italic || template.format.font.italic)));
                    const underline = levelFormat?.font?.underline !== undefined ? levelFormat.font.underline : 
                        (headingFormat.font?.underline !== undefined ? headingFormat.font.underline : 
                        (shouldUseGlobal ? template.format.font.underline : (block.format.font?.underline || template.format.font.underline)));
                    
                    const alignment = levelFormat?.paragraph?.alignment || 
                        headingFormat.paragraph?.alignment || 
                        (shouldUseGlobal ? template.format.paragraph.alignment : (block.format.paragraph?.alignment || template.format.paragraph.alignment));
                    const lineHeight = levelFormat?.paragraph?.lineHeight || 
                        headingFormat.paragraph?.lineHeight || 
                        (shouldUseGlobal ? template.format.paragraph.lineHeight : (block.format.paragraph?.lineHeight || template.format.paragraph.lineHeight));
                    
                    const indentFirst = levelFormat?.paragraph?.indent?.firstLine !== undefined 
                        ? convertUnit(
                            levelFormat.paragraph.indent.firstLine,
                            levelFormat.paragraph.indent.firstLineUnit || 'pt',
                            fontSize
                          )
                        : (headingFormat.paragraph?.indent?.firstLine !== undefined 
                            ? convertUnit(
                                headingFormat.paragraph.indent.firstLine,
                                headingFormat.paragraph.indent.firstLineUnit || 'pt',
                                fontSize
                              )
                            : '0px');
                            
                    const indentLeft = levelFormat?.paragraph?.indent?.left !== undefined 
                        ? convertUnit(
                            levelFormat.paragraph.indent.left,
                            levelFormat.paragraph.indent.leftUnit || 'pt',
                            fontSize
                          )
                        : (headingFormat.paragraph?.indent?.left !== undefined 
                            ? convertUnit(
                                headingFormat.paragraph.indent.left,
                                headingFormat.paragraph.indent.leftUnit || 'pt',
                                fontSize
                              )
                            : '0px');

                    return `
                        .${blockId} ${level} {
                            font-family: ${getFontFamilyWithFallback(fontFamily)} !important;
                            font-size: ${fontSize}pt !important;
                            color: ${color} !important;
                            font-weight: ${bold ? 'bold' : 'normal'} !important;
                            font-style: ${italic ? 'italic' : 'normal'} !important;
                            text-decoration: ${underline ? 'underline' : 'none'} !important;
                            text-align: ${alignment} !important;
                            line-height: ${lineHeight} !important;
                            text-indent: ${indentFirst} !important;
                            padding-left: ${indentLeft} !important;
                            margin: 0 !important;
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                        }`;
                };

                const levelStyles = [
                    generateLevelStyle('h1'),
                    generateLevelStyle('h2'),
                    generateLevelStyle('h3')
                ].join('\n');

                headingStyles = `
                    <style>
                        ${levelStyles}
                    </style>
                `;
            }
            

            // 处理内容中的标题，为标题添加空行（支持分级设置）
            let processedContent = content;
            if (block.format?.enableHeadingFormat && hasHeading(content)) {
                const headingFormat = block.format.headingFormat;
                
                // 记录每个级别是否已经出现过第一个标题
                const firstHeadingByLevel: { [key: string]: boolean } = {};
                
                processedContent = content.replace(/<h([1-6])(\s|>)/gi, (match, level) => {
                    const levelKey = `h${level}` as 'h1' | 'h2' | 'h3';
                    const levelFormat = headingFormat?.levels?.[levelKey];
                    
                    // 检查是否启用了"所有标题上空行"
                    if (levelFormat?.addSpaceBeforeAll) {
                        // 所有该级别标题都添加空行
                        return `<br>${match}`;
                    }
                    
                    // 检查是否启用了"除第一个外空行"（仅检查当前级别的设置）
                    const shouldAddSpaceExceptFirst = levelFormat?.addSpaceBeforeExceptFirst;
                    
                    if (shouldAddSpaceExceptFirst) {
                        // 如果是该级别的第一个标题，不添加空行
                        if (!firstHeadingByLevel[levelKey]) {
                            firstHeadingByLevel[levelKey] = true;
                            return match;
                        }
                        // 其他同级标题前添加空行
                        return `<br>${match}`;
                    }
                    
                    return match;
                });
            }

            return (
                <div key={block.id} style={wrapperStyle}>
                    {headingStyles && <div dangerouslySetInnerHTML={{ __html: headingStyles }} />}
                    <div 
                        className={`preview-content-block ${block.format?.enableHeadingFormat ? `block-${block.id}` : ''}`}
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                        style={contentStyle}
                    />
                </div>
            );
        }

        if (block.type === 'ai-generated') {
            const rawContent = typeof block.content === 'string' ? block.content : '';
            
            // 始终保留HTML格式，让HTML样式优先
            const content = rawContent;
            
            // 创建一个包装样式，不设置可能冲突的属性
            const wrapperStyle: React.CSSProperties = {
                ...blockStyle,
                ...paragraphStyle,
            };
            
            // 根据是否使用全局格式来决定默认样式
            const shouldUseGlobal = block.format?.useGlobalFormat !== false;
            const defaultFontStyle = shouldUseGlobal ? {
                fontFamily: getFontFamilyWithFallback(template.format.font.family),
                fontSize: `${template.format.font.size}pt`,
                color: template.format.font.color,
                fontWeight: (template.format.font.bold ? 'bold' : 'normal') as any,
                fontStyle: template.format.font.italic ? 'italic' : 'normal',
                textDecoration: template.format.font.underline ? 'underline' : 'none',
            } : {
                // 当使用块级样式时，确保字体样式被正确应用
                fontFamily: fontStyle.fontFamily || getFontFamilyWithFallback('宋体'),
                fontSize: fontStyle.fontSize || '12pt',
                color: fontStyle.color || '#000000',
                fontWeight: fontStyle.fontWeight || 'normal' as any,
                fontStyle: fontStyle.fontStyle || 'normal',
                textDecoration: fontStyle.textDecoration || 'none',
            };
            
            // 设置默认样式，HTML内联样式和语义标签会自动覆盖
            const contentStyle: React.CSSProperties = {
                margin: 0,
                padding: 0,
                lineHeight: 'inherit',
                ...defaultFontStyle,
            };

            // 如果启用了标题格式分离，生成标题样式
            let headingStyles = '';
            if (block.format?.enableHeadingFormat && block.format?.headingFormat) {
                const headingFormat = block.format.headingFormat;
                const blockId = `block-${block.id}`;
                
                // 生成分级标题样式的辅助函数
                const generateLevelStyle = (level: 'h1' | 'h2' | 'h3') => {
                    // 获取当前级别的格式设置（优先使用分级格式，然后是统一标题格式，最后是正文/全局格式）
                    const levelFormat = headingFormat.levels?.[level];
                    
                    const fontFamily = levelFormat?.font?.family || 
                        headingFormat.font?.family || 
                        (shouldUseGlobal ? template.format.font.family : (block.format.font?.family || template.format.font.family));
                    const fontSize = levelFormat?.font?.size || 
                        headingFormat.font?.size || 
                        (shouldUseGlobal ? template.format.font.size : (block.format.font?.size || template.format.font.size));
                    const color = levelFormat?.font?.color || 
                        headingFormat.font?.color || 
                        (shouldUseGlobal ? template.format.font.color : (block.format.font?.color || template.format.font.color));
                    const bold = levelFormat?.font?.bold !== undefined ? levelFormat.font.bold : 
                        (headingFormat.font?.bold !== undefined ? headingFormat.font.bold : 
                        (shouldUseGlobal ? template.format.font.bold : (block.format.font?.bold || template.format.font.bold)));
                    const italic = levelFormat?.font?.italic !== undefined ? levelFormat.font.italic : 
                        (headingFormat.font?.italic !== undefined ? headingFormat.font.italic : 
                        (shouldUseGlobal ? template.format.font.italic : (block.format.font?.italic || template.format.font.italic)));
                    const underline = levelFormat?.font?.underline !== undefined ? levelFormat.font.underline : 
                        (headingFormat.font?.underline !== undefined ? headingFormat.font.underline : 
                        (shouldUseGlobal ? template.format.font.underline : (block.format.font?.underline || template.format.font.underline)));
                    
                    const alignment = levelFormat?.paragraph?.alignment || 
                        headingFormat.paragraph?.alignment || 
                        (shouldUseGlobal ? template.format.paragraph.alignment : (block.format.paragraph?.alignment || template.format.paragraph.alignment));
                    const lineHeight = levelFormat?.paragraph?.lineHeight || 
                        headingFormat.paragraph?.lineHeight || 
                        (shouldUseGlobal ? template.format.paragraph.lineHeight : (block.format.paragraph?.lineHeight || template.format.paragraph.lineHeight));
                    
                    const indentFirst = levelFormat?.paragraph?.indent?.firstLine !== undefined 
                        ? convertUnit(
                            levelFormat.paragraph.indent.firstLine,
                            levelFormat.paragraph.indent.firstLineUnit || 'pt',
                            fontSize
                          )
                        : (headingFormat.paragraph?.indent?.firstLine !== undefined 
                            ? convertUnit(
                                headingFormat.paragraph.indent.firstLine,
                                headingFormat.paragraph.indent.firstLineUnit || 'pt',
                                fontSize
                              )
                            : '0px');
                            
                    const indentLeft = levelFormat?.paragraph?.indent?.left !== undefined 
                        ? convertUnit(
                            levelFormat.paragraph.indent.left,
                            levelFormat.paragraph.indent.leftUnit || 'pt',
                            fontSize
                          )
                        : (headingFormat.paragraph?.indent?.left !== undefined 
                            ? convertUnit(
                                headingFormat.paragraph.indent.left,
                                headingFormat.paragraph.indent.leftUnit || 'pt',
                                fontSize
                              )
                            : '0px');

                    return `
                        .${blockId} ${level} {
                            font-family: ${getFontFamilyWithFallback(fontFamily)} !important;
                            font-size: ${fontSize}pt !important;
                            color: ${color} !important;
                            font-weight: ${bold ? 'bold' : 'normal'} !important;
                            font-style: ${italic ? 'italic' : 'normal'} !important;
                            text-decoration: ${underline ? 'underline' : 'none'} !important;
                            text-align: ${alignment} !important;
                            line-height: ${lineHeight} !important;
                            text-indent: ${indentFirst} !important;
                            padding-left: ${indentLeft} !important;
                            margin: 0 !important;
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                        }`;
                };

                const levelStyles = [
                    generateLevelStyle('h1'),
                    generateLevelStyle('h2'),
                    generateLevelStyle('h3')
                ].join('\n');

                headingStyles = `
                    <style>
                        ${levelStyles}
                    </style>
                `;
            }
            

            // 处理内容中的标题，为标题添加空行（支持分级设置）
            let processedContent = content;
            if (block.format?.enableHeadingFormat && hasHeading(content)) {
                const headingFormat = block.format.headingFormat;
                
                // 记录每个级别是否已经出现过第一个标题
                const firstHeadingByLevel: { [key: string]: boolean } = {};
                
                processedContent = content.replace(/<h([1-6])(\s|>)/gi, (match, level) => {
                    const levelKey = `h${level}` as 'h1' | 'h2' | 'h3';
                    const levelFormat = headingFormat?.levels?.[levelKey];
                    
                    // 检查是否启用了"所有标题上空行"
                    if (levelFormat?.addSpaceBeforeAll) {
                        // 所有该级别标题都添加空行
                        return `<br>${match}`;
                    }
                    
                    // 检查是否启用了"除第一个外空行"（仅检查当前级别的设置）
                    const shouldAddSpaceExceptFirst = levelFormat?.addSpaceBeforeExceptFirst;
                    
                    if (shouldAddSpaceExceptFirst) {
                        // 如果是该级别的第一个标题，不添加空行
                        if (!firstHeadingByLevel[levelKey]) {
                            firstHeadingByLevel[levelKey] = true;
                            return match;
                        }
                        // 其他同级标题前添加空行
                        return `<br>${match}`;
                    }
                    
                    return match;
                });
            }

            return (
                <div key={block.id} style={wrapperStyle}>
                    {headingStyles && <div dangerouslySetInnerHTML={{ __html: headingStyles }} />}
                    <div 
                        className={`preview-content-block ${block.format?.enableHeadingFormat ? `block-${block.id}` : ''}`}
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                        style={contentStyle}
                    />
                </div>
            );
        }

        if (block.type === 'two-column' && typeof block.content === 'object' && block.content && 'left' in block.content) {
            // 使用 flexbox 布局实现真正的两端对齐
            const containerFlexStyle: React.CSSProperties = {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                width: '100%',
            };

            const leftStyle: React.CSSProperties = {
                ...fontStyle,
                textAlign: 'left',
                whiteSpace: 'nowrap', // 防止换行
                flex: '0 0 auto', // 不拉伸，根据内容确定宽度
            };

            const rightStyle: React.CSSProperties = {
                ...fontStyle,
                textAlign: 'right',
                whiteSpace: 'nowrap', // 防止换行
                flex: '0 0 auto', // 不拉伸，根据内容确定宽度
            };

            // 合并容器样式
            const containerStyle: React.CSSProperties = {
                ...blockStyle,
                ...containerFlexStyle,
                ...paragraphStyle, // 包含边框等样式
            };

            return (
                <div key={block.id} style={containerStyle}>
                    <div style={leftStyle}>
                        {block.content.left}
                    </div>
                    <div style={rightStyle}>
                        {block.content.right}
                    </div>
                </div>
            );
        }

        if (block.type === 'image' && typeof block.content === 'object' && block.content && 'src' in block.content) {
            const imageContent = block.content as ImageContent;
            
            // 如果没有图片源，显示占位符
            if (!imageContent.src) {
                return (
                    <div key={block.id} style={blockStyle}>
                        <div style={{
                            border: '2px dashed #ccc',
                            padding: '20px',
                            textAlign: 'center',
                            color: '#999',
                            borderRadius: '4px',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <p>图片占位符</p>
                            <p style={{ fontSize: '12px' }}>请在编辑器中上传图片</p>
                        </div>
                    </div>
                );
            }

            // 自适应模式
            let imageStyle: React.CSSProperties = {};
            let containerStyle: React.CSSProperties = { ...blockStyle };
            if (imageContent.alignment === 'auto') {
                // 自适应模式：保持图片原始比例，宽度填满容器
                imageStyle = {
                    width: '100%',
                    height: 'auto',  // 自动计算高度以保持原始比例
                    objectFit: 'contain',  // 保持图片比例
                    maxWidth: imageContent.maxWidth ? `${imageContent.maxWidth}px` : '100%',
                    maxHeight: imageContent.maxHeight ? `${imageContent.maxHeight}px` : 'none',
                    display: 'block',
                    margin: '0 auto',
                };
                containerStyle.textAlign = 'initial';
            } else {
                imageStyle = {
                    maxWidth: imageContent.maxWidth ? `${imageContent.maxWidth}px` : '100%',
                    maxHeight: imageContent.maxHeight ? `${imageContent.maxHeight}px` : 'auto',
                    width: imageContent.width ? `${imageContent.width}px` : 'auto',
                    height: imageContent.height ? `${imageContent.height}px` : 'auto',
                    display: 'inline-block',
                };
                if (imageContent.alignment === 'center') {
                    containerStyle.textAlign = 'center';
                } else if (imageContent.alignment === 'right') {
                    containerStyle.textAlign = 'right';
                } else {
                    containerStyle.textAlign = 'left';
                }
            }


            return (
                <div key={block.id} style={containerStyle}>
                    <img
                        src={imageContent.src}
                        alt={imageContent.alt}
                        style={imageStyle}
                    />
                    {imageContent.caption && (
                        <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#666',
                            fontStyle: 'italic',
                            textAlign: imageContent.alignment === 'auto' ? 'center' : imageContent.alignment
                        }}>
                            {imageContent.caption}
                        </div>
                    )}
                </div>
            );
        }

        if (block.type === 'page-break' && typeof block.content === 'object' && block.content && 'type' in block.content) {
            const pageBreakContent = block.content as PageBreakContent;
            
            return (
                <div key={block.id} style={blockStyle}>
                    <div style={{
                        borderTop: '2px dashed #007acc',
                        padding: '10px 0',
                        textAlign: 'center',
                        color: '#007acc',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: '#f0f8ff',
                        borderRadius: '4px',
                        margin: '10px 0'
                    }}>
                        <p>📄 换页符</p>
                        {pageBreakContent.settings.addBlankPage && (
                            <p style={{ fontSize: '10px', marginTop: '4px' }}>
                                + 空白页
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        if (block.type === 'table' && typeof block.content === 'object' && block.content && 'rows' in block.content) {
            const tableContent = block.content as TableContent;
            const style = tableContent.style || {};
            
            const tableStyle: React.CSSProperties = {
                width: style.width === 'full' ? '100%' : style.width === 'auto' ? 'auto' : `${style.width}px`,
                borderCollapse: 'collapse',
                ...blockStyle,
            };

            const getCellStyle = (rowIndex: number, cellIndex: number): React.CSSProperties => {
                const cell = tableContent.rows[rowIndex][cellIndex];
                const cellStyle = cell.style || {};
                const isHeaderRow = style.headerRows && rowIndex < style.headerRows;
                
                const shouldUseGlobal = block.format?.useGlobalFormat !== false;
                const fontSettings = shouldUseGlobal
                    ? template.format.font
                    : { ...template.format.font, ...block.format.font };

                return {
                    border: style.borderStyle !== 'none' 
                        ? `${style.borderWidth || 1}px ${style.borderStyle || 'solid'} ${style.borderColor || '#000000'}`
                        : 'none',
                    padding: `${style.cellPadding || 8}px`,
                    backgroundColor: cellStyle.backgroundColor || 
                        (isHeaderRow ? style.headerStyle?.backgroundColor : undefined),
                    textAlign: cellStyle.textAlign || 
                        (isHeaderRow ? style.headerStyle?.textAlign : undefined) || 
                        'left' as any,
                    verticalAlign: cellStyle.verticalAlign || 'top',
                    fontFamily: getFontFamilyWithFallback(fontSettings.family),
                    fontSize: `${fontSettings.size}pt`,
                    color: fontSettings.color,
                    fontWeight: ((isHeaderRow && style.headerStyle?.fontBold) || fontSettings.bold ? 'bold' : 'normal') as any,
                    fontStyle: fontSettings.italic ? 'italic' : 'normal',
                    textDecoration: fontSettings.underline ? 'underline' : 'none',
                };
            };

            return (
                <div key={block.id} style={blockStyle}>
                    <table style={tableStyle}>
                        <tbody>
                            {tableContent.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => {
                                        // 跳过隐藏的单元格（已被合并）
                                        if (cell.hidden) {
                                            return null;
                                        }
                                        return (
                                            <td
                                                key={cellIndex}
                                                colSpan={cell.colspan}
                                                rowSpan={cell.rowspan}
                                                style={getCellStyle(rowIndex, cellIndex)}
                                            >
                                                {cell.content}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return null;
    };

    if (isLoading) {
        return (
            <div className="flex-1 bg-gray-100 p-4 overflow-y-auto">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">正在生成Word预览...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 bg-gray-100 p-4 overflow-y-auto">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-red-600 mb-2">预览生成失败</p>
                        <p className="text-sm text-gray-500">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // 计算页面样式
    const globalFontFamily = template.format.font.family;
    const fontFamilyWithFallback = getFontFamilyWithFallback(globalFontFamily);

    const ptToPx = (pt: number) => pt * (4 / 3); // 1pt = 4/3px
    const pageMargins = template.format.page.margins;
    const scale = 0.8; // 统一的缩放比例

    const pageStyle: React.CSSProperties = {
        width: '100%',
        minHeight: `${ptToPx(template.format.page.height) * scale}px`,
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: `${ptToPx(pageMargins.top) * scale}px ${ptToPx(pageMargins.right) * scale}px ${ptToPx(pageMargins.bottom) * scale}px ${ptToPx(pageMargins.left) * scale}px`,
        fontFamily: fontFamilyWithFallback,
        fontSize: `${template.format.font.size}pt`,
        color: template.format.font.color,
        fontWeight: (template.format.font.bold ? 'bold' : 'normal') as any,
        fontStyle: template.format.font.italic ? 'italic' : 'normal',
        textDecoration: template.format.font.underline ? 'underline' : 'none',
        lineHeight: template.format.paragraph.lineHeight,
        textAlign: template.format.paragraph.alignment,
        position: 'relative',
        margin: 0,
    };

    return (
        <div className="flex-1 bg-white overflow-y-auto"> {/* 移除padding，背景改为白色 */}
            <div className="w-full"> {/* 移除max-w-none和flex justify-center */}
                <div style={pageStyle} className="word-page word-preview">
                    {template.content.map((block) => renderContentBlock(block))}
                </div>
            </div>
        </div>
    );
};

export default PreviewPanel; 