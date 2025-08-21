/**
 * 钉钉调试工具
 */

export function debugDingTalkAuth() {
  console.log('=== 钉钉认证调试信息 ===');
  
  // 1. 检查环境变量
  console.log('1. 环境变量:', {
    VITE_ENABLE_DINGTALK_AUTH: import.meta.env.VITE_ENABLE_DINGTALK_AUTH,
    NODE_ENV: import.meta.env.NODE_ENV
  });
  
  // 2. 检查UserAgent
  console.log('2. UserAgent检测:', {
    userAgent: navigator.userAgent,
    isDingTalk: navigator.userAgent.toLowerCase().includes('dingtalk'),
    isTaurusApp: navigator.userAgent.toLowerCase().includes('taurusapp')
  });
  
  // 3. 检查URL参数
  console.log('3. URL参数:', {
    currentURL: window.location.href,
    hasDebugParam: window.location.search.includes('debug=dingtalk'),
    hasVConsoleParam: window.location.search.includes('vconsole=true')
  });
  
  // 4. 检查sessionStorage
  const dingTalkUser = sessionStorage.getItem('dingTalkUser');
  console.log('4. SessionStorage:', {
    hasDingTalkUser: !!dingTalkUser,
    userData: dingTalkUser ? JSON.parse(dingTalkUser) : null
  });
  
  // 5. 检查钉钉API
  console.log('5. 钉钉API状态:', {
    ddExists: typeof (window as any).dd !== 'undefined',
    ddReady: typeof (window as any).dd?.ready === 'function'
  });
  
  // 6. 生成认证头
  let authHeaders = {};
  if (dingTalkUser) {
    try {
      const userData = JSON.parse(dingTalkUser);
      if (userData.userInfo && userData.userInfo.userId) {
        authHeaders = {
          'X-DingTalk-UserId': userData.userInfo.userId,
          'X-DingTalk-Auth': 'true'
        };
      }
    } catch (e) {
      console.error('解析用户数据失败:', e);
    }
  }
  console.log('6. 生成的认证头:', authHeaders);
  
  console.log('=== 调试信息结束 ===');
  
  return {
    hasAuth: Object.keys(authHeaders).length > 0,
    authHeaders
  };
}

// 将调试函数挂载到window
if (typeof window !== 'undefined') {
  (window as any).debugDingTalkAuth = debugDingTalkAuth;
}