/**
 * animations.js
 * Manages canvas-based confetti particles, CSS animation triggers,
 * board shaking, cell pulsing, and premium visual transitions.
 */

let confettiActive = false;
let confettiRequestFrameId = null;
const particles = [];
let confettiCanvas = null;
let confettiCtx = null;
let spawnIntervalId = null;
let spawnTimeoutId = null;
const confettiColors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#eab308', '#f97316'];

class ConfettiParticle {
  constructor(canvasWidth, canvasHeight, direction) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = direction === 'left' ? 0 : canvasWidth;
    this.y = canvasHeight * 0.9;
    
    // Shoot upward and inward
    const angleRange = direction === 'left' ? (-Math.PI / 4) - (Math.random() * (Math.PI / 6)) : (-3 * Math.PI / 4) + (Math.random() * (Math.PI / 6));
    const speed = 12 + Math.random() * 12;
    
    this.vx = Math.cos(angleRange) * speed;
    this.vy = Math.sin(angleRange) * speed;
    
    this.size = 6 + Math.random() * 8;
    this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    this.rotation = Math.random() * 360;
    this.rotationSpeed = -4 + Math.random() * 8;
    this.gravity = 0.25;
    this.friction = 0.985;
    this.opacity = 1;
    this.fadeSpeed = 0.005 + Math.random() * 0.008;
    
    // Random shape: 0 = rect, 1 = circle, 2 = triangle
    this.shapeType = Math.floor(Math.random() * 3);
  }

  update() {
    this.vx *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    
    // Start fading out when falling down
    if (this.vy > 0) {
      this.opacity -= this.fadeSpeed;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);

    ctx.beginPath();
    if (this.shapeType === 0) {
      // Rectangle
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else if (this.shapeType === 1) {
      // Circle
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Triangle
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }

  isDead() {
    return (
      this.opacity <= 0 || 
      this.y > this.canvasHeight + 50 || 
      this.x < -50 || 
      this.x > this.canvasWidth + 50
    );
  }
}

let resizeHandler = null;

/**
 * Starts the visual Confetti cannon fireworks covering the window.
 * @param {HTMLCanvasElement} canvas - The target canvas element
 */
export function startConfetti(canvas) {
  if (!canvas) return;
  
  // Clean up any active confetti first to prevent event listener leaks
  stopConfetti();

  confettiCanvas = canvas;
  confettiCtx = canvas.getContext('2d');
  if (!confettiCtx) return;

  confettiActive = true;
  particles.length = 0; // Clear existing

  resizeHandler = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  
  resizeHandler();
  window.addEventListener('resize', resizeHandler);

  // Spawn initial burst
  for (let i = 0; i < 75; i++) {
    particles.push(new ConfettiParticle(canvas.width, canvas.height, 'left'));
    particles.push(new ConfettiParticle(canvas.width, canvas.height, 'right'));
  }

  // Periodic spawning from sides for ongoing excitement
  let isSpawning = true;
  spawnIntervalId = setInterval(() => {
    if (!confettiActive || !isSpawning) {
      if (spawnIntervalId) {
        clearInterval(spawnIntervalId);
        spawnIntervalId = null;
      }
      return;
    }
    for (let i = 0; i < 4; i++) {
      particles.push(new ConfettiParticle(canvas.width, canvas.height, 'left'));
      particles.push(new ConfettiParticle(canvas.width, canvas.height, 'right'));
    }
  }, 120);

  // Stop spawning after 4 seconds to make the effect finite
  spawnTimeoutId = setTimeout(() => {
    isSpawning = false;
    spawnTimeoutId = null;
  }, 4000);

  function animationLoop() {
    if (!confettiActive) {
      if (confettiCtx && confettiCanvas) {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
      return;
    }

    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(confettiCtx);
      
      if (p.isDead()) {
        particles.splice(i, 1);
      }
    }

    // Auto-terminate when spawning finishes and all particles fall away
    if (!isSpawning && particles.length === 0) {
      stopConfetti();
      return;
    }

    // Keep loop running
    confettiRequestFrameId = requestAnimationFrame(animationLoop);
  }

  animationLoop();
}

/**
 * Stops rendering confetti and cleans up memory and resize event listeners.
 */
export function stopConfetti() {
  confettiActive = false;
  if (confettiRequestFrameId) {
    cancelAnimationFrame(confettiRequestFrameId);
    confettiRequestFrameId = null;
  }
  if (spawnIntervalId) {
    clearInterval(spawnIntervalId);
    spawnIntervalId = null;
  }
  if (spawnTimeoutId) {
    clearTimeout(spawnTimeoutId);
    spawnTimeoutId = null;
  }
  particles.length = 0;
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (confettiCanvas && confettiCtx) {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

/**
 * Shakes a DOM element (typically the board container) as visual error feedback.
 * Resets existing shake states if triggered continuously.
 * @param {HTMLElement} element - Target DOM element
 */
export function shakeElement(element) {
  if (!element) return;
  
  // Remove class if it exists to allow restarting the animation
  element.classList.remove('animate-shake');
  
  // Force a browser reflow to reset CSS transition states
  void element.offsetWidth;
  
  element.classList.add('animate-shake');
  
  // Clean up class once animation ends
  const cleanup = () => {
    element.classList.remove('animate-shake');
    element.removeEventListener('animationend', cleanup);
  };
  element.addEventListener('animationend', cleanup);
}

/**
 * Pulses a grid cell element on correct value entries.
 * @param {HTMLElement} element - Target cell element
 */
export function pulseElement(element) {
  if (!element) return;
  
  element.classList.remove('animate-pulse');
  void element.offsetWidth;
  element.classList.add('animate-pulse');
  
  const cleanup = () => {
    element.classList.remove('animate-pulse');
    element.removeEventListener('animationend', cleanup);
  };
  element.addEventListener('animationend', cleanup);
}
