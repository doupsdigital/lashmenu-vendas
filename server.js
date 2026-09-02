const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const ROOT = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let reqPath = parsedUrl.pathname;

  let targetFilePath = null;

  if (reqPath === '/') {
    targetFilePath = '/vendas/lpb/index.html';
  } else if (reqPath === '/admin' || reqPath === '/admin/') {
    targetFilePath = '/admin/index.html';
  } else if (reqPath === '/app' || reqPath === '/app/' || reqPath.startsWith('/app/')) {
    targetFilePath = '/admin/app.html';
  } else if (reqPath === '/editar_v2' || reqPath.startsWith('/editar_v2/')) {
    targetFilePath = '/admin/editor_v2.html';
  } else if (reqPath.startsWith('/admin/')) {
    targetFilePath = reqPath;
  } else if (reqPath.startsWith('/c/')) {
    const slug = reqPath.substring('/c/'.length).replace(/\/$/, '');
    const staticModelPath = path.join(ROOT, 'modelos', slug, 'index.html');
    if (fs.existsSync(staticModelPath)) {
      targetFilePath = `/modelos/${slug}/index.html`;
    } else {
      targetFilePath = '/catalogo/index.html';
    }
  } else if (reqPath.startsWith('/catalogo/')) {

    const rest = reqPath.substring('/catalogo/'.length);
    if (rest.includes('.')) {
      targetFilePath = reqPath;
    } else {
      targetFilePath = '/catalogo/index.html';
    }
  } else if (reqPath === '/catalogo') {
    targetFilePath = '/catalogo/index.html';
  } else if (reqPath === '/form') {
    targetFilePath = '/vendas/form/index.html';
  } else if (reqPath.startsWith('/form/')) {
    targetFilePath = '/vendas' + reqPath;
  } else if (reqPath === '/vendas/form') {
    targetFilePath = '/vendas/form/index.html';
  } else {
    const fullDirectPath = path.join(ROOT, reqPath);
    if (fs.existsSync(fullDirectPath) && fs.statSync(fullDirectPath).isDirectory() && !reqPath.endsWith('/')) {
      res.writeHead(301, { 'Location': reqPath + '/' + (parsedUrl.search || '') });
      res.end();
      return;
    }
    if (fs.existsSync(fullDirectPath) && fs.statSync(fullDirectPath).isFile()) {
      targetFilePath = reqPath;
    } else if (fs.existsSync(path.join(fullDirectPath, 'index.html'))) {
      targetFilePath = path.join(reqPath, 'index.html');
    } else {
      const slug = reqPath.split('/')[1];
      const clientDir = path.join(ROOT, 'clientes', slug);
      if (fs.existsSync(path.join(clientDir, 'index.html'))) {
        res.writeHead(301, { 'Location': `/clientes/${slug}/` + (parsedUrl.search || '') });
        res.end();
        return;
      } else {
        targetFilePath = reqPath;
      }
    }
  }

  let filePath = path.join(ROOT, targetFilePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Página ou arquivo não encontrado localmente');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor local do LashMenu rodando em http://localhost:${PORT}`);
});
