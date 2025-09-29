// @ts-nocheck
function el(type = 'span') {
  return document.createElement(type);
}
function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
let allowNativeMenu = false;

function createContext(forObject, options = [], clickEvent) {
  // Remove any existing custom context menus
  document.querySelectorAll('.custom-context-menu').forEach(m => m.remove());

  // Create the menu container
  const menu = document.createElement('div');
  menu.classList.add('custom-context-menu');
  Object.assign(menu.style, {
    position: 'absolute',
    background: '#242424ff',
    border: '3px solid #242424ff',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#ddddddff',
    boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
    zIndex: 1000,
    opacity: 1
  });

  // Add menu items
  options.forEach(rawLabel => {
    const label = String(rawLabel);
    if (label === 'separator') {
      const hr = document.createElement('hr');
      Object.assign(hr.style, {
        border: 'none',
        borderTop: '1px solid #555',
        margin: '4px 0',
        opacity: 1
      });
      menu.appendChild(hr);
      return;
    }
    const item = document.createElement('div');
    item.textContent = label;
    Object.assign(item.style, {
      padding: '6px 12px',
      cursor: 'default',
      border: '3px solid transparent',
      boxSizing: 'border-box',
      opacity: 1
    });

    item.addEventListener('mouseenter', () => {
      item.style.background = '#303030ff';
      item.style.borderRadius = '4px';
      item.style.borderColor = '#242424ff';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = '';
      item.style.borderRadius = '';
      item.style.borderColor = 'transparent';
    });

    item.addEventListener('click', e => {
      e.stopPropagation();
      
      // Normal action
      const key = label
        .replace(/\s+/g, '')
        .replace(/Tasks?$/i, '')
        .replace(/As/i, '')
        .replace(/Mark/i, '')
        .replace(/[\p{Symbol}]/gu, "");

      if (contextItems[key]) contextItems[key](forObject);
      menu.remove();
    });

    menu.appendChild(item);
  });

  document.body.appendChild(menu);

  // Position with clamping
  const offset = 4;
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  let left = clickEvent.pageX + offset;
  let top  = clickEvent.pageY + offset;
  if (left + menuWidth > document.documentElement.clientWidth + window.scrollX) {
    left = document.documentElement.clientWidth + window.scrollX - menuWidth - offset;
  }
  if (top + menuHeight > document.documentElement.clientHeight + window.scrollY) {
    top = document.documentElement.clientHeight + window.scrollY - menuHeight - offset;
  }
  menu.style.left = left + 'px';
  menu.style.top  = top + 'px';
  menu.style.display = 'block';

  // Remove menu on click elsewhere or on next contextmenu
  document.addEventListener('click', e => {
    if (!menu.contains(e.target)) menu.remove();
  }, { once: true });
  document.addEventListener('contextmenu', e => {
    if (!forObject.contains(e.target)) menu.remove();
  }, { once: true });
}
// Uncomment 'contextItems' and add the options and what they do here
/*
const contextItems = {
};*/


function showToast(message, type = '') {
  const toast = el('div');
  if (isEmpty(type)) type = 'default';
  const toastSpan = el('span');
  toast.id = 'toast';
  toastSpan.textContent = message;
  toast.appendChild(toastSpan);
  document.body.appendChild(toast);
  toast.classList.add(type);
  toast.classList.add('glassText');
  // Trigger reflow to restart animation
  void toast.offsetWidth;

  // Remove toast after 3 seconds
  toast.addEventListener('click', function(event) {
    toast.style.animation = 'fadeOut 0.4s ease forwards';
  })
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.4s ease forwards';
  }, 3000);
}

function caps(str = "") {
  if (!str) return "";

  let out = str;

  // Capitalise first non-space character in the whole string
  out = out.replace(/^(\s*)(\S)/, (_, ws, ch) => ws + ch.toUpperCase());

  // Capitalise after ., ?, or !
  out = out.replace(/([.?!])(\s*)(\S)/g, (_, punct, spaces, ch) =>
    punct + spaces + ch.toUpperCase()
  );

  // Capitalise after an actual newline (user pressed Enter)
  out = out.replace(/(\n)(\s*)(\S)/g, (_, newline, spaces, ch) =>
    newline + spaces + ch.toUpperCase()
  );

  return out;
}

function isEmpty(str) {
  return !str || !str.trim();
}

/* ====== CUSTOM CONSOLE LOGGING ====== */
// Usage: csl(type, message, style, prefix)
const prefixStyles = {
  admin: 'color: firebrick; padding: 2px; text-shadow: 0.5px 0.5px 0 firebrick, -0.5px -0.5px 0 firebrick;',
  user: 'color: blue; padding: 2px; font-weight: bold;',
  default: 'color: white; padding: 2px; font-weight: bold;',
  task: 'color: teal; padding: 2px; font-weight: bold;',
  error: 'color: red; padding: 2px; font-weight: bold; text-decoration: underline;',
  warn: 'color: #FFBF00; padding: 2px; font-weight: bold;',
  info: 'color: blue; padding: 2px; font-weight: bold;',
  debug: 'color: purple; padding: 2px; font-weight: bold;',
  success: 'color: lime; padding: 2px; font-weight: bold;',
  comp: 'color: green; padding: 2px; font-weight: bold;',
  settings: 'color: rgb(70, 70, 70); padding: 2px; font-weight: bold;',
  achieve: 'color: rgb(136, 255, 0); padding: 2px; font-weight: bold;'
};

let colourConsole = null;

function csl(type = "log", message = "", hexStyle, prefix = "", restStyle) {
  const consoleMethods = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd,
    table: console.table,
    trace: console.trace
  };

  const method = consoleMethods[type];
  if (!method) {
    console.warn(`Unknown console method: ${type}`);
    return;
  }

  // Methods that don't need a message
  if (type === "groupEnd") {
    method();
    return;
  }

  // Resolve style by key or passthrough CSS string
  const resolveStyle = (s) => {
    if (!s) return ""; // nothing provided
    if (cslStyles && typeof s === "string" && cslStyles[s]) return cslStyles[s];
    return s; // assume raw CSS string
  };

  // Ensure message is a string
  message = String(message);

  const prefixStyle = prefixStyles[prefix] || "color: gray; font-style: italic;";
  const prefixText = prefix ? `[${(typeof util === "function" ? util("upper", prefix) : String(prefix).toUpperCase())}]` : "";

  // If no restStyle provided, use hexStyle for both (after resolving)
  const resolvedHexStyle = resolveStyle(hexStyle);
  let resolvedRestStyle = resolveStyle(restStyle);
  if (restStyle == null) {
    resolvedRestStyle = resolvedHexStyle;
  }

  const hexMatch = message.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i);

  if (hexMatch) {
    const hex = hexMatch[0];
    const [beforeHex, afterHex = ""] = message.split(hex);

    method(
      `%c${prefixText}%c ${beforeHex}%c${hex}%c${afterHex}`,
      prefixStyle,                            // prefix
      resolvedRestStyle || "color: inherit;", // before hex
      resolvedHexStyle || "color: inherit;",  // hex only
      resolvedRestStyle || "color: inherit;"  // after hex
    );
  } else {
    method(
      `%c${prefixText}%c ${message}`,
      prefixStyle,
      resolvedRestStyle || "color: inherit;"
    );
  }
}

const cslStyles = {
  success: 'color: lime; font-weight: bold;',
  error: 'color: red; font-weight: bold; text-decoration: underline;',
  info: 'color: blue; font-style: italic;',
  warn: 'color: orange; font-style: italic;',
  debug: 'color: purple; font-style: italic;',
  completed: 'color: lime; font-weight: bold;',
  progress: 'color: orange; font-weight: bold;',
  deleted: 'color: red; font-weight: bold;',
  admin: 'color: firebrick; font-weight: bold; text-shadow: 1px 1px 3px firebrick; text-shadow: 2px 2px 5px firebrick;',
  user: 'color: blue; font-weight: bold;',
  colour: 'color: gray;' // will be updated by csl()
};

// ====== LOCAL TIME HELPER ======
function getLocalDateTimeString(date = new Date()) {
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toReadable(value, labels = {true: "Enabled", false: "Disabled" }, text = false) {
  switch (typeof value) {
    case "boolean":
      return value ? labels.true : labels.false;

    case "number":
      if (!text) {
        return value.toLocaleString(); // Adds commas, respects locale
      } else {
        return numberToText(value);
      }

    case "string":
      return value.trim() || "(empty)";

    case "object":
      if (value === null) return "(none)";
      if (value instanceof Date) return value.toLocaleString();
      if (Array.isArray(value)) return value.length ? value.join(", ") : "(empty array)";
      try {
        return JSON.stringify(value);
      } catch {
        return "(unserializable object)";
      }

    case "undefined":
      return "(undefined)";

    default:
      return String(value);
  }
}

function numberToText(num) {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  if (num === 0) return "zero";
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  if (num < 1000) return ones[Math.floor(num / 100)] + " hundred" + (num % 100 ? " and " + numberToText(num % 100) : "");
  if (num < 10000) return ones[Math.floor(num / 1000)] + " thousand" + (num % 1000 ? ", " + numberToText(num % 1000) : "");

  return num.toString(); // fallback for bigger numbers
}

function util(action, ...args) {
  switch (action) {

    case 'truncate': {
      const str = args[0] ?? '';
      const limit = args[1] ?? 0;
      const method = args[2] || 'length'; // 'length' or 'chars'

      if (method === 'chars') {
        return str.length <= limit ? str : str.slice(0, limit) + '...';
      }

      if (method === 'length') {
        // Measure width using a hidden span
        const span = document.createElement('span');
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.whiteSpace = 'nowrap';
        span.style.font = 'inherit'; // use same font as parent if needed
        span.textContent = '';

        document.body.appendChild(span);

        let truncated = '';
        for (const char of str) {
          span.textContent += char;
          if (span.offsetWidth > limit) break;
          truncated += char;
        }

        document.body.removeChild(span);
        return truncated + (truncated.length < str.length ? '...' : '');
      }

      console.warn(`Unknown truncate method: ${method}`);
      return str;
    }

    case 'lower':
      return args[0].toLowerCase();

    case 'upper':
      return args[0].toUpperCase();

    case 'scroll': {
      const direction = (args[0] || '').toLowerCase();

      if (direction === 'top') {
        const behavior = args[1] || 'smooth';
        window.scrollTo({ top: 0, behavior });
      } 
      else if (direction === 'bottom') {
        const behavior = args[1] || 'smooth';
        window.scrollTo({ top: document.body.scrollHeight, behavior });
      } 
      else if (direction === 'element') {
        const selector = args[1];
        const behavior = args[2] || 'smooth';
        const el = document.querySelector(selector);
        if (el) el.scrollIntoView({ behavior });
        else console.warn(`Element not found for selector: ${selector}`);
      } 
      else {
        console.warn(`Unknown scroll direction: ${args[0]}`);
      }
      return;
    }

    case 'camel':
      if (args[1]) {
        return args[0].toLowerCase().replace(/[\s_-]+(.)/g, (_, c) => c.toUpperCase());
      } else {
        return args[0].replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
      }

    case 'random':
      if (Array.isArray(args[0])) {
        const arr = args[0];
        return arr[Math.floor(Math.random() * arr.length)];
      }
      if (typeof args[0] === 'number' && typeof args[1] === 'number') {
        const min = Math.min(args[0], args[1]);
        const max = Math.max(args[0], args[1]);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      console.warn(`Invalid arguments for 'random':`, args);
      return null;

    case 'drop': {
      let elements = [];
      if (typeof args[0] === 'string') elements = Array.from(document.querySelectorAll(args[0]));
      else if (args[0] instanceof Element) elements = [args[0]];
      else if (Array.isArray(args[0])) elements = args[0].filter(el => el instanceof Element);

      const bodies = elements.map(el => {
        el.style.position = 'fixed';
        el.style.left = el.getBoundingClientRect().left + 'px';
        el.style.top = el.getBoundingClientRect().top + 'px';
        el.style.margin = 0;
        el.style.transformOrigin = 'center center';

        return {
          el,
          x: parseFloat(el.style.left),
          y: parseFloat(el.style.top),
          vx: args[1] ?? (Math.random() * 8 - 4),
          vy: 0,
          rotation: 0,
          rotationSpeed: args[2] ?? (Math.random() * 25 - 12),
          width: el.offsetWidth,
          height: el.offsetHeight
        };
      });

      const gravity = 0.9;
      const bounceFactor = 0.5;
      const friction = 0.985;
      const airResistance = 0.99;
      const floor = window.innerHeight;
      const wallLeft = 0;
      const wallRight = window.innerWidth;

      function animate() {
        let active = false;
        bodies.forEach(b => {
          b.vy += gravity;
          b.x += b.vx;
          b.y += b.vy;
          b.rotation += b.rotationSpeed;

          if (b.y + b.height >= floor) {
            b.y = floor - b.height;
            b.vy *= -bounceFactor;
            b.rotationSpeed *= 0.8;
          }

          if (b.x <= wallLeft) {
            b.x = wallLeft;
            b.vx *= -bounceFactor;
            b.rotationSpeed *= 0.9;
          }
          if (b.x + b.width >= wallRight) {
            b.x = wallRight - b.width;
            b.vx *= -bounceFactor;
            b.rotationSpeed *= 0.9;
          }

          b.vx *= friction;
          b.rotationSpeed *= airResistance;

          if (Math.abs(b.vx) < 0.05) b.vx = 0;
          if (Math.abs(b.vy) < 0.05) b.vy = 0;
          if (Math.abs(b.rotationSpeed) < 0.05) b.rotationSpeed = 0;

          if (b.vx !== 0 || b.vy !== 0 || b.rotationSpeed !== 0) active = true;
        });

        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i];
            const b = bodies[j];
            if (
              a.x < b.x + b.width &&
              a.x + a.width > b.x &&
              a.y < b.y + b.height &&
              a.y + a.height > b.y
            ) {
              const ax = a.x + a.width / 2;
              const ay = a.y + a.height / 2;
              const bx = b.x + b.width / 2;
              const by = b.y + b.height / 2;

              let nx = bx - ax;
              let ny = by - ay;
              const dist = Math.sqrt(nx * nx + ny * ny) || 1;
              nx /= dist;
              ny /= dist;

              const overlap = Math.min(a.width, a.height) / 2;
              a.x -= nx * overlap / 2;
              a.y -= ny * overlap / 2;
              b.x += nx * overlap / 2;
              b.y += ny * overlap / 2;

              const rvx = b.vx - a.vx;
              const rvy = b.vy - a.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const restitution = 0.5;
                const impulse = -(1 + restitution) * velAlongNormal / 2;
                const impulseX = impulse * nx;
                const impulseY = impulse * ny;
                a.vx -= impulseX;
                a.vy -= impulseY;
                b.vx += impulseX;
                b.vy += impulseY;
              }
            }
          }
        }

        bodies.forEach(b => {
          b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.rotation}deg)`;
        });

        if (active) requestAnimationFrame(animate);
      }

      animate();
      return;
    }

    case 'slug':
      if (args[1]) {
        return args[0].replace(/\s|%20/g, "-").toLowerCase();
      } else {
        return args[0].replace(/-/g, ' ').replace(/ ([a-z])/g, (_, letter) => " " + letter.toUpperCase());
      }

    case 'format':
      switch (args[0]) {
        case 'number':
          return toReadable(args[1]);
        case 'date': {
          const date = args[1] instanceof Date ? args[1] : new Date(args[1]);
          const format = args[2] || 'YYYY-MM-DD HH:mm';
          const pad = n => String(n).padStart(2, '0');
          const map = {
            YYYY: date.getFullYear(),
            MM: pad(date.getMonth() + 1),
            DD: pad(date.getDate()),
            HH: pad(date.getHours()),
            mm: pad(date.getMinutes()),
            ss: pad(date.getSeconds())
          };
          return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => map[match]);
        }
      }
      break;

    default:
      console.warn(`Undefined action: ${action}`);
      return null;
  }
}


function achievement(imgName) {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.background = 'rgba(0,0,0,0.3)';
  overlay.style.zIndex = '999999'; // above everything
  overlay.style.pointerEvents = 'none'; // so it doesn't block clicks

  // Create image element
  const img = document.createElement('img');
  img.src = imgName; // e.g. "achievement1.png"
  img.alt = 'Achievement Unlocked';
  img.style.maxWidth = '80%';
  img.style.maxHeight = '80%';
  img.style.transform = 'scale(0.5)';
  img.style.opacity = '0';
  img.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
  img.style.pointerEvents = 'auto'; // allow clicking on image
  const label = imgName.replace(/^.*[\\/]/, "").replace(/\.[^/.]+$/, "");
  csl('log', `New Achievement! ${caps(label)}`, cslStyles.completed, 'achieve')

  overlay.appendChild(img);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    img.style.transform = 'scale(1)';
    img.style.opacity = '1';
  });

  // Remove after 3 seconds
  setTimeout(() => {
    img.style.transform = 'scale(0.5)';
    img.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
    }, 500);
  }, 3000);
}

function repeat(func, times = 1, ...args) {
  if (isFunction(func)) {
    for (let i = 0; i < times; i++) {
      func(...args);
    }
  } else {
    csl('warn', `'${func}' is not a function`);
  }
}

function isFunction(value) {
  return typeof value === "function";
}

// Create container & button once
const scrollContainer = el('div');
Object.assign(scrollContainer.style, {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: '9999'
});
scrollContainer.id = 'scrollContainer';

const scrollArrow = el('button');
scrollArrow.classList.add('glassText');
scrollArrow.textContent = "▲"; // scroll-up arrow
scrollArrow.style.cursor = 'pointer';
scrollArrow.style.display = 'none'; // start hidden
scrollContainer.appendChild(scrollArrow);
document.body.appendChild(scrollContainer);

// Scroll-to-top action
scrollArrow.onclick = () => utils.scroll.top();

// Show/hide button on scroll
window.addEventListener('scroll', () => {
  scrollArrow.style.display = window.scrollY > 10 ? 'block' : 'none';
  scrollArrow.removeClasses();
});

const utils = {
  scroll: {
    top(behavior = 'smooth') {
      window.scrollTo({ top: 0, behavior });
    },
    bottom(behavior = 'smooth') {
      window.scrollTo({ top: document.body.scrollHeight, behavior });
    },
    toPercent(percent, behavior = 'smooth') {
      const target = (document.body.scrollHeight - window.innerHeight) * (percent / 100);
      window.scrollTo({ top: target, behavior });
    },
    toElement(el, behavior = 'smooth') {
      let targetEl = typeof el === 'string' ? document.getElementById(el) : el;
      if (!targetEl) return; // element not found
      targetEl.scrollIntoView({ behavior });
    }
  }
};

let recentCopy;
function copy(str = '') {
  recentCopy = str;
  csl('log', `Copied '${str}' to clipboard`, cslStyles.user, 'info');
  return navigator.clipboard.writeText(str);
}

function isTextInput(el) {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

async function paste() {
  const active = document.activeElement;

  try {
    const text = await navigator.clipboard.readText();

    if (isTextInput(active)) {
      const start = active.selectionStart ?? active.value.length;
      const end = active.selectionEnd ?? active.value.length;
      active.setRangeText(text, start, end, 'end');
    } else {
      // Not a text input, just store for fallback
      recentCopy = text;
      return text;
    }
  } catch (err) {
    console.error('Clipboard read failed:', err);
    return recentCopy || '';
  }
}


function $(selector, all = false) {
  const nodes = all ? document.querySelectorAll(selector) : document.querySelector(selector);
  return all ? Array.from(nodes) : nodes;
}

Object.defineProperty(String.prototype, "cap", {
    get: function() {
        const str = this.toString();
        return {
            get all() {
                return str.toUpperCase();
            },
            get first() {
                return str.charAt(0).toUpperCase() + str.slice(1);
            },
            get words() {
                return str.replace(/\b\w/g, c => c.toUpperCase());
            }
        };
    }
});

Object.defineProperty(Number.prototype, "maths", {
  get: function() {
    const value = this.valueOf();
    return {
      add: (n) => value + n,
      sub: (n) => value - n,
      multiply: (n) => value * n,
      divide: (n) => value / n,
      pow: (n) => value ** n,
      mod: (n) => value % n
    }
  }
});

Object.defineProperty(Array.prototype, "list", {
  get: function() {
    // Always work with a fresh copy so we don't mutate the original unless you want to
    let arr = [...this];

    const api = {
      get unique() {
        arr = [...new Set(arr)];
        return api; // return the same API so you can keep chaining
      },
      get shuffle() {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return api;
      },
      get first() {
        return arr[0];
      },
      get last() {
        return arr[arr.length - 1];
      },
      get value() {
        return arr; // final result when you want the array
      }
    };

    return api;
  }
});

Object.defineProperty(String.prototype, "leet", {
  get: function() {
    const switches = {
      e: '3',
      a: '@',
      i: '1',
      o: '0',
      s: '$',
      l: '|'
    };

    // Replace letters based on the mapping
    return this.toString()
      .replace(/[eaiosl]/gi, match => {
        const lower = match.toLowerCase();
        const replacement = switches[lower] || match;
        // Preserve case
        return match === lower ? replacement : replacement.toUpperCase();
      });
  }
});

Object.defineProperties(Function.prototype, {
  sleep: {
    value: function (ms) {
      let locked = false;
      const originalFn = this;

      return function (...args) {
        if (locked) return;
        locked = true;
        setTimeout(() => (locked = false), ms);
        return originalFn.apply(this, args);
      };
    },
    writable: true,
    configurable: true
  },

  repeat: {
    value: function (times, ...args) {
      const results = [];
      for (let i = 0; i < times; i++) {
        results.push(this(...args));
      }
      return results;
    },
    writable: true,
    configurable: true
  },

  skip: {
    value: function (timesToSkip) {
      let callCount = 0;
      const originalFn = this;

      return function (...args) {
        callCount++;
        if (callCount <= timesToSkip) return;
        return originalFn.apply(this, args);
      };
    },
    writable: true,
    configurable: true
  },

  throttle: {
    value: function (maxFuncs) {
      const originalFn = this;
      let calls = 0;
      let queueOpen = true;

      return function (...args) {
        if (!queueOpen) return;

        calls++;
        if (calls > maxFuncs) {
          queueOpen = false;
          setTimeout(() => {
            calls = 0;
            queueOpen = true;
          }, 1000);
          return;
        }

        return originalFn.apply(this, args);
      };
    },
    writable: true,
    configurable: true
  },

  jump: {
    get: function () {
      let skipped = false;
      const originalFn = this;

      const wrapped = function (...args) {
        if (!skipped) {
          skipped = true;
          return;
        }
        return originalFn.apply(this, args);
      };

      // Preserve prototype and properties
      Object.setPrototypeOf(wrapped, Object.getPrototypeOf(originalFn));
      Object.assign(wrapped, originalFn);

      // Replace the original function reference on its owner if possible
      // This works if the function is assigned as a property somewhere
      // e.g., obj.myFunc.jump will replace obj.myFunc
      try {
        const caller = wrapped.caller; // may be undefined in strict mode
      } catch (e) {
        // ignore
      }

      return wrapped;
    },
    configurable: true
  }
});

async function isLocation(location) {
  if (typeof location !== 'string' || location.trim() === '') return false;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'YourAppName' } });
    if (!res.ok) return false;

    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    console.error('Location lookup failed:', err);
    return false;
  }
}

HTMLElement.prototype.removeStyle = function() {
  this.removeAttribute('style'); // remove inline styles
  this.className = '';           // remove classes
  return this;
};

function showTooltip(slider, text) {
  // Remove any existing tooltip
  const existingTip = document.getElementById("slider-tooltip");
  if (existingTip) existingTip.remove();

  // Create new tooltip
  const tip = document.createElement("div");
  tip.id = "slider-tooltip"; // unique ID
  tip.textContent = text;
  tip.style.position = "absolute";
  tip.style.background = "black";
  tip.style.color = "white";
  tip.style.padding = "4px 8px";
  tip.style.borderRadius = "4px";
  tip.style.fontSize = "12px";
  tip.style.pointerEvents = "none";
  tip.style.transform = "translateX(-50%)"; // center it

  // Calculate thumb position
  const rect = slider.getBoundingClientRect();
  const val = (slider.value - slider.min) / (slider.max - slider.min);
  const thumbX = rect.left + val * rect.width;
  const thumbY = rect.top;

  tip.style.left = thumbX + "px";
  tip.style.top = thumbY - 35 + "px"; // above the thumb

  document.body.appendChild(tip);

  // Automatically remove after a short delay
  setTimeout(() => tip.remove(), 1500);
}

function LS(item = '', arg2 = '', value = null) {
  // Determine if this is a get with mode
  if (arg2 !== 'set' && arg2 !== 'remove') {
    const mode = arg2; // treat second argument as mode
    const stored = localStorage.getItem(item);
    if (mode === 'bool') return stored === 'true';
    if (mode === 'int') return parseInt(stored) || 0;
    if (mode === 'float') return parseFloat(stored) || 0;
    if (mode === 'json') {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return stored; // default string
  }

  // Handle set/remove
  switch (arg2) {
    case 'set':
      localStorage.setItem(item, value);
      break;
    case 'remove':
      localStorage.removeItem(item);
      break;
  }
}

function SS(item = '', arg2 = '', value = null) {
  // Determine if this is a get with mode
  if (arg2 !== 'set' && arg2 !== 'remove') {
    const mode = arg2; // treat second argument as mode
    const stored = sessionStorage.getItem(item);
    if (mode === 'bool') return stored === 'true';
    if (mode === 'int') return parseInt(stored) || 0;
    if (mode === 'float') return parseFloat(stored) || 0;
    if (mode === 'json') {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return stored; // default string
  }

  // Handle set/remove
  switch (arg2) {
    case 'set':
      sessionStorage.setItem(item, value);
      break;
    case 'remove':
      sessionStorage.removeItem(item);
      break;
  }
}

function AVL(forElement = document, type = 'click', action) {
  if (!forElement || typeof action !== 'function') return;
  forElement.addEventListener(type, e => {
    action(e); // runs your callback with the event
  });
}

function PTT(forKind = Object, methodName, method) {
  if (!forKind || !methodName || typeof method !== 'function') return;

  // Add method to the prototype if it doesn't already exist
  if (!forKind.hasOwnProperty(methodName)) {
    forKind[methodName] = method;
  }
}

HTMLElement.prototype.removeClasses = function(all = true, ...classes) {
  if (all) {
    this.className = '';
  } else if (classes.length > 0) {
    this.classList.remove(...classes);
  }
};

function animateClick(forEl, speed = 150, hover = false) {
  if (!forEl) return;

  let isPressed = false;

  // ----- CLICK (PRESS DOWN + RELEASE) -----
  AVL(forEl, 'pointerdown', () => {
    if (isPressed) return;
    isPressed = true;

    forEl.style.transition = `transform ${speed}ms ease-out`;
    forEl.style.transform = "scale(0.95)";
  });

  AVL(forEl, 'pointerup', () => {
    if (!isPressed) return;
    isPressed = false;

    // If hover is enabled, go back to hover scale, not 1
    const targetScale = hover ? "scale(1.05)" : "scale(1)";
    forEl.style.transition = `transform ${speed}ms ease-in`;
    forEl.style.transform = targetScale;

    setTimeout(() => {
      forEl.style.transition = "";
    }, speed);
  });

  AVL(forEl, 'pointerleave', () => {
    if (isPressed) {
      isPressed = false;
      const targetScale = hover ? "scale(1.05)" : "scale(1)";
      forEl.style.transition = `transform ${speed}ms ease-in`;
      forEl.style.transform = targetScale;
    }
  });

  // ----- OPTIONAL HOVER GROW -----
  if (hover) {
    AVL(forEl, 'mouseenter', () => {
      if (isPressed) return;
      forEl.style.transition = `transform ${speed}ms ease-out`;
      forEl.style.transform = "scale(1.05)";
    });

    AVL(forEl, 'mouseleave', () => {
      if (isPressed) return;
      forEl.style.transition = `transform ${speed}ms ease-in`;
      forEl.style.transform = "scale(1)";
    });
  }
}

function autoGrow(el) {
    if (!el) return;

    const resize = (e) => {
        // Only resize if not pressing Enter
        if (e && e.inputType === 'insertLineBreak') return;

        el.style.height = 'auto';                // reset to shrink if needed
        el.style.height = el.scrollHeight + 'px'; // grow to fit content
    };

    resize(); // initial size

    el.addEventListener('input', resize);
}