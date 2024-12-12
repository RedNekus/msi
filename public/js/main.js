(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.IMask = {}));
})(this, (function (exports) { 'use strict';

  /** Checks if value is string */
  function isString(str) {
    return typeof str === 'string' || str instanceof String;
  }

  /** Checks if value is object */
  function isObject(obj) {
    var _obj$constructor;
    return typeof obj === 'object' && obj != null && (obj == null || (_obj$constructor = obj.constructor) == null ? void 0 : _obj$constructor.name) === 'Object';
  }
  function pick(obj, keys) {
    if (Array.isArray(keys)) return pick(obj, (_, k) => keys.includes(k));
    return Object.entries(obj).reduce((acc, _ref) => {
      let [k, v] = _ref;
      if (keys(v, k)) acc[k] = v;
      return acc;
    }, {});
  }

  /** Direction */
  const DIRECTION = {
    NONE: 'NONE',
    LEFT: 'LEFT',
    FORCE_LEFT: 'FORCE_LEFT',
    RIGHT: 'RIGHT',
    FORCE_RIGHT: 'FORCE_RIGHT'
  };

  /** Direction */

  function forceDirection(direction) {
    switch (direction) {
      case DIRECTION.LEFT:
        return DIRECTION.FORCE_LEFT;
      case DIRECTION.RIGHT:
        return DIRECTION.FORCE_RIGHT;
      default:
        return direction;
    }
  }

  /** Escapes regular expression control chars */
  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
  }

  // cloned from https://github.com/epoberezkin/fast-deep-equal with small changes
  function objectIncludes(b, a) {
    if (a === b) return true;
    const arrA = Array.isArray(a),
      arrB = Array.isArray(b);
    let i;
    if (arrA && arrB) {
      if (a.length != b.length) return false;
      for (i = 0; i < a.length; i++) if (!objectIncludes(a[i], b[i])) return false;
      return true;
    }
    if (arrA != arrB) return false;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const dateA = a instanceof Date,
        dateB = b instanceof Date;
      if (dateA && dateB) return a.getTime() == b.getTime();
      if (dateA != dateB) return false;
      const regexpA = a instanceof RegExp,
        regexpB = b instanceof RegExp;
      if (regexpA && regexpB) return a.toString() == b.toString();
      if (regexpA != regexpB) return false;
      const keys = Object.keys(a);
      // if (keys.length !== Object.keys(b).length) return false;

      for (i = 0; i < keys.length; i++) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
      for (i = 0; i < keys.length; i++) if (!objectIncludes(b[keys[i]], a[keys[i]])) return false;
      return true;
    } else if (a && b && typeof a === 'function' && typeof b === 'function') {
      return a.toString() === b.toString();
    }
    return false;
  }

  /** Selection range */

  /** Provides details of changing input */
  class ActionDetails {
    /** Current input value */

    /** Current cursor position */

    /** Old input value */

    /** Old selection */

    constructor(opts) {
      Object.assign(this, opts);

      // double check if left part was changed (autofilling, other non-standard input triggers)
      while (this.value.slice(0, this.startChangePos) !== this.oldValue.slice(0, this.startChangePos)) {
        --this.oldSelection.start;
      }
      if (this.insertedCount) {
        // double check right part
        while (this.value.slice(this.cursorPos) !== this.oldValue.slice(this.oldSelection.end)) {
          if (this.value.length - this.cursorPos < this.oldValue.length - this.oldSelection.end) ++this.oldSelection.end;else ++this.cursorPos;
        }
      }
    }

    /** Start changing position */
    get startChangePos() {
      return Math.min(this.cursorPos, this.oldSelection.start);
    }

    /** Inserted symbols count */
    get insertedCount() {
      return this.cursorPos - this.startChangePos;
    }

    /** Inserted symbols */
    get inserted() {
      return this.value.substr(this.startChangePos, this.insertedCount);
    }

    /** Removed symbols count */
    get removedCount() {
      // Math.max for opposite operation
      return Math.max(this.oldSelection.end - this.startChangePos ||
      // for Delete
      this.oldValue.length - this.value.length, 0);
    }

    /** Removed symbols */
    get removed() {
      return this.oldValue.substr(this.startChangePos, this.removedCount);
    }

    /** Unchanged head symbols */
    get head() {
      return this.value.substring(0, this.startChangePos);
    }

    /** Unchanged tail symbols */
    get tail() {
      return this.value.substring(this.startChangePos + this.insertedCount);
    }

    /** Remove direction */
    get removeDirection() {
      if (!this.removedCount || this.insertedCount) return DIRECTION.NONE;

      // align right if delete at right
      return (this.oldSelection.end === this.cursorPos || this.oldSelection.start === this.cursorPos) &&
      // if not range removed (event with backspace)
      this.oldSelection.end === this.oldSelection.start ? DIRECTION.RIGHT : DIRECTION.LEFT;
    }
  }

  /** Applies mask on element */
  function IMask(el, opts) {
    // currently available only for input-like elements
    return new IMask.InputMask(el, opts);
  }

  // TODO can't use overloads here because of https://github.com/microsoft/TypeScript/issues/50754
  // export function maskedClass(mask: string): typeof MaskedPattern;
  // export function maskedClass(mask: DateConstructor): typeof MaskedDate;
  // export function maskedClass(mask: NumberConstructor): typeof MaskedNumber;
  // export function maskedClass(mask: Array<any> | ArrayConstructor): typeof MaskedDynamic;
  // export function maskedClass(mask: MaskedDate): typeof MaskedDate;
  // export function maskedClass(mask: MaskedNumber): typeof MaskedNumber;
  // export function maskedClass(mask: MaskedEnum): typeof MaskedEnum;
  // export function maskedClass(mask: MaskedRange): typeof MaskedRange;
  // export function maskedClass(mask: MaskedRegExp): typeof MaskedRegExp;
  // export function maskedClass(mask: MaskedFunction): typeof MaskedFunction;
  // export function maskedClass(mask: MaskedPattern): typeof MaskedPattern;
  // export function maskedClass(mask: MaskedDynamic): typeof MaskedDynamic;
  // export function maskedClass(mask: Masked): typeof Masked;
  // export function maskedClass(mask: typeof Masked): typeof Masked;
  // export function maskedClass(mask: typeof MaskedDate): typeof MaskedDate;
  // export function maskedClass(mask: typeof MaskedNumber): typeof MaskedNumber;
  // export function maskedClass(mask: typeof MaskedEnum): typeof MaskedEnum;
  // export function maskedClass(mask: typeof MaskedRange): typeof MaskedRange;
  // export function maskedClass(mask: typeof MaskedRegExp): typeof MaskedRegExp;
  // export function maskedClass(mask: typeof MaskedFunction): typeof MaskedFunction;
  // export function maskedClass(mask: typeof MaskedPattern): typeof MaskedPattern;
  // export function maskedClass(mask: typeof MaskedDynamic): typeof MaskedDynamic;
  // export function maskedClass<Mask extends typeof Masked> (mask: Mask): Mask;
  // export function maskedClass(mask: RegExp): typeof MaskedRegExp;
  // export function maskedClass(mask: (value: string, ...args: any[]) => boolean): typeof MaskedFunction;

  /** Get Masked class by mask type */
  function maskedClass(mask) /* TODO */{
    if (mask == null) throw new Error('mask property should be defined');
    if (mask instanceof RegExp) return IMask.MaskedRegExp;
    if (isString(mask)) return IMask.MaskedPattern;
    if (mask === Date) return IMask.MaskedDate;
    if (mask === Number) return IMask.MaskedNumber;
    if (Array.isArray(mask) || mask === Array) return IMask.MaskedDynamic;
    if (IMask.Masked && mask.prototype instanceof IMask.Masked) return mask;
    if (IMask.Masked && mask instanceof IMask.Masked) return mask.constructor;
    if (mask instanceof Function) return IMask.MaskedFunction;
    console.warn('Mask not found for mask', mask); // eslint-disable-line no-console
    return IMask.Masked;
  }
  function normalizeOpts(opts) {
    if (!opts) throw new Error('Options in not defined');
    if (IMask.Masked) {
      if (opts.prototype instanceof IMask.Masked) return {
        mask: opts
      };

      /*
        handle cases like:
        1) opts = Masked
        2) opts = { mask: Masked, ...instanceOpts }
      */
      const {
        mask = undefined,
        ...instanceOpts
      } = opts instanceof IMask.Masked ? {
        mask: opts
      } : isObject(opts) && opts.mask instanceof IMask.Masked ? opts : {};
      if (mask) {
        const _mask = mask.mask;
        return {
          ...pick(mask, (_, k) => !k.startsWith('_')),
          mask: mask.constructor,
          _mask,
          ...instanceOpts
        };
      }
    }
    if (!isObject(opts)) return {
      mask: opts
    };
    return {
      ...opts
    };
  }

  // TODO can't use overloads here because of https://github.com/microsoft/TypeScript/issues/50754

  // From masked
  // export default function createMask<Opts extends Masked, ReturnMasked=Opts> (opts: Opts): ReturnMasked;
  // // From masked class
  // export default function createMask<Opts extends MaskedOptions<typeof Masked>, ReturnMasked extends Masked=InstanceType<Opts['mask']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedDate>, ReturnMasked extends MaskedDate=MaskedDate<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedNumber>, ReturnMasked extends MaskedNumber=MaskedNumber<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedEnum>, ReturnMasked extends MaskedEnum=MaskedEnum<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedRange>, ReturnMasked extends MaskedRange=MaskedRange<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedRegExp>, ReturnMasked extends MaskedRegExp=MaskedRegExp<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedFunction>, ReturnMasked extends MaskedFunction=MaskedFunction<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedPattern>, ReturnMasked extends MaskedPattern=MaskedPattern<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<typeof MaskedDynamic>, ReturnMasked extends MaskedDynamic=MaskedDynamic<Opts['parent']>> (opts: Opts): ReturnMasked;
  // // From mask opts
  // export default function createMask<Opts extends MaskedOptions<Masked>, ReturnMasked=Opts extends MaskedOptions<infer M> ? M : never> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedNumberOptions, ReturnMasked extends MaskedNumber=MaskedNumber<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedDateFactoryOptions, ReturnMasked extends MaskedDate=MaskedDate<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedEnumOptions, ReturnMasked extends MaskedEnum=MaskedEnum<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedRangeOptions, ReturnMasked extends MaskedRange=MaskedRange<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedPatternOptions, ReturnMasked extends MaskedPattern=MaskedPattern<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedDynamicOptions, ReturnMasked extends MaskedDynamic=MaskedDynamic<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<RegExp>, ReturnMasked extends MaskedRegExp=MaskedRegExp<Opts['parent']>> (opts: Opts): ReturnMasked;
  // export default function createMask<Opts extends MaskedOptions<Function>, ReturnMasked extends MaskedFunction=MaskedFunction<Opts['parent']>> (opts: Opts): ReturnMasked;

  /** Creates new {@link Masked} depending on mask type */
  function createMask(opts) {
    if (IMask.Masked && opts instanceof IMask.Masked) return opts;
    const nOpts = normalizeOpts(opts);
    const MaskedClass = maskedClass(nOpts.mask);
    if (!MaskedClass) throw new Error("Masked class is not found for provided mask " + nOpts.mask + ", appropriate module needs to be imported manually before creating mask.");
    if (nOpts.mask === MaskedClass) delete nOpts.mask;
    if (nOpts._mask) {
      nOpts.mask = nOpts._mask;
      delete nOpts._mask;
    }
    return new MaskedClass(nOpts);
  }
  IMask.createMask = createMask;

  /**  Generic element API to use with mask */
  class MaskElement {
    /** */

    /** */

    /** */

    /** Safely returns selection start */
    get selectionStart() {
      let start;
      try {
        start = this._unsafeSelectionStart;
      } catch {}
      return start != null ? start : this.value.length;
    }

    /** Safely returns selection end */
    get selectionEnd() {
      let end;
      try {
        end = this._unsafeSelectionEnd;
      } catch {}
      return end != null ? end : this.value.length;
    }

    /** Safely sets element selection */
    select(start, end) {
      if (start == null || end == null || start === this.selectionStart && end === this.selectionEnd) return;
      try {
        this._unsafeSelect(start, end);
      } catch {}
    }

    /** */
    get isActive() {
      return false;
    }
    /** */

    /** */

    /** */
  }
  IMask.MaskElement = MaskElement;

  const KEY_Z = 90;
  const KEY_Y = 89;

  /** Bridge between HTMLElement and {@link Masked} */
  class HTMLMaskElement extends MaskElement {
    /** HTMLElement to use mask on */

    constructor(input) {
      super();
      this.input = input;
      this._onKeydown = this._onKeydown.bind(this);
      this._onInput = this._onInput.bind(this);
      this._onBeforeinput = this._onBeforeinput.bind(this);
      this._onCompositionEnd = this._onCompositionEnd.bind(this);
    }
    get rootElement() {
      var _this$input$getRootNo, _this$input$getRootNo2, _this$input;
      return (_this$input$getRootNo = (_this$input$getRootNo2 = (_this$input = this.input).getRootNode) == null ? void 0 : _this$input$getRootNo2.call(_this$input)) != null ? _this$input$getRootNo : document;
    }

    /** Is element in focus */
    get isActive() {
      return this.input === this.rootElement.activeElement;
    }

    /** Binds HTMLElement events to mask internal events */
    bindEvents(handlers) {
      this.input.addEventListener('keydown', this._onKeydown);
      this.input.addEventListener('input', this._onInput);
      this.input.addEventListener('beforeinput', this._onBeforeinput);
      this.input.addEventListener('compositionend', this._onCompositionEnd);
      this.input.addEventListener('drop', handlers.drop);
      this.input.addEventListener('click', handlers.click);
      this.input.addEventListener('focus', handlers.focus);
      this.input.addEventListener('blur', handlers.commit);
      this._handlers = handlers;
    }
    _onKeydown(e) {
      if (this._handlers.redo && (e.keyCode === KEY_Z && e.shiftKey && (e.metaKey || e.ctrlKey) || e.keyCode === KEY_Y && e.ctrlKey)) {
        e.preventDefault();
        return this._handlers.redo(e);
      }
      if (this._handlers.undo && e.keyCode === KEY_Z && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        return this._handlers.undo(e);
      }
      if (!e.isComposing) this._handlers.selectionChange(e);
    }
    _onBeforeinput(e) {
      if (e.inputType === 'historyUndo' && this._handlers.undo) {
        e.preventDefault();
        return this._handlers.undo(e);
      }
      if (e.inputType === 'historyRedo' && this._handlers.redo) {
        e.preventDefault();
        return this._handlers.redo(e);
      }
    }
    _onCompositionEnd(e) {
      this._handlers.input(e);
    }
    _onInput(e) {
      if (!e.isComposing) this._handlers.input(e);
    }

    /** Unbinds HTMLElement events to mask internal events */
    unbindEvents() {
      this.input.removeEventListener('keydown', this._onKeydown);
      this.input.removeEventListener('input', this._onInput);
      this.input.removeEventListener('beforeinput', this._onBeforeinput);
      this.input.removeEventListener('compositionend', this._onCompositionEnd);
      this.input.removeEventListener('drop', this._handlers.drop);
      this.input.removeEventListener('click', this._handlers.click);
      this.input.removeEventListener('focus', this._handlers.focus);
      this.input.removeEventListener('blur', this._handlers.commit);
      this._handlers = {};
    }
  }
  IMask.HTMLMaskElement = HTMLMaskElement;

  /** Bridge between InputElement and {@link Masked} */
  class HTMLInputMaskElement extends HTMLMaskElement {
    /** InputElement to use mask on */

    constructor(input) {
      super(input);
      this.input = input;
    }

    /** Returns InputElement selection start */
    get _unsafeSelectionStart() {
      return this.input.selectionStart != null ? this.input.selectionStart : this.value.length;
    }

    /** Returns InputElement selection end */
    get _unsafeSelectionEnd() {
      return this.input.selectionEnd;
    }

    /** Sets InputElement selection */
    _unsafeSelect(start, end) {
      this.input.setSelectionRange(start, end);
    }
    get value() {
      return this.input.value;
    }
    set value(value) {
      this.input.value = value;
    }
  }
  IMask.HTMLMaskElement = HTMLMaskElement;

  class HTMLContenteditableMaskElement extends HTMLMaskElement {
    /** Returns HTMLElement selection start */
    get _unsafeSelectionStart() {
      const root = this.rootElement;
      const selection = root.getSelection && root.getSelection();
      const anchorOffset = selection && selection.anchorOffset;
      const focusOffset = selection && selection.focusOffset;
      if (focusOffset == null || anchorOffset == null || anchorOffset < focusOffset) {
        return anchorOffset;
      }
      return focusOffset;
    }

    /** Returns HTMLElement selection end */
    get _unsafeSelectionEnd() {
      const root = this.rootElement;
      const selection = root.getSelection && root.getSelection();
      const anchorOffset = selection && selection.anchorOffset;
      const focusOffset = selection && selection.focusOffset;
      if (focusOffset == null || anchorOffset == null || anchorOffset > focusOffset) {
        return anchorOffset;
      }
      return focusOffset;
    }

    /** Sets HTMLElement selection */
    _unsafeSelect(start, end) {
      if (!this.rootElement.createRange) return;
      const range = this.rootElement.createRange();
      range.setStart(this.input.firstChild || this.input, start);
      range.setEnd(this.input.lastChild || this.input, end);
      const root = this.rootElement;
      const selection = root.getSelection && root.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    /** HTMLElement value */
    get value() {
      return this.input.textContent || '';
    }
    set value(value) {
      this.input.textContent = value;
    }
  }
  IMask.HTMLContenteditableMaskElement = HTMLContenteditableMaskElement;

  class InputHistory {
    constructor() {
      this.states = [];
      this.currentIndex = 0;
    }
    get currentState() {
      return this.states[this.currentIndex];
    }
    get isEmpty() {
      return this.states.length === 0;
    }
    push(state) {
      // if current index points before the last element then remove the future
      if (this.currentIndex < this.states.length - 1) this.states.length = this.currentIndex + 1;
      this.states.push(state);
      if (this.states.length > InputHistory.MAX_LENGTH) this.states.shift();
      this.currentIndex = this.states.length - 1;
    }
    go(steps) {
      this.currentIndex = Math.min(Math.max(this.currentIndex + steps, 0), this.states.length - 1);
      return this.currentState;
    }
    undo() {
      return this.go(-1);
    }
    redo() {
      return this.go(+1);
    }
    clear() {
      this.states.length = 0;
      this.currentIndex = 0;
    }
  }
  InputHistory.MAX_LENGTH = 100;

  /** Listens to element events and controls changes between element and {@link Masked} */
  class InputMask {
    /**
      View element
    */

    /** Internal {@link Masked} model */

    constructor(el, opts) {
      this.el = el instanceof MaskElement ? el : el.isContentEditable && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' ? new HTMLContenteditableMaskElement(el) : new HTMLInputMaskElement(el);
      this.masked = createMask(opts);
      this._listeners = {};
      this._value = '';
      this._unmaskedValue = '';
      this._rawInputValue = '';
      this.history = new InputHistory();
      this._saveSelection = this._saveSelection.bind(this);
      this._onInput = this._onInput.bind(this);
      this._onChange = this._onChange.bind(this);
      this._onDrop = this._onDrop.bind(this);
      this._onFocus = this._onFocus.bind(this);
      this._onClick = this._onClick.bind(this);
      this._onUndo = this._onUndo.bind(this);
      this._onRedo = this._onRedo.bind(this);
      this.alignCursor = this.alignCursor.bind(this);
      this.alignCursorFriendly = this.alignCursorFriendly.bind(this);
      this._bindEvents();

      // refresh
      this.updateValue();
      this._onChange();
    }
    maskEquals(mask) {
      var _this$masked;
      return mask == null || ((_this$masked = this.masked) == null ? void 0 : _this$masked.maskEquals(mask));
    }

    /** Masked */
    get mask() {
      return this.masked.mask;
    }
    set mask(mask) {
      if (this.maskEquals(mask)) return;
      if (!(mask instanceof IMask.Masked) && this.masked.constructor === maskedClass(mask)) {
        // TODO "any" no idea
        this.masked.updateOptions({
          mask
        });
        return;
      }
      const masked = mask instanceof IMask.Masked ? mask : createMask({
        mask
      });
      masked.unmaskedValue = this.masked.unmaskedValue;
      this.masked = masked;
    }

    /** Raw value */
    get value() {
      return this._value;
    }
    set value(str) {
      if (this.value === str) return;
      this.masked.value = str;
      this.updateControl('auto');
    }

    /** Unmasked value */
    get unmaskedValue() {
      return this._unmaskedValue;
    }
    set unmaskedValue(str) {
      if (this.unmaskedValue === str) return;
      this.masked.unmaskedValue = str;
      this.updateControl('auto');
    }

    /** Raw input value */
    get rawInputValue() {
      return this._rawInputValue;
    }
    set rawInputValue(str) {
      if (this.rawInputValue === str) return;
      this.masked.rawInputValue = str;
      this.updateControl();
      this.alignCursor();
    }

    /** Typed unmasked value */
    get typedValue() {
      return this.masked.typedValue;
    }
    set typedValue(val) {
      if (this.masked.typedValueEquals(val)) return;
      this.masked.typedValue = val;
      this.updateControl('auto');
    }

    /** Display value */
    get displayValue() {
      return this.masked.displayValue;
    }

    /** Starts listening to element events */
    _bindEvents() {
      this.el.bindEvents({
        selectionChange: this._saveSelection,
        input: this._onInput,
        drop: this._onDrop,
        click: this._onClick,
        focus: this._onFocus,
        commit: this._onChange,
        undo: this._onUndo,
        redo: this._onRedo
      });
    }

    /** Stops listening to element events */
    _unbindEvents() {
      if (this.el) this.el.unbindEvents();
    }

    /** Fires custom event */
    _fireEvent(ev, e) {
      const listeners = this._listeners[ev];
      if (!listeners) return;
      listeners.forEach(l => l(e));
    }

    /** Current selection start */
    get selectionStart() {
      return this._cursorChanging ? this._changingCursorPos : this.el.selectionStart;
    }

    /** Current cursor position */
    get cursorPos() {
      return this._cursorChanging ? this._changingCursorPos : this.el.selectionEnd;
    }
    set cursorPos(pos) {
      if (!this.el || !this.el.isActive) return;
      this.el.select(pos, pos);
      this._saveSelection();
    }

    /** Stores current selection */
    _saveSelection( /* ev */
    ) {
      if (this.displayValue !== this.el.value) {
        console.warn('Element value was changed outside of mask. Syncronize mask using `mask.updateValue()` to work properly.'); // eslint-disable-line no-console
      }
      this._selection = {
        start: this.selectionStart,
        end: this.cursorPos
      };
    }

    /** Syncronizes model value from view */
    updateValue() {
      this.masked.value = this.el.value;
      this._value = this.masked.value;
      this._unmaskedValue = this.masked.unmaskedValue;
      this._rawInputValue = this.masked.rawInputValue;
    }

    /** Syncronizes view from model value, fires change events */
    updateControl(cursorPos) {
      const newUnmaskedValue = this.masked.unmaskedValue;
      const newValue = this.masked.value;
      const newRawInputValue = this.masked.rawInputValue;
      const newDisplayValue = this.displayValue;
      const isChanged = this.unmaskedValue !== newUnmaskedValue || this.value !== newValue || this._rawInputValue !== newRawInputValue;
      this._unmaskedValue = newUnmaskedValue;
      this._value = newValue;
      this._rawInputValue = newRawInputValue;
      if (this.el.value !== newDisplayValue) this.el.value = newDisplayValue;
      if (cursorPos === 'auto') this.alignCursor();else if (cursorPos != null) this.cursorPos = cursorPos;
      if (isChanged) this._fireChangeEvents();
      if (!this._historyChanging && (isChanged || this.history.isEmpty)) this.history.push({
        unmaskedValue: newUnmaskedValue,
        selection: {
          start: this.selectionStart,
          end: this.cursorPos
        }
      });
    }

    /** Updates options with deep equal check, recreates {@link Masked} model if mask type changes */
    updateOptions(opts) {
      const {
        mask,
        ...restOpts
      } = opts; // TODO types, yes, mask is optional

      const updateMask = !this.maskEquals(mask);
      const updateOpts = this.masked.optionsIsChanged(restOpts);
      if (updateMask) this.mask = mask;
      if (updateOpts) this.masked.updateOptions(restOpts); // TODO

      if (updateMask || updateOpts) this.updateControl();
    }

    /** Updates cursor */
    updateCursor(cursorPos) {
      if (cursorPos == null) return;
      this.cursorPos = cursorPos;

      // also queue change cursor for mobile browsers
      this._delayUpdateCursor(cursorPos);
    }

    /** Delays cursor update to support mobile browsers */
    _delayUpdateCursor(cursorPos) {
      this._abortUpdateCursor();
      this._changingCursorPos = cursorPos;
      this._cursorChanging = setTimeout(() => {
        if (!this.el) return; // if was destroyed
        this.cursorPos = this._changingCursorPos;
        this._abortUpdateCursor();
      }, 10);
    }

    /** Fires custom events */
    _fireChangeEvents() {
      this._fireEvent('accept', this._inputEvent);
      if (this.masked.isComplete) this._fireEvent('complete', this._inputEvent);
    }

    /** Aborts delayed cursor update */
    _abortUpdateCursor() {
      if (this._cursorChanging) {
        clearTimeout(this._cursorChanging);
        delete this._cursorChanging;
      }
    }

    /** Aligns cursor to nearest available position */
    alignCursor() {
      this.cursorPos = this.masked.nearestInputPos(this.masked.nearestInputPos(this.cursorPos, DIRECTION.LEFT));
    }

    /** Aligns cursor only if selection is empty */
    alignCursorFriendly() {
      if (this.selectionStart !== this.cursorPos) return; // skip if range is selected
      this.alignCursor();
    }

    /** Adds listener on custom event */
    on(ev, handler) {
      if (!this._listeners[ev]) this._listeners[ev] = [];
      this._listeners[ev].push(handler);
      return this;
    }

    /** Removes custom event listener */
    off(ev, handler) {
      if (!this._listeners[ev]) return this;
      if (!handler) {
        delete this._listeners[ev];
        return this;
      }
      const hIndex = this._listeners[ev].indexOf(handler);
      if (hIndex >= 0) this._listeners[ev].splice(hIndex, 1);
      return this;
    }

    /** Handles view input event */
    _onInput(e) {
      this._inputEvent = e;
      this._abortUpdateCursor();
      const details = new ActionDetails({
        // new state
        value: this.el.value,
        cursorPos: this.cursorPos,
        // old state
        oldValue: this.displayValue,
        oldSelection: this._selection
      });
      const oldRawValue = this.masked.rawInputValue;
      const offset = this.masked.splice(details.startChangePos, details.removed.length, details.inserted, details.removeDirection, {
        input: true,
        raw: true
      }).offset;

      // force align in remove direction only if no input chars were removed
      // otherwise we still need to align with NONE (to get out from fixed symbols for instance)
      const removeDirection = oldRawValue === this.masked.rawInputValue ? details.removeDirection : DIRECTION.NONE;
      let cursorPos = this.masked.nearestInputPos(details.startChangePos + offset, removeDirection);
      if (removeDirection !== DIRECTION.NONE) cursorPos = this.masked.nearestInputPos(cursorPos, DIRECTION.NONE);
      this.updateControl(cursorPos);
      delete this._inputEvent;
    }

    /** Handles view change event and commits model value */
    _onChange() {
      if (this.displayValue !== this.el.value) this.updateValue();
      this.masked.doCommit();
      this.updateControl();
      this._saveSelection();
    }

    /** Handles view drop event, prevents by default */
    _onDrop(ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    /** Restore last selection on focus */
    _onFocus(ev) {
      this.alignCursorFriendly();
    }

    /** Restore last selection on focus */
    _onClick(ev) {
      this.alignCursorFriendly();
    }
    _onUndo() {
      this._applyHistoryState(this.history.undo());
    }
    _onRedo() {
      this._applyHistoryState(this.history.redo());
    }
    _applyHistoryState(state) {
      if (!state) return;
      this._historyChanging = true;
      this.unmaskedValue = state.unmaskedValue;
      this.el.select(state.selection.start, state.selection.end);
      this._saveSelection();
      this._historyChanging = false;
    }

    /** Unbind view events and removes element reference */
    destroy() {
      this._unbindEvents();
      this._listeners.length = 0;
      delete this.el;
    }
  }
  IMask.InputMask = InputMask;

  /** Provides details of changing model value */
  class ChangeDetails {
    /** Inserted symbols */

    /** Additional offset if any changes occurred before tail */

    /** Raw inserted is used by dynamic mask */

    /** Can skip chars */

    static normalize(prep) {
      return Array.isArray(prep) ? prep : [prep, new ChangeDetails()];
    }
    constructor(details) {
      Object.assign(this, {
        inserted: '',
        rawInserted: '',
        tailShift: 0,
        skip: false
      }, details);
    }

    /** Aggregate changes */
    aggregate(details) {
      this.inserted += details.inserted;
      this.rawInserted += details.rawInserted;
      this.tailShift += details.tailShift;
      this.skip = this.skip || details.skip;
      return this;
    }

    /** Total offset considering all changes */
    get offset() {
      return this.tailShift + this.inserted.length;
    }
    get consumed() {
      return Boolean(this.rawInserted) || this.skip;
    }
    equals(details) {
      return this.inserted === details.inserted && this.tailShift === details.tailShift && this.rawInserted === details.rawInserted && this.skip === details.skip;
    }
  }
  IMask.ChangeDetails = ChangeDetails;

  /** Provides details of continuous extracted tail */
  class ContinuousTailDetails {
    /** Tail value as string */

    /** Tail start position */

    /** Start position */

    constructor(value, from, stop) {
      if (value === void 0) {
        value = '';
      }
      if (from === void 0) {
        from = 0;
      }
      this.value = value;
      this.from = from;
      this.stop = stop;
    }
    toString() {
      return this.value;
    }
    extend(tail) {
      this.value += String(tail);
    }
    appendTo(masked) {
      return masked.append(this.toString(), {
        tail: true
      }).aggregate(masked._appendPlaceholder());
    }
    get state() {
      return {
        value: this.value,
        from: this.from,
        stop: this.stop
      };
    }
    set state(state) {
      Object.assign(this, state);
    }
    unshift(beforePos) {
      if (!this.value.length || beforePos != null && this.from >= beforePos) return '';
      const shiftChar = this.value[0];
      this.value = this.value.slice(1);
      return shiftChar;
    }
    shift() {
      if (!this.value.length) return '';
      const shiftChar = this.value[this.value.length - 1];
      this.value = this.value.slice(0, -1);
      return shiftChar;
    }
  }

  /** Append flags */

  /** Extract flags */

  // see https://github.com/microsoft/TypeScript/issues/6223

  /** Provides common masking stuff */
  class Masked {
    /** */

    /** */

    /** Transforms value before mask processing */

    /** Transforms each char before mask processing */

    /** Validates if value is acceptable */

    /** Does additional processing at the end of editing */

    /** Format typed value to string */

    /** Parse string to get typed value */

    /** Enable characters overwriting */

    /** */

    /** */

    /** */

    /** */

    constructor(opts) {
      this._value = '';
      this._update({
        ...Masked.DEFAULTS,
        ...opts
      });
      this._initialized = true;
    }

    /** Sets and applies new options */
    updateOptions(opts) {
      if (!this.optionsIsChanged(opts)) return;
      this.withValueRefresh(this._update.bind(this, opts));
    }

    /** Sets new options */
    _update(opts) {
      Object.assign(this, opts);
    }

    /** Mask state */
    get state() {
      return {
        _value: this.value,
        _rawInputValue: this.rawInputValue
      };
    }
    set state(state) {
      this._value = state._value;
    }

    /** Resets value */
    reset() {
      this._value = '';
    }
    get value() {
      return this._value;
    }
    set value(value) {
      this.resolve(value, {
        input: true
      });
    }

    /** Resolve new value */
    resolve(value, flags) {
      if (flags === void 0) {
        flags = {
          input: true
        };
      }
      this.reset();
      this.append(value, flags, '');
      this.doCommit();
    }
    get unmaskedValue() {
      return this.value;
    }
    set unmaskedValue(value) {
      this.resolve(value, {});
    }
    get typedValue() {
      return this.parse ? this.parse(this.value, this) : this.unmaskedValue;
    }
    set typedValue(value) {
      if (this.format) {
        this.value = this.format(value, this);
      } else {
        this.unmaskedValue = String(value);
      }
    }

    /** Value that includes raw user input */
    get rawInputValue() {
      return this.extractInput(0, this.displayValue.length, {
        raw: true
      });
    }
    set rawInputValue(value) {
      this.resolve(value, {
        raw: true
      });
    }
    get displayValue() {
      return this.value;
    }
    get isComplete() {
      return true;
    }
    get isFilled() {
      return this.isComplete;
    }

    /** Finds nearest input position in direction */
    nearestInputPos(cursorPos, direction) {
      return cursorPos;
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      return Math.min(this.displayValue.length, toPos - fromPos);
    }

    /** Extracts value in range considering flags */
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      return this.displayValue.slice(fromPos, toPos);
    }

    /** Extracts tail in range */
    extractTail(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      return new ContinuousTailDetails(this.extractInput(fromPos, toPos), fromPos);
    }

    /** Appends tail */
    appendTail(tail) {
      if (isString(tail)) tail = new ContinuousTailDetails(String(tail));
      return tail.appendTo(this);
    }

    /** Appends char */
    _appendCharRaw(ch, flags) {
      if (!ch) return new ChangeDetails();
      this._value += ch;
      return new ChangeDetails({
        inserted: ch,
        rawInserted: ch
      });
    }

    /** Appends char */
    _appendChar(ch, flags, checkTail) {
      if (flags === void 0) {
        flags = {};
      }
      const consistentState = this.state;
      let details;
      [ch, details] = this.doPrepareChar(ch, flags);
      if (ch) {
        details = details.aggregate(this._appendCharRaw(ch, flags));

        // TODO handle `skip`?

        // try `autofix` lookahead
        if (!details.rawInserted && this.autofix === 'pad') {
          const noFixState = this.state;
          this.state = consistentState;
          let fixDetails = this.pad(flags);
          const chDetails = this._appendCharRaw(ch, flags);
          fixDetails = fixDetails.aggregate(chDetails);

          // if fix was applied or
          // if details are equal use skip restoring state optimization
          if (chDetails.rawInserted || fixDetails.equals(details)) {
            details = fixDetails;
          } else {
            this.state = noFixState;
          }
        }
      }
      if (details.inserted) {
        let consistentTail;
        let appended = this.doValidate(flags) !== false;
        if (appended && checkTail != null) {
          // validation ok, check tail
          const beforeTailState = this.state;
          if (this.overwrite === true) {
            consistentTail = checkTail.state;
            for (let i = 0; i < details.rawInserted.length; ++i) {
              checkTail.unshift(this.displayValue.length - details.tailShift);
            }
          }
          let tailDetails = this.appendTail(checkTail);
          appended = tailDetails.rawInserted.length === checkTail.toString().length;

          // not ok, try shift
          if (!(appended && tailDetails.inserted) && this.overwrite === 'shift') {
            this.state = beforeTailState;
            consistentTail = checkTail.state;
            for (let i = 0; i < details.rawInserted.length; ++i) {
              checkTail.shift();
            }
            tailDetails = this.appendTail(checkTail);
            appended = tailDetails.rawInserted.length === checkTail.toString().length;
          }

          // if ok, rollback state after tail
          if (appended && tailDetails.inserted) this.state = beforeTailState;
        }

        // revert all if something went wrong
        if (!appended) {
          details = new ChangeDetails();
          this.state = consistentState;
          if (checkTail && consistentTail) checkTail.state = consistentTail;
        }
      }
      return details;
    }

    /** Appends optional placeholder at the end */
    _appendPlaceholder() {
      return new ChangeDetails();
    }

    /** Appends optional eager placeholder at the end */
    _appendEager() {
      return new ChangeDetails();
    }

    /** Appends symbols considering flags */
    append(str, flags, tail) {
      if (!isString(str)) throw new Error('value should be string');
      const checkTail = isString(tail) ? new ContinuousTailDetails(String(tail)) : tail;
      if (flags != null && flags.tail) flags._beforeTailState = this.state;
      let details;
      [str, details] = this.doPrepare(str, flags);
      for (let ci = 0; ci < str.length; ++ci) {
        const d = this._appendChar(str[ci], flags, checkTail);
        if (!d.rawInserted && !this.doSkipInvalid(str[ci], flags, checkTail)) break;
        details.aggregate(d);
      }
      if ((this.eager === true || this.eager === 'append') && flags != null && flags.input && str) {
        details.aggregate(this._appendEager());
      }

      // append tail but aggregate only tailShift
      if (checkTail != null) {
        details.tailShift += this.appendTail(checkTail).tailShift;
        // TODO it's a good idea to clear state after appending ends
        // but it causes bugs when one append calls another (when dynamic dispatch set rawInputValue)
        // this._resetBeforeTailState();
      }
      return details;
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      this._value = this.displayValue.slice(0, fromPos) + this.displayValue.slice(toPos);
      return new ChangeDetails();
    }

    /** Calls function and reapplies current value */
    withValueRefresh(fn) {
      if (this._refreshing || !this._initialized) return fn();
      this._refreshing = true;
      const rawInput = this.rawInputValue;
      const value = this.value;
      const ret = fn();
      this.rawInputValue = rawInput;
      // append lost trailing chars at the end
      if (this.value && this.value !== value && value.indexOf(this.value) === 0) {
        this.append(value.slice(this.displayValue.length), {}, '');
        this.doCommit();
      }
      delete this._refreshing;
      return ret;
    }
    runIsolated(fn) {
      if (this._isolated || !this._initialized) return fn(this);
      this._isolated = true;
      const state = this.state;
      const ret = fn(this);
      this.state = state;
      delete this._isolated;
      return ret;
    }
    doSkipInvalid(ch, flags, checkTail) {
      return Boolean(this.skipInvalid);
    }

    /** Prepares string before mask processing */
    doPrepare(str, flags) {
      if (flags === void 0) {
        flags = {};
      }
      return ChangeDetails.normalize(this.prepare ? this.prepare(str, this, flags) : str);
    }

    /** Prepares each char before mask processing */
    doPrepareChar(str, flags) {
      if (flags === void 0) {
        flags = {};
      }
      return ChangeDetails.normalize(this.prepareChar ? this.prepareChar(str, this, flags) : str);
    }

    /** Validates if value is acceptable */
    doValidate(flags) {
      return (!this.validate || this.validate(this.value, this, flags)) && (!this.parent || this.parent.doValidate(flags));
    }

    /** Does additional processing at the end of editing */
    doCommit() {
      if (this.commit) this.commit(this.value, this);
    }
    splice(start, deleteCount, inserted, removeDirection, flags) {
      if (inserted === void 0) {
        inserted = '';
      }
      if (removeDirection === void 0) {
        removeDirection = DIRECTION.NONE;
      }
      if (flags === void 0) {
        flags = {
          input: true
        };
      }
      const tailPos = start + deleteCount;
      const tail = this.extractTail(tailPos);
      const eagerRemove = this.eager === true || this.eager === 'remove';
      let oldRawValue;
      if (eagerRemove) {
        removeDirection = forceDirection(removeDirection);
        oldRawValue = this.extractInput(0, tailPos, {
          raw: true
        });
      }
      let startChangePos = start;
      const details = new ChangeDetails();

      // if it is just deletion without insertion
      if (removeDirection !== DIRECTION.NONE) {
        startChangePos = this.nearestInputPos(start, deleteCount > 1 && start !== 0 && !eagerRemove ? DIRECTION.NONE : removeDirection);

        // adjust tailShift if start was aligned
        details.tailShift = startChangePos - start;
      }
      details.aggregate(this.remove(startChangePos));
      if (eagerRemove && removeDirection !== DIRECTION.NONE && oldRawValue === this.rawInputValue) {
        if (removeDirection === DIRECTION.FORCE_LEFT) {
          let valLength;
          while (oldRawValue === this.rawInputValue && (valLength = this.displayValue.length)) {
            details.aggregate(new ChangeDetails({
              tailShift: -1
            })).aggregate(this.remove(valLength - 1));
          }
        } else if (removeDirection === DIRECTION.FORCE_RIGHT) {
          tail.unshift();
        }
      }
      return details.aggregate(this.append(inserted, flags, tail));
    }
    maskEquals(mask) {
      return this.mask === mask;
    }
    optionsIsChanged(opts) {
      return !objectIncludes(this, opts);
    }
    typedValueEquals(value) {
      const tval = this.typedValue;
      return value === tval || Masked.EMPTY_VALUES.includes(value) && Masked.EMPTY_VALUES.includes(tval) || (this.format ? this.format(value, this) === this.format(this.typedValue, this) : false);
    }
    pad(flags) {
      return new ChangeDetails();
    }
  }
  Masked.DEFAULTS = {
    skipInvalid: true
  };
  Masked.EMPTY_VALUES = [undefined, null, ''];
  IMask.Masked = Masked;

  class ChunksTailDetails {
    /** */

    constructor(chunks, from) {
      if (chunks === void 0) {
        chunks = [];
      }
      if (from === void 0) {
        from = 0;
      }
      this.chunks = chunks;
      this.from = from;
    }
    toString() {
      return this.chunks.map(String).join('');
    }
    extend(tailChunk) {
      if (!String(tailChunk)) return;
      tailChunk = isString(tailChunk) ? new ContinuousTailDetails(String(tailChunk)) : tailChunk;
      const lastChunk = this.chunks[this.chunks.length - 1];
      const extendLast = lastChunk && (
      // if stops are same or tail has no stop
      lastChunk.stop === tailChunk.stop || tailChunk.stop == null) &&
      // if tail chunk goes just after last chunk
      tailChunk.from === lastChunk.from + lastChunk.toString().length;
      if (tailChunk instanceof ContinuousTailDetails) {
        // check the ability to extend previous chunk
        if (extendLast) {
          // extend previous chunk
          lastChunk.extend(tailChunk.toString());
        } else {
          // append new chunk
          this.chunks.push(tailChunk);
        }
      } else if (tailChunk instanceof ChunksTailDetails) {
        if (tailChunk.stop == null) {
          // unwrap floating chunks to parent, keeping `from` pos
          let firstTailChunk;
          while (tailChunk.chunks.length && tailChunk.chunks[0].stop == null) {
            firstTailChunk = tailChunk.chunks.shift(); // not possible to be `undefined` because length was checked above
            firstTailChunk.from += tailChunk.from;
            this.extend(firstTailChunk);
          }
        }

        // if tail chunk still has value
        if (tailChunk.toString()) {
          // if chunks contains stops, then popup stop to container
          tailChunk.stop = tailChunk.blockIndex;
          this.chunks.push(tailChunk);
        }
      }
    }
    appendTo(masked) {
      if (!(masked instanceof IMask.MaskedPattern)) {
        const tail = new ContinuousTailDetails(this.toString());
        return tail.appendTo(masked);
      }
      const details = new ChangeDetails();
      for (let ci = 0; ci < this.chunks.length; ++ci) {
        const chunk = this.chunks[ci];
        const lastBlockIter = masked._mapPosToBlock(masked.displayValue.length);
        const stop = chunk.stop;
        let chunkBlock;
        if (stop != null && (
        // if block not found or stop is behind lastBlock
        !lastBlockIter || lastBlockIter.index <= stop)) {
          if (chunk instanceof ChunksTailDetails ||
          // for continuous block also check if stop is exist
          masked._stops.indexOf(stop) >= 0) {
            details.aggregate(masked._appendPlaceholder(stop));
          }
          chunkBlock = chunk instanceof ChunksTailDetails && masked._blocks[stop];
        }
        if (chunkBlock) {
          const tailDetails = chunkBlock.appendTail(chunk);
          details.aggregate(tailDetails);

          // get not inserted chars
          const remainChars = chunk.toString().slice(tailDetails.rawInserted.length);
          if (remainChars) details.aggregate(masked.append(remainChars, {
            tail: true
          }));
        } else {
          details.aggregate(masked.append(chunk.toString(), {
            tail: true
          }));
        }
      }
      return details;
    }
    get state() {
      return {
        chunks: this.chunks.map(c => c.state),
        from: this.from,
        stop: this.stop,
        blockIndex: this.blockIndex
      };
    }
    set state(state) {
      const {
        chunks,
        ...props
      } = state;
      Object.assign(this, props);
      this.chunks = chunks.map(cstate => {
        const chunk = "chunks" in cstate ? new ChunksTailDetails() : new ContinuousTailDetails();
        chunk.state = cstate;
        return chunk;
      });
    }
    unshift(beforePos) {
      if (!this.chunks.length || beforePos != null && this.from >= beforePos) return '';
      const chunkShiftPos = beforePos != null ? beforePos - this.from : beforePos;
      let ci = 0;
      while (ci < this.chunks.length) {
        const chunk = this.chunks[ci];
        const shiftChar = chunk.unshift(chunkShiftPos);
        if (chunk.toString()) {
          // chunk still contains value
          // but not shifted - means no more available chars to shift
          if (!shiftChar) break;
          ++ci;
        } else {
          // clean if chunk has no value
          this.chunks.splice(ci, 1);
        }
        if (shiftChar) return shiftChar;
      }
      return '';
    }
    shift() {
      if (!this.chunks.length) return '';
      let ci = this.chunks.length - 1;
      while (0 <= ci) {
        const chunk = this.chunks[ci];
        const shiftChar = chunk.shift();
        if (chunk.toString()) {
          // chunk still contains value
          // but not shifted - means no more available chars to shift
          if (!shiftChar) break;
          --ci;
        } else {
          // clean if chunk has no value
          this.chunks.splice(ci, 1);
        }
        if (shiftChar) return shiftChar;
      }
      return '';
    }
  }

  class PatternCursor {
    constructor(masked, pos) {
      this.masked = masked;
      this._log = [];
      const {
        offset,
        index
      } = masked._mapPosToBlock(pos) || (pos < 0 ?
      // first
      {
        index: 0,
        offset: 0
      } :
      // last
      {
        index: this.masked._blocks.length,
        offset: 0
      });
      this.offset = offset;
      this.index = index;
      this.ok = false;
    }
    get block() {
      return this.masked._blocks[this.index];
    }
    get pos() {
      return this.masked._blockStartPos(this.index) + this.offset;
    }
    get state() {
      return {
        index: this.index,
        offset: this.offset,
        ok: this.ok
      };
    }
    set state(s) {
      Object.assign(this, s);
    }
    pushState() {
      this._log.push(this.state);
    }
    popState() {
      const s = this._log.pop();
      if (s) this.state = s;
      return s;
    }
    bindBlock() {
      if (this.block) return;
      if (this.index < 0) {
        this.index = 0;
        this.offset = 0;
      }
      if (this.index >= this.masked._blocks.length) {
        this.index = this.masked._blocks.length - 1;
        this.offset = this.block.displayValue.length; // TODO this is stupid type error, `block` depends on index that was changed above
      }
    }
    _pushLeft(fn) {
      this.pushState();
      for (this.bindBlock(); 0 <= this.index; --this.index, this.offset = ((_this$block = this.block) == null ? void 0 : _this$block.displayValue.length) || 0) {
        var _this$block;
        if (fn()) return this.ok = true;
      }
      return this.ok = false;
    }
    _pushRight(fn) {
      this.pushState();
      for (this.bindBlock(); this.index < this.masked._blocks.length; ++this.index, this.offset = 0) {
        if (fn()) return this.ok = true;
      }
      return this.ok = false;
    }
    pushLeftBeforeFilled() {
      return this._pushLeft(() => {
        if (this.block.isFixed || !this.block.value) return;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.FORCE_LEFT);
        if (this.offset !== 0) return true;
      });
    }
    pushLeftBeforeInput() {
      // cases:
      // filled input: 00|
      // optional empty input: 00[]|
      // nested block: XX<[]>|
      return this._pushLeft(() => {
        if (this.block.isFixed) return;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.LEFT);
        return true;
      });
    }
    pushLeftBeforeRequired() {
      return this._pushLeft(() => {
        if (this.block.isFixed || this.block.isOptional && !this.block.value) return;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.LEFT);
        return true;
      });
    }
    pushRightBeforeFilled() {
      return this._pushRight(() => {
        if (this.block.isFixed || !this.block.value) return;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.FORCE_RIGHT);
        if (this.offset !== this.block.value.length) return true;
      });
    }
    pushRightBeforeInput() {
      return this._pushRight(() => {
        if (this.block.isFixed) return;

        // const o = this.offset;
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.NONE);
        // HACK cases like (STILL DOES NOT WORK FOR NESTED)
        // aa|X
        // aa<X|[]>X_    - this will not work
        // if (o && o === this.offset && this.block instanceof PatternInputDefinition) continue;
        return true;
      });
    }
    pushRightBeforeRequired() {
      return this._pushRight(() => {
        if (this.block.isFixed || this.block.isOptional && !this.block.value) return;

        // TODO check |[*]XX_
        this.offset = this.block.nearestInputPos(this.offset, DIRECTION.NONE);
        return true;
      });
    }
  }

  class PatternFixedDefinition {
    /** */

    /** */

    /** */

    /** */

    /** */

    /** */

    constructor(opts) {
      Object.assign(this, opts);
      this._value = '';
      this.isFixed = true;
    }
    get value() {
      return this._value;
    }
    get unmaskedValue() {
      return this.isUnmasking ? this.value : '';
    }
    get rawInputValue() {
      return this._isRawInput ? this.value : '';
    }
    get displayValue() {
      return this.value;
    }
    reset() {
      this._isRawInput = false;
      this._value = '';
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this._value.length;
      }
      this._value = this._value.slice(0, fromPos) + this._value.slice(toPos);
      if (!this._value) this._isRawInput = false;
      return new ChangeDetails();
    }
    nearestInputPos(cursorPos, direction) {
      if (direction === void 0) {
        direction = DIRECTION.NONE;
      }
      const minPos = 0;
      const maxPos = this._value.length;
      switch (direction) {
        case DIRECTION.LEFT:
        case DIRECTION.FORCE_LEFT:
          return minPos;
        case DIRECTION.NONE:
        case DIRECTION.RIGHT:
        case DIRECTION.FORCE_RIGHT:
        default:
          return maxPos;
      }
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this._value.length;
      }
      return this._isRawInput ? toPos - fromPos : 0;
    }
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this._value.length;
      }
      if (flags === void 0) {
        flags = {};
      }
      return flags.raw && this._isRawInput && this._value.slice(fromPos, toPos) || '';
    }
    get isComplete() {
      return true;
    }
    get isFilled() {
      return Boolean(this._value);
    }
    _appendChar(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      if (this.isFilled) return new ChangeDetails();
      const appendEager = this.eager === true || this.eager === 'append';
      const appended = this.char === ch;
      const isResolved = appended && (this.isUnmasking || flags.input || flags.raw) && (!flags.raw || !appendEager) && !flags.tail;
      const details = new ChangeDetails({
        inserted: this.char,
        rawInserted: isResolved ? this.char : ''
      });
      this._value = this.char;
      this._isRawInput = isResolved && (flags.raw || flags.input);
      return details;
    }
    _appendEager() {
      return this._appendChar(this.char, {
        tail: true
      });
    }
    _appendPlaceholder() {
      const details = new ChangeDetails();
      if (this.isFilled) return details;
      this._value = details.inserted = this.char;
      return details;
    }
    extractTail() {
      return new ContinuousTailDetails('');
    }
    appendTail(tail) {
      if (isString(tail)) tail = new ContinuousTailDetails(String(tail));
      return tail.appendTo(this);
    }
    append(str, flags, tail) {
      const details = this._appendChar(str[0], flags);
      if (tail != null) {
        details.tailShift += this.appendTail(tail).tailShift;
      }
      return details;
    }
    doCommit() {}
    get state() {
      return {
        _value: this._value,
        _rawInputValue: this.rawInputValue
      };
    }
    set state(state) {
      this._value = state._value;
      this._isRawInput = Boolean(state._rawInputValue);
    }
    pad(flags) {
      return this._appendPlaceholder();
    }
  }

  class PatternInputDefinition {
    /** */

    /** */

    /** */

    /** */

    /** */

    /** */

    /** */

    /** */

    constructor(opts) {
      const {
        parent,
        isOptional,
        placeholderChar,
        displayChar,
        lazy,
        eager,
        ...maskOpts
      } = opts;
      this.masked = createMask(maskOpts);
      Object.assign(this, {
        parent,
        isOptional,
        placeholderChar,
        displayChar,
        lazy,
        eager
      });
    }
    reset() {
      this.isFilled = false;
      this.masked.reset();
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.value.length;
      }
      if (fromPos === 0 && toPos >= 1) {
        this.isFilled = false;
        return this.masked.remove(fromPos, toPos);
      }
      return new ChangeDetails();
    }
    get value() {
      return this.masked.value || (this.isFilled && !this.isOptional ? this.placeholderChar : '');
    }
    get unmaskedValue() {
      return this.masked.unmaskedValue;
    }
    get rawInputValue() {
      return this.masked.rawInputValue;
    }
    get displayValue() {
      return this.masked.value && this.displayChar || this.value;
    }
    get isComplete() {
      return Boolean(this.masked.value) || this.isOptional;
    }
    _appendChar(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      if (this.isFilled) return new ChangeDetails();
      const state = this.masked.state;
      // simulate input
      let details = this.masked._appendChar(ch, this.currentMaskFlags(flags));
      if (details.inserted && this.doValidate(flags) === false) {
        details = new ChangeDetails();
        this.masked.state = state;
      }
      if (!details.inserted && !this.isOptional && !this.lazy && !flags.input) {
        details.inserted = this.placeholderChar;
      }
      details.skip = !details.inserted && !this.isOptional;
      this.isFilled = Boolean(details.inserted);
      return details;
    }
    append(str, flags, tail) {
      // TODO probably should be done via _appendChar
      return this.masked.append(str, this.currentMaskFlags(flags), tail);
    }
    _appendPlaceholder() {
      if (this.isFilled || this.isOptional) return new ChangeDetails();
      this.isFilled = true;
      return new ChangeDetails({
        inserted: this.placeholderChar
      });
    }
    _appendEager() {
      return new ChangeDetails();
    }
    extractTail(fromPos, toPos) {
      return this.masked.extractTail(fromPos, toPos);
    }
    appendTail(tail) {
      return this.masked.appendTail(tail);
    }
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.value.length;
      }
      return this.masked.extractInput(fromPos, toPos, flags);
    }
    nearestInputPos(cursorPos, direction) {
      if (direction === void 0) {
        direction = DIRECTION.NONE;
      }
      const minPos = 0;
      const maxPos = this.value.length;
      const boundPos = Math.min(Math.max(cursorPos, minPos), maxPos);
      switch (direction) {
        case DIRECTION.LEFT:
        case DIRECTION.FORCE_LEFT:
          return this.isComplete ? boundPos : minPos;
        case DIRECTION.RIGHT:
        case DIRECTION.FORCE_RIGHT:
          return this.isComplete ? boundPos : maxPos;
        case DIRECTION.NONE:
        default:
          return boundPos;
      }
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.value.length;
      }
      return this.value.slice(fromPos, toPos).length;
    }
    doValidate(flags) {
      return this.masked.doValidate(this.currentMaskFlags(flags)) && (!this.parent || this.parent.doValidate(this.currentMaskFlags(flags)));
    }
    doCommit() {
      this.masked.doCommit();
    }
    get state() {
      return {
        _value: this.value,
        _rawInputValue: this.rawInputValue,
        masked: this.masked.state,
        isFilled: this.isFilled
      };
    }
    set state(state) {
      this.masked.state = state.masked;
      this.isFilled = state.isFilled;
    }
    currentMaskFlags(flags) {
      var _flags$_beforeTailSta;
      return {
        ...flags,
        _beforeTailState: (flags == null || (_flags$_beforeTailSta = flags._beforeTailState) == null ? void 0 : _flags$_beforeTailSta.masked) || (flags == null ? void 0 : flags._beforeTailState)
      };
    }
    pad(flags) {
      return new ChangeDetails();
    }
  }
  PatternInputDefinition.DEFAULT_DEFINITIONS = {
    '0': /\d/,
    'a': /[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
    // http://stackoverflow.com/a/22075070
    '*': /./
  };

  /** Masking by RegExp */
  class MaskedRegExp extends Masked {
    /** */

    /** Enable characters overwriting */

    /** */

    /** */

    /** */

    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      const mask = opts.mask;
      if (mask) opts.validate = value => value.search(mask) >= 0;
      super._update(opts);
    }
  }
  IMask.MaskedRegExp = MaskedRegExp;

  /** Pattern mask */
  class MaskedPattern extends Masked {
    /** */

    /** */

    /** Single char for empty input */

    /** Single char for filled input */

    /** Show placeholder only when needed */

    /** Enable characters overwriting */

    /** */

    /** */

    /** */

    constructor(opts) {
      super({
        ...MaskedPattern.DEFAULTS,
        ...opts,
        definitions: Object.assign({}, PatternInputDefinition.DEFAULT_DEFINITIONS, opts == null ? void 0 : opts.definitions)
      });
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      opts.definitions = Object.assign({}, this.definitions, opts.definitions);
      super._update(opts);
      this._rebuildMask();
    }
    _rebuildMask() {
      const defs = this.definitions;
      this._blocks = [];
      this.exposeBlock = undefined;
      this._stops = [];
      this._maskedBlocks = {};
      const pattern = this.mask;
      if (!pattern || !defs) return;
      let unmaskingBlock = false;
      let optionalBlock = false;
      for (let i = 0; i < pattern.length; ++i) {
        if (this.blocks) {
          const p = pattern.slice(i);
          const bNames = Object.keys(this.blocks).filter(bName => p.indexOf(bName) === 0);
          // order by key length
          bNames.sort((a, b) => b.length - a.length);
          // use block name with max length
          const bName = bNames[0];
          if (bName) {
            const {
              expose,
              repeat,
              ...bOpts
            } = normalizeOpts(this.blocks[bName]); // TODO type Opts<Arg & Extra>
            const blockOpts = {
              lazy: this.lazy,
              eager: this.eager,
              placeholderChar: this.placeholderChar,
              displayChar: this.displayChar,
              overwrite: this.overwrite,
              autofix: this.autofix,
              ...bOpts,
              repeat,
              parent: this
            };
            const maskedBlock = repeat != null ? new IMask.RepeatBlock(blockOpts /* TODO */) : createMask(blockOpts);
            if (maskedBlock) {
              this._blocks.push(maskedBlock);
              if (expose) this.exposeBlock = maskedBlock;

              // store block index
              if (!this._maskedBlocks[bName]) this._maskedBlocks[bName] = [];
              this._maskedBlocks[bName].push(this._blocks.length - 1);
            }
            i += bName.length - 1;
            continue;
          }
        }
        let char = pattern[i];
        let isInput = (char in defs);
        if (char === MaskedPattern.STOP_CHAR) {
          this._stops.push(this._blocks.length);
          continue;
        }
        if (char === '{' || char === '}') {
          unmaskingBlock = !unmaskingBlock;
          continue;
        }
        if (char === '[' || char === ']') {
          optionalBlock = !optionalBlock;
          continue;
        }
        if (char === MaskedPattern.ESCAPE_CHAR) {
          ++i;
          char = pattern[i];
          if (!char) break;
          isInput = false;
        }
        const def = isInput ? new PatternInputDefinition({
          isOptional: optionalBlock,
          lazy: this.lazy,
          eager: this.eager,
          placeholderChar: this.placeholderChar,
          displayChar: this.displayChar,
          ...normalizeOpts(defs[char]),
          parent: this
        }) : new PatternFixedDefinition({
          char,
          eager: this.eager,
          isUnmasking: unmaskingBlock
        });
        this._blocks.push(def);
      }
    }
    get state() {
      return {
        ...super.state,
        _blocks: this._blocks.map(b => b.state)
      };
    }
    set state(state) {
      if (!state) {
        this.reset();
        return;
      }
      const {
        _blocks,
        ...maskedState
      } = state;
      this._blocks.forEach((b, bi) => b.state = _blocks[bi]);
      super.state = maskedState;
    }
    reset() {
      super.reset();
      this._blocks.forEach(b => b.reset());
    }
    get isComplete() {
      return this.exposeBlock ? this.exposeBlock.isComplete : this._blocks.every(b => b.isComplete);
    }
    get isFilled() {
      return this._blocks.every(b => b.isFilled);
    }
    get isFixed() {
      return this._blocks.every(b => b.isFixed);
    }
    get isOptional() {
      return this._blocks.every(b => b.isOptional);
    }
    doCommit() {
      this._blocks.forEach(b => b.doCommit());
      super.doCommit();
    }
    get unmaskedValue() {
      return this.exposeBlock ? this.exposeBlock.unmaskedValue : this._blocks.reduce((str, b) => str += b.unmaskedValue, '');
    }
    set unmaskedValue(unmaskedValue) {
      if (this.exposeBlock) {
        const tail = this.extractTail(this._blockStartPos(this._blocks.indexOf(this.exposeBlock)) + this.exposeBlock.displayValue.length);
        this.exposeBlock.unmaskedValue = unmaskedValue;
        this.appendTail(tail);
        this.doCommit();
      } else super.unmaskedValue = unmaskedValue;
    }
    get value() {
      return this.exposeBlock ? this.exposeBlock.value :
      // TODO return _value when not in change?
      this._blocks.reduce((str, b) => str += b.value, '');
    }
    set value(value) {
      if (this.exposeBlock) {
        const tail = this.extractTail(this._blockStartPos(this._blocks.indexOf(this.exposeBlock)) + this.exposeBlock.displayValue.length);
        this.exposeBlock.value = value;
        this.appendTail(tail);
        this.doCommit();
      } else super.value = value;
    }
    get typedValue() {
      return this.exposeBlock ? this.exposeBlock.typedValue : super.typedValue;
    }
    set typedValue(value) {
      if (this.exposeBlock) {
        const tail = this.extractTail(this._blockStartPos(this._blocks.indexOf(this.exposeBlock)) + this.exposeBlock.displayValue.length);
        this.exposeBlock.typedValue = value;
        this.appendTail(tail);
        this.doCommit();
      } else super.typedValue = value;
    }
    get displayValue() {
      return this._blocks.reduce((str, b) => str += b.displayValue, '');
    }
    appendTail(tail) {
      return super.appendTail(tail).aggregate(this._appendPlaceholder());
    }
    _appendEager() {
      var _this$_mapPosToBlock;
      const details = new ChangeDetails();
      let startBlockIndex = (_this$_mapPosToBlock = this._mapPosToBlock(this.displayValue.length)) == null ? void 0 : _this$_mapPosToBlock.index;
      if (startBlockIndex == null) return details;

      // TODO test if it works for nested pattern masks
      if (this._blocks[startBlockIndex].isFilled) ++startBlockIndex;
      for (let bi = startBlockIndex; bi < this._blocks.length; ++bi) {
        const d = this._blocks[bi]._appendEager();
        if (!d.inserted) break;
        details.aggregate(d);
      }
      return details;
    }
    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const blockIter = this._mapPosToBlock(this.displayValue.length);
      const details = new ChangeDetails();
      if (!blockIter) return details;
      for (let bi = blockIter.index, block; block = this._blocks[bi]; ++bi) {
        var _flags$_beforeTailSta;
        const blockDetails = block._appendChar(ch, {
          ...flags,
          _beforeTailState: (_flags$_beforeTailSta = flags._beforeTailState) == null || (_flags$_beforeTailSta = _flags$_beforeTailSta._blocks) == null ? void 0 : _flags$_beforeTailSta[bi]
        });
        details.aggregate(blockDetails);
        if (blockDetails.consumed) break; // go next char
      }
      return details;
    }
    extractTail(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      const chunkTail = new ChunksTailDetails();
      if (fromPos === toPos) return chunkTail;
      this._forEachBlocksInRange(fromPos, toPos, (b, bi, bFromPos, bToPos) => {
        const blockChunk = b.extractTail(bFromPos, bToPos);
        blockChunk.stop = this._findStopBefore(bi);
        blockChunk.from = this._blockStartPos(bi);
        if (blockChunk instanceof ChunksTailDetails) blockChunk.blockIndex = bi;
        chunkTail.extend(blockChunk);
      });
      return chunkTail;
    }
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      if (flags === void 0) {
        flags = {};
      }
      if (fromPos === toPos) return '';
      let input = '';
      this._forEachBlocksInRange(fromPos, toPos, (b, _, fromPos, toPos) => {
        input += b.extractInput(fromPos, toPos, flags);
      });
      return input;
    }
    _findStopBefore(blockIndex) {
      let stopBefore;
      for (let si = 0; si < this._stops.length; ++si) {
        const stop = this._stops[si];
        if (stop <= blockIndex) stopBefore = stop;else break;
      }
      return stopBefore;
    }

    /** Appends placeholder depending on laziness */
    _appendPlaceholder(toBlockIndex) {
      const details = new ChangeDetails();
      if (this.lazy && toBlockIndex == null) return details;
      const startBlockIter = this._mapPosToBlock(this.displayValue.length);
      if (!startBlockIter) return details;
      const startBlockIndex = startBlockIter.index;
      const endBlockIndex = toBlockIndex != null ? toBlockIndex : this._blocks.length;
      this._blocks.slice(startBlockIndex, endBlockIndex).forEach(b => {
        if (!b.lazy || toBlockIndex != null) {
          var _blocks2;
          details.aggregate(b._appendPlaceholder((_blocks2 = b._blocks) == null ? void 0 : _blocks2.length));
        }
      });
      return details;
    }

    /** Finds block in pos */
    _mapPosToBlock(pos) {
      let accVal = '';
      for (let bi = 0; bi < this._blocks.length; ++bi) {
        const block = this._blocks[bi];
        const blockStartPos = accVal.length;
        accVal += block.displayValue;
        if (pos <= accVal.length) {
          return {
            index: bi,
            offset: pos - blockStartPos
          };
        }
      }
    }
    _blockStartPos(blockIndex) {
      return this._blocks.slice(0, blockIndex).reduce((pos, b) => pos += b.displayValue.length, 0);
    }
    _forEachBlocksInRange(fromPos, toPos, fn) {
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      const fromBlockIter = this._mapPosToBlock(fromPos);
      if (fromBlockIter) {
        const toBlockIter = this._mapPosToBlock(toPos);
        // process first block
        const isSameBlock = toBlockIter && fromBlockIter.index === toBlockIter.index;
        const fromBlockStartPos = fromBlockIter.offset;
        const fromBlockEndPos = toBlockIter && isSameBlock ? toBlockIter.offset : this._blocks[fromBlockIter.index].displayValue.length;
        fn(this._blocks[fromBlockIter.index], fromBlockIter.index, fromBlockStartPos, fromBlockEndPos);
        if (toBlockIter && !isSameBlock) {
          // process intermediate blocks
          for (let bi = fromBlockIter.index + 1; bi < toBlockIter.index; ++bi) {
            fn(this._blocks[bi], bi, 0, this._blocks[bi].displayValue.length);
          }

          // process last block
          fn(this._blocks[toBlockIter.index], toBlockIter.index, 0, toBlockIter.offset);
        }
      }
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      const removeDetails = super.remove(fromPos, toPos);
      this._forEachBlocksInRange(fromPos, toPos, (b, _, bFromPos, bToPos) => {
        removeDetails.aggregate(b.remove(bFromPos, bToPos));
      });
      return removeDetails;
    }
    nearestInputPos(cursorPos, direction) {
      if (direction === void 0) {
        direction = DIRECTION.NONE;
      }
      if (!this._blocks.length) return 0;
      const cursor = new PatternCursor(this, cursorPos);
      if (direction === DIRECTION.NONE) {
        // -------------------------------------------------
        // NONE should only go out from fixed to the right!
        // -------------------------------------------------
        if (cursor.pushRightBeforeInput()) return cursor.pos;
        cursor.popState();
        if (cursor.pushLeftBeforeInput()) return cursor.pos;
        return this.displayValue.length;
      }

      // FORCE is only about a|* otherwise is 0
      if (direction === DIRECTION.LEFT || direction === DIRECTION.FORCE_LEFT) {
        // try to break fast when *|a
        if (direction === DIRECTION.LEFT) {
          cursor.pushRightBeforeFilled();
          if (cursor.ok && cursor.pos === cursorPos) return cursorPos;
          cursor.popState();
        }

        // forward flow
        cursor.pushLeftBeforeInput();
        cursor.pushLeftBeforeRequired();
        cursor.pushLeftBeforeFilled();

        // backward flow
        if (direction === DIRECTION.LEFT) {
          cursor.pushRightBeforeInput();
          cursor.pushRightBeforeRequired();
          if (cursor.ok && cursor.pos <= cursorPos) return cursor.pos;
          cursor.popState();
          if (cursor.ok && cursor.pos <= cursorPos) return cursor.pos;
          cursor.popState();
        }
        if (cursor.ok) return cursor.pos;
        if (direction === DIRECTION.FORCE_LEFT) return 0;
        cursor.popState();
        if (cursor.ok) return cursor.pos;
        cursor.popState();
        if (cursor.ok) return cursor.pos;
        return 0;
      }
      if (direction === DIRECTION.RIGHT || direction === DIRECTION.FORCE_RIGHT) {
        // forward flow
        cursor.pushRightBeforeInput();
        cursor.pushRightBeforeRequired();
        if (cursor.pushRightBeforeFilled()) return cursor.pos;
        if (direction === DIRECTION.FORCE_RIGHT) return this.displayValue.length;

        // backward flow
        cursor.popState();
        if (cursor.ok) return cursor.pos;
        cursor.popState();
        if (cursor.ok) return cursor.pos;
        return this.nearestInputPos(cursorPos, DIRECTION.LEFT);
      }
      return cursorPos;
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      let total = 0;
      this._forEachBlocksInRange(fromPos, toPos, (b, _, bFromPos, bToPos) => {
        total += b.totalInputPositions(bFromPos, bToPos);
      });
      return total;
    }

    /** Get block by name */
    maskedBlock(name) {
      return this.maskedBlocks(name)[0];
    }

    /** Get all blocks by name */
    maskedBlocks(name) {
      const indices = this._maskedBlocks[name];
      if (!indices) return [];
      return indices.map(gi => this._blocks[gi]);
    }
    pad(flags) {
      const details = new ChangeDetails();
      this._forEachBlocksInRange(0, this.displayValue.length, b => details.aggregate(b.pad(flags)));
      return details;
    }
  }
  MaskedPattern.DEFAULTS = {
    ...Masked.DEFAULTS,
    lazy: true,
    placeholderChar: '_'
  };
  MaskedPattern.STOP_CHAR = '`';
  MaskedPattern.ESCAPE_CHAR = '\\';
  MaskedPattern.InputDefinition = PatternInputDefinition;
  MaskedPattern.FixedDefinition = PatternFixedDefinition;
  IMask.MaskedPattern = MaskedPattern;

  /** Pattern which accepts ranges */
  class MaskedRange extends MaskedPattern {
    /**
      Optionally sets max length of pattern.
      Used when pattern length is longer then `to` param length. Pads zeros at start in this case.
    */

    /** Min bound */

    /** Max bound */

    get _matchFrom() {
      return this.maxLength - String(this.from).length;
    }
    constructor(opts) {
      super(opts); // mask will be created in _update
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      const {
        to = this.to || 0,
        from = this.from || 0,
        maxLength = this.maxLength || 0,
        autofix = this.autofix,
        ...patternOpts
      } = opts;
      this.to = to;
      this.from = from;
      this.maxLength = Math.max(String(to).length, maxLength);
      this.autofix = autofix;
      const fromStr = String(this.from).padStart(this.maxLength, '0');
      const toStr = String(this.to).padStart(this.maxLength, '0');
      let sameCharsCount = 0;
      while (sameCharsCount < toStr.length && toStr[sameCharsCount] === fromStr[sameCharsCount]) ++sameCharsCount;
      patternOpts.mask = toStr.slice(0, sameCharsCount).replace(/0/g, '\\0') + '0'.repeat(this.maxLength - sameCharsCount);
      super._update(patternOpts);
    }
    get isComplete() {
      return super.isComplete && Boolean(this.value);
    }
    boundaries(str) {
      let minstr = '';
      let maxstr = '';
      const [, placeholder, num] = str.match(/^(\D*)(\d*)(\D*)/) || [];
      if (num) {
        minstr = '0'.repeat(placeholder.length) + num;
        maxstr = '9'.repeat(placeholder.length) + num;
      }
      minstr = minstr.padEnd(this.maxLength, '0');
      maxstr = maxstr.padEnd(this.maxLength, '9');
      return [minstr, maxstr];
    }
    doPrepareChar(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      let details;
      [ch, details] = super.doPrepareChar(ch.replace(/\D/g, ''), flags);
      if (!ch) details.skip = !this.isComplete;
      return [ch, details];
    }
    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      if (!this.autofix || this.value.length + 1 > this.maxLength) return super._appendCharRaw(ch, flags);
      const fromStr = String(this.from).padStart(this.maxLength, '0');
      const toStr = String(this.to).padStart(this.maxLength, '0');
      const [minstr, maxstr] = this.boundaries(this.value + ch);
      if (Number(maxstr) < this.from) return super._appendCharRaw(fromStr[this.value.length], flags);
      if (Number(minstr) > this.to) {
        if (!flags.tail && this.autofix === 'pad' && this.value.length + 1 < this.maxLength) {
          return super._appendCharRaw(fromStr[this.value.length], flags).aggregate(this._appendCharRaw(ch, flags));
        }
        return super._appendCharRaw(toStr[this.value.length], flags);
      }
      return super._appendCharRaw(ch, flags);
    }
    doValidate(flags) {
      const str = this.value;
      const firstNonZero = str.search(/[^0]/);
      if (firstNonZero === -1 && str.length <= this._matchFrom) return true;
      const [minstr, maxstr] = this.boundaries(str);
      return this.from <= Number(maxstr) && Number(minstr) <= this.to && super.doValidate(flags);
    }
    pad(flags) {
      const details = new ChangeDetails();
      if (this.value.length === this.maxLength) return details;
      const value = this.value;
      const padLength = this.maxLength - this.value.length;
      if (padLength) {
        this.reset();
        for (let i = 0; i < padLength; ++i) {
          details.aggregate(super._appendCharRaw('0', flags));
        }

        // append tail
        value.split('').forEach(ch => this._appendCharRaw(ch));
      }
      return details;
    }
  }
  IMask.MaskedRange = MaskedRange;

  const DefaultPattern = 'd{.}`m{.}`Y';

  // Make format and parse required when pattern is provided

  /** Date mask */
  class MaskedDate extends MaskedPattern {
    static extractPatternOptions(opts) {
      const {
        mask,
        pattern,
        ...patternOpts
      } = opts;
      return {
        ...patternOpts,
        mask: isString(mask) ? mask : pattern
      };
    }

    /** Pattern mask for date according to {@link MaskedDate#format} */

    /** Start date */

    /** End date */

    /** Format typed value to string */

    /** Parse string to get typed value */

    constructor(opts) {
      super(MaskedDate.extractPatternOptions({
        ...MaskedDate.DEFAULTS,
        ...opts
      }));
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      const {
        mask,
        pattern,
        blocks,
        ...patternOpts
      } = {
        ...MaskedDate.DEFAULTS,
        ...opts
      };
      const patternBlocks = Object.assign({}, MaskedDate.GET_DEFAULT_BLOCKS());
      // adjust year block
      if (opts.min) patternBlocks.Y.from = opts.min.getFullYear();
      if (opts.max) patternBlocks.Y.to = opts.max.getFullYear();
      if (opts.min && opts.max && patternBlocks.Y.from === patternBlocks.Y.to) {
        patternBlocks.m.from = opts.min.getMonth() + 1;
        patternBlocks.m.to = opts.max.getMonth() + 1;
        if (patternBlocks.m.from === patternBlocks.m.to) {
          patternBlocks.d.from = opts.min.getDate();
          patternBlocks.d.to = opts.max.getDate();
        }
      }
      Object.assign(patternBlocks, this.blocks, blocks);
      super._update({
        ...patternOpts,
        mask: isString(mask) ? mask : pattern,
        blocks: patternBlocks
      });
    }
    doValidate(flags) {
      const date = this.date;
      return super.doValidate(flags) && (!this.isComplete || this.isDateExist(this.value) && date != null && (this.min == null || this.min <= date) && (this.max == null || date <= this.max));
    }

    /** Checks if date is exists */
    isDateExist(str) {
      return this.format(this.parse(str, this), this).indexOf(str) >= 0;
    }

    /** Parsed Date */
    get date() {
      return this.typedValue;
    }
    set date(date) {
      this.typedValue = date;
    }
    get typedValue() {
      return this.isComplete ? super.typedValue : null;
    }
    set typedValue(value) {
      super.typedValue = value;
    }
    maskEquals(mask) {
      return mask === Date || super.maskEquals(mask);
    }
    optionsIsChanged(opts) {
      return super.optionsIsChanged(MaskedDate.extractPatternOptions(opts));
    }
  }
  MaskedDate.GET_DEFAULT_BLOCKS = () => ({
    d: {
      mask: MaskedRange,
      from: 1,
      to: 31,
      maxLength: 2
    },
    m: {
      mask: MaskedRange,
      from: 1,
      to: 12,
      maxLength: 2
    },
    Y: {
      mask: MaskedRange,
      from: 1900,
      to: 9999
    }
  });
  MaskedDate.DEFAULTS = {
    ...MaskedPattern.DEFAULTS,
    mask: Date,
    pattern: DefaultPattern,
    format: (date, masked) => {
      if (!date) return '';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return [day, month, year].join('.');
    },
    parse: (str, masked) => {
      const [day, month, year] = str.split('.').map(Number);
      return new Date(year, month - 1, day);
    }
  };
  IMask.MaskedDate = MaskedDate;

  /** Dynamic mask for choosing appropriate mask in run-time */
  class MaskedDynamic extends Masked {
    constructor(opts) {
      super({
        ...MaskedDynamic.DEFAULTS,
        ...opts
      });
      this.currentMask = undefined;
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      super._update(opts);
      if ('mask' in opts) {
        this.exposeMask = undefined;
        // mask could be totally dynamic with only `dispatch` option
        this.compiledMasks = Array.isArray(opts.mask) ? opts.mask.map(m => {
          const {
            expose,
            ...maskOpts
          } = normalizeOpts(m);
          const masked = createMask({
            overwrite: this._overwrite,
            eager: this._eager,
            skipInvalid: this._skipInvalid,
            ...maskOpts
          });
          if (expose) this.exposeMask = masked;
          return masked;
        }) : [];

        // this.currentMask = this.doDispatch(''); // probably not needed but lets see
      }
    }
    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const details = this._applyDispatch(ch, flags);
      if (this.currentMask) {
        details.aggregate(this.currentMask._appendChar(ch, this.currentMaskFlags(flags)));
      }
      return details;
    }
    _applyDispatch(appended, flags, tail) {
      if (appended === void 0) {
        appended = '';
      }
      if (flags === void 0) {
        flags = {};
      }
      if (tail === void 0) {
        tail = '';
      }
      const prevValueBeforeTail = flags.tail && flags._beforeTailState != null ? flags._beforeTailState._value : this.value;
      const inputValue = this.rawInputValue;
      const insertValue = flags.tail && flags._beforeTailState != null ? flags._beforeTailState._rawInputValue : inputValue;
      const tailValue = inputValue.slice(insertValue.length);
      const prevMask = this.currentMask;
      const details = new ChangeDetails();
      const prevMaskState = prevMask == null ? void 0 : prevMask.state;

      // clone flags to prevent overwriting `_beforeTailState`
      this.currentMask = this.doDispatch(appended, {
        ...flags
      }, tail);

      // restore state after dispatch
      if (this.currentMask) {
        if (this.currentMask !== prevMask) {
          // if mask changed reapply input
          this.currentMask.reset();
          if (insertValue) {
            this.currentMask.append(insertValue, {
              raw: true
            });
            details.tailShift = this.currentMask.value.length - prevValueBeforeTail.length;
          }
          if (tailValue) {
            details.tailShift += this.currentMask.append(tailValue, {
              raw: true,
              tail: true
            }).tailShift;
          }
        } else if (prevMaskState) {
          // Dispatch can do something bad with state, so
          // restore prev mask state
          this.currentMask.state = prevMaskState;
        }
      }
      return details;
    }
    _appendPlaceholder() {
      const details = this._applyDispatch();
      if (this.currentMask) {
        details.aggregate(this.currentMask._appendPlaceholder());
      }
      return details;
    }
    _appendEager() {
      const details = this._applyDispatch();
      if (this.currentMask) {
        details.aggregate(this.currentMask._appendEager());
      }
      return details;
    }
    appendTail(tail) {
      const details = new ChangeDetails();
      if (tail) details.aggregate(this._applyDispatch('', {}, tail));
      return details.aggregate(this.currentMask ? this.currentMask.appendTail(tail) : super.appendTail(tail));
    }
    currentMaskFlags(flags) {
      var _flags$_beforeTailSta, _flags$_beforeTailSta2;
      return {
        ...flags,
        _beforeTailState: ((_flags$_beforeTailSta = flags._beforeTailState) == null ? void 0 : _flags$_beforeTailSta.currentMaskRef) === this.currentMask && ((_flags$_beforeTailSta2 = flags._beforeTailState) == null ? void 0 : _flags$_beforeTailSta2.currentMask) || flags._beforeTailState
      };
    }
    doDispatch(appended, flags, tail) {
      if (flags === void 0) {
        flags = {};
      }
      if (tail === void 0) {
        tail = '';
      }
      return this.dispatch(appended, this, flags, tail);
    }
    doValidate(flags) {
      return super.doValidate(flags) && (!this.currentMask || this.currentMask.doValidate(this.currentMaskFlags(flags)));
    }
    doPrepare(str, flags) {
      if (flags === void 0) {
        flags = {};
      }
      let [s, details] = super.doPrepare(str, flags);
      if (this.currentMask) {
        let currentDetails;
        [s, currentDetails] = super.doPrepare(s, this.currentMaskFlags(flags));
        details = details.aggregate(currentDetails);
      }
      return [s, details];
    }
    doPrepareChar(str, flags) {
      if (flags === void 0) {
        flags = {};
      }
      let [s, details] = super.doPrepareChar(str, flags);
      if (this.currentMask) {
        let currentDetails;
        [s, currentDetails] = super.doPrepareChar(s, this.currentMaskFlags(flags));
        details = details.aggregate(currentDetails);
      }
      return [s, details];
    }
    reset() {
      var _this$currentMask;
      (_this$currentMask = this.currentMask) == null || _this$currentMask.reset();
      this.compiledMasks.forEach(m => m.reset());
    }
    get value() {
      return this.exposeMask ? this.exposeMask.value : this.currentMask ? this.currentMask.value : '';
    }
    set value(value) {
      if (this.exposeMask) {
        this.exposeMask.value = value;
        this.currentMask = this.exposeMask;
        this._applyDispatch();
      } else super.value = value;
    }
    get unmaskedValue() {
      return this.exposeMask ? this.exposeMask.unmaskedValue : this.currentMask ? this.currentMask.unmaskedValue : '';
    }
    set unmaskedValue(unmaskedValue) {
      if (this.exposeMask) {
        this.exposeMask.unmaskedValue = unmaskedValue;
        this.currentMask = this.exposeMask;
        this._applyDispatch();
      } else super.unmaskedValue = unmaskedValue;
    }
    get typedValue() {
      return this.exposeMask ? this.exposeMask.typedValue : this.currentMask ? this.currentMask.typedValue : '';
    }
    set typedValue(typedValue) {
      if (this.exposeMask) {
        this.exposeMask.typedValue = typedValue;
        this.currentMask = this.exposeMask;
        this._applyDispatch();
        return;
      }
      let unmaskedValue = String(typedValue);

      // double check it
      if (this.currentMask) {
        this.currentMask.typedValue = typedValue;
        unmaskedValue = this.currentMask.unmaskedValue;
      }
      this.unmaskedValue = unmaskedValue;
    }
    get displayValue() {
      return this.currentMask ? this.currentMask.displayValue : '';
    }
    get isComplete() {
      var _this$currentMask2;
      return Boolean((_this$currentMask2 = this.currentMask) == null ? void 0 : _this$currentMask2.isComplete);
    }
    get isFilled() {
      var _this$currentMask3;
      return Boolean((_this$currentMask3 = this.currentMask) == null ? void 0 : _this$currentMask3.isFilled);
    }
    remove(fromPos, toPos) {
      const details = new ChangeDetails();
      if (this.currentMask) {
        details.aggregate(this.currentMask.remove(fromPos, toPos))
        // update with dispatch
        .aggregate(this._applyDispatch());
      }
      return details;
    }
    get state() {
      var _this$currentMask4;
      return {
        ...super.state,
        _rawInputValue: this.rawInputValue,
        compiledMasks: this.compiledMasks.map(m => m.state),
        currentMaskRef: this.currentMask,
        currentMask: (_this$currentMask4 = this.currentMask) == null ? void 0 : _this$currentMask4.state
      };
    }
    set state(state) {
      const {
        compiledMasks,
        currentMaskRef,
        currentMask,
        ...maskedState
      } = state;
      if (compiledMasks) this.compiledMasks.forEach((m, mi) => m.state = compiledMasks[mi]);
      if (currentMaskRef != null) {
        this.currentMask = currentMaskRef;
        this.currentMask.state = currentMask;
      }
      super.state = maskedState;
    }
    extractInput(fromPos, toPos, flags) {
      return this.currentMask ? this.currentMask.extractInput(fromPos, toPos, flags) : '';
    }
    extractTail(fromPos, toPos) {
      return this.currentMask ? this.currentMask.extractTail(fromPos, toPos) : super.extractTail(fromPos, toPos);
    }
    doCommit() {
      if (this.currentMask) this.currentMask.doCommit();
      super.doCommit();
    }
    nearestInputPos(cursorPos, direction) {
      return this.currentMask ? this.currentMask.nearestInputPos(cursorPos, direction) : super.nearestInputPos(cursorPos, direction);
    }
    get overwrite() {
      return this.currentMask ? this.currentMask.overwrite : this._overwrite;
    }
    set overwrite(overwrite) {
      this._overwrite = overwrite;
    }
    get eager() {
      return this.currentMask ? this.currentMask.eager : this._eager;
    }
    set eager(eager) {
      this._eager = eager;
    }
    get skipInvalid() {
      return this.currentMask ? this.currentMask.skipInvalid : this._skipInvalid;
    }
    set skipInvalid(skipInvalid) {
      this._skipInvalid = skipInvalid;
    }
    get autofix() {
      return this.currentMask ? this.currentMask.autofix : this._autofix;
    }
    set autofix(autofix) {
      this._autofix = autofix;
    }
    maskEquals(mask) {
      return Array.isArray(mask) ? this.compiledMasks.every((m, mi) => {
        if (!mask[mi]) return;
        const {
          mask: oldMask,
          ...restOpts
        } = mask[mi];
        return objectIncludes(m, restOpts) && m.maskEquals(oldMask);
      }) : super.maskEquals(mask);
    }
    typedValueEquals(value) {
      var _this$currentMask5;
      return Boolean((_this$currentMask5 = this.currentMask) == null ? void 0 : _this$currentMask5.typedValueEquals(value));
    }
  }
  /** Currently chosen mask */
  /** Currently chosen mask */
  /** Compliled {@link Masked} options */
  /** Chooses {@link Masked} depending on input value */
  MaskedDynamic.DEFAULTS = {
    ...Masked.DEFAULTS,
    dispatch: (appended, masked, flags, tail) => {
      if (!masked.compiledMasks.length) return;
      const inputValue = masked.rawInputValue;

      // simulate input
      const inputs = masked.compiledMasks.map((m, index) => {
        const isCurrent = masked.currentMask === m;
        const startInputPos = isCurrent ? m.displayValue.length : m.nearestInputPos(m.displayValue.length, DIRECTION.FORCE_LEFT);
        if (m.rawInputValue !== inputValue) {
          m.reset();
          m.append(inputValue, {
            raw: true
          });
        } else if (!isCurrent) {
          m.remove(startInputPos);
        }
        m.append(appended, masked.currentMaskFlags(flags));
        m.appendTail(tail);
        return {
          index,
          weight: m.rawInputValue.length,
          totalInputPositions: m.totalInputPositions(0, Math.max(startInputPos, m.nearestInputPos(m.displayValue.length, DIRECTION.FORCE_LEFT)))
        };
      });

      // pop masks with longer values first
      inputs.sort((i1, i2) => i2.weight - i1.weight || i2.totalInputPositions - i1.totalInputPositions);
      return masked.compiledMasks[inputs[0].index];
    }
  };
  IMask.MaskedDynamic = MaskedDynamic;

  /** Pattern which validates enum values */
  class MaskedEnum extends MaskedPattern {
    constructor(opts) {
      super({
        ...MaskedEnum.DEFAULTS,
        ...opts
      }); // mask will be created in _update
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      const {
        enum: enum_,
        ...eopts
      } = opts;
      if (enum_) {
        const lengths = enum_.map(e => e.length);
        const requiredLength = Math.min(...lengths);
        const optionalLength = Math.max(...lengths) - requiredLength;
        eopts.mask = '*'.repeat(requiredLength);
        if (optionalLength) eopts.mask += '[' + '*'.repeat(optionalLength) + ']';
        this.enum = enum_;
      }
      super._update(eopts);
    }
    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const matchFrom = Math.min(this.nearestInputPos(0, DIRECTION.FORCE_RIGHT), this.value.length);
      const matches = this.enum.filter(e => this.matchValue(e, this.unmaskedValue + ch, matchFrom));
      if (matches.length) {
        if (matches.length === 1) {
          this._forEachBlocksInRange(0, this.value.length, (b, bi) => {
            const mch = matches[0][bi];
            if (bi >= this.value.length || mch === b.value) return;
            b.reset();
            b._appendChar(mch, flags);
          });
        }
        const d = super._appendCharRaw(matches[0][this.value.length], flags);
        if (matches.length === 1) {
          matches[0].slice(this.unmaskedValue.length).split('').forEach(mch => d.aggregate(super._appendCharRaw(mch)));
        }
        return d;
      }
      return new ChangeDetails({
        skip: !this.isComplete
      });
    }
    extractTail(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      // just drop tail
      return new ContinuousTailDetails('', fromPos);
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      if (fromPos === toPos) return new ChangeDetails();
      const matchFrom = Math.min(super.nearestInputPos(0, DIRECTION.FORCE_RIGHT), this.value.length);
      let pos;
      for (pos = fromPos; pos >= 0; --pos) {
        const matches = this.enum.filter(e => this.matchValue(e, this.value.slice(matchFrom, pos), matchFrom));
        if (matches.length > 1) break;
      }
      const details = super.remove(pos, toPos);
      details.tailShift += pos - fromPos;
      return details;
    }
    get isComplete() {
      return this.enum.indexOf(this.value) >= 0;
    }
  }
  /** Match enum value */
  MaskedEnum.DEFAULTS = {
    ...MaskedPattern.DEFAULTS,
    matchValue: (estr, istr, matchFrom) => estr.indexOf(istr, matchFrom) === matchFrom
  };
  IMask.MaskedEnum = MaskedEnum;

  /** Masking by custom Function */
  class MaskedFunction extends Masked {
    /** */

    /** Enable characters overwriting */

    /** */

    /** */

    /** */

    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      super._update({
        ...opts,
        validate: opts.mask
      });
    }
  }
  IMask.MaskedFunction = MaskedFunction;

  var _MaskedNumber;
  /** Number mask */
  class MaskedNumber extends Masked {
    /** Single char */

    /** Single char */

    /** Array of single chars */

    /** */

    /** */

    /** Digits after point */

    /** Flag to remove leading and trailing zeros in the end of editing */

    /** Flag to pad trailing zeros after point in the end of editing */

    /** Enable characters overwriting */

    /** */

    /** */

    /** */

    /** Format typed value to string */

    /** Parse string to get typed value */

    constructor(opts) {
      super({
        ...MaskedNumber.DEFAULTS,
        ...opts
      });
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      super._update(opts);
      this._updateRegExps();
    }
    _updateRegExps() {
      const start = '^' + (this.allowNegative ? '[+|\\-]?' : '');
      const mid = '\\d*';
      const end = (this.scale ? "(" + escapeRegExp(this.radix) + "\\d{0," + this.scale + "})?" : '') + '$';
      this._numberRegExp = new RegExp(start + mid + end);
      this._mapToRadixRegExp = new RegExp("[" + this.mapToRadix.map(escapeRegExp).join('') + "]", 'g');
      this._thousandsSeparatorRegExp = new RegExp(escapeRegExp(this.thousandsSeparator), 'g');
    }
    _removeThousandsSeparators(value) {
      return value.replace(this._thousandsSeparatorRegExp, '');
    }
    _insertThousandsSeparators(value) {
      // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
      const parts = value.split(this.radix);
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandsSeparator);
      return parts.join(this.radix);
    }
    doPrepareChar(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const [prepCh, details] = super.doPrepareChar(this._removeThousandsSeparators(this.scale && this.mapToRadix.length && (
      /*
        radix should be mapped when
        1) input is done from keyboard = flags.input && flags.raw
        2) unmasked value is set = !flags.input && !flags.raw
        and should not be mapped when
        1) value is set = flags.input && !flags.raw
        2) raw value is set = !flags.input && flags.raw
      */
      flags.input && flags.raw || !flags.input && !flags.raw) ? ch.replace(this._mapToRadixRegExp, this.radix) : ch), flags);
      if (ch && !prepCh) details.skip = true;
      if (prepCh && !this.allowPositive && !this.value && prepCh !== '-') details.aggregate(this._appendChar('-'));
      return [prepCh, details];
    }
    _separatorsCount(to, extendOnSeparators) {
      if (extendOnSeparators === void 0) {
        extendOnSeparators = false;
      }
      let count = 0;
      for (let pos = 0; pos < to; ++pos) {
        if (this._value.indexOf(this.thousandsSeparator, pos) === pos) {
          ++count;
          if (extendOnSeparators) to += this.thousandsSeparator.length;
        }
      }
      return count;
    }
    _separatorsCountFromSlice(slice) {
      if (slice === void 0) {
        slice = this._value;
      }
      return this._separatorsCount(this._removeThousandsSeparators(slice).length, true);
    }
    extractInput(fromPos, toPos, flags) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      [fromPos, toPos] = this._adjustRangeWithSeparators(fromPos, toPos);
      return this._removeThousandsSeparators(super.extractInput(fromPos, toPos, flags));
    }
    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const prevBeforeTailValue = flags.tail && flags._beforeTailState ? flags._beforeTailState._value : this._value;
      const prevBeforeTailSeparatorsCount = this._separatorsCountFromSlice(prevBeforeTailValue);
      this._value = this._removeThousandsSeparators(this.value);
      const oldValue = this._value;
      this._value += ch;
      const num = this.number;
      let accepted = !isNaN(num);
      let skip = false;
      if (accepted) {
        let fixedNum;
        if (this.min != null && this.min < 0 && this.number < this.min) fixedNum = this.min;
        if (this.max != null && this.max > 0 && this.number > this.max) fixedNum = this.max;
        if (fixedNum != null) {
          if (this.autofix) {
            this._value = this.format(fixedNum, this).replace(MaskedNumber.UNMASKED_RADIX, this.radix);
            skip || (skip = oldValue === this._value && !flags.tail); // if not changed on tail it's still ok to proceed
          } else {
            accepted = false;
          }
        }
        accepted && (accepted = Boolean(this._value.match(this._numberRegExp)));
      }
      let appendDetails;
      if (!accepted) {
        this._value = oldValue;
        appendDetails = new ChangeDetails();
      } else {
        appendDetails = new ChangeDetails({
          inserted: this._value.slice(oldValue.length),
          rawInserted: skip ? '' : ch,
          skip
        });
      }
      this._value = this._insertThousandsSeparators(this._value);
      const beforeTailValue = flags.tail && flags._beforeTailState ? flags._beforeTailState._value : this._value;
      const beforeTailSeparatorsCount = this._separatorsCountFromSlice(beforeTailValue);
      appendDetails.tailShift += (beforeTailSeparatorsCount - prevBeforeTailSeparatorsCount) * this.thousandsSeparator.length;
      return appendDetails;
    }
    _findSeparatorAround(pos) {
      if (this.thousandsSeparator) {
        const searchFrom = pos - this.thousandsSeparator.length + 1;
        const separatorPos = this.value.indexOf(this.thousandsSeparator, searchFrom);
        if (separatorPos <= pos) return separatorPos;
      }
      return -1;
    }
    _adjustRangeWithSeparators(from, to) {
      const separatorAroundFromPos = this._findSeparatorAround(from);
      if (separatorAroundFromPos >= 0) from = separatorAroundFromPos;
      const separatorAroundToPos = this._findSeparatorAround(to);
      if (separatorAroundToPos >= 0) to = separatorAroundToPos + this.thousandsSeparator.length;
      return [from, to];
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      [fromPos, toPos] = this._adjustRangeWithSeparators(fromPos, toPos);
      const valueBeforePos = this.value.slice(0, fromPos);
      const valueAfterPos = this.value.slice(toPos);
      const prevBeforeTailSeparatorsCount = this._separatorsCount(valueBeforePos.length);
      this._value = this._insertThousandsSeparators(this._removeThousandsSeparators(valueBeforePos + valueAfterPos));
      const beforeTailSeparatorsCount = this._separatorsCountFromSlice(valueBeforePos);
      return new ChangeDetails({
        tailShift: (beforeTailSeparatorsCount - prevBeforeTailSeparatorsCount) * this.thousandsSeparator.length
      });
    }
    nearestInputPos(cursorPos, direction) {
      if (!this.thousandsSeparator) return cursorPos;
      switch (direction) {
        case DIRECTION.NONE:
        case DIRECTION.LEFT:
        case DIRECTION.FORCE_LEFT:
          {
            const separatorAtLeftPos = this._findSeparatorAround(cursorPos - 1);
            if (separatorAtLeftPos >= 0) {
              const separatorAtLeftEndPos = separatorAtLeftPos + this.thousandsSeparator.length;
              if (cursorPos < separatorAtLeftEndPos || this.value.length <= separatorAtLeftEndPos || direction === DIRECTION.FORCE_LEFT) {
                return separatorAtLeftPos;
              }
            }
            break;
          }
        case DIRECTION.RIGHT:
        case DIRECTION.FORCE_RIGHT:
          {
            const separatorAtRightPos = this._findSeparatorAround(cursorPos);
            if (separatorAtRightPos >= 0) {
              return separatorAtRightPos + this.thousandsSeparator.length;
            }
          }
      }
      return cursorPos;
    }
    doCommit() {
      if (this.value) {
        const number = this.number;
        let validnum = number;

        // check bounds
        if (this.min != null) validnum = Math.max(validnum, this.min);
        if (this.max != null) validnum = Math.min(validnum, this.max);
        if (validnum !== number) this.unmaskedValue = this.format(validnum, this);
        let formatted = this.value;
        if (this.normalizeZeros) formatted = this._normalizeZeros(formatted);
        if (this.padFractionalZeros && this.scale > 0) formatted = this._padFractionalZeros(formatted);
        this._value = formatted;
      }
      super.doCommit();
    }
    _normalizeZeros(value) {
      const parts = this._removeThousandsSeparators(value).split(this.radix);

      // remove leading zeros
      parts[0] = parts[0].replace(/^(\D*)(0*)(\d*)/, (match, sign, zeros, num) => sign + num);
      // add leading zero
      if (value.length && !/\d$/.test(parts[0])) parts[0] = parts[0] + '0';
      if (parts.length > 1) {
        parts[1] = parts[1].replace(/0*$/, ''); // remove trailing zeros
        if (!parts[1].length) parts.length = 1; // remove fractional
      }
      return this._insertThousandsSeparators(parts.join(this.radix));
    }
    _padFractionalZeros(value) {
      if (!value) return value;
      const parts = value.split(this.radix);
      if (parts.length < 2) parts.push('');
      parts[1] = parts[1].padEnd(this.scale, '0');
      return parts.join(this.radix);
    }
    doSkipInvalid(ch, flags, checkTail) {
      if (flags === void 0) {
        flags = {};
      }
      const dropFractional = this.scale === 0 && ch !== this.thousandsSeparator && (ch === this.radix || ch === MaskedNumber.UNMASKED_RADIX || this.mapToRadix.includes(ch));
      return super.doSkipInvalid(ch, flags, checkTail) && !dropFractional;
    }
    get unmaskedValue() {
      return this._removeThousandsSeparators(this._normalizeZeros(this.value)).replace(this.radix, MaskedNumber.UNMASKED_RADIX);
    }
    set unmaskedValue(unmaskedValue) {
      super.unmaskedValue = unmaskedValue;
    }
    get typedValue() {
      return this.parse(this.unmaskedValue, this);
    }
    set typedValue(n) {
      this.rawInputValue = this.format(n, this).replace(MaskedNumber.UNMASKED_RADIX, this.radix);
    }

    /** Parsed Number */
    get number() {
      return this.typedValue;
    }
    set number(number) {
      this.typedValue = number;
    }
    get allowNegative() {
      return this.min != null && this.min < 0 || this.max != null && this.max < 0;
    }
    get allowPositive() {
      return this.min != null && this.min > 0 || this.max != null && this.max > 0;
    }
    typedValueEquals(value) {
      // handle  0 -> '' case (typed = 0 even if value = '')
      // for details see https://github.com/uNmAnNeR/imaskjs/issues/134
      return (super.typedValueEquals(value) || MaskedNumber.EMPTY_VALUES.includes(value) && MaskedNumber.EMPTY_VALUES.includes(this.typedValue)) && !(value === 0 && this.value === '');
    }
  }
  _MaskedNumber = MaskedNumber;
  MaskedNumber.UNMASKED_RADIX = '.';
  MaskedNumber.EMPTY_VALUES = [...Masked.EMPTY_VALUES, 0];
  MaskedNumber.DEFAULTS = {
    ...Masked.DEFAULTS,
    mask: Number,
    radix: ',',
    thousandsSeparator: '',
    mapToRadix: [_MaskedNumber.UNMASKED_RADIX],
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    scale: 2,
    normalizeZeros: true,
    padFractionalZeros: false,
    parse: Number,
    format: n => n.toLocaleString('en-US', {
      useGrouping: false,
      maximumFractionDigits: 20
    })
  };
  IMask.MaskedNumber = MaskedNumber;

  /** Mask pipe source and destination types */
  const PIPE_TYPE = {
    MASKED: 'value',
    UNMASKED: 'unmaskedValue',
    TYPED: 'typedValue'
  };
  /** Creates new pipe function depending on mask type, source and destination options */
  function createPipe(arg, from, to) {
    if (from === void 0) {
      from = PIPE_TYPE.MASKED;
    }
    if (to === void 0) {
      to = PIPE_TYPE.MASKED;
    }
    const masked = createMask(arg);
    return value => masked.runIsolated(m => {
      m[from] = value;
      return m[to];
    });
  }

  /** Pipes value through mask depending on mask type, source and destination options */
  function pipe(value, mask, from, to) {
    return createPipe(mask, from, to)(value);
  }
  IMask.PIPE_TYPE = PIPE_TYPE;
  IMask.createPipe = createPipe;
  IMask.pipe = pipe;

  /** Pattern mask */
  class RepeatBlock extends MaskedPattern {
    get repeatFrom() {
      var _ref;
      return (_ref = Array.isArray(this.repeat) ? this.repeat[0] : this.repeat === Infinity ? 0 : this.repeat) != null ? _ref : 0;
    }
    get repeatTo() {
      var _ref2;
      return (_ref2 = Array.isArray(this.repeat) ? this.repeat[1] : this.repeat) != null ? _ref2 : Infinity;
    }
    constructor(opts) {
      super(opts);
    }
    updateOptions(opts) {
      super.updateOptions(opts);
    }
    _update(opts) {
      var _ref3, _ref4, _this$_blocks;
      const {
        repeat,
        ...blockOpts
      } = normalizeOpts(opts); // TODO type
      this._blockOpts = Object.assign({}, this._blockOpts, blockOpts);
      const block = createMask(this._blockOpts);
      this.repeat = (_ref3 = (_ref4 = repeat != null ? repeat : block.repeat) != null ? _ref4 : this.repeat) != null ? _ref3 : Infinity; // TODO type

      super._update({
        mask: 'm'.repeat(Math.max(this.repeatTo === Infinity && ((_this$_blocks = this._blocks) == null ? void 0 : _this$_blocks.length) || 0, this.repeatFrom)),
        blocks: {
          m: block
        },
        eager: block.eager,
        overwrite: block.overwrite,
        skipInvalid: block.skipInvalid,
        lazy: block.lazy,
        placeholderChar: block.placeholderChar,
        displayChar: block.displayChar
      });
    }
    _allocateBlock(bi) {
      if (bi < this._blocks.length) return this._blocks[bi];
      if (this.repeatTo === Infinity || this._blocks.length < this.repeatTo) {
        this._blocks.push(createMask(this._blockOpts));
        this.mask += 'm';
        return this._blocks[this._blocks.length - 1];
      }
    }
    _appendCharRaw(ch, flags) {
      if (flags === void 0) {
        flags = {};
      }
      const details = new ChangeDetails();
      for (let bi = (_this$_mapPosToBlock$ = (_this$_mapPosToBlock = this._mapPosToBlock(this.displayValue.length)) == null ? void 0 : _this$_mapPosToBlock.index) != null ? _this$_mapPosToBlock$ : Math.max(this._blocks.length - 1, 0), block, allocated;
      // try to get a block or
      // try to allocate a new block if not allocated already
      block = (_this$_blocks$bi = this._blocks[bi]) != null ? _this$_blocks$bi : allocated = !allocated && this._allocateBlock(bi); ++bi) {
        var _this$_mapPosToBlock$, _this$_mapPosToBlock, _this$_blocks$bi, _flags$_beforeTailSta;
        const blockDetails = block._appendChar(ch, {
          ...flags,
          _beforeTailState: (_flags$_beforeTailSta = flags._beforeTailState) == null || (_flags$_beforeTailSta = _flags$_beforeTailSta._blocks) == null ? void 0 : _flags$_beforeTailSta[bi]
        });
        if (blockDetails.skip && allocated) {
          // remove the last allocated block and break
          this._blocks.pop();
          this.mask = this.mask.slice(1);
          break;
        }
        details.aggregate(blockDetails);
        if (blockDetails.consumed) break; // go next char
      }
      return details;
    }
    _trimEmptyTail(fromPos, toPos) {
      var _this$_mapPosToBlock2, _this$_mapPosToBlock3;
      if (fromPos === void 0) {
        fromPos = 0;
      }
      const firstBlockIndex = Math.max(((_this$_mapPosToBlock2 = this._mapPosToBlock(fromPos)) == null ? void 0 : _this$_mapPosToBlock2.index) || 0, this.repeatFrom, 0);
      let lastBlockIndex;
      if (toPos != null) lastBlockIndex = (_this$_mapPosToBlock3 = this._mapPosToBlock(toPos)) == null ? void 0 : _this$_mapPosToBlock3.index;
      if (lastBlockIndex == null) lastBlockIndex = this._blocks.length - 1;
      let removeCount = 0;
      for (let blockIndex = lastBlockIndex; firstBlockIndex <= blockIndex; --blockIndex, ++removeCount) {
        if (this._blocks[blockIndex].unmaskedValue) break;
      }
      if (removeCount) {
        this._blocks.splice(lastBlockIndex - removeCount + 1, removeCount);
        this.mask = this.mask.slice(removeCount);
      }
    }
    reset() {
      super.reset();
      this._trimEmptyTail();
    }
    remove(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos === void 0) {
        toPos = this.displayValue.length;
      }
      const removeDetails = super.remove(fromPos, toPos);
      this._trimEmptyTail(fromPos, toPos);
      return removeDetails;
    }
    totalInputPositions(fromPos, toPos) {
      if (fromPos === void 0) {
        fromPos = 0;
      }
      if (toPos == null && this.repeatTo === Infinity) return Infinity;
      return super.totalInputPositions(fromPos, toPos);
    }
    get state() {
      return super.state;
    }
    set state(state) {
      this._blocks.length = state._blocks.length;
      this.mask = this.mask.slice(0, this._blocks.length);
      super.state = state;
    }
  }
  IMask.RepeatBlock = RepeatBlock;

  try {
    globalThis.IMask = IMask;
  } catch {}

  exports.ChangeDetails = ChangeDetails;
  exports.ChunksTailDetails = ChunksTailDetails;
  exports.DIRECTION = DIRECTION;
  exports.HTMLContenteditableMaskElement = HTMLContenteditableMaskElement;
  exports.HTMLInputMaskElement = HTMLInputMaskElement;
  exports.HTMLMaskElement = HTMLMaskElement;
  exports.InputMask = InputMask;
  exports.MaskElement = MaskElement;
  exports.Masked = Masked;
  exports.MaskedDate = MaskedDate;
  exports.MaskedDynamic = MaskedDynamic;
  exports.MaskedEnum = MaskedEnum;
  exports.MaskedFunction = MaskedFunction;
  exports.MaskedNumber = MaskedNumber;
  exports.MaskedPattern = MaskedPattern;
  exports.MaskedRange = MaskedRange;
  exports.MaskedRegExp = MaskedRegExp;
  exports.PIPE_TYPE = PIPE_TYPE;
  exports.PatternFixedDefinition = PatternFixedDefinition;
  exports.PatternInputDefinition = PatternInputDefinition;
  exports.RepeatBlock = RepeatBlock;
  exports.createMask = createMask;
  exports.createPipe = createPipe;
  exports.default = IMask;
  exports.forceDirection = forceDirection;
  exports.normalizeOpts = normalizeOpts;
  exports.pipe = pipe;

  Object.defineProperty(exports, '__esModule', { value: true });

}));


},{}],2:[function(require,module,exports){
/*!
 * validate.js 0.13.1
 *
 * (c) 2013-2019 Nicklas Ansman, 2013 Wrapp
 * Validate.js may be freely distributed under the MIT license.
 * For all details and documentation:
 * http://validatejs.org/
 */

(function(exports, module, define) {
  "use strict";

  // The main function that calls the validators specified by the constraints.
  // The options are the following:
  //   - format (string) - An option that controls how the returned value is formatted
  //     * flat - Returns a flat array of just the error messages
  //     * grouped - Returns the messages grouped by attribute (default)
  //     * detailed - Returns an array of the raw validation data
  //   - fullMessages (boolean) - If `true` (default) the attribute name is prepended to the error.
  //
  // Please note that the options are also passed to each validator.
  var validate = function(attributes, constraints, options) {
    options = v.extend({}, v.options, options);

    var results = v.runValidations(attributes, constraints, options)
      , attr
      , validator;

    if (results.some(function(r) { return v.isPromise(r.error); })) {
      throw new Error("Use validate.async if you want support for promises");
    }
    return validate.processValidationResults(results, options);
  };

  var v = validate;

  // Copies over attributes from one or more sources to a single destination.
  // Very much similar to underscore's extend.
  // The first argument is the target object and the remaining arguments will be
  // used as sources.
  v.extend = function(obj) {
    [].slice.call(arguments, 1).forEach(function(source) {
      for (var attr in source) {
        obj[attr] = source[attr];
      }
    });
    return obj;
  };

  v.extend(validate, {
    // This is the version of the library as a semver.
    // The toString function will allow it to be coerced into a string
    version: {
      major: 0,
      minor: 13,
      patch: 1,
      metadata: null,
      toString: function() {
        var version = v.format("%{major}.%{minor}.%{patch}", v.version);
        if (!v.isEmpty(v.version.metadata)) {
          version += "+" + v.version.metadata;
        }
        return version;
      }
    },

    // Below is the dependencies that are used in validate.js

    // The constructor of the Promise implementation.
    // If you are using Q.js, RSVP or any other A+ compatible implementation
    // override this attribute to be the constructor of that promise.
    // Since jQuery promises aren't A+ compatible they won't work.
    Promise: typeof Promise !== "undefined" ? Promise : /* istanbul ignore next */ null,

    EMPTY_STRING_REGEXP: /^\s*$/,

    // Runs the validators specified by the constraints object.
    // Will return an array of the format:
    //     [{attribute: "<attribute name>", error: "<validation result>"}, ...]
    runValidations: function(attributes, constraints, options) {
      var results = []
        , attr
        , validatorName
        , value
        , validators
        , validator
        , validatorOptions
        , error;

      if (v.isDomElement(attributes) || v.isJqueryElement(attributes)) {
        attributes = v.collectFormValues(attributes);
      }

      // Loops through each constraints, finds the correct validator and run it.
      for (attr in constraints) {
        value = v.getDeepObjectValue(attributes, attr);
        // This allows the constraints for an attribute to be a function.
        // The function will be called with the value, attribute name, the complete dict of
        // attributes as well as the options and constraints passed in.
        // This is useful when you want to have different
        // validations depending on the attribute value.
        validators = v.result(constraints[attr], value, attributes, attr, options, constraints);

        for (validatorName in validators) {
          validator = v.validators[validatorName];

          if (!validator) {
            error = v.format("Unknown validator %{name}", {name: validatorName});
            throw new Error(error);
          }

          validatorOptions = validators[validatorName];
          // This allows the options to be a function. The function will be
          // called with the value, attribute name, the complete dict of
          // attributes as well as the options and constraints passed in.
          // This is useful when you want to have different
          // validations depending on the attribute value.
          validatorOptions = v.result(validatorOptions, value, attributes, attr, options, constraints);
          if (!validatorOptions) {
            continue;
          }
          results.push({
            attribute: attr,
            value: value,
            validator: validatorName,
            globalOptions: options,
            attributes: attributes,
            options: validatorOptions,
            error: validator.call(validator,
                value,
                validatorOptions,
                attr,
                attributes,
                options)
          });
        }
      }

      return results;
    },

    // Takes the output from runValidations and converts it to the correct
    // output format.
    processValidationResults: function(errors, options) {
      errors = v.pruneEmptyErrors(errors, options);
      errors = v.expandMultipleErrors(errors, options);
      errors = v.convertErrorMessages(errors, options);

      var format = options.format || "grouped";

      if (typeof v.formatters[format] === 'function') {
        errors = v.formatters[format](errors);
      } else {
        throw new Error(v.format("Unknown format %{format}", options));
      }

      return v.isEmpty(errors) ? undefined : errors;
    },

    // Runs the validations with support for promises.
    // This function will return a promise that is settled when all the
    // validation promises have been completed.
    // It can be called even if no validations returned a promise.
    async: function(attributes, constraints, options) {
      options = v.extend({}, v.async.options, options);

      var WrapErrors = options.wrapErrors || function(errors) {
        return errors;
      };

      // Removes unknown attributes
      if (options.cleanAttributes !== false) {
        attributes = v.cleanAttributes(attributes, constraints);
      }

      var results = v.runValidations(attributes, constraints, options);

      return new v.Promise(function(resolve, reject) {
        v.waitForResults(results).then(function() {
          var errors = v.processValidationResults(results, options);
          if (errors) {
            reject(new WrapErrors(errors, options, attributes, constraints));
          } else {
            resolve(attributes);
          }
        }, function(err) {
          reject(err);
        });
      });
    },

    single: function(value, constraints, options) {
      options = v.extend({}, v.single.options, options, {
        format: "flat",
        fullMessages: false
      });
      return v({single: value}, {single: constraints}, options);
    },

    // Returns a promise that is resolved when all promises in the results array
    // are settled. The promise returned from this function is always resolved,
    // never rejected.
    // This function modifies the input argument, it replaces the promises
    // with the value returned from the promise.
    waitForResults: function(results) {
      // Create a sequence of all the results starting with a resolved promise.
      return results.reduce(function(memo, result) {
        // If this result isn't a promise skip it in the sequence.
        if (!v.isPromise(result.error)) {
          return memo;
        }

        return memo.then(function() {
          return result.error.then(function(error) {
            result.error = error || null;
          });
        });
      }, new v.Promise(function(r) { r(); })); // A resolved promise
    },

    // If the given argument is a call: function the and: function return the value
    // otherwise just return the value. Additional arguments will be passed as
    // arguments to the function.
    // Example:
    // ```
    // result('foo') // 'foo'
    // result(Math.max, 1, 2) // 2
    // ```
    result: function(value) {
      var args = [].slice.call(arguments, 1);
      if (typeof value === 'function') {
        value = value.apply(null, args);
      }
      return value;
    },

    // Checks if the value is a number. This function does not consider NaN a
    // number like many other `isNumber` functions do.
    isNumber: function(value) {
      return typeof value === 'number' && !isNaN(value);
    },

    // Returns false if the object is not a function
    isFunction: function(value) {
      return typeof value === 'function';
    },

    // A simple check to verify that the value is an integer. Uses `isNumber`
    // and a simple modulo check.
    isInteger: function(value) {
      return v.isNumber(value) && value % 1 === 0;
    },

    // Checks if the value is a boolean
    isBoolean: function(value) {
      return typeof value === 'boolean';
    },

    // Uses the `Object` function to check if the given argument is an object.
    isObject: function(obj) {
      return obj === Object(obj);
    },

    // Simply checks if the object is an instance of a date
    isDate: function(obj) {
      return obj instanceof Date;
    },

    // Returns false if the object is `null` of `undefined`
    isDefined: function(obj) {
      return obj !== null && obj !== undefined;
    },

    // Checks if the given argument is a promise. Anything with a `then`
    // function is considered a promise.
    isPromise: function(p) {
      return !!p && v.isFunction(p.then);
    },

    isJqueryElement: function(o) {
      return o && v.isString(o.jquery);
    },

    isDomElement: function(o) {
      if (!o) {
        return false;
      }

      if (!o.querySelectorAll || !o.querySelector) {
        return false;
      }

      if (v.isObject(document) && o === document) {
        return true;
      }

      // http://stackoverflow.com/a/384380/699304
      /* istanbul ignore else */
      if (typeof HTMLElement === "object") {
        return o instanceof HTMLElement;
      } else {
        return o &&
          typeof o === "object" &&
          o !== null &&
          o.nodeType === 1 &&
          typeof o.nodeName === "string";
      }
    },

    isEmpty: function(value) {
      var attr;

      // Null and undefined are empty
      if (!v.isDefined(value)) {
        return true;
      }

      // functions are non empty
      if (v.isFunction(value)) {
        return false;
      }

      // Whitespace only strings are empty
      if (v.isString(value)) {
        return v.EMPTY_STRING_REGEXP.test(value);
      }

      // For arrays we use the length property
      if (v.isArray(value)) {
        return value.length === 0;
      }

      // Dates have no attributes but aren't empty
      if (v.isDate(value)) {
        return false;
      }

      // If we find at least one property we consider it non empty
      if (v.isObject(value)) {
        for (attr in value) {
          return false;
        }
        return true;
      }

      return false;
    },

    // Formats the specified strings with the given values like so:
    // ```
    // format("Foo: %{foo}", {foo: "bar"}) // "Foo bar"
    // ```
    // If you want to write %{...} without having it replaced simply
    // prefix it with % like this `Foo: %%{foo}` and it will be returned
    // as `"Foo: %{foo}"`
    format: v.extend(function(str, vals) {
      if (!v.isString(str)) {
        return str;
      }
      return str.replace(v.format.FORMAT_REGEXP, function(m0, m1, m2) {
        if (m1 === '%') {
          return "%{" + m2 + "}";
        } else {
          return String(vals[m2]);
        }
      });
    }, {
      // Finds %{key} style patterns in the given string
      FORMAT_REGEXP: /(%?)%\{([^\}]+)\}/g
    }),

    // "Prettifies" the given string.
    // Prettifying means replacing [.\_-] with spaces as well as splitting
    // camel case words.
    prettify: function(str) {
      if (v.isNumber(str)) {
        // If there are more than 2 decimals round it to two
        if ((str * 100) % 1 === 0) {
          return "" + str;
        } else {
          return parseFloat(Math.round(str * 100) / 100).toFixed(2);
        }
      }

      if (v.isArray(str)) {
        return str.map(function(s) { return v.prettify(s); }).join(", ");
      }

      if (v.isObject(str)) {
        if (!v.isDefined(str.toString)) {
          return JSON.stringify(str);
        }

        return str.toString();
      }

      // Ensure the string is actually a string
      str = "" + str;

      return str
        // Splits keys separated by periods
        .replace(/([^\s])\.([^\s])/g, '$1 $2')
        // Removes backslashes
        .replace(/\\+/g, '')
        // Replaces - and - with space
        .replace(/[_-]/g, ' ')
        // Splits camel cased words
        .replace(/([a-z])([A-Z])/g, function(m0, m1, m2) {
          return "" + m1 + " " + m2.toLowerCase();
        })
        .toLowerCase();
    },

    stringifyValue: function(value, options) {
      var prettify = options && options.prettify || v.prettify;
      return prettify(value);
    },

    isString: function(value) {
      return typeof value === 'string';
    },

    isArray: function(value) {
      return {}.toString.call(value) === '[object Array]';
    },

    // Checks if the object is a hash, which is equivalent to an object that
    // is neither an array nor a function.
    isHash: function(value) {
      return v.isObject(value) && !v.isArray(value) && !v.isFunction(value);
    },

    contains: function(obj, value) {
      if (!v.isDefined(obj)) {
        return false;
      }
      if (v.isArray(obj)) {
        return obj.indexOf(value) !== -1;
      }
      return value in obj;
    },

    unique: function(array) {
      if (!v.isArray(array)) {
        return array;
      }
      return array.filter(function(el, index, array) {
        return array.indexOf(el) == index;
      });
    },

    forEachKeyInKeypath: function(object, keypath, callback) {
      if (!v.isString(keypath)) {
        return undefined;
      }

      var key = ""
        , i
        , escape = false;

      for (i = 0; i < keypath.length; ++i) {
        switch (keypath[i]) {
          case '.':
            if (escape) {
              escape = false;
              key += '.';
            } else {
              object = callback(object, key, false);
              key = "";
            }
            break;

          case '\\':
            if (escape) {
              escape = false;
              key += '\\';
            } else {
              escape = true;
            }
            break;

          default:
            escape = false;
            key += keypath[i];
            break;
        }
      }

      return callback(object, key, true);
    },

    getDeepObjectValue: function(obj, keypath) {
      if (!v.isObject(obj)) {
        return undefined;
      }

      return v.forEachKeyInKeypath(obj, keypath, function(obj, key) {
        if (v.isObject(obj)) {
          return obj[key];
        }
      });
    },

    // This returns an object with all the values of the form.
    // It uses the input name as key and the value as value
    // So for example this:
    // <input type="text" name="email" value="foo@bar.com" />
    // would return:
    // {email: "foo@bar.com"}
    collectFormValues: function(form, options) {
      var values = {}
        , i
        , j
        , input
        , inputs
        , option
        , value;

      if (v.isJqueryElement(form)) {
        form = form[0];
      }

      if (!form) {
        return values;
      }

      options = options || {};

      inputs = form.querySelectorAll("input[name], textarea[name]");
      for (i = 0; i < inputs.length; ++i) {
        input = inputs.item(i);

        if (v.isDefined(input.getAttribute("data-ignored"))) {
          continue;
        }

        var name = input.name.replace(/\./g, "\\\\.");
        value = v.sanitizeFormValue(input.value, options);
        if (input.type === "number") {
          value = value ? +value : null;
        } else if (input.type === "checkbox") {
          if (input.attributes.value) {
            if (!input.checked) {
              value = values[name] || null;
            }
          } else {
            value = input.checked;
          }
        } else if (input.type === "radio") {
          if (!input.checked) {
            value = values[name] || null;
          }
        }
        values[name] = value;
      }

      inputs = form.querySelectorAll("select[name]");
      for (i = 0; i < inputs.length; ++i) {
        input = inputs.item(i);
        if (v.isDefined(input.getAttribute("data-ignored"))) {
          continue;
        }

        if (input.multiple) {
          value = [];
          for (j in input.options) {
            option = input.options[j];
             if (option && option.selected) {
              value.push(v.sanitizeFormValue(option.value, options));
            }
          }
        } else {
          var _val = typeof input.options[input.selectedIndex] !== 'undefined' ? input.options[input.selectedIndex].value : /* istanbul ignore next */ '';
          value = v.sanitizeFormValue(_val, options);
        }
        values[input.name] = value;
      }

      return values;
    },

    sanitizeFormValue: function(value, options) {
      if (options.trim && v.isString(value)) {
        value = value.trim();
      }

      if (options.nullify !== false && value === "") {
        return null;
      }
      return value;
    },

    capitalize: function(str) {
      if (!v.isString(str)) {
        return str;
      }
      return str[0].toUpperCase() + str.slice(1);
    },

    // Remove all errors who's error attribute is empty (null or undefined)
    pruneEmptyErrors: function(errors) {
      return errors.filter(function(error) {
        return !v.isEmpty(error.error);
      });
    },

    // In
    // [{error: ["err1", "err2"], ...}]
    // Out
    // [{error: "err1", ...}, {error: "err2", ...}]
    //
    // All attributes in an error with multiple messages are duplicated
    // when expanding the errors.
    expandMultipleErrors: function(errors) {
      var ret = [];
      errors.forEach(function(error) {
        // Removes errors without a message
        if (v.isArray(error.error)) {
          error.error.forEach(function(msg) {
            ret.push(v.extend({}, error, {error: msg}));
          });
        } else {
          ret.push(error);
        }
      });
      return ret;
    },

    // Converts the error mesages by prepending the attribute name unless the
    // message is prefixed by ^
    convertErrorMessages: function(errors, options) {
      options = options || {};

      var ret = []
        , prettify = options.prettify || v.prettify;
      errors.forEach(function(errorInfo) {
        var error = v.result(errorInfo.error,
            errorInfo.value,
            errorInfo.attribute,
            errorInfo.options,
            errorInfo.attributes,
            errorInfo.globalOptions);

        if (!v.isString(error)) {
          ret.push(errorInfo);
          return;
        }

        if (error[0] === '^') {
          error = error.slice(1);
        } else if (options.fullMessages !== false) {
          error = v.capitalize(prettify(errorInfo.attribute)) + " " + error;
        }
        error = error.replace(/\\\^/g, "^");
        error = v.format(error, {
          value: v.stringifyValue(errorInfo.value, options)
        });
        ret.push(v.extend({}, errorInfo, {error: error}));
      });
      return ret;
    },

    // In:
    // [{attribute: "<attributeName>", ...}]
    // Out:
    // {"<attributeName>": [{attribute: "<attributeName>", ...}]}
    groupErrorsByAttribute: function(errors) {
      var ret = {};
      errors.forEach(function(error) {
        var list = ret[error.attribute];
        if (list) {
          list.push(error);
        } else {
          ret[error.attribute] = [error];
        }
      });
      return ret;
    },

    // In:
    // [{error: "<message 1>", ...}, {error: "<message 2>", ...}]
    // Out:
    // ["<message 1>", "<message 2>"]
    flattenErrorsToArray: function(errors) {
      return errors
        .map(function(error) { return error.error; })
        .filter(function(value, index, self) {
          return self.indexOf(value) === index;
        });
    },

    cleanAttributes: function(attributes, whitelist) {
      function whitelistCreator(obj, key, last) {
        if (v.isObject(obj[key])) {
          return obj[key];
        }
        return (obj[key] = last ? true : {});
      }

      function buildObjectWhitelist(whitelist) {
        var ow = {}
          , lastObject
          , attr;
        for (attr in whitelist) {
          if (!whitelist[attr]) {
            continue;
          }
          v.forEachKeyInKeypath(ow, attr, whitelistCreator);
        }
        return ow;
      }

      function cleanRecursive(attributes, whitelist) {
        if (!v.isObject(attributes)) {
          return attributes;
        }

        var ret = v.extend({}, attributes)
          , w
          , attribute;

        for (attribute in attributes) {
          w = whitelist[attribute];

          if (v.isObject(w)) {
            ret[attribute] = cleanRecursive(ret[attribute], w);
          } else if (!w) {
            delete ret[attribute];
          }
        }
        return ret;
      }

      if (!v.isObject(whitelist) || !v.isObject(attributes)) {
        return {};
      }

      whitelist = buildObjectWhitelist(whitelist);
      return cleanRecursive(attributes, whitelist);
    },

    exposeModule: function(validate, root, exports, module, define) {
      if (exports) {
        if (module && module.exports) {
          exports = module.exports = validate;
        }
        exports.validate = validate;
      } else {
        root.validate = validate;
        if (validate.isFunction(define) && define.amd) {
          define([], function () { return validate; });
        }
      }
    },

    warn: function(msg) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[validate.js] " + msg);
      }
    },

    error: function(msg) {
      if (typeof console !== "undefined" && console.error) {
        console.error("[validate.js] " + msg);
      }
    }
  });

  validate.validators = {
    // Presence validates that the value isn't empty
    presence: function(value, options) {
      options = v.extend({}, this.options, options);
      if (options.allowEmpty !== false ? !v.isDefined(value) : v.isEmpty(value)) {
        return options.message || this.message || "can't be blank";
      }
    },
    length: function(value, options, attribute) {
      // Empty values are allowed
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var is = options.is
        , maximum = options.maximum
        , minimum = options.minimum
        , tokenizer = options.tokenizer || function(val) { return val; }
        , err
        , errors = [];

      value = tokenizer(value);
      var length = value.length;
      if(!v.isNumber(length)) {
        return options.message || this.notValid || "has an incorrect length";
      }

      // Is checks
      if (v.isNumber(is) && length !== is) {
        err = options.wrongLength ||
          this.wrongLength ||
          "is the wrong length (should be %{count} characters)";
        errors.push(v.format(err, {count: is}));
      }

      if (v.isNumber(minimum) && length < minimum) {
        err = options.tooShort ||
          this.tooShort ||
          "is too short (minimum is %{count} characters)";
        errors.push(v.format(err, {count: minimum}));
      }

      if (v.isNumber(maximum) && length > maximum) {
        err = options.tooLong ||
          this.tooLong ||
          "is too long (maximum is %{count} characters)";
        errors.push(v.format(err, {count: maximum}));
      }

      if (errors.length > 0) {
        return options.message || errors;
      }
    },
    numericality: function(value, options, attribute, attributes, globalOptions) {
      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var errors = []
        , name
        , count
        , checks = {
            greaterThan:          function(v, c) { return v > c; },
            greaterThanOrEqualTo: function(v, c) { return v >= c; },
            equalTo:              function(v, c) { return v === c; },
            lessThan:             function(v, c) { return v < c; },
            lessThanOrEqualTo:    function(v, c) { return v <= c; },
            divisibleBy:          function(v, c) { return v % c === 0; }
          }
        , prettify = options.prettify ||
          (globalOptions && globalOptions.prettify) ||
          v.prettify;

      // Strict will check that it is a valid looking number
      if (v.isString(value) && options.strict) {
        var pattern = "^-?(0|[1-9]\\d*)";
        if (!options.onlyInteger) {
          pattern += "(\\.\\d+)?";
        }
        pattern += "$";

        if (!(new RegExp(pattern).test(value))) {
          return options.message ||
            options.notValid ||
            this.notValid ||
            this.message ||
            "must be a valid number";
        }
      }

      // Coerce the value to a number unless we're being strict.
      if (options.noStrings !== true && v.isString(value) && !v.isEmpty(value)) {
        value = +value;
      }

      // If it's not a number we shouldn't continue since it will compare it.
      if (!v.isNumber(value)) {
        return options.message ||
          options.notValid ||
          this.notValid ||
          this.message ||
          "is not a number";
      }

      // Same logic as above, sort of. Don't bother with comparisons if this
      // doesn't pass.
      if (options.onlyInteger && !v.isInteger(value)) {
        return options.message ||
          options.notInteger ||
          this.notInteger ||
          this.message ||
          "must be an integer";
      }

      for (name in checks) {
        count = options[name];
        if (v.isNumber(count) && !checks[name](value, count)) {
          // This picks the default message if specified
          // For example the greaterThan check uses the message from
          // this.notGreaterThan so we capitalize the name and prepend "not"
          var key = "not" + v.capitalize(name);
          var msg = options[key] ||
            this[key] ||
            this.message ||
            "must be %{type} %{count}";

          errors.push(v.format(msg, {
            count: count,
            type: prettify(name)
          }));
        }
      }

      if (options.odd && value % 2 !== 1) {
        errors.push(options.notOdd ||
            this.notOdd ||
            this.message ||
            "must be odd");
      }
      if (options.even && value % 2 !== 0) {
        errors.push(options.notEven ||
            this.notEven ||
            this.message ||
            "must be even");
      }

      if (errors.length) {
        return options.message || errors;
      }
    },
    datetime: v.extend(function(value, options) {
      if (!v.isFunction(this.parse) || !v.isFunction(this.format)) {
        throw new Error("Both the parse and format functions needs to be set to use the datetime/date validator");
      }

      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var err
        , errors = []
        , earliest = options.earliest ? this.parse(options.earliest, options) : NaN
        , latest = options.latest ? this.parse(options.latest, options) : NaN;

      value = this.parse(value, options);

      // 86400000 is the number of milliseconds in a day, this is used to remove
      // the time from the date
      if (isNaN(value) || options.dateOnly && value % 86400000 !== 0) {
        err = options.notValid ||
          options.message ||
          this.notValid ||
          "must be a valid date";
        return v.format(err, {value: arguments[0]});
      }

      if (!isNaN(earliest) && value < earliest) {
        err = options.tooEarly ||
          options.message ||
          this.tooEarly ||
          "must be no earlier than %{date}";
        err = v.format(err, {
          value: this.format(value, options),
          date: this.format(earliest, options)
        });
        errors.push(err);
      }

      if (!isNaN(latest) && value > latest) {
        err = options.tooLate ||
          options.message ||
          this.tooLate ||
          "must be no later than %{date}";
        err = v.format(err, {
          date: this.format(latest, options),
          value: this.format(value, options)
        });
        errors.push(err);
      }

      if (errors.length) {
        return v.unique(errors);
      }
    }, {
      parse: null,
      format: null
    }),
    date: function(value, options) {
      options = v.extend({}, options, {dateOnly: true});
      return v.validators.datetime.call(v.validators.datetime, value, options);
    },
    format: function(value, options) {
      if (v.isString(options) || (options instanceof RegExp)) {
        options = {pattern: options};
      }

      options = v.extend({}, this.options, options);

      var message = options.message || this.message || "is invalid"
        , pattern = options.pattern
        , match;

      // Empty values are allowed
      if (!v.isDefined(value)) {
        return;
      }
      if (!v.isString(value)) {
        return message;
      }

      if (v.isString(pattern)) {
        pattern = new RegExp(options.pattern, options.flags);
      }
      match = pattern.exec(value);
      if (!match || match[0].length != value.length) {
        return message;
      }
    },
    inclusion: function(value, options) {
      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }
      if (v.isArray(options)) {
        options = {within: options};
      }
      options = v.extend({}, this.options, options);
      if (v.contains(options.within, value)) {
        return;
      }
      var message = options.message ||
        this.message ||
        "^%{value} is not included in the list";
      return v.format(message, {value: value});
    },
    exclusion: function(value, options) {
      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }
      if (v.isArray(options)) {
        options = {within: options};
      }
      options = v.extend({}, this.options, options);
      if (!v.contains(options.within, value)) {
        return;
      }
      var message = options.message || this.message || "^%{value} is restricted";
      if (v.isString(options.within[value])) {
        value = options.within[value];
      }
      return v.format(message, {value: value});
    },
    email: v.extend(function(value, options) {
      options = v.extend({}, this.options, options);
      var message = options.message || this.message || "is not a valid email";
      // Empty values are fine
      if (!v.isDefined(value)) {
        return;
      }
      if (!v.isString(value)) {
        return message;
      }
      if (!this.PATTERN.exec(value)) {
        return message;
      }
    }, {
      PATTERN: /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
    }),
    equality: function(value, options, attribute, attributes, globalOptions) {
      if (!v.isDefined(value)) {
        return;
      }

      if (v.isString(options)) {
        options = {attribute: options};
      }
      options = v.extend({}, this.options, options);
      var message = options.message ||
        this.message ||
        "is not equal to %{attribute}";

      if (v.isEmpty(options.attribute) || !v.isString(options.attribute)) {
        throw new Error("The attribute must be a non empty string");
      }

      var otherValue = v.getDeepObjectValue(attributes, options.attribute)
        , comparator = options.comparator || function(v1, v2) {
          return v1 === v2;
        }
        , prettify = options.prettify ||
          (globalOptions && globalOptions.prettify) ||
          v.prettify;

      if (!comparator(value, otherValue, options, attribute, attributes)) {
        return v.format(message, {attribute: prettify(options.attribute)});
      }
    },
    // A URL validator that is used to validate URLs with the ability to
    // restrict schemes and some domains.
    url: function(value, options) {
      if (!v.isDefined(value)) {
        return;
      }

      options = v.extend({}, this.options, options);

      var message = options.message || this.message || "is not a valid url"
        , schemes = options.schemes || this.schemes || ['http', 'https']
        , allowLocal = options.allowLocal || this.allowLocal || false
        , allowDataUrl = options.allowDataUrl || this.allowDataUrl || false;
      if (!v.isString(value)) {
        return message;
      }

      // https://gist.github.com/dperini/729294
      var regex =
        "^" +
        // protocol identifier
        "(?:(?:" + schemes.join("|") + ")://)" +
        // user:pass authentication
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:";

      var tld = "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))";

      if (allowLocal) {
        tld += "?";
      } else {
        regex +=
          // IP address exclusion
          // private & local networks
          "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
          "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
          "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})";
      }

      regex +=
          // IP address dotted notation octets
          // excludes loopback network 0.0.0.0
          // excludes reserved space >= 224.0.0.0
          // excludes network & broacast addresses
          // (first & last IP address of each class)
          "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
          "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
          "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
        "|" +
          // host name
          "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
          // domain name
          "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
          tld +
        ")" +
        // port number
        "(?::\\d{2,5})?" +
        // resource path
        "(?:[/?#]\\S*)?" +
      "$";

      if (allowDataUrl) {
        // RFC 2397
        var mediaType = "\\w+\\/[-+.\\w]+(?:;[\\w=]+)*";
        var urlchar = "[A-Za-z0-9-_.!~\\*'();\\/?:@&=+$,%]*";
        var dataurl = "data:(?:"+mediaType+")?(?:;base64)?,"+urlchar;
        regex = "(?:"+regex+")|(?:^"+dataurl+"$)";
      }

      var PATTERN = new RegExp(regex, 'i');
      if (!PATTERN.exec(value)) {
        return message;
      }
    },
    type: v.extend(function(value, originalOptions, attribute, attributes, globalOptions) {
      if (v.isString(originalOptions)) {
        originalOptions = {type: originalOptions};
      }

      if (!v.isDefined(value)) {
        return;
      }

      var options = v.extend({}, this.options, originalOptions);

      var type = options.type;
      if (!v.isDefined(type)) {
        throw new Error("No type was specified");
      }

      var check;
      if (v.isFunction(type)) {
        check = type;
      } else {
        check = this.types[type];
      }

      if (!v.isFunction(check)) {
        throw new Error("validate.validators.type.types." + type + " must be a function.");
      }

      if (!check(value, options, attribute, attributes, globalOptions)) {
        var message = originalOptions.message ||
          this.messages[type] ||
          this.message ||
          options.message ||
          (v.isFunction(type) ? "must be of the correct type" : "must be of type %{type}");

        if (v.isFunction(message)) {
          message = message(value, originalOptions, attribute, attributes, globalOptions);
        }

        return v.format(message, {attribute: v.prettify(attribute), type: type});
      }
    }, {
      types: {
        object: function(value) {
          return v.isObject(value) && !v.isArray(value);
        },
        array: v.isArray,
        integer: v.isInteger,
        number: v.isNumber,
        string: v.isString,
        date: v.isDate,
        boolean: v.isBoolean
      },
      messages: {}
    })
  };

  validate.formatters = {
    detailed: function(errors) {return errors;},
    flat: v.flattenErrorsToArray,
    grouped: function(errors) {
      var attr;

      errors = v.groupErrorsByAttribute(errors);
      for (attr in errors) {
        errors[attr] = v.flattenErrorsToArray(errors[attr]);
      }
      return errors;
    },
    constraint: function(errors) {
      var attr;
      errors = v.groupErrorsByAttribute(errors);
      for (attr in errors) {
        errors[attr] = errors[attr].map(function(result) {
          return result.validator;
        }).sort();
      }
      return errors;
    }
  };

  validate.exposeModule(validate, this, exports, module, define);
}).call(this,
        typeof exports !== 'undefined' ? /* istanbul ignore next */ exports : null,
        typeof module !== 'undefined' ? /* istanbul ignore next */ module : null,
        typeof define !== 'undefined' ? /* istanbul ignore next */ define : null);

},{}],3:[function(require,module,exports){
"use strict";

var _imask = _interopRequireDefault(require("imask"));
var _validate = _interopRequireDefault(require("validate.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
document.addEventListener('DOMContentLoaded', function () {
  var dropdowns = document.querySelectorAll("[data-toggle=\"dropdown\"]");
  var editLink = document.querySelector("[data-action=\"edit\"]");
  var form = document.forms[0];
  var check = document.getElementById('decided');
  var liability = document.getElementById('liability');
  var liabilityNo = document.getElementById('liability_0');
  var elems = [];
  if (liability) {
    liability.addEventListener('change', function () {
      var block = liability.parentElement.parentElement;
      var hiddenElems = block.querySelectorAll('[data-shown]');
      liability.checked = false;
      if (hiddenElems) {
        hiddenElems.forEach(function (item) {
          item.classList.remove('is-hidden');
        });
        var firstHiddenElem = hiddenElems[0].children[0];
        if (firstHiddenElem) {
          firstHiddenElem.checked = true;
          firstHiddenElem.dispatchEvent(new Event('change'));
        }
      }
    });
    liabilityNo.addEventListener('change', function () {
      var block = liability.parentElement.parentElement;
      var hiddenElems = block.querySelectorAll('[data-shown]');
      if (hiddenElems) {
        hiddenElems.forEach(function (item) {
          item.classList.add('is-hidden');
        });
      }
    });
  }
  if (check) {
    check.addEventListener('change', function (e) {
      if (check.checked) {
        form.elements.link.value = '';
        form.elements.model.value = '';
        form.elements.link.setAttribute('disabled', 'disabled');
        form.elements.model.setAttribute('disabled', 'disabled');
        form.elements.link.parentElement.classList.add('lead-form__group--disabled');
        form.elements.model.parentElement.classList.add('lead-form__group--disabled');
      } else {
        form.elements.link.removeAttribute('disabled', 'disabled');
        form.elements.model.removeAttribute('disabled', 'disabled');
        form.elements.link.parentElement.classList.remove('lead-form__group--disabled');
        form.elements.model.parentElement.classList.remove('lead-form__group--disabled');
      }
    });
  }
  if ('undefined' !== typeof form) {
    elems = Object.values(form.elements).filter(function (el) {
      return el && el.classList.contains('is-editable');
    });
    var phone = form.elements.phone;
    if ('undefined' !== typeof phone) {
      var newMask = (0, _imask["default"])(phone, {
        mask: '+{375} (00) 000-00-00',
        lazy: true
      }).on('complete', function () {
        // todo:
      });
      console.log(newMask);
    }
    console.log(Object.values(form.elements));
    Object.values(form.elements).forEach(function (el) {
      el.addEventListener('change', function () {
        el.classList.remove('invalid');
        var msg = el.parentElement.querySelector('.messages');
        if (msg) {
          msg.classList.remove('error');
          msg.innerHTML = '';
        }
      });
    });
    form.addEventListener('submit', function (e) {
      if (form.id === 'agreements') {
        e.preventDefault();
        // const data = new FormData(form);
        var constraints = {
          agreement_report: {
            presence: {
              message: "^\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u043D\u0430 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435\n              \u043A\u0440\u0435\u0434\u0438\u0442\u043D\u043E\u0433\u043E \u043E\u0442\u0447\u0435\u0442\u0430"
            }
          },
          agreement_personal: {
            presence: {
              message: "^\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u043D\u0430 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u0438\n              \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445"
            }
          },
          agreement_politic: {
            presence: {
              message: "^\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u0441 \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u043E\u0439 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u0442\u0438\u043E\u0441\u0442\u0438"
            }
          }
        };
        var errors = (0, _validate["default"])(form, constraints);
        if (errors) {
          Object.entries(errors).forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
              id = _ref2[0],
              error = _ref2[1];
            var input = form.elements[id];
            if (input) {
              input.classList.add('invalid');
              var msg = input.parentElement.querySelector('.messages');
              msg.innerHTML = error[0];
              msg.classList.add('error');
            }
          });
        } else {
          form.submit();
        }
      }
    });
  }
  if (null !== editLink) {
    editLink.addEventListener('click', function (e) {
      e.preventDefault();
      elems.forEach(function (elem) {
        elem.classList.remove('lead-form__group--disabled');
        var inputEl = elem.querySelector('input');
        inputEl.removeAttribute('readonly');
      });
    });
  }
  if (null !== dropdowns) {
    dropdowns.forEach(function (dropdown) {
      dropdown.addEventListener('click', function () {
        var contentId = dropdown.dataset.target.replace('#', '');
        if (null !== contentId) {
          var content = document.getElementById(contentId);
          content.classList.toggle('is-hidden');
          dropdown.classList.toggle('is-open');
        }
      });
    });
  }
  var customSelects = document.querySelectorAll('.lead-form__custom-select');
  // Attach click event listeners to each custom select
  customSelects.forEach(function (sel) {
    var selectSelected = sel.querySelector('.lead-form__select-selected');
    var selectItems = sel.querySelector('.lead-form__select-items');
    var options = selectItems.querySelectorAll('div');
    var selHidden = sel.previousElementSibling;
    selectSelected.addEventListener('click', function () {
      if (selectItems.style.display === 'block') {
        selectItems.style.display = 'none';
        selectSelected.classList.remove('is-open');
      } else {
        selectItems.style.display = 'block';
        selectSelected.classList.add('is-open');
      }
    });
    // Set the selected option and hide the dropdown when an option is clicked
    options.forEach(function (option) {
      option.addEventListener('click', function () {
        selectSelected.textContent = option.textContent;
        selHidden.value = option.dataset.value;
        var selItem = selHidden.querySelector("[value=\"".concat(option.dataset.value, "\"]"));
        selItem.dispatchEvent(new Event('click'));
        selectItems.style.display = 'none';
        selectSelected.classList.remove('is-open');
      });
    });
    // Close the dropdown if the user clicks outside of it
    window.addEventListener('click', function (e) {
      if (!sel.contains(e.target)) {
        selectItems.style.display = 'none';
        selectSelected.classList.remove('is-open');
      }
    });
  });
});

},{"imask":1,"validate.js":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW1hc2svZGlzdC9pbWFzay5qcyIsIm5vZGVfbW9kdWxlcy92YWxpZGF0ZS5qcy92YWxpZGF0ZS5qcyIsInNyYy9qcy9zY3JpcHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDempIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNydUNBLElBQUEsTUFBQSxHQUFBLHNCQUFBLENBQUEsT0FBQTtBQUNBLElBQUEsU0FBQSxHQUFBLHNCQUFBLENBQUEsT0FBQTtBQUFtQyxTQUFBLHVCQUFBLENBQUEsV0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUE7QUFBQSxTQUFBLGVBQUEsQ0FBQSxFQUFBLENBQUEsV0FBQSxlQUFBLENBQUEsQ0FBQSxLQUFBLHFCQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsS0FBQSwyQkFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEtBQUEsZ0JBQUE7QUFBQSxTQUFBLGlCQUFBLGNBQUEsU0FBQTtBQUFBLFNBQUEsNEJBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLDJCQUFBLENBQUEsU0FBQSxpQkFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLE9BQUEsQ0FBQSxNQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxFQUFBLEtBQUEsNkJBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxXQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxXQUFBLENBQUEsSUFBQSxhQUFBLENBQUEsY0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLG9CQUFBLENBQUEsK0NBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxpQkFBQSxDQUFBLENBQUEsRUFBQSxDQUFBO0FBQUEsU0FBQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxhQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLE1BQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLE1BQUEsWUFBQSxDQUFBLE1BQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxVQUFBLENBQUE7QUFBQSxTQUFBLHNCQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxXQUFBLENBQUEsZ0NBQUEsTUFBQSxJQUFBLENBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxLQUFBLENBQUEsNEJBQUEsQ0FBQSxRQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLFFBQUEsQ0FBQSxRQUFBLE1BQUEsQ0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsdUJBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLE1BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsS0FBQSxHQUFBLENBQUEsQ0FBQSxNQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQSxJQUFBLENBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSx5QkFBQSxDQUFBLFlBQUEsQ0FBQSxlQUFBLENBQUEsR0FBQSxDQUFBLGNBQUEsTUFBQSxDQUFBLENBQUEsTUFBQSxDQUFBLDJCQUFBLENBQUEsUUFBQSxDQUFBLGFBQUEsQ0FBQTtBQUFBLFNBQUEsZ0JBQUEsQ0FBQSxRQUFBLEtBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQSxVQUFBLENBQUE7QUFFbkMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLFlBQU07RUFDbEQsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGdCQUFnQiw2QkFBMkIsQ0FBQztFQUN2RSxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSx5QkFBdUIsQ0FBQztFQUMvRCxJQUFNLElBQUksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUM5QixJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztFQUNoRCxJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQztFQUN0RCxJQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQztFQUMxRCxJQUFJLEtBQUssR0FBRyxFQUFFO0VBRWQsSUFBSSxTQUFTLEVBQUU7SUFDYixTQUFTLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFlBQU07TUFDekMsSUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxhQUFhO01BQ25ELElBQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUM7TUFDMUQsU0FBUyxDQUFDLE9BQU8sR0FBRyxLQUFLO01BQ3pCLElBQUksV0FBVyxFQUFFO1FBQ2YsV0FBVyxDQUFDLE9BQU8sQ0FBRSxVQUFDLElBQUksRUFBSztVQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDcEMsQ0FBQyxDQUFDO1FBQ0YsSUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEQsSUFBSSxlQUFlLEVBQUU7VUFDbkIsZUFBZSxDQUFDLE9BQU8sR0FBRyxJQUFJO1VBQzlCLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEQ7TUFDRjtJQUNGLENBQUMsQ0FBQztJQUNGLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsWUFBTTtNQUMzQyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLGFBQWE7TUFDbkQsSUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQztNQUMxRCxJQUFJLFdBQVcsRUFBRTtRQUNmLFdBQVcsQ0FBQyxPQUFPLENBQUUsVUFBQyxJQUFJLEVBQUs7VUFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO1FBQ2pDLENBQUMsQ0FBQztNQUNKO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7RUFDQSxJQUFJLEtBQUssRUFBRTtJQUNULEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsVUFBQyxDQUFDLEVBQUs7TUFDdEMsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFO1FBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFO1FBQzdCLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFO1FBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQ3ZELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQ3hELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FDNUIsU0FBUyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQztRQUMvQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQzdCLFNBQVMsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUM7TUFDakQsQ0FBQyxNQUFNO1FBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7UUFDMUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7UUFDM0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUM1QixTQUFTLENBQUMsTUFBTSxDQUFDLDRCQUE0QixDQUFDO1FBQ2xELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FDN0IsU0FBUyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQztNQUNwRDtJQUNGLENBQUMsQ0FBQztFQUNKO0VBQ0EsSUFBSSxXQUFXLEtBQUssT0FBTyxJQUFJLEVBQUU7SUFDL0IsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUNoQyxNQUFNLENBQUMsVUFBQyxFQUFFO01BQUEsT0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO0lBQUEsRUFBQztJQUM5RCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUs7SUFDakMsSUFBSSxXQUFXLEtBQUssT0FBTyxLQUFLLEVBQUU7TUFDaEMsSUFBTSxPQUFPLEdBQUcsSUFBQSxpQkFBSyxFQUFDLEtBQUssRUFDdkI7UUFDRSxJQUFJLEVBQUUsdUJBQXVCO1FBQzdCLElBQUksRUFBRTtNQUNSLENBQ0osQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBVztRQUMxQjtNQUFBLENBQ0QsQ0FBQztNQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO0lBQ3RCO0lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBRSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMxQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFFLEVBQUk7TUFDMUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxZQUFNO1FBQ2xDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUM5QixJQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7UUFDdkQsSUFBSSxHQUFHLEVBQUU7VUFDUCxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7VUFDN0IsR0FBRyxDQUFDLFNBQVMsR0FBRyxFQUFFO1FBQ3BCO01BQ0YsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0lBQ0YsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFDLENBQUMsRUFBSztNQUNyQyxJQUFJLElBQUksQ0FBQyxFQUFFLEtBQUssWUFBWSxFQUFFO1FBQzVCLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNsQjtRQUNBLElBQU0sV0FBVyxHQUFHO1VBQ2xCLGdCQUFnQixFQUFFO1lBQ2hCLFFBQVEsRUFBRTtjQUNSLE9BQU87WUFFVDtVQUNGLENBQUM7VUFDRCxrQkFBa0IsRUFBRTtZQUNsQixRQUFRLEVBQUU7Y0FDUixPQUFPO1lBRVQ7VUFDRixDQUFDO1VBQ0QsaUJBQWlCLEVBQUU7WUFDakIsUUFBUSxFQUFFO2NBQ1IsT0FBTztZQUNUO1VBQ0Y7UUFDRixDQUFDO1FBRUQsSUFBTSxNQUFNLEdBQUcsSUFBQSxvQkFBUSxFQUFDLElBQUksRUFBRSxXQUFXLENBQUM7UUFDMUMsSUFBSSxNQUFNLEVBQUU7VUFDVixNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUEsRUFBaUI7WUFBQSxJQUFBLEtBQUEsR0FBQSxjQUFBLENBQUEsSUFBQTtjQUFmLEVBQUUsR0FBQSxLQUFBO2NBQUUsS0FBSyxHQUFBLEtBQUE7WUFDeEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDL0IsSUFBSSxLQUFLLEVBQUU7Y0FDVCxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7Y0FDOUIsSUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO2NBQzFELEdBQUcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztjQUN4QixHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7WUFDNUI7VUFDRixDQUFDLENBQUM7UUFDSixDQUFDLE1BQU07VUFDTCxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDZjtNQUNGO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7RUFFQSxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7SUFDckIsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxVQUFDLENBQUMsRUFBSztNQUN4QyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7TUFDbEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQUksRUFBSztRQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQztRQUNuRCxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztRQUMzQyxPQUFPLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQztNQUNyQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjtFQUNBLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtJQUN0QixTQUFTLENBQUMsT0FBTyxDQUFDLFVBQUMsUUFBUSxFQUFLO01BQzlCLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsWUFBTTtRQUN2QyxJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztRQUMxRCxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7VUFDdEIsSUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7VUFDbEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1VBQ3JDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUN0QztNQUNGLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKO0VBRUEsSUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLDJCQUEyQixDQUFDO0VBQzVFO0VBQ0EsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFTLEdBQUcsRUFBRTtJQUNsQyxJQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLDZCQUE2QixDQUFDO0lBQ3ZFLElBQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsMEJBQTBCLENBQUM7SUFDakUsSUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztJQUNuRCxJQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsc0JBQXNCO0lBQzVDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsWUFBVztNQUNsRCxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRTtRQUN6QyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNO1FBQ2xDLGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztNQUM1QyxDQUFDLE1BQU07UUFDTCxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPO1FBQ25DLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztNQUN6QztJQUNGLENBQUMsQ0FBQztJQUNGO0lBQ0EsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFTLE1BQU0sRUFBRTtNQUMvQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFlBQVc7UUFDMUMsY0FBYyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVztRQUMvQyxTQUFTLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSztRQUN0QyxJQUFNLE9BQU8sR0FBRyxTQUFTLENBQ3BCLGFBQWEsYUFBQSxNQUFBLENBQVksTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQUksQ0FBQztRQUN2RCxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU07UUFDbEMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO01BQzVDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztJQUNGO0lBQ0EsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxVQUFTLENBQUMsRUFBRTtNQUMzQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDM0IsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTTtRQUNsQyxjQUFjLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7TUFDNUM7SUFDRixDQUFDLENBQUM7RUFDSixDQUFDLENBQUM7QUFDSixDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG4gIChnbG9iYWwgPSB0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWxUaGlzIDogZ2xvYmFsIHx8IHNlbGYsIGZhY3RvcnkoZ2xvYmFsLklNYXNrID0ge30pKTtcbn0pKHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbiAgLyoqIENoZWNrcyBpZiB2YWx1ZSBpcyBzdHJpbmcgKi9cbiAgZnVuY3Rpb24gaXNTdHJpbmcoc3RyKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnIHx8IHN0ciBpbnN0YW5jZW9mIFN0cmluZztcbiAgfVxuXG4gIC8qKiBDaGVja3MgaWYgdmFsdWUgaXMgb2JqZWN0ICovXG4gIGZ1bmN0aW9uIGlzT2JqZWN0KG9iaikge1xuICAgIHZhciBfb2JqJGNvbnN0cnVjdG9yO1xuICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiBvYmogIT0gbnVsbCAmJiAob2JqID09IG51bGwgfHwgKF9vYmokY29uc3RydWN0b3IgPSBvYmouY29uc3RydWN0b3IpID09IG51bGwgPyB2b2lkIDAgOiBfb2JqJGNvbnN0cnVjdG9yLm5hbWUpID09PSAnT2JqZWN0JztcbiAgfVxuICBmdW5jdGlvbiBwaWNrKG9iaiwga2V5cykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGtleXMpKSByZXR1cm4gcGljayhvYmosIChfLCBrKSA9PiBrZXlzLmluY2x1ZGVzKGspKTtcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMob2JqKS5yZWR1Y2UoKGFjYywgX3JlZikgPT4ge1xuICAgICAgbGV0IFtrLCB2XSA9IF9yZWY7XG4gICAgICBpZiAoa2V5cyh2LCBrKSkgYWNjW2tdID0gdjtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xuICB9XG5cbiAgLyoqIERpcmVjdGlvbiAqL1xuICBjb25zdCBESVJFQ1RJT04gPSB7XG4gICAgTk9ORTogJ05PTkUnLFxuICAgIExFRlQ6ICdMRUZUJyxcbiAgICBGT1JDRV9MRUZUOiAnRk9SQ0VfTEVGVCcsXG4gICAgUklHSFQ6ICdSSUdIVCcsXG4gICAgRk9SQ0VfUklHSFQ6ICdGT1JDRV9SSUdIVCdcbiAgfTtcblxuICAvKiogRGlyZWN0aW9uICovXG5cbiAgZnVuY3Rpb24gZm9yY2VEaXJlY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgIGNhc2UgRElSRUNUSU9OLkxFRlQ6XG4gICAgICAgIHJldHVybiBESVJFQ1RJT04uRk9SQ0VfTEVGVDtcbiAgICAgIGNhc2UgRElSRUNUSU9OLlJJR0hUOlxuICAgICAgICByZXR1cm4gRElSRUNUSU9OLkZPUkNFX1JJR0hUO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGRpcmVjdGlvbjtcbiAgICB9XG4gIH1cblxuICAvKiogRXNjYXBlcyByZWd1bGFyIGV4cHJlc3Npb24gY29udHJvbCBjaGFycyAqL1xuICBmdW5jdGlvbiBlc2NhcGVSZWdFeHAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWy4qKz9ePSE6JHt9KCl8W1xcXS9cXFxcXSkvZywgJ1xcXFwkMScpO1xuICB9XG5cbiAgLy8gY2xvbmVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Vwb2JlcmV6a2luL2Zhc3QtZGVlcC1lcXVhbCB3aXRoIHNtYWxsIGNoYW5nZXNcbiAgZnVuY3Rpb24gb2JqZWN0SW5jbHVkZXMoYiwgYSkge1xuICAgIGlmIChhID09PSBiKSByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCBhcnJBID0gQXJyYXkuaXNBcnJheShhKSxcbiAgICAgIGFyckIgPSBBcnJheS5pc0FycmF5KGIpO1xuICAgIGxldCBpO1xuICAgIGlmIChhcnJBICYmIGFyckIpIHtcbiAgICAgIGlmIChhLmxlbmd0aCAhPSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIGlmICghb2JqZWN0SW5jbHVkZXMoYVtpXSwgYltpXSkpIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoYXJyQSAhPSBhcnJCKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGEgJiYgYiAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGIgPT09ICdvYmplY3QnKSB7XG4gICAgICBjb25zdCBkYXRlQSA9IGEgaW5zdGFuY2VvZiBEYXRlLFxuICAgICAgICBkYXRlQiA9IGIgaW5zdGFuY2VvZiBEYXRlO1xuICAgICAgaWYgKGRhdGVBICYmIGRhdGVCKSByZXR1cm4gYS5nZXRUaW1lKCkgPT0gYi5nZXRUaW1lKCk7XG4gICAgICBpZiAoZGF0ZUEgIT0gZGF0ZUIpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IHJlZ2V4cEEgPSBhIGluc3RhbmNlb2YgUmVnRXhwLFxuICAgICAgICByZWdleHBCID0gYiBpbnN0YW5jZW9mIFJlZ0V4cDtcbiAgICAgIGlmIChyZWdleHBBICYmIHJlZ2V4cEIpIHJldHVybiBhLnRvU3RyaW5nKCkgPT0gYi50b1N0cmluZygpO1xuICAgICAgaWYgKHJlZ2V4cEEgIT0gcmVnZXhwQikgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGEpO1xuICAgICAgLy8gaWYgKGtleXMubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhiKS5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIGtleXNbaV0pKSByZXR1cm4gZmFsc2U7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykgaWYgKCFvYmplY3RJbmNsdWRlcyhiW2tleXNbaV1dLCBhW2tleXNbaV1dKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChhICYmIGIgJiYgdHlwZW9mIGEgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqIFNlbGVjdGlvbiByYW5nZSAqL1xuXG4gIC8qKiBQcm92aWRlcyBkZXRhaWxzIG9mIGNoYW5naW5nIGlucHV0ICovXG4gIGNsYXNzIEFjdGlvbkRldGFpbHMge1xuICAgIC8qKiBDdXJyZW50IGlucHV0IHZhbHVlICovXG5cbiAgICAvKiogQ3VycmVudCBjdXJzb3IgcG9zaXRpb24gKi9cblxuICAgIC8qKiBPbGQgaW5wdXQgdmFsdWUgKi9cblxuICAgIC8qKiBPbGQgc2VsZWN0aW9uICovXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIG9wdHMpO1xuXG4gICAgICAvLyBkb3VibGUgY2hlY2sgaWYgbGVmdCBwYXJ0IHdhcyBjaGFuZ2VkIChhdXRvZmlsbGluZywgb3RoZXIgbm9uLXN0YW5kYXJkIGlucHV0IHRyaWdnZXJzKVxuICAgICAgd2hpbGUgKHRoaXMudmFsdWUuc2xpY2UoMCwgdGhpcy5zdGFydENoYW5nZVBvcykgIT09IHRoaXMub2xkVmFsdWUuc2xpY2UoMCwgdGhpcy5zdGFydENoYW5nZVBvcykpIHtcbiAgICAgICAgLS10aGlzLm9sZFNlbGVjdGlvbi5zdGFydDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmluc2VydGVkQ291bnQpIHtcbiAgICAgICAgLy8gZG91YmxlIGNoZWNrIHJpZ2h0IHBhcnRcbiAgICAgICAgd2hpbGUgKHRoaXMudmFsdWUuc2xpY2UodGhpcy5jdXJzb3JQb3MpICE9PSB0aGlzLm9sZFZhbHVlLnNsaWNlKHRoaXMub2xkU2VsZWN0aW9uLmVuZCkpIHtcbiAgICAgICAgICBpZiAodGhpcy52YWx1ZS5sZW5ndGggLSB0aGlzLmN1cnNvclBvcyA8IHRoaXMub2xkVmFsdWUubGVuZ3RoIC0gdGhpcy5vbGRTZWxlY3Rpb24uZW5kKSArK3RoaXMub2xkU2VsZWN0aW9uLmVuZDtlbHNlICsrdGhpcy5jdXJzb3JQb3M7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogU3RhcnQgY2hhbmdpbmcgcG9zaXRpb24gKi9cbiAgICBnZXQgc3RhcnRDaGFuZ2VQb3MoKSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4odGhpcy5jdXJzb3JQb3MsIHRoaXMub2xkU2VsZWN0aW9uLnN0YXJ0KTtcbiAgICB9XG5cbiAgICAvKiogSW5zZXJ0ZWQgc3ltYm9scyBjb3VudCAqL1xuICAgIGdldCBpbnNlcnRlZENvdW50KCkge1xuICAgICAgcmV0dXJuIHRoaXMuY3Vyc29yUG9zIC0gdGhpcy5zdGFydENoYW5nZVBvcztcbiAgICB9XG5cbiAgICAvKiogSW5zZXJ0ZWQgc3ltYm9scyAqL1xuICAgIGdldCBpbnNlcnRlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlLnN1YnN0cih0aGlzLnN0YXJ0Q2hhbmdlUG9zLCB0aGlzLmluc2VydGVkQ291bnQpO1xuICAgIH1cblxuICAgIC8qKiBSZW1vdmVkIHN5bWJvbHMgY291bnQgKi9cbiAgICBnZXQgcmVtb3ZlZENvdW50KCkge1xuICAgICAgLy8gTWF0aC5tYXggZm9yIG9wcG9zaXRlIG9wZXJhdGlvblxuICAgICAgcmV0dXJuIE1hdGgubWF4KHRoaXMub2xkU2VsZWN0aW9uLmVuZCAtIHRoaXMuc3RhcnRDaGFuZ2VQb3MgfHxcbiAgICAgIC8vIGZvciBEZWxldGVcbiAgICAgIHRoaXMub2xkVmFsdWUubGVuZ3RoIC0gdGhpcy52YWx1ZS5sZW5ndGgsIDApO1xuICAgIH1cblxuICAgIC8qKiBSZW1vdmVkIHN5bWJvbHMgKi9cbiAgICBnZXQgcmVtb3ZlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLm9sZFZhbHVlLnN1YnN0cih0aGlzLnN0YXJ0Q2hhbmdlUG9zLCB0aGlzLnJlbW92ZWRDb3VudCk7XG4gICAgfVxuXG4gICAgLyoqIFVuY2hhbmdlZCBoZWFkIHN5bWJvbHMgKi9cbiAgICBnZXQgaGVhZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlLnN1YnN0cmluZygwLCB0aGlzLnN0YXJ0Q2hhbmdlUG9zKTtcbiAgICB9XG5cbiAgICAvKiogVW5jaGFuZ2VkIHRhaWwgc3ltYm9scyAqL1xuICAgIGdldCB0YWlsKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWUuc3Vic3RyaW5nKHRoaXMuc3RhcnRDaGFuZ2VQb3MgKyB0aGlzLmluc2VydGVkQ291bnQpO1xuICAgIH1cblxuICAgIC8qKiBSZW1vdmUgZGlyZWN0aW9uICovXG4gICAgZ2V0IHJlbW92ZURpcmVjdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5yZW1vdmVkQ291bnQgfHwgdGhpcy5pbnNlcnRlZENvdW50KSByZXR1cm4gRElSRUNUSU9OLk5PTkU7XG5cbiAgICAgIC8vIGFsaWduIHJpZ2h0IGlmIGRlbGV0ZSBhdCByaWdodFxuICAgICAgcmV0dXJuICh0aGlzLm9sZFNlbGVjdGlvbi5lbmQgPT09IHRoaXMuY3Vyc29yUG9zIHx8IHRoaXMub2xkU2VsZWN0aW9uLnN0YXJ0ID09PSB0aGlzLmN1cnNvclBvcykgJiZcbiAgICAgIC8vIGlmIG5vdCByYW5nZSByZW1vdmVkIChldmVudCB3aXRoIGJhY2tzcGFjZSlcbiAgICAgIHRoaXMub2xkU2VsZWN0aW9uLmVuZCA9PT0gdGhpcy5vbGRTZWxlY3Rpb24uc3RhcnQgPyBESVJFQ1RJT04uUklHSFQgOiBESVJFQ1RJT04uTEVGVDtcbiAgICB9XG4gIH1cblxuICAvKiogQXBwbGllcyBtYXNrIG9uIGVsZW1lbnQgKi9cbiAgZnVuY3Rpb24gSU1hc2soZWwsIG9wdHMpIHtcbiAgICAvLyBjdXJyZW50bHkgYXZhaWxhYmxlIG9ubHkgZm9yIGlucHV0LWxpa2UgZWxlbWVudHNcbiAgICByZXR1cm4gbmV3IElNYXNrLklucHV0TWFzayhlbCwgb3B0cyk7XG4gIH1cblxuICAvLyBUT0RPIGNhbid0IHVzZSBvdmVybG9hZHMgaGVyZSBiZWNhdXNlIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNTA3NTRcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHN0cmluZyk6IHR5cGVvZiBNYXNrZWRQYXR0ZXJuO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogRGF0ZUNvbnN0cnVjdG9yKTogdHlwZW9mIE1hc2tlZERhdGU7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBOdW1iZXJDb25zdHJ1Y3Rvcik6IHR5cGVvZiBNYXNrZWROdW1iZXI7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBBcnJheTxhbnk+IHwgQXJyYXlDb25zdHJ1Y3Rvcik6IHR5cGVvZiBNYXNrZWREeW5hbWljO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkRGF0ZSk6IHR5cGVvZiBNYXNrZWREYXRlO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkTnVtYmVyKTogdHlwZW9mIE1hc2tlZE51bWJlcjtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZEVudW0pOiB0eXBlb2YgTWFza2VkRW51bTtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZFJhbmdlKTogdHlwZW9mIE1hc2tlZFJhbmdlO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkUmVnRXhwKTogdHlwZW9mIE1hc2tlZFJlZ0V4cDtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZEZ1bmN0aW9uKTogdHlwZW9mIE1hc2tlZEZ1bmN0aW9uO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkUGF0dGVybik6IHR5cGVvZiBNYXNrZWRQYXR0ZXJuO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkRHluYW1pYyk6IHR5cGVvZiBNYXNrZWREeW5hbWljO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkKTogdHlwZW9mIE1hc2tlZDtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWQpOiB0eXBlb2YgTWFza2VkO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZERhdGUpOiB0eXBlb2YgTWFza2VkRGF0ZTtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWROdW1iZXIpOiB0eXBlb2YgTWFza2VkTnVtYmVyO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZEVudW0pOiB0eXBlb2YgTWFza2VkRW51bTtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWRSYW5nZSk6IHR5cGVvZiBNYXNrZWRSYW5nZTtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWRSZWdFeHApOiB0eXBlb2YgTWFza2VkUmVnRXhwO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZEZ1bmN0aW9uKTogdHlwZW9mIE1hc2tlZEZ1bmN0aW9uO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZFBhdHRlcm4pOiB0eXBlb2YgTWFza2VkUGF0dGVybjtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWREeW5hbWljKTogdHlwZW9mIE1hc2tlZER5bmFtaWM7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzczxNYXNrIGV4dGVuZHMgdHlwZW9mIE1hc2tlZD4gKG1hc2s6IE1hc2spOiBNYXNrO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogUmVnRXhwKTogdHlwZW9mIE1hc2tlZFJlZ0V4cDtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6ICh2YWx1ZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkgPT4gYm9vbGVhbik6IHR5cGVvZiBNYXNrZWRGdW5jdGlvbjtcblxuICAvKiogR2V0IE1hc2tlZCBjbGFzcyBieSBtYXNrIHR5cGUgKi9cbiAgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzaykgLyogVE9ETyAqL3tcbiAgICBpZiAobWFzayA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJ21hc2sgcHJvcGVydHkgc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICBpZiAobWFzayBpbnN0YW5jZW9mIFJlZ0V4cCkgcmV0dXJuIElNYXNrLk1hc2tlZFJlZ0V4cDtcbiAgICBpZiAoaXNTdHJpbmcobWFzaykpIHJldHVybiBJTWFzay5NYXNrZWRQYXR0ZXJuO1xuICAgIGlmIChtYXNrID09PSBEYXRlKSByZXR1cm4gSU1hc2suTWFza2VkRGF0ZTtcbiAgICBpZiAobWFzayA9PT0gTnVtYmVyKSByZXR1cm4gSU1hc2suTWFza2VkTnVtYmVyO1xuICAgIGlmIChBcnJheS5pc0FycmF5KG1hc2spIHx8IG1hc2sgPT09IEFycmF5KSByZXR1cm4gSU1hc2suTWFza2VkRHluYW1pYztcbiAgICBpZiAoSU1hc2suTWFza2VkICYmIG1hc2sucHJvdG90eXBlIGluc3RhbmNlb2YgSU1hc2suTWFza2VkKSByZXR1cm4gbWFzaztcbiAgICBpZiAoSU1hc2suTWFza2VkICYmIG1hc2sgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWQpIHJldHVybiBtYXNrLmNvbnN0cnVjdG9yO1xuICAgIGlmIChtYXNrIGluc3RhbmNlb2YgRnVuY3Rpb24pIHJldHVybiBJTWFzay5NYXNrZWRGdW5jdGlvbjtcbiAgICBjb25zb2xlLndhcm4oJ01hc2sgbm90IGZvdW5kIGZvciBtYXNrJywgbWFzayk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgIHJldHVybiBJTWFzay5NYXNrZWQ7XG4gIH1cbiAgZnVuY3Rpb24gbm9ybWFsaXplT3B0cyhvcHRzKSB7XG4gICAgaWYgKCFvcHRzKSB0aHJvdyBuZXcgRXJyb3IoJ09wdGlvbnMgaW4gbm90IGRlZmluZWQnKTtcbiAgICBpZiAoSU1hc2suTWFza2VkKSB7XG4gICAgICBpZiAob3B0cy5wcm90b3R5cGUgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWQpIHJldHVybiB7XG4gICAgICAgIG1hc2s6IG9wdHNcbiAgICAgIH07XG5cbiAgICAgIC8qXG4gICAgICAgIGhhbmRsZSBjYXNlcyBsaWtlOlxuICAgICAgICAxKSBvcHRzID0gTWFza2VkXG4gICAgICAgIDIpIG9wdHMgPSB7IG1hc2s6IE1hc2tlZCwgLi4uaW5zdGFuY2VPcHRzIH1cbiAgICAgICovXG4gICAgICBjb25zdCB7XG4gICAgICAgIG1hc2sgPSB1bmRlZmluZWQsXG4gICAgICAgIC4uLmluc3RhbmNlT3B0c1xuICAgICAgfSA9IG9wdHMgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWQgPyB7XG4gICAgICAgIG1hc2s6IG9wdHNcbiAgICAgIH0gOiBpc09iamVjdChvcHRzKSAmJiBvcHRzLm1hc2sgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWQgPyBvcHRzIDoge307XG4gICAgICBpZiAobWFzaykge1xuICAgICAgICBjb25zdCBfbWFzayA9IG1hc2subWFzaztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5waWNrKG1hc2ssIChfLCBrKSA9PiAhay5zdGFydHNXaXRoKCdfJykpLFxuICAgICAgICAgIG1hc2s6IG1hc2suY29uc3RydWN0b3IsXG4gICAgICAgICAgX21hc2ssXG4gICAgICAgICAgLi4uaW5zdGFuY2VPcHRzXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNPYmplY3Qob3B0cykpIHJldHVybiB7XG4gICAgICBtYXNrOiBvcHRzXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgLi4ub3B0c1xuICAgIH07XG4gIH1cblxuICAvLyBUT0RPIGNhbid0IHVzZSBvdmVybG9hZHMgaGVyZSBiZWNhdXNlIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNTA3NTRcblxuICAvLyBGcm9tIG1hc2tlZFxuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWQsIFJldHVybk1hc2tlZD1PcHRzPiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gLy8gRnJvbSBtYXNrZWQgY2xhc3NcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkPUluc3RhbmNlVHlwZTxPcHRzWydtYXNrJ10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkRGF0ZT4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZERhdGU9TWFza2VkRGF0ZTxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWROdW1iZXI+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWROdW1iZXI9TWFza2VkTnVtYmVyPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZEVudW0+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRFbnVtPU1hc2tlZEVudW08T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkUmFuZ2U+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRSYW5nZT1NYXNrZWRSYW5nZTxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWRSZWdFeHA+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRSZWdFeHA9TWFza2VkUmVnRXhwPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZEZ1bmN0aW9uPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkRnVuY3Rpb249TWFza2VkRnVuY3Rpb248T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkUGF0dGVybj4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZFBhdHRlcm49TWFza2VkUGF0dGVybjxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWREeW5hbWljPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkRHluYW1pYz1NYXNrZWREeW5hbWljPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIC8vIEZyb20gbWFzayBvcHRzXG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8TWFza2VkPiwgUmV0dXJuTWFza2VkPU9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPGluZmVyIE0+ID8gTSA6IG5ldmVyPiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkTnVtYmVyT3B0aW9ucywgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkTnVtYmVyPU1hc2tlZE51bWJlcjxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWREYXRlRmFjdG9yeU9wdGlvbnMsIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZERhdGU9TWFza2VkRGF0ZTxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRFbnVtT3B0aW9ucywgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkRW51bT1NYXNrZWRFbnVtPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZFJhbmdlT3B0aW9ucywgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkUmFuZ2U9TWFza2VkUmFuZ2U8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkUGF0dGVybk9wdGlvbnMsIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZFBhdHRlcm49TWFza2VkUGF0dGVybjxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWREeW5hbWljT3B0aW9ucywgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkRHluYW1pYz1NYXNrZWREeW5hbWljPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8UmVnRXhwPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkUmVnRXhwPU1hc2tlZFJlZ0V4cDxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPEZ1bmN0aW9uPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkRnVuY3Rpb249TWFza2VkRnVuY3Rpb248T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcblxuICAvKiogQ3JlYXRlcyBuZXcge0BsaW5rIE1hc2tlZH0gZGVwZW5kaW5nIG9uIG1hc2sgdHlwZSAqL1xuICBmdW5jdGlvbiBjcmVhdGVNYXNrKG9wdHMpIHtcbiAgICBpZiAoSU1hc2suTWFza2VkICYmIG9wdHMgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWQpIHJldHVybiBvcHRzO1xuICAgIGNvbnN0IG5PcHRzID0gbm9ybWFsaXplT3B0cyhvcHRzKTtcbiAgICBjb25zdCBNYXNrZWRDbGFzcyA9IG1hc2tlZENsYXNzKG5PcHRzLm1hc2spO1xuICAgIGlmICghTWFza2VkQ2xhc3MpIHRocm93IG5ldyBFcnJvcihcIk1hc2tlZCBjbGFzcyBpcyBub3QgZm91bmQgZm9yIHByb3ZpZGVkIG1hc2sgXCIgKyBuT3B0cy5tYXNrICsgXCIsIGFwcHJvcHJpYXRlIG1vZHVsZSBuZWVkcyB0byBiZSBpbXBvcnRlZCBtYW51YWxseSBiZWZvcmUgY3JlYXRpbmcgbWFzay5cIik7XG4gICAgaWYgKG5PcHRzLm1hc2sgPT09IE1hc2tlZENsYXNzKSBkZWxldGUgbk9wdHMubWFzaztcbiAgICBpZiAobk9wdHMuX21hc2spIHtcbiAgICAgIG5PcHRzLm1hc2sgPSBuT3B0cy5fbWFzaztcbiAgICAgIGRlbGV0ZSBuT3B0cy5fbWFzaztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBNYXNrZWRDbGFzcyhuT3B0cyk7XG4gIH1cbiAgSU1hc2suY3JlYXRlTWFzayA9IGNyZWF0ZU1hc2s7XG5cbiAgLyoqICBHZW5lcmljIGVsZW1lbnQgQVBJIHRvIHVzZSB3aXRoIG1hc2sgKi9cbiAgY2xhc3MgTWFza0VsZW1lbnQge1xuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiBTYWZlbHkgcmV0dXJucyBzZWxlY3Rpb24gc3RhcnQgKi9cbiAgICBnZXQgc2VsZWN0aW9uU3RhcnQoKSB7XG4gICAgICBsZXQgc3RhcnQ7XG4gICAgICB0cnkge1xuICAgICAgICBzdGFydCA9IHRoaXMuX3Vuc2FmZVNlbGVjdGlvblN0YXJ0O1xuICAgICAgfSBjYXRjaCB7fVxuICAgICAgcmV0dXJuIHN0YXJ0ICE9IG51bGwgPyBzdGFydCA6IHRoaXMudmFsdWUubGVuZ3RoO1xuICAgIH1cblxuICAgIC8qKiBTYWZlbHkgcmV0dXJucyBzZWxlY3Rpb24gZW5kICovXG4gICAgZ2V0IHNlbGVjdGlvbkVuZCgpIHtcbiAgICAgIGxldCBlbmQ7XG4gICAgICB0cnkge1xuICAgICAgICBlbmQgPSB0aGlzLl91bnNhZmVTZWxlY3Rpb25FbmQ7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICByZXR1cm4gZW5kICE9IG51bGwgPyBlbmQgOiB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKiogU2FmZWx5IHNldHMgZWxlbWVudCBzZWxlY3Rpb24gKi9cbiAgICBzZWxlY3Qoc3RhcnQsIGVuZCkge1xuICAgICAgaWYgKHN0YXJ0ID09IG51bGwgfHwgZW5kID09IG51bGwgfHwgc3RhcnQgPT09IHRoaXMuc2VsZWN0aW9uU3RhcnQgJiYgZW5kID09PSB0aGlzLnNlbGVjdGlvbkVuZCkgcmV0dXJuO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5fdW5zYWZlU2VsZWN0KHN0YXJ0LCBlbmQpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cblxuICAgIC8qKiAqL1xuICAgIGdldCBpc0FjdGl2ZSgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuICB9XG4gIElNYXNrLk1hc2tFbGVtZW50ID0gTWFza0VsZW1lbnQ7XG5cbiAgY29uc3QgS0VZX1ogPSA5MDtcbiAgY29uc3QgS0VZX1kgPSA4OTtcblxuICAvKiogQnJpZGdlIGJldHdlZW4gSFRNTEVsZW1lbnQgYW5kIHtAbGluayBNYXNrZWR9ICovXG4gIGNsYXNzIEhUTUxNYXNrRWxlbWVudCBleHRlbmRzIE1hc2tFbGVtZW50IHtcbiAgICAvKiogSFRNTEVsZW1lbnQgdG8gdXNlIG1hc2sgb24gKi9cblxuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICBzdXBlcigpO1xuICAgICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgICAgdGhpcy5fb25LZXlkb3duID0gdGhpcy5fb25LZXlkb3duLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vbklucHV0ID0gdGhpcy5fb25JbnB1dC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25CZWZvcmVpbnB1dCA9IHRoaXMuX29uQmVmb3JlaW5wdXQuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uQ29tcG9zaXRpb25FbmQgPSB0aGlzLl9vbkNvbXBvc2l0aW9uRW5kLmJpbmQodGhpcyk7XG4gICAgfVxuICAgIGdldCByb290RWxlbWVudCgpIHtcbiAgICAgIHZhciBfdGhpcyRpbnB1dCRnZXRSb290Tm8sIF90aGlzJGlucHV0JGdldFJvb3RObzIsIF90aGlzJGlucHV0O1xuICAgICAgcmV0dXJuIChfdGhpcyRpbnB1dCRnZXRSb290Tm8gPSAoX3RoaXMkaW5wdXQkZ2V0Um9vdE5vMiA9IChfdGhpcyRpbnB1dCA9IHRoaXMuaW5wdXQpLmdldFJvb3ROb2RlKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkaW5wdXQkZ2V0Um9vdE5vMi5jYWxsKF90aGlzJGlucHV0KSkgIT0gbnVsbCA/IF90aGlzJGlucHV0JGdldFJvb3RObyA6IGRvY3VtZW50O1xuICAgIH1cblxuICAgIC8qKiBJcyBlbGVtZW50IGluIGZvY3VzICovXG4gICAgZ2V0IGlzQWN0aXZlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5wdXQgPT09IHRoaXMucm9vdEVsZW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICB9XG5cbiAgICAvKiogQmluZHMgSFRNTEVsZW1lbnQgZXZlbnRzIHRvIG1hc2sgaW50ZXJuYWwgZXZlbnRzICovXG4gICAgYmluZEV2ZW50cyhoYW5kbGVycykge1xuICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fb25LZXlkb3duKTtcbiAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB0aGlzLl9vbklucHV0KTtcbiAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JlaW5wdXQnLCB0aGlzLl9vbkJlZm9yZWlucHV0KTtcbiAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25lbmQnLCB0aGlzLl9vbkNvbXBvc2l0aW9uRW5kKTtcbiAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIGhhbmRsZXJzLmRyb3ApO1xuICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGhhbmRsZXJzLmNsaWNrKTtcbiAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBoYW5kbGVycy5mb2N1cyk7XG4gICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVycy5jb21taXQpO1xuICAgICAgdGhpcy5faGFuZGxlcnMgPSBoYW5kbGVycztcbiAgICB9XG4gICAgX29uS2V5ZG93bihlKSB7XG4gICAgICBpZiAodGhpcy5faGFuZGxlcnMucmVkbyAmJiAoZS5rZXlDb2RlID09PSBLRVlfWiAmJiBlLnNoaWZ0S2V5ICYmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5KSB8fCBlLmtleUNvZGUgPT09IEtFWV9ZICYmIGUuY3RybEtleSkpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlcnMucmVkbyhlKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9oYW5kbGVycy51bmRvICYmIGUua2V5Q29kZSA9PT0gS0VZX1ogJiYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkpKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZXJzLnVuZG8oZSk7XG4gICAgICB9XG4gICAgICBpZiAoIWUuaXNDb21wb3NpbmcpIHRoaXMuX2hhbmRsZXJzLnNlbGVjdGlvbkNoYW5nZShlKTtcbiAgICB9XG4gICAgX29uQmVmb3JlaW5wdXQoZSkge1xuICAgICAgaWYgKGUuaW5wdXRUeXBlID09PSAnaGlzdG9yeVVuZG8nICYmIHRoaXMuX2hhbmRsZXJzLnVuZG8pIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlcnMudW5kbyhlKTtcbiAgICAgIH1cbiAgICAgIGlmIChlLmlucHV0VHlwZSA9PT0gJ2hpc3RvcnlSZWRvJyAmJiB0aGlzLl9oYW5kbGVycy5yZWRvKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZXJzLnJlZG8oZSk7XG4gICAgICB9XG4gICAgfVxuICAgIF9vbkNvbXBvc2l0aW9uRW5kKGUpIHtcbiAgICAgIHRoaXMuX2hhbmRsZXJzLmlucHV0KGUpO1xuICAgIH1cbiAgICBfb25JbnB1dChlKSB7XG4gICAgICBpZiAoIWUuaXNDb21wb3NpbmcpIHRoaXMuX2hhbmRsZXJzLmlucHV0KGUpO1xuICAgIH1cblxuICAgIC8qKiBVbmJpbmRzIEhUTUxFbGVtZW50IGV2ZW50cyB0byBtYXNrIGludGVybmFsIGV2ZW50cyAqL1xuICAgIHVuYmluZEV2ZW50cygpIHtcbiAgICAgIHRoaXMuaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5ZG93bik7XG4gICAgICB0aGlzLmlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2lucHV0JywgdGhpcy5fb25JbnB1dCk7XG4gICAgICB0aGlzLmlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JlZm9yZWlucHV0JywgdGhpcy5fb25CZWZvcmVpbnB1dCk7XG4gICAgICB0aGlzLmlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvbXBvc2l0aW9uZW5kJywgdGhpcy5fb25Db21wb3NpdGlvbkVuZCk7XG4gICAgICB0aGlzLmlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLl9oYW5kbGVycy5kcm9wKTtcbiAgICAgIHRoaXMuaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9oYW5kbGVycy5jbGljayk7XG4gICAgICB0aGlzLmlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgdGhpcy5faGFuZGxlcnMuZm9jdXMpO1xuICAgICAgdGhpcy5pbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5faGFuZGxlcnMuY29tbWl0KTtcbiAgICAgIHRoaXMuX2hhbmRsZXJzID0ge307XG4gICAgfVxuICB9XG4gIElNYXNrLkhUTUxNYXNrRWxlbWVudCA9IEhUTUxNYXNrRWxlbWVudDtcblxuICAvKiogQnJpZGdlIGJldHdlZW4gSW5wdXRFbGVtZW50IGFuZCB7QGxpbmsgTWFza2VkfSAqL1xuICBjbGFzcyBIVE1MSW5wdXRNYXNrRWxlbWVudCBleHRlbmRzIEhUTUxNYXNrRWxlbWVudCB7XG4gICAgLyoqIElucHV0RWxlbWVudCB0byB1c2UgbWFzayBvbiAqL1xuXG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgIHN1cGVyKGlucHV0KTtcbiAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJucyBJbnB1dEVsZW1lbnQgc2VsZWN0aW9uIHN0YXJ0ICovXG4gICAgZ2V0IF91bnNhZmVTZWxlY3Rpb25TdGFydCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlucHV0LnNlbGVjdGlvblN0YXJ0ICE9IG51bGwgPyB0aGlzLmlucHV0LnNlbGVjdGlvblN0YXJ0IDogdGhpcy52YWx1ZS5sZW5ndGg7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgSW5wdXRFbGVtZW50IHNlbGVjdGlvbiBlbmQgKi9cbiAgICBnZXQgX3Vuc2FmZVNlbGVjdGlvbkVuZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlucHV0LnNlbGVjdGlvbkVuZDtcbiAgICB9XG5cbiAgICAvKiogU2V0cyBJbnB1dEVsZW1lbnQgc2VsZWN0aW9uICovXG4gICAgX3Vuc2FmZVNlbGVjdChzdGFydCwgZW5kKSB7XG4gICAgICB0aGlzLmlucHV0LnNldFNlbGVjdGlvblJhbmdlKHN0YXJ0LCBlbmQpO1xuICAgIH1cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnB1dC52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICB0aGlzLmlucHV0LnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIElNYXNrLkhUTUxNYXNrRWxlbWVudCA9IEhUTUxNYXNrRWxlbWVudDtcblxuICBjbGFzcyBIVE1MQ29udGVudGVkaXRhYmxlTWFza0VsZW1lbnQgZXh0ZW5kcyBIVE1MTWFza0VsZW1lbnQge1xuICAgIC8qKiBSZXR1cm5zIEhUTUxFbGVtZW50IHNlbGVjdGlvbiBzdGFydCAqL1xuICAgIGdldCBfdW5zYWZlU2VsZWN0aW9uU3RhcnQoKSB7XG4gICAgICBjb25zdCByb290ID0gdGhpcy5yb290RWxlbWVudDtcbiAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHJvb3QuZ2V0U2VsZWN0aW9uICYmIHJvb3QuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICBjb25zdCBhbmNob3JPZmZzZXQgPSBzZWxlY3Rpb24gJiYgc2VsZWN0aW9uLmFuY2hvck9mZnNldDtcbiAgICAgIGNvbnN0IGZvY3VzT2Zmc2V0ID0gc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5mb2N1c09mZnNldDtcbiAgICAgIGlmIChmb2N1c09mZnNldCA9PSBudWxsIHx8IGFuY2hvck9mZnNldCA9PSBudWxsIHx8IGFuY2hvck9mZnNldCA8IGZvY3VzT2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiBhbmNob3JPZmZzZXQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm9jdXNPZmZzZXQ7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgSFRNTEVsZW1lbnQgc2VsZWN0aW9uIGVuZCAqL1xuICAgIGdldCBfdW5zYWZlU2VsZWN0aW9uRW5kKCkge1xuICAgICAgY29uc3Qgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgICBjb25zdCBzZWxlY3Rpb24gPSByb290LmdldFNlbGVjdGlvbiAmJiByb290LmdldFNlbGVjdGlvbigpO1xuICAgICAgY29uc3QgYW5jaG9yT2Zmc2V0ID0gc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5hbmNob3JPZmZzZXQ7XG4gICAgICBjb25zdCBmb2N1c09mZnNldCA9IHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24uZm9jdXNPZmZzZXQ7XG4gICAgICBpZiAoZm9jdXNPZmZzZXQgPT0gbnVsbCB8fCBhbmNob3JPZmZzZXQgPT0gbnVsbCB8fCBhbmNob3JPZmZzZXQgPiBmb2N1c09mZnNldCkge1xuICAgICAgICByZXR1cm4gYW5jaG9yT2Zmc2V0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZvY3VzT2Zmc2V0O1xuICAgIH1cblxuICAgIC8qKiBTZXRzIEhUTUxFbGVtZW50IHNlbGVjdGlvbiAqL1xuICAgIF91bnNhZmVTZWxlY3Qoc3RhcnQsIGVuZCkge1xuICAgICAgaWYgKCF0aGlzLnJvb3RFbGVtZW50LmNyZWF0ZVJhbmdlKSByZXR1cm47XG4gICAgICBjb25zdCByYW5nZSA9IHRoaXMucm9vdEVsZW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgICAgIHJhbmdlLnNldFN0YXJ0KHRoaXMuaW5wdXQuZmlyc3RDaGlsZCB8fCB0aGlzLmlucHV0LCBzdGFydCk7XG4gICAgICByYW5nZS5zZXRFbmQodGhpcy5pbnB1dC5sYXN0Q2hpbGQgfHwgdGhpcy5pbnB1dCwgZW5kKTtcbiAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcm9vdC5nZXRTZWxlY3Rpb24gJiYgcm9vdC5nZXRTZWxlY3Rpb24oKTtcbiAgICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgICAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgICBzZWxlY3Rpb24uYWRkUmFuZ2UocmFuZ2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBIVE1MRWxlbWVudCB2YWx1ZSAqL1xuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlucHV0LnRleHRDb250ZW50IHx8ICcnO1xuICAgIH1cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgIHRoaXMuaW5wdXQudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgSU1hc2suSFRNTENvbnRlbnRlZGl0YWJsZU1hc2tFbGVtZW50ID0gSFRNTENvbnRlbnRlZGl0YWJsZU1hc2tFbGVtZW50O1xuXG4gIGNsYXNzIElucHV0SGlzdG9yeSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICB0aGlzLnN0YXRlcyA9IFtdO1xuICAgICAgdGhpcy5jdXJyZW50SW5kZXggPSAwO1xuICAgIH1cbiAgICBnZXQgY3VycmVudFN0YXRlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdGVzW3RoaXMuY3VycmVudEluZGV4XTtcbiAgICB9XG4gICAgZ2V0IGlzRW1wdHkoKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGF0ZXMubGVuZ3RoID09PSAwO1xuICAgIH1cbiAgICBwdXNoKHN0YXRlKSB7XG4gICAgICAvLyBpZiBjdXJyZW50IGluZGV4IHBvaW50cyBiZWZvcmUgdGhlIGxhc3QgZWxlbWVudCB0aGVuIHJlbW92ZSB0aGUgZnV0dXJlXG4gICAgICBpZiAodGhpcy5jdXJyZW50SW5kZXggPCB0aGlzLnN0YXRlcy5sZW5ndGggLSAxKSB0aGlzLnN0YXRlcy5sZW5ndGggPSB0aGlzLmN1cnJlbnRJbmRleCArIDE7XG4gICAgICB0aGlzLnN0YXRlcy5wdXNoKHN0YXRlKTtcbiAgICAgIGlmICh0aGlzLnN0YXRlcy5sZW5ndGggPiBJbnB1dEhpc3RvcnkuTUFYX0xFTkdUSCkgdGhpcy5zdGF0ZXMuc2hpZnQoKTtcbiAgICAgIHRoaXMuY3VycmVudEluZGV4ID0gdGhpcy5zdGF0ZXMubGVuZ3RoIC0gMTtcbiAgICB9XG4gICAgZ28oc3RlcHMpIHtcbiAgICAgIHRoaXMuY3VycmVudEluZGV4ID0gTWF0aC5taW4oTWF0aC5tYXgodGhpcy5jdXJyZW50SW5kZXggKyBzdGVwcywgMCksIHRoaXMuc3RhdGVzLmxlbmd0aCAtIDEpO1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFN0YXRlO1xuICAgIH1cbiAgICB1bmRvKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ28oLTEpO1xuICAgIH1cbiAgICByZWRvKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZ28oKzEpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgIHRoaXMuc3RhdGVzLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLmN1cnJlbnRJbmRleCA9IDA7XG4gICAgfVxuICB9XG4gIElucHV0SGlzdG9yeS5NQVhfTEVOR1RIID0gMTAwO1xuXG4gIC8qKiBMaXN0ZW5zIHRvIGVsZW1lbnQgZXZlbnRzIGFuZCBjb250cm9scyBjaGFuZ2VzIGJldHdlZW4gZWxlbWVudCBhbmQge0BsaW5rIE1hc2tlZH0gKi9cbiAgY2xhc3MgSW5wdXRNYXNrIHtcbiAgICAvKipcbiAgICAgIFZpZXcgZWxlbWVudFxuICAgICovXG5cbiAgICAvKiogSW50ZXJuYWwge0BsaW5rIE1hc2tlZH0gbW9kZWwgKi9cblxuICAgIGNvbnN0cnVjdG9yKGVsLCBvcHRzKSB7XG4gICAgICB0aGlzLmVsID0gZWwgaW5zdGFuY2VvZiBNYXNrRWxlbWVudCA/IGVsIDogZWwuaXNDb250ZW50RWRpdGFibGUgJiYgZWwudGFnTmFtZSAhPT0gJ0lOUFVUJyAmJiBlbC50YWdOYW1lICE9PSAnVEVYVEFSRUEnID8gbmV3IEhUTUxDb250ZW50ZWRpdGFibGVNYXNrRWxlbWVudChlbCkgOiBuZXcgSFRNTElucHV0TWFza0VsZW1lbnQoZWwpO1xuICAgICAgdGhpcy5tYXNrZWQgPSBjcmVhdGVNYXNrKG9wdHMpO1xuICAgICAgdGhpcy5fbGlzdGVuZXJzID0ge307XG4gICAgICB0aGlzLl92YWx1ZSA9ICcnO1xuICAgICAgdGhpcy5fdW5tYXNrZWRWYWx1ZSA9ICcnO1xuICAgICAgdGhpcy5fcmF3SW5wdXRWYWx1ZSA9ICcnO1xuICAgICAgdGhpcy5oaXN0b3J5ID0gbmV3IElucHV0SGlzdG9yeSgpO1xuICAgICAgdGhpcy5fc2F2ZVNlbGVjdGlvbiA9IHRoaXMuX3NhdmVTZWxlY3Rpb24uYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uSW5wdXQgPSB0aGlzLl9vbklucHV0LmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vbkNoYW5nZSA9IHRoaXMuX29uQ2hhbmdlLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vbkRyb3AgPSB0aGlzLl9vbkRyb3AuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uRm9jdXMgPSB0aGlzLl9vbkZvY3VzLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vbkNsaWNrID0gdGhpcy5fb25DbGljay5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25VbmRvID0gdGhpcy5fb25VbmRvLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vblJlZG8gPSB0aGlzLl9vblJlZG8uYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuYWxpZ25DdXJzb3IgPSB0aGlzLmFsaWduQ3Vyc29yLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLmFsaWduQ3Vyc29yRnJpZW5kbHkgPSB0aGlzLmFsaWduQ3Vyc29yRnJpZW5kbHkuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX2JpbmRFdmVudHMoKTtcblxuICAgICAgLy8gcmVmcmVzaFxuICAgICAgdGhpcy51cGRhdGVWYWx1ZSgpO1xuICAgICAgdGhpcy5fb25DaGFuZ2UoKTtcbiAgICB9XG4gICAgbWFza0VxdWFscyhtYXNrKSB7XG4gICAgICB2YXIgX3RoaXMkbWFza2VkO1xuICAgICAgcmV0dXJuIG1hc2sgPT0gbnVsbCB8fCAoKF90aGlzJG1hc2tlZCA9IHRoaXMubWFza2VkKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkbWFza2VkLm1hc2tFcXVhbHMobWFzaykpO1xuICAgIH1cblxuICAgIC8qKiBNYXNrZWQgKi9cbiAgICBnZXQgbWFzaygpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5tYXNrO1xuICAgIH1cbiAgICBzZXQgbWFzayhtYXNrKSB7XG4gICAgICBpZiAodGhpcy5tYXNrRXF1YWxzKG1hc2spKSByZXR1cm47XG4gICAgICBpZiAoIShtYXNrIGluc3RhbmNlb2YgSU1hc2suTWFza2VkKSAmJiB0aGlzLm1hc2tlZC5jb25zdHJ1Y3RvciA9PT0gbWFza2VkQ2xhc3MobWFzaykpIHtcbiAgICAgICAgLy8gVE9ETyBcImFueVwiIG5vIGlkZWFcbiAgICAgICAgdGhpcy5tYXNrZWQudXBkYXRlT3B0aW9ucyh7XG4gICAgICAgICAgbWFza1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbWFza2VkID0gbWFzayBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZCA/IG1hc2sgOiBjcmVhdGVNYXNrKHtcbiAgICAgICAgbWFza1xuICAgICAgfSk7XG4gICAgICBtYXNrZWQudW5tYXNrZWRWYWx1ZSA9IHRoaXMubWFza2VkLnVubWFza2VkVmFsdWU7XG4gICAgICB0aGlzLm1hc2tlZCA9IG1hc2tlZDtcbiAgICB9XG5cbiAgICAvKiogUmF3IHZhbHVlICovXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUoc3RyKSB7XG4gICAgICBpZiAodGhpcy52YWx1ZSA9PT0gc3RyKSByZXR1cm47XG4gICAgICB0aGlzLm1hc2tlZC52YWx1ZSA9IHN0cjtcbiAgICAgIHRoaXMudXBkYXRlQ29udHJvbCgnYXV0bycpO1xuICAgIH1cblxuICAgIC8qKiBVbm1hc2tlZCB2YWx1ZSAqL1xuICAgIGdldCB1bm1hc2tlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3VubWFza2VkVmFsdWU7XG4gICAgfVxuICAgIHNldCB1bm1hc2tlZFZhbHVlKHN0cikge1xuICAgICAgaWYgKHRoaXMudW5tYXNrZWRWYWx1ZSA9PT0gc3RyKSByZXR1cm47XG4gICAgICB0aGlzLm1hc2tlZC51bm1hc2tlZFZhbHVlID0gc3RyO1xuICAgICAgdGhpcy51cGRhdGVDb250cm9sKCdhdXRvJyk7XG4gICAgfVxuXG4gICAgLyoqIFJhdyBpbnB1dCB2YWx1ZSAqL1xuICAgIGdldCByYXdJbnB1dFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Jhd0lucHV0VmFsdWU7XG4gICAgfVxuICAgIHNldCByYXdJbnB1dFZhbHVlKHN0cikge1xuICAgICAgaWYgKHRoaXMucmF3SW5wdXRWYWx1ZSA9PT0gc3RyKSByZXR1cm47XG4gICAgICB0aGlzLm1hc2tlZC5yYXdJbnB1dFZhbHVlID0gc3RyO1xuICAgICAgdGhpcy51cGRhdGVDb250cm9sKCk7XG4gICAgICB0aGlzLmFsaWduQ3Vyc29yKCk7XG4gICAgfVxuXG4gICAgLyoqIFR5cGVkIHVubWFza2VkIHZhbHVlICovXG4gICAgZ2V0IHR5cGVkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQudHlwZWRWYWx1ZTtcbiAgICB9XG4gICAgc2V0IHR5cGVkVmFsdWUodmFsKSB7XG4gICAgICBpZiAodGhpcy5tYXNrZWQudHlwZWRWYWx1ZUVxdWFscyh2YWwpKSByZXR1cm47XG4gICAgICB0aGlzLm1hc2tlZC50eXBlZFZhbHVlID0gdmFsO1xuICAgICAgdGhpcy51cGRhdGVDb250cm9sKCdhdXRvJyk7XG4gICAgfVxuXG4gICAgLyoqIERpc3BsYXkgdmFsdWUgKi9cbiAgICBnZXQgZGlzcGxheVZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLmRpc3BsYXlWYWx1ZTtcbiAgICB9XG5cbiAgICAvKiogU3RhcnRzIGxpc3RlbmluZyB0byBlbGVtZW50IGV2ZW50cyAqL1xuICAgIF9iaW5kRXZlbnRzKCkge1xuICAgICAgdGhpcy5lbC5iaW5kRXZlbnRzKHtcbiAgICAgICAgc2VsZWN0aW9uQ2hhbmdlOiB0aGlzLl9zYXZlU2VsZWN0aW9uLFxuICAgICAgICBpbnB1dDogdGhpcy5fb25JbnB1dCxcbiAgICAgICAgZHJvcDogdGhpcy5fb25Ecm9wLFxuICAgICAgICBjbGljazogdGhpcy5fb25DbGljayxcbiAgICAgICAgZm9jdXM6IHRoaXMuX29uRm9jdXMsXG4gICAgICAgIGNvbW1pdDogdGhpcy5fb25DaGFuZ2UsXG4gICAgICAgIHVuZG86IHRoaXMuX29uVW5kbyxcbiAgICAgICAgcmVkbzogdGhpcy5fb25SZWRvXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKiogU3RvcHMgbGlzdGVuaW5nIHRvIGVsZW1lbnQgZXZlbnRzICovXG4gICAgX3VuYmluZEV2ZW50cygpIHtcbiAgICAgIGlmICh0aGlzLmVsKSB0aGlzLmVsLnVuYmluZEV2ZW50cygpO1xuICAgIH1cblxuICAgIC8qKiBGaXJlcyBjdXN0b20gZXZlbnQgKi9cbiAgICBfZmlyZUV2ZW50KGV2LCBlKSB7XG4gICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnNbZXZdO1xuICAgICAgaWYgKCFsaXN0ZW5lcnMpIHJldHVybjtcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGwgPT4gbChlKSk7XG4gICAgfVxuXG4gICAgLyoqIEN1cnJlbnQgc2VsZWN0aW9uIHN0YXJ0ICovXG4gICAgZ2V0IHNlbGVjdGlvblN0YXJ0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2N1cnNvckNoYW5naW5nID8gdGhpcy5fY2hhbmdpbmdDdXJzb3JQb3MgOiB0aGlzLmVsLnNlbGVjdGlvblN0YXJ0O1xuICAgIH1cblxuICAgIC8qKiBDdXJyZW50IGN1cnNvciBwb3NpdGlvbiAqL1xuICAgIGdldCBjdXJzb3JQb3MoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY3Vyc29yQ2hhbmdpbmcgPyB0aGlzLl9jaGFuZ2luZ0N1cnNvclBvcyA6IHRoaXMuZWwuc2VsZWN0aW9uRW5kO1xuICAgIH1cbiAgICBzZXQgY3Vyc29yUG9zKHBvcykge1xuICAgICAgaWYgKCF0aGlzLmVsIHx8ICF0aGlzLmVsLmlzQWN0aXZlKSByZXR1cm47XG4gICAgICB0aGlzLmVsLnNlbGVjdChwb3MsIHBvcyk7XG4gICAgICB0aGlzLl9zYXZlU2VsZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqIFN0b3JlcyBjdXJyZW50IHNlbGVjdGlvbiAqL1xuICAgIF9zYXZlU2VsZWN0aW9uKCAvKiBldiAqL1xuICAgICkge1xuICAgICAgaWYgKHRoaXMuZGlzcGxheVZhbHVlICE9PSB0aGlzLmVsLnZhbHVlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRWxlbWVudCB2YWx1ZSB3YXMgY2hhbmdlZCBvdXRzaWRlIG9mIG1hc2suIFN5bmNyb25pemUgbWFzayB1c2luZyBgbWFzay51cGRhdGVWYWx1ZSgpYCB0byB3b3JrIHByb3Blcmx5LicpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NlbGVjdGlvbiA9IHtcbiAgICAgICAgc3RhcnQ6IHRoaXMuc2VsZWN0aW9uU3RhcnQsXG4gICAgICAgIGVuZDogdGhpcy5jdXJzb3JQb3NcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqIFN5bmNyb25pemVzIG1vZGVsIHZhbHVlIGZyb20gdmlldyAqL1xuICAgIHVwZGF0ZVZhbHVlKCkge1xuICAgICAgdGhpcy5tYXNrZWQudmFsdWUgPSB0aGlzLmVsLnZhbHVlO1xuICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLm1hc2tlZC52YWx1ZTtcbiAgICAgIHRoaXMuX3VubWFza2VkVmFsdWUgPSB0aGlzLm1hc2tlZC51bm1hc2tlZFZhbHVlO1xuICAgICAgdGhpcy5fcmF3SW5wdXRWYWx1ZSA9IHRoaXMubWFza2VkLnJhd0lucHV0VmFsdWU7XG4gICAgfVxuXG4gICAgLyoqIFN5bmNyb25pemVzIHZpZXcgZnJvbSBtb2RlbCB2YWx1ZSwgZmlyZXMgY2hhbmdlIGV2ZW50cyAqL1xuICAgIHVwZGF0ZUNvbnRyb2woY3Vyc29yUG9zKSB7XG4gICAgICBjb25zdCBuZXdVbm1hc2tlZFZhbHVlID0gdGhpcy5tYXNrZWQudW5tYXNrZWRWYWx1ZTtcbiAgICAgIGNvbnN0IG5ld1ZhbHVlID0gdGhpcy5tYXNrZWQudmFsdWU7XG4gICAgICBjb25zdCBuZXdSYXdJbnB1dFZhbHVlID0gdGhpcy5tYXNrZWQucmF3SW5wdXRWYWx1ZTtcbiAgICAgIGNvbnN0IG5ld0Rpc3BsYXlWYWx1ZSA9IHRoaXMuZGlzcGxheVZhbHVlO1xuICAgICAgY29uc3QgaXNDaGFuZ2VkID0gdGhpcy51bm1hc2tlZFZhbHVlICE9PSBuZXdVbm1hc2tlZFZhbHVlIHx8IHRoaXMudmFsdWUgIT09IG5ld1ZhbHVlIHx8IHRoaXMuX3Jhd0lucHV0VmFsdWUgIT09IG5ld1Jhd0lucHV0VmFsdWU7XG4gICAgICB0aGlzLl91bm1hc2tlZFZhbHVlID0gbmV3VW5tYXNrZWRWYWx1ZTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gbmV3VmFsdWU7XG4gICAgICB0aGlzLl9yYXdJbnB1dFZhbHVlID0gbmV3UmF3SW5wdXRWYWx1ZTtcbiAgICAgIGlmICh0aGlzLmVsLnZhbHVlICE9PSBuZXdEaXNwbGF5VmFsdWUpIHRoaXMuZWwudmFsdWUgPSBuZXdEaXNwbGF5VmFsdWU7XG4gICAgICBpZiAoY3Vyc29yUG9zID09PSAnYXV0bycpIHRoaXMuYWxpZ25DdXJzb3IoKTtlbHNlIGlmIChjdXJzb3JQb3MgIT0gbnVsbCkgdGhpcy5jdXJzb3JQb3MgPSBjdXJzb3JQb3M7XG4gICAgICBpZiAoaXNDaGFuZ2VkKSB0aGlzLl9maXJlQ2hhbmdlRXZlbnRzKCk7XG4gICAgICBpZiAoIXRoaXMuX2hpc3RvcnlDaGFuZ2luZyAmJiAoaXNDaGFuZ2VkIHx8IHRoaXMuaGlzdG9yeS5pc0VtcHR5KSkgdGhpcy5oaXN0b3J5LnB1c2goe1xuICAgICAgICB1bm1hc2tlZFZhbHVlOiBuZXdVbm1hc2tlZFZhbHVlLFxuICAgICAgICBzZWxlY3Rpb246IHtcbiAgICAgICAgICBzdGFydDogdGhpcy5zZWxlY3Rpb25TdGFydCxcbiAgICAgICAgICBlbmQ6IHRoaXMuY3Vyc29yUG9zXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKiBVcGRhdGVzIG9wdGlvbnMgd2l0aCBkZWVwIGVxdWFsIGNoZWNrLCByZWNyZWF0ZXMge0BsaW5rIE1hc2tlZH0gbW9kZWwgaWYgbWFzayB0eXBlIGNoYW5nZXMgKi9cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbWFzayxcbiAgICAgICAgLi4ucmVzdE9wdHNcbiAgICAgIH0gPSBvcHRzOyAvLyBUT0RPIHR5cGVzLCB5ZXMsIG1hc2sgaXMgb3B0aW9uYWxcblxuICAgICAgY29uc3QgdXBkYXRlTWFzayA9ICF0aGlzLm1hc2tFcXVhbHMobWFzayk7XG4gICAgICBjb25zdCB1cGRhdGVPcHRzID0gdGhpcy5tYXNrZWQub3B0aW9uc0lzQ2hhbmdlZChyZXN0T3B0cyk7XG4gICAgICBpZiAodXBkYXRlTWFzaykgdGhpcy5tYXNrID0gbWFzaztcbiAgICAgIGlmICh1cGRhdGVPcHRzKSB0aGlzLm1hc2tlZC51cGRhdGVPcHRpb25zKHJlc3RPcHRzKTsgLy8gVE9ET1xuXG4gICAgICBpZiAodXBkYXRlTWFzayB8fCB1cGRhdGVPcHRzKSB0aGlzLnVwZGF0ZUNvbnRyb2woKTtcbiAgICB9XG5cbiAgICAvKiogVXBkYXRlcyBjdXJzb3IgKi9cbiAgICB1cGRhdGVDdXJzb3IoY3Vyc29yUG9zKSB7XG4gICAgICBpZiAoY3Vyc29yUG9zID09IG51bGwpIHJldHVybjtcbiAgICAgIHRoaXMuY3Vyc29yUG9zID0gY3Vyc29yUG9zO1xuXG4gICAgICAvLyBhbHNvIHF1ZXVlIGNoYW5nZSBjdXJzb3IgZm9yIG1vYmlsZSBicm93c2Vyc1xuICAgICAgdGhpcy5fZGVsYXlVcGRhdGVDdXJzb3IoY3Vyc29yUG9zKTtcbiAgICB9XG5cbiAgICAvKiogRGVsYXlzIGN1cnNvciB1cGRhdGUgdG8gc3VwcG9ydCBtb2JpbGUgYnJvd3NlcnMgKi9cbiAgICBfZGVsYXlVcGRhdGVDdXJzb3IoY3Vyc29yUG9zKSB7XG4gICAgICB0aGlzLl9hYm9ydFVwZGF0ZUN1cnNvcigpO1xuICAgICAgdGhpcy5fY2hhbmdpbmdDdXJzb3JQb3MgPSBjdXJzb3JQb3M7XG4gICAgICB0aGlzLl9jdXJzb3JDaGFuZ2luZyA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuZWwpIHJldHVybjsgLy8gaWYgd2FzIGRlc3Ryb3llZFxuICAgICAgICB0aGlzLmN1cnNvclBvcyA9IHRoaXMuX2NoYW5naW5nQ3Vyc29yUG9zO1xuICAgICAgICB0aGlzLl9hYm9ydFVwZGF0ZUN1cnNvcigpO1xuICAgICAgfSwgMTApO1xuICAgIH1cblxuICAgIC8qKiBGaXJlcyBjdXN0b20gZXZlbnRzICovXG4gICAgX2ZpcmVDaGFuZ2VFdmVudHMoKSB7XG4gICAgICB0aGlzLl9maXJlRXZlbnQoJ2FjY2VwdCcsIHRoaXMuX2lucHV0RXZlbnQpO1xuICAgICAgaWYgKHRoaXMubWFza2VkLmlzQ29tcGxldGUpIHRoaXMuX2ZpcmVFdmVudCgnY29tcGxldGUnLCB0aGlzLl9pbnB1dEV2ZW50KTtcbiAgICB9XG5cbiAgICAvKiogQWJvcnRzIGRlbGF5ZWQgY3Vyc29yIHVwZGF0ZSAqL1xuICAgIF9hYm9ydFVwZGF0ZUN1cnNvcigpIHtcbiAgICAgIGlmICh0aGlzLl9jdXJzb3JDaGFuZ2luZykge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fY3Vyc29yQ2hhbmdpbmcpO1xuICAgICAgICBkZWxldGUgdGhpcy5fY3Vyc29yQ2hhbmdpbmc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqIEFsaWducyBjdXJzb3IgdG8gbmVhcmVzdCBhdmFpbGFibGUgcG9zaXRpb24gKi9cbiAgICBhbGlnbkN1cnNvcigpIHtcbiAgICAgIHRoaXMuY3Vyc29yUG9zID0gdGhpcy5tYXNrZWQubmVhcmVzdElucHV0UG9zKHRoaXMubWFza2VkLm5lYXJlc3RJbnB1dFBvcyh0aGlzLmN1cnNvclBvcywgRElSRUNUSU9OLkxFRlQpKTtcbiAgICB9XG5cbiAgICAvKiogQWxpZ25zIGN1cnNvciBvbmx5IGlmIHNlbGVjdGlvbiBpcyBlbXB0eSAqL1xuICAgIGFsaWduQ3Vyc29yRnJpZW5kbHkoKSB7XG4gICAgICBpZiAodGhpcy5zZWxlY3Rpb25TdGFydCAhPT0gdGhpcy5jdXJzb3JQb3MpIHJldHVybjsgLy8gc2tpcCBpZiByYW5nZSBpcyBzZWxlY3RlZFxuICAgICAgdGhpcy5hbGlnbkN1cnNvcigpO1xuICAgIH1cblxuICAgIC8qKiBBZGRzIGxpc3RlbmVyIG9uIGN1c3RvbSBldmVudCAqL1xuICAgIG9uKGV2LCBoYW5kbGVyKSB7XG4gICAgICBpZiAoIXRoaXMuX2xpc3RlbmVyc1tldl0pIHRoaXMuX2xpc3RlbmVyc1tldl0gPSBbXTtcbiAgICAgIHRoaXMuX2xpc3RlbmVyc1tldl0ucHVzaChoYW5kbGVyKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBSZW1vdmVzIGN1c3RvbSBldmVudCBsaXN0ZW5lciAqL1xuICAgIG9mZihldiwgaGFuZGxlcikge1xuICAgICAgaWYgKCF0aGlzLl9saXN0ZW5lcnNbZXZdKSByZXR1cm4gdGhpcztcbiAgICAgIGlmICghaGFuZGxlcikge1xuICAgICAgICBkZWxldGUgdGhpcy5fbGlzdGVuZXJzW2V2XTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBjb25zdCBoSW5kZXggPSB0aGlzLl9saXN0ZW5lcnNbZXZdLmluZGV4T2YoaGFuZGxlcik7XG4gICAgICBpZiAoaEluZGV4ID49IDApIHRoaXMuX2xpc3RlbmVyc1tldl0uc3BsaWNlKGhJbmRleCwgMSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogSGFuZGxlcyB2aWV3IGlucHV0IGV2ZW50ICovXG4gICAgX29uSW5wdXQoZSkge1xuICAgICAgdGhpcy5faW5wdXRFdmVudCA9IGU7XG4gICAgICB0aGlzLl9hYm9ydFVwZGF0ZUN1cnNvcigpO1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBBY3Rpb25EZXRhaWxzKHtcbiAgICAgICAgLy8gbmV3IHN0YXRlXG4gICAgICAgIHZhbHVlOiB0aGlzLmVsLnZhbHVlLFxuICAgICAgICBjdXJzb3JQb3M6IHRoaXMuY3Vyc29yUG9zLFxuICAgICAgICAvLyBvbGQgc3RhdGVcbiAgICAgICAgb2xkVmFsdWU6IHRoaXMuZGlzcGxheVZhbHVlLFxuICAgICAgICBvbGRTZWxlY3Rpb246IHRoaXMuX3NlbGVjdGlvblxuICAgICAgfSk7XG4gICAgICBjb25zdCBvbGRSYXdWYWx1ZSA9IHRoaXMubWFza2VkLnJhd0lucHV0VmFsdWU7XG4gICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLm1hc2tlZC5zcGxpY2UoZGV0YWlscy5zdGFydENoYW5nZVBvcywgZGV0YWlscy5yZW1vdmVkLmxlbmd0aCwgZGV0YWlscy5pbnNlcnRlZCwgZGV0YWlscy5yZW1vdmVEaXJlY3Rpb24sIHtcbiAgICAgICAgaW5wdXQ6IHRydWUsXG4gICAgICAgIHJhdzogdHJ1ZVxuICAgICAgfSkub2Zmc2V0O1xuXG4gICAgICAvLyBmb3JjZSBhbGlnbiBpbiByZW1vdmUgZGlyZWN0aW9uIG9ubHkgaWYgbm8gaW5wdXQgY2hhcnMgd2VyZSByZW1vdmVkXG4gICAgICAvLyBvdGhlcndpc2Ugd2Ugc3RpbGwgbmVlZCB0byBhbGlnbiB3aXRoIE5PTkUgKHRvIGdldCBvdXQgZnJvbSBmaXhlZCBzeW1ib2xzIGZvciBpbnN0YW5jZSlcbiAgICAgIGNvbnN0IHJlbW92ZURpcmVjdGlvbiA9IG9sZFJhd1ZhbHVlID09PSB0aGlzLm1hc2tlZC5yYXdJbnB1dFZhbHVlID8gZGV0YWlscy5yZW1vdmVEaXJlY3Rpb24gOiBESVJFQ1RJT04uTk9ORTtcbiAgICAgIGxldCBjdXJzb3JQb3MgPSB0aGlzLm1hc2tlZC5uZWFyZXN0SW5wdXRQb3MoZGV0YWlscy5zdGFydENoYW5nZVBvcyArIG9mZnNldCwgcmVtb3ZlRGlyZWN0aW9uKTtcbiAgICAgIGlmIChyZW1vdmVEaXJlY3Rpb24gIT09IERJUkVDVElPTi5OT05FKSBjdXJzb3JQb3MgPSB0aGlzLm1hc2tlZC5uZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBESVJFQ1RJT04uTk9ORSk7XG4gICAgICB0aGlzLnVwZGF0ZUNvbnRyb2woY3Vyc29yUG9zKTtcbiAgICAgIGRlbGV0ZSB0aGlzLl9pbnB1dEV2ZW50O1xuICAgIH1cblxuICAgIC8qKiBIYW5kbGVzIHZpZXcgY2hhbmdlIGV2ZW50IGFuZCBjb21taXRzIG1vZGVsIHZhbHVlICovXG4gICAgX29uQ2hhbmdlKCkge1xuICAgICAgaWYgKHRoaXMuZGlzcGxheVZhbHVlICE9PSB0aGlzLmVsLnZhbHVlKSB0aGlzLnVwZGF0ZVZhbHVlKCk7XG4gICAgICB0aGlzLm1hc2tlZC5kb0NvbW1pdCgpO1xuICAgICAgdGhpcy51cGRhdGVDb250cm9sKCk7XG4gICAgICB0aGlzLl9zYXZlU2VsZWN0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqIEhhbmRsZXMgdmlldyBkcm9wIGV2ZW50LCBwcmV2ZW50cyBieSBkZWZhdWx0ICovXG4gICAgX29uRHJvcChldikge1xuICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIC8qKiBSZXN0b3JlIGxhc3Qgc2VsZWN0aW9uIG9uIGZvY3VzICovXG4gICAgX29uRm9jdXMoZXYpIHtcbiAgICAgIHRoaXMuYWxpZ25DdXJzb3JGcmllbmRseSgpO1xuICAgIH1cblxuICAgIC8qKiBSZXN0b3JlIGxhc3Qgc2VsZWN0aW9uIG9uIGZvY3VzICovXG4gICAgX29uQ2xpY2soZXYpIHtcbiAgICAgIHRoaXMuYWxpZ25DdXJzb3JGcmllbmRseSgpO1xuICAgIH1cbiAgICBfb25VbmRvKCkge1xuICAgICAgdGhpcy5fYXBwbHlIaXN0b3J5U3RhdGUodGhpcy5oaXN0b3J5LnVuZG8oKSk7XG4gICAgfVxuICAgIF9vblJlZG8oKSB7XG4gICAgICB0aGlzLl9hcHBseUhpc3RvcnlTdGF0ZSh0aGlzLmhpc3RvcnkucmVkbygpKTtcbiAgICB9XG4gICAgX2FwcGx5SGlzdG9yeVN0YXRlKHN0YXRlKSB7XG4gICAgICBpZiAoIXN0YXRlKSByZXR1cm47XG4gICAgICB0aGlzLl9oaXN0b3J5Q2hhbmdpbmcgPSB0cnVlO1xuICAgICAgdGhpcy51bm1hc2tlZFZhbHVlID0gc3RhdGUudW5tYXNrZWRWYWx1ZTtcbiAgICAgIHRoaXMuZWwuc2VsZWN0KHN0YXRlLnNlbGVjdGlvbi5zdGFydCwgc3RhdGUuc2VsZWN0aW9uLmVuZCk7XG4gICAgICB0aGlzLl9zYXZlU2VsZWN0aW9uKCk7XG4gICAgICB0aGlzLl9oaXN0b3J5Q2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvKiogVW5iaW5kIHZpZXcgZXZlbnRzIGFuZCByZW1vdmVzIGVsZW1lbnQgcmVmZXJlbmNlICovXG4gICAgZGVzdHJveSgpIHtcbiAgICAgIHRoaXMuX3VuYmluZEV2ZW50cygpO1xuICAgICAgdGhpcy5fbGlzdGVuZXJzLmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5lbDtcbiAgICB9XG4gIH1cbiAgSU1hc2suSW5wdXRNYXNrID0gSW5wdXRNYXNrO1xuXG4gIC8qKiBQcm92aWRlcyBkZXRhaWxzIG9mIGNoYW5naW5nIG1vZGVsIHZhbHVlICovXG4gIGNsYXNzIENoYW5nZURldGFpbHMge1xuICAgIC8qKiBJbnNlcnRlZCBzeW1ib2xzICovXG5cbiAgICAvKiogQWRkaXRpb25hbCBvZmZzZXQgaWYgYW55IGNoYW5nZXMgb2NjdXJyZWQgYmVmb3JlIHRhaWwgKi9cblxuICAgIC8qKiBSYXcgaW5zZXJ0ZWQgaXMgdXNlZCBieSBkeW5hbWljIG1hc2sgKi9cblxuICAgIC8qKiBDYW4gc2tpcCBjaGFycyAqL1xuXG4gICAgc3RhdGljIG5vcm1hbGl6ZShwcmVwKSB7XG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShwcmVwKSA/IHByZXAgOiBbcHJlcCwgbmV3IENoYW5nZURldGFpbHMoKV07XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKGRldGFpbHMpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywge1xuICAgICAgICBpbnNlcnRlZDogJycsXG4gICAgICAgIHJhd0luc2VydGVkOiAnJyxcbiAgICAgICAgdGFpbFNoaWZ0OiAwLFxuICAgICAgICBza2lwOiBmYWxzZVxuICAgICAgfSwgZGV0YWlscyk7XG4gICAgfVxuXG4gICAgLyoqIEFnZ3JlZ2F0ZSBjaGFuZ2VzICovXG4gICAgYWdncmVnYXRlKGRldGFpbHMpIHtcbiAgICAgIHRoaXMuaW5zZXJ0ZWQgKz0gZGV0YWlscy5pbnNlcnRlZDtcbiAgICAgIHRoaXMucmF3SW5zZXJ0ZWQgKz0gZGV0YWlscy5yYXdJbnNlcnRlZDtcbiAgICAgIHRoaXMudGFpbFNoaWZ0ICs9IGRldGFpbHMudGFpbFNoaWZ0O1xuICAgICAgdGhpcy5za2lwID0gdGhpcy5za2lwIHx8IGRldGFpbHMuc2tpcDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBUb3RhbCBvZmZzZXQgY29uc2lkZXJpbmcgYWxsIGNoYW5nZXMgKi9cbiAgICBnZXQgb2Zmc2V0KCkge1xuICAgICAgcmV0dXJuIHRoaXMudGFpbFNoaWZ0ICsgdGhpcy5pbnNlcnRlZC5sZW5ndGg7XG4gICAgfVxuICAgIGdldCBjb25zdW1lZCgpIHtcbiAgICAgIHJldHVybiBCb29sZWFuKHRoaXMucmF3SW5zZXJ0ZWQpIHx8IHRoaXMuc2tpcDtcbiAgICB9XG4gICAgZXF1YWxzKGRldGFpbHMpIHtcbiAgICAgIHJldHVybiB0aGlzLmluc2VydGVkID09PSBkZXRhaWxzLmluc2VydGVkICYmIHRoaXMudGFpbFNoaWZ0ID09PSBkZXRhaWxzLnRhaWxTaGlmdCAmJiB0aGlzLnJhd0luc2VydGVkID09PSBkZXRhaWxzLnJhd0luc2VydGVkICYmIHRoaXMuc2tpcCA9PT0gZGV0YWlscy5za2lwO1xuICAgIH1cbiAgfVxuICBJTWFzay5DaGFuZ2VEZXRhaWxzID0gQ2hhbmdlRGV0YWlscztcblxuICAvKiogUHJvdmlkZXMgZGV0YWlscyBvZiBjb250aW51b3VzIGV4dHJhY3RlZCB0YWlsICovXG4gIGNsYXNzIENvbnRpbnVvdXNUYWlsRGV0YWlscyB7XG4gICAgLyoqIFRhaWwgdmFsdWUgYXMgc3RyaW5nICovXG5cbiAgICAvKiogVGFpbCBzdGFydCBwb3NpdGlvbiAqL1xuXG4gICAgLyoqIFN0YXJ0IHBvc2l0aW9uICovXG5cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgZnJvbSwgc3RvcCkge1xuICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcbiAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgIH1cbiAgICAgIGlmIChmcm9tID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbSA9IDA7XG4gICAgICB9XG4gICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICB0aGlzLmZyb20gPSBmcm9tO1xuICAgICAgdGhpcy5zdG9wID0gc3RvcDtcbiAgICB9XG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gICAgZXh0ZW5kKHRhaWwpIHtcbiAgICAgIHRoaXMudmFsdWUgKz0gU3RyaW5nKHRhaWwpO1xuICAgIH1cbiAgICBhcHBlbmRUbyhtYXNrZWQpIHtcbiAgICAgIHJldHVybiBtYXNrZWQuYXBwZW5kKHRoaXMudG9TdHJpbmcoKSwge1xuICAgICAgICB0YWlsOiB0cnVlXG4gICAgICB9KS5hZ2dyZWdhdGUobWFza2VkLl9hcHBlbmRQbGFjZWhvbGRlcigpKTtcbiAgICB9XG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgIGZyb206IHRoaXMuZnJvbSxcbiAgICAgICAgc3RvcDogdGhpcy5zdG9wXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXQgc3RhdGUoc3RhdGUpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgc3RhdGUpO1xuICAgIH1cbiAgICB1bnNoaWZ0KGJlZm9yZVBvcykge1xuICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aCB8fCBiZWZvcmVQb3MgIT0gbnVsbCAmJiB0aGlzLmZyb20gPj0gYmVmb3JlUG9zKSByZXR1cm4gJyc7XG4gICAgICBjb25zdCBzaGlmdENoYXIgPSB0aGlzLnZhbHVlWzBdO1xuICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gc2hpZnRDaGFyO1xuICAgIH1cbiAgICBzaGlmdCgpIHtcbiAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpIHJldHVybiAnJztcbiAgICAgIGNvbnN0IHNoaWZ0Q2hhciA9IHRoaXMudmFsdWVbdGhpcy52YWx1ZS5sZW5ndGggLSAxXTtcbiAgICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlLnNsaWNlKDAsIC0xKTtcbiAgICAgIHJldHVybiBzaGlmdENoYXI7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFwcGVuZCBmbGFncyAqL1xuXG4gIC8qKiBFeHRyYWN0IGZsYWdzICovXG5cbiAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvNjIyM1xuXG4gIC8qKiBQcm92aWRlcyBjb21tb24gbWFza2luZyBzdHVmZiAqL1xuICBjbGFzcyBNYXNrZWQge1xuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogVHJhbnNmb3JtcyB2YWx1ZSBiZWZvcmUgbWFzayBwcm9jZXNzaW5nICovXG5cbiAgICAvKiogVHJhbnNmb3JtcyBlYWNoIGNoYXIgYmVmb3JlIG1hc2sgcHJvY2Vzc2luZyAqL1xuXG4gICAgLyoqIFZhbGlkYXRlcyBpZiB2YWx1ZSBpcyBhY2NlcHRhYmxlICovXG5cbiAgICAvKiogRG9lcyBhZGRpdGlvbmFsIHByb2Nlc3NpbmcgYXQgdGhlIGVuZCBvZiBlZGl0aW5nICovXG5cbiAgICAvKiogRm9ybWF0IHR5cGVkIHZhbHVlIHRvIHN0cmluZyAqL1xuXG4gICAgLyoqIFBhcnNlIHN0cmluZyB0byBnZXQgdHlwZWQgdmFsdWUgKi9cblxuICAgIC8qKiBFbmFibGUgY2hhcmFjdGVycyBvdmVyd3JpdGluZyAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICB0aGlzLl92YWx1ZSA9ICcnO1xuICAgICAgdGhpcy5fdXBkYXRlKHtcbiAgICAgICAgLi4uTWFza2VkLkRFRkFVTFRTLFxuICAgICAgICAuLi5vcHRzXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKiogU2V0cyBhbmQgYXBwbGllcyBuZXcgb3B0aW9ucyAqL1xuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnNJc0NoYW5nZWQob3B0cykpIHJldHVybjtcbiAgICAgIHRoaXMud2l0aFZhbHVlUmVmcmVzaCh0aGlzLl91cGRhdGUuYmluZCh0aGlzLCBvcHRzKSk7XG4gICAgfVxuXG4gICAgLyoqIFNldHMgbmV3IG9wdGlvbnMgKi9cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgb3B0cyk7XG4gICAgfVxuXG4gICAgLyoqIE1hc2sgc3RhdGUgKi9cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBfdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgIF9yYXdJbnB1dFZhbHVlOiB0aGlzLnJhd0lucHV0VmFsdWVcbiAgICAgIH07XG4gICAgfVxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xuICAgICAgdGhpcy5fdmFsdWUgPSBzdGF0ZS5fdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqIFJlc2V0cyB2YWx1ZSAqL1xuICAgIHJlc2V0KCkge1xuICAgICAgdGhpcy5fdmFsdWUgPSAnJztcbiAgICB9XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgIHRoaXMucmVzb2x2ZSh2YWx1ZSwge1xuICAgICAgICBpbnB1dDogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqIFJlc29sdmUgbmV3IHZhbHVlICovXG4gICAgcmVzb2x2ZSh2YWx1ZSwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge1xuICAgICAgICAgIGlucHV0OiB0cnVlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICB0aGlzLmFwcGVuZCh2YWx1ZSwgZmxhZ3MsICcnKTtcbiAgICAgIHRoaXMuZG9Db21taXQoKTtcbiAgICB9XG4gICAgZ2V0IHVubWFza2VkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gICAgc2V0IHVubWFza2VkVmFsdWUodmFsdWUpIHtcbiAgICAgIHRoaXMucmVzb2x2ZSh2YWx1ZSwge30pO1xuICAgIH1cbiAgICBnZXQgdHlwZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlID8gdGhpcy5wYXJzZSh0aGlzLnZhbHVlLCB0aGlzKSA6IHRoaXMudW5tYXNrZWRWYWx1ZTtcbiAgICB9XG4gICAgc2V0IHR5cGVkVmFsdWUodmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmZvcm1hdCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5mb3JtYXQodmFsdWUsIHRoaXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51bm1hc2tlZFZhbHVlID0gU3RyaW5nKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogVmFsdWUgdGhhdCBpbmNsdWRlcyByYXcgdXNlciBpbnB1dCAqL1xuICAgIGdldCByYXdJbnB1dFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXh0cmFjdElucHV0KDAsIHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCwge1xuICAgICAgICByYXc6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBzZXQgcmF3SW5wdXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgdGhpcy5yZXNvbHZlKHZhbHVlLCB7XG4gICAgICAgIHJhdzogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIGdldCBkaXNwbGF5VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gICAgZ2V0IGlzQ29tcGxldGUoKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZ2V0IGlzRmlsbGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaXNDb21wbGV0ZTtcbiAgICB9XG5cbiAgICAvKiogRmluZHMgbmVhcmVzdCBpbnB1dCBwb3NpdGlvbiBpbiBkaXJlY3Rpb24gKi9cbiAgICBuZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiBjdXJzb3JQb3M7XG4gICAgfVxuICAgIHRvdGFsSW5wdXRQb3NpdGlvbnMoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBNYXRoLm1pbih0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgsIHRvUG9zIC0gZnJvbVBvcyk7XG4gICAgfVxuXG4gICAgLyoqIEV4dHJhY3RzIHZhbHVlIGluIHJhbmdlIGNvbnNpZGVyaW5nIGZsYWdzICovXG4gICAgZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlLnNsaWNlKGZyb21Qb3MsIHRvUG9zKTtcbiAgICB9XG5cbiAgICAvKiogRXh0cmFjdHMgdGFpbCBpbiByYW5nZSAqL1xuICAgIGV4dHJhY3RUYWlsKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscyh0aGlzLmV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcyksIGZyb21Qb3MpO1xuICAgIH1cblxuICAgIC8qKiBBcHBlbmRzIHRhaWwgKi9cbiAgICBhcHBlbmRUYWlsKHRhaWwpIHtcbiAgICAgIGlmIChpc1N0cmluZyh0YWlsKSkgdGFpbCA9IG5ldyBDb250aW51b3VzVGFpbERldGFpbHMoU3RyaW5nKHRhaWwpKTtcbiAgICAgIHJldHVybiB0YWlsLmFwcGVuZFRvKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKiBBcHBlbmRzIGNoYXIgKi9cbiAgICBfYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpIHtcbiAgICAgIGlmICghY2gpIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgdGhpcy5fdmFsdWUgKz0gY2g7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoe1xuICAgICAgICBpbnNlcnRlZDogY2gsXG4gICAgICAgIHJhd0luc2VydGVkOiBjaFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqIEFwcGVuZHMgY2hhciAqL1xuICAgIF9hcHBlbmRDaGFyKGNoLCBmbGFncywgY2hlY2tUYWlsKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgY29uc2lzdGVudFN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgIGxldCBkZXRhaWxzO1xuICAgICAgW2NoLCBkZXRhaWxzXSA9IHRoaXMuZG9QcmVwYXJlQ2hhcihjaCwgZmxhZ3MpO1xuICAgICAgaWYgKGNoKSB7XG4gICAgICAgIGRldGFpbHMgPSBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLl9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykpO1xuXG4gICAgICAgIC8vIFRPRE8gaGFuZGxlIGBza2lwYD9cblxuICAgICAgICAvLyB0cnkgYGF1dG9maXhgIGxvb2thaGVhZFxuICAgICAgICBpZiAoIWRldGFpbHMucmF3SW5zZXJ0ZWQgJiYgdGhpcy5hdXRvZml4ID09PSAncGFkJykge1xuICAgICAgICAgIGNvbnN0IG5vRml4U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBjb25zaXN0ZW50U3RhdGU7XG4gICAgICAgICAgbGV0IGZpeERldGFpbHMgPSB0aGlzLnBhZChmbGFncyk7XG4gICAgICAgICAgY29uc3QgY2hEZXRhaWxzID0gdGhpcy5fYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpO1xuICAgICAgICAgIGZpeERldGFpbHMgPSBmaXhEZXRhaWxzLmFnZ3JlZ2F0ZShjaERldGFpbHMpO1xuXG4gICAgICAgICAgLy8gaWYgZml4IHdhcyBhcHBsaWVkIG9yXG4gICAgICAgICAgLy8gaWYgZGV0YWlscyBhcmUgZXF1YWwgdXNlIHNraXAgcmVzdG9yaW5nIHN0YXRlIG9wdGltaXphdGlvblxuICAgICAgICAgIGlmIChjaERldGFpbHMucmF3SW5zZXJ0ZWQgfHwgZml4RGV0YWlscy5lcXVhbHMoZGV0YWlscykpIHtcbiAgICAgICAgICAgIGRldGFpbHMgPSBmaXhEZXRhaWxzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gbm9GaXhTdGF0ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChkZXRhaWxzLmluc2VydGVkKSB7XG4gICAgICAgIGxldCBjb25zaXN0ZW50VGFpbDtcbiAgICAgICAgbGV0IGFwcGVuZGVkID0gdGhpcy5kb1ZhbGlkYXRlKGZsYWdzKSAhPT0gZmFsc2U7XG4gICAgICAgIGlmIChhcHBlbmRlZCAmJiBjaGVja1RhaWwgIT0gbnVsbCkge1xuICAgICAgICAgIC8vIHZhbGlkYXRpb24gb2ssIGNoZWNrIHRhaWxcbiAgICAgICAgICBjb25zdCBiZWZvcmVUYWlsU3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICAgIGlmICh0aGlzLm92ZXJ3cml0ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgY29uc2lzdGVudFRhaWwgPSBjaGVja1RhaWwuc3RhdGU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRldGFpbHMucmF3SW5zZXJ0ZWQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgY2hlY2tUYWlsLnVuc2hpZnQodGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoIC0gZGV0YWlscy50YWlsU2hpZnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgdGFpbERldGFpbHMgPSB0aGlzLmFwcGVuZFRhaWwoY2hlY2tUYWlsKTtcbiAgICAgICAgICBhcHBlbmRlZCA9IHRhaWxEZXRhaWxzLnJhd0luc2VydGVkLmxlbmd0aCA9PT0gY2hlY2tUYWlsLnRvU3RyaW5nKCkubGVuZ3RoO1xuXG4gICAgICAgICAgLy8gbm90IG9rLCB0cnkgc2hpZnRcbiAgICAgICAgICBpZiAoIShhcHBlbmRlZCAmJiB0YWlsRGV0YWlscy5pbnNlcnRlZCkgJiYgdGhpcy5vdmVyd3JpdGUgPT09ICdzaGlmdCcpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBiZWZvcmVUYWlsU3RhdGU7XG4gICAgICAgICAgICBjb25zaXN0ZW50VGFpbCA9IGNoZWNrVGFpbC5zdGF0ZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGV0YWlscy5yYXdJbnNlcnRlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICBjaGVja1RhaWwuc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhaWxEZXRhaWxzID0gdGhpcy5hcHBlbmRUYWlsKGNoZWNrVGFpbCk7XG4gICAgICAgICAgICBhcHBlbmRlZCA9IHRhaWxEZXRhaWxzLnJhd0luc2VydGVkLmxlbmd0aCA9PT0gY2hlY2tUYWlsLnRvU3RyaW5nKCkubGVuZ3RoO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGlmIG9rLCByb2xsYmFjayBzdGF0ZSBhZnRlciB0YWlsXG4gICAgICAgICAgaWYgKGFwcGVuZGVkICYmIHRhaWxEZXRhaWxzLmluc2VydGVkKSB0aGlzLnN0YXRlID0gYmVmb3JlVGFpbFN0YXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmV2ZXJ0IGFsbCBpZiBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgICBpZiAoIWFwcGVuZGVkKSB7XG4gICAgICAgICAgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IGNvbnNpc3RlbnRTdGF0ZTtcbiAgICAgICAgICBpZiAoY2hlY2tUYWlsICYmIGNvbnNpc3RlbnRUYWlsKSBjaGVja1RhaWwuc3RhdGUgPSBjb25zaXN0ZW50VGFpbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuXG4gICAgLyoqIEFwcGVuZHMgb3B0aW9uYWwgcGxhY2Vob2xkZXIgYXQgdGhlIGVuZCAqL1xuICAgIF9hcHBlbmRQbGFjZWhvbGRlcigpIHtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgIH1cblxuICAgIC8qKiBBcHBlbmRzIG9wdGlvbmFsIGVhZ2VyIHBsYWNlaG9sZGVyIGF0IHRoZSBlbmQgKi9cbiAgICBfYXBwZW5kRWFnZXIoKSB7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICB9XG5cbiAgICAvKiogQXBwZW5kcyBzeW1ib2xzIGNvbnNpZGVyaW5nIGZsYWdzICovXG4gICAgYXBwZW5kKHN0ciwgZmxhZ3MsIHRhaWwpIHtcbiAgICAgIGlmICghaXNTdHJpbmcoc3RyKSkgdGhyb3cgbmV3IEVycm9yKCd2YWx1ZSBzaG91bGQgYmUgc3RyaW5nJyk7XG4gICAgICBjb25zdCBjaGVja1RhaWwgPSBpc1N0cmluZyh0YWlsKSA/IG5ldyBDb250aW51b3VzVGFpbERldGFpbHMoU3RyaW5nKHRhaWwpKSA6IHRhaWw7XG4gICAgICBpZiAoZmxhZ3MgIT0gbnVsbCAmJiBmbGFncy50YWlsKSBmbGFncy5fYmVmb3JlVGFpbFN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgIGxldCBkZXRhaWxzO1xuICAgICAgW3N0ciwgZGV0YWlsc10gPSB0aGlzLmRvUHJlcGFyZShzdHIsIGZsYWdzKTtcbiAgICAgIGZvciAobGV0IGNpID0gMDsgY2kgPCBzdHIubGVuZ3RoOyArK2NpKSB7XG4gICAgICAgIGNvbnN0IGQgPSB0aGlzLl9hcHBlbmRDaGFyKHN0cltjaV0sIGZsYWdzLCBjaGVja1RhaWwpO1xuICAgICAgICBpZiAoIWQucmF3SW5zZXJ0ZWQgJiYgIXRoaXMuZG9Ta2lwSW52YWxpZChzdHJbY2ldLCBmbGFncywgY2hlY2tUYWlsKSkgYnJlYWs7XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKGQpO1xuICAgICAgfVxuICAgICAgaWYgKCh0aGlzLmVhZ2VyID09PSB0cnVlIHx8IHRoaXMuZWFnZXIgPT09ICdhcHBlbmQnKSAmJiBmbGFncyAhPSBudWxsICYmIGZsYWdzLmlucHV0ICYmIHN0cikge1xuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLl9hcHBlbmRFYWdlcigpKTtcbiAgICAgIH1cblxuICAgICAgLy8gYXBwZW5kIHRhaWwgYnV0IGFnZ3JlZ2F0ZSBvbmx5IHRhaWxTaGlmdFxuICAgICAgaWYgKGNoZWNrVGFpbCAhPSBudWxsKSB7XG4gICAgICAgIGRldGFpbHMudGFpbFNoaWZ0ICs9IHRoaXMuYXBwZW5kVGFpbChjaGVja1RhaWwpLnRhaWxTaGlmdDtcbiAgICAgICAgLy8gVE9ETyBpdCdzIGEgZ29vZCBpZGVhIHRvIGNsZWFyIHN0YXRlIGFmdGVyIGFwcGVuZGluZyBlbmRzXG4gICAgICAgIC8vIGJ1dCBpdCBjYXVzZXMgYnVncyB3aGVuIG9uZSBhcHBlbmQgY2FsbHMgYW5vdGhlciAod2hlbiBkeW5hbWljIGRpc3BhdGNoIHNldCByYXdJbnB1dFZhbHVlKVxuICAgICAgICAvLyB0aGlzLl9yZXNldEJlZm9yZVRhaWxTdGF0ZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIHJlbW92ZShmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLmRpc3BsYXlWYWx1ZS5zbGljZSgwLCBmcm9tUG9zKSArIHRoaXMuZGlzcGxheVZhbHVlLnNsaWNlKHRvUG9zKTtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgIH1cblxuICAgIC8qKiBDYWxscyBmdW5jdGlvbiBhbmQgcmVhcHBsaWVzIGN1cnJlbnQgdmFsdWUgKi9cbiAgICB3aXRoVmFsdWVSZWZyZXNoKGZuKSB7XG4gICAgICBpZiAodGhpcy5fcmVmcmVzaGluZyB8fCAhdGhpcy5faW5pdGlhbGl6ZWQpIHJldHVybiBmbigpO1xuICAgICAgdGhpcy5fcmVmcmVzaGluZyA9IHRydWU7XG4gICAgICBjb25zdCByYXdJbnB1dCA9IHRoaXMucmF3SW5wdXRWYWx1ZTtcbiAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICAgIGNvbnN0IHJldCA9IGZuKCk7XG4gICAgICB0aGlzLnJhd0lucHV0VmFsdWUgPSByYXdJbnB1dDtcbiAgICAgIC8vIGFwcGVuZCBsb3N0IHRyYWlsaW5nIGNoYXJzIGF0IHRoZSBlbmRcbiAgICAgIGlmICh0aGlzLnZhbHVlICYmIHRoaXMudmFsdWUgIT09IHZhbHVlICYmIHZhbHVlLmluZGV4T2YodGhpcy52YWx1ZSkgPT09IDApIHtcbiAgICAgICAgdGhpcy5hcHBlbmQodmFsdWUuc2xpY2UodGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoKSwge30sICcnKTtcbiAgICAgICAgdGhpcy5kb0NvbW1pdCgpO1xuICAgICAgfVxuICAgICAgZGVsZXRlIHRoaXMuX3JlZnJlc2hpbmc7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICBydW5Jc29sYXRlZChmbikge1xuICAgICAgaWYgKHRoaXMuX2lzb2xhdGVkIHx8ICF0aGlzLl9pbml0aWFsaXplZCkgcmV0dXJuIGZuKHRoaXMpO1xuICAgICAgdGhpcy5faXNvbGF0ZWQgPSB0cnVlO1xuICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgY29uc3QgcmV0ID0gZm4odGhpcyk7XG4gICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XG4gICAgICBkZWxldGUgdGhpcy5faXNvbGF0ZWQ7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICBkb1NraXBJbnZhbGlkKGNoLCBmbGFncywgY2hlY2tUYWlsKSB7XG4gICAgICByZXR1cm4gQm9vbGVhbih0aGlzLnNraXBJbnZhbGlkKTtcbiAgICB9XG5cbiAgICAvKiogUHJlcGFyZXMgc3RyaW5nIGJlZm9yZSBtYXNrIHByb2Nlc3NpbmcgKi9cbiAgICBkb1ByZXBhcmUoc3RyLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBDaGFuZ2VEZXRhaWxzLm5vcm1hbGl6ZSh0aGlzLnByZXBhcmUgPyB0aGlzLnByZXBhcmUoc3RyLCB0aGlzLCBmbGFncykgOiBzdHIpO1xuICAgIH1cblxuICAgIC8qKiBQcmVwYXJlcyBlYWNoIGNoYXIgYmVmb3JlIG1hc2sgcHJvY2Vzc2luZyAqL1xuICAgIGRvUHJlcGFyZUNoYXIoc3RyLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBDaGFuZ2VEZXRhaWxzLm5vcm1hbGl6ZSh0aGlzLnByZXBhcmVDaGFyID8gdGhpcy5wcmVwYXJlQ2hhcihzdHIsIHRoaXMsIGZsYWdzKSA6IHN0cik7XG4gICAgfVxuXG4gICAgLyoqIFZhbGlkYXRlcyBpZiB2YWx1ZSBpcyBhY2NlcHRhYmxlICovXG4gICAgZG9WYWxpZGF0ZShmbGFncykge1xuICAgICAgcmV0dXJuICghdGhpcy52YWxpZGF0ZSB8fCB0aGlzLnZhbGlkYXRlKHRoaXMudmFsdWUsIHRoaXMsIGZsYWdzKSkgJiYgKCF0aGlzLnBhcmVudCB8fCB0aGlzLnBhcmVudC5kb1ZhbGlkYXRlKGZsYWdzKSk7XG4gICAgfVxuXG4gICAgLyoqIERvZXMgYWRkaXRpb25hbCBwcm9jZXNzaW5nIGF0IHRoZSBlbmQgb2YgZWRpdGluZyAqL1xuICAgIGRvQ29tbWl0KCkge1xuICAgICAgaWYgKHRoaXMuY29tbWl0KSB0aGlzLmNvbW1pdCh0aGlzLnZhbHVlLCB0aGlzKTtcbiAgICB9XG4gICAgc3BsaWNlKHN0YXJ0LCBkZWxldGVDb3VudCwgaW5zZXJ0ZWQsIHJlbW92ZURpcmVjdGlvbiwgZmxhZ3MpIHtcbiAgICAgIGlmIChpbnNlcnRlZCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc2VydGVkID0gJyc7XG4gICAgICB9XG4gICAgICBpZiAocmVtb3ZlRGlyZWN0aW9uID09PSB2b2lkIDApIHtcbiAgICAgICAgcmVtb3ZlRGlyZWN0aW9uID0gRElSRUNUSU9OLk5PTkU7XG4gICAgICB9XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgY29uc3QgdGFpbFBvcyA9IHN0YXJ0ICsgZGVsZXRlQ291bnQ7XG4gICAgICBjb25zdCB0YWlsID0gdGhpcy5leHRyYWN0VGFpbCh0YWlsUG9zKTtcbiAgICAgIGNvbnN0IGVhZ2VyUmVtb3ZlID0gdGhpcy5lYWdlciA9PT0gdHJ1ZSB8fCB0aGlzLmVhZ2VyID09PSAncmVtb3ZlJztcbiAgICAgIGxldCBvbGRSYXdWYWx1ZTtcbiAgICAgIGlmIChlYWdlclJlbW92ZSkge1xuICAgICAgICByZW1vdmVEaXJlY3Rpb24gPSBmb3JjZURpcmVjdGlvbihyZW1vdmVEaXJlY3Rpb24pO1xuICAgICAgICBvbGRSYXdWYWx1ZSA9IHRoaXMuZXh0cmFjdElucHV0KDAsIHRhaWxQb3MsIHtcbiAgICAgICAgICByYXc6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBsZXQgc3RhcnRDaGFuZ2VQb3MgPSBzdGFydDtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuXG4gICAgICAvLyBpZiBpdCBpcyBqdXN0IGRlbGV0aW9uIHdpdGhvdXQgaW5zZXJ0aW9uXG4gICAgICBpZiAocmVtb3ZlRGlyZWN0aW9uICE9PSBESVJFQ1RJT04uTk9ORSkge1xuICAgICAgICBzdGFydENoYW5nZVBvcyA9IHRoaXMubmVhcmVzdElucHV0UG9zKHN0YXJ0LCBkZWxldGVDb3VudCA+IDEgJiYgc3RhcnQgIT09IDAgJiYgIWVhZ2VyUmVtb3ZlID8gRElSRUNUSU9OLk5PTkUgOiByZW1vdmVEaXJlY3Rpb24pO1xuXG4gICAgICAgIC8vIGFkanVzdCB0YWlsU2hpZnQgaWYgc3RhcnQgd2FzIGFsaWduZWRcbiAgICAgICAgZGV0YWlscy50YWlsU2hpZnQgPSBzdGFydENoYW5nZVBvcyAtIHN0YXJ0O1xuICAgICAgfVxuICAgICAgZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5yZW1vdmUoc3RhcnRDaGFuZ2VQb3MpKTtcbiAgICAgIGlmIChlYWdlclJlbW92ZSAmJiByZW1vdmVEaXJlY3Rpb24gIT09IERJUkVDVElPTi5OT05FICYmIG9sZFJhd1ZhbHVlID09PSB0aGlzLnJhd0lucHV0VmFsdWUpIHtcbiAgICAgICAgaWYgKHJlbW92ZURpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkZPUkNFX0xFRlQpIHtcbiAgICAgICAgICBsZXQgdmFsTGVuZ3RoO1xuICAgICAgICAgIHdoaWxlIChvbGRSYXdWYWx1ZSA9PT0gdGhpcy5yYXdJbnB1dFZhbHVlICYmICh2YWxMZW5ndGggPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgpKSB7XG4gICAgICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShuZXcgQ2hhbmdlRGV0YWlscyh7XG4gICAgICAgICAgICAgIHRhaWxTaGlmdDogLTFcbiAgICAgICAgICAgIH0pKS5hZ2dyZWdhdGUodGhpcy5yZW1vdmUodmFsTGVuZ3RoIC0gMSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChyZW1vdmVEaXJlY3Rpb24gPT09IERJUkVDVElPTi5GT1JDRV9SSUdIVCkge1xuICAgICAgICAgIHRhaWwudW5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5hcHBlbmQoaW5zZXJ0ZWQsIGZsYWdzLCB0YWlsKSk7XG4gICAgfVxuICAgIG1hc2tFcXVhbHMobWFzaykge1xuICAgICAgcmV0dXJuIHRoaXMubWFzayA9PT0gbWFzaztcbiAgICB9XG4gICAgb3B0aW9uc0lzQ2hhbmdlZChvcHRzKSB7XG4gICAgICByZXR1cm4gIW9iamVjdEluY2x1ZGVzKHRoaXMsIG9wdHMpO1xuICAgIH1cbiAgICB0eXBlZFZhbHVlRXF1YWxzKHZhbHVlKSB7XG4gICAgICBjb25zdCB0dmFsID0gdGhpcy50eXBlZFZhbHVlO1xuICAgICAgcmV0dXJuIHZhbHVlID09PSB0dmFsIHx8IE1hc2tlZC5FTVBUWV9WQUxVRVMuaW5jbHVkZXModmFsdWUpICYmIE1hc2tlZC5FTVBUWV9WQUxVRVMuaW5jbHVkZXModHZhbCkgfHwgKHRoaXMuZm9ybWF0ID8gdGhpcy5mb3JtYXQodmFsdWUsIHRoaXMpID09PSB0aGlzLmZvcm1hdCh0aGlzLnR5cGVkVmFsdWUsIHRoaXMpIDogZmFsc2UpO1xuICAgIH1cbiAgICBwYWQoZmxhZ3MpIHtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgIH1cbiAgfVxuICBNYXNrZWQuREVGQVVMVFMgPSB7XG4gICAgc2tpcEludmFsaWQ6IHRydWVcbiAgfTtcbiAgTWFza2VkLkVNUFRZX1ZBTFVFUyA9IFt1bmRlZmluZWQsIG51bGwsICcnXTtcbiAgSU1hc2suTWFza2VkID0gTWFza2VkO1xuXG4gIGNsYXNzIENodW5rc1RhaWxEZXRhaWxzIHtcbiAgICAvKiogKi9cblxuICAgIGNvbnN0cnVjdG9yKGNodW5rcywgZnJvbSkge1xuICAgICAgaWYgKGNodW5rcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGNodW5rcyA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKGZyb20gPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tID0gMDtcbiAgICAgIH1cbiAgICAgIHRoaXMuY2h1bmtzID0gY2h1bmtzO1xuICAgICAgdGhpcy5mcm9tID0gZnJvbTtcbiAgICB9XG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICByZXR1cm4gdGhpcy5jaHVua3MubWFwKFN0cmluZykuam9pbignJyk7XG4gICAgfVxuICAgIGV4dGVuZCh0YWlsQ2h1bmspIHtcbiAgICAgIGlmICghU3RyaW5nKHRhaWxDaHVuaykpIHJldHVybjtcbiAgICAgIHRhaWxDaHVuayA9IGlzU3RyaW5nKHRhaWxDaHVuaykgPyBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKFN0cmluZyh0YWlsQ2h1bmspKSA6IHRhaWxDaHVuaztcbiAgICAgIGNvbnN0IGxhc3RDaHVuayA9IHRoaXMuY2h1bmtzW3RoaXMuY2h1bmtzLmxlbmd0aCAtIDFdO1xuICAgICAgY29uc3QgZXh0ZW5kTGFzdCA9IGxhc3RDaHVuayAmJiAoXG4gICAgICAvLyBpZiBzdG9wcyBhcmUgc2FtZSBvciB0YWlsIGhhcyBubyBzdG9wXG4gICAgICBsYXN0Q2h1bmsuc3RvcCA9PT0gdGFpbENodW5rLnN0b3AgfHwgdGFpbENodW5rLnN0b3AgPT0gbnVsbCkgJiZcbiAgICAgIC8vIGlmIHRhaWwgY2h1bmsgZ29lcyBqdXN0IGFmdGVyIGxhc3QgY2h1bmtcbiAgICAgIHRhaWxDaHVuay5mcm9tID09PSBsYXN0Q2h1bmsuZnJvbSArIGxhc3RDaHVuay50b1N0cmluZygpLmxlbmd0aDtcbiAgICAgIGlmICh0YWlsQ2h1bmsgaW5zdGFuY2VvZiBDb250aW51b3VzVGFpbERldGFpbHMpIHtcbiAgICAgICAgLy8gY2hlY2sgdGhlIGFiaWxpdHkgdG8gZXh0ZW5kIHByZXZpb3VzIGNodW5rXG4gICAgICAgIGlmIChleHRlbmRMYXN0KSB7XG4gICAgICAgICAgLy8gZXh0ZW5kIHByZXZpb3VzIGNodW5rXG4gICAgICAgICAgbGFzdENodW5rLmV4dGVuZCh0YWlsQ2h1bmsudG9TdHJpbmcoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYXBwZW5kIG5ldyBjaHVua1xuICAgICAgICAgIHRoaXMuY2h1bmtzLnB1c2godGFpbENodW5rKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0YWlsQ2h1bmsgaW5zdGFuY2VvZiBDaHVua3NUYWlsRGV0YWlscykge1xuICAgICAgICBpZiAodGFpbENodW5rLnN0b3AgPT0gbnVsbCkge1xuICAgICAgICAgIC8vIHVud3JhcCBmbG9hdGluZyBjaHVua3MgdG8gcGFyZW50LCBrZWVwaW5nIGBmcm9tYCBwb3NcbiAgICAgICAgICBsZXQgZmlyc3RUYWlsQ2h1bms7XG4gICAgICAgICAgd2hpbGUgKHRhaWxDaHVuay5jaHVua3MubGVuZ3RoICYmIHRhaWxDaHVuay5jaHVua3NbMF0uc3RvcCA9PSBudWxsKSB7XG4gICAgICAgICAgICBmaXJzdFRhaWxDaHVuayA9IHRhaWxDaHVuay5jaHVua3Muc2hpZnQoKTsgLy8gbm90IHBvc3NpYmxlIHRvIGJlIGB1bmRlZmluZWRgIGJlY2F1c2UgbGVuZ3RoIHdhcyBjaGVja2VkIGFib3ZlXG4gICAgICAgICAgICBmaXJzdFRhaWxDaHVuay5mcm9tICs9IHRhaWxDaHVuay5mcm9tO1xuICAgICAgICAgICAgdGhpcy5leHRlbmQoZmlyc3RUYWlsQ2h1bmspO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIHRhaWwgY2h1bmsgc3RpbGwgaGFzIHZhbHVlXG4gICAgICAgIGlmICh0YWlsQ2h1bmsudG9TdHJpbmcoKSkge1xuICAgICAgICAgIC8vIGlmIGNodW5rcyBjb250YWlucyBzdG9wcywgdGhlbiBwb3B1cCBzdG9wIHRvIGNvbnRhaW5lclxuICAgICAgICAgIHRhaWxDaHVuay5zdG9wID0gdGFpbENodW5rLmJsb2NrSW5kZXg7XG4gICAgICAgICAgdGhpcy5jaHVua3MucHVzaCh0YWlsQ2h1bmspO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGFwcGVuZFRvKG1hc2tlZCkge1xuICAgICAgaWYgKCEobWFza2VkIGluc3RhbmNlb2YgSU1hc2suTWFza2VkUGF0dGVybikpIHtcbiAgICAgICAgY29uc3QgdGFpbCA9IG5ldyBDb250aW51b3VzVGFpbERldGFpbHModGhpcy50b1N0cmluZygpKTtcbiAgICAgICAgcmV0dXJuIHRhaWwuYXBwZW5kVG8obWFza2VkKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgZm9yIChsZXQgY2kgPSAwOyBjaSA8IHRoaXMuY2h1bmtzLmxlbmd0aDsgKytjaSkge1xuICAgICAgICBjb25zdCBjaHVuayA9IHRoaXMuY2h1bmtzW2NpXTtcbiAgICAgICAgY29uc3QgbGFzdEJsb2NrSXRlciA9IG1hc2tlZC5fbWFwUG9zVG9CbG9jayhtYXNrZWQuZGlzcGxheVZhbHVlLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHN0b3AgPSBjaHVuay5zdG9wO1xuICAgICAgICBsZXQgY2h1bmtCbG9jaztcbiAgICAgICAgaWYgKHN0b3AgIT0gbnVsbCAmJiAoXG4gICAgICAgIC8vIGlmIGJsb2NrIG5vdCBmb3VuZCBvciBzdG9wIGlzIGJlaGluZCBsYXN0QmxvY2tcbiAgICAgICAgIWxhc3RCbG9ja0l0ZXIgfHwgbGFzdEJsb2NrSXRlci5pbmRleCA8PSBzdG9wKSkge1xuICAgICAgICAgIGlmIChjaHVuayBpbnN0YW5jZW9mIENodW5rc1RhaWxEZXRhaWxzIHx8XG4gICAgICAgICAgLy8gZm9yIGNvbnRpbnVvdXMgYmxvY2sgYWxzbyBjaGVjayBpZiBzdG9wIGlzIGV4aXN0XG4gICAgICAgICAgbWFza2VkLl9zdG9wcy5pbmRleE9mKHN0b3ApID49IDApIHtcbiAgICAgICAgICAgIGRldGFpbHMuYWdncmVnYXRlKG1hc2tlZC5fYXBwZW5kUGxhY2Vob2xkZXIoc3RvcCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaHVua0Jsb2NrID0gY2h1bmsgaW5zdGFuY2VvZiBDaHVua3NUYWlsRGV0YWlscyAmJiBtYXNrZWQuX2Jsb2Nrc1tzdG9wXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2h1bmtCbG9jaykge1xuICAgICAgICAgIGNvbnN0IHRhaWxEZXRhaWxzID0gY2h1bmtCbG9jay5hcHBlbmRUYWlsKGNodW5rKTtcbiAgICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZSh0YWlsRGV0YWlscyk7XG5cbiAgICAgICAgICAvLyBnZXQgbm90IGluc2VydGVkIGNoYXJzXG4gICAgICAgICAgY29uc3QgcmVtYWluQ2hhcnMgPSBjaHVuay50b1N0cmluZygpLnNsaWNlKHRhaWxEZXRhaWxzLnJhd0luc2VydGVkLmxlbmd0aCk7XG4gICAgICAgICAgaWYgKHJlbWFpbkNoYXJzKSBkZXRhaWxzLmFnZ3JlZ2F0ZShtYXNrZWQuYXBwZW5kKHJlbWFpbkNoYXJzLCB7XG4gICAgICAgICAgICB0YWlsOiB0cnVlXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRldGFpbHMuYWdncmVnYXRlKG1hc2tlZC5hcHBlbmQoY2h1bmsudG9TdHJpbmcoKSwge1xuICAgICAgICAgICAgdGFpbDogdHJ1ZVxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNodW5rczogdGhpcy5jaHVua3MubWFwKGMgPT4gYy5zdGF0ZSksXG4gICAgICAgIGZyb206IHRoaXMuZnJvbSxcbiAgICAgICAgc3RvcDogdGhpcy5zdG9wLFxuICAgICAgICBibG9ja0luZGV4OiB0aGlzLmJsb2NrSW5kZXhcbiAgICAgIH07XG4gICAgfVxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBjaHVua3MsXG4gICAgICAgIC4uLnByb3BzXG4gICAgICB9ID0gc3RhdGU7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHByb3BzKTtcbiAgICAgIHRoaXMuY2h1bmtzID0gY2h1bmtzLm1hcChjc3RhdGUgPT4ge1xuICAgICAgICBjb25zdCBjaHVuayA9IFwiY2h1bmtzXCIgaW4gY3N0YXRlID8gbmV3IENodW5rc1RhaWxEZXRhaWxzKCkgOiBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKCk7XG4gICAgICAgIGNodW5rLnN0YXRlID0gY3N0YXRlO1xuICAgICAgICByZXR1cm4gY2h1bms7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdW5zaGlmdChiZWZvcmVQb3MpIHtcbiAgICAgIGlmICghdGhpcy5jaHVua3MubGVuZ3RoIHx8IGJlZm9yZVBvcyAhPSBudWxsICYmIHRoaXMuZnJvbSA+PSBiZWZvcmVQb3MpIHJldHVybiAnJztcbiAgICAgIGNvbnN0IGNodW5rU2hpZnRQb3MgPSBiZWZvcmVQb3MgIT0gbnVsbCA/IGJlZm9yZVBvcyAtIHRoaXMuZnJvbSA6IGJlZm9yZVBvcztcbiAgICAgIGxldCBjaSA9IDA7XG4gICAgICB3aGlsZSAoY2kgPCB0aGlzLmNodW5rcy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSB0aGlzLmNodW5rc1tjaV07XG4gICAgICAgIGNvbnN0IHNoaWZ0Q2hhciA9IGNodW5rLnVuc2hpZnQoY2h1bmtTaGlmdFBvcyk7XG4gICAgICAgIGlmIChjaHVuay50b1N0cmluZygpKSB7XG4gICAgICAgICAgLy8gY2h1bmsgc3RpbGwgY29udGFpbnMgdmFsdWVcbiAgICAgICAgICAvLyBidXQgbm90IHNoaWZ0ZWQgLSBtZWFucyBubyBtb3JlIGF2YWlsYWJsZSBjaGFycyB0byBzaGlmdFxuICAgICAgICAgIGlmICghc2hpZnRDaGFyKSBicmVhaztcbiAgICAgICAgICArK2NpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNsZWFuIGlmIGNodW5rIGhhcyBubyB2YWx1ZVxuICAgICAgICAgIHRoaXMuY2h1bmtzLnNwbGljZShjaSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNoaWZ0Q2hhcikgcmV0dXJuIHNoaWZ0Q2hhcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgc2hpZnQoKSB7XG4gICAgICBpZiAoIXRoaXMuY2h1bmtzLmxlbmd0aCkgcmV0dXJuICcnO1xuICAgICAgbGV0IGNpID0gdGhpcy5jaHVua3MubGVuZ3RoIC0gMTtcbiAgICAgIHdoaWxlICgwIDw9IGNpKSB7XG4gICAgICAgIGNvbnN0IGNodW5rID0gdGhpcy5jaHVua3NbY2ldO1xuICAgICAgICBjb25zdCBzaGlmdENoYXIgPSBjaHVuay5zaGlmdCgpO1xuICAgICAgICBpZiAoY2h1bmsudG9TdHJpbmcoKSkge1xuICAgICAgICAgIC8vIGNodW5rIHN0aWxsIGNvbnRhaW5zIHZhbHVlXG4gICAgICAgICAgLy8gYnV0IG5vdCBzaGlmdGVkIC0gbWVhbnMgbm8gbW9yZSBhdmFpbGFibGUgY2hhcnMgdG8gc2hpZnRcbiAgICAgICAgICBpZiAoIXNoaWZ0Q2hhcikgYnJlYWs7XG4gICAgICAgICAgLS1jaTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBjbGVhbiBpZiBjaHVuayBoYXMgbm8gdmFsdWVcbiAgICAgICAgICB0aGlzLmNodW5rcy5zcGxpY2UoY2ksIDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaGlmdENoYXIpIHJldHVybiBzaGlmdENoYXI7XG4gICAgICB9XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9XG5cbiAgY2xhc3MgUGF0dGVybkN1cnNvciB7XG4gICAgY29uc3RydWN0b3IobWFza2VkLCBwb3MpIHtcbiAgICAgIHRoaXMubWFza2VkID0gbWFza2VkO1xuICAgICAgdGhpcy5fbG9nID0gW107XG4gICAgICBjb25zdCB7XG4gICAgICAgIG9mZnNldCxcbiAgICAgICAgaW5kZXhcbiAgICAgIH0gPSBtYXNrZWQuX21hcFBvc1RvQmxvY2socG9zKSB8fCAocG9zIDwgMCA/XG4gICAgICAvLyBmaXJzdFxuICAgICAge1xuICAgICAgICBpbmRleDogMCxcbiAgICAgICAgb2Zmc2V0OiAwXG4gICAgICB9IDpcbiAgICAgIC8vIGxhc3RcbiAgICAgIHtcbiAgICAgICAgaW5kZXg6IHRoaXMubWFza2VkLl9ibG9ja3MubGVuZ3RoLFxuICAgICAgICBvZmZzZXQ6IDBcbiAgICAgIH0pO1xuICAgICAgdGhpcy5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgICB0aGlzLm9rID0gZmFsc2U7XG4gICAgfVxuICAgIGdldCBibG9jaygpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5fYmxvY2tzW3RoaXMuaW5kZXhdO1xuICAgIH1cbiAgICBnZXQgcG9zKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLl9ibG9ja1N0YXJ0UG9zKHRoaXMuaW5kZXgpICsgdGhpcy5vZmZzZXQ7XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGluZGV4OiB0aGlzLmluZGV4LFxuICAgICAgICBvZmZzZXQ6IHRoaXMub2Zmc2V0LFxuICAgICAgICBvazogdGhpcy5va1xuICAgICAgfTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHMpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgcyk7XG4gICAgfVxuICAgIHB1c2hTdGF0ZSgpIHtcbiAgICAgIHRoaXMuX2xvZy5wdXNoKHRoaXMuc3RhdGUpO1xuICAgIH1cbiAgICBwb3BTdGF0ZSgpIHtcbiAgICAgIGNvbnN0IHMgPSB0aGlzLl9sb2cucG9wKCk7XG4gICAgICBpZiAocykgdGhpcy5zdGF0ZSA9IHM7XG4gICAgICByZXR1cm4gcztcbiAgICB9XG4gICAgYmluZEJsb2NrKCkge1xuICAgICAgaWYgKHRoaXMuYmxvY2spIHJldHVybjtcbiAgICAgIGlmICh0aGlzLmluZGV4IDwgMCkge1xuICAgICAgICB0aGlzLmluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5tYXNrZWQuX2Jsb2Nrcy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5pbmRleCA9IHRoaXMubWFza2VkLl9ibG9ja3MubGVuZ3RoIC0gMTtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmJsb2NrLmRpc3BsYXlWYWx1ZS5sZW5ndGg7IC8vIFRPRE8gdGhpcyBpcyBzdHVwaWQgdHlwZSBlcnJvciwgYGJsb2NrYCBkZXBlbmRzIG9uIGluZGV4IHRoYXQgd2FzIGNoYW5nZWQgYWJvdmVcbiAgICAgIH1cbiAgICB9XG4gICAgX3B1c2hMZWZ0KGZuKSB7XG4gICAgICB0aGlzLnB1c2hTdGF0ZSgpO1xuICAgICAgZm9yICh0aGlzLmJpbmRCbG9jaygpOyAwIDw9IHRoaXMuaW5kZXg7IC0tdGhpcy5pbmRleCwgdGhpcy5vZmZzZXQgPSAoKF90aGlzJGJsb2NrID0gdGhpcy5ibG9jaykgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJGJsb2NrLmRpc3BsYXlWYWx1ZS5sZW5ndGgpIHx8IDApIHtcbiAgICAgICAgdmFyIF90aGlzJGJsb2NrO1xuICAgICAgICBpZiAoZm4oKSkgcmV0dXJuIHRoaXMub2sgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMub2sgPSBmYWxzZTtcbiAgICB9XG4gICAgX3B1c2hSaWdodChmbikge1xuICAgICAgdGhpcy5wdXNoU3RhdGUoKTtcbiAgICAgIGZvciAodGhpcy5iaW5kQmxvY2soKTsgdGhpcy5pbmRleCA8IHRoaXMubWFza2VkLl9ibG9ja3MubGVuZ3RoOyArK3RoaXMuaW5kZXgsIHRoaXMub2Zmc2V0ID0gMCkge1xuICAgICAgICBpZiAoZm4oKSkgcmV0dXJuIHRoaXMub2sgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMub2sgPSBmYWxzZTtcbiAgICB9XG4gICAgcHVzaExlZnRCZWZvcmVGaWxsZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaExlZnQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5ibG9jay5pc0ZpeGVkIHx8ICF0aGlzLmJsb2NrLnZhbHVlKSByZXR1cm47XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gdGhpcy5ibG9jay5uZWFyZXN0SW5wdXRQb3ModGhpcy5vZmZzZXQsIERJUkVDVElPTi5GT1JDRV9MRUZUKTtcbiAgICAgICAgaWYgKHRoaXMub2Zmc2V0ICE9PSAwKSByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwdXNoTGVmdEJlZm9yZUlucHV0KCkge1xuICAgICAgLy8gY2FzZXM6XG4gICAgICAvLyBmaWxsZWQgaW5wdXQ6IDAwfFxuICAgICAgLy8gb3B0aW9uYWwgZW1wdHkgaW5wdXQ6IDAwW118XG4gICAgICAvLyBuZXN0ZWQgYmxvY2s6IFhYPFtdPnxcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoTGVmdCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmJsb2NrLmlzRml4ZWQpIHJldHVybjtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmJsb2NrLm5lYXJlc3RJbnB1dFBvcyh0aGlzLm9mZnNldCwgRElSRUNUSU9OLkxFRlQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwdXNoTGVmdEJlZm9yZVJlcXVpcmVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hMZWZ0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYmxvY2suaXNGaXhlZCB8fCB0aGlzLmJsb2NrLmlzT3B0aW9uYWwgJiYgIXRoaXMuYmxvY2sudmFsdWUpIHJldHVybjtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmJsb2NrLm5lYXJlc3RJbnB1dFBvcyh0aGlzLm9mZnNldCwgRElSRUNUSU9OLkxFRlQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwdXNoUmlnaHRCZWZvcmVGaWxsZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaFJpZ2h0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYmxvY2suaXNGaXhlZCB8fCAhdGhpcy5ibG9jay52YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLm9mZnNldCA9IHRoaXMuYmxvY2submVhcmVzdElucHV0UG9zKHRoaXMub2Zmc2V0LCBESVJFQ1RJT04uRk9SQ0VfUklHSFQpO1xuICAgICAgICBpZiAodGhpcy5vZmZzZXQgIT09IHRoaXMuYmxvY2sudmFsdWUubGVuZ3RoKSByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwdXNoUmlnaHRCZWZvcmVJbnB1dCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoUmlnaHQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5ibG9jay5pc0ZpeGVkKSByZXR1cm47XG5cbiAgICAgICAgLy8gY29uc3QgbyA9IHRoaXMub2Zmc2V0O1xuICAgICAgICB0aGlzLm9mZnNldCA9IHRoaXMuYmxvY2submVhcmVzdElucHV0UG9zKHRoaXMub2Zmc2V0LCBESVJFQ1RJT04uTk9ORSk7XG4gICAgICAgIC8vIEhBQ0sgY2FzZXMgbGlrZSAoU1RJTEwgRE9FUyBOT1QgV09SSyBGT1IgTkVTVEVEKVxuICAgICAgICAvLyBhYXxYXG4gICAgICAgIC8vIGFhPFh8W10+WF8gICAgLSB0aGlzIHdpbGwgbm90IHdvcmtcbiAgICAgICAgLy8gaWYgKG8gJiYgbyA9PT0gdGhpcy5vZmZzZXQgJiYgdGhpcy5ibG9jayBpbnN0YW5jZW9mIFBhdHRlcm5JbnB1dERlZmluaXRpb24pIGNvbnRpbnVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBwdXNoUmlnaHRCZWZvcmVSZXF1aXJlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoUmlnaHQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5ibG9jay5pc0ZpeGVkIHx8IHRoaXMuYmxvY2suaXNPcHRpb25hbCAmJiAhdGhpcy5ibG9jay52YWx1ZSkgcmV0dXJuO1xuXG4gICAgICAgIC8vIFRPRE8gY2hlY2sgfFsqXVhYX1xuICAgICAgICB0aGlzLm9mZnNldCA9IHRoaXMuYmxvY2submVhcmVzdElucHV0UG9zKHRoaXMub2Zmc2V0LCBESVJFQ1RJT04uTk9ORSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY2xhc3MgUGF0dGVybkZpeGVkRGVmaW5pdGlvbiB7XG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBvcHRzKTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gJyc7XG4gICAgICB0aGlzLmlzRml4ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICAgIGdldCB1bm1hc2tlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaXNVbm1hc2tpbmcgPyB0aGlzLnZhbHVlIDogJyc7XG4gICAgfVxuICAgIGdldCByYXdJbnB1dFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzUmF3SW5wdXQgPyB0aGlzLnZhbHVlIDogJyc7XG4gICAgfVxuICAgIGdldCBkaXNwbGF5VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICB0aGlzLl9pc1Jhd0lucHV0ID0gZmFsc2U7XG4gICAgICB0aGlzLl92YWx1ZSA9ICcnO1xuICAgIH1cbiAgICByZW1vdmUoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuX3ZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3ZhbHVlID0gdGhpcy5fdmFsdWUuc2xpY2UoMCwgZnJvbVBvcykgKyB0aGlzLl92YWx1ZS5zbGljZSh0b1Bvcyk7XG4gICAgICBpZiAoIXRoaXMuX3ZhbHVlKSB0aGlzLl9pc1Jhd0lucHV0ID0gZmFsc2U7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICB9XG4gICAgbmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgZGlyZWN0aW9uKSB7XG4gICAgICBpZiAoZGlyZWN0aW9uID09PSB2b2lkIDApIHtcbiAgICAgICAgZGlyZWN0aW9uID0gRElSRUNUSU9OLk5PTkU7XG4gICAgICB9XG4gICAgICBjb25zdCBtaW5Qb3MgPSAwO1xuICAgICAgY29uc3QgbWF4UG9zID0gdGhpcy5fdmFsdWUubGVuZ3RoO1xuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uTEVGVDpcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uRk9SQ0VfTEVGVDpcbiAgICAgICAgICByZXR1cm4gbWluUG9zO1xuICAgICAgICBjYXNlIERJUkVDVElPTi5OT05FOlxuICAgICAgICBjYXNlIERJUkVDVElPTi5SSUdIVDpcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uRk9SQ0VfUklHSFQ6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIG1heFBvcztcbiAgICAgIH1cbiAgICB9XG4gICAgdG90YWxJbnB1dFBvc2l0aW9ucyhmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5fdmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2lzUmF3SW5wdXQgPyB0b1BvcyAtIGZyb21Qb3MgOiAwO1xuICAgIH1cbiAgICBleHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLl92YWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZsYWdzLnJhdyAmJiB0aGlzLl9pc1Jhd0lucHV0ICYmIHRoaXMuX3ZhbHVlLnNsaWNlKGZyb21Qb3MsIHRvUG9zKSB8fCAnJztcbiAgICB9XG4gICAgZ2V0IGlzQ29tcGxldGUoKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZ2V0IGlzRmlsbGVkKCkge1xuICAgICAgcmV0dXJuIEJvb2xlYW4odGhpcy5fdmFsdWUpO1xuICAgIH1cbiAgICBfYXBwZW5kQ2hhcihjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc0ZpbGxlZCkgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBjb25zdCBhcHBlbmRFYWdlciA9IHRoaXMuZWFnZXIgPT09IHRydWUgfHwgdGhpcy5lYWdlciA9PT0gJ2FwcGVuZCc7XG4gICAgICBjb25zdCBhcHBlbmRlZCA9IHRoaXMuY2hhciA9PT0gY2g7XG4gICAgICBjb25zdCBpc1Jlc29sdmVkID0gYXBwZW5kZWQgJiYgKHRoaXMuaXNVbm1hc2tpbmcgfHwgZmxhZ3MuaW5wdXQgfHwgZmxhZ3MucmF3KSAmJiAoIWZsYWdzLnJhdyB8fCAhYXBwZW5kRWFnZXIpICYmICFmbGFncy50YWlsO1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKHtcbiAgICAgICAgaW5zZXJ0ZWQ6IHRoaXMuY2hhcixcbiAgICAgICAgcmF3SW5zZXJ0ZWQ6IGlzUmVzb2x2ZWQgPyB0aGlzLmNoYXIgOiAnJ1xuICAgICAgfSk7XG4gICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuY2hhcjtcbiAgICAgIHRoaXMuX2lzUmF3SW5wdXQgPSBpc1Jlc29sdmVkICYmIChmbGFncy5yYXcgfHwgZmxhZ3MuaW5wdXQpO1xuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIF9hcHBlbmRFYWdlcigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hcHBlbmRDaGFyKHRoaXMuY2hhciwge1xuICAgICAgICB0YWlsOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgX2FwcGVuZFBsYWNlaG9sZGVyKCkge1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBpZiAodGhpcy5pc0ZpbGxlZCkgcmV0dXJuIGRldGFpbHM7XG4gICAgICB0aGlzLl92YWx1ZSA9IGRldGFpbHMuaW5zZXJ0ZWQgPSB0aGlzLmNoYXI7XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgZXh0cmFjdFRhaWwoKSB7XG4gICAgICByZXR1cm4gbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscygnJyk7XG4gICAgfVxuICAgIGFwcGVuZFRhaWwodGFpbCkge1xuICAgICAgaWYgKGlzU3RyaW5nKHRhaWwpKSB0YWlsID0gbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscyhTdHJpbmcodGFpbCkpO1xuICAgICAgcmV0dXJuIHRhaWwuYXBwZW5kVG8odGhpcyk7XG4gICAgfVxuICAgIGFwcGVuZChzdHIsIGZsYWdzLCB0YWlsKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gdGhpcy5fYXBwZW5kQ2hhcihzdHJbMF0sIGZsYWdzKTtcbiAgICAgIGlmICh0YWlsICE9IG51bGwpIHtcbiAgICAgICAgZGV0YWlscy50YWlsU2hpZnQgKz0gdGhpcy5hcHBlbmRUYWlsKHRhaWwpLnRhaWxTaGlmdDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBkb0NvbW1pdCgpIHt9XG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgX3ZhbHVlOiB0aGlzLl92YWx1ZSxcbiAgICAgICAgX3Jhd0lucHV0VmFsdWU6IHRoaXMucmF3SW5wdXRWYWx1ZVxuICAgICAgfTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHN0YXRlKSB7XG4gICAgICB0aGlzLl92YWx1ZSA9IHN0YXRlLl92YWx1ZTtcbiAgICAgIHRoaXMuX2lzUmF3SW5wdXQgPSBCb29sZWFuKHN0YXRlLl9yYXdJbnB1dFZhbHVlKTtcbiAgICB9XG4gICAgcGFkKGZsYWdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYXBwZW5kUGxhY2Vob2xkZXIoKTtcbiAgICB9XG4gIH1cblxuICBjbGFzcyBQYXR0ZXJuSW5wdXREZWZpbml0aW9uIHtcbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBwYXJlbnQsXG4gICAgICAgIGlzT3B0aW9uYWwsXG4gICAgICAgIHBsYWNlaG9sZGVyQ2hhcixcbiAgICAgICAgZGlzcGxheUNoYXIsXG4gICAgICAgIGxhenksXG4gICAgICAgIGVhZ2VyLFxuICAgICAgICAuLi5tYXNrT3B0c1xuICAgICAgfSA9IG9wdHM7XG4gICAgICB0aGlzLm1hc2tlZCA9IGNyZWF0ZU1hc2sobWFza09wdHMpO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCB7XG4gICAgICAgIHBhcmVudCxcbiAgICAgICAgaXNPcHRpb25hbCxcbiAgICAgICAgcGxhY2Vob2xkZXJDaGFyLFxuICAgICAgICBkaXNwbGF5Q2hhcixcbiAgICAgICAgbGF6eSxcbiAgICAgICAgZWFnZXJcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgIHRoaXMuaXNGaWxsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMubWFza2VkLnJlc2V0KCk7XG4gICAgfVxuICAgIHJlbW92ZShmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy52YWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gMCAmJiB0b1BvcyA+PSAxKSB7XG4gICAgICAgIHRoaXMuaXNGaWxsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFza2VkLnJlbW92ZShmcm9tUG9zLCB0b1Bvcyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICB9XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLnZhbHVlIHx8ICh0aGlzLmlzRmlsbGVkICYmICF0aGlzLmlzT3B0aW9uYWwgPyB0aGlzLnBsYWNlaG9sZGVyQ2hhciA6ICcnKTtcbiAgICB9XG4gICAgZ2V0IHVubWFza2VkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQudW5tYXNrZWRWYWx1ZTtcbiAgICB9XG4gICAgZ2V0IHJhd0lucHV0VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQucmF3SW5wdXRWYWx1ZTtcbiAgICB9XG4gICAgZ2V0IGRpc3BsYXlWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC52YWx1ZSAmJiB0aGlzLmRpc3BsYXlDaGFyIHx8IHRoaXMudmFsdWU7XG4gICAgfVxuICAgIGdldCBpc0NvbXBsZXRlKCkge1xuICAgICAgcmV0dXJuIEJvb2xlYW4odGhpcy5tYXNrZWQudmFsdWUpIHx8IHRoaXMuaXNPcHRpb25hbDtcbiAgICB9XG4gICAgX2FwcGVuZENoYXIoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNGaWxsZWQpIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1hc2tlZC5zdGF0ZTtcbiAgICAgIC8vIHNpbXVsYXRlIGlucHV0XG4gICAgICBsZXQgZGV0YWlscyA9IHRoaXMubWFza2VkLl9hcHBlbmRDaGFyKGNoLCB0aGlzLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpKTtcbiAgICAgIGlmIChkZXRhaWxzLmluc2VydGVkICYmIHRoaXMuZG9WYWxpZGF0ZShmbGFncykgPT09IGZhbHNlKSB7XG4gICAgICAgIGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgICB0aGlzLm1hc2tlZC5zdGF0ZSA9IHN0YXRlO1xuICAgICAgfVxuICAgICAgaWYgKCFkZXRhaWxzLmluc2VydGVkICYmICF0aGlzLmlzT3B0aW9uYWwgJiYgIXRoaXMubGF6eSAmJiAhZmxhZ3MuaW5wdXQpIHtcbiAgICAgICAgZGV0YWlscy5pbnNlcnRlZCA9IHRoaXMucGxhY2Vob2xkZXJDaGFyO1xuICAgICAgfVxuICAgICAgZGV0YWlscy5za2lwID0gIWRldGFpbHMuaW5zZXJ0ZWQgJiYgIXRoaXMuaXNPcHRpb25hbDtcbiAgICAgIHRoaXMuaXNGaWxsZWQgPSBCb29sZWFuKGRldGFpbHMuaW5zZXJ0ZWQpO1xuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIGFwcGVuZChzdHIsIGZsYWdzLCB0YWlsKSB7XG4gICAgICAvLyBUT0RPIHByb2JhYmx5IHNob3VsZCBiZSBkb25lIHZpYSBfYXBwZW5kQ2hhclxuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLmFwcGVuZChzdHIsIHRoaXMuY3VycmVudE1hc2tGbGFncyhmbGFncyksIHRhaWwpO1xuICAgIH1cbiAgICBfYXBwZW5kUGxhY2Vob2xkZXIoKSB7XG4gICAgICBpZiAodGhpcy5pc0ZpbGxlZCB8fCB0aGlzLmlzT3B0aW9uYWwpIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgdGhpcy5pc0ZpbGxlZCA9IHRydWU7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoe1xuICAgICAgICBpbnNlcnRlZDogdGhpcy5wbGFjZWhvbGRlckNoYXJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBfYXBwZW5kRWFnZXIoKSB7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICB9XG4gICAgZXh0cmFjdFRhaWwoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5leHRyYWN0VGFpbChmcm9tUG9zLCB0b1Bvcyk7XG4gICAgfVxuICAgIGFwcGVuZFRhaWwodGFpbCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLmFwcGVuZFRhaWwodGFpbCk7XG4gICAgfVxuICAgIGV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMudmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLmV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpO1xuICAgIH1cbiAgICBuZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBkaXJlY3Rpb24pIHtcbiAgICAgIGlmIChkaXJlY3Rpb24gPT09IHZvaWQgMCkge1xuICAgICAgICBkaXJlY3Rpb24gPSBESVJFQ1RJT04uTk9ORTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1pblBvcyA9IDA7XG4gICAgICBjb25zdCBtYXhQb3MgPSB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgICAgIGNvbnN0IGJvdW5kUG9zID0gTWF0aC5taW4oTWF0aC5tYXgoY3Vyc29yUG9zLCBtaW5Qb3MpLCBtYXhQb3MpO1xuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uTEVGVDpcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uRk9SQ0VfTEVGVDpcbiAgICAgICAgICByZXR1cm4gdGhpcy5pc0NvbXBsZXRlID8gYm91bmRQb3MgOiBtaW5Qb3M7XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLlJJR0hUOlxuICAgICAgICBjYXNlIERJUkVDVElPTi5GT1JDRV9SSUdIVDpcbiAgICAgICAgICByZXR1cm4gdGhpcy5pc0NvbXBsZXRlID8gYm91bmRQb3MgOiBtYXhQb3M7XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLk5PTkU6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGJvdW5kUG9zO1xuICAgICAgfVxuICAgIH1cbiAgICB0b3RhbElucHV0UG9zaXRpb25zKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnZhbHVlLnNsaWNlKGZyb21Qb3MsIHRvUG9zKS5sZW5ndGg7XG4gICAgfVxuICAgIGRvVmFsaWRhdGUoZmxhZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5kb1ZhbGlkYXRlKHRoaXMuY3VycmVudE1hc2tGbGFncyhmbGFncykpICYmICghdGhpcy5wYXJlbnQgfHwgdGhpcy5wYXJlbnQuZG9WYWxpZGF0ZSh0aGlzLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpKSk7XG4gICAgfVxuICAgIGRvQ29tbWl0KCkge1xuICAgICAgdGhpcy5tYXNrZWQuZG9Db21taXQoKTtcbiAgICB9XG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgX3ZhbHVlOiB0aGlzLnZhbHVlLFxuICAgICAgICBfcmF3SW5wdXRWYWx1ZTogdGhpcy5yYXdJbnB1dFZhbHVlLFxuICAgICAgICBtYXNrZWQ6IHRoaXMubWFza2VkLnN0YXRlLFxuICAgICAgICBpc0ZpbGxlZDogdGhpcy5pc0ZpbGxlZFxuICAgICAgfTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHN0YXRlKSB7XG4gICAgICB0aGlzLm1hc2tlZC5zdGF0ZSA9IHN0YXRlLm1hc2tlZDtcbiAgICAgIHRoaXMuaXNGaWxsZWQgPSBzdGF0ZS5pc0ZpbGxlZDtcbiAgICB9XG4gICAgY3VycmVudE1hc2tGbGFncyhmbGFncykge1xuICAgICAgdmFyIF9mbGFncyRfYmVmb3JlVGFpbFN0YTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmZsYWdzLFxuICAgICAgICBfYmVmb3JlVGFpbFN0YXRlOiAoZmxhZ3MgPT0gbnVsbCB8fCAoX2ZsYWdzJF9iZWZvcmVUYWlsU3RhID0gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSkgPT0gbnVsbCA/IHZvaWQgMCA6IF9mbGFncyRfYmVmb3JlVGFpbFN0YS5tYXNrZWQpIHx8IChmbGFncyA9PSBudWxsID8gdm9pZCAwIDogZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSlcbiAgICAgIH07XG4gICAgfVxuICAgIHBhZChmbGFncykge1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgfVxuICB9XG4gIFBhdHRlcm5JbnB1dERlZmluaXRpb24uREVGQVVMVF9ERUZJTklUSU9OUyA9IHtcbiAgICAnMCc6IC9cXGQvLFxuICAgICdhJzogL1tcXHUwMDQxLVxcdTAwNUFcXHUwMDYxLVxcdTAwN0FcXHUwMEFBXFx1MDBCNVxcdTAwQkFcXHUwMEMwLVxcdTAwRDZcXHUwMEQ4LVxcdTAwRjZcXHUwMEY4LVxcdTAyQzFcXHUwMkM2LVxcdTAyRDFcXHUwMkUwLVxcdTAyRTRcXHUwMkVDXFx1MDJFRVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3QS1cXHUwMzdEXFx1MDM4NlxcdTAzODgtXFx1MDM4QVxcdTAzOENcXHUwMzhFLVxcdTAzQTFcXHUwM0EzLVxcdTAzRjVcXHUwM0Y3LVxcdTA0ODFcXHUwNDhBLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVEMC1cXHUwNUVBXFx1MDVGMC1cXHUwNUYyXFx1MDYyMC1cXHUwNjRBXFx1MDY2RVxcdTA2NkZcXHUwNjcxLVxcdTA2RDNcXHUwNkQ1XFx1MDZFNVxcdTA2RTZcXHUwNkVFXFx1MDZFRlxcdTA2RkEtXFx1MDZGQ1xcdTA2RkZcXHUwNzEwXFx1MDcxMi1cXHUwNzJGXFx1MDc0RC1cXHUwN0E1XFx1MDdCMVxcdTA3Q0EtXFx1MDdFQVxcdTA3RjRcXHUwN0Y1XFx1MDdGQVxcdTA4MDAtXFx1MDgxNVxcdTA4MUFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4QTBcXHUwOEEyLVxcdTA4QUNcXHUwOTA0LVxcdTA5MzlcXHUwOTNEXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk3N1xcdTA5NzktXFx1MDk3RlxcdTA5ODUtXFx1MDk4Q1xcdTA5OEZcXHUwOTkwXFx1MDk5My1cXHUwOUE4XFx1MDlBQS1cXHUwOUIwXFx1MDlCMlxcdTA5QjYtXFx1MDlCOVxcdTA5QkRcXHUwOUNFXFx1MDlEQ1xcdTA5RERcXHUwOURGLVxcdTA5RTFcXHUwOUYwXFx1MDlGMVxcdTBBMDUtXFx1MEEwQVxcdTBBMEZcXHUwQTEwXFx1MEExMy1cXHUwQTI4XFx1MEEyQS1cXHUwQTMwXFx1MEEzMlxcdTBBMzNcXHUwQTM1XFx1MEEzNlxcdTBBMzhcXHUwQTM5XFx1MEE1OS1cXHUwQTVDXFx1MEE1RVxcdTBBNzItXFx1MEE3NFxcdTBBODUtXFx1MEE4RFxcdTBBOEYtXFx1MEE5MVxcdTBBOTMtXFx1MEFBOFxcdTBBQUEtXFx1MEFCMFxcdTBBQjJcXHUwQUIzXFx1MEFCNS1cXHUwQUI5XFx1MEFCRFxcdTBBRDBcXHUwQUUwXFx1MEFFMVxcdTBCMDUtXFx1MEIwQ1xcdTBCMEZcXHUwQjEwXFx1MEIxMy1cXHUwQjI4XFx1MEIyQS1cXHUwQjMwXFx1MEIzMlxcdTBCMzNcXHUwQjM1LVxcdTBCMzlcXHUwQjNEXFx1MEI1Q1xcdTBCNURcXHUwQjVGLVxcdTBCNjFcXHUwQjcxXFx1MEI4M1xcdTBCODUtXFx1MEI4QVxcdTBCOEUtXFx1MEI5MFxcdTBCOTItXFx1MEI5NVxcdTBCOTlcXHUwQjlBXFx1MEI5Q1xcdTBCOUVcXHUwQjlGXFx1MEJBM1xcdTBCQTRcXHUwQkE4LVxcdTBCQUFcXHUwQkFFLVxcdTBCQjlcXHUwQkQwXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzMzXFx1MEMzNS1cXHUwQzM5XFx1MEMzRFxcdTBDNThcXHUwQzU5XFx1MEM2MFxcdTBDNjFcXHUwQzg1LVxcdTBDOENcXHUwQzhFLVxcdTBDOTBcXHUwQzkyLVxcdTBDQThcXHUwQ0FBLVxcdTBDQjNcXHUwQ0I1LVxcdTBDQjlcXHUwQ0JEXFx1MENERVxcdTBDRTBcXHUwQ0UxXFx1MENGMVxcdTBDRjJcXHUwRDA1LVxcdTBEMENcXHUwRDBFLVxcdTBEMTBcXHUwRDEyLVxcdTBEM0FcXHUwRDNEXFx1MEQ0RVxcdTBENjBcXHUwRDYxXFx1MEQ3QS1cXHUwRDdGXFx1MEQ4NS1cXHUwRDk2XFx1MEQ5QS1cXHUwREIxXFx1MERCMy1cXHUwREJCXFx1MERCRFxcdTBEQzAtXFx1MERDNlxcdTBFMDEtXFx1MEUzMFxcdTBFMzJcXHUwRTMzXFx1MEU0MC1cXHUwRTQ2XFx1MEU4MVxcdTBFODJcXHUwRTg0XFx1MEU4N1xcdTBFODhcXHUwRThBXFx1MEU4RFxcdTBFOTQtXFx1MEU5N1xcdTBFOTktXFx1MEU5RlxcdTBFQTEtXFx1MEVBM1xcdTBFQTVcXHUwRUE3XFx1MEVBQVxcdTBFQUJcXHUwRUFELVxcdTBFQjBcXHUwRUIyXFx1MEVCM1xcdTBFQkRcXHUwRUMwLVxcdTBFQzRcXHUwRUM2XFx1MEVEQy1cXHUwRURGXFx1MEYwMFxcdTBGNDAtXFx1MEY0N1xcdTBGNDktXFx1MEY2Q1xcdTBGODgtXFx1MEY4Q1xcdTEwMDAtXFx1MTAyQVxcdTEwM0ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVBLVxcdTEwNURcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZFLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhFXFx1MTBBMC1cXHUxMEM1XFx1MTBDN1xcdTEwQ0RcXHUxMEQwLVxcdTEwRkFcXHUxMEZDLVxcdTEyNDhcXHUxMjRBLVxcdTEyNERcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1QS1cXHUxMjVEXFx1MTI2MC1cXHUxMjg4XFx1MTI4QS1cXHUxMjhEXFx1MTI5MC1cXHUxMkIwXFx1MTJCMi1cXHUxMkI1XFx1MTJCOC1cXHUxMkJFXFx1MTJDMFxcdTEyQzItXFx1MTJDNVxcdTEyQzgtXFx1MTJENlxcdTEyRDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1QVxcdTEzODAtXFx1MTM4RlxcdTEzQTAtXFx1MTNGNFxcdTE0MDEtXFx1MTY2Q1xcdTE2NkYtXFx1MTY3RlxcdTE2ODEtXFx1MTY5QVxcdTE2QTAtXFx1MTZFQVxcdTE3MDAtXFx1MTcwQ1xcdTE3MEUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Q1xcdTE3NkUtXFx1MTc3MFxcdTE3ODAtXFx1MTdCM1xcdTE3RDdcXHUxN0RDXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOEE4XFx1MThBQVxcdTE4QjAtXFx1MThGNVxcdTE5MDAtXFx1MTkxQ1xcdTE5NTAtXFx1MTk2RFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlBQlxcdTE5QzEtXFx1MTlDN1xcdTFBMDAtXFx1MUExNlxcdTFBMjAtXFx1MUE1NFxcdTFBQTdcXHUxQjA1LVxcdTFCMzNcXHUxQjQ1LVxcdTFCNEJcXHUxQjgzLVxcdTFCQTBcXHUxQkFFXFx1MUJBRlxcdTFCQkEtXFx1MUJFNVxcdTFDMDAtXFx1MUMyM1xcdTFDNEQtXFx1MUM0RlxcdTFDNUEtXFx1MUM3RFxcdTFDRTktXFx1MUNFQ1xcdTFDRUUtXFx1MUNGMVxcdTFDRjVcXHUxQ0Y2XFx1MUQwMC1cXHUxREJGXFx1MUUwMC1cXHUxRjE1XFx1MUYxOC1cXHUxRjFEXFx1MUYyMC1cXHUxRjQ1XFx1MUY0OC1cXHUxRjREXFx1MUY1MC1cXHUxRjU3XFx1MUY1OVxcdTFGNUJcXHUxRjVEXFx1MUY1Ri1cXHUxRjdEXFx1MUY4MC1cXHUxRkI0XFx1MUZCNi1cXHUxRkJDXFx1MUZCRVxcdTFGQzItXFx1MUZDNFxcdTFGQzYtXFx1MUZDQ1xcdTFGRDAtXFx1MUZEM1xcdTFGRDYtXFx1MUZEQlxcdTFGRTAtXFx1MUZFQ1xcdTFGRjItXFx1MUZGNFxcdTFGRjYtXFx1MUZGQ1xcdTIwNzFcXHUyMDdGXFx1MjA5MC1cXHUyMDlDXFx1MjEwMlxcdTIxMDdcXHUyMTBBLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFEXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyQS1cXHUyMTJEXFx1MjEyRi1cXHUyMTM5XFx1MjEzQy1cXHUyMTNGXFx1MjE0NS1cXHUyMTQ5XFx1MjE0RVxcdTIxODNcXHUyMTg0XFx1MkMwMC1cXHUyQzJFXFx1MkMzMC1cXHUyQzVFXFx1MkM2MC1cXHUyQ0U0XFx1MkNFQi1cXHUyQ0VFXFx1MkNGMlxcdTJDRjNcXHUyRDAwLVxcdTJEMjVcXHUyRDI3XFx1MkQyRFxcdTJEMzAtXFx1MkQ2N1xcdTJENkZcXHUyRDgwLVxcdTJEOTZcXHUyREEwLVxcdTJEQTZcXHUyREE4LVxcdTJEQUVcXHUyREIwLVxcdTJEQjZcXHUyREI4LVxcdTJEQkVcXHUyREMwLVxcdTJEQzZcXHUyREM4LVxcdTJEQ0VcXHUyREQwLVxcdTJERDZcXHUyREQ4LVxcdTJEREVcXHUyRTJGXFx1MzAwNVxcdTMwMDZcXHUzMDMxLVxcdTMwMzVcXHUzMDNCXFx1MzAzQ1xcdTMwNDEtXFx1MzA5NlxcdTMwOUQtXFx1MzA5RlxcdTMwQTEtXFx1MzBGQVxcdTMwRkMtXFx1MzBGRlxcdTMxMDUtXFx1MzEyRFxcdTMxMzEtXFx1MzE4RVxcdTMxQTAtXFx1MzFCQVxcdTMxRjAtXFx1MzFGRlxcdTM0MDAtXFx1NERCNVxcdTRFMDAtXFx1OUZDQ1xcdUEwMDAtXFx1QTQ4Q1xcdUE0RDAtXFx1QTRGRFxcdUE1MDAtXFx1QTYwQ1xcdUE2MTAtXFx1QTYxRlxcdUE2MkFcXHVBNjJCXFx1QTY0MC1cXHVBNjZFXFx1QTY3Ri1cXHVBNjk3XFx1QTZBMC1cXHVBNkU1XFx1QTcxNy1cXHVBNzFGXFx1QTcyMi1cXHVBNzg4XFx1QTc4Qi1cXHVBNzhFXFx1QTc5MC1cXHVBNzkzXFx1QTdBMC1cXHVBN0FBXFx1QTdGOC1cXHVBODAxXFx1QTgwMy1cXHVBODA1XFx1QTgwNy1cXHVBODBBXFx1QTgwQy1cXHVBODIyXFx1QTg0MC1cXHVBODczXFx1QTg4Mi1cXHVBOEIzXFx1QThGMi1cXHVBOEY3XFx1QThGQlxcdUE5MEEtXFx1QTkyNVxcdUE5MzAtXFx1QTk0NlxcdUE5NjAtXFx1QTk3Q1xcdUE5ODQtXFx1QTlCMlxcdUE5Q0ZcXHVBQTAwLVxcdUFBMjhcXHVBQTQwLVxcdUFBNDJcXHVBQTQ0LVxcdUFBNEJcXHVBQTYwLVxcdUFBNzZcXHVBQTdBXFx1QUE4MC1cXHVBQUFGXFx1QUFCMVxcdUFBQjVcXHVBQUI2XFx1QUFCOS1cXHVBQUJEXFx1QUFDMFxcdUFBQzJcXHVBQURCLVxcdUFBRERcXHVBQUUwLVxcdUFBRUFcXHVBQUYyLVxcdUFBRjRcXHVBQjAxLVxcdUFCMDZcXHVBQjA5LVxcdUFCMEVcXHVBQjExLVxcdUFCMTZcXHVBQjIwLVxcdUFCMjZcXHVBQjI4LVxcdUFCMkVcXHVBQkMwLVxcdUFCRTJcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFEXFx1RkIxRi1cXHVGQjI4XFx1RkIyQS1cXHVGQjM2XFx1RkIzOC1cXHVGQjNDXFx1RkIzRVxcdUZCNDBcXHVGQjQxXFx1RkI0M1xcdUZCNDRcXHVGQjQ2LVxcdUZCQjFcXHVGQkQzLVxcdUZEM0RcXHVGRDUwLVxcdUZEOEZcXHVGRDkyLVxcdUZEQzdcXHVGREYwLVxcdUZERkJcXHVGRTcwLVxcdUZFNzRcXHVGRTc2LVxcdUZFRkNcXHVGRjIxLVxcdUZGM0FcXHVGRjQxLVxcdUZGNUFcXHVGRjY2LVxcdUZGQkVcXHVGRkMyLVxcdUZGQzdcXHVGRkNBLVxcdUZGQ0ZcXHVGRkQyLVxcdUZGRDdcXHVGRkRBLVxcdUZGRENdLyxcbiAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjA3NTA3MFxuICAgICcqJzogLy4vXG4gIH07XG5cbiAgLyoqIE1hc2tpbmcgYnkgUmVnRXhwICovXG4gIGNsYXNzIE1hc2tlZFJlZ0V4cCBleHRlbmRzIE1hc2tlZCB7XG4gICAgLyoqICovXG5cbiAgICAvKiogRW5hYmxlIGNoYXJhY3RlcnMgb3ZlcndyaXRpbmcgKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBjb25zdCBtYXNrID0gb3B0cy5tYXNrO1xuICAgICAgaWYgKG1hc2spIG9wdHMudmFsaWRhdGUgPSB2YWx1ZSA9PiB2YWx1ZS5zZWFyY2gobWFzaykgPj0gMDtcbiAgICAgIHN1cGVyLl91cGRhdGUob3B0cyk7XG4gICAgfVxuICB9XG4gIElNYXNrLk1hc2tlZFJlZ0V4cCA9IE1hc2tlZFJlZ0V4cDtcblxuICAvKiogUGF0dGVybiBtYXNrICovXG4gIGNsYXNzIE1hc2tlZFBhdHRlcm4gZXh0ZW5kcyBNYXNrZWQge1xuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogU2luZ2xlIGNoYXIgZm9yIGVtcHR5IGlucHV0ICovXG5cbiAgICAvKiogU2luZ2xlIGNoYXIgZm9yIGZpbGxlZCBpbnB1dCAqL1xuXG4gICAgLyoqIFNob3cgcGxhY2Vob2xkZXIgb25seSB3aGVuIG5lZWRlZCAqL1xuXG4gICAgLyoqIEVuYWJsZSBjaGFyYWN0ZXJzIG92ZXJ3cml0aW5nICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBzdXBlcih7XG4gICAgICAgIC4uLk1hc2tlZFBhdHRlcm4uREVGQVVMVFMsXG4gICAgICAgIC4uLm9wdHMsXG4gICAgICAgIGRlZmluaXRpb25zOiBPYmplY3QuYXNzaWduKHt9LCBQYXR0ZXJuSW5wdXREZWZpbml0aW9uLkRFRkFVTFRfREVGSU5JVElPTlMsIG9wdHMgPT0gbnVsbCA/IHZvaWQgMCA6IG9wdHMuZGVmaW5pdGlvbnMpXG4gICAgICB9KTtcbiAgICB9XG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIG9wdHMuZGVmaW5pdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmRlZmluaXRpb25zLCBvcHRzLmRlZmluaXRpb25zKTtcbiAgICAgIHN1cGVyLl91cGRhdGUob3B0cyk7XG4gICAgICB0aGlzLl9yZWJ1aWxkTWFzaygpO1xuICAgIH1cbiAgICBfcmVidWlsZE1hc2soKSB7XG4gICAgICBjb25zdCBkZWZzID0gdGhpcy5kZWZpbml0aW9ucztcbiAgICAgIHRoaXMuX2Jsb2NrcyA9IFtdO1xuICAgICAgdGhpcy5leHBvc2VCbG9jayA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuX3N0b3BzID0gW107XG4gICAgICB0aGlzLl9tYXNrZWRCbG9ja3MgPSB7fTtcbiAgICAgIGNvbnN0IHBhdHRlcm4gPSB0aGlzLm1hc2s7XG4gICAgICBpZiAoIXBhdHRlcm4gfHwgIWRlZnMpIHJldHVybjtcbiAgICAgIGxldCB1bm1hc2tpbmdCbG9jayA9IGZhbHNlO1xuICAgICAgbGV0IG9wdGlvbmFsQmxvY2sgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0dGVybi5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAodGhpcy5ibG9ja3MpIHtcbiAgICAgICAgICBjb25zdCBwID0gcGF0dGVybi5zbGljZShpKTtcbiAgICAgICAgICBjb25zdCBiTmFtZXMgPSBPYmplY3Qua2V5cyh0aGlzLmJsb2NrcykuZmlsdGVyKGJOYW1lID0+IHAuaW5kZXhPZihiTmFtZSkgPT09IDApO1xuICAgICAgICAgIC8vIG9yZGVyIGJ5IGtleSBsZW5ndGhcbiAgICAgICAgICBiTmFtZXMuc29ydCgoYSwgYikgPT4gYi5sZW5ndGggLSBhLmxlbmd0aCk7XG4gICAgICAgICAgLy8gdXNlIGJsb2NrIG5hbWUgd2l0aCBtYXggbGVuZ3RoXG4gICAgICAgICAgY29uc3QgYk5hbWUgPSBiTmFtZXNbMF07XG4gICAgICAgICAgaWYgKGJOYW1lKSB7XG4gICAgICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICAgIGV4cG9zZSxcbiAgICAgICAgICAgICAgcmVwZWF0LFxuICAgICAgICAgICAgICAuLi5iT3B0c1xuICAgICAgICAgICAgfSA9IG5vcm1hbGl6ZU9wdHModGhpcy5ibG9ja3NbYk5hbWVdKTsgLy8gVE9ETyB0eXBlIE9wdHM8QXJnICYgRXh0cmE+XG4gICAgICAgICAgICBjb25zdCBibG9ja09wdHMgPSB7XG4gICAgICAgICAgICAgIGxhenk6IHRoaXMubGF6eSxcbiAgICAgICAgICAgICAgZWFnZXI6IHRoaXMuZWFnZXIsXG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyQ2hhcjogdGhpcy5wbGFjZWhvbGRlckNoYXIsXG4gICAgICAgICAgICAgIGRpc3BsYXlDaGFyOiB0aGlzLmRpc3BsYXlDaGFyLFxuICAgICAgICAgICAgICBvdmVyd3JpdGU6IHRoaXMub3ZlcndyaXRlLFxuICAgICAgICAgICAgICBhdXRvZml4OiB0aGlzLmF1dG9maXgsXG4gICAgICAgICAgICAgIC4uLmJPcHRzLFxuICAgICAgICAgICAgICByZXBlYXQsXG4gICAgICAgICAgICAgIHBhcmVudDogdGhpc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IG1hc2tlZEJsb2NrID0gcmVwZWF0ICE9IG51bGwgPyBuZXcgSU1hc2suUmVwZWF0QmxvY2soYmxvY2tPcHRzIC8qIFRPRE8gKi8pIDogY3JlYXRlTWFzayhibG9ja09wdHMpO1xuICAgICAgICAgICAgaWYgKG1hc2tlZEJsb2NrKSB7XG4gICAgICAgICAgICAgIHRoaXMuX2Jsb2Nrcy5wdXNoKG1hc2tlZEJsb2NrKTtcbiAgICAgICAgICAgICAgaWYgKGV4cG9zZSkgdGhpcy5leHBvc2VCbG9jayA9IG1hc2tlZEJsb2NrO1xuXG4gICAgICAgICAgICAgIC8vIHN0b3JlIGJsb2NrIGluZGV4XG4gICAgICAgICAgICAgIGlmICghdGhpcy5fbWFza2VkQmxvY2tzW2JOYW1lXSkgdGhpcy5fbWFza2VkQmxvY2tzW2JOYW1lXSA9IFtdO1xuICAgICAgICAgICAgICB0aGlzLl9tYXNrZWRCbG9ja3NbYk5hbWVdLnB1c2godGhpcy5fYmxvY2tzLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSArPSBiTmFtZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBjaGFyID0gcGF0dGVybltpXTtcbiAgICAgICAgbGV0IGlzSW5wdXQgPSAoY2hhciBpbiBkZWZzKTtcbiAgICAgICAgaWYgKGNoYXIgPT09IE1hc2tlZFBhdHRlcm4uU1RPUF9DSEFSKSB7XG4gICAgICAgICAgdGhpcy5fc3RvcHMucHVzaCh0aGlzLl9ibG9ja3MubGVuZ3RoKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhciA9PT0gJ3snIHx8IGNoYXIgPT09ICd9Jykge1xuICAgICAgICAgIHVubWFza2luZ0Jsb2NrID0gIXVubWFza2luZ0Jsb2NrO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFyID09PSAnWycgfHwgY2hhciA9PT0gJ10nKSB7XG4gICAgICAgICAgb3B0aW9uYWxCbG9jayA9ICFvcHRpb25hbEJsb2NrO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFyID09PSBNYXNrZWRQYXR0ZXJuLkVTQ0FQRV9DSEFSKSB7XG4gICAgICAgICAgKytpO1xuICAgICAgICAgIGNoYXIgPSBwYXR0ZXJuW2ldO1xuICAgICAgICAgIGlmICghY2hhcikgYnJlYWs7XG4gICAgICAgICAgaXNJbnB1dCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlZiA9IGlzSW5wdXQgPyBuZXcgUGF0dGVybklucHV0RGVmaW5pdGlvbih7XG4gICAgICAgICAgaXNPcHRpb25hbDogb3B0aW9uYWxCbG9jayxcbiAgICAgICAgICBsYXp5OiB0aGlzLmxhenksXG4gICAgICAgICAgZWFnZXI6IHRoaXMuZWFnZXIsXG4gICAgICAgICAgcGxhY2Vob2xkZXJDaGFyOiB0aGlzLnBsYWNlaG9sZGVyQ2hhcixcbiAgICAgICAgICBkaXNwbGF5Q2hhcjogdGhpcy5kaXNwbGF5Q2hhcixcbiAgICAgICAgICAuLi5ub3JtYWxpemVPcHRzKGRlZnNbY2hhcl0pLFxuICAgICAgICAgIHBhcmVudDogdGhpc1xuICAgICAgICB9KSA6IG5ldyBQYXR0ZXJuRml4ZWREZWZpbml0aW9uKHtcbiAgICAgICAgICBjaGFyLFxuICAgICAgICAgIGVhZ2VyOiB0aGlzLmVhZ2VyLFxuICAgICAgICAgIGlzVW5tYXNraW5nOiB1bm1hc2tpbmdCbG9ja1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fYmxvY2tzLnB1c2goZGVmKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uc3VwZXIuc3RhdGUsXG4gICAgICAgIF9ibG9ja3M6IHRoaXMuX2Jsb2Nrcy5tYXAoYiA9PiBiLnN0YXRlKVxuICAgICAgfTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHN0YXRlKSB7XG4gICAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qge1xuICAgICAgICBfYmxvY2tzLFxuICAgICAgICAuLi5tYXNrZWRTdGF0ZVxuICAgICAgfSA9IHN0YXRlO1xuICAgICAgdGhpcy5fYmxvY2tzLmZvckVhY2goKGIsIGJpKSA9PiBiLnN0YXRlID0gX2Jsb2Nrc1tiaV0pO1xuICAgICAgc3VwZXIuc3RhdGUgPSBtYXNrZWRTdGF0ZTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICBzdXBlci5yZXNldCgpO1xuICAgICAgdGhpcy5fYmxvY2tzLmZvckVhY2goYiA9PiBiLnJlc2V0KCkpO1xuICAgIH1cbiAgICBnZXQgaXNDb21wbGV0ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cG9zZUJsb2NrID8gdGhpcy5leHBvc2VCbG9jay5pc0NvbXBsZXRlIDogdGhpcy5fYmxvY2tzLmV2ZXJ5KGIgPT4gYi5pc0NvbXBsZXRlKTtcbiAgICB9XG4gICAgZ2V0IGlzRmlsbGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Jsb2Nrcy5ldmVyeShiID0+IGIuaXNGaWxsZWQpO1xuICAgIH1cbiAgICBnZXQgaXNGaXhlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9ibG9ja3MuZXZlcnkoYiA9PiBiLmlzRml4ZWQpO1xuICAgIH1cbiAgICBnZXQgaXNPcHRpb25hbCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9ibG9ja3MuZXZlcnkoYiA9PiBiLmlzT3B0aW9uYWwpO1xuICAgIH1cbiAgICBkb0NvbW1pdCgpIHtcbiAgICAgIHRoaXMuX2Jsb2Nrcy5mb3JFYWNoKGIgPT4gYi5kb0NvbW1pdCgpKTtcbiAgICAgIHN1cGVyLmRvQ29tbWl0KCk7XG4gICAgfVxuICAgIGdldCB1bm1hc2tlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwb3NlQmxvY2sgPyB0aGlzLmV4cG9zZUJsb2NrLnVubWFza2VkVmFsdWUgOiB0aGlzLl9ibG9ja3MucmVkdWNlKChzdHIsIGIpID0+IHN0ciArPSBiLnVubWFza2VkVmFsdWUsICcnKTtcbiAgICB9XG4gICAgc2V0IHVubWFza2VkVmFsdWUodW5tYXNrZWRWYWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZXhwb3NlQmxvY2spIHtcbiAgICAgICAgY29uc3QgdGFpbCA9IHRoaXMuZXh0cmFjdFRhaWwodGhpcy5fYmxvY2tTdGFydFBvcyh0aGlzLl9ibG9ja3MuaW5kZXhPZih0aGlzLmV4cG9zZUJsb2NrKSkgKyB0aGlzLmV4cG9zZUJsb2NrLmRpc3BsYXlWYWx1ZS5sZW5ndGgpO1xuICAgICAgICB0aGlzLmV4cG9zZUJsb2NrLnVubWFza2VkVmFsdWUgPSB1bm1hc2tlZFZhbHVlO1xuICAgICAgICB0aGlzLmFwcGVuZFRhaWwodGFpbCk7XG4gICAgICAgIHRoaXMuZG9Db21taXQoKTtcbiAgICAgIH0gZWxzZSBzdXBlci51bm1hc2tlZFZhbHVlID0gdW5tYXNrZWRWYWx1ZTtcbiAgICB9XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwb3NlQmxvY2sgPyB0aGlzLmV4cG9zZUJsb2NrLnZhbHVlIDpcbiAgICAgIC8vIFRPRE8gcmV0dXJuIF92YWx1ZSB3aGVuIG5vdCBpbiBjaGFuZ2U/XG4gICAgICB0aGlzLl9ibG9ja3MucmVkdWNlKChzdHIsIGIpID0+IHN0ciArPSBiLnZhbHVlLCAnJyk7XG4gICAgfVxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZXhwb3NlQmxvY2spIHtcbiAgICAgICAgY29uc3QgdGFpbCA9IHRoaXMuZXh0cmFjdFRhaWwodGhpcy5fYmxvY2tTdGFydFBvcyh0aGlzLl9ibG9ja3MuaW5kZXhPZih0aGlzLmV4cG9zZUJsb2NrKSkgKyB0aGlzLmV4cG9zZUJsb2NrLmRpc3BsYXlWYWx1ZS5sZW5ndGgpO1xuICAgICAgICB0aGlzLmV4cG9zZUJsb2NrLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuYXBwZW5kVGFpbCh0YWlsKTtcbiAgICAgICAgdGhpcy5kb0NvbW1pdCgpO1xuICAgICAgfSBlbHNlIHN1cGVyLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIGdldCB0eXBlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwb3NlQmxvY2sgPyB0aGlzLmV4cG9zZUJsb2NrLnR5cGVkVmFsdWUgOiBzdXBlci50eXBlZFZhbHVlO1xuICAgIH1cbiAgICBzZXQgdHlwZWRWYWx1ZSh2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZXhwb3NlQmxvY2spIHtcbiAgICAgICAgY29uc3QgdGFpbCA9IHRoaXMuZXh0cmFjdFRhaWwodGhpcy5fYmxvY2tTdGFydFBvcyh0aGlzLl9ibG9ja3MuaW5kZXhPZih0aGlzLmV4cG9zZUJsb2NrKSkgKyB0aGlzLmV4cG9zZUJsb2NrLmRpc3BsYXlWYWx1ZS5sZW5ndGgpO1xuICAgICAgICB0aGlzLmV4cG9zZUJsb2NrLnR5cGVkVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5hcHBlbmRUYWlsKHRhaWwpO1xuICAgICAgICB0aGlzLmRvQ29tbWl0KCk7XG4gICAgICB9IGVsc2Ugc3VwZXIudHlwZWRWYWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBnZXQgZGlzcGxheVZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Jsb2Nrcy5yZWR1Y2UoKHN0ciwgYikgPT4gc3RyICs9IGIuZGlzcGxheVZhbHVlLCAnJyk7XG4gICAgfVxuICAgIGFwcGVuZFRhaWwodGFpbCkge1xuICAgICAgcmV0dXJuIHN1cGVyLmFwcGVuZFRhaWwodGFpbCkuYWdncmVnYXRlKHRoaXMuX2FwcGVuZFBsYWNlaG9sZGVyKCkpO1xuICAgIH1cbiAgICBfYXBwZW5kRWFnZXIoKSB7XG4gICAgICB2YXIgX3RoaXMkX21hcFBvc1RvQmxvY2s7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGxldCBzdGFydEJsb2NrSW5kZXggPSAoX3RoaXMkX21hcFBvc1RvQmxvY2sgPSB0aGlzLl9tYXBQb3NUb0Jsb2NrKHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCkpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRfbWFwUG9zVG9CbG9jay5pbmRleDtcbiAgICAgIGlmIChzdGFydEJsb2NrSW5kZXggPT0gbnVsbCkgcmV0dXJuIGRldGFpbHM7XG5cbiAgICAgIC8vIFRPRE8gdGVzdCBpZiBpdCB3b3JrcyBmb3IgbmVzdGVkIHBhdHRlcm4gbWFza3NcbiAgICAgIGlmICh0aGlzLl9ibG9ja3Nbc3RhcnRCbG9ja0luZGV4XS5pc0ZpbGxlZCkgKytzdGFydEJsb2NrSW5kZXg7XG4gICAgICBmb3IgKGxldCBiaSA9IHN0YXJ0QmxvY2tJbmRleDsgYmkgPCB0aGlzLl9ibG9ja3MubGVuZ3RoOyArK2JpKSB7XG4gICAgICAgIGNvbnN0IGQgPSB0aGlzLl9ibG9ja3NbYmldLl9hcHBlbmRFYWdlcigpO1xuICAgICAgICBpZiAoIWQuaW5zZXJ0ZWQpIGJyZWFrO1xuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShkKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBfYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBjb25zdCBibG9ja0l0ZXIgPSB0aGlzLl9tYXBQb3NUb0Jsb2NrKHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCk7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGlmICghYmxvY2tJdGVyKSByZXR1cm4gZGV0YWlscztcbiAgICAgIGZvciAobGV0IGJpID0gYmxvY2tJdGVyLmluZGV4LCBibG9jazsgYmxvY2sgPSB0aGlzLl9ibG9ja3NbYmldOyArK2JpKSB7XG4gICAgICAgIHZhciBfZmxhZ3MkX2JlZm9yZVRhaWxTdGE7XG4gICAgICAgIGNvbnN0IGJsb2NrRGV0YWlscyA9IGJsb2NrLl9hcHBlbmRDaGFyKGNoLCB7XG4gICAgICAgICAgLi4uZmxhZ3MsXG4gICAgICAgICAgX2JlZm9yZVRhaWxTdGF0ZTogKF9mbGFncyRfYmVmb3JlVGFpbFN0YSA9IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUpID09IG51bGwgfHwgKF9mbGFncyRfYmVmb3JlVGFpbFN0YSA9IF9mbGFncyRfYmVmb3JlVGFpbFN0YS5fYmxvY2tzKSA9PSBudWxsID8gdm9pZCAwIDogX2ZsYWdzJF9iZWZvcmVUYWlsU3RhW2JpXVxuICAgICAgICB9KTtcbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUoYmxvY2tEZXRhaWxzKTtcbiAgICAgICAgaWYgKGJsb2NrRGV0YWlscy5jb25zdW1lZCkgYnJlYWs7IC8vIGdvIG5leHQgY2hhclxuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIGV4dHJhY3RUYWlsKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBjb25zdCBjaHVua1RhaWwgPSBuZXcgQ2h1bmtzVGFpbERldGFpbHMoKTtcbiAgICAgIGlmIChmcm9tUG9zID09PSB0b1BvcykgcmV0dXJuIGNodW5rVGFpbDtcbiAgICAgIHRoaXMuX2ZvckVhY2hCbG9ja3NJblJhbmdlKGZyb21Qb3MsIHRvUG9zLCAoYiwgYmksIGJGcm9tUG9zLCBiVG9Qb3MpID0+IHtcbiAgICAgICAgY29uc3QgYmxvY2tDaHVuayA9IGIuZXh0cmFjdFRhaWwoYkZyb21Qb3MsIGJUb1Bvcyk7XG4gICAgICAgIGJsb2NrQ2h1bmsuc3RvcCA9IHRoaXMuX2ZpbmRTdG9wQmVmb3JlKGJpKTtcbiAgICAgICAgYmxvY2tDaHVuay5mcm9tID0gdGhpcy5fYmxvY2tTdGFydFBvcyhiaSk7XG4gICAgICAgIGlmIChibG9ja0NodW5rIGluc3RhbmNlb2YgQ2h1bmtzVGFpbERldGFpbHMpIGJsb2NrQ2h1bmsuYmxvY2tJbmRleCA9IGJpO1xuICAgICAgICBjaHVua1RhaWwuZXh0ZW5kKGJsb2NrQ2h1bmspO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gY2h1bmtUYWlsO1xuICAgIH1cbiAgICBleHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKGZyb21Qb3MgPT09IHRvUG9zKSByZXR1cm4gJyc7XG4gICAgICBsZXQgaW5wdXQgPSAnJztcbiAgICAgIHRoaXMuX2ZvckVhY2hCbG9ja3NJblJhbmdlKGZyb21Qb3MsIHRvUG9zLCAoYiwgXywgZnJvbVBvcywgdG9Qb3MpID0+IHtcbiAgICAgICAgaW5wdXQgKz0gYi5leHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGlucHV0O1xuICAgIH1cbiAgICBfZmluZFN0b3BCZWZvcmUoYmxvY2tJbmRleCkge1xuICAgICAgbGV0IHN0b3BCZWZvcmU7XG4gICAgICBmb3IgKGxldCBzaSA9IDA7IHNpIDwgdGhpcy5fc3RvcHMubGVuZ3RoOyArK3NpKSB7XG4gICAgICAgIGNvbnN0IHN0b3AgPSB0aGlzLl9zdG9wc1tzaV07XG4gICAgICAgIGlmIChzdG9wIDw9IGJsb2NrSW5kZXgpIHN0b3BCZWZvcmUgPSBzdG9wO2Vsc2UgYnJlYWs7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RvcEJlZm9yZTtcbiAgICB9XG5cbiAgICAvKiogQXBwZW5kcyBwbGFjZWhvbGRlciBkZXBlbmRpbmcgb24gbGF6aW5lc3MgKi9cbiAgICBfYXBwZW5kUGxhY2Vob2xkZXIodG9CbG9ja0luZGV4KSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGlmICh0aGlzLmxhenkgJiYgdG9CbG9ja0luZGV4ID09IG51bGwpIHJldHVybiBkZXRhaWxzO1xuICAgICAgY29uc3Qgc3RhcnRCbG9ja0l0ZXIgPSB0aGlzLl9tYXBQb3NUb0Jsb2NrKHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCk7XG4gICAgICBpZiAoIXN0YXJ0QmxvY2tJdGVyKSByZXR1cm4gZGV0YWlscztcbiAgICAgIGNvbnN0IHN0YXJ0QmxvY2tJbmRleCA9IHN0YXJ0QmxvY2tJdGVyLmluZGV4O1xuICAgICAgY29uc3QgZW5kQmxvY2tJbmRleCA9IHRvQmxvY2tJbmRleCAhPSBudWxsID8gdG9CbG9ja0luZGV4IDogdGhpcy5fYmxvY2tzLmxlbmd0aDtcbiAgICAgIHRoaXMuX2Jsb2Nrcy5zbGljZShzdGFydEJsb2NrSW5kZXgsIGVuZEJsb2NrSW5kZXgpLmZvckVhY2goYiA9PiB7XG4gICAgICAgIGlmICghYi5sYXp5IHx8IHRvQmxvY2tJbmRleCAhPSBudWxsKSB7XG4gICAgICAgICAgdmFyIF9ibG9ja3MyO1xuICAgICAgICAgIGRldGFpbHMuYWdncmVnYXRlKGIuX2FwcGVuZFBsYWNlaG9sZGVyKChfYmxvY2tzMiA9IGIuX2Jsb2NrcykgPT0gbnVsbCA/IHZvaWQgMCA6IF9ibG9ja3MyLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cblxuICAgIC8qKiBGaW5kcyBibG9jayBpbiBwb3MgKi9cbiAgICBfbWFwUG9zVG9CbG9jayhwb3MpIHtcbiAgICAgIGxldCBhY2NWYWwgPSAnJztcbiAgICAgIGZvciAobGV0IGJpID0gMDsgYmkgPCB0aGlzLl9ibG9ja3MubGVuZ3RoOyArK2JpKSB7XG4gICAgICAgIGNvbnN0IGJsb2NrID0gdGhpcy5fYmxvY2tzW2JpXTtcbiAgICAgICAgY29uc3QgYmxvY2tTdGFydFBvcyA9IGFjY1ZhbC5sZW5ndGg7XG4gICAgICAgIGFjY1ZhbCArPSBibG9jay5kaXNwbGF5VmFsdWU7XG4gICAgICAgIGlmIChwb3MgPD0gYWNjVmFsLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbmRleDogYmksXG4gICAgICAgICAgICBvZmZzZXQ6IHBvcyAtIGJsb2NrU3RhcnRQb3NcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIF9ibG9ja1N0YXJ0UG9zKGJsb2NrSW5kZXgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9ibG9ja3Muc2xpY2UoMCwgYmxvY2tJbmRleCkucmVkdWNlKChwb3MsIGIpID0+IHBvcyArPSBiLmRpc3BsYXlWYWx1ZS5sZW5ndGgsIDApO1xuICAgIH1cbiAgICBfZm9yRWFjaEJsb2Nrc0luUmFuZ2UoZnJvbVBvcywgdG9Qb3MsIGZuKSB7XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZyb21CbG9ja0l0ZXIgPSB0aGlzLl9tYXBQb3NUb0Jsb2NrKGZyb21Qb3MpO1xuICAgICAgaWYgKGZyb21CbG9ja0l0ZXIpIHtcbiAgICAgICAgY29uc3QgdG9CbG9ja0l0ZXIgPSB0aGlzLl9tYXBQb3NUb0Jsb2NrKHRvUG9zKTtcbiAgICAgICAgLy8gcHJvY2VzcyBmaXJzdCBibG9ja1xuICAgICAgICBjb25zdCBpc1NhbWVCbG9jayA9IHRvQmxvY2tJdGVyICYmIGZyb21CbG9ja0l0ZXIuaW5kZXggPT09IHRvQmxvY2tJdGVyLmluZGV4O1xuICAgICAgICBjb25zdCBmcm9tQmxvY2tTdGFydFBvcyA9IGZyb21CbG9ja0l0ZXIub2Zmc2V0O1xuICAgICAgICBjb25zdCBmcm9tQmxvY2tFbmRQb3MgPSB0b0Jsb2NrSXRlciAmJiBpc1NhbWVCbG9jayA/IHRvQmxvY2tJdGVyLm9mZnNldCA6IHRoaXMuX2Jsb2Nrc1tmcm9tQmxvY2tJdGVyLmluZGV4XS5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgICBmbih0aGlzLl9ibG9ja3NbZnJvbUJsb2NrSXRlci5pbmRleF0sIGZyb21CbG9ja0l0ZXIuaW5kZXgsIGZyb21CbG9ja1N0YXJ0UG9zLCBmcm9tQmxvY2tFbmRQb3MpO1xuICAgICAgICBpZiAodG9CbG9ja0l0ZXIgJiYgIWlzU2FtZUJsb2NrKSB7XG4gICAgICAgICAgLy8gcHJvY2VzcyBpbnRlcm1lZGlhdGUgYmxvY2tzXG4gICAgICAgICAgZm9yIChsZXQgYmkgPSBmcm9tQmxvY2tJdGVyLmluZGV4ICsgMTsgYmkgPCB0b0Jsb2NrSXRlci5pbmRleDsgKytiaSkge1xuICAgICAgICAgICAgZm4odGhpcy5fYmxvY2tzW2JpXSwgYmksIDAsIHRoaXMuX2Jsb2Nrc1tiaV0uZGlzcGxheVZhbHVlLmxlbmd0aCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gcHJvY2VzcyBsYXN0IGJsb2NrXG4gICAgICAgICAgZm4odGhpcy5fYmxvY2tzW3RvQmxvY2tJdGVyLmluZGV4XSwgdG9CbG9ja0l0ZXIuaW5kZXgsIDAsIHRvQmxvY2tJdGVyLm9mZnNldCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBjb25zdCByZW1vdmVEZXRhaWxzID0gc3VwZXIucmVtb3ZlKGZyb21Qb3MsIHRvUG9zKTtcbiAgICAgIHRoaXMuX2ZvckVhY2hCbG9ja3NJblJhbmdlKGZyb21Qb3MsIHRvUG9zLCAoYiwgXywgYkZyb21Qb3MsIGJUb1BvcykgPT4ge1xuICAgICAgICByZW1vdmVEZXRhaWxzLmFnZ3JlZ2F0ZShiLnJlbW92ZShiRnJvbVBvcywgYlRvUG9zKSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZW1vdmVEZXRhaWxzO1xuICAgIH1cbiAgICBuZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBkaXJlY3Rpb24pIHtcbiAgICAgIGlmIChkaXJlY3Rpb24gPT09IHZvaWQgMCkge1xuICAgICAgICBkaXJlY3Rpb24gPSBESVJFQ1RJT04uTk9ORTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5fYmxvY2tzLmxlbmd0aCkgcmV0dXJuIDA7XG4gICAgICBjb25zdCBjdXJzb3IgPSBuZXcgUGF0dGVybkN1cnNvcih0aGlzLCBjdXJzb3JQb3MpO1xuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLk5PTkUpIHtcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvLyBOT05FIHNob3VsZCBvbmx5IGdvIG91dCBmcm9tIGZpeGVkIHRvIHRoZSByaWdodCFcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICBpZiAoY3Vyc29yLnB1c2hSaWdodEJlZm9yZUlucHV0KCkpIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICBjdXJzb3IucG9wU3RhdGUoKTtcbiAgICAgICAgaWYgKGN1cnNvci5wdXNoTGVmdEJlZm9yZUlucHV0KCkpIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICAvLyBGT1JDRSBpcyBvbmx5IGFib3V0IGF8KiBvdGhlcndpc2UgaXMgMFxuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkxFRlQgfHwgZGlyZWN0aW9uID09PSBESVJFQ1RJT04uRk9SQ0VfTEVGVCkge1xuICAgICAgICAvLyB0cnkgdG8gYnJlYWsgZmFzdCB3aGVuICp8YVxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSBESVJFQ1RJT04uTEVGVCkge1xuICAgICAgICAgIGN1cnNvci5wdXNoUmlnaHRCZWZvcmVGaWxsZWQoKTtcbiAgICAgICAgICBpZiAoY3Vyc29yLm9rICYmIGN1cnNvci5wb3MgPT09IGN1cnNvclBvcykgcmV0dXJuIGN1cnNvclBvcztcbiAgICAgICAgICBjdXJzb3IucG9wU3RhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZvcndhcmQgZmxvd1xuICAgICAgICBjdXJzb3IucHVzaExlZnRCZWZvcmVJbnB1dCgpO1xuICAgICAgICBjdXJzb3IucHVzaExlZnRCZWZvcmVSZXF1aXJlZCgpO1xuICAgICAgICBjdXJzb3IucHVzaExlZnRCZWZvcmVGaWxsZWQoKTtcblxuICAgICAgICAvLyBiYWNrd2FyZCBmbG93XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09IERJUkVDVElPTi5MRUZUKSB7XG4gICAgICAgICAgY3Vyc29yLnB1c2hSaWdodEJlZm9yZUlucHV0KCk7XG4gICAgICAgICAgY3Vyc29yLnB1c2hSaWdodEJlZm9yZVJlcXVpcmVkKCk7XG4gICAgICAgICAgaWYgKGN1cnNvci5vayAmJiBjdXJzb3IucG9zIDw9IGN1cnNvclBvcykgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgICAgY3Vyc29yLnBvcFN0YXRlKCk7XG4gICAgICAgICAgaWYgKGN1cnNvci5vayAmJiBjdXJzb3IucG9zIDw9IGN1cnNvclBvcykgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgICAgY3Vyc29yLnBvcFN0YXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGN1cnNvci5vaykgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09IERJUkVDVElPTi5GT1JDRV9MRUZUKSByZXR1cm4gMDtcbiAgICAgICAgY3Vyc29yLnBvcFN0YXRlKCk7XG4gICAgICAgIGlmIChjdXJzb3Iub2spIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICBjdXJzb3IucG9wU3RhdGUoKTtcbiAgICAgICAgaWYgKGN1cnNvci5vaykgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLlJJR0hUIHx8IGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkZPUkNFX1JJR0hUKSB7XG4gICAgICAgIC8vIGZvcndhcmQgZmxvd1xuICAgICAgICBjdXJzb3IucHVzaFJpZ2h0QmVmb3JlSW5wdXQoKTtcbiAgICAgICAgY3Vyc29yLnB1c2hSaWdodEJlZm9yZVJlcXVpcmVkKCk7XG4gICAgICAgIGlmIChjdXJzb3IucHVzaFJpZ2h0QmVmb3JlRmlsbGVkKCkpIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSBESVJFQ1RJT04uRk9SQ0VfUklHSFQpIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG5cbiAgICAgICAgLy8gYmFja3dhcmQgZmxvd1xuICAgICAgICBjdXJzb3IucG9wU3RhdGUoKTtcbiAgICAgICAgaWYgKGN1cnNvci5vaykgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgIGN1cnNvci5wb3BTdGF0ZSgpO1xuICAgICAgICBpZiAoY3Vyc29yLm9rKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgcmV0dXJuIHRoaXMubmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgRElSRUNUSU9OLkxFRlQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGN1cnNvclBvcztcbiAgICB9XG4gICAgdG90YWxJbnB1dFBvc2l0aW9ucyhmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgbGV0IHRvdGFsID0gMDtcbiAgICAgIHRoaXMuX2ZvckVhY2hCbG9ja3NJblJhbmdlKGZyb21Qb3MsIHRvUG9zLCAoYiwgXywgYkZyb21Qb3MsIGJUb1BvcykgPT4ge1xuICAgICAgICB0b3RhbCArPSBiLnRvdGFsSW5wdXRQb3NpdGlvbnMoYkZyb21Qb3MsIGJUb1Bvcyk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0b3RhbDtcbiAgICB9XG5cbiAgICAvKiogR2V0IGJsb2NrIGJ5IG5hbWUgKi9cbiAgICBtYXNrZWRCbG9jayhuYW1lKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWRCbG9ja3MobmFtZSlbMF07XG4gICAgfVxuXG4gICAgLyoqIEdldCBhbGwgYmxvY2tzIGJ5IG5hbWUgKi9cbiAgICBtYXNrZWRCbG9ja3MobmFtZSkge1xuICAgICAgY29uc3QgaW5kaWNlcyA9IHRoaXMuX21hc2tlZEJsb2Nrc1tuYW1lXTtcbiAgICAgIGlmICghaW5kaWNlcykgcmV0dXJuIFtdO1xuICAgICAgcmV0dXJuIGluZGljZXMubWFwKGdpID0+IHRoaXMuX2Jsb2Nrc1tnaV0pO1xuICAgIH1cbiAgICBwYWQoZmxhZ3MpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgdGhpcy5fZm9yRWFjaEJsb2Nrc0luUmFuZ2UoMCwgdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoLCBiID0+IGRldGFpbHMuYWdncmVnYXRlKGIucGFkKGZsYWdzKSkpO1xuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICB9XG4gIE1hc2tlZFBhdHRlcm4uREVGQVVMVFMgPSB7XG4gICAgLi4uTWFza2VkLkRFRkFVTFRTLFxuICAgIGxhenk6IHRydWUsXG4gICAgcGxhY2Vob2xkZXJDaGFyOiAnXydcbiAgfTtcbiAgTWFza2VkUGF0dGVybi5TVE9QX0NIQVIgPSAnYCc7XG4gIE1hc2tlZFBhdHRlcm4uRVNDQVBFX0NIQVIgPSAnXFxcXCc7XG4gIE1hc2tlZFBhdHRlcm4uSW5wdXREZWZpbml0aW9uID0gUGF0dGVybklucHV0RGVmaW5pdGlvbjtcbiAgTWFza2VkUGF0dGVybi5GaXhlZERlZmluaXRpb24gPSBQYXR0ZXJuRml4ZWREZWZpbml0aW9uO1xuICBJTWFzay5NYXNrZWRQYXR0ZXJuID0gTWFza2VkUGF0dGVybjtcblxuICAvKiogUGF0dGVybiB3aGljaCBhY2NlcHRzIHJhbmdlcyAqL1xuICBjbGFzcyBNYXNrZWRSYW5nZSBleHRlbmRzIE1hc2tlZFBhdHRlcm4ge1xuICAgIC8qKlxuICAgICAgT3B0aW9uYWxseSBzZXRzIG1heCBsZW5ndGggb2YgcGF0dGVybi5cbiAgICAgIFVzZWQgd2hlbiBwYXR0ZXJuIGxlbmd0aCBpcyBsb25nZXIgdGhlbiBgdG9gIHBhcmFtIGxlbmd0aC4gUGFkcyB6ZXJvcyBhdCBzdGFydCBpbiB0aGlzIGNhc2UuXG4gICAgKi9cblxuICAgIC8qKiBNaW4gYm91bmQgKi9cblxuICAgIC8qKiBNYXggYm91bmQgKi9cblxuICAgIGdldCBfbWF0Y2hGcm9tKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWF4TGVuZ3RoIC0gU3RyaW5nKHRoaXMuZnJvbSkubGVuZ3RoO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBzdXBlcihvcHRzKTsgLy8gbWFzayB3aWxsIGJlIGNyZWF0ZWQgaW4gX3VwZGF0ZVxuICAgIH1cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgY29uc3Qge1xuICAgICAgICB0byA9IHRoaXMudG8gfHwgMCxcbiAgICAgICAgZnJvbSA9IHRoaXMuZnJvbSB8fCAwLFxuICAgICAgICBtYXhMZW5ndGggPSB0aGlzLm1heExlbmd0aCB8fCAwLFxuICAgICAgICBhdXRvZml4ID0gdGhpcy5hdXRvZml4LFxuICAgICAgICAuLi5wYXR0ZXJuT3B0c1xuICAgICAgfSA9IG9wdHM7XG4gICAgICB0aGlzLnRvID0gdG87XG4gICAgICB0aGlzLmZyb20gPSBmcm9tO1xuICAgICAgdGhpcy5tYXhMZW5ndGggPSBNYXRoLm1heChTdHJpbmcodG8pLmxlbmd0aCwgbWF4TGVuZ3RoKTtcbiAgICAgIHRoaXMuYXV0b2ZpeCA9IGF1dG9maXg7XG4gICAgICBjb25zdCBmcm9tU3RyID0gU3RyaW5nKHRoaXMuZnJvbSkucGFkU3RhcnQodGhpcy5tYXhMZW5ndGgsICcwJyk7XG4gICAgICBjb25zdCB0b1N0ciA9IFN0cmluZyh0aGlzLnRvKS5wYWRTdGFydCh0aGlzLm1heExlbmd0aCwgJzAnKTtcbiAgICAgIGxldCBzYW1lQ2hhcnNDb3VudCA9IDA7XG4gICAgICB3aGlsZSAoc2FtZUNoYXJzQ291bnQgPCB0b1N0ci5sZW5ndGggJiYgdG9TdHJbc2FtZUNoYXJzQ291bnRdID09PSBmcm9tU3RyW3NhbWVDaGFyc0NvdW50XSkgKytzYW1lQ2hhcnNDb3VudDtcbiAgICAgIHBhdHRlcm5PcHRzLm1hc2sgPSB0b1N0ci5zbGljZSgwLCBzYW1lQ2hhcnNDb3VudCkucmVwbGFjZSgvMC9nLCAnXFxcXDAnKSArICcwJy5yZXBlYXQodGhpcy5tYXhMZW5ndGggLSBzYW1lQ2hhcnNDb3VudCk7XG4gICAgICBzdXBlci5fdXBkYXRlKHBhdHRlcm5PcHRzKTtcbiAgICB9XG4gICAgZ2V0IGlzQ29tcGxldGUoKSB7XG4gICAgICByZXR1cm4gc3VwZXIuaXNDb21wbGV0ZSAmJiBCb29sZWFuKHRoaXMudmFsdWUpO1xuICAgIH1cbiAgICBib3VuZGFyaWVzKHN0cikge1xuICAgICAgbGV0IG1pbnN0ciA9ICcnO1xuICAgICAgbGV0IG1heHN0ciA9ICcnO1xuICAgICAgY29uc3QgWywgcGxhY2Vob2xkZXIsIG51bV0gPSBzdHIubWF0Y2goL14oXFxEKikoXFxkKikoXFxEKikvKSB8fCBbXTtcbiAgICAgIGlmIChudW0pIHtcbiAgICAgICAgbWluc3RyID0gJzAnLnJlcGVhdChwbGFjZWhvbGRlci5sZW5ndGgpICsgbnVtO1xuICAgICAgICBtYXhzdHIgPSAnOScucmVwZWF0KHBsYWNlaG9sZGVyLmxlbmd0aCkgKyBudW07XG4gICAgICB9XG4gICAgICBtaW5zdHIgPSBtaW5zdHIucGFkRW5kKHRoaXMubWF4TGVuZ3RoLCAnMCcpO1xuICAgICAgbWF4c3RyID0gbWF4c3RyLnBhZEVuZCh0aGlzLm1heExlbmd0aCwgJzknKTtcbiAgICAgIHJldHVybiBbbWluc3RyLCBtYXhzdHJdO1xuICAgIH1cbiAgICBkb1ByZXBhcmVDaGFyKGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGxldCBkZXRhaWxzO1xuICAgICAgW2NoLCBkZXRhaWxzXSA9IHN1cGVyLmRvUHJlcGFyZUNoYXIoY2gucmVwbGFjZSgvXFxEL2csICcnKSwgZmxhZ3MpO1xuICAgICAgaWYgKCFjaCkgZGV0YWlscy5za2lwID0gIXRoaXMuaXNDb21wbGV0ZTtcbiAgICAgIHJldHVybiBbY2gsIGRldGFpbHNdO1xuICAgIH1cbiAgICBfYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuYXV0b2ZpeCB8fCB0aGlzLnZhbHVlLmxlbmd0aCArIDEgPiB0aGlzLm1heExlbmd0aCkgcmV0dXJuIHN1cGVyLl9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncyk7XG4gICAgICBjb25zdCBmcm9tU3RyID0gU3RyaW5nKHRoaXMuZnJvbSkucGFkU3RhcnQodGhpcy5tYXhMZW5ndGgsICcwJyk7XG4gICAgICBjb25zdCB0b1N0ciA9IFN0cmluZyh0aGlzLnRvKS5wYWRTdGFydCh0aGlzLm1heExlbmd0aCwgJzAnKTtcbiAgICAgIGNvbnN0IFttaW5zdHIsIG1heHN0cl0gPSB0aGlzLmJvdW5kYXJpZXModGhpcy52YWx1ZSArIGNoKTtcbiAgICAgIGlmIChOdW1iZXIobWF4c3RyKSA8IHRoaXMuZnJvbSkgcmV0dXJuIHN1cGVyLl9hcHBlbmRDaGFyUmF3KGZyb21TdHJbdGhpcy52YWx1ZS5sZW5ndGhdLCBmbGFncyk7XG4gICAgICBpZiAoTnVtYmVyKG1pbnN0cikgPiB0aGlzLnRvKSB7XG4gICAgICAgIGlmICghZmxhZ3MudGFpbCAmJiB0aGlzLmF1dG9maXggPT09ICdwYWQnICYmIHRoaXMudmFsdWUubGVuZ3RoICsgMSA8IHRoaXMubWF4TGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIHN1cGVyLl9hcHBlbmRDaGFyUmF3KGZyb21TdHJbdGhpcy52YWx1ZS5sZW5ndGhdLCBmbGFncykuYWdncmVnYXRlKHRoaXMuX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cGVyLl9hcHBlbmRDaGFyUmF3KHRvU3RyW3RoaXMudmFsdWUubGVuZ3RoXSwgZmxhZ3MpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1cGVyLl9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncyk7XG4gICAgfVxuICAgIGRvVmFsaWRhdGUoZmxhZ3MpIHtcbiAgICAgIGNvbnN0IHN0ciA9IHRoaXMudmFsdWU7XG4gICAgICBjb25zdCBmaXJzdE5vblplcm8gPSBzdHIuc2VhcmNoKC9bXjBdLyk7XG4gICAgICBpZiAoZmlyc3ROb25aZXJvID09PSAtMSAmJiBzdHIubGVuZ3RoIDw9IHRoaXMuX21hdGNoRnJvbSkgcmV0dXJuIHRydWU7XG4gICAgICBjb25zdCBbbWluc3RyLCBtYXhzdHJdID0gdGhpcy5ib3VuZGFyaWVzKHN0cik7XG4gICAgICByZXR1cm4gdGhpcy5mcm9tIDw9IE51bWJlcihtYXhzdHIpICYmIE51bWJlcihtaW5zdHIpIDw9IHRoaXMudG8gJiYgc3VwZXIuZG9WYWxpZGF0ZShmbGFncyk7XG4gICAgfVxuICAgIHBhZChmbGFncykge1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBpZiAodGhpcy52YWx1ZS5sZW5ndGggPT09IHRoaXMubWF4TGVuZ3RoKSByZXR1cm4gZGV0YWlscztcbiAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICAgIGNvbnN0IHBhZExlbmd0aCA9IHRoaXMubWF4TGVuZ3RoIC0gdGhpcy52YWx1ZS5sZW5ndGg7XG4gICAgICBpZiAocGFkTGVuZ3RoKSB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWRMZW5ndGg7ICsraSkge1xuICAgICAgICAgIGRldGFpbHMuYWdncmVnYXRlKHN1cGVyLl9hcHBlbmRDaGFyUmF3KCcwJywgZmxhZ3MpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFwcGVuZCB0YWlsXG4gICAgICAgIHZhbHVlLnNwbGl0KCcnKS5mb3JFYWNoKGNoID0+IHRoaXMuX2FwcGVuZENoYXJSYXcoY2gpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgfVxuICBJTWFzay5NYXNrZWRSYW5nZSA9IE1hc2tlZFJhbmdlO1xuXG4gIGNvbnN0IERlZmF1bHRQYXR0ZXJuID0gJ2R7Ln1gbXsufWBZJztcblxuICAvLyBNYWtlIGZvcm1hdCBhbmQgcGFyc2UgcmVxdWlyZWQgd2hlbiBwYXR0ZXJuIGlzIHByb3ZpZGVkXG5cbiAgLyoqIERhdGUgbWFzayAqL1xuICBjbGFzcyBNYXNrZWREYXRlIGV4dGVuZHMgTWFza2VkUGF0dGVybiB7XG4gICAgc3RhdGljIGV4dHJhY3RQYXR0ZXJuT3B0aW9ucyhvcHRzKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIG1hc2ssXG4gICAgICAgIHBhdHRlcm4sXG4gICAgICAgIC4uLnBhdHRlcm5PcHRzXG4gICAgICB9ID0gb3B0cztcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnBhdHRlcm5PcHRzLFxuICAgICAgICBtYXNrOiBpc1N0cmluZyhtYXNrKSA/IG1hc2sgOiBwYXR0ZXJuXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKiBQYXR0ZXJuIG1hc2sgZm9yIGRhdGUgYWNjb3JkaW5nIHRvIHtAbGluayBNYXNrZWREYXRlI2Zvcm1hdH0gKi9cblxuICAgIC8qKiBTdGFydCBkYXRlICovXG5cbiAgICAvKiogRW5kIGRhdGUgKi9cblxuICAgIC8qKiBGb3JtYXQgdHlwZWQgdmFsdWUgdG8gc3RyaW5nICovXG5cbiAgICAvKiogUGFyc2Ugc3RyaW5nIHRvIGdldCB0eXBlZCB2YWx1ZSAqL1xuXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgc3VwZXIoTWFza2VkRGF0ZS5leHRyYWN0UGF0dGVybk9wdGlvbnMoe1xuICAgICAgICAuLi5NYXNrZWREYXRlLkRFRkFVTFRTLFxuICAgICAgICAuLi5vcHRzXG4gICAgICB9KSk7XG4gICAgfVxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIG1hc2ssXG4gICAgICAgIHBhdHRlcm4sXG4gICAgICAgIGJsb2NrcyxcbiAgICAgICAgLi4ucGF0dGVybk9wdHNcbiAgICAgIH0gPSB7XG4gICAgICAgIC4uLk1hc2tlZERhdGUuREVGQVVMVFMsXG4gICAgICAgIC4uLm9wdHNcbiAgICAgIH07XG4gICAgICBjb25zdCBwYXR0ZXJuQmxvY2tzID0gT2JqZWN0LmFzc2lnbih7fSwgTWFza2VkRGF0ZS5HRVRfREVGQVVMVF9CTE9DS1MoKSk7XG4gICAgICAvLyBhZGp1c3QgeWVhciBibG9ja1xuICAgICAgaWYgKG9wdHMubWluKSBwYXR0ZXJuQmxvY2tzLlkuZnJvbSA9IG9wdHMubWluLmdldEZ1bGxZZWFyKCk7XG4gICAgICBpZiAob3B0cy5tYXgpIHBhdHRlcm5CbG9ja3MuWS50byA9IG9wdHMubWF4LmdldEZ1bGxZZWFyKCk7XG4gICAgICBpZiAob3B0cy5taW4gJiYgb3B0cy5tYXggJiYgcGF0dGVybkJsb2Nrcy5ZLmZyb20gPT09IHBhdHRlcm5CbG9ja3MuWS50bykge1xuICAgICAgICBwYXR0ZXJuQmxvY2tzLm0uZnJvbSA9IG9wdHMubWluLmdldE1vbnRoKCkgKyAxO1xuICAgICAgICBwYXR0ZXJuQmxvY2tzLm0udG8gPSBvcHRzLm1heC5nZXRNb250aCgpICsgMTtcbiAgICAgICAgaWYgKHBhdHRlcm5CbG9ja3MubS5mcm9tID09PSBwYXR0ZXJuQmxvY2tzLm0udG8pIHtcbiAgICAgICAgICBwYXR0ZXJuQmxvY2tzLmQuZnJvbSA9IG9wdHMubWluLmdldERhdGUoKTtcbiAgICAgICAgICBwYXR0ZXJuQmxvY2tzLmQudG8gPSBvcHRzLm1heC5nZXREYXRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIE9iamVjdC5hc3NpZ24ocGF0dGVybkJsb2NrcywgdGhpcy5ibG9ja3MsIGJsb2Nrcyk7XG4gICAgICBzdXBlci5fdXBkYXRlKHtcbiAgICAgICAgLi4ucGF0dGVybk9wdHMsXG4gICAgICAgIG1hc2s6IGlzU3RyaW5nKG1hc2spID8gbWFzayA6IHBhdHRlcm4sXG4gICAgICAgIGJsb2NrczogcGF0dGVybkJsb2Nrc1xuICAgICAgfSk7XG4gICAgfVxuICAgIGRvVmFsaWRhdGUoZmxhZ3MpIHtcbiAgICAgIGNvbnN0IGRhdGUgPSB0aGlzLmRhdGU7XG4gICAgICByZXR1cm4gc3VwZXIuZG9WYWxpZGF0ZShmbGFncykgJiYgKCF0aGlzLmlzQ29tcGxldGUgfHwgdGhpcy5pc0RhdGVFeGlzdCh0aGlzLnZhbHVlKSAmJiBkYXRlICE9IG51bGwgJiYgKHRoaXMubWluID09IG51bGwgfHwgdGhpcy5taW4gPD0gZGF0ZSkgJiYgKHRoaXMubWF4ID09IG51bGwgfHwgZGF0ZSA8PSB0aGlzLm1heCkpO1xuICAgIH1cblxuICAgIC8qKiBDaGVja3MgaWYgZGF0ZSBpcyBleGlzdHMgKi9cbiAgICBpc0RhdGVFeGlzdChzdHIpIHtcbiAgICAgIHJldHVybiB0aGlzLmZvcm1hdCh0aGlzLnBhcnNlKHN0ciwgdGhpcyksIHRoaXMpLmluZGV4T2Yoc3RyKSA+PSAwO1xuICAgIH1cblxuICAgIC8qKiBQYXJzZWQgRGF0ZSAqL1xuICAgIGdldCBkYXRlKCkge1xuICAgICAgcmV0dXJuIHRoaXMudHlwZWRWYWx1ZTtcbiAgICB9XG4gICAgc2V0IGRhdGUoZGF0ZSkge1xuICAgICAgdGhpcy50eXBlZFZhbHVlID0gZGF0ZTtcbiAgICB9XG4gICAgZ2V0IHR5cGVkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pc0NvbXBsZXRlID8gc3VwZXIudHlwZWRWYWx1ZSA6IG51bGw7XG4gICAgfVxuICAgIHNldCB0eXBlZFZhbHVlKHZhbHVlKSB7XG4gICAgICBzdXBlci50eXBlZFZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIG1hc2tFcXVhbHMobWFzaykge1xuICAgICAgcmV0dXJuIG1hc2sgPT09IERhdGUgfHwgc3VwZXIubWFza0VxdWFscyhtYXNrKTtcbiAgICB9XG4gICAgb3B0aW9uc0lzQ2hhbmdlZChvcHRzKSB7XG4gICAgICByZXR1cm4gc3VwZXIub3B0aW9uc0lzQ2hhbmdlZChNYXNrZWREYXRlLmV4dHJhY3RQYXR0ZXJuT3B0aW9ucyhvcHRzKSk7XG4gICAgfVxuICB9XG4gIE1hc2tlZERhdGUuR0VUX0RFRkFVTFRfQkxPQ0tTID0gKCkgPT4gKHtcbiAgICBkOiB7XG4gICAgICBtYXNrOiBNYXNrZWRSYW5nZSxcbiAgICAgIGZyb206IDEsXG4gICAgICB0bzogMzEsXG4gICAgICBtYXhMZW5ndGg6IDJcbiAgICB9LFxuICAgIG06IHtcbiAgICAgIG1hc2s6IE1hc2tlZFJhbmdlLFxuICAgICAgZnJvbTogMSxcbiAgICAgIHRvOiAxMixcbiAgICAgIG1heExlbmd0aDogMlxuICAgIH0sXG4gICAgWToge1xuICAgICAgbWFzazogTWFza2VkUmFuZ2UsXG4gICAgICBmcm9tOiAxOTAwLFxuICAgICAgdG86IDk5OTlcbiAgICB9XG4gIH0pO1xuICBNYXNrZWREYXRlLkRFRkFVTFRTID0ge1xuICAgIC4uLk1hc2tlZFBhdHRlcm4uREVGQVVMVFMsXG4gICAgbWFzazogRGF0ZSxcbiAgICBwYXR0ZXJuOiBEZWZhdWx0UGF0dGVybixcbiAgICBmb3JtYXQ6IChkYXRlLCBtYXNrZWQpID0+IHtcbiAgICAgIGlmICghZGF0ZSkgcmV0dXJuICcnO1xuICAgICAgY29uc3QgZGF5ID0gU3RyaW5nKGRhdGUuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCAnMCcpO1xuICAgICAgY29uc3QgbW9udGggPSBTdHJpbmcoZGF0ZS5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKTtcbiAgICAgIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XG4gICAgICByZXR1cm4gW2RheSwgbW9udGgsIHllYXJdLmpvaW4oJy4nKTtcbiAgICB9LFxuICAgIHBhcnNlOiAoc3RyLCBtYXNrZWQpID0+IHtcbiAgICAgIGNvbnN0IFtkYXksIG1vbnRoLCB5ZWFyXSA9IHN0ci5zcGxpdCgnLicpLm1hcChOdW1iZXIpO1xuICAgICAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIG1vbnRoIC0gMSwgZGF5KTtcbiAgICB9XG4gIH07XG4gIElNYXNrLk1hc2tlZERhdGUgPSBNYXNrZWREYXRlO1xuXG4gIC8qKiBEeW5hbWljIG1hc2sgZm9yIGNob29zaW5nIGFwcHJvcHJpYXRlIG1hc2sgaW4gcnVuLXRpbWUgKi9cbiAgY2xhc3MgTWFza2VkRHluYW1pYyBleHRlbmRzIE1hc2tlZCB7XG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgc3VwZXIoe1xuICAgICAgICAuLi5NYXNrZWREeW5hbWljLkRFRkFVTFRTLFxuICAgICAgICAuLi5vcHRzXG4gICAgICB9KTtcbiAgICAgIHRoaXMuY3VycmVudE1hc2sgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBzdXBlci5fdXBkYXRlKG9wdHMpO1xuICAgICAgaWYgKCdtYXNrJyBpbiBvcHRzKSB7XG4gICAgICAgIHRoaXMuZXhwb3NlTWFzayA9IHVuZGVmaW5lZDtcbiAgICAgICAgLy8gbWFzayBjb3VsZCBiZSB0b3RhbGx5IGR5bmFtaWMgd2l0aCBvbmx5IGBkaXNwYXRjaGAgb3B0aW9uXG4gICAgICAgIHRoaXMuY29tcGlsZWRNYXNrcyA9IEFycmF5LmlzQXJyYXkob3B0cy5tYXNrKSA/IG9wdHMubWFzay5tYXAobSA9PiB7XG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgZXhwb3NlLFxuICAgICAgICAgICAgLi4ubWFza09wdHNcbiAgICAgICAgICB9ID0gbm9ybWFsaXplT3B0cyhtKTtcbiAgICAgICAgICBjb25zdCBtYXNrZWQgPSBjcmVhdGVNYXNrKHtcbiAgICAgICAgICAgIG92ZXJ3cml0ZTogdGhpcy5fb3ZlcndyaXRlLFxuICAgICAgICAgICAgZWFnZXI6IHRoaXMuX2VhZ2VyLFxuICAgICAgICAgICAgc2tpcEludmFsaWQ6IHRoaXMuX3NraXBJbnZhbGlkLFxuICAgICAgICAgICAgLi4ubWFza09wdHNcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoZXhwb3NlKSB0aGlzLmV4cG9zZU1hc2sgPSBtYXNrZWQ7XG4gICAgICAgICAgcmV0dXJuIG1hc2tlZDtcbiAgICAgICAgfSkgOiBbXTtcblxuICAgICAgICAvLyB0aGlzLmN1cnJlbnRNYXNrID0gdGhpcy5kb0Rpc3BhdGNoKCcnKTsgLy8gcHJvYmFibHkgbm90IG5lZWRlZCBidXQgbGV0cyBzZWVcbiAgICAgIH1cbiAgICB9XG4gICAgX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgZGV0YWlscyA9IHRoaXMuX2FwcGx5RGlzcGF0Y2goY2gsIGZsYWdzKTtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB7XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuY3VycmVudE1hc2suX2FwcGVuZENoYXIoY2gsIHRoaXMuY3VycmVudE1hc2tGbGFncyhmbGFncykpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBfYXBwbHlEaXNwYXRjaChhcHBlbmRlZCwgZmxhZ3MsIHRhaWwpIHtcbiAgICAgIGlmIChhcHBlbmRlZCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGFwcGVuZGVkID0gJyc7XG4gICAgICB9XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKHRhaWwgPT09IHZvaWQgMCkge1xuICAgICAgICB0YWlsID0gJyc7XG4gICAgICB9XG4gICAgICBjb25zdCBwcmV2VmFsdWVCZWZvcmVUYWlsID0gZmxhZ3MudGFpbCAmJiBmbGFncy5fYmVmb3JlVGFpbFN0YXRlICE9IG51bGwgPyBmbGFncy5fYmVmb3JlVGFpbFN0YXRlLl92YWx1ZSA6IHRoaXMudmFsdWU7XG4gICAgICBjb25zdCBpbnB1dFZhbHVlID0gdGhpcy5yYXdJbnB1dFZhbHVlO1xuICAgICAgY29uc3QgaW5zZXJ0VmFsdWUgPSBmbGFncy50YWlsICYmIGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUgIT0gbnVsbCA/IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUuX3Jhd0lucHV0VmFsdWUgOiBpbnB1dFZhbHVlO1xuICAgICAgY29uc3QgdGFpbFZhbHVlID0gaW5wdXRWYWx1ZS5zbGljZShpbnNlcnRWYWx1ZS5sZW5ndGgpO1xuICAgICAgY29uc3QgcHJldk1hc2sgPSB0aGlzLmN1cnJlbnRNYXNrO1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBjb25zdCBwcmV2TWFza1N0YXRlID0gcHJldk1hc2sgPT0gbnVsbCA/IHZvaWQgMCA6IHByZXZNYXNrLnN0YXRlO1xuXG4gICAgICAvLyBjbG9uZSBmbGFncyB0byBwcmV2ZW50IG92ZXJ3cml0aW5nIGBfYmVmb3JlVGFpbFN0YXRlYFxuICAgICAgdGhpcy5jdXJyZW50TWFzayA9IHRoaXMuZG9EaXNwYXRjaChhcHBlbmRlZCwge1xuICAgICAgICAuLi5mbGFnc1xuICAgICAgfSwgdGFpbCk7XG5cbiAgICAgIC8vIHJlc3RvcmUgc3RhdGUgYWZ0ZXIgZGlzcGF0Y2hcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrICE9PSBwcmV2TWFzaykge1xuICAgICAgICAgIC8vIGlmIG1hc2sgY2hhbmdlZCByZWFwcGx5IGlucHV0XG4gICAgICAgICAgdGhpcy5jdXJyZW50TWFzay5yZXNldCgpO1xuICAgICAgICAgIGlmIChpbnNlcnRWYWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50TWFzay5hcHBlbmQoaW5zZXJ0VmFsdWUsIHtcbiAgICAgICAgICAgICAgcmF3OiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRldGFpbHMudGFpbFNoaWZ0ID0gdGhpcy5jdXJyZW50TWFzay52YWx1ZS5sZW5ndGggLSBwcmV2VmFsdWVCZWZvcmVUYWlsLmxlbmd0aDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRhaWxWYWx1ZSkge1xuICAgICAgICAgICAgZGV0YWlscy50YWlsU2hpZnQgKz0gdGhpcy5jdXJyZW50TWFzay5hcHBlbmQodGFpbFZhbHVlLCB7XG4gICAgICAgICAgICAgIHJhdzogdHJ1ZSxcbiAgICAgICAgICAgICAgdGFpbDogdHJ1ZVxuICAgICAgICAgICAgfSkudGFpbFNoaWZ0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChwcmV2TWFza1N0YXRlKSB7XG4gICAgICAgICAgLy8gRGlzcGF0Y2ggY2FuIGRvIHNvbWV0aGluZyBiYWQgd2l0aCBzdGF0ZSwgc29cbiAgICAgICAgICAvLyByZXN0b3JlIHByZXYgbWFzayBzdGF0ZVxuICAgICAgICAgIHRoaXMuY3VycmVudE1hc2suc3RhdGUgPSBwcmV2TWFza1N0YXRlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgX2FwcGVuZFBsYWNlaG9sZGVyKCkge1xuICAgICAgY29uc3QgZGV0YWlscyA9IHRoaXMuX2FwcGx5RGlzcGF0Y2goKTtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB7XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuY3VycmVudE1hc2suX2FwcGVuZFBsYWNlaG9sZGVyKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIF9hcHBlbmRFYWdlcigpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLl9hcHBseURpc3BhdGNoKCk7XG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykge1xuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLmN1cnJlbnRNYXNrLl9hcHBlbmRFYWdlcigpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBhcHBlbmRUYWlsKHRhaWwpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgaWYgKHRhaWwpIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuX2FwcGx5RGlzcGF0Y2goJycsIHt9LCB0YWlsKSk7XG4gICAgICByZXR1cm4gZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2suYXBwZW5kVGFpbCh0YWlsKSA6IHN1cGVyLmFwcGVuZFRhaWwodGFpbCkpO1xuICAgIH1cbiAgICBjdXJyZW50TWFza0ZsYWdzKGZsYWdzKSB7XG4gICAgICB2YXIgX2ZsYWdzJF9iZWZvcmVUYWlsU3RhLCBfZmxhZ3MkX2JlZm9yZVRhaWxTdGEyO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uZmxhZ3MsXG4gICAgICAgIF9iZWZvcmVUYWlsU3RhdGU6ICgoX2ZsYWdzJF9iZWZvcmVUYWlsU3RhID0gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSkgPT0gbnVsbCA/IHZvaWQgMCA6IF9mbGFncyRfYmVmb3JlVGFpbFN0YS5jdXJyZW50TWFza1JlZikgPT09IHRoaXMuY3VycmVudE1hc2sgJiYgKChfZmxhZ3MkX2JlZm9yZVRhaWxTdGEyID0gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSkgPT0gbnVsbCA/IHZvaWQgMCA6IF9mbGFncyRfYmVmb3JlVGFpbFN0YTIuY3VycmVudE1hc2spIHx8IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGVcbiAgICAgIH07XG4gICAgfVxuICAgIGRvRGlzcGF0Y2goYXBwZW5kZWQsIGZsYWdzLCB0YWlsKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKHRhaWwgPT09IHZvaWQgMCkge1xuICAgICAgICB0YWlsID0gJyc7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChhcHBlbmRlZCwgdGhpcywgZmxhZ3MsIHRhaWwpO1xuICAgIH1cbiAgICBkb1ZhbGlkYXRlKGZsYWdzKSB7XG4gICAgICByZXR1cm4gc3VwZXIuZG9WYWxpZGF0ZShmbGFncykgJiYgKCF0aGlzLmN1cnJlbnRNYXNrIHx8IHRoaXMuY3VycmVudE1hc2suZG9WYWxpZGF0ZSh0aGlzLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpKSk7XG4gICAgfVxuICAgIGRvUHJlcGFyZShzdHIsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgbGV0IFtzLCBkZXRhaWxzXSA9IHN1cGVyLmRvUHJlcGFyZShzdHIsIGZsYWdzKTtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB7XG4gICAgICAgIGxldCBjdXJyZW50RGV0YWlscztcbiAgICAgICAgW3MsIGN1cnJlbnREZXRhaWxzXSA9IHN1cGVyLmRvUHJlcGFyZShzLCB0aGlzLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpKTtcbiAgICAgICAgZGV0YWlscyA9IGRldGFpbHMuYWdncmVnYXRlKGN1cnJlbnREZXRhaWxzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbcywgZGV0YWlsc107XG4gICAgfVxuICAgIGRvUHJlcGFyZUNoYXIoc3RyLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGxldCBbcywgZGV0YWlsc10gPSBzdXBlci5kb1ByZXBhcmVDaGFyKHN0ciwgZmxhZ3MpO1xuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHtcbiAgICAgICAgbGV0IGN1cnJlbnREZXRhaWxzO1xuICAgICAgICBbcywgY3VycmVudERldGFpbHNdID0gc3VwZXIuZG9QcmVwYXJlQ2hhcihzLCB0aGlzLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpKTtcbiAgICAgICAgZGV0YWlscyA9IGRldGFpbHMuYWdncmVnYXRlKGN1cnJlbnREZXRhaWxzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbcywgZGV0YWlsc107XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgdmFyIF90aGlzJGN1cnJlbnRNYXNrO1xuICAgICAgKF90aGlzJGN1cnJlbnRNYXNrID0gdGhpcy5jdXJyZW50TWFzaykgPT0gbnVsbCB8fCBfdGhpcyRjdXJyZW50TWFzay5yZXNldCgpO1xuICAgICAgdGhpcy5jb21waWxlZE1hc2tzLmZvckVhY2gobSA9PiBtLnJlc2V0KCkpO1xuICAgIH1cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBvc2VNYXNrID8gdGhpcy5leHBvc2VNYXNrLnZhbHVlIDogdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2sudmFsdWUgOiAnJztcbiAgICB9XG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5leHBvc2VNYXNrKSB7XG4gICAgICAgIHRoaXMuZXhwb3NlTWFzay52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXNrID0gdGhpcy5leHBvc2VNYXNrO1xuICAgICAgICB0aGlzLl9hcHBseURpc3BhdGNoKCk7XG4gICAgICB9IGVsc2Ugc3VwZXIudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgZ2V0IHVubWFza2VkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBvc2VNYXNrID8gdGhpcy5leHBvc2VNYXNrLnVubWFza2VkVmFsdWUgOiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay51bm1hc2tlZFZhbHVlIDogJyc7XG4gICAgfVxuICAgIHNldCB1bm1hc2tlZFZhbHVlKHVubWFza2VkVmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmV4cG9zZU1hc2spIHtcbiAgICAgICAgdGhpcy5leHBvc2VNYXNrLnVubWFza2VkVmFsdWUgPSB1bm1hc2tlZFZhbHVlO1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXNrID0gdGhpcy5leHBvc2VNYXNrO1xuICAgICAgICB0aGlzLl9hcHBseURpc3BhdGNoKCk7XG4gICAgICB9IGVsc2Ugc3VwZXIudW5tYXNrZWRWYWx1ZSA9IHVubWFza2VkVmFsdWU7XG4gICAgfVxuICAgIGdldCB0eXBlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwb3NlTWFzayA/IHRoaXMuZXhwb3NlTWFzay50eXBlZFZhbHVlIDogdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2sudHlwZWRWYWx1ZSA6ICcnO1xuICAgIH1cbiAgICBzZXQgdHlwZWRWYWx1ZSh0eXBlZFZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5leHBvc2VNYXNrKSB7XG4gICAgICAgIHRoaXMuZXhwb3NlTWFzay50eXBlZFZhbHVlID0gdHlwZWRWYWx1ZTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWFzayA9IHRoaXMuZXhwb3NlTWFzaztcbiAgICAgICAgdGhpcy5fYXBwbHlEaXNwYXRjaCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsZXQgdW5tYXNrZWRWYWx1ZSA9IFN0cmluZyh0eXBlZFZhbHVlKTtcblxuICAgICAgLy8gZG91YmxlIGNoZWNrIGl0XG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykge1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXNrLnR5cGVkVmFsdWUgPSB0eXBlZFZhbHVlO1xuICAgICAgICB1bm1hc2tlZFZhbHVlID0gdGhpcy5jdXJyZW50TWFzay51bm1hc2tlZFZhbHVlO1xuICAgICAgfVxuICAgICAgdGhpcy51bm1hc2tlZFZhbHVlID0gdW5tYXNrZWRWYWx1ZTtcbiAgICB9XG4gICAgZ2V0IGRpc3BsYXlWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5kaXNwbGF5VmFsdWUgOiAnJztcbiAgICB9XG4gICAgZ2V0IGlzQ29tcGxldGUoKSB7XG4gICAgICB2YXIgX3RoaXMkY3VycmVudE1hc2syO1xuICAgICAgcmV0dXJuIEJvb2xlYW4oKF90aGlzJGN1cnJlbnRNYXNrMiA9IHRoaXMuY3VycmVudE1hc2spID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRjdXJyZW50TWFzazIuaXNDb21wbGV0ZSk7XG4gICAgfVxuICAgIGdldCBpc0ZpbGxlZCgpIHtcbiAgICAgIHZhciBfdGhpcyRjdXJyZW50TWFzazM7XG4gICAgICByZXR1cm4gQm9vbGVhbigoX3RoaXMkY3VycmVudE1hc2szID0gdGhpcy5jdXJyZW50TWFzaykgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJGN1cnJlbnRNYXNrMy5pc0ZpbGxlZCk7XG4gICAgfVxuICAgIHJlbW92ZShmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykge1xuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLmN1cnJlbnRNYXNrLnJlbW92ZShmcm9tUG9zLCB0b1BvcykpXG4gICAgICAgIC8vIHVwZGF0ZSB3aXRoIGRpc3BhdGNoXG4gICAgICAgIC5hZ2dyZWdhdGUodGhpcy5fYXBwbHlEaXNwYXRjaCgpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICB2YXIgX3RoaXMkY3VycmVudE1hc2s0O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uc3VwZXIuc3RhdGUsXG4gICAgICAgIF9yYXdJbnB1dFZhbHVlOiB0aGlzLnJhd0lucHV0VmFsdWUsXG4gICAgICAgIGNvbXBpbGVkTWFza3M6IHRoaXMuY29tcGlsZWRNYXNrcy5tYXAobSA9PiBtLnN0YXRlKSxcbiAgICAgICAgY3VycmVudE1hc2tSZWY6IHRoaXMuY3VycmVudE1hc2ssXG4gICAgICAgIGN1cnJlbnRNYXNrOiAoX3RoaXMkY3VycmVudE1hc2s0ID0gdGhpcy5jdXJyZW50TWFzaykgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJGN1cnJlbnRNYXNrNC5zdGF0ZVxuICAgICAgfTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHN0YXRlKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGNvbXBpbGVkTWFza3MsXG4gICAgICAgIGN1cnJlbnRNYXNrUmVmLFxuICAgICAgICBjdXJyZW50TWFzayxcbiAgICAgICAgLi4ubWFza2VkU3RhdGVcbiAgICAgIH0gPSBzdGF0ZTtcbiAgICAgIGlmIChjb21waWxlZE1hc2tzKSB0aGlzLmNvbXBpbGVkTWFza3MuZm9yRWFjaCgobSwgbWkpID0+IG0uc3RhdGUgPSBjb21waWxlZE1hc2tzW21pXSk7XG4gICAgICBpZiAoY3VycmVudE1hc2tSZWYgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXNrID0gY3VycmVudE1hc2tSZWY7XG4gICAgICAgIHRoaXMuY3VycmVudE1hc2suc3RhdGUgPSBjdXJyZW50TWFzaztcbiAgICAgIH1cbiAgICAgIHN1cGVyLnN0YXRlID0gbWFza2VkU3RhdGU7XG4gICAgfVxuICAgIGV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5leHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKSA6ICcnO1xuICAgIH1cbiAgICBleHRyYWN0VGFpbChmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLmV4dHJhY3RUYWlsKGZyb21Qb3MsIHRvUG9zKSA6IHN1cGVyLmV4dHJhY3RUYWlsKGZyb21Qb3MsIHRvUG9zKTtcbiAgICB9XG4gICAgZG9Db21taXQoKSB7XG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykgdGhpcy5jdXJyZW50TWFzay5kb0NvbW1pdCgpO1xuICAgICAgc3VwZXIuZG9Db21taXQoKTtcbiAgICB9XG4gICAgbmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgZGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2submVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgZGlyZWN0aW9uKSA6IHN1cGVyLm5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIGRpcmVjdGlvbik7XG4gICAgfVxuICAgIGdldCBvdmVyd3JpdGUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2sub3ZlcndyaXRlIDogdGhpcy5fb3ZlcndyaXRlO1xuICAgIH1cbiAgICBzZXQgb3ZlcndyaXRlKG92ZXJ3cml0ZSkge1xuICAgICAgdGhpcy5fb3ZlcndyaXRlID0gb3ZlcndyaXRlO1xuICAgIH1cbiAgICBnZXQgZWFnZXIoKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2suZWFnZXIgOiB0aGlzLl9lYWdlcjtcbiAgICB9XG4gICAgc2V0IGVhZ2VyKGVhZ2VyKSB7XG4gICAgICB0aGlzLl9lYWdlciA9IGVhZ2VyO1xuICAgIH1cbiAgICBnZXQgc2tpcEludmFsaWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2suc2tpcEludmFsaWQgOiB0aGlzLl9za2lwSW52YWxpZDtcbiAgICB9XG4gICAgc2V0IHNraXBJbnZhbGlkKHNraXBJbnZhbGlkKSB7XG4gICAgICB0aGlzLl9za2lwSW52YWxpZCA9IHNraXBJbnZhbGlkO1xuICAgIH1cbiAgICBnZXQgYXV0b2ZpeCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5hdXRvZml4IDogdGhpcy5fYXV0b2ZpeDtcbiAgICB9XG4gICAgc2V0IGF1dG9maXgoYXV0b2ZpeCkge1xuICAgICAgdGhpcy5fYXV0b2ZpeCA9IGF1dG9maXg7XG4gICAgfVxuICAgIG1hc2tFcXVhbHMobWFzaykge1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkobWFzaykgPyB0aGlzLmNvbXBpbGVkTWFza3MuZXZlcnkoKG0sIG1pKSA9PiB7XG4gICAgICAgIGlmICghbWFza1ttaV0pIHJldHVybjtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIG1hc2s6IG9sZE1hc2ssXG4gICAgICAgICAgLi4ucmVzdE9wdHNcbiAgICAgICAgfSA9IG1hc2tbbWldO1xuICAgICAgICByZXR1cm4gb2JqZWN0SW5jbHVkZXMobSwgcmVzdE9wdHMpICYmIG0ubWFza0VxdWFscyhvbGRNYXNrKTtcbiAgICAgIH0pIDogc3VwZXIubWFza0VxdWFscyhtYXNrKTtcbiAgICB9XG4gICAgdHlwZWRWYWx1ZUVxdWFscyh2YWx1ZSkge1xuICAgICAgdmFyIF90aGlzJGN1cnJlbnRNYXNrNTtcbiAgICAgIHJldHVybiBCb29sZWFuKChfdGhpcyRjdXJyZW50TWFzazUgPSB0aGlzLmN1cnJlbnRNYXNrKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkY3VycmVudE1hc2s1LnR5cGVkVmFsdWVFcXVhbHModmFsdWUpKTtcbiAgICB9XG4gIH1cbiAgLyoqIEN1cnJlbnRseSBjaG9zZW4gbWFzayAqL1xuICAvKiogQ3VycmVudGx5IGNob3NlbiBtYXNrICovXG4gIC8qKiBDb21wbGlsZWQge0BsaW5rIE1hc2tlZH0gb3B0aW9ucyAqL1xuICAvKiogQ2hvb3NlcyB7QGxpbmsgTWFza2VkfSBkZXBlbmRpbmcgb24gaW5wdXQgdmFsdWUgKi9cbiAgTWFza2VkRHluYW1pYy5ERUZBVUxUUyA9IHtcbiAgICAuLi5NYXNrZWQuREVGQVVMVFMsXG4gICAgZGlzcGF0Y2g6IChhcHBlbmRlZCwgbWFza2VkLCBmbGFncywgdGFpbCkgPT4ge1xuICAgICAgaWYgKCFtYXNrZWQuY29tcGlsZWRNYXNrcy5sZW5ndGgpIHJldHVybjtcbiAgICAgIGNvbnN0IGlucHV0VmFsdWUgPSBtYXNrZWQucmF3SW5wdXRWYWx1ZTtcblxuICAgICAgLy8gc2ltdWxhdGUgaW5wdXRcbiAgICAgIGNvbnN0IGlucHV0cyA9IG1hc2tlZC5jb21waWxlZE1hc2tzLm1hcCgobSwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgaXNDdXJyZW50ID0gbWFza2VkLmN1cnJlbnRNYXNrID09PSBtO1xuICAgICAgICBjb25zdCBzdGFydElucHV0UG9zID0gaXNDdXJyZW50ID8gbS5kaXNwbGF5VmFsdWUubGVuZ3RoIDogbS5uZWFyZXN0SW5wdXRQb3MobS5kaXNwbGF5VmFsdWUubGVuZ3RoLCBESVJFQ1RJT04uRk9SQ0VfTEVGVCk7XG4gICAgICAgIGlmIChtLnJhd0lucHV0VmFsdWUgIT09IGlucHV0VmFsdWUpIHtcbiAgICAgICAgICBtLnJlc2V0KCk7XG4gICAgICAgICAgbS5hcHBlbmQoaW5wdXRWYWx1ZSwge1xuICAgICAgICAgICAgcmF3OiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIWlzQ3VycmVudCkge1xuICAgICAgICAgIG0ucmVtb3ZlKHN0YXJ0SW5wdXRQb3MpO1xuICAgICAgICB9XG4gICAgICAgIG0uYXBwZW5kKGFwcGVuZGVkLCBtYXNrZWQuY3VycmVudE1hc2tGbGFncyhmbGFncykpO1xuICAgICAgICBtLmFwcGVuZFRhaWwodGFpbCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgd2VpZ2h0OiBtLnJhd0lucHV0VmFsdWUubGVuZ3RoLFxuICAgICAgICAgIHRvdGFsSW5wdXRQb3NpdGlvbnM6IG0udG90YWxJbnB1dFBvc2l0aW9ucygwLCBNYXRoLm1heChzdGFydElucHV0UG9zLCBtLm5lYXJlc3RJbnB1dFBvcyhtLmRpc3BsYXlWYWx1ZS5sZW5ndGgsIERJUkVDVElPTi5GT1JDRV9MRUZUKSkpXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgLy8gcG9wIG1hc2tzIHdpdGggbG9uZ2VyIHZhbHVlcyBmaXJzdFxuICAgICAgaW5wdXRzLnNvcnQoKGkxLCBpMikgPT4gaTIud2VpZ2h0IC0gaTEud2VpZ2h0IHx8IGkyLnRvdGFsSW5wdXRQb3NpdGlvbnMgLSBpMS50b3RhbElucHV0UG9zaXRpb25zKTtcbiAgICAgIHJldHVybiBtYXNrZWQuY29tcGlsZWRNYXNrc1tpbnB1dHNbMF0uaW5kZXhdO1xuICAgIH1cbiAgfTtcbiAgSU1hc2suTWFza2VkRHluYW1pYyA9IE1hc2tlZER5bmFtaWM7XG5cbiAgLyoqIFBhdHRlcm4gd2hpY2ggdmFsaWRhdGVzIGVudW0gdmFsdWVzICovXG4gIGNsYXNzIE1hc2tlZEVudW0gZXh0ZW5kcyBNYXNrZWRQYXR0ZXJuIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBzdXBlcih7XG4gICAgICAgIC4uLk1hc2tlZEVudW0uREVGQVVMVFMsXG4gICAgICAgIC4uLm9wdHNcbiAgICAgIH0pOyAvLyBtYXNrIHdpbGwgYmUgY3JlYXRlZCBpbiBfdXBkYXRlXG4gICAgfVxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGVudW06IGVudW1fLFxuICAgICAgICAuLi5lb3B0c1xuICAgICAgfSA9IG9wdHM7XG4gICAgICBpZiAoZW51bV8pIHtcbiAgICAgICAgY29uc3QgbGVuZ3RocyA9IGVudW1fLm1hcChlID0+IGUubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgcmVxdWlyZWRMZW5ndGggPSBNYXRoLm1pbiguLi5sZW5ndGhzKTtcbiAgICAgICAgY29uc3Qgb3B0aW9uYWxMZW5ndGggPSBNYXRoLm1heCguLi5sZW5ndGhzKSAtIHJlcXVpcmVkTGVuZ3RoO1xuICAgICAgICBlb3B0cy5tYXNrID0gJyonLnJlcGVhdChyZXF1aXJlZExlbmd0aCk7XG4gICAgICAgIGlmIChvcHRpb25hbExlbmd0aCkgZW9wdHMubWFzayArPSAnWycgKyAnKicucmVwZWF0KG9wdGlvbmFsTGVuZ3RoKSArICddJztcbiAgICAgICAgdGhpcy5lbnVtID0gZW51bV87XG4gICAgICB9XG4gICAgICBzdXBlci5fdXBkYXRlKGVvcHRzKTtcbiAgICB9XG4gICAgX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgbWF0Y2hGcm9tID0gTWF0aC5taW4odGhpcy5uZWFyZXN0SW5wdXRQb3MoMCwgRElSRUNUSU9OLkZPUkNFX1JJR0hUKSwgdGhpcy52YWx1ZS5sZW5ndGgpO1xuICAgICAgY29uc3QgbWF0Y2hlcyA9IHRoaXMuZW51bS5maWx0ZXIoZSA9PiB0aGlzLm1hdGNoVmFsdWUoZSwgdGhpcy51bm1hc2tlZFZhbHVlICsgY2gsIG1hdGNoRnJvbSkpO1xuICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoKSB7XG4gICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHRoaXMuX2ZvckVhY2hCbG9ja3NJblJhbmdlKDAsIHRoaXMudmFsdWUubGVuZ3RoLCAoYiwgYmkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1jaCA9IG1hdGNoZXNbMF1bYmldO1xuICAgICAgICAgICAgaWYgKGJpID49IHRoaXMudmFsdWUubGVuZ3RoIHx8IG1jaCA9PT0gYi52YWx1ZSkgcmV0dXJuO1xuICAgICAgICAgICAgYi5yZXNldCgpO1xuICAgICAgICAgICAgYi5fYXBwZW5kQ2hhcihtY2gsIGZsYWdzKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkID0gc3VwZXIuX2FwcGVuZENoYXJSYXcobWF0Y2hlc1swXVt0aGlzLnZhbHVlLmxlbmd0aF0sIGZsYWdzKTtcbiAgICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgbWF0Y2hlc1swXS5zbGljZSh0aGlzLnVubWFza2VkVmFsdWUubGVuZ3RoKS5zcGxpdCgnJykuZm9yRWFjaChtY2ggPT4gZC5hZ2dyZWdhdGUoc3VwZXIuX2FwcGVuZENoYXJSYXcobWNoKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKHtcbiAgICAgICAgc2tpcDogIXRoaXMuaXNDb21wbGV0ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIGV4dHJhY3RUYWlsKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICAvLyBqdXN0IGRyb3AgdGFpbFxuICAgICAgcmV0dXJuIG5ldyBDb250aW51b3VzVGFpbERldGFpbHMoJycsIGZyb21Qb3MpO1xuICAgIH1cbiAgICByZW1vdmUoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChmcm9tUG9zID09PSB0b1BvcykgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBjb25zdCBtYXRjaEZyb20gPSBNYXRoLm1pbihzdXBlci5uZWFyZXN0SW5wdXRQb3MoMCwgRElSRUNUSU9OLkZPUkNFX1JJR0hUKSwgdGhpcy52YWx1ZS5sZW5ndGgpO1xuICAgICAgbGV0IHBvcztcbiAgICAgIGZvciAocG9zID0gZnJvbVBvczsgcG9zID49IDA7IC0tcG9zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoZXMgPSB0aGlzLmVudW0uZmlsdGVyKGUgPT4gdGhpcy5tYXRjaFZhbHVlKGUsIHRoaXMudmFsdWUuc2xpY2UobWF0Y2hGcm9tLCBwb3MpLCBtYXRjaEZyb20pKTtcbiAgICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoID4gMSkgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb25zdCBkZXRhaWxzID0gc3VwZXIucmVtb3ZlKHBvcywgdG9Qb3MpO1xuICAgICAgZGV0YWlscy50YWlsU2hpZnQgKz0gcG9zIC0gZnJvbVBvcztcbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBnZXQgaXNDb21wbGV0ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmVudW0uaW5kZXhPZih0aGlzLnZhbHVlKSA+PSAwO1xuICAgIH1cbiAgfVxuICAvKiogTWF0Y2ggZW51bSB2YWx1ZSAqL1xuICBNYXNrZWRFbnVtLkRFRkFVTFRTID0ge1xuICAgIC4uLk1hc2tlZFBhdHRlcm4uREVGQVVMVFMsXG4gICAgbWF0Y2hWYWx1ZTogKGVzdHIsIGlzdHIsIG1hdGNoRnJvbSkgPT4gZXN0ci5pbmRleE9mKGlzdHIsIG1hdGNoRnJvbSkgPT09IG1hdGNoRnJvbVxuICB9O1xuICBJTWFzay5NYXNrZWRFbnVtID0gTWFza2VkRW51bTtcblxuICAvKiogTWFza2luZyBieSBjdXN0b20gRnVuY3Rpb24gKi9cbiAgY2xhc3MgTWFza2VkRnVuY3Rpb24gZXh0ZW5kcyBNYXNrZWQge1xuICAgIC8qKiAqL1xuXG4gICAgLyoqIEVuYWJsZSBjaGFyYWN0ZXJzIG92ZXJ3cml0aW5nICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgc3VwZXIuX3VwZGF0ZSh7XG4gICAgICAgIC4uLm9wdHMsXG4gICAgICAgIHZhbGlkYXRlOiBvcHRzLm1hc2tcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBJTWFzay5NYXNrZWRGdW5jdGlvbiA9IE1hc2tlZEZ1bmN0aW9uO1xuXG4gIHZhciBfTWFza2VkTnVtYmVyO1xuICAvKiogTnVtYmVyIG1hc2sgKi9cbiAgY2xhc3MgTWFza2VkTnVtYmVyIGV4dGVuZHMgTWFza2VkIHtcbiAgICAvKiogU2luZ2xlIGNoYXIgKi9cblxuICAgIC8qKiBTaW5nbGUgY2hhciAqL1xuXG4gICAgLyoqIEFycmF5IG9mIHNpbmdsZSBjaGFycyAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiBEaWdpdHMgYWZ0ZXIgcG9pbnQgKi9cblxuICAgIC8qKiBGbGFnIHRvIHJlbW92ZSBsZWFkaW5nIGFuZCB0cmFpbGluZyB6ZXJvcyBpbiB0aGUgZW5kIG9mIGVkaXRpbmcgKi9cblxuICAgIC8qKiBGbGFnIHRvIHBhZCB0cmFpbGluZyB6ZXJvcyBhZnRlciBwb2ludCBpbiB0aGUgZW5kIG9mIGVkaXRpbmcgKi9cblxuICAgIC8qKiBFbmFibGUgY2hhcmFjdGVycyBvdmVyd3JpdGluZyAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqIEZvcm1hdCB0eXBlZCB2YWx1ZSB0byBzdHJpbmcgKi9cblxuICAgIC8qKiBQYXJzZSBzdHJpbmcgdG8gZ2V0IHR5cGVkIHZhbHVlICovXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBzdXBlcih7XG4gICAgICAgIC4uLk1hc2tlZE51bWJlci5ERUZBVUxUUyxcbiAgICAgICAgLi4ub3B0c1xuICAgICAgfSk7XG4gICAgfVxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBzdXBlci5fdXBkYXRlKG9wdHMpO1xuICAgICAgdGhpcy5fdXBkYXRlUmVnRXhwcygpO1xuICAgIH1cbiAgICBfdXBkYXRlUmVnRXhwcygpIHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gJ14nICsgKHRoaXMuYWxsb3dOZWdhdGl2ZSA/ICdbK3xcXFxcLV0/JyA6ICcnKTtcbiAgICAgIGNvbnN0IG1pZCA9ICdcXFxcZConO1xuICAgICAgY29uc3QgZW5kID0gKHRoaXMuc2NhbGUgPyBcIihcIiArIGVzY2FwZVJlZ0V4cCh0aGlzLnJhZGl4KSArIFwiXFxcXGR7MCxcIiArIHRoaXMuc2NhbGUgKyBcIn0pP1wiIDogJycpICsgJyQnO1xuICAgICAgdGhpcy5fbnVtYmVyUmVnRXhwID0gbmV3IFJlZ0V4cChzdGFydCArIG1pZCArIGVuZCk7XG4gICAgICB0aGlzLl9tYXBUb1JhZGl4UmVnRXhwID0gbmV3IFJlZ0V4cChcIltcIiArIHRoaXMubWFwVG9SYWRpeC5tYXAoZXNjYXBlUmVnRXhwKS5qb2luKCcnKSArIFwiXVwiLCAnZycpO1xuICAgICAgdGhpcy5fdGhvdXNhbmRzU2VwYXJhdG9yUmVnRXhwID0gbmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAodGhpcy50aG91c2FuZHNTZXBhcmF0b3IpLCAnZycpO1xuICAgIH1cbiAgICBfcmVtb3ZlVGhvdXNhbmRzU2VwYXJhdG9ycyh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UodGhpcy5fdGhvdXNhbmRzU2VwYXJhdG9yUmVnRXhwLCAnJyk7XG4gICAgfVxuICAgIF9pbnNlcnRUaG91c2FuZHNTZXBhcmF0b3JzKHZhbHVlKSB7XG4gICAgICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yOTAxMTAyL2hvdy10by1wcmludC1hLW51bWJlci13aXRoLWNvbW1hcy1hcy10aG91c2FuZHMtc2VwYXJhdG9ycy1pbi1qYXZhc2NyaXB0XG4gICAgICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KHRoaXMucmFkaXgpO1xuICAgICAgcGFydHNbMF0gPSBwYXJ0c1swXS5yZXBsYWNlKC9cXEIoPz0oXFxkezN9KSsoPyFcXGQpKS9nLCB0aGlzLnRob3VzYW5kc1NlcGFyYXRvcik7XG4gICAgICByZXR1cm4gcGFydHMuam9pbih0aGlzLnJhZGl4KTtcbiAgICB9XG4gICAgZG9QcmVwYXJlQ2hhcihjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBjb25zdCBbcHJlcENoLCBkZXRhaWxzXSA9IHN1cGVyLmRvUHJlcGFyZUNoYXIodGhpcy5fcmVtb3ZlVGhvdXNhbmRzU2VwYXJhdG9ycyh0aGlzLnNjYWxlICYmIHRoaXMubWFwVG9SYWRpeC5sZW5ndGggJiYgKFxuICAgICAgLypcbiAgICAgICAgcmFkaXggc2hvdWxkIGJlIG1hcHBlZCB3aGVuXG4gICAgICAgIDEpIGlucHV0IGlzIGRvbmUgZnJvbSBrZXlib2FyZCA9IGZsYWdzLmlucHV0ICYmIGZsYWdzLnJhd1xuICAgICAgICAyKSB1bm1hc2tlZCB2YWx1ZSBpcyBzZXQgPSAhZmxhZ3MuaW5wdXQgJiYgIWZsYWdzLnJhd1xuICAgICAgICBhbmQgc2hvdWxkIG5vdCBiZSBtYXBwZWQgd2hlblxuICAgICAgICAxKSB2YWx1ZSBpcyBzZXQgPSBmbGFncy5pbnB1dCAmJiAhZmxhZ3MucmF3XG4gICAgICAgIDIpIHJhdyB2YWx1ZSBpcyBzZXQgPSAhZmxhZ3MuaW5wdXQgJiYgZmxhZ3MucmF3XG4gICAgICAqL1xuICAgICAgZmxhZ3MuaW5wdXQgJiYgZmxhZ3MucmF3IHx8ICFmbGFncy5pbnB1dCAmJiAhZmxhZ3MucmF3KSA/IGNoLnJlcGxhY2UodGhpcy5fbWFwVG9SYWRpeFJlZ0V4cCwgdGhpcy5yYWRpeCkgOiBjaCksIGZsYWdzKTtcbiAgICAgIGlmIChjaCAmJiAhcHJlcENoKSBkZXRhaWxzLnNraXAgPSB0cnVlO1xuICAgICAgaWYgKHByZXBDaCAmJiAhdGhpcy5hbGxvd1Bvc2l0aXZlICYmICF0aGlzLnZhbHVlICYmIHByZXBDaCAhPT0gJy0nKSBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLl9hcHBlbmRDaGFyKCctJykpO1xuICAgICAgcmV0dXJuIFtwcmVwQ2gsIGRldGFpbHNdO1xuICAgIH1cbiAgICBfc2VwYXJhdG9yc0NvdW50KHRvLCBleHRlbmRPblNlcGFyYXRvcnMpIHtcbiAgICAgIGlmIChleHRlbmRPblNlcGFyYXRvcnMgPT09IHZvaWQgMCkge1xuICAgICAgICBleHRlbmRPblNlcGFyYXRvcnMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCB0bzsgKytwb3MpIHtcbiAgICAgICAgaWYgKHRoaXMuX3ZhbHVlLmluZGV4T2YodGhpcy50aG91c2FuZHNTZXBhcmF0b3IsIHBvcykgPT09IHBvcykge1xuICAgICAgICAgICsrY291bnQ7XG4gICAgICAgICAgaWYgKGV4dGVuZE9uU2VwYXJhdG9ycykgdG8gKz0gdGhpcy50aG91c2FuZHNTZXBhcmF0b3IubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY291bnQ7XG4gICAgfVxuICAgIF9zZXBhcmF0b3JzQ291bnRGcm9tU2xpY2Uoc2xpY2UpIHtcbiAgICAgIGlmIChzbGljZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHNsaWNlID0gdGhpcy5fdmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fc2VwYXJhdG9yc0NvdW50KHRoaXMuX3JlbW92ZVRob3VzYW5kc1NlcGFyYXRvcnMoc2xpY2UpLmxlbmd0aCwgdHJ1ZSk7XG4gICAgfVxuICAgIGV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIFtmcm9tUG9zLCB0b1Bvc10gPSB0aGlzLl9hZGp1c3RSYW5nZVdpdGhTZXBhcmF0b3JzKGZyb21Qb3MsIHRvUG9zKTtcbiAgICAgIHJldHVybiB0aGlzLl9yZW1vdmVUaG91c2FuZHNTZXBhcmF0b3JzKHN1cGVyLmV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpKTtcbiAgICB9XG4gICAgX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgcHJldkJlZm9yZVRhaWxWYWx1ZSA9IGZsYWdzLnRhaWwgJiYgZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSA/IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUuX3ZhbHVlIDogdGhpcy5fdmFsdWU7XG4gICAgICBjb25zdCBwcmV2QmVmb3JlVGFpbFNlcGFyYXRvcnNDb3VudCA9IHRoaXMuX3NlcGFyYXRvcnNDb3VudEZyb21TbGljZShwcmV2QmVmb3JlVGFpbFZhbHVlKTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdGhpcy5fcmVtb3ZlVGhvdXNhbmRzU2VwYXJhdG9ycyh0aGlzLnZhbHVlKTtcbiAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy5fdmFsdWU7XG4gICAgICB0aGlzLl92YWx1ZSArPSBjaDtcbiAgICAgIGNvbnN0IG51bSA9IHRoaXMubnVtYmVyO1xuICAgICAgbGV0IGFjY2VwdGVkID0gIWlzTmFOKG51bSk7XG4gICAgICBsZXQgc2tpcCA9IGZhbHNlO1xuICAgICAgaWYgKGFjY2VwdGVkKSB7XG4gICAgICAgIGxldCBmaXhlZE51bTtcbiAgICAgICAgaWYgKHRoaXMubWluICE9IG51bGwgJiYgdGhpcy5taW4gPCAwICYmIHRoaXMubnVtYmVyIDwgdGhpcy5taW4pIGZpeGVkTnVtID0gdGhpcy5taW47XG4gICAgICAgIGlmICh0aGlzLm1heCAhPSBudWxsICYmIHRoaXMubWF4ID4gMCAmJiB0aGlzLm51bWJlciA+IHRoaXMubWF4KSBmaXhlZE51bSA9IHRoaXMubWF4O1xuICAgICAgICBpZiAoZml4ZWROdW0gIT0gbnVsbCkge1xuICAgICAgICAgIGlmICh0aGlzLmF1dG9maXgpIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gdGhpcy5mb3JtYXQoZml4ZWROdW0sIHRoaXMpLnJlcGxhY2UoTWFza2VkTnVtYmVyLlVOTUFTS0VEX1JBRElYLCB0aGlzLnJhZGl4KTtcbiAgICAgICAgICAgIHNraXAgfHwgKHNraXAgPSBvbGRWYWx1ZSA9PT0gdGhpcy5fdmFsdWUgJiYgIWZsYWdzLnRhaWwpOyAvLyBpZiBub3QgY2hhbmdlZCBvbiB0YWlsIGl0J3Mgc3RpbGwgb2sgdG8gcHJvY2VlZFxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY2NlcHRlZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhY2NlcHRlZCAmJiAoYWNjZXB0ZWQgPSBCb29sZWFuKHRoaXMuX3ZhbHVlLm1hdGNoKHRoaXMuX251bWJlclJlZ0V4cCkpKTtcbiAgICAgIH1cbiAgICAgIGxldCBhcHBlbmREZXRhaWxzO1xuICAgICAgaWYgKCFhY2NlcHRlZCkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IG9sZFZhbHVlO1xuICAgICAgICBhcHBlbmREZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcGVuZERldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscyh7XG4gICAgICAgICAgaW5zZXJ0ZWQ6IHRoaXMuX3ZhbHVlLnNsaWNlKG9sZFZhbHVlLmxlbmd0aCksXG4gICAgICAgICAgcmF3SW5zZXJ0ZWQ6IHNraXAgPyAnJyA6IGNoLFxuICAgICAgICAgIHNraXBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuX2luc2VydFRob3VzYW5kc1NlcGFyYXRvcnModGhpcy5fdmFsdWUpO1xuICAgICAgY29uc3QgYmVmb3JlVGFpbFZhbHVlID0gZmxhZ3MudGFpbCAmJiBmbGFncy5fYmVmb3JlVGFpbFN0YXRlID8gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZS5fdmFsdWUgOiB0aGlzLl92YWx1ZTtcbiAgICAgIGNvbnN0IGJlZm9yZVRhaWxTZXBhcmF0b3JzQ291bnQgPSB0aGlzLl9zZXBhcmF0b3JzQ291bnRGcm9tU2xpY2UoYmVmb3JlVGFpbFZhbHVlKTtcbiAgICAgIGFwcGVuZERldGFpbHMudGFpbFNoaWZ0ICs9IChiZWZvcmVUYWlsU2VwYXJhdG9yc0NvdW50IC0gcHJldkJlZm9yZVRhaWxTZXBhcmF0b3JzQ291bnQpICogdGhpcy50aG91c2FuZHNTZXBhcmF0b3IubGVuZ3RoO1xuICAgICAgcmV0dXJuIGFwcGVuZERldGFpbHM7XG4gICAgfVxuICAgIF9maW5kU2VwYXJhdG9yQXJvdW5kKHBvcykge1xuICAgICAgaWYgKHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yKSB7XG4gICAgICAgIGNvbnN0IHNlYXJjaEZyb20gPSBwb3MgLSB0aGlzLnRob3VzYW5kc1NlcGFyYXRvci5sZW5ndGggKyAxO1xuICAgICAgICBjb25zdCBzZXBhcmF0b3JQb3MgPSB0aGlzLnZhbHVlLmluZGV4T2YodGhpcy50aG91c2FuZHNTZXBhcmF0b3IsIHNlYXJjaEZyb20pO1xuICAgICAgICBpZiAoc2VwYXJhdG9yUG9zIDw9IHBvcykgcmV0dXJuIHNlcGFyYXRvclBvcztcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgX2FkanVzdFJhbmdlV2l0aFNlcGFyYXRvcnMoZnJvbSwgdG8pIHtcbiAgICAgIGNvbnN0IHNlcGFyYXRvckFyb3VuZEZyb21Qb3MgPSB0aGlzLl9maW5kU2VwYXJhdG9yQXJvdW5kKGZyb20pO1xuICAgICAgaWYgKHNlcGFyYXRvckFyb3VuZEZyb21Qb3MgPj0gMCkgZnJvbSA9IHNlcGFyYXRvckFyb3VuZEZyb21Qb3M7XG4gICAgICBjb25zdCBzZXBhcmF0b3JBcm91bmRUb1BvcyA9IHRoaXMuX2ZpbmRTZXBhcmF0b3JBcm91bmQodG8pO1xuICAgICAgaWYgKHNlcGFyYXRvckFyb3VuZFRvUG9zID49IDApIHRvID0gc2VwYXJhdG9yQXJvdW5kVG9Qb3MgKyB0aGlzLnRob3VzYW5kc1NlcGFyYXRvci5sZW5ndGg7XG4gICAgICByZXR1cm4gW2Zyb20sIHRvXTtcbiAgICB9XG4gICAgcmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBbZnJvbVBvcywgdG9Qb3NdID0gdGhpcy5fYWRqdXN0UmFuZ2VXaXRoU2VwYXJhdG9ycyhmcm9tUG9zLCB0b1Bvcyk7XG4gICAgICBjb25zdCB2YWx1ZUJlZm9yZVBvcyA9IHRoaXMudmFsdWUuc2xpY2UoMCwgZnJvbVBvcyk7XG4gICAgICBjb25zdCB2YWx1ZUFmdGVyUG9zID0gdGhpcy52YWx1ZS5zbGljZSh0b1Bvcyk7XG4gICAgICBjb25zdCBwcmV2QmVmb3JlVGFpbFNlcGFyYXRvcnNDb3VudCA9IHRoaXMuX3NlcGFyYXRvcnNDb3VudCh2YWx1ZUJlZm9yZVBvcy5sZW5ndGgpO1xuICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLl9pbnNlcnRUaG91c2FuZHNTZXBhcmF0b3JzKHRoaXMuX3JlbW92ZVRob3VzYW5kc1NlcGFyYXRvcnModmFsdWVCZWZvcmVQb3MgKyB2YWx1ZUFmdGVyUG9zKSk7XG4gICAgICBjb25zdCBiZWZvcmVUYWlsU2VwYXJhdG9yc0NvdW50ID0gdGhpcy5fc2VwYXJhdG9yc0NvdW50RnJvbVNsaWNlKHZhbHVlQmVmb3JlUG9zKTtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscyh7XG4gICAgICAgIHRhaWxTaGlmdDogKGJlZm9yZVRhaWxTZXBhcmF0b3JzQ291bnQgLSBwcmV2QmVmb3JlVGFpbFNlcGFyYXRvcnNDb3VudCkgKiB0aGlzLnRob3VzYW5kc1NlcGFyYXRvci5sZW5ndGhcbiAgICAgIH0pO1xuICAgIH1cbiAgICBuZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBkaXJlY3Rpb24pIHtcbiAgICAgIGlmICghdGhpcy50aG91c2FuZHNTZXBhcmF0b3IpIHJldHVybiBjdXJzb3JQb3M7XG4gICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlIERJUkVDVElPTi5OT05FOlxuICAgICAgICBjYXNlIERJUkVDVElPTi5MRUZUOlxuICAgICAgICBjYXNlIERJUkVDVElPTi5GT1JDRV9MRUZUOlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcGFyYXRvckF0TGVmdFBvcyA9IHRoaXMuX2ZpbmRTZXBhcmF0b3JBcm91bmQoY3Vyc29yUG9zIC0gMSk7XG4gICAgICAgICAgICBpZiAoc2VwYXJhdG9yQXRMZWZ0UG9zID49IDApIHtcbiAgICAgICAgICAgICAgY29uc3Qgc2VwYXJhdG9yQXRMZWZ0RW5kUG9zID0gc2VwYXJhdG9yQXRMZWZ0UG9zICsgdGhpcy50aG91c2FuZHNTZXBhcmF0b3IubGVuZ3RoO1xuICAgICAgICAgICAgICBpZiAoY3Vyc29yUG9zIDwgc2VwYXJhdG9yQXRMZWZ0RW5kUG9zIHx8IHRoaXMudmFsdWUubGVuZ3RoIDw9IHNlcGFyYXRvckF0TGVmdEVuZFBvcyB8fCBkaXJlY3Rpb24gPT09IERJUkVDVElPTi5GT1JDRV9MRUZUKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlcGFyYXRvckF0TGVmdFBvcztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICBjYXNlIERJUkVDVElPTi5SSUdIVDpcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uRk9SQ0VfUklHSFQ6XG4gICAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgc2VwYXJhdG9yQXRSaWdodFBvcyA9IHRoaXMuX2ZpbmRTZXBhcmF0b3JBcm91bmQoY3Vyc29yUG9zKTtcbiAgICAgICAgICAgIGlmIChzZXBhcmF0b3JBdFJpZ2h0UG9zID49IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlcGFyYXRvckF0UmlnaHRQb3MgKyB0aGlzLnRob3VzYW5kc1NlcGFyYXRvci5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGN1cnNvclBvcztcbiAgICB9XG4gICAgZG9Db21taXQoKSB7XG4gICAgICBpZiAodGhpcy52YWx1ZSkge1xuICAgICAgICBjb25zdCBudW1iZXIgPSB0aGlzLm51bWJlcjtcbiAgICAgICAgbGV0IHZhbGlkbnVtID0gbnVtYmVyO1xuXG4gICAgICAgIC8vIGNoZWNrIGJvdW5kc1xuICAgICAgICBpZiAodGhpcy5taW4gIT0gbnVsbCkgdmFsaWRudW0gPSBNYXRoLm1heCh2YWxpZG51bSwgdGhpcy5taW4pO1xuICAgICAgICBpZiAodGhpcy5tYXggIT0gbnVsbCkgdmFsaWRudW0gPSBNYXRoLm1pbih2YWxpZG51bSwgdGhpcy5tYXgpO1xuICAgICAgICBpZiAodmFsaWRudW0gIT09IG51bWJlcikgdGhpcy51bm1hc2tlZFZhbHVlID0gdGhpcy5mb3JtYXQodmFsaWRudW0sIHRoaXMpO1xuICAgICAgICBsZXQgZm9ybWF0dGVkID0gdGhpcy52YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMubm9ybWFsaXplWmVyb3MpIGZvcm1hdHRlZCA9IHRoaXMuX25vcm1hbGl6ZVplcm9zKGZvcm1hdHRlZCk7XG4gICAgICAgIGlmICh0aGlzLnBhZEZyYWN0aW9uYWxaZXJvcyAmJiB0aGlzLnNjYWxlID4gMCkgZm9ybWF0dGVkID0gdGhpcy5fcGFkRnJhY3Rpb25hbFplcm9zKGZvcm1hdHRlZCk7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gZm9ybWF0dGVkO1xuICAgICAgfVxuICAgICAgc3VwZXIuZG9Db21taXQoKTtcbiAgICB9XG4gICAgX25vcm1hbGl6ZVplcm9zKHZhbHVlKSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IHRoaXMuX3JlbW92ZVRob3VzYW5kc1NlcGFyYXRvcnModmFsdWUpLnNwbGl0KHRoaXMucmFkaXgpO1xuXG4gICAgICAvLyByZW1vdmUgbGVhZGluZyB6ZXJvc1xuICAgICAgcGFydHNbMF0gPSBwYXJ0c1swXS5yZXBsYWNlKC9eKFxcRCopKDAqKShcXGQqKS8sIChtYXRjaCwgc2lnbiwgemVyb3MsIG51bSkgPT4gc2lnbiArIG51bSk7XG4gICAgICAvLyBhZGQgbGVhZGluZyB6ZXJvXG4gICAgICBpZiAodmFsdWUubGVuZ3RoICYmICEvXFxkJC8udGVzdChwYXJ0c1swXSkpIHBhcnRzWzBdID0gcGFydHNbMF0gKyAnMCc7XG4gICAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICBwYXJ0c1sxXSA9IHBhcnRzWzFdLnJlcGxhY2UoLzAqJC8sICcnKTsgLy8gcmVtb3ZlIHRyYWlsaW5nIHplcm9zXG4gICAgICAgIGlmICghcGFydHNbMV0ubGVuZ3RoKSBwYXJ0cy5sZW5ndGggPSAxOyAvLyByZW1vdmUgZnJhY3Rpb25hbFxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2luc2VydFRob3VzYW5kc1NlcGFyYXRvcnMocGFydHMuam9pbih0aGlzLnJhZGl4KSk7XG4gICAgfVxuICAgIF9wYWRGcmFjdGlvbmFsWmVyb3ModmFsdWUpIHtcbiAgICAgIGlmICghdmFsdWUpIHJldHVybiB2YWx1ZTtcbiAgICAgIGNvbnN0IHBhcnRzID0gdmFsdWUuc3BsaXQodGhpcy5yYWRpeCk7XG4gICAgICBpZiAocGFydHMubGVuZ3RoIDwgMikgcGFydHMucHVzaCgnJyk7XG4gICAgICBwYXJ0c1sxXSA9IHBhcnRzWzFdLnBhZEVuZCh0aGlzLnNjYWxlLCAnMCcpO1xuICAgICAgcmV0dXJuIHBhcnRzLmpvaW4odGhpcy5yYWRpeCk7XG4gICAgfVxuICAgIGRvU2tpcEludmFsaWQoY2gsIGZsYWdzLCBjaGVja1RhaWwpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBjb25zdCBkcm9wRnJhY3Rpb25hbCA9IHRoaXMuc2NhbGUgPT09IDAgJiYgY2ggIT09IHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yICYmIChjaCA9PT0gdGhpcy5yYWRpeCB8fCBjaCA9PT0gTWFza2VkTnVtYmVyLlVOTUFTS0VEX1JBRElYIHx8IHRoaXMubWFwVG9SYWRpeC5pbmNsdWRlcyhjaCkpO1xuICAgICAgcmV0dXJuIHN1cGVyLmRvU2tpcEludmFsaWQoY2gsIGZsYWdzLCBjaGVja1RhaWwpICYmICFkcm9wRnJhY3Rpb25hbDtcbiAgICB9XG4gICAgZ2V0IHVubWFza2VkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVtb3ZlVGhvdXNhbmRzU2VwYXJhdG9ycyh0aGlzLl9ub3JtYWxpemVaZXJvcyh0aGlzLnZhbHVlKSkucmVwbGFjZSh0aGlzLnJhZGl4LCBNYXNrZWROdW1iZXIuVU5NQVNLRURfUkFESVgpO1xuICAgIH1cbiAgICBzZXQgdW5tYXNrZWRWYWx1ZSh1bm1hc2tlZFZhbHVlKSB7XG4gICAgICBzdXBlci51bm1hc2tlZFZhbHVlID0gdW5tYXNrZWRWYWx1ZTtcbiAgICB9XG4gICAgZ2V0IHR5cGVkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZSh0aGlzLnVubWFza2VkVmFsdWUsIHRoaXMpO1xuICAgIH1cbiAgICBzZXQgdHlwZWRWYWx1ZShuKSB7XG4gICAgICB0aGlzLnJhd0lucHV0VmFsdWUgPSB0aGlzLmZvcm1hdChuLCB0aGlzKS5yZXBsYWNlKE1hc2tlZE51bWJlci5VTk1BU0tFRF9SQURJWCwgdGhpcy5yYWRpeCk7XG4gICAgfVxuXG4gICAgLyoqIFBhcnNlZCBOdW1iZXIgKi9cbiAgICBnZXQgbnVtYmVyKCkge1xuICAgICAgcmV0dXJuIHRoaXMudHlwZWRWYWx1ZTtcbiAgICB9XG4gICAgc2V0IG51bWJlcihudW1iZXIpIHtcbiAgICAgIHRoaXMudHlwZWRWYWx1ZSA9IG51bWJlcjtcbiAgICB9XG4gICAgZ2V0IGFsbG93TmVnYXRpdmUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5taW4gIT0gbnVsbCAmJiB0aGlzLm1pbiA8IDAgfHwgdGhpcy5tYXggIT0gbnVsbCAmJiB0aGlzLm1heCA8IDA7XG4gICAgfVxuICAgIGdldCBhbGxvd1Bvc2l0aXZlKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWluICE9IG51bGwgJiYgdGhpcy5taW4gPiAwIHx8IHRoaXMubWF4ICE9IG51bGwgJiYgdGhpcy5tYXggPiAwO1xuICAgIH1cbiAgICB0eXBlZFZhbHVlRXF1YWxzKHZhbHVlKSB7XG4gICAgICAvLyBoYW5kbGUgIDAgLT4gJycgY2FzZSAodHlwZWQgPSAwIGV2ZW4gaWYgdmFsdWUgPSAnJylcbiAgICAgIC8vIGZvciBkZXRhaWxzIHNlZSBodHRwczovL2dpdGh1Yi5jb20vdU5tQW5OZVIvaW1hc2tqcy9pc3N1ZXMvMTM0XG4gICAgICByZXR1cm4gKHN1cGVyLnR5cGVkVmFsdWVFcXVhbHModmFsdWUpIHx8IE1hc2tlZE51bWJlci5FTVBUWV9WQUxVRVMuaW5jbHVkZXModmFsdWUpICYmIE1hc2tlZE51bWJlci5FTVBUWV9WQUxVRVMuaW5jbHVkZXModGhpcy50eXBlZFZhbHVlKSkgJiYgISh2YWx1ZSA9PT0gMCAmJiB0aGlzLnZhbHVlID09PSAnJyk7XG4gICAgfVxuICB9XG4gIF9NYXNrZWROdW1iZXIgPSBNYXNrZWROdW1iZXI7XG4gIE1hc2tlZE51bWJlci5VTk1BU0tFRF9SQURJWCA9ICcuJztcbiAgTWFza2VkTnVtYmVyLkVNUFRZX1ZBTFVFUyA9IFsuLi5NYXNrZWQuRU1QVFlfVkFMVUVTLCAwXTtcbiAgTWFza2VkTnVtYmVyLkRFRkFVTFRTID0ge1xuICAgIC4uLk1hc2tlZC5ERUZBVUxUUyxcbiAgICBtYXNrOiBOdW1iZXIsXG4gICAgcmFkaXg6ICcsJyxcbiAgICB0aG91c2FuZHNTZXBhcmF0b3I6ICcnLFxuICAgIG1hcFRvUmFkaXg6IFtfTWFza2VkTnVtYmVyLlVOTUFTS0VEX1JBRElYXSxcbiAgICBtaW46IE51bWJlci5NSU5fU0FGRV9JTlRFR0VSLFxuICAgIG1heDogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsXG4gICAgc2NhbGU6IDIsXG4gICAgbm9ybWFsaXplWmVyb3M6IHRydWUsXG4gICAgcGFkRnJhY3Rpb25hbFplcm9zOiBmYWxzZSxcbiAgICBwYXJzZTogTnVtYmVyLFxuICAgIGZvcm1hdDogbiA9PiBuLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycsIHtcbiAgICAgIHVzZUdyb3VwaW5nOiBmYWxzZSxcbiAgICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMjBcbiAgICB9KVxuICB9O1xuICBJTWFzay5NYXNrZWROdW1iZXIgPSBNYXNrZWROdW1iZXI7XG5cbiAgLyoqIE1hc2sgcGlwZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIHR5cGVzICovXG4gIGNvbnN0IFBJUEVfVFlQRSA9IHtcbiAgICBNQVNLRUQ6ICd2YWx1ZScsXG4gICAgVU5NQVNLRUQ6ICd1bm1hc2tlZFZhbHVlJyxcbiAgICBUWVBFRDogJ3R5cGVkVmFsdWUnXG4gIH07XG4gIC8qKiBDcmVhdGVzIG5ldyBwaXBlIGZ1bmN0aW9uIGRlcGVuZGluZyBvbiBtYXNrIHR5cGUsIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gb3B0aW9ucyAqL1xuICBmdW5jdGlvbiBjcmVhdGVQaXBlKGFyZywgZnJvbSwgdG8pIHtcbiAgICBpZiAoZnJvbSA9PT0gdm9pZCAwKSB7XG4gICAgICBmcm9tID0gUElQRV9UWVBFLk1BU0tFRDtcbiAgICB9XG4gICAgaWYgKHRvID09PSB2b2lkIDApIHtcbiAgICAgIHRvID0gUElQRV9UWVBFLk1BU0tFRDtcbiAgICB9XG4gICAgY29uc3QgbWFza2VkID0gY3JlYXRlTWFzayhhcmcpO1xuICAgIHJldHVybiB2YWx1ZSA9PiBtYXNrZWQucnVuSXNvbGF0ZWQobSA9PiB7XG4gICAgICBtW2Zyb21dID0gdmFsdWU7XG4gICAgICByZXR1cm4gbVt0b107XG4gICAgfSk7XG4gIH1cblxuICAvKiogUGlwZXMgdmFsdWUgdGhyb3VnaCBtYXNrIGRlcGVuZGluZyBvbiBtYXNrIHR5cGUsIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gb3B0aW9ucyAqL1xuICBmdW5jdGlvbiBwaXBlKHZhbHVlLCBtYXNrLCBmcm9tLCB0bykge1xuICAgIHJldHVybiBjcmVhdGVQaXBlKG1hc2ssIGZyb20sIHRvKSh2YWx1ZSk7XG4gIH1cbiAgSU1hc2suUElQRV9UWVBFID0gUElQRV9UWVBFO1xuICBJTWFzay5jcmVhdGVQaXBlID0gY3JlYXRlUGlwZTtcbiAgSU1hc2sucGlwZSA9IHBpcGU7XG5cbiAgLyoqIFBhdHRlcm4gbWFzayAqL1xuICBjbGFzcyBSZXBlYXRCbG9jayBleHRlbmRzIE1hc2tlZFBhdHRlcm4ge1xuICAgIGdldCByZXBlYXRGcm9tKCkge1xuICAgICAgdmFyIF9yZWY7XG4gICAgICByZXR1cm4gKF9yZWYgPSBBcnJheS5pc0FycmF5KHRoaXMucmVwZWF0KSA/IHRoaXMucmVwZWF0WzBdIDogdGhpcy5yZXBlYXQgPT09IEluZmluaXR5ID8gMCA6IHRoaXMucmVwZWF0KSAhPSBudWxsID8gX3JlZiA6IDA7XG4gICAgfVxuICAgIGdldCByZXBlYXRUbygpIHtcbiAgICAgIHZhciBfcmVmMjtcbiAgICAgIHJldHVybiAoX3JlZjIgPSBBcnJheS5pc0FycmF5KHRoaXMucmVwZWF0KSA/IHRoaXMucmVwZWF0WzFdIDogdGhpcy5yZXBlYXQpICE9IG51bGwgPyBfcmVmMiA6IEluZmluaXR5O1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBzdXBlcihvcHRzKTtcbiAgICB9XG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIHZhciBfcmVmMywgX3JlZjQsIF90aGlzJF9ibG9ja3M7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHJlcGVhdCxcbiAgICAgICAgLi4uYmxvY2tPcHRzXG4gICAgICB9ID0gbm9ybWFsaXplT3B0cyhvcHRzKTsgLy8gVE9ETyB0eXBlXG4gICAgICB0aGlzLl9ibG9ja09wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLl9ibG9ja09wdHMsIGJsb2NrT3B0cyk7XG4gICAgICBjb25zdCBibG9jayA9IGNyZWF0ZU1hc2sodGhpcy5fYmxvY2tPcHRzKTtcbiAgICAgIHRoaXMucmVwZWF0ID0gKF9yZWYzID0gKF9yZWY0ID0gcmVwZWF0ICE9IG51bGwgPyByZXBlYXQgOiBibG9jay5yZXBlYXQpICE9IG51bGwgPyBfcmVmNCA6IHRoaXMucmVwZWF0KSAhPSBudWxsID8gX3JlZjMgOiBJbmZpbml0eTsgLy8gVE9ETyB0eXBlXG5cbiAgICAgIHN1cGVyLl91cGRhdGUoe1xuICAgICAgICBtYXNrOiAnbScucmVwZWF0KE1hdGgubWF4KHRoaXMucmVwZWF0VG8gPT09IEluZmluaXR5ICYmICgoX3RoaXMkX2Jsb2NrcyA9IHRoaXMuX2Jsb2NrcykgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJF9ibG9ja3MubGVuZ3RoKSB8fCAwLCB0aGlzLnJlcGVhdEZyb20pKSxcbiAgICAgICAgYmxvY2tzOiB7XG4gICAgICAgICAgbTogYmxvY2tcbiAgICAgICAgfSxcbiAgICAgICAgZWFnZXI6IGJsb2NrLmVhZ2VyLFxuICAgICAgICBvdmVyd3JpdGU6IGJsb2NrLm92ZXJ3cml0ZSxcbiAgICAgICAgc2tpcEludmFsaWQ6IGJsb2NrLnNraXBJbnZhbGlkLFxuICAgICAgICBsYXp5OiBibG9jay5sYXp5LFxuICAgICAgICBwbGFjZWhvbGRlckNoYXI6IGJsb2NrLnBsYWNlaG9sZGVyQ2hhcixcbiAgICAgICAgZGlzcGxheUNoYXI6IGJsb2NrLmRpc3BsYXlDaGFyXG4gICAgICB9KTtcbiAgICB9XG4gICAgX2FsbG9jYXRlQmxvY2soYmkpIHtcbiAgICAgIGlmIChiaSA8IHRoaXMuX2Jsb2Nrcy5sZW5ndGgpIHJldHVybiB0aGlzLl9ibG9ja3NbYmldO1xuICAgICAgaWYgKHRoaXMucmVwZWF0VG8gPT09IEluZmluaXR5IHx8IHRoaXMuX2Jsb2Nrcy5sZW5ndGggPCB0aGlzLnJlcGVhdFRvKSB7XG4gICAgICAgIHRoaXMuX2Jsb2Nrcy5wdXNoKGNyZWF0ZU1hc2sodGhpcy5fYmxvY2tPcHRzKSk7XG4gICAgICAgIHRoaXMubWFzayArPSAnbSc7XG4gICAgICAgIHJldHVybiB0aGlzLl9ibG9ja3NbdGhpcy5fYmxvY2tzLmxlbmd0aCAtIDFdO1xuICAgICAgfVxuICAgIH1cbiAgICBfYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGZvciAobGV0IGJpID0gKF90aGlzJF9tYXBQb3NUb0Jsb2NrJCA9IChfdGhpcyRfbWFwUG9zVG9CbG9jayA9IHRoaXMuX21hcFBvc1RvQmxvY2sodGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoKSkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJF9tYXBQb3NUb0Jsb2NrLmluZGV4KSAhPSBudWxsID8gX3RoaXMkX21hcFBvc1RvQmxvY2skIDogTWF0aC5tYXgodGhpcy5fYmxvY2tzLmxlbmd0aCAtIDEsIDApLCBibG9jaywgYWxsb2NhdGVkO1xuICAgICAgLy8gdHJ5IHRvIGdldCBhIGJsb2NrIG9yXG4gICAgICAvLyB0cnkgdG8gYWxsb2NhdGUgYSBuZXcgYmxvY2sgaWYgbm90IGFsbG9jYXRlZCBhbHJlYWR5XG4gICAgICBibG9jayA9IChfdGhpcyRfYmxvY2tzJGJpID0gdGhpcy5fYmxvY2tzW2JpXSkgIT0gbnVsbCA/IF90aGlzJF9ibG9ja3MkYmkgOiBhbGxvY2F0ZWQgPSAhYWxsb2NhdGVkICYmIHRoaXMuX2FsbG9jYXRlQmxvY2soYmkpOyArK2JpKSB7XG4gICAgICAgIHZhciBfdGhpcyRfbWFwUG9zVG9CbG9jayQsIF90aGlzJF9tYXBQb3NUb0Jsb2NrLCBfdGhpcyRfYmxvY2tzJGJpLCBfZmxhZ3MkX2JlZm9yZVRhaWxTdGE7XG4gICAgICAgIGNvbnN0IGJsb2NrRGV0YWlscyA9IGJsb2NrLl9hcHBlbmRDaGFyKGNoLCB7XG4gICAgICAgICAgLi4uZmxhZ3MsXG4gICAgICAgICAgX2JlZm9yZVRhaWxTdGF0ZTogKF9mbGFncyRfYmVmb3JlVGFpbFN0YSA9IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUpID09IG51bGwgfHwgKF9mbGFncyRfYmVmb3JlVGFpbFN0YSA9IF9mbGFncyRfYmVmb3JlVGFpbFN0YS5fYmxvY2tzKSA9PSBudWxsID8gdm9pZCAwIDogX2ZsYWdzJF9iZWZvcmVUYWlsU3RhW2JpXVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGJsb2NrRGV0YWlscy5za2lwICYmIGFsbG9jYXRlZCkge1xuICAgICAgICAgIC8vIHJlbW92ZSB0aGUgbGFzdCBhbGxvY2F0ZWQgYmxvY2sgYW5kIGJyZWFrXG4gICAgICAgICAgdGhpcy5fYmxvY2tzLnBvcCgpO1xuICAgICAgICAgIHRoaXMubWFzayA9IHRoaXMubWFzay5zbGljZSgxKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShibG9ja0RldGFpbHMpO1xuICAgICAgICBpZiAoYmxvY2tEZXRhaWxzLmNvbnN1bWVkKSBicmVhazsgLy8gZ28gbmV4dCBjaGFyXG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgX3RyaW1FbXB0eVRhaWwoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIHZhciBfdGhpcyRfbWFwUG9zVG9CbG9jazIsIF90aGlzJF9tYXBQb3NUb0Jsb2NrMztcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBjb25zdCBmaXJzdEJsb2NrSW5kZXggPSBNYXRoLm1heCgoKF90aGlzJF9tYXBQb3NUb0Jsb2NrMiA9IHRoaXMuX21hcFBvc1RvQmxvY2soZnJvbVBvcykpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRfbWFwUG9zVG9CbG9jazIuaW5kZXgpIHx8IDAsIHRoaXMucmVwZWF0RnJvbSwgMCk7XG4gICAgICBsZXQgbGFzdEJsb2NrSW5kZXg7XG4gICAgICBpZiAodG9Qb3MgIT0gbnVsbCkgbGFzdEJsb2NrSW5kZXggPSAoX3RoaXMkX21hcFBvc1RvQmxvY2szID0gdGhpcy5fbWFwUG9zVG9CbG9jayh0b1BvcykpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRfbWFwUG9zVG9CbG9jazMuaW5kZXg7XG4gICAgICBpZiAobGFzdEJsb2NrSW5kZXggPT0gbnVsbCkgbGFzdEJsb2NrSW5kZXggPSB0aGlzLl9ibG9ja3MubGVuZ3RoIC0gMTtcbiAgICAgIGxldCByZW1vdmVDb3VudCA9IDA7XG4gICAgICBmb3IgKGxldCBibG9ja0luZGV4ID0gbGFzdEJsb2NrSW5kZXg7IGZpcnN0QmxvY2tJbmRleCA8PSBibG9ja0luZGV4OyAtLWJsb2NrSW5kZXgsICsrcmVtb3ZlQ291bnQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Jsb2Nrc1tibG9ja0luZGV4XS51bm1hc2tlZFZhbHVlKSBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChyZW1vdmVDb3VudCkge1xuICAgICAgICB0aGlzLl9ibG9ja3Muc3BsaWNlKGxhc3RCbG9ja0luZGV4IC0gcmVtb3ZlQ291bnQgKyAxLCByZW1vdmVDb3VudCk7XG4gICAgICAgIHRoaXMubWFzayA9IHRoaXMubWFzay5zbGljZShyZW1vdmVDb3VudCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgc3VwZXIucmVzZXQoKTtcbiAgICAgIHRoaXMuX3RyaW1FbXB0eVRhaWwoKTtcbiAgICB9XG4gICAgcmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBjb25zdCByZW1vdmVEZXRhaWxzID0gc3VwZXIucmVtb3ZlKGZyb21Qb3MsIHRvUG9zKTtcbiAgICAgIHRoaXMuX3RyaW1FbXB0eVRhaWwoZnJvbVBvcywgdG9Qb3MpO1xuICAgICAgcmV0dXJuIHJlbW92ZURldGFpbHM7XG4gICAgfVxuICAgIHRvdGFsSW5wdXRQb3NpdGlvbnMoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT0gbnVsbCAmJiB0aGlzLnJlcGVhdFRvID09PSBJbmZpbml0eSkgcmV0dXJuIEluZmluaXR5O1xuICAgICAgcmV0dXJuIHN1cGVyLnRvdGFsSW5wdXRQb3NpdGlvbnMoZnJvbVBvcywgdG9Qb3MpO1xuICAgIH1cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICByZXR1cm4gc3VwZXIuc3RhdGU7XG4gICAgfVxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xuICAgICAgdGhpcy5fYmxvY2tzLmxlbmd0aCA9IHN0YXRlLl9ibG9ja3MubGVuZ3RoO1xuICAgICAgdGhpcy5tYXNrID0gdGhpcy5tYXNrLnNsaWNlKDAsIHRoaXMuX2Jsb2Nrcy5sZW5ndGgpO1xuICAgICAgc3VwZXIuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gIH1cbiAgSU1hc2suUmVwZWF0QmxvY2sgPSBSZXBlYXRCbG9jaztcblxuICB0cnkge1xuICAgIGdsb2JhbFRoaXMuSU1hc2sgPSBJTWFzaztcbiAgfSBjYXRjaCB7fVxuXG4gIGV4cG9ydHMuQ2hhbmdlRGV0YWlscyA9IENoYW5nZURldGFpbHM7XG4gIGV4cG9ydHMuQ2h1bmtzVGFpbERldGFpbHMgPSBDaHVua3NUYWlsRGV0YWlscztcbiAgZXhwb3J0cy5ESVJFQ1RJT04gPSBESVJFQ1RJT047XG4gIGV4cG9ydHMuSFRNTENvbnRlbnRlZGl0YWJsZU1hc2tFbGVtZW50ID0gSFRNTENvbnRlbnRlZGl0YWJsZU1hc2tFbGVtZW50O1xuICBleHBvcnRzLkhUTUxJbnB1dE1hc2tFbGVtZW50ID0gSFRNTElucHV0TWFza0VsZW1lbnQ7XG4gIGV4cG9ydHMuSFRNTE1hc2tFbGVtZW50ID0gSFRNTE1hc2tFbGVtZW50O1xuICBleHBvcnRzLklucHV0TWFzayA9IElucHV0TWFzaztcbiAgZXhwb3J0cy5NYXNrRWxlbWVudCA9IE1hc2tFbGVtZW50O1xuICBleHBvcnRzLk1hc2tlZCA9IE1hc2tlZDtcbiAgZXhwb3J0cy5NYXNrZWREYXRlID0gTWFza2VkRGF0ZTtcbiAgZXhwb3J0cy5NYXNrZWREeW5hbWljID0gTWFza2VkRHluYW1pYztcbiAgZXhwb3J0cy5NYXNrZWRFbnVtID0gTWFza2VkRW51bTtcbiAgZXhwb3J0cy5NYXNrZWRGdW5jdGlvbiA9IE1hc2tlZEZ1bmN0aW9uO1xuICBleHBvcnRzLk1hc2tlZE51bWJlciA9IE1hc2tlZE51bWJlcjtcbiAgZXhwb3J0cy5NYXNrZWRQYXR0ZXJuID0gTWFza2VkUGF0dGVybjtcbiAgZXhwb3J0cy5NYXNrZWRSYW5nZSA9IE1hc2tlZFJhbmdlO1xuICBleHBvcnRzLk1hc2tlZFJlZ0V4cCA9IE1hc2tlZFJlZ0V4cDtcbiAgZXhwb3J0cy5QSVBFX1RZUEUgPSBQSVBFX1RZUEU7XG4gIGV4cG9ydHMuUGF0dGVybkZpeGVkRGVmaW5pdGlvbiA9IFBhdHRlcm5GaXhlZERlZmluaXRpb247XG4gIGV4cG9ydHMuUGF0dGVybklucHV0RGVmaW5pdGlvbiA9IFBhdHRlcm5JbnB1dERlZmluaXRpb247XG4gIGV4cG9ydHMuUmVwZWF0QmxvY2sgPSBSZXBlYXRCbG9jaztcbiAgZXhwb3J0cy5jcmVhdGVNYXNrID0gY3JlYXRlTWFzaztcbiAgZXhwb3J0cy5jcmVhdGVQaXBlID0gY3JlYXRlUGlwZTtcbiAgZXhwb3J0cy5kZWZhdWx0ID0gSU1hc2s7XG4gIGV4cG9ydHMuZm9yY2VEaXJlY3Rpb24gPSBmb3JjZURpcmVjdGlvbjtcbiAgZXhwb3J0cy5ub3JtYWxpemVPcHRzID0gbm9ybWFsaXplT3B0cztcbiAgZXhwb3J0cy5waXBlID0gcGlwZTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbWFzay5qcy5tYXBcbiIsIi8qIVxuICogdmFsaWRhdGUuanMgMC4xMy4xXG4gKlxuICogKGMpIDIwMTMtMjAxOSBOaWNrbGFzIEFuc21hbiwgMjAxMyBXcmFwcFxuICogVmFsaWRhdGUuanMgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKiBGb3IgYWxsIGRldGFpbHMgYW5kIGRvY3VtZW50YXRpb246XG4gKiBodHRwOi8vdmFsaWRhdGVqcy5vcmcvXG4gKi9cblxuKGZ1bmN0aW9uKGV4cG9ydHMsIG1vZHVsZSwgZGVmaW5lKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIC8vIFRoZSBtYWluIGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIHZhbGlkYXRvcnMgc3BlY2lmaWVkIGJ5IHRoZSBjb25zdHJhaW50cy5cbiAgLy8gVGhlIG9wdGlvbnMgYXJlIHRoZSBmb2xsb3dpbmc6XG4gIC8vICAgLSBmb3JtYXQgKHN0cmluZykgLSBBbiBvcHRpb24gdGhhdCBjb250cm9scyBob3cgdGhlIHJldHVybmVkIHZhbHVlIGlzIGZvcm1hdHRlZFxuICAvLyAgICAgKiBmbGF0IC0gUmV0dXJucyBhIGZsYXQgYXJyYXkgb2YganVzdCB0aGUgZXJyb3IgbWVzc2FnZXNcbiAgLy8gICAgICogZ3JvdXBlZCAtIFJldHVybnMgdGhlIG1lc3NhZ2VzIGdyb3VwZWQgYnkgYXR0cmlidXRlIChkZWZhdWx0KVxuICAvLyAgICAgKiBkZXRhaWxlZCAtIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHJhdyB2YWxpZGF0aW9uIGRhdGFcbiAgLy8gICAtIGZ1bGxNZXNzYWdlcyAoYm9vbGVhbikgLSBJZiBgdHJ1ZWAgKGRlZmF1bHQpIHRoZSBhdHRyaWJ1dGUgbmFtZSBpcyBwcmVwZW5kZWQgdG8gdGhlIGVycm9yLlxuICAvL1xuICAvLyBQbGVhc2Ugbm90ZSB0aGF0IHRoZSBvcHRpb25zIGFyZSBhbHNvIHBhc3NlZCB0byBlYWNoIHZhbGlkYXRvci5cbiAgdmFyIHZhbGlkYXRlID0gZnVuY3Rpb24oYXR0cmlidXRlcywgY29uc3RyYWludHMsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHYub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICB2YXIgcmVzdWx0cyA9IHYucnVuVmFsaWRhdGlvbnMoYXR0cmlidXRlcywgY29uc3RyYWludHMsIG9wdGlvbnMpXG4gICAgICAsIGF0dHJcbiAgICAgICwgdmFsaWRhdG9yO1xuXG4gICAgaWYgKHJlc3VsdHMuc29tZShmdW5jdGlvbihyKSB7IHJldHVybiB2LmlzUHJvbWlzZShyLmVycm9yKTsgfSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlVzZSB2YWxpZGF0ZS5hc3luYyBpZiB5b3Ugd2FudCBzdXBwb3J0IGZvciBwcm9taXNlc1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbGlkYXRlLnByb2Nlc3NWYWxpZGF0aW9uUmVzdWx0cyhyZXN1bHRzLCBvcHRpb25zKTtcbiAgfTtcblxuICB2YXIgdiA9IHZhbGlkYXRlO1xuXG4gIC8vIENvcGllcyBvdmVyIGF0dHJpYnV0ZXMgZnJvbSBvbmUgb3IgbW9yZSBzb3VyY2VzIHRvIGEgc2luZ2xlIGRlc3RpbmF0aW9uLlxuICAvLyBWZXJ5IG11Y2ggc2ltaWxhciB0byB1bmRlcnNjb3JlJ3MgZXh0ZW5kLlxuICAvLyBUaGUgZmlyc3QgYXJndW1lbnQgaXMgdGhlIHRhcmdldCBvYmplY3QgYW5kIHRoZSByZW1haW5pbmcgYXJndW1lbnRzIHdpbGwgYmVcbiAgLy8gdXNlZCBhcyBzb3VyY2VzLlxuICB2LmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKS5mb3JFYWNoKGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgZm9yICh2YXIgYXR0ciBpbiBzb3VyY2UpIHtcbiAgICAgICAgb2JqW2F0dHJdID0gc291cmNlW2F0dHJdO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgdi5leHRlbmQodmFsaWRhdGUsIHtcbiAgICAvLyBUaGlzIGlzIHRoZSB2ZXJzaW9uIG9mIHRoZSBsaWJyYXJ5IGFzIGEgc2VtdmVyLlxuICAgIC8vIFRoZSB0b1N0cmluZyBmdW5jdGlvbiB3aWxsIGFsbG93IGl0IHRvIGJlIGNvZXJjZWQgaW50byBhIHN0cmluZ1xuICAgIHZlcnNpb246IHtcbiAgICAgIG1ham9yOiAwLFxuICAgICAgbWlub3I6IDEzLFxuICAgICAgcGF0Y2g6IDEsXG4gICAgICBtZXRhZGF0YTogbnVsbCxcbiAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZlcnNpb24gPSB2LmZvcm1hdChcIiV7bWFqb3J9LiV7bWlub3J9LiV7cGF0Y2h9XCIsIHYudmVyc2lvbik7XG4gICAgICAgIGlmICghdi5pc0VtcHR5KHYudmVyc2lvbi5tZXRhZGF0YSkpIHtcbiAgICAgICAgICB2ZXJzaW9uICs9IFwiK1wiICsgdi52ZXJzaW9uLm1ldGFkYXRhO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2ZXJzaW9uO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBCZWxvdyBpcyB0aGUgZGVwZW5kZW5jaWVzIHRoYXQgYXJlIHVzZWQgaW4gdmFsaWRhdGUuanNcblxuICAgIC8vIFRoZSBjb25zdHJ1Y3RvciBvZiB0aGUgUHJvbWlzZSBpbXBsZW1lbnRhdGlvbi5cbiAgICAvLyBJZiB5b3UgYXJlIHVzaW5nIFEuanMsIFJTVlAgb3IgYW55IG90aGVyIEErIGNvbXBhdGlibGUgaW1wbGVtZW50YXRpb25cbiAgICAvLyBvdmVycmlkZSB0aGlzIGF0dHJpYnV0ZSB0byBiZSB0aGUgY29uc3RydWN0b3Igb2YgdGhhdCBwcm9taXNlLlxuICAgIC8vIFNpbmNlIGpRdWVyeSBwcm9taXNlcyBhcmVuJ3QgQSsgY29tcGF0aWJsZSB0aGV5IHdvbid0IHdvcmsuXG4gICAgUHJvbWlzZTogdHlwZW9mIFByb21pc2UgIT09IFwidW5kZWZpbmVkXCIgPyBQcm9taXNlIDogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gbnVsbCxcblxuICAgIEVNUFRZX1NUUklOR19SRUdFWFA6IC9eXFxzKiQvLFxuXG4gICAgLy8gUnVucyB0aGUgdmFsaWRhdG9ycyBzcGVjaWZpZWQgYnkgdGhlIGNvbnN0cmFpbnRzIG9iamVjdC5cbiAgICAvLyBXaWxsIHJldHVybiBhbiBhcnJheSBvZiB0aGUgZm9ybWF0OlxuICAgIC8vICAgICBbe2F0dHJpYnV0ZTogXCI8YXR0cmlidXRlIG5hbWU+XCIsIGVycm9yOiBcIjx2YWxpZGF0aW9uIHJlc3VsdD5cIn0sIC4uLl1cbiAgICBydW5WYWxpZGF0aW9uczogZnVuY3Rpb24oYXR0cmlidXRlcywgY29uc3RyYWludHMsIG9wdGlvbnMpIHtcbiAgICAgIHZhciByZXN1bHRzID0gW11cbiAgICAgICAgLCBhdHRyXG4gICAgICAgICwgdmFsaWRhdG9yTmFtZVxuICAgICAgICAsIHZhbHVlXG4gICAgICAgICwgdmFsaWRhdG9yc1xuICAgICAgICAsIHZhbGlkYXRvclxuICAgICAgICAsIHZhbGlkYXRvck9wdGlvbnNcbiAgICAgICAgLCBlcnJvcjtcblxuICAgICAgaWYgKHYuaXNEb21FbGVtZW50KGF0dHJpYnV0ZXMpIHx8IHYuaXNKcXVlcnlFbGVtZW50KGF0dHJpYnV0ZXMpKSB7XG4gICAgICAgIGF0dHJpYnV0ZXMgPSB2LmNvbGxlY3RGb3JtVmFsdWVzKGF0dHJpYnV0ZXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBMb29wcyB0aHJvdWdoIGVhY2ggY29uc3RyYWludHMsIGZpbmRzIHRoZSBjb3JyZWN0IHZhbGlkYXRvciBhbmQgcnVuIGl0LlxuICAgICAgZm9yIChhdHRyIGluIGNvbnN0cmFpbnRzKSB7XG4gICAgICAgIHZhbHVlID0gdi5nZXREZWVwT2JqZWN0VmFsdWUoYXR0cmlidXRlcywgYXR0cik7XG4gICAgICAgIC8vIFRoaXMgYWxsb3dzIHRoZSBjb25zdHJhaW50cyBmb3IgYW4gYXR0cmlidXRlIHRvIGJlIGEgZnVuY3Rpb24uXG4gICAgICAgIC8vIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB3aXRoIHRoZSB2YWx1ZSwgYXR0cmlidXRlIG5hbWUsIHRoZSBjb21wbGV0ZSBkaWN0IG9mXG4gICAgICAgIC8vIGF0dHJpYnV0ZXMgYXMgd2VsbCBhcyB0aGUgb3B0aW9ucyBhbmQgY29uc3RyYWludHMgcGFzc2VkIGluLlxuICAgICAgICAvLyBUaGlzIGlzIHVzZWZ1bCB3aGVuIHlvdSB3YW50IHRvIGhhdmUgZGlmZmVyZW50XG4gICAgICAgIC8vIHZhbGlkYXRpb25zIGRlcGVuZGluZyBvbiB0aGUgYXR0cmlidXRlIHZhbHVlLlxuICAgICAgICB2YWxpZGF0b3JzID0gdi5yZXN1bHQoY29uc3RyYWludHNbYXR0cl0sIHZhbHVlLCBhdHRyaWJ1dGVzLCBhdHRyLCBvcHRpb25zLCBjb25zdHJhaW50cyk7XG5cbiAgICAgICAgZm9yICh2YWxpZGF0b3JOYW1lIGluIHZhbGlkYXRvcnMpIHtcbiAgICAgICAgICB2YWxpZGF0b3IgPSB2LnZhbGlkYXRvcnNbdmFsaWRhdG9yTmFtZV07XG5cbiAgICAgICAgICBpZiAoIXZhbGlkYXRvcikge1xuICAgICAgICAgICAgZXJyb3IgPSB2LmZvcm1hdChcIlVua25vd24gdmFsaWRhdG9yICV7bmFtZX1cIiwge25hbWU6IHZhbGlkYXRvck5hbWV9KTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFsaWRhdG9yT3B0aW9ucyA9IHZhbGlkYXRvcnNbdmFsaWRhdG9yTmFtZV07XG4gICAgICAgICAgLy8gVGhpcyBhbGxvd3MgdGhlIG9wdGlvbnMgdG8gYmUgYSBmdW5jdGlvbi4gVGhlIGZ1bmN0aW9uIHdpbGwgYmVcbiAgICAgICAgICAvLyBjYWxsZWQgd2l0aCB0aGUgdmFsdWUsIGF0dHJpYnV0ZSBuYW1lLCB0aGUgY29tcGxldGUgZGljdCBvZlxuICAgICAgICAgIC8vIGF0dHJpYnV0ZXMgYXMgd2VsbCBhcyB0aGUgb3B0aW9ucyBhbmQgY29uc3RyYWludHMgcGFzc2VkIGluLlxuICAgICAgICAgIC8vIFRoaXMgaXMgdXNlZnVsIHdoZW4geW91IHdhbnQgdG8gaGF2ZSBkaWZmZXJlbnRcbiAgICAgICAgICAvLyB2YWxpZGF0aW9ucyBkZXBlbmRpbmcgb24gdGhlIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgICAgICB2YWxpZGF0b3JPcHRpb25zID0gdi5yZXN1bHQodmFsaWRhdG9yT3B0aW9ucywgdmFsdWUsIGF0dHJpYnV0ZXMsIGF0dHIsIG9wdGlvbnMsIGNvbnN0cmFpbnRzKTtcbiAgICAgICAgICBpZiAoIXZhbGlkYXRvck9wdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgYXR0cmlidXRlOiBhdHRyLFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgdmFsaWRhdG9yOiB2YWxpZGF0b3JOYW1lLFxuICAgICAgICAgICAgZ2xvYmFsT3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMsXG4gICAgICAgICAgICBvcHRpb25zOiB2YWxpZGF0b3JPcHRpb25zLFxuICAgICAgICAgICAgZXJyb3I6IHZhbGlkYXRvci5jYWxsKHZhbGlkYXRvcixcbiAgICAgICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JPcHRpb25zLFxuICAgICAgICAgICAgICAgIGF0dHIsXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlcyxcbiAgICAgICAgICAgICAgICBvcHRpb25zKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0sXG5cbiAgICAvLyBUYWtlcyB0aGUgb3V0cHV0IGZyb20gcnVuVmFsaWRhdGlvbnMgYW5kIGNvbnZlcnRzIGl0IHRvIHRoZSBjb3JyZWN0XG4gICAgLy8gb3V0cHV0IGZvcm1hdC5cbiAgICBwcm9jZXNzVmFsaWRhdGlvblJlc3VsdHM6IGZ1bmN0aW9uKGVycm9ycywgb3B0aW9ucykge1xuICAgICAgZXJyb3JzID0gdi5wcnVuZUVtcHR5RXJyb3JzKGVycm9ycywgb3B0aW9ucyk7XG4gICAgICBlcnJvcnMgPSB2LmV4cGFuZE11bHRpcGxlRXJyb3JzKGVycm9ycywgb3B0aW9ucyk7XG4gICAgICBlcnJvcnMgPSB2LmNvbnZlcnRFcnJvck1lc3NhZ2VzKGVycm9ycywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBmb3JtYXQgPSBvcHRpb25zLmZvcm1hdCB8fCBcImdyb3VwZWRcIjtcblxuICAgICAgaWYgKHR5cGVvZiB2LmZvcm1hdHRlcnNbZm9ybWF0XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBlcnJvcnMgPSB2LmZvcm1hdHRlcnNbZm9ybWF0XShlcnJvcnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHYuZm9ybWF0KFwiVW5rbm93biBmb3JtYXQgJXtmb3JtYXR9XCIsIG9wdGlvbnMpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHYuaXNFbXB0eShlcnJvcnMpID8gdW5kZWZpbmVkIDogZXJyb3JzO1xuICAgIH0sXG5cbiAgICAvLyBSdW5zIHRoZSB2YWxpZGF0aW9ucyB3aXRoIHN1cHBvcnQgZm9yIHByb21pc2VzLlxuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCByZXR1cm4gYSBwcm9taXNlIHRoYXQgaXMgc2V0dGxlZCB3aGVuIGFsbCB0aGVcbiAgICAvLyB2YWxpZGF0aW9uIHByb21pc2VzIGhhdmUgYmVlbiBjb21wbGV0ZWQuXG4gICAgLy8gSXQgY2FuIGJlIGNhbGxlZCBldmVuIGlmIG5vIHZhbGlkYXRpb25zIHJldHVybmVkIGEgcHJvbWlzZS5cbiAgICBhc3luYzogZnVuY3Rpb24oYXR0cmlidXRlcywgY29uc3RyYWludHMsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB2LmV4dGVuZCh7fSwgdi5hc3luYy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgdmFyIFdyYXBFcnJvcnMgPSBvcHRpb25zLndyYXBFcnJvcnMgfHwgZnVuY3Rpb24oZXJyb3JzKSB7XG4gICAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgICB9O1xuXG4gICAgICAvLyBSZW1vdmVzIHVua25vd24gYXR0cmlidXRlc1xuICAgICAgaWYgKG9wdGlvbnMuY2xlYW5BdHRyaWJ1dGVzICE9PSBmYWxzZSkge1xuICAgICAgICBhdHRyaWJ1dGVzID0gdi5jbGVhbkF0dHJpYnV0ZXMoYXR0cmlidXRlcywgY29uc3RyYWludHMpO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmVzdWx0cyA9IHYucnVuVmFsaWRhdGlvbnMoYXR0cmlidXRlcywgY29uc3RyYWludHMsIG9wdGlvbnMpO1xuXG4gICAgICByZXR1cm4gbmV3IHYuUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdi53YWl0Rm9yUmVzdWx0cyhyZXN1bHRzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBlcnJvcnMgPSB2LnByb2Nlc3NWYWxpZGF0aW9uUmVzdWx0cyhyZXN1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgICBpZiAoZXJyb3JzKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IFdyYXBFcnJvcnMoZXJyb3JzLCBvcHRpb25zLCBhdHRyaWJ1dGVzLCBjb25zdHJhaW50cykpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlKGF0dHJpYnV0ZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNpbmdsZTogZnVuY3Rpb24odmFsdWUsIGNvbnN0cmFpbnRzLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHYuc2luZ2xlLm9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgZm9ybWF0OiBcImZsYXRcIixcbiAgICAgICAgZnVsbE1lc3NhZ2VzOiBmYWxzZVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdih7c2luZ2xlOiB2YWx1ZX0sIHtzaW5nbGU6IGNvbnN0cmFpbnRzfSwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8vIFJldHVybnMgYSBwcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiBhbGwgcHJvbWlzZXMgaW4gdGhlIHJlc3VsdHMgYXJyYXlcbiAgICAvLyBhcmUgc2V0dGxlZC4gVGhlIHByb21pc2UgcmV0dXJuZWQgZnJvbSB0aGlzIGZ1bmN0aW9uIGlzIGFsd2F5cyByZXNvbHZlZCxcbiAgICAvLyBuZXZlciByZWplY3RlZC5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIG1vZGlmaWVzIHRoZSBpbnB1dCBhcmd1bWVudCwgaXQgcmVwbGFjZXMgdGhlIHByb21pc2VzXG4gICAgLy8gd2l0aCB0aGUgdmFsdWUgcmV0dXJuZWQgZnJvbSB0aGUgcHJvbWlzZS5cbiAgICB3YWl0Rm9yUmVzdWx0czogZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgLy8gQ3JlYXRlIGEgc2VxdWVuY2Ugb2YgYWxsIHRoZSByZXN1bHRzIHN0YXJ0aW5nIHdpdGggYSByZXNvbHZlZCBwcm9taXNlLlxuICAgICAgcmV0dXJuIHJlc3VsdHMucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIHJlc3VsdCkge1xuICAgICAgICAvLyBJZiB0aGlzIHJlc3VsdCBpc24ndCBhIHByb21pc2Ugc2tpcCBpdCBpbiB0aGUgc2VxdWVuY2UuXG4gICAgICAgIGlmICghdi5pc1Byb21pc2UocmVzdWx0LmVycm9yKSkge1xuICAgICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1lbW8udGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0LmVycm9yLnRoZW4oZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgIHJlc3VsdC5lcnJvciA9IGVycm9yIHx8IG51bGw7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSwgbmV3IHYuUHJvbWlzZShmdW5jdGlvbihyKSB7IHIoKTsgfSkpOyAvLyBBIHJlc29sdmVkIHByb21pc2VcbiAgICB9LFxuXG4gICAgLy8gSWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgY2FsbDogZnVuY3Rpb24gdGhlIGFuZDogZnVuY3Rpb24gcmV0dXJuIHRoZSB2YWx1ZVxuICAgIC8vIG90aGVyd2lzZSBqdXN0IHJldHVybiB0aGUgdmFsdWUuIEFkZGl0aW9uYWwgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzXG4gICAgLy8gYXJndW1lbnRzIHRvIHRoZSBmdW5jdGlvbi5cbiAgICAvLyBFeGFtcGxlOlxuICAgIC8vIGBgYFxuICAgIC8vIHJlc3VsdCgnZm9vJykgLy8gJ2ZvbydcbiAgICAvLyByZXN1bHQoTWF0aC5tYXgsIDEsIDIpIC8vIDJcbiAgICAvLyBgYGBcbiAgICByZXN1bHQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBhIG51bWJlci4gVGhpcyBmdW5jdGlvbiBkb2VzIG5vdCBjb25zaWRlciBOYU4gYVxuICAgIC8vIG51bWJlciBsaWtlIG1hbnkgb3RoZXIgYGlzTnVtYmVyYCBmdW5jdGlvbnMgZG8uXG4gICAgaXNOdW1iZXI6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiAhaXNOYU4odmFsdWUpO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm5zIGZhbHNlIGlmIHRoZSBvYmplY3QgaXMgbm90IGEgZnVuY3Rpb25cbiAgICBpc0Z1bmN0aW9uOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9LFxuXG4gICAgLy8gQSBzaW1wbGUgY2hlY2sgdG8gdmVyaWZ5IHRoYXQgdGhlIHZhbHVlIGlzIGFuIGludGVnZXIuIFVzZXMgYGlzTnVtYmVyYFxuICAgIC8vIGFuZCBhIHNpbXBsZSBtb2R1bG8gY2hlY2suXG4gICAgaXNJbnRlZ2VyOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHYuaXNOdW1iZXIodmFsdWUpICYmIHZhbHVlICUgMSA9PT0gMDtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIGlmIHRoZSB2YWx1ZSBpcyBhIGJvb2xlYW5cbiAgICBpc0Jvb2xlYW46IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbic7XG4gICAgfSxcblxuICAgIC8vIFVzZXMgdGhlIGBPYmplY3RgIGZ1bmN0aW9uIHRvIGNoZWNrIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBvYmplY3QuXG4gICAgaXNPYmplY3Q6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gICAgfSxcblxuICAgIC8vIFNpbXBseSBjaGVja3MgaWYgdGhlIG9iamVjdCBpcyBhbiBpbnN0YW5jZSBvZiBhIGRhdGVcbiAgICBpc0RhdGU6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIERhdGU7XG4gICAgfSxcblxuICAgIC8vIFJldHVybnMgZmFsc2UgaWYgdGhlIG9iamVjdCBpcyBgbnVsbGAgb2YgYHVuZGVmaW5lZGBcbiAgICBpc0RlZmluZWQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAhPT0gbnVsbCAmJiBvYmogIT09IHVuZGVmaW5lZDtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIHByb21pc2UuIEFueXRoaW5nIHdpdGggYSBgdGhlbmBcbiAgICAvLyBmdW5jdGlvbiBpcyBjb25zaWRlcmVkIGEgcHJvbWlzZS5cbiAgICBpc1Byb21pc2U6IGZ1bmN0aW9uKHApIHtcbiAgICAgIHJldHVybiAhIXAgJiYgdi5pc0Z1bmN0aW9uKHAudGhlbik7XG4gICAgfSxcblxuICAgIGlzSnF1ZXJ5RWxlbWVudDogZnVuY3Rpb24obykge1xuICAgICAgcmV0dXJuIG8gJiYgdi5pc1N0cmluZyhvLmpxdWVyeSk7XG4gICAgfSxcblxuICAgIGlzRG9tRWxlbWVudDogZnVuY3Rpb24obykge1xuICAgICAgaWYgKCFvKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFvLnF1ZXJ5U2VsZWN0b3JBbGwgfHwgIW8ucXVlcnlTZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh2LmlzT2JqZWN0KGRvY3VtZW50KSAmJiBvID09PSBkb2N1bWVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzg0MzgwLzY5OTMwNFxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmICh0eXBlb2YgSFRNTEVsZW1lbnQgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIG8gaW5zdGFuY2VvZiBIVE1MRWxlbWVudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBvICYmXG4gICAgICAgICAgdHlwZW9mIG8gPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgICBvICE9PSBudWxsICYmXG4gICAgICAgICAgby5ub2RlVHlwZSA9PT0gMSAmJlxuICAgICAgICAgIHR5cGVvZiBvLm5vZGVOYW1lID09PSBcInN0cmluZ1wiO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBpc0VtcHR5OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdmFyIGF0dHI7XG5cbiAgICAgIC8vIE51bGwgYW5kIHVuZGVmaW5lZCBhcmUgZW1wdHlcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBmdW5jdGlvbnMgYXJlIG5vbiBlbXB0eVxuICAgICAgaWYgKHYuaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBXaGl0ZXNwYWNlIG9ubHkgc3RyaW5ncyBhcmUgZW1wdHlcbiAgICAgIGlmICh2LmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdi5FTVBUWV9TVFJJTkdfUkVHRVhQLnRlc3QodmFsdWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgYXJyYXlzIHdlIHVzZSB0aGUgbGVuZ3RoIHByb3BlcnR5XG4gICAgICBpZiAodi5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID09PSAwO1xuICAgICAgfVxuXG4gICAgICAvLyBEYXRlcyBoYXZlIG5vIGF0dHJpYnV0ZXMgYnV0IGFyZW4ndCBlbXB0eVxuICAgICAgaWYgKHYuaXNEYXRlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlIGZpbmQgYXQgbGVhc3Qgb25lIHByb3BlcnR5IHdlIGNvbnNpZGVyIGl0IG5vbiBlbXB0eVxuICAgICAgaWYgKHYuaXNPYmplY3QodmFsdWUpKSB7XG4gICAgICAgIGZvciAoYXR0ciBpbiB2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBGb3JtYXRzIHRoZSBzcGVjaWZpZWQgc3RyaW5ncyB3aXRoIHRoZSBnaXZlbiB2YWx1ZXMgbGlrZSBzbzpcbiAgICAvLyBgYGBcbiAgICAvLyBmb3JtYXQoXCJGb286ICV7Zm9vfVwiLCB7Zm9vOiBcImJhclwifSkgLy8gXCJGb28gYmFyXCJcbiAgICAvLyBgYGBcbiAgICAvLyBJZiB5b3Ugd2FudCB0byB3cml0ZSAley4uLn0gd2l0aG91dCBoYXZpbmcgaXQgcmVwbGFjZWQgc2ltcGx5XG4gICAgLy8gcHJlZml4IGl0IHdpdGggJSBsaWtlIHRoaXMgYEZvbzogJSV7Zm9vfWAgYW5kIGl0IHdpbGwgYmUgcmV0dXJuZWRcbiAgICAvLyBhcyBgXCJGb286ICV7Zm9vfVwiYFxuICAgIGZvcm1hdDogdi5leHRlbmQoZnVuY3Rpb24oc3RyLCB2YWxzKSB7XG4gICAgICBpZiAoIXYuaXNTdHJpbmcoc3RyKSkge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKHYuZm9ybWF0LkZPUk1BVF9SRUdFWFAsIGZ1bmN0aW9uKG0wLCBtMSwgbTIpIHtcbiAgICAgICAgaWYgKG0xID09PSAnJScpIHtcbiAgICAgICAgICByZXR1cm4gXCIle1wiICsgbTIgKyBcIn1cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHNbbTJdKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwge1xuICAgICAgLy8gRmluZHMgJXtrZXl9IHN0eWxlIHBhdHRlcm5zIGluIHRoZSBnaXZlbiBzdHJpbmdcbiAgICAgIEZPUk1BVF9SRUdFWFA6IC8oJT8pJVxceyhbXlxcfV0rKVxcfS9nXG4gICAgfSksXG5cbiAgICAvLyBcIlByZXR0aWZpZXNcIiB0aGUgZ2l2ZW4gc3RyaW5nLlxuICAgIC8vIFByZXR0aWZ5aW5nIG1lYW5zIHJlcGxhY2luZyBbLlxcXy1dIHdpdGggc3BhY2VzIGFzIHdlbGwgYXMgc3BsaXR0aW5nXG4gICAgLy8gY2FtZWwgY2FzZSB3b3Jkcy5cbiAgICBwcmV0dGlmeTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICBpZiAodi5pc051bWJlcihzdHIpKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBtb3JlIHRoYW4gMiBkZWNpbWFscyByb3VuZCBpdCB0byB0d29cbiAgICAgICAgaWYgKChzdHIgKiAxMDApICUgMSA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiBcIlwiICsgc3RyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KE1hdGgucm91bmQoc3RyICogMTAwKSAvIDEwMCkudG9GaXhlZCgyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodi5pc0FycmF5KHN0cikpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5tYXAoZnVuY3Rpb24ocykgeyByZXR1cm4gdi5wcmV0dGlmeShzKTsgfSkuam9pbihcIiwgXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAodi5pc09iamVjdChzdHIpKSB7XG4gICAgICAgIGlmICghdi5pc0RlZmluZWQoc3RyLnRvU3RyaW5nKSkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShzdHIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0ci50b1N0cmluZygpO1xuICAgICAgfVxuXG4gICAgICAvLyBFbnN1cmUgdGhlIHN0cmluZyBpcyBhY3R1YWxseSBhIHN0cmluZ1xuICAgICAgc3RyID0gXCJcIiArIHN0cjtcblxuICAgICAgcmV0dXJuIHN0clxuICAgICAgICAvLyBTcGxpdHMga2V5cyBzZXBhcmF0ZWQgYnkgcGVyaW9kc1xuICAgICAgICAucmVwbGFjZSgvKFteXFxzXSlcXC4oW15cXHNdKS9nLCAnJDEgJDInKVxuICAgICAgICAvLyBSZW1vdmVzIGJhY2tzbGFzaGVzXG4gICAgICAgIC5yZXBsYWNlKC9cXFxcKy9nLCAnJylcbiAgICAgICAgLy8gUmVwbGFjZXMgLSBhbmQgLSB3aXRoIHNwYWNlXG4gICAgICAgIC5yZXBsYWNlKC9bXy1dL2csICcgJylcbiAgICAgICAgLy8gU3BsaXRzIGNhbWVsIGNhc2VkIHdvcmRzXG4gICAgICAgIC5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCBmdW5jdGlvbihtMCwgbTEsIG0yKSB7XG4gICAgICAgICAgcmV0dXJuIFwiXCIgKyBtMSArIFwiIFwiICsgbTIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRvTG93ZXJDYXNlKCk7XG4gICAgfSxcblxuICAgIHN0cmluZ2lmeVZhbHVlOiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgdmFyIHByZXR0aWZ5ID0gb3B0aW9ucyAmJiBvcHRpb25zLnByZXR0aWZ5IHx8IHYucHJldHRpZnk7XG4gICAgICByZXR1cm4gcHJldHRpZnkodmFsdWUpO1xuICAgIH0sXG5cbiAgICBpc1N0cmluZzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xuICAgIH0sXG5cbiAgICBpc0FycmF5OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHt9LnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH0sXG5cbiAgICAvLyBDaGVja3MgaWYgdGhlIG9iamVjdCBpcyBhIGhhc2gsIHdoaWNoIGlzIGVxdWl2YWxlbnQgdG8gYW4gb2JqZWN0IHRoYXRcbiAgICAvLyBpcyBuZWl0aGVyIGFuIGFycmF5IG5vciBhIGZ1bmN0aW9uLlxuICAgIGlzSGFzaDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB2LmlzT2JqZWN0KHZhbHVlKSAmJiAhdi5pc0FycmF5KHZhbHVlKSAmJiAhdi5pc0Z1bmN0aW9uKHZhbHVlKTtcbiAgICB9LFxuXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKG9iaiwgdmFsdWUpIHtcbiAgICAgIGlmICghdi5pc0RlZmluZWQob2JqKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodi5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIG9iai5pbmRleE9mKHZhbHVlKSAhPT0gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWUgaW4gb2JqO1xuICAgIH0sXG5cbiAgICB1bmlxdWU6IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgICBpZiAoIXYuaXNBcnJheShhcnJheSkpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFycmF5LmZpbHRlcihmdW5jdGlvbihlbCwgaW5kZXgsIGFycmF5KSB7XG4gICAgICAgIHJldHVybiBhcnJheS5pbmRleE9mKGVsKSA9PSBpbmRleDtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBmb3JFYWNoS2V5SW5LZXlwYXRoOiBmdW5jdGlvbihvYmplY3QsIGtleXBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICBpZiAoIXYuaXNTdHJpbmcoa2V5cGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgdmFyIGtleSA9IFwiXCJcbiAgICAgICAgLCBpXG4gICAgICAgICwgZXNjYXBlID0gZmFsc2U7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlwYXRoLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHN3aXRjaCAoa2V5cGF0aFtpXSkge1xuICAgICAgICAgIGNhc2UgJy4nOlxuICAgICAgICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICAgICAgICBlc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAga2V5ICs9ICcuJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG9iamVjdCA9IGNhbGxiYWNrKG9iamVjdCwga2V5LCBmYWxzZSk7XG4gICAgICAgICAgICAgIGtleSA9IFwiXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ1xcXFwnOlxuICAgICAgICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICAgICAgICBlc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAga2V5ICs9ICdcXFxcJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVzY2FwZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBlc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGtleSArPSBrZXlwYXRoW2ldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKG9iamVjdCwga2V5LCB0cnVlKTtcbiAgICB9LFxuXG4gICAgZ2V0RGVlcE9iamVjdFZhbHVlOiBmdW5jdGlvbihvYmosIGtleXBhdGgpIHtcbiAgICAgIGlmICghdi5pc09iamVjdChvYmopKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2LmZvckVhY2hLZXlJbktleXBhdGgob2JqLCBrZXlwYXRoLCBmdW5jdGlvbihvYmosIGtleSkge1xuICAgICAgICBpZiAodi5pc09iamVjdChvYmopKSB7XG4gICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gVGhpcyByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGFsbCB0aGUgdmFsdWVzIG9mIHRoZSBmb3JtLlxuICAgIC8vIEl0IHVzZXMgdGhlIGlucHV0IG5hbWUgYXMga2V5IGFuZCB0aGUgdmFsdWUgYXMgdmFsdWVcbiAgICAvLyBTbyBmb3IgZXhhbXBsZSB0aGlzOlxuICAgIC8vIDxpbnB1dCB0eXBlPVwidGV4dFwiIG5hbWU9XCJlbWFpbFwiIHZhbHVlPVwiZm9vQGJhci5jb21cIiAvPlxuICAgIC8vIHdvdWxkIHJldHVybjpcbiAgICAvLyB7ZW1haWw6IFwiZm9vQGJhci5jb21cIn1cbiAgICBjb2xsZWN0Rm9ybVZhbHVlczogZnVuY3Rpb24oZm9ybSwgb3B0aW9ucykge1xuICAgICAgdmFyIHZhbHVlcyA9IHt9XG4gICAgICAgICwgaVxuICAgICAgICAsIGpcbiAgICAgICAgLCBpbnB1dFxuICAgICAgICAsIGlucHV0c1xuICAgICAgICAsIG9wdGlvblxuICAgICAgICAsIHZhbHVlO1xuXG4gICAgICBpZiAodi5pc0pxdWVyeUVsZW1lbnQoZm9ybSkpIHtcbiAgICAgICAgZm9ybSA9IGZvcm1bMF07XG4gICAgICB9XG5cbiAgICAgIGlmICghZm9ybSkge1xuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgaW5wdXRzID0gZm9ybS5xdWVyeVNlbGVjdG9yQWxsKFwiaW5wdXRbbmFtZV0sIHRleHRhcmVhW25hbWVdXCIpO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpbnB1dCA9IGlucHV0cy5pdGVtKGkpO1xuXG4gICAgICAgIGlmICh2LmlzRGVmaW5lZChpbnB1dC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWlnbm9yZWRcIikpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbmFtZSA9IGlucHV0Lm5hbWUucmVwbGFjZSgvXFwuL2csIFwiXFxcXFxcXFwuXCIpO1xuICAgICAgICB2YWx1ZSA9IHYuc2FuaXRpemVGb3JtVmFsdWUoaW5wdXQudmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgIHZhbHVlID0gdmFsdWUgPyArdmFsdWUgOiBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0LnR5cGUgPT09IFwiY2hlY2tib3hcIikge1xuICAgICAgICAgIGlmIChpbnB1dC5hdHRyaWJ1dGVzLnZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoIWlucHV0LmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZXNbbmFtZV0gfHwgbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSBpbnB1dC5jaGVja2VkO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC50eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICAgICAgICBpZiAoIWlucHV0LmNoZWNrZWQpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWVzW25hbWVdIHx8IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICBpbnB1dHMgPSBmb3JtLnF1ZXJ5U2VsZWN0b3JBbGwoXCJzZWxlY3RbbmFtZV1cIik7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlucHV0ID0gaW5wdXRzLml0ZW0oaSk7XG4gICAgICAgIGlmICh2LmlzRGVmaW5lZChpbnB1dC5nZXRBdHRyaWJ1dGUoXCJkYXRhLWlnbm9yZWRcIikpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5wdXQubXVsdGlwbGUpIHtcbiAgICAgICAgICB2YWx1ZSA9IFtdO1xuICAgICAgICAgIGZvciAoaiBpbiBpbnB1dC5vcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb24gPSBpbnB1dC5vcHRpb25zW2pdO1xuICAgICAgICAgICAgIGlmIChvcHRpb24gJiYgb3B0aW9uLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgIHZhbHVlLnB1c2godi5zYW5pdGl6ZUZvcm1WYWx1ZShvcHRpb24udmFsdWUsIG9wdGlvbnMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIF92YWwgPSB0eXBlb2YgaW5wdXQub3B0aW9uc1tpbnB1dC5zZWxlY3RlZEluZGV4XSAhPT0gJ3VuZGVmaW5lZCcgPyBpbnB1dC5vcHRpb25zW2lucHV0LnNlbGVjdGVkSW5kZXhdLnZhbHVlIDogLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gJyc7XG4gICAgICAgICAgdmFsdWUgPSB2LnNhbml0aXplRm9ybVZhbHVlKF92YWwsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlc1tpbnB1dC5uYW1lXSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH0sXG5cbiAgICBzYW5pdGl6ZUZvcm1WYWx1ZTogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChvcHRpb25zLnRyaW0gJiYgdi5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50cmltKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLm51bGxpZnkgIT09IGZhbHNlICYmIHZhbHVlID09PSBcIlwiKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG5cbiAgICBjYXBpdGFsaXplOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgIGlmICghdi5pc1N0cmluZyhzdHIpKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyWzBdLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG4gICAgfSxcblxuICAgIC8vIFJlbW92ZSBhbGwgZXJyb3JzIHdobydzIGVycm9yIGF0dHJpYnV0ZSBpcyBlbXB0eSAobnVsbCBvciB1bmRlZmluZWQpXG4gICAgcHJ1bmVFbXB0eUVycm9yczogZnVuY3Rpb24oZXJyb3JzKSB7XG4gICAgICByZXR1cm4gZXJyb3JzLmZpbHRlcihmdW5jdGlvbihlcnJvcikge1xuICAgICAgICByZXR1cm4gIXYuaXNFbXB0eShlcnJvci5lcnJvcik7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gSW5cbiAgICAvLyBbe2Vycm9yOiBbXCJlcnIxXCIsIFwiZXJyMlwiXSwgLi4ufV1cbiAgICAvLyBPdXRcbiAgICAvLyBbe2Vycm9yOiBcImVycjFcIiwgLi4ufSwge2Vycm9yOiBcImVycjJcIiwgLi4ufV1cbiAgICAvL1xuICAgIC8vIEFsbCBhdHRyaWJ1dGVzIGluIGFuIGVycm9yIHdpdGggbXVsdGlwbGUgbWVzc2FnZXMgYXJlIGR1cGxpY2F0ZWRcbiAgICAvLyB3aGVuIGV4cGFuZGluZyB0aGUgZXJyb3JzLlxuICAgIGV4cGFuZE11bHRpcGxlRXJyb3JzOiBmdW5jdGlvbihlcnJvcnMpIHtcbiAgICAgIHZhciByZXQgPSBbXTtcbiAgICAgIGVycm9ycy5mb3JFYWNoKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIC8vIFJlbW92ZXMgZXJyb3JzIHdpdGhvdXQgYSBtZXNzYWdlXG4gICAgICAgIGlmICh2LmlzQXJyYXkoZXJyb3IuZXJyb3IpKSB7XG4gICAgICAgICAgZXJyb3IuZXJyb3IuZm9yRWFjaChmdW5jdGlvbihtc2cpIHtcbiAgICAgICAgICAgIHJldC5wdXNoKHYuZXh0ZW5kKHt9LCBlcnJvciwge2Vycm9yOiBtc2d9KSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0LnB1c2goZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXQ7XG4gICAgfSxcblxuICAgIC8vIENvbnZlcnRzIHRoZSBlcnJvciBtZXNhZ2VzIGJ5IHByZXBlbmRpbmcgdGhlIGF0dHJpYnV0ZSBuYW1lIHVubGVzcyB0aGVcbiAgICAvLyBtZXNzYWdlIGlzIHByZWZpeGVkIGJ5IF5cbiAgICBjb252ZXJ0RXJyb3JNZXNzYWdlczogZnVuY3Rpb24oZXJyb3JzLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgdmFyIHJldCA9IFtdXG4gICAgICAgICwgcHJldHRpZnkgPSBvcHRpb25zLnByZXR0aWZ5IHx8IHYucHJldHRpZnk7XG4gICAgICBlcnJvcnMuZm9yRWFjaChmdW5jdGlvbihlcnJvckluZm8pIHtcbiAgICAgICAgdmFyIGVycm9yID0gdi5yZXN1bHQoZXJyb3JJbmZvLmVycm9yLFxuICAgICAgICAgICAgZXJyb3JJbmZvLnZhbHVlLFxuICAgICAgICAgICAgZXJyb3JJbmZvLmF0dHJpYnV0ZSxcbiAgICAgICAgICAgIGVycm9ySW5mby5vcHRpb25zLFxuICAgICAgICAgICAgZXJyb3JJbmZvLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgICBlcnJvckluZm8uZ2xvYmFsT3B0aW9ucyk7XG5cbiAgICAgICAgaWYgKCF2LmlzU3RyaW5nKGVycm9yKSkge1xuICAgICAgICAgIHJldC5wdXNoKGVycm9ySW5mbyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVycm9yWzBdID09PSAnXicpIHtcbiAgICAgICAgICBlcnJvciA9IGVycm9yLnNsaWNlKDEpO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZnVsbE1lc3NhZ2VzICE9PSBmYWxzZSkge1xuICAgICAgICAgIGVycm9yID0gdi5jYXBpdGFsaXplKHByZXR0aWZ5KGVycm9ySW5mby5hdHRyaWJ1dGUpKSArIFwiIFwiICsgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IgPSBlcnJvci5yZXBsYWNlKC9cXFxcXFxeL2csIFwiXlwiKTtcbiAgICAgICAgZXJyb3IgPSB2LmZvcm1hdChlcnJvciwge1xuICAgICAgICAgIHZhbHVlOiB2LnN0cmluZ2lmeVZhbHVlKGVycm9ySW5mby52YWx1ZSwgb3B0aW9ucylcbiAgICAgICAgfSk7XG4gICAgICAgIHJldC5wdXNoKHYuZXh0ZW5kKHt9LCBlcnJvckluZm8sIHtlcnJvcjogZXJyb3J9KSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXQ7XG4gICAgfSxcblxuICAgIC8vIEluOlxuICAgIC8vIFt7YXR0cmlidXRlOiBcIjxhdHRyaWJ1dGVOYW1lPlwiLCAuLi59XVxuICAgIC8vIE91dDpcbiAgICAvLyB7XCI8YXR0cmlidXRlTmFtZT5cIjogW3thdHRyaWJ1dGU6IFwiPGF0dHJpYnV0ZU5hbWU+XCIsIC4uLn1dfVxuICAgIGdyb3VwRXJyb3JzQnlBdHRyaWJ1dGU6IGZ1bmN0aW9uKGVycm9ycykge1xuICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgZXJyb3JzLmZvckVhY2goZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgdmFyIGxpc3QgPSByZXRbZXJyb3IuYXR0cmlidXRlXTtcbiAgICAgICAgaWYgKGxpc3QpIHtcbiAgICAgICAgICBsaXN0LnB1c2goZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldFtlcnJvci5hdHRyaWJ1dGVdID0gW2Vycm9yXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG5cbiAgICAvLyBJbjpcbiAgICAvLyBbe2Vycm9yOiBcIjxtZXNzYWdlIDE+XCIsIC4uLn0sIHtlcnJvcjogXCI8bWVzc2FnZSAyPlwiLCAuLi59XVxuICAgIC8vIE91dDpcbiAgICAvLyBbXCI8bWVzc2FnZSAxPlwiLCBcIjxtZXNzYWdlIDI+XCJdXG4gICAgZmxhdHRlbkVycm9yc1RvQXJyYXk6IGZ1bmN0aW9uKGVycm9ycykge1xuICAgICAgcmV0dXJuIGVycm9yc1xuICAgICAgICAubWFwKGZ1bmN0aW9uKGVycm9yKSB7IHJldHVybiBlcnJvci5lcnJvcjsgfSlcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIHNlbGYpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXg7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjbGVhbkF0dHJpYnV0ZXM6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMsIHdoaXRlbGlzdCkge1xuICAgICAgZnVuY3Rpb24gd2hpdGVsaXN0Q3JlYXRvcihvYmosIGtleSwgbGFzdCkge1xuICAgICAgICBpZiAodi5pc09iamVjdChvYmpba2V5XSkpIHtcbiAgICAgICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChvYmpba2V5XSA9IGxhc3QgPyB0cnVlIDoge30pO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBidWlsZE9iamVjdFdoaXRlbGlzdCh3aGl0ZWxpc3QpIHtcbiAgICAgICAgdmFyIG93ID0ge31cbiAgICAgICAgICAsIGxhc3RPYmplY3RcbiAgICAgICAgICAsIGF0dHI7XG4gICAgICAgIGZvciAoYXR0ciBpbiB3aGl0ZWxpc3QpIHtcbiAgICAgICAgICBpZiAoIXdoaXRlbGlzdFthdHRyXSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHYuZm9yRWFjaEtleUluS2V5cGF0aChvdywgYXR0ciwgd2hpdGVsaXN0Q3JlYXRvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG93O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjbGVhblJlY3Vyc2l2ZShhdHRyaWJ1dGVzLCB3aGl0ZWxpc3QpIHtcbiAgICAgICAgaWYgKCF2LmlzT2JqZWN0KGF0dHJpYnV0ZXMpKSB7XG4gICAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmV0ID0gdi5leHRlbmQoe30sIGF0dHJpYnV0ZXMpXG4gICAgICAgICAgLCB3XG4gICAgICAgICAgLCBhdHRyaWJ1dGU7XG5cbiAgICAgICAgZm9yIChhdHRyaWJ1dGUgaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgIHcgPSB3aGl0ZWxpc3RbYXR0cmlidXRlXTtcblxuICAgICAgICAgIGlmICh2LmlzT2JqZWN0KHcpKSB7XG4gICAgICAgICAgICByZXRbYXR0cmlidXRlXSA9IGNsZWFuUmVjdXJzaXZlKHJldFthdHRyaWJ1dGVdLCB3KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCF3KSB7XG4gICAgICAgICAgICBkZWxldGUgcmV0W2F0dHJpYnV0ZV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG5cbiAgICAgIGlmICghdi5pc09iamVjdCh3aGl0ZWxpc3QpIHx8ICF2LmlzT2JqZWN0KGF0dHJpYnV0ZXMpKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cblxuICAgICAgd2hpdGVsaXN0ID0gYnVpbGRPYmplY3RXaGl0ZWxpc3Qod2hpdGVsaXN0KTtcbiAgICAgIHJldHVybiBjbGVhblJlY3Vyc2l2ZShhdHRyaWJ1dGVzLCB3aGl0ZWxpc3QpO1xuICAgIH0sXG5cbiAgICBleHBvc2VNb2R1bGU6IGZ1bmN0aW9uKHZhbGlkYXRlLCByb290LCBleHBvcnRzLCBtb2R1bGUsIGRlZmluZSkge1xuICAgICAgaWYgKGV4cG9ydHMpIHtcbiAgICAgICAgaWYgKG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHZhbGlkYXRlO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMudmFsaWRhdGUgPSB2YWxpZGF0ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QudmFsaWRhdGUgPSB2YWxpZGF0ZTtcbiAgICAgICAgaWYgKHZhbGlkYXRlLmlzRnVuY3Rpb24oZGVmaW5lKSAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7IHJldHVybiB2YWxpZGF0ZTsgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgd2FybjogZnVuY3Rpb24obXNnKSB7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlt2YWxpZGF0ZS5qc10gXCIgKyBtc2cpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBlcnJvcjogZnVuY3Rpb24obXNnKSB7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZS5lcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiW3ZhbGlkYXRlLmpzXSBcIiArIG1zZyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICB2YWxpZGF0ZS52YWxpZGF0b3JzID0ge1xuICAgIC8vIFByZXNlbmNlIHZhbGlkYXRlcyB0aGF0IHRoZSB2YWx1ZSBpc24ndCBlbXB0eVxuICAgIHByZXNlbmNlOiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgaWYgKG9wdGlvbnMuYWxsb3dFbXB0eSAhPT0gZmFsc2UgPyAhdi5pc0RlZmluZWQodmFsdWUpIDogdi5pc0VtcHR5KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8IHRoaXMubWVzc2FnZSB8fCBcImNhbid0IGJlIGJsYW5rXCI7XG4gICAgICB9XG4gICAgfSxcbiAgICBsZW5ndGg6IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zLCBhdHRyaWJ1dGUpIHtcbiAgICAgIC8vIEVtcHR5IHZhbHVlcyBhcmUgYWxsb3dlZFxuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBpcyA9IG9wdGlvbnMuaXNcbiAgICAgICAgLCBtYXhpbXVtID0gb3B0aW9ucy5tYXhpbXVtXG4gICAgICAgICwgbWluaW11bSA9IG9wdGlvbnMubWluaW11bVxuICAgICAgICAsIHRva2VuaXplciA9IG9wdGlvbnMudG9rZW5pemVyIHx8IGZ1bmN0aW9uKHZhbCkgeyByZXR1cm4gdmFsOyB9XG4gICAgICAgICwgZXJyXG4gICAgICAgICwgZXJyb3JzID0gW107XG5cbiAgICAgIHZhbHVlID0gdG9rZW5pemVyKHZhbHVlKTtcbiAgICAgIHZhciBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgICBpZighdi5pc051bWJlcihsZW5ndGgpKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLm1lc3NhZ2UgfHwgdGhpcy5ub3RWYWxpZCB8fCBcImhhcyBhbiBpbmNvcnJlY3QgbGVuZ3RoXCI7XG4gICAgICB9XG5cbiAgICAgIC8vIElzIGNoZWNrc1xuICAgICAgaWYgKHYuaXNOdW1iZXIoaXMpICYmIGxlbmd0aCAhPT0gaXMpIHtcbiAgICAgICAgZXJyID0gb3B0aW9ucy53cm9uZ0xlbmd0aCB8fFxuICAgICAgICAgIHRoaXMud3JvbmdMZW5ndGggfHxcbiAgICAgICAgICBcImlzIHRoZSB3cm9uZyBsZW5ndGggKHNob3VsZCBiZSAle2NvdW50fSBjaGFyYWN0ZXJzKVwiO1xuICAgICAgICBlcnJvcnMucHVzaCh2LmZvcm1hdChlcnIsIHtjb3VudDogaXN9KSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh2LmlzTnVtYmVyKG1pbmltdW0pICYmIGxlbmd0aCA8IG1pbmltdW0pIHtcbiAgICAgICAgZXJyID0gb3B0aW9ucy50b29TaG9ydCB8fFxuICAgICAgICAgIHRoaXMudG9vU2hvcnQgfHxcbiAgICAgICAgICBcImlzIHRvbyBzaG9ydCAobWluaW11bSBpcyAle2NvdW50fSBjaGFyYWN0ZXJzKVwiO1xuICAgICAgICBlcnJvcnMucHVzaCh2LmZvcm1hdChlcnIsIHtjb3VudDogbWluaW11bX0pKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHYuaXNOdW1iZXIobWF4aW11bSkgJiYgbGVuZ3RoID4gbWF4aW11bSkge1xuICAgICAgICBlcnIgPSBvcHRpb25zLnRvb0xvbmcgfHxcbiAgICAgICAgICB0aGlzLnRvb0xvbmcgfHxcbiAgICAgICAgICBcImlzIHRvbyBsb25nIChtYXhpbXVtIGlzICV7Y291bnR9IGNoYXJhY3RlcnMpXCI7XG4gICAgICAgIGVycm9ycy5wdXNoKHYuZm9ybWF0KGVyciwge2NvdW50OiBtYXhpbXVtfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubWVzc2FnZSB8fCBlcnJvcnM7XG4gICAgICB9XG4gICAgfSxcbiAgICBudW1lcmljYWxpdHk6IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zLCBhdHRyaWJ1dGUsIGF0dHJpYnV0ZXMsIGdsb2JhbE9wdGlvbnMpIHtcbiAgICAgIC8vIEVtcHR5IHZhbHVlcyBhcmUgZmluZVxuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBlcnJvcnMgPSBbXVxuICAgICAgICAsIG5hbWVcbiAgICAgICAgLCBjb3VudFxuICAgICAgICAsIGNoZWNrcyA9IHtcbiAgICAgICAgICAgIGdyZWF0ZXJUaGFuOiAgICAgICAgICBmdW5jdGlvbih2LCBjKSB7IHJldHVybiB2ID4gYzsgfSxcbiAgICAgICAgICAgIGdyZWF0ZXJUaGFuT3JFcXVhbFRvOiBmdW5jdGlvbih2LCBjKSB7IHJldHVybiB2ID49IGM7IH0sXG4gICAgICAgICAgICBlcXVhbFRvOiAgICAgICAgICAgICAgZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA9PT0gYzsgfSxcbiAgICAgICAgICAgIGxlc3NUaGFuOiAgICAgICAgICAgICBmdW5jdGlvbih2LCBjKSB7IHJldHVybiB2IDwgYzsgfSxcbiAgICAgICAgICAgIGxlc3NUaGFuT3JFcXVhbFRvOiAgICBmdW5jdGlvbih2LCBjKSB7IHJldHVybiB2IDw9IGM7IH0sXG4gICAgICAgICAgICBkaXZpc2libGVCeTogICAgICAgICAgZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiAlIGMgPT09IDA7IH1cbiAgICAgICAgICB9XG4gICAgICAgICwgcHJldHRpZnkgPSBvcHRpb25zLnByZXR0aWZ5IHx8XG4gICAgICAgICAgKGdsb2JhbE9wdGlvbnMgJiYgZ2xvYmFsT3B0aW9ucy5wcmV0dGlmeSkgfHxcbiAgICAgICAgICB2LnByZXR0aWZ5O1xuXG4gICAgICAvLyBTdHJpY3Qgd2lsbCBjaGVjayB0aGF0IGl0IGlzIGEgdmFsaWQgbG9va2luZyBudW1iZXJcbiAgICAgIGlmICh2LmlzU3RyaW5nKHZhbHVlKSAmJiBvcHRpb25zLnN0cmljdCkge1xuICAgICAgICB2YXIgcGF0dGVybiA9IFwiXi0/KDB8WzEtOV1cXFxcZCopXCI7XG4gICAgICAgIGlmICghb3B0aW9ucy5vbmx5SW50ZWdlcikge1xuICAgICAgICAgIHBhdHRlcm4gKz0gXCIoXFxcXC5cXFxcZCspP1wiO1xuICAgICAgICB9XG4gICAgICAgIHBhdHRlcm4gKz0gXCIkXCI7XG5cbiAgICAgICAgaWYgKCEobmV3IFJlZ0V4cChwYXR0ZXJuKS50ZXN0KHZhbHVlKSkpIHtcbiAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgICAgICBvcHRpb25zLm5vdFZhbGlkIHx8XG4gICAgICAgICAgICB0aGlzLm5vdFZhbGlkIHx8XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgfHxcbiAgICAgICAgICAgIFwibXVzdCBiZSBhIHZhbGlkIG51bWJlclwiO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENvZXJjZSB0aGUgdmFsdWUgdG8gYSBudW1iZXIgdW5sZXNzIHdlJ3JlIGJlaW5nIHN0cmljdC5cbiAgICAgIGlmIChvcHRpb25zLm5vU3RyaW5ncyAhPT0gdHJ1ZSAmJiB2LmlzU3RyaW5nKHZhbHVlKSAmJiAhdi5pc0VtcHR5KHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9ICt2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIgd2Ugc2hvdWxkbid0IGNvbnRpbnVlIHNpbmNlIGl0IHdpbGwgY29tcGFyZSBpdC5cbiAgICAgIGlmICghdi5pc051bWJlcih2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubWVzc2FnZSB8fFxuICAgICAgICAgIG9wdGlvbnMubm90VmFsaWQgfHxcbiAgICAgICAgICB0aGlzLm5vdFZhbGlkIHx8XG4gICAgICAgICAgdGhpcy5tZXNzYWdlIHx8XG4gICAgICAgICAgXCJpcyBub3QgYSBudW1iZXJcIjtcbiAgICAgIH1cblxuICAgICAgLy8gU2FtZSBsb2dpYyBhcyBhYm92ZSwgc29ydCBvZi4gRG9uJ3QgYm90aGVyIHdpdGggY29tcGFyaXNvbnMgaWYgdGhpc1xuICAgICAgLy8gZG9lc24ndCBwYXNzLlxuICAgICAgaWYgKG9wdGlvbnMub25seUludGVnZXIgJiYgIXYuaXNJbnRlZ2VyKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgICAgb3B0aW9ucy5ub3RJbnRlZ2VyIHx8XG4gICAgICAgICAgdGhpcy5ub3RJbnRlZ2VyIHx8XG4gICAgICAgICAgdGhpcy5tZXNzYWdlIHx8XG4gICAgICAgICAgXCJtdXN0IGJlIGFuIGludGVnZXJcIjtcbiAgICAgIH1cblxuICAgICAgZm9yIChuYW1lIGluIGNoZWNrcykge1xuICAgICAgICBjb3VudCA9IG9wdGlvbnNbbmFtZV07XG4gICAgICAgIGlmICh2LmlzTnVtYmVyKGNvdW50KSAmJiAhY2hlY2tzW25hbWVdKHZhbHVlLCBjb3VudCkpIHtcbiAgICAgICAgICAvLyBUaGlzIHBpY2tzIHRoZSBkZWZhdWx0IG1lc3NhZ2UgaWYgc3BlY2lmaWVkXG4gICAgICAgICAgLy8gRm9yIGV4YW1wbGUgdGhlIGdyZWF0ZXJUaGFuIGNoZWNrIHVzZXMgdGhlIG1lc3NhZ2UgZnJvbVxuICAgICAgICAgIC8vIHRoaXMubm90R3JlYXRlclRoYW4gc28gd2UgY2FwaXRhbGl6ZSB0aGUgbmFtZSBhbmQgcHJlcGVuZCBcIm5vdFwiXG4gICAgICAgICAgdmFyIGtleSA9IFwibm90XCIgKyB2LmNhcGl0YWxpemUobmFtZSk7XG4gICAgICAgICAgdmFyIG1zZyA9IG9wdGlvbnNba2V5XSB8fFxuICAgICAgICAgICAgdGhpc1trZXldIHx8XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgfHxcbiAgICAgICAgICAgIFwibXVzdCBiZSAle3R5cGV9ICV7Y291bnR9XCI7XG5cbiAgICAgICAgICBlcnJvcnMucHVzaCh2LmZvcm1hdChtc2csIHtcbiAgICAgICAgICAgIGNvdW50OiBjb3VudCxcbiAgICAgICAgICAgIHR5cGU6IHByZXR0aWZ5KG5hbWUpXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLm9kZCAmJiB2YWx1ZSAlIDIgIT09IDEpIHtcbiAgICAgICAgZXJyb3JzLnB1c2gob3B0aW9ucy5ub3RPZGQgfHxcbiAgICAgICAgICAgIHRoaXMubm90T2RkIHx8XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgfHxcbiAgICAgICAgICAgIFwibXVzdCBiZSBvZGRcIik7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy5ldmVuICYmIHZhbHVlICUgMiAhPT0gMCkge1xuICAgICAgICBlcnJvcnMucHVzaChvcHRpb25zLm5vdEV2ZW4gfHxcbiAgICAgICAgICAgIHRoaXMubm90RXZlbiB8fFxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlIHx8XG4gICAgICAgICAgICBcIm11c3QgYmUgZXZlblwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubWVzc2FnZSB8fCBlcnJvcnM7XG4gICAgICB9XG4gICAgfSxcbiAgICBkYXRldGltZTogdi5leHRlbmQoZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIGlmICghdi5pc0Z1bmN0aW9uKHRoaXMucGFyc2UpIHx8ICF2LmlzRnVuY3Rpb24odGhpcy5mb3JtYXQpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJvdGggdGhlIHBhcnNlIGFuZCBmb3JtYXQgZnVuY3Rpb25zIG5lZWRzIHRvIGJlIHNldCB0byB1c2UgdGhlIGRhdGV0aW1lL2RhdGUgdmFsaWRhdG9yXCIpO1xuICAgICAgfVxuXG4gICAgICAvLyBFbXB0eSB2YWx1ZXMgYXJlIGZpbmVcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgZXJyXG4gICAgICAgICwgZXJyb3JzID0gW11cbiAgICAgICAgLCBlYXJsaWVzdCA9IG9wdGlvbnMuZWFybGllc3QgPyB0aGlzLnBhcnNlKG9wdGlvbnMuZWFybGllc3QsIG9wdGlvbnMpIDogTmFOXG4gICAgICAgICwgbGF0ZXN0ID0gb3B0aW9ucy5sYXRlc3QgPyB0aGlzLnBhcnNlKG9wdGlvbnMubGF0ZXN0LCBvcHRpb25zKSA6IE5hTjtcblxuICAgICAgdmFsdWUgPSB0aGlzLnBhcnNlKHZhbHVlLCBvcHRpb25zKTtcblxuICAgICAgLy8gODY0MDAwMDAgaXMgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaW4gYSBkYXksIHRoaXMgaXMgdXNlZCB0byByZW1vdmVcbiAgICAgIC8vIHRoZSB0aW1lIGZyb20gdGhlIGRhdGVcbiAgICAgIGlmIChpc05hTih2YWx1ZSkgfHwgb3B0aW9ucy5kYXRlT25seSAmJiB2YWx1ZSAlIDg2NDAwMDAwICE9PSAwKSB7XG4gICAgICAgIGVyciA9IG9wdGlvbnMubm90VmFsaWQgfHxcbiAgICAgICAgICBvcHRpb25zLm1lc3NhZ2UgfHxcbiAgICAgICAgICB0aGlzLm5vdFZhbGlkIHx8XG4gICAgICAgICAgXCJtdXN0IGJlIGEgdmFsaWQgZGF0ZVwiO1xuICAgICAgICByZXR1cm4gdi5mb3JtYXQoZXJyLCB7dmFsdWU6IGFyZ3VtZW50c1swXX0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWlzTmFOKGVhcmxpZXN0KSAmJiB2YWx1ZSA8IGVhcmxpZXN0KSB7XG4gICAgICAgIGVyciA9IG9wdGlvbnMudG9vRWFybHkgfHxcbiAgICAgICAgICBvcHRpb25zLm1lc3NhZ2UgfHxcbiAgICAgICAgICB0aGlzLnRvb0Vhcmx5IHx8XG4gICAgICAgICAgXCJtdXN0IGJlIG5vIGVhcmxpZXIgdGhhbiAle2RhdGV9XCI7XG4gICAgICAgIGVyciA9IHYuZm9ybWF0KGVyciwge1xuICAgICAgICAgIHZhbHVlOiB0aGlzLmZvcm1hdCh2YWx1ZSwgb3B0aW9ucyksXG4gICAgICAgICAgZGF0ZTogdGhpcy5mb3JtYXQoZWFybGllc3QsIG9wdGlvbnMpXG4gICAgICAgIH0pO1xuICAgICAgICBlcnJvcnMucHVzaChlcnIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWlzTmFOKGxhdGVzdCkgJiYgdmFsdWUgPiBsYXRlc3QpIHtcbiAgICAgICAgZXJyID0gb3B0aW9ucy50b29MYXRlIHx8XG4gICAgICAgICAgb3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgICAgdGhpcy50b29MYXRlIHx8XG4gICAgICAgICAgXCJtdXN0IGJlIG5vIGxhdGVyIHRoYW4gJXtkYXRlfVwiO1xuICAgICAgICBlcnIgPSB2LmZvcm1hdChlcnIsIHtcbiAgICAgICAgICBkYXRlOiB0aGlzLmZvcm1hdChsYXRlc3QsIG9wdGlvbnMpLFxuICAgICAgICAgIHZhbHVlOiB0aGlzLmZvcm1hdCh2YWx1ZSwgb3B0aW9ucylcbiAgICAgICAgfSk7XG4gICAgICAgIGVycm9ycy5wdXNoKGVycik7XG4gICAgICB9XG5cbiAgICAgIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB2LnVuaXF1ZShlcnJvcnMpO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIHBhcnNlOiBudWxsLFxuICAgICAgZm9ybWF0OiBudWxsXG4gICAgfSksXG4gICAgZGF0ZTogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB2LmV4dGVuZCh7fSwgb3B0aW9ucywge2RhdGVPbmx5OiB0cnVlfSk7XG4gICAgICByZXR1cm4gdi52YWxpZGF0b3JzLmRhdGV0aW1lLmNhbGwodi52YWxpZGF0b3JzLmRhdGV0aW1lLCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgfSxcbiAgICBmb3JtYXQ6IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICBpZiAodi5pc1N0cmluZyhvcHRpb25zKSB8fCAob3B0aW9ucyBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgb3B0aW9ucyA9IHtwYXR0ZXJuOiBvcHRpb25zfTtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCB0aGlzLm1lc3NhZ2UgfHwgXCJpcyBpbnZhbGlkXCJcbiAgICAgICAgLCBwYXR0ZXJuID0gb3B0aW9ucy5wYXR0ZXJuXG4gICAgICAgICwgbWF0Y2g7XG5cbiAgICAgIC8vIEVtcHR5IHZhbHVlcyBhcmUgYWxsb3dlZFxuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCF2LmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHYuaXNTdHJpbmcocGF0dGVybikpIHtcbiAgICAgICAgcGF0dGVybiA9IG5ldyBSZWdFeHAob3B0aW9ucy5wYXR0ZXJuLCBvcHRpb25zLmZsYWdzKTtcbiAgICAgIH1cbiAgICAgIG1hdGNoID0gcGF0dGVybi5leGVjKHZhbHVlKTtcbiAgICAgIGlmICghbWF0Y2ggfHwgbWF0Y2hbMF0ubGVuZ3RoICE9IHZhbHVlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGluY2x1c2lvbjogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIC8vIEVtcHR5IHZhbHVlcyBhcmUgZmluZVxuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHYuaXNBcnJheShvcHRpb25zKSkge1xuICAgICAgICBvcHRpb25zID0ge3dpdGhpbjogb3B0aW9uc307XG4gICAgICB9XG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICBpZiAodi5jb250YWlucyhvcHRpb25zLndpdGhpbiwgdmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBtZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgIHRoaXMubWVzc2FnZSB8fFxuICAgICAgICBcIl4le3ZhbHVlfSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGxpc3RcIjtcbiAgICAgIHJldHVybiB2LmZvcm1hdChtZXNzYWdlLCB7dmFsdWU6IHZhbHVlfSk7XG4gICAgfSxcbiAgICBleGNsdXNpb246IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAvLyBFbXB0eSB2YWx1ZXMgYXJlIGZpbmVcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh2LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt3aXRoaW46IG9wdGlvbnN9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgaWYgKCF2LmNvbnRhaW5zKG9wdGlvbnMud2l0aGluLCB2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIG1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgdGhpcy5tZXNzYWdlIHx8IFwiXiV7dmFsdWV9IGlzIHJlc3RyaWN0ZWRcIjtcbiAgICAgIGlmICh2LmlzU3RyaW5nKG9wdGlvbnMud2l0aGluW3ZhbHVlXSkpIHtcbiAgICAgICAgdmFsdWUgPSBvcHRpb25zLndpdGhpblt2YWx1ZV07XG4gICAgICB9XG4gICAgICByZXR1cm4gdi5mb3JtYXQobWVzc2FnZSwge3ZhbHVlOiB2YWx1ZX0pO1xuICAgIH0sXG4gICAgZW1haWw6IHYuZXh0ZW5kKGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICB2YXIgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCB0aGlzLm1lc3NhZ2UgfHwgXCJpcyBub3QgYSB2YWxpZCBlbWFpbFwiO1xuICAgICAgLy8gRW1wdHkgdmFsdWVzIGFyZSBmaW5lXG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIXYuaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLlBBVFRFUk4uZXhlYyh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICB9XG4gICAgfSwge1xuICAgICAgUEFUVEVSTjogL14oPzpbYS16MC05ISMkJSYnKisvPT9eX2B7fH1+LV0rKD86XFwuW2EtejAtOSEjJCUmJyorLz0/Xl9ge3x9fi1dKykqfFwiKD86W1xceDAxLVxceDA4XFx4MGJcXHgwY1xceDBlLVxceDFmXFx4MjFcXHgyMy1cXHg1YlxceDVkLVxceDdmXXxcXFxcW1xceDAxLVxceDA5XFx4MGJcXHgwY1xceDBlLVxceDdmXSkqXCIpQCg/Oig/OlthLXowLTldKD86W2EtejAtOS1dKlthLXowLTldKT9cXC4pK1thLXowLTldKD86W2EtejAtOS1dKlthLXowLTldKT98XFxbKD86KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KVxcLil7M30oPzoyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT98W2EtejAtOS1dKlthLXowLTldOig/OltcXHgwMS1cXHgwOFxceDBiXFx4MGNcXHgwZS1cXHgxZlxceDIxLVxceDVhXFx4NTMtXFx4N2ZdfFxcXFxbXFx4MDEtXFx4MDlcXHgwYlxceDBjXFx4MGUtXFx4N2ZdKSspXFxdKSQvaVxuICAgIH0pLFxuICAgIGVxdWFsaXR5OiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucywgYXR0cmlidXRlLCBhdHRyaWJ1dGVzLCBnbG9iYWxPcHRpb25zKSB7XG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh2LmlzU3RyaW5nKG9wdGlvbnMpKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7YXR0cmlidXRlOiBvcHRpb25zfTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMgPSB2LmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgIHZhciBtZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgIHRoaXMubWVzc2FnZSB8fFxuICAgICAgICBcImlzIG5vdCBlcXVhbCB0byAle2F0dHJpYnV0ZX1cIjtcblxuICAgICAgaWYgKHYuaXNFbXB0eShvcHRpb25zLmF0dHJpYnV0ZSkgfHwgIXYuaXNTdHJpbmcob3B0aW9ucy5hdHRyaWJ1dGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBhdHRyaWJ1dGUgbXVzdCBiZSBhIG5vbiBlbXB0eSBzdHJpbmdcIik7XG4gICAgICB9XG5cbiAgICAgIHZhciBvdGhlclZhbHVlID0gdi5nZXREZWVwT2JqZWN0VmFsdWUoYXR0cmlidXRlcywgb3B0aW9ucy5hdHRyaWJ1dGUpXG4gICAgICAgICwgY29tcGFyYXRvciA9IG9wdGlvbnMuY29tcGFyYXRvciB8fCBmdW5jdGlvbih2MSwgdjIpIHtcbiAgICAgICAgICByZXR1cm4gdjEgPT09IHYyO1xuICAgICAgICB9XG4gICAgICAgICwgcHJldHRpZnkgPSBvcHRpb25zLnByZXR0aWZ5IHx8XG4gICAgICAgICAgKGdsb2JhbE9wdGlvbnMgJiYgZ2xvYmFsT3B0aW9ucy5wcmV0dGlmeSkgfHxcbiAgICAgICAgICB2LnByZXR0aWZ5O1xuXG4gICAgICBpZiAoIWNvbXBhcmF0b3IodmFsdWUsIG90aGVyVmFsdWUsIG9wdGlvbnMsIGF0dHJpYnV0ZSwgYXR0cmlidXRlcykpIHtcbiAgICAgICAgcmV0dXJuIHYuZm9ybWF0KG1lc3NhZ2UsIHthdHRyaWJ1dGU6IHByZXR0aWZ5KG9wdGlvbnMuYXR0cmlidXRlKX0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgLy8gQSBVUkwgdmFsaWRhdG9yIHRoYXQgaXMgdXNlZCB0byB2YWxpZGF0ZSBVUkxzIHdpdGggdGhlIGFiaWxpdHkgdG9cbiAgICAvLyByZXN0cmljdCBzY2hlbWVzIGFuZCBzb21lIGRvbWFpbnMuXG4gICAgdXJsOiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBtZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlIHx8IHRoaXMubWVzc2FnZSB8fCBcImlzIG5vdCBhIHZhbGlkIHVybFwiXG4gICAgICAgICwgc2NoZW1lcyA9IG9wdGlvbnMuc2NoZW1lcyB8fCB0aGlzLnNjaGVtZXMgfHwgWydodHRwJywgJ2h0dHBzJ11cbiAgICAgICAgLCBhbGxvd0xvY2FsID0gb3B0aW9ucy5hbGxvd0xvY2FsIHx8IHRoaXMuYWxsb3dMb2NhbCB8fCBmYWxzZVxuICAgICAgICAsIGFsbG93RGF0YVVybCA9IG9wdGlvbnMuYWxsb3dEYXRhVXJsIHx8IHRoaXMuYWxsb3dEYXRhVXJsIHx8IGZhbHNlO1xuICAgICAgaWYgKCF2LmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZHBlcmluaS83MjkyOTRcbiAgICAgIHZhciByZWdleCA9XG4gICAgICAgIFwiXlwiICtcbiAgICAgICAgLy8gcHJvdG9jb2wgaWRlbnRpZmllclxuICAgICAgICBcIig/Oig/OlwiICsgc2NoZW1lcy5qb2luKFwifFwiKSArIFwiKTovLylcIiArXG4gICAgICAgIC8vIHVzZXI6cGFzcyBhdXRoZW50aWNhdGlvblxuICAgICAgICBcIig/OlxcXFxTKyg/OjpcXFxcUyopP0ApP1wiICtcbiAgICAgICAgXCIoPzpcIjtcblxuICAgICAgdmFyIHRsZCA9IFwiKD86XFxcXC4oPzpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZl17Mix9KSlcIjtcblxuICAgICAgaWYgKGFsbG93TG9jYWwpIHtcbiAgICAgICAgdGxkICs9IFwiP1wiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVnZXggKz1cbiAgICAgICAgICAvLyBJUCBhZGRyZXNzIGV4Y2x1c2lvblxuICAgICAgICAgIC8vIHByaXZhdGUgJiBsb2NhbCBuZXR3b3Jrc1xuICAgICAgICAgIFwiKD8hKD86MTB8MTI3KSg/OlxcXFwuXFxcXGR7MSwzfSl7M30pXCIgK1xuICAgICAgICAgIFwiKD8hKD86MTY5XFxcXC4yNTR8MTkyXFxcXC4xNjgpKD86XFxcXC5cXFxcZHsxLDN9KXsyfSlcIiArXG4gICAgICAgICAgXCIoPyExNzJcXFxcLig/OjFbNi05XXwyXFxcXGR8M1swLTFdKSg/OlxcXFwuXFxcXGR7MSwzfSl7Mn0pXCI7XG4gICAgICB9XG5cbiAgICAgIHJlZ2V4ICs9XG4gICAgICAgICAgLy8gSVAgYWRkcmVzcyBkb3R0ZWQgbm90YXRpb24gb2N0ZXRzXG4gICAgICAgICAgLy8gZXhjbHVkZXMgbG9vcGJhY2sgbmV0d29yayAwLjAuMC4wXG4gICAgICAgICAgLy8gZXhjbHVkZXMgcmVzZXJ2ZWQgc3BhY2UgPj0gMjI0LjAuMC4wXG4gICAgICAgICAgLy8gZXhjbHVkZXMgbmV0d29yayAmIGJyb2FjYXN0IGFkZHJlc3Nlc1xuICAgICAgICAgIC8vIChmaXJzdCAmIGxhc3QgSVAgYWRkcmVzcyBvZiBlYWNoIGNsYXNzKVxuICAgICAgICAgIFwiKD86WzEtOV1cXFxcZD98MVxcXFxkXFxcXGR8MlswMV1cXFxcZHwyMlswLTNdKVwiICtcbiAgICAgICAgICBcIig/OlxcXFwuKD86MT9cXFxcZHsxLDJ9fDJbMC00XVxcXFxkfDI1WzAtNV0pKXsyfVwiICtcbiAgICAgICAgICBcIig/OlxcXFwuKD86WzEtOV1cXFxcZD98MVxcXFxkXFxcXGR8MlswLTRdXFxcXGR8MjVbMC00XSkpXCIgK1xuICAgICAgICBcInxcIiArXG4gICAgICAgICAgLy8gaG9zdCBuYW1lXG4gICAgICAgICAgXCIoPzooPzpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZjAtOV0tKikqW2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldKylcIiArXG4gICAgICAgICAgLy8gZG9tYWluIG5hbWVcbiAgICAgICAgICBcIig/OlxcXFwuKD86W2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldLSopKlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSspKlwiICtcbiAgICAgICAgICB0bGQgK1xuICAgICAgICBcIilcIiArXG4gICAgICAgIC8vIHBvcnQgbnVtYmVyXG4gICAgICAgIFwiKD86OlxcXFxkezIsNX0pP1wiICtcbiAgICAgICAgLy8gcmVzb3VyY2UgcGF0aFxuICAgICAgICBcIig/OlsvPyNdXFxcXFMqKT9cIiArXG4gICAgICBcIiRcIjtcblxuICAgICAgaWYgKGFsbG93RGF0YVVybCkge1xuICAgICAgICAvLyBSRkMgMjM5N1xuICAgICAgICB2YXIgbWVkaWFUeXBlID0gXCJcXFxcdytcXFxcL1stKy5cXFxcd10rKD86O1tcXFxcdz1dKykqXCI7XG4gICAgICAgIHZhciB1cmxjaGFyID0gXCJbQS1aYS16MC05LV8uIX5cXFxcKicoKTtcXFxcLz86QCY9KyQsJV0qXCI7XG4gICAgICAgIHZhciBkYXRhdXJsID0gXCJkYXRhOig/OlwiK21lZGlhVHlwZStcIik/KD86O2Jhc2U2NCk/LFwiK3VybGNoYXI7XG4gICAgICAgIHJlZ2V4ID0gXCIoPzpcIityZWdleCtcIil8KD86XlwiK2RhdGF1cmwrXCIkKVwiO1xuICAgICAgfVxuXG4gICAgICB2YXIgUEFUVEVSTiA9IG5ldyBSZWdFeHAocmVnZXgsICdpJyk7XG4gICAgICBpZiAoIVBBVFRFUk4uZXhlYyh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICB9XG4gICAgfSxcbiAgICB0eXBlOiB2LmV4dGVuZChmdW5jdGlvbih2YWx1ZSwgb3JpZ2luYWxPcHRpb25zLCBhdHRyaWJ1dGUsIGF0dHJpYnV0ZXMsIGdsb2JhbE9wdGlvbnMpIHtcbiAgICAgIGlmICh2LmlzU3RyaW5nKG9yaWdpbmFsT3B0aW9ucykpIHtcbiAgICAgICAgb3JpZ2luYWxPcHRpb25zID0ge3R5cGU6IG9yaWdpbmFsT3B0aW9uc307XG4gICAgICB9XG5cbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIG9wdGlvbnMgPSB2LmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcmlnaW5hbE9wdGlvbnMpO1xuXG4gICAgICB2YXIgdHlwZSA9IG9wdGlvbnMudHlwZTtcbiAgICAgIGlmICghdi5pc0RlZmluZWQodHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gdHlwZSB3YXMgc3BlY2lmaWVkXCIpO1xuICAgICAgfVxuXG4gICAgICB2YXIgY2hlY2s7XG4gICAgICBpZiAodi5pc0Z1bmN0aW9uKHR5cGUpKSB7XG4gICAgICAgIGNoZWNrID0gdHlwZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNoZWNrID0gdGhpcy50eXBlc1t0eXBlXTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF2LmlzRnVuY3Rpb24oY2hlY2spKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInZhbGlkYXRlLnZhbGlkYXRvcnMudHlwZS50eXBlcy5cIiArIHR5cGUgKyBcIiBtdXN0IGJlIGEgZnVuY3Rpb24uXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWNoZWNrKHZhbHVlLCBvcHRpb25zLCBhdHRyaWJ1dGUsIGF0dHJpYnV0ZXMsIGdsb2JhbE9wdGlvbnMpKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gb3JpZ2luYWxPcHRpb25zLm1lc3NhZ2UgfHxcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VzW3R5cGVdIHx8XG4gICAgICAgICAgdGhpcy5tZXNzYWdlIHx8XG4gICAgICAgICAgb3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgICAgKHYuaXNGdW5jdGlvbih0eXBlKSA/IFwibXVzdCBiZSBvZiB0aGUgY29ycmVjdCB0eXBlXCIgOiBcIm11c3QgYmUgb2YgdHlwZSAle3R5cGV9XCIpO1xuXG4gICAgICAgIGlmICh2LmlzRnVuY3Rpb24obWVzc2FnZSkpIHtcbiAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZSh2YWx1ZSwgb3JpZ2luYWxPcHRpb25zLCBhdHRyaWJ1dGUsIGF0dHJpYnV0ZXMsIGdsb2JhbE9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHYuZm9ybWF0KG1lc3NhZ2UsIHthdHRyaWJ1dGU6IHYucHJldHRpZnkoYXR0cmlidXRlKSwgdHlwZTogdHlwZX0pO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIHR5cGVzOiB7XG4gICAgICAgIG9iamVjdDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gdi5pc09iamVjdCh2YWx1ZSkgJiYgIXYuaXNBcnJheSh2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGFycmF5OiB2LmlzQXJyYXksXG4gICAgICAgIGludGVnZXI6IHYuaXNJbnRlZ2VyLFxuICAgICAgICBudW1iZXI6IHYuaXNOdW1iZXIsXG4gICAgICAgIHN0cmluZzogdi5pc1N0cmluZyxcbiAgICAgICAgZGF0ZTogdi5pc0RhdGUsXG4gICAgICAgIGJvb2xlYW46IHYuaXNCb29sZWFuXG4gICAgICB9LFxuICAgICAgbWVzc2FnZXM6IHt9XG4gICAgfSlcbiAgfTtcblxuICB2YWxpZGF0ZS5mb3JtYXR0ZXJzID0ge1xuICAgIGRldGFpbGVkOiBmdW5jdGlvbihlcnJvcnMpIHtyZXR1cm4gZXJyb3JzO30sXG4gICAgZmxhdDogdi5mbGF0dGVuRXJyb3JzVG9BcnJheSxcbiAgICBncm91cGVkOiBmdW5jdGlvbihlcnJvcnMpIHtcbiAgICAgIHZhciBhdHRyO1xuXG4gICAgICBlcnJvcnMgPSB2Lmdyb3VwRXJyb3JzQnlBdHRyaWJ1dGUoZXJyb3JzKTtcbiAgICAgIGZvciAoYXR0ciBpbiBlcnJvcnMpIHtcbiAgICAgICAgZXJyb3JzW2F0dHJdID0gdi5mbGF0dGVuRXJyb3JzVG9BcnJheShlcnJvcnNbYXR0cl0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9LFxuICAgIGNvbnN0cmFpbnQ6IGZ1bmN0aW9uKGVycm9ycykge1xuICAgICAgdmFyIGF0dHI7XG4gICAgICBlcnJvcnMgPSB2Lmdyb3VwRXJyb3JzQnlBdHRyaWJ1dGUoZXJyb3JzKTtcbiAgICAgIGZvciAoYXR0ciBpbiBlcnJvcnMpIHtcbiAgICAgICAgZXJyb3JzW2F0dHJdID0gZXJyb3JzW2F0dHJdLm1hcChmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0LnZhbGlkYXRvcjtcbiAgICAgICAgfSkuc29ydCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVycm9ycztcbiAgICB9XG4gIH07XG5cbiAgdmFsaWRhdGUuZXhwb3NlTW9kdWxlKHZhbGlkYXRlLCB0aGlzLCBleHBvcnRzLCBtb2R1bGUsIGRlZmluZSk7XG59KS5jYWxsKHRoaXMsXG4gICAgICAgIHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGV4cG9ydHMgOiBudWxsLFxuICAgICAgICB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIG1vZHVsZSA6IG51bGwsXG4gICAgICAgIHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnID8gLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi8gZGVmaW5lIDogbnVsbCk7XG4iLCJpbXBvcnQgaU1hc2sgZnJvbSAnaW1hc2snO1xuaW1wb3J0IHZhbGlkYXRlIGZyb20gJ3ZhbGlkYXRlLmpzJztcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgY29uc3QgZHJvcGRvd25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgW2RhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIl1gKTtcbiAgY29uc3QgZWRpdExpbmsgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1hY3Rpb249XCJlZGl0XCJdYCk7XG4gIGNvbnN0IGZvcm0gPSBkb2N1bWVudC5mb3Jtc1swXTtcbiAgY29uc3QgY2hlY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVjaWRlZCcpO1xuICBjb25zdCBsaWFiaWxpdHkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGlhYmlsaXR5Jyk7XG4gIGNvbnN0IGxpYWJpbGl0eU5vID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpYWJpbGl0eV8wJyk7XG4gIGxldCBlbGVtcyA9IFtdO1xuXG4gIGlmIChsaWFiaWxpdHkpIHtcbiAgICBsaWFiaWxpdHkuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgY29uc3QgYmxvY2sgPSBsaWFiaWxpdHkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgY29uc3QgaGlkZGVuRWxlbXMgPSBibG9jay5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1zaG93bl0nKTtcbiAgICAgIGxpYWJpbGl0eS5jaGVja2VkID0gZmFsc2U7XG4gICAgICBpZiAoaGlkZGVuRWxlbXMpIHtcbiAgICAgICAgaGlkZGVuRWxlbXMuZm9yRWFjaCggKGl0ZW0pID0+IHtcbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWhpZGRlbicpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZmlyc3RIaWRkZW5FbGVtID0gaGlkZGVuRWxlbXNbMF0uY2hpbGRyZW5bMF07XG4gICAgICAgIGlmIChmaXJzdEhpZGRlbkVsZW0pIHtcbiAgICAgICAgICBmaXJzdEhpZGRlbkVsZW0uY2hlY2tlZCA9IHRydWU7XG4gICAgICAgICAgZmlyc3RIaWRkZW5FbGVtLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdjaGFuZ2UnKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBsaWFiaWxpdHlOby5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICBjb25zdCBibG9jayA9IGxpYWJpbGl0eS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgICBjb25zdCBoaWRkZW5FbGVtcyA9IGJsb2NrLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXNob3duXScpO1xuICAgICAgaWYgKGhpZGRlbkVsZW1zKSB7XG4gICAgICAgIGhpZGRlbkVsZW1zLmZvckVhY2goIChpdGVtKSA9PiB7XG4gICAgICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdpcy1oaWRkZW4nKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgaWYgKGNoZWNrKSB7XG4gICAgY2hlY2suYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcbiAgICAgIGlmIChjaGVjay5jaGVja2VkKSB7XG4gICAgICAgIGZvcm0uZWxlbWVudHMubGluay52YWx1ZSA9ICcnO1xuICAgICAgICBmb3JtLmVsZW1lbnRzLm1vZGVsLnZhbHVlID0gJyc7XG4gICAgICAgIGZvcm0uZWxlbWVudHMubGluay5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyk7XG4gICAgICAgIGZvcm0uZWxlbWVudHMubW9kZWwuc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xuICAgICAgICBmb3JtLmVsZW1lbnRzLmxpbmsucGFyZW50RWxlbWVudC5cbiAgICAgICAgICAgIGNsYXNzTGlzdC5hZGQoJ2xlYWQtZm9ybV9fZ3JvdXAtLWRpc2FibGVkJyk7XG4gICAgICAgIGZvcm0uZWxlbWVudHMubW9kZWwucGFyZW50RWxlbWVudC5cbiAgICAgICAgICAgIGNsYXNzTGlzdC5hZGQoJ2xlYWQtZm9ybV9fZ3JvdXAtLWRpc2FibGVkJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3JtLmVsZW1lbnRzLmxpbmsucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xuICAgICAgICBmb3JtLmVsZW1lbnRzLm1vZGVsLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5saW5rLnBhcmVudEVsZW1lbnQuXG4gICAgICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKCdsZWFkLWZvcm1fX2dyb3VwLS1kaXNhYmxlZCcpO1xuICAgICAgICBmb3JtLmVsZW1lbnRzLm1vZGVsLnBhcmVudEVsZW1lbnQuXG4gICAgICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKCdsZWFkLWZvcm1fX2dyb3VwLS1kaXNhYmxlZCcpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIGZvcm0pIHtcbiAgICBlbGVtcyA9IE9iamVjdC52YWx1ZXMoZm9ybS5lbGVtZW50cykuXG4gICAgICAgIGZpbHRlcigoZWwpID0+IGVsICYmIGVsLmNsYXNzTGlzdC5jb250YWlucygnaXMtZWRpdGFibGUnKSk7XG4gICAgY29uc3QgcGhvbmUgPSBmb3JtLmVsZW1lbnRzLnBob25lO1xuICAgIGlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIHBob25lKSB7XG4gICAgICBjb25zdCBuZXdNYXNrID0gaU1hc2socGhvbmUsXG4gICAgICAgICAge1xuICAgICAgICAgICAgbWFzazogJyt7Mzc1fSAoMDApIDAwMC0wMC0wMCcsXG4gICAgICAgICAgICBsYXp5OiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICApLm9uKCdjb21wbGV0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyB0b2RvOlxuICAgICAgfSk7XG4gICAgICBjb25zb2xlLmxvZyhuZXdNYXNrKTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coIE9iamVjdC52YWx1ZXMoZm9ybS5lbGVtZW50cykpO1xuICAgIE9iamVjdC52YWx1ZXMoZm9ybS5lbGVtZW50cykuZm9yRWFjaCgoZWwpID0+e1xuICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdpbnZhbGlkJyk7XG4gICAgICAgIGNvbnN0IG1zZyA9IGVsLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcignLm1lc3NhZ2VzJyk7XG4gICAgICAgIGlmIChtc2cpIHtcbiAgICAgICAgICBtc2cuY2xhc3NMaXN0LnJlbW92ZSgnZXJyb3InKTtcbiAgICAgICAgICBtc2cuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGUpID0+IHtcbiAgICAgIGlmIChmb3JtLmlkID09PSAnYWdyZWVtZW50cycpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBjb25zdCBkYXRhID0gbmV3IEZvcm1EYXRhKGZvcm0pO1xuICAgICAgICBjb25zdCBjb25zdHJhaW50cyA9IHtcbiAgICAgICAgICBhZ3JlZW1lbnRfcmVwb3J0OiB7XG4gICAgICAgICAgICBwcmVzZW5jZToge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBgXtCf0L7QtNGC0LLQtdGA0LTQuNGC0LUg0YHQvtCz0LvQsNGB0LjQtSDQvdCwINC/0YDQtdC00L7RgdGC0LDQstC70LXQvdC40LVcbiAgICAgICAgICAgICAg0LrRgNC10LTQuNGC0L3QvtCz0L4g0L7RgtGH0LXRgtCwYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhZ3JlZW1lbnRfcGVyc29uYWw6IHtcbiAgICAgICAgICAgIHByZXNlbmNlOiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGBe0J/QvtC00YLQstC10YDQtNC40YLQtSDRgdC+0LPQu9Cw0YHQuNC1INC90LAg0YXRgNCw0L3QtdC90LjQtSDQuFxuICAgICAgICAgICAgICDQvtCx0YDQsNCx0L7RgtC60YMg0L/QtdGA0YHQvtC90LDQu9GM0L3Ri9GFINC00LDQvdC90YvRhWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYWdyZWVtZW50X3BvbGl0aWM6IHtcbiAgICAgICAgICAgIHByZXNlbmNlOiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGBe0J/QvtC00YLQstC10YDQtNC40YLQtSDRgdC+0LPQu9Cw0YHQuNC1INGBINC/0L7Qu9C40YLQuNC60L7QuSDQutC+0L3RhNC40LTQtdC90YbQuNCw0LvRjNC90YLQuNC+0YHRgtC4YCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBlcnJvcnMgPSB2YWxpZGF0ZShmb3JtLCBjb25zdHJhaW50cyk7XG4gICAgICAgIGlmIChlcnJvcnMpIHtcbiAgICAgICAgICBPYmplY3QuZW50cmllcyhlcnJvcnMpLmZvckVhY2goKFtpZCwgZXJyb3JdKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9IGZvcm0uZWxlbWVudHNbaWRdO1xuICAgICAgICAgICAgaWYgKGlucHV0KSB7XG4gICAgICAgICAgICAgIGlucHV0LmNsYXNzTGlzdC5hZGQoJ2ludmFsaWQnKTtcbiAgICAgICAgICAgICAgY29uc3QgbXNnID0gaW5wdXQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubWVzc2FnZXMnKTtcbiAgICAgICAgICAgICAgbXNnLmlubmVySFRNTCA9IGVycm9yWzBdO1xuICAgICAgICAgICAgICBtc2cuY2xhc3NMaXN0LmFkZCgnZXJyb3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3JtLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBpZiAobnVsbCAhPT0gZWRpdExpbmspIHtcbiAgICBlZGl0TGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlbGVtcy5mb3JFYWNoKChlbGVtKSA9PiB7XG4gICAgICAgIGVsZW0uY2xhc3NMaXN0LnJlbW92ZSgnbGVhZC1mb3JtX19ncm91cC0tZGlzYWJsZWQnKTtcbiAgICAgICAgY29uc3QgaW5wdXRFbCA9IGVsZW0ucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgaW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUoJ3JlYWRvbmx5Jyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBpZiAobnVsbCAhPT0gZHJvcGRvd25zKSB7XG4gICAgZHJvcGRvd25zLmZvckVhY2goKGRyb3Bkb3duKSA9PiB7XG4gICAgICBkcm9wZG93bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29udGVudElkID0gZHJvcGRvd24uZGF0YXNldC50YXJnZXQucmVwbGFjZSgnIycsICcnKTtcbiAgICAgICAgaWYgKG51bGwgIT09IGNvbnRlbnRJZCkge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250ZW50SWQpO1xuICAgICAgICAgIGNvbnRlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtaGlkZGVuJyk7XG4gICAgICAgICAgZHJvcGRvd24uY2xhc3NMaXN0LnRvZ2dsZSgnaXMtb3BlbicpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGN1c3RvbVNlbGVjdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubGVhZC1mb3JtX19jdXN0b20tc2VsZWN0Jyk7XG4gIC8vIEF0dGFjaCBjbGljayBldmVudCBsaXN0ZW5lcnMgdG8gZWFjaCBjdXN0b20gc2VsZWN0XG4gIGN1c3RvbVNlbGVjdHMuZm9yRWFjaChmdW5jdGlvbihzZWwpIHtcbiAgICBjb25zdCBzZWxlY3RTZWxlY3RlZCA9IHNlbC5xdWVyeVNlbGVjdG9yKCcubGVhZC1mb3JtX19zZWxlY3Qtc2VsZWN0ZWQnKTtcbiAgICBjb25zdCBzZWxlY3RJdGVtcyA9IHNlbC5xdWVyeVNlbGVjdG9yKCcubGVhZC1mb3JtX19zZWxlY3QtaXRlbXMnKTtcbiAgICBjb25zdCBvcHRpb25zID0gc2VsZWN0SXRlbXMucXVlcnlTZWxlY3RvckFsbCgnZGl2Jyk7XG4gICAgY29uc3Qgc2VsSGlkZGVuID0gc2VsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG4gICAgc2VsZWN0U2VsZWN0ZWQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzZWxlY3RJdGVtcy5zdHlsZS5kaXNwbGF5ID09PSAnYmxvY2snKSB7XG4gICAgICAgIHNlbGVjdEl0ZW1zLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHNlbGVjdFNlbGVjdGVkLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLW9wZW4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGVjdEl0ZW1zLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBzZWxlY3RTZWxlY3RlZC5jbGFzc0xpc3QuYWRkKCdpcy1vcGVuJyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gU2V0IHRoZSBzZWxlY3RlZCBvcHRpb24gYW5kIGhpZGUgdGhlIGRyb3Bkb3duIHdoZW4gYW4gb3B0aW9uIGlzIGNsaWNrZWRcbiAgICBvcHRpb25zLmZvckVhY2goZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZWN0U2VsZWN0ZWQudGV4dENvbnRlbnQgPSBvcHRpb24udGV4dENvbnRlbnQ7XG4gICAgICAgIHNlbEhpZGRlbi52YWx1ZSA9IG9wdGlvbi5kYXRhc2V0LnZhbHVlO1xuICAgICAgICBjb25zdCBzZWxJdGVtID0gc2VsSGlkZGVuXG4gICAgICAgICAgICAucXVlcnlTZWxlY3RvcihgW3ZhbHVlPVwiJHtvcHRpb24uZGF0YXNldC52YWx1ZX1cIl1gKTtcbiAgICAgICAgc2VsSXRlbS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2xpY2snKSk7XG4gICAgICAgIHNlbGVjdEl0ZW1zLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHNlbGVjdFNlbGVjdGVkLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLW9wZW4nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vIENsb3NlIHRoZSBkcm9wZG93biBpZiB0aGUgdXNlciBjbGlja3Mgb3V0c2lkZSBvZiBpdFxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghc2VsLmNvbnRhaW5zKGUudGFyZ2V0KSkge1xuICAgICAgICBzZWxlY3RJdGVtcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBzZWxlY3RTZWxlY3RlZC5jbGFzc0xpc3QucmVtb3ZlKCdpcy1vcGVuJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
