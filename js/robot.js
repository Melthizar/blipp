// Robot entity and AI control
const Robot = (() => {
    // Constants
    const GRAVITY = 0.5;
    const ROBOT_SPEED = 2;
    const JUMP_FORCE = 12;
    const DIG_DURATION = 60; // frames
    
    // Jetpack constants
    const JETPACK_FORCE = 0.4; // Upward force when using jetpack
    const JETPACK_MAX_ENERGY = 100; // Maximum jetpack energy
    const JETPACK_USE_RATE = 0.6; // How quickly energy depletes when using
    const JETPACK_RECHARGE_RATE = 0.2; // How quickly energy recharges when not using
    
    // Visual state tracking
    let lastGroundedState = false;
    let jumpEffectPlayed = false;
    
    // Robot state
    let robot = {
        x: 0,
        y: 0,
        width: World.TILE_SIZE - 8,
        height: World.TILE_SIZE - 4,
        vx: 0,
        vy: 0,
        isJumping: false,
        isGrounded: false,
        isDigging: false,
        digProgress: 0,
        digX: 0,
        digY: 0,
        digDirection: 0, // 0: down, -1: left, 1: right
        direction: 1, // 1 for right, -1 for left
        actionTimer: 0,
        inventory: [],
        // Jetpack properties
        jetpackEnergy: JETPACK_MAX_ENERGY,
        isUsingJetpack: false
    };
    
    function init() {
        // Set initial position
        robot.x = World.GRID_WIDTH * World.TILE_SIZE / 2;
        robot.y = 0;
    }
    
    function updateAI() {
        // Only make decisions when not currently digging
        if (!robot.isDigging) {
            if (robot.actionTimer <= 0) {
                // Make a new decision
                let decision = Math.random();
                
                if (decision < 0.4) {
                    // Move left or right
                    robot.vx = ROBOT_SPEED * (Math.random() > 0.5 ? 1 : -1);
                    robot.direction = robot.vx > 0 ? 1 : -1;
                    robot.actionTimer = Math.floor(Math.random() * 60) + 30;
                } else if (decision < 0.6 && robot.isGrounded) {
                    // Jump - sometimes with direction
                    robot.vy = -JUMP_FORCE;
                    
                    // 60% chance to jump with horizontal direction
                    let jumpDirection = Math.random();
                    if (jumpDirection < 0.6) {
                        // Jump left or right
                        robot.vx = ROBOT_SPEED * 1.5 * (jumpDirection < 0.3 ? -1 : 1);
                        robot.direction = robot.vx > 0 ? 1 : -1;
                    } else {
                        // Jump straight up
                        robot.vx = 0;
                    }
                    
                    robot.isJumping = true;
                    robot.isGrounded = false;
                    jumpEffectPlayed = false;
                    robot.actionTimer = 20;
                    
                    // Add jump visual effect
                    createJumpEffect();
                    
                } else if (decision < 0.7 && robot.jetpackEnergy > 30) {
                    // Use jetpack if enough energy
                    robot.isUsingJetpack = true;
                    robot.actionTimer = Math.floor(Math.random() * 40) + 20;
                } else if (decision < 0.9) {
                    // Try to dig - now can dig even when not grounded
                    tryDig();
                    robot.actionTimer = 10;
                } else {
                    // Stand still
                    robot.vx = 0;
                    robot.actionTimer = Math.floor(Math.random() * 30) + 15;
                    robot.isUsingJetpack = false;
                    
                    // Occasional thinking particle effect when idle
                    if (Math.random() < 0.15) {
                        createThinkingEffect();
                    }
                }
            } else {
                robot.actionTimer--;
                
                // Maybe stop using jetpack if energy is too low
                if (robot.isUsingJetpack && robot.jetpackEnergy < 10 && Math.random() < 0.3) {
                    robot.isUsingJetpack = false;
                }
            }
        }
    }
    
    function createJumpEffect() {
        // Create visual jump effect if renderer is available
        if (typeof Renderer !== 'undefined' && Renderer.addParticleEffect) {
            Renderer.addParticleEffect(
                robot.x + robot.width / 2,
                robot.y + robot.height,
                {
                    count: 8,
                    color: 'rgba(200, 200, 200, 0.5)',
                    size: 3,
                    speedMultiplier: 0.8,
                    gravity: false
                }
            );
        }
    }
    
    function createJetpackEffect() {
        if (typeof Renderer !== 'undefined' && Renderer.addParticleEffect) {
            // Left exhaust
            Renderer.addParticleEffect(
                robot.x + 5,
                robot.y + robot.height - 2,
                {
                    count: 2,
                    color: 'rgba(255, 160, 30, 0.6)',
                    size: 2 + Math.random() * 2,
                    speedMultiplier: 1.2,
                    gravity: false,
                    lifeMultiplier: 0.7,
                    directionY: 1 // Force downward direction
                }
            );
            
            // Right exhaust
            Renderer.addParticleEffect(
                robot.x + robot.width - 5,
                robot.y + robot.height - 2,
                {
                    count: 2,
                    color: 'rgba(255, 160, 30, 0.6)',
                    size: 2 + Math.random() * 2,
                    speedMultiplier: 1.2,
                    gravity: false,
                    lifeMultiplier: 0.7,
                    directionY: 1 // Force downward direction
                }
            );
            
            // Occasional flame burst
            if (Math.random() < 0.2) {
                Renderer.addParticleEffect(
                    robot.x + 5 + Math.random() * (robot.width - 10),
                    robot.y + robot.height,
                    {
                        count: 3,
                        color: 'rgba(255, 220, 30, 0.7)',
                        size: 3 + Math.random() * 3,
                        speedMultiplier: 1.5,
                        gravity: false,
                        lifeMultiplier: 0.5,
                        directionY: 1 // Force downward direction
                    }
                );
            }
        }
    }
    
    function createThinkingEffect() {
        // Create thought bubble effect above robot's head
        if (typeof Renderer !== 'undefined' && Renderer.addParticleEffect) {
            const bubbleX = robot.x + (robot.direction > 0 ? robot.width - 5 : 5);
            
            Renderer.addParticleEffect(
                bubbleX,
                robot.y - 8,
                {
                    count: 1,
                    color: 'rgba(255, 255, 255, 0.8)',
                    size: 2,
                    speedMultiplier: 0.2,
                    lifeMultiplier: 2,
                    gravity: false
                }
            );
        }
    }
    
    function createLandingEffect() {
        // Create visual dust effect when landing
        if (typeof Renderer !== 'undefined' && Renderer.addParticleEffect) {
            Renderer.addParticleEffect(
                robot.x + robot.width / 2 - 5,
                robot.y + robot.height,
                {
                    count: 6,
                    color: 'rgba(180, 180, 160, 0.5)',
                    size: 2,
                    speedMultiplier: 0.5,
                    gravity: false
                }
            );
            
            Renderer.addParticleEffect(
                robot.x + robot.width / 2 + 5,
                robot.y + robot.height,
                {
                    count: 6,
                    color: 'rgba(180, 180, 160, 0.5)',
                    size: 2,
                    speedMultiplier: 0.5,
                    gravity: false
                }
            );
        }
    }
    
    function createItemCollectionEffect(x, y) {
        // Create sparkle effect when collecting items
        if (typeof Renderer !== 'undefined' && Renderer.addParticleEffect) {
            Renderer.addParticleEffect(
                x, y,
                {
                    count: 12,
                    type: 'sparkle',
                    color: '#ffa',
                    size: 2,
                    speedMultiplier: 1.2,
                    lifeMultiplier: 1.5
                }
            );
        }
    }
    
    function tryDig() {
        // Allow digging even when jumping or falling
        
        // Get robot's position in grid coordinates
        let robotGridX = Math.floor((robot.x + World.worldOffset) / World.TILE_SIZE);
        let robotGridY = Math.floor((robot.y + robot.height - robot.height/2) / World.TILE_SIZE);
        
        // Decide dig direction (left, right, up, down)
        let digDirectionDecision = Math.random();
        let digX = robotGridX;
        let digY = robotGridY;
        let canDig = false;
        
        if (digDirectionDecision < 0.25) {
            // Try to dig left
            if (robotGridX - 1 >= 0 && 
                World.getTile(robotGridX - 1, robotGridY)?.type === 'ground') {
                digX = robotGridX - 1;
                canDig = true;
                robot.direction = -1;
                robot.digDirection = -1; // Left
            }
        } else if (digDirectionDecision < 0.5) {
            // Try to dig right
            if (robotGridX + 1 < World.gameWorld.length && 
                World.getTile(robotGridX + 1, robotGridY)?.type === 'ground') {
                digX = robotGridX + 1;
                canDig = true;
                robot.direction = 1;
                robot.digDirection = 1; // Right
            }
        } else if (digDirectionDecision < 0.75) {
            // Try to dig down
            if (robotGridY + 1 < World.GRID_HEIGHT && 
                World.getTile(robotGridX, robotGridY + 1)?.type === 'ground') {
                digY = robotGridY + 1;
                canDig = true;
                robot.digDirection = 2; // Down
            }
        } else {
            // Try to dig up
            if (robotGridY - 1 >= 0 && 
                World.getTile(robotGridX, robotGridY - 1)?.type === 'ground') {
                digY = robotGridY - 1;
                canDig = true;
                robot.digDirection = 3; // Up
            }
        }
        
        // Start digging if a valid tile was found
        if (canDig) {
            robot.isDigging = true;
            robot.digProgress = 0;
            robot.digX = digX;
            robot.digY = digY;
            robot.vx = 0;
            robot.vy = 0; // Stop any vertical movement too
        }
    }
    
    function updateDigging() {
        if (robot.isDigging) {
            robot.digProgress++;
            
            if (robot.digProgress >= DIG_DURATION) {
                // Digging completed
                let dugTile = World.getTile(robot.digX, robot.digY);
                
                if (dugTile?.hasItem) {
                    // Found an item!
                    let itemName = Inventory.generateItemName();
                    
                    // Add to inventory using the new method that also updates the database
                    Inventory.addItem(itemName);
                    
                    // Create item collection effect
                    const worldX = robot.digX * World.TILE_SIZE - World.worldOffset;
                    const worldY = robot.digY * World.TILE_SIZE;
                    createItemCollectionEffect(worldX + World.TILE_SIZE / 2, worldY + World.TILE_SIZE / 2);
                }
                
                // Create debris effect
                const worldX = robot.digX * World.TILE_SIZE - World.worldOffset;
                const worldY = robot.digY * World.TILE_SIZE;
                createDebrisEffect(worldX + World.TILE_SIZE / 2, worldY + World.TILE_SIZE / 2);
                
                // Convert ground to air (dug out)
                World.setTile(robot.digX, robot.digY, 'air');
                
                // Reset digging state
                robot.isDigging = false;
                robot.digProgress = 0;
            }
        }
    }
    
    function createDebrisEffect(x, y) {
        // Create debris particles when finishing digging
        if (typeof Renderer !== 'undefined' && Renderer.addParticleEffect) {
            Renderer.addParticleEffect(
                x, y,
                {
                    count: 15,
                    color: '#a96',
                    size: 3,
                    speedMultiplier: 1.5,
                    gravity: true
                }
            );
        }
    }
    
    function checkCollisions() {
        robot.isGrounded = false;
        
        // Get the grid positions the robot is occupying
        let robotLeft = Math.floor((robot.x + World.worldOffset) / World.TILE_SIZE);
        let robotRight = Math.floor((robot.x + robot.width - 1 + World.worldOffset) / World.TILE_SIZE);
        let robotTop = Math.floor(robot.y / World.TILE_SIZE);
        let robotBottom = Math.floor((robot.y + robot.height - 1) / World.TILE_SIZE);
        
        // Check for floor collision (robot's feet)
        let checkingFloor = robotBottom + 1;
        if (checkingFloor < World.GRID_HEIGHT) {
            for (let x = robotLeft; x <= robotRight; x++) {
                let tile = World.getTile(x, checkingFloor);
                if (tile && (tile.type === 'ground' || tile.type === 'bedrock')) {
                    let feetY = robot.y + robot.height;
                    let floorY = checkingFloor * World.TILE_SIZE;
                    let distance = floorY - feetY;
                    
                    if (distance >= 0 && distance <= 10) {
                        // Check if just landed from a jump
                        if (!robot.isGrounded && robot.vy > 2 && !lastGroundedState) {
                            createLandingEffect();
                        }
                        
                        robot.isGrounded = true;
                        robot.isJumping = false;
                        robot.vy = 0;
                        break;
                    }
                }
            }
        }
        
        // Traditional collision checking
        for (let y = robotTop; y <= robotBottom; y++) {
            for (let x = robotLeft; x <= robotRight; x++) {
                let tile = World.getTile(x, y);
                if (tile && (tile.type === 'ground' || tile.type === 'bedrock')) {
                    // Calculate the overlaps on each side
                    let overlapLeft = (x + 1) * World.TILE_SIZE - World.worldOffset - robot.x;
                    let overlapRight = robot.x + robot.width - x * World.TILE_SIZE + World.worldOffset;
                    let overlapTop = (y + 1) * World.TILE_SIZE - robot.y;
                    let overlapBottom = robot.y + robot.height - y * World.TILE_SIZE;
                    
                    // Find the smallest overlap
                    let minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    
                    // Resolve the collision based on the smallest overlap
                    if (minOverlap === overlapTop && robot.vy < 0) {
                        // Collision from the top
                        robot.y = (y + 1) * World.TILE_SIZE;
                        robot.vy = 0;
                    } else if (minOverlap === overlapBottom && robot.vy > 0) {
                        // Collision from the bottom
                        robot.y = y * World.TILE_SIZE - robot.height;
                        robot.vy = 0;
                        
                        // Check if just landed
                        if (!robot.isGrounded && !lastGroundedState) {
                            createLandingEffect();
                        }
                        
                        robot.isGrounded = true;
                        robot.isJumping = false;
                    } else if (minOverlap === overlapLeft && robot.vx < 0) {
                        // Collision from the left
                        robot.x = (x + 1) * World.TILE_SIZE - World.worldOffset;
                        robot.vx = 0;
                    } else if (minOverlap === overlapRight && robot.vx > 0) {
                        // Collision from the right
                        robot.x = x * World.TILE_SIZE - robot.width + World.worldOffset;
                        robot.vx = 0;
                    }
                }
            }
        }
    }
    
    function update(canvasWidth, canvasHeight) {
        // Store previous grounded state for visual effects
        lastGroundedState = robot.isGrounded;
        
        // AI decision making
        updateAI();
        
        // Update digging progress if digging
        updateDigging();
        
        // Update jetpack energy
        updateJetpackEnergy();
        
        if (!robot.isDigging) {
            // Apply jetpack force if using
            if (robot.isUsingJetpack && robot.jetpackEnergy > 0) {
                robot.vy -= JETPACK_FORCE;
                createJetpackEffect();
                
                // Cap upward velocity with jetpack
                if (robot.vy < -4) {
                    robot.vy = -4;
                }
            } else {
                // Apply gravity
                robot.vy += GRAVITY;
            }
            
            // Cap falling speed
            if (robot.vy > 15) robot.vy = 15;
            
            // Apply velocity
            robot.x += robot.vx;
            robot.y += robot.vy;
            
            // World bounds
            if (robot.x < 0 && World.worldOffset <= 0) {
                robot.x = 0;
                robot.vx = 0;
            } else if (robot.x < 0 && World.worldOffset > 0) {
                robot.x = 0;
            }
            
            if (robot.x > canvasWidth - robot.width) {
                robot.x = canvasWidth - robot.width;
                robot.vx = 0;
            }
            
            // Check collision with the world
            checkCollisions();
            
            // Prevent falling through the bottom of the screen
            if (robot.y > canvasHeight - robot.height) {
                robot.y = canvasHeight - robot.height;
                robot.vy = 0;
                
                // Check if just landed
                if (!robot.isGrounded && !lastGroundedState) {
                    createLandingEffect();
                }
                
                robot.isGrounded = true;
                robot.isJumping = false;
            }
            
            // Add occasional trail particles during major falls
            if (robot.vy > 7 && Math.random() < 0.2 && typeof Renderer !== 'undefined' && Renderer.addParticleEffect) {
                Renderer.addParticleEffect(
                    robot.x + Math.random() * robot.width,
                    robot.y + robot.height - 5,
                    {
                        count: 1,
                        color: 'rgba(200, 200, 255, 0.3)',
                        size: 2,
                        speedMultiplier: 0.2,
                        gravity: false
                    }
                );
            }
        }
        
        // Scroll the world when robot approaches the edge
        let xAdjustment = World.handleScrolling(robot.x, robot.width, canvasWidth);
        robot.x += xAdjustment;
        
        // Make sure robot stays visible when going left
        if (robot.x < 20 && robot.vx < 0 && World.worldOffset <= 0) {
            robot.x = 20;
        }
    }
    
    // Update jetpack energy
    function updateJetpackEnergy() {
        if (robot.isUsingJetpack) {
            // Deplete energy when using jetpack
            robot.jetpackEnergy -= JETPACK_USE_RATE;
            if (robot.jetpackEnergy <= 0) {
                robot.jetpackEnergy = 0;
                robot.isUsingJetpack = false; // Force jetpack off when empty
            }
        } else if (robot.isGrounded) {
            // Recharge faster when grounded
            robot.jetpackEnergy += JETPACK_RECHARGE_RATE * 2;
        } else {
            // Recharge slowly when in air but not using jetpack
            robot.jetpackEnergy += JETPACK_RECHARGE_RATE;
        }
        
        // Cap energy at maximum
        if (robot.jetpackEnergy > JETPACK_MAX_ENERGY) {
            robot.jetpackEnergy = JETPACK_MAX_ENERGY;
        }
    }
    
    // Public API
    return {
        init,
        update,
        get state() { return robot; }
    };
})();