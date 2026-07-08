// script.js – Calculatrice premium avec animations Ripple, gestion d'erreurs, etc.

'use strict';

(function() {
  // ----- Éléments DOM -----
  const resultEl = document.getElementById('result');
  const expressionEl = document.getElementById('expression');

  // ----- État interne -----
  let currentInput = '0';        // ce qui est affiché dans result
  let previousInput = '';       // opérande stockée
  let operator = null;          // opérateur en cours
  let shouldResetInput = false; // flag pour repartir à zéro après un opérateur
  let justEvaluated = false;    // flag pour savoir si '=' vient d'être pressé

  // ----- Fonctions utilitaires -----
  function updateDisplay() {
    // Tronquer si trop long (garde de l'utilisabilité)
    let displayValue = currentInput;
    if (displayValue.length > 14) {
      // si c'est un nombre décimal, on essaie de réduire les décimales
      if (displayValue.includes('.')) {
        const parts = displayValue.split('.');
        if (parts[0].length > 10) {
          displayValue = parseFloat(displayValue).toExponential(6);
        } else {
          displayValue = parseFloat(displayValue).toFixed(8);
        }
      } else {
        displayValue = parseFloat(displayValue).toExponential(6);
      }
    }
    resultEl.textContent = displayValue;
    // Animation de pop
    resultEl.classList.remove('updated');
    // forcer un reflow pour relancer l'animation
    void resultEl.offsetWidth;
    resultEl.classList.add('updated');
  }

  function updateExpression() {
    if (operator && previousInput) {
      const opSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator;
      expressionEl.textContent = `${previousInput} ${opSymbol}`;
    } else {
      expressionEl.textContent = '';
    }
  }

  // Réinitialisation complète (C)
  function clearAll() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetInput = false;
    justEvaluated = false;
    expressionEl.textContent = '';
    updateDisplay();
  }

  // Effacer le dernier caractère (⌫)
  function backspace() {
    if (justEvaluated) {
      clearAll();
      return;
    }
    if (currentInput.length > 1) {
      currentInput = currentInput.slice(0, -1);
    } else {
      currentInput = '0';
    }
    updateDisplay();
  }

  // Ajouter un chiffre ou un point décimal
  function inputDigit(digit) {
    if (justEvaluated) {
      // on repart à zéro après un résultat
      currentInput = '0';
      previousInput = '';
      operator = null;
      expressionEl.textContent = '';
      justEvaluated = false;
    }

    if (digit === '.' && currentInput.includes('.')) return; // déjà un point

    if (shouldResetInput) {
      currentInput = digit === '.' ? '0.' : digit;
      shouldResetInput = false;
    } else {
      if (currentInput === '0' && digit !== '.') {
        currentInput = digit;
      } else {
        currentInput += digit;
      }
    }
    updateDisplay();
  }

  // Gestion des opérateurs (+, -, ×, ÷)
  function handleOperator(op) {
    const currentNum = parseFloat(currentInput);

    if (operator && !shouldResetInput) {
      // on calcule en chaîne
      const result = compute(parseFloat(previousInput), currentNum, operator);
      if (result === Infinity || isNaN(result) || !isFinite(result)) {
        // gérer l'erreur (division par zéro)
        currentInput = 'Erreur';
        previousInput = '';
        operator = null;
        shouldResetInput = true;
        expressionEl.textContent = '';
        updateDisplay();
        return;
      }
      currentInput = String(result);
      previousInput = currentInput;
      operator = op;
      shouldResetInput = true;
      justEvaluated = false;
      updateDisplay();
      updateExpression();
      return;
    }

    // premier opérateur ou après clear
    previousInput = currentInput;
    operator = op;
    shouldResetInput = true;
    justEvaluated = false;
    updateExpression();
  }

  // Calcul selon opérateur
  function compute(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : Infinity;
      default: return b;
    }
  }

  // Évaluation (bouton =)
  function evaluate() {
    if (!operator || shouldResetInput) {
      // si on appuie sur = sans opérateur ou après un opérateur, on ne fait rien
      // sauf si juste évalué : on répète la dernière opération ?
      if (justEvaluated && operator && previousInput) {
        // répéter l'opération avec le résultat précédent
        const currentNum = parseFloat(currentInput);
        const result = compute(parseFloat(previousInput), currentNum, operator);
        if (result === Infinity || isNaN(result) || !isFinite(result)) {
          currentInput = 'Erreur';
          previousInput = '';
          operator = null;
          expressionEl.textContent = '';
          updateDisplay();
          return;
        }
        previousInput = String(result);
        currentInput = String(result);
        operator = null; // on efface l'opérateur pour ne pas répéter en boucle
        justEvaluated = true;
        expressionEl.textContent = '';
        updateDisplay();
        return;
      }
      return;
    }

    const currentNum = parseFloat(currentInput);
    const result = compute(parseFloat(previousInput), currentNum, operator);
    if (result === Infinity || isNaN(result) || !isFinite(result)) {
      currentInput = 'Erreur';
      previousInput = '';
      operator = null;
      expressionEl.textContent = '';
      updateDisplay();
      return;
    }
    // On affiche le résultat
    currentInput = String(result);
    previousInput = currentInput;
    operator = null;
    shouldResetInput = true;
    justEvaluated = true;
    expressionEl.textContent = '';
    updateDisplay();
  }

  // ----- Gestion des clics avec effet Ripple -----
  function createRipple(e, button) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);

    // Supprimer l'élément après l'animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // ----- Gestionnaire principal -----
  function handleButtonClick(e) {
    const button = e.currentTarget;
    const value = button.dataset.value;

    // Effet Ripple
    createRipple(e, button);

    // Effet d'enfoncement (via CSS :active)
    // mais on ajoute une classe pour être sûr
    button.classList.add('active');
    setTimeout(() => button.classList.remove('active'), 100);

    // Si l'affichage est en erreur, on reset sauf sur C
    if (currentInput === 'Erreur' && value !== 'C') {
      clearAll();
      // on continue pour traiter le clic normal
    }

    // Actions selon le type de bouton
    if (value === 'C') {
      clearAll();
      return;
    }

    if (value === '⌫') {
      backspace();
      return;
    }

    if (value === '=') {
      evaluate();
      return;
    }

    // Opérateurs (+, −, ×, ÷)
    if (['+', '−', '×', '÷'].includes(value)) {
      handleOperator(value);
      return;
    }

    // Chiffres et point
    inputDigit(value);
  }

  // ----- Initialisation : attacher les événements à tous les boutons -----
  function init() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', handleButtonClick);
      // pour le touch / mobile éviter les doubles déclenchements
      btn.addEventListener('touchstart', function(e) {
        // on ne fait que prévenir le double clic, mais on laisse click gérer
      }, { passive: true });
    });

    // Initialisation de l'affichage
    clearAll();

    // Ajouter un écouteur pour que l'animation de résultat fonctionne
    // déjà fait dans updateDisplay
  }

  // Démarrer quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();