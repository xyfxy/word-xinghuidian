import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Sparkles, Settings, ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 欢迎区域 */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            欢迎使用 Word
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            智能Word编辑器，结合人工编辑和AI内容生成，让文档创作更高效、更智能
          </p>
        </div>

        {/* 功能特性 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card p-8 text-center">
            <div className="flex justify-center mb-4">
              <FileText className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">智能编辑器</h3>
            <p className="text-gray-600">
              可视化Word编辑器，支持字体、行间距、缩进等完整格式设置，所见即所得
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI内容生成</h3>
            <p className="text-gray-600">
              集成千问AI，智能生成高质量内容，AI只负责内容，格式完全按预设模板执行
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="flex justify-center mb-4">
              <Settings className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">模板系统</h3>
            <p className="text-gray-600">
              强大的模板管理系统，区分固定内容和AI生成区域，一键应用格式样式
            </p>
          </div>
        </div>

        {/* 快速开始 */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            立即开始创作
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/editor"
              className="inline-flex items-center btn-primary px-8 py-3 text-lg"
            >
              开始编辑
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/templates"
              className="inline-flex items-center btn-secondary px-8 py-3 text-lg"
            >
              管理模板
              <Settings className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            如何使用
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">创建模板</h3>
              <p className="text-sm text-gray-600">
                设置文档格式，定义固定内容和AI生成区域
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">编辑内容</h3>
              <p className="text-sm text-gray-600">
                手动编辑固定段落，为AI区域设置提示词
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">AI生成</h3>
              <p className="text-sm text-gray-600">
                一键生成AI内容，自动应用预设格式
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">导出文档</h3>
              <p className="text-sm text-gray-600">
                导出标准Word文档，保持完美格式
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 