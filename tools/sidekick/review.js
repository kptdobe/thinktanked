import {
  addPageToReview,
  getReviewEnv,
  getReviews,
  approveReview,
  rejectReview,
  submitForReview,
  updateReview,
} from './review-actions.js';

async function getReviewStatus() {
  const reviews = await getReviews();
  if (reviews.length === 1 && reviews[0].reviewId === 'default') return reviews[0].status;
  return ('open');
}

async function getPageReview() {
  const reviews = await getReviews();
  console.log(reviews);
  const review = reviews.find((r) => r.pages.find((p) => p.split('?')[0] === window.location.pathname));
  return review;
}

async function getPageStatus() {
  const review = await getPageReview();
  if (review) return review.status;
  return '';
}

async function getOpenReviews() {
  const reviews = await getReviews();
  return reviews.filter((r) => r.status === 'open');
}

function getPageParams() {
  const params = new URLSearchParams();
  document.querySelectorAll('form[data-config-token]').forEach((e) => {
    params.append('form', e.dataset.configToken);
  });
  const search = params.toString();
  if (search) return (`?${search}`);
  return '';
}

async function addReviewToEnvSelector(shadowRoot) {
  const env = getReviewEnv();
  const reviews = await getReviews();
  const fc = shadowRoot.querySelector('.feature-container');
  const envSwitcher = fc.querySelector('.env');
  const dc = fc.querySelector('.env .dropdown-container');

  const createButton = (text) => {
    const button = document.createElement('button');
    button.title = text;
    button.tabindex = '0';
    button.textContent = text;
    button.addEventListener('click', () => {
      if (text === 'Preview') {
        window.location.href = `https://${env.ref}--${env.repo}--${env.owner}.hlx.page${window.location.pathname}`;
      }
      if (text === 'Review') {
        window.location.href = `https://${reviews[0].reviewId}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${window.location.pathname}`;
      }
      if (text === 'Live') {
        window.location.href = `https://${env.ref}--${env.repo}--${env.owner}.hlx.live${window.location.pathname}`;
      }
      if (text === 'Production') {
        window.location.href = `https://www.penbrayacomingsoon.com${window.location.pathname}`;
      }
    });
    return (button);
  };

  if (fc.querySelector('.env.hlx-sk-hidden')) {
    envSwitcher.classList.remove('hlx-sk-hidden');
    const toggle = fc.querySelector('.env .dropdown-toggle');
    toggle.textContent = 'Review';
    const states = ['Preview', 'Live', 'Production'];
    dc.textContent = '';
    states.forEach((state) => {
      const pluginDiv = document.createElement('div');
      pluginDiv.className = `plugin ${state.toLowerCase()}`;
      pluginDiv.append(createButton(state));
      dc.append(pluginDiv);
    });
  }
  const live = dc.querySelector('.live');
  const div = document.createElement('div');
  div.className = 'review plugin';
  div.append(createButton('Review'));
  live.before(div);
}

async function previewMode(plugins, sk) {
  const div = plugins.querySelector('plugin.move-to-review');
  const button = div.querySelector('button');

  const env = getReviewEnv();

  const setReviewStatus = (pageStatus, reviewStatus) => {
    let statusText;
    if (pageStatus === 'open') {
      statusText = 'Ready for Review';
      button.classList.add('ready');
    }
    if (pageStatus === 'submitted') {
      statusText = 'Submitted for Review';
      button.classList.add('submitted');
    }
    if (pageStatus === '') {
      statusText = 'Move to Review';
    }
    if (reviewStatus === 'submitted') button.setAttribute('disabled', '');
    button.innerHTML = `${statusText}`;
  };

  const pageStatus = await getPageStatus();
  const reviewStatus = await getReviewStatus();

  setReviewStatus(pageStatus, reviewStatus);

  sk.addEventListener('custom:move-to-review', async () => {
    const openReviews = await getOpenReviews();
    if (openReviews.length === 1) {
      const search = getPageParams();
      await addPageToReview(window.location.pathname + search, openReviews[0].reviewId);
    }
    window.location.href = `https://default--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${window.location.pathname}`;
  });
}

async function openManifest(sk) {
  const env = getReviewEnv();
  const reviews = await getReviews();
  console.log(reviews);
  console.log(env);
  const review = reviews.find((r) => r.reviewId === env.review);

  const dialog = document.createElement('dialog');
  dialog.className = 'hlx-dialog';
  const edit = review.status === 'open' ? `<div class="hlx-edit-manifest hlx-edit-hide"><button id="hlx-edit-manifest">Edit Pages in Change Log</button><textarea wrap="off" rows="10">${review.pages.map((path) => `https://${env.ref}--${env.repo}--${env.owner}.hlx.page${path}`).join('\n')}</textarea><button id="hlx-update-manifest">Update Change Log</button></div>` : '';
  const buttons = review.status === 'open' ? '<button id="hlx-submit">Submit for Review</button>' : '<button id="hlx-approve">Approve and Publish</button> <button id="hlx-reject">Reject Review</button>';
  const pages = review.pages.map((path) => `<p class="hlx-row"><a href="${path}">https://${env.review}--${env.ref}--${env.repo}--${env.owner}.hlx.reviews${path}</a></p>`);
  dialog.innerHTML = `
    <form method="dialog">
      <button class="hlx-close-button">X</button>
    </form>
    <h3>Change Log for ${review.reviewId} Review (${review.status === 'open' ? 'Preparing For Review' : 'Submitted For Review'})</h3>
    <p>${buttons}</p>
    ${pages.join('')}
    ${edit}
  `;
  const editManifest = dialog.querySelector('#hlx-edit-manifest');
  if (editManifest) {
    editManifest.addEventListener('click', () => {
      editManifest.parentElement.classList.remove('hlx-edit-hide');
      editManifest.parentElement.classList.add('hlx-edit-show');
    });
  }
  const update = dialog.querySelector('#hlx-update-manifest');
  if (update) {
    update.addEventListener('click', () => {
      const ta = dialog.querySelector('textarea');
      const taPages = ta.value.split('\n').filter((line) => !!line).map((line) => {
        console.log(`line:${line}`);
        const url = new URL(line, window.location.href);
        return (url.pathname + url.search);
      });
      updateReview(taPages, review.reviewId, env);
      dialog.close();
    });
  }

  const verbs = [{ id: 'reject', f: rejectReview }, { id: 'approve', f: approveReview }, { id: 'submit', f: submitForReview }];

  verbs.forEach((verb) => {
    const button = dialog.querySelector(`#hlx-${verb.id}`);
    if (button) {
      button.addEventListener('click', async () => {
        await verb.f(review.reviewId);
        dialog.close();
        if (verb.id === 'approve') {
          window.location.href = `https://${env.ref}--${env.repo}--${env.owner}.hlx.live${window.location.pathname}`;
        } else {
          window.location.reload();
        }
      });
    }
  });

  sk.shadowRoot.append(dialog);
  dialog.showModal();
}

async function reviewMode(plugins, sk) {
  const reviewStatus = await getReviewStatus();
  console.log(reviewStatus);
  const div = document.createElement('div');
  if (reviewStatus === 'open') {
    div.className = 'review-status-badge open';
    div.innerHTML = '<span class="badge-unlocked"></span><span>Preparing for Review</span>';
  }
  if (reviewStatus === 'submitted') {
    div.className = 'review-status-badge submitted';
    div.innerHTML = '<span class="badge-locked"></span><span>Review Submitted</span>';
  }
  div.classList.add('plugin');
  plugins.append(div);
  div.addEventListener('click', () => {
    openManifest(sk);
  });
}

async function decorateSidekick(sk) {
  const env = getReviewEnv();
  const { state } = env;
  const plugins = sk.shadowRoot.querySelector('.plugin-container');

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/tools/sidekick/review.css';

  sk.shadowRoot.append(link);

  if (state === 'page') previewMode(plugins, sk);
  if (state === 'reviews') reviewMode(plugins, sk);

  addReviewToEnvSelector(sk.shadowRoot);
}

function waitForSidekickPlugins(sk) {
  // workaround for missing customization event
  if (sk && sk.shadowRoot && sk.shadowRoot.querySelector('.plugin-container')) {
    decorateSidekick(sk);
  } else {
    setTimeout(() => waitForSidekickPlugins(sk), 1000);
  }
}

(() => {
  const sk = document.querySelector('helix-sidekick');
  if (sk) {
    waitForSidekickPlugins(sk);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener('helix-sidekick-ready', () => {
      waitForSidekickPlugins(sk);
    }, { once: true });
  }
})();
