import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, Settings, ArrowRight, Upload, Database, Cpu } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Word智能编辑器
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            智能文档编辑平台，支持AI内容生成、模板管理和文档导入导出
          </p>
        </div>

        {/* 功能模块 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Link to="/editor" className="card p-8 hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">文档编辑器</h3>
            <p className="text-gray-600 text-center mb-4">
              可视化编辑器，支持富文本编辑、格式设置、实时预览
            </p>
            <div className="text-center">
              <span className="inline-flex items-center text-blue-600 hover:text-blue-700">
                进入编辑器 <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </Link>

          <Link to="/templates" className="card p-8 hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <Settings className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">模板管理</h3>
            <p className="text-gray-600 text-center mb-4">
              创建、编辑和管理文档模板，支持导入导出
            </p>
            <div className="text-center">
              <span className="inline-flex items-center text-green-600 hover:text-green-700">
                管理模板 <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </Link>

          <Link to="/import-word" className="card p-8 hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <Upload className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-center">导入Word</h3>
            <p className="text-gray-600 text-center mb-4">
              上传Word文档，自动解析结构，转换为可编辑模板
            </p>
            <div className="text-center">
              <span className="inline-flex items-center text-purple-600 hover:text-purple-700">
                导入文档 <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>

        {/* 次要功能 */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Link to="/use-template" className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <Database className="h-10 w-10 text-indigo-600 mr-4" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">使用模板</h3>
                <p className="text-gray-600 text-sm">
                  快速应用已有模板，填充内容生成文档
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link to="/models" className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <Cpu className="h-10 w-10 text-orange-600 mr-4" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">AI模型配置</h3>
                <p className="text-gray-600 text-sm">
                  配置和管理AI模型，设置API密钥
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        </div>

        {/* 快速开始按钮 */}
        <div className="text-center">
          <Link
            to="/editor"
            className="inline-flex items-center btn-primary px-8 py-3 text-lg"
          >
            开始使用
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default HomePage; 