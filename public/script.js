const statusEl = document.getElementById('status');
const bodyEl = document.getElementById('symbolBody');
const clearBtn = document.getElementById('clearBtn');
const webhookUrlEl = document.getElementById('webhookUrl');

webhookUrlEl.textContent = `${window.location.origin}/webhook`;

function actionClass(action) {
  if (action.includes('BUY')) return 'buy';
  if (action.includes('SELL')) return 'sell';
  return 'neutral';
}

function fmt(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : v;
}

async function refresh() {
  try {
    const res = await fetch('/api/symbols');
    const data = await res.json();

    if (!data.length) {
      bodyEl.innerHTML = '<tr><td colspan="8" class="empty">No alerts received yet.</td></tr>';
    } else {
      bodyEl.innerHTML = data.map(row => `
        <tr>
          <td>${row.symbol}</td>
          <td class="${actionClass(row.action)}">${row.action}</td>
          <td>${fmt(row.entry)}</td>
          <td>${fmt(row.sl)}</td>
          <td>${fmt(row.target)}</td>
          <td>${fmt(row.qty)}</td>
          <td>${fmt(row.score)}</td>
          <td>${new Date(row.time).toLocaleString()}</td>
        </tr>
      `).join('');
    }

    statusEl.textContent = `live · updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    statusEl.textContent = 'connection error — retrying…';
  }
}

clearBtn.addEventListener('click', async () => {
  if (!confirm('Clear all stored signals?')) return;
  await fetch('/api/symbols', { method: 'DELETE' });
  refresh();
});

refresh();
setInterval(refresh, 5000);
