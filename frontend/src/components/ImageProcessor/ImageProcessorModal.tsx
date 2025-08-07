import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, ArrowDown, Image as ImageIcon, Copy, CopyCheck } from 'lucide-react';
import { imageService } from '../../services/imageService';
import { modelService } from '../../services/modelService';
import { AIModelListItem, ImageAnalysisResult } from '../../types/model';
import { toast } from '../../utils/toast';
import { formatMaxKbContent } from '../../utils/markdown';

interface ImageProcessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImages: (images: { base64: string; filename: string }[]) => void;
}

interface ProcessedImage {
  id: string;
  file: File;
  base64: string;
  preview: string;
  analysis?: ImageAnalysisResult;
  formattedAnalysis?: string;
  isAnalyzing?: boolean;
}

export default function ImageProcessorModal({
  isOpen,
  onClose,
  onInsertImages
}: ImageProcessorModalProps) {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [multimodalModels, setMultimodalModels] = useState<AIModelListItem[]>([]);
  const [analysisPrompt, setAnalysisPrompt] = useState('请详细描述这些图片的内容，包括主要物体、场景、文字等信息。');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载多模态模型
  React.useEffect(() => {
    if (isOpen) {
      loadMultimodalModels();
    }
  }, [isOpen]);

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

      setImages(prev => [...prev, ...newImages]);
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
    setImages(prev => prev.filter(img => img.id !== imageId));
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
        toast.success('图片分析完成');
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

    const imageData = images.map(img => ({
      base64: img.base64,
      filename: img.file.name
    }));
    
    onInsertImages(imageData);
    toast.success(`成功插入 ${imageData.length} 张图片`);
    handleClose();
  };

  // 复制单个分析结果
  const copyAnalysis = (index: number, text: string) => {
    const formattedText = `图片${index + 1}：${text}`;
    navigator.clipboard.writeText(formattedText);
    setCopiedIndex(index);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // 复制所有分析结果
  const copyAllAnalysis = () => {
    const allAnalysis = images
      .filter(img => img.analysis?.description)
      .map((img) => {
        const actualIndex = images.indexOf(img);
        return `图片${actualIndex + 1}：${img.analysis!.description}`;
      })
      .join('\n\n');
    
    if (allAnalysis) {
      navigator.clipboard.writeText(allAnalysis);
      setCopiedAll(true);
      toast.success('已复制所有分析结果');
      setTimeout(() => setCopiedAll(false), 2000);
    } else {
      toast.error('没有可复制的分析结果');
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    setImages([]);
    setSelectedModel('');
    setAnalysisPrompt('请详细描述这些图片的内容，包括主要物体、场景、文字等信息。');
    setCopiedIndex(null);
    setCopiedAll(false);
    onClose();
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
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.preview}
                          alt={`预览图 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
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
                              </div>
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
                            </div>
                            {image.formattedAnalysis ? (
                              <div 
                                className="text-sm text-gray-700 bg-gray-50 p-3 rounded border prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: image.formattedAnalysis }}
                              />
                            ) : (
                              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                                {image.analysis?.description || '无分析结果'}
                              </div>
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
                <span>已上传 {images.length} 张图片，已分析 {images.filter(img => img.analysis).length} 张</span>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}