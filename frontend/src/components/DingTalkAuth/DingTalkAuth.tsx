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

    // 执行钉钉JSAPI鉴权
    authenticateWithDingTalk();
  }, [enabled]);

  const authenticateWithDingTalk = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. 从后端获取鉴权配置
      const config = await dingTalkService.getAuthConfig();
      
      if (!config) {
        throw new Error('无法获取钉钉鉴权配置');
      }

      // 2. 配置钉钉JSAPI
      dd.config({
        agentId: config.agentId,
        corpId: config.corpId,
        timeStamp: config.timeStamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: [
          'runtime.info',
          'biz.contact.choose',
          'device.notification.confirm',
          'device.notification.alert',
          'device.notification.prompt',
          'biz.user.get'
        ]
      });

      // 3. 等待配置完成
      await new Promise((resolve, reject) => {
        dd.ready(() => {
          console.log('钉钉JSAPI配置成功');
          resolve(true);
        });

        dd.error((err: any) => {
          console.error('钉钉JSAPI配置失败:', err);
          reject(err);
        });
      });

      // 4. 获取免登授权码
      const authCode = await new Promise<string>((resolve, reject) => {
        (dd.runtime.permission.requestAuthCode as any)({
          corpId: config.corpId,
          onSuccess: (result: any) => {
            console.log('获取免登授权码成功');
            resolve(result.code);
          },
          onFail: (err: any) => {
            console.error('获取免登授权码失败:', err);
            reject(err);
          }
        });
      });

      // 5. 使用授权码获取用户信息
      const userInfo = await dingTalkService.getUserInfo(authCode);
      
      if (userInfo) {
        console.log('用户认证成功:', userInfo);
        setIsAuthenticated(true);
        onAuthSuccess?.(userInfo);
      } else {
        throw new Error('获取用户信息失败');
      }

    } catch (error: any) {
      console.error('钉钉鉴权失败:', error);
      setError(error.message || '钉钉鉴权失败');
      onAuthFail?.(error);
      
      // 开发环境下允许继续访问
      if (process.env.NODE_ENV === 'development') {
        toast.error('钉钉鉴权失败，开发模式下允许继续访问');
        setIsAuthenticated(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">正在进行身份认证...</p>
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
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
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