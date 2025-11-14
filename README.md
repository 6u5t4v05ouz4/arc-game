# Arc Game - Blockchain Shooting Game

Shooting game integrated with blockchain on Arc Testnet. Accumulate kills locally and claim them in batch to save gas and avoid repeated MetaMask approvals.

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
   - Each target has 5 HP - you need to hit it 5 times to destroy it
   - Kills are accumulated locally (no immediate transactions)

4. **Claim:**
   - When you accumulate **10 or more kills**, the "Claim Kills" button will appear in the HUD
   - Click to claim all accumulated kills in a single transaction
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
│   ├── ui.js                # UI components (HUD, notifications)
│   ├── game.js              # Main Phaser logic
│   └── killQueue.js         # Accumulated kills management (localStorage)
├── index.html               # HTML structure and initialization
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## 🎨 Features

### Gameplay
- **Health System**: Targets have 5 HP, require multiple hits
- **USDC Targets**: Animated spritesheet with USDC coin rotation
- **Animated Explosion**: Special animation when target is destroyed
- **Progressive Difficulty**: Targets start moving after 5 kills
- **Sound Effects**: Shot, explosion, and coin received sounds

### Blockchain
- **External Wallet**: Support for MetaMask and other compatible wallets
- **Network Validation**: Requires exclusive use of Arc Testnet
- **Batch Claim**: Accumulate kills locally and claim them in a single transaction
- **Gas Savings**: Avoids repeated transactions, saving gas

### UI/UX
- **Futuristic HUD**: Cards with neon borders and glow effects
- **Notifications**: Transaction notifications in bottom-left corner (no container)
- **Claim Button**: Appears in HUD when there are 10+ accumulated kills
- **Pending Kills Counter**: Visual display in HUD
- **Responsive Layout**: Game canvas separated from HUD, no overlap

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
