/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { loadCSS } from '../../scripts/lib-franklin.js';

function createPreviewOverlay(cls) {
  const overlay = document.createElement('div');
  overlay.className = cls;
  return overlay;
}

export function createButton(label) {
  const button = document.createElement('button');
  button.className = 'hlx-badge';
  const text = document.createElement('span');
  text.innerHTML = label;
  button.append(text);
  return button;
}

function createPopupItem(item) {
  const hasActions = item.actions && item.actions.length;
  const div = document.createElement('div');
  div.className = `hlx-popup-item${item.isSelected ? ' is-selected' : ''}`;
  div.innerHTML = `
    <h5 class="hlx-popup-item-label">${typeof item === 'object' ? item.label : item}</h5>
    ${item.description ? `<div class="hlx-popup-item-description">${item.description}</div>` : ''}`;
  if (hasActions) {
    const actions = document.createElement('div');
    actions.className = 'hlx-popup-item-actions';
    item.actions.forEach((action) => {
      const button = document.createElement('div');
      button.className = 'hlx-button';
      const a = document.createElement('a');
      a.href = action.href || '#';
      a.textContent = action.label;
      if (action.click) a.addEventListener('click', action.click);
      button.append(a);
      actions.append(button);
    });
    div.append(actions);
  }
  return div;
}

export function createPopupDialog(header, items = []) {
  const hasActions = header.actions && header.actions.length;

  const popup = document.createElement('div');
  popup.className = 'hlx-popup hlx-hidden';
  popup.innerHTML = `
    <div class="hlx-popup-header">
      <h5 class="hlx-popup-header-label">${typeof header === 'object' ? header.label : header}</h5>
      ${header.description ? `<div class="hlx-popup-header-description">${header.description}</div>` : ''}
    </div>
    <div class="hlx-popup-items"></div>`;

  if (hasActions) {
    const headerEl = popup.querySelector('.hlx-popup-header');

    const actions = document.createElement('div');
    actions.className = 'hlx-popup-header-actions';
    header.actions.forEach((action) => {
      const button = document.createElement('div');
      button.className = 'hlx-button';
      const a = document.createElement('a');
      a.href = action.href || '#';
      a.textContent = action.label;
      if (action.click) a.addEventListener('click', action.click);
      button.append(a);
      actions.append(button);
    });
    headerEl.append(actions);
  }
  
  const list = popup.querySelector('.hlx-popup-items');
  items.forEach((item) => {
    list.append(createPopupItem(item));
  });
  return popup;
}

export function createPopupButton(label, header, items, icon) {
  const button = createButton(label);
  const popup = createPopupDialog(header, items);
  button.innerHTML += '<span class="hlx-open"></span>';
  if (icon) button.innerHTML = `<span class="hlx-badge-${icon}"></span>` + button.innerHTML;
  button.append(popup);
  button.addEventListener('click', () => {
    popup.classList.toggle('hlx-hidden');
  });
  return button;
}

export function createToggleButton(label) {
  const button = document.createElement('div');
  button.className = 'hlx-badge';
  button.role = 'button';
  button.setAttribute('aria-pressed', false);
  button.setAttribute('tabindex', 0);
  const text = document.createElement('span');
  text.innerHTML = label;
  button.append(text);
  button.addEventListener('click', () => {
    button.setAttribute('aria-pressed', button.getAttribute('aria-pressed') === 'false');
  });
  return button;
}

export function getOverlay() {
  let overlay = document.querySelector('.hlx-preview-overlay');
  if (!overlay) {
    overlay = createPreviewOverlay('hlx-preview-overlay');
    document.body.append(overlay);
  }
  return overlay;
}

/**
 * Decorates Preview mode badges and overlays
 * @return {Object} returns the overlay container
 */
export default function decoratePreviewOverlay() {
  loadCSS(`${window.hlx.codeBasePath}/tools/preview/preview.css`);

  getOverlay();
}
