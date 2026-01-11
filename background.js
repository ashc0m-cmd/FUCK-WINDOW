'use strict';

// Detect extension API
const extensionApi =
  (typeof browser === 'object' &&
    browser.runtime &&
    typeof browser.runtime.getManifest === 'function')
    ? browser
    : (typeof chrome === 'object' &&
      chrome.runtime &&
      typeof chrome.runtime.getManifest === 'function')
      ? chrome
      : null;

if (!extensionApi) {
  console.error('Cannot find extension API under "browser" or "chrome"');
}

// Background state
const backgroundState = {
  selectedTheme: 'vivid',
  showShieldIcon: true,
  // map hostname -> enabled bool
  sitePrefs: {}
};

// On install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log(
      'Extension updated from',
      details.previousVersion,
      'to',
      chrome.runtime.getManifest().version
    );
  }
});

// Load stored prefs
chrome.storage.local.get(
  ['selectedTheme', 'showShieldIcon', 'sitePrefs'],
  (res) => {
    if (res?.selectedTheme) backgroundState.selectedTheme = res.selectedTheme;
    if (typeof res?.showShieldIcon !== 'undefined') {
      backgroundState.showShieldIcon = res.showShieldIcon;
    }
    if (res?.sitePrefs && typeof res.sitePrefs === 'object') {
      backgroundState.sitePrefs = res.sitePrefs;
    }
  }
);

function urlHost(url) {
  if (url && url.startsWith('http')) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      console.warn('Invalid url', url, e);
    }
  }
  return '';
}

// Site enablement helpers

function isSiteEnabled({ url }) {
  const host = urlHost(url);
  if (!host) return false;
  if (host in backgroundState.sitePrefs) {
    return !!backgroundState.sitePrefs[host];
  }
  // default: enabled
  return true;
}

function setSiteEnabled(url, enabled, cb) {
  const host = urlHost(url);
  if (!host) {
    cb && cb();
    return;
  }
  backgroundState.sitePrefs[host] = enabled;
  chrome.storage.local.set({ sitePrefs: backgroundState.sitePrefs }, () => {
    cb && cb();
  });
}

// Badge updater
function updateBadgeForTab(tab) {
  if (!tab || !tab.url) return;
  const enabled = isSiteEnabled({ url: tab.url });
  const text = enabled ? 'ON' : '';

  chrome.action.setBadgeBackgroundColor({ color: enabled ? '#3a86ff' : '#444' });
  chrome.action.setBadgeText({ text });

  if (backgroundState.showShieldIcon) {
    chrome.action.setIcon({
      path: enabled
        ? 'icons/shield.png'
        : 'icons/icon48.png'
    });
  }
}

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) {
    sendResponse({ status: 'invalid_message' });
    return;
  }

  switch (msg.type) {
    case 'getUserPrefs':
      sendResponse({
        theme: backgroundState.selectedTheme,
        showShieldIcon: backgroundState.showShieldIcon
      });
      break;

    case 'SET_THEME':
      if (!msg.theme) {
        sendResponse({ status: 'error', message: 'Missing theme' });
        break;
      }
      chrome.storage.local.set({ selectedTheme: msg.theme }, () => {
        backgroundState.selectedTheme = msg.theme;
        sendResponse({ status: 'success' });
      });
      return true;

    case 'SET_SHIELD_ICON':
      backgroundState.showShieldIcon = !!msg.enabled;
      chrome.storage.local.set(
        { showShieldIcon: backgroundState.showShieldIcon },
        () => {
          sendResponse({ status: 'success' });
        }
      );
      return true;

    case 'GET_SITE_ENABLED':
      sendResponse({ enabled: isSiteEnabled({ url: msg.url }) });
      break;

    case 'SET_SITE_ENABLED':
      setSiteEnabled(msg.url, !!msg.enabled, () => {
        sendResponse({ status: 'success' });
      });
      return true;

    case 'userClick':
      console.log('User click from', sender?.tab?.url, 'tag:', msg.tagName);
      sendResponse({ status: 'ok' });
      break;

    case 'openTab':
      if (msg.url) chrome.tabs.create({ url: msg.url });
      sendResponse({ status: 'ok' });
      break;

    case 'log':
      if (msg.data) console.log('[EXT LOG]', msg.data);
      sendResponse({ status: 'logged' });
      break;

    case 'getConfig':
      chrome.storage.sync.get(['config'], (data) =>
        sendResponse({ config: data?.config })
      );
      return true;

    case 'PAYWALL_REMOVED':
      if (sender?.tab?.id) {
        chrome.action.setBadgeText({ text: 'OK' });
        setTimeout(() => {
          chrome.tabs.get(sender.tab.id, updateBadgeForTab);
        }, 1200);
      }
      sendResponse({ status: 'noted' });
      break;

    default:
      console.warn('Unknown message type:', msg.type);
      sendResponse({ status: 'unknown' });
  }
});

// Tab listeners
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.status === undefined) {
    updateBadgeForTab(tab);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, updateBadgeForTab);
});
fetch(chrome.runtime.getURL('config.json'))
  .then(res => res.json())
  .then(config => {
    const theme = config.defaultTheme;
    const themeColors = config.themes[theme];
    // Apply themeColors to popup or badge
  });