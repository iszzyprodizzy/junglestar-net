/**
 * Jungle Star Games - Shared Systems
 * Provides localStorage highscores, unlockable badges, and merch cross-promo functionality
 */

class JungleStarSharedSystems {
    constructor() {
        this.gameId = null;
        this.playerName = localStorage.getItem('junglestar_player_name') || 'Player';
        
        // Badge definitions
        this.badgeDefinitions = {
            // Universal badges
            first_game: {
                id: 'first_game',
                name: 'Welcome to the Jungle!',
                description: 'Play your first Jungle Star game',
                icon: '🌟',
                rarity: 'common',
                unlocked: false
            },
            high_scorer: {
                id: 'high_scorer',
                name: 'High Scorer',
                description: 'Achieve a top 3 score in any game',
                icon: '🏆',
                rarity: 'rare',
                unlocked: false
            },
            completionist: {
                id: 'completionist',
                name: 'Game Master',
                description: 'Play all 10 Jungle Star games',
                icon: '👑',
                rarity: 'legendary',
                unlocked: false
            },
            
            // Game-specific badges
            broc_lee_master: {
                id: 'broc_lee_master',
                name: 'Broc Lee Master',
                description: 'Score over 1000 in Broc Lee Dojo',
                icon: '🥋',
                rarity: 'epic',
                unlocked: false
            },
            rainbow_genius: {
                id: 'rainbow_genius',
                name: 'Rainbow Genius',
                description: 'Complete 10 sequences in Rainbow Smoothie Lab',
                icon: '🌈',
                rarity: 'epic',
                unlocked: false
            },
            candy_sorter: {
                id: 'candy_sorter',
                name: 'Candy Sorter Supreme',
                description: 'Reach level 10 in Candy Cleanup',
                icon: '🍭',
                rarity: 'rare',
                unlocked: false
            },
            water_warrior: {
                id: 'water_warrior',
                name: 'Water Warrior',
                description: 'Run 5000 meters in Water Malone Warriors',
                icon: '🍉',
                rarity: 'rare',
                unlocked: false
            },
            garden_defender: {
                id: 'garden_defender',
                name: 'Garden Defender',
                description: 'Survive 20 waves in Protect the Garden',
                icon: '🛡️',
                rarity: 'epic',
                unlocked: false
            },
            match_master: {
                id: 'match_master',
                name: 'Match Master',
                description: 'Score 50,000 points in Veggie Match-3',
                icon: '💎',
                rarity: 'epic',
                unlocked: false
            },
            seed_slinger: {
                id: 'seed_slinger',
                name: 'Seed Slinger Elite',
                description: 'Survive 15 waves in Seed Slinger',
                icon: '🎯',
                rarity: 'rare',
                unlocked: false
            },
            market_tycoon: {
                id: 'market_tycoon',
                name: 'Market Tycoon',
                description: 'Earn $1,000,000 in Farmer\'s Market Tycoon',
                icon: '💰',
                rarity: 'legendary',
                unlocked: false
            }
        };
        
        // Merch promo definitions
        this.merchDefinitions = {
            broc_lee_shirt: {
                id: 'broc_lee_shirt',
                name: 'Broc Lee Dojo T-Shirt',
                description: 'Show your martial arts veggie pride!',
                image: '🥋👕',
                price: '$19.99',
                unlockCondition: 'Play Broc Lee Dojo',
                unlocked: false
            },
            rainbow_mug: {
                id: 'rainbow_mug',
                name: 'Rainbow Smoothie Mug',
                description: 'Perfect for your morning smoothie!',
                image: '🌈☕',
                price: '$14.99',
                unlockCondition: 'Play Rainbow Smoothie Lab',
                unlocked: false
            },
            jungle_star_hoodie: {
                id: 'jungle_star_hoodie',
                name: 'Jungle Star Games Hoodie',
                description: 'Official Jungle Star Games merchandise',
                image: '🌟👘',
                price: '$39.99',
                unlockCondition: 'Unlock 5 badges',
                unlocked: false
            },
            veggie_plushie: {
                id: 'veggie_plushie',
                name: 'Veggie Character Plushie Set',
                description: 'Collect all your favorite veggie characters!',
                image: '🥕🧸',
                price: '$24.99',
                unlockCondition: 'Play all games',
                unlocked: false
            }
        };
        
        // Initialize empty objects first
        this.badges = {};
        this.highscores = {};
        this.merchPromos = {};
        
        // Load saved data after definitions are set
        setTimeout(() => {
            try {
                this.badges = this.loadBadges();
                this.highscores = this.loadHighscores();
                this.merchPromos = this.loadMerchPromos();
            } catch (e) {
                console.log('Error loading saved data:', e);
            }
        }, 0);
    }
    
    // Initialize for a specific game
    init(gameId) {
        this.gameId = gameId;
        this.trackGamePlayed(gameId);
        this.checkBadgeUnlocks();
        this.checkMerchUnlocks();
        return this;
    }
    
    // Highscore Management
    submitScore(score, gameData = {}) {
        if (!this.gameId) {
            console.warn('Game ID not set. Call init() first.');
            return;
        }
        
        const scoreEntry = {
            score: score,
            playerName: this.playerName,
            timestamp: Date.now(),
            gameData: gameData
        };
        
        if (!this.highscores[this.gameId]) {
            this.highscores[this.gameId] = [];
        }
        
        this.highscores[this.gameId].push(scoreEntry);
        
        // Keep only top 10 scores
        this.highscores[this.gameId].sort((a, b) => b.score - a.score);
        this.highscores[this.gameId] = this.highscores[this.gameId].slice(0, 10);
        
        this.saveHighscores();
        
        // Check if this is a top 3 score
        const rank = this.highscores[this.gameId].findIndex(entry => 
            entry.timestamp === scoreEntry.timestamp
        ) + 1;
        
        if (rank <= 3) {
            this.unlockBadge('high_scorer');
        }
        
        // Check game-specific badge unlocks
        this.checkGameSpecificBadges(score, gameData);
        
        return rank;
    }
    
    getHighscores(gameId = null) {
        const targetGameId = gameId || this.gameId;
        return this.highscores[targetGameId] || [];
    }
    
    getPersonalBest(gameId = null) {
        const scores = this.getHighscores(gameId);
        const playerScores = scores.filter(entry => entry.playerName === this.playerName);
        return playerScores.length > 0 ? playerScores[0].score : 0;
    }
    
    // Badge Management
    unlockBadge(badgeId) {
        if (this.badges[badgeId] && !this.badges[badgeId].unlocked) {
            this.badges[badgeId].unlocked = true;
            this.badges[badgeId].unlockedAt = Date.now();
            this.saveBadges();
            this.showBadgeNotification(badgeId);
            this.checkMerchUnlocks();
            return true;
        }
        return false;
    }
    
    getBadges() {
        return Object.values(this.badges).filter(badge => badge.unlocked);
    }
    
    getBadgeProgress() {
        const total = Object.keys(this.badgeDefinitions).length;
        const unlocked = this.getBadges().length;
        return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
    }
    
    checkBadgeUnlocks() {
        // Check first game badge
        const gamesPlayed = this.getGamesPlayed();
        if (gamesPlayed.length >= 1) {
            this.unlockBadge('first_game');
        }
        
        // Check completionist badge
        if (gamesPlayed.length >= 10) {
            this.unlockBadge('completionist');
        }
    }
    
    checkGameSpecificBadges(score, gameData) {
        switch (this.gameId) {
            case 'broc_lee_dojo':
                if (score >= 1000) {
                    this.unlockBadge('broc_lee_master');
                }
                break;
            case 'rainbow_smoothie_lab':
                if (gameData.sequencesCompleted >= 10) {
                    this.unlockBadge('rainbow_genius');
                }
                break;
            case 'candy_cleanup':
                if (gameData.level >= 10) {
                    this.unlockBadge('candy_sorter');
                }
                break;
            case 'water_malone_warriors':
                if (gameData.distance >= 5000) {
                    this.unlockBadge('water_warrior');
                }
                break;
            case 'protect_the_garden':
                if (gameData.wave >= 20) {
                    this.unlockBadge('garden_defender');
                }
                break;
            case 'veggie_match3':
                if (score >= 50000) {
                    this.unlockBadge('match_master');
                }
                break;
            case 'seed_slinger':
                if (gameData.wave >= 15) {
                    this.unlockBadge('seed_slinger');
                }
                break;
            case 'farmers_market_tycoon':
                if (gameData.totalEarned >= 1000000) {
                    this.unlockBadge('market_tycoon');
                }
                break;
        }
    }
    
    // Merch Management
    checkMerchUnlocks() {
        const gamesPlayed = this.getGamesPlayed();
        const badgesUnlocked = this.getBadges().length;
        
        // Unlock merch based on games played
        if (gamesPlayed.includes('broc_lee_dojo')) {
            this.unlockMerch('broc_lee_shirt');
        }
        if (gamesPlayed.includes('rainbow_smoothie_lab')) {
            this.unlockMerch('rainbow_mug');
        }
        
        // Unlock merch based on badges
        if (badgesUnlocked >= 5) {
            this.unlockMerch('jungle_star_hoodie');
        }
        if (gamesPlayed.length >= 10) {
            this.unlockMerch('veggie_plushie');
        }
    }
    
    unlockMerch(merchId) {
        if (this.merchPromos[merchId] && !this.merchPromos[merchId].unlocked) {
            this.merchPromos[merchId].unlocked = true;
            this.merchPromos[merchId].unlockedAt = Date.now();
            this.saveMerchPromos();
            this.showMerchNotification(merchId);
            return true;
        }
        return false;
    }
    
    getUnlockedMerch() {
        return Object.values(this.merchPromos).filter(merch => merch.unlocked);
    }
    
    // Game Tracking
    trackGamePlayed(gameId) {
        let gamesPlayed = this.getGamesPlayed();
        if (!gamesPlayed.includes(gameId)) {
            gamesPlayed.push(gameId);
            localStorage.setItem('junglestar_games_played', JSON.stringify(gamesPlayed));
        }
    }
    
    getGamesPlayed() {
        const stored = localStorage.getItem('junglestar_games_played');
        return stored ? JSON.parse(stored) : [];
    }
    
    // Player Management
    setPlayerName(name) {
        this.playerName = name;
        localStorage.setItem('junglestar_player_name', name);
    }
    
    getPlayerName() {
        return this.playerName;
    }

    getPlayerData() {
        const badges = this.getBadges();
        const unlockedBadges = Object.values(badges).filter(badge => badge.unlocked);
        const merchItems = this.getUnlockedMerch();
        
        return {
            name: this.getPlayerName(),
            gamesPlayed: this.getGamesPlayed().length,
            badges: unlockedBadges.map(badge => badge.id),
            totalBadges: unlockedBadges.length,
            merchUnlocked: merchItems.map(item => item.id),
            highScores: this.getHighscores()
        };
    }

    getAllBadges() {
        return Object.values(this.badgeDefinitions);
    }

    getMerchItems() {
        return Object.values(this.merchPromos);
    }
    
    // Notification System
    showBadgeNotification(badgeId) {
        const badge = this.badgeDefinitions[badgeId];
        if (!badge) return;
        
        this.showNotification(
            `🏆 Badge Unlocked!`,
            `${badge.icon} ${badge.name}`,
            badge.description,
            'badge'
        );
    }
    
    showMerchNotification(merchId) {
        const merch = this.merchDefinitions[merchId];
        if (!merch) return;
        
        this.showNotification(
            `🛍️ New Merch Unlocked!`,
            `${merch.image} ${merch.name}`,
            `${merch.description} - ${merch.price}`,
            'merch'
        );
    }
    
    showNotification(title, subtitle, description, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `junglestar-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-subtitle">${subtitle}</div>
                <div class="notification-description">${description}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add styles if not already added
        if (!document.getElementById('junglestar-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'junglestar-notification-styles';
            styles.textContent = `
                .junglestar-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #4CAF50, #8BC34A);
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    max-width: 300px;
                    animation: slideInRight 0.5s ease-out;
                    font-family: 'Comic Sans MS', cursive, sans-serif;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }
                
                .junglestar-notification.badge {
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: black;
                }
                
                .junglestar-notification.merch {
                    background: linear-gradient(135deg, #9C27B0, #E91E63);
                }
                
                .notification-content {
                    margin-right: 30px;
                }
                
                .notification-title {
                    font-weight: bold;
                    font-size: 1.1em;
                    margin-bottom: 5px;
                }
                
                .notification-subtitle {
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                
                .notification-description {
                    font-size: 0.9em;
                    opacity: 0.9;
                }
                
                .notification-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 1.5em;
                    cursor: pointer;
                    opacity: 0.7;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.5s ease-out reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }
        }, 5000);
    }
    
    // UI Components
    createBadgeDisplay() {
        const container = document.createElement('div');
        container.className = 'junglestar-badge-display';
        
        const badges = this.getBadges();
        const progress = this.getBadgeProgress();
        
        container.innerHTML = `
            <h3>🏆 Badges (${progress.unlocked}/${progress.total})</h3>
            <div class="badge-grid">
                ${Object.values(this.badgeDefinitions).map(badge => `
                    <div class="badge-item ${badge.unlocked ? 'unlocked' : 'locked'}">
                        <div class="badge-icon">${badge.unlocked ? badge.icon : '🔒'}</div>
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-rarity ${badge.rarity}">${badge.rarity}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        return container;
    }
    
    createHighscoreDisplay(gameId = null) {
        const targetGameId = gameId || this.gameId;
        const scores = this.getHighscores(targetGameId);
        const personalBest = this.getPersonalBest(targetGameId);
        
        const container = document.createElement('div');
        container.className = 'junglestar-highscore-display';
        
        container.innerHTML = `
            <h3>🏆 High Scores</h3>
            <div class="personal-best">Your Best: ${personalBest.toLocaleString()}</div>
            <div class="highscore-list">
                ${scores.map((entry, index) => `
                    <div class="highscore-entry ${entry.playerName === this.playerName ? 'personal' : ''}">
                        <span class="rank">#${index + 1}</span>
                        <span class="name">${entry.playerName}</span>
                        <span class="score">${entry.score.toLocaleString()}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        return container;
    }
    
    createMerchDisplay() {
        const unlockedMerch = this.getUnlockedMerch();
        
        const container = document.createElement('div');
        container.className = 'junglestar-merch-display';
        
        container.innerHTML = `
            <h3>🛍️ Unlocked Merchandise</h3>
            <div class="merch-grid">
                ${unlockedMerch.map(merch => `
                    <div class="merch-item">
                        <div class="merch-image">${merch.image}</div>
                        <div class="merch-name">${merch.name}</div>
                        <div class="merch-price">${merch.price}</div>
                        <button class="merch-button" onclick="window.open('https://junglestar.games/shop', '_blank')">Buy Now</button>
                    </div>
                `).join('')}
            </div>
            ${unlockedMerch.length === 0 ? '<p>Play more games to unlock merchandise!</p>' : ''}
        `;
        
        return container;
    }
    
    // Storage Management
    loadHighscores() {
        const stored = localStorage.getItem('junglestar_highscores');
        return stored ? JSON.parse(stored) : {};
    }
    
    saveHighscores() {
        localStorage.setItem('junglestar_highscores', JSON.stringify(this.highscores));
    }
    
    loadBadges() {
        // Return empty object if badge definitions aren't ready
        if (!this.badgeDefinitions) {
            return {};
        }
        
        const stored = localStorage.getItem('junglestar_badges');
        let savedBadges = {};
        
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    savedBadges = parsed;
                }
            } catch (e) {
                console.log('Failed to load badges:', e);
            }
        }
        
        // Merge with badge definitions
        const badges = {};
        try {
            Object.keys(this.badgeDefinitions).forEach(badgeId => {
                badges[badgeId] = {
                    ...this.badgeDefinitions[badgeId],
                    ...(savedBadges[badgeId] || {})
                };
            });
        } catch (e) {
            console.log('Error merging badges:', e);
            return {};
        }
        
        return badges;
    }
    
    saveBadges() {
        localStorage.setItem('junglestar_badges', JSON.stringify(this.badges));
    }
    
    loadMerchPromos() {
        // Return empty object if merch definitions aren't ready
        if (!this.merchDefinitions) {
            return {};
        }
        
        const stored = localStorage.getItem('junglestar_merch');
        const savedMerch = stored ? JSON.parse(stored) : {};
        
        // Merge with merch definitions
        const merch = {};
        try {
            Object.keys(this.merchDefinitions).forEach(merchId => {
                merch[merchId] = {
                    ...this.merchDefinitions[merchId],
                    ...(savedMerch[merchId] || {})
                };
            });
        } catch (e) {
            console.log('Error merging merch:', e);
            return {};
        }
        
        return merch;
    }
    
    saveMerchPromos() {
        localStorage.setItem('junglestar_merch', JSON.stringify(this.merchPromos));
    }
    
    // Reset/Clear Data
    clearAllData() {
        localStorage.removeItem('junglestar_highscores');
        localStorage.removeItem('junglestar_badges');
        localStorage.removeItem('junglestar_merch');
        localStorage.removeItem('junglestar_games_played');
        localStorage.removeItem('junglestar_player_name');
        
        // Reload data
        this.highscores = {};
        this.badges = this.loadBadges();
        this.merchPromos = this.loadMerchPromos();
        this.playerName = 'Player';
    }
}

// Compatibility wrapper for games that still use the old method name
JungleStarSharedSystems.prototype.saveHighScore = function(gameId, score) {
    this.init(gameId);
    this.submitScore(score);
};

// Global class available for instantiation
window.JungleStarSharedSystems = JungleStarSharedSystems;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JungleStarSharedSystems;
}