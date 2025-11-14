// Integração blockchain
import { CONTRACT_ADDRESS, EXPLORER_URL, ARC_TESTNET, CONTRACT_ABI } from './config.js';
import { loadEthers, isArcTestnet, hasExternalWallet } from './wallet.js';

let cooldown = 0;

export function getCooldown() {
    return cooldown;
}

export function setCooldown(value) {
    cooldown = value;
}

export function updateCooldown(delta) {
    cooldown = Math.max(0, cooldown - delta);
}

// Trigger transação no contrato
export async function triggerTx(scene, wallet, provider, onSuccess, onError, onBalanceUpdate) {
    if (!wallet) {
        onError('Init wallet first!');
        cooldown = 0;
        return;
    }
    
    // Valida rede se for wallet externa
    if (hasExternalWallet()) {
        const isCorrect = await isArcTestnet();
        if (!isCorrect) {
            onError('Você precisa estar conectado à Arc Testnet para fazer transações!');
            cooldown = 0;
            return;
        }
    }
    
    try {
        const Ethers = await loadEthers();
        
        // Busca saldo antes da transação
        const balanceBefore = await provider.getBalance(wallet.address);
        const balanceBeforeEth = Ethers.formatEther(balanceBefore);
        console.log('Saldo antes da transação:', balanceBeforeEth, 'ETH');
        
        const abi = ['function eliminateTarget()'];
        const contract = new Ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
        const tx = await contract.eliminateTarget({ gasLimit: 50000 });
        console.log('TX Enviada:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('TX Confirmada! Block:', receipt.blockNumber, 'Gas Used:', receipt.gasUsed.toString());
        
        // Calcula custo do gas
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.gasPrice || tx.gasPrice;
        const totalCost = gasUsed * gasPrice;
        const totalCostEth = Ethers.formatEther(totalCost);
        console.log('Custo da transação:', totalCostEth, 'ETH');
        
        // Atualiza saldo após transação (com pequeno delay para garantir atualização)
        if (onBalanceUpdate && provider) {
            try {
                // Pequeno delay para garantir que o blockchain atualizou
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const newBalance = await provider.getBalance(wallet.address);
                const newBalanceEth = Ethers.formatEther(newBalance);
                const difference = parseFloat(balanceBeforeEth) - parseFloat(newBalanceEth);
                console.log('Saldo antes:', balanceBeforeEth, 'ETH');
                console.log('Novo saldo:', newBalanceEth, 'ETH');
                console.log('Diferença:', difference, 'ETH');
                onBalanceUpdate(wallet.address, newBalanceEth);
            } catch (balanceErr) {
                console.error('Erro ao atualizar saldo:', balanceErr);
            }
        } else {
            console.warn('onBalanceUpdate ou provider não disponível');
        }
        
        const txUrl = `${EXPLORER_URL}${tx.hash}`;
        onSuccess({
            hash: tx.hash,
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber,
            url: txUrl
        });
    } catch (err) {
        console.error('TX Error:', err.message);
        onError(err.message);
        cooldown = 0; // Reset só em erro
    }
}

// Claim kills em batch
export async function claimKills(scene, wallet, provider, killCount, onSuccess, onError, onBalanceUpdate) {
    if (!wallet) {
        onError('Init wallet first!');
        return;
    }
    
    if (killCount <= 0) {
        onError('Nenhum kill para fazer claim!');
        return;
    }
    
    // Valida rede se for wallet externa
    if (hasExternalWallet()) {
        const isCorrect = await isArcTestnet();
        if (!isCorrect) {
            onError('Você precisa estar conectado à Arc Testnet para fazer transações!');
            return;
        }
    }
    
    try {
        const Ethers = await loadEthers();
        
        // Busca saldo antes da transação
        const balanceBefore = await provider.getBalance(wallet.address);
        const balanceBeforeEth = Ethers.formatEther(balanceBefore);
        console.log('Saldo antes do claim:', balanceBeforeEth, 'ETH');
        console.log('Fazendo claim de', killCount, 'kills...');
        
        // Cria contrato com ABI completo
        const contract = new Ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
        
        // Tenta estimar gas primeiro - isso vai detectar problemas antes de enviar
        try {
            const estimatedGas = await contract.claimKills.estimateGas(killCount);
            console.log('Gas estimado:', estimatedGas.toString());
        } catch (estimateErr) {
            console.error('Erro ao estimar gas:', estimateErr);
            
            // Extrai mensagem de erro mais específica
            let errorMessage = estimateErr.message || 'Erro desconhecido';
            if (estimateErr.reason) {
                errorMessage = estimateErr.reason;
            } else if (estimateErr.data && estimateErr.data.message) {
                errorMessage = estimateErr.data.message;
            }
            
            // Se for erro de cap diário, mensagem mais amigável
            if (errorMessage.includes('Daily cap') || errorMessage.includes('cap already')) {
                throw new Error('Cap diário já foi reivindicado! Tente novamente amanhã.');
            }
            
            throw new Error(`Erro ao estimar gas: ${errorMessage}`);
        }
        
        // Chama função claimKills com o número de kills
        const tx = await contract.claimKills(killCount, { gasLimit: 150000 });
        console.log('TX Enviada:', tx.hash);
        
        const receipt = await tx.wait();
        
        // Verifica se a transação foi bem-sucedida
        if (receipt.status === 0) {
            console.error('Transação revertida! Receipt:', receipt);
            throw new Error('Transação revertida pelo contrato. Verifique os logs do contrato.');
        }
        
        console.log('TX Confirmada! Block:', receipt.blockNumber, 'Gas Used:', receipt.gasUsed.toString());
        
        // Calcula custo do gas
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.gasPrice || tx.gasPrice;
        const totalCost = gasUsed * gasPrice;
        const totalCostEth = Ethers.formatEther(totalCost);
        console.log('Custo da transação:', totalCostEth, 'ETH');
        
        // Atualiza saldo após transação
        if (onBalanceUpdate && provider) {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const newBalance = await provider.getBalance(wallet.address);
                const newBalanceEth = Ethers.formatEther(newBalance);
                console.log('Saldo antes:', balanceBeforeEth, 'ETH');
                console.log('Novo saldo:', newBalanceEth, 'ETH');
                onBalanceUpdate(wallet.address, newBalanceEth);
            } catch (balanceErr) {
                console.error('Erro ao atualizar saldo:', balanceErr);
            }
        }
        
        const txUrl = `${EXPLORER_URL}${tx.hash}`;
        onSuccess({
            hash: tx.hash,
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber,
            url: txUrl,
            killCount: killCount
        });
    } catch (err) {
        console.error('Claim Error completo:', err);
        console.error('Claim Error message:', err.message);
        console.error('Claim Error reason:', err.reason);
        
        // Tenta extrair mensagem de erro mais específica
        let errorMessage = err.message || 'Erro desconhecido';
        if (err.reason) {
            errorMessage = err.reason;
        } else if (err.data && err.data.message) {
            errorMessage = err.data.message;
        }
        
        onError(errorMessage);
    }
}

