const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
let errors = 0;
let warnings = 0;

function logErr(msg) {
  console.error(`❌ [ERRO CRÍTICO] ${msg}`);
  errors++;
}

function logWarn(msg) {
  console.warn(`⚠️  [AVISO] ${msg}`);
  warnings++;
}

function logOk(msg) {
  console.log(`✅ [OK] ${msg}`);
}

console.log('🔍 Iniciando verificação de integridade do LashMenu...\n');

// 1. Encontrar todos os arquivos por extensão
function walkFiles(dir, ext) {
  let files = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      let full = path.join(dir, f);
      if (f === 'node_modules' || f === '.git' || f === 'scratch') return;
      if (fs.statSync(full).isDirectory()) {
        files = files.concat(walkFiles(full, ext));
      } else if (full.endsWith(ext)) {
        files.push(full);
      }
    });
  } catch (e) {}
  return files;
}

// 2. Verificar Sintaxe CSS em TODOS os arquivos .css do projeto
console.log('--- [1/4] Verificando sintaxe de arquivos CSS ---');
const cssFiles = walkFiles(ROOT, '.css');
cssFiles.forEach(file => {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  
  let depth = 0;
  let line = 1;
  let col = 0;
  let inComment = false;
  let commentStartLine = 1;
  let syntaxErrors = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    col++;

    if (char === '\n') {
      line++;
      col = 0;
    }

    if (!inComment && char === '/' && content[i + 1] === '*') {
      inComment = true;
      commentStartLine = line;
      i++; col++;
      continue;
    }

    if (inComment && char === '*' && content[i + 1] === '/') {
      inComment = false;
      i++; col++;
      continue;
    }

    if (inComment) continue;

    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth < 0) {
        syntaxErrors.push(`Chave de fechamento '}' extra sem abertura correspondente na linha ${line}`);
        depth = 0;
      }
    }
  }

  if (depth > 0) {
    syntaxErrors.push(`Bloco não fechado: faltam ${depth} chave(s) de fechamento '}' no final do arquivo`);
  }

  if (inComment) {
    syntaxErrors.push(`Comentário CSS não fechado iniciado na linha ${commentStartLine}`);
  }

  // Checagens adicionais para defeitos de escopo corrompido em CSS
  const keyframeCorruptMatches = content.match(/body\[data-theme="[^"]+"\]\s*(?:\d+%|from|to)\s*\{/gi);
  if (keyframeCorruptMatches) {
    syntaxErrors.push(`Regra de keyframe corrompida detectada: seletor de tema injetado dentro de @keyframes (ex: ${keyframeCorruptMatches[0]})`);
  }

  if (syntaxErrors.length > 0) {
    syntaxErrors.forEach(err => logErr(`${rel}: ${err}`));
  } else {
    logOk(`${rel}: Sintaxe CSS válida (${content.length} bytes, chaves balanceadas).`);
  }
});

// 3. Verificar Sintaxe JS em TODOS os arquivos .js do projeto
console.log('\n--- [2/4] Verificando sintaxe de arquivos JS ---');
const jsFiles = walkFiles(ROOT, '.js');
jsFiles.forEach(file => {
  const rel = path.relative(ROOT, file);
  try {
    execSync(`node -c "${file}"`, { stdio: 'pipe' });
    logOk(`${rel}: Sintaxe JavaScript válida.`);
  } catch (err) {
    logErr(`${rel}: Erro de sintaxe JavaScript detectado: ${err.message}`);
  }
});

// 4. Verificar fechamento de tags <style> e <script> em todos os HTMLs
console.log('\n--- [3/4] Verificando integridade das tags em arquivos HTML ---');
const htmlFiles = walkFiles(ROOT, '.html');
htmlFiles.forEach(file => {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  
  const styleOpens = (content.match(/<style\b[^>]*>/gi) || []).length;
  const styleCloses = (content.match(/<\/style>/gi) || []).length;
  if (styleOpens !== styleCloses) {
    logErr(`${rel}: tags <style> não balanceadas (aberturas: ${styleOpens}, fechamentos: ${styleCloses})`);
  }

  const scriptOpens = (content.match(/<script\b[^>]*>/gi) || []).length;
  const scriptCloses = (content.match(/<\/script>/gi) || []).length;
  if (scriptOpens !== scriptCloses) {
    logErr(`${rel}: tags <script> não balanceadas (aberturas: ${scriptOpens}, fechamentos: ${scriptCloses})`);
  }
});

// 5. Verificar integridade das animações nos modelos de catálogo
console.log('\n--- [4/4] Verificando integridade dos modelos de catálogo ---');
const catalogModels = ['mosaico', 'mosaico-rose', 'mosaico-luxury', 'glamour-rose', 'glamour-midnight', 'classico-rose', 'classico-midnight'];
catalogModels.forEach(model => {
  const cssPath = path.join(ROOT, 'modelos', model, 'css', 'style.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    
    // Trava de animação de texto no Hero
    if (css.includes('.hero .anim-fade-up,')) {
      logErr(`modelos/${model}/css/style.css contém '.hero .anim-fade-up,', o que quebra a animação de entrada escalonada dos textos da capa!`);
    }

    // Trava de animação de zoom da capa
    if (model.startsWith('mosaico') || model.startsWith('harmonia') || model.startsWith('classico')) {
      if (!css.includes('heroKenBurns')) {
        logErr(`modelos/${model}/css/style.css não possui a animação 'heroKenBurns', o que quebra o zoom suave contínuo da Capa!`);
      }
    }
  }
});

console.log(`\n========================================`);
if (errors === 0) {
  console.log(`✨ Sucesso! Nenhum erro crítico de integridade encontrado (${warnings} avisos).`);
  process.exit(0);
} else {
  console.error(`💥 Falha na integridade: ${errors} erro(s) crítico(s) detectado(s). Corrija antes de subir para produção!`);
  process.exit(1);
}
