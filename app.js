// Tab Navigation
document.addEventListener('DOMContentLoaded', () => {
    // Main section tabs
    const tabs = document.querySelectorAll('.tab');
    const sections = document.querySelectorAll('.section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSection = tab.getAttribute('data-section');

            // Remove active class from all tabs and sections
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked tab and corresponding section
            tab.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
        });
    });

    // Architecture mode tabs (Without/With Buffered Writes)
    const archTabs = document.querySelectorAll('.arch-tab');
    const archModes = document.querySelectorAll('.architecture-mode');

    archTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetMode = tab.getAttribute('data-mode');

            archTabs.forEach(t => t.classList.remove('active'));
            archModes.forEach(m => m.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetMode}-mode`).classList.add('active');
        });
    });

    // Scenario tabs (Single-Region/Multi-Region)
    const scenarioTabs = document.querySelectorAll('.scenario-tab');
    const scenarioContents = document.querySelectorAll('.scenario-content');

    scenarioTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetScenario = tab.getAttribute('data-scenario');

            scenarioTabs.forEach(t => t.classList.remove('active'));
            scenarioContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetScenario}-scenario`).classList.add('active');
        });
    });

    // Animation Controls
    const animateBtn = document.getElementById('animate-flow');
    const resetBtn = document.getElementById('reset-animation');

    if (animateBtn) {
        animateBtn.addEventListener('click', () => {
            animateFlowDiagram();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetAnimation();
        });
    }

    // Initialize latency bars animation on page load
    animateLatencyBars();
});

// Animate flow diagram
function animateFlowDiagram() {
    const activeMode = document.querySelector('.architecture-mode.active');
    if (!activeMode) return;

    const steps = activeMode.querySelectorAll('.step-group');

    // Reset all steps
    steps.forEach(step => {
        step.style.opacity = '0.3';
    });

    // Animate steps sequentially
    let delay = 0;
    steps.forEach((step, index) => {
        setTimeout(() => {
            step.style.opacity = '1';
            step.style.transition = 'opacity 0.5s ease';

            // Add pulse animation to arrows and nodes
            const arrows = step.querySelectorAll('.arrow, .buffer-arrow, .parallel-arrow');
            const nodes = step.querySelectorAll('.node, .buffer-box');

            arrows.forEach(arrow => {
                arrow.classList.add('animating');
                setTimeout(() => arrow.classList.remove('animating'), 1000);
            });

            nodes.forEach(node => {
                node.classList.add('animating');
                setTimeout(() => node.classList.remove('animating'), 1000);
            });

            // Scroll step into view
            step.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, delay);

        delay += 1500; // 1.5 seconds between steps
    });
}

// Reset animation
function resetAnimation() {
    const activeMode = document.querySelector('.architecture-mode.active');
    if (!activeMode) return;

    const steps = activeMode.querySelectorAll('.step-group');
    steps.forEach(step => {
        step.style.opacity = '1';
        step.style.transition = 'none';
    });

    // Scroll to top of diagram
    activeMode.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Animate latency bars
function animateLatencyBars() {
    const bars = document.querySelectorAll('.bar');

    // Start with 0 width
    bars.forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0';

        // Animate to target width after a short delay
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 500);
    });
}

// Add smooth scroll behavior for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effects for feature cards
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const activeTabs = document.querySelectorAll('.tab.active');
    const allTabs = document.querySelectorAll('.tab');

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (activeTabs.length > 0) {
            const currentIndex = Array.from(allTabs).indexOf(activeTabs[0]);
            let nextIndex;

            if (e.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % allTabs.length;
            } else {
                nextIndex = (currentIndex - 1 + allTabs.length) % allTabs.length;
            }

            allTabs[nextIndex].click();
        }
    }
});

// Add visual feedback for code blocks
const codeBlocks = document.querySelectorAll('pre code');
codeBlocks.forEach(block => {
    block.addEventListener('click', () => {
        // Copy to clipboard
        const text = block.textContent;
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            const originalBg = block.parentElement.style.background;
            block.parentElement.style.background = 'rgba(0, 212, 170, 0.3)';

            setTimeout(() => {
                block.parentElement.style.background = originalBg;
            }, 300);
        });
    });

    // Add copy hint on hover
    block.parentElement.style.cursor = 'pointer';
    block.parentElement.title = 'Click to copy';
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe cards and sections for fade-in effect
const observeElements = document.querySelectorAll('.feature-card, .comparison-card, .benchmark-card, .takeaway-card');
observeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Add print-friendly styles dynamically
const printStyles = `
    @media print {
        body {
            background: white;
            color: black;
        }

        .tabs, .interactive-controls, footer {
            display: none;
        }

        .section {
            display: block !important;
            page-break-after: always;
        }

        .feature-card, .comparison-card, .benchmark-card {
            page-break-inside: avoid;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = printStyles;
document.head.appendChild(styleSheet);

// Add export functionality
function exportToPDF() {
    window.print();
}

// Add fullscreen toggle
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + P for print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        exportToPDF();
    }

    // F11 or Ctrl/Cmd + F for fullscreen
    if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.key === 'f')) {
        e.preventDefault();
        toggleFullscreen();
    }

    // ESC to exit fullscreen
    if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

// Dynamic metrics counter animation
function animateCounter(element, start, end, duration) {
    let startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);

        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// Observe metric values for counter animation
const metricObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            const text = entry.target.textContent;
            const match = text.match(/[\d,]+/);

            if (match) {
                const value = parseInt(match[0].replace(/,/g, ''));
                if (!isNaN(value)) {
                    entry.target.classList.add('animated');
                    animateCounter(entry.target, 0, value, 2000);
                }
            }
        }
    });
}, observerOptions);

// Observe metric values
const metricValues = document.querySelectorAll('.metric-value');
metricValues.forEach(el => {
    metricObserver.observe(el);
});

// Add dark mode toggle (optional enhancement)
function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

// Load saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
}

// Add search functionality
function searchContent(query) {
    const sections = document.querySelectorAll('.section');
    const lowerQuery = query.toLowerCase();

    sections.forEach(section => {
        const text = section.textContent.toLowerCase();
        const matches = text.includes(lowerQuery);

        if (matches) {
            section.style.display = 'block';
            highlightText(section, query);
        } else {
            section.style.display = 'none';
        }
    });
}

function highlightText(element, query) {
    // Basic highlighting implementation
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const matches = [];
    let node;

    while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(query.toLowerCase())) {
            matches.push(node);
        }
    }

    matches.forEach(node => {
        const parent = node.parentElement;
        if (parent && !parent.classList.contains('highlight')) {
            parent.style.backgroundColor = 'rgba(255, 176, 32, 0.3)';
            parent.classList.add('highlight');
        }
    });
}

// Auto-save progress
function saveProgress() {
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        localStorage.setItem('lastSection', activeSection.id);
    }
}

function loadProgress() {
    const lastSection = localStorage.getItem('lastSection');
    if (lastSection) {
        const tab = document.querySelector(`[data-section="${lastSection}"]`);
        if (tab) {
            tab.click();
        }
    }
}

// Save progress when switching tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', saveProgress);
});

// Load progress on page load
window.addEventListener('load', () => {
    loadProgress();
});

// Add presentation mode (hide UI, full screen content)
let presentationMode = false;

function togglePresentationMode() {
    presentationMode = !presentationMode;

    if (presentationMode) {
        document.querySelector('.tabs').style.display = 'none';
        document.querySelector('header').style.padding = '20px';
        document.body.style.padding = '0';
        toggleFullscreen();
    } else {
        document.querySelector('.tabs').style.display = 'flex';
        document.querySelector('header').style.padding = '60px 20px 40px';
        document.body.style.padding = '';
    }
}

// Keyboard shortcut for presentation mode (Ctrl/Cmd + Shift + P)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePresentationMode();
    }
});

console.log('🪳 CockroachDB Buffered Writes Explainer loaded!');
console.log('Keyboard shortcuts:');
console.log('  ← → : Navigate between tabs');
console.log('  Ctrl/Cmd + P : Print/Export');
console.log('  Ctrl/Cmd + Shift + P : Presentation mode');
console.log('  F11 : Fullscreen');
console.log('  Click code blocks to copy');
