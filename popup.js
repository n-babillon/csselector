// Script pour le popup de l'extension

document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggleBtn');
  const btnText = document.getElementById('btnText');
  const status = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  
  let isActive = false;

  // Initialiser l'état au chargement
  updateUI();

  toggleBtn.addEventListener('click', function() {
    // Obtenir l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      // Envoyer un message au content script
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Erreur:', chrome.runtime.lastError);
          showError('Impossible de communiquer avec la page. Actualisez la page et réessayez.');
          return;
        }
        
        if (response) {
          isActive = response.active;
          updateUI();
          
          // Fermer le popup après activation
          if (isActive) {
            setTimeout(() => {
              window.close();
            }, 500);
          }
        }
      });
    });
  });

  function updateUI() {
    if (isActive) {
      // État actif
      toggleBtn.classList.add('active');
      btnText.textContent = 'Désactiver l\'inspection';
      toggleBtn.querySelector('.icon').textContent = '🔍';
      
      status.classList.remove('inactive');
      status.classList.add('active');
      statusText.textContent = 'Mode inspection actif - Survolez les éléments';
    } else {
      // État inactif
      toggleBtn.classList.remove('active');
      btnText.textContent = 'Activer l\'inspection';
      toggleBtn.querySelector('.icon').textContent = '🎯';
      
      status.classList.remove('active');
      status.classList.add('inactive');
      statusText.textContent = 'Extension désactivée';
    }
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      margin-top: 16px;
      padding: 12px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      font-size: 12px;
      color: #fecaca;
    `;
    errorDiv.textContent = message;
    
    document.querySelector('.content').appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Écouter les raccourcis clavier
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleBtn.click();
    }
  });

  // Animations supplémentaires pour une meilleure UX
  toggleBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-2px) scale(1.02)';
  });

  toggleBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
});