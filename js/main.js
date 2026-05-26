// ─── State ───────────────────────────────────────────────────────────────────
let currentLang = localStorage.getItem("lang") || "fr";
let typingTimeout = null;

// ─── DOM Ready ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  applyLanguage(currentLang);
  initNavbar();
  initTypingEffect();
  initScrollAnimations();
  initSkillBars();
  initParticles();
  initBackToTop();
  initDarkMode();
  initContactForm();
  initCopyEmail();
  initMobileMenu();
  initFooterYear();
  initCVDownload();
});

// ─── Preloader ────────────────────────────────────────────────────────────────
function initPreloader() {
  const preloader = document.getElementById("preloader");
  window.addEventListener("load", () => {
    setTimeout(() => {
      preloader.classList.add("hidden");
      setTimeout(() => preloader.remove(), 500);
    }, 800);
  });
}

// ─── Language ─────────────────────────────────────────────────────────────────
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);

  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";

  const fontLink = document.getElementById("google-fonts");
  if (lang === "ar") {
    fontLink.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap";
    document.body.style.fontFamily = "'Cairo', sans-serif";
  } else {
    fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Cairo:wght@300;400;600;700;800&display=swap";
    document.body.style.fontFamily = "'Inter', sans-serif";
  }

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key] !== undefined) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  if (typingTimeout) clearTimeout(typingTimeout);
  startTyping();
}

// ─── Typing Effect ────────────────────────────────────────────────────────────
let typingIndex = 0;
let charIndex = 0;
let isDeleting = false;

function initTypingEffect() {
  startTyping();
}

function startTyping() {
  typingIndex = 0;
  charIndex = 0;
  isDeleting = false;
  const el = document.getElementById("typed-role");
  if (el) el.textContent = "";
  typeChar();
}

function typeChar() {
  const el = document.getElementById("typed-role");
  if (!el) return;

  const roles = translations[currentLang].typing_roles;
  if (!roles || roles.length === 0) return;

  const current = roles[typingIndex % roles.length];

  if (isDeleting) {
    el.textContent = current.substring(0, charIndex - 1);
    charIndex--;
  } else {
    el.textContent = current.substring(0, charIndex + 1);
    charIndex++;
  }

  let delay = isDeleting ? 55 : 100;

  if (!isDeleting && charIndex === current.length) {
    delay = 1800;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    typingIndex++;
    delay = 400;
  }

  typingTimeout = setTimeout(typeChar, delay);
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById("navbar");
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);

    let current = "";
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 120) current = section.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  });
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────
function initMobileMenu() {
  const burger = document.getElementById("burger");
  const navMenu = document.getElementById("nav-menu");

  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    navMenu.classList.toggle("open");
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      burger.classList.remove("open");
      navMenu.classList.remove("open");
    });
  });
}

// ─── Scroll Animations ────────────────────────────────────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.08 }
  );

  document.querySelectorAll(".fade-in, .slide-up, .slide-left, .slide-right").forEach((el) => {
    observer.observe(el);
  });
}

// ─── Skill Bars ───────────────────────────────────────────────────────────────
function initSkillBars() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll(".skill-fill").forEach((bar) => {
            setTimeout(() => { bar.style.width = bar.dataset.level + "%"; }, 200);
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll(".skill-category").forEach((cat) => observer.observe(cat));
}

// ─── Particles Background ─────────────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [], animationId;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, createParticle);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99,179,237,${p.alpha})`;
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.strokeStyle = `rgba(99,179,237,${(1 - dist / 120) * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    animationId = requestAnimationFrame(animate);
  }

  init(); animate();
  window.addEventListener("resize", () => { cancelAnimationFrame(animationId); init(); animate(); });
}

// ─── Back to Top ──────────────────────────────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// ─── Dark/Light Mode ──────────────────────────────────────────────────────────
function initDarkMode() {
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);

  toggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector("#theme-toggle i");
  if (icon) icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
}

// ─── Footer Year ──────────────────────────────────────────────────────────────
function initFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
}

// ─── CV Download with fetch check ────────────────────────────────────────────
function initCVDownload() {
  const btn = document.getElementById("cv-download-btn");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const path = "assets/cv_mohamed_el_amraoui.pdf";
    fetch(path, { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          const a = document.createElement("a");
          a.href = path;
          a.download = "CV-Mohamed-El-Amraoui.pdf";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          showToast(translations[currentLang].cv_coming_soon);
        }
      })
      .catch(() => showToast(translations[currentLang].cv_coming_soon));
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  // Remove any previous type classes before adding the new one
  toast.classList.remove("show", "success", "error");
  // Force a reflow so removing + re-adding "show" triggers the transition
  void toast.offsetWidth;
  toast.classList.add(type, "show");
  setTimeout(() => toast.classList.remove("show", type), 4000);
}

// ─── EmailJS init ─────────────────────────────────────────────────────────────
// Called once after DOM is ready; emailjs is loaded synchronously via CDN.
(function initEmailJS() {
  if (typeof emailjs !== "undefined") {
    emailjs.init("PHbSVGglotLCxToai");
  }
})();

// ─── Contact Form ─────────────────────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const t = translations[currentLang];
    const nameEl    = document.getElementById("form-name");
    const emailEl   = document.getElementById("form-email");
    const subjectEl = document.getElementById("form-subject");
    const msgEl     = document.getElementById("form-message");
    const btn       = document.getElementById("form-submit-btn");

    const name    = nameEl.value.trim();
    const email   = emailEl.value.trim();
    const subject = subjectEl.value.trim();
    const message = msgEl.value.trim();

    // Validate — all fields required
    if (!name || !email || !subject || !message) {
      showToast(t.form_error_empty, "error");
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast(t.form_error_email, "error");
      return;
    }

    // Disable button and show sending state
    btn.disabled = true;
    btn.textContent = t.form_sending;

    try {
      await emailjs.send("service_q7hik0l", "template_y84lehx", {
        name,
        email,
        subject,
        message,
      });
      showToast(t.form_success, "success");
      form.reset();
    } catch (_err) {
      showToast(t.form_error_send, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = t.contact_send;
    }
  });
}

// ─── Copy Email ───────────────────────────────────────────────────────────────
function initCopyEmail() {
  const emailEl = document.getElementById("copy-email");
  if (!emailEl) return;
  emailEl.addEventListener("click", () => {
    navigator.clipboard.writeText("mohamedelamrawi@yahoo.com").then(() => {
      const tooltip = document.getElementById("copy-tooltip");
      if (tooltip) { tooltip.classList.add("show"); setTimeout(() => tooltip.classList.remove("show"), 2000); }
    });
  });
}

// ─── Global Click Delegation ──────────────────────────────────────────────────
document.addEventListener("click", (e) => {
  if (e.target.matches(".lang-btn")) applyLanguage(e.target.dataset.lang);
});

document.addEventListener("click", (e) => {
  const anchor = e.target.closest('a[href^="#"]');
  if (anchor) {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
