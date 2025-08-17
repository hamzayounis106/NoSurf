// background.js

// background.js
// Manage blocked sites with chrome.declarativeNetRequest and chrome.storage

const BLOCKED_KEY = 'blockedSites';
const NEXT_ID_KEY = 'nextRuleId';

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, (res) => resolve(res)));
}

function storageSet(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, () => resolve()));
}

// Allocate a unique integer rule id by checking stored next id and existing dynamic rules
function allocateRuleId() {
  return storageGet([NEXT_ID_KEY]).then((data) => {
    let nextId = data[NEXT_ID_KEY] || 1;
    return new Promise((resolve) => {
      chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const maxExisting = (rules && rules.length) ? Math.max(...rules.map(r => r.id)) : 0;
        const id = Math.max(nextId, maxExisting + 1);
        // persist next id for future allocations
        storageSet({ [NEXT_ID_KEY]: id + 1 }).then(() => resolve(id));
      });
    });
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'addBlockedSite' && msg.site) {
    const site = String(msg.site).trim();
    if (!site) {
      sendResponse({ success: false, error: 'Empty site' });
      return;
    }

    storageGet([BLOCKED_KEY]).then((data) => {
      const blocked = data[BLOCKED_KEY] || [];
      // avoid duplicates
      if (blocked.some(b => b.site === site)) {
        sendResponse({ success: false, error: 'Already blocked' });
        return;
      }

      // build a regexFilter that matches the domain and any subdomain/path
      let host = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const escapedHost = host.replace(/\./g, '\\.');
      const regex = `^https?://([^.]+\\.)*${escapedHost}(/|$)`;

      // allocate a unique id to avoid collisions with existing dynamic rules
      // check current dynamic rules count to avoid hitting limits
      chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
        const existingCount = (existingRules || []).length;
        const MAX_DYNAMIC = 30; // conservative expected limit
        if (existingCount >= MAX_DYNAMIC) {
          sendResponse({ success: false, error: `Too many dynamic rules (${existingCount}). Remove some blocked sites first.` });
          return;
        }

        // allocate id and add rule
        allocateRuleId().then((id) => {
          const rule = {
            id: id,
            priority: 1,
            action: { type: 'block' },
            condition: { regexFilter: regex, resourceTypes: ['main_frame'] }
          };

          // debug log
          console.log('Adding block rule', id, rule.condition.regexFilter);

          chrome.declarativeNetRequest.updateDynamicRules({ addRules: [rule], removeRuleIds: [] }, async () => {
            if (chrome.runtime.lastError) {
              console.error('updateDynamicRules error:', chrome.runtime.lastError.message);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            blocked.push({ id: id, site, startTime: Date.now() });
            await storageSet({ [BLOCKED_KEY]: blocked });
            sendResponse({ success: true, blockedSites: blocked });
          });
        }).catch((err) => {
          console.error('allocateRuleId error', err);
          sendResponse({ success: false, error: String(err) });
        });
      });
    });

    return true; // will respond asynchronously
  }

  if (msg.type === 'removeBlockedSite' && typeof msg.id === 'number') {
    const id = msg.id;
    storageGet([BLOCKED_KEY]).then((data) => {
      const blocked = data[BLOCKED_KEY] || [];
      chrome.declarativeNetRequest.updateDynamicRules({ addRules: [], removeRuleIds: [id] }, async () => {
        const updated = blocked.filter(b => b.id !== id);
        await storageSet({ [BLOCKED_KEY]: updated });
        sendResponse({ success: true, blockedSites: updated });
      });
    });
    return true;
  }

  if (msg.type === 'getBlockedSites') {
    storageGet([BLOCKED_KEY]).then((data) => {
      sendResponse({ blockedSites: data[BLOCKED_KEY] || [] });
    });
    return true;
  }
});