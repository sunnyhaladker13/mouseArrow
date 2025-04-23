document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('arrow-container');
    const cursorGlow = document.getElementById('cursor-glow');
    let arrows = [];
    let lastPointerX = window.innerWidth / 2;
    let lastPointerY = window.innerHeight / 2;
    let targetX = lastPointerX;
    let targetY = lastPointerY;
    let animationFrameId = null;
    let isTouchDevice = false;
    
    function generateArrows() {
        // Clear existing arrows and animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        container.innerHTML = '';
        arrows = [];
        
        // Get container dimensions
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        
        // Bigger arrow size while maintaining high density
        const arrowSize = window.innerWidth <= 768 ? 8 : 12;
        const spacing = arrowSize * 1.5; // Adjusted spacing for bigger arrows
        
        const columns = Math.floor(containerWidth / spacing);
        const rows = Math.floor(containerHeight / spacing);
        
        // Adjusted maximum arrows for bigger size (balance between density and performance)
        const maxArrows = window.innerWidth <= 768 ? 800 : 3000;
        const totalPossibleArrows = rows * columns;
        
        // Calculate how many arrows to skip to achieve desired density
        let skipFactor = Math.max(1, Math.floor(totalPossibleArrows / maxArrows));
        
        // Create fragment for better performance
        const fragment = document.createDocumentFragment();
        let arrowCount = 0;
        
        // Generate arrows in a grid pattern
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                // Use skip factor to limit total number
                if ((row * columns + col) % skipFactor !== 0) continue;
                
                const x = col * spacing + spacing / 2;
                const y = row * spacing + spacing / 2;
                
                const arrow = document.createElement('div');
                arrow.className = 'arrow';
                arrow.style.left = `${x}px`;
                arrow.style.top = `${y}px`;
                arrow.dataset.x = x;
                arrow.dataset.y = y;
                
                fragment.appendChild(arrow);
                arrows.push(arrow);
                arrowCount++;
            }
        }
        
        // Append all arrows at once
        container.appendChild(fragment);
        console.log(`Created ${arrowCount} arrows`);
        
        // Initialize arrow positions to point toward center
        updateArrows(containerWidth / 2, containerHeight / 2);
        
        // Start the smooth animation loop
        startSmoothAnimationLoop();
    }
    
    function startSmoothAnimationLoop() {
        const smoothFactor = 0.15; // Balance between smoothness and responsiveness
        
        function updateLoop() {
            // Smooth movement toward target
            lastPointerX = lastPointerX + (targetX - lastPointerX) * smoothFactor;
            lastPointerY = lastPointerY + (targetY - lastPointerY) * smoothFactor;
            
            // Update arrow rotations
            updateArrows(lastPointerX, lastPointerY);
            
            // Continue animation
            animationFrameId = requestAnimationFrame(updateLoop);
        }
        
        // Start the loop
        animationFrameId = requestAnimationFrame(updateLoop);
    }
    
    function updateArrows(x, y) {
        // Update cursor glow position
        if (!isTouchDevice) {
            cursorGlow.style.left = `${x}px`;
            cursorGlow.style.top = `${y}px`;
        }
        
        // Update all arrows - process in smaller batches
        const batchSize = Math.min(200, Math.floor(arrows.length / 10));
        
        for (let i = 0; i < arrows.length; i += batchSize) {
            const endIdx = Math.min(i + batchSize, arrows.length);
            
            // Use setTimeout for non-blocking updates
            setTimeout(() => {
                for (let j = i; j < endIdx; j++) {
                    const arrow = arrows[j];
                    const arrowX = parseFloat(arrow.dataset.x);
                    const arrowY = parseFloat(arrow.dataset.y);
                    
                    // Calculate angle between arrow and pointer
                    const dx = x - arrowX;
                    const dy = y - arrowY;
                    
                    // Material Design arrow angle calculation (135° offset)
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 135;
                    
                    // Apply rotation
                    arrow.style.transform = `rotate(${angle}deg)`;
                }
            }, 0);
        }
    }
    
    // Handle mouse movement
    container.addEventListener('mousemove', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        cursorGlow.style.opacity = '1';
        isTouchDevice = false;
    });
    
    // Handle touch events
    container.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (event.touches.length > 0) {
            isTouchDevice = true;
            const touch = event.touches[0];
            targetX = touch.clientX;
            targetY = touch.clientY;
            
            cursorGlow.style.left = `${touch.clientX}px`;
            cursorGlow.style.top = `${touch.clientY}px`;
            cursorGlow.style.opacity = '1';
        }
    });
    
    container.addEventListener('touchmove', (event) => {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            targetX = touch.clientX;
            targetY = touch.clientY;
            
            cursorGlow.style.left = `${touch.clientX}px`;
            cursorGlow.style.top = `${touch.clientY}px`;
        }
    });
    
    // Handle resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(generateArrows, 300);
    });
    
    // Initial setup
    generateArrows();
    
    // Hide glow initially on mobile
    if ('ontouchstart' in window) {
        isTouchDevice = true;
        cursorGlow.style.opacity = '0';
    }
});
