/* main.js — Scroll-Logik, Navigation und Interaktion */

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  document.getElementById('progress').style.width = (scrollTop / docHeight) * 100 + '%';
});

const sections = document.querySelectorAll('section');
const navDots  = document.querySelectorAll('.nav-dot');

function navIndexFor(id) {
  if (id.startsWith('section-')) return id.split('-')[1];
  if (id === 'section-4b') return '4';
  if (id === 'cliff-1') return '1';
  if (id === 'cliff-2') return '2';
  if (id === 'cliff-3') return '3';
  if (id === 'cliff-4') return '4';
  if (id === 'closing-section') return '5';
  return null;
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      const index = navIndexFor(id);
      if (index !== null) {
        navDots.forEach(d => d.classList.remove('active'));
        const activeDot = document.querySelector(`.nav-dot[data-chapter="${index}"]`);
        if (activeDot) activeDot.classList.add('active');
      }

      if (id === 'section-1' && !window.chart1Loaded) {
        window.chart1Loaded = true;
        setTimeout(() => drawChart1('kinobesucher_mio'), 100);
      }
      if (id === 'section-2' && !window.chart2Loaded) {
        window.chart2Loaded = true;
        setTimeout(() => drawChart2(), 100);
      }
      if (id === 'section-3' && !window.chart3Loaded) {
        window.chart3Loaded = true;
        setTimeout(() => drawChart3(), 100);
      }
      if (id === 'section-4' && !window.chart4Loaded) {
        window.chart4Loaded = true;
        setTimeout(() => drawChart4('kinobesucher_mio'), 100);
      }
      if (id === 'section-4b' && !window.chart4bLoaded) {
        window.chart4bLoaded = true;
        setTimeout(() => drawChart4b(), 100);
      }
      if (id === 'section-5' && !window.chart5Loaded) {
        window.chart5Loaded = true;
        setTimeout(() => drawChart5(), 100);
      }
    }
  });
}, { threshold: 0.3 });

document.fonts.load('600 18px Inter').then(() => {
  sections.forEach(s => observer.observe(s));
}).catch(() => {
  sections.forEach(s => observer.observe(s));
});

navDots.forEach(dot => {
  dot.addEventListener('click', () => {
    const target = document.getElementById(`section-${dot.getAttribute('data-chapter')}`);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.chart1Loaded) {
      const activeBtn = document.querySelector('[data-chart="chart-1"] .filter-btn.active');
      drawChart1(activeBtn ? activeBtn.getAttribute('data-metric') : 'kinobesucher_mio');
    }
    if (window.chart2Loaded) drawChart2();
    if (window.chart3Loaded) drawChart3();
    if (window.chart4Loaded) {
      const activeBtn = document.querySelector('[data-chart="chart-4"] .filter-btn.active');
      drawChart4(activeBtn ? activeBtn.getAttribute('data-metric') : 'kinobesucher_mio');
    }
    if (window.chart4bLoaded) drawChart4b();
    if (window.chart5Loaded) drawChart5();
  }, 250);
});

document.querySelectorAll('.filter-row').forEach(row => {
  const buttons = row.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const metric = btn.getAttribute('data-metric');
      const chartId = row.getAttribute('data-chart');
      if (chartId === 'chart-1') drawChart1(metric);
      if (chartId === 'chart-4') drawChart4(metric);
    });
  });
});

const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  backToTopBtn.classList.toggle('visible', window.scrollY > window.innerHeight * 0.6);
});
backToTopBtn.addEventListener('click', () => {
  document.getElementById('section-0').scrollIntoView({ behavior: 'smooth' });
});

function animateKPI(el) {
  const target = parseFloat(el.getAttribute('data-target'));
  const suffix = el.getAttribute('data-suffix') || '';
  const decimals = parseInt(el.getAttribute('data-decimals') || '0');
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = (target * eased).toFixed(decimals).replace('.', ',') + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target.toFixed(decimals).replace('.', ',') + suffix;
  }
  requestAnimationFrame(tick);
}

let kpiAnimated = false;
const kpiObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !kpiAnimated) {
      kpiAnimated = true;
      document.querySelectorAll('.kpi-number').forEach(el => animateKPI(el));
    }
  });
}, { threshold: 0.4 });

const kpiRow = document.querySelector('.kpi-row');
if (kpiRow) kpiObserver.observe(kpiRow);

const pollMain   = document.getElementById('pollMain');
const pollSub    = document.getElementById('pollStreamingProviders');
const pollResult = document.getElementById('pollResult');

if (pollMain) {
  let mainChoice = null;
  let subChoice  = null;

  pollMain.querySelectorAll('.poll-option').forEach(btn => {
    btn.addEventListener('click', () => {
      pollMain.querySelectorAll('.poll-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      mainChoice = btn.getAttribute('data-value');
      subChoice  = null;
      pollSub.querySelectorAll('.poll-sub-option').forEach(b => b.classList.remove('selected'));
      pollSub.classList.toggle('visible', mainChoice === 'streaming' || mainChoice === 'beides');
      showPollResult(mainChoice, subChoice);
    });
  });

  pollSub.querySelectorAll('.poll-sub-option').forEach(btn => {
    btn.addEventListener('click', () => {
      pollSub.querySelectorAll('.poll-sub-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      subChoice = btn.getAttribute('data-value');
      showPollResult(mainChoice, subChoice);
    });
  });

  function showPollResult(main, sub) {
    const texte = {
      kino:      'Du gehörst zu den Menschen, die dem Kino auch 25 Jahre nach dem Streaming-Boom treu geblieben sind — <span class="highlight">2025 waren es noch 91,9 Millionen Besuche</span> in Deutschland.',
      streaming: `Du bist Teil der <span class="highlight">43 %</span>, die wöchentlich Streamingdienste nutzen${sub ? ` — mit <span class="highlight">${sub}</span> als deiner Wahl` : ''}.`,
      beides:    `Kino und Streaming schließen sich für dich nicht aus${sub ? ` — auch wenn <span class="highlight">${sub}</span> oft dabei ist` : ''}. Genau dieses Nebeneinander zeigt auch die Datenlage der letzten Jahre.`
    };
    pollResult.innerHTML = texte[main] || '';
    pollResult.classList.add('visible');
  }
}
