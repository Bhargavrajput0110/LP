// Cinematic Scroll-Linked Button Animation
function initCinematicButtons() {
    gsap.registerPlugin(ScrollTrigger);

    const buttons = document.querySelectorAll('.cta-button');

    buttons.forEach(btn => {
        if(btn.dataset.cinematicInit) return;
        btn.dataset.cinematicInit = 'true';

        // Save original text and clear it
        const text = btn.innerText;
        btn.innerHTML = '';
        
        // Style wrapper
        btn.style.position = 'relative';
        btn.style.display = 'inline-block';
        // overflow hidden so skew/scale doesn't mess bounds, but text might get clipped vertically. 
        // Best to leave overflow visible, clipPath handles the overlay. 
        
        // 2. Base text
        const base = document.createElement('span');
        base.className = 'cb-base text-base';
        base.style.display = 'inline-block';
        base.style.color = 'inherit';
        base.style.willChange = 'transform, filter';
        base.style.transformOrigin = 'center left';
        base.innerText = text;

        // 3. Overlay layered text
        const overlay = document.createElement('span');
        overlay.className = 'cb-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.display = 'inline-block';
        overlay.style.background = 'linear-gradient(90deg, #F5C855, #CC2200)';
        overlay.style.webkitBackgroundClip = 'text';
        overlay.style.color = 'transparent';
        overlay.style.clipPath = 'inset(0 100% 0 0)'; // clip from right
        overlay.style.willChange = 'clip-path';
        overlay.style.pointerEvents = 'none';
        overlay.innerText = text;

        btn.appendChild(base);
        btn.appendChild(overlay);

        // Entrance animation
        gsap.fromTo(base, {
            filter: 'blur(6px)',
            scale: 1.08,
            skewX: -8
        }, {
            filter: 'blur(0px)',
            scale: 1,
            skewX: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: btn,
                start: 'top 95%',
                toggleActions: 'play none none reverse'
            }
        });

        // Mask reveal linked to scroll (scrub)
        gsap.to(overlay, {
            clipPath: 'inset(0 0% 0 0)',
            ease: 'none',
            scrollTrigger: {
                trigger: btn,
                start: 'top 95%',
                end: 'top 60%',
                scrub: 1
            }
        });
    });
}

// Initialize when load completes or script runs
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCinematicButtons);
} else {
    initCinematicButtons();
}
