import React, { useEffect, useState } from 'react';
import * as dd from 'dingtalk-jsapi';
import { dingTalkService } from '../../services/dingTalkService';
import toast from 'react-hot-toast';

interface DingTalkAuthProps {
  children: React.ReactNode;
  onAuthSuccess?: (userInfo: any) => void;
  onAuthFail?: (error: any) => void;
  enabled?: boolean;
}

const DingTalkAuth: React.FC<DingTalkAuthProps> = ({
  children,
  onAuthSuccess,
  onAuthFail,
  enabled = true
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // 如果未启用钉钉鉴权，直接通过
    if (!enabled) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // 开发环境调试模式
    if (process.env.NODE_ENV === 'development' && window.location.search.includes('debug=dingtalk')) {
      console.log('钉钉鉴权调试模式已启用');
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // 执行钉钉JSAPI鉴权（带超时控制）
    const authTimeout = setTimeout(() => {
      if (isLoading) {
        console.error('钉钉鉴权超时');
        setError('鉴权超时，请刷新重试');
        setIsLoading(false);
        
        // 开发环境允许继续
        if (process.env.NODE_ENV === 'development') {
          setIsAuthenticated(true);
        }
      }
    }, 10000); // 10秒超时

    authenticateWithDingTalk().finally(() => {
      clearTimeout(authTimeout);
    });

    return () => clearTimeout(authTimeout);
  }, [enabled, retryCount]);

  const authenticateWithDingTalk = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. 从后端获取鉴权配置（带超时）
      const configPromise = dingTalkService.getAuthConfig();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('获取配置超时')), 5000)
      );
      
      const config = await Promise.race([configPromise, timeoutPromise]) as any;
      
      if (!config) {
        throw new Error('无法获取钉钉鉴权配置');
      }

      // 2. 配置钉钉JSAPI（简化配置，只请求必要权限）
      await new Promise((resolve, reject) => {
        const configTimeout = setTimeout(() => {
          reject(new Error('JSAPI配置超时'));
        }, 5000);

        dd.config({
          agentId: config.agentId,
          corpId: config.corpId,
          timeStamp: config.timeStamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: ['runtime.permission.requestAuthCode'] // 只请求必要的权限
        });

        dd.ready(() => {
          clearTimeout(configTimeout);
          console.log('钉钉JSAPI配置成功');
          resolve(true);
        });

        dd.error((err: any) => {
          clearTimeout(configTimeout);
          console.error('钉钉JSAPI配置失败:', err);
          reject(err);
        });
      });

      // 3. 获取免登授权码（带超时）
      const authCode = await new Promise<string>((resolve, reject) => {
        const authTimeout = setTimeout(() => {
          reject(new Error('获取授权码超时'));
        }, 5000);

        (dd.runtime.permission.requestAuthCode as any)({
          corpId: config.corpId,
          onSuccess: (result: any) => {
            clearTimeout(authTimeout);
            console.log('获取免登授权码成功');
            resolve(result.code);
          },
          onFail: (err: any) => {
            clearTimeout(authTimeout);
            console.error('获取免登授权码失败:', err);
            reject(err);
          }
        });
      });

      // 4. 使用授权码获取用户信息（带超时）
      const userInfoPromise = dingTalkService.getUserInfo(authCode);
      const userInfoTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('获取用户信息超时')), 5000)
      );
      
      const userInfo = await Promise.race([userInfoPromise, userInfoTimeout]) as any;
      
      if (userInfo) {
        console.log('用户认证成功:', userInfo);
        setIsAuthenticated(true);
        onAuthSuccess?.(userInfo);
      } else {
        throw new Error('获取用户信息失败');
      }

    } catch (error: any) {
      console.error('钉钉鉴权失败:', error);
      const errorMessage = error.message || '钉钉鉴权失败';
      setError(errorMessage);
      onAuthFail?.(error);
      
      // 自动重试（最多3次）
      if (retryCount < 2 && !error.message?.includes('超时')) {
        console.log(`将在2秒后重试（第${retryCount + 1}次）`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      } else {
        // 开发环境下允许继续访问
        if (process.env.NODE_ENV === 'development') {
          toast.error('钉钉鉴权失败，开发模式下允许继续访问');
          setIsAuthenticated(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 优化的加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            {retryCount > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {retryCount}
              </div>
            )}
          </div>
          <p className="mt-4 text-gray-600">
            {retryCount > 0 ? `正在重试认证...（第${retryCount}次）` : '正在进行身份认证...'}
          </p>
          <p className="mt-2 text-sm text-gray-400">请稍候，此过程可能需要几秒钟</p>
        </div>
      </div>
    );
  }

  // 鉴权失败（生产环境）
  if (error && process.env.NODE_ENV === 'production') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">身份认证失败</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                刷新重试
              </button>
              {retryCount >= 2 && (
                <p className="text-sm text-gray-500">
                  如问题持续，请联系管理员
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 鉴权成功，显示应用内容
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
};

export default DingTalkAuth;