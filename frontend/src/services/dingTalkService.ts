import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

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

  /**
   * 获取钉钉JSAPI鉴权配置
   */
  async getAuthConfig(): Promise<DingTalkConfig | null> {
    try {
      // 如果已有缓存的配置，直接返回
      if (this.config) {
        return this.config;
      }

      const response = await axios.get(`${API_BASE_URL}/dingtalk/config`, {
        params: {
          url: window.location.href.split('#')[0] // 当前页面URL，不包含#及后面部分
        }
      });

      if (response.data.success) {
        this.config = response.data.data;
        return this.config;
      } else {
        console.error('获取钉钉配置失败:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('获取钉钉配置异常:', error);
      return null;
    }
  }

  /**
   * 使用免登授权码获取用户信息
   */
  async getUserInfo(authCode: string): Promise<DingTalkUserInfo | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/dingtalk/userinfo`, {
        authCode
      });

      if (response.data.success) {
        this.userInfo = response.data.data;
        // 将用户信息存储到sessionStorage
        sessionStorage.setItem('dingTalkUser', JSON.stringify(this.userInfo));
        return this.userInfo;
      } else {
        console.error('获取用户信息失败:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('获取用户信息异常:', error);
      return null;
    }
  }

  /**
   * 获取当前已登录的用户信息
   */
  getCurrentUser(): DingTalkUserInfo | null {
    if (this.userInfo) {
      return this.userInfo;
    }

    // 尝试从sessionStorage恢复
    const cached = sessionStorage.getItem('dingTalkUser');
    if (cached) {
      try {
        this.userInfo = JSON.parse(cached);
        return this.userInfo;
      } catch (e) {
        console.error('解析缓存的用户信息失败:', e);
      }
    }

    return null;
  }

  /**
   * 清除用户信息（登出）
   */
  clearUserInfo(): void {
    this.userInfo = null;
    this.config = null;
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
}

export const dingTalkService = new DingTalkService();