/* 临时诊断脚本：测试 WS 握手（用后即删） */
const WebSocket = require('ws');

function probe(name, url, headers) {
  return new Promise((resolve) => {
    const socket = new WebSocket(url, { headers });
    const timer = setTimeout(() => {
      socket.terminate();
      resolve(`${name}: TIMEOUT`);
    }, 4000);
    socket.on('open', () => {
      clearTimeout(timer);
      socket.close();
      resolve(`${name}: OPEN (握手成功)`);
    });
    socket.on('error', (err) => {
      clearTimeout(timer);
      resolve(`${name}: ERROR ${err.message}`);
    });
  });
}

(async () => {
  console.log(await probe('A 直连8080 无token   ', 'ws://localhost:8080/api/ws', {}));
  console.log(await probe('B 直连8080 fake token', 'ws://localhost:8080/api/ws', { Authorization: 'Bearer fake-token-for-probe' }));
  console.log(await probe('C 代理3000 无token   ', 'ws://localhost:3000/api/ws', {}));
  console.log(await probe('D 代理3000 fake token', 'ws://localhost:3000/api/ws', { Authorization: 'Bearer fake-token-for-probe' }));
})();
