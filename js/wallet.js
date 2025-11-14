// Lógica de wallet
import { ARC_TESTNET } from './config.js';

let ethers;

// Carrega Ethers dinamicamente
export async function loadEthers() {
    if (!ethers) {
        const module = await import('https://cdn.jsdelivr.net/npm/ethers@6.13.2/+esm');
        ethers = module;
    }
    return ethers;
}

// Detecta se há provider de wallet externa (MetaMask, etc)
export function hasExternalWallet() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

// Obtém o chainId atual da wallet
export async function getCurrentChainId() {
    if (!hasExternalWallet()) return null;
    
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return chainId;
    } catch (err) {
        console.error('Erro ao obter chainId:', err);
        return null;
    }
}

// Verifica se a rede conectada é Arc Testnet
export async function isArcTestnet() {
    if (!hasExternalWallet()) return false;
    
    try {
        const chainId = await getCurrentChainId();
        if (!chainId) return false;
        
        // Normaliza chainId para comparação
        let chainIdNum;
        if (typeof chainId === 'string') {
            // Remove '0x' se presente e converte
            const cleanId = chainId.startsWith('0x') ? chainId.slice(2) : chainId;
            chainIdNum = parseInt(cleanId, 16);
        } else {
            chainIdNum = chainId;
        }
        
        // Compara com o decimal esperado
        const isMatch = chainIdNum === ARC_TESTNET.chainIdDecimal;
        
        if (!isMatch) {
            console.log('ChainId atual:', chainId, '->', chainIdNum, 'Esperado:', ARC_TESTNET.chainIdDecimal);
        }
        
        return isMatch;
    } catch (err) {
        console.error('Erro ao verificar rede:', err);
        return false;
    }
}

// Adiciona Arc Testnet ao MetaMask se não estiver configurada
export async function addArcTestnetToWallet() {
    if (!hasExternalWallet()) {
        throw new Error('Nenhuma wallet externa detectada. Instale MetaMask ou outra wallet compatível.');
    }
    
    try {
        // Formata chainId corretamente (pode ser string ou número)
        const chainId = typeof ARC_TESTNET.chainId === 'string' 
            ? ARC_TESTNET.chainId 
            : `0x${ARC_TESTNET.chainIdDecimal.toString(16)}`;
        
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: chainId,
                chainName: ARC_TESTNET.chainName,
                nativeCurrency: ARC_TESTNET.nativeCurrency,
                rpcUrls: ARC_TESTNET.rpcUrls,
                blockExplorerUrls: ARC_TESTNET.blockExplorerUrls
            }]
        });
        // Pequeno delay para garantir que a rede foi adicionada
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    } catch (err) {
        // Se a rede já estiver adicionada, não é um erro crítico
        if (err.code === -32602 || err.code === 4001 || err.message?.includes('already') || err.message?.includes('User rejected')) {
            console.log('Rede já está adicionada ou usuário rejeitou');
            return true;
        }
        console.error('Erro ao adicionar rede:', err);
        throw err;
    }
}

// Solicita mudança para Arc Testnet
export async function switchToArcTestnet() {
    if (!hasExternalWallet()) {
        throw new Error('Nenhuma wallet externa detectada.');
    }
    
    try {
        // Sempre adiciona a rede primeiro (se já estiver adicionada, não faz nada)
        await addArcTestnetToWallet();
        
        // Aguarda um pouco
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Depois tenta fazer o switch
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ARC_TESTNET.chainId }]
        });
        return true;
    } catch (switchError) {
        // Se a rede não estiver adicionada (código 4902), tenta adicionar novamente
        if (switchError.code === 4902 || switchError.code === -32603) {
            console.log('Rede não encontrada, adicionando novamente...');
            await addArcTestnetToWallet();
            // Aguarda mais tempo
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Tenta switch novamente após adicionar
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ARC_TESTNET.chainId }]
                });
                return true;
            } catch (retryError) {
                throw new Error('Não foi possível mudar para Arc Testnet. Por favor, mude manualmente no MetaMask.');
            }
        }
        throw switchError;
    }
}

// Conecta wallet externa e valida rede
export async function connectExternalWallet() {
    if (!hasExternalWallet()) {
        throw new Error('Nenhuma wallet externa detectada. Instale MetaMask ou outra wallet compatível.');
    }
    
    const Ethers = await loadEthers();
    
    try {
        // Solicita conexão
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (!accounts || accounts.length === 0) {
            throw new Error('Nenhuma conta conectada.');
        }
        
        // Obtém chainId atual para debug
        const currentChainId = await getCurrentChainId();
        console.log('ChainId atual da wallet:', currentChainId);
        
        // Verifica se está na rede correta
        let isCorrectNetwork = await isArcTestnet();
        
        if (!isCorrectNetwork) {
            console.log('Rede incorreta detectada. Tentando mudar para Arc Testnet...');
            
            try {
                // Sempre tenta adicionar a rede primeiro (se já estiver adicionada, não faz nada)
                console.log('Adicionando Arc Testnet ao MetaMask...');
                await addArcTestnetToWallet();
                
                // Aguarda um pouco para garantir que a rede foi processada
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Depois tenta fazer o switch
                console.log('Mudando para Arc Testnet...');
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: ARC_TESTNET.chainId }]
                });
                
                // Aguarda um pouco para a mudança de rede processar
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Verifica novamente após tentar mudar
                isCorrectNetwork = await isArcTestnet();
                const newChainId = await getCurrentChainId();
                console.log('ChainId após mudança:', newChainId);
                
                if (!isCorrectNetwork) {
                    throw new Error(`Por favor, mude manualmente para Arc Testnet no MetaMask. ChainId esperado: ${ARC_TESTNET.chainId} (${ARC_TESTNET.chainIdDecimal})`);
                }
            } catch (networkError) {
                console.error('Erro ao mudar rede:', networkError);
                const currentId = await getCurrentChainId();
                throw new Error(`Não foi possível mudar para Arc Testnet. ChainId atual: ${currentId}. Por favor, mude manualmente no MetaMask.`);
            }
        }
        
        // Cria provider e wallet conectada
        const provider = new Ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        return {
            wallet: signer,
            provider: provider,
            address: address,
            isExternal: true
        };
    } catch (err) {
        console.error('Erro ao conectar wallet:', err);
        throw err;
    }
}

// Salva preferência de wallet (local ou externa)
export function saveWalletPreference(isExternal) {
    localStorage.setItem('walletPreference', isExternal ? 'external' : 'local');
}

// Carrega preferência de wallet
export function getWalletPreference() {
    return localStorage.getItem('walletPreference') || 'local';
}

// Persiste wallet no localStorage
export function saveWallet(wallet) {
    localStorage.setItem('gameWallet', JSON.stringify({ 
        address: wallet.address, 
        privateKey: wallet.privateKey, 
        mnemonic: wallet.mnemonic.phrase 
    }));
}

// Carrega wallet do localStorage
export async function loadWallet() {
    const Ethers = await loadEthers();
    const saved = localStorage.getItem('gameWallet');
    if (saved) {
        const data = JSON.parse(saved);
        return new Ethers.Wallet(data.privateKey);
    }
    return null;
}

// Cria nova wallet
export async function createWallet() {
    const Ethers = await loadEthers();
    return Ethers.Wallet.createRandom();
}

