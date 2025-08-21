import React, { useEffect, useState } from 'react';
import AccessDenied from './AccessDenied';

interface DingTalkGuardProps {
  children: React.ReactNode;
  enabled?: boolean;
}

const DingTalkGuard: React.FC<DingTalkGuardProps> = ({ children, enabled = true }) => {
  const [isDingTalk, setIsDingTalk] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 如果功能未启用，直接显示内容
    if (!enabled) {
      setIsDingTalk(true);
      setIsLoading(false);
      return;
    }

    // 检测是否在钉钉环境中
    const checkDingTalkEnvironment = () => {
      const ua = navigator.userAgent.toLowerCase();
      
      // 检查 UserAgent 中是否包含 DingTalk 标识
      const isDingTalkUA = ua.includes('dingtalk') || 
                           ua.includes('aliapp(dingtalk') ||
                           ua.includes('taurusapp'); // 专有钉钉
      
      // 开发环境下的调试模式
      const isDebugMode = process.env.NODE_ENV === 'development' && 
                         window.location.search.includes('debug=dingtalk');
      
      return isDingTalkUA || isDebugMode;
    };

    // 延迟检测，确保环境加载完成
    setTimeout(() => {
      const result = checkDingTalkEnvironment();
      setIsDingTalk(result);
      setIsLoading(false);
      
      // 记录检测结果
      console.log('钉钉环境检测:', {
        userAgent: navigator.userAgent,
        isDingTalk: result,
        debugMode: window.location.search.includes('debug=dingtalk')
      });
    }, 100);
  }, [enabled]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">正在验证访问环境...</p>
        </div>
      </div>
    );
  }

  // 非钉钉环境，显示拒绝访问页面
  if (!isDingTalk) {
    return <AccessDenied />;
  }

  // 钉钉环境，显示应用内容
  return <>{children}</>;
};

export default DingTalkGuard;