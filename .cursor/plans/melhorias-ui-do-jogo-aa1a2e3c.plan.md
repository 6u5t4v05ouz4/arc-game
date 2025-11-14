<!-- aa1a2e3c-815d-4015-8e16-c4aba40bc7cb e412f518-970d-4d19-a2b9-08d43d235ccb -->
# Sistema de Claim de Kills em Batch

## Objetivo

Implementar sistema onde kills são acumulados localmente e o usuário pode fazer claim de todos os kills acumulados (mínimo 50) em uma única transação, evitando aprovações repetidas no MetaMask.

## Estrutura de Implementação

### 1. Sistema de Acumulação de Kills

**Arquivo: `js/killQueue.js` (novo)**

- Gerenciar fila de kills acumulados
- Funções: `addKill()`, `getPendingKills()`, `clearKills()`, `getKillCount()`
- Persistir kills em `localStorage` para não perder ao recarregar
- Validar mínimo de 50 kills para permitir claim

### 2. Modificar Lógica do Jogo

**Arquivo: `js/game.js`**

- Remover chamada imediata de `triggerTx` quando alvo é destruído
- Ao invés disso, chamar `addKill()` do `killQueue.js`
- Manter score visual separado dos kills pendentes
- Adicionar callback para atualizar UI quando kills pendentes mudarem

### 3. UI do Botão de Claim

**Arquivo: `js/ui.js`**

- Função `showClaimButton(scene, killCount, onClaimClick)` - mostra botão no centro da tela
- Função `hideClaimButton()` - esconde botão
- Função `updatePendingKills(killCount)` - atualiza display de kills pendentes no HUD
- Estilo futurista com animação de pulse quando >= 50 kills
- Botão grande e visível no centro do canvas

**Arquivo: `css/styles.css`**

- Estilos para botão de claim (centro da tela, grande, neon, animado)
- Estilos para contador de kills pendentes no HUD
- Animação de pulse quando pronto para claim

### 4. Modificar Blockchain Integration

**Arquivo: `js/blockchain.js`**

- Nova função `claimKills(wallet, provider, killCount, callbacks)` 
- Substituir `eliminateTarget()` por `claimKills(uint256 count)` no contrato
- Enviar número de kills acumulados em uma única transação
- Após sucesso, limpar kills pendentes e resetar score in-game
- Manter validação de rede e cooldown

### 5. Contrato Inteligente

**Arquivo: `contracts/KillContract.sol` (novo)**

- Função `claimKills(uint256 count)` que processa múltiplos kills
- Mapeamento para rastrear kills por endereço
- Evento `KillsClaimed(address indexed player, uint256 count, uint256 timestamp)`
- Função de visualização `getPlayerKills(address player)` para consulta
- Segurança: validação de count > 0, proteção contra overflow

**Arquivo: `contracts/README.md` (novo)**

- Instruções de compilação e deploy
- Configuração para Arc Testnet
- Endereço do contrato após deploy (atualizar em `config.js`)

### 6. Atualizar Configuração

**Arquivo: `js/config.js`**

- Adicionar `MIN_KILLS_FOR_CLAIM = 10` (para testes, pode ser aumentado depois)
- Atualizar `CONTRACT_ADDRESS` após deploy (placeholder por enquanto)
- Adicionar ABI do contrato ou referência

**Arquivo: `index.html`**

- Adicionar elemento HTML para contador de kills pendentes no HUD (opcional, pode ser via Phaser)

## Fluxo de Funcionamento

1. **Jogador mata alvo**: Kill é adicionado à fila local (sem transação)
2. **Score visual**: Continua incrementando normalmente para feedback
3. **Kills pendentes**: Contador separado mostra kills acumulados
4. **Ao atingir 50 kills**: Botão "Claim Kills" aparece no centro da tela
5. **Usuário clica em Claim**: Uma única transação é enviada com todos os kills
6. **Após sucesso**: Kills pendentes zeram, score in-game zera, tokens são creditados

## Arquivos a Criar

- `js/killQueue.js` - Gerenciamento de fila de kills
- `contracts/KillContract.sol` - Contrato inteligente
- `contracts/README.md` - Instruções de deploy
- `contracts/package.json` - Dependências (Hardhat ou Foundry, opcional)

## Arquivos a Modificar

- `js/game.js` - Remover transação imediata, adicionar acumulação
- `js/blockchain.js` - Nova função `claimKills()`
- `js/ui.js` - Botão de claim e contador de kills pendentes
- `js/config.js` - Constantes e configuração do contrato
- `css/styles.css` - Estilos do botão de claim
- `index.html` - Elemento para kills pendentes (se necessário)

## Detalhes Técnicos

### Contrato Solidity

```solidity
// Estrutura básica
contract KillContract {
    mapping(address => uint256) public playerKills;
    event KillsClaimed(address indexed player, uint256 count, uint256 timestamp);
    
    function claimKills(uint256 count) external {
        require(count > 0, "Count must be greater than 0");
        playerKills[msg.sender] += count;
        emit KillsClaimed(msg.sender, count, block.timestamp);
    }
}
```

### Kill Queue

- Usa `localStorage` com chave `'mira_kills_pending'`
- Formato: `{ count: number, lastUpdate: timestamp }`
- Validação: mínimo 50 para claim

### UI do Botão

- Posicionado no centro do canvas Phaser
- Aparece apenas quando `pendingKills >= 50`
- Animação de pulse contínua
- Texto: "CLAIM [X] KILLS" onde X é o número de kills pendentes