# Contas - Balanço Financeiro & Dividendos (Eu & Mari)

Aplicativo web progressivo (PWA) de controle financeiro mútuo, otimizado para celulares e computadores, com hospedagem gratuita na Vercel e sincronização em tempo real via Google Firebase Firestore.

---

## Recursos e Funcionalidades

- **Balanço Líquido Inteligente**:
  - Consolida compras diretas (ex: casa e transporte das férias pagos por um).
  - Trata compras passadas no cartão de crédito do outro como abatimento automático da dívida.
  - Divide despesas comuns (50% / 50%).
  - Registra liquidações e amortizações diretas via PIX com um clique.
- **Multi-dispositivo e Tempo Real**:
  - Sincronização instantânea entre aparelhos em qualquer rede via Firebase Firestore.
  - Se um cadastrar uma compra, o outro vê atualizar na hora.
- **PWA (Instalável no Celular)**:
  - Adicione à tela inicial no iPhone (iOS) ou Android para usar como um aplicativo nativo em tela cheia.
- **Design Refinado (Sem Emojis)**:
  - Estética moderna de fintech (dark mode, cartões e badges elegantes, tipografia limpa).
  - Utiliza ícones vetoriais modernos (`lucide-react`) em todas as categorias e ações.
- **Modo Resiliente / Offline**:
  - Funciona imediatamente em modo local mesmo antes de configurar o Firebase.
  - Permite configurar as credenciais do Firebase tanto pelas variáveis de ambiente quanto diretamente pelo menu do aplicativo!

---

## Como Rodar Localmente

1. Abra o terminal na pasta do projeto:
   ```bash
   npm run dev
   ```
2. Acesse no navegador:
   ```
   http://localhost:3000
   ```

Para rodar os testes automatizados dos cálculos:
```bash
npm run test
```

---

## Como Configurar o Firebase (Gratuito)

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e clique em **Criar projeto** (ex: `contas-mari`).
2. No menu lateral, clique em **Criação** -> **Cloud Firestore** e depois em **Criar banco de dados**.
   - Escolha o local (ex: `southamerica-east1` ou `us-central1`).
   - Selecione **Iniciar no modo de teste** (permite leitura e escrita imediata).
3. Na página inicial do projeto no Firebase, clique no ícone da engrenagem (Configurações do Projeto) ou no ícone da Web `</>` para registrar um Web App.
4. Copie as configurações do objeto `firebaseConfig`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
5. Você pode colar essas configurações diretamente no botão **Conexão em Nuvem / Engrenagem** dentro do app ou preencher no arquivo `.env.local`.

### Regras do Firestore (Segurança Simples)
No Firebase Console, em **Firestore Database** -> aba **Regras**, certifique-se de que a regra permite leitura e escrita:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## Como Publicar na Vercel

1. Suba o projeto para o seu GitHub (ou use a CLI da Vercel).
2. Acesse [vercel.com](https://vercel.com) e importe o repositório.
3. Na seção **Environment Variables**, adicione as chaves:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Clique em **Deploy**.
5. Pronto! O app estará no ar com link HTTPS (ex: `contas-mari.vercel.app`). Compartilhe o link com a Mari!

---

## Como Instalar no Celular (PWA)

- **No iPhone (Safari)**: Acesse o link da Vercel, toque no botão de **Compartilhar** (quadrado com seta para cima) e selecione **Adicionar à Tela de Início**.
- **No Android (Chrome)**: Acesse o link, toque no menu de três pontos e selecione **Instalar aplicativo** ou **Adicionar à tela inicial**.
