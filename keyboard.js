/**
 * Virtual keyboard for touch screen devices
 * Supports number input for multiplication game
 */

const VirtualKeyboard = {
  /**
   * Render virtual keyboard
   */
  render(container) {
    const keyboard = document.createElement('div');
    keyboard.className = 'virtual-keyboard';
    keyboard.id = 'virtual-keyboard';
    
    // Number buttons 1-9 in 3x3 grid
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    numbers.forEach(num => {
      const btn = document.createElement('button');
      btn.className = 'keyboard-key number-key';
      btn.textContent = num;
      btn.dataset.value = num;
      btn.onclick = () => this.handleKeyPress(num);
      keyboard.appendChild(btn);
    });
    
    // Bottom row: 0, Backspace, Clear
    // Zero button
    const zeroBtn = document.createElement('button');
    zeroBtn.className = 'keyboard-key number-key';
    zeroBtn.textContent = '0';
    zeroBtn.dataset.value = '0';
    zeroBtn.onclick = () => this.handleKeyPress(0);
    keyboard.appendChild(zeroBtn);
    
    // Backspace button
    const backspaceBtn = document.createElement('button');
    backspaceBtn.className = 'keyboard-key action-key backspace-key';
    backspaceBtn.textContent = '⌫';
    backspaceBtn.onclick = () => this.handleBackspace();
    keyboard.appendChild(backspaceBtn);
    
    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'keyboard-key action-key clear-key';
    clearBtn.textContent = 'Clear';
    clearBtn.onclick = () => this.handleClear();
    keyboard.appendChild(clearBtn);
    
    container.appendChild(keyboard);
  },

  /**
   * Handle number key press
   */
  handleKeyPress(number) {
    const input = document.getElementById('answer-input');
    if (input) {
      const currentValue = input.value || '';
      input.value = currentValue + number;
      input.focus();
      
      // Trigger input event for any listeners
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  /**
   * Handle backspace
   */
  handleBackspace() {
    const input = document.getElementById('answer-input');
    if (input) {
      const currentValue = input.value || '';
      input.value = currentValue.slice(0, -1);
      input.focus();
      
      // Trigger input event
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  /**
   * Handle clear
   */
  handleClear() {
    const input = document.getElementById('answer-input');
    if (input) {
      input.value = '';
      input.focus();
      
      // Trigger input event
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  /**
   * Check if device is touch-enabled
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Show keyboard (for touch devices)
   */
  show() {
    const keyboard = document.getElementById('virtual-keyboard');
    if (keyboard) {
      keyboard.style.display = 'grid';
    }
  },

  /**
   * Hide keyboard (for desktop)
   */
  hide() {
    const keyboard = document.getElementById('virtual-keyboard');
    if (keyboard) {
      keyboard.style.display = 'none';
    }
  },

  /**
   * Toggle keyboard visibility
   */
  toggle() {
    const keyboard = document.getElementById('virtual-keyboard');
    if (keyboard) {
      if (keyboard.style.display === 'none') {
        this.show();
      } else {
        this.hide();
      }
    }
  }
};

