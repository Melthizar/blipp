// Game rendering system
const Renderer = (() => {
    // Canvas and context
    let canvas;
    let ctx;
    
    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = World.GRID_WIDTH * World.TILE_SIZE;
        canvas.height = World.GRID_HEIGHT * World.TILE_SIZE;
    }
    
    function render() {
        // Clear canvas
        ctx.fillStyle = '#004';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background stars
        drawStars();
        
        // Draw the world
        drawWorld();
        
        // Draw the robot
        drawRobot();
    }
    
    function drawStars() {
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 100; i++) {
            let starX = (i * 19) % canvas.width;
            let starY = (i * 17) % canvas.height;
            let starSize = (i % 3) + 1;
            ctx.fillRect(starX, starY, starSize, starSize);
        }
    }
    
    function drawWorld() {
        for (let x = 0; x < World.GRID_WIDTH + 1; x++) {
            for (let y = 0; y < World.GRID_HEIGHT; y++) {
                let worldX = Math.floor(World.worldOffset / World.TILE_SIZE) + x;
                
                if (worldX >= 0 && worldX < World.gameWorld.length) {
                    let tile = World.getTile(worldX, y);
                    if (!tile) continue;
                    
                    let drawX = x * World.TILE_SIZE - (World.worldOffset % World.TILE_SIZE);
                    
                    if (tile.type === 'ground') {
                        // Ground tile
                        ctx.fillStyle = '#553';
                        ctx.fillRect(drawX, y * World.TILE_SIZE, World.TILE_SIZE, World.TILE_SIZE);
                        
                        // Top edge of ground
                        ctx.fillStyle = '#774';
                        ctx.fillRect(drawX, y * World.TILE_SIZE, World.TILE_SIZE, 4);
                        
                        // Item indicator
                        if (tile.hasItem) {
                            ctx.fillStyle = '#ff8';
                            ctx.fillRect(drawX + World.TILE_SIZE / 2 - 1, y * World.TILE_SIZE + World.TILE_SIZE / 2 - 1, 3, 3);
                        }
                    } else if (tile.type === 'bedrock') {
                        // Bedrock tile
                        ctx.fillStyle = '#333';
                        ctx.fillRect(drawX, y * World.TILE_SIZE, World.TILE_SIZE, World.TILE_SIZE);
                        
                        // Texture
                        ctx.fillStyle = '#222';
                        for (let i = 0; i < 4; i++) {
                            let dotX = drawX + (i * 8) + 4;
                            let dotY = y * World.TILE_SIZE + (i % 2) * 8 + 12;
                            ctx.fillRect(dotX, dotY, 4, 4);
                        }
                    }
                }
            }
        }
    }
    
    function drawRobot() {
        const robot = Robot.state;
        
        if (robot.isDigging) {
            // Draw digging animation
            let digX = robot.digX * World.TILE_SIZE - World.worldOffset;
            let digY = robot.digY * World.TILE_SIZE;
            let robotX, robotY;
            
            // Position robot based on dig direction
            if (robot.digDirection === -1) {
                // Digging to the left
                robotX = digX + World.TILE_SIZE + 4;
                robotY = digY - robot.height + 8;
            } else if (robot.digDirection === 1) {
                // Digging to the right
                robotX = digX - robot.width - 4;
                robotY = digY - robot.height + 8;
            } else if (robot.digDirection === 2) {
                // Digging down
                robotX = digX - 4;
                robotY = digY - robot.height;
            } else if (robot.digDirection === 3) {
                // Digging up
                robotX = digX - 4;
                robotY = digY + World.TILE_SIZE;
            }
            
            // Robot body while digging
            ctx.fillStyle = '#888';
            ctx.fillRect(robotX, robotY, robot.width, robot.height - 8);
            
            // Robot head
            ctx.fillStyle = '#aaa';
            ctx.fillRect(robotX + 2, robotY - 6, robot.width - 4, 8);
            
            // Robot eyes
            ctx.fillStyle = '#0ff';
            if (robot.direction > 0) {
                ctx.fillRect(robotX + robot.width - 7, robotY - 4, 2, 4);
                ctx.fillRect(robotX + robot.width - 12, robotY - 4, 2, 4);
            } else {
                ctx.fillRect(robotX + 5, robotY - 4, 2, 4);
                ctx.fillRect(robotX + 10, robotY - 4, 2, 4);
            }
            
            // Robot arm extended for digging
            ctx.fillStyle = '#666';
            if (robot.digDirection === -1) {
                // Arm extended left
                ctx.fillRect(robotX - 12, robotY + 8, 12, 4);
            } else if (robot.digDirection === 1) {
                // Arm extended right
                ctx.fillRect(robotX + robot.width, robotY + 8, 12, 4);
            } else if (robot.digDirection === 2) {
                // Arms down for digging below
                ctx.fillRect(robotX + 4, robotY + robot.height - 6, 4, 12);
                ctx.fillRect(robotX + robot.width - 8, robotY + robot.height - 6, 4, 12);
            } else if (robot.digDirection === 3) {
                // Arms up for digging above
                ctx.fillRect(robotX + 4, robotY - 10, 4, 12);
                ctx.fillRect(robotX + robot.width - 8, robotY - 10, 4, 12);
            }
            
            // Digging effect - particles
            ctx.fillStyle = '#a96';
            for (let i = 0; i < 5; i++) {
                let particleX, particleY;
                
                if (robot.digDirection === -1) {
                    // Left particles
                    particleX = digX + World.TILE_SIZE/2 + (Math.sin(robot.digProgress * 0.2 + i) * 8);
                    particleY = digY + World.TILE_SIZE/2 + (Math.cos(robot.digProgress * 0.3 + i) * 8);
                } else if (robot.digDirection === 1) {
                    // Right particles
                    particleX = digX + World.TILE_SIZE/2 - (Math.sin(robot.digProgress * 0.2 + i) * 8);
                    particleY = digY + World.TILE_SIZE/2 + (Math.cos(robot.digProgress * 0.3 + i) * 8);
                } else if (robot.digDirection === 2) {
                    // Down particles
                    particleX = digX + World.TILE_SIZE/2 + (Math.sin(robot.digProgress * 0.2 + i) * 10);
                    particleY = digY + (Math.cos(robot.digProgress * 0.3 + i) * 6);
                } else if (robot.digDirection === 3) {
                    // Up particles
                    particleX = digX + World.TILE_SIZE/2 + (Math.sin(robot.digProgress * 0.2 + i) * 10);
                    particleY = digY + World.TILE_SIZE - (Math.cos(robot.digProgress * 0.3 + i) * 6);
                }
                
                ctx.fillRect(particleX, particleY, 3, 3);
            }
            
            // Digging progress indicator
            ctx.fillStyle = '#0f8';
            ctx.fillRect(robotX, robotY - 12, (robot.digProgress / 60) * World.TILE_SIZE, 3);
        } else {
            // Regular robot drawing
            
            // Robot body
            ctx.fillStyle = '#888';
            ctx.fillRect(robot.x, robot.y, robot.width, robot.height);
            
            // Robot head
            ctx.fillStyle = '#aaa';
            ctx.fillRect(robot.x + 2, robot.y - 6, robot.width - 4, 8);
            
            // Robot eyes (direction sensitive)
            ctx.fillStyle = '#0ff';
            if (robot.direction > 0) {
                ctx.fillRect(robot.x + robot.width - 7, robot.y - 4, 2, 4);
                ctx.fillRect(robot.x + robot.width - 12, robot.y - 4, 2, 4);
            } else {
                ctx.fillRect(robot.x + 5, robot.y - 4, 2, 4);
                ctx.fillRect(robot.x + 10, robot.y - 4, 2, 4);
            }
            
            // Robot legs
            ctx.fillStyle = '#666';
            ctx.fillRect(robot.x + 4, robot.y + robot.height - 6, 4, 8);
            ctx.fillRect(robot.x + robot.width - 8, robot.y + robot.height - 6, 4, 8);
        }
    }
    
    // Public API
    return {
        init,
        render,
        get canvas() { return canvas; }
    };
})(); 