# 🌸 Guia de Operação: Agente Criador de Catálogos LashMenu

O **Agente Criador de Catálogos** é um assistente autônomo inteligente integrado diretamente ao Antigravity. Com ele, você não precisa mais preencher formulários manualmente: basta colar a foto de capa e a lista/print que a cliente enviou no WhatsApp.

---

## 🚀 Como Usar no Dia a Dia

Sempre que uma nova cliente fechar ou demonstrar interesse, basta abrir uma conversa (ou usar a atual) e enviar a foto dela e a lista/print, dizendo:

> *"Use o agente pra criar o catálogo dessa cliente. Modelo Harmonia Rosé."*

### 📥 O que você pode mandar no chat:
1. **Foto de Capa:** A foto de rosto, perfil ou do estúdio que ela enviou para a capa do catálogo.
2. **Lista de Serviços:** Pode ser:
   - Um **print** de uma conversa no WhatsApp ou de uma tabela do Canva.
   - Um **texto copiado e colado** (mesmo desorganizado, ex: *"volume brasileiro 130, russo 170, manutencao 90"*).
3. **Dados Básicos:** Nome da cliente e WhatsApp (opcionalmente cidade e Instagram).

---

## ⚡ O que o Agente Faz Sozinho:

1. **Lê e Compreende Tudo (OCR & Visão):** Extrai nomes de procedimentos, valores de aplicação, valores de manutenção e tempos.
2. **Encaixa nas Fotos Oficiais:** Liga termos informais (*"fio a fio"*, *"brasileiro"*, *"w 3d"*, *"fox"*) às fotos oficiais em altíssima resolução do LashMenu.
3. **Trata Serviços Novos:** Se ela tiver um serviço exclusivo (ex: *"Hydra Gloss"* ou *"Sobrancelha Henna"*), cria o card com um placeholder elegante de Lash.
4. **Sobe a Capa no Supabase Storage:** Faz o upload automático para a nuvem.
5. **Cadastra no Banco de Dados:** Cria o pedido na tabela `orders` e vincula todos os procedimentos em `order_services`.
6. **Disponibiliza no Painel Admin:** O catálogo entra diretamente no seu painel `/admin` com status **"Pendente de Revisão"**.
7. **Gera a Mensagem de Entrega:** Entrega para você o link da prévia, link do editor admin e a mensagem de WhatsApp formatada pronta para enviar.

---

## 🛠️ Teste Manual via Linha de Comando (Opcional)

Se preferir rodar diretamente via terminal sem a IA:

```powershell
python scripts/criar_catalogo.py "caminho_para_arquivo.json"
```

---

*LashMenu — Plataforma de Catálogos Digitais de Alta Conversão.*
