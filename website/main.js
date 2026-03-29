async function fetchContent() {
  const res = await fetch('/api/website/content?page=home');
  if (!res.ok) return [];
  return res.json();
}

function renderList(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'card';
    div.textContent = item;
    container.appendChild(div);
  });
}

fetchContent().then((blocks) => {
  const bySection = Object.fromEntries(blocks.map(b => [b.section, b.content]));
  const hero = bySection.hero || {};
  const vision = bySection.vision || {};
  const modules = bySection.modules || {};
  const intel = bySection.intelligence || {};
  const pricing = bySection.pricing || {};
  const cta = bySection.cta || {};

  document.getElementById('hero-title').textContent = hero.title || 'NETHRA';
  document.getElementById('hero-subtitle').textContent = hero.subtitle || 'Political Intelligence OS';
  document.getElementById('hero-cta').textContent = hero.cta || 'Request Demo';
  document.getElementById('vision-heading').textContent = vision.heading || 'Vision';
  document.getElementById('vision-body').textContent = vision.body || '';
  document.getElementById('modules-heading').textContent = modules.heading || 'Modules';
  document.getElementById('intelligence-heading').textContent = intel.heading || 'Intelligence';
  document.getElementById('pricing-heading').textContent = pricing.heading || 'Plans';
  document.getElementById('cta-heading').textContent = cta.heading || 'Get Started';
  document.getElementById('cta-button').textContent = cta.button || 'Get Started';

  renderList('modules-list', modules.items || []);
  renderList('intelligence-list', intel.items || []);
  renderList('pricing-list', pricing.items || []);
});
