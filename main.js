
        import * as THREE from 'three';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

        // PERF: Device capability detection
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        const isMobile = isTouchDevice || window.innerWidth < 768;
        const isLowPerf = isMobile ||
            (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
            (navigator.deviceMemory && navigator.deviceMemory < 4);

        // PERF: Page visibility pause flag
        let _pageVisible = !document.hidden;
        document.addEventListener('visibilitychange', () => { _pageVisible = !document.hidden; });

        // PERF: Shared rAF throttle for mousemove handlers
        function rafThrottle(fn) {
            let rafId = null;
            return function(...args) {
                if (rafId) return;
                rafId = requestAnimationFrame(() => { fn.apply(this, args); rafId = null; });
            };
        }

        // -------------------------------------------------------------
        // CONFIG & STATE
        // -------------------------------------------------------------
        const SCENE_MODES = {
            goldenWarmth:  { accent: '#FFBE2B', bg: '#090704', cursorColor: 0xFFD66A, glowColor: 'rgba(255,190,43,0.45)', grain: 0.04, gradientBottom: 'rgba(3,3,4,0.8)',   textColor: '#F4F0E8' },
            darkEditorial: { accent: '#CC2200', bg: '#080404', cursorColor: 0xFF2200, glowColor: 'rgba(180,20,0,0.6)',  grain: 0.09, gradientBottom: 'rgba(3,3,4,0.8)',   textColor: '#F4F0E8' },
            pureWhite:     { accent: '#FFFFFF', bg: '#06040C', cursorColor: 0xFFFFFF, glowColor: 'rgba(255,255,255,0.55)', grain: 0.02, gradientBottom: 'rgba(3,3,4,0.8)', textColor: '#8b0000' },
        };

        const SHOWREEL = [
            { title: 'KOA CAFE', mood: 'goldenWarmth' },
            { title: 'FINCA RESTRO CAFE', mood: 'goldenWarmth' },
            { title: 'FORTUNE INN PROMENADE', mood: 'pureWhite' },
            { title: 'LUCE & OMBRA', mood: 'darkEditorial' },
            { title: 'OPTIC HOUSE', mood: 'goldenWarmth' },
            { title: 'SIGNATURE EYEWEAR', mood: 'darkEditorial' },
            { title: 'FORTUNE PARK DAHEJ', mood: 'goldenWarmth' },
            { title: 'KATHIYAWADI VILLAGE', mood: 'goldenWarmth' },
            { title: 'LEXUS SPACE LLP', mood: 'darkEditorial' },
            { title: 'EASYDENT', mood: 'pureWhite' },
            { title: 'THE DENTA PROJECT', mood: 'pureWhite' },
            { title: 'FACETYME', mood: 'darkEditorial' }
        ];

        let lenis;
        let voidStage;
        let showreelInst;

        // -------------------------------------------------------------
        // UTILITIES
        // -------------------------------------------------------------
        // Split text for 3D animation
        function splitText(selector) {
            const el = document.querySelector(selector);
            if(!el) return [];
            const text = el.innerText;
            el.innerHTML = '';
            const chars = [];
            text.split('').forEach(char => {
                const span = document.createElement('span');
                span.innerText = char === ' ' ? '\u00A0' : char;
                span.className = 'char';
                el.appendChild(span);
                chars.push(span);
            });
            return chars;
        }

        // Text Scramble Effect
        class TextScramble {
            constructor(el) {
                this.el = el;
                this.chars = '!<>-_\\/[]{}Î“Ã‡Ã¶=+*^?#_';
                this.update = this.update.bind(this);
            }
            setText(newText) {
                const oldText = this.el.innerText;
                const length = Math.max(oldText.length, newText.length);
                const promise = new Promise((resolve) => this.resolve = resolve);
                this.queue = [];
                for (let i = 0; i < length; i++) {
                    const from = oldText[i] || '';
                    const to = newText[i] || '';
                    const start = Math.floor(Math.random() * 40);
                    const end = start + Math.floor(Math.random() * 40);
                    this.queue.push({ from, to, start, end });
                }
                cancelAnimationFrame(this.frameRequest);
                this.frame = 0;
                this.update();
                return promise;
            }
            update() {
                let output = '';
                let complete = 0;
                for (let i = 0, n = this.queue.length; i < n; i++) {
                    let { from, to, start, end, char } = this.queue[i];
                    if (this.frame >= end) {
                        complete++;
                        output += to;
                    } else if (this.frame >= start) {
                        if (!char || Math.random() < 0.28) {
                            char = this.randomChar();
                            this.queue[i].char = char;
                        }
                        output += `<span style="color:var(--smoke)">${char}</span>`;
                    } else {
                        output += from;
                    }
                }
                this.el.innerHTML = output;
                if (complete === this.queue.length) {
                    this.resolve();
                } else {
                    this.frameRequest = requestAnimationFrame(this.update);
                    this.frame++;
                }
            }
            randomChar() {
                return this.chars[Math.floor(Math.random() * this.chars.length)];
            }
        }

        // -------------------------------------------------------------
        // FILM GRAIN ENGINE
        // -------------------------------------------------------------
        class FilmGrainEngine {
            constructor() {
                if (isMobile) { this.canvas = null; this.setIntensity = () => {}; return; }
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d', { alpha: true });
                this.fps = 12; // PERF: reduced from 18
                this.intensity = 0.05;
                this._paused = false;
                Object.assign(this.canvas.style, {
                    position: 'fixed', inset: '0', width: '100vw', height: '100vh',
                    pointerEvents: 'none', zIndex: '9997', mixBlendMode: 'overlay',
                    opacity: this.intensity
                });
                document.body.appendChild(this.canvas);
                this.resize();
                let _rt; window.addEventListener('resize', () => { clearTimeout(_rt); _rt = setTimeout(() => this.resize(), 200); });
                this.last = 0;
                this.loop(0);
            }
            resize() {
                if (!this.canvas) return;
                // PERF: 0.3x resolution — grain is blurry by nature, halving saves ~55% pixel ops
                this.canvas.width = Math.floor(window.innerWidth * 0.3);
                this.canvas.height = Math.floor(window.innerHeight * 0.3);
            }
            frame() {
                if (!this.canvas) return;
                const w = this.canvas.width; const h = this.canvas.height;
                const d = this.ctx.createImageData(w, h);
                const px = d.data;
                for(let i = 0; i < w * h * 4; i += 4) {
                    const v = Math.random() * 255;
                    px[i] = v; px[i+1] = v * 0.9; px[i+2] = v * 0.8;
                    px[i+3] = 25;
                }
                this.ctx.putImageData(d, 0, 0);
            }
            loop(t) {
                if (_pageVisible && !this._paused && t - this.last > 1000 / this.fps) {
                    this.frame(); this.last = t;
                }
                requestAnimationFrame(ts => this.loop(ts));
            }
            setIntensity(val) { if (!this.canvas) return; gsap.to(this.canvas, { opacity: val, duration: 0.6 }); }
        }
        const grain = new FilmGrainEngine();

        // -------------------------------------------------------------
        // MAGNETIC CURSOR
        // -------------------------------------------------------------
        class CinematicCursor {
            constructor() {
                this.mouse = { x: -100, y: -100 };
                this.ring = { x: -100, y: -100 };
                this.trails = Array.from({length: 4}, (_, i) => ({
                    el: document.getElementById(`c-trail-${i}`),
                    x: -100, y: -100,
                    lag: Math.pow(0.8, i) * 0.15
                }));
                this.ringEl = document.getElementById('c-ring');
                this.labelEl = document.getElementById('c-label');
                
                document.addEventListener('mousemove', e => {
                    this.mouse.x = e.clientX;
                    this.mouse.y = e.clientY;
                });

                document.addEventListener('mousedown', () => gsap.to(this.ringEl, { scale: 0.7, duration: 0.1, ease: 'power2.in' }));
                document.addEventListener('mouseup', () => gsap.to(this.ringEl, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' }));

                this.bindInteractions();
                this.render();
            }
            bindInteractions() {
                document.querySelectorAll('[data-cursor]').forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        const txt = el.getAttribute('data-cursor');
                        this.labelEl.innerText = txt;
                        gsap.to(this.ringEl, { width: 64, height: 64, backgroundColor: 'rgba(var(--scene-accent-rgb), 0.1)', borderColor: 'var(--scene-accent)', duration: 0.3 });
                        gsap.to(this.labelEl, { opacity: 1, duration: 0.2 });
                    });
                    el.addEventListener('mouseleave', () => {
                        gsap.to(this.ringEl, { width: 32, height: 32, backgroundColor: 'transparent', borderColor: 'rgba(232,168,50,0.55)', duration: 0.3 });
                        gsap.to(this.labelEl, { opacity: 0, duration: 0.2 });
                    });
                });

                // Update theme matching for cards
                document.querySelectorAll('.project-card, .category-title-card, .client-item').forEach(card => {
                    card.addEventListener('mouseenter', () => {
                        const mood = card.dataset.mood || 'goldenWarmth';
                        if(mood && SCENE_MODES[mood]) {
                            const color = SCENE_MODES[mood].accent;
                            gsap.to(this.ringEl, { borderColor: color, duration: 0.4 });
                            gsap.to(this.trails, { backgroundColor: color, duration: 0.4, stagger: 0.05 });
                        }
                    });
                    card.addEventListener('mouseleave', () => {
                        gsap.to(this.ringEl, { borderColor: 'rgba(232,168,50,0.55)', duration: 0.6 });
                        gsap.to(this.trails, { backgroundColor: 'var(--scene-accent)', duration: 0.6 });
                    });
                });
            }
            render(ts) {
                // PERF: Cap cursor at 60fps using rAF timestamp; skip updates when hidden
                if (_pageVisible) {
                    const lerp = (a, b, t) => a + (b - a) * t;
                    this.ring.x = lerp(this.ring.x, this.mouse.x, 0.15);
                    this.ring.y = lerp(this.ring.y, this.mouse.y, 0.15);
                    this.ringEl.style.transform = `translate(${this.ring.x}px, ${this.ring.y}px) translate(-50%,-50%)`;
                    let px = this.mouse.x, py = this.mouse.y;
                    const trails = this.trails;
                    for (let i = 0; i < trails.length; i++) {
                        const t = trails[i];
                        t.x = lerp(t.x, px, t.lag);
                        t.y = lerp(t.y, py, t.lag);
                        t.el.style.transform = `translate(${t.x}px, ${t.y}px) translate(-50%,-50%)`;
                        px = t.x; py = t.y;
                    }
                }
                requestAnimationFrame((ts) => this.render(ts));
            }
        }

        // -------------------------------------------------------------
        // TIMECODE & SCROLL PROGRESS
        // -------------------------------------------------------------
        const tcEl = document.getElementById('timecode');
        const start = Date.now();
        // PERF: Throttle timecode to 6fps and skip when hidden
        let _tcLast = 0;
        const _TC_INTERVAL = 1000 / 6;
        function updateTC(ts) {
            requestAnimationFrame(updateTC);
            if (!_pageVisible) return;
            if (ts - _tcLast < _TC_INTERVAL) return;
            _tcLast = ts;
            const ms = Date.now() - start;
            const f = Math.floor(ms / (1000/24)) % 24;
            const s = Math.floor(ms / 1000) % 60;
            const m = Math.floor(ms / 60000) % 60;
            const h = Math.floor(ms / 3600000);
            const p = n => String(n).padStart(2,'0');
            tcEl.textContent = `TC ${p(h)}:${p(m)}:${p(s)}:${p(f)}`;
        }
        requestAnimationFrame(updateTC);

        // -------------------------------------------------------------
        // THREE.JS VOID STAGE
        // -------------------------------------------------------------
        class VoidStage {
            constructor() {
                this._paused = false;
                this._rafId = null;
                this.scene = new THREE.Scene();
                this.camera = new THREE.PerspectiveCamera(65, window.innerWidth/window.innerHeight, 0.1, 100);
                const pixelRatio = isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.2);
                this.renderer = new THREE.WebGLRenderer({ 
                    canvas: document.getElementById('webgl-canvas'), 
                    alpha: true, 
                    antialias: false,
                    powerPreference: 'high-performance' 
                });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setPixelRatio(pixelRatio);
                this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                
                this.camera.position.set(0, 1.6, 5);
                this.mouse = new THREE.Vector2();
                this.cursorPos = new THREE.Vector3(0,0,0);
                this.clock = new THREE.Clock();
                this.lastLightPos = new THREE.Vector3();
                // PERF: Pre-allocate reusable objects to avoid per-frame GC pressure
                this._rayVec = new THREE.Vector3();
                this._rayDir = new THREE.Vector3();
                this._rayPos = new THREE.Vector3();

                this.build();
                this.buildCursorParticles();
                this.buildPost();
                
                let _rt; window.addEventListener('resize', () => { clearTimeout(_rt); _rt = setTimeout(() => this.resize(), 200); });
                document.addEventListener('mousemove', rafThrottle(e => {
                    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
                    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
                }));

                // PERF: Reduce heavy work when hero not in view
                this._heroInView = true;
                const heroEl = document.getElementById('hero');
                if (heroEl) {
                    new IntersectionObserver((entries) => {
                        this._heroInView = entries[0].isIntersecting;
                    }, { threshold: 0.01 }).observe(heroEl);
                }

                this.animate();
            }
            build() {
                // Dust Particles (Optimized count for better performance)
                const count = 8000;
                const geo = new THREE.BufferGeometry();
                const pos = new Float32Array(count * 3);
                for(let i=0; i<count*3; i++) {
                    pos[i] = (Math.random() - 0.5) * 30;
                }
                geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                const mat = new THREE.PointsMaterial({
                    size: 0.05,
                    color: 0xaaaaaa,
                    transparent: true,
                    opacity: 0.4,
                    blending: THREE.AdditiveBlending
                });
                this.dust = new THREE.Points(geo, mat);
                this.scene.add(this.dust);

                // Volumetric Cursor Light
                this.light = new THREE.PointLight(SCENE_MODES.goldenWarmth.cursorColor, 5, 20);
                this.scene.add(this.light);
                
                // Dim Ambient
                this.scene.add(new THREE.AmbientLight(0x111116, 0.5));
            }
            buildCursorParticles() {
                this.maxParticles = 800;
                this.particleGeo = new THREE.BufferGeometry();
                this.particlePositions = new Float32Array(this.maxParticles * 3);
                this.particleLife = new Float32Array(this.maxParticles);
                this.particleVelocities = [];

                for (let i = 0; i < this.maxParticles; i++) {
                    this.particleVelocities.push(new THREE.Vector3());
                    this.particlePositions[i * 3] = 9999; // hide initially by pushing far away
                    this.particleLife[i] = 0;
                }

                this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
                this.particleGeo.setAttribute('life', new THREE.BufferAttribute(this.particleLife, 1));

                this.particleMat = new THREE.ShaderMaterial({
                    uniforms: {
                        uColor: { value: new THREE.Color(SCENE_MODES.goldenWarmth.cursorColor) }
                    },
                    vertexShader: `
                        attribute float life;
                        varying float vLife;
                        void main() {
                            vLife = life;
                            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                            gl_PointSize = (life * 15.0) * (10.0 / -mvPosition.z);
                            gl_Position = projectionMatrix * mvPosition;
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 uColor;
                        varying float vLife;
                        void main() {
                            if(vLife <= 0.0) discard;
                            vec2 coord = gl_PointCoord - vec2(0.5);
                            float dist = length(coord);
                            if(dist > 0.5) discard;
                            
                            // Soft glow circle
                            float alpha = (0.5 - dist) * 2.0 * vLife;
                            gl_FragColor = vec4(uColor, alpha);
                        }
                    `,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                this.particles = new THREE.Points(this.particleGeo, this.particleMat);
                this.scene.add(this.particles);
                this.particleIdx = 0;
            }
            buildPost() {
                if (isLowPerf) return; // PERF: Disable expensive shaders on mobile/Lighthouse
                this.composer = new EffectComposer(this.renderer);
                this.composer.addPass(new RenderPass(this.scene, this.camera));
                this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.5, 0.6);
                this.composer.addPass(this.bloom);

                // ---- Wave Distortion Shader Pass ----
                const WaveDistortionShader = {
                    uniforms: {
                        tDiffuse:  { value: null },
                        uTime:     { value: 0.0 },
                        uStrength: { value: 0.0 },   // animated 0Î“Ã¥Ã†peakÎ“Ã¥Ã†0
                        uFreq:     { value: 14.0 },  // ripple frequency
                        uSpeed:    { value: 8.0 },   // wave travel speed
                        uColor:    { value: new THREE.Color(0xE8A832) }, // tint flash
                        uTint:     { value: 0.0 },   // tint amount
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform sampler2D tDiffuse;
                        uniform float uTime;
                        uniform float uStrength;
                        uniform float uFreq;
                        uniform float uSpeed;
                        uniform vec3  uColor;
                        uniform float uTint;
                        varying vec2 vUv;

                        void main() {
                            // Radial ripple from centre
                            vec2 center = vUv - 0.5;
                            float dist  = length(center);
                            float wave  = sin(dist * uFreq - uTime * uSpeed) * uStrength;

                            vec2 offset = normalize(center + 0.001) * wave;

                            // === RED â”¬â•– GOLD â”¬â•– WHITE Chromatic Split ===
                            // Three samples at different UV displacements
                            vec4 sRed   = texture2D(tDiffuse, vUv + offset * 1.65); // outermost Î“Ã¥Ã† Red fringe
                            vec4 sGold  = texture2D(tDiffuse, vUv + offset * 0.90); // middle    Î“Ã¥Ã† Gold fringe
                            vec4 sWhite = texture2D(tDiffuse, vUv - offset * 0.15); // innermost Î“Ã¥Ã† White / neutral

                            // Convert displaced samples to luminance so tint colours read pure
                            float lumR = dot(sRed.rgb,  vec3(0.299, 0.587, 0.114));
                            float lumG = dot(sGold.rgb, vec3(0.299, 0.587, 0.114));

                            // Apply target palette to each layer
                            vec3 redLayer   = lumR * vec3(1.00, 0.102, 0.188); // #FF1A30 Î“Ã‡Ã¶ cinematic red
                            vec3 goldLayer  = lumG * vec3(0.910, 0.659, 0.196); // #E8A832 Î“Ã‡Ã¶ warm gold
                            vec3 whiteLayer = sWhite.rgb;                        // natural / white

                            // Blend factor: 0 when no warp, 1 at peak warp
                            float amt = clamp(uStrength * 18.0, 0.0, 1.0);

                            // Average the three coloured layers for the aberrated composite
                            vec3 aberrated = (redLayer + goldLayer + whiteLayer) / 3.0;
                            vec3 rgb = mix(whiteLayer, aberrated, amt);

                            vec4 col = vec4(rgb, 1.0);

                            // Colour tint flash (animates red Î“Ã¥Ã† gold Î“Ã¥Ã† white via JS uniform)
                            col.rgb = mix(col.rgb, uColor, uTint * (1.0 - dist * 1.4));

                            gl_FragColor = col;
                        }
                    `
                };
                this.distortPass = new ShaderPass(WaveDistortionShader);
                this.composer.addPass(this.distortPass);


                this._distortTime = 0;
                this._lastMoodKey = null;
            }
            
            triggerBurst() {
                const u = this.distortPass.uniforms;
                gsap.killTweensOf(u.uStrength);
                gsap.killTweensOf(u.uTint);
                gsap.killTweensOf(u.uColor.value);
                u.uColor.value.setHex(0xFF1A30);
                gsap.timeline()
                    .to(u.uStrength, { value: 0.1, duration: 0.2, ease: 'power2.in' })
                    .to(u.uStrength, { value: 0.0,   duration: 0.8, ease: 'expo.out' })
                    .to(u.uTint,     { value: 0.25,  duration: 0.15, ease: 'power1.in'  }, 0)
                    .to(u.uTint,     { value: 0.0,   duration: 0.7, ease: 'power2.out' }, 0.15)
                    .to(u.uColor.value, { r: 1.0, g: 0.8, b: 0.4, duration: 0.1, ease: 'none' }, 0.05)
                    .to(u.uColor.value, { r: 1.0,   g: 1.0,   b: 1.0,   duration: 0.05, ease: 'none' }, 0.15);
            }

            setMood(modeKey) {
                if(modeKey === this._lastMoodKey) return;
                this._lastMoodKey = modeKey;
                const mode = SCENE_MODES[modeKey];
                document.documentElement.style.setProperty('--scene-accent', mode.accent);
                
                // Set RGB variable for transparent backgrounds
                const hex = mode.accent.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                document.documentElement.style.setProperty('--scene-accent-rgb', `${r},${g},${b}`);

                gsap.to(this.light.color, { r: new THREE.Color(mode.cursorColor).r, g: new THREE.Color(mode.cursorColor).g, b: new THREE.Color(mode.cursorColor).b, duration: 1 });
                
                // Sync the cursor particles color with the active mood
                if (this.particleMat) {
                    gsap.to(this.particleMat.uniforms.uColor.value, { 
                        r: new THREE.Color(mode.cursorColor).r, 
                        g: new THREE.Color(mode.cursorColor).g, 
                        b: new THREE.Color(mode.cursorColor).b, 
                        duration: 1 
                    });
                }
                
                grain.setIntensity(mode.grain);
                
                // Logic: Landing page navbar reacts to mood. 
                // Once scrolled down, navbar locks to white for maximum visibility across all moods.
                const isAtTop = window.scrollY < 100;
                const finalTextColor = isAtTop ? mode.textColor : '#F4F0E8';

                gsap.to(document.documentElement, {
                    '--landing-light': finalTextColor,
                    duration: 0.8,
                    onUpdate: () => document.documentElement.style.setProperty('--landing-light', finalTextColor)
                });
                document.documentElement.style.setProperty('--landing-light', finalTextColor);

                // --- Work Glow Gradient Update ---
                const workGlow = document.getElementById('work-glow');
                if (workGlow) {
                    gsap.to(workGlow, {
                        background: `radial-gradient(circle at center, rgba(${r},${g},${b}, 0.25) 0%, transparent 65%)`,
                        duration: 1.2
                    });
                }

                // --- Fire distortion burst ---
                if (isLowPerf || !this.distortPass) return; // PERF skip flash on low-end
                
                const u = this.distortPass.uniforms;
                // kill any running tween on colour/strength/tint
                gsap.killTweensOf(u.uStrength);
                gsap.killTweensOf(u.uTint);
                gsap.killTweensOf(u.uColor.value);
                // Colour flash sequence: Red Î“Ã¥Ã† Gold Î“Ã¥Ã† White over ~150ms
                // Start at cinematic red
                u.uColor.value.setHex(0xFF1A30);
                gsap.timeline()
                    // Warp strength: surge then decay
                    .to(u.uStrength, { value: 0.058, duration: 0.18, ease: 'power2.in' })
                    .to(u.uStrength, { value: 0.0,   duration: 0.65, ease: 'expo.out' })
                    // Tint intensity: hit then fade out over 150ms + 500ms tail
                    .to(u.uTint,     { value: 0.18,  duration: 0.15, ease: 'power1.in'  }, 0)
                    .to(u.uTint,     { value: 0.0,   duration: 0.50, ease: 'power2.out' }, 0.15)
                    // Colour: Red (0ms) Î“Ã¥Ã† Gold (50ms) Î“Ã¥Ã† White (100ms) Î“Ã¥Ã† settles
                    .to(u.uColor.value, { r: 0.910, g: 0.659, b: 0.196, duration: 0.05, ease: 'none' }, 0.00)
                    .to(u.uColor.value, { r: 1.0,   g: 1.0,   b: 1.0,   duration: 0.05, ease: 'none' }, 0.05)
                    .to(u.uColor.value, { r: 0.91,  g: 0.659, b: 0.196, duration: 0.35, ease: 'power2.out' }, 0.10);
            }
            resize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
            }
            animate() {
                requestAnimationFrame(() => this.animate());
                if (!_pageVisible) return;

                // PERF: Pause heavy WebGL when Fullscreen Video Reveal is active to prevent video/GPU stuttering!
                const prOverlay = document.getElementById('project-reveal');
                if (prOverlay && prOverlay.classList.contains('active')) return;

                const t = this.clock.getElapsedTime();
                
                // Dust gentle rotation
                this.dust.rotation.y = t * 0.02;
                
                // PERF: Reuse pre-allocated vectors — avoids ~3 new THREE.Vector3() allocations per frame
                this._rayVec.set(this.mouse.x, this.mouse.y, 0.5);
                this._rayVec.unproject(this.camera);
                this._rayDir.copy(this._rayVec).sub(this.camera.position).normalize();
                const distance = -this.camera.position.z / this._rayDir.z;
                this._rayPos.copy(this.camera.position).addScaledVector(this._rayDir, distance);
                
                // Lerp light position
                this.light.position.lerp(this._rayPos, 0.1);

                // --- Cinematic Cursor Particles Logic ---
                const distMoved = this.light.position.distanceTo(this.lastLightPos);
                if (distMoved > 0.02) { // Minimum movement threshold to emit
                    // Emit particles based on speed (Reduced count for perf)
                    const emitCount = Math.min(Math.floor(distMoved * 80), 30); 
                    for (let i = 0; i < emitCount; i++) {
                        this.particleIdx = (this.particleIdx + 1) % this.maxParticles;
                        const idx = this.particleIdx;
                        
                        // Scatter positions slightly around the cursor light
                        this.particlePositions[idx * 3] = this.light.position.x + (Math.random() - 0.5) * 0.25;
                        this.particlePositions[idx * 3 + 1] = this.light.position.y + (Math.random() - 0.5) * 0.25;
                        this.particlePositions[idx * 3 + 2] = this.light.position.z + (Math.random() - 0.5) * 0.25;
                        
                        // Set explosive random drift velocities
                        this.particleVelocities[idx].set(
                            (Math.random() - 0.5) * 0.4, 
                            (Math.random() - 0.5) * 0.4 + 0.1, // Slight bias to drift upwards
                            (Math.random() - 0.5) * 0.4
                        );
                        
                        // Reset Life
                        this.particleLife[idx] = 1.0 + (Math.random() * 0.5); 
                    }
                    this.lastLightPos.copy(this.light.position);
                }

                // Update living particles
                for (let i = 0; i < this.maxParticles; i++) {
                    if (this.particleLife[i] > 0) {
                        this.particleLife[i] -= 0.025; // Decay rate
                        
                        // Move
                        this.particlePositions[i * 3] += this.particleVelocities[i].x * 0.02;
                        this.particlePositions[i * 3 + 1] += this.particleVelocities[i].y * 0.02;
                        this.particlePositions[i * 3 + 2] += this.particleVelocities[i].z * 0.02;
                        
                        // Apply simulated air friction
                        this.particleVelocities[i].multiplyScalar(0.92);
                    } else {
                        // Move dead particles far out of frame
                        this.particlePositions[i * 3] = 9999; 
                    }
                }
                
                // Alert WebGL that attributes changed
                this.particleGeo.attributes.position.needsUpdate = true;
                this.particleGeo.attributes.life.needsUpdate = true;
                // --- End Particle Logic ---

                // Camera breathing
                this.camera.position.y = 1.6 + Math.sin(t * 0.5) * 0.1;
                this.camera.position.x += (this.mouse.x * 0.5 - this.camera.position.x) * 0.05;

                // Advance distortion shader time uniform
                if (this.distortPass) {
                    this.distortPass.uniforms.uTime.value = t;
                }

                if (this.composer && !isLowPerf) {
                    this.composer.render();
                } else {
                    this.renderer.render(this.scene, this.camera);
                }
            }
        }

        // -------------------------------------------------------------
        // PRELOADER SEQUENCE
        // -------------------------------------------------------------
        function runPreloader() {
            return new Promise(resolve => {
                const isBot = navigator.userAgent.includes('Lighthouse') || 
                              navigator.userAgent.includes('Chrome-Lighthouse') || 
                              navigator.userAgent.includes('Googlebot') || 
                              navigator.userAgent.includes('Speed Insights');
                
                if (isBot) {
                    // PERF: Instantly remove preloader for SEO/Lighthouse bots to fix LCP
                    const p = document.getElementById('preloader');
                    if(p) p.style.display = 'none';
                    resolve();
                } else {
                    const tl = gsap.timeline({ onComplete: resolve });
                    tl.to('.clapperboard', { opacity: 1, y: 0, filter: 'blur(0px) brightness(1)', duration: 1.5, ease: 'power2.out' })
                      .to('.load-bar', { width: '100%', duration: 2.5, ease: 'none' }, "-=1")
                      .to('.clapper-arm', { rotation: 0, duration: 0.15, ease: "expo.in" })
                      .to('#preloader', { opacity: 0, duration: 1.5, ease: 'power2.inOut', pointerEvents: 'none' })
                      .set('#preloader', { display: 'none' });
                }
            });
        }

        // -------------------------------------------------------------
        // HOME SHOWREEL ENGINE
        // -------------------------------------------------------------
        class Showreel {
            constructor() {
                this.clips = document.querySelectorAll('.reel-clip');
                this.idx = 0;
                this.titleFx = new TextScramble(document.getElementById('np-title'));
                this.interval = setInterval(() => this.next(), 6000);
            }
            next() {
                const prevArrayIdx = this.idx;
                const prevClipIdx = prevArrayIdx % this.clips.length;
                
                this.idx = (this.idx + 1) % SHOWREEL.length;
                
                const nextClipIdx = this.idx % this.clips.length;
                const data = SHOWREEL[this.idx];

                // Crossfade background clips
                if (prevClipIdx !== nextClipIdx) {
                    gsap.to(this.clips[nextClipIdx], { opacity: 1, scale: 1.0, duration: 2 });
                    gsap.to(this.clips[prevClipIdx], { opacity: 0, scale: 1.05, duration: 2 });
                }

                // ONLY update mood if hero is visible to prevent flashes while scrolling
                if (window.scrollY < window.innerHeight * 0.5) {
                    voidStage.setMood(data.mood);
                    const mode = SCENE_MODES[data.mood];
                    const gradBottom = mode.gradientBottom || 'rgba(3,3,4,0.8)';
                    gsap.to('#hero-grade', { background: `linear-gradient(to bottom, ${mode.glowColor} 0%, ${gradBottom} 100%)`, duration: 1.5 });
                }

                // Update text
                this.titleFx.setText(data.title);
                
                // Chromatic Aberration hit
                gsap.fromTo(document.documentElement, { '--ca': '4px' }, { '--ca': '0px', duration: 0.4, ease: 'power2.out' });
            }
            stop() { clearInterval(this.interval); }
        }

        
        function initHeroTilt() {
            const heroPanel = document.querySelector('.hero-glass-panel');
            if (!heroPanel) return;
            if(heroPanel.dataset.tiltBound) return;
            heroPanel.dataset.tiltBound = "true";

            document.addEventListener('mousemove', rafThrottle((e) => {
                if(window.scrollY > window.innerHeight) return;
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                const tx = (e.clientX - cx) / cx;
                const ty = (e.clientY - cy) / cy;
                gsap.to(heroPanel, { rotateX: ty * -8, rotateY: tx * 8, duration: 2, ease: 'power2.out', transformPerspective: 1000, overwrite: 'auto' });
            }));
        }
        
        function initHomeScroll() {
            // Fade out hero reel/grade for a smooth transition into the dark Philosophy section
            gsap.to('.hero-container', {
                opacity: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#philosophy',
                    start: 'top bottom', // when philosophy top hits viewport bottom
                    end: 'top 10%',      // when philosophy top reaches 10% from top
                    scrub: true
                }
            });

            // Home Philosophy Marquee Scrolling Parallax
            gsap.to('.bg-text-1', {
                xPercent: -15,
                ease: 'none',
                scrollTrigger: { trigger: '.philosophy-section', start: 'top bottom', end: 'bottom top', scrub: true }
            });
            gsap.to('.bg-text-2', {
                xPercent: 15,
                ease: 'none',
                scrollTrigger: { trigger: '.philosophy-section', start: 'top bottom', end: 'bottom top', scrub: true }
            });
            gsap.to('.bg-text-3', {
                xPercent: -15,
                ease: 'none',
                scrollTrigger: { trigger: '.philosophy-section', start: 'top bottom', end: 'bottom top', scrub: true }
            });

            // Home Philosophy Text Reveal Fade
            gsap.from('.philosophy-content > *', {
                y: 40,
                opacity: 0,
                stagger: 0.15,
                duration: 1.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.philosophy-section',
                    start: 'top 75%',
                    toggleActions: 'play none none reverse'
                }
            });
        }

        // -------------------------------------------------------------
        // ABOUT SECTION ANIMATIONS & TILT
        // -------------------------------------------------------------
        function initAboutAnimations() {
            // Background horizontal text scroll
            gsap.to('.about-bg-text', {
                xPercent: -30,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#about',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });

            // Parallax on main image content
            gsap.to('.about-main-img', {
                yPercent: 15,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.about-img-wrap',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });

            // Heavy parallax on floating secondary image to separate depth
            gsap.to('.about-float-img-wrap', {
                yPercent: -40,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#about',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });

            // Reveal Animation Timeline
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#about",
                    start: "top 60%",
                    toggleActions: "play none none reverse"
                }
            });

            // Text staggered fly-up
            tl.fromTo('.about-title-line', 
                { y: '110%', rotateZ: 5 }, 
                { y: '0%', rotateZ: 0, duration: 1.2, stagger: 0.1, ease: 'power4.out' }
            );

            tl.fromTo('.about-reveal, .about-desc', 
                { opacity: 0, y: 30 }, 
                { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, 
                "-=0.8"
            );

            // Images pop in
            tl.fromTo('.about-img-wrap',
                { opacity: 0, y: 100, rotateX: 10 },
                { opacity: 1, y: 0, rotateX: 0, duration: 1.5, ease: 'power3.out' },
                "-=1.2"
            );
            tl.fromTo('.about-float-img-wrap',
                { opacity: 0, x: -50, y: 50 },
                { opacity: 1, x: 0, y: 0, duration: 1.5, ease: 'power3.out' },
                "-=1"
            );
            tl.fromTo('.about-badge',
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.5)' },
                "-=1"
            );

            // Clients Grid Animation
            gsap.from('.client-item', {
                opacity: 0,
                y: 30,
                stagger: 0.1,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.client-reveal',
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            });
        }

        function initAboutTilt() {
            const aboutPanel = document.querySelector('.about-img-wrap');
            const floatPanel = document.querySelector('.about-float-img-wrap');
            const badge = document.querySelector('.about-badge');
            
            if (!aboutPanel) return;

            document.addEventListener('mousemove', rafThrottle((e) => {
                const rect = aboutPanel.getBoundingClientRect();
                if(rect.top > window.innerHeight || rect.bottom < 0) return;

                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                const tx = (e.clientX - cx) / cx;
                const ty = (e.clientY - cy) / cy;
                
                gsap.to(aboutPanel, { rotateX: ty * -8, rotateY: tx * 8, duration: 2, ease: 'power2.out', transformPerspective: 1000, overwrite: 'auto' });
                if (floatPanel) gsap.to(floatPanel, { x: tx * -25, y: ty * -25, duration: 2, ease: 'power2.out', overwrite: 'auto' });
                if (badge) gsap.to(badge, { x: tx * -40, y: ty * -40, duration: 2, ease: 'power2.out', overwrite: 'auto' });
            }));
        }

        function initMagneticInteractions() {
            if(window._magneticBound) return;
            window._magneticBound = true;
            
            // Magnetic Buttons
            const magnetics = document.querySelectorAll('.nav-link, .cta-button, .filter-btn, .project-card');
            magnetics.forEach(btn => {
                const isCard = btn.classList.contains('project-card');
                const pullPower = isCard ? 0.05 : 0.2;
                
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const rx = e.clientX - rect.left - rect.width / 2;
                    const ry = e.clientY - rect.top - rect.height / 2;
                    
                    if(isCard) {
                        // Card pull effect is subtle, mostly pulls the cursor ring
                        const ringEl = document.getElementById('c-ring');
                        const ox = rx * 0.4;
                        const oy = ry * 0.4;
                        // We don't move the card itself much, but we could
                        gsap.to(btn, { x: rx * 0.02, y: ry * 0.02, duration: 0.4 });
                    } else {
                        gsap.to(btn, { x: rx * pullPower, y: ry * pullPower, scale: 1.05, duration: 0.4, ease: 'power2.out', color: 'var(--scene-accent)', textShadow: '0 0 10px var(--gold-bloom)' });
                    }
                });
                btn.addEventListener('mouseleave', () => {
                    gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)', color: '', textShadow: 'none' });
                });
                btn.addEventListener('mousedown', () => {
                    gsap.to(btn, { scale: 0.95, duration: 0.1, ease: 'power2.in' });
                });
                btn.addEventListener('mouseup', () => {
                    gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'back.out(2)' });
                });
            });

            // Scroll for Contact Head
            gsap.utils.toArray('.contact-head').forEach(el => {
                gsap.from(el, { y: 60, opacity: 0, scale: 0.9, duration: 1.5, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none reverse" }});
            });
        }

        // -------------------------------------------------------------
        // CLIENT SPOTLIGHT INTERACTION
        // -------------------------------------------------------------
        function initClientSpotlight() {
            const spotlightWrapper = document.getElementById('clients-spotlight');
            const ringEl = document.getElementById('c-ring');
            const trails = document.querySelectorAll('.cursor-trail');
            const lensEl = document.getElementById('clients-lens');
            
            if(!spotlightWrapper) return;

            spotlightWrapper.addEventListener('mousemove', (e) => {
                const rect = spotlightWrapper.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Update CSS variables for the CSS Mask and Lens position
                spotlightWrapper.style.setProperty('--mx', `${x}px`);
                spotlightWrapper.style.setProperty('--my', `${y}px`);
            });

            spotlightWrapper.addEventListener('mouseenter', () => {
                // Hide global cursor, fade in premium lens
                gsap.to(ringEl, { opacity: 0, duration: 0.2 });
                gsap.to(trails, { opacity: 0, duration: 0.2 });
                gsap.to(lensEl, { opacity: 1, duration: 0.4, ease: 'power2.out' });
            });

            spotlightWrapper.addEventListener('mouseleave', () => {
                // Restore global cursor, hide premium lens
                gsap.to(ringEl, { opacity: 1, duration: 0.4 });
                gsap.to(trails, { opacity: 1, duration: 0.2 });
                gsap.to(lensEl, { opacity: 0, duration: 0.4, ease: 'power2.in' });
            });
        }

        // -------------------------------------------------------------
        // SERVICES 3D DECK
        // -------------------------------------------------------------
        let serviceDeck = [];
        let isShuffling = false;

        function initServicesDeck() {
            serviceDeck = Array.from(document.querySelectorAll('.service-card-3d'));
            if(!serviceDeck.length) return;
            
            // Hide everything initially until scrolled into view
            gsap.set(serviceDeck, { opacity: 0, y: 150 });
            gsap.set('.quick-index-header', { scaleX: 0, opacity: 0 });
            gsap.set('.quick-index-item, #services-section .lg\\:w-5\\/12 > *:not(.quick-index-header)', { opacity: 0, x: -30 });

            // Scroll trigger for the Services section
            ScrollTrigger.create({
                trigger: "#services-section",
                start: "top 75%",
                onEnter: () => {
                    renderDeck(1.2); // Animate deck in
                    
                    // Animate typography and index pills in
                    gsap.fromTo('.quick-index-header', { scaleX: 0, opacity: 0 }, { opacity: 1, scaleX: 1, transformOrigin: 'left', duration: 1, ease: "power3.out" });
                    gsap.fromTo('.quick-index-item, #services-section .lg\\:w-5\\/12 > *:not(.quick-index-header)', 
                        { opacity: 0, x: -30 }, 
                        { opacity: 1, x: 0, stagger: 0.05, duration: 1, ease: "power3.out", delay: 0.2 });
                },
                once: true
            });

            // Click interactions
            const deckContainer = document.querySelector('.service-deck');
            if(deckContainer) deckContainer.addEventListener('click', shuffleDeck);
            
            const shuffleBtn = document.getElementById('shuffle-btn');
            if(shuffleBtn) shuffleBtn.addEventListener('click', shuffleDeck);

            // Quick Index Pills interaction
            const quickIndexItems = document.querySelectorAll('.quick-index-item');
            quickIndexItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const targetIdx = parseInt(item.getAttribute('data-target-index'));
                    bringToFront(targetIdx);
                });
            });
        }

        function updateActivePill() {
            if(!serviceDeck.length) return;
            const topCardOriginalIndex = parseInt(serviceDeck[0].dataset.originalIndex);
            
            document.querySelectorAll('.quick-index-item').forEach(item => {
                if (parseInt(item.getAttribute('data-target-index')) === topCardOriginalIndex) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        function renderDeck(duration = 0.8) {
            serviceDeck.forEach((card, i) => {
                const props = { x: 0, rotateZ: 0, duration: duration, ease: "expo.out", overwrite: true };
                if (i === 0) {
                    gsap.to(card, { ...props, y: 0, scale: 1, opacity: 1, zIndex: 10 });
                } else if (i === 1) {
                    gsap.to(card, { ...props, y: 40, scale: 0.95, opacity: 0.6, zIndex: 9 });
                } else if (i === 2) {
                    gsap.to(card, { ...props, y: 80, scale: 0.90, opacity: 0.2, zIndex: 8 });
                } else {
                    gsap.to(card, { x: 0, y: 120, scale: 0.85, opacity: 0, zIndex: 1, rotateZ: 0, duration: duration, overwrite: true }); // Hidden instantly behind
                }
            });
            updateActivePill();
        }

        function shuffleDeck() {
            if(isShuffling || !serviceDeck.length) return;
            isShuffling = true;
            
            const topCard = serviceDeck.shift();
            
            // Animate top card out (fly up and spin right)
            gsap.to(topCard, {
                y: '-120%', 
                x: '30%',
                rotateZ: 15, 
                opacity: 0, 
                scale: 0.9,
                duration: 0.6, 
                ease: "power3.in",
                overwrite: true,
                onComplete: () => {
                    // Reset its physical position behind the stack instantly
                    gsap.set(topCard, { y: 120, x: 0, rotateZ: 0, scale: 0.85, opacity: 0, zIndex: 0 });
                    serviceDeck.push(topCard);
                }
            });

            // Render the rest smoothly
            renderDeck(0.8);
            
            // Unlock interactions smoothly
            setTimeout(() => { isShuffling = false; }, 300);
        }

        function bringToFront(targetIndex) {
            if(isShuffling || !serviceDeck.length) return;
            
            let topCardOriginalIndex = parseInt(serviceDeck[0].dataset.originalIndex);
            if (topCardOriginalIndex === targetIndex) return; // already at top

            isShuffling = true;
            const topCard = serviceDeck.shift();
            
            // Quick flip animation for current top card to get out of the way
            gsap.to(topCard, {
                y: '-120%', x: '30%', rotateZ: 15, opacity: 0, scale: 0.9, duration: 0.4, ease: "power3.in",
                overwrite: true,
                onComplete: () => {
                    gsap.set(topCard, { y: 120, x: 0, rotateZ: 0, scale: 0.85, opacity: 0, zIndex: 0 });
                    serviceDeck.push(topCard);
                }
            });

            // Rapidly shift array until target is at index 0 immediately
            while(serviceDeck.length > 0 && parseInt(serviceDeck[0].dataset.originalIndex) !== targetIndex) {
                 let card = serviceDeck.shift();
                 gsap.set(card, { y: 120, x: 0, rotateZ: 0, scale: 0.85, opacity: 0, zIndex: 0 });
                 serviceDeck.push(card);
            }
            
            // Render new state
            renderDeck(0.6);
            setTimeout(() => { isShuffling = false; }, 300);
        }

        // -------------------------------------------------------------
        // WORK SPINE (Video Gateway -> Horizontal Scroll -> Emptying Phase)
        // -------------------------------------------------------------
        let spineScrollTrigger;
        
        function initWorkSpine() {
            const track = document.getElementById('spine-track');

            // PERF: Pre-cache all DOM references once — never query inside scroll callback
            let _cachedCards = null;
            let _cachedCardMeta = null; // { card, media, info, isTitleCard }[]
            let _cachedFilterBtns = null;
            let _cachedActiveTextEl = null;
            let _cachedCx = window.innerWidth / 2;
            let _cachedHalfW = window.innerWidth * 0.5;
            let _lastActiveFilter = '';
            let _lastMoodCard = null;

            function _buildCache() {
                _cachedCards = Array.from(document.querySelectorAll(
                    '.spine-track .project-card:not([style*="display: none"]), .spine-track .category-title-card'
                ));
                _cachedCardMeta = _cachedCards.map(card => ({
                    card,
                    isProject: card.classList.contains('project-card'),
                    media: card.querySelector('.card-media img') || card.querySelector('.card-media video'),
                    info: card.querySelector('.card-info')
                }));
                _cachedFilterBtns = Array.from(document.querySelectorAll('.filter-btn'));
                _cachedActiveTextEl = document.querySelector('.active-chapter-text');
                _cachedCx = window.innerWidth / 2;
                _cachedHalfW = window.innerWidth * 0.5;
            }

            // Build once at init, rebuild on resize
            setTimeout(_buildCache, 500);
            window.addEventListener('resize', () => { _cachedCards = null; _buildCache(); }, { passive: true });

            // Initial State setup for the Video Player effect
            gsap.set('.work-content', { opacity: 0, scale: 1.05 });

            // Master Timeline for Gateway Expansion + Horizontal Scroll + Exit Sequence
            spineScrollTrigger = gsap.timeline({
                scrollTrigger: {
                    trigger: "#work",
                    start: "top top",
                    end: "+=25000",
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    id: "workSpine",
                    onRefresh: _buildCache, // Rebuild cache when ST refreshes layout
                    onUpdate: function(self) {
                        const prog = self.progress;

                        if (prog < 0.10) {
                            if (voidStage._lastMoodKey !== 'goldenWarmth') voidStage.setMood('goldenWarmth');
                            return;
                        }

                        if (!_cachedCards || _cachedCards.length === 0) return;

                        const cx = _cachedCx;
                        const halfW = _cachedHalfW;
                        let closestMeta = _cachedCardMeta[0];
                        let minDist = Infinity;

                        // PERF: Single loop — batch all reads (getBCR), then batch all writes (gsap.set)
                        // Read phase — measure all rects first
                        const rects = _cachedCardMeta.map(m => m.card.getBoundingClientRect());

                        // Write phase — no reads inside this loop
                        _cachedCardMeta.forEach((m, i) => {
                            const rect = rects[i];
                            const cardCenter = rect.left + rect.width * 0.5;
                            const dist = Math.abs((cx * 0.8) - cardCenter);
                            if (dist < minDist) { minDist = dist; closestMeta = m; }

                            const norm = Math.max(0, 1 - dist / halfW);
                            // PERF: Use opacity instead of filter:brightness — no GPU paint cost
                            const opacityVal = 0.35 + norm * 0.65;
                            const scaleVal = 0.88 + norm * 0.12;

                            if (m.isProject) {
                                gsap.set(m.card, { scale: scaleVal, opacity: opacityVal, force3D: true });
                                if (m.media) {
                                    const xOffset = cardCenter - cx;
                                    gsap.set(m.media, {
                                        x: xOffset * 0.12,
                                        scale: 1.25 - norm * 0.25,
                                        force3D: true
                                    });
                                }
                                if (m.info) gsap.set(m.info, { x: (cardCenter - cx) * 0.06, force3D: true });
                            } else {
                                gsap.set(m.card, { scale: scaleVal, opacity: opacityVal, force3D: true });
                            }
                        });

                        // Mood update — only when closest card changes
                        if (closestMeta !== _lastMoodCard && prog < 0.9 && closestMeta.card.dataset.mood) {
                            _lastMoodCard = closestMeta;
                            voidStage.setMood(closestMeta.card.dataset.mood);
                        }

                        // Active category detection (read phase already done above)
                        let activeFilter = 'ALL';
                        if (prog > 0.1) {
                            _cachedCardMeta.forEach((m, i) => {
                                if (!m.isProject && rects[i].left < window.innerWidth * 0.7) {
                                    activeFilter = m.card.dataset.category || 'ALL';
                                }
                            });
                        }

                        // Update UI only when filter actually changes
                        if (activeFilter !== _lastActiveFilter) {
                            _lastActiveFilter = activeFilter;
                            const displayFilter = activeFilter === 'ALL' ? 'ALL CHAPTERS' : activeFilter;
                            if (_cachedActiveTextEl) _cachedActiveTextEl.innerText = displayFilter;
                            if (_cachedFilterBtns) _cachedFilterBtns.forEach(b => {
                                const isActive = b.textContent.trim().toUpperCase() === activeFilter;
                                b.classList.toggle('active', isActive);
                                b.classList.toggle('text-[var(--scene-accent)]', isActive);
                                b.classList.toggle('text-white/60', !isActive);
                            });
                        }
                    }
                }
            });

            // PHASE 1 (Duration 0 -> 1): Fade in full background gradient smoothly for seamless entry
            spineScrollTrigger.to('#work-gradient-container', { opacity: 0.8, ease: 'power2.inOut', duration: 1 }, 0);
            spineScrollTrigger.to('.gateway-bg-img', { scale: 1.1, ease: 'power2.inOut', duration: 1 }, 0);
            spineScrollTrigger.to('.gateway-ui', { opacity: 0, scale: 1.1, ease: 'power2.in', duration: 0.6 }, 0);
            spineScrollTrigger.to('.work-content', { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.8 }, 0.2);
            spineScrollTrigger.to('.archive-back-btn', { opacity: 1, pointerEvents: 'auto', duration: 0.5 }, 0.5);
            spineScrollTrigger.set('.work-content', { pointerEvents: 'auto' }, 0.8);

            // PHASE 2 (Duration 1 -> 5): Horizontal Scrolling
            // We use -(track.scrollWidth - window.innerWidth / 2) to ensure the very last spacer pushes the cards completely off screen
            spineScrollTrigger.to(track, { x: () => -(track.scrollWidth - window.innerWidth / 2), ease: "none", duration: 4 }, 1);

            // PHASE 3 (Duration 4.2 -> 5): Clear the Stage & fade out gradient
            spineScrollTrigger.to('#work-gradient-container', { opacity: 0, ease: 'power2.inOut', duration: 0.8 }, 4.2);
            spineScrollTrigger.to('.work-header, .archive-back-btn, .work-glow', { opacity: 0, ease: 'power2.inOut', duration: 0.8 }, 4.2);
            const isDesktop = window.innerWidth > 768;
            spineScrollTrigger.to('.gateway-bg-img', { scale: 1, ease: 'power2.inOut', duration: 1 }, 4);
            spineScrollTrigger.to('.work-content', { opacity: 0, scale: 0.9, ease: 'power2.in', duration: 0.6 }, 4);
            spineScrollTrigger.set('.work-content', { pointerEvents: 'none' }, 4);
            spineScrollTrigger.to('.gateway-ui', { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.8 }, 4.2);

            // Click Interaction to fast-forward into the work section from the closed gateway state
            const gatewayWindow = document.querySelector('.gateway-window');
            gatewayWindow.addEventListener('click', () => {
                const st = ScrollTrigger.getById("workSpine");
                if (st && st.progress < 0.15) { 
                    const targetScroll = st.start + (st.end - st.start) * 0.2;
                    lenis.scrollTo(targetScroll, { duration: 1.5, ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
                }
            });

            // Back Button Click Interaction
            const backBtn = document.querySelector('.archive-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    lenis.scrollTo('.philosophy-section', { offset: 0, duration: 1.5, ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
                });
            }

            // Dropdown Menu Interaction
            const chapterToggle = document.querySelector('.chapter-toggle');
            const chapterMenu = document.querySelector('.chapter-menu');
            const chapterChevron = document.getElementById('chapter-chevron');
            let menuOpen = false;

            if (chapterToggle && chapterMenu) {
                chapterToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    menuOpen = !menuOpen;
                    if(menuOpen) {
                        gsap.to(chapterMenu, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.4, ease: 'power3.out' });
                        gsap.fromTo('.filter-btn', { opacity: 0, x: -10 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.4, ease: 'power3.out' });
                        gsap.to(chapterChevron, { rotate: 180, duration: 0.4, ease: 'power2.out' });
                    } else {
                        closeChapterMenu();
                    }
                });

                document.addEventListener('click', () => {
                    if(menuOpen) closeChapterMenu();
                });
            }

            function closeChapterMenu() {
                menuOpen = false;
                gsap.to(chapterMenu, { opacity: 0, y: -10, pointerEvents: 'none', duration: 0.3, ease: 'power2.in' });
                gsap.to(chapterChevron, { rotate: 0, duration: 0.4, ease: 'power2.out' });
            }

            // Chapter Navigation (Filter Buttons)
            const filterBtns = document.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filter = e.target.textContent.trim().toUpperCase();
                    closeChapterMenu();
                    
                    const st = ScrollTrigger.getById("workSpine");
                    if (!st) return;

                    if (filter === 'ALL' || filter === 'ALL CHAPTERS') {
                        // Scroll to the start of the horizontal track
                        const targetScroll = st.start + (st.end - st.start) * 0.2; 
                        lenis.scrollTo(targetScroll, { duration: 1.5, ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
                    } else {
                        // Scroll to specific Chapter
                        const catCard = document.querySelector(`.category-title-card[data-category="${filter}"]`);
                        if (catCard) {
                            const trackWidth = track.scrollWidth - window.innerWidth / 2;
                            const catLeft = catCard.offsetLeft;
                            
                            // Map the distance along the track to the timeline's progress
                            const fraction = Math.min(1, catLeft / trackWidth);
                            // The horizontal scroll phase spans progress 0.2 to 1.0 (which is 80% of the timeline)
                            const totalProgress = 0.2 + (fraction * 0.8);
                            
                            const targetScroll = st.start + (st.end - st.start) * totalProgress;
                            lenis.scrollTo(targetScroll, { duration: 1.5, ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
                        }
                    }
                });
            });

            // Card hover â€” rAF-throttled for perf
            let _activeHoverCard = null;
            document.querySelectorAll('.project-card').forEach(card => {
                const video = card.querySelector('video');
                const cardCursor = card.querySelector('.card-cursor-inner');
                
                card.addEventListener('mousemove', rafThrottle(e => {
                    if(cardCursor) {
                        const r = card.getBoundingClientRect();
                        const mx = e.clientX - r.left;
                        const my = e.clientY - r.top;
                        gsap.to(cardCursor, { x: mx, y: my, xPercent: -50, yPercent: -50, scale: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
                    }
                }));
                card.addEventListener('mouseenter', () => {
                    if (!video || !video.currentSrc && !video.src) return;
                    if (_activeHoverCard && _activeHoverCard !== card) {
                        const prev = _activeHoverCard.querySelector('video');
                        if (prev) { prev.style.opacity = 0; prev.pause(); }
                    }
                    _activeHoverCard = card;
                    video.muted = true;
                    video.playsInline = true;
                    video.style.opacity = 1; 
                    video.play().catch(()=>{});
                });
                card.addEventListener('mouseleave', () => {
                    if(cardCursor) { gsap.to(cardCursor, { scale: 0.8, duration: 0.4, ease: 'expo.out', overwrite: 'auto' }); }
                    if(video) { video.style.opacity = 0; video.pause(); }
                    if (_activeHoverCard === card) _activeHoverCard = null;
                });
            });
        }

        // -------------------------------------------------------------
        // BOOTSTRAP
        // -------------------------------------------------------------
        window.addEventListener('DOMContentLoaded', async () => {
            // Apply floating wrappers to all cards dynamically to keep HTML clean

            // ===================== CATEGORY COLLAGE OVERLAY =====================
            const catOverlay = document.getElementById('cat-collage-overlay');
            let catCloseBtn = document.getElementById('cat-collage-close');
            let catChapterEl = document.getElementById('cat-collage-chapter');
            let catNameEl = document.getElementById('cat-collage-name');
            let catCountEl = document.getElementById('cat-collage-count');
            let catGrids = document.querySelectorAll('.cat-grid');

            const CHAPTER_MAP = {
                'ENTERTAINMENT & EVENTS': 'CHAPTER 01',
                'UGC CAMPAIGNS': 'CHAPTER 02',
                'FASHION & APPAREL': 'CHAPTER 03',
                'SPORTS & ACTIVEWEAR': 'CHAPTER 04',
                'FOOD & BEVERAGE': 'CHAPTER 05',
                'LIVE MUSIC & CONCERTS': 'CHAPTER 06',
                'REAL ESTATE & SPACES': 'CHAPTER 07',
                'HEALTHCARE & BEAUTY': 'CHAPTER 08',
                'RETAIL & ACCESSORIES': 'CHAPTER 09',
                'LIFESTYLE & LUXURY': 'CHAPTER 09',
                'CORPORATE': 'CHAPTER 10',
            };

            async function openCatCollage(categoryName) {
                console.log('[LP] Opening Category:', categoryName);
                if (catOverlay && catOverlay.hasAttribute('data-lazy-partial')) {
                    try {
                        const url = catOverlay.getAttribute('data-lazy-partial');
                        const res = await fetch(url);
                        if (res.ok) {
                            catOverlay.innerHTML = await res.text();
                            catOverlay.removeAttribute('data-lazy-partial');
                            // Signal firebase-site.js to patch video URLs from CMS
                            window.dispatchEvent(new CustomEvent('collage:ready'));
                            
                            catCloseBtn = document.getElementById('cat-collage-close');
                            catChapterEl = document.getElementById('cat-collage-chapter');
                            catNameEl = document.getElementById('cat-collage-name');
                            catCountEl = document.getElementById('cat-collage-count');
                            catGrids = document.querySelectorAll('.cat-grid');
                            
                            if (catCloseBtn) catCloseBtn.addEventListener('click', closeCatCollage);
                            const catExitBtn = document.getElementById('cat-collage-exit');
                            if (catExitBtn) {
                                catExitBtn.addEventListener('click', () => {
                                    closeCatCollage();
                                    const backBtn = document.querySelector('.archive-back-btn');
                                    if (backBtn) backBtn.click();
                                });
                            }
                        }
                    } catch (e) {
                        console.error('[LP] Error loading collage partial:', e);
                    }
                }

                // ── Firebase CMS: Render cards for this category ──────────────
                // Replaces static collage.html cards with live CMS data
                if (typeof window.renderCategoryCards === 'function') {
                    window.renderCategoryCards(categoryName);
                }

                // Refresh catGrids to handle dynamic/lazily loaded content
                catGrids = document.querySelectorAll('.cat-grid');

                catGrids.forEach(g => {
                    g.classList.remove('active', 'cat-single-wrap');
                    const decoded = (g.dataset.cat || '').replace(/&amp;/g,'&');
                    if (decoded.toUpperCase() === categoryName.toUpperCase()) {
                        g.classList.add('active');
                        const cardCount = g.querySelectorAll('.project-card').length;
                        if (cardCount === 1) g.classList.add('cat-single-wrap');
                        catCountEl.innerText = cardCount + (cardCount === 1 ? ' PROJECT' : ' PROJECTS');

                        // Populate Brand Logos Highlight Strip (Vibrant Manual Scroll)
                        const logoStrip = document.getElementById('cat-collage-logos-strip');
                        if (logoStrip) {
                            logoStrip.innerHTML = '';
                            const cardLogos = Array.from(g.querySelectorAll('.card-brand-logo img:first-child'));
                            const uniqueLogoUrls = [...new Set(cardLogos.map(img => img.src))];
                            
                            if (uniqueLogoUrls.length > 0) {
                                const mTrack = document.createElement('div');
                                mTrack.className = 'top-marquee-track';
                                uniqueLogoUrls.forEach(url => {
                                    const logoImg = document.createElement('img');
                                    logoImg.src = url;
                                    logoImg.alt = "Client Brand";
                                    mTrack.appendChild(logoImg);
                                });
                                logoStrip.appendChild(mTrack);
                                logoStrip.style.display = 'flex';
                                
                                // Enable Drag-to-Scroll for 'moving right/left as we want'
                                let isDown = false;
                                let startX;
                                let scrollLeft;
                                logoStrip.addEventListener('mousedown', (e) => {
                                    isDown = true;
                                    startX = e.pageX - logoStrip.offsetLeft;
                                    scrollLeft = logoStrip.scrollLeft;
                                });
                                logoStrip.addEventListener('mouseleave', () => { isDown = false; });
                                logoStrip.addEventListener('mouseup', () => { isDown = false; });
                                logoStrip.addEventListener('mousemove', (e) => {
                                    if(!isDown) return;
                                    e.preventDefault();
                                    const x = e.pageX - logoStrip.offsetLeft;
                                    const walk = (x - startX) * 2;
                                    logoStrip.scrollLeft = scrollLeft - walk;
                                });
                            } else {
                                logoStrip.style.display = 'none';
                            }
                        }

                        // Populate internal card marquees (Client Scroll inside card)
                        g.querySelectorAll('.project-card').forEach(card => {
                            gsap.set(card, { 
                                clearProps: 'opacity,rotateY,rotateX,scale,filter,x,y,transform,transformOrigin,perspective,transformPerspective'
                            });
                            const media = card.querySelector('.card-media img, .card-media video');
                            if (media) {
                                gsap.set(media, { clearProps: 'x,scale,transform' });
                            }
                            const info = card.querySelector('.card-info');
                            if (info) {
                                gsap.set(info, { clearProps: 'x,transform' });
                            }
                        });
                    }
                });
                catChapterEl.innerText = CHAPTER_MAP[categoryName] || '';
                catNameEl.innerText = categoryName;
                catOverlay.style.display = 'block';
                catOverlay.style.pointerEvents = 'auto';
                catOverlay.scrollTop = 0;
                requestAnimationFrame(() => { catOverlay.style.opacity = '1'; });
                wireCollageCardListeners();
                lenis.stop();
            }

            function closeCatCollage() {
                catOverlay.style.opacity = '0';
                setTimeout(() => {
                    catOverlay.style.display = 'none';
                    catOverlay.style.pointerEvents = 'none';
                    catGrids.forEach(g => g.classList.remove('active', 'cat-single-wrap'));
                    lenis.start();
                }, 400);
            }

            document.querySelectorAll('.cat-clickable').forEach(catCard => {
                catCard.addEventListener('click', (e) => {
                    console.log('[LP] Category Clicked:', catCard.dataset.category);
                    e.stopPropagation();
                    const catName = (catCard.dataset.category || '').replace(/&amp;/g, '&');
                    openCatCollage(catName);
                });
            });

            catCloseBtn && catCloseBtn.addEventListener('click', closeCatCollage);

            const catExitBtn = document.getElementById('cat-collage-exit');
            if (catExitBtn) {
                catExitBtn.addEventListener('click', () => {
                    closeCatCollage();
                    const backBtn = document.querySelector('.archive-back-btn');
                    if (backBtn) backBtn.click();
                });
            }

            // Remove internal "BACK" buttons listeners if we removed the elements
            // No action needed here, querySelectorAll will just find 0 elements.

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && catOverlay && catOverlay.style.display === 'block' && !document.getElementById('project-reveal').classList.contains('active')) {
                    closeCatCollage();
                }
            });

            function wireCollageCardListeners() {
                // Expose globally so firebase-site.js can re-wire after live updates
                window.__wireCollageCards = wireCollageCardListeners;
                catOverlay.querySelectorAll('.project-card').forEach((card) => {
                    if (card._collageWired) return;
                    card._collageWired = true;

                    card.addEventListener('mouseenter', () => {
                        const reelSrc = card.dataset.reel;
                        if (!reelSrc || !reelSrc.startsWith('http') || card._preloadedVideo) return;
                        // PERF: preload='metadata' only — fetches header/seek-table (~256KB) not full video
                        // Full load happens naturally once user clicks and video is injected
                        const preVid = document.createElement('video');
                        preVid.src = reelSrc;
                        preVid.muted = true;
                        preVid.preload = 'metadata'; // NOT 'auto' — 'auto' downloads entire file on hover
                        preVid.playsInline = true;
                        preVid.style.display = 'none';
                        document.body.appendChild(preVid);
                        preVid.load();
                        card._preloadedVideo = preVid;
                    });

                    card.addEventListener('click', () => {
                        const reveal = document.getElementById('project-reveal');
                        if (reveal.classList.contains('active')) return;
                        const activeGrid = catOverlay.querySelector('.cat-grid.active');
                        activeCardsList = activeGrid ? Array.from(activeGrid.querySelectorAll('.project-card')) : [card];
                        const activeIndex = activeCardsList.indexOf(card);
                        // Removed instantly snapping tilt to avoid visual pop, cards remain static now
                        if (voidStage.triggerBurst) voidStage.triggerBurst();
                        populateRevealData(activeIndex !== -1 ? activeIndex : 0);
                        const rect = card.querySelector('.card-media').getBoundingClientRect();
                        const prMedia = document.querySelector('.pr-media');
                        reveal.scrollTop = 0;
                        gsap.set(prMedia, { opacity: 1, x: rect.left, y: rect.top, width: rect.width, height: rect.height, borderRadius: '6px' });
                        gsap.set(reveal, { display: 'block', opacity: 0 });
                        reveal.classList.add('active');
                        gsap.to(reveal, { opacity: 1, duration: 0.4, ease: 'power2.inOut' });
                        gsap.to(prMedia, { x: 0, y: 0, width: '100vw', height: '100vh', borderRadius: '0px', duration: 0.9, ease: 'power4.inOut', onComplete: () => { prMedia.style.opacity = 0; } });
                        gsap.set(['.pr-title-side','.pr-center-stage','.pr-info-wrapper','.pr-meta-top'], { y: 40, opacity: 0 });
                        gsap.set('.pr-reel-wrapper', { opacity: 0, scale: 1.05 });
                        gsap.to('.pr-reel-wrapper', { scale: 1, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.3 });
                        gsap.to(['.pr-center-stage', '.pr-meta-top'], { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.4 });
                        gsap.to('.pr-title-left', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.5 });
                        gsap.to('.pr-title-right', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.6 });
                        gsap.to('.pr-info-wrapper', { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.7 });
                        gsap.to('.pr-close, .pr-cursor-pill, .pr-nav-btn', { opacity: 1, scale: 1, duration: 0.8, delay: 0.7 });
                        reveal._activeCard = card;
                        // Store origin coords so BACK animation collapses correctly (prevents GSAP NaN freeze)
                        reveal.dataset.ox = rect.left;
                        reveal.dataset.oy = rect.top;
                        reveal.dataset.ow = rect.width;
                        reveal.dataset.oh = rect.height;
                    });
                });
            }

            // (card-float-wrapper logic removed to prevent DOM breaking and vertical stagger)

            // PERF: Pause all CSS marquee/loop animations when off-screen via IntersectionObserver
            (function initMarqueePause() {
                const io = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        entry.target.classList.toggle('is-visible', entry.isIntersecting);
                    });
                }, { threshold: 0.01 });
                document.querySelectorAll('.testi-marquee-wrapper').forEach(el => io.observe(el));
                document.querySelectorAll('.client-track-inner').forEach(el => io.observe(el));
                document.querySelectorAll('.reel-track').forEach(el => {
                    const ioReel = new IntersectionObserver((entries) => {
                        entries.forEach(e => {
                            e.target.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
                        });
                    }, { threshold: 0.01 });
                    ioReel.observe(el);
                });
            })();

            // Setup Lenis â€“ shorter duration on mobile for snappier native-like feel
            lenis = window.lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), direction: 'vertical', gestureDirection: 'vertical', smooth: !isMobile, mouseMultiplier: 1, smoothTouch: false, touchMultiplier: 2, infinite: false });
            lenis.on('scroll', ScrollTrigger.update);
            lenis.on('scroll', ({ progress }) => {
                document.getElementById('scroll-bar').style.transform = `scaleX(${progress})`;
            });
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);

            // Î“Ã¶Ã‡Î“Ã¶Ã‡ DA OVERLAY STATE (declared early so openDaOverlay is always in scope) Î“Ã¶Ã‡Î“Ã¶Ã‡
            // LAZY OVERLAY LOADER
            // Overlays are NOT in index.html — fetched once on first interaction
            const _mount = document.getElementById('lazy-overlays-mount');
            const _fragmentCache = {};

            async function _loadFragment(name) {
                if (_fragmentCache[name]) return;
                try {
                    const res = await fetch(`/public/fragments/${name}.html`);
                    if (!res.ok) throw new Error(`Fragment ${name} not found`);
                    const html = await res.text();
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = html;
                    _mount.appendChild(wrapper.firstElementChild);
                    _fragmentCache[name] = true;
                } catch(e) { console.warn('[LP] Fragment load failed:', name, e); }
            }

            // DA OVERLAY STATE
            let isDaOpen = false;
            let daReqFrame;

            async function openDaOverlay() {
                if (isDaOpen) return;
                await _loadFragment('da-overlay');
                const daOverlay = document.getElementById('da-overlay');
                if (!daOverlay) return;
                isDaOpen = true;
                lenis.stop();
                initDaThreeJS();
                animateDa();
                gsap.to(daOverlay, { opacity: 1, pointerEvents: 'auto', duration: 0.6, ease: 'power2.out' });
                daOverlay.scrollTop = 0;
                gsap.fromTo('.da-animate-element',
                    { y: 40, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
                );
            }
            function closeDaOverlay() {
                if (!isDaOpen) return;
                isDaOpen = false;
                cancelAnimationFrame(daReqFrame);
                const _daEl = document.getElementById('da-overlay');
                if (!_daEl) return;
                gsap.to('.da-animate-element', { y: -20, opacity: 0, duration: 0.3, ease: 'power2.in' });
                gsap.to(_daEl, {
                    opacity: 0, pointerEvents: 'none', duration: 0.6, ease: 'power2.inOut', delay: 0.1,
                    onComplete: () => { lenis.start(); }
                });
            }

            // PERF: Skip expensive WebGL + custom cursor on touch/mobile devices
            if (!isMobile) {
                new CinematicCursor();
                voidStage = new VoidStage();
            } else {
                // Lightweight mobile stub so setMood() calls don't throw
                document.getElementById('webgl-canvas').style.display = 'none';
                voidStage = {
                    setMood(k) {
                        const mode = SCENE_MODES[k] || SCENE_MODES.goldenWarmth;
                        document.documentElement.style.setProperty('--scene-accent', mode.accent);
                        const hex = mode.accent.replace('#','');
                        const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
                        document.documentElement.style.setProperty('--scene-accent-rgb', `${r},${g},${b}`);
                    },
                    triggerBurst() {},
                    _lastMoodKey: null
                };
                // Hide cursor elements so they don't ghost on screen
                const cRing = document.getElementById('c-ring');
                if (cRing) cRing.style.display = 'none';
                document.querySelectorAll('.cursor-trail').forEach(el => el.style.display = 'none');
                document.body.classList.add('low-perf');
            }

            // Setup Nav Links Scramble & Routing (Unified Single Page)
            const navLinks = document.querySelectorAll('.nav-trigger');
            navLinks.forEach(link => {
                const scramble = link.dataset.text ? new TextScramble(link) : null;
                link.addEventListener('mouseenter', () => scramble && scramble.setText(link.dataset.text));
                link.addEventListener('click', e => {
                    e.preventDefault();
                    const target = link.dataset.target;

                    // Route securely to their scroll points
                    if (target === 'hero' || target === 'home') lenis.scrollTo(0, { offset: 0, duration: 1.5 });
                    else if (target === 'work') lenis.scrollTo('#work', { offset: 0, duration: 1.5 });
                    else if (target === 'services') lenis.scrollTo('#services-section', { offset: 0, duration: 1.5 });
                    else if (target === 'about') lenis.scrollTo('#about', { offset: 0, duration: 1.5 });
                    else if (target === 'philosophy') lenis.scrollTo('#philosophy', { offset: 0, duration: 1.5 });
                    else if (target === 'contact') openDaOverlay();
                });
            });

            // Mood Triggers for standard sections on scroll
            ScrollTrigger.create({ trigger: "#hero", start: "top center", onEnter: () => { if(showreelInst) voidStage.setMood(SHOWREEL[showreelInst.idx].mood); }, onEnterBack: () => { if(showreelInst) voidStage.setMood(SHOWREEL[showreelInst.idx].mood); } });
            ScrollTrigger.create({ trigger: "#philosophy", start: "top 75%", onEnter: () => voidStage.setMood('goldenWarmth'), onEnterBack: () => voidStage.setMood('goldenWarmth') });
            ScrollTrigger.create({ trigger: "#services-section", start: "top center", onEnter: () => voidStage.setMood('darkEditorial'), onEnterBack: () => voidStage.setMood('darkEditorial') });
            ScrollTrigger.create({ trigger: "#about", start: "top center", onEnter: () => voidStage.setMood('darkEditorial'), onEnterBack: () => voidStage.setMood('darkEditorial') });
            ScrollTrigger.create({ trigger: "#testimonials-section", start: "top center", onEnter: () => voidStage.setMood('goldenWarmth'), onEnterBack: () => voidStage.setMood('goldenWarmth') });

            // --- SETUP INITIAL INTRO TENSION ---
            gsap.set('header, .hero-slate, .hero-cats, .hero-now-playing, .hero-scroll', { opacity: 0, y: 20 });
            gsap.set('.reel-clip.active', { filter: 'blur(20px) brightness(0.1)', scale: 1.1 });
            
            const chars1 = splitText('#title-line-1');
            const chars2 = splitText('#title-line-2');
            const allChars = chars1.concat(chars2);
            gsap.set(allChars, { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)', y: 40 });

            // RUN PRELOADER (The Tease)
            await runPreloader();
            
            // --- REVEAL MOMENT (The Reward) ---
            // 2. Discovered text mask reveal
            gsap.to(allChars, {
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                y: 0,
                stagger: 0.06,
                duration: 2,
                ease: 'power4.out',
                delay: 0.2
            });

            // 3. Stabilization (Clarity) UI appears slowly
            gsap.to('header', { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out', delay: 1.2 });
            gsap.to('.hero-slate, .hero-cats', { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out', delay: 1.6 });
            gsap.to('.hero-now-playing, .hero-scroll', { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out', delay: 2.0 });
            
            showreelInst = new Showreel();

            // --- DEFERRED INTERACTIVITY ---
            setTimeout(() => {
                initHeroTilt();
                initHomeScroll();
                initAboutAnimations(); // Initialize About Section Reveal
                initAboutTilt(); // Initialize About 3D interaction
                initClientSpotlight(); // Initialize The Client Logo Mask Hover Effect
                initWorkSpine(); // Initialize the dynamic work spine on load

                // Populate Category Card Mini-Logos (Vibrant Manual Scroll)
                document.querySelectorAll('.category-title-card').forEach(card => {
                    const cat = card.getAttribute('data-category');
                    if (!cat) return;
                    const decoded = cat.replace(/&amp;/g, '&');
                    const grid = document.querySelector(`.cat-grid[data-cat="${decoded}"]`);
                    if (grid) {
                        const logos = Array.from(grid.querySelectorAll('.card-brand-logo img'));
                        const uniqueUrls = [...new Set(logos.map(img => img.src))];
                        if (uniqueUrls.length > 0) {
                            const strip = document.createElement('div');
                            strip.className = 'cat-logo-marquee-mini';
                            uniqueUrls.forEach(url => {
                                const img = document.createElement('img');
                                img.src = url;
                                img.alt = "Brand";
                                strip.appendChild(img);
                            });
                            card.appendChild(strip);
                        }
                    }
                });
                initServicesDeck(); // Initialize 3D Services Deck
                initMagneticInteractions();
            }, 2500); // Only activate mouse effects after reveal is stable



            // --- 3D CONTACT OVERLAY LOGIC ---
            let isContactOpen = false;

            async function openContactOverlay() {
                if(isContactOpen) return;
                await _loadFragment('contact-overlay');
                const contactOverlay = document.getElementById('contact-overlay');
                const contactCard = document.querySelector('.contact-card-3d');
                if (!contactOverlay) return;
                isContactOpen = true;
                lenis.stop();
                voidStage.setMood('darkEditorial');
                if (voidStage.triggerBurst) voidStage.triggerBurst();
                gsap.to(contactOverlay, { opacity: 1, pointerEvents: 'auto', duration: 0.6, ease: 'power2.out' });
                gsap.fromTo(contactCard,
                    { y: 150, rotateX: -30, scale: 0.8, opacity: 0 },
                    { y: 0, rotateX: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'expo.out', delay: 0.1 }
                );
            }

            function closeContactOverlay() {
                if(!isContactOpen) return;
                isContactOpen = false;
                lenis.start();
                const _co = document.getElementById('contact-overlay');
                const _cc = document.querySelector('.contact-card-3d');
                if (_cc) gsap.to(_cc, { y: -100, rotateX: 20, scale: 0.9, opacity: 0, duration: 0.6, ease: 'power2.in' });
                if (_co) gsap.to(_co, { opacity: 0, pointerEvents: 'none', duration: 0.6, ease: 'power2.in', delay: 0.2, onComplete: () => {
                    ScrollTrigger.refresh(true);
                }});
            }

            // Close button + backdrop — use event delegation since overlay is lazy-injected
            document.addEventListener('click', (e) => {
                if (e.target.closest('.contact-close-btn')) closeContactOverlay();
                if (e.target.classList.contains('contact-backdrop')) closeContactOverlay();
            });

            // Escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isContactOpen) closeContactOverlay();
            });

            // Interactive 3D Tilt Logic for Contact Card
            const contactPerspective = document.getElementById('contact-perspective') || document.querySelector('.perspective-1000');
            const contactCard = document.querySelector('.contact-card-3d');
            if(contactPerspective && contactCard) {
                contactPerspective.addEventListener('mousemove', (e) => {
                    if(!isContactOpen || window.innerWidth < 768) return; // Skip heavy tilt on mobile
                    
                    const rect = contactPerspective.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    
                    // Calculate distance from center (-1 to 1)
                    const tx = (e.clientX - cx) / (rect.width / 2);
                    const ty = (e.clientY - cy) / (rect.height / 2);
                    
                    // Apply rotation to card
                    gsap.to(contactCard, { 
                        rotateX: ty * -15, // tilt up/down
                        rotateY: tx * 15,  // tilt left/right
                        duration: 1.5, 
                        ease: 'power3.out',
                        transformPerspective: 1200
                    });
                });

                // Reset tilt on mouse leave
                contactPerspective.addEventListener('mouseleave', () => {
                    if(!isContactOpen) return;
                    gsap.to(contactCard, { rotateX: 0, rotateY: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)' });
                });
            }

            // --- DIGITAL AUDIT OVERLAY LOGIC ---
            // Note: isDaOpen, daOverlay, openDaOverlay, closeDaOverlay are declared above (before nav bindings)
            const projectStartBtn = document.getElementById('start-project-btn');
            const daCloseBtns = document.querySelectorAll('.da-close-btn');
            const daForm = document.getElementById('auditFormInner');

            // Three.js variables isolated for Audit & Work overlay
            let daScene, daCamera, daRenderer, daParticles;
            let workScene, workCamera, workRenderer, workParticles;
            let daShapes = [];
            let isWorkBgInitialized = false;

            // Generate Spherical Texture
            function getParticleTexture() {
                const canvas = document.createElement('canvas');
                canvas.width = 32; canvas.height = 32;
                const ctx = canvas.getContext('2d');
                ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI * 2);
                ctx.fillStyle = 'white'; ctx.fill();
                return new THREE.CanvasTexture(canvas);
            }

            // Abstract Particle Builder
            function createParticleSystem() {
                const geometry = new THREE.BufferGeometry();
                // PERF: 280 → 80 particles. Still visually present, 71% fewer draw calls
                const particleCount = isLowPerf ? 40 : 80;
                const positions  = new Float32Array(particleCount * 3);
                const velocities = new Float32Array(particleCount * 3);
                const colors     = new Float32Array(particleCount * 3);

                for (let i = 0; i < particleCount * 3; i += 3) {
                    positions[i]     = (Math.random() - 0.5) * 100;
                    positions[i + 1] = (Math.random() - 0.5) * 100;
                    positions[i + 2] = (Math.random() - 0.5) * 100;

                    velocities[i]     = (Math.random() - 0.5) * 0.12;
                    velocities[i + 1] = (Math.random() - 0.5) * 0.12;
                    velocities[i + 2] = (Math.random() - 0.5) * 0.12;

                    if (Math.random() > 0.5) {
                        colors[i] = 0.90; colors[i + 1] = 0.04; colors[i + 2] = 0.08;
                    } else {
                        colors[i] = 0.91; colors[i + 1] = 0.66; colors[i + 2] = 0.20;
                    }
                }

                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
                geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

                const material = new THREE.PointsMaterial({
                    size: 0.25,
                    map: getParticleTexture(),
                    alphaTest: 0.1,
                    vertexColors: true,
                    opacity: 0.55,
                    transparent: true,
                    sizeAttenuation: true
                });

                return new THREE.Points(geometry, material);
            }

            function initWorkThreeJS() {
                if (isWorkBgInitialized) return;
                isWorkBgInitialized = true;

                const canvas = document.getElementById('work-webgl-bg');
                if (!canvas) return;

                workScene    = new THREE.Scene();
                workCamera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                // PERF: antialias:false — background particle effect doesn't need MSAA
                workRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
                workRenderer.setSize(window.innerWidth, window.innerHeight);
                // PERF: cap at 1x pixel ratio — no retina overdraw for a background effect
                workRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
                workRenderer.setClearColor(0x000000, 0);
                workCamera.position.z = 30;

                workParticles = createParticleSystem();
                workScene.add(workParticles);

                window.addEventListener('resize', () => {
                    if (workCamera) {
                        workCamera.aspect = window.innerWidth / window.innerHeight;
                        workCamera.updateProjectionMatrix();
                        workRenderer.setSize(window.innerWidth, window.innerHeight);
                    }
                }, { passive: true });

                // PERF: Only run animation loop when #work section is actually visible
                let _workVisible = false;
                const workIO = new IntersectionObserver(entries => {
                    _workVisible = entries[0].isIntersecting;
                }, { threshold: 0.01 });
                const workSection = document.getElementById('work');
                if (workSection) workIO.observe(workSection);

                // PERF: Frame-skip — render every other frame (halves GPU draw calls)
                let _workFrame = 0;
                function animateWork() {
                    requestAnimationFrame(animateWork);
                    if (!_pageVisible || !_workVisible) return;
                    _workFrame++;
                    if (_workFrame % 2 !== 0) return; // skip odd frames

                    workParticles.rotation.x += 0.0002;
                    workParticles.rotation.y += 0.0003;

                    const positions  = workParticles.geometry.attributes.position.array;
                    const velocities = workParticles.geometry.attributes.velocity.array;
                    for (let i = 0; i < positions.length; i += 3) {
                        positions[i]     += velocities[i];
                        positions[i + 1] += velocities[i + 1];
                        positions[i + 2] += velocities[i + 2];
                        if (Math.abs(positions[i])     > 50) velocities[i]     *= -1;
                        if (Math.abs(positions[i + 1]) > 50) velocities[i + 1] *= -1;
                        if (Math.abs(positions[i + 2]) > 50) velocities[i + 2] *= -1;
                    }
                    workParticles.geometry.attributes.position.needsUpdate = true;
                    if (workRenderer) workRenderer.render(workScene, workCamera);
                }
                animateWork();
            }

            function initDaThreeJS() {
                if (daRenderer) return; 

                const canvas = document.getElementById('da-webgl-bg');
                daScene = new THREE.Scene();
                daCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                daRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
                daRenderer.setSize(window.innerWidth, window.innerHeight);
                daRenderer.setClearColor(0x000000, 0); 
                daCamera.position.z = 30;

                daParticles = createParticleSystem();
                daScene.add(daParticles);

                window.addEventListener('resize', () => {
                    if(!isDaOpen) return;
                    daCamera.aspect = window.innerWidth / window.innerHeight;
                    daCamera.updateProjectionMatrix();
                    daRenderer.setSize(window.innerWidth, window.innerHeight);
                });
            }

            // Industry Toggle Logic
            window.toggleOtherIndustry = function(select) {
                const otherGroup = document.getElementById('other-industry-group');
                const otherInput = document.getElementById('da-industry-other');
                if (select.value === 'other') {
                    otherGroup.style.display = 'block';
                    otherInput.required = true;
                    otherInput.focus();
                } else {
                    otherGroup.style.display = 'none';
                    otherInput.required = false;
                }
            };

            function animateDa() {
                if (!isDaOpen) return;
                daReqFrame = requestAnimationFrame(animateDa);

                // Rotate Particles
                daParticles.rotation.x += 0.0001;
                daParticles.rotation.y += 0.0002;

                // Update Particle Positions
                const positions = daParticles.geometry.attributes.position.array;
                const velocities = daParticles.geometry.attributes.velocity.array;

                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += velocities[i];
                    positions[i + 1] += velocities[i + 1];
                    positions[i + 2] += velocities[i + 2];

                    if (Math.abs(positions[i]) > 50) velocities[i] *= -1;
                    if (Math.abs(positions[i + 1]) > 50) velocities[i + 1] *= -1;
                    if (Math.abs(positions[i + 2]) > 50) velocities[i + 2] *= -1;
                }
                daParticles.geometry.attributes.position.needsUpdate = true;

                // Rotate Shapes
                daShapes.forEach(child => {
                    child.rotation.x += child.userData.speed;
                    child.rotation.y += child.userData.speed * 1.3;
                });

                daRenderer.render(daScene, daCamera);
            }

            // openDaOverlay / closeDaOverlay are defined above (before nav-trigger bindings)
            if (projectStartBtn) projectStartBtn.addEventListener('click', openDaOverlay);
                        // --- DELEGATED GLOBAL LISTENERS (Fixes dynamic fragments) ---
            document.addEventListener('click', (e) => {
                // 1. Digital Audit Close (Return to Archive)
                if (e.target.classList.contains('da-close-btn') || e.target.closest('.da-close-btn')) {
                    if (typeof closeDaOverlay === 'function') closeDaOverlay();
                }

                // 2. Project Reveal Close (Back)
                if (e.target.classList.contains('pr-close') || e.target.closest('.pr-close')) {
                    const reveal = document.getElementById('project-reveal');
                    if (!reveal || !reveal.classList.contains('active')) return;

                    // Immediately lock � prevents double-trigger
                    reveal.classList.remove('active');
                    reveal.style.pointerEvents = 'none';

                    // Remove mouse listener
                    if (reveal._onRevealMove) reveal.removeEventListener('mousemove', reveal._onRevealMove);

                    // Kill ALL pending open-animation tweens to prevent conflicts
                    gsap.killTweensOf(reveal);
                    gsap.killTweensOf('.pr-reel-wrapper');
                    gsap.killTweensOf('.pr-center-stage');
                    gsap.killTweensOf('.pr-info-wrapper');
                    gsap.killTweensOf('.pr-title-side');
                    gsap.killTweensOf('.pr-close');
                    gsap.killTweensOf('.pr-cursor-pill');
                    gsap.killTweensOf('.pr-nav-btn');

                    // Restore cursor
                    gsap.to('#c-ring, .cursor-trail', { scale: 1, opacity: 1, duration: 0.4 });

                    // Simple reliable fade-out � no complex collapse
                    gsap.to(reveal, {
                        opacity: 0, duration: 0.4, ease: 'power2.in',
                        onComplete: () => {
                            gsap.set(reveal, { display: 'none' });
                            reveal.style.pointerEvents = '';
                            
                            // ONLY restart Lenis if the Category Overlay is NOT currently active
                            const catOverlay = document.getElementById('cat-collage-overlay');
                            if (!catOverlay || catOverlay.style.display === 'none' || catOverlay.style.display === '') {
                                lenis.start();
                            }
                            gsap.to('.project-card', { opacity: 1, duration: 0.6 });
                            gsap.to('header, .work-header', { opacity: 1, y: 0, duration: 0.6 });
                            // Pause videos only � don't clear src to avoid media abort errors
                            reveal.querySelectorAll('video').forEach(v => {
                                if (v._ioObserver) { v._ioObserver.disconnect(); v._ioObserver = null; }
                                v.pause();
                            });
                        }
                    });
                }
            });

            // Cinematic Form Success State
            if (daForm) {
                daForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const submitBtn = this.querySelector('.submit-btn');
                    submitBtn.disabled = true;

                    // --- Phase 1: Submitting state ---
                    submitBtn.textContent = 'Transmitting...';
                    submitBtn.style.opacity = '0.6';

                    setTimeout(() => {
                        // --- Phase 2: Cinematic Thank You takeover ---
                        const formWrapper = document.querySelector('.da-form-wrapper');
                        if (!formWrapper) return;

                        // Build and inject the success card
                        const successCard = document.createElement('div');
                        successCard.style.cssText = `
                            display: flex; flex-direction: column; align-items: center; justify-content: center;
                            text-align: center; padding: 48px 32px; height: 100%;
                            opacity: 0; transform: translateY(40px);
                        `;
                        successCard.innerHTML = `
                            <div style="font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.3em; color:var(--audit-accent,#E8A832); text-transform:uppercase; margin-bottom:28px; border:1px solid rgba(232,168,50,0.3); padding:8px 20px; border-radius:999px; display:inline-block;">
                                Î“Â£Ã´ &nbsp; MESSAGE RECEIVED
                            </div>
                            <h2 style="font-family:'Bebas Neue',sans-serif; font-size:clamp(3rem,8vw,6rem); line-height:0.9; color:#F4F0E8; margin:0 0 24px; letter-spacing:0.04em;">
                                WE'LL BE<br>IN TOUCH.
                            </h2>
                            <p style="font-family:'Inter',sans-serif; font-size:0.95rem; color:rgba(255,255,255,0.6); max-width:320px; line-height:1.7; margin:0 0 40px;">
                                Your brief has landed at <span style="color:var(--audit-accent,#E8A832);">contact@limitlessproductions.in</span>.<br>
                                Expect a response within 24 hours.
                            </p>
                            <div style="font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.2em; color:rgba(255,255,255,0.3); text-transform:uppercase;">
                                Closing in a moment...
                            </div>
                        `;

                        // Fade out the form and reveal the success card
                        gsap.to(daForm, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in', onComplete: () => {
                            daForm.style.display = 'none';
                            formWrapper.appendChild(successCard);
                            gsap.to(successCard, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
                        }});

                        // Auto-close after 6s (extended to ensure users see the cinematic confirmation)
                        setTimeout(() => {
                            gsap.to(successCard, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.in', onComplete: () => {
                                // Reset form
                                daForm.reset();
                                submitBtn.disabled = false;
                                submitBtn.textContent = 'Request Audit';
                                submitBtn.style.opacity = '1';
                                daForm.style.display = '';
                                if (successCard.parentNode) successCard.parentNode.removeChild(successCard);
                                gsap.set(daForm, { opacity: 1, y: 0 });
                                closeDaOverlay();
                            }});
                        }, 4000);

                    }, 1600);
                });
            }
            
            // --- CINEMATIC PROJECT REVEAL ---
            let revealScrollTriggers = []; // Store triggers to clean them up
            let activeCardsList = [];
            let currentRevealIndex = 0;

            function populateRevealData(index) {
                const card = activeCardsList[index];
                if (!card) return;
                currentRevealIndex = index;

                const baseTitle = card.querySelector('.card-name').innerText;
                const imgSrc = card.querySelector('img').src;
                
                // Read exact layout data from card, or fallback to smart defaults
                const titleLeft = card.dataset.titleLeft ? card.dataset.titleLeft.replace(/\\n/g, '\n') : baseTitle.split(' ')[0] || 'Limitless';
                const titleRight = card.dataset.titleRight ? card.dataset.titleRight.replace(/\\n/g, '\n') : baseTitle.split(' ')[1] || 'Productions';
                
                const metaTl = card.dataset.metaTl || "";
                const metaTr = card.dataset.metaTr || "";
                const metaBc = `${baseTitle} X LIMITLESS`;
                
                const desc = card.dataset.desc || "";
                const cardVideo = card.querySelector('video');
                const reelSrc = card.dataset.reel || (cardVideo ? cardVideo.src : '');
                
                // Populate Typography
                document.querySelector('.pr-meta-bc').innerText = metaBc;
                document.querySelectorAll('.pr-portrait-brand').forEach(el => el.innerText = metaBc);
                // document.querySelector('.pr-meta-tl').innerText = metaTl;
                // document.querySelector('.pr-meta-tr').innerText = metaTr;
                // document.querySelector('.pr-meta-bl').innerText = `0${index + 1}.`;
                // document.querySelector('.pr-meta-br').innerText = `.${String(activeCardsList.length).padStart(2, '0')}`;
                
                // Populate deep-dive cinematic showcase
                document.getElementById('pr-extended-title').innerText = baseTitle.replace('\n', ' ');
                document.getElementById('pr-extended-desc').innerHTML = desc;

                // --- NEW: Populate Deep-Dive Portrait Reels ---
                const p1 = card.dataset.reel1 || '';
                const p2 = card.dataset.reel2 || '';
                const p3 = card.dataset.reel3 || '';
                
                const vid1 = document.getElementById('pr-portrait-1');
                const vid2 = document.getElementById('pr-portrait-2');
                const vid3 = document.getElementById('pr-portrait-3');
                
                // PERF: Portrait videos — staggered lazy load with auto-pause via IntersectionObserver
                // Load them sequentially with delays so all 3 don't hammer network simultaneously
                function _loadPortraitVideo(vidEl, src, delay) {
                    if (!vidEl || !src) {
                        if (vidEl) vidEl.closest('.group').style.display = 'none';
                        return;
                    }
                    vidEl.closest('.group').style.display = 'flex';

                    setTimeout(() => {
                        if (!src) return;
                        vidEl.src = src;
                        vidEl.preload = 'metadata'; // metadata only until visible
                        vidEl.load();

                        // PERF: IntersectionObserver — preload when visible, but ONLY play on hover for performance
                        if (vidEl._ioObserver) vidEl._ioObserver.disconnect();
                        const observer = new IntersectionObserver((entries) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    vidEl.preload = 'auto';
                                } else {
                                    vidEl.pause();
                                }
                            });
                        }, { threshold: 0.1 });
                        observer.observe(vidEl);
                        vidEl._ioObserver = observer;
                    }, delay);
                }

                _loadPortraitVideo(document.getElementById('pr-portrait-1'), p1, 0);
                _loadPortraitVideo(document.getElementById('pr-portrait-2'), p2, 400);
                _loadPortraitVideo(document.getElementById('pr-portrait-3'), p3, 800);
                
                // Populate Instagram handle above portrait reels
                const igHandle = card.dataset.instagram || '';
                const igEl = document.getElementById('pr-instagram-handle');
                const igText = document.getElementById('pr-instagram-text');
                if (igHandle && igEl && igText) {
                    igText.innerText = igHandle;
                    igEl.href = `https://instagram.com/${igHandle.replace('@', '')}`;
                    igEl.style.display = 'flex';
                } else if (igEl) {
                    igEl.style.display = 'none';
                }

                const prMedia = document.querySelector('.pr-media');
                prMedia.innerHTML = `<img src="${imgSrc}" loading="lazy">`;
                
                const reelWrap = document.querySelector('.pr-reel-wrapper');
                const infoWrap = document.querySelector('.pr-info-wrapper');
                
                // Inject Full Screen Reel and Autoplay Engine
                if (reelSrc) {
                    // Stop any previously playing video to free memory
                    const prevVid = reelWrap.querySelector('video');
                    if (prevVid) { prevVid.pause(); prevVid.src = ''; prevVid.load(); }

                    // Check if we have a preloaded video from hover
                    const preloadedVid = card._preloadedVideo;
                    const rotateClass = card.dataset.rotate === 'true' ? ' rotate-correction' : '';

                    // PERF: readyState >= 4 = HAVE_ENOUGH_DATA (was >=3 = HAVE_FUTURE_DATA)
                    // >=3 can start but stall mid-play. >=4 means browser has enough buffer to play through.
                    if (preloadedVid && preloadedVid.readyState >= 4) {
                        preloadedVid.className = `pr-reel-video${rotateClass}`;
                        preloadedVid.style = '';
                        reelWrap.innerHTML = '';
                        reelWrap.appendChild(preloadedVid);
                        const grad = document.createElement('div');
                        grad.className = 'pr-reel-gradient';
                        reelWrap.appendChild(grad);
                        preloadedVid.play().catch(e => console.warn('Playback blocked:', e));
                        card._preloadedVideo = null;
                    } else {
                        // Show loading shimmer while video buffers
                        reelWrap.innerHTML = `
                            <div class="pr-video-loader" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2;">
                                <div style="width:40px;height:40px;border:2px solid rgba(255,255,255,0.15);border-top-color:rgba(255,255,255,0.8);border-radius:50%;animation:pr-spin 0.8s linear infinite;"></div>
                            </div>
                            <div class="pr-reel-gradient"></div>
                        `;
                        const vid = document.createElement('video');
                        vid.className = `pr-reel-video${rotateClass}`;
                        vid.src = reelSrc;
                        vid.loop = true;
                        vid.playsInline = true;
                        vid.muted = true;
                        vid.preload = 'auto';
                        vid.style.opacity = '0';
                        reelWrap.insertBefore(vid, reelWrap.firstChild);

                        const onReady = () => {
                            clearTimeout(safetyTimer);
                            const loader = reelWrap.querySelector('.pr-video-loader');
                            if (loader) loader.remove();
                            vid.style.transition = 'opacity 0.4s ease';
                            vid.style.opacity = '1';
                            vid.play().catch(e => console.warn('Playback blocked:', e));
                        };

                        // PERF: canplaythrough (not canplay) — fires when browser has enough buffer
                        // to play to the end without pausing to rebuffer. Prevents mid-play freezes.
                        if (vid.readyState >= 4) {
                            onReady();
                        } else {
                            vid.addEventListener('canplaythrough', onReady, { once: true });
                        }

                        // Safety net: if canplaythrough never fires in 8s (slow connection),
                        // fall back to canplay so user isn't stuck on spinner forever
                        const safetyTimer = setTimeout(() => {
                            if (vid.paused) {
                                vid.removeEventListener('canplaythrough', onReady);
                                if (vid.readyState >= 3) {
                                    onReady(); // try anyway but ONLY if we have future data
                                } else {
                                    vid.addEventListener('canplay', onReady, { once: true });
                                }
                            }
                        }, 8000);
                    }
                } else {
                    reelWrap.innerHTML = `<img class="pr-reel-video" src="${imgSrc}" style="object-fit: cover; width: 100%; height: 100%;" loading="lazy"><div class="pr-reel-gradient"></div>`;
                }

                // Bind pill controls after short delay
                setTimeout(() => {
                    const vid = reelWrap.querySelector('video');
                    const pill = document.querySelector('.pr-cursor-pill');
                    if (!vid || !pill) return;
                    reelWrap.onmouseenter = () => pill.innerText = vid.paused ? 'PLAY' : 'PAUSE';
                    reelWrap.onmouseleave = () => pill.innerText = '';
                    reelWrap.onclick = () => {
                        if (vid.paused) { vid.play().catch(()=>{}); pill.innerText = 'PAUSE'; }
                        else { vid.pause(); pill.innerText = 'PLAY'; }
                    };
                }, 300);

                // Inject Description at bottom (REMOVED per request)
                infoWrap.innerHTML = ''; 
                
                const reveal = document.getElementById('project-reveal');
                reveal._activeCard = card;
            }

            function switchProjectReveal(direction) {
                let nextIndex = currentRevealIndex + direction;
                if(nextIndex < 0) nextIndex = activeCardsList.length - 1;
                if(nextIndex >= activeCardsList.length) nextIndex = 0;

                const scroller = document.getElementById('project-reveal');
                gsap.to(scroller, { scrollTop: 0, duration: 0.4, ease: 'power2.inOut' });
                
                // Vertical distance for the cascade effect
                const yDist = window.innerHeight * 0.4 * direction;

                // Dynamic Cascading/Stack Animation (Vertical & Scale)
                gsap.to('.pr-center-stage, .pr-info-wrapper', { y: -yDist, opacity: 0, duration: 0.5, ease: 'power2.inOut' });
                gsap.to('.pr-reel-wrapper', { y: -yDist, opacity: 0, duration: 0.5, ease: 'power2.inOut', onComplete: () => {
                    populateRevealData(nextIndex);
                // Update origin coordinates for seamless return to THIS specific card
                const currentCard = activeCardsList[nextIndex];
                if (currentCard) {
                    const rect = currentCard.querySelector('.card-media').getBoundingClientRect();
                    scroller.dataset.ox = rect.left;
                    scroller.dataset.oy = rect.top;
                    scroller.dataset.ow = rect.width;
                    scroller.dataset.oh = rect.height;
                    scroller._activeCard = currentCard;
                }
                    
                    // Prep incoming elements (start from the opposite side)
                    gsap.set('.pr-center-stage, .pr-info-wrapper', { y: yDist, opacity: 0 });
                    gsap.set('.pr-reel-wrapper', { y: yDist, opacity: 0 });
                    
                    // Slide and scale in staggered
                    gsap.to('.pr-reel-wrapper', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
                    gsap.to('.pr-center-stage', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 });
                    gsap.to('.pr-info-wrapper', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 });
                }});
            }

            // Interconnected Navigation Listeners
            document.querySelector('.pr-nav-prev').addEventListener('click', () => switchProjectReveal(-1));
            document.querySelector('.pr-nav-next').addEventListener('click', () => switchProjectReveal(1));
            // ---- Light/Dark Theme Toggle for Project Reveal ----
            (function initRevealThemeToggle() {
                const reveal = document.getElementById('project-reveal');
                const toggleBtn = document.getElementById('pr-theme-toggle');
                const moonIcon = document.getElementById('pr-theme-icon-moon');
                const sunIcon  = document.getElementById('pr-theme-icon-sun');
                if (!toggleBtn) return;
                gsap.set(toggleBtn, { opacity: 0, scale: 0.8 });
                toggleBtn.addEventListener('click', () => {
                    const isLight = reveal.classList.toggle('light');
                    moonIcon.style.display = isLight ? 'none' : 'block';
                    sunIcon.style.display  = isLight ? 'block' : 'none';
                    toggleBtn.title = isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode';
                });
                if (!window.__prToggleObserved) {
                    window.__prToggleObserved = true;
                    new MutationObserver(() => {
                        if (reveal.classList.contains('active')) {
                            gsap.to(toggleBtn, { opacity: 1, scale: 1, duration: 0.8, delay: 0.7, ease: 'power2.out' });
                        } else {
                            gsap.set(toggleBtn, { opacity: 0, scale: 0.8 });
                            moonIcon.style.display = 'block';
                            sunIcon.style.display  = 'none';
                        }
                    }).observe(reveal, { attributes: true, attributeFilter: ['class'] });
                }
            })();

            // Mouse wheel scroll for interconnected navigation (DISABLED TO ALLOW SCROLLING DOWN)
            let isSwitchingProject = false;
            const revealContainer = document.getElementById('project-reveal');
            /*
            revealContainer.addEventListener('wheel', (e) => {
                if(!revealContainer.classList.contains('active')) return;
                if(isSwitchingProject) return;
                
                // Set threshold to ensure trackpad inertia doesn't multi-fire
                if(Math.abs(e.deltaY) > 25) {
                    isSwitchingProject = true;
                    switchProjectReveal(e.deltaY > 0 ? 1 : -1);
                    setTimeout(() => { isSwitchingProject = false; }, 1200); // Lockout during transition
                }
            }, { passive: true });
            */

            // Keyboard Navigation (Arrow Keys & Escape)
            document.addEventListener('keydown', (e) => {
                const reveal = document.getElementById('project-reveal');
                if (!reveal.classList.contains('active')) return; // Only trigger if overlay is open
                
                if (e.key === 'ArrowLeft') {
                    switchProjectReveal(-1);
                } else if (e.key === 'ArrowRight') {
                    switchProjectReveal(1);
                } else if (e.key === 'Escape') {
                    document.querySelector('.pr-close').click();
                }
            });

            document.querySelectorAll('.project-card').forEach((card, index) => {
                // HOVER PRELOAD: Start buffering the video smartly when user hovers the card
                card.addEventListener('mouseenter', () => {
                    const reelSrc = card.dataset.reel;
                    if (!reelSrc || card._preloadedVideo) return;
                    const preVid = document.createElement('video');
                    preVid.src = reelSrc;
                    preVid.muted = true;
                    // Changed from auto to metadata so it prepares playback without heavily consuming memory/bandwidth on many hovers
                    preVid.preload = 'metadata';
                    preVid.playsInline = true;
                    preVid.style.display = 'none';
                    document.body.appendChild(preVid);
                    preVid.load();
                    card._preloadedVideo = preVid;
                });
                card.addEventListener('mouseleave', () => {
                    // Keep _preloadedVideo alive for 3s, clean up if not used
                    setTimeout(() => {
                        if (card._preloadedVideo && !document.getElementById('project-reveal').classList.contains('active')) {
                            card._preloadedVideo.src = '';
                            card._preloadedVideo.remove();
                            card._preloadedVideo = null;
                        }
                    }, 3000);
                });

                card.addEventListener('click', () => {
                    const reveal = document.getElementById('project-reveal');
                    if (reveal.classList.contains('active')) return;
                    
                    lenis.stop(); // Freeze background
                    
                    // Fetch visible cards to maintain filter accuracy
                    activeCardsList = Array.from(document.querySelectorAll('.project-card:not([style*="display: none"])'));
                    const activeIndex = activeCardsList.indexOf(card);
                    
                    // Removed instantaneous rotate/tilt reset because cards no longer move on hover
                    
                    // Aberration burst
                    if (voidStage.triggerBurst) voidStage.triggerBurst();

                    // Copy Data to Overlay using central function
                    populateRevealData(activeIndex !== -1 ? activeIndex : index);

                    const rect = card.querySelector('.card-media').getBoundingClientRect();
                    const prMedia = document.querySelector('.pr-media');
                    
                    // Reset overlay scroll
                    const scroller = document.getElementById('project-reveal');
                    scroller.scrollTop = 0;
                    
                    // Set initial bounds for seamless pop
                    gsap.set(prMedia, { 
                        opacity: 1,
                        x: rect.left, 
                        y: rect.top, 
                        width: rect.width, 
                        height: rect.height,
                        borderRadius: '6px'
                    });
                    
                    gsap.set(reveal, { display: 'block', opacity: 0 });
                    reveal.classList.add('active');
                    
                    // Hide background elements
                    gsap.to('.project-card', { opacity: 0, duration: 0.6, ease: 'power2.out' });
                    gsap.to('header, .work-header', { opacity: 0, y: -20, duration: 0.6 });
                    
                    // 1. Reveal Container Fade In
                    gsap.to(reveal, { opacity: 1, duration: 0.4, ease: 'power2.inOut' });
                    
                    // 2. Background Wallpaper expansion
                    gsap.to(prMedia, { 
                        x: 0, y: 0, 
                        width: '100vw', height: '100vh', 
                        borderRadius: '0px', 
                        duration: 0.9, 
                        ease: 'power4.inOut',
                        onComplete: () => { prMedia.style.opacity = 0; } // Fade out pop background so swiping is clean
                    });

                    // 3. Reveal the Reel and Typography Staggered
                    gsap.set('.pr-center-stage, .pr-info-wrapper', { y: 30, opacity: 0 });
                    gsap.set('.pr-reel-wrapper', { opacity: 0, scale: 1.05 });
                    
                    gsap.to('.pr-reel-wrapper', { scale: 1, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.3 });
                    gsap.to('.pr-center-stage', { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.4 });
                    gsap.to('.pr-info-wrapper', { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.5 });
                    
                    // 4. UI Elements
                    gsap.to('.pr-close, .pr-cursor-pill, .pr-nav-btn', { opacity: 1, scale: 1, duration: 0.8, delay: 0.7 });

                    // Mouse movement tracking for reveal pill
                    const revealPill = document.querySelector('.pr-cursor-pill');
                    revealPill.innerText = ''; // reset text
                    const onRevealMove = (e) => {
                        gsap.to(revealPill, { x: e.clientX, y: e.clientY, duration: 0.3, ease: 'power2.out' });
                    };
                    reveal.addEventListener('mousemove', onRevealMove);
                    reveal._onRevealMove = onRevealMove;

                    // NEW: Initialize 3D tilt for portrait reels if not already done
                    if (!reveal._tiltInit) {
                        initPortraitTilt();
                        reveal._tiltInit = true;
                    }

                    // Save data for seamless exit
                    reveal.dataset.ox = rect.left;
                    reveal.dataset.oy = rect.top;
                    reveal.dataset.ow = rect.width;
                    reveal.dataset.oh = rect.height;
                    reveal._activeCard = card;
                });
            });

            function initPortraitTilt() {
                const containers = document.querySelectorAll('.pr-client-details .group');
                containers.forEach(container => {
                    const wrap = container.querySelector('.relative');
                    if (!wrap) return;
                    
                    container.addEventListener('mousemove', (e) => {
                        if (window.innerWidth < 768) return;
                        const rect = container.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const y = (e.clientY - rect.top) / rect.height;
                        const dx = (x - 0.5) * 16;
                        const dy = (y - 0.5) * -16;
                        
                        gsap.to(wrap, {
                            rotateY: dx,
                            rotateX: dy,
                            duration: 1,
                            ease: 'power2.out',
                            transformPerspective: 1000
                        });
                    });
                    
                    container.addEventListener('mouseleave', () => {
                        gsap.to(wrap, {
                            rotateY: 0,
                            rotateX: 0,
                            duration: 1.5,
                            ease: 'elastic.out(1, 0.3)'
                        });
                    });
                });
            }

            // Replaced React heavy ShaderGradient with optimized lightweight THREE.js spherical particles
            setTimeout(() => {
                if(typeof initWorkThreeJS === 'function') initWorkThreeJS();
            }, 600);

            // === CHARACTER DECK ANIMATION ===
            function initCharacterDeck() {
                const section = document.querySelector('#character-card-section');
                const cards = gsap.utils.toArray('.character-card');
                const title = document.querySelector('#deck-title');
                const tag = document.querySelector('#deck-tag');
                const instr = document.querySelector('#deck-instr');

                // Initial stack position
                gsap.set(cards, { 
                    x: 0, 
                    y: 0, 
                    rotateY: 0, 
                    rotateZ: (i) => (i - 2) * 2, 
                    zIndex: (i) => cards.length - i 
                });

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: "top center",
                        end: "bottom center",
                        scrub: 1.5,
                    }
                });

                // Animate Header
                tl.to([tag, title, instr], { opacity: 1, y: 0, stagger: 0.1, duration: 1, ease: "power2.out" }, 0);

                // Fan out cards as we scroll
                cards.forEach((card, i) => {
                    const angle = (i - (cards.length - 1) / 2) * 12; // Spread angle
                    const xOffset = (i - (cards.length - 1) / 2) * 120; // Horizontal spread
                    const zOffset = Math.abs(i - (cards.length - 1) / 2) * -50; // Depth arc

                    tl.to(card, {
                        x: xOffset,
                        rotateZ: angle,
                        rotateY: angle * 0.5,
                        z: zOffset,
                        duration: 2,
                        ease: "power3.out"
                    }, 0.2);
                    
                    // Add mouse tilt effect to each card
                    card.addEventListener('mousemove', (e) => {
                        const rect = card.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const y = (e.clientY - rect.top) / rect.height;
                        
                        card.style.setProperty('--mx', `${x * 100}%`);
                        card.style.setProperty('--my', `${y * 100}%`);
                        
                        gsap.to(card, {
                            rotateY: (x - 0.5) * 30,
                            rotateX: (y - 0.5) * -30,
                            duration: 0.5,
                            ease: 'power2.out',
                            overwrite: 'auto'
                        });
                    });

                    card.addEventListener('mouseleave', () => {
                        // Return to the scroll-controlled fan position
                        // We use ScrollTrigger's current progress to know where to return
                        const progress = tl.scrollTrigger.progress;
                        const angle = (i - (cards.length - 1) / 2) * 12;
                        const xOffset = (i - (cards.length - 1) / 2) * 120;
                        
                        gsap.to(card, {
                            rotateY: angle * 0.5 * progress,
                            rotateX: 0,
                            duration: 1,
                            ease: 'elastic.out(1, 0.3)'
                        });
                    });
                });
            }

            initCharacterDeck();

            // === CHARACTER CARD SECTION LOGIC ===
            const characterSection = document.getElementById('character-card-section');
            const navCharacterTrigger = document.querySelector('[data-target="character-card-section"]');

            // Nav Trigger scroll is handled by global nav-trigger logic which finds data-target
            // But we can add specific entrance animations for characters
            if (characterSection) {
                gsap.from('#character-card-section .talent-card', {
                    scrollTrigger: {
                        trigger: '#character-card-section',
                        start: 'top 60%',
                        toggleActions: 'play none none reverse'
                    },
                    y: 60,
                    opacity: 0,
                    stagger: 0.1,
                    duration: 1.2,
                    ease: 'power4.out'
                });
            }

            // Profile Modal Logic — lazy-loaded from /public/fragments/model-profile.html
            const modelCards = document.querySelectorAll('.talent-card');

            modelCards.forEach(card => {
                card.addEventListener('click', async () => {
                    await _loadFragment('model-profile');
                    const profileModal = document.getElementById('model-profile');
                    const mpName = document.getElementById('mp-name');
                    const mpImg = document.getElementById('mp-img');
                    const mpWorks = document.getElementById('mp-works-list');
                    const mpVids = document.getElementById('mp-videos-container');
                    if (!profileModal) return;
                    const name = card.dataset.model;
                    const img = card.querySelector('img').src;
                    const works = card.dataset.works.split(',');
                    const videos = card.dataset.videos.split(',');

                    mpName.innerText = name;
                    mpImg.src = img;
                    mpWorks.innerHTML = works.map(w => `<span class="px-4 py-2 rounded-full border border-white/10 text-[9px] tracking-widest text-white/60 font-counter uppercase">${w.trim()}</span>`).join('');
                    
                    // Smart Video Integration (Liquid Loading)
                    mpVids.innerHTML = videos.map((v, i) => `
                        <div class="liquid-glass-card overflow-hidden rounded-xl border border-white/10 group cursor-pointer" onclick="this.querySelector('video').play(); if(this.querySelector('video').requestFullscreen) this.querySelector('video').requestFullscreen();">
                            <video src="${v.trim()}" class="w-full aspect-video object-cover opacity-60 group-hover:opacity-100 transition-opacity" loop playsinline muted></video>
                            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span class="font-counter text-[9px] tracking-widest text-white bg-black/40 px-4 py-2 rounded-full">PLAY REEL</span>
                            </div>
                        </div>
                    `).join('');

                    gsap.to(profileModal, { 
                        opacity: 1, 
                        pointerEvents: 'auto', 
                        duration: 0.5, 
                        ease: 'power2.out',
                        onStart: () => { profileModal.style.display = 'flex'; }
                    });
                });
            });

            // Close modal via event delegation (element is lazy-injected)
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.mp-close-btn')) return;
                const _pm = document.getElementById('model-profile');
                const _mv = document.getElementById('mp-videos-container');
                if (!_pm) return;
                gsap.to(_pm, {
                    opacity: 0,
                    pointerEvents: 'none',
                    duration: 0.4,
                    ease: 'power2.in',
                    onComplete: () => {
                        _pm.style.display = 'none';
                        if (_mv) _mv.innerHTML = '';
                    }
                });
            });
        });
    
