const httpProxy = require('http-proxy');
const open = require('open');
var log = require('console-emoji')

const target = 'https://uptick.brokergenius.com/';
const port = 5050;
const time = 3000;
let requestTable = [];
const ignoreExtenstions = ['.ico', '.css', '.js', '/'];


const shouldIgnore = (request) => {
  const result =  ignoreExtenstions.find( extension => request.url.endsWith(extension));
  return result;
}

const onProxyRes = (proxyRes, request, response) => {
  if (!shouldIgnore(request)) {
    log(`Request ${request.url}`, 'ok');
  }
  let body = Buffer.from('');
  proxyRes.on('data', data => body = Buffer.concat([body, data]));
  proxyRes.on('end', () => {
    const contentType = proxyRes.headers['content-type'];
    const cookie = proxyRes.headers['set-cookie'];
    if (
      contentType.indexOf('text') >= 0 ||
      contentType.indexOf('application') >= 0
    ) {
      body = body.toString().split(target).join(`http://${request.headers.host}/`);
    }
    response.setHeader('cache-control', 'no-cache');
    cookie ? response.setHeader('set-cookie', cookie) : null;
    response.setHeader('content-type', contentType);
    response.statusCode = proxyRes.statusCode;
    if (request.url === '/') {
      log('Application reloaded', 'ok')
      requestTable = [];
    }
    if (shouldIgnore(request)) {
      response.end(body);
      return;
    }
    let timeOut;
    const allreadyRequested = requestTable.includes(request.url)

    if (allreadyRequested) {
      requestTable = requestTable.filter(url => url !== request.url);
      timeOut = 0;
    } else {
      timeOut = time;
      requestTable.push(request.url);
    }

    setTimeout(() => {
      const date = new Date();
      const formatedDate = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
      log(`${formatedDate}> Response ${request.url}  Timeout: ${timeOut}ms`, 'warn');
      response.end(body);
    }, timeOut);
   
  });
}

const proxy = httpProxy.createProxyServer(
  {
    ws: true,
    secure: false,
    autoRewrite: true,
    changeOrigin: true,
    followRedirects: true,
    target,
    selfHandleResponse: true,
    headers: {
      'accept-encoding': 'gzip;q=0,deflate,sdch'
    }
  }
)
proxy.listen(port);

proxy.on('proxyRes', onProxyRes);

// setTimeout(() => open('http://localhost:' + port), 800);

log(':star: Race Condition tester started  :star:');
log(`:sparkles: ${target} -> http://localhost:${port}/ :sparkles: `);
