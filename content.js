// content.js
(function () {
  'use strict';

  // Optional: notify background when a paywall is removed
  function notifyPaywallRemoved() {
    try {
      chrome.runtime.sendMessage({ type: 'PAYWALL_REMOVED' });
    } catch (e) {
      // ignore if unavailable
    }
  }

  // Clear localStorage for non-whitelisted domains
  if (
    !matchDomain([
      'seekingalpha.com',
      'sfchronicle.com',
      'cen.acs.org',
      'elmundo.es',
      'scmp.com'
    ])
  ) {
    window.localStorage.clear();
  }

  /**********************************************************************
   * Site-specific handlers
   **********************************************************************/

  // elmercurio.com
  if (matchDomain('elmercurio.com')) {
    if (window.location.href.toLowerCase().includes('/inversiones/')) {
      document.addEventListener('DOMContentLoaded', () => {
        const paywall = document.querySelector('#modal_limit_articulos');
        const body = document.querySelector('body');
        removeDOMElement(paywall);
        if (body.hasAttribute('class')) {
          body.removeAttribute('class');
        }
        notifyPaywallRemoved();
      });
    }

  // estadao.com.br
  } else if (matchDomain('estadao.com.br')) {
    setTimeout(function () {
      const paywall = document.querySelector('#paywall-wrapper-iframe-estadao');
      const body = document.querySelector('html');

      removeDOMElement(paywall);
      body.removeAttribute('style');
      notifyPaywallRemoved();
    }, 300);

  // rep.repubblica.it
  } else if (matchDomain('rep.repubblica.it')) {
    window.setTimeout(function () {
      if (window.location.href.includes('/pwa/')) {
        window.location.href = window.location.href.replace('/pwa/', '/ws/detail/');
      }
    }, 500);

    if (window.location.href.includes('/ws/detail/')) {
      const paywall = document.querySelector('.paywall');
      if (paywall) {
        ampUnhideSubscriptionsSection();
        notifyPaywallRemoved();
      }
    }

  // archive.org
  } else if (matchDomain('archive.org')) {
    const inlineGate = document.querySelector('.inline-gate');
    if (inlineGate) {
      inlineGate.classList.remove('inline-gate');
      const inlineGated = document.querySelectorAll('.inline-gated');
      for (const elem of inlineGated) {
        elem.classList.remove('inline-gated');
      }
      notifyPaywallRemoved();
    }

  // telegraaf.nl
  } else if (matchDomain('telegraaf.nl')) {
    if (window.location.href.startsWith('https://www.telegraaf.nl/error?ref=/')) {
      window.location.href = window.location.href
        .split('&')[0]
        .replace('error?ref=/', '');
    }

    const articleWrapper = document.querySelector('.ArticlePageWrapper__uid');
    const spotXBanner = document.querySelector(
      '.ArticleBodyBlocks__inlineArticleSpotXBanner'
    );
    const paywall = document.querySelector('.PopupBackdrop__block');

    removeDOMElement(spotXBanner, paywall);

    const premium = document.querySelector('.PremiumLabelWithLine__body');
    const articleId = articleWrapper ? articleWrapper.innerText : '123';
    const articleBodyDone = document.querySelector('#articleBody' + articleId);

    if (premium && !articleBodyDone) {
      const articleBodyOld = document.querySelector('[id^=articleBody]');
      removeDOMElement(articleBodyOld);

      const json = document.querySelector(
        'script[type="application/ld+json"][data-react-helmet="true"]'
      );
      if (json) {
        const jsonText = JSON.parse(json.text).articleBody;
        const articleBody = document.querySelector(
          'section.TextArticlePage__bodyText'
        );

        if (articleBody) {
          const divMain = document.createElement('div');
          divMain.setAttribute('id', 'articleBody' + articleId);

          const divElem = document.createElement('div');
          divElem.setAttribute('data-element', 'articleBodyBlocks');

          const textArray = jsonText.split('\n\n');
          textArray.forEach(pText => {
            const pDiv = document.createElement('p');
            pDiv.setAttribute(
              'class',
              'ArticleBodyBlocks__paragraph ArticleBodyBlocks__paragraph--nieuws'
            );
            pDiv.innerText = pText;
            divElem.appendChild(pDiv);
          });

          divMain.appendChild(divElem);
          articleBody.appendChild(divMain);
          notifyPaywallRemoved();
        }
      }
    }

  // ad.nl group
  } else if (
    matchDomain([
      'ad.nl',
      'ed.nl',
      'bndestem.nl',
      'bd.nl',
      'tubantia.nl',
      'destentor.nl',
      'pzc.nl',
      'gelderlander.nl'
    ])
  ) {
    const paywall = document.querySelector(
      '.article__component.article__component--paywall-module-notification'
    );
    removeDOMElement(paywall);
    notifyPaywallRemoved();

  // washingtonpost.com
  } else if (matchDomain('washingtonpost.com')) {
    const leaderboard = document.querySelector('#leaderboard-wrapper');
    const adverts = document.querySelectorAll('div[data-qa="article-body-ad"]');
    const softwall = document.querySelector('[id^="softwall"]');
    removeDOMElement(leaderboard, softwall, ...adverts);

    if (window.location.href.includes('/gdpr-consent/')) {
      const freeButton = document.querySelector(
        '.gdpr-consent-container .continue-btn.button.free'
      );
      if (freeButton) {
        freeButton.click();
      }

      window.setTimeout(function () {
        const gdprcheckbox = document.querySelector(
          '.gdpr-consent-container .consent-page:not(.hide) #agree'
        );
        if (gdprcheckbox) {
          gdprcheckbox.checked = true;
          gdprcheckbox.dispatchEvent(new Event('change'));
          document
            .querySelector(
              '.gdpr-consent-container .consent-page:not(.hide) .continue-btn.button.accept-consent'
            )
            .click();
        }
      }, 300);
    } else {
      const url = window.location.href;

      function main(element) {
        removeDOMElement(element);
        window.location.href = url.split('?')[0] + '?outputType=amp';
      }

      if (!url.includes('outputType=amp')) {
        waitDOMElement('div[id^="paywall-"]', 'DIV', main, false);
      } else {
        const subscriptionsSections = document.querySelectorAll(
          '[subscriptions-section="content"]'
        );
        for (const subscriptionsSection of subscriptionsSections) {
          subscriptionsSection.removeAttribute('subscriptions-section');
        }
        notifyPaywallRemoved();
      }
    }

  // wsj.com (excluding cn.wsj.com)
  } else if (matchDomain('wsj.com') && !matchDomain('cn.wsj.com')) {
    if (window.location.href.includes('/articles/')) {
      const closeButton = document.querySelector(
        'div.close-btn[role="button"]'
      );
      if (closeButton) {
        closeButton.click();
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      const url = window.location.href;
      const snippet = document.querySelector('.snippet-promotion');
      const wsjPro = document.querySelector(
        'meta[name="page.site"][content="wsjpro"]'
      );

      if (snippet || wsjPro) {
        if (!window.location.hash) {
          if (url.includes('?')) {
            window.location.href = url.replace('?', '#refreshed?');
          } else {
            window.location.href = url + '#refreshed';
          }
        } else {
          window.location.href = window.location.href
            .replace('wsj.com', 'wsj.com/amp')
            .replace('#refreshed', '');
        }
      } else {
        notifyPaywallRemoved();
      }
    });

  // mexiconewsdaily.com
  } else if (matchDomain('mexiconewsdaily.com')) {
    window.setTimeout(function () {
      const popup = document.querySelector('div.pigeon-widget-prompt');
      const cproOverlay = document.querySelector('.cpro-overlay');
      removeDOMElement(popup, cproOverlay);
      notifyPaywallRemoved();
    }, 500);

  // the-american-interest.com
  } else if (matchDomain('the-american-interest.com')) {
    const counter = document.getElementById('article-counter');
    removeDOMElement(counter);
    notifyPaywallRemoved();

  // nzherald.co.nz
  } else if (matchDomain('nzherald.co.nz')) {
    const articleContent = document.querySelector('.article__content');
    if (articleContent) {
      const articleOffer = document.querySelector('.article-offer');
      if (articleOffer) {
        const cssSelector = articleContent
          .querySelectorAll('p')[5]
          .getAttribute('class');

        const hiddenNotPars = articleContent.querySelectorAll(
          '.' + cssSelector + ':not(p)'
        );
        for (const hiddenNotPar of hiddenNotPars) {
          hiddenNotPar.classList.remove(cssSelector);
          hiddenNotPar.removeAttribute('style');
        }

        const hiddenPars = articleContent.querySelectorAll(
          'p.' + cssSelector
        );
        const parser = new DOMParser();
        for (const hiddenPar of hiddenPars) {
          const parHtml = parser.parseFromString(
            '<div style="margin: 10px 0px; font-size: 17px">' +
              hiddenPar.innerHTML +
              '</div>',
            'text/html'
          );
          const parDom = parHtml.querySelector('div');
          articleContent.insertBefore(parDom, hiddenPar);
        }

        const firstSpan = document.querySelector('p > span');
        if (firstSpan) {
          firstSpan.removeAttribute('class');
        }

        removeDOMElement(articleOffer);
      }
    }

    const premiumToaster = document.querySelector('#premium-toaster');
    removeDOMElement(premiumToaster);
    notifyPaywallRemoved();

  // interest.co.nz
  } else if (matchDomain('interest.co.nz')) {
    const wrapper = document.getElementById('pp-ablock-banner-wrapper');
    const overlay = document.querySelector('.black-overlay');
    removeDOMElement(overlay, wrapper);
    notifyPaywallRemoved();

  // stuff.co.nz
  } else if (matchDomain('stuff.co.nz')) {
    const overlay = document.querySelector('.x0');
    removeDOMElement(overlay);
    notifyPaywallRemoved();

  // thenational.scot
  } else if (matchDomain('thenational.scot')) {
    const overlay = document.querySelector('.template-container');
    removeDOMElement(overlay);
    notifyPaywallRemoved();

  // thestar.com
  } else if (matchDomain('thestar.com')) {
    setTimeout(function () {
      const paywall = document.querySelector('.basic-paywall-new');
      removeDOMElement(paywall);

      const tbc = document.querySelectorAll('.text-block-container');
      for (const el of tbc) {
        el.removeAttribute('style');
      }
      notifyPaywallRemoved();
    }, 1000);

  // afr.com
  } else if (matchDomain('afr.com')) {
    document.addEventListener('DOMContentLoaded', () => {
      const hiddenImage = document.querySelectorAll('img');
      for (const image of hiddenImage) {
        const src = image.src;
        if (src.indexOf('.gif') !== -1) {
          const dataSrc = image.getAttribute('data-src');
          if (dataSrc) {
            image.setAttribute('src', dataSrc);
          }
        }
      }

      const plista = document.querySelector(
        'div[data-plista-placement="underArticle_Group"]'
      );
      removeDOMElement(plista);
      notifyPaywallRemoved();
    });

  // parool.nl, trouw.nl, volkskrant.nl, demorgen.be, humo.be
  } else if (
    matchDomain([
      'parool.nl',
      'trouw.nl',
      'volkskrant.nl',
      'demorgen.be',
      'humo.be'
    ])
  ) {
    document.addEventListener('DOMContentLoaded', () => {
      const topBanner = document.querySelector(
        'div[data-temptation-position="PAGE_TOP"]'
      );
      const paywall = document.querySelector(
        'div[data-temptation-position="ARTICLE_BOTTOM"]'
      );
      const hiddenSection = document.querySelector(
        'div[data-temptation-position="ARTICLE_INLINE"]'
      );
      const overlay = document.querySelector(
        'div[data-temptation-position="PAGE_BOTTOM"]'
      );
      removeDOMElement(topBanner, paywall, hiddenSection, overlay);
      notifyPaywallRemoved();
    });

  // firstthings.com
  } else if (matchDomain('firstthings.com')) {
    const paywall = document.getElementsByClassName('paywall')[0];
    removeDOMElement(paywall);
    notifyPaywallRemoved();

  // bloomberg.com
  } else if (matchDomain('bloomberg.com')) {
    blockElement('#graphics-paywall-overlay', true);
    // notifyPaywallRemoved() if you want

  // bloombergquint.com
  } else if (matchDomain('bloombergquint.com')) {
    const articlesLeftModal = document.getElementsByClassName(
      'paywall-meter-module__story-paywall-container__1UgCE'
    )[0];
    const paywall = document.getElementById('paywallDmp');
    removeDOMElement(articlesLeftModal, paywall);
    notifyPaywallRemoved();

  // medium.com
  } else if (
    matchDomain('medium.com') ||
    document.querySelector('script[src^="https://cdn-client.medium.com/"]')
  ) {
    const paywall = document.querySelector('div#paywall-background-color');
    removeDOMElement(paywall);

    if (paywall) {
      try {
        chrome.runtime.sendMessage({ request: 'refreshCurrentTab' });
      } catch (e) {}
    }

    window.setTimeout(function () {
      const meter = document.querySelector('[id*="highlight-meter-"]');
      if (meter) {
        meter.hidden = true;
      }
      notifyPaywallRemoved();
    }, 500);

  // bostonglobe.com
  } else if (matchDomain('bostonglobe.com')) {
    const paywall = document.querySelector('div.meter-paywall');
    if (paywall) {
      removeDOMElement(paywall);
    }
    const body = document.querySelector('body');
    if (body) {
      document.body.removeAttribute('style');
    }
    const buttonDiv = document.querySelector('[id="continue_button"]');
    if (buttonDiv) {
      const button = buttonDiv.querySelector('button');
      if (button) {
        button.click();
      }
    }
    notifyPaywallRemoved();

  // nationalgeographic.com
  } else if (matchDomain('nationalgeographic.com')) {
    new window.MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof window.HTMLElement) {
            if (node.matches('#fittPortal_0')) {
              removeDOMElement(node);
              const body = document.body;
              body.removeAttribute('class');
              body.removeAttribute('style');
              body.removeAttribute('overflow');
              const blur = document.querySelector(
                '#natgeo-template1-frame-1-module-1 > div > div > section > article > section > div.Article__Content__Overlay--gated'
              );
              if (blur) {
                removeDOMElement(blur);
              }
              notifyPaywallRemoved();
              this.disconnect();
            }
          }
        }
      }
    }).observe(document, { subtree: true, childList: true });

  // hbrchina.org
  } else if (matchDomain('hbrchina.org')) {
    const hiddenDiv = document.querySelector('div#the_content');
    if (hiddenDiv) {
      hiddenDiv.removeAttribute('style');
      notifyPaywallRemoved();
    }

  // scmp.com (AMP)
  } else if (matchDomain('scmp.com')) {
    if (window.location.href.includes('/amp.')) {
      const divHidden = document.querySelectorAll(
        'div.article-body[amp-access][amp-access-hide]'
      );
      for (const elem of divHidden) {
        elem.removeAttribute('amp-access-hide');
      }
      const defaultMeters = document.querySelectorAll(
        'div.default-meter, div#archive-article-meter'
      );
      const ads = document.querySelectorAll(
        'amp-ad, div.ad-banner, div.advert-fly-carpet-container, div.inline-advert'
      );
      removeDOMElement(...defaultMeters, ...ads);
      notifyPaywallRemoved();
    }
  }

  /**********************************************************************
   * Helper functions
   **********************************************************************/

  function matchDomain(domains) {
    const hostname = window.location.hostname;
    if (typeof domains === 'string') {
      domains = [domains];
    }
    return domains.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });
  }

  function waitDOMElement(selector, tagName = '', callback, multiple = false) {
    new window.MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!tagName || node.tagName === tagName) {
            if (node.matches && node.matches(selector)) {
              callback(node);
              if (!multiple) {
                this.disconnect();
              }
            }
          }
        }
      }
    }).observe(document, {
      subtree: true,
      childList: true
    });
  }

  function removeDOMElement(...elements) {
    for (const element of elements) {
      if (element) {
        element.remove();
      }
    }
  }

  function removeClassesByPrefix(el, prefix) {
    for (const clazz of el.classList) {
      if (clazz.startsWith(prefix)) {
        el.classList.remove(clazz);
      }
    }
  }

  function blockElement(selector, blockAlways = false) {
    new window.MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof window.HTMLElement) {
            if (node.matches(selector)) {
              removeDOMElement(node);
              if (!blockAlways) {
                this.disconnect();
              }
            }
          }
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }

  function ampUnhideSubscriptionsSection(ampAdsSel = 'amp-ad, .ad') {
    const preview = document.querySelector(
      '[subscriptions-section="content-not-granted"]'
    );
    removeDOMElement(preview);

    const subscriptionsSection = document.querySelectorAll(
      '[subscriptions-section="content"]'
    );
    for (const elem of subscriptionsSection) {
      elem.removeAttribute('subscriptions-section');
    }

    const ampAds = document.querySelectorAll(ampAdsSel);
    removeDOMElement(...ampAds);
  }
})();
fetch(chrome.runtime.getURL('config.json'))
  .then(res => res.json())
  .then(config => {
    const currentHost = window.location.hostname;
    const isSupported = config.supportedSites.some(site =>
      currentHost === site || currentHost.endsWith('.' + site)
    );
    if (isSupported) {
      // Run paywall logic
    }
  });