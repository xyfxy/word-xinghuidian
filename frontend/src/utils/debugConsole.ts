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
      if (typeof (window as any).dd !== 'undefined') {
        const ddPlugin: any = {
          id: 'dingtalk',
          name: '钉钉',
          render: () => {
            return `
              <div>
                <h4>钉钉环境信息</h4>
                <div id="dingtalk-info">加载中...</div>
              </div>
            `;
          },
          init: () => {
            // 获取钉钉运行时信息
            const dd = (window as any).dd;
            if (typeof dd !== 'undefined' && dd.runtime) {
              dd.runtime.info({
                onSuccess: (info: any) => {
                  const el = document.getElementById('dingtalk-info');
                  if (el) {
                    el.innerHTML = `
                      <pre>${JSON.stringify(info, null, 2)}</pre>
                    `;
                  }
                },
                onFail: (err: any) => {
                  const el = document.getElementById('dingtalk-info');
                  if (el) {
                    el.innerHTML = `错误: ${JSON.stringify(err)}`;
                  }
                }
              });
            }
          }
        };
        vConsole.addPlugin(ddPlugin);
      }

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