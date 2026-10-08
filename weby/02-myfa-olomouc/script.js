// Interactive Gallery Filtering, Lightbox & Inquiry Form - 2026
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // Category Filter in Photo Database
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-filter');
            galleryItems.forEach(item => {
                if (cat === 'all' || item.getAttribute('data-category') === cat) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lbImg');
    const lbCaption = document.getElementById('lbCaption');
    const lbCounter = document.getElementById('lbCounter');
    const lbClose = document.getElementById('lbClose');
    const lbPrev = document.getElementById('lbPrev');
    const lbNext = document.getElementById('lbNext');

    let currentIndex = 0;
    const allPhotos = galleryItems.map(item => ({
        src: item.getAttribute('data-src'),
        title: item.getAttribute('data-title'),
        cat: item.getAttribute('data-category')
    }));

    function openLightbox(idx) {
        if (!allPhotos.length || !lightbox) return;
        currentIndex = (idx + allPhotos.length) % allPhotos.length;
        const p = allPhotos[currentIndex];
        lbImg.src = p.src;
        lbCaption.textContent = p.cat + ' — ' + p.title;
        lbCounter.textContent = `Fotografie ${currentIndex + 1} z ${allPhotos.length}`;
        lightbox.classList.add('open');
    }

    galleryItems.forEach((item, idx) => {
        item.addEventListener('click', () => openLightbox(idx));
    });

    document.querySelectorAll('.bento-card').forEach((card, idx) => {
        card.addEventListener('click', () => openLightbox(idx));
    });

    if (lbClose) lbClose.addEventListener('click', () => lightbox.classList.remove('open'));
    if (lbPrev) lbPrev.addEventListener('click', (e) => { e.stopPropagation(); openLightbox(currentIndex - 1); });
    if (lbNext) lbNext.addEventListener('click', (e) => { e.stopPropagation(); openLightbox(currentIndex + 1); });
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) lightbox.classList.remove('open');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') lightbox.classList.remove('open');
        if (e.key === 'ArrowLeft') openLightbox(currentIndex - 1);
        if (e.key === 'ArrowRight') openLightbox(currentIndex + 1);
    });

    // Pre-select service in form when clicking service card link
    document.querySelectorAll('[data-select-service]').forEach(link => {
        link.addEventListener('click', () => {
            const val = link.getAttribute('data-select-service');
            const sel = document.getElementById('serviceSelect');
            if (sel) {
                for (let i = 0; i < sel.options.length; i++) {
                    if (sel.options[i].value === val) {
                        sel.selectedIndex = i;
                        break;
                    }
                }
            }
        });
    });

    // Real Dual-Mode Form Submission Handler (PHP Server Mailer + Direct Mailto Fallback)
    const form = document.getElementById('inquiryForm');
    const successBox = document.getElementById('formSuccess');
    if (form && successBox) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recipient = form.getAttribute('data-recipient') || '';
            const company = form.getAttribute('data-company') || '';
            const nameVal = (document.getElementById('nameInput')?.value || '').trim();
            const phoneVal = (document.getElementById('phoneInput')?.value || '').trim();
            const emailVal = (document.getElementById('emailInput')?.value || '').trim();
            const serviceVal = (document.getElementById('serviceSelect')?.value || '').trim();
            const msgVal = (document.getElementById('msgInput')?.value || '').trim();

            const subject = encodeURIComponent(`Poptávka z webu (${serviceVal}) – ${nameVal}`);
            const body = encodeURIComponent(
                `Dobrý den,

zasílám poptávku / dotaz z webového formuláře (${company}):

` +
                `• Jméno / Firma: ${nameVal}
` +
                `• Telefon: ${phoneVal}
` +
                `• E-mail: ${emailVal}
` +
                `• Vybraná oblast / služba: ${serviceVal}

` +
                `Zpráva / Podrobnosti:
${msgVal}
`
            );
            const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;

            // Try server-side PHP mailer first when hosted over http/https
            if (window.location.protocol.startsWith('http')) {
                try {
                    const formData = new FormData(form);
                    const resp = await fetch('odeslat-poptavku.php', {
                        method: 'POST',
                        body: formData
                    });
                    if (resp.ok) {
                        const resJson = await resp.json();
                        if (resJson && resJson.success) {
                            successBox.innerHTML = `✓ Děkujeme! Vaše poptávka byla úspěšně odeslána na <strong>${recipient}</strong>. Brzy vás budeme kontaktovat.`;
                            successBox.style.display = 'block';
                            form.reset();
                            return;
                        }
                    }
                } catch (_) {
                    // Fallback to direct mailto below if static hosting without PHP
                }
            }

            // Static hosting or local file:// mode -> show confirmation + direct mailto button & open mail client
            successBox.innerHTML = `
                <div style="margin-bottom: 8px;">✓ <strong>Poptávka je připravena k odeslání na ${recipient}</strong> (${serviceVal}).</div>
                <div style="font-size: 0.85rem; font-weight: 500; margin-bottom: 10px;">
                    Při nasazení na webhosting s PHP formulář odesílá e-maily automaticky přes přiložený skript <code>odeslat-poptavku.php</code>. V lokálním náhledu můžete zprávu odeslat jedním kliknutím přes váš e-mailový program:
                </div>
                <a href="${mailtoUrl}" style="display: inline-block; background: #166534; color: #FFFFFF; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 700;">
                    ✉️ Otevřít v e-mailu a odeslat na ${recipient} →
                </a>
            `;
            successBox.style.display = 'block';
            window.location.href = mailtoUrl;
            form.reset();
        });
    }
});
