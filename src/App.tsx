import React from "react";

type Blocked = { id: number; site: string; startTime: number };

const addBlockedSite = (site: string) => {
  chrome.runtime.sendMessage({ type: 'addBlockedSite', site }, (response) => {
    if (response?.success) {
      // trigger UI refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('blockedSitesUpdated'));
      // alert('Site blocked!');

    } else {
      alert(response?.error || 'Failed to block site.');
    }
  });
};

const removeBlockedSite = (id: number) => {
  chrome.runtime.sendMessage({ type: 'removeBlockedSite', id }, (response) => {
    if (response?.success) {
      window.dispatchEvent(new CustomEvent('blockedSitesUpdated'));
    } else {
      alert('Failed to remove site.');
    }
  });
};

function useBlockedSites() {
  const [blocked, setBlocked] = React.useState<Blocked[]>([]);

  const load = React.useCallback(() => {
    chrome.runtime.sendMessage({ type: 'getBlockedSites' }, (response) => {
      setBlocked(response?.blockedSites || []);
    });
  }, []);

  React.useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener('blockedSitesUpdated', onUpdate as EventListener);
    return () => window.removeEventListener('blockedSitesUpdated', onUpdate as EventListener);
  }, [load]);

  return { blocked, reload: load };
}

function formatElapsed(startTime: number) {
  const diff = Date.now() - startTime;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h`;
}

function App() {
  const [site, setSite] = React.useState('');
  const { blocked, reload } = useBlockedSites();

  return (
<div className="w-[360px] rounded-lg bg-white shadow-md border border-gray-200">
  <div className="p-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">NoSurf</h2>
        <p className="text-xs text-gray-700">Block distractions and save time</p>
      </div>
      <div className="text-sm text-gray-600">v1.0</div>
    </div>

    {/* Input + Button */}
    <div className="flex gap-2 mb-4">
      <input
        aria-label="site-input"
        type="text"
        value={site}
        onChange={e => setSite(e.target.value)}
        placeholder="e.g. instagram.com"
        className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
      <button
        onClick={() => { addBlockedSite(site); setSite(''); }}
        className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Block
      </button>
    </div>

    {/* Blocked Sites List */}
    <div>
      <h3 className="text-sm font-medium mb-2 text-gray-700">Blocked sites</h3>
      {blocked.length === 0 && (
        <div className="text-sm text-gray-900 py-6 text-center">
          No sites blocked — add one above
        </div>
      )}

      <ul className="space-y-2 max-h-56 overflow-auto">
        {blocked.map(b => (
          <li
            key={b.id}
            className="flex items-center justify-between bg-gray-50 border border-gray-200 p-2 rounded-md"
          >
            <div>
              <div className="font-medium text-sm text-gray-800">{b.site}</div>
              <div className="text-xs text-gray-500">
                Blocked {formatElapsed(b.startTime)} ago
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => removeBlockedSite(b.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Unblock
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="mt-3 flex justify-between items-center">
        <button
          onClick={reload}
          className="text-sm text-gray-500 hover:underline"
        >
          Refresh
        </button>
        <div className="text-xs text-gray-400">Total: {blocked.length}</div>
      </div>
    </div>
  </div>
</div>


  )
}

export default App
