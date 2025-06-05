// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICryptoVaultStaking.sol";

/**
 * @title StrategyManager
 * @dev Contrat permettant de gérer plusieurs stratégies de staking
 */
contract StrategyManager is Ownable {
    // Contrat principal de staking
    ICryptoVaultStaking public stakingContract;
    
    // Liste des stratégies
    address[] public strategies;
    mapping(address => bool) public isStrategyActive;
    mapping(address => string) public strategyNames;
    
    // Tokens supportés
    mapping(address => bool) public supportedTokens;
    
    // Événements
    event StrategyAdded(address indexed strategy, string name);
    event StrategyRemoved(address indexed strategy);
    event StrategyEnabled(address indexed strategy);
    event StrategyDisabled(address indexed strategy);
    event TokenEnabled(address indexed token);
    event TokenDisabled(address indexed token);
    event FundsAllocated(address indexed token, address indexed strategy, uint256 amount);
    
    /**
     * @dev Initialise le contrat avec l'adresse du contrat principal
     * @param _stakingContract Adresse du contrat CryptoVaultStaking
     */
    constructor(address _stakingContract) Ownable(msg.sender) {
        stakingContract = ICryptoVaultStaking(_stakingContract);
    }
    
    /**
     * @dev Ajoute une nouvelle stratégie
     * @param _strategy Adresse du contrat de stratégie
     * @param _name Nom de la stratégie pour identification
     */
    function addStrategy(address _strategy, string calldata _name) external onlyOwner {
        require(_strategy != address(0), "Invalid strategy address");
        require(!isStrategyRegistered(_strategy), "Strategy already registered");
        
        strategies.push(_strategy);
        isStrategyActive[_strategy] = true;
        strategyNames[_strategy] = _name;
        
        emit StrategyAdded(_strategy, _name);
    }
    
    /**
     * @dev Désactive une stratégie
     * @param _strategy Adresse de la stratégie à désactiver
     */
    function disableStrategy(address _strategy) external onlyOwner {
        require(isStrategyRegistered(_strategy), "Strategy not registered");
        
        isStrategyActive[_strategy] = false;
        emit StrategyDisabled(_strategy);
    }
    
    /**
     * @dev Active une stratégie
     * @param _strategy Adresse de la stratégie à activer
     */
    function enableStrategy(address _strategy) external onlyOwner {
        require(isStrategyRegistered(_strategy), "Strategy not registered");
        
        isStrategyActive[_strategy] = true;
        emit StrategyEnabled(_strategy);
    }
    
    /**
     * @dev Vérifie si une stratégie est enregistrée
     * @param _strategy Adresse de la stratégie
     * @return bool True si la stratégie est enregistrée
     */
    function isStrategyRegistered(address _strategy) public view returns (bool) {
        for (uint i = 0; i < strategies.length; i++) {
            if (strategies[i] == _strategy) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Active un token pour utilisation
     * @param _token Adresse du token
     */
    function enableToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        supportedTokens[_token] = true;
        emit TokenEnabled(_token);
    }
    
    /**
     * @dev Désactive un token
     * @param _token Adresse du token
     */
    function disableToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
        emit TokenDisabled(_token);
    }
    
    /**
     * @dev Alloue des fonds à une stratégie
     * @param _token Adresse du token à allouer
     * @param _strategy Adresse de la stratégie
     * @param _amount Montant à allouer
     */
    function allocateToStrategy(address _token, address _strategy, uint256 _amount) external onlyOwner {
        require(supportedTokens[_token], "Token not supported");
        require(isStrategyRegistered(_strategy), "Strategy not registered");
        require(isStrategyActive[_strategy], "Strategy not active");
        
        // Retirer les fonds du contrat de staking
        stakingContract.adminWithdraw(_token, _amount);
        
        // Approuver la stratégie pour utiliser le token
        IERC20(_token).approve(_strategy, _amount);
        
        // Émettre l'événement
        emit FundsAllocated(_token, _strategy, _amount);
    }
    
    /**
     * @dev Récupère toutes les stratégies actives
     * @return array Tableau des adresses des stratégies actives
     */
    function getActiveStrategies() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Compter les stratégies actives
        for (uint256 i = 0; i < strategies.length; i++) {
            if (isStrategyActive[strategies[i]]) {
                activeCount++;
            }
        }
        
        // Créer le tableau résultat
        address[] memory activeStrategies = new address[](activeCount);
        uint256 index = 0;
        
        // Remplir le tableau
        for (uint256 i = 0; i < strategies.length; i++) {
            if (isStrategyActive[strategies[i]]) {
                activeStrategies[index] = strategies[i];
                index++;
            }
        }
        
        return activeStrategies;
    }
    
    /**
     * @dev Récupère toutes les stratégies
     * @return array Tableau des adresses de toutes les stratégies
     */
    function getAllStrategies() external view returns (address[] memory) {
        return strategies;
    }
}