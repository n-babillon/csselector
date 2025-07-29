// Content script pour l'extension CSS Selector Generator

class CSSSelector {
    constructor() {
      this.isActive = false;
      this.tooltip = null;
      this.overlay = null;
      this.selectedElement = null;
      this.isTooltipFixed = false;
      this.init();
    }
  
    init() {
      this.createTooltip();
      this.createOverlay();
      this.bindEvents();
    }
  
    createTooltip() {
      this.tooltip = document.createElement('div');
      this.tooltip.id = 'css-selector-tooltip';
      this.tooltip.style.cssText = `
        position: fixed;
        background: #2d3748;
        color: white;
        padding: 12px;
        border-radius: 8px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: none;
        border: 1px solid #4a5568;
      `;
      document.body.appendChild(this.tooltip);
    }
  
    createOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.id = 'css-selector-overlay';
      this.overlay.style.cssText = `
        position: absolute;
        background: rgba(59, 130, 246, 0.3);
        border: 2px solid #3b82f6;
        pointer-events: none;
        z-index: 9999;
        display: none;
      `;
      document.body.appendChild(this.overlay);
    }
  
    bindEvents() {
      document.addEventListener('mouseover', this.handleMouseOver.bind(this));
      document.addEventListener('mouseout', this.handleMouseOut.bind(this));
      document.addEventListener('click', this.handleClick.bind(this));
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
  
      // Écouter les messages du popup
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle') {
          this.toggle();
          sendResponse({ active: this.isActive });
        }
      });
    }
  
    toggle() {
      this.isActive = !this.isActive;
      if (!this.isActive) {
        this.isTooltipFixed = false;
        this.hideTooltip();
        this.hideOverlay();
      }
      document.body.style.cursor = this.isActive ? 'crosshair' : '';
    }
  
    handleMouseOver(e) {
      if (!this.isActive || e.target === this.tooltip || e.target === this.overlay || this.isTooltipFixed) return;
      
      this.selectedElement = e.target;
      this.showOverlay(e.target);
      this.showTooltip(e);
    }
  
    handleMouseOut(e) {
      if (!this.isActive || this.isTooltipFixed) return;
      // Ne pas cacher si on survole le tooltip
      if (e.relatedTarget === this.tooltip || this.tooltip.contains(e.relatedTarget)) return;
      this.hideOverlay();
    }
  
    handleClick(e) {
      if (!this.isActive) return;
      
      // Si le clic est sur le tooltip ou ses enfants, ne pas fixer/défixer
      if (this.tooltip && (e.target === this.tooltip || this.tooltip.contains(e.target))) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Fixer/défixer le tooltip
      if (this.isTooltipFixed) {
        this.unfixTooltip();
      } else {
        this.fixTooltip(e.target);
      }
    }
  
    handleKeyDown(e) {
      if (e.key === 'Escape' && this.isActive) {
        if (this.isTooltipFixed) {
          this.unfixTooltip();
        } else {
          this.toggle();
        }
      }
    }
  
    showOverlay(element) {
      const rect = element.getBoundingClientRect();
      this.overlay.style.display = 'block';
      this.overlay.style.left = (rect.left + window.scrollX) + 'px';
      this.overlay.style.top = (rect.top + window.scrollY) + 'px';
      this.overlay.style.width = rect.width + 'px';
      this.overlay.style.height = rect.height + 'px';
    }
  
    hideOverlay() {
      this.overlay.style.display = 'none';
    }
  
    showTooltip(e) {
      const selectors = this.generateSelectors(e.target);
      this.tooltip.innerHTML = this.formatSelectors(selectors);
      this.tooltip.style.display = 'block';
      
      // Ajouter les event listeners pour les clics sur les sélecteurs
      this.addSelectorClickListeners();
      
      // Positionner le tooltip
      const x = e.clientX + 10;
      const y = e.clientY - 10;
      
      this.tooltip.style.left = x + 'px';
      this.tooltip.style.top = y + 'px';
      
      // Ajuster si le tooltip sort de l'écran
      const tooltipRect = this.tooltip.getBoundingClientRect();
      if (tooltipRect.right > window.innerWidth) {
        this.tooltip.style.left = (x - tooltipRect.width - 20) + 'px';
      }
      if (tooltipRect.top < 0) {
        this.tooltip.style.top = (y + 20) + 'px';
      }
    }
  
    hideTooltip() {
      this.tooltip.style.display = 'none';
    }

    fixTooltip(element) {
      this.isTooltipFixed = true;
      this.selectedElement = element;
      
      // Ajouter un indicateur visuel que le tooltip est fixé
      this.tooltip.style.border = '2px solid #10b981';
      this.tooltip.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
      
      // Générer et afficher les sélecteurs avec scroll
      const selectors = this.generateSelectors(element);
      this.tooltip.innerHTML = this.formatFixedSelectors(selectors);
      
      // Ajouter les event listeners pour les clics sur les sélecteurs
      this.addSelectorClickListeners();
      
      // Repositionner au centre de l'écran
      this.tooltip.style.position = 'fixed';
      this.tooltip.style.left = '50%';
      this.tooltip.style.top = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
      this.tooltip.style.maxHeight = '80vh';
      this.tooltip.style.overflowY = 'auto';
      this.tooltip.style.maxWidth = '600px';
      this.tooltip.style.zIndex = '10001';
    }

    unfixTooltip() {
      this.isTooltipFixed = false;
      this.tooltip.style.border = '1px solid #4a5568';
      this.tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      this.tooltip.style.transform = 'none';
      this.tooltip.style.maxHeight = '400px';
      this.tooltip.style.overflowY = 'visible';
      this.tooltip.style.maxWidth = '400px';
      this.hideTooltip();
      this.hideOverlay();
    }

    addSelectorClickListeners() {
      // Ajouter des event listeners pour tous les éléments de sélecteur
      const selectorItems = this.tooltip.querySelectorAll('.css-selector-item');
      selectorItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const selector = item.dataset.selector;
          this.copyToClipboard(selector);
          this.showCopyNotification(selector);
          
          // Feedback visuel
          item.style.background = 'rgba(34,197,94,0.3)';
          item.style.borderColor = '#22c55e';
          
          setTimeout(() => {
            item.style.background = 'rgba(255,255,255,0.08)';
            item.style.borderColor = 'rgba(255,255,255,0.1)';
          }, 2000);
        });
      });
      
      // Ajouter event listener pour le bouton fermer
      const closeBtn = this.tooltip.querySelector('.close-tooltip-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.unfixTooltip();
        });
      }
    }
  
    generateSelectors(element) {
      const selectors = [];
      
      // Sélecteur basique
      const basicSelector = this.getBasicSelector(element);
      selectors.push({
        type: 'Basique',
        selector: basicSelector,
        description: 'Sélecteur simple par tag/classe/id',
        specificity: this.calculateSpecificity(basicSelector),
        parent: this.getParentInfo(element)
      });
  
      // Sélecteur par chemin complet
      const fullPathSelector = this.getFullPathSelector(element);
      selectors.push({
        type: 'Chemin complet',
        selector: fullPathSelector,
        description: 'Chemin complet depuis la racine',
        specificity: this.calculateSpecificity(fullPathSelector),
        parent: this.getParentInfo(element)
      });
  
      // Sélecteur par attributs
      const attrSelector = this.getAttributeSelector(element);
      if (attrSelector) {
        selectors.push({
          type: 'Par attributs',
          selector: attrSelector,
          description: 'Basé sur les attributs de l\'élément',
          specificity: this.calculateSpecificity(attrSelector),
          parent: this.getParentInfo(element)
        });
      }
  
      // Sélecteur nth-child
      const nthSelector = this.getNthChildSelector(element);
      selectors.push({
        type: 'nth-child',
        selector: nthSelector,
        description: 'Position relative au parent',
        specificity: this.calculateSpecificity(nthSelector),
        parent: this.getParentInfo(element.parentElement)
      });
  
      // Sélecteurs avec pseudo-éléments
      if (element.tagName !== 'INPUT' && element.tagName !== 'IMG') {
        const beforeSelector = basicSelector + '::before';
        selectors.push({
          type: 'Pseudo ::before',
          selector: beforeSelector,
          description: 'Pseudo-élément avant le contenu',
          specificity: this.calculateSpecificity(beforeSelector),
          parent: this.getParentInfo(element)
        });
  
        const afterSelector = basicSelector + '::after';
        selectors.push({
          type: 'Pseudo ::after',
          selector: afterSelector,
          description: 'Pseudo-élément après le contenu',
          specificity: this.calculateSpecificity(afterSelector),
          parent: this.getParentInfo(element)
        });
      }
  
      // Sélecteurs conditionnels
      const hoverSelector = basicSelector + ':hover';
      selectors.push({
        type: 'Hover',
        selector: hoverSelector,
        description: 'État au survol',
        specificity: this.calculateSpecificity(hoverSelector),
        parent: this.getParentInfo(element)
      });
  
      if (element.tagName === 'A') {
        const visitedSelector = basicSelector + ':visited';
        selectors.push({
          type: 'Lien visité',
          selector: visitedSelector,
          description: 'Lien déjà visité',
          specificity: this.calculateSpecificity(visitedSelector),
          parent: this.getParentInfo(element)
        });
      }
  
      // Sélecteur par parent
      const parent = element.parentElement;
      if (parent && parent !== document.body) {
        const parentSelector = this.getBasicSelector(parent) + ' ' + element.tagName.toLowerCase();
        selectors.push({
          type: 'Via parent',
          selector: parentSelector,
          description: 'Ciblage via l\'élément parent',
          specificity: this.calculateSpecificity(parentSelector),
          parent: this.getParentInfo(parent)
        });
      }
  
      // Sélecteur par enfant direct
      if (parent && parent !== document.body) {
        const childSelector = this.getBasicSelector(parent) + ' > ' + element.tagName.toLowerCase();
        selectors.push({
          type: 'Enfant direct',
          selector: childSelector,
          description: 'Enfant direct du parent',
          specificity: this.calculateSpecificity(childSelector),
          parent: this.getParentInfo(parent)
        });
      }
  
      // Sélecteur par frère adjacent
      const previousSibling = element.previousElementSibling;
      if (previousSibling) {
        const siblingSelector = this.getBasicSelector(previousSibling) + ' + ' + element.tagName.toLowerCase();
        selectors.push({
          type: 'Frère adjacent',
          selector: siblingSelector,
          description: 'Élément suivant directement un frère',
          specificity: this.calculateSpecificity(siblingSelector),
          parent: this.getParentInfo(element.parentElement)
        });
      }

      // Sélecteurs fonctionnels CSS modernes
      const functionalSelectors = this.generateFunctionalSelectors(element);
      selectors.push(...functionalSelectors);

      // Trier les sélecteurs par spécificité (de la plus haute à la plus basse)
      return selectors.sort((a, b) => {
        const specA = a.specificity;
        const specB = b.specificity;
        
        // Comparer inline d'abord
        if (specA.inline !== specB.inline) return specB.inline - specA.inline;
        // Puis les IDs
        if (specA.ids !== specB.ids) return specB.ids - specA.ids;
        // Puis les classes
        if (specA.classes !== specB.classes) return specB.classes - specA.classes;
        // Enfin les éléments
        return specB.elements - specA.elements;
      });
    }
  
    getBasicSelector(element) {
      if (element.id) {
        return '#' + element.id;
      }
      
      if (element.className) {
        const classes = element.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          return '.' + classes.join('.');
        }
      }
      
      return element.tagName.toLowerCase();
    }
  
    getFullPathSelector(element) {
      const path = [];
      let current = element;
      
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
          selector = '#' + current.id;
          path.unshift(selector);
          break;
        }
        
        if (current.className) {
          const classes = current.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        // Ajouter nth-child si nécessaire pour la spécificité
        const siblings = Array.from(current.parentElement?.children || []);
        const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
        if (sameTagSiblings.length > 1) {
          const index = sameTagSiblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
        
        path.unshift(selector);
        current = current.parentElement;
      }
      
      return path.join(' > ');
    }
  
    getAttributeSelector(element) {
      const attributes = [];
      
      for (let attr of element.attributes) {
        if (attr.name === 'class' || attr.name === 'id') continue;
        if (attr.name.startsWith('data-')) {
          attributes.push(`[${attr.name}="${attr.value}"]`);
        }
      }
      
      if (attributes.length > 0) {
        return element.tagName.toLowerCase() + attributes.join('');
      }
      
      return null;
    }
  
    getNthChildSelector(element) {
      const parent = element.parentElement;
      if (!parent) return element.tagName.toLowerCase();
      
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      
      return `${parent.tagName.toLowerCase()} > :nth-child(${index})`;
    }
  
    formatSelectors(selectors) {
      let html = '<div style="margin-bottom: 12px; font-weight: bold; color: #a0aec0; border-bottom: 1px solid #4a5568; padding-bottom: 8px;">🎯 Sélecteurs CSS disponibles</div>';
      
      selectors.forEach((sel, i) => {
        const specificityColor = this.getSpecificityColor(sel.specificity);
        const specificityText = `(${sel.specificity.inline},${sel.specificity.ids},${sel.specificity.classes},${sel.specificity.elements})`;
        
        html += `
          <div class="css-selector-item" data-selector="${this.escapeHtml(sel.selector)}" style="margin-bottom: 8px; cursor: pointer; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease;" 
               onmouseover="this.style.background='rgba(255,255,255,0.15)'"
               onmouseout="this.style.background='rgba(255,255,255,0.08)'">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="color: #60a5fa; font-weight: bold; font-size: 12px;">${sel.type}</div>
              <div style="background: ${specificityColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">
                ${specificityText}
              </div>
            </div>
            
            <div style="color: #f7fafc; font-family: 'Monaco', monospace; font-size: 11px; word-break: break-all; line-height: 1.3; margin-bottom: 6px;">
              ${this.escapeHtml(sel.selector)}
            </div>
            
            <div style="color: #a0aec0; font-size: 10px; margin-bottom: 6px;">
              ${sel.description}
            </div>
            
            ${sel.parent ? `
            <div style="background: rgba(0,0,0,0.3); padding: 6px; border-radius: 4px; border-left: 3px solid #60a5fa;">
              <div style="color: #93c5fd; font-size: 10px; font-weight: bold; margin-bottom: 2px;">📋 Parent:</div>
              <div style="color: #e2e8f0; font-size: 10px; font-family: monospace;">
                ${sel.parent.tag}${sel.parent.id ? ` #${sel.parent.id}` : ''}${sel.parent.classes ? ` .${sel.parent.classes.join('.')}` : ''}
              </div>
              ${sel.parent.attributes.length > 0 ? `
              <div style="color: #cbd5e0; font-size: 9px; margin-top: 2px;">
                ${sel.parent.attributes.join(', ')}
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
        `;
      });
      
      html += `
      <div style="margin-top: 12px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; font-size: 10px; border-left: 3px solid #fbbf24;">
        <div style="color: #fcd34d; font-weight: bold; margin-bottom: 4px;">💡 Légende spécificité:</div>
        <div style="color: #fef3c7; line-height: 1.4;">
          • <span style="background: #dc2626; padding: 1px 4px; border-radius: 2px;">Très haute</span> (1,x,x,x) - Inline styles<br>
          • <span style="background: #ea580c; padding: 1px 4px; border-radius: 2px;">Haute</span> (0,2+,x,x) - Multiple IDs<br>
          • <span style="background: #d97706; padding: 1px 4px; border-radius: 2px;">Moyenne</span> (0,1,x,x) - Un ID<br>
          • <span style="background: #059669; padding: 1px 4px; border-radius: 2px;">Basse</span> (0,0,x,x) - Classes/attributs<br>
          • <span style="background: #0284c7; padding: 1px 4px; border-radius: 2px;">Très basse</span> (0,0,0,x) - Éléments seulement
        </div>
      </div>
      `;
      
      html += '<div style="margin-top: 10px; font-size: 10px; color: #a0aec0; border-top: 1px solid #4a5568; padding-top: 8px; text-align: center;">📋 Cliquez sur un sélecteur pour le copier • ESC pour quitter</div>';
      
      return html;
    }

    formatFixedSelectors(selectors) {
      let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #10b981;">
          <div style="font-weight: bold; color: #10b981; font-size: 16px;">🎯 Sélecteurs CSS (triés par spécificité)</div>
          <button class="close-tooltip-btn" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">✕ Fermer</button>
        </div>
      `;
      
      selectors.forEach((sel, i) => {
        const specificityColor = this.getSpecificityColor(sel.specificity);
        const specificityText = `(${sel.specificity.inline},${sel.specificity.ids},${sel.specificity.classes},${sel.specificity.elements})`;
        const rank = i + 1;
        
        html += `
          <div class="css-selector-item" data-selector="${this.escapeHtml(sel.selector)}" style="margin-bottom: 12px; cursor: pointer; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease; position: relative;" 
               onmouseover="this.style.background='rgba(255,255,255,0.15)'"
               onmouseout="this.style.background='rgba(255,255,255,0.08)'">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="background: ${specificityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; min-width: 20px; text-align: center;">
                  #${rank}
                </div>
                <div style="color: #60a5fa; font-weight: bold; font-size: 13px;">${sel.type}</div>
              </div>
              <div style="background: ${specificityColor}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold;">
                ${specificityText}
              </div>
            </div>
            
            <div style="color: #f7fafc; font-family: 'Monaco', monospace; font-size: 12px; word-break: break-all; line-height: 1.4; margin-bottom: 8px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; border-left: 3px solid ${specificityColor};">
              ${this.escapeHtml(sel.selector)}
            </div>
            
            <div style="color: #a0aec0; font-size: 11px; margin-bottom: 8px; font-style: italic;">
              ${sel.description}
            </div>
            
            ${sel.parent ? `
            <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border-left: 3px solid #60a5fa;">
              <div style="color: #93c5fd; font-size: 11px; font-weight: bold; margin-bottom: 4px;">📋 Parent ciblé:</div>
              <div style="color: #e2e8f0; font-size: 11px; font-family: monospace;">
                ${this.getParentSelector(sel.parent)}
              </div>
              ${sel.parent.attributes.length > 0 ? `
              <div style="color: #cbd5e0; font-size: 10px; margin-top: 4px;">
                Attributs: ${sel.parent.attributes.join(', ')}
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            <div style="position: absolute; top: 8px; right: 8px; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">
              📋 Clic pour copier
            </div>
          </div>
        `;
      });
      
      html += `
      <div style="margin-top: 16px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 11px; border-left: 3px solid #fbbf24;">
        <div style="color: #fcd34d; font-weight: bold; margin-bottom: 6px;">💡 Légende spécificité:</div>
        <div style="color: #fef3c7; line-height: 1.5;">
          • <span style="background: #dc2626; padding: 2px 6px; border-radius: 3px;">#1-2</span> Très haute (inline, multiple IDs)<br>
          • <span style="background: #ea580c; padding: 2px 6px; border-radius: 3px;">#3-5</span> Haute (IDs)<br>
          • <span style="background: #d97706; padding: 2px 6px; border-radius: 3px;">#6-10</span> Moyenne (classes, attributs)<br>
          • <span style="background: #059669; padding: 2px 6px; border-radius: 3px;">#11+</span> Basse (éléments seulement)
        </div>
      </div>
      `;
      
      html += '<div style="margin-top: 12px; font-size: 11px; color: #a0aec0; border-top: 1px solid #4a5568; padding-top: 10px; text-align: center;">📋 Cliquez sur un sélecteur pour le copier • ESC pour fermer</div>';
      
      return html;
    }
  
    calculateSpecificity(selector) {
      // Calculer la spécificité CSS selon les règles W3C
      let inline = 0;
      let ids = 0;
      let classes = 0;
      let elements = 0;
  
      // Nettoyer le sélecteur des pseudo-éléments pour le calcul
      const cleanSelector = selector.replace(/::(before|after|first-letter|first-line)/g, '');
  
      // Compter les IDs
      ids = (cleanSelector.match(/#[\w-]+/g) || []).length;
  
      // Compter les classes, attributs et pseudo-classes
      const classMatches = (cleanSelector.match(/\.[\w-]+/g) || []).length;
      const attrMatches = (cleanSelector.match(/\[[^\]]+\]/g) || []).length;
      const pseudoMatches = (cleanSelector.match(/:(?!:)[\w-]+(\([^)]*\))?/g) || []).length;
      classes = classMatches + attrMatches + pseudoMatches;
  
      // Compter les éléments (en excluant les pseudo-éléments déjà supprimés)
      const elementMatches = cleanSelector.match(/\b[a-z][a-z0-9]*(?:-[a-z0-9]+)*\b/gi) || [];
      elements = elementMatches.filter(match => 
        !match.match(/^(and|or|not|from|to|of)$/i) && // Exclure les mots-clés CSS
        !cleanSelector.includes('.' + match) && // Pas une classe
        !cleanSelector.includes('#' + match)   // Pas un ID
      ).length;
  
      return { inline, ids, classes, elements };
    }
  
    getSpecificityColor(specificity) {
      const { inline, ids, classes, elements } = specificity;
      
      if (inline > 0) return '#dc2626'; // Rouge - Très haute spécificité
      if (ids > 1) return '#ea580c'; // Orange foncé - Haute spécificité  
      if (ids === 1) return '#d97706'; // Orange - Moyenne-haute spécificité
      if (classes > 0) return '#059669'; // Vert - Basse-moyenne spécificité
      return '#0284c7'; // Bleu - Très basse spécificité
    }
  
    getParentInfo(element) {
      if (!element || element === document.body || element === document.html) {
        return null;
      }
  
      const classes = element.className ? 
        element.className.split(' ').filter(c => c.trim()) : [];
      
      const attributes = [];
      for (let attr of element.attributes || []) {
        if (attr.name !== 'class' && attr.name !== 'id') {
          if (attr.name.startsWith('data-')) {
            attributes.push(`${attr.name}="${attr.value}"`);
          } else if (['type', 'role', 'aria-label'].includes(attr.name)) {
            attributes.push(`${attr.name}="${attr.value}"`);
          }
        }
      }
  
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        classes: classes.length > 0 ? classes : null,
        attributes: attributes.slice(0, 3) // Limiter à 3 attributs pour l'affichage
      };
    }

    getParentSelector(parentInfo) {
      if (!parentInfo) return '';
      
      // Prioriser les classes s'il y en a
      if (parentInfo.classes && parentInfo.classes.length > 0) {
        return `.${parentInfo.classes.join('.')}`;
      }
      
      // Puis l'ID s'il existe
      if (parentInfo.id) {
        return `#${parentInfo.id}`;
      }
      
      // Sinon le tag
      return parentInfo.tag;
    }
  
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  
    copyToClipboard(text) {
      // Méthode moderne avec fallback
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(err => {
          console.error('Erreur lors de la copie avec clipboard API:', err);
          this.fallbackCopyToClipboard(text);
        });
      } else {
        this.fallbackCopyToClipboard(text);
      }
    }

    fallbackCopyToClipboard(text) {
      // Méthode de fallback pour les environnements où clipboard API n'est pas disponible
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        opacity: 0;
        pointer-events: none;
      `;
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (!successful) {
          console.error('Fallback: Impossible de copier le texte');
        }
      } catch (err) {
        console.error('Erreur lors de la copie avec execCommand:', err);
      }
      
      document.body.removeChild(textArea);
    }
  
    showCopyNotification(selector = '') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        z-index: 10002;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-break: break-all;
      `;
      
      notification.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">✅ Sélecteur copié !</div>
        ${selector ? `<div style="font-family: monospace; font-size: 12px; opacity: 0.9;">${this.escapeHtml(selector)}</div>` : ''}
      `;
      
      // Ajouter l'animation CSS
      if (!document.querySelector('#css-selector-animations')) {
        const style = document.createElement('style');
        style.id = 'css-selector-animations';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }

    generateFunctionalSelectors(element) {
      const selectors = [];
      const basicSelector = this.getBasicSelector(element);
      const parent = element.parentElement;
      
      // :has() - Cibler les éléments qui contiennent certains enfants
      if (element.children.length > 0) {
        const firstChild = element.children[0];
        if (firstChild) {
          const childBasic = this.getBasicSelector(firstChild);
          const hasSelector = `${element.tagName.toLowerCase()}:has(${childBasic})`;
          selectors.push({
            type: ':has() - Contient enfant',
            selector: hasSelector,
            description: `Élément qui contient ${childBasic}`,
            specificity: this.calculateSpecificity(hasSelector),
            parent: this.getParentInfo(element)
          });
        }
        
        // :has() avec type d'enfant
        const childTags = [...new Set([...element.children].map(child => child.tagName.toLowerCase()))];
        if (childTags.length > 0) {
          const hasTagSelector = `${element.tagName.toLowerCase()}:has(${childTags[0]})`;
          selectors.push({
            type: ':has() - Contient tag',
            selector: hasTagSelector,
            description: `Élément qui contient un ${childTags[0]}`,
            specificity: this.calculateSpecificity(hasTagSelector),
            parent: this.getParentInfo(element)
          });
        }
      }
      
      // :not() - Exclure certains éléments
      if (parent) {
        const siblings = [...parent.children].filter(child => child !== element);
        if (siblings.length > 0) {
          const siblingSelector = this.getBasicSelector(siblings[0]);
          const notSelector = `${element.tagName.toLowerCase()}:not(${siblingSelector})`;
          selectors.push({
            type: ':not() - Exclure frère',
            selector: notSelector,
            description: `${element.tagName.toLowerCase()} qui n'est pas ${siblingSelector}`,
            specificity: this.calculateSpecificity(notSelector),
            parent: this.getParentInfo(element)
          });
        }
      }
      
      // :not() avec classes
      if (element.className) {
        const classes = element.className.split(' ').filter(c => c.trim());
        if (classes.length > 1) {
          const notClassSelector = `${element.tagName.toLowerCase()}:not(.${classes[1]})`;
          selectors.push({
            type: ':not() - Sans classe',
            selector: notClassSelector,
            description: `${element.tagName.toLowerCase()} sans la classe ${classes[1]}`,
            specificity: this.calculateSpecificity(notClassSelector),
            parent: this.getParentInfo(element)
          });
        }
      }
      
      // :where() - Spécificité zéro
      const whereSelector = `:where(${basicSelector})`;
      selectors.push({
        type: ':where() - Spécificité 0',
        selector: whereSelector,
        description: 'Sélecteur avec spécificité nulle (priorité faible)',
        specificity: { inline: 0, ids: 0, classes: 0, elements: 0 },
        parent: this.getParentInfo(element)
      });
      
      // :is() - Alternative plus moderne
      if (parent) {
        const parentBasic = this.getBasicSelector(parent);
        const isSelector = `:is(${parentBasic}) ${element.tagName.toLowerCase()}`;
        selectors.push({
          type: ':is() - Alternative moderne',
          selector: isSelector,
          description: 'Sélecteur moderne équivalent',
          specificity: this.calculateSpecificity(isSelector),
          parent: this.getParentInfo(parent)
        });
      }
      
      // :nth-of-type() - Position parmi les éléments du même type
      if (parent) {
        const sameTypeSiblings = [...parent.children].filter(child => child.tagName === element.tagName);
        if (sameTypeSiblings.length > 1) {
          const typeIndex = sameTypeSiblings.indexOf(element) + 1;
          const nthTypeSelector = `${element.tagName.toLowerCase()}:nth-of-type(${typeIndex})`;
          selectors.push({
            type: ':nth-of-type()',
            selector: nthTypeSelector,
            description: `${typeIndex}e élément ${element.tagName.toLowerCase()} dans son parent`,
            specificity: this.calculateSpecificity(nthTypeSelector),
            parent: this.getParentInfo(parent)
          });
        }
      }
      
      // :first-child, :last-child, :only-child
      if (parent && parent.children.length > 1) {
        if (element === parent.children[0]) {
          const firstChildSelector = `${basicSelector}:first-child`;
          selectors.push({
            type: ':first-child',
            selector: firstChildSelector,
            description: 'Premier enfant de son parent',
            specificity: this.calculateSpecificity(firstChildSelector),
            parent: this.getParentInfo(parent)
          });
        }
        
        if (element === parent.children[parent.children.length - 1]) {
          const lastChildSelector = `${basicSelector}:last-child`;
          selectors.push({
            type: ':last-child',
            selector: lastChildSelector,
            description: 'Dernier enfant de son parent',
            specificity: this.calculateSpecificity(lastChildSelector),
            parent: this.getParentInfo(parent)
          });
        }
      } else if (parent && parent.children.length === 1) {
        const onlyChildSelector = `${basicSelector}:only-child`;
        selectors.push({
          type: ':only-child',
          selector: onlyChildSelector,
          description: 'Enfant unique de son parent',
          specificity: this.calculateSpecificity(onlyChildSelector),
          parent: this.getParentInfo(parent)
        });
      }
      
      // :empty - Élément sans contenu
      if (element.children.length === 0 && !element.textContent.trim()) {
        const emptySelector = `${basicSelector}:empty`;
        selectors.push({
          type: ':empty',
          selector: emptySelector,
          description: 'Élément sans contenu (vide)',
          specificity: this.calculateSpecificity(emptySelector),
          parent: this.getParentInfo(element)
        });
      }
      
      // Sélecteurs conditionnels pour les formulaires
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(element.tagName)) {
        // :disabled
        const disabledSelector = `${basicSelector}:disabled`;
        selectors.push({
          type: ':disabled',
          selector: disabledSelector,
          description: 'Élément de formulaire désactivé',
          specificity: this.calculateSpecificity(disabledSelector),
          parent: this.getParentInfo(element)
        });
        
        // :enabled
        const enabledSelector = `${basicSelector}:enabled`;
        selectors.push({
          type: ':enabled',
          selector: enabledSelector,
          description: 'Élément de formulaire activé',
          specificity: this.calculateSpecificity(enabledSelector),
          parent: this.getParentInfo(element)
        });
        
        // :focus
        const focusSelector = `${basicSelector}:focus`;
        selectors.push({
          type: ':focus',
          selector: focusSelector,
          description: 'Élément qui a le focus',
          specificity: this.calculateSpecificity(focusSelector),
          parent: this.getParentInfo(element)
        });
        
        // :focus-within (pour les parents)
        if (parent) {
          const focusWithinSelector = `${this.getBasicSelector(parent)}:focus-within ${element.tagName.toLowerCase()}`;
          selectors.push({
            type: ':focus-within',
            selector: focusWithinSelector,
            description: 'Enfant d\'un élément qui contient le focus',
            specificity: this.calculateSpecificity(focusWithinSelector),
            parent: this.getParentInfo(parent)
          });
        }
      }
      
      // Input spécifiques
      if (element.tagName === 'INPUT') {
        // :checked (pour checkbox/radio)
        if (element.type === 'checkbox' || element.type === 'radio') {
          const checkedSelector = `${basicSelector}:checked`;
          selectors.push({
            type: ':checked',
            selector: checkedSelector,
            description: 'Input coché (checkbox/radio)',
            specificity: this.calculateSpecificity(checkedSelector),
            parent: this.getParentInfo(element)
          });
        }
        
        // :required/:optional
        const requiredSelector = `${basicSelector}:required`;
        selectors.push({
          type: ':required',
          selector: requiredSelector,
          description: 'Champ obligatoire',
          specificity: this.calculateSpecificity(requiredSelector),
          parent: this.getParentInfo(element)
        });
        
        const optionalSelector = `${basicSelector}:optional`;
        selectors.push({
          type: ':optional',
          selector: optionalSelector,
          description: 'Champ optionnel',
          specificity: this.calculateSpecificity(optionalSelector),
          parent: this.getParentInfo(element)
        });
        
        // :valid/:invalid
        const validSelector = `${basicSelector}:valid`;
        selectors.push({
          type: ':valid',
          selector: validSelector,
          description: 'Champ avec valeur valide',
          specificity: this.calculateSpecificity(validSelector),
          parent: this.getParentInfo(element)
        });
        
        const invalidSelector = `${basicSelector}:invalid`;
        selectors.push({
          type: ':invalid',
          selector: invalidSelector,
          description: 'Champ avec valeur invalide',
          specificity: this.calculateSpecificity(invalidSelector),
          parent: this.getParentInfo(element)
        });
      }
      
      return selectors;
    }
  }
  
  // Initialiser l'extension
  const cssSelectorGenerator = new CSSSelector();
  
  // Rendre l'instance accessible globalement pour les onclick dans les tooltips
  window.cssSelectorGenerator = cssSelectorGenerator;