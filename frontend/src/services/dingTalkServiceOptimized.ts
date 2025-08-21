import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface DingTalkConfig {
  agentId: string;
  corpId: string;
  timeStamp: number;
  nonceStr: string;
  signature: string;
}

interface DingTalkUserInfo {
  userId: string;
  name: string;
  avatar?: string;
  department?: string[];
  mobile?: string;
  email?: string;
}

class DingTalkService {
  private config: DingTalkConfig | null = null;
  private userInfo: DingTalkUserInfo | null = null;
  private configPromise: Promise<DingTalkConfig | null> | null = null;

  /**
   * 获取钉钉JSAPI鉴权配置（优化版，带缓存和并发控制）
   */
  async getAuthConfig(): Promise<DingTalkConfig | null> {
    try {
      // 如果已有缓存的配置，直接返回
      if (this.config) {
        // 检查配置是否过期（5分钟有效期）
        const configAge = Date.now() - this.config.timeStamp * 1000;
        if (configAge < 5 * 60 * 1000) {
          return this.config;
        }
      }

      // 如果已有正在进行的请求，等待其完成
      if (this.configPromise) {
        return await this.configPromise;
      }

      // 创建新的请求
      this.configPromise = this.fetchConfig();
      const config = await this.configPromise;
      this.configPromise = null;
      
      return config;
    } catch (error) {
      this.configPromise = null;
      console.error('获取钉钉配置异常:', error);
      return null;
    }
  }

  /**
   * 实际获取配置的方法
   */
  private async fetchConfig(): Promise<DingTalkConfig | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/dingtalk/config`, {
        params: {
          url: window.location.href.split('#')[0]
        },
        timeout: 5000, // 5秒超时
        // 添加重试配置
        validateStatus: (status) => status < 500, // 只有5xx错误才重试
      });

      if (response.data.success) {
        this.config = response.data.data;
        return this.config;
      } else {
        console.error('获取钉钉配置失败:', response.data.message);
        
        // 如果是钉钉配置未完成，返回特定错误
        if (response.data.message?.includes('钉钉配置不完整')) {
          throw new Error('请先配置钉钉应用信息');
        }
        return null;
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接');
      }
      throw error;
    }
  }

  /**
   * 使用免登授权码获取用户信息（优化版）
   */
  async getUserInfo(authCode: string): Promise<DingTalkUserInfo | null> {
    try {
      // 检查缓存
      const cachedUser = this.getCachedUserInfo();
      if (cachedUser && this.isUserCacheValid()) {
        return cachedUser;
      }

      const response = await axios.post(`${API_BASE_URL}/dingtalk/userinfo`, {
        authCode
      }, {
        timeout: 5000, // 5秒超时
      });

      if (response.data.success) {
        this.userInfo = response.data.data;
        // 缓存用户信息
        this.cacheUserInfo(this.userInfo);
        return this.userInfo;
      } else {
        console.error('获取用户信息失败:', response.data.message);
        return null;
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('获取用户信息超时');
      }
      console.error('获取用户信息异常:', error);
      return null;
    }
  }

  /**
   * 缓存用户信息到sessionStorage
   */
  private cacheUserInfo(userInfo: DingTalkUserInfo): void {
    const cacheData = {
      userInfo,
      timestamp: Date.now()
    };
    sessionStorage.setItem('dingTalkUser', JSON.stringify(cacheData));
  }

  /**
   * 获取缓存的用户信息
   */
  private getCachedUserInfo(): DingTalkUserInfo | null {
    const cached = sessionStorage.getItem('dingTalkUser');
    if (cached) {
      try {
        const { userInfo } = JSON.parse(cached);
        return userInfo;
      } catch (e) {
        console.error('解析缓存的用户信息失败:', e);
      }
    }
    return null;
  }

  /**
   * 检查用户缓存是否有效（30分钟有效期）
   */
  private isUserCacheValid(): boolean {
    const cached = sessionStorage.getItem('dingTalkUser');
    if (cached) {
      try {
        const { timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        return age < 30 * 60 * 1000; // 30分钟
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * 获取当前已登录的用户信息
   */
  getCurrentUser(): DingTalkUserInfo | null {
    if (this.userInfo) {
      return this.userInfo;
    }
    return this.getCachedUserInfo();
  }

  /**
   * 清除用户信息（登出）
   */
  clearUserInfo(): void {
    this.userInfo = null;
    this.config = null;
    this.configPromise = null;
    sessionStorage.removeItem('dingTalkUser');
  }

  /**
   * 验证请求token（用于API调用）
   */
  getAuthHeaders(): Record<string, string> {
    const user = this.getCurrentUser();
    if (user) {
      return {
        'X-DingTalk-UserId': user.userId,
        'X-DingTalk-Auth': 'true'
      };
    }
    return {};
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  /**
   * 预加载钉钉JSAPI（提前加载，减少等待时间）
   */
  preloadDingTalkJS(): void {
    if (typeof dd === 'undefined') {
      const script = document.createElement('script');
      script.src = '//g.alicdn.com/dingding/dingtalk-jsapi/2.15.4/dingtalk.open.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }
}

export const dingTalkService = new DingTalkService();

// 预加载钉钉JS
if (typeof window !== 'undefined') {
  dingTalkService.preloadDingTalkJS();
}