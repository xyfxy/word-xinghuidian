const { exec } = require('child_process');

const port = process.argv[2] || 3003;

// 查找并结束占用端口的进程
exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
  if (error || !stdout) {
    console.log(`端口 ${port} 未被占用`);
    return;
  }

  const lines = stdout.split('\n');
  const pids = new Set();

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 4 && parts[1].includes(`:${port}`)) {
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    }
  });

  if (pids.size === 0) {
    console.log(`端口 ${port} 未被占用`);
    return;
  }

  pids.forEach(pid => {
    console.log(`正在结束进程 PID: ${pid}`);
    exec(`taskkill //F //PID ${pid}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`无法结束进程 ${pid}:`, err.message);
      } else {
        console.log(`成功结束进程 ${pid}`);
      }
    });
  });
});