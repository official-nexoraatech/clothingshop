import './style.css';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

document.querySelector<HTMLDivElement>('#root')!.innerHTML = `
  <main class="page">
    <section class="hero">
      <p class="eyebrow">Clothing Shop</p>
      <h1>Style for every day.</h1>
      <p class="intro">The storefront is ready. Connect the API to browse the catalog and manage your account.</p>
      <div class="actions">
        <button id="check-api">Check API status</button>
        <span id="api-status" role="status">API status not checked</span>
      </div>
    </section>
  </main>
`;

const status = document.querySelector<HTMLSpanElement>('#api-status')!;
document.querySelector<HTMLButtonElement>('#check-api')!.addEventListener('click', async () => {
  status.textContent = 'Checking API…';
  try {
    const response = await fetch(`${apiBase}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    status.textContent = 'API is online';
  } catch {
    status.textContent = 'API is unavailable — start the backend and MongoDB.';
  }
});
