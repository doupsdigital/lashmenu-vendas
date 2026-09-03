const fs = require('fs');
const path = require('path');

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

// 1. Verificar fechamento de tags <style> e <script> em todos os HTMLs
function walkHtml(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    let full = path.join(dir, f);
    if (f === 'node_modules' || f === '.git') return;
    if (fs.statSync(full).isDirectory()) files = files.concat(walkHtml(full));
    else if (f.endsWith('.html')) files.push(full);
  });
  return files;
}

const htmlFiles = walkHtml(ROOT);
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

// 2. Verificar integridade das animações nos modelos de catálogo
const catalogModels = ['mosaico-rose', 'mosaico-luxury', 'glamour-rose', 'glamour-midnight', 'classico-rose', 'classico-midnight'];
catalogModels.forEach(model => {
  const cssPath = path.join(ROOT, 'modelos', model, 'css', 'style.css');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    
    // Trava de animação de texto no Hero
    if (css.includes('.hero .anim-fade-up,')) {
      logErr(`modelos/${model}/css/style.css contém '.hero .anim-fade-up,', o que quebra a animação de entrada escalonada dos textos da capa!`);
    } else {
      logOk(`modelos/${model}: Animações de fade escalonado dos textos intactas.`);
    }

    // Trava de animação de zoom da capa
    if (model.startsWith('mosaico') || model.startsWith('harmonia') || model.startsWith('classico')) {
      if (!css.includes('heroKenBurns')) {
        logErr(`modelos/${model}/css/style.css não possui a animação 'heroKenBurns', o que quebra o zoom suave contínuo da Capa!`);
      } else {
        logOk(`modelos/${model}: Animação contínua de zoom Ken Burns na capa configurada.`);
      }
    } else {
      logOk(`modelos/${model}: Estrutura de animação Glamour verificada.`);
    }
  }

  // 3. Verificar imagens fundamentais de catálogo
  const heroJpg = path.join(ROOT, 'modelos', model, 'assets', 'img', 'hero.jpg');
  const heroPng = path.join(ROOT, 'modelos', model, 'assets', 'img', 'Hero.png');
  if (fs.existsSync(heroJpg)) {
    const size = fs.statSync(heroJpg).size;
    if (size < 150000) {
      logWarn(`${model}/assets/img/hero.jpg parece ter sido sobrescrito (${size} bytes). Verifique se é a foto correta da 3ª tela.`);
    } else {
      logOk(`${model}: hero.jpg (foto da 3ª tela) verificado (${size} bytes).`);
    }
  }
  if (fs.existsSync(heroPng)) {
    const size = fs.statSync(heroPng).size;
    logOk(`${model}: Hero.png (foto principal) presente (${size} bytes).`);
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
