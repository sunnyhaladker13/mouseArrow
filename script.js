// High-performance arrow interaction that fills the entire viewport
(function() {
    // Configuration
    const config = {
        // Number of arrows (columns and rows)
        columns: 20,
        rows: 15,
        // Arrow visual properties
        arrowSize: 16,
        arrowMargin: 6, // Space between arrows
        // Performance settings
        fps: 60,
        animationThrottle: 5
    };
    
    // Calculate total arrows based on rows and columns
    const totalArrows = config.columns * config.rows;
    
    // Core DOM elements
    let arrowContainer;
    let cursorGlow;
    
    // Performance optimization variables
    let lastFrame = 0;
    const frameDelay = 1000 / config.fps;
    let documentHidden = false;
    let rafId = null;
    
    // Mouse/touch tracking
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let isMoving = false;
    let movingTimeout;
    
    // Arrow storage - pre-allocate for better performance
    const arrows = [];
    
    // Initialize the grid of arrows
    function createArrowGrid() {
        // Calculate spacing for a grid that fills viewport
        const spacingX = window.innerWidth / (config.columns + 1);
        const spacingY = window.innerHeight / (config.rows + 1);
        
        // Use document fragment for batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Create grid of arrows
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.columns; col++) {
                // Calculate position for this arrow
                const x = (col + 1) * spacingX;
                const y = (row + 1) * spacingY;
                
                // Create arrow element
                const arrowElement = document.createElement('div');
                arrowElement.className = 'arrow';
                
                // Store arrow data with its position
                const arrow = {
                    element: arrowElement,
                    x: x,
                    y: y,
                    angle: 0
                };
                
                // Set initial position
                arrowElement.style.cssText = `
                    left: ${x}px;
                    top: ${y}px;
                    width: ${config.arrowSize}px;
                    height: ${config.arrowSize}px;
                `;
                
                // Add to collection and to fragment
                arrows.push(arrow);
                fragment.appendChild(arrowElement);
            }
        }
        
        // Append all arrows at once for better performance
        arrowContainer.appendChild(fragment);
    }
    
    // Initialize as early as possible
    function initialize() {
        // Get DOM elements
        arrowContainer = document.getElementById('arrow-container');
        cursorGlow = document.getElementById('cursor-glow');
        
        if (!arrowContainer || !cursorGlow) {
            // DOM not ready yet, try again very soon
            requestAnimationFrame(initialize);
            return;
        }
        
        // Create the grid of arrows
        createArrowGrid();
        
        // Setup event listeners with passive flag for better performance
        document.addEventListener('mousemove', updatePointerPosition, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchstart', handleTouchMove, { passive: true });
        
        // Handle window resize - recreate grid when window size changes
        window.addEventListener('resize', handleResize, { passive: true });
        
        // Handle visibility changes to save performance when tab is not visible
        document.addEventListener('visibilitychange', () => {
            documentHidden = document.hidden;
            if (!documentHidden && !rafId) {
                rafId = requestAnimationFrame(animate);
            }
        });
        
        // Position cursor at initial position
        updateCursorGlowPosition(pointerX, pointerY);
        
        // Start animation loop
        rafId = requestAnimationFrame(animate);
    }
    
    // Handle window resize
    function handleResize() {
        // Clear existing arrows
        while (arrowContainer.firstChild) {
            arrowContainer.removeChild(arrowContainer.firstChild);
        }
        arrows.length = 0;
        
        // Create new grid
        createArrowGrid();
    }
    
    // Handle touch events
    function handleTouchMove(e) {
        if (e.touches && e.touches[0]) {
            // Using passive event listeners so no preventDefault needed
            updatePointerPosition({
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY
            });
        }
    }
    
    // Update cursor glow position (separate for performance)
    function updateCursorGlowPosition(x, y) {
        // Use hardware acceleration for smooth animation
        cursorGlow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    
    // Track pointer (mouse/touch) position with throttling
    const updatePointerPosition = (function() {
        let lastExecution = 0;

        return function(e) {
            const now = performance.now();
            if (now - lastExecution < config.animationThrottle) return;
            lastExecution = now;
            
            pointerX = e.clientX;
            pointerY = e.clientY;
            
            // Update cursor glow immediately for responsive feel
            updateCursorGlowPosition(pointerX, pointerY);
            
            // Mark as moving for animation logic
            clearTimeout(movingTimeout);
            isMoving = true;
            movingTimeout = setTimeout(() => {
                isMoving = false;
            }, 100);
        };
    })();
    
    // Calculate angle between two points in degrees
    function calculateAngle(arrowX, arrowY, targetX, targetY) {
        return Math.atan2(targetY - arrowY, targetX - arrowX) * (180 / Math.PI);
    }
    
    // Animation loop with performance optimizations
    function animate(timestamp) {
        // Skip animation when document is not visible
        if (documentHidden) {
            rafId = null;
            return;
        }
        
        // Throttle to target framerate
        if (timestamp - lastFrame < frameDelay) {
            rafId = requestAnimationFrame(animate);
            return;
        }
        lastFrame = timestamp;
        
        // Update all arrows to point to current pointer position
        for (let i = 0; i < arrows.length; i++) {
            const arrow = arrows[i];
            
            // Calculate angle from arrow to pointer
            const angle = calculateAngle(arrow.x, arrow.y, pointerX, pointerY);
            
            // Only update DOM if angle has changed significantly (optimization)
            if (Math.abs(angle - arrow.angle) > 0.5) {
                arrow.angle = angle;
                
                // Use transform for better performance
                arrow.element.style.transform = `translate3d(-50%, -50%, 0) rotate(${angle}deg)`;
            }
        }
        
        // Continue animation loop
        rafId = requestAnimationFrame(animate);
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    function cleanup() {
        if (rafId) {
            cancelAnimationFrame(rafId);
        }
        
        document.removeEventListener('mousemove', updatePointerPosition);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchstart', handleTouchMove);
        window.removeEventListener('resize', handleResize);
    }
})();
