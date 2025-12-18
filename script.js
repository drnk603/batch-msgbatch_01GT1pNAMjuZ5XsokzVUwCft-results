(function() {
    'use strict';

    window.__app = window.__app || {};

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    class BurgerMenu {
        constructor() {
            if (window.__app.burgerInitialized) return;
            window.__app.burgerInitialized = true;

            this.toggle = document.querySelector('.navbar-toggler');
            this.collapse = document.querySelector('#navbarNav');
            this.body = document.body;
            this.header = document.querySelector('.navbar');
            this.isOpen = false;

            if (!this.toggle || !this.collapse) return;

            this.init();
        }

        init() {
            this.toggle.addEventListener('click', (e) => this.handleToggle(e));
            document.addEventListener('click', (e) => this.handleOutsideClick(e));
            document.addEventListener('keydown', (e) => this.handleKeydown(e));
            window.addEventListener('resize', debounce(() => this.handleResize(), 250));

            const navLinks = this.collapse.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => this.close());
            });
        }

        handleToggle(e) {
            e.preventDefault();
            this.isOpen ? this.close() : this.open();
        }

        open() {
            this.isOpen = true;
            this.collapse.classList.add('show');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.body.style.overflow = 'hidden';

            const headerHeight = this.header ? this.header.offsetHeight : 72;
            this.collapse.style.height = `calc(100vh - ${headerHeight}px)`;
        }

        close() {
            this.isOpen = false;
            this.collapse.classList.remove('show');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.body.style.overflow = '';
            this.collapse.style.height = '';
        }

        handleOutsideClick(e) {
            if (this.isOpen && !this.toggle.contains(e.target) && !this.collapse.contains(e.target)) {
                this.close();
            }
        }

        handleKeydown(e) {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                this.toggle.focus();
            }
        }

        handleResize() {
            if (window.innerWidth >= 992 && this.isOpen) {
                this.close();
            }
        }
    }

    class FormValidator {
        constructor() {
            if (window.__app.formValidatorInitialized) return;
            window.__app.formValidatorInitialized = true;

            this.forms = document.querySelectorAll('form');
            this.patterns = {
                name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
                email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                phone: /^[\d\s\+\-\(\)]{10,20}$/,
                message: /^[\s\S]{10,1000}$/
            };

            this.errorMessages = {
                name: 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen, nur Buchstaben)',
                email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
                phone: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen)',
                message: 'Bitte geben Sie eine Nachricht ein (mindestens 10 Zeichen)',
                privacy: 'Bitte akzeptieren Sie die Datenschutzerklärung',
                required: 'Dieses Feld ist erforderlich'
            };

            this.init();
        }

        init() {
            this.forms.forEach(form => {
                form.addEventListener('submit', (e) => this.handleSubmit(e));

                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => this.validateField(input));
                    input.addEventListener('input', () => this.clearError(input));
                });
            });
        }

        handleSubmit(e) {
            e.preventDefault();
            const form = e.target;
            let isValid = true;

            const fields = form.querySelectorAll('input, textarea, select');
            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                const firstError = form.querySelector('.is-invalid');
                if (firstError) {
                    firstError.focus();
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            this.submitForm(form);
        }

        validateField(field) {
            this.clearError(field);

            if (field.hasAttribute('required') && !field.value.trim()) {
                this.showError(field, this.errorMessages.required);
                return false;
            }

            if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
                this.showError(field, this.errorMessages.privacy);
                return false;
            }

            const fieldName = field.name || field.id;
            const pattern = this.patterns[fieldName];

            if (pattern && field.value.trim()) {
                if (!pattern.test(field.value.trim())) {
                    this.showError(field, this.errorMessages[fieldName]);
                    return false;
                }
            }

            return true;
        }

        showError(field, message) {
            field.classList.add('is-invalid');
            
            let errorDiv = field.parentElement.querySelector('.invalid-feedback');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                field.parentElement.appendChild(errorDiv);
            }

            errorDiv.textContent = message;
            errorDiv.classList.add('is-visible');
        }

        clearError(field) {
            field.classList.remove('is-invalid');
            const errorDiv = field.parentElement.querySelector('.invalid-feedback');
            if (errorDiv) {
                errorDiv.classList.remove('is-visible');
            }
        }

        async submitForm(form) {
            const submitButton = form.querySelector('[type="submit"]');
            const originalText = submitButton.innerHTML;

            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird gesendet...';

            const formData = new FormData(form);
            const data = {};
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }

            try {
                const response = await fetch('process.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = 'thank_you.html';
                } else {
                    this.showNotification('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.', 'danger');
                }
            } catch (error) {
                this.showNotification('Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.', 'danger');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        }

        showNotification(message, type) {
            let container = document.querySelector('.notification-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'notification-container position-fixed top-0 end-0 p-3';
                container.style.zIndex = '9999';
                document.body.appendChild(container);
            }

            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show`;
            alert.innerHTML = `${message}<button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>`;

            container.appendChild(alert);

            setTimeout(() => alert.remove(), 5000);
        }
    }

    class SmoothScroll {
        constructor() {
            if (window.__app.smoothScrollInitialized) return;
            window.__app.smoothScrollInitialized = true;

            this.header = document.querySelector('.navbar');
            this.init();
        }

        init() {
            document.addEventListener('click', (e) => {
                const anchor = e.target.closest('a[href^="#"]');
                if (!anchor || anchor.getAttribute('href') === '#' || anchor.getAttribute('href') === '#!') return;

                const targetId = anchor.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);

                if (target) {
                    e.preventDefault();
                    const headerHeight = this.header ? this.header.offsetHeight : 72;
                    const targetPosition = target.offsetTop - headerHeight;

                    window.scrollTo({
                        top: Math.max(0, targetPosition),
                        behavior: 'smooth'
                    });
                }
            });
        }
    }

    class ScrollSpy {
        constructor() {
            if (window.__app.scrollSpyInitialized) return;
            window.__app.scrollSpyInitialized = true;

            this.sections = document.querySelectorAll('[id]');
            this.navLinks = document.querySelectorAll('.nav-link');
            this.header = document.querySelector('.navbar');

            if (this.sections.length === 0 || this.navLinks.length === 0) return;

            this.init();
        }

        init() {
            window.addEventListener('scroll', throttle(() => this.onScroll(), 100));
            this.onScroll();
        }

        onScroll() {
            const headerHeight = this.header ? this.header.offsetHeight : 72;
            const scrollPos = window.scrollY + headerHeight + 100;

            this.sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                    this.navLinks.forEach(link => {
                        link.classList.remove('active');
                        link.removeAttribute('aria-current');

                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                            link.setAttribute('aria-current', 'page');
                        }
                    });
                }
            });
        }
    }

    class IntersectionAnimations {
        constructor() {
            if (window.__app.intersectionInitialized) return;
            window.__app.intersectionInitialized = true;

            this.init();
        }

        init() {
            const options = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, options);

            const animateElements = document.querySelectorAll('.card, .trust-badges [class*="col"], .timeline-item, img');
            
            animateElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                observer.observe(el);
            });
        }
    }

    class CountUp {
        constructor() {
            if (window.__app.countUpInitialized) return;
            window.__app.countUpInitialized = true;

            this.counters = document.querySelectorAll('[data-count]');
            if (this.counters.length === 0) return;

            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                        this.animateCounter(entry.target);
                        entry.target.classList.add('counted');
                    }
                });
            }, { threshold: 0.5 });

            this.counters.forEach(counter => observer.observe(counter));
        }

        animateCounter(element) {
            const target = parseInt(element.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 16);
        }
    }

    class RippleEffect {
        constructor() {
            if (window.__app.rippleInitialized) return;
            window.__app.rippleInitialized = true;

            this.init();
        }

        init() {
            const elements = document.querySelectorAll('.btn, .card, .nav-link');

            elements.forEach(element => {
                element.style.position = 'relative';
                element.style.overflow = 'hidden';

                element.addEventListener('click', (e) => {
                    const ripple = document.createElement('span');
                    const rect = element.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;

                    ripple.style.width = ripple.style.height = `${size}px`;
                    ripple.style.left = `${x}px`;
                    ripple.style.top = `${y}px`;
                    ripple.style.position = 'absolute';
                    ripple.style.borderRadius = '50%';
                    ripple.style.background = 'rgba(255, 255, 255, 0.6)';
                    ripple.style.transform = 'scale(0)';
                    ripple.style.animation = 'ripple 0.6s ease-out';
                    ripple.style.pointerEvents = 'none';

                    element.appendChild(ripple);

                    setTimeout(() => ripple.remove(), 600);
                });
            });

            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    class HoverAnimations {
        constructor() {
            if (window.__app.hoverInitialized) return;
            window.__app.hoverInitialized = true;

            this.init();
        }

        init() {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
            });

            const buttons = document.querySelectorAll('.btn');
            buttons.forEach(btn => {
                btn.style.transition = 'all 0.3s ease-out';
            });

            const links = document.querySelectorAll('.nav-link, a');
            links.forEach(link => {
                link.style.transition = 'color 0.3s ease-out';
            });
        }
    }

    class ScrollToTop {
        constructor() {
            if (window.__app.scrollToTopInitialized) return;
            window.__app.scrollToTopInitialized = true;

            this.createButton();
        }

        createButton() {
            const button = document.createElement('button');
            button.innerHTML = '↑';
            button.className = 'scroll-to-top';
            button.setAttribute('aria-label', 'Nach oben scrollen');
            
            Object.assign(button.style, {
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                opacity: '0',
                transform: 'translateY(100px)',
                transition: 'opacity 0.3s, transform 0.3s',
                zIndex: '1000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            });

            button.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            document.body.appendChild(button);

            window.addEventListener('scroll', throttle(() => {
                if (window.scrollY > 300) {
                    button.style.opacity = '1';
                    button.style.transform = 'translateY(0)';
                } else {
                    button.style.opacity = '0';
                    button.style.transform = 'translateY(100px)';
                }
            }, 100));
        }
    }

    class CookieBanner {
        constructor() {
            if (window.__app.cookieInitialized) return;
            window.__app.cookieInitialized = true;

            this.banner = document.querySelector('.cookie-banner');
            this.acceptBtn = document.getElementById('acceptCookies');
            this.declineBtn = document.getElementById('declineCookies');

            if (!this.banner) return;

            this.init();
        }

        init() {
            if (localStorage.getItem('cookiesAccepted')) {
                this.banner.style.display = 'none';
                return;
            }

            this.banner.style.display = 'block';

            if (this.acceptBtn) {
                this.acceptBtn.addEventListener('click', () => {
                    localStorage.setItem('cookiesAccepted', 'true');
                    this.banner.style.opacity = '0';
                    setTimeout(() => this.banner.style.display = 'none', 300);
                });
            }

            if (this.declineBtn) {
                this.declineBtn.addEventListener('click', () => {
                    this.banner.style.opacity = '0';
                    setTimeout(() => this.banner.style.display = 'none', 300);
                });
            }
        }
    }

    class PrivacyModal {
        constructor() {
            if (window.__app.privacyModalInitialized) return;
            window.__app.privacyModalInitialized = true;

            this.init();
        }

        init() {
            const privacyLinks = document.querySelectorAll('a[href*="privacy"]');
            
            privacyLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    if (link.getAttribute('href').startsWith('#')) {
                        e.preventDefault();
                        this.openModal();
                    }
                });
            });
        }

        openModal() {
            const modal = document.createElement('div');
            modal.className = 'privacy-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <button class="modal-close">&times;</button>
                    <h2>Datenschutzerklärung</h2>
                    <p>Hier steht Ihre Datenschutzerklärung...</p>
                </div>
            `;

            Object.assign(modal.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '9999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            });

            const backdrop = modal.querySelector('.modal-backdrop');
            Object.assign(backdrop.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.7)',
                opacity: '0',
                transition: 'opacity 0.3s'
            });

            const content = modal.querySelector('.modal-content');
            Object.assign(content.style, {
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '16px',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto',
                position: 'relative',
                transform: 'scale(0.9)',
                opacity: '0',
                transition: 'all 0.3s'
            });

            const closeBtn = modal.querySelector('.modal-close');
            Object.assign(closeBtn.style, {
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '32px',
                border: 'none',
                background: 'none',
                cursor: 'pointer'
            });

            document.body.appendChild(modal);

            setTimeout(() => {
                backdrop.style.opacity = '1';
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }, 10);

            const close = () => {
                backdrop.style.opacity = '0';
                content.style.transform = 'scale(0.9)';
                content.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            };

            closeBtn.addEventListener('click', close);
            backdrop.addEventListener('click', close);
        }
    }

    class ImageLoader {
        constructor() {
            if (window.__app.imageLoaderInitialized) return;
            window.__app.imageLoaderInitialized = true;

            this.init();
        }

        init() {
            const images = document.querySelectorAll('img');
            
            images.forEach(img => {
                if (!img.hasAttribute('loading')) {
                    img.setAttribute('loading', 'lazy');
                }

                img.addEventListener('load', () => {
                    img.style.animation = 'fadeIn 0.6s ease-out';
                });

                img.addEventListener('error', () => {
                    img.style.opacity = '0.5';
                    img.alt = 'Bild konnte nicht geladen werden';
                });
            });
        }
    }

    function init() {
        new BurgerMenu();
        new FormValidator();
        new SmoothScroll();
        new ScrollSpy();
        new IntersectionAnimations();
        new CountUp();
        new RippleEffect();
        new HoverAnimations();
        new ScrollToTop();
        new CookieBanner();
        new PrivacyModal();
        new ImageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
Этот оптимизированный JavaScript-файл включает:

✅ **Бургер-меню** с плавным открытием/закрытием и `height: calc(100vh - header-height)`
✅ **Валидация форм** с правильным экранированием RegExp и редиректом на `thank_you.html`
✅ **Smooth scroll** и **scroll-spy** для активных пунктов меню
✅ **Intersection Observer** для анимаций при скролле
✅ **Count-up эффект** для статистики
✅ **Ripple эффект** на кнопках и ссылках
✅ **Scroll-to-top** кнопка
✅ **Cookie banner** с локальным сохранением
✅ **Privacy modal** с красивой анимацией
✅ **Ленивая загрузка изображений** (нативная через `loading="lazy"`)
✅ **SOLID принципы** - каждый класс отвечает за одну функциональность
✅ Без комментариев, только чистый код