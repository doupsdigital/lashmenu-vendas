/* ==========================================================================
   LASHMENU — MOTOR DO PROTÓTIPO DE EDIÇÃO VISUAL NO MOBILE (LIVE EDITOR V5)
   ========================================================================== */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://wffhptpsafllsmcsoiih.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ';

  class LashVisualEditor {
    constructor() {
      this.order = null;
      this.services = [];
      this.initialState = null;
      this.historyStack = [];
      this.historyIndex = -1;
      this.deletedServiceIds = [];
      this.pendingCoverFile = null;
      this.currentModalSvcPendingFile = null;
      this.isDirty = false;

      this.init();
    }

    async init() {
      const urlParams = new URLSearchParams(window.location.search);
      const isEditMode = urlParams.get('mode') === 'edit' || urlParams.get('edit') === 'true' || window.location.pathname.includes('/editar') || window.LM_LIVE_EDITOR_ACTIVE;
      if (!isEditMode) return;

      console.log('📱 [LashMenu Mobile Editor] Inicializando editor visual mobile...');
      document.body.classList.add('has-lm-editor');

      window.LashEditorInstance = this;

      this.injectCss();
      this.renderMobileBar();
      this.renderModals();

      setTimeout(async () => {
        await this.loadCurrentState();
        this.pushHistoryState('Estado Inicial');
        this.setupInlineEditing();
        this.updateToolbarState();
      }, 600);
    }

    injectCss() {
      if (!document.getElementById('lm-visual-editor-css')) {
        const link = document.createElement('link');
        link.id = 'lm-visual-editor-css';
        link.rel = 'stylesheet';
        const isSubdir = window.location.pathname.includes('/modelos/');
        link.href = isSubdir ? '../../catalogo/css/visual-editor.css' : '../catalogo/css/visual-editor.css';
        document.head.appendChild(link);
      }
    }

    async loadCurrentState() {
      const slug = this.getSlug();
      const urlParams = new URLSearchParams(window.location.search);
      const urlTheme = urlParams.get('theme');

      if (urlTheme) {
        this.applyTheme(urlTheme);
      }

      if (!slug) return;

      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?slug=eq.${encodeURIComponent(slug)}&select=*`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const orders = await res.json();
        if (orders && orders[0]) {
          this.order = orders[0];

          const svcRes = await fetch(`${SUPABASE_URL}/rest/v1/order_services?order_id=eq.${this.order.id}&order_index=gte.0&order=order_index.asc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
          });
          this.services = svcRes.ok ? await svcRes.json() : [];
          this.initialState = JSON.parse(JSON.stringify({ order: this.order, services: this.services }));

          const activeTheme = urlTheme || this.order.color_id || document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme') || 'rose';
          this.applyTheme(activeTheme);
          this.initCategories();
          this.renderCategoryFilterChips();
        }
      } catch (err) {
        console.error('Erro ao carregar estado do Supabase:', err);
      }
    }

    getSlug() {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('slug') || urlParams.get('c') || urlParams.get('p') || urlParams.get('id');
    }

    getCatalogUrl() {
      if (this.order && this.order.slug && window.location.hostname.includes('lashmenu.com')) {
        return `https://${this.order.slug}.lashmenu.com`;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      url.searchParams.delete('edit');
      url.searchParams.delete('token');
      return url.toString();
    }

    renderMobileBar() {
      const oldTb = document.getElementById('lm-editor-toolbar');
      if (oldTb) oldTb.remove();

      if (document.getElementById('lm-editor-bottom-bar')) return;

      const topStatus = document.createElement('div');
      topStatus.id = 'lm-editor-top-status';
      topStatus.innerHTML = `
        <div class="lm-top-status-badge">
          <span class="lm-status-dot" id="lm-status-dot"></span>
          <span id="lm-status-text">Edição Ativa</span>
        </div>
        <a id="lm-btn-view-catalog" href="${this.getCatalogUrl()}" target="_blank" class="lm-top-status-link" title="Ver meu catálogo oficial">
          👁️ Ver Catálogo ↗
        </a>
      `;
      document.body.appendChild(topStatus);

      const bar = document.createElement('div');
      bar.id = 'lm-editor-bottom-bar';
      bar.innerHTML = `
        <div class="lm-mb-btn-group">
          <button class="lm-mb-btn" id="lm-btn-undo" title="Desfazer" disabled>↩️</button>
          <button class="lm-mb-btn" id="lm-btn-redo" title="Refazer" disabled>↪️</button>
          <button class="lm-mb-btn" id="lm-btn-theme" title="Alternar Tema">🌸</button>
          <button class="lm-mb-btn" id="lm-btn-discard" title="Descartar">🗑️</button>
        </div>

        <button class="lm-mb-btn-save" id="lm-btn-save">
          💾 SALVAR
        </button>
      `;
      document.body.appendChild(bar);

      document.getElementById('lm-btn-undo').addEventListener('click', () => this.undo());
      document.getElementById('lm-btn-redo').addEventListener('click', () => this.redo());
      document.getElementById('lm-btn-theme').addEventListener('click', () => this.toggleTheme());
      document.getElementById('lm-btn-discard').addEventListener('click', () => this.discardChanges());
      document.getElementById('lm-btn-save').addEventListener('click', () => this.openSaveConfirmationModal());
    }

    renderModals() {
      const saveModalHtml = `
        <div class="lm-modal-overlay" id="lm-modal-save" style="display: none !important;">
          <div class="lm-modal-card">
            <h3 class="lm-modal-title">✨ Publicar Alterações</h3>
            <p class="lm-modal-desc">Confira o resumo das alterações antes de publicar no seu catálogo:</p>
            <div class="lm-modal-body">
              <div class="lm-save-summary-container" id="lm-save-summary-list"></div>
            </div>
            <div class="lm-modal-actions">
              <button class="lm-modal-btn lm-modal-btn-cancel" id="lm-modal-save-cancel">Cancelar</button>
              <button class="lm-modal-btn lm-modal-btn-confirm" id="lm-modal-save-confirm">🚀 Confirmar</button>
            </div>
          </div>
        </div>

        <!-- Modal Formulário Completo de Serviço -->
        <div class="lm-modal-overlay" id="lm-modal-service" style="display: none !important;">
          <div class="lm-modal-card">
            <h3 class="lm-modal-title" id="lm-svc-modal-title">✏️ Editar Serviço</h3>
            <div class="lm-modal-body">
              <div class="lm-form-group">
                <label>NOME DO SERVIÇO *</label>
                <input type="text" id="lm-svc-field-name" placeholder="Ex: Design de Sobrancelha">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="lm-form-group">
                  <label>PREÇO (R$) *</label>
                  <input type="text" id="lm-svc-field-price" placeholder="30,00">
                </div>
                <div class="lm-form-group">
                  <label>DURAÇÃO *</label>
                  <input type="text" id="lm-svc-field-duration" placeholder="40min">
                </div>
              </div>
              <div class="lm-form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label style="margin-bottom: 0 !important;">CATEGORIA *</label>
                  <button type="button" class="lm-btn-add-cat-inline" id="lm-btn-open-add-cat-inline" title="Criar nova categoria">+ Nova Categoria</button>
                </div>
                <select id="lm-svc-field-category" class="lm-form-select"></select>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="lm-form-group">
                  <label>MANUTENÇÃO (OPCIONAL)</label>
                  <input type="text" id="lm-svc-field-maintenance" placeholder="Ex: 60,00 (até 20 dias)">
                </div>
                <div class="lm-form-group">
                  <label>EFEITO VISUAL (OPCIONAL)</label>
                  <input type="text" id="lm-svc-field-effect" placeholder="Ex: Alinhamento, Simetria...">
                </div>
              </div>
              <div class="lm-form-group">
                <label>FOTO DO SERVIÇO</label>
                <div class="lm-svc-photo-row">
                  <div class="lm-svc-photo-preview-wrap" id="lm-svc-photo-trigger-wrap" title="Clique para alterar foto">
                    <img id="lm-svc-photo-img" src="/modelos/mosaico/assets/img/volume-brasileiro.png" alt="Foto">
                  </div>
                  <label class="lm-svc-photo-upload-btn" for="lm-svc-photo-input">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Escolher Foto</span>
                    <input type="file" accept="image/*" id="lm-svc-photo-input" style="display:none !important;">
                  </label>
                </div>
              </div>
              <div class="lm-form-group">
                <label>DESCRIÇÃO</label>
                <textarea id="lm-svc-field-desc" rows="3" placeholder="Mapeamento facial e visagismo personalizado..."></textarea>
              </div>
            </div>
            <div class="lm-modal-actions">
              <button class="lm-modal-btn lm-modal-btn-cancel" id="lm-modal-svc-cancel">Cancelar</button>
              <button class="lm-modal-btn lm-modal-btn-confirm" id="lm-modal-svc-save">💾 Salvar Alterações</button>
            </div>
          </div>
        </div>

        <!-- Modal Criar Categoria -->
        <div class="lm-modal-overlay" id="lm-modal-category" style="display: none !important;">
          <div class="lm-modal-card">
            <h3 class="lm-modal-title">➕ Criar Nova Categoria</h3>
            <p class="lm-modal-desc">Digite o nome da nova categoria para organizar seus procedimentos:</p>
            <div class="lm-modal-body">
              <div class="lm-form-group">
                <label>NOME DA CATEGORIA *</label>
                <input type="text" id="lm-cat-field-name" placeholder="Ex: Lash Lifting, Micropigmentação, Cursos...">
              </div>
            </div>
            <div class="lm-modal-actions">
              <button class="lm-modal-btn lm-modal-btn-cancel" id="lm-modal-cat-cancel">Cancelar</button>
              <button class="lm-modal-btn lm-modal-btn-confirm" id="lm-modal-cat-save">✨ Criar Categoria</button>
            </div>
          </div>
        </div>

        <!-- Modal Editar Contato (WhatsApp e Instagram - APENAS EDITAR) -->
        <div class="lm-modal-overlay" id="lm-modal-social" style="display: none !important;">
          <div class="lm-modal-card">
            <h3 class="lm-modal-title" id="lm-social-modal-title">✏️ Editar Contatos</h3>
            <div class="lm-modal-body">
              <div class="lm-form-group" id="lm-social-group-whatsapp">
                <label>WHATSAPP (COM DDD)</label>
                <input type="text" id="lm-social-field-whatsapp" placeholder="Ex: 11999998888">
              </div>
              <div class="lm-form-group" id="lm-social-group-instagram">
                <label>PERFIL DO INSTAGRAM</label>
                <input type="text" id="lm-social-field-instagram" placeholder="Ex: marialuiza.lash">
              </div>
              <div class="lm-form-group" id="lm-social-group-location">
                <label>CIDADE / ENDEREÇO</label>
                <input type="text" id="lm-social-field-location" placeholder="Ex: São Paulo - SP">
              </div>
            </div>
            <div class="lm-modal-actions">
              <button class="lm-modal-btn lm-modal-btn-cancel" id="lm-modal-social-cancel">Cancelar</button>
              <button class="lm-modal-btn lm-modal-btn-confirm" id="lm-modal-social-save">💾 Salvar</button>
            </div>
          </div>
        </div>

        <!-- Modal Sucesso (Salvar/Publicar) -->
        <div class="lm-modal-overlay" id="lm-modal-success" style="display: none !important;">
          <div class="lm-modal-card" style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 8px;">✨</div>
            <h3 class="lm-modal-title" style="font-size: 1.35rem;" id="lm-success-title">Catálogo Publicado!</h3>
            <p class="lm-modal-desc" style="margin-bottom: 20px;" id="lm-success-msg">Suas alterações foram salvas com sucesso e já estão ao vivo no seu catálogo!</p>
            <div class="lm-modal-actions">
              <button class="lm-modal-btn lm-modal-btn-cancel" id="lm-modal-success-edit">✏️ Continuar Editando</button>
              <a class="lm-modal-btn lm-modal-btn-confirm" id="lm-modal-success-view" target="_blank" href="#" style="text-decoration:none;">👁️ Ver Catálogo</a>
            </div>
          </div>
        </div>

        <!-- Modal de Confirmação Genérica (Descartar, Excluir, etc) -->
        <div class="lm-modal-overlay" id="lm-modal-confirm" style="display: none !important;">
          <div class="lm-modal-card" style="text-align: center;">
            <div style="font-size: 2.8rem; margin-bottom: 8px;" id="lm-confirm-icon">⚠️</div>
            <h3 class="lm-modal-title" id="lm-confirm-title">Confirmar Ação</h3>
            <p class="lm-modal-desc" id="lm-confirm-msg" style="margin-bottom: 20px;"></p>
            <div class="lm-modal-actions">
              <button class="lm-modal-btn lm-modal-btn-cancel" id="lm-confirm-btn-cancel">Cancelar</button>
              <button class="lm-modal-btn lm-modal-btn-confirm" id="lm-confirm-btn-ok">Confirmar</button>
            </div>
          </div>
        </div>

        <!-- Modal Alerta Genérico -->
        <div class="lm-modal-overlay" id="lm-modal-alert" style="display: none !important;">
          <div class="lm-modal-card" style="text-align: center;">
            <div style="font-size: 2.8rem; margin-bottom: 8px;" id="lm-alert-icon">⚠️</div>
            <h3 class="lm-modal-title" id="lm-alert-title">Atenção</h3>
            <p class="lm-modal-desc" id="lm-alert-msg" style="margin-bottom: 20px;"></p>
            <div class="lm-modal-actions">
              <button class="lm-modal-btn lm-modal-btn-confirm" id="lm-modal-alert-ok">Entendido</button>
            </div>
          </div>
        </div>

        <div class="lm-editor-toast" id="lm-editor-toast"></div>
      `;

      const div = document.createElement('div');
      div.innerHTML = saveModalHtml;
      document.body.appendChild(div);

      document.getElementById('lm-modal-save-cancel').addEventListener('click', () => this.closeModal('lm-modal-save'));
      document.getElementById('lm-modal-save-confirm').addEventListener('click', () => this.publishToSupabase());
      document.getElementById('lm-modal-svc-cancel').addEventListener('click', () => this.closeModal('lm-modal-service'));
      document.getElementById('lm-modal-cat-cancel').addEventListener('click', () => this.closeModal('lm-modal-category'));
      document.getElementById('lm-modal-social-cancel').addEventListener('click', () => this.closeModal('lm-modal-social'));
      document.getElementById('lm-modal-success-edit').addEventListener('click', () => this.closeModal('lm-modal-success'));
      document.getElementById('lm-modal-alert-ok').addEventListener('click', () => this.closeModal('lm-modal-alert'));

      // Fechar modal ao clicar no fundo escuro
      document.querySelectorAll('.lm-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            this.closeModal(overlay.id);
          }
        });
      });

      const photoInput = document.getElementById('lm-svc-photo-input');
      const triggerWrap = document.getElementById('lm-svc-photo-trigger-wrap');
      if (triggerWrap && photoInput) {
        triggerWrap.addEventListener('click', () => photoInput.click());
      }

      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        this.currentModalSvcPendingFile = file;
        const previewUrl = URL.createObjectURL(file);
        document.getElementById('lm-svc-photo-img').src = previewUrl;
      });

      // 🎭 MÁSCARAS DE ENTRADA (DINHEIRO E WHATSAPP)
      const priceInput = document.getElementById('lm-svc-field-price');
      if (priceInput) {
        priceInput.addEventListener('input', (e) => {
          e.target.value = this.formatCurrencyMask(e.target.value);
        });
      }

      const wspInput = document.getElementById('lm-social-field-whatsapp');
      if (wspInput) {
        wspInput.addEventListener('input', (e) => {
          e.target.value = this.formatPhoneMask(e.target.value);
        });
      }
    }

    formatCurrencyMask(val) {
      if (!val) return '';
      let clean = String(val).replace(/\D/g, '');
      if (!clean) return '';
      let numberVal = (parseInt(clean, 10) / 100).toFixed(2);
      let parts = numberVal.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.join(',');
    }

    formatPhoneMask(val) {
      if (!val) return '';
      let clean = String(val).replace(/\D/g, '');
      if (!clean) return '';
      if (clean.length > 11) clean = clean.substring(0, 11);

      if (clean.length > 10) {
        return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (clean.length > 6) {
        return clean.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
      } else if (clean.length > 2) {
        return clean.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
      } else {
        return clean.replace(/^(\d*)$/, '($1');
      }
    }

    showToast(msg) {
      const toast = document.getElementById('lm-editor-toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('is-active');
      setTimeout(() => toast.classList.remove('is-active'), 2500);
    }

    openModal(id) {
      const modal = document.getElementById(id);
      if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        void modal.offsetWidth;
        modal.classList.add('is-open');
      }
    }

    closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) {
        modal.classList.remove('is-open');
        setTimeout(() => {
          if (!modal.classList.contains('is-open')) {
            modal.style.setProperty('display', 'none', 'important');
          }
        }, 240);
      }
    }

    openSuccessModal(title = '✨ Catálogo Publicado!', msg = 'Suas alterações foram salvas com sucesso e já estão ao vivo no seu catálogo!') {
      document.getElementById('lm-success-title').textContent = title;
      document.getElementById('lm-success-msg').textContent = msg;

      const viewBtn = document.getElementById('lm-modal-success-view');
      if (viewBtn) {
        viewBtn.href = this.getCatalogUrl();
      }

      this.openModal('lm-modal-success');
    }

    openAlertModal(title, msg, icon = '⚠️') {
      document.getElementById('lm-alert-icon').textContent = icon;
      document.getElementById('lm-alert-title').textContent = title;
      document.getElementById('lm-alert-msg').textContent = msg;
      this.openModal('lm-modal-alert');
    }

    openConfirmModal(title, msg, onConfirm, icon = '⚠️') {
      document.getElementById('lm-confirm-icon').textContent = icon;
      document.getElementById('lm-confirm-title').textContent = title;
      document.getElementById('lm-confirm-msg').textContent = msg;

      const confirmBtn = document.getElementById('lm-confirm-btn-ok');
      const cancelBtn = document.getElementById('lm-confirm-btn-cancel');

      const handleConfirm = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        this.closeModal('lm-modal-confirm');
        if (typeof onConfirm === 'function') onConfirm();
      };

      const handleCancel = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        this.closeModal('lm-modal-confirm');
      };

      confirmBtn.onclick = handleConfirm;
      cancelBtn.onclick = handleCancel;

      this.openModal('lm-modal-confirm');
    }

    pushHistoryState(description = '') {
      const snapshot = JSON.parse(JSON.stringify({
        order: this.order,
        services: this.services,
        pendingCoverFile: this.pendingCoverFile
      }));

      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
      }

      this.historyStack.push(snapshot);
      this.historyIndex = this.historyStack.length - 1;
      this.isDirty = this.historyIndex > 0;
      this.updateToolbarState();
    }

    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.restoreStateFromHistory();
        this.showToast('↩️ Desfeito!');
      }
    }

    redo() {
      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyIndex++;
        this.restoreStateFromHistory();
        this.showToast('↪️ Refeito!');
      }
    }

    restoreStateFromHistory() {
      const snapshot = JSON.parse(JSON.stringify(this.historyStack[this.historyIndex]));
      this.order = snapshot.order;
      this.services = snapshot.services;
      this.pendingCoverFile = snapshot.pendingCoverFile;
      this.isDirty = this.historyIndex > 0;

      this.applyStateToDom();
      this.updateToolbarState();
    }

    updateToolbarState() {
      const btnUndo = document.getElementById('lm-btn-undo');
      const btnRedo = document.getElementById('lm-btn-redo');
      const dot = document.getElementById('lm-status-dot');
      const statusText = document.getElementById('lm-status-text');

      if (btnUndo) btnUndo.disabled = this.historyIndex <= 0;
      if (btnRedo) btnRedo.disabled = this.historyIndex >= this.historyStack.length - 1;

      if (dot && statusText) {
        if (this.isDirty) {
          dot.classList.remove('is-saved');
          statusText.textContent = 'Rascunho Não Salvo';
        } else {
          dot.classList.add('is-saved');
          statusText.textContent = 'Edição Ativa';
        }
      }
    }

    setupInlineEditing() {
      const coverContainer = document.querySelector('.hero__foto-wrap') || document.querySelector('.capa__foto-wrap') || document.querySelector('.hero-cover') || document.querySelector('.hero');
      if (coverContainer) {
        coverContainer.style.position = 'relative';
        if (!coverContainer.querySelector('.lm-cover-edit-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'lm-cover-edit-overlay';
          overlay.innerHTML = `
            <label class="lm-cover-edit-btn" title="Clique para alterar a foto de capa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span>Alterar Foto de Capa</span>
              <input type="file" accept="image/*" style="display:none !important;" id="lm-cover-file-input">
            </label>
          `;
          coverContainer.appendChild(overlay);

          const fileInput = overlay.querySelector('#lm-cover-file-input');
          fileInput.addEventListener('change', (e) => this.handleCoverFileSelect(e));

          const imgEl = coverContainer.querySelector('img, video');
          if (imgEl) {
            imgEl.style.cursor = 'pointer';
            imgEl.title = 'Clique para alterar a foto de capa';
            imgEl.addEventListener('click', (ev) => {
              if (ev.target === imgEl) {
                fileInput.click();
              }
            });
          }
        }
      }

      this.makeEditable('.hero__titulo h1, .hero__designer-name, .capa__nome, h1.designer-name', (val) => {
        const cleanName = val.split('\n')[0].replace(/Lash Designer/gi, '').replace(/Seja bem vinda/gi, '').trim();
        if (cleanName) {
          this.order.client_name = cleanName;
          this.pushHistoryState('Nome da Cliente');
        }
      });

      this.makeEditable('.hero__frase-cilios, .hero__slogan, .capa__bio, .hero-phrase', (val) => {
        this.order.hero_phrase = val;
        this.pushHistoryState('Frase de Impacto');
      });

      const gridContainer = document.querySelector('[data-grid], .studio__lista, .vitrine__grid, .mosaico__lista, .secao-catalogo .container');
      if (gridContainer && !document.getElementById('lm-btn-add-svc-wrap')) {
        const addWrap = document.createElement('div');
        addWrap.id = 'lm-btn-add-svc-wrap';
        addWrap.className = 'lm-add-service-container';
        addWrap.innerHTML = `
          <button class="lm-btn-add-service" id="lm-btn-add-svc-trigger">
            ➕ Adicionar Novo Procedimento
          </button>
        `;
        gridContainer.appendChild(addWrap);

        addWrap.querySelector('#lm-btn-add-svc-trigger').addEventListener('click', () => this.openAddServiceModal());
      }

      this.attachServiceControls();
      this.attachSocialEditControls();

      const observer = new MutationObserver(() => {
        this.attachServiceControls();
        this.attachSocialEditControls();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    makeEditable(selector, onChange) {
      const els = document.querySelectorAll(selector);
      els.forEach(el => {
        el.setAttribute('data-lm-editable', 'true');
        el.setAttribute('contenteditable', 'true');

        el.addEventListener('blur', () => {
          const text = el.innerText.trim();
          onChange(text);
        });
      });
    }

    // ── BOTÕES LÁPIS PARA WHATSAPP E INSTAGRAM DA SEÇÃO DE CONTATOS ──
    attachSocialEditControls() {
      // WhatsApp da Seção de Contato (Exclui o botão flutuante .wsp-float-btn do Hero)
      const wspBtns = document.querySelectorAll('a.btn-whatsapp, a.contato__btn-whatsapp, .secao-contato a[href*="wa.me"]');
      wspBtns.forEach(btn => {
        if (btn.classList.contains('wsp-float-btn') || btn.id === 'wsp-float-btn') return;

        btn.classList.add('lm-social-wrapper');
        if (!btn.querySelector('.lm-social-edit-pencil')) {
          const pencil = document.createElement('button');
          pencil.className = 'lm-social-edit-pencil';
          pencil.innerHTML = '✏️';
          pencil.title = 'Editar WhatsApp';
          btn.appendChild(pencil);

          pencil.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this.openSocialModal('whatsapp');
          });
        }
      });

      // Instagram da Seção de Contato
      const igBtns = document.querySelectorAll('a.btn-instagram, a.contato__btn-instagram, .secao-contato a[href*="instagram.com"]');
      igBtns.forEach(btn => {
        btn.classList.add('lm-social-wrapper');
        if (!btn.querySelector('.lm-social-edit-pencil')) {
          const pencil = document.createElement('button');
          pencil.className = 'lm-social-edit-pencil';
          pencil.innerHTML = '✏️';
          pencil.title = 'Editar Instagram';
          btn.appendChild(pencil);

          pencil.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this.openSocialModal('instagram');
          });
        }
      });

      // Cidade / Endereço
      const locEls = document.querySelectorAll('.secao-contato__endereco, .secao-contato__info, .contato__info, .location');
      locEls.forEach(el => {
        el.setAttribute('data-lm-editable', 'true');
        el.setAttribute('contenteditable', 'true');
        el.addEventListener('blur', () => {
          this.order.location = el.innerText.trim();
          this.pushHistoryState('Cidade/Localização');
        });
      });
    }

    openSocialModal(focusType = 'whatsapp') {
      document.getElementById('lm-social-field-whatsapp').value = this.formatPhoneMask(this.order.whatsapp || '');
      document.getElementById('lm-social-field-instagram').value = this.order.instagram || '';
      document.getElementById('lm-social-field-location').value = this.order.location || '';

      const saveBtn = document.getElementById('lm-modal-social-save');
      saveBtn.onclick = () => {
        const rawWsp = document.getElementById('lm-social-field-whatsapp').value.trim();
        const rawIg = document.getElementById('lm-social-field-instagram').value.trim();
        const rawLoc = document.getElementById('lm-social-field-location').value.trim();

        this.order.whatsapp = rawWsp.replace(/\D/g, '');
        this.order.instagram = rawIg.replace(/^@/, '');
        this.order.location = rawLoc;

        this.pushHistoryState('Editar Contatos');
        this.applyStateToDom();
        this.closeModal('lm-modal-social');
        this.showToast('📱 Contatos atualizados no rascunho!');
      };

      this.openModal('lm-modal-social');

      setTimeout(() => {
        if (focusType === 'whatsapp') document.getElementById('lm-social-field-whatsapp').focus();
        if (focusType === 'instagram') document.getElementById('lm-social-field-instagram').focus();
      }, 200);
    }

    handleCoverFileSelect(e) {
      const file = e.target.files[0];
      if (!file) return;

      this.pendingCoverFile = file;
      const previewUrl = URL.createObjectURL(file);

      const coverImg = document.querySelector('.hero__foto-wrap img, .hero__foto-wrap video, .capa__foto-wrap img, .hero-cover img');
      if (coverImg) {
        if (coverImg.tagName.toLowerCase() === 'img') {
          coverImg.src = previewUrl;
        } else {
          coverImg.style.backgroundImage = `url('${previewUrl}')`;
        }
      }

      this.pushHistoryState('Foto de Capa Alterada');
      this.showToast('📷 Foto de capa atualizada no rascunho!');
    }

    attachServiceControls() {
      const serviceCards = document.querySelectorAll('.card-procedimento, .vitrine__card, .servico-item, .mosaico__card, [data-procedimento-id], [data-grid] > div, [data-grid] > article');
      serviceCards.forEach((card, idx) => {
        if (card.id === 'lm-btn-add-svc-wrap' || card.classList.contains('lm-add-service-container')) return;

        card.classList.add('lm-service-card-wrapper');

        if (!card.querySelector('.lm-svc-actions-bar')) {
          const bar = document.createElement('div');
          bar.className = 'lm-svc-actions-bar';
          bar.innerHTML = `
            <button class="lm-svc-btn-action" data-action="edit">✏️ Editar</button>
            <button class="lm-svc-btn-action lm-svc-btn-danger" data-action="delete">🗑️</button>
          `;

          card.appendChild(bar);

          const stopEv = (ev) => {
            ev.stopPropagation();
          };

          bar.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const btn = ev.target.closest('[data-action]');
            if (!btn) return;
            const act = btn.getAttribute('data-action');
            if (act === 'edit') this.openEditServiceModal(idx);
            if (act === 'delete') this.deleteService(idx);
          });

          bar.addEventListener('mousedown', stopEv);
          bar.addEventListener('touchstart', stopEv, { passive: true });
          bar.addEventListener('pointerdown', stopEv);
        }
      });
    }

    initCategories() {
      const catSet = new Set();
      ['Extensão de Cílios', 'Sobrancelhas', 'Especiais & Cuidados', 'Combos Exclusivos'].forEach(c => catSet.add(c));

      if (this.services && Array.isArray(this.services)) {
        this.services.forEach(s => {
          if (s.category && s.category.trim()) {
            catSet.add(s.category.trim());
          }
        });
      }

      const chips = document.querySelectorAll('.filtro-chip, [data-filter]');
      chips.forEach(chip => {
        const text = chip.textContent.replace(/\(\d+\)/g, '').trim();
        if (text && !text.toLowerCase().includes('todos') && !text.includes('+ Nova')) {
          catSet.add(text);
        }
      });

      this.categories = Array.from(catSet);
    }

    populateCategoryDropdown(selectedCategory = '') {
      const selectEl = document.getElementById('lm-svc-field-category');
      if (!selectEl) return;

      selectEl.innerHTML = '';

      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = '-- Selecione uma categoria --';
      selectEl.appendChild(defaultOpt);

      if (!this.categories || this.categories.length === 0) {
        this.initCategories();
      }

      this.categories.forEach(catName => {
        const opt = document.createElement('option');
        opt.value = catName;
        opt.textContent = catName;
        if (selectedCategory && selectedCategory.trim().toLowerCase() === catName.trim().toLowerCase()) {
          opt.selected = true;
        }
        selectEl.appendChild(opt);
      });

      const createOpt = document.createElement('option');
      createOpt.value = '__NEW__';
      createOpt.textContent = '➕ Criar nova categoria...';
      selectEl.appendChild(createOpt);
    }

    openAddCategoryModal(onCreated = null) {
      const input = document.getElementById('lm-cat-field-name');
      if (input) input.value = '';

      const saveBtn = document.getElementById('lm-modal-cat-save');
      saveBtn.onclick = () => {
        const name = input ? input.value.trim() : '';
        if (!name) {
          this.showToast('⚠️ Digite o nome da categoria.');
          return;
        }

        if (!this.categories.includes(name)) {
          this.categories.push(name);
        }

        this.pushHistoryState(`Nova Categoria (${name})`);
        this.renderCategoryFilterChips();
        this.populateCategoryDropdown(name);
        this.closeModal('lm-modal-category');
        this.showToast(`✨ Categoria "${name}" criada!`);

        if (typeof onCreated === 'function') {
          onCreated(name);
        }
      };

      this.openModal('lm-modal-category');
    }

    renderCategoryFilterChips() {
      const filterNav = document.querySelector('.mosaico__filtros, .studio__filtros, .vitrine__filtros, nav[aria-label*="Filtrar"]');
      if (!filterNav) return;

      if (!this.categories || this.categories.length === 0) {
        this.initCategories();
      }

      const currentFilter = window.filtroAtivo || 'todos';
      let html = '';
      html += `<button type="button" class="lm-btn-add-category-chip" id="lm-btn-add-cat-filter" title="Criar nova categoria">➕ Nova Categoria</button>`;

      const totalServices = (this.services || []).length;
      const isTodosActive = (currentFilter === 'todos') ? 'is-ativo' : '';
      html += `<button type="button" class="filtro-chip ${isTodosActive}" data-filter="todos">Todos (${totalServices})</button>`;

      this.categories.forEach(catName => {
        const count = (this.services || []).filter(s => s.category && s.category.trim().toLowerCase() === catName.trim().toLowerCase()).length;
        const isActive = (currentFilter.trim().toLowerCase() === catName.trim().toLowerCase()) ? 'is-ativo' : '';
        html += `<button type="button" class="filtro-chip ${isActive}" data-filter="${this.escapeHtml(catName)}">${this.escapeHtml(catName)} (${count})</button>`;
      });

      filterNav.innerHTML = html;

      const chips = filterNav.querySelectorAll('.filtro-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('is-ativo'));
          chip.classList.add('is-ativo');
          const filterValue = chip.getAttribute('data-filter');
          window.filtroAtivo = filterValue;

          if (typeof window.renderGrid === 'function') {
            try { window.renderGrid(); } catch(e) {}
          }
          this.reRenderServicesUI();
          this.attachServiceControls();
        });
      });

      const addCatBtn = document.getElementById('lm-btn-add-cat-filter');
      if (addCatBtn) {
        addCatBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this.openAddCategoryModal();
        });
      }
    }

    openAddServiceModal() {
      this.currentModalSvcPendingFile = null;
      document.getElementById('lm-svc-modal-title').textContent = '➕ Adicionar Serviço';
      const imgEl = document.getElementById('lm-svc-photo-img');
      if (imgEl && imgEl.src !== '/modelos/mosaico/assets/img/volume-brasileiro.png') {
        imgEl.src = '/modelos/mosaico/assets/img/volume-brasileiro.png';
      }
      document.getElementById('lm-svc-field-name').value = '';
      document.getElementById('lm-svc-field-price').value = '';
      document.getElementById('lm-svc-field-duration').value = '';

      this.populateCategoryDropdown('');

      const catSelect = document.getElementById('lm-svc-field-category');
      if (catSelect) {
        catSelect.onchange = (e) => {
          if (e.target.value === '__NEW__') {
            this.openAddCategoryModal((newCatName) => {
              this.populateCategoryDropdown(newCatName);
            });
          }
        };
      }

      const inlineCatBtn = document.getElementById('lm-btn-open-add-cat-inline');
      if (inlineCatBtn) {
        inlineCatBtn.onclick = (e) => {
          e.preventDefault();
          this.openAddCategoryModal((newCatName) => {
            this.populateCategoryDropdown(newCatName);
          });
        };
      }

      document.getElementById('lm-svc-field-maintenance').value = '';
      document.getElementById('lm-svc-field-effect').value = '';
      document.getElementById('lm-svc-field-desc').value = '';

      const saveBtn = document.getElementById('lm-modal-svc-save');
      saveBtn.onclick = () => {
        const name = document.getElementById('lm-svc-field-name').value.trim() || 'Novo Serviço';
        const price = document.getElementById('lm-svc-field-price').value.trim() || '0,00';
        const duration = document.getElementById('lm-svc-field-duration').value.trim() || '60min';
        const selectedCat = catSelect ? catSelect.value : '';
        const category = (selectedCat === '__NEW__') ? '' : selectedCat;
        const maintenance = document.getElementById('lm-svc-field-maintenance').value.trim();
        const effect = document.getElementById('lm-svc-field-effect').value.trim();
        const description = document.getElementById('lm-svc-field-desc').value.trim();

        const newSvc = {
          name, price, duration, category, maintenance, effect, description,
          photo_url: this.currentModalSvcPendingFile ? URL.createObjectURL(this.currentModalSvcPendingFile) : '/modelos/mosaico/assets/img/volume-brasileiro.png',
          pendingPhotoFile: this.currentModalSvcPendingFile,
          order_index: this.services.length
        };

        this.services.push(newSvc);

        this.pushHistoryState('Adicionar Procedimento');
        this.applyStateToDom();
        this.closeModal('lm-modal-service');
        this.showToast('✨ Serviço adicionado!');
      };

      this.openModal('lm-modal-service');
    }

    extractServiceFromDom(index) {
      const cards = document.querySelectorAll('.card-procedimento, .vitrine__card, .servico-item, .mosaico__card, [data-procedimento-id], [data-grid] > div, [data-grid] > article');
      const card = cards[index];
      const procGlobal = (window.PROCEDIMENTOS && window.PROCEDIMENTOS[index]) ? window.PROCEDIMENTOS[index] : null;

      const titleEl = card ? card.querySelector('.procedimento__titulo, .card__title, .tile__titulo, h3, .card-procedimento__titulo') : null;
      const priceEl = card ? card.querySelector('.procedimento__preco, .card__price, .tile__preco, .price, .card-procedimento__preco') : null;
      const durEl = card ? card.querySelector('.procedimento__duracao, .card__duration, .tile__duracao, .card-procedimento__duracao') : null;
      const catEl = card ? card.querySelector('.procedimento__cat, .tile__cat, .modal__cat') : null;
      const imgEl = card ? card.querySelector('img') : null;

      return {
        name: titleEl ? titleEl.textContent.trim() : (procGlobal ? procGlobal.title : `Procedimento ${index + 1}`),
        price: priceEl ? priceEl.textContent.replace(/^R\$\s*/i, '').trim() : (procGlobal ? procGlobal.preco.replace(/^R\$\s*/i, '') : '0,00'),
        duration: durEl ? durEl.textContent.replace(/^(⏱️|⌚)\s*/i, '').trim() : (procGlobal ? procGlobal.duracao : ''),
        category: catEl ? catEl.textContent.trim() : (procGlobal ? procGlobal.cat : ''),
        maintenance: procGlobal && procGlobal.specs ? (procGlobal.specs.find(s => s[0] && s[0].includes('Manutenção')) || [])[1] || '' : '',
        effect: procGlobal && procGlobal.specs ? (procGlobal.specs.find(s => s[0] && s[0].includes('Efeito')) || [])[1] || '' : '',
        description: procGlobal ? procGlobal.desc || '' : '',
        photo_url: imgEl ? imgEl.src : (procGlobal ? procGlobal.img : ''),
        order_index: index
      };
    }

    openEditServiceModal(index) {
      if (!this.services[index]) {
        this.services[index] = this.extractServiceFromDom(index);
      }
      const svc = this.services[index];

      this.currentModalSvcPendingFile = null;
      document.getElementById('lm-svc-modal-title').textContent = `✏️ Editar: ${svc.name}`;

      const imgEl = document.getElementById('lm-svc-photo-img');
      const currentImgSrc = svc.photo_url || '/modelos/mosaico/assets/img/volume-brasileiro.png';
      if (imgEl && currentImgSrc) {
        let resolvedCurrent = currentImgSrc;
        try {
          resolvedCurrent = new URL(currentImgSrc, window.location.href).href;
        } catch (e) {}

        if (imgEl.src !== resolvedCurrent) {
          imgEl.src = currentImgSrc;
          imgEl.onerror = () => {
            imgEl.src = '/modelos/mosaico/assets/img/volume-brasileiro.png';
          };
        }
      }

      document.getElementById('lm-svc-field-name').value = svc.name || '';
      document.getElementById('lm-svc-field-price').value = this.formatCurrencyMask(svc.price || '');
      document.getElementById('lm-svc-field-duration').value = svc.duration || '';

      this.populateCategoryDropdown(svc.category || '');

      const catSelect = document.getElementById('lm-svc-field-category');
      if (catSelect) {
        catSelect.onchange = (e) => {
          if (e.target.value === '__NEW__') {
            this.openAddCategoryModal((newCatName) => {
              this.populateCategoryDropdown(newCatName);
            });
          }
        };
      }

      const inlineCatBtn = document.getElementById('lm-btn-open-add-cat-inline');
      if (inlineCatBtn) {
        inlineCatBtn.onclick = (e) => {
          e.preventDefault();
          this.openAddCategoryModal((newCatName) => {
            this.populateCategoryDropdown(newCatName);
          });
        };
      }

      document.getElementById('lm-svc-field-maintenance').value = svc.maintenance || '';
      document.getElementById('lm-svc-field-effect').value = svc.effect || '';
      document.getElementById('lm-svc-field-desc').value = svc.description || '';

      const saveBtn = document.getElementById('lm-modal-svc-save');
      saveBtn.onclick = () => {
        svc.name = document.getElementById('lm-svc-field-name').value.trim();
        svc.price = document.getElementById('lm-svc-field-price').value.trim();
        svc.duration = document.getElementById('lm-svc-field-duration').value.trim();
        const selectedCat = catSelect ? catSelect.value : '';
        svc.category = (selectedCat === '__NEW__') ? '' : selectedCat;
        svc.maintenance = document.getElementById('lm-svc-field-maintenance').value.trim();
        svc.effect = document.getElementById('lm-svc-field-effect').value.trim();
        svc.description = document.getElementById('lm-svc-field-desc').value.trim();

        if (this.currentModalSvcPendingFile) {
          svc.pendingPhotoFile = this.currentModalSvcPendingFile;
          svc.photo_url = URL.createObjectURL(this.currentModalSvcPendingFile);
        }

        this.pushHistoryState(`Editar Procedimento (${svc.name})`);
        this.applyStateToDom();
        this.closeModal('lm-modal-service');
        this.showToast('📝 Alterações salvas no rascunho!');
      };

      this.openModal('lm-modal-service');
    }

    deleteService(index) {
      const svc = this.services[index];
      if (!svc) return;

      this.openConfirmModal('Excluir Procedimento', `Deseja remover "${svc.name}" do rascunho?`, () => {
        if (svc.id) {
          this.deletedServiceIds.push(svc.id);
        }
        this.services.splice(index, 1);
        this.pushHistoryState('Excluir Procedimento');
        this.applyStateToDom();
        this.showToast('🗑️ Procedimento removido.');
      }, '🗑️');
    }

    toggleTheme() {
      const currentTheme = this.order.color_id || document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme') || 'rose';
      const newTheme = (currentTheme === 'rose') ? 'luxury' : 'rose';
      this.order.color_id = newTheme;

      this.pushHistoryState(`Tema ${newTheme.toUpperCase()}`);
      this.applyTheme(newTheme);
      this.showToast(`🎨 Tema: ${newTheme.toUpperCase()}`);
    }

    applyTheme(theme) {
      const targetTheme = (theme === 'luxury' || theme === 'midnight') ? 'luxury' : 'rose';

      // Aplica data-theme na tag <html> e <body> para acionar o CSS nativo do LashMenu
      document.documentElement.setAttribute('data-theme', targetTheme);
      document.body.setAttribute('data-theme', targetTheme);

      document.body.classList.remove('theme-rose', 'theme-luxury');
      document.body.classList.add(`theme-${targetTheme}`);

      // Atualiza o botão da barra flutuante mobile
      const themeBtn = document.getElementById('lm-btn-theme');
      if (themeBtn) {
        themeBtn.innerHTML = targetTheme === 'luxury' ? '👑' : '🌸';
        themeBtn.title = targetTheme === 'luxury' ? 'Tema: Luxury (Clique p/ Rosé)' : 'Tema: Rosé (Clique p/ Luxury)';
      }

      // Sincroniza os botões de tema do próprio modelo
      const nativeBtns = document.querySelectorAll('[data-theme-target]');
      nativeBtns.forEach(btn => {
        if (btn.getAttribute('data-theme-target') === targetTheme) {
          btn.classList.add('is-active');
        } else {
          btn.classList.remove('is-active');
        }
      });

      if (typeof window.initHeroParticles === 'function') {
        try { window.initHeroParticles(); } catch(e){}
      }

      try {
        const url = new URL(window.location.href);
        url.searchParams.set('theme', targetTheme);
        window.history.replaceState({}, '', url);
      } catch(e){}
    }

    applyStateToDom() {
      const nameEl = document.querySelector('.hero__titulo h1, .hero__designer-name, .capa__nome, h1.designer-name');
      if (nameEl && this.order.client_name) {
        nameEl.childNodes[0].nodeValue = this.order.client_name;
      }

      const phraseEl = document.querySelector('.hero__frase-cilios, .hero__slogan, .capa__bio, .hero-phrase');
      if (phraseEl && this.order.hero_phrase) phraseEl.innerText = this.order.hero_phrase;

      // Atualiza Instagram no botão
      const igBtns = document.querySelectorAll('a.btn-instagram, a[href*="instagram.com"]');
      igBtns.forEach(btn => {
        const textSpan = btn.querySelector('span:not(.btn__left):not(.btn__arrow)') || btn.querySelector('span');
        if (textSpan && this.order.instagram) {
          textSpan.textContent = `@${this.order.instagram.replace(/^@/, '')}`;
        }
        btn.href = `https://instagram.com/${encodeURIComponent(this.order.instagram.replace(/^@/, ''))}`;
      });

      // Atualiza localização
      const locEls = document.querySelectorAll('.secao-contato__endereco, .secao-contato__info, .contato__info, .location');
      locEls.forEach(el => {
        if (this.order.location) el.textContent = this.order.location;
      });

      const viewCatalogBtn = document.getElementById('lm-btn-view-catalog');
      if (viewCatalogBtn) {
        viewCatalogBtn.href = this.getCatalogUrl();
      }

      this.reRenderServicesUI();
      this.attachServiceControls();
      this.attachSocialEditControls();
    }

    reRenderServicesUI() {
      const serviceCards = document.querySelectorAll('.card-procedimento, .vitrine__card, .servico-item, .mosaico__card, [data-grid] > div, [data-grid] > article');
      serviceCards.forEach((card, idx) => {
        if (card.id === 'lm-btn-add-svc-wrap' || card.classList.contains('lm-add-service-container')) return;

        const svc = this.services[idx];
        if (svc) {
          const titleEl = card.querySelector('.procedimento__titulo, .card__title, .tile__titulo, h3, .card-procedimento__titulo');
          const priceEl = card.querySelector('.procedimento__preco, .card__price, .tile__preco, .price, .card-procedimento__preco');
          const durEl = card.querySelector('.procedimento__duracao, .card__duration, .tile__duracao, .card-procedimento__duracao');
          const maintEl = card.querySelector('.procedimento__manutencao, .card__maintenance, .card-procedimento__manutencao');
          const catEl = card.querySelector('.procedimento__cat, .tile__cat, .card__cat');
          const imgEl = card.querySelector('img');

          const formattedPrice = svc.price ? (svc.price.includes('R$') ? svc.price : `R$ ${svc.price}`) : '';

          if (titleEl) titleEl.textContent = svc.name;
          if (priceEl) priceEl.textContent = formattedPrice;
          if (durEl) durEl.textContent = svc.duration ? (svc.duration.includes('⏱') || svc.duration.includes('⌚') ? svc.duration : `⏱️ ${svc.duration}`) : '';
          if (maintEl) maintEl.textContent = svc.maintenance || '';
          if (catEl && svc.category) catEl.textContent = svc.category;
          if (imgEl && svc.photo_url) imgEl.src = svc.photo_url;
          card.style.display = '';

          if (window.PROCEDIMENTOS && window.PROCEDIMENTOS[idx]) {
            const targetProc = window.PROCEDIMENTOS[idx];
            targetProc.title = svc.name;
            targetProc.preco = formattedPrice;
            targetProc.duracao = svc.duration || '';
            if (svc.category) targetProc.cat = svc.category;
            if (svc.photo_url) targetProc.img = svc.photo_url;
            targetProc.desc = svc.description || '';

            const newSpecs = [];
            if (svc.maintenance && svc.maintenance.trim()) {
              newSpecs.push(["Manutenção", svc.maintenance.trim()]);
            }
            if (svc.effect && svc.effect.trim()) {
              newSpecs.push(["Efeito", svc.effect.trim()]);
            }
            if (svc.duration && svc.duration.trim()) {
              newSpecs.push(["Duração", svc.duration.trim()]);
            }
            targetProc.specs = newSpecs;
          }
        } else {
          card.style.display = 'none';
        }
      });
    }

    discardChanges() {
      this.openConfirmModal('Descartar Alterações', 'Deseja descartar todas as alterações não salvas e restaurar o catálogo original?', () => {
        location.reload();
      }, '🔄');
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    openSaveConfirmationModal() {
      const summaryList = document.getElementById('lm-save-summary-list');
      if (!summaryList) return;

      const initial = (this.historyStack && this.historyStack.length > 0) ? this.historyStack[0] : null;
      const initialOrder = initial ? initial.order : {};
      const initialServices = initial ? (initial.services || []) : [];

      const changes = [];

      // 1. Nome do Catálogo / Designer
      if (initialOrder.client_name !== this.order.client_name) {
        changes.push(`<div><strong>✏️ Nome do Catálogo:</strong> ${this.escapeHtml(this.order.client_name || '')}</div>`);
      }

      // 2. Frase de Destaque
      if (initialOrder.hero_phrase !== this.order.hero_phrase) {
        changes.push(`<div><strong>💬 Frase de Destaque:</strong> Alterada</div>`);
      }

      // 3. Contatos
      if (initialOrder.whatsapp !== this.order.whatsapp) {
        changes.push(`<div><strong>📱 WhatsApp:</strong> ${this.escapeHtml(this.order.whatsapp || '')}</div>`);
      }
      if (initialOrder.instagram !== this.order.instagram) {
        changes.push(`<div><strong>📸 Instagram:</strong> @${this.escapeHtml((this.order.instagram || '').replace(/^@/, ''))}</div>`);
      }
      if (initialOrder.location !== this.order.location) {
        changes.push(`<div><strong>📍 Localização:</strong> ${this.escapeHtml(this.order.location || '')}</div>`);
      }

      // 4. Tema Visual
      if ((initialOrder.color_id || 'rose') !== (this.order.color_id || 'rose')) {
        changes.push(`<div><strong>🎨 Tema Visual:</strong> ${this.escapeHtml((this.order.color_id || 'rose').toUpperCase())}</div>`);
      }

      // 5. Foto de Capa
      if (this.pendingCoverFile) {
        changes.push(`<div><strong>📷 Foto de Capa:</strong> Nova imagem selecionada</div>`);
      }

      // 6. Procedimentos
      const currentServices = this.services || [];

      // Checar se houve exclusões de procedimentos
      if (this.deletedServiceIds && this.deletedServiceIds.length > 0) {
        changes.push(`<div><strong>🗑️ Procedimentos removidos:</strong> ${this.deletedServiceIds.length} item(ns)</div>`);
      } else if (currentServices.length < initialServices.length) {
        const diffCount = initialServices.length - currentServices.length;
        changes.push(`<div><strong>🗑️ Procedimentos removidos:</strong> ${diffCount} item(ns)</div>`);
      }

      // Checar adição e edição de procedimentos
      currentServices.forEach((svc, idx) => {
        const orig = initialServices[idx];
        const priceFormatted = svc.price ? (svc.price.includes('R$') ? svc.price : `R$ ${svc.price}`) : '';

        if (!orig || !orig.name) {
          changes.push(`<div><strong>✨ Novo procedimento:</strong> ${this.escapeHtml(svc.name || 'Serviço')} (${this.escapeHtml(priceFormatted)})</div>`);
        } else {
          const origPriceFormatted = orig.price ? (orig.price.includes('R$') ? orig.price : `R$ ${orig.price}`) : '';

          const isChanged = svc.name !== orig.name ||
                            priceFormatted !== origPriceFormatted ||
                            svc.duration !== orig.duration ||
                            svc.category !== orig.category ||
                            svc.maintenance !== orig.maintenance ||
                            svc.effect !== orig.effect ||
                            svc.description !== orig.description ||
                            !!svc.pendingPhotoFile;

          if (isChanged) {
            changes.push(`<div><strong>✏️ Procedimento alterado:</strong> ${this.escapeHtml(svc.name)} (${this.escapeHtml(priceFormatted)})</div>`);
          }
        }
      });

      if (changes.length === 0) {
        summaryList.innerHTML = `
          <div class="lm-save-summary-empty">
            ℹ️ Nenhuma alteração pendente detectada.
          </div>
        `;
      } else {
        summaryList.innerHTML = `
          <div class="lm-save-summary-items">
            ${changes.join('')}
          </div>
        `;
      }

      this.openModal('lm-modal-save');
    }

    async publishToSupabase() {
      const btnConfirm = document.getElementById('lm-modal-save-confirm');
      btnConfirm.disabled = true;
      btnConfirm.textContent = '⏳ Gravando...';

      try {
        if (this.pendingCoverFile) {
          const ext = this.pendingCoverFile.name ? this.pendingCoverFile.name.split('.').pop() : 'webp';
          const path = `covers/cover_${this.order.id}_${Date.now()}.${ext}`;

          const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/catalog-assets/${path}`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: this.pendingCoverFile
          });

          if (uploadRes.ok) {
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/catalog-assets/${path}`;
            this.order.cover_media_url = publicUrl;
          }
        }

        const resOrder = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${this.order.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_name: this.order.client_name,
            hero_phrase: this.order.hero_phrase,
            whatsapp: this.order.whatsapp,
            instagram: this.order.instagram,
            location: this.order.location,
            color_id: this.order.color_id,
            cover_media_url: this.order.cover_media_url
          })
        });

        if (!resOrder.ok) throw new Error('Falha ao atualizar dados.');

        if (this.deletedServiceIds.length > 0) {
          for (const delId of this.deletedServiceIds) {
            await fetch(`${SUPABASE_URL}/rest/v1/order_services?id=eq.${delId}`, {
              method: 'DELETE',
              headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
          }
          this.deletedServiceIds = [];
        }

        for (let i = 0; i < this.services.length; i++) {
          const svc = { ...this.services[i] };
          svc.order_index = i;

          if (svc.pendingPhotoFile) {
            const ext = svc.pendingPhotoFile.name ? svc.pendingPhotoFile.name.split('.').pop() : 'webp';
            const path = `services/svc_${this.order.id}_${Date.now()}_${i}.${ext}`;

            const uploadSvcRes = await fetch(`${SUPABASE_URL}/storage/v1/object/catalog-assets/${path}`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              },
              body: svc.pendingPhotoFile
            });

            if (uploadSvcRes.ok) {
              svc.photo_url = `${SUPABASE_URL}/storage/v1/object/public/catalog-assets/${path}`;
            }
            delete svc.pendingPhotoFile;
          }

          if (svc.id) {
            delete svc.created_at;
            await fetch(`${SUPABASE_URL}/rest/v1/order_services?id=eq.${svc.id}`, {
              method: 'PATCH',
              headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(svc)
            });
          } else {
            svc.order_id = this.order.id;
            await fetch(`${SUPABASE_URL}/rest/v1/order_services`, {
              method: 'POST',
              headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(svc)
            });
          }
        }

        try {
          if (this.order.slug) {
            sessionStorage.removeItem(`lash_cache_${this.order.slug}`);
          }
        } catch (e) {}

        this.closeModal('lm-modal-save');
        this.isDirty = false;
        this.updateToolbarState();

        this.openSuccessModal('✨ Catálogo Publicado!', 'Suas alterações foram salvas com sucesso e já estão ao vivo no seu catálogo!');

      } catch (err) {
        console.error('Erro na publicação:', err);
        this.openAlertModal('Erro ao Salvar', err.message || 'Ocorreu um problema ao publicar as alterações.');
      } finally {
        btnConfirm.disabled = false;
        btnConfirm.textContent = '🚀 Confirmar';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.LashVisualEditorInstance = new LashVisualEditor());
  } else {
    window.LashVisualEditorInstance = new LashVisualEditor();
  }

})();
