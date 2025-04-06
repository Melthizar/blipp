// Game rendering system
const Renderer = (() => {
    // Canvas and context
    let canvas;
    let ctx;
    
    // Visual effects state
    let backgroundStars = [];
    let midgroundStars = [];
    let particleEffects = [];
    let timeOfDay = 0; // 0-1000 cycle for day/night
    let cycleDirection = 1; // 1 = getting lighter, -1 = getting darker
    
    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = World.GRID_WIDTH * World.TILE_SIZE;
        canvas.height = World.GRID_HEIGHT * World.TILE_SIZE;
        
        // Initialize star layers for parallax effect
        initStars();
    }
    
    function initStars() {
        // Background stars (slow moving)
        for (let i = 0; i < 75; i++) {
            backgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: (Math.random() * 2) + 1,
                brightness: Math.random() * 0.5 + 0.5,
                speed: 0.2 + Math.random() * 0.1
            });
        }
        
        // Midground stars (medium speed)
        for (let i = 0; i < 50; i++) {
            midgroundStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: (Math.random() * 1.5) + 0.5,
                brightness: Math.random() * 0.5 + 0.5,
                speed: 0.5 + Math.random() * 0.2
            });
        }
    }
    
    function render() {
        // Update time of day
        updateTimeOfDay();
        
        // Clear canvas with gradient sky
        drawSky();
        
        // Draw background with parallax stars
        drawParallaxBackground();
        
        // Draw the world
        drawWorld();
        
        // Update and draw particles
        updateParticles();
        
        // Draw the robot
        drawRobot();
    }
    
    function updateTimeOfDay() {
        timeOfDay += cycleDirection * 0.2;
        if (timeOfDay > 1000) {
            timeOfDay = 1000;
            cycleDirection = -1;
        } else if (timeOfDay < 0) {
            timeOfDay = 0;
            cycleDirection = 1;
        }
    }
    
    function drawSky() {
        // Create a gradient based on time of day
        let skyBrightness = 0.2 + (timeOfDay / 1000) * 0.3;
        
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `rgba(0, 0, ${Math.floor(80 * skyBrightness)}, 1)`);
        gradient.addColorStop(1, `rgba(0, 0, ${Math.floor(40 * skyBrightness)}, 1)`);
        
        // Fill background with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawParallaxBackground() {
        // Draw background stars (slowest parallax layer)
        ctx.fillStyle = '#fff';
        for (let star of backgroundStars) {
            // Move stars based on world offset at slow speed
            star.x -= star.speed * (World.worldOffset - Math.floor(World.worldOffset)) / World.TILE_SIZE;
            
            // Wrap stars around when they go off screen
            if (star.x < 0) star.x = canvas.width;
            if (star.x > canvas.width) star.x = 0;
            
            // Draw star with varying opacity based on time of day
            ctx.globalAlpha = star.brightness * (0.7 + (timeOfDay / 1000) * 0.3);
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        
        // Draw midground stars (medium parallax layer)
        for (let star of midgroundStars) {
            // Move stars based on world offset at medium speed
            star.x -= star.speed * (World.worldOffset - Math.floor(World.worldOffset)) / World.TILE_SIZE;
            
            // Wrap stars around when they go off screen
            if (star.x < 0) star.x = canvas.width;
            if (star.x > canvas.width) star.x = 0;
            
            // Draw star with twinkle effect
            let twinkle = Math.sin(Date.now() * 0.003 + star.x + star.y) * 0.2 + 0.8;
            ctx.globalAlpha = star.brightness * twinkle * (0.6 + (timeOfDay / 1000) * 0.4);
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        
        // Reset global alpha for the rest of the rendering
        ctx.globalAlpha = 1.0;
    }
    
    function drawWorld() {
        // Draw a distant mountain silhouette that moves slower than the world
        drawDistantMountains();
        
        for (let x = 0; x < World.GRID_WIDTH + 1; x++) {
            for (let y = 0; y < World.GRID_HEIGHT; y++) {
                let worldX = Math.floor(World.worldOffset / World.TILE_SIZE) + x;
                
                if (worldX >= 0 && worldX < World.gameWorld.length) {
                    let tile = World.getTile(worldX, y);
                    if (!tile) continue;
                    
                    let drawX = x * World.TILE_SIZE - (World.worldOffset % World.TILE_SIZE);
                    
                    if (tile.type === 'ground') {
                        // Enhanced ground tile with texture
                        let groundNoise = (Math.sin(worldX * 0.7) + Math.cos(y * 0.8)) * 15;
                        let colorValue = 85 + Math.floor(groundNoise);
                        let colorBrightness = Math.min(255, Math.max(0, colorValue));
                        
                        // Main ground color with variation
                        ctx.fillStyle = `rgb(${colorBrightness - 30}, ${colorBrightness - 20}, ${colorBrightness - 40})`;
                        ctx.fillRect(drawX, y * World.TILE_SIZE, World.TILE_SIZE, World.TILE_SIZE);
                        
                        // Top edge of ground with variation
                        ctx.fillStyle = `rgb(${colorBrightness}, ${colorBrightness}, ${colorBrightness - 20})`;
                        ctx.fillRect(drawX, y * World.TILE_SIZE, World.TILE_SIZE, 4);
                        
                        // Item indicator with glow effect
                        if (tile.hasItem) {
                            // Outer glow
                            const glowTime = Date.now() * 0.003;
                            const glowSize = 4 + Math.sin(glowTime) * 1.5;
                            
                            ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
                            ctx.beginPath();
                            ctx.arc(
                                drawX + World.TILE_SIZE / 2, 
                                y * World.TILE_SIZE + World.TILE_SIZE / 2, 
                                glowSize, 0, Math.PI * 2
                            );
                            ctx.fill();
                            
                            // Item sparkle
                            ctx.fillStyle = '#ff8';
                            ctx.fillRect(
                                drawX + World.TILE_SIZE / 2 - 1, 
                                y * World.TILE_SIZE + World.TILE_SIZE / 2 - 1, 3, 3
                            );
                            
                            // Occasional sparkle particles
                            if (Math.random() < 0.03) {
                                addParticleEffect(
                                    drawX + World.TILE_SIZE / 2,
                                    y * World.TILE_SIZE + World.TILE_SIZE / 2,
                                    { 
                                        count: 1, 
                                        type: 'sparkle', 
                                        color: '#ffa', 
                                        speedMultiplier: 0.3,
                                        lifeMultiplier: 0.8
                                    }
                                );
                            }
                        }
                    } else if (tile.type === 'bedrock') {
                        // Enhanced bedrock tile with texture
                        ctx.fillStyle = '#333';
                        ctx.fillRect(drawX, y * World.TILE_SIZE, World.TILE_SIZE, World.TILE_SIZE);
                        
                        // Random texture pattern based on position
                        ctx.fillStyle = '#222';
                        const seed = worldX * 100 + y * 10;
                        
                        for (let i = 0; i < 5; i++) {
                            const pattern = Math.sin(seed + i * 10) + Math.cos(seed + i * 20);
                            const dotX = drawX + ((pattern * 10) % World.TILE_SIZE);
                            const dotY = y * World.TILE_SIZE + ((pattern * 15) % World.TILE_SIZE);
                            
                            const dotSize = 2 + Math.abs(Math.sin(seed + i * 30)) * 3;
                            ctx.fillRect(dotX, dotY, dotSize, dotSize);
                        }
                    }
                }
            }
        }
    }
    
    function drawDistantMountains() {
        // Draw distant mountains that move at 1/4 the speed of the world
        const mountainOffset = World.worldOffset / 4;
        
        // Create a gradient for mountains
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height * 0.7);
        gradient.addColorStop(0, '#224');
        gradient.addColorStop(1, '#112');
        ctx.fillStyle = gradient;
        
        // Begin the mountain path
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.7);
        
        // Generate mountain silhouette
        for (let x = 0; x <= canvas.width; x += 20) {
            const noise = Math.sin(x * 0.01 + mountainOffset * 0.01) * 30 + 
                        Math.sin(x * 0.02 + mountainOffset * 0.01) * 20 +
                        Math.sin(x * 0.04 + mountainOffset * 0.02) * 10;
                        
            const y = canvas.height * 0.7 - noise;
            ctx.lineTo(x, y);
        }
        
        // Close the path at the bottom of the screen
        ctx.lineTo(canvas.width, canvas.height * 0.7);
        ctx.lineTo(0, canvas.height * 0.7);
        ctx.fill();
    }
    
    function drawRobot() {
        const robot = Robot.state;
        
        // Add walking animation and visual improvements
        const walkCycle = Math.sin(Date.now() * 0.01) * 2;
        const isMoving = Math.abs(robot.vx) > 0.1;
        const legOffset = isMoving ? walkCycle : 0;
        
        if (robot.isDigging) {
            // Draw digging animation with improved visuals
            let digX = robot.digX * World.TILE_SIZE - World.worldOffset;
            let digY = robot.digY * World.TILE_SIZE;
            let robotX, robotY;
            
            // Position robot based on dig direction
            if (robot.digDirection === -1) {
                robotX = digX + World.TILE_SIZE + 4;
                robotY = digY - robot.height + 8;
            } else if (robot.digDirection === 1) {
                robotX = digX - robot.width - 4;
                robotY = digY - robot.height + 8;
            } else if (robot.digDirection === 2) {
                robotX = digX - 4;
                robotY = digY - robot.height;
            } else if (robot.digDirection === 3) {
                robotX = digX - 4;
                robotY = digY + World.TILE_SIZE;
            }
            
            // Create a wobble effect for digging
            const digWobble = Math.sin(Date.now() * 0.01) * 1.5;
            
            // Robot body with metallic gradient
            const bodyGradient = ctx.createLinearGradient(
                robotX, robotY, 
                robotX, robotY + robot.height - 8
            );
            bodyGradient.addColorStop(0, '#999');
            bodyGradient.addColorStop(0.5, '#777');
            bodyGradient.addColorStop(1, '#555');
            
            ctx.fillStyle = bodyGradient;
            ctx.fillRect(
                robotX + digWobble, 
                robotY, 
                robot.width, 
                robot.height - 8
            );
            
            // Robot head with metallic look
            const headGradient = ctx.createLinearGradient(
                robotX + 2, robotY - 6,
                robotX + 2, robotY + 2
            );
            headGradient.addColorStop(0, '#bbb');
            headGradient.addColorStop(1, '#999');
            
            ctx.fillStyle = headGradient;
            ctx.fillRect(
                robotX + 2 + digWobble, 
                robotY - 6, 
                robot.width - 4, 
                8
            );
            
            // Robot eyes with glow effect
            ctx.fillStyle = '#0ff';
            if (robot.direction > 0) {
                // Add glow effect
                ctx.shadowColor = '#0ff';
                ctx.shadowBlur = 5;
                
                ctx.fillRect(robotX + robot.width - 7 + digWobble, robotY - 4, 2, 4);
                ctx.fillRect(robotX + robot.width - 12 + digWobble, robotY - 4, 2, 4);
                
                // Reset shadow
                ctx.shadowBlur = 0;
            } else {
                // Add glow effect
                ctx.shadowColor = '#0ff';
                ctx.shadowBlur = 5;
                
                ctx.fillRect(robotX + 5 + digWobble, robotY - 4, 2, 4);
                ctx.fillRect(robotX + 10 + digWobble, robotY - 4, 2, 4);
                
                // Reset shadow
                ctx.shadowBlur = 0;
            }
            
            // Robot arm extended for digging with animation
            const digAnimOffset = Math.sin(robot.digProgress * 0.2) * 3;
            ctx.fillStyle = '#666';
            
            if (robot.digDirection === -1) {
                // Arm extended left with animation
                ctx.fillRect(robotX - 12 - digAnimOffset, robotY + 8, 12 + digAnimOffset, 4);
            } else if (robot.digDirection === 1) {
                // Arm extended right with animation
                ctx.fillRect(robotX + robot.width, robotY + 8, 12 + digAnimOffset, 4);
            } else if (robot.digDirection === 2) {
                // Arms down for digging below
                ctx.fillRect(robotX + 4, robotY + robot.height - 6, 4, 12 + digAnimOffset);
                ctx.fillRect(robotX + robot.width - 8, robotY + robot.height - 6, 4, 12 + digAnimOffset);
            } else if (robot.digDirection === 3) {
                // Arms up for digging above
                ctx.fillRect(robotX + 4, robotY - 10 - digAnimOffset, 4, 12 + digAnimOffset);
                ctx.fillRect(robotX + robot.width - 8, robotY - 10 - digAnimOffset, 4, 12 + digAnimOffset);
            }
            
            // Enhanced digging effect with more particles
            for (let i = 0; i < 3; i++) {
                let particleX, particleY;
                
                if (robot.digDirection === -1) {
                    particleX = digX + World.TILE_SIZE/2 + (Math.sin(robot.digProgress * 0.2 + i) * 8);
                    particleY = digY + World.TILE_SIZE/2 + (Math.cos(robot.digProgress * 0.3 + i) * 8);
                } else if (robot.digDirection === 1) {
                    particleX = digX + World.TILE_SIZE/2 - (Math.sin(robot.digProgress * 0.2 + i) * 8);
                    particleY = digY + World.TILE_SIZE/2 + (Math.cos(robot.digProgress * 0.3 + i) * 8);
                } else if (robot.digDirection === 2) {
                    particleX = digX + World.TILE_SIZE/2 + (Math.sin(robot.digProgress * 0.2 + i) * 10);
                    particleY = digY + (Math.cos(robot.digProgress * 0.3 + i) * 6);
                } else if (robot.digDirection === 3) {
                    particleX = digX + World.TILE_SIZE/2 + (Math.sin(robot.digProgress * 0.2 + i) * 10);
                    particleY = digY + World.TILE_SIZE - (Math.cos(robot.digProgress * 0.3 + i) * 6);
                }
                
                // Generate dust particles
                if (Math.random() < 0.2) {
                    addParticleEffect(
                        particleX, particleY, 
                        { 
                            count: 1,
                            color: '#a96',
                            size: 2 + Math.random() * 2,
                            gravity: true,
                            speedMultiplier: 0.7
                        }
                    );
                }
                
                // Draw particle
                ctx.fillStyle = '#a96';
                const particleSize = 2 + Math.random() * 2;
                ctx.fillRect(particleX, particleY, particleSize, particleSize);
            }
            
            // Digging progress indicator with gradient
            const progressGradient = ctx.createLinearGradient(
                robotX, robotY - 12, 
                robotX + World.TILE_SIZE, robotY - 12
            );
            progressGradient.addColorStop(0, '#0a8');
            progressGradient.addColorStop(0.5, '#0f8');
            progressGradient.addColorStop(1, '#0a8');
            
            ctx.fillStyle = progressGradient;
            ctx.fillRect(robotX, robotY - 12, (robot.digProgress / 60) * World.TILE_SIZE, 3);
        } else {
            // Regular robot drawing with enhancements
            
            // Robot shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(
                robot.x + robot.width/2, 
                robot.y + robot.height - 2,
                robot.width/2, 4, 0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Robot body with metallic gradient
            const bodyGradient = ctx.createLinearGradient(
                robot.x, robot.y, 
                robot.x, robot.y + robot.height
            );
            bodyGradient.addColorStop(0, '#999');
            bodyGradient.addColorStop(0.5, '#777');
            bodyGradient.addColorStop(1, '#555');
            
            ctx.fillStyle = bodyGradient;
            ctx.fillRect(robot.x, robot.y, robot.width, robot.height);
            
            // Add details to body
            ctx.fillStyle = '#666';
            ctx.fillRect(robot.x + 6, robot.y + 5, robot.width - 12, 2);
            ctx.fillRect(robot.x + 6, robot.y + 10, robot.width - 12, 2);
            ctx.fillRect(robot.x + 6, robot.y + 15, robot.width - 12, 2);
            
            // Robot head with metallic look
            const headGradient = ctx.createLinearGradient(
                robot.x + 2, robot.y - 6,
                robot.x + 2, robot.y + 2
            );
            headGradient.addColorStop(0, '#bbb');
            headGradient.addColorStop(1, '#999');
            
            ctx.fillStyle = headGradient;
            ctx.fillRect(robot.x + 2, robot.y - 6, robot.width - 4, 8);
            
            // Robot eyes with glow
            ctx.fillStyle = '#0ff';
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = 5;
            
            if (robot.direction > 0) {
                ctx.fillRect(robot.x + robot.width - 7, robot.y - 4, 2, 4);
                ctx.fillRect(robot.x + robot.width - 12, robot.y - 4, 2, 4);
            } else {
                ctx.fillRect(robot.x + 5, robot.y - 4, 2, 4);
                ctx.fillRect(robot.x + 10, robot.y - 4, 2, 4);
            }
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
            // Robot legs with animation
            ctx.fillStyle = '#666';
            
            // Left leg with walking animation
            ctx.fillRect(
                robot.x + 4, 
                robot.y + robot.height - 6 + (isMoving ? Math.abs(legOffset) : 0), 
                4, 
                8 - (isMoving ? Math.abs(legOffset) : 0)
            );
            
            // Right leg with opposite phase
            ctx.fillRect(
                robot.x + robot.width - 8, 
                robot.y + robot.height - 6 + (isMoving ? Math.abs(-legOffset) : 0), 
                4, 
                8 - (isMoving ? Math.abs(-legOffset) : 0)
            );
            
            // Add dust effect when moving on ground
            if (isMoving && robot.isGrounded && Math.random() < 0.1) {
                const dustX = robot.direction > 0 ? 
                    robot.x : robot.x + robot.width;
                
                addParticleEffect(
                    dustX,
                    robot.y + robot.height - 2,
                    {
                        count: 1,
                        color: 'rgba(200, 200, 180, 0.5)',
                        size: 2,
                        speedMultiplier: 0.3,
                        gravity: false
                    }
                );
            }
            
            // Add occasional light effect in eyes
            if (Math.random() < 0.03) {
                const eyeX = robot.direction > 0 ? 
                    robot.x + robot.width - 10 : robot.x + 7;
                
                addParticleEffect(
                    eyeX, robot.y - 2,
                    {
                        count: 1,
                        type: 'sparkle',
                        color: '#aff',
                        size: 1,
                        speedMultiplier: 0.1
                    }
                );
            }
        }
    }
    
    function updateParticles() {
        // Update existing particles
        for (let i = particleEffects.length - 1; i >= 0; i--) {
            const particle = particleEffects[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Apply gravity or other forces
            if (particle.gravity) {
                particle.vy += 0.1;
            }
            
            // Fade out
            particle.life -= particle.fadeSpeed;
            
            // Remove dead particles
            if (particle.life <= 0) {
                particleEffects.splice(i, 1);
                continue;
            }
            
            // Draw the particle
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            
            if (particle.type === 'sparkle') {
                // Draw sparkle as a small star shape
                const size = particle.size * particle.life;
                drawStar(particle.x, particle.y, size);
            } else {
                // Regular particle as rectangle
                ctx.fillRect(particle.x, particle.y, 
                    particle.size * particle.life, 
                    particle.size * particle.life);
            }
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    function drawStar(x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        
        for (let i = 0; i < 5; i++) {
            ctx.rotate(Math.PI / 5);
            ctx.lineTo(0, size);
            ctx.rotate(Math.PI / 5);
            ctx.lineTo(0, size / 2);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    // Add particle effects at a position with options
    function addParticleEffect(x, y, options = {}) {
        const particleCount = options.count || 5;
        const type = options.type || 'regular';
        const color = options.color || '#fff';
        const size = options.size || 3;
        const speedMultiplier = options.speedMultiplier || 1;
        const lifeMultiplier = options.lifeMultiplier || 1;
        
        for (let i = 0; i < particleCount; i++) {
            // Create particle with random velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 1.5 + 0.5) * speedMultiplier;
            
            particleEffects.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * size + 1,
                color: color,
                life: Math.random() * 0.5 + 0.5 * lifeMultiplier,
                fadeSpeed: 0.01 + Math.random() * 0.01,
                gravity: options.gravity || false,
                type: type
            });
        }
    }
    
    // Public API
    return {
        init,
        render,
        addParticleEffect,
        get canvas() { return canvas; }
    };
})();