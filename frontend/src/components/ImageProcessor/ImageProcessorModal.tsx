import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, ArrowDown, Image as ImageIcon, Copy, CopyCheck, Trash2, Edit3, Save, XCircle, ChevronDown } from 'lucide-react';
import { imageService } from '../../services/imageService';
import { modelService } from '../../services/modelService';
import { AIModelListItem, ImageAnalysisResult } from '../../types/model';
import { toast } from '../../utils/toast';
import { formatMaxKbContent } from '../../utils/markdown';
import { copyToClipboard } from '../../utils/clipboard';
import { useImageProcessorStore } from '../../stores/imageProcessorStore';
import { compressBase64Image, getBase64Size } from '../../utils/imageCompress';

interface ImageProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImages: (images: { base64: string; filename: string }[]) => void;
  onInsertToPrompt?: (targetBlockId: string, outlineContent: string) => void;
  availableAIBlocks?: Array<{ id: string; title: string }>;
}

interface ProcessedImage {
  id: string;
  file: File;
  base64: string;
  preview: string;
  analysis?: ImageAnalysisResult;
  formattedAnalysis?: string;
  isAnalyzing?: boolean;
  isCachedResult?: boolean; // 标记是否为缓存恢复的结果
  isEditing?: boolean; // 是否正在编辑
  editingContent?: string; // 编辑中的内容
}

export default function ImageProcessorModal({
  isOpen,
  onClose,
  onInsertImages,
  onInsertToPrompt,
  availableAIBlocks = []
}: ImageProcessorModalProps) {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [multimodalModels, setMultimodalModels] = useState<AIModelListItem[]>([]);
  const [analysisPrompt, setAnalysisPrompt] = useState('多模态提取要点，保持原顺序，禁止扩写，输出讨论大纲。');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [showPromptInsertMenu, setShowPromptInsertMenu] = useState(false);
  const [selectedAIBlockId, setSelectedAIBlockId] = useState<string>('');
  
  // 图片处理缓存
  const { 
    currentCache, 
    setCache, 
    getCache, 
    clearCache, 
    isCacheValid, 
    updateLastUsedTime 
  } = useImageProcessorStore();

  // 加载多模态模型和缓存数据
  React.useEffect(() => {
    if (isOpen) {
      loadMultimodalModels();
      loadCachedData();
    }
  }, [isOpen]);

  // 加载缓存数据 - 显示缓存的分析结果
  const loadCachedData = () => {
    const cache = getCache();
    if (cache && isCacheValid()) {
      // 恢复设置
      setSelectedModel(cache.modelId);
      setAnalysisPrompt(cache.prompt);
      updateLastUsedTime();
      
      // 从缓存恢复压缩后的图片和分析结果
      const cachedImagesWithAnalysis = cache.images.filter(img => img.analysis?.description);
      if (cachedImagesWithAnalysis.length > 0) {
        const restoredImages: ProcessedImage[] = cachedImagesWithAnalysis.map(img => ({
          id: img.id,
          file: new File([], img.filename), // 占位符文件
          base64: img.compressedBase64, // 使用压缩后的图片数据
          preview: img.compressedBase64, // 使用压缩后的图片作为预览
          analysis: img.analysis,
          formattedAnalysis: img.formattedAnalysis,
          isCachedResult: true // 标记这是缓存结果
        }));
        
        setImages(restoredImages);
        // 静默恢复，不显示提示信息
      }
    }
  };

  const loadMultimodalModels = async () => {
    setIsLoadingModels(true);
    try {
      // 先尝试加载多模态模型
      let models = await modelService.getMultimodalModels();
      console.log('加载的多模态模型:', models);
      
      // 如果没有多模态模型，尝试获取所有模型并过滤
      if (models.length === 0) {
        console.log('没有找到多模态模型，尝试从所有模型中过滤...');
        const allModels = await modelService.getModels();
        console.log('所有模型:', allModels);
        
        // 基于模型名称过滤多模态模型
        models = allModels.filter(model => {
          const modelName = model.model.toLowerCase();
          return modelName.includes('gemini') || 
                 modelName.includes('gpt-4v') ||
                 modelName.includes('gpt-4o') ||
                 modelName.includes('claude-3') ||
                 modelName.includes('qwen-vl') ||
                 modelName.includes('vision') ||
                 modelName.includes('glm-4v') ||
                 model.multimodalSupport;
        });
        console.log('过滤后的多模态模型:', models);
      }
      
      setMultimodalModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0].id);
      }
    } catch (error: any) {
      console.error('加载多模态模型失败:', error);
      
      // 如果是API不存在错误，显示更友好的提示
      if (error.message?.includes('多模态API不存在') || error.message?.includes('404')) {
        toast.error('后端多模态API尚未启用，请检查后端服务');
      } else {
        toast.error(`加载多模态模型失败: ${error.message}`);
      }
      
      // 即使失败，也尝试设置一个空数组，避免界面崩溃
      setMultimodalModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // 限制图片数量
    if (images.length + files.length > 10) {
      toast.error('一次最多只能处理10张图片');
      return;
    }

    try {
      const newImages: ProcessedImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          toast.error(`文件 "${file.name}" 不是图片文件`);
          continue;
        }

        // 验证文件大小
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`文件 "${file.name}" 过大，最大支持5MB`);
          continue;
        }

        // 转换为base64
        const base64 = await imageService.fileToBase64(file);
        
        // 验证图片
        const validation = imageService.validateImage(base64);
        if (!validation.valid) {
          toast.error(`图片 "${file.name}": ${validation.error}`);
          continue;
        }

        newImages.push({
          id: `img_${Date.now()}_${i}`,
          file,
          base64,
          preview: base64
        });
      }

      setImages(prev => {
        const allImages = [...prev, ...newImages];
        
        // 如果是第一次上传图片，并且之前有缓存，询问是否清除
        if (prev.length === 0 && currentCache && currentCache.images.length > 0) {
          // 清除旧缓存，因为用户上传了新图片
          clearCache();
          console.log('检测到新图片上传，已清除旧缓存');
        }
        
        return allImages;
      });
      toast.success(`成功添加 ${newImages.length} 张图片`);
    } catch (error) {
      console.error('处理图片失败:', error);
      toast.error('处理图片失败');
    }

    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 删除图片
  const removeImage = (imageId: string) => {
    setImages(prev => {
      const updatedImages = prev.filter(img => img.id !== imageId);
      
      // 如果删除后没有图片了，清除缓存
      if (updatedImages.length === 0) {
        clearCache();
        toast.info('已清除缓存数据');
      } else {
        // 更新缓存中的图片列表
        const cache = getCache();
        if (cache) {
          const updatedCache = {
            ...cache,
            images: cache.images.filter(img => img.id !== imageId),
            lastUsedAt: Date.now()
          };
          setCache(updatedCache);
        }
      }
      
      return updatedImages;
    });
  };

  // 分析图片
  const analyzeImages = async () => {
    if (images.length === 0) {
      toast.error('请先上传图片');
      return;
    }

    if (!selectedModel) {
      toast.error('请选择多模态模型');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 准备分析请求
      const base64Images = images.map(img => img.base64);
      
      const response = await imageService.uploadAndAnalyze({
        modelId: selectedModel,
        images: base64Images,
        prompt: analysisPrompt,
        analysisType: 'custom'
      });

      if (response.success) {
        // 更新图片分析结果并格式化
        const updatedImages = await Promise.all(images.map(async (img, index) => {
          const analysis = response.results[index];
          let formattedAnalysis = '';
          
          if (analysis?.description) {
            // 格式化分析结果，支持Markdown
            formattedAnalysis = await formatMaxKbContent(analysis.description);
          }
          
          return {
            ...img,
            analysis,
            formattedAnalysis
          };
        }));
        
        setImages(updatedImages);
        
        // 压缩图片并保存分析结果到缓存
        try {
          console.log('开始压缩图片并保存缓存...');
          const compressedImages = await Promise.all(
            updatedImages.map(async (img) => {
              let compressedBase64 = img.base64;
              
              try {
                // 检查原图大小
                const originalSizeKB = getBase64Size(img.base64);
                console.log(`原图 ${img.file.name} 大小: ${originalSizeKB.toFixed(1)}KB`);
                
                if (originalSizeKB > 100) { // 如果大于100KB才压缩
                  compressedBase64 = await compressBase64Image(img.base64, {
                    maxWidth: 300,
                    maxHeight: 300,
                    quality: 0.7,
                    maxSizeKB: 150
                  });
                  
                  const compressedSizeKB = getBase64Size(compressedBase64);
                  console.log(`压缩后 ${img.file.name} 大小: ${compressedSizeKB.toFixed(1)}KB`);
                }
              } catch (compressError) {
                console.warn(`图片 ${img.file.name} 压缩失败:`, compressError);
                // 压缩失败时使用原图
              }
              
              return {
                id: img.id,
                filename: img.file.name,
                compressedBase64,
                analysis: img.analysis,
                formattedAnalysis: img.formattedAnalysis,
                processedAt: Date.now()
              };
            })
          );

          const cacheData = {
            modelId: selectedModel,
            prompt: analysisPrompt,
            images: compressedImages,
            createdAt: Date.now(),
            lastUsedAt: Date.now()
          };

          setCache(cacheData);
          console.log('压缩缓存保存成功');
        } catch (error) {
          console.warn('压缩或缓存保存失败:', error);
          toast.warning('缓存保存失败，但分析结果正常');
        }
        
        toast.success('图片分析完成并已缓存');
      } else {
        toast.error(response.error || '图片分析失败');
      }
    } catch (error) {
      console.error('图片分析失败:', error);
      toast.error('图片分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 插入图片到模板
  const handleInsertImages = () => {
    if (images.length === 0) {
      toast.error('请先上传图片');
      return;
    }

    // 插入所有有图片数据的图片（包括缓存的压缩图片）
    const validImages = images.filter(img => img.base64);
    
    if (validImages.length === 0) {
      toast.error('没有可插入的图片数据');
      return;
    }

    const imageData = validImages.map(img => ({
      base64: img.base64,
      filename: img.file.name
    }));
    
    onInsertImages(imageData);
    const cacheCount = validImages.filter(img => img.isCachedResult).length;
    const freshCount = validImages.length - cacheCount;
    
    if (cacheCount > 0 && freshCount > 0) {
      toast.success(`成功插入 ${validImages.length} 张图片（${freshCount} 张新图片，${cacheCount} 张缓存图片）`);
    } else if (cacheCount > 0) {
      toast.success(`成功插入 ${cacheCount} 张缓存图片`);
    } else {
      toast.success(`成功插入 ${freshCount} 张图片`);
    }
    
    handleClose();
  };

  // 复制单个分析结果
  const copyAnalysis = async (index: number, text: string) => {
    const formattedText = `图片${index + 1}：${text}`;
    const success = await copyToClipboard(formattedText);
    if (success) {
      setCopiedIndex(index);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      toast.error('复制失败，请手动复制');
    }
  };

  // 复制所有分析结果
  const copyAllAnalysis = async () => {
    const allAnalysis = images
      .filter(img => img.analysis?.description)
      .map((img) => {
        const actualIndex = images.indexOf(img);
        return `图片${actualIndex + 1}：${img.analysis!.description}`;
      })
      .join('\n\n');
    
    if (allAnalysis) {
      const success = await copyToClipboard(allAnalysis);
      if (success) {
        setCopiedAll(true);
        toast.success('已复制所有分析结果');
        setTimeout(() => setCopiedAll(false), 2000);
      } else {
        toast.error('复制失败，请手动复制');
      }
    } else {
      toast.error('没有可复制的分析结果');
    }
  };

  // 开始编辑大纲
  const startEditing = (imageId: string, content: string) => {
    setImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { ...img, isEditing: true, editingContent: content }
          : img
      )
    );
    setEditingImageId(imageId);
  };

  // 取消编辑
  const cancelEditing = (imageId: string) => {
    setImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { ...img, isEditing: false, editingContent: undefined }
          : img
      )
    );
    setEditingImageId(null);
  };

  // 保存编辑
  const saveEditing = async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image || !image.editingContent) return;

    try {
      // 格式化编辑后的内容
      const formattedContent = await formatMaxKbContent(image.editingContent);
      
      // 更新图片分析结果
      setImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { 
                ...img, 
                analysis: { 
                  ...img.analysis!, 
                  description: image.editingContent! 
                },
                formattedAnalysis: formattedContent,
                isEditing: false, 
                editingContent: undefined 
              }
            : img
        )
      );

      // 更新缓存
      const cache = getCache();
      if (cache) {
        const updatedCache = {
          ...cache,
          images: cache.images.map(img => 
            img.id === imageId 
              ? { 
                  ...img, 
                  analysis: { 
                    ...img.analysis!, 
                    description: image.editingContent! 
                  },
                  formattedAnalysis: formattedContent 
                }
              : img
          ),
          lastUsedAt: Date.now()
        };
        setCache(updatedCache);
      }

      setEditingImageId(null);
      toast.success('大纲已保存');
    } catch (error) {
      console.error('保存编辑失败:', error);
      toast.error('保存失败');
    }
  };

  // 更新编辑内容
  const updateEditingContent = (imageId: string, content: string) => {
    setImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { ...img, editingContent: content }
          : img
      )
    );
  };

  // 插入大纲到AI提示词
  const handleInsertToPrompt = () => {
    if (!selectedAIBlockId || !onInsertToPrompt) {
      toast.error('请选择目标AI内容块');
      return;
    }

    // 收集所有分析结果
    const allAnalysis = images
      .filter(img => img.analysis?.description)
      .map((img) => {
        const actualIndex = images.indexOf(img);
        return `${actualIndex + 1}. ${img.analysis!.description}`;
      })
      .join('\n');
    
    if (!allAnalysis) {
      toast.error('没有可插入的分析结果');
      return;
    }

    const outlineContent = `大纲：\n${allAnalysis}`;
    onInsertToPrompt(selectedAIBlockId, outlineContent);
    
    const targetBlock = availableAIBlocks.find(block => block.id === selectedAIBlockId);
    toast.success(`已将大纲插入到「${targetBlock?.title}」的提示词中`);
    
    setShowPromptInsertMenu(false);
    setSelectedAIBlockId('');
    handleClose();
  };

  // 关闭弹窗 - 智能缓存管理
  const handleClose = () => {
    // 如果有正在编辑的内容，提醒用户
    if (editingImageId !== null) {
      const confirmClose = confirm('您有未保存的编辑内容，确定要关闭吗？');
      if (!confirmClose) {
        return;
      }
    }
    
    // 如果当前有图片但没有分析结果，清除缓存
    const hasAnalysis = images.some(img => img.analysis?.description);
    if (images.length > 0 && !hasAnalysis) {
      clearCache();
      console.log('关闭时清除缓存：没有分析结果');
    }
    
    // 清理状态
    setCopiedIndex(null);
    setCopiedAll(false);
    setEditingImageId(null);
    setShowPromptInsertMenu(false);
    setSelectedAIBlockId('');
    onClose();
  };

  // 清除所有数据和缓存
  const handleClearAll = () => {
    setImages([]);
    setSelectedModel('');
    setAnalysisPrompt('多模态提取要点，保持原顺序，禁止扩写，输出讨论大纲。');
    setCopiedIndex(null);
    setCopiedAll(false);
    setEditingImageId(null);
    setShowPromptInsertMenu(false);
    setSelectedAIBlockId('');
    clearCache();
    toast.success('已清除所有数据和缓存');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">图片处理模块</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">上传图片，使用多模态AI进行分析，然后按顺序插入到模板中</p>
          {currentCache && isCacheValid() && currentCache.images.length > 0 && (
            <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-green-800">智能缓存已启用</div>
                  <div className="text-xs text-green-600">已保存 {currentCache.images.length} 张图片的分析结果</div>
                </div>
              </div>
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors hover:bg-red-50 px-2 py-1 rounded"
                title="清除缓存数据"
              >
                <Trash2 className="w-3 h-3" />
                <span>清除缓存</span>
              </button>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* 上传区域 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">上传图片</h3>
              <p className="text-gray-600 mb-4">支持 JPG、PNG、GIF、WebP 格式，单个文件最大 5MB，最多 10 张</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                选择图片
              </button>
            </div>

            {/* 图片列表 */}
            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">已上传的图片 ({images.length}/10)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                        <img
                          src={image.preview}
                          alt={`预览图 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* 缓存结果标识 */}
                        {image.isCachedResult && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            缓存
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                      {image.analysis && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 分析设置 */}
            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">分析设置</h3>
                
                {/* 模型选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择多模态模型</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isLoadingModels}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isLoadingModels ? (
                      <option value="">加载模型中...</option>
                    ) : multimodalModels.length === 0 ? (
                      <option value="">暂无可用的多模态模型</option>
                    ) : (
                      <>
                        <option value="">请选择模型</option>
                        {multimodalModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} ({model.model})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {multimodalModels.length === 0 && !isLoadingModels && (
                    <p className="text-sm text-red-600 mt-1">
                      没有找到支持多模态的模型，请先添加支持图片分析的AI模型
                    </p>
                  )}
                </div>

                {/* 分析提示词 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分析提示词</label>
                  <textarea
                    value={analysisPrompt}
                    onChange={(e) => setAnalysisPrompt(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="输入分析指令，AI将根据此指令分析图片内容..."
                  />
                </div>
              </div>
            )}

            {/* 分析结果 */}
            {images.some(img => img.analysis) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">分析结果</h3>
                  {images.filter(img => img.analysis).length > 1 && (
                    <button
                      onClick={copyAllAnalysis}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1 transition-colors"
                    >
                      {copiedAll ? (
                        <>
                          <CopyCheck className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">已复制全部</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>复制全部结果</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {images.map((image, index) => (
                    image.analysis && (
                      <div key={image.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <img
                              src={image.preview}
                              alt={`图片 ${index + 1}`}
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">图片 {index + 1}</span>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">
                                  已分析
                                </span>
                                {image.isEditing && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                                    编辑中
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {image.isEditing ? (
                                  <>
                                    <button
                                      onClick={() => saveEditing(image.id)}
                                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                      title="保存编辑"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => cancelEditing(image.id)}
                                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="取消编辑"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditing(image.id, image.analysis!.description || '')}
                                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                      title="编辑大纲"
                                      disabled={editingImageId !== null && editingImageId !== image.id}
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => copyAnalysis(index, image.analysis!.description || '')}
                                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                      title="复制分析结果"
                                    >
                                      {copiedIndex === index ? (
                                        <CopyCheck className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {image.isEditing ? (
                              <div className="space-y-3">
                                <textarea
                                  value={image.editingContent || ''}
                                  onChange={(e) => updateEditingContent(image.id, e.target.value)}
                                  rows={8}
                                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
                                  style={{ minHeight: '120px', maxHeight: '400px' }}
                                  placeholder="编辑大纲内容..."
                                />
                                <div className="text-xs text-gray-500">
                                  支持 Markdown 格式，使用 # 表示标题，- 表示列表项。拖动右下角可调整输入框大小。
                                </div>
                              </div>
                            ) : (
                              image.formattedAnalysis ? (
                                <div 
                                  className="text-sm text-gray-700 bg-gray-50 p-3 rounded border prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: image.formattedAnalysis }}
                                />
                              ) : (
                                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                                  {image.analysis?.description || '无分析结果'}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {images.length > 0 && (
                <span>
                  共 {images.length} 张图片，
                  已分析 {images.filter(img => img.analysis).length} 张
                  {images.some(img => img.isCachedResult) && (
                    <span className="text-green-600 font-medium">（含 {images.filter(img => img.isCachedResult).length} 张智能缓存）</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              {images.length > 0 && (
                <>
                  <button
                    onClick={analyzeImages}
                    disabled={isAnalyzing || !selectedModel || multimodalModels.length === 0}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isAnalyzing ? '分析中...' : '开始分析'}
                  </button>
                  <button
                    onClick={handleInsertImages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                    按顺序插入到模板
                  </button>
                  {/* 插入到AI提示词按钮 */}
                  {onInsertToPrompt && availableAIBlocks.length > 0 && images.some(img => img.analysis) && (
                    <div className="relative">
                      <button
                        onClick={() => setShowPromptInsertMenu(!showPromptInsertMenu)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        插入到AI提示词
                        <ChevronDown className={`w-4 h-4 transition-transform ${showPromptInsertMenu ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showPromptInsertMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                          <div className="p-4">
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                选择目标AI内容块
                              </label>
                              <select
                                value={selectedAIBlockId}
                                onChange={(e) => setSelectedAIBlockId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                              >
                                <option value="">请选择AI内容块...</option>
                                {availableAIBlocks.map(block => (
                                  <option key={block.id} value={block.id}>
                                    {block.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="text-xs text-gray-500 mb-3">
                              大纲将以“大纲：[<wbr/>分析结果]”的格式添加到所选AI块的提示词末尾
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setShowPromptInsertMenu(false)
                                  setSelectedAIBlockId('')
                                }}
                                className="flex-1 px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors"
                              >
                                取消
                              </button>
                              <button
                                onClick={handleInsertToPrompt}
                                disabled={!selectedAIBlockId}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                              >
                                确认插入
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}