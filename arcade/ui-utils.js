/**
 * UI Utilities for Jungle Star Games
 * Handles responsive scaling, navigation, and universal UI components
 */

// Constants
const ARCADE_HUB = 'index.html'; // Fallback to index.html since arcade.html doesn't exist
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

class UIUtils {
    constructor() {
        this.gameRoot = null;
        this.currentScale = 1;
        this.isDebugMode = new URLSearchParams(location.search).has('debug');
        
        this.init();
    }
    
    init() {
        // Enable debug mode if URL parameter is present
        if (this.isDebugMode) {
            document.body.classList.add('debug-enabled');
        }
        
        // Create back button
        this.createBackButton();
        
        // Setup keyboard handlers
        this.setupKeyboardHandlers();
        
        // Setup responsive scaling
        this.setupResponsiveScaling();
        
        // Setup resize handlers
        this.setupResizeHandlers();
    }
    
    createBackButton() {
        const backBtn = document.createElement('button');
        backBtn.className = 'back-btn';
        backBtn.innerHTML = '← Arcade';
        backBtn.title = 'Back to Arcade (ESC)';
        backBtn.setAttribute('aria-label', 'Back to Arcade');
        
        backBtn.addEventListener('click', this.goToArcade);
        
        document.body.appendChild(backBtn);
    }
    
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Escape':
                    e.preventDefault();
                    this.goToArcade();
                    break;
                case 'Enter':
                case 'Space':
                    // Activate focused button
                    const focused = document.activeElement;
                    if (focused && (focused.tagName === 'BUTTON' || focused.classList.contains('btn'))) {
                        e.preventDefault();
                        focused.click();
                    }
                    break;
            }
        });
    }
    
    setupResponsiveScaling() {
        // Find or create game root
        this.gameRoot = document.querySelector('.game-root');
        if (!this.gameRoot) {
            // Wrap existing content in game-root
            const gameContainer = document.querySelector('.game-container') || document.body;
            this.gameRoot = document.createElement('div');
            this.gameRoot.className = 'game-root';
            
            // Move all children to game root
            while (gameContainer.firstChild) {
                this.gameRoot.appendChild(gameContainer.firstChild);
            }
            
            gameContainer.appendChild(this.gameRoot);
        }
        
        this.updateScale();
    }
    
    setupResizeHandlers() {
        const updateScale = () => this.updateScale();
        
        window.addEventListener('resize', updateScale);
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(updateScale, 100);
        });
        
        // Initial scale update
        setTimeout(updateScale, 100);
    }
    
    updateScale() {
        if (!this.gameRoot) return;
        
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        // Calculate scale to fit viewport while maintaining aspect ratio
        const scaleX = vw / BASE_WIDTH;
        const scaleY = vh / BASE_HEIGHT;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
        
        this.currentScale = scale;
        
        // Apply transform
        this.gameRoot.style.transform = `scale(${scale})`;
        
        // Center the scaled content
        const scaledWidth = BASE_WIDTH * scale;
        const scaledHeight = BASE_HEIGHT * scale;
        
        this.gameRoot.style.left = `${(vw - scaledWidth) / 2}px`;
        this.gameRoot.style.top = `${(vh - scaledHeight) / 2}px`;
        
        // Update CSS custom properties for responsive calculations
        document.documentElement.style.setProperty('--ui-scale', scale);
        document.documentElement.style.setProperty('--viewport-width', `${vw}px`);
        document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
    }
    
    goToArcade() {
        // Check if arcade.html exists, fallback to index.html
        fetch('arcade.html', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    window.location.href = 'arcade.html';
                } else {
                    window.location.href = ARCADE_HUB;
                }
            })
            .catch(() => {
                window.location.href = ARCADE_HUB;
            });
    }
    
    // Utility methods for games
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    // Safe area utilities
    getSafeAreaInsets() {
        const style = getComputedStyle(document.documentElement);
        return {
            top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
            right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
            bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
            left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
        };
    }
    
    // Viewport utilities
    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            scale: this.currentScale
        };
    }
    
    // Focus management
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
        
        // Focus first element
        firstElement.focus();
    }
    
    // Debug utilities
    log(...args) {
        if (this.isDebugMode) {
            console.log('[UI-Utils]', ...args);
        }
    }
    
    // Performance monitoring
    measurePerformance(name, fn) {
        if (!this.isDebugMode) {
            return fn();
        }
        
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.uiUtils = new UIUtils();
    });
} else {
    window.uiUtils = new UIUtils();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIUtils;
}