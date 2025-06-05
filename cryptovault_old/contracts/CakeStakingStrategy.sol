// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IPancakeRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external view returns (uint256[] memory amounts);
}

interface ICakePool {
    function deposit(uint256 _amount, uint256 _lockDuration) external;
    function withdraw(uint256 _amount) external;
    function withdrawAll() external;
    function harvest() external;
    function emergencyWithdraw() external;
    function unlock() external;
    function pendingReward(address _user) external view returns (uint256);
    function isActive() external view returns (bool);
    function getRemainingLockTime(address _user) external view returns (uint256);
}

contract CakeStakingStrategy is Ownable, ReentrancyGuard {
    // Adresses des contrats externes
    IPancakeRouter public pancakeRouter;
    ICakePool public cakePool;
    
    // Adresses des tokens
    address public cake;
    address public depositToken; // USDC ou USDT
    
    // Variables de suivi
    uint256 public depositedAmount;
    uint256 public stakedCakeAmount;
    uint256 public initialDepositTime;
    uint256 public lastHarvestTime;
    uint256 public totalRewardsHarvested;
    bool public isActive = true;
    
    // Variables de rendement
    uint256 public yesterdayValue;
    uint256 public lastValueUpdateTime;
    uint256 public dailyYieldBps; // en points de base (1% = 100)
    
    // Slippage par défaut (3%)
    uint256 public slippageTolerance = 300; // en points de base
    
    // Events
    event Deposited(uint256 amount, uint256 cakeAmount);
    event Withdrawn(uint256 amount, uint256 cakeAmount);
    event Harvested(uint256 rewardAmount);
    event YieldUpdated(uint256 dailyYield);
    event StakeUnlocked(uint256 cakeRemaining, uint256 penalty);
    event EmergencyExit(uint256 cakeRecovered, uint256 tokenRecovered);
    event SlippageToleranceUpdated(uint256 newTolerance);
    
    constructor(
        address _pancakeRouter,
        address _cakePool,
        address _cake,
        address _depositToken
    ) Ownable(msg.sender) { // Ajout du paramètre msg.sender au constructeur Ownable
        pancakeRouter = IPancakeRouter(_pancakeRouter);
        cakePool = ICakePool(_cakePool);
        cake = _cake;
        depositToken = _depositToken;
    }
    
    // Fonction pour déposer des tokens, les convertir en CAKE et les staker
    function deposit(uint256 _amount, uint256 _lockDuration) external onlyOwner nonReentrant {
        require(isActive, "Strategy inactive");
        require(_amount > 0, "Amount must be greater than 0");
        
        // 1. Le montant est déjà transféré au contrat
        
        // 2. Approuver le routeur
        IERC20(depositToken).approve(address(pancakeRouter), _amount);
        
        // 3. Préparer le chemin de swap
        address[] memory path = new address[](2);
        path[0] = depositToken;
        path[1] = cake;
        
        // 4. Calculer le montant minimum de CAKE attendu avec slippage
        uint256[] memory amountsOut = pancakeRouter.getAmountsOut(_amount, path);
        uint256 minCakeAmount = amountsOut[1] * (10000 - slippageTolerance) / 10000;
        
        // 5. Swap et récupérer les CAKE
        uint256 cakeBalanceBefore = IERC20(cake).balanceOf(address(this));
        
        pancakeRouter.swapExactTokensForTokens(
            _amount,
            minCakeAmount,
            path,
            address(this),
            block.timestamp + 300
        );
        
        uint256 cakeReceived = IERC20(cake).balanceOf(address(this)) - cakeBalanceBefore;
        
        // 6. Approuver et staker les CAKE
        IERC20(cake).approve(address(cakePool), cakeReceived);
        cakePool.deposit(cakeReceived, _lockDuration);
        
        // 7. Mettre à jour les variables de suivi
        if (depositedAmount == 0) {
            initialDepositTime = block.timestamp;
            lastValueUpdateTime = block.timestamp;
            yesterdayValue = _amount; // Valeur initiale
        }
        
        depositedAmount += _amount;
        stakedCakeAmount += cakeReceived;
        
        emit Deposited(_amount, cakeReceived);
        
        // 8. Mettre à jour le rendement quotidien si nécessaire
        updateDailyYield();
    }
    
    // Fonction pour retirer des fonds
    function withdraw(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= depositedAmount, "Amount exceeds deposited");
        
        // Calculer la proportion de CAKE à retirer
        uint256 cakeToWithdraw = (_amount * stakedCakeAmount) / depositedAmount;
        
        // Retirer du pool
        cakePool.withdraw(cakeToWithdraw);
        
        // Convertir les CAKE en token de dépôt
        IERC20(cake).approve(address(pancakeRouter), cakeToWithdraw);
        
        address[] memory path = new address[](2);
        path[0] = cake;
        path[1] = depositToken;
        
        // Swap CAKE vers le token de dépôt
        pancakeRouter.swapExactTokensForTokens(
            cakeToWithdraw,
            0, // À améliorer en production
            path,
            owner(),
            block.timestamp + 300
        );
        
        // Mettre à jour les variables
        depositedAmount -= _amount;
        stakedCakeAmount -= cakeToWithdraw;
        
        emit Withdrawn(_amount, cakeToWithdraw);
        
        // Mettre à jour le rendement quotidien
        updateDailyYield();
    }
    
    // Récolter les récompenses
    function harvest() external onlyOwner nonReentrant {
        // Vérifier s'il y a des récompenses en attente
        uint256 pendingRewards = cakePool.pendingReward(address(this));
        require(pendingRewards > 0, "No rewards to harvest");
        
        // Récolter du pool
        cakePool.harvest();
        
        // Obtenir le solde CAKE
        uint256 cakeBalance = IERC20(cake).balanceOf(address(this));
        
        if (cakeBalance > 0) {
            // Transférer au propriétaire
            IERC20(cake).transfer(owner(), cakeBalance);
            
            // Mettre à jour les variables
            totalRewardsHarvested += cakeBalance;
            lastHarvestTime = block.timestamp;
            
            emit Harvested(cakeBalance);
        }
        
        // Mettre à jour les rendements quotidiens
        updateDailyYield();
    }
    
    // Déverrouiller un stake (pour les stakes verrouillés)
    function unlockStake() external onlyOwner nonReentrant {
        cakePool.unlock();
        emit StakeUnlocked(stakedCakeAmount, 0);
    }
    
    // Fonction d'urgence pour retirer tous les fonds
    function emergencyExit() external onlyOwner nonReentrant {
        // 1. Tenter de déverrouiller si nécessaire
        try cakePool.unlock() {} catch {}
        
        // 2. Tenter de retirer tous les fonds
        try cakePool.withdrawAll() {} catch {
            try cakePool.emergencyWithdraw() {} catch {}
        }
        
        // 3. Récupérer tout CAKE présent dans le contrat
        uint256 cakeBalance = IERC20(cake).balanceOf(address(this));
        uint256 depositTokenBalance = IERC20(depositToken).balanceOf(address(this));
        
        if (cakeBalance > 0) {
            IERC20(cake).transfer(owner(), cakeBalance);
        }
        
        if (depositTokenBalance > 0) {
            IERC20(depositToken).transfer(owner(), depositTokenBalance);
        }
        
        // 4. Marquer la stratégie comme inactive
        isActive = false;
        
        emit EmergencyExit(cakeBalance, depositTokenBalance);
    }
    
    // Fonctions de monitoring
    
    // Mise à jour du rendement quotidien
    function updateDailyYield() public {
        // Ne mettre à jour qu'une fois par jour
        if (block.timestamp >= lastValueUpdateTime + 1 days) {
            // Estimer la valeur actuelle basée sur le prix actuel de CAKE
            uint256 currentValue = getCurrentValueInternal();
            
            // Calculer le rendement quotidien
            if (yesterdayValue > 0 && currentValue > yesterdayValue) {
                dailyYieldBps = ((currentValue - yesterdayValue) * 10000) / yesterdayValue;
            } else {
                dailyYieldBps = 0;
            }
            
            // Mettre à jour pour demain
            yesterdayValue = currentValue;
            lastValueUpdateTime = block.timestamp;
            
            emit YieldUpdated(dailyYieldBps);
        }
    }
    
    // Calcul de la valeur actuelle (estimation)
    function getCurrentValueInternal() internal view returns (uint256) {
        if (depositedAmount == 0) return 0;
        
        uint256 currentValue = depositedAmount;
        uint256 pendingRewards = cakePool.pendingReward(address(this));
        
        // Estimation simple des récompenses
        if (pendingRewards > 0 && stakedCakeAmount > 0) {
            currentValue += (pendingRewards * depositedAmount) / stakedCakeAmount;
        }
        
        return currentValue;
    }
    
    // Paramétrage du slippage
    function setSlippageTolerance(uint256 _newTolerance) external onlyOwner {
        require(_newTolerance <= 1000, "Slippage too high"); // Max 10%
        slippageTolerance = _newTolerance;
        emit SlippageToleranceUpdated(_newTolerance);
    }
    
    // Activer/désactiver la stratégie
    function setActive(bool _isActive) external onlyOwner {
        isActive = _isActive;
    }
    
    // Fonctions de vue pour monitoring
    
    // Rendement quotidien
    function getDailyYield() external view returns (uint256) {
        return dailyYieldBps;
    }
    
    // Valeur actuelle
    function getCurrentValue() external view returns (uint256) {
        return getCurrentValueInternal();
    }
    
    // Temps restant pour le staking verrouillé
    function getRemainingLockTime() external view returns (uint256) {
        return cakePool.getRemainingLockTime(address(this));
    }
    
    // État du staking
    function getPoolStatus() external view returns (bool active, string memory statusMessage) {
        bool poolActive = cakePool.isActive();
        
        if (!isActive) {
            return (false, "Strategy disabled by owner");
        } else if (!poolActive) {
            return (false, "PancakeSwap pool inactive");
        } else {
            return (true, "Active");
        }
    }
}