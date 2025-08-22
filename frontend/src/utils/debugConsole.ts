/**
 * 调试控制台工具
 * 在钉钉环境或调试模式下显示vConsole
 */

export function initDebugConsole() {
  // 只在以下情况启用vConsole
  const shouldEnableVConsole = 
    // 1. 在钉钉环境中
    navigator.userAgent.toLowerCase().includes('dingtalk') ||
    // 2. URL包含debug参数
    window.location.search.includes('vconsole=true') ||
    window.location.search.includes('debug=true') ||
    // 3. 开发环境且是移动设备
    (process.env.NODE_ENV === 'development' && isMobile());

  if (shouldEnableVConsole) {
    import('vconsole').then(({ default: VConsole }) => {
      const vConsole = new VConsole({
        defaultPlugins: ['system', 'network', 'element', 'storage'],
        maxLogNumber: 1000,
        onReady: () => {
          console.log('📱 vConsole 调试面板已启用');
          console.log('环境信息:', {
            userAgent: navigator.userAgent,
            isDingTalk: navigator.userAgent.includes('DingTalk'),
            url: window.location.href,
            env: process.env.NODE_ENV
          });
        }
      });

      // 添加自定义面板显示钉钉信息
      // 注意：由于VConsole插件API的限制，暂时注释掉自定义插件
      // if (typeof (window as any).dd !== 'undefined') {
      //   try {
      //     // VConsole 3.x版本的插件需要特定的类结构
      //     // 这里简化处理，只在控制台输出钉钉信息
      //     const dd = (window as any).dd;
      //     if (dd.runtime) {
      //       dd.runtime.info({
      //         onSuccess: (info: any) => {
      //           console.log('📱 钉钉环境信息:', info);
      //         },
      //         onFail: (err: any) => {
      //           console.error('获取钉钉信息失败:', err);
      //         }
      //       });
      //     }
      //   } catch (e) {
      //     console.warn('钉钉插件初始化失败:', e);
      //   }
      // }

      // 全局错误捕获
      window.addEventListener('error', (event) => {
        console.error('❌ 全局错误:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      });

      // Promise错误捕获
      window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ Promise错误:', {
          reason: event.reason,
          promise: event.promise
        });
      });

      // 钉钉JSAPI错误监听
      if (typeof (window as any).dd !== 'undefined') {
        const dd = (window as any).dd;
        dd.error((error: any) => {
          console.error('❌ 钉钉JSAPI错误:', error);
        });
      }

      // 将vConsole实例挂载到window，方便调试
      (window as any).vConsole = vConsole;
    });
  }
}

/**
 * 检测是否为移动设备
 */
function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * 手动显示/隐藏vConsole
 */
export function toggleVConsole() {
  const vConsole = (window as any).vConsole;
  if (vConsole) {
    vConsole.show();
  } else {
    console.log('vConsole未初始化，添加 ?vconsole=true 到URL并刷新');
  }
}

// 将toggle方法挂载到window，方便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).toggleVConsole = toggleVConsole;
}