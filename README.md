# Mira nas Transações - Arc Testnet Game

Jogo de mira/shooting que integra blockchain, onde cada acerto dispara uma transação na Arc Testnet.

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado (versão 14 ou superior)
- npm ou yarn

### Instalação e Execução

1. **Instale as dependências:**
```bash
npm install
```

2. **Inicie o servidor local:**
```bash
npm start
```

Ou use:
```bash
npm run dev
```

O servidor será iniciado na porta 8080 e o navegador abrirá automaticamente.

### ⚠️ Importante

**NÃO abra o arquivo `index.html` diretamente no navegador** (usando `file://`), pois os módulos ES6 não funcionam com esse protocolo devido a políticas de segurança (CORS).

Sempre use o servidor HTTP local através do comando `npm start`.

## 🎮 Como Jogar

1. Clique em "Init Hunter Wallet" para criar/inicializar sua wallet
2. Funde sua wallet com USDC testnet no [faucet](https://faucet.circle.com) para ter gas
3. Atire nos alvos verdes que aparecem na tela
4. Cada acerto dispara uma transação blockchain no contrato
5. Após 5 kills, os alvos começam a se mover (dificuldade aumenta)

## 🛠️ Tecnologias

- **Phaser 3.80.1** - Engine do jogo
- **Ethers.js v6** - Integração blockchain
- **Arc Testnet** - Rede blockchain

## 📁 Estrutura do Projeto

```
mira-arc-game/
├── css/
│   └── styles.css          # Estilos futuristas/cyberpunk
├── js/
│   ├── config.js           # Configurações e constantes
│   ├── wallet.js            # Lógica de wallet
│   ├── blockchain.js        # Integração blockchain
│   ├── effects.js           # Efeitos visuais
│   ├── ui.js                # Componentes de UI
│   └── game.js              # Lógica principal do Phaser
├── index.html               # Estrutura HTML
└── package.json             # Dependências
```

## ⚙️ Configuração

Antes de jogar, atualize o endereço do contrato em `js/config.js`:

```javascript
export const CONTRACT_ADDRESS = '0x...'; // Seu endereço de contrato deployado
```

## 🎨 Características

- UI futurista/cyberpunk com efeitos neon
- Efeitos visuais melhorados (explosões, partículas, animações)
- HUD estilo jogo com cards e bordas neon
- Notificações de transação com link para explorer
- Sistema de dificuldade progressiva

