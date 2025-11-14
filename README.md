# Arc Game - Blockchain Shooting Game

Shooting game integrated with blockchain on Arc Testnet. Accumulate kills locally and claim them in batch to save gas and avoid repeated MetaMask approvals. Features combo system, level progression, multiple target types, achievements, and progressive difficulty scaling.

## 🚀 How to Run

### Prerequisites
- Node.js installed (version 14 or higher)
- npm or yarn
- MetaMask or another Ethereum-compatible wallet (optional - can use local wallet)

### Installation and Execution

1. **Install dependencies:**
```bash
npm install
```

2. **Start the local server:**
```bash
npm start
```

Or use:
```bash
npm run dev
```

The server will start on port 8080 and the browser will open automatically.

### ⚠️ Important

**DO NOT open the `index.html` file directly in the browser** (using `file://`), as ES6 modules do not work with this protocol due to security policies (CORS).

Always use the local HTTP server through the `npm start` command.

## 🎮 How to Play

1. **Connect Your Wallet:**
   - Click "Connect Wallet" to connect MetaMask or another external wallet
   - OR click "Create Local Wallet" to create a local wallet
   - The game requires **Arc Testnet** - the network will be added automatically if needed

2. **Fund Your Wallet:**
   - Get USDC testnet from the [faucet](https://faucet.circle.com) to have gas

3. **Play:**
   - Shoot at the USDC targets that appear on screen (click with mouse)
   - Different target types appear as you level up:
     - **Normal** (Green): 5 HP, 1 kill value
     - **Fast** (Cyan): 3 HP, 1 kill value, faster movement (unlocked at level 5)
     - **Tank** (Gold): 10 HP, 3 kill value, slower but tougher (unlocked at level 10)
     - **Special** (Magenta): 7 HP, 5 kill value, rare spawn (unlocked at level 20)
   - Build combos by hitting targets consecutively - higher combos give bonus kills!
   - Kills are accumulated locally (no immediate transactions)

4. **Progression:**
   - Gain XP and level up by accumulating kills
   - Each level unlocks new features and increases difficulty
   - Track your stats: total kills, best combo, accuracy, play time
   - Unlock achievements as you play

5. **Claim:**
   - When you accumulate **10 or more kills**, the "Claim Kills" button will appear in the HUD
   - Click to claim all accumulated kills in a single transaction
   - Combo bonuses and level bonuses (10% at level 10+) are included in the claim
   - After claiming, kills are reset and you can accumulate again

## 🛠️ Technologies

- **Phaser 3.80.1** - Game engine
- **Ethers.js v6.13.2** - Blockchain integration
- **Arc Testnet** - Blockchain network (Chain ID: 5042002)
- **HTML5/CSS3/JavaScript** - Vanilla frontend with ES6 modules

## 📁 Project Structure

```
mira-arc-game/
├── assets/
│   ├── audio-effects/       # Sound effects (shots, explosions)
│   └── images/              # Spritesheets (USDC coin, explosions)
├── css/
│   └── styles.css           # Futuristic/cyberpunk styles
├── js/
│   ├── config.js            # Configuration and constants (contract, network)
│   ├── wallet.js            # Wallet management (local and external)
│   ├── blockchain.js        # Blockchain integration (transactions, claim)
│   ├── effects.js           # Visual effects (explosions, particles, animations)
│   ├── ui.js                # UI components (HUD, notifications, level display)
│   ├── game.js              # Main Phaser logic
│   ├── killQueue.js         # Accumulated kills management (localStorage)
│   ├── combo.js             # Combo system and multipliers
│   ├── stats.js             # Persistent statistics tracking
│   ├── progression.js       # Level system and XP calculation
│   ├── targetTypes.js       # Target type definitions and spawn logic
│   ├── difficulty.js        # Progressive difficulty scaling
│   └── achievements.js      # Achievement system and unlocks
├── index.html               # HTML structure and initialization
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## 🎨 Features

### Gameplay
- **Health System**: Targets have varying HP based on type (3-10 HP)
- **Multiple Target Types**: Normal, Fast, Tank, and Special targets with different properties
- **USDC Targets**: Animated spritesheet with USDC coin rotation
- **Animated Explosion**: Special animation when target is destroyed
- **Progressive Difficulty**: 
  - Targets start moving after 5 kills
  - Spawn rate, speed, and health scale with player level
  - Maximum simultaneous targets increases with level
- **Combo System**: 
  - Build combos by hitting targets consecutively
  - Combos decay after 5 seconds without a hit
  - Higher combos (10+, 20+, 30+) grant bonus kills
  - Visual combo indicator in HUD
- **Level Progression**:
  - Gain XP and level up based on total kills
  - Visual XP bar and level display
  - Unlock new target types at levels 5, 10, and 20
  - Level bonuses: +10% kills on claim at level 10+
- **Achievements**: 10 different achievements to unlock
- **Statistics Tracking**: 
  - Total kills, best combo, accuracy, play time
  - Best session score
  - All stats persist across sessions
- **Sound Effects**: Shot, explosion, and coin received sounds
- **Visual Feedback**: 
  - Floating text showing kills gained
  - Level up animations
  - Achievement unlock notifications
  - Combo indicator with special effects for high combos

### Blockchain
- **External Wallet**: Support for MetaMask and other compatible wallets
- **Network Validation**: Requires exclusive use of Arc Testnet
- **Batch Claim**: Accumulate kills locally and claim them in a single transaction
- **Gas Savings**: Avoids repeated transactions, saving gas
- **Smart Bonuses**: Combo bonuses and level bonuses are included in claims

### UI/UX
- **Futuristic HUD**: Cards with neon borders and glow effects
- **Notifications**: Transaction notifications in bottom-left corner (no container)
- **Claim Button**: Appears in HUD when there are 10+ accumulated kills
- **Pending Kills Counter**: Visual display in HUD with pulse animation when ready
- **Combo Display**: Real-time combo counter with multiplier (yellow for normal, orange for high combos)
- **Level Display**: Current level and XP progress bar
- **Responsive Layout**: Game canvas separated from HUD, no overlap
- **Achievement Notifications**: Full-screen animations when achievements are unlocked
- **Level Up Animations**: Celebratory animations when leveling up

## 🔧 Configuration

### Smart Contract
The contract address is configured in `js/config.js`:
- **CONTRACT_ADDRESS**: `0x9eFc3Fe047CCE17000426FfE67d4F8AB596882F3`
- **MIN_KILLS_FOR_CLAIM**: 10 (minimum kills to claim)

### Arc Testnet
- **Chain ID**: 5042002 (0x4CEF52)
- **RPC URL**: Automatically configured
- **Explorer**: https://testnet.arcscan.app

## 📝 Development Notes

- The project uses ES6 modules, requires local HTTP server
- Kills are persisted in `localStorage` to not lose on reload
- The system automatically validates the connected network and requests change if necessary
- Transaction notifications include link to Arc Testnet explorer

## 🔐 Smart Contract

The game uses a custom ERC-20 token contract deployed on Arc Testnet. The contract allows players to claim accumulated kills as tokens (1 kill = 1 token).

### Contract Details
- **Name**: Arc Game Token (ARCGAME)
- **Address**: `0x9eFc3Fe047CCE17000426FfE67d4F8AB596882F3`
- **Network**: Arc Testnet (Chain ID: 5042002)
- **Standard**: ERC-20 with Ownable

### Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KillContract
 * @dev Contrato para gerenciar kills e tokens do jogo Mira nas Transações
 * Cada kill equivale a 1 token que pode ser reivindicado pelo jogador
 */
contract KillContract is ERC20, Ownable {
    // Mapeamento de endereço para total de kills acumulados
    mapping(address => uint256) public playerKills;
    
    mapping(address => uint256) public lastClaimTime; // Pra cap diário
    uint256 public DAILY_CAP = 100; // Max kills claim por dia (mutável pelo owner)
    uint256 public constant DAY_IN_SECONDS = 86400;
    
    event KillsClaimed(
        address indexed player,
        uint256 count,
        uint256 tokensMinted,
        uint256 timestamp
    );
    
    constructor() ERC20("Arc Game Token", "ARCGAME") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals()); // 1M tokens iniciais pro owner
    }
    
    /**
     * @dev Reivindica kills acumulados
     * @param count Número de kills a serem reivindicados
     * 
     * Requisitos:
     * - count deve ser maior que 0
     * - O jogador deve ter kills suficientes acumulados (cap diário)
     */
    function claimKills(uint256 count) external {
        require(count > 0, "Count must be greater than 0");
        require(count <= DAILY_CAP, "Exceeds daily cap");
        
        // require(block.timestamp >= lastClaimTime[msg.sender] + DAY_IN_SECONDS, "Daily cap already claimed"); // Comentado pro MVP testnet - libera claims múltiplos
        
        // Adiciona kills ao total do jogador e mint tokens (1:1)
        playerKills[msg.sender] += count;
        uint256 tokens = count * 10**decimals();
        _mint(msg.sender, tokens);
        
        lastClaimTime[msg.sender] = block.timestamp; // Mantém pra future/mainnet
        
        // Emite evento
        emit KillsClaimed(msg.sender, count, tokens, block.timestamp);
    }
    
    /**
     * @dev Retorna o total de kills de um jogador
     * @param player Endereço do jogador
     * @return Total de kills acumulados
     */
    function getPlayerKills(address player) external view returns (uint256) {
        return playerKills[player];
    }
    
    // Owner pode ajustar cap se precisar
    function setDailyCap(uint256 newCap) external onlyOwner {
        DAILY_CAP = newCap;
    }
}
```

### Key Features
- **ERC-20 Token**: Standard token implementation using OpenZeppelin
- **1:1 Minting**: Each kill equals 1 token (1 kill = 1 ARCGAME token)
- **Daily Cap**: Maximum of 100 kills can be claimed per day (configurable by owner)
- **Ownable**: Owner can adjust daily cap and manage contract
- **Events**: Emits `KillsClaimed` event for each claim transaction

### Functions
- `claimKills(uint256 count)`: Claims accumulated kills and mints tokens
- `getPlayerKills(address player)`: Returns total kills for a player
- `setDailyCap(uint256 newCap)`: Owner-only function to adjust daily cap
