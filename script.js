// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {
    // Navigation scroll effect
    const header = document.querySelector('header');
    const navLinks = document.querySelectorAll('.nav-links a');
    const hamburger = document.querySelector('.hamburger');
    const navLinksContainer = document.querySelector('.nav-links');
    const themeToggle = document.querySelector('.theme-toggle');
    const root = document.documentElement;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        root.setAttribute('data-theme', savedTheme);
    }

    // Set initial icon based on theme
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (themeToggle) {
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggle.addEventListener('click', function() {
            const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', current);
            localStorage.setItem('theme', current);
            themeToggle.innerHTML = current === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
    
    // Mobile menu toggle
    if (hamburger && navLinksContainer) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking a link
    if (hamburger && navLinksContainer) {
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinksContainer.classList.remove('active');
            });
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                
                window.scrollTo({
                    top: targetPosition - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Active link highlighting based on scroll position
    function highlightNavLink() {
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + header.offsetHeight + 50;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavLink);
    
    // Form submission handling
    const GOOGLE_SHEET_ENDPOINT = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYED_WEB_APP_ID/exec';
    const contactForm = document.querySelector('#contact-form') || document.querySelector('.contact-form form');
    if (contactForm) {
        const statusEl = document.querySelector('.form-status');
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const company = document.getElementById('company').value.trim();
            const message = document.getElementById('message').value.trim();
            if (!name || !email || !message) {
                if (statusEl) statusEl.textContent = 'Please fill in all required fields.';
                else alert('Please fill in all required fields.');
                return;
            }
            if (statusEl) statusEl.textContent = 'Sending...';
            const payload = { name, email, company, message, timestamp: new Date().toISOString() };
            try {
                const res = await fetch(GOOGLE_SHEET_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                });
                if (res.ok) {
                    if (statusEl) statusEl.textContent = 'Thanks! We will get back to you soon.';
                    else alert('Thank you for your message! We will get back to you soon.');
                    contactForm.reset();
                } else {
                    if (statusEl) statusEl.textContent = 'Unable to submit right now. Please try WhatsApp.';
                }
            } catch (err) {
                if (statusEl) statusEl.textContent = 'Network error. Please try WhatsApp or email.';
            }
        });
    }
    
    // Initialize AOS (Animate on Scroll) if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }
});
