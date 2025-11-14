// Configurações do jogo
export const CONTRACT_ADDRESS = '0x3B65d74cdB9626D8A793438acA2C88698AAdfBf3'; // Contrato deployado na Arc Testnet

// ABI do contrato KillContract
export const CONTRACT_ABI = [
    'function claimKills(uint256 count)',
    'function getPlayerKills(address) view returns (uint256)',
    'function setDailyCap(uint256 newCap)',
    'event KillsClaimed(address indexed player, uint256 count, uint256 timestamp)'
];
export const RPC_URL = 'https://rpc.testnet.arc.network'; // Arc Testnet
export const EXPLORER_URL = 'https://testnet.arcscan.app/tx/';

// Configurações da Rede Arc Testnet
export const ARC_TESTNET = {
    chainId: '0x4CEF52', // ChainId da Arc Testnet em hexadecimal (5042002 em decimal)
    chainIdDecimal: 5042002,
    chainName: 'Arc Testnet',
    nativeCurrency: {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 18
    },
    rpcUrls: ['https://rpc.testnet.arc.network'],
    blockExplorerUrls: ['https://testnet.arcscan.app']
};

// Altura do HUD (reservada no topo)
export const HUD_HEIGHT = 180;

// Configurações do Phaser - ocupa espaço abaixo do HUD
export const GAME_CONFIG = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight - HUD_HEIGHT,
    backgroundColor: '#000000',
    parent: 'game',
    physics: { 
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Constantes do jogo
export const TARGET_SPAWN_DELAY = 5000; // 5 segundos
export const TARGET_LIFETIME = 4000; // 4 segundos
export const COOLDOWN_TIME = 5000; // 5 segundos anti-spam
export const SCORE_FOR_MOVEMENT = 5; // Score necessário para alvos se moverem
export const TARGET_SIZE = 20;
export const TARGET_BODY_SIZE = 40;
export const TARGET_MAX_HEALTH = 5; // Vida máxima do alvo
export const DAMAGE_PER_HIT = 1; // Dano por tiro
export const MIN_KILLS_FOR_CLAIM = 10; // Mínimo de kills para fazer claim (para testes)

