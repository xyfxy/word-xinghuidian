import axios from 'axios';
import crypto from 'crypto';

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

export class DingTalkService {
  private accessToken: string | null = null;
  private accessTokenExpireTime: number = 0;
  private jsApiTicket: string | null = null;
  private jsApiTicketExpireTime: number = 0;

  // 从环境变量获取配置
  private readonly corpId: string;
  private readonly agentId: string;
  private readonly appKey: string;
  private readonly appSecret: string;

  constructor() {
    this.corpId = process.env.DINGTALK_CORP_ID || '';
    this.agentId = process.env.DINGTALK_AGENT_ID || '';
    this.appKey = process.env.DINGTALK_APP_KEY || '';
    this.appSecret = process.env.DINGTALK_APP_SECRET || '';

    // 检查必要的配置
    if (!this.corpId || !this.agentId || !this.appKey || !this.appSecret) {
      console.warn('钉钉配置不完整，某些功能可能无法使用');
    }
  }

  /**
   * 获取Access Token
   */
  private async getAccessToken(): Promise<string> {
    // 如果token还在有效期内，直接返回
    if (this.accessToken && Date.now() < this.accessTokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.get('https://oapi.dingtalk.com/gettoken', {
        params: {
          appkey: this.appKey,
          appsecret: this.appSecret
        }
      });

      if (response.data.errcode === 0) {
        this.accessToken = response.data.access_token;
        // Token有效期为2小时，提前5分钟刷新
        this.accessTokenExpireTime = Date.now() + (7200 - 300) * 1000;
        return this.accessToken!;
      } else {
        throw new Error(`获取Access Token失败: ${response.data.errmsg}`);
      }
    } catch (error: any) {
      console.error('获取Access Token异常:', error.message);
      throw error;
    }
  }

  /**
   * 获取JSAPI Ticket
   */
  private async getJsApiTicket(): Promise<string> {
    // 如果ticket还在有效期内，直接返回
    if (this.jsApiTicket && Date.now() < this.jsApiTicketExpireTime) {
      return this.jsApiTicket;
    }

    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.get('https://oapi.dingtalk.com/get_jsapi_ticket', {
        params: {
          access_token: accessToken
        }
      });

      if (response.data.errcode === 0) {
        this.jsApiTicket = response.data.ticket;
        // Ticket有效期为2小时，提前5分钟刷新
        this.jsApiTicketExpireTime = Date.now() + (7200 - 300) * 1000;
        return this.jsApiTicket!;
      } else {
        throw new Error(`获取JSAPI Ticket失败: ${response.data.errmsg}`);
      }
    } catch (error: any) {
      console.error('获取JSAPI Ticket异常:', error.message);
      throw error;
    }
  }

  /**
   * 生成签名
   */
  private generateSignature(ticket: string, nonceStr: string, timeStamp: number, url: string): string {
    const plain = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timeStamp}&url=${url}`;
    const sha1 = crypto.createHash('sha1');
    sha1.update(plain);
    return sha1.digest('hex');
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * 获取JSAPI配置
   */
  async getJsApiConfig(url: string): Promise<DingTalkConfig> {
    try {
      const ticket = await this.getJsApiTicket();
      const nonceStr = this.generateNonceStr();
      const timeStamp = Math.floor(Date.now() / 1000);
      const signature = this.generateSignature(ticket, nonceStr, timeStamp, url);

      return {
        agentId: this.agentId,
        corpId: this.corpId,
        timeStamp,
        nonceStr,
        signature
      };
    } catch (error: any) {
      console.error('生成JSAPI配置失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(authCode: string): Promise<DingTalkUserInfo> {
    try {
      const accessToken = await this.getAccessToken();
      
      // 1. 通过免登授权码获取用户ID
      const userIdResponse = await axios.get('https://oapi.dingtalk.com/user/getuserinfo', {
        params: {
          access_token: accessToken,
          code: authCode
        }
      });

      if (userIdResponse.data.errcode !== 0) {
        throw new Error(`获取用户ID失败: ${userIdResponse.data.errmsg}`);
      }

      const userId = userIdResponse.data.userid;

      // 2. 通过用户ID获取用户详细信息
      const userDetailResponse = await axios.get('https://oapi.dingtalk.com/user/get', {
        params: {
          access_token: accessToken,
          userid: userId
        }
      });

      if (userDetailResponse.data.errcode !== 0) {
        throw new Error(`获取用户详情失败: ${userDetailResponse.data.errmsg}`);
      }

      const userDetail = userDetailResponse.data;

      return {
        userId: userDetail.userid,
        name: userDetail.name,
        avatar: userDetail.avatar,
        department: userDetail.department,
        mobile: userDetail.mobile,
        email: userDetail.email
      };
    } catch (error: any) {
      console.error('获取用户信息异常:', error.message);
      throw error;
    }
  }

  /**
   * 验证用户身份
   */
  async verifyUser(userId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      
      // 尝试获取用户信息，如果成功则用户存在
      const response = await axios.get('https://oapi.dingtalk.com/user/get', {
        params: {
          access_token: accessToken,
          userid: userId
        }
      });

      return response.data.errcode === 0;
    } catch (error) {
      console.error('验证用户身份失败:', error);
      return false;
    }
  }
}