import React from 'react';

const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* 钉钉图标 */}
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          
          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            请在钉钉中打开
          </h1>
          
          {/* 说明文字 */}
          <p className="text-gray-600 mb-6">
            该应用仅支持在钉钉客户端内访问
          </p>
          
          {/* 分割线 */}
          <div className="border-t border-gray-200 my-6"></div>
          
          {/* 操作指引 */}
          <div className="text-left space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">如何访问：</h2>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                1
              </span>
              <p className="text-sm text-gray-600">打开钉钉客户端</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                2
              </span>
              <p className="text-sm text-gray-600">进入工作台</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                3
              </span>
              <p className="text-sm text-gray-600">找到并点击本应用</p>
            </div>
          </div>
          
          {/* 底部提示 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              如有疑问，请联系系统管理员
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;