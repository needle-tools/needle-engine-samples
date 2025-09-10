import("@needle-tools/engine") /* async import of needle engine */;

// Fade in sections when they become visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
        else {
            entry.target.classList.remove('visible');
        }
    });
}, { threshold: 0.3 });

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });

    // Smooth scrolling with lerp
    let targetScroll = window.scrollY;
    let currentScroll = window.scrollY;
    
    const smoothScroll = () => {
        currentScroll += (targetScroll - currentScroll) * 0.005;
        
        if (Math.abs(targetScroll - currentScroll) > 0.5) {
            window.scrollTo(0, currentScroll);
            requestAnimationFrame(smoothScroll);
        }
    };
    
    document.addEventListener('wheel', (e) => {
        e.preventDefault();
        targetScroll += e.deltaY * 1;
        targetScroll = Math.max(0, Math.min(targetScroll, document.body.scrollHeight - window.innerHeight));
        
        requestAnimationFrame(smoothScroll);
    }, { passive: false });
    
    // Touch scroll support for mobile
    let touchStartY = 0;
    let touchStartTime = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchCurrentY = e.touches[0].clientY;
        const deltaY = touchStartY - touchCurrentY;
        
        targetScroll += deltaY * 2;
        targetScroll = Math.max(0, Math.min(targetScroll, document.body.scrollHeight - window.innerHeight));
        
        touchStartY = touchCurrentY;
        requestAnimationFrame(smoothScroll);
    }, { passive: false });
    
    document.addEventListener('touchend', (e) => {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;
        
        // Add momentum scrolling for quick swipes
        if (touchDuration < 300 && e.changedTouches.length > 0) {
            const touchEndY = e.changedTouches[0].clientY;
            const touchDistance = touchStartY - touchEndY;
            const momentum = (touchDistance / touchDuration) * 50;
            
            targetScroll += momentum;
            targetScroll = Math.max(0, Math.min(targetScroll, document.body.scrollHeight - window.innerHeight));
            requestAnimationFrame(smoothScroll);
        }
    }, { passive: true });
    
});
