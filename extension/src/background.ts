// Background service worker. Chrome may stop and restart it at any time, so it
// keeps no state in memory: every event re-reads settings and re-applies rules.
// Blocking itself is done by Chrome's declarativeNetRequest engine, which keeps
// working even while this worker is asleep.

import { applyPolicy, isSettingsChange } from './lib/extension';
import { startWellbeing } from './wellbeing-runtime';

chrome.runtime.onInstalled.addListener(() => void applyPolicy());
chrome.runtime.onStartup.addListener(() => void applyPolicy());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && isSettingsChange(changes)) void applyPolicy();
});

// The friendly block page depends on "all sites" access, which the user can
// grant or remove at any time from Chrome's own extension settings.
chrome.permissions.onAdded.addListener(() => void applyPolicy());
chrome.permissions.onRemoved.addListener(() => void applyPolicy());

startWellbeing();

// Popup and settings page ask for a fresh check when they open.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'refresh-status') {
    applyPolicy().then(sendResponse);
    return true;
  }
  return false;
});
