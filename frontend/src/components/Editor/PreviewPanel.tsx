import React, { useEffect, useState } from 'react';
import { DocumentTemplate, ContentBlock, ImageContent, PageBreakContent } from '../../types';

interface PreviewPanelProps {
    template: DocumentTemplate;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ template }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        console.log('PreviewPanel 已挂载，模板:', template);
        
        // 模拟预览生成过程
        const timer = setTimeout(() => {
            setIsLoading(false);
            console.log('预览生成完成');
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

    // 清理HTML格式标签，只保留文本内容和基本结构
    const stripHtmlFormatting = (html: string): string => {
        if (!html) return '';
        
        // 更彻底地清理HTML格式标签
        // 保留结构性标签（如p, br, h1-h6, ul, ol, li），清理所有格式标签
        return html
            // 清理格式标签的闭合标签
            .replace(/<\/(strong|b|em|i|u|span|font|mark|del|ins|sub|sup|small|big)>/gi, '')
            // 清理格式标签的开放标签
            .replace(/<(strong|b|em|i|u|span|font|mark|del|ins|sub|sup|small|big)(\s[^>]*)?>/gi, '')
            // 清理所有内联样式属性
            .replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')
            // 清理其他常见的格式属性
            .replace(/\s*(color|font-weight|font-style|text-decoration|font-size|font-family)\s*=\s*["'][^"']*["']/gi, '')
            // 清理空的标签属性
            .replace(/<([^>]+)\s+>/gi, '<$1>')
            // 清理多余的空格
            .replace(/\s+/g, ' ')
            .trim();
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
            if (globalFontFamily.includes('仿宋')) {
                fontStyle.fontFamily = `"${globalFontFamily}", "仿宋", "FangSong", "STFangsong", serif`;
            } else {
                fontStyle.fontFamily = `"${globalFontFamily}", sans-serif`;
            }
            fontStyle.fontSize = `${template.format.font.size}pt`;
            fontStyle.color = template.format.font.color;
            if (template.format.font.bold) fontStyle.fontWeight = 'bold';
            if (template.format.font.italic) fontStyle.fontStyle = 'italic';
            if (template.format.font.underline) fontStyle.textDecoration = 'underline';
        } else if (block.format.font) {
            // 使用块级样式
            if (block.format.font.family) {
                const fontFamily = block.format.font.family;
                if (fontFamily.includes('仿宋')) {
                    fontStyle.fontFamily = `"${fontFamily}", "仿宋", "FangSong", "STFangsong", serif`;
                } else {
                    fontStyle.fontFamily = `"${fontFamily}", sans-serif`;
                }
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
                    template.format.paragraph.indent.firstLineUnit,
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
                fontFamily: template.format.font.family.includes('仿宋') 
                    ? `"${template.format.font.family}", "仿宋", "FangSong", "STFangsong", serif`
                    : `"${template.format.font.family}", sans-serif`,
                fontSize: `${template.format.font.size}pt`,
                color: template.format.font.color,
                fontWeight: template.format.font.bold ? 'bold' : 'normal',
                fontStyle: template.format.font.italic ? 'italic' : 'normal',
                textDecoration: template.format.font.underline ? 'underline' : 'none',
            } : {
                fontFamily: fontStyle.fontFamily || 'inherit',
                fontSize: fontStyle.fontSize || 'inherit',
                color: fontStyle.color || 'inherit',
                fontWeight: fontStyle.fontWeight || 'inherit',
                fontStyle: fontStyle.fontStyle || 'inherit',
                textDecoration: fontStyle.textDecoration || 'inherit',
            };
            
            // 设置默认样式，HTML内联样式和语义标签会自动覆盖
            const contentStyle: React.CSSProperties = {
                margin: 0,
                padding: 0,
                lineHeight: 'inherit',
                ...defaultFontStyle,
            };
            
            return (
                <div key={block.id} style={wrapperStyle}>
                    <div 
                        dangerouslySetInnerHTML={{ __html: content }}
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
                fontFamily: template.format.font.family.includes('仿宋') 
                    ? `"${template.format.font.family}", "仿宋", "FangSong", "STFangsong", serif`
                    : `"${template.format.font.family}", sans-serif`,
                fontSize: `${template.format.font.size}pt`,
                color: template.format.font.color,
                fontWeight: template.format.font.bold ? 'bold' : 'normal',
                fontStyle: template.format.font.italic ? 'italic' : 'normal',
                textDecoration: template.format.font.underline ? 'underline' : 'none',
            } : {
                fontFamily: fontStyle.fontFamily || 'inherit',
                fontSize: fontStyle.fontSize || 'inherit',
                color: fontStyle.color || 'inherit',
                fontWeight: fontStyle.fontWeight || 'inherit',
                fontStyle: fontStyle.fontStyle || 'inherit',
                textDecoration: fontStyle.textDecoration || 'inherit',
            };
            
            // 设置默认样式，HTML内联样式和语义标签会自动覆盖
            const contentStyle: React.CSSProperties = {
                margin: 0,
                padding: 0,
                lineHeight: 'inherit',
                ...defaultFontStyle,
            };
            
            return (
                <div key={block.id} style={wrapperStyle}>
                    <div 
                        dangerouslySetInnerHTML={{ __html: content }}
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
                imageStyle = {
                    width: '100%',
                    height: 'auto',
                    maxWidth: imageContent.maxWidth ? `${imageContent.maxWidth}px` : '100%',
                    maxHeight: imageContent.maxHeight ? `${imageContent.maxHeight}px` : 'auto',
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

            // 添加边框样式
            if (imageContent.border?.enabled) {
                imageStyle.border = `${imageContent.border.width}px ${imageContent.border.style} ${imageContent.border.color}`;
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
                        {pageBreakContent.settings.pageOrientation && (
                            <p style={{ fontSize: '10px', marginTop: '4px' }}>
                                方向: {pageBreakContent.settings.pageOrientation === 'landscape' ? '横向' : '纵向'}
                            </p>
                        )}
                    </div>
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
    const fontFamilyWithFallback = globalFontFamily.includes('仿宋') 
        ? `"${globalFontFamily}", "仿宋", "FangSong", "STFangsong", serif`
        : `"${globalFontFamily}", sans-serif`;

    const pageStyle: React.CSSProperties = {
        width: '100%', // 使用100%宽度，适应容器
        minHeight: `${template.format.page.height * 0.8}px`, // 稍微缩小高度
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: `${template.format.page.margins.top * 0.6}px ${template.format.page.margins.right * 0.8}px ${template.format.page.margins.bottom * 0.6}px ${template.format.page.margins.left * 0.8}px`, // 减少边距
        fontFamily: fontFamilyWithFallback,
        fontSize: `${template.format.font.size}pt`,
        color: template.format.font.color,
        fontWeight: template.format.font.bold ? 'bold' : 'normal',
        fontStyle: template.format.font.italic ? 'italic' : 'normal',
        textDecoration: template.format.font.underline ? 'underline' : 'none',
        lineHeight: template.format.paragraph.lineHeight,
        textAlign: template.format.paragraph.alignment,
        position: 'relative',
        margin: 0, // 移除margin
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