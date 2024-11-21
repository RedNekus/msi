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
"use strict";

var _imask = _interopRequireDefault(require("imask"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
document.addEventListener('DOMContentLoaded', function () {
  var dropdowns = document.querySelectorAll("[data-toggle=\"dropdown\"]");
  var editLink = document.querySelector("[data-action=\"edit\"]");
  var form = document.forms[0];
  var elems = [];
  if ('undefined' !== typeof form) {
    elems = Object.values(form.elements).filter(function (el) {
      return el && el.classList.contains('is-editable');
    });
    var phone = form.elements.phone;
    if (null !== phone) {
      var newMask = (0, _imask["default"])(phone, {
        mask: '+{375} (00) 000-00-00',
        lazy: true
      }).on('complete', function () {
        // todo:
      });
      console.log(newMask);
    }
  }
  if (null !== editLink) {
    editLink.addEventListener('click', function (e) {
      e.preventDefault();
      elems.forEach(function (elem) {
        elem.classList.remove('lead-form__group--disabled');
        var inputEl = elem.querySelector('input');
        inputEl.removeAttribute('disabled');
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
});

},{"imask":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW1hc2svZGlzdC9pbWFzay5qcyIsInNyYy9qcy9zY3JpcHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6akhBLElBQUEsTUFBQSxHQUFBLHNCQUFBLENBQUEsT0FBQTtBQUEwQixTQUFBLHVCQUFBLENBQUEsV0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUE7QUFFMUIsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLFlBQU07RUFDbEQsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGdCQUFnQiw2QkFBMkIsQ0FBQztFQUN2RSxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSx5QkFBdUIsQ0FBQztFQUMvRCxJQUFNLElBQUksR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUM5QixJQUFJLEtBQUssR0FBRyxFQUFFO0VBQ2QsSUFBSSxXQUFXLEtBQUssT0FBTyxJQUFJLEVBQUU7SUFDL0IsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUNoQyxNQUFNLENBQUMsVUFBQyxFQUFFO01BQUEsT0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO0lBQUEsRUFBQztJQUM5RCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUs7SUFDakMsSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFO01BQ2xCLElBQU0sT0FBTyxHQUFHLElBQUEsaUJBQUssRUFBQyxLQUFLLEVBQ3ZCO1FBQ0UsSUFBSSxFQUFFLHVCQUF1QjtRQUM3QixJQUFJLEVBQUU7TUFDUixDQUNKLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQVc7UUFDMUI7TUFBQSxDQUNELENBQUM7TUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztJQUN0QjtFQUNGO0VBRUEsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO0lBQ3JCLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBQyxDQUFDLEVBQUs7TUFDeEMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO01BQ2xCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJLEVBQUs7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsNEJBQTRCLENBQUM7UUFDbkQsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7UUFDM0MsT0FBTyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUM7TUFDckMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7RUFDQSxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7SUFDdEIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFFBQVEsRUFBSztNQUM5QixRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFlBQU07UUFDdkMsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7UUFDMUQsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO1VBQ3RCLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO1VBQ2xELE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztVQUNyQyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFDdEM7TUFDRixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjtBQUNGLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcbiAgKGdsb2JhbCA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiBnbG9iYWwgfHwgc2VsZiwgZmFjdG9yeShnbG9iYWwuSU1hc2sgPSB7fSkpO1xufSkodGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICAvKiogQ2hlY2tzIGlmIHZhbHVlIGlzIHN0cmluZyAqL1xuICBmdW5jdGlvbiBpc1N0cmluZyhzdHIpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN0ciA9PT0gJ3N0cmluZycgfHwgc3RyIGluc3RhbmNlb2YgU3RyaW5nO1xuICB9XG5cbiAgLyoqIENoZWNrcyBpZiB2YWx1ZSBpcyBvYmplY3QgKi9cbiAgZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7XG4gICAgdmFyIF9vYmokY29uc3RydWN0b3I7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIG9iaiAhPSBudWxsICYmIChvYmogPT0gbnVsbCB8fCAoX29iaiRjb25zdHJ1Y3RvciA9IG9iai5jb25zdHJ1Y3RvcikgPT0gbnVsbCA/IHZvaWQgMCA6IF9vYmokY29uc3RydWN0b3IubmFtZSkgPT09ICdPYmplY3QnO1xuICB9XG4gIGZ1bmN0aW9uIHBpY2sob2JqLCBrZXlzKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5cykpIHJldHVybiBwaWNrKG9iaiwgKF8sIGspID0+IGtleXMuaW5jbHVkZXMoaykpO1xuICAgIHJldHVybiBPYmplY3QuZW50cmllcyhvYmopLnJlZHVjZSgoYWNjLCBfcmVmKSA9PiB7XG4gICAgICBsZXQgW2ssIHZdID0gX3JlZjtcbiAgICAgIGlmIChrZXlzKHYsIGspKSBhY2Nba10gPSB2O1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG4gIH1cblxuICAvKiogRGlyZWN0aW9uICovXG4gIGNvbnN0IERJUkVDVElPTiA9IHtcbiAgICBOT05FOiAnTk9ORScsXG4gICAgTEVGVDogJ0xFRlQnLFxuICAgIEZPUkNFX0xFRlQ6ICdGT1JDRV9MRUZUJyxcbiAgICBSSUdIVDogJ1JJR0hUJyxcbiAgICBGT1JDRV9SSUdIVDogJ0ZPUkNFX1JJR0hUJ1xuICB9O1xuXG4gIC8qKiBEaXJlY3Rpb24gKi9cblxuICBmdW5jdGlvbiBmb3JjZURpcmVjdGlvbihkaXJlY3Rpb24pIHtcbiAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgY2FzZSBESVJFQ1RJT04uTEVGVDpcbiAgICAgICAgcmV0dXJuIERJUkVDVElPTi5GT1JDRV9MRUZUO1xuICAgICAgY2FzZSBESVJFQ1RJT04uUklHSFQ6XG4gICAgICAgIHJldHVybiBESVJFQ1RJT04uRk9SQ0VfUklHSFQ7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZGlyZWN0aW9uO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBFc2NhcGVzIHJlZ3VsYXIgZXhwcmVzc2lvbiBjb250cm9sIGNoYXJzICovXG4gIGZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLiorP149IToke30oKXxbXFxdL1xcXFxdKS9nLCAnXFxcXCQxJyk7XG4gIH1cblxuICAvLyBjbG9uZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZXBvYmVyZXpraW4vZmFzdC1kZWVwLWVxdWFsIHdpdGggc21hbGwgY2hhbmdlc1xuICBmdW5jdGlvbiBvYmplY3RJbmNsdWRlcyhiLCBhKSB7XG4gICAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IGFyckEgPSBBcnJheS5pc0FycmF5KGEpLFxuICAgICAgYXJyQiA9IEFycmF5LmlzQXJyYXkoYik7XG4gICAgbGV0IGk7XG4gICAgaWYgKGFyckEgJiYgYXJyQikge1xuICAgICAgaWYgKGEubGVuZ3RoICE9IGIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykgaWYgKCFvYmplY3RJbmNsdWRlcyhhW2ldLCBiW2ldKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChhcnJBICE9IGFyckIpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYSAmJiBiICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYiA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGNvbnN0IGRhdGVBID0gYSBpbnN0YW5jZW9mIERhdGUsXG4gICAgICAgIGRhdGVCID0gYiBpbnN0YW5jZW9mIERhdGU7XG4gICAgICBpZiAoZGF0ZUEgJiYgZGF0ZUIpIHJldHVybiBhLmdldFRpbWUoKSA9PSBiLmdldFRpbWUoKTtcbiAgICAgIGlmIChkYXRlQSAhPSBkYXRlQikgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3QgcmVnZXhwQSA9IGEgaW5zdGFuY2VvZiBSZWdFeHAsXG4gICAgICAgIHJlZ2V4cEIgPSBiIGluc3RhbmNlb2YgUmVnRXhwO1xuICAgICAgaWYgKHJlZ2V4cEEgJiYgcmVnZXhwQikgcmV0dXJuIGEudG9TdHJpbmcoKSA9PSBiLnRvU3RyaW5nKCk7XG4gICAgICBpZiAocmVnZXhwQSAhPSByZWdleHBCKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYSk7XG4gICAgICAvLyBpZiAoa2V5cy5sZW5ndGggIT09IE9iamVjdC5rZXlzKGIpLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwga2V5c1tpXSkpIHJldHVybiBmYWxzZTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSBpZiAoIW9iamVjdEluY2x1ZGVzKGJba2V5c1tpXV0sIGFba2V5c1tpXV0pKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGEgJiYgYiAmJiB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgYiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIGEudG9TdHJpbmcoKSA9PT0gYi50b1N0cmluZygpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKiogU2VsZWN0aW9uIHJhbmdlICovXG5cbiAgLyoqIFByb3ZpZGVzIGRldGFpbHMgb2YgY2hhbmdpbmcgaW5wdXQgKi9cbiAgY2xhc3MgQWN0aW9uRGV0YWlscyB7XG4gICAgLyoqIEN1cnJlbnQgaW5wdXQgdmFsdWUgKi9cblxuICAgIC8qKiBDdXJyZW50IGN1cnNvciBwb3NpdGlvbiAqL1xuXG4gICAgLyoqIE9sZCBpbnB1dCB2YWx1ZSAqL1xuXG4gICAgLyoqIE9sZCBzZWxlY3Rpb24gKi9cblxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgb3B0cyk7XG5cbiAgICAgIC8vIGRvdWJsZSBjaGVjayBpZiBsZWZ0IHBhcnQgd2FzIGNoYW5nZWQgKGF1dG9maWxsaW5nLCBvdGhlciBub24tc3RhbmRhcmQgaW5wdXQgdHJpZ2dlcnMpXG4gICAgICB3aGlsZSAodGhpcy52YWx1ZS5zbGljZSgwLCB0aGlzLnN0YXJ0Q2hhbmdlUG9zKSAhPT0gdGhpcy5vbGRWYWx1ZS5zbGljZSgwLCB0aGlzLnN0YXJ0Q2hhbmdlUG9zKSkge1xuICAgICAgICAtLXRoaXMub2xkU2VsZWN0aW9uLnN0YXJ0O1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaW5zZXJ0ZWRDb3VudCkge1xuICAgICAgICAvLyBkb3VibGUgY2hlY2sgcmlnaHQgcGFydFxuICAgICAgICB3aGlsZSAodGhpcy52YWx1ZS5zbGljZSh0aGlzLmN1cnNvclBvcykgIT09IHRoaXMub2xkVmFsdWUuc2xpY2UodGhpcy5vbGRTZWxlY3Rpb24uZW5kKSkge1xuICAgICAgICAgIGlmICh0aGlzLnZhbHVlLmxlbmd0aCAtIHRoaXMuY3Vyc29yUG9zIDwgdGhpcy5vbGRWYWx1ZS5sZW5ndGggLSB0aGlzLm9sZFNlbGVjdGlvbi5lbmQpICsrdGhpcy5vbGRTZWxlY3Rpb24uZW5kO2Vsc2UgKyt0aGlzLmN1cnNvclBvcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBTdGFydCBjaGFuZ2luZyBwb3NpdGlvbiAqL1xuICAgIGdldCBzdGFydENoYW5nZVBvcygpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbih0aGlzLmN1cnNvclBvcywgdGhpcy5vbGRTZWxlY3Rpb24uc3RhcnQpO1xuICAgIH1cblxuICAgIC8qKiBJbnNlcnRlZCBzeW1ib2xzIGNvdW50ICovXG4gICAgZ2V0IGluc2VydGVkQ291bnQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJzb3JQb3MgLSB0aGlzLnN0YXJ0Q2hhbmdlUG9zO1xuICAgIH1cblxuICAgIC8qKiBJbnNlcnRlZCBzeW1ib2xzICovXG4gICAgZ2V0IGluc2VydGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWUuc3Vic3RyKHRoaXMuc3RhcnRDaGFuZ2VQb3MsIHRoaXMuaW5zZXJ0ZWRDb3VudCk7XG4gICAgfVxuXG4gICAgLyoqIFJlbW92ZWQgc3ltYm9scyBjb3VudCAqL1xuICAgIGdldCByZW1vdmVkQ291bnQoKSB7XG4gICAgICAvLyBNYXRoLm1heCBmb3Igb3Bwb3NpdGUgb3BlcmF0aW9uXG4gICAgICByZXR1cm4gTWF0aC5tYXgodGhpcy5vbGRTZWxlY3Rpb24uZW5kIC0gdGhpcy5zdGFydENoYW5nZVBvcyB8fFxuICAgICAgLy8gZm9yIERlbGV0ZVxuICAgICAgdGhpcy5vbGRWYWx1ZS5sZW5ndGggLSB0aGlzLnZhbHVlLmxlbmd0aCwgMCk7XG4gICAgfVxuXG4gICAgLyoqIFJlbW92ZWQgc3ltYm9scyAqL1xuICAgIGdldCByZW1vdmVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMub2xkVmFsdWUuc3Vic3RyKHRoaXMuc3RhcnRDaGFuZ2VQb3MsIHRoaXMucmVtb3ZlZENvdW50KTtcbiAgICB9XG5cbiAgICAvKiogVW5jaGFuZ2VkIGhlYWQgc3ltYm9scyAqL1xuICAgIGdldCBoZWFkKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWUuc3Vic3RyaW5nKDAsIHRoaXMuc3RhcnRDaGFuZ2VQb3MpO1xuICAgIH1cblxuICAgIC8qKiBVbmNoYW5nZWQgdGFpbCBzeW1ib2xzICovXG4gICAgZ2V0IHRhaWwoKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZS5zdWJzdHJpbmcodGhpcy5zdGFydENoYW5nZVBvcyArIHRoaXMuaW5zZXJ0ZWRDb3VudCk7XG4gICAgfVxuXG4gICAgLyoqIFJlbW92ZSBkaXJlY3Rpb24gKi9cbiAgICBnZXQgcmVtb3ZlRGlyZWN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLnJlbW92ZWRDb3VudCB8fCB0aGlzLmluc2VydGVkQ291bnQpIHJldHVybiBESVJFQ1RJT04uTk9ORTtcblxuICAgICAgLy8gYWxpZ24gcmlnaHQgaWYgZGVsZXRlIGF0IHJpZ2h0XG4gICAgICByZXR1cm4gKHRoaXMub2xkU2VsZWN0aW9uLmVuZCA9PT0gdGhpcy5jdXJzb3JQb3MgfHwgdGhpcy5vbGRTZWxlY3Rpb24uc3RhcnQgPT09IHRoaXMuY3Vyc29yUG9zKSAmJlxuICAgICAgLy8gaWYgbm90IHJhbmdlIHJlbW92ZWQgKGV2ZW50IHdpdGggYmFja3NwYWNlKVxuICAgICAgdGhpcy5vbGRTZWxlY3Rpb24uZW5kID09PSB0aGlzLm9sZFNlbGVjdGlvbi5zdGFydCA/IERJUkVDVElPTi5SSUdIVCA6IERJUkVDVElPTi5MRUZUO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBcHBsaWVzIG1hc2sgb24gZWxlbWVudCAqL1xuICBmdW5jdGlvbiBJTWFzayhlbCwgb3B0cykge1xuICAgIC8vIGN1cnJlbnRseSBhdmFpbGFibGUgb25seSBmb3IgaW5wdXQtbGlrZSBlbGVtZW50c1xuICAgIHJldHVybiBuZXcgSU1hc2suSW5wdXRNYXNrKGVsLCBvcHRzKTtcbiAgfVxuXG4gIC8vIFRPRE8gY2FuJ3QgdXNlIG92ZXJsb2FkcyBoZXJlIGJlY2F1c2Ugb2YgaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy81MDc1NFxuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogc3RyaW5nKTogdHlwZW9mIE1hc2tlZFBhdHRlcm47XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBEYXRlQ29uc3RydWN0b3IpOiB0eXBlb2YgTWFza2VkRGF0ZTtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE51bWJlckNvbnN0cnVjdG9yKTogdHlwZW9mIE1hc2tlZE51bWJlcjtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IEFycmF5PGFueT4gfCBBcnJheUNvbnN0cnVjdG9yKTogdHlwZW9mIE1hc2tlZER5bmFtaWM7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWREYXRlKTogdHlwZW9mIE1hc2tlZERhdGU7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWROdW1iZXIpOiB0eXBlb2YgTWFza2VkTnVtYmVyO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkRW51bSk6IHR5cGVvZiBNYXNrZWRFbnVtO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkUmFuZ2UpOiB0eXBlb2YgTWFza2VkUmFuZ2U7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWRSZWdFeHApOiB0eXBlb2YgTWFza2VkUmVnRXhwO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTWFza2VkRnVuY3Rpb24pOiB0eXBlb2YgTWFza2VkRnVuY3Rpb247XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWRQYXR0ZXJuKTogdHlwZW9mIE1hc2tlZFBhdHRlcm47XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWREeW5hbWljKTogdHlwZW9mIE1hc2tlZER5bmFtaWM7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWQpOiB0eXBlb2YgTWFza2VkO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZCk6IHR5cGVvZiBNYXNrZWQ7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkRGF0ZSk6IHR5cGVvZiBNYXNrZWREYXRlO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZE51bWJlcik6IHR5cGVvZiBNYXNrZWROdW1iZXI7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkRW51bSk6IHR5cGVvZiBNYXNrZWRFbnVtO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZFJhbmdlKTogdHlwZW9mIE1hc2tlZFJhbmdlO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZFJlZ0V4cCk6IHR5cGVvZiBNYXNrZWRSZWdFeHA7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkRnVuY3Rpb24pOiB0eXBlb2YgTWFza2VkRnVuY3Rpb247XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkUGF0dGVybik6IHR5cGVvZiBNYXNrZWRQYXR0ZXJuO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogdHlwZW9mIE1hc2tlZER5bmFtaWMpOiB0eXBlb2YgTWFza2VkRHluYW1pYztcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzPE1hc2sgZXh0ZW5kcyB0eXBlb2YgTWFza2VkPiAobWFzazogTWFzayk6IE1hc2s7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBSZWdFeHApOiB0eXBlb2YgTWFza2VkUmVnRXhwO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogKHZhbHVlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PiBib29sZWFuKTogdHlwZW9mIE1hc2tlZEZ1bmN0aW9uO1xuXG4gIC8qKiBHZXQgTWFza2VkIGNsYXNzIGJ5IG1hc2sgdHlwZSAqL1xuICBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrKSAvKiBUT0RPICove1xuICAgIGlmIChtYXNrID09IG51bGwpIHRocm93IG5ldyBFcnJvcignbWFzayBwcm9wZXJ0eSBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICAgIGlmIChtYXNrIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gSU1hc2suTWFza2VkUmVnRXhwO1xuICAgIGlmIChpc1N0cmluZyhtYXNrKSkgcmV0dXJuIElNYXNrLk1hc2tlZFBhdHRlcm47XG4gICAgaWYgKG1hc2sgPT09IERhdGUpIHJldHVybiBJTWFzay5NYXNrZWREYXRlO1xuICAgIGlmIChtYXNrID09PSBOdW1iZXIpIHJldHVybiBJTWFzay5NYXNrZWROdW1iZXI7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobWFzaykgfHwgbWFzayA9PT0gQXJyYXkpIHJldHVybiBJTWFzay5NYXNrZWREeW5hbWljO1xuICAgIGlmIChJTWFzay5NYXNrZWQgJiYgbWFzay5wcm90b3R5cGUgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWQpIHJldHVybiBtYXNrO1xuICAgIGlmIChJTWFzay5NYXNrZWQgJiYgbWFzayBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZCkgcmV0dXJuIG1hc2suY29uc3RydWN0b3I7XG4gICAgaWYgKG1hc2sgaW5zdGFuY2VvZiBGdW5jdGlvbikgcmV0dXJuIElNYXNrLk1hc2tlZEZ1bmN0aW9uO1xuICAgIGNvbnNvbGUud2FybignTWFzayBub3QgZm91bmQgZm9yIG1hc2snLCBtYXNrKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgcmV0dXJuIElNYXNrLk1hc2tlZDtcbiAgfVxuICBmdW5jdGlvbiBub3JtYWxpemVPcHRzKG9wdHMpIHtcbiAgICBpZiAoIW9wdHMpIHRocm93IG5ldyBFcnJvcignT3B0aW9ucyBpbiBub3QgZGVmaW5lZCcpO1xuICAgIGlmIChJTWFzay5NYXNrZWQpIHtcbiAgICAgIGlmIChvcHRzLnByb3RvdHlwZSBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZCkgcmV0dXJuIHtcbiAgICAgICAgbWFzazogb3B0c1xuICAgICAgfTtcblxuICAgICAgLypcbiAgICAgICAgaGFuZGxlIGNhc2VzIGxpa2U6XG4gICAgICAgIDEpIG9wdHMgPSBNYXNrZWRcbiAgICAgICAgMikgb3B0cyA9IHsgbWFzazogTWFza2VkLCAuLi5pbnN0YW5jZU9wdHMgfVxuICAgICAgKi9cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbWFzayA9IHVuZGVmaW5lZCxcbiAgICAgICAgLi4uaW5zdGFuY2VPcHRzXG4gICAgICB9ID0gb3B0cyBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZCA/IHtcbiAgICAgICAgbWFzazogb3B0c1xuICAgICAgfSA6IGlzT2JqZWN0KG9wdHMpICYmIG9wdHMubWFzayBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZCA/IG9wdHMgOiB7fTtcbiAgICAgIGlmIChtYXNrKSB7XG4gICAgICAgIGNvbnN0IF9tYXNrID0gbWFzay5tYXNrO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLnBpY2sobWFzaywgKF8sIGspID0+ICFrLnN0YXJ0c1dpdGgoJ18nKSksXG4gICAgICAgICAgbWFzazogbWFzay5jb25zdHJ1Y3RvcixcbiAgICAgICAgICBfbWFzayxcbiAgICAgICAgICAuLi5pbnN0YW5jZU9wdHNcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpc09iamVjdChvcHRzKSkgcmV0dXJuIHtcbiAgICAgIG1hc2s6IG9wdHNcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAuLi5vcHRzXG4gICAgfTtcbiAgfVxuXG4gIC8vIFRPRE8gY2FuJ3QgdXNlIG92ZXJsb2FkcyBoZXJlIGJlY2F1c2Ugb2YgaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy81MDc1NFxuXG4gIC8vIEZyb20gbWFza2VkXG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZCwgUmV0dXJuTWFza2VkPU9wdHM+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyAvLyBGcm9tIG1hc2tlZCBjbGFzc1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWQ+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWQ9SW5zdGFuY2VUeXBlPE9wdHNbJ21hc2snXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWREYXRlPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkRGF0ZT1NYXNrZWREYXRlPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZE51bWJlcj4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZE51bWJlcj1NYXNrZWROdW1iZXI8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkRW51bT4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZEVudW09TWFza2VkRW51bTxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWRSYW5nZT4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZFJhbmdlPU1hc2tlZFJhbmdlPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZFJlZ0V4cD4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZFJlZ0V4cD1NYXNrZWRSZWdFeHA8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkRnVuY3Rpb24+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRGdW5jdGlvbj1NYXNrZWRGdW5jdGlvbjxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWRQYXR0ZXJuPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkUGF0dGVybj1NYXNrZWRQYXR0ZXJuPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZER5bmFtaWM+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWREeW5hbWljPU1hc2tlZER5bmFtaWM8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gLy8gRnJvbSBtYXNrIG9wdHNcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczxNYXNrZWQ+LCBSZXR1cm5NYXNrZWQ9T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8aW5mZXIgTT4gPyBNIDogbmV2ZXI+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWROdW1iZXJPcHRpb25zLCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWROdW1iZXI9TWFza2VkTnVtYmVyPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZERhdGVGYWN0b3J5T3B0aW9ucywgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkRGF0ZT1NYXNrZWREYXRlPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZEVudW1PcHRpb25zLCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRFbnVtPU1hc2tlZEVudW08T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkUmFuZ2VPcHRpb25zLCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRSYW5nZT1NYXNrZWRSYW5nZTxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRQYXR0ZXJuT3B0aW9ucywgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkUGF0dGVybj1NYXNrZWRQYXR0ZXJuPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZER5bmFtaWNPcHRpb25zLCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWREeW5hbWljPU1hc2tlZER5bmFtaWM8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczxSZWdFeHA+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRSZWdFeHA9TWFza2VkUmVnRXhwPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8RnVuY3Rpb24+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRGdW5jdGlvbj1NYXNrZWRGdW5jdGlvbjxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuXG4gIC8qKiBDcmVhdGVzIG5ldyB7QGxpbmsgTWFza2VkfSBkZXBlbmRpbmcgb24gbWFzayB0eXBlICovXG4gIGZ1bmN0aW9uIGNyZWF0ZU1hc2sob3B0cykge1xuICAgIGlmIChJTWFzay5NYXNrZWQgJiYgb3B0cyBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZCkgcmV0dXJuIG9wdHM7XG4gICAgY29uc3Qgbk9wdHMgPSBub3JtYWxpemVPcHRzKG9wdHMpO1xuICAgIGNvbnN0IE1hc2tlZENsYXNzID0gbWFza2VkQ2xhc3Mobk9wdHMubWFzayk7XG4gICAgaWYgKCFNYXNrZWRDbGFzcykgdGhyb3cgbmV3IEVycm9yKFwiTWFza2VkIGNsYXNzIGlzIG5vdCBmb3VuZCBmb3IgcHJvdmlkZWQgbWFzayBcIiArIG5PcHRzLm1hc2sgKyBcIiwgYXBwcm9wcmlhdGUgbW9kdWxlIG5lZWRzIHRvIGJlIGltcG9ydGVkIG1hbnVhbGx5IGJlZm9yZSBjcmVhdGluZyBtYXNrLlwiKTtcbiAgICBpZiAobk9wdHMubWFzayA9PT0gTWFza2VkQ2xhc3MpIGRlbGV0ZSBuT3B0cy5tYXNrO1xuICAgIGlmIChuT3B0cy5fbWFzaykge1xuICAgICAgbk9wdHMubWFzayA9IG5PcHRzLl9tYXNrO1xuICAgICAgZGVsZXRlIG5PcHRzLl9tYXNrO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IE1hc2tlZENsYXNzKG5PcHRzKTtcbiAgfVxuICBJTWFzay5jcmVhdGVNYXNrID0gY3JlYXRlTWFzaztcblxuICAvKiogIEdlbmVyaWMgZWxlbWVudCBBUEkgdG8gdXNlIHdpdGggbWFzayAqL1xuICBjbGFzcyBNYXNrRWxlbWVudCB7XG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqIFNhZmVseSByZXR1cm5zIHNlbGVjdGlvbiBzdGFydCAqL1xuICAgIGdldCBzZWxlY3Rpb25TdGFydCgpIHtcbiAgICAgIGxldCBzdGFydDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHN0YXJ0ID0gdGhpcy5fdW5zYWZlU2VsZWN0aW9uU3RhcnQ7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICByZXR1cm4gc3RhcnQgIT0gbnVsbCA/IHN0YXJ0IDogdGhpcy52YWx1ZS5sZW5ndGg7XG4gICAgfVxuXG4gICAgLyoqIFNhZmVseSByZXR1cm5zIHNlbGVjdGlvbiBlbmQgKi9cbiAgICBnZXQgc2VsZWN0aW9uRW5kKCkge1xuICAgICAgbGV0IGVuZDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGVuZCA9IHRoaXMuX3Vuc2FmZVNlbGVjdGlvbkVuZDtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIHJldHVybiBlbmQgIT0gbnVsbCA/IGVuZCA6IHRoaXMudmFsdWUubGVuZ3RoO1xuICAgIH1cblxuICAgIC8qKiBTYWZlbHkgc2V0cyBlbGVtZW50IHNlbGVjdGlvbiAqL1xuICAgIHNlbGVjdChzdGFydCwgZW5kKSB7XG4gICAgICBpZiAoc3RhcnQgPT0gbnVsbCB8fCBlbmQgPT0gbnVsbCB8fCBzdGFydCA9PT0gdGhpcy5zZWxlY3Rpb25TdGFydCAmJiBlbmQgPT09IHRoaXMuc2VsZWN0aW9uRW5kKSByZXR1cm47XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLl91bnNhZmVTZWxlY3Qoc3RhcnQsIGVuZCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfVxuXG4gICAgLyoqICovXG4gICAgZ2V0IGlzQWN0aXZlKCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG4gIH1cbiAgSU1hc2suTWFza0VsZW1lbnQgPSBNYXNrRWxlbWVudDtcblxuICBjb25zdCBLRVlfWiA9IDkwO1xuICBjb25zdCBLRVlfWSA9IDg5O1xuXG4gIC8qKiBCcmlkZ2UgYmV0d2VlbiBIVE1MRWxlbWVudCBhbmQge0BsaW5rIE1hc2tlZH0gKi9cbiAgY2xhc3MgSFRNTE1hc2tFbGVtZW50IGV4dGVuZHMgTWFza0VsZW1lbnQge1xuICAgIC8qKiBIVE1MRWxlbWVudCB0byB1c2UgbWFzayBvbiAqL1xuXG4gICAgY29uc3RydWN0b3IoaW5wdXQpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gICAgICB0aGlzLl9vbktleWRvd24gPSB0aGlzLl9vbktleWRvd24uYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uSW5wdXQgPSB0aGlzLl9vbklucHV0LmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vbkJlZm9yZWlucHV0ID0gdGhpcy5fb25CZWZvcmVpbnB1dC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25Db21wb3NpdGlvbkVuZCA9IHRoaXMuX29uQ29tcG9zaXRpb25FbmQuYmluZCh0aGlzKTtcbiAgICB9XG4gICAgZ2V0IHJvb3RFbGVtZW50KCkge1xuICAgICAgdmFyIF90aGlzJGlucHV0JGdldFJvb3RObywgX3RoaXMkaW5wdXQkZ2V0Um9vdE5vMiwgX3RoaXMkaW5wdXQ7XG4gICAgICByZXR1cm4gKF90aGlzJGlucHV0JGdldFJvb3RObyA9IChfdGhpcyRpbnB1dCRnZXRSb290Tm8yID0gKF90aGlzJGlucHV0ID0gdGhpcy5pbnB1dCkuZ2V0Um9vdE5vZGUpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRpbnB1dCRnZXRSb290Tm8yLmNhbGwoX3RoaXMkaW5wdXQpKSAhPSBudWxsID8gX3RoaXMkaW5wdXQkZ2V0Um9vdE5vIDogZG9jdW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqIElzIGVsZW1lbnQgaW4gZm9jdXMgKi9cbiAgICBnZXQgaXNBY3RpdmUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnB1dCA9PT0gdGhpcy5yb290RWxlbWVudC5hY3RpdmVFbGVtZW50O1xuICAgIH1cblxuICAgIC8qKiBCaW5kcyBIVE1MRWxlbWVudCBldmVudHMgdG8gbWFzayBpbnRlcm5hbCBldmVudHMgKi9cbiAgICBiaW5kRXZlbnRzKGhhbmRsZXJzKSB7XG4gICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleWRvd24pO1xuICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHRoaXMuX29uSW5wdXQpO1xuICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdiZWZvcmVpbnB1dCcsIHRoaXMuX29uQmVmb3JlaW5wdXQpO1xuICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjb21wb3NpdGlvbmVuZCcsIHRoaXMuX29uQ29tcG9zaXRpb25FbmQpO1xuICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgaGFuZGxlcnMuZHJvcCk7XG4gICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlcnMuY2xpY2spO1xuICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIGhhbmRsZXJzLmZvY3VzKTtcbiAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGhhbmRsZXJzLmNvbW1pdCk7XG4gICAgICB0aGlzLl9oYW5kbGVycyA9IGhhbmRsZXJzO1xuICAgIH1cbiAgICBfb25LZXlkb3duKGUpIHtcbiAgICAgIGlmICh0aGlzLl9oYW5kbGVycy5yZWRvICYmIChlLmtleUNvZGUgPT09IEtFWV9aICYmIGUuc2hpZnRLZXkgJiYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkpIHx8IGUua2V5Q29kZSA9PT0gS0VZX1kgJiYgZS5jdHJsS2V5KSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVycy5yZWRvKGUpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2hhbmRsZXJzLnVuZG8gJiYgZS5rZXlDb2RlID09PSBLRVlfWiAmJiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSkpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlcnMudW5kbyhlKTtcbiAgICAgIH1cbiAgICAgIGlmICghZS5pc0NvbXBvc2luZykgdGhpcy5faGFuZGxlcnMuc2VsZWN0aW9uQ2hhbmdlKGUpO1xuICAgIH1cbiAgICBfb25CZWZvcmVpbnB1dChlKSB7XG4gICAgICBpZiAoZS5pbnB1dFR5cGUgPT09ICdoaXN0b3J5VW5kbycgJiYgdGhpcy5faGFuZGxlcnMudW5kbykge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVycy51bmRvKGUpO1xuICAgICAgfVxuICAgICAgaWYgKGUuaW5wdXRUeXBlID09PSAnaGlzdG9yeVJlZG8nICYmIHRoaXMuX2hhbmRsZXJzLnJlZG8pIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlcnMucmVkbyhlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgX29uQ29tcG9zaXRpb25FbmQoZSkge1xuICAgICAgdGhpcy5faGFuZGxlcnMuaW5wdXQoZSk7XG4gICAgfVxuICAgIF9vbklucHV0KGUpIHtcbiAgICAgIGlmICghZS5pc0NvbXBvc2luZykgdGhpcy5faGFuZGxlcnMuaW5wdXQoZSk7XG4gICAgfVxuXG4gICAgLyoqIFVuYmluZHMgSFRNTEVsZW1lbnQgZXZlbnRzIHRvIG1hc2sgaW50ZXJuYWwgZXZlbnRzICovXG4gICAgdW5iaW5kRXZlbnRzKCkge1xuICAgICAgdGhpcy5pbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fb25LZXlkb3duKTtcbiAgICAgIHRoaXMuaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB0aGlzLl9vbklucHV0KTtcbiAgICAgIHRoaXMuaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmVmb3JlaW5wdXQnLCB0aGlzLl9vbkJlZm9yZWlucHV0KTtcbiAgICAgIHRoaXMuaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25lbmQnLCB0aGlzLl9vbkNvbXBvc2l0aW9uRW5kKTtcbiAgICAgIHRoaXMuaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMuX2hhbmRsZXJzLmRyb3ApO1xuICAgICAgdGhpcy5pbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2hhbmRsZXJzLmNsaWNrKTtcbiAgICAgIHRoaXMuaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCB0aGlzLl9oYW5kbGVycy5mb2N1cyk7XG4gICAgICB0aGlzLmlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl9oYW5kbGVycy5jb21taXQpO1xuICAgICAgdGhpcy5faGFuZGxlcnMgPSB7fTtcbiAgICB9XG4gIH1cbiAgSU1hc2suSFRNTE1hc2tFbGVtZW50ID0gSFRNTE1hc2tFbGVtZW50O1xuXG4gIC8qKiBCcmlkZ2UgYmV0d2VlbiBJbnB1dEVsZW1lbnQgYW5kIHtAbGluayBNYXNrZWR9ICovXG4gIGNsYXNzIEhUTUxJbnB1dE1hc2tFbGVtZW50IGV4dGVuZHMgSFRNTE1hc2tFbGVtZW50IHtcbiAgICAvKiogSW5wdXRFbGVtZW50IHRvIHVzZSBtYXNrIG9uICovXG5cbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgc3VwZXIoaW5wdXQpO1xuICAgICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIElucHV0RWxlbWVudCBzZWxlY3Rpb24gc3RhcnQgKi9cbiAgICBnZXQgX3Vuc2FmZVNlbGVjdGlvblN0YXJ0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5wdXQuc2VsZWN0aW9uU3RhcnQgIT0gbnVsbCA/IHRoaXMuaW5wdXQuc2VsZWN0aW9uU3RhcnQgOiB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJucyBJbnB1dEVsZW1lbnQgc2VsZWN0aW9uIGVuZCAqL1xuICAgIGdldCBfdW5zYWZlU2VsZWN0aW9uRW5kKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5wdXQuc2VsZWN0aW9uRW5kO1xuICAgIH1cblxuICAgIC8qKiBTZXRzIElucHV0RWxlbWVudCBzZWxlY3Rpb24gKi9cbiAgICBfdW5zYWZlU2VsZWN0KHN0YXJ0LCBlbmQpIHtcbiAgICAgIHRoaXMuaW5wdXQuc2V0U2VsZWN0aW9uUmFuZ2Uoc3RhcnQsIGVuZCk7XG4gICAgfVxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlucHV0LnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgIHRoaXMuaW5wdXQudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgSU1hc2suSFRNTE1hc2tFbGVtZW50ID0gSFRNTE1hc2tFbGVtZW50O1xuXG4gIGNsYXNzIEhUTUxDb250ZW50ZWRpdGFibGVNYXNrRWxlbWVudCBleHRlbmRzIEhUTUxNYXNrRWxlbWVudCB7XG4gICAgLyoqIFJldHVybnMgSFRNTEVsZW1lbnQgc2VsZWN0aW9uIHN0YXJ0ICovXG4gICAgZ2V0IF91bnNhZmVTZWxlY3Rpb25TdGFydCgpIHtcbiAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcm9vdC5nZXRTZWxlY3Rpb24gJiYgcm9vdC5nZXRTZWxlY3Rpb24oKTtcbiAgICAgIGNvbnN0IGFuY2hvck9mZnNldCA9IHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24uYW5jaG9yT2Zmc2V0O1xuICAgICAgY29uc3QgZm9jdXNPZmZzZXQgPSBzZWxlY3Rpb24gJiYgc2VsZWN0aW9uLmZvY3VzT2Zmc2V0O1xuICAgICAgaWYgKGZvY3VzT2Zmc2V0ID09IG51bGwgfHwgYW5jaG9yT2Zmc2V0ID09IG51bGwgfHwgYW5jaG9yT2Zmc2V0IDwgZm9jdXNPZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIGFuY2hvck9mZnNldDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmb2N1c09mZnNldDtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJucyBIVE1MRWxlbWVudCBzZWxlY3Rpb24gZW5kICovXG4gICAgZ2V0IF91bnNhZmVTZWxlY3Rpb25FbmQoKSB7XG4gICAgICBjb25zdCByb290ID0gdGhpcy5yb290RWxlbWVudDtcbiAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHJvb3QuZ2V0U2VsZWN0aW9uICYmIHJvb3QuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICBjb25zdCBhbmNob3JPZmZzZXQgPSBzZWxlY3Rpb24gJiYgc2VsZWN0aW9uLmFuY2hvck9mZnNldDtcbiAgICAgIGNvbnN0IGZvY3VzT2Zmc2V0ID0gc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5mb2N1c09mZnNldDtcbiAgICAgIGlmIChmb2N1c09mZnNldCA9PSBudWxsIHx8IGFuY2hvck9mZnNldCA9PSBudWxsIHx8IGFuY2hvck9mZnNldCA+IGZvY3VzT2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiBhbmNob3JPZmZzZXQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm9jdXNPZmZzZXQ7XG4gICAgfVxuXG4gICAgLyoqIFNldHMgSFRNTEVsZW1lbnQgc2VsZWN0aW9uICovXG4gICAgX3Vuc2FmZVNlbGVjdChzdGFydCwgZW5kKSB7XG4gICAgICBpZiAoIXRoaXMucm9vdEVsZW1lbnQuY3JlYXRlUmFuZ2UpIHJldHVybjtcbiAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy5yb290RWxlbWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgcmFuZ2Uuc2V0U3RhcnQodGhpcy5pbnB1dC5maXJzdENoaWxkIHx8IHRoaXMuaW5wdXQsIHN0YXJ0KTtcbiAgICAgIHJhbmdlLnNldEVuZCh0aGlzLmlucHV0Lmxhc3RDaGlsZCB8fCB0aGlzLmlucHV0LCBlbmQpO1xuICAgICAgY29uc3Qgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgICBjb25zdCBzZWxlY3Rpb24gPSByb290LmdldFNlbGVjdGlvbiAmJiByb290LmdldFNlbGVjdGlvbigpO1xuICAgICAgaWYgKHNlbGVjdGlvbikge1xuICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqIEhUTUxFbGVtZW50IHZhbHVlICovXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5wdXQudGV4dENvbnRlbnQgfHwgJyc7XG4gICAgfVxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgdGhpcy5pbnB1dC50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICBJTWFzay5IVE1MQ29udGVudGVkaXRhYmxlTWFza0VsZW1lbnQgPSBIVE1MQ29udGVudGVkaXRhYmxlTWFza0VsZW1lbnQ7XG5cbiAgY2xhc3MgSW5wdXRIaXN0b3J5IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHRoaXMuc3RhdGVzID0gW107XG4gICAgICB0aGlzLmN1cnJlbnRJbmRleCA9IDA7XG4gICAgfVxuICAgIGdldCBjdXJyZW50U3RhdGUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGF0ZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuICAgIH1cbiAgICBnZXQgaXNFbXB0eSgpIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXRlcy5sZW5ndGggPT09IDA7XG4gICAgfVxuICAgIHB1c2goc3RhdGUpIHtcbiAgICAgIC8vIGlmIGN1cnJlbnQgaW5kZXggcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBlbGVtZW50IHRoZW4gcmVtb3ZlIHRoZSBmdXR1cmVcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCA8IHRoaXMuc3RhdGVzLmxlbmd0aCAtIDEpIHRoaXMuc3RhdGVzLmxlbmd0aCA9IHRoaXMuY3VycmVudEluZGV4ICsgMTtcbiAgICAgIHRoaXMuc3RhdGVzLnB1c2goc3RhdGUpO1xuICAgICAgaWYgKHRoaXMuc3RhdGVzLmxlbmd0aCA+IElucHV0SGlzdG9yeS5NQVhfTEVOR1RIKSB0aGlzLnN0YXRlcy5zaGlmdCgpO1xuICAgICAgdGhpcy5jdXJyZW50SW5kZXggPSB0aGlzLnN0YXRlcy5sZW5ndGggLSAxO1xuICAgIH1cbiAgICBnbyhzdGVwcykge1xuICAgICAgdGhpcy5jdXJyZW50SW5kZXggPSBNYXRoLm1pbihNYXRoLm1heCh0aGlzLmN1cnJlbnRJbmRleCArIHN0ZXBzLCAwKSwgdGhpcy5zdGF0ZXMubGVuZ3RoIC0gMSk7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50U3RhdGU7XG4gICAgfVxuICAgIHVuZG8oKSB7XG4gICAgICByZXR1cm4gdGhpcy5nbygtMSk7XG4gICAgfVxuICAgIHJlZG8oKSB7XG4gICAgICByZXR1cm4gdGhpcy5nbygrMSk7XG4gICAgfVxuICAgIGNsZWFyKCkge1xuICAgICAgdGhpcy5zdGF0ZXMubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMuY3VycmVudEluZGV4ID0gMDtcbiAgICB9XG4gIH1cbiAgSW5wdXRIaXN0b3J5Lk1BWF9MRU5HVEggPSAxMDA7XG5cbiAgLyoqIExpc3RlbnMgdG8gZWxlbWVudCBldmVudHMgYW5kIGNvbnRyb2xzIGNoYW5nZXMgYmV0d2VlbiBlbGVtZW50IGFuZCB7QGxpbmsgTWFza2VkfSAqL1xuICBjbGFzcyBJbnB1dE1hc2sge1xuICAgIC8qKlxuICAgICAgVmlldyBlbGVtZW50XG4gICAgKi9cblxuICAgIC8qKiBJbnRlcm5hbCB7QGxpbmsgTWFza2VkfSBtb2RlbCAqL1xuXG4gICAgY29uc3RydWN0b3IoZWwsIG9wdHMpIHtcbiAgICAgIHRoaXMuZWwgPSBlbCBpbnN0YW5jZW9mIE1hc2tFbGVtZW50ID8gZWwgOiBlbC5pc0NvbnRlbnRFZGl0YWJsZSAmJiBlbC50YWdOYW1lICE9PSAnSU5QVVQnICYmIGVsLnRhZ05hbWUgIT09ICdURVhUQVJFQScgPyBuZXcgSFRNTENvbnRlbnRlZGl0YWJsZU1hc2tFbGVtZW50KGVsKSA6IG5ldyBIVE1MSW5wdXRNYXNrRWxlbWVudChlbCk7XG4gICAgICB0aGlzLm1hc2tlZCA9IGNyZWF0ZU1hc2sob3B0cyk7XG4gICAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gJyc7XG4gICAgICB0aGlzLl91bm1hc2tlZFZhbHVlID0gJyc7XG4gICAgICB0aGlzLl9yYXdJbnB1dFZhbHVlID0gJyc7XG4gICAgICB0aGlzLmhpc3RvcnkgPSBuZXcgSW5wdXRIaXN0b3J5KCk7XG4gICAgICB0aGlzLl9zYXZlU2VsZWN0aW9uID0gdGhpcy5fc2F2ZVNlbGVjdGlvbi5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25JbnB1dCA9IHRoaXMuX29uSW5wdXQuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uQ2hhbmdlID0gdGhpcy5fb25DaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uRHJvcCA9IHRoaXMuX29uRHJvcC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25Gb2N1cyA9IHRoaXMuX29uRm9jdXMuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uQ2xpY2sgPSB0aGlzLl9vbkNsaWNrLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vblVuZG8gPSB0aGlzLl9vblVuZG8uYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uUmVkbyA9IHRoaXMuX29uUmVkby5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5hbGlnbkN1cnNvciA9IHRoaXMuYWxpZ25DdXJzb3IuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuYWxpZ25DdXJzb3JGcmllbmRseSA9IHRoaXMuYWxpZ25DdXJzb3JGcmllbmRseS5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fYmluZEV2ZW50cygpO1xuXG4gICAgICAvLyByZWZyZXNoXG4gICAgICB0aGlzLnVwZGF0ZVZhbHVlKCk7XG4gICAgICB0aGlzLl9vbkNoYW5nZSgpO1xuICAgIH1cbiAgICBtYXNrRXF1YWxzKG1hc2spIHtcbiAgICAgIHZhciBfdGhpcyRtYXNrZWQ7XG4gICAgICByZXR1cm4gbWFzayA9PSBudWxsIHx8ICgoX3RoaXMkbWFza2VkID0gdGhpcy5tYXNrZWQpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRtYXNrZWQubWFza0VxdWFscyhtYXNrKSk7XG4gICAgfVxuXG4gICAgLyoqIE1hc2tlZCAqL1xuICAgIGdldCBtYXNrKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLm1hc2s7XG4gICAgfVxuICAgIHNldCBtYXNrKG1hc2spIHtcbiAgICAgIGlmICh0aGlzLm1hc2tFcXVhbHMobWFzaykpIHJldHVybjtcbiAgICAgIGlmICghKG1hc2sgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWQpICYmIHRoaXMubWFza2VkLmNvbnN0cnVjdG9yID09PSBtYXNrZWRDbGFzcyhtYXNrKSkge1xuICAgICAgICAvLyBUT0RPIFwiYW55XCIgbm8gaWRlYVxuICAgICAgICB0aGlzLm1hc2tlZC51cGRhdGVPcHRpb25zKHtcbiAgICAgICAgICBtYXNrXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBtYXNrZWQgPSBtYXNrIGluc3RhbmNlb2YgSU1hc2suTWFza2VkID8gbWFzayA6IGNyZWF0ZU1hc2soe1xuICAgICAgICBtYXNrXG4gICAgICB9KTtcbiAgICAgIG1hc2tlZC51bm1hc2tlZFZhbHVlID0gdGhpcy5tYXNrZWQudW5tYXNrZWRWYWx1ZTtcbiAgICAgIHRoaXMubWFza2VkID0gbWFza2VkO1xuICAgIH1cblxuICAgIC8qKiBSYXcgdmFsdWUgKi9cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZShzdHIpIHtcbiAgICAgIGlmICh0aGlzLnZhbHVlID09PSBzdHIpIHJldHVybjtcbiAgICAgIHRoaXMubWFza2VkLnZhbHVlID0gc3RyO1xuICAgICAgdGhpcy51cGRhdGVDb250cm9sKCdhdXRvJyk7XG4gICAgfVxuXG4gICAgLyoqIFVubWFza2VkIHZhbHVlICovXG4gICAgZ2V0IHVubWFza2VkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdW5tYXNrZWRWYWx1ZTtcbiAgICB9XG4gICAgc2V0IHVubWFza2VkVmFsdWUoc3RyKSB7XG4gICAgICBpZiAodGhpcy51bm1hc2tlZFZhbHVlID09PSBzdHIpIHJldHVybjtcbiAgICAgIHRoaXMubWFza2VkLnVubWFza2VkVmFsdWUgPSBzdHI7XG4gICAgICB0aGlzLnVwZGF0ZUNvbnRyb2woJ2F1dG8nKTtcbiAgICB9XG5cbiAgICAvKiogUmF3IGlucHV0IHZhbHVlICovXG4gICAgZ2V0IHJhd0lucHV0VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmF3SW5wdXRWYWx1ZTtcbiAgICB9XG4gICAgc2V0IHJhd0lucHV0VmFsdWUoc3RyKSB7XG4gICAgICBpZiAodGhpcy5yYXdJbnB1dFZhbHVlID09PSBzdHIpIHJldHVybjtcbiAgICAgIHRoaXMubWFza2VkLnJhd0lucHV0VmFsdWUgPSBzdHI7XG4gICAgICB0aGlzLnVwZGF0ZUNvbnRyb2woKTtcbiAgICAgIHRoaXMuYWxpZ25DdXJzb3IoKTtcbiAgICB9XG5cbiAgICAvKiogVHlwZWQgdW5tYXNrZWQgdmFsdWUgKi9cbiAgICBnZXQgdHlwZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC50eXBlZFZhbHVlO1xuICAgIH1cbiAgICBzZXQgdHlwZWRWYWx1ZSh2YWwpIHtcbiAgICAgIGlmICh0aGlzLm1hc2tlZC50eXBlZFZhbHVlRXF1YWxzKHZhbCkpIHJldHVybjtcbiAgICAgIHRoaXMubWFza2VkLnR5cGVkVmFsdWUgPSB2YWw7XG4gICAgICB0aGlzLnVwZGF0ZUNvbnRyb2woJ2F1dG8nKTtcbiAgICB9XG5cbiAgICAvKiogRGlzcGxheSB2YWx1ZSAqL1xuICAgIGdldCBkaXNwbGF5VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQuZGlzcGxheVZhbHVlO1xuICAgIH1cblxuICAgIC8qKiBTdGFydHMgbGlzdGVuaW5nIHRvIGVsZW1lbnQgZXZlbnRzICovXG4gICAgX2JpbmRFdmVudHMoKSB7XG4gICAgICB0aGlzLmVsLmJpbmRFdmVudHMoe1xuICAgICAgICBzZWxlY3Rpb25DaGFuZ2U6IHRoaXMuX3NhdmVTZWxlY3Rpb24sXG4gICAgICAgIGlucHV0OiB0aGlzLl9vbklucHV0LFxuICAgICAgICBkcm9wOiB0aGlzLl9vbkRyb3AsXG4gICAgICAgIGNsaWNrOiB0aGlzLl9vbkNsaWNrLFxuICAgICAgICBmb2N1czogdGhpcy5fb25Gb2N1cyxcbiAgICAgICAgY29tbWl0OiB0aGlzLl9vbkNoYW5nZSxcbiAgICAgICAgdW5kbzogdGhpcy5fb25VbmRvLFxuICAgICAgICByZWRvOiB0aGlzLl9vblJlZG9cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKiBTdG9wcyBsaXN0ZW5pbmcgdG8gZWxlbWVudCBldmVudHMgKi9cbiAgICBfdW5iaW5kRXZlbnRzKCkge1xuICAgICAgaWYgKHRoaXMuZWwpIHRoaXMuZWwudW5iaW5kRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgLyoqIEZpcmVzIGN1c3RvbSBldmVudCAqL1xuICAgIF9maXJlRXZlbnQoZXYsIGUpIHtcbiAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVyc1tldl07XG4gICAgICBpZiAoIWxpc3RlbmVycykgcmV0dXJuO1xuICAgICAgbGlzdGVuZXJzLmZvckVhY2gobCA9PiBsKGUpKTtcbiAgICB9XG5cbiAgICAvKiogQ3VycmVudCBzZWxlY3Rpb24gc3RhcnQgKi9cbiAgICBnZXQgc2VsZWN0aW9uU3RhcnQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY3Vyc29yQ2hhbmdpbmcgPyB0aGlzLl9jaGFuZ2luZ0N1cnNvclBvcyA6IHRoaXMuZWwuc2VsZWN0aW9uU3RhcnQ7XG4gICAgfVxuXG4gICAgLyoqIEN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uICovXG4gICAgZ2V0IGN1cnNvclBvcygpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jdXJzb3JDaGFuZ2luZyA/IHRoaXMuX2NoYW5naW5nQ3Vyc29yUG9zIDogdGhpcy5lbC5zZWxlY3Rpb25FbmQ7XG4gICAgfVxuICAgIHNldCBjdXJzb3JQb3MocG9zKSB7XG4gICAgICBpZiAoIXRoaXMuZWwgfHwgIXRoaXMuZWwuaXNBY3RpdmUpIHJldHVybjtcbiAgICAgIHRoaXMuZWwuc2VsZWN0KHBvcywgcG9zKTtcbiAgICAgIHRoaXMuX3NhdmVTZWxlY3Rpb24oKTtcbiAgICB9XG5cbiAgICAvKiogU3RvcmVzIGN1cnJlbnQgc2VsZWN0aW9uICovXG4gICAgX3NhdmVTZWxlY3Rpb24oIC8qIGV2ICovXG4gICAgKSB7XG4gICAgICBpZiAodGhpcy5kaXNwbGF5VmFsdWUgIT09IHRoaXMuZWwudmFsdWUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdFbGVtZW50IHZhbHVlIHdhcyBjaGFuZ2VkIG91dHNpZGUgb2YgbWFzay4gU3luY3Jvbml6ZSBtYXNrIHVzaW5nIGBtYXNrLnVwZGF0ZVZhbHVlKClgIHRvIHdvcmsgcHJvcGVybHkuJyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuICAgICAgfVxuICAgICAgdGhpcy5fc2VsZWN0aW9uID0ge1xuICAgICAgICBzdGFydDogdGhpcy5zZWxlY3Rpb25TdGFydCxcbiAgICAgICAgZW5kOiB0aGlzLmN1cnNvclBvc1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKiogU3luY3Jvbml6ZXMgbW9kZWwgdmFsdWUgZnJvbSB2aWV3ICovXG4gICAgdXBkYXRlVmFsdWUoKSB7XG4gICAgICB0aGlzLm1hc2tlZC52YWx1ZSA9IHRoaXMuZWwudmFsdWU7XG4gICAgICB0aGlzLl92YWx1ZSA9IHRoaXMubWFza2VkLnZhbHVlO1xuICAgICAgdGhpcy5fdW5tYXNrZWRWYWx1ZSA9IHRoaXMubWFza2VkLnVubWFza2VkVmFsdWU7XG4gICAgICB0aGlzLl9yYXdJbnB1dFZhbHVlID0gdGhpcy5tYXNrZWQucmF3SW5wdXRWYWx1ZTtcbiAgICB9XG5cbiAgICAvKiogU3luY3Jvbml6ZXMgdmlldyBmcm9tIG1vZGVsIHZhbHVlLCBmaXJlcyBjaGFuZ2UgZXZlbnRzICovXG4gICAgdXBkYXRlQ29udHJvbChjdXJzb3JQb3MpIHtcbiAgICAgIGNvbnN0IG5ld1VubWFza2VkVmFsdWUgPSB0aGlzLm1hc2tlZC51bm1hc2tlZFZhbHVlO1xuICAgICAgY29uc3QgbmV3VmFsdWUgPSB0aGlzLm1hc2tlZC52YWx1ZTtcbiAgICAgIGNvbnN0IG5ld1Jhd0lucHV0VmFsdWUgPSB0aGlzLm1hc2tlZC5yYXdJbnB1dFZhbHVlO1xuICAgICAgY29uc3QgbmV3RGlzcGxheVZhbHVlID0gdGhpcy5kaXNwbGF5VmFsdWU7XG4gICAgICBjb25zdCBpc0NoYW5nZWQgPSB0aGlzLnVubWFza2VkVmFsdWUgIT09IG5ld1VubWFza2VkVmFsdWUgfHwgdGhpcy52YWx1ZSAhPT0gbmV3VmFsdWUgfHwgdGhpcy5fcmF3SW5wdXRWYWx1ZSAhPT0gbmV3UmF3SW5wdXRWYWx1ZTtcbiAgICAgIHRoaXMuX3VubWFza2VkVmFsdWUgPSBuZXdVbm1hc2tlZFZhbHVlO1xuICAgICAgdGhpcy5fdmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgIHRoaXMuX3Jhd0lucHV0VmFsdWUgPSBuZXdSYXdJbnB1dFZhbHVlO1xuICAgICAgaWYgKHRoaXMuZWwudmFsdWUgIT09IG5ld0Rpc3BsYXlWYWx1ZSkgdGhpcy5lbC52YWx1ZSA9IG5ld0Rpc3BsYXlWYWx1ZTtcbiAgICAgIGlmIChjdXJzb3JQb3MgPT09ICdhdXRvJykgdGhpcy5hbGlnbkN1cnNvcigpO2Vsc2UgaWYgKGN1cnNvclBvcyAhPSBudWxsKSB0aGlzLmN1cnNvclBvcyA9IGN1cnNvclBvcztcbiAgICAgIGlmIChpc0NoYW5nZWQpIHRoaXMuX2ZpcmVDaGFuZ2VFdmVudHMoKTtcbiAgICAgIGlmICghdGhpcy5faGlzdG9yeUNoYW5naW5nICYmIChpc0NoYW5nZWQgfHwgdGhpcy5oaXN0b3J5LmlzRW1wdHkpKSB0aGlzLmhpc3RvcnkucHVzaCh7XG4gICAgICAgIHVubWFza2VkVmFsdWU6IG5ld1VubWFza2VkVmFsdWUsXG4gICAgICAgIHNlbGVjdGlvbjoge1xuICAgICAgICAgIHN0YXJ0OiB0aGlzLnNlbGVjdGlvblN0YXJ0LFxuICAgICAgICAgIGVuZDogdGhpcy5jdXJzb3JQb3NcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqIFVwZGF0ZXMgb3B0aW9ucyB3aXRoIGRlZXAgZXF1YWwgY2hlY2ssIHJlY3JlYXRlcyB7QGxpbmsgTWFza2VkfSBtb2RlbCBpZiBtYXNrIHR5cGUgY2hhbmdlcyAqL1xuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBtYXNrLFxuICAgICAgICAuLi5yZXN0T3B0c1xuICAgICAgfSA9IG9wdHM7IC8vIFRPRE8gdHlwZXMsIHllcywgbWFzayBpcyBvcHRpb25hbFxuXG4gICAgICBjb25zdCB1cGRhdGVNYXNrID0gIXRoaXMubWFza0VxdWFscyhtYXNrKTtcbiAgICAgIGNvbnN0IHVwZGF0ZU9wdHMgPSB0aGlzLm1hc2tlZC5vcHRpb25zSXNDaGFuZ2VkKHJlc3RPcHRzKTtcbiAgICAgIGlmICh1cGRhdGVNYXNrKSB0aGlzLm1hc2sgPSBtYXNrO1xuICAgICAgaWYgKHVwZGF0ZU9wdHMpIHRoaXMubWFza2VkLnVwZGF0ZU9wdGlvbnMocmVzdE9wdHMpOyAvLyBUT0RPXG5cbiAgICAgIGlmICh1cGRhdGVNYXNrIHx8IHVwZGF0ZU9wdHMpIHRoaXMudXBkYXRlQ29udHJvbCgpO1xuICAgIH1cblxuICAgIC8qKiBVcGRhdGVzIGN1cnNvciAqL1xuICAgIHVwZGF0ZUN1cnNvcihjdXJzb3JQb3MpIHtcbiAgICAgIGlmIChjdXJzb3JQb3MgPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgdGhpcy5jdXJzb3JQb3MgPSBjdXJzb3JQb3M7XG5cbiAgICAgIC8vIGFsc28gcXVldWUgY2hhbmdlIGN1cnNvciBmb3IgbW9iaWxlIGJyb3dzZXJzXG4gICAgICB0aGlzLl9kZWxheVVwZGF0ZUN1cnNvcihjdXJzb3JQb3MpO1xuICAgIH1cblxuICAgIC8qKiBEZWxheXMgY3Vyc29yIHVwZGF0ZSB0byBzdXBwb3J0IG1vYmlsZSBicm93c2VycyAqL1xuICAgIF9kZWxheVVwZGF0ZUN1cnNvcihjdXJzb3JQb3MpIHtcbiAgICAgIHRoaXMuX2Fib3J0VXBkYXRlQ3Vyc29yKCk7XG4gICAgICB0aGlzLl9jaGFuZ2luZ0N1cnNvclBvcyA9IGN1cnNvclBvcztcbiAgICAgIHRoaXMuX2N1cnNvckNoYW5naW5nID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5lbCkgcmV0dXJuOyAvLyBpZiB3YXMgZGVzdHJveWVkXG4gICAgICAgIHRoaXMuY3Vyc29yUG9zID0gdGhpcy5fY2hhbmdpbmdDdXJzb3JQb3M7XG4gICAgICAgIHRoaXMuX2Fib3J0VXBkYXRlQ3Vyc29yKCk7XG4gICAgICB9LCAxMCk7XG4gICAgfVxuXG4gICAgLyoqIEZpcmVzIGN1c3RvbSBldmVudHMgKi9cbiAgICBfZmlyZUNoYW5nZUV2ZW50cygpIHtcbiAgICAgIHRoaXMuX2ZpcmVFdmVudCgnYWNjZXB0JywgdGhpcy5faW5wdXRFdmVudCk7XG4gICAgICBpZiAodGhpcy5tYXNrZWQuaXNDb21wbGV0ZSkgdGhpcy5fZmlyZUV2ZW50KCdjb21wbGV0ZScsIHRoaXMuX2lucHV0RXZlbnQpO1xuICAgIH1cblxuICAgIC8qKiBBYm9ydHMgZGVsYXllZCBjdXJzb3IgdXBkYXRlICovXG4gICAgX2Fib3J0VXBkYXRlQ3Vyc29yKCkge1xuICAgICAgaWYgKHRoaXMuX2N1cnNvckNoYW5naW5nKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9jdXJzb3JDaGFuZ2luZyk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9jdXJzb3JDaGFuZ2luZztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQWxpZ25zIGN1cnNvciB0byBuZWFyZXN0IGF2YWlsYWJsZSBwb3NpdGlvbiAqL1xuICAgIGFsaWduQ3Vyc29yKCkge1xuICAgICAgdGhpcy5jdXJzb3JQb3MgPSB0aGlzLm1hc2tlZC5uZWFyZXN0SW5wdXRQb3ModGhpcy5tYXNrZWQubmVhcmVzdElucHV0UG9zKHRoaXMuY3Vyc29yUG9zLCBESVJFQ1RJT04uTEVGVCkpO1xuICAgIH1cblxuICAgIC8qKiBBbGlnbnMgY3Vyc29yIG9ubHkgaWYgc2VsZWN0aW9uIGlzIGVtcHR5ICovXG4gICAgYWxpZ25DdXJzb3JGcmllbmRseSgpIHtcbiAgICAgIGlmICh0aGlzLnNlbGVjdGlvblN0YXJ0ICE9PSB0aGlzLmN1cnNvclBvcykgcmV0dXJuOyAvLyBza2lwIGlmIHJhbmdlIGlzIHNlbGVjdGVkXG4gICAgICB0aGlzLmFsaWduQ3Vyc29yKCk7XG4gICAgfVxuXG4gICAgLyoqIEFkZHMgbGlzdGVuZXIgb24gY3VzdG9tIGV2ZW50ICovXG4gICAgb24oZXYsIGhhbmRsZXIpIHtcbiAgICAgIGlmICghdGhpcy5fbGlzdGVuZXJzW2V2XSkgdGhpcy5fbGlzdGVuZXJzW2V2XSA9IFtdO1xuICAgICAgdGhpcy5fbGlzdGVuZXJzW2V2XS5wdXNoKGhhbmRsZXIpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIFJlbW92ZXMgY3VzdG9tIGV2ZW50IGxpc3RlbmVyICovXG4gICAgb2ZmKGV2LCBoYW5kbGVyKSB7XG4gICAgICBpZiAoIXRoaXMuX2xpc3RlbmVyc1tldl0pIHJldHVybiB0aGlzO1xuICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9saXN0ZW5lcnNbZXZdO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGhJbmRleCA9IHRoaXMuX2xpc3RlbmVyc1tldl0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICAgIGlmIChoSW5kZXggPj0gMCkgdGhpcy5fbGlzdGVuZXJzW2V2XS5zcGxpY2UoaEluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKiBIYW5kbGVzIHZpZXcgaW5wdXQgZXZlbnQgKi9cbiAgICBfb25JbnB1dChlKSB7XG4gICAgICB0aGlzLl9pbnB1dEV2ZW50ID0gZTtcbiAgICAgIHRoaXMuX2Fib3J0VXBkYXRlQ3Vyc29yKCk7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IEFjdGlvbkRldGFpbHMoe1xuICAgICAgICAvLyBuZXcgc3RhdGVcbiAgICAgICAgdmFsdWU6IHRoaXMuZWwudmFsdWUsXG4gICAgICAgIGN1cnNvclBvczogdGhpcy5jdXJzb3JQb3MsXG4gICAgICAgIC8vIG9sZCBzdGF0ZVxuICAgICAgICBvbGRWYWx1ZTogdGhpcy5kaXNwbGF5VmFsdWUsXG4gICAgICAgIG9sZFNlbGVjdGlvbjogdGhpcy5fc2VsZWN0aW9uXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IG9sZFJhd1ZhbHVlID0gdGhpcy5tYXNrZWQucmF3SW5wdXRWYWx1ZTtcbiAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMubWFza2VkLnNwbGljZShkZXRhaWxzLnN0YXJ0Q2hhbmdlUG9zLCBkZXRhaWxzLnJlbW92ZWQubGVuZ3RoLCBkZXRhaWxzLmluc2VydGVkLCBkZXRhaWxzLnJlbW92ZURpcmVjdGlvbiwge1xuICAgICAgICBpbnB1dDogdHJ1ZSxcbiAgICAgICAgcmF3OiB0cnVlXG4gICAgICB9KS5vZmZzZXQ7XG5cbiAgICAgIC8vIGZvcmNlIGFsaWduIGluIHJlbW92ZSBkaXJlY3Rpb24gb25seSBpZiBubyBpbnB1dCBjaGFycyB3ZXJlIHJlbW92ZWRcbiAgICAgIC8vIG90aGVyd2lzZSB3ZSBzdGlsbCBuZWVkIHRvIGFsaWduIHdpdGggTk9ORSAodG8gZ2V0IG91dCBmcm9tIGZpeGVkIHN5bWJvbHMgZm9yIGluc3RhbmNlKVxuICAgICAgY29uc3QgcmVtb3ZlRGlyZWN0aW9uID0gb2xkUmF3VmFsdWUgPT09IHRoaXMubWFza2VkLnJhd0lucHV0VmFsdWUgPyBkZXRhaWxzLnJlbW92ZURpcmVjdGlvbiA6IERJUkVDVElPTi5OT05FO1xuICAgICAgbGV0IGN1cnNvclBvcyA9IHRoaXMubWFza2VkLm5lYXJlc3RJbnB1dFBvcyhkZXRhaWxzLnN0YXJ0Q2hhbmdlUG9zICsgb2Zmc2V0LCByZW1vdmVEaXJlY3Rpb24pO1xuICAgICAgaWYgKHJlbW92ZURpcmVjdGlvbiAhPT0gRElSRUNUSU9OLk5PTkUpIGN1cnNvclBvcyA9IHRoaXMubWFza2VkLm5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIERJUkVDVElPTi5OT05FKTtcbiAgICAgIHRoaXMudXBkYXRlQ29udHJvbChjdXJzb3JQb3MpO1xuICAgICAgZGVsZXRlIHRoaXMuX2lucHV0RXZlbnQ7XG4gICAgfVxuXG4gICAgLyoqIEhhbmRsZXMgdmlldyBjaGFuZ2UgZXZlbnQgYW5kIGNvbW1pdHMgbW9kZWwgdmFsdWUgKi9cbiAgICBfb25DaGFuZ2UoKSB7XG4gICAgICBpZiAodGhpcy5kaXNwbGF5VmFsdWUgIT09IHRoaXMuZWwudmFsdWUpIHRoaXMudXBkYXRlVmFsdWUoKTtcbiAgICAgIHRoaXMubWFza2VkLmRvQ29tbWl0KCk7XG4gICAgICB0aGlzLnVwZGF0ZUNvbnRyb2woKTtcbiAgICAgIHRoaXMuX3NhdmVTZWxlY3Rpb24oKTtcbiAgICB9XG5cbiAgICAvKiogSGFuZGxlcyB2aWV3IGRyb3AgZXZlbnQsIHByZXZlbnRzIGJ5IGRlZmF1bHQgKi9cbiAgICBfb25Ecm9wKGV2KSB7XG4gICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgLyoqIFJlc3RvcmUgbGFzdCBzZWxlY3Rpb24gb24gZm9jdXMgKi9cbiAgICBfb25Gb2N1cyhldikge1xuICAgICAgdGhpcy5hbGlnbkN1cnNvckZyaWVuZGx5KCk7XG4gICAgfVxuXG4gICAgLyoqIFJlc3RvcmUgbGFzdCBzZWxlY3Rpb24gb24gZm9jdXMgKi9cbiAgICBfb25DbGljayhldikge1xuICAgICAgdGhpcy5hbGlnbkN1cnNvckZyaWVuZGx5KCk7XG4gICAgfVxuICAgIF9vblVuZG8oKSB7XG4gICAgICB0aGlzLl9hcHBseUhpc3RvcnlTdGF0ZSh0aGlzLmhpc3RvcnkudW5kbygpKTtcbiAgICB9XG4gICAgX29uUmVkbygpIHtcbiAgICAgIHRoaXMuX2FwcGx5SGlzdG9yeVN0YXRlKHRoaXMuaGlzdG9yeS5yZWRvKCkpO1xuICAgIH1cbiAgICBfYXBwbHlIaXN0b3J5U3RhdGUoc3RhdGUpIHtcbiAgICAgIGlmICghc3RhdGUpIHJldHVybjtcbiAgICAgIHRoaXMuX2hpc3RvcnlDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnVubWFza2VkVmFsdWUgPSBzdGF0ZS51bm1hc2tlZFZhbHVlO1xuICAgICAgdGhpcy5lbC5zZWxlY3Qoc3RhdGUuc2VsZWN0aW9uLnN0YXJ0LCBzdGF0ZS5zZWxlY3Rpb24uZW5kKTtcbiAgICAgIHRoaXMuX3NhdmVTZWxlY3Rpb24oKTtcbiAgICAgIHRoaXMuX2hpc3RvcnlDaGFuZ2luZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKiBVbmJpbmQgdmlldyBldmVudHMgYW5kIHJlbW92ZXMgZWxlbWVudCByZWZlcmVuY2UgKi9cbiAgICBkZXN0cm95KCkge1xuICAgICAgdGhpcy5fdW5iaW5kRXZlbnRzKCk7XG4gICAgICB0aGlzLl9saXN0ZW5lcnMubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLmVsO1xuICAgIH1cbiAgfVxuICBJTWFzay5JbnB1dE1hc2sgPSBJbnB1dE1hc2s7XG5cbiAgLyoqIFByb3ZpZGVzIGRldGFpbHMgb2YgY2hhbmdpbmcgbW9kZWwgdmFsdWUgKi9cbiAgY2xhc3MgQ2hhbmdlRGV0YWlscyB7XG4gICAgLyoqIEluc2VydGVkIHN5bWJvbHMgKi9cblxuICAgIC8qKiBBZGRpdGlvbmFsIG9mZnNldCBpZiBhbnkgY2hhbmdlcyBvY2N1cnJlZCBiZWZvcmUgdGFpbCAqL1xuXG4gICAgLyoqIFJhdyBpbnNlcnRlZCBpcyB1c2VkIGJ5IGR5bmFtaWMgbWFzayAqL1xuXG4gICAgLyoqIENhbiBza2lwIGNoYXJzICovXG5cbiAgICBzdGF0aWMgbm9ybWFsaXplKHByZXApIHtcbiAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHByZXApID8gcHJlcCA6IFtwcmVwLCBuZXcgQ2hhbmdlRGV0YWlscygpXTtcbiAgICB9XG4gICAgY29uc3RydWN0b3IoZGV0YWlscykge1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCB7XG4gICAgICAgIGluc2VydGVkOiAnJyxcbiAgICAgICAgcmF3SW5zZXJ0ZWQ6ICcnLFxuICAgICAgICB0YWlsU2hpZnQ6IDAsXG4gICAgICAgIHNraXA6IGZhbHNlXG4gICAgICB9LCBkZXRhaWxzKTtcbiAgICB9XG5cbiAgICAvKiogQWdncmVnYXRlIGNoYW5nZXMgKi9cbiAgICBhZ2dyZWdhdGUoZGV0YWlscykge1xuICAgICAgdGhpcy5pbnNlcnRlZCArPSBkZXRhaWxzLmluc2VydGVkO1xuICAgICAgdGhpcy5yYXdJbnNlcnRlZCArPSBkZXRhaWxzLnJhd0luc2VydGVkO1xuICAgICAgdGhpcy50YWlsU2hpZnQgKz0gZGV0YWlscy50YWlsU2hpZnQ7XG4gICAgICB0aGlzLnNraXAgPSB0aGlzLnNraXAgfHwgZGV0YWlscy5za2lwO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIFRvdGFsIG9mZnNldCBjb25zaWRlcmluZyBhbGwgY2hhbmdlcyAqL1xuICAgIGdldCBvZmZzZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy50YWlsU2hpZnQgKyB0aGlzLmluc2VydGVkLmxlbmd0aDtcbiAgICB9XG4gICAgZ2V0IGNvbnN1bWVkKCkge1xuICAgICAgcmV0dXJuIEJvb2xlYW4odGhpcy5yYXdJbnNlcnRlZCkgfHwgdGhpcy5za2lwO1xuICAgIH1cbiAgICBlcXVhbHMoZGV0YWlscykge1xuICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0ZWQgPT09IGRldGFpbHMuaW5zZXJ0ZWQgJiYgdGhpcy50YWlsU2hpZnQgPT09IGRldGFpbHMudGFpbFNoaWZ0ICYmIHRoaXMucmF3SW5zZXJ0ZWQgPT09IGRldGFpbHMucmF3SW5zZXJ0ZWQgJiYgdGhpcy5za2lwID09PSBkZXRhaWxzLnNraXA7XG4gICAgfVxuICB9XG4gIElNYXNrLkNoYW5nZURldGFpbHMgPSBDaGFuZ2VEZXRhaWxzO1xuXG4gIC8qKiBQcm92aWRlcyBkZXRhaWxzIG9mIGNvbnRpbnVvdXMgZXh0cmFjdGVkIHRhaWwgKi9cbiAgY2xhc3MgQ29udGludW91c1RhaWxEZXRhaWxzIHtcbiAgICAvKiogVGFpbCB2YWx1ZSBhcyBzdHJpbmcgKi9cblxuICAgIC8qKiBUYWlsIHN0YXJ0IHBvc2l0aW9uICovXG5cbiAgICAvKiogU3RhcnQgcG9zaXRpb24gKi9cblxuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBmcm9tLCBzdG9wKSB7XG4gICAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkge1xuICAgICAgICB2YWx1ZSA9ICcnO1xuICAgICAgfVxuICAgICAgaWYgKGZyb20gPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tID0gMDtcbiAgICAgIH1cbiAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgICB0aGlzLnN0b3AgPSBzdG9wO1xuICAgIH1cbiAgICB0b1N0cmluZygpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbiAgICBleHRlbmQodGFpbCkge1xuICAgICAgdGhpcy52YWx1ZSArPSBTdHJpbmcodGFpbCk7XG4gICAgfVxuICAgIGFwcGVuZFRvKG1hc2tlZCkge1xuICAgICAgcmV0dXJuIG1hc2tlZC5hcHBlbmQodGhpcy50b1N0cmluZygpLCB7XG4gICAgICAgIHRhaWw6IHRydWVcbiAgICAgIH0pLmFnZ3JlZ2F0ZShtYXNrZWQuX2FwcGVuZFBsYWNlaG9sZGVyKCkpO1xuICAgIH1cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdGhpcy52YWx1ZSxcbiAgICAgICAgZnJvbTogdGhpcy5mcm9tLFxuICAgICAgICBzdG9wOiB0aGlzLnN0b3BcbiAgICAgIH07XG4gICAgfVxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBzdGF0ZSk7XG4gICAgfVxuICAgIHVuc2hpZnQoYmVmb3JlUG9zKSB7XG4gICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoIHx8IGJlZm9yZVBvcyAhPSBudWxsICYmIHRoaXMuZnJvbSA+PSBiZWZvcmVQb3MpIHJldHVybiAnJztcbiAgICAgIGNvbnN0IHNoaWZ0Q2hhciA9IHRoaXMudmFsdWVbMF07XG4gICAgICB0aGlzLnZhbHVlID0gdGhpcy52YWx1ZS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBzaGlmdENoYXI7XG4gICAgfVxuICAgIHNoaWZ0KCkge1xuICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aCkgcmV0dXJuICcnO1xuICAgICAgY29uc3Qgc2hpZnRDaGFyID0gdGhpcy52YWx1ZVt0aGlzLnZhbHVlLmxlbmd0aCAtIDFdO1xuICAgICAgdGhpcy52YWx1ZSA9IHRoaXMudmFsdWUuc2xpY2UoMCwgLTEpO1xuICAgICAgcmV0dXJuIHNoaWZ0Q2hhcjtcbiAgICB9XG4gIH1cblxuICAvKiogQXBwZW5kIGZsYWdzICovXG5cbiAgLyoqIEV4dHJhY3QgZmxhZ3MgKi9cblxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy82MjIzXG5cbiAgLyoqIFByb3ZpZGVzIGNvbW1vbiBtYXNraW5nIHN0dWZmICovXG4gIGNsYXNzIE1hc2tlZCB7XG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiBUcmFuc2Zvcm1zIHZhbHVlIGJlZm9yZSBtYXNrIHByb2Nlc3NpbmcgKi9cblxuICAgIC8qKiBUcmFuc2Zvcm1zIGVhY2ggY2hhciBiZWZvcmUgbWFzayBwcm9jZXNzaW5nICovXG5cbiAgICAvKiogVmFsaWRhdGVzIGlmIHZhbHVlIGlzIGFjY2VwdGFibGUgKi9cblxuICAgIC8qKiBEb2VzIGFkZGl0aW9uYWwgcHJvY2Vzc2luZyBhdCB0aGUgZW5kIG9mIGVkaXRpbmcgKi9cblxuICAgIC8qKiBGb3JtYXQgdHlwZWQgdmFsdWUgdG8gc3RyaW5nICovXG5cbiAgICAvKiogUGFyc2Ugc3RyaW5nIHRvIGdldCB0eXBlZCB2YWx1ZSAqL1xuXG4gICAgLyoqIEVuYWJsZSBjaGFyYWN0ZXJzIG92ZXJ3cml0aW5nICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIHRoaXMuX3ZhbHVlID0gJyc7XG4gICAgICB0aGlzLl91cGRhdGUoe1xuICAgICAgICAuLi5NYXNrZWQuREVGQVVMVFMsXG4gICAgICAgIC4uLm9wdHNcbiAgICAgIH0pO1xuICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8qKiBTZXRzIGFuZCBhcHBsaWVzIG5ldyBvcHRpb25zICovXG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBpZiAoIXRoaXMub3B0aW9uc0lzQ2hhbmdlZChvcHRzKSkgcmV0dXJuO1xuICAgICAgdGhpcy53aXRoVmFsdWVSZWZyZXNoKHRoaXMuX3VwZGF0ZS5iaW5kKHRoaXMsIG9wdHMpKTtcbiAgICB9XG5cbiAgICAvKiogU2V0cyBuZXcgb3B0aW9ucyAqL1xuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBvcHRzKTtcbiAgICB9XG5cbiAgICAvKiogTWFzayBzdGF0ZSAqL1xuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIF92YWx1ZTogdGhpcy52YWx1ZSxcbiAgICAgICAgX3Jhd0lucHV0VmFsdWU6IHRoaXMucmF3SW5wdXRWYWx1ZVxuICAgICAgfTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHN0YXRlKSB7XG4gICAgICB0aGlzLl92YWx1ZSA9IHN0YXRlLl92YWx1ZTtcbiAgICB9XG5cbiAgICAvKiogUmVzZXRzIHZhbHVlICovXG4gICAgcmVzZXQoKSB7XG4gICAgICB0aGlzLl92YWx1ZSA9ICcnO1xuICAgIH1cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgdGhpcy5yZXNvbHZlKHZhbHVlLCB7XG4gICAgICAgIGlucHV0OiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKiogUmVzb2x2ZSBuZXcgdmFsdWUgKi9cbiAgICByZXNvbHZlKHZhbHVlLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7XG4gICAgICAgICAgaW5wdXQ6IHRydWVcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgIHRoaXMuYXBwZW5kKHZhbHVlLCBmbGFncywgJycpO1xuICAgICAgdGhpcy5kb0NvbW1pdCgpO1xuICAgIH1cbiAgICBnZXQgdW5tYXNrZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbiAgICBzZXQgdW5tYXNrZWRWYWx1ZSh2YWx1ZSkge1xuICAgICAgdGhpcy5yZXNvbHZlKHZhbHVlLCB7fSk7XG4gICAgfVxuICAgIGdldCB0eXBlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2UgPyB0aGlzLnBhcnNlKHRoaXMudmFsdWUsIHRoaXMpIDogdGhpcy51bm1hc2tlZFZhbHVlO1xuICAgIH1cbiAgICBzZXQgdHlwZWRWYWx1ZSh2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZm9ybWF0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmZvcm1hdCh2YWx1ZSwgdGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVubWFza2VkVmFsdWUgPSBTdHJpbmcodmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBWYWx1ZSB0aGF0IGluY2x1ZGVzIHJhdyB1c2VyIGlucHV0ICovXG4gICAgZ2V0IHJhd0lucHV0VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHRyYWN0SW5wdXQoMCwgdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoLCB7XG4gICAgICAgIHJhdzogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHNldCByYXdJbnB1dFZhbHVlKHZhbHVlKSB7XG4gICAgICB0aGlzLnJlc29sdmUodmFsdWUsIHtcbiAgICAgICAgcmF3OiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgZ2V0IGRpc3BsYXlWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbiAgICBnZXQgaXNDb21wbGV0ZSgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBnZXQgaXNGaWxsZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pc0NvbXBsZXRlO1xuICAgIH1cblxuICAgIC8qKiBGaW5kcyBuZWFyZXN0IGlucHV0IHBvc2l0aW9uIGluIGRpcmVjdGlvbiAqL1xuICAgIG5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIGRpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIGN1cnNvclBvcztcbiAgICB9XG4gICAgdG90YWxJbnB1dFBvc2l0aW9ucyhmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIE1hdGgubWluKHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCwgdG9Qb3MgLSBmcm9tUG9zKTtcbiAgICB9XG5cbiAgICAvKiogRXh0cmFjdHMgdmFsdWUgaW4gcmFuZ2UgY29uc2lkZXJpbmcgZmxhZ3MgKi9cbiAgICBleHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUuc2xpY2UoZnJvbVBvcywgdG9Qb3MpO1xuICAgIH1cblxuICAgIC8qKiBFeHRyYWN0cyB0YWlsIGluIHJhbmdlICovXG4gICAgZXh0cmFjdFRhaWwoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKHRoaXMuZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zKSwgZnJvbVBvcyk7XG4gICAgfVxuXG4gICAgLyoqIEFwcGVuZHMgdGFpbCAqL1xuICAgIGFwcGVuZFRhaWwodGFpbCkge1xuICAgICAgaWYgKGlzU3RyaW5nKHRhaWwpKSB0YWlsID0gbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscyhTdHJpbmcodGFpbCkpO1xuICAgICAgcmV0dXJuIHRhaWwuYXBwZW5kVG8odGhpcyk7XG4gICAgfVxuXG4gICAgLyoqIEFwcGVuZHMgY2hhciAqL1xuICAgIF9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykge1xuICAgICAgaWYgKCFjaCkgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICB0aGlzLl92YWx1ZSArPSBjaDtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscyh7XG4gICAgICAgIGluc2VydGVkOiBjaCxcbiAgICAgICAgcmF3SW5zZXJ0ZWQ6IGNoXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKiogQXBwZW5kcyBjaGFyICovXG4gICAgX2FwcGVuZENoYXIoY2gsIGZsYWdzLCBjaGVja1RhaWwpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBjb25zdCBjb25zaXN0ZW50U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgbGV0IGRldGFpbHM7XG4gICAgICBbY2gsIGRldGFpbHNdID0gdGhpcy5kb1ByZXBhcmVDaGFyKGNoLCBmbGFncyk7XG4gICAgICBpZiAoY2gpIHtcbiAgICAgICAgZGV0YWlscyA9IGRldGFpbHMuYWdncmVnYXRlKHRoaXMuX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSk7XG5cbiAgICAgICAgLy8gVE9ETyBoYW5kbGUgYHNraXBgP1xuXG4gICAgICAgIC8vIHRyeSBgYXV0b2ZpeGAgbG9va2FoZWFkXG4gICAgICAgIGlmICghZGV0YWlscy5yYXdJbnNlcnRlZCAmJiB0aGlzLmF1dG9maXggPT09ICdwYWQnKSB7XG4gICAgICAgICAgY29uc3Qgbm9GaXhTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgICAgdGhpcy5zdGF0ZSA9IGNvbnNpc3RlbnRTdGF0ZTtcbiAgICAgICAgICBsZXQgZml4RGV0YWlscyA9IHRoaXMucGFkKGZsYWdzKTtcbiAgICAgICAgICBjb25zdCBjaERldGFpbHMgPSB0aGlzLl9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncyk7XG4gICAgICAgICAgZml4RGV0YWlscyA9IGZpeERldGFpbHMuYWdncmVnYXRlKGNoRGV0YWlscyk7XG5cbiAgICAgICAgICAvLyBpZiBmaXggd2FzIGFwcGxpZWQgb3JcbiAgICAgICAgICAvLyBpZiBkZXRhaWxzIGFyZSBlcXVhbCB1c2Ugc2tpcCByZXN0b3Jpbmcgc3RhdGUgb3B0aW1pemF0aW9uXG4gICAgICAgICAgaWYgKGNoRGV0YWlscy5yYXdJbnNlcnRlZCB8fCBmaXhEZXRhaWxzLmVxdWFscyhkZXRhaWxzKSkge1xuICAgICAgICAgICAgZGV0YWlscyA9IGZpeERldGFpbHM7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBub0ZpeFN0YXRlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGRldGFpbHMuaW5zZXJ0ZWQpIHtcbiAgICAgICAgbGV0IGNvbnNpc3RlbnRUYWlsO1xuICAgICAgICBsZXQgYXBwZW5kZWQgPSB0aGlzLmRvVmFsaWRhdGUoZmxhZ3MpICE9PSBmYWxzZTtcbiAgICAgICAgaWYgKGFwcGVuZGVkICYmIGNoZWNrVGFpbCAhPSBudWxsKSB7XG4gICAgICAgICAgLy8gdmFsaWRhdGlvbiBvaywgY2hlY2sgdGFpbFxuICAgICAgICAgIGNvbnN0IGJlZm9yZVRhaWxTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgICAgaWYgKHRoaXMub3ZlcndyaXRlID09PSB0cnVlKSB7XG4gICAgICAgICAgICBjb25zaXN0ZW50VGFpbCA9IGNoZWNrVGFpbC5zdGF0ZTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGV0YWlscy5yYXdJbnNlcnRlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICBjaGVja1RhaWwudW5zaGlmdCh0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGggLSBkZXRhaWxzLnRhaWxTaGlmdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCB0YWlsRGV0YWlscyA9IHRoaXMuYXBwZW5kVGFpbChjaGVja1RhaWwpO1xuICAgICAgICAgIGFwcGVuZGVkID0gdGFpbERldGFpbHMucmF3SW5zZXJ0ZWQubGVuZ3RoID09PSBjaGVja1RhaWwudG9TdHJpbmcoKS5sZW5ndGg7XG5cbiAgICAgICAgICAvLyBub3Qgb2ssIHRyeSBzaGlmdFxuICAgICAgICAgIGlmICghKGFwcGVuZGVkICYmIHRhaWxEZXRhaWxzLmluc2VydGVkKSAmJiB0aGlzLm92ZXJ3cml0ZSA9PT0gJ3NoaWZ0Jykge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IGJlZm9yZVRhaWxTdGF0ZTtcbiAgICAgICAgICAgIGNvbnNpc3RlbnRUYWlsID0gY2hlY2tUYWlsLnN0YXRlO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXRhaWxzLnJhd0luc2VydGVkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIGNoZWNrVGFpbC5zaGlmdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFpbERldGFpbHMgPSB0aGlzLmFwcGVuZFRhaWwoY2hlY2tUYWlsKTtcbiAgICAgICAgICAgIGFwcGVuZGVkID0gdGFpbERldGFpbHMucmF3SW5zZXJ0ZWQubGVuZ3RoID09PSBjaGVja1RhaWwudG9TdHJpbmcoKS5sZW5ndGg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gaWYgb2ssIHJvbGxiYWNrIHN0YXRlIGFmdGVyIHRhaWxcbiAgICAgICAgICBpZiAoYXBwZW5kZWQgJiYgdGFpbERldGFpbHMuaW5zZXJ0ZWQpIHRoaXMuc3RhdGUgPSBiZWZvcmVUYWlsU3RhdGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXZlcnQgYWxsIGlmIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICAgIGlmICghYXBwZW5kZWQpIHtcbiAgICAgICAgICBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gY29uc2lzdGVudFN0YXRlO1xuICAgICAgICAgIGlmIChjaGVja1RhaWwgJiYgY29uc2lzdGVudFRhaWwpIGNoZWNrVGFpbC5zdGF0ZSA9IGNvbnNpc3RlbnRUYWlsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG5cbiAgICAvKiogQXBwZW5kcyBvcHRpb25hbCBwbGFjZWhvbGRlciBhdCB0aGUgZW5kICovXG4gICAgX2FwcGVuZFBsYWNlaG9sZGVyKCkge1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgfVxuXG4gICAgLyoqIEFwcGVuZHMgb3B0aW9uYWwgZWFnZXIgcGxhY2Vob2xkZXIgYXQgdGhlIGVuZCAqL1xuICAgIF9hcHBlbmRFYWdlcigpIHtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgIH1cblxuICAgIC8qKiBBcHBlbmRzIHN5bWJvbHMgY29uc2lkZXJpbmcgZmxhZ3MgKi9cbiAgICBhcHBlbmQoc3RyLCBmbGFncywgdGFpbCkge1xuICAgICAgaWYgKCFpc1N0cmluZyhzdHIpKSB0aHJvdyBuZXcgRXJyb3IoJ3ZhbHVlIHNob3VsZCBiZSBzdHJpbmcnKTtcbiAgICAgIGNvbnN0IGNoZWNrVGFpbCA9IGlzU3RyaW5nKHRhaWwpID8gbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscyhTdHJpbmcodGFpbCkpIDogdGFpbDtcbiAgICAgIGlmIChmbGFncyAhPSBudWxsICYmIGZsYWdzLnRhaWwpIGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgbGV0IGRldGFpbHM7XG4gICAgICBbc3RyLCBkZXRhaWxzXSA9IHRoaXMuZG9QcmVwYXJlKHN0ciwgZmxhZ3MpO1xuICAgICAgZm9yIChsZXQgY2kgPSAwOyBjaSA8IHN0ci5sZW5ndGg7ICsrY2kpIHtcbiAgICAgICAgY29uc3QgZCA9IHRoaXMuX2FwcGVuZENoYXIoc3RyW2NpXSwgZmxhZ3MsIGNoZWNrVGFpbCk7XG4gICAgICAgIGlmICghZC5yYXdJbnNlcnRlZCAmJiAhdGhpcy5kb1NraXBJbnZhbGlkKHN0cltjaV0sIGZsYWdzLCBjaGVja1RhaWwpKSBicmVhaztcbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUoZCk7XG4gICAgICB9XG4gICAgICBpZiAoKHRoaXMuZWFnZXIgPT09IHRydWUgfHwgdGhpcy5lYWdlciA9PT0gJ2FwcGVuZCcpICYmIGZsYWdzICE9IG51bGwgJiYgZmxhZ3MuaW5wdXQgJiYgc3RyKSB7XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuX2FwcGVuZEVhZ2VyKCkpO1xuICAgICAgfVxuXG4gICAgICAvLyBhcHBlbmQgdGFpbCBidXQgYWdncmVnYXRlIG9ubHkgdGFpbFNoaWZ0XG4gICAgICBpZiAoY2hlY2tUYWlsICE9IG51bGwpIHtcbiAgICAgICAgZGV0YWlscy50YWlsU2hpZnQgKz0gdGhpcy5hcHBlbmRUYWlsKGNoZWNrVGFpbCkudGFpbFNoaWZ0O1xuICAgICAgICAvLyBUT0RPIGl0J3MgYSBnb29kIGlkZWEgdG8gY2xlYXIgc3RhdGUgYWZ0ZXIgYXBwZW5kaW5nIGVuZHNcbiAgICAgICAgLy8gYnV0IGl0IGNhdXNlcyBidWdzIHdoZW4gb25lIGFwcGVuZCBjYWxscyBhbm90aGVyICh3aGVuIGR5bmFtaWMgZGlzcGF0Y2ggc2V0IHJhd0lucHV0VmFsdWUpXG4gICAgICAgIC8vIHRoaXMuX3Jlc2V0QmVmb3JlVGFpbFN0YXRlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgcmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuZGlzcGxheVZhbHVlLnNsaWNlKDAsIGZyb21Qb3MpICsgdGhpcy5kaXNwbGF5VmFsdWUuc2xpY2UodG9Qb3MpO1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgfVxuXG4gICAgLyoqIENhbGxzIGZ1bmN0aW9uIGFuZCByZWFwcGxpZXMgY3VycmVudCB2YWx1ZSAqL1xuICAgIHdpdGhWYWx1ZVJlZnJlc2goZm4pIHtcbiAgICAgIGlmICh0aGlzLl9yZWZyZXNoaW5nIHx8ICF0aGlzLl9pbml0aWFsaXplZCkgcmV0dXJuIGZuKCk7XG4gICAgICB0aGlzLl9yZWZyZXNoaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnN0IHJhd0lucHV0ID0gdGhpcy5yYXdJbnB1dFZhbHVlO1xuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLnZhbHVlO1xuICAgICAgY29uc3QgcmV0ID0gZm4oKTtcbiAgICAgIHRoaXMucmF3SW5wdXRWYWx1ZSA9IHJhd0lucHV0O1xuICAgICAgLy8gYXBwZW5kIGxvc3QgdHJhaWxpbmcgY2hhcnMgYXQgdGhlIGVuZFxuICAgICAgaWYgKHRoaXMudmFsdWUgJiYgdGhpcy52YWx1ZSAhPT0gdmFsdWUgJiYgdmFsdWUuaW5kZXhPZih0aGlzLnZhbHVlKSA9PT0gMCkge1xuICAgICAgICB0aGlzLmFwcGVuZCh2YWx1ZS5zbGljZSh0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgpLCB7fSwgJycpO1xuICAgICAgICB0aGlzLmRvQ29tbWl0KCk7XG4gICAgICB9XG4gICAgICBkZWxldGUgdGhpcy5fcmVmcmVzaGluZztcbiAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIHJ1bklzb2xhdGVkKGZuKSB7XG4gICAgICBpZiAodGhpcy5faXNvbGF0ZWQgfHwgIXRoaXMuX2luaXRpYWxpemVkKSByZXR1cm4gZm4odGhpcyk7XG4gICAgICB0aGlzLl9pc29sYXRlZCA9IHRydWU7XG4gICAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICBjb25zdCByZXQgPSBmbih0aGlzKTtcbiAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICAgIGRlbGV0ZSB0aGlzLl9pc29sYXRlZDtcbiAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIGRvU2tpcEludmFsaWQoY2gsIGZsYWdzLCBjaGVja1RhaWwpIHtcbiAgICAgIHJldHVybiBCb29sZWFuKHRoaXMuc2tpcEludmFsaWQpO1xuICAgIH1cblxuICAgIC8qKiBQcmVwYXJlcyBzdHJpbmcgYmVmb3JlIG1hc2sgcHJvY2Vzc2luZyAqL1xuICAgIGRvUHJlcGFyZShzdHIsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIENoYW5nZURldGFpbHMubm9ybWFsaXplKHRoaXMucHJlcGFyZSA/IHRoaXMucHJlcGFyZShzdHIsIHRoaXMsIGZsYWdzKSA6IHN0cik7XG4gICAgfVxuXG4gICAgLyoqIFByZXBhcmVzIGVhY2ggY2hhciBiZWZvcmUgbWFzayBwcm9jZXNzaW5nICovXG4gICAgZG9QcmVwYXJlQ2hhcihzdHIsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIENoYW5nZURldGFpbHMubm9ybWFsaXplKHRoaXMucHJlcGFyZUNoYXIgPyB0aGlzLnByZXBhcmVDaGFyKHN0ciwgdGhpcywgZmxhZ3MpIDogc3RyKTtcbiAgICB9XG5cbiAgICAvKiogVmFsaWRhdGVzIGlmIHZhbHVlIGlzIGFjY2VwdGFibGUgKi9cbiAgICBkb1ZhbGlkYXRlKGZsYWdzKSB7XG4gICAgICByZXR1cm4gKCF0aGlzLnZhbGlkYXRlIHx8IHRoaXMudmFsaWRhdGUodGhpcy52YWx1ZSwgdGhpcywgZmxhZ3MpKSAmJiAoIXRoaXMucGFyZW50IHx8IHRoaXMucGFyZW50LmRvVmFsaWRhdGUoZmxhZ3MpKTtcbiAgICB9XG5cbiAgICAvKiogRG9lcyBhZGRpdGlvbmFsIHByb2Nlc3NpbmcgYXQgdGhlIGVuZCBvZiBlZGl0aW5nICovXG4gICAgZG9Db21taXQoKSB7XG4gICAgICBpZiAodGhpcy5jb21taXQpIHRoaXMuY29tbWl0KHRoaXMudmFsdWUsIHRoaXMpO1xuICAgIH1cbiAgICBzcGxpY2Uoc3RhcnQsIGRlbGV0ZUNvdW50LCBpbnNlcnRlZCwgcmVtb3ZlRGlyZWN0aW9uLCBmbGFncykge1xuICAgICAgaWYgKGluc2VydGVkID09PSB2b2lkIDApIHtcbiAgICAgICAgaW5zZXJ0ZWQgPSAnJztcbiAgICAgIH1cbiAgICAgIGlmIChyZW1vdmVEaXJlY3Rpb24gPT09IHZvaWQgMCkge1xuICAgICAgICByZW1vdmVEaXJlY3Rpb24gPSBESVJFQ1RJT04uTk9ORTtcbiAgICAgIH1cbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge1xuICAgICAgICAgIGlucHV0OiB0cnVlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCB0YWlsUG9zID0gc3RhcnQgKyBkZWxldGVDb3VudDtcbiAgICAgIGNvbnN0IHRhaWwgPSB0aGlzLmV4dHJhY3RUYWlsKHRhaWxQb3MpO1xuICAgICAgY29uc3QgZWFnZXJSZW1vdmUgPSB0aGlzLmVhZ2VyID09PSB0cnVlIHx8IHRoaXMuZWFnZXIgPT09ICdyZW1vdmUnO1xuICAgICAgbGV0IG9sZFJhd1ZhbHVlO1xuICAgICAgaWYgKGVhZ2VyUmVtb3ZlKSB7XG4gICAgICAgIHJlbW92ZURpcmVjdGlvbiA9IGZvcmNlRGlyZWN0aW9uKHJlbW92ZURpcmVjdGlvbik7XG4gICAgICAgIG9sZFJhd1ZhbHVlID0gdGhpcy5leHRyYWN0SW5wdXQoMCwgdGFpbFBvcywge1xuICAgICAgICAgIHJhdzogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGxldCBzdGFydENoYW5nZVBvcyA9IHN0YXJ0O1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG5cbiAgICAgIC8vIGlmIGl0IGlzIGp1c3QgZGVsZXRpb24gd2l0aG91dCBpbnNlcnRpb25cbiAgICAgIGlmIChyZW1vdmVEaXJlY3Rpb24gIT09IERJUkVDVElPTi5OT05FKSB7XG4gICAgICAgIHN0YXJ0Q2hhbmdlUG9zID0gdGhpcy5uZWFyZXN0SW5wdXRQb3Moc3RhcnQsIGRlbGV0ZUNvdW50ID4gMSAmJiBzdGFydCAhPT0gMCAmJiAhZWFnZXJSZW1vdmUgPyBESVJFQ1RJT04uTk9ORSA6IHJlbW92ZURpcmVjdGlvbik7XG5cbiAgICAgICAgLy8gYWRqdXN0IHRhaWxTaGlmdCBpZiBzdGFydCB3YXMgYWxpZ25lZFxuICAgICAgICBkZXRhaWxzLnRhaWxTaGlmdCA9IHN0YXJ0Q2hhbmdlUG9zIC0gc3RhcnQ7XG4gICAgICB9XG4gICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLnJlbW92ZShzdGFydENoYW5nZVBvcykpO1xuICAgICAgaWYgKGVhZ2VyUmVtb3ZlICYmIHJlbW92ZURpcmVjdGlvbiAhPT0gRElSRUNUSU9OLk5PTkUgJiYgb2xkUmF3VmFsdWUgPT09IHRoaXMucmF3SW5wdXRWYWx1ZSkge1xuICAgICAgICBpZiAocmVtb3ZlRGlyZWN0aW9uID09PSBESVJFQ1RJT04uRk9SQ0VfTEVGVCkge1xuICAgICAgICAgIGxldCB2YWxMZW5ndGg7XG4gICAgICAgICAgd2hpbGUgKG9sZFJhd1ZhbHVlID09PSB0aGlzLnJhd0lucHV0VmFsdWUgJiYgKHZhbExlbmd0aCA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCkpIHtcbiAgICAgICAgICAgIGRldGFpbHMuYWdncmVnYXRlKG5ldyBDaGFuZ2VEZXRhaWxzKHtcbiAgICAgICAgICAgICAgdGFpbFNoaWZ0OiAtMVxuICAgICAgICAgICAgfSkpLmFnZ3JlZ2F0ZSh0aGlzLnJlbW92ZSh2YWxMZW5ndGggLSAxKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHJlbW92ZURpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkZPUkNFX1JJR0hUKSB7XG4gICAgICAgICAgdGFpbC51bnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLmFwcGVuZChpbnNlcnRlZCwgZmxhZ3MsIHRhaWwpKTtcbiAgICB9XG4gICAgbWFza0VxdWFscyhtYXNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrID09PSBtYXNrO1xuICAgIH1cbiAgICBvcHRpb25zSXNDaGFuZ2VkKG9wdHMpIHtcbiAgICAgIHJldHVybiAhb2JqZWN0SW5jbHVkZXModGhpcywgb3B0cyk7XG4gICAgfVxuICAgIHR5cGVkVmFsdWVFcXVhbHModmFsdWUpIHtcbiAgICAgIGNvbnN0IHR2YWwgPSB0aGlzLnR5cGVkVmFsdWU7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHR2YWwgfHwgTWFza2VkLkVNUFRZX1ZBTFVFUy5pbmNsdWRlcyh2YWx1ZSkgJiYgTWFza2VkLkVNUFRZX1ZBTFVFUy5pbmNsdWRlcyh0dmFsKSB8fCAodGhpcy5mb3JtYXQgPyB0aGlzLmZvcm1hdCh2YWx1ZSwgdGhpcykgPT09IHRoaXMuZm9ybWF0KHRoaXMudHlwZWRWYWx1ZSwgdGhpcykgOiBmYWxzZSk7XG4gICAgfVxuICAgIHBhZChmbGFncykge1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgfVxuICB9XG4gIE1hc2tlZC5ERUZBVUxUUyA9IHtcbiAgICBza2lwSW52YWxpZDogdHJ1ZVxuICB9O1xuICBNYXNrZWQuRU1QVFlfVkFMVUVTID0gW3VuZGVmaW5lZCwgbnVsbCwgJyddO1xuICBJTWFzay5NYXNrZWQgPSBNYXNrZWQ7XG5cbiAgY2xhc3MgQ2h1bmtzVGFpbERldGFpbHMge1xuICAgIC8qKiAqL1xuXG4gICAgY29uc3RydWN0b3IoY2h1bmtzLCBmcm9tKSB7XG4gICAgICBpZiAoY2h1bmtzID09PSB2b2lkIDApIHtcbiAgICAgICAgY2h1bmtzID0gW107XG4gICAgICB9XG4gICAgICBpZiAoZnJvbSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb20gPSAwO1xuICAgICAgfVxuICAgICAgdGhpcy5jaHVua3MgPSBjaHVua3M7XG4gICAgICB0aGlzLmZyb20gPSBmcm9tO1xuICAgIH1cbiAgICB0b1N0cmluZygpIHtcbiAgICAgIHJldHVybiB0aGlzLmNodW5rcy5tYXAoU3RyaW5nKS5qb2luKCcnKTtcbiAgICB9XG4gICAgZXh0ZW5kKHRhaWxDaHVuaykge1xuICAgICAgaWYgKCFTdHJpbmcodGFpbENodW5rKSkgcmV0dXJuO1xuICAgICAgdGFpbENodW5rID0gaXNTdHJpbmcodGFpbENodW5rKSA/IG5ldyBDb250aW51b3VzVGFpbERldGFpbHMoU3RyaW5nKHRhaWxDaHVuaykpIDogdGFpbENodW5rO1xuICAgICAgY29uc3QgbGFzdENodW5rID0gdGhpcy5jaHVua3NbdGhpcy5jaHVua3MubGVuZ3RoIC0gMV07XG4gICAgICBjb25zdCBleHRlbmRMYXN0ID0gbGFzdENodW5rICYmIChcbiAgICAgIC8vIGlmIHN0b3BzIGFyZSBzYW1lIG9yIHRhaWwgaGFzIG5vIHN0b3BcbiAgICAgIGxhc3RDaHVuay5zdG9wID09PSB0YWlsQ2h1bmsuc3RvcCB8fCB0YWlsQ2h1bmsuc3RvcCA9PSBudWxsKSAmJlxuICAgICAgLy8gaWYgdGFpbCBjaHVuayBnb2VzIGp1c3QgYWZ0ZXIgbGFzdCBjaHVua1xuICAgICAgdGFpbENodW5rLmZyb20gPT09IGxhc3RDaHVuay5mcm9tICsgbGFzdENodW5rLnRvU3RyaW5nKCkubGVuZ3RoO1xuICAgICAgaWYgKHRhaWxDaHVuayBpbnN0YW5jZW9mIENvbnRpbnVvdXNUYWlsRGV0YWlscykge1xuICAgICAgICAvLyBjaGVjayB0aGUgYWJpbGl0eSB0byBleHRlbmQgcHJldmlvdXMgY2h1bmtcbiAgICAgICAgaWYgKGV4dGVuZExhc3QpIHtcbiAgICAgICAgICAvLyBleHRlbmQgcHJldmlvdXMgY2h1bmtcbiAgICAgICAgICBsYXN0Q2h1bmsuZXh0ZW5kKHRhaWxDaHVuay50b1N0cmluZygpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBhcHBlbmQgbmV3IGNodW5rXG4gICAgICAgICAgdGhpcy5jaHVua3MucHVzaCh0YWlsQ2h1bmspO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRhaWxDaHVuayBpbnN0YW5jZW9mIENodW5rc1RhaWxEZXRhaWxzKSB7XG4gICAgICAgIGlmICh0YWlsQ2h1bmsuc3RvcCA9PSBudWxsKSB7XG4gICAgICAgICAgLy8gdW53cmFwIGZsb2F0aW5nIGNodW5rcyB0byBwYXJlbnQsIGtlZXBpbmcgYGZyb21gIHBvc1xuICAgICAgICAgIGxldCBmaXJzdFRhaWxDaHVuaztcbiAgICAgICAgICB3aGlsZSAodGFpbENodW5rLmNodW5rcy5sZW5ndGggJiYgdGFpbENodW5rLmNodW5rc1swXS5zdG9wID09IG51bGwpIHtcbiAgICAgICAgICAgIGZpcnN0VGFpbENodW5rID0gdGFpbENodW5rLmNodW5rcy5zaGlmdCgpOyAvLyBub3QgcG9zc2libGUgdG8gYmUgYHVuZGVmaW5lZGAgYmVjYXVzZSBsZW5ndGggd2FzIGNoZWNrZWQgYWJvdmVcbiAgICAgICAgICAgIGZpcnN0VGFpbENodW5rLmZyb20gKz0gdGFpbENodW5rLmZyb207XG4gICAgICAgICAgICB0aGlzLmV4dGVuZChmaXJzdFRhaWxDaHVuayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGFpbCBjaHVuayBzdGlsbCBoYXMgdmFsdWVcbiAgICAgICAgaWYgKHRhaWxDaHVuay50b1N0cmluZygpKSB7XG4gICAgICAgICAgLy8gaWYgY2h1bmtzIGNvbnRhaW5zIHN0b3BzLCB0aGVuIHBvcHVwIHN0b3AgdG8gY29udGFpbmVyXG4gICAgICAgICAgdGFpbENodW5rLnN0b3AgPSB0YWlsQ2h1bmsuYmxvY2tJbmRleDtcbiAgICAgICAgICB0aGlzLmNodW5rcy5wdXNoKHRhaWxDaHVuayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgYXBwZW5kVG8obWFza2VkKSB7XG4gICAgICBpZiAoIShtYXNrZWQgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWRQYXR0ZXJuKSkge1xuICAgICAgICBjb25zdCB0YWlsID0gbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscyh0aGlzLnRvU3RyaW5nKCkpO1xuICAgICAgICByZXR1cm4gdGFpbC5hcHBlbmRUbyhtYXNrZWQpO1xuICAgICAgfVxuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBmb3IgKGxldCBjaSA9IDA7IGNpIDwgdGhpcy5jaHVua3MubGVuZ3RoOyArK2NpKSB7XG4gICAgICAgIGNvbnN0IGNodW5rID0gdGhpcy5jaHVua3NbY2ldO1xuICAgICAgICBjb25zdCBsYXN0QmxvY2tJdGVyID0gbWFza2VkLl9tYXBQb3NUb0Jsb2NrKG1hc2tlZC5kaXNwbGF5VmFsdWUubGVuZ3RoKTtcbiAgICAgICAgY29uc3Qgc3RvcCA9IGNodW5rLnN0b3A7XG4gICAgICAgIGxldCBjaHVua0Jsb2NrO1xuICAgICAgICBpZiAoc3RvcCAhPSBudWxsICYmIChcbiAgICAgICAgLy8gaWYgYmxvY2sgbm90IGZvdW5kIG9yIHN0b3AgaXMgYmVoaW5kIGxhc3RCbG9ja1xuICAgICAgICAhbGFzdEJsb2NrSXRlciB8fCBsYXN0QmxvY2tJdGVyLmluZGV4IDw9IHN0b3ApKSB7XG4gICAgICAgICAgaWYgKGNodW5rIGluc3RhbmNlb2YgQ2h1bmtzVGFpbERldGFpbHMgfHxcbiAgICAgICAgICAvLyBmb3IgY29udGludW91cyBibG9jayBhbHNvIGNoZWNrIGlmIHN0b3AgaXMgZXhpc3RcbiAgICAgICAgICBtYXNrZWQuX3N0b3BzLmluZGV4T2Yoc3RvcCkgPj0gMCkge1xuICAgICAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUobWFza2VkLl9hcHBlbmRQbGFjZWhvbGRlcihzdG9wKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNodW5rQmxvY2sgPSBjaHVuayBpbnN0YW5jZW9mIENodW5rc1RhaWxEZXRhaWxzICYmIG1hc2tlZC5fYmxvY2tzW3N0b3BdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaHVua0Jsb2NrKSB7XG4gICAgICAgICAgY29uc3QgdGFpbERldGFpbHMgPSBjaHVua0Jsb2NrLmFwcGVuZFRhaWwoY2h1bmspO1xuICAgICAgICAgIGRldGFpbHMuYWdncmVnYXRlKHRhaWxEZXRhaWxzKTtcblxuICAgICAgICAgIC8vIGdldCBub3QgaW5zZXJ0ZWQgY2hhcnNcbiAgICAgICAgICBjb25zdCByZW1haW5DaGFycyA9IGNodW5rLnRvU3RyaW5nKCkuc2xpY2UodGFpbERldGFpbHMucmF3SW5zZXJ0ZWQubGVuZ3RoKTtcbiAgICAgICAgICBpZiAocmVtYWluQ2hhcnMpIGRldGFpbHMuYWdncmVnYXRlKG1hc2tlZC5hcHBlbmQocmVtYWluQ2hhcnMsIHtcbiAgICAgICAgICAgIHRhaWw6IHRydWVcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUobWFza2VkLmFwcGVuZChjaHVuay50b1N0cmluZygpLCB7XG4gICAgICAgICAgICB0YWlsOiB0cnVlXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2h1bmtzOiB0aGlzLmNodW5rcy5tYXAoYyA9PiBjLnN0YXRlKSxcbiAgICAgICAgZnJvbTogdGhpcy5mcm9tLFxuICAgICAgICBzdG9wOiB0aGlzLnN0b3AsXG4gICAgICAgIGJsb2NrSW5kZXg6IHRoaXMuYmxvY2tJbmRleFxuICAgICAgfTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHN0YXRlKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGNodW5rcyxcbiAgICAgICAgLi4ucHJvcHNcbiAgICAgIH0gPSBzdGF0ZTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgcHJvcHMpO1xuICAgICAgdGhpcy5jaHVua3MgPSBjaHVua3MubWFwKGNzdGF0ZSA9PiB7XG4gICAgICAgIGNvbnN0IGNodW5rID0gXCJjaHVua3NcIiBpbiBjc3RhdGUgPyBuZXcgQ2h1bmtzVGFpbERldGFpbHMoKSA6IG5ldyBDb250aW51b3VzVGFpbERldGFpbHMoKTtcbiAgICAgICAgY2h1bmsuc3RhdGUgPSBjc3RhdGU7XG4gICAgICAgIHJldHVybiBjaHVuaztcbiAgICAgIH0pO1xuICAgIH1cbiAgICB1bnNoaWZ0KGJlZm9yZVBvcykge1xuICAgICAgaWYgKCF0aGlzLmNodW5rcy5sZW5ndGggfHwgYmVmb3JlUG9zICE9IG51bGwgJiYgdGhpcy5mcm9tID49IGJlZm9yZVBvcykgcmV0dXJuICcnO1xuICAgICAgY29uc3QgY2h1bmtTaGlmdFBvcyA9IGJlZm9yZVBvcyAhPSBudWxsID8gYmVmb3JlUG9zIC0gdGhpcy5mcm9tIDogYmVmb3JlUG9zO1xuICAgICAgbGV0IGNpID0gMDtcbiAgICAgIHdoaWxlIChjaSA8IHRoaXMuY2h1bmtzLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBjaHVuayA9IHRoaXMuY2h1bmtzW2NpXTtcbiAgICAgICAgY29uc3Qgc2hpZnRDaGFyID0gY2h1bmsudW5zaGlmdChjaHVua1NoaWZ0UG9zKTtcbiAgICAgICAgaWYgKGNodW5rLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgICAvLyBjaHVuayBzdGlsbCBjb250YWlucyB2YWx1ZVxuICAgICAgICAgIC8vIGJ1dCBub3Qgc2hpZnRlZCAtIG1lYW5zIG5vIG1vcmUgYXZhaWxhYmxlIGNoYXJzIHRvIHNoaWZ0XG4gICAgICAgICAgaWYgKCFzaGlmdENoYXIpIGJyZWFrO1xuICAgICAgICAgICsrY2k7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gY2xlYW4gaWYgY2h1bmsgaGFzIG5vIHZhbHVlXG4gICAgICAgICAgdGhpcy5jaHVua3Muc3BsaWNlKGNpLCAxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hpZnRDaGFyKSByZXR1cm4gc2hpZnRDaGFyO1xuICAgICAgfVxuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBzaGlmdCgpIHtcbiAgICAgIGlmICghdGhpcy5jaHVua3MubGVuZ3RoKSByZXR1cm4gJyc7XG4gICAgICBsZXQgY2kgPSB0aGlzLmNodW5rcy5sZW5ndGggLSAxO1xuICAgICAgd2hpbGUgKDAgPD0gY2kpIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSB0aGlzLmNodW5rc1tjaV07XG4gICAgICAgIGNvbnN0IHNoaWZ0Q2hhciA9IGNodW5rLnNoaWZ0KCk7XG4gICAgICAgIGlmIChjaHVuay50b1N0cmluZygpKSB7XG4gICAgICAgICAgLy8gY2h1bmsgc3RpbGwgY29udGFpbnMgdmFsdWVcbiAgICAgICAgICAvLyBidXQgbm90IHNoaWZ0ZWQgLSBtZWFucyBubyBtb3JlIGF2YWlsYWJsZSBjaGFycyB0byBzaGlmdFxuICAgICAgICAgIGlmICghc2hpZnRDaGFyKSBicmVhaztcbiAgICAgICAgICAtLWNpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGNsZWFuIGlmIGNodW5rIGhhcyBubyB2YWx1ZVxuICAgICAgICAgIHRoaXMuY2h1bmtzLnNwbGljZShjaSwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNoaWZ0Q2hhcikgcmV0dXJuIHNoaWZ0Q2hhcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH1cblxuICBjbGFzcyBQYXR0ZXJuQ3Vyc29yIHtcbiAgICBjb25zdHJ1Y3RvcihtYXNrZWQsIHBvcykge1xuICAgICAgdGhpcy5tYXNrZWQgPSBtYXNrZWQ7XG4gICAgICB0aGlzLl9sb2cgPSBbXTtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgb2Zmc2V0LFxuICAgICAgICBpbmRleFxuICAgICAgfSA9IG1hc2tlZC5fbWFwUG9zVG9CbG9jayhwb3MpIHx8IChwb3MgPCAwID9cbiAgICAgIC8vIGZpcnN0XG4gICAgICB7XG4gICAgICAgIGluZGV4OiAwLFxuICAgICAgICBvZmZzZXQ6IDBcbiAgICAgIH0gOlxuICAgICAgLy8gbGFzdFxuICAgICAge1xuICAgICAgICBpbmRleDogdGhpcy5tYXNrZWQuX2Jsb2Nrcy5sZW5ndGgsXG4gICAgICAgIG9mZnNldDogMFxuICAgICAgfSk7XG4gICAgICB0aGlzLm9mZnNldCA9IG9mZnNldDtcbiAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICAgIHRoaXMub2sgPSBmYWxzZTtcbiAgICB9XG4gICAgZ2V0IGJsb2NrKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLl9ibG9ja3NbdGhpcy5pbmRleF07XG4gICAgfVxuICAgIGdldCBwb3MoKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQuX2Jsb2NrU3RhcnRQb3ModGhpcy5pbmRleCkgKyB0aGlzLm9mZnNldDtcbiAgICB9XG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaW5kZXg6IHRoaXMuaW5kZXgsXG4gICAgICAgIG9mZnNldDogdGhpcy5vZmZzZXQsXG4gICAgICAgIG9rOiB0aGlzLm9rXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXQgc3RhdGUocykge1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBzKTtcbiAgICB9XG4gICAgcHVzaFN0YXRlKCkge1xuICAgICAgdGhpcy5fbG9nLnB1c2godGhpcy5zdGF0ZSk7XG4gICAgfVxuICAgIHBvcFN0YXRlKCkge1xuICAgICAgY29uc3QgcyA9IHRoaXMuX2xvZy5wb3AoKTtcbiAgICAgIGlmIChzKSB0aGlzLnN0YXRlID0gcztcbiAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgICBiaW5kQmxvY2soKSB7XG4gICAgICBpZiAodGhpcy5ibG9jaykgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPCAwKSB7XG4gICAgICAgIHRoaXMuaW5kZXggPSAwO1xuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLm1hc2tlZC5fYmxvY2tzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmluZGV4ID0gdGhpcy5tYXNrZWQuX2Jsb2Nrcy5sZW5ndGggLSAxO1xuICAgICAgICB0aGlzLm9mZnNldCA9IHRoaXMuYmxvY2suZGlzcGxheVZhbHVlLmxlbmd0aDsgLy8gVE9ETyB0aGlzIGlzIHN0dXBpZCB0eXBlIGVycm9yLCBgYmxvY2tgIGRlcGVuZHMgb24gaW5kZXggdGhhdCB3YXMgY2hhbmdlZCBhYm92ZVxuICAgICAgfVxuICAgIH1cbiAgICBfcHVzaExlZnQoZm4pIHtcbiAgICAgIHRoaXMucHVzaFN0YXRlKCk7XG4gICAgICBmb3IgKHRoaXMuYmluZEJsb2NrKCk7IDAgPD0gdGhpcy5pbmRleDsgLS10aGlzLmluZGV4LCB0aGlzLm9mZnNldCA9ICgoX3RoaXMkYmxvY2sgPSB0aGlzLmJsb2NrKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkYmxvY2suZGlzcGxheVZhbHVlLmxlbmd0aCkgfHwgMCkge1xuICAgICAgICB2YXIgX3RoaXMkYmxvY2s7XG4gICAgICAgIGlmIChmbigpKSByZXR1cm4gdGhpcy5vayA9IHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5vayA9IGZhbHNlO1xuICAgIH1cbiAgICBfcHVzaFJpZ2h0KGZuKSB7XG4gICAgICB0aGlzLnB1c2hTdGF0ZSgpO1xuICAgICAgZm9yICh0aGlzLmJpbmRCbG9jaygpOyB0aGlzLmluZGV4IDwgdGhpcy5tYXNrZWQuX2Jsb2Nrcy5sZW5ndGg7ICsrdGhpcy5pbmRleCwgdGhpcy5vZmZzZXQgPSAwKSB7XG4gICAgICAgIGlmIChmbigpKSByZXR1cm4gdGhpcy5vayA9IHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5vayA9IGZhbHNlO1xuICAgIH1cbiAgICBwdXNoTGVmdEJlZm9yZUZpbGxlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoTGVmdCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmJsb2NrLmlzRml4ZWQgfHwgIXRoaXMuYmxvY2sudmFsdWUpIHJldHVybjtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmJsb2NrLm5lYXJlc3RJbnB1dFBvcyh0aGlzLm9mZnNldCwgRElSRUNUSU9OLkZPUkNFX0xFRlQpO1xuICAgICAgICBpZiAodGhpcy5vZmZzZXQgIT09IDApIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHB1c2hMZWZ0QmVmb3JlSW5wdXQoKSB7XG4gICAgICAvLyBjYXNlczpcbiAgICAgIC8vIGZpbGxlZCBpbnB1dDogMDB8XG4gICAgICAvLyBvcHRpb25hbCBlbXB0eSBpbnB1dDogMDBbXXxcbiAgICAgIC8vIG5lc3RlZCBibG9jazogWFg8W10+fFxuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hMZWZ0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYmxvY2suaXNGaXhlZCkgcmV0dXJuO1xuICAgICAgICB0aGlzLm9mZnNldCA9IHRoaXMuYmxvY2submVhcmVzdElucHV0UG9zKHRoaXMub2Zmc2V0LCBESVJFQ1RJT04uTEVGVCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHB1c2hMZWZ0QmVmb3JlUmVxdWlyZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaExlZnQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5ibG9jay5pc0ZpeGVkIHx8IHRoaXMuYmxvY2suaXNPcHRpb25hbCAmJiAhdGhpcy5ibG9jay52YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLm9mZnNldCA9IHRoaXMuYmxvY2submVhcmVzdElucHV0UG9zKHRoaXMub2Zmc2V0LCBESVJFQ1RJT04uTEVGVCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHB1c2hSaWdodEJlZm9yZUZpbGxlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoUmlnaHQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5ibG9jay5pc0ZpeGVkIHx8ICF0aGlzLmJsb2NrLnZhbHVlKSByZXR1cm47XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gdGhpcy5ibG9jay5uZWFyZXN0SW5wdXRQb3ModGhpcy5vZmZzZXQsIERJUkVDVElPTi5GT1JDRV9SSUdIVCk7XG4gICAgICAgIGlmICh0aGlzLm9mZnNldCAhPT0gdGhpcy5ibG9jay52YWx1ZS5sZW5ndGgpIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHB1c2hSaWdodEJlZm9yZUlucHV0KCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hSaWdodCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmJsb2NrLmlzRml4ZWQpIHJldHVybjtcblxuICAgICAgICAvLyBjb25zdCBvID0gdGhpcy5vZmZzZXQ7XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gdGhpcy5ibG9jay5uZWFyZXN0SW5wdXRQb3ModGhpcy5vZmZzZXQsIERJUkVDVElPTi5OT05FKTtcbiAgICAgICAgLy8gSEFDSyBjYXNlcyBsaWtlIChTVElMTCBET0VTIE5PVCBXT1JLIEZPUiBORVNURUQpXG4gICAgICAgIC8vIGFhfFhcbiAgICAgICAgLy8gYWE8WHxbXT5YXyAgICAtIHRoaXMgd2lsbCBub3Qgd29ya1xuICAgICAgICAvLyBpZiAobyAmJiBvID09PSB0aGlzLm9mZnNldCAmJiB0aGlzLmJsb2NrIGluc3RhbmNlb2YgUGF0dGVybklucHV0RGVmaW5pdGlvbikgY29udGludWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHB1c2hSaWdodEJlZm9yZVJlcXVpcmVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hSaWdodCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmJsb2NrLmlzRml4ZWQgfHwgdGhpcy5ibG9jay5pc09wdGlvbmFsICYmICF0aGlzLmJsb2NrLnZhbHVlKSByZXR1cm47XG5cbiAgICAgICAgLy8gVE9ETyBjaGVjayB8WypdWFhfXG4gICAgICAgIHRoaXMub2Zmc2V0ID0gdGhpcy5ibG9jay5uZWFyZXN0SW5wdXRQb3ModGhpcy5vZmZzZXQsIERJUkVDVElPTi5OT05FKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBjbGFzcyBQYXR0ZXJuRml4ZWREZWZpbml0aW9uIHtcbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIG9wdHMpO1xuICAgICAgdGhpcy5fdmFsdWUgPSAnJztcbiAgICAgIHRoaXMuaXNGaXhlZCA9IHRydWU7XG4gICAgfVxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgZ2V0IHVubWFza2VkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pc1VubWFza2luZyA/IHRoaXMudmFsdWUgOiAnJztcbiAgICB9XG4gICAgZ2V0IHJhd0lucHV0VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXNSYXdJbnB1dCA/IHRoaXMudmFsdWUgOiAnJztcbiAgICB9XG4gICAgZ2V0IGRpc3BsYXlWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgIHRoaXMuX2lzUmF3SW5wdXQgPSBmYWxzZTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gJyc7XG4gICAgfVxuICAgIHJlbW92ZShmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5fdmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLl92YWx1ZS5zbGljZSgwLCBmcm9tUG9zKSArIHRoaXMuX3ZhbHVlLnNsaWNlKHRvUG9zKTtcbiAgICAgIGlmICghdGhpcy5fdmFsdWUpIHRoaXMuX2lzUmF3SW5wdXQgPSBmYWxzZTtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgIH1cbiAgICBuZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBkaXJlY3Rpb24pIHtcbiAgICAgIGlmIChkaXJlY3Rpb24gPT09IHZvaWQgMCkge1xuICAgICAgICBkaXJlY3Rpb24gPSBESVJFQ1RJT04uTk9ORTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1pblBvcyA9IDA7XG4gICAgICBjb25zdCBtYXhQb3MgPSB0aGlzLl92YWx1ZS5sZW5ndGg7XG4gICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlIERJUkVDVElPTi5MRUZUOlxuICAgICAgICBjYXNlIERJUkVDVElPTi5GT1JDRV9MRUZUOlxuICAgICAgICAgIHJldHVybiBtaW5Qb3M7XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLk5PTkU6XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLlJJR0hUOlxuICAgICAgICBjYXNlIERJUkVDVElPTi5GT1JDRV9SSUdIVDpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gbWF4UG9zO1xuICAgICAgfVxuICAgIH1cbiAgICB0b3RhbElucHV0UG9zaXRpb25zKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLl92YWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5faXNSYXdJbnB1dCA/IHRvUG9zIC0gZnJvbVBvcyA6IDA7XG4gICAgfVxuICAgIGV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuX3ZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICByZXR1cm4gZmxhZ3MucmF3ICYmIHRoaXMuX2lzUmF3SW5wdXQgJiYgdGhpcy5fdmFsdWUuc2xpY2UoZnJvbVBvcywgdG9Qb3MpIHx8ICcnO1xuICAgIH1cbiAgICBnZXQgaXNDb21wbGV0ZSgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBnZXQgaXNGaWxsZWQoKSB7XG4gICAgICByZXR1cm4gQm9vbGVhbih0aGlzLl92YWx1ZSk7XG4gICAgfVxuICAgIF9hcHBlbmRDaGFyKGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlzRmlsbGVkKSByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGNvbnN0IGFwcGVuZEVhZ2VyID0gdGhpcy5lYWdlciA9PT0gdHJ1ZSB8fCB0aGlzLmVhZ2VyID09PSAnYXBwZW5kJztcbiAgICAgIGNvbnN0IGFwcGVuZGVkID0gdGhpcy5jaGFyID09PSBjaDtcbiAgICAgIGNvbnN0IGlzUmVzb2x2ZWQgPSBhcHBlbmRlZCAmJiAodGhpcy5pc1VubWFza2luZyB8fCBmbGFncy5pbnB1dCB8fCBmbGFncy5yYXcpICYmICghZmxhZ3MucmF3IHx8ICFhcHBlbmRFYWdlcikgJiYgIWZsYWdzLnRhaWw7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoe1xuICAgICAgICBpbnNlcnRlZDogdGhpcy5jaGFyLFxuICAgICAgICByYXdJbnNlcnRlZDogaXNSZXNvbHZlZCA/IHRoaXMuY2hhciA6ICcnXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdGhpcy5jaGFyO1xuICAgICAgdGhpcy5faXNSYXdJbnB1dCA9IGlzUmVzb2x2ZWQgJiYgKGZsYWdzLnJhdyB8fCBmbGFncy5pbnB1dCk7XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgX2FwcGVuZEVhZ2VyKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FwcGVuZENoYXIodGhpcy5jaGFyLCB7XG4gICAgICAgIHRhaWw6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBfYXBwZW5kUGxhY2Vob2xkZXIoKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGlmICh0aGlzLmlzRmlsbGVkKSByZXR1cm4gZGV0YWlscztcbiAgICAgIHRoaXMuX3ZhbHVlID0gZGV0YWlscy5pbnNlcnRlZCA9IHRoaXMuY2hhcjtcbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBleHRyYWN0VGFpbCgpIHtcbiAgICAgIHJldHVybiBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKCcnKTtcbiAgICB9XG4gICAgYXBwZW5kVGFpbCh0YWlsKSB7XG4gICAgICBpZiAoaXNTdHJpbmcodGFpbCkpIHRhaWwgPSBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKFN0cmluZyh0YWlsKSk7XG4gICAgICByZXR1cm4gdGFpbC5hcHBlbmRUbyh0aGlzKTtcbiAgICB9XG4gICAgYXBwZW5kKHN0ciwgZmxhZ3MsIHRhaWwpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLl9hcHBlbmRDaGFyKHN0clswXSwgZmxhZ3MpO1xuICAgICAgaWYgKHRhaWwgIT0gbnVsbCkge1xuICAgICAgICBkZXRhaWxzLnRhaWxTaGlmdCArPSB0aGlzLmFwcGVuZFRhaWwodGFpbCkudGFpbFNoaWZ0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIGRvQ29tbWl0KCkge31cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBfdmFsdWU6IHRoaXMuX3ZhbHVlLFxuICAgICAgICBfcmF3SW5wdXRWYWx1ZTogdGhpcy5yYXdJbnB1dFZhbHVlXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXQgc3RhdGUoc3RhdGUpIHtcbiAgICAgIHRoaXMuX3ZhbHVlID0gc3RhdGUuX3ZhbHVlO1xuICAgICAgdGhpcy5faXNSYXdJbnB1dCA9IEJvb2xlYW4oc3RhdGUuX3Jhd0lucHV0VmFsdWUpO1xuICAgIH1cbiAgICBwYWQoZmxhZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hcHBlbmRQbGFjZWhvbGRlcigpO1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIFBhdHRlcm5JbnB1dERlZmluaXRpb24ge1xuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHBhcmVudCxcbiAgICAgICAgaXNPcHRpb25hbCxcbiAgICAgICAgcGxhY2Vob2xkZXJDaGFyLFxuICAgICAgICBkaXNwbGF5Q2hhcixcbiAgICAgICAgbGF6eSxcbiAgICAgICAgZWFnZXIsXG4gICAgICAgIC4uLm1hc2tPcHRzXG4gICAgICB9ID0gb3B0cztcbiAgICAgIHRoaXMubWFza2VkID0gY3JlYXRlTWFzayhtYXNrT3B0cyk7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcbiAgICAgICAgcGFyZW50LFxuICAgICAgICBpc09wdGlvbmFsLFxuICAgICAgICBwbGFjZWhvbGRlckNoYXIsXG4gICAgICAgIGRpc3BsYXlDaGFyLFxuICAgICAgICBsYXp5LFxuICAgICAgICBlYWdlclxuICAgICAgfSk7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgdGhpcy5pc0ZpbGxlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5tYXNrZWQucmVzZXQoKTtcbiAgICB9XG4gICAgcmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChmcm9tUG9zID09PSAwICYmIHRvUG9zID49IDEpIHtcbiAgICAgICAgdGhpcy5pc0ZpbGxlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXNrZWQucmVtb3ZlKGZyb21Qb3MsIHRvUG9zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgIH1cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQudmFsdWUgfHwgKHRoaXMuaXNGaWxsZWQgJiYgIXRoaXMuaXNPcHRpb25hbCA/IHRoaXMucGxhY2Vob2xkZXJDaGFyIDogJycpO1xuICAgIH1cbiAgICBnZXQgdW5tYXNrZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC51bm1hc2tlZFZhbHVlO1xuICAgIH1cbiAgICBnZXQgcmF3SW5wdXRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5yYXdJbnB1dFZhbHVlO1xuICAgIH1cbiAgICBnZXQgZGlzcGxheVZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLnZhbHVlICYmIHRoaXMuZGlzcGxheUNoYXIgfHwgdGhpcy52YWx1ZTtcbiAgICB9XG4gICAgZ2V0IGlzQ29tcGxldGUoKSB7XG4gICAgICByZXR1cm4gQm9vbGVhbih0aGlzLm1hc2tlZC52YWx1ZSkgfHwgdGhpcy5pc09wdGlvbmFsO1xuICAgIH1cbiAgICBfYXBwZW5kQ2hhcihjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc0ZpbGxlZCkgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBjb25zdCBzdGF0ZSA9IHRoaXMubWFza2VkLnN0YXRlO1xuICAgICAgLy8gc2ltdWxhdGUgaW5wdXRcbiAgICAgIGxldCBkZXRhaWxzID0gdGhpcy5tYXNrZWQuX2FwcGVuZENoYXIoY2gsIHRoaXMuY3VycmVudE1hc2tGbGFncyhmbGFncykpO1xuICAgICAgaWYgKGRldGFpbHMuaW5zZXJ0ZWQgJiYgdGhpcy5kb1ZhbGlkYXRlKGZsYWdzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICAgIHRoaXMubWFza2VkLnN0YXRlID0gc3RhdGU7XG4gICAgICB9XG4gICAgICBpZiAoIWRldGFpbHMuaW5zZXJ0ZWQgJiYgIXRoaXMuaXNPcHRpb25hbCAmJiAhdGhpcy5sYXp5ICYmICFmbGFncy5pbnB1dCkge1xuICAgICAgICBkZXRhaWxzLmluc2VydGVkID0gdGhpcy5wbGFjZWhvbGRlckNoYXI7XG4gICAgICB9XG4gICAgICBkZXRhaWxzLnNraXAgPSAhZGV0YWlscy5pbnNlcnRlZCAmJiAhdGhpcy5pc09wdGlvbmFsO1xuICAgICAgdGhpcy5pc0ZpbGxlZCA9IEJvb2xlYW4oZGV0YWlscy5pbnNlcnRlZCk7XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgYXBwZW5kKHN0ciwgZmxhZ3MsIHRhaWwpIHtcbiAgICAgIC8vIFRPRE8gcHJvYmFibHkgc2hvdWxkIGJlIGRvbmUgdmlhIF9hcHBlbmRDaGFyXG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQuYXBwZW5kKHN0ciwgdGhpcy5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSwgdGFpbCk7XG4gICAgfVxuICAgIF9hcHBlbmRQbGFjZWhvbGRlcigpIHtcbiAgICAgIGlmICh0aGlzLmlzRmlsbGVkIHx8IHRoaXMuaXNPcHRpb25hbCkgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICB0aGlzLmlzRmlsbGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscyh7XG4gICAgICAgIGluc2VydGVkOiB0aGlzLnBsYWNlaG9sZGVyQ2hhclxuICAgICAgfSk7XG4gICAgfVxuICAgIF9hcHBlbmRFYWdlcigpIHtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgIH1cbiAgICBleHRyYWN0VGFpbChmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLmV4dHJhY3RUYWlsKGZyb21Qb3MsIHRvUG9zKTtcbiAgICB9XG4gICAgYXBwZW5kVGFpbCh0YWlsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQuYXBwZW5kVGFpbCh0YWlsKTtcbiAgICB9XG4gICAgZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy52YWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQuZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncyk7XG4gICAgfVxuICAgIG5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIGRpcmVjdGlvbikge1xuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IERJUkVDVElPTi5OT05FO1xuICAgICAgfVxuICAgICAgY29uc3QgbWluUG9zID0gMDtcbiAgICAgIGNvbnN0IG1heFBvcyA9IHRoaXMudmFsdWUubGVuZ3RoO1xuICAgICAgY29uc3QgYm91bmRQb3MgPSBNYXRoLm1pbihNYXRoLm1heChjdXJzb3JQb3MsIG1pblBvcyksIG1heFBvcyk7XG4gICAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlIERJUkVDVElPTi5MRUZUOlxuICAgICAgICBjYXNlIERJUkVDVElPTi5GT1JDRV9MRUZUOlxuICAgICAgICAgIHJldHVybiB0aGlzLmlzQ29tcGxldGUgPyBib3VuZFBvcyA6IG1pblBvcztcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uUklHSFQ6XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkZPUkNFX1JJR0hUOlxuICAgICAgICAgIHJldHVybiB0aGlzLmlzQ29tcGxldGUgPyBib3VuZFBvcyA6IG1heFBvcztcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uTk9ORTpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gYm91bmRQb3M7XG4gICAgICB9XG4gICAgfVxuICAgIHRvdGFsSW5wdXRQb3NpdGlvbnMoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMudmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMudmFsdWUuc2xpY2UoZnJvbVBvcywgdG9Qb3MpLmxlbmd0aDtcbiAgICB9XG4gICAgZG9WYWxpZGF0ZShmbGFncykge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLmRvVmFsaWRhdGUodGhpcy5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSkgJiYgKCF0aGlzLnBhcmVudCB8fCB0aGlzLnBhcmVudC5kb1ZhbGlkYXRlKHRoaXMuY3VycmVudE1hc2tGbGFncyhmbGFncykpKTtcbiAgICB9XG4gICAgZG9Db21taXQoKSB7XG4gICAgICB0aGlzLm1hc2tlZC5kb0NvbW1pdCgpO1xuICAgIH1cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBfdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgIF9yYXdJbnB1dFZhbHVlOiB0aGlzLnJhd0lucHV0VmFsdWUsXG4gICAgICAgIG1hc2tlZDogdGhpcy5tYXNrZWQuc3RhdGUsXG4gICAgICAgIGlzRmlsbGVkOiB0aGlzLmlzRmlsbGVkXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXQgc3RhdGUoc3RhdGUpIHtcbiAgICAgIHRoaXMubWFza2VkLnN0YXRlID0gc3RhdGUubWFza2VkO1xuICAgICAgdGhpcy5pc0ZpbGxlZCA9IHN0YXRlLmlzRmlsbGVkO1xuICAgIH1cbiAgICBjdXJyZW50TWFza0ZsYWdzKGZsYWdzKSB7XG4gICAgICB2YXIgX2ZsYWdzJF9iZWZvcmVUYWlsU3RhO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uZmxhZ3MsXG4gICAgICAgIF9iZWZvcmVUYWlsU3RhdGU6IChmbGFncyA9PSBudWxsIHx8IChfZmxhZ3MkX2JlZm9yZVRhaWxTdGEgPSBmbGFncy5fYmVmb3JlVGFpbFN0YXRlKSA9PSBudWxsID8gdm9pZCAwIDogX2ZsYWdzJF9iZWZvcmVUYWlsU3RhLm1hc2tlZCkgfHwgKGZsYWdzID09IG51bGwgPyB2b2lkIDAgOiBmbGFncy5fYmVmb3JlVGFpbFN0YXRlKVxuICAgICAgfTtcbiAgICB9XG4gICAgcGFkKGZsYWdzKSB7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICB9XG4gIH1cbiAgUGF0dGVybklucHV0RGVmaW5pdGlvbi5ERUZBVUxUX0RFRklOSVRJT05TID0ge1xuICAgICcwJzogL1xcZC8sXG4gICAgJ2EnOiAvW1xcdTAwNDEtXFx1MDA1QVxcdTAwNjEtXFx1MDA3QVxcdTAwQUFcXHUwMEI1XFx1MDBCQVxcdTAwQzAtXFx1MDBENlxcdTAwRDgtXFx1MDBGNlxcdTAwRjgtXFx1MDJDMVxcdTAyQzYtXFx1MDJEMVxcdTAyRTAtXFx1MDJFNFxcdTAyRUNcXHUwMkVFXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdBLVxcdTAzN0RcXHUwMzg2XFx1MDM4OC1cXHUwMzhBXFx1MDM4Q1xcdTAzOEUtXFx1MDNBMVxcdTAzQTMtXFx1MDNGNVxcdTAzRjctXFx1MDQ4MVxcdTA0OEEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNUQwLVxcdTA1RUFcXHUwNUYwLVxcdTA1RjJcXHUwNjIwLVxcdTA2NEFcXHUwNjZFXFx1MDY2RlxcdTA2NzEtXFx1MDZEM1xcdTA2RDVcXHUwNkU1XFx1MDZFNlxcdTA2RUVcXHUwNkVGXFx1MDZGQS1cXHUwNkZDXFx1MDZGRlxcdTA3MTBcXHUwNzEyLVxcdTA3MkZcXHUwNzRELVxcdTA3QTVcXHUwN0IxXFx1MDdDQS1cXHUwN0VBXFx1MDdGNFxcdTA3RjVcXHUwN0ZBXFx1MDgwMC1cXHUwODE1XFx1MDgxQVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhBMFxcdTA4QTItXFx1MDhBQ1xcdTA5MDQtXFx1MDkzOVxcdTA5M0RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk3MS1cXHUwOTc3XFx1MDk3OS1cXHUwOTdGXFx1MDk4NS1cXHUwOThDXFx1MDk4RlxcdTA5OTBcXHUwOTkzLVxcdTA5QThcXHUwOUFBLVxcdTA5QjBcXHUwOUIyXFx1MDlCNi1cXHUwOUI5XFx1MDlCRFxcdTA5Q0VcXHUwOURDXFx1MDlERFxcdTA5REYtXFx1MDlFMVxcdTA5RjBcXHUwOUYxXFx1MEEwNS1cXHUwQTBBXFx1MEEwRlxcdTBBMTBcXHUwQTEzLVxcdTBBMjhcXHUwQTJBLVxcdTBBMzBcXHUwQTMyXFx1MEEzM1xcdTBBMzVcXHUwQTM2XFx1MEEzOFxcdTBBMzlcXHUwQTU5LVxcdTBBNUNcXHUwQTVFXFx1MEE3Mi1cXHUwQTc0XFx1MEE4NS1cXHUwQThEXFx1MEE4Ri1cXHUwQTkxXFx1MEE5My1cXHUwQUE4XFx1MEFBQS1cXHUwQUIwXFx1MEFCMlxcdTBBQjNcXHUwQUI1LVxcdTBBQjlcXHUwQUJEXFx1MEFEMFxcdTBBRTBcXHUwQUUxXFx1MEIwNS1cXHUwQjBDXFx1MEIwRlxcdTBCMTBcXHUwQjEzLVxcdTBCMjhcXHUwQjJBLVxcdTBCMzBcXHUwQjMyXFx1MEIzM1xcdTBCMzUtXFx1MEIzOVxcdTBCM0RcXHUwQjVDXFx1MEI1RFxcdTBCNUYtXFx1MEI2MVxcdTBCNzFcXHUwQjgzXFx1MEI4NS1cXHUwQjhBXFx1MEI4RS1cXHUwQjkwXFx1MEI5Mi1cXHUwQjk1XFx1MEI5OVxcdTBCOUFcXHUwQjlDXFx1MEI5RVxcdTBCOUZcXHUwQkEzXFx1MEJBNFxcdTBCQTgtXFx1MEJBQVxcdTBCQUUtXFx1MEJCOVxcdTBCRDBcXHUwQzA1LVxcdTBDMENcXHUwQzBFLVxcdTBDMTBcXHUwQzEyLVxcdTBDMjhcXHUwQzJBLVxcdTBDMzNcXHUwQzM1LVxcdTBDMzlcXHUwQzNEXFx1MEM1OFxcdTBDNTlcXHUwQzYwXFx1MEM2MVxcdTBDODUtXFx1MEM4Q1xcdTBDOEUtXFx1MEM5MFxcdTBDOTItXFx1MENBOFxcdTBDQUEtXFx1MENCM1xcdTBDQjUtXFx1MENCOVxcdTBDQkRcXHUwQ0RFXFx1MENFMFxcdTBDRTFcXHUwQ0YxXFx1MENGMlxcdTBEMDUtXFx1MEQwQ1xcdTBEMEUtXFx1MEQxMFxcdTBEMTItXFx1MEQzQVxcdTBEM0RcXHUwRDRFXFx1MEQ2MFxcdTBENjFcXHUwRDdBLVxcdTBEN0ZcXHUwRDg1LVxcdTBEOTZcXHUwRDlBLVxcdTBEQjFcXHUwREIzLVxcdTBEQkJcXHUwREJEXFx1MERDMC1cXHUwREM2XFx1MEUwMS1cXHUwRTMwXFx1MEUzMlxcdTBFMzNcXHUwRTQwLVxcdTBFNDZcXHUwRTgxXFx1MEU4MlxcdTBFODRcXHUwRTg3XFx1MEU4OFxcdTBFOEFcXHUwRThEXFx1MEU5NC1cXHUwRTk3XFx1MEU5OS1cXHUwRTlGXFx1MEVBMS1cXHUwRUEzXFx1MEVBNVxcdTBFQTdcXHUwRUFBXFx1MEVBQlxcdTBFQUQtXFx1MEVCMFxcdTBFQjJcXHUwRUIzXFx1MEVCRFxcdTBFQzAtXFx1MEVDNFxcdTBFQzZcXHUwRURDLVxcdTBFREZcXHUwRjAwXFx1MEY0MC1cXHUwRjQ3XFx1MEY0OS1cXHUwRjZDXFx1MEY4OC1cXHUwRjhDXFx1MTAwMC1cXHUxMDJBXFx1MTAzRlxcdTEwNTAtXFx1MTA1NVxcdTEwNUEtXFx1MTA1RFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNkUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOEVcXHUxMEEwLVxcdTEwQzVcXHUxMEM3XFx1MTBDRFxcdTEwRDAtXFx1MTBGQVxcdTEwRkMtXFx1MTI0OFxcdTEyNEEtXFx1MTI0RFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVBLVxcdTEyNURcXHUxMjYwLVxcdTEyODhcXHUxMjhBLVxcdTEyOERcXHUxMjkwLVxcdTEyQjBcXHUxMkIyLVxcdTEyQjVcXHUxMkI4LVxcdTEyQkVcXHUxMkMwXFx1MTJDMi1cXHUxMkM1XFx1MTJDOC1cXHUxMkQ2XFx1MTJEOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVBXFx1MTM4MC1cXHUxMzhGXFx1MTNBMC1cXHUxM0Y0XFx1MTQwMS1cXHUxNjZDXFx1MTY2Ri1cXHUxNjdGXFx1MTY4MS1cXHUxNjlBXFx1MTZBMC1cXHUxNkVBXFx1MTcwMC1cXHUxNzBDXFx1MTcwRS1cXHUxNzExXFx1MTcyMC1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZDXFx1MTc2RS1cXHUxNzcwXFx1MTc4MC1cXHUxN0IzXFx1MTdEN1xcdTE3RENcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4QThcXHUxOEFBXFx1MThCMC1cXHUxOEY1XFx1MTkwMC1cXHUxOTFDXFx1MTk1MC1cXHUxOTZEXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOUFCXFx1MTlDMS1cXHUxOUM3XFx1MUEwMC1cXHUxQTE2XFx1MUEyMC1cXHUxQTU0XFx1MUFBN1xcdTFCMDUtXFx1MUIzM1xcdTFCNDUtXFx1MUI0QlxcdTFCODMtXFx1MUJBMFxcdTFCQUVcXHUxQkFGXFx1MUJCQS1cXHUxQkU1XFx1MUMwMC1cXHUxQzIzXFx1MUM0RC1cXHUxQzRGXFx1MUM1QS1cXHUxQzdEXFx1MUNFOS1cXHUxQ0VDXFx1MUNFRS1cXHUxQ0YxXFx1MUNGNVxcdTFDRjZcXHUxRDAwLVxcdTFEQkZcXHUxRTAwLVxcdTFGMTVcXHUxRjE4LVxcdTFGMURcXHUxRjIwLVxcdTFGNDVcXHUxRjQ4LVxcdTFGNERcXHUxRjUwLVxcdTFGNTdcXHUxRjU5XFx1MUY1QlxcdTFGNURcXHUxRjVGLVxcdTFGN0RcXHUxRjgwLVxcdTFGQjRcXHUxRkI2LVxcdTFGQkNcXHUxRkJFXFx1MUZDMi1cXHUxRkM0XFx1MUZDNi1cXHUxRkNDXFx1MUZEMC1cXHUxRkQzXFx1MUZENi1cXHUxRkRCXFx1MUZFMC1cXHUxRkVDXFx1MUZGMi1cXHUxRkY0XFx1MUZGNi1cXHUxRkZDXFx1MjA3MVxcdTIwN0ZcXHUyMDkwLVxcdTIwOUNcXHUyMTAyXFx1MjEwN1xcdTIxMEEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMURcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJBLVxcdTIxMkRcXHUyMTJGLVxcdTIxMzlcXHUyMTNDLVxcdTIxM0ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRFXFx1MjE4M1xcdTIxODRcXHUyQzAwLVxcdTJDMkVcXHUyQzMwLVxcdTJDNUVcXHUyQzYwLVxcdTJDRTRcXHUyQ0VCLVxcdTJDRUVcXHUyQ0YyXFx1MkNGM1xcdTJEMDAtXFx1MkQyNVxcdTJEMjdcXHUyRDJEXFx1MkQzMC1cXHUyRDY3XFx1MkQ2RlxcdTJEODAtXFx1MkQ5NlxcdTJEQTAtXFx1MkRBNlxcdTJEQTgtXFx1MkRBRVxcdTJEQjAtXFx1MkRCNlxcdTJEQjgtXFx1MkRCRVxcdTJEQzAtXFx1MkRDNlxcdTJEQzgtXFx1MkRDRVxcdTJERDAtXFx1MkRENlxcdTJERDgtXFx1MkRERVxcdTJFMkZcXHUzMDA1XFx1MzAwNlxcdTMwMzEtXFx1MzAzNVxcdTMwM0JcXHUzMDNDXFx1MzA0MS1cXHUzMDk2XFx1MzA5RC1cXHUzMDlGXFx1MzBBMS1cXHUzMEZBXFx1MzBGQy1cXHUzMEZGXFx1MzEwNS1cXHUzMTJEXFx1MzEzMS1cXHUzMThFXFx1MzFBMC1cXHUzMUJBXFx1MzFGMC1cXHUzMUZGXFx1MzQwMC1cXHU0REI1XFx1NEUwMC1cXHU5RkNDXFx1QTAwMC1cXHVBNDhDXFx1QTREMC1cXHVBNEZEXFx1QTUwMC1cXHVBNjBDXFx1QTYxMC1cXHVBNjFGXFx1QTYyQVxcdUE2MkJcXHVBNjQwLVxcdUE2NkVcXHVBNjdGLVxcdUE2OTdcXHVBNkEwLVxcdUE2RTVcXHVBNzE3LVxcdUE3MUZcXHVBNzIyLVxcdUE3ODhcXHVBNzhCLVxcdUE3OEVcXHVBNzkwLVxcdUE3OTNcXHVBN0EwLVxcdUE3QUFcXHVBN0Y4LVxcdUE4MDFcXHVBODAzLVxcdUE4MDVcXHVBODA3LVxcdUE4MEFcXHVBODBDLVxcdUE4MjJcXHVBODQwLVxcdUE4NzNcXHVBODgyLVxcdUE4QjNcXHVBOEYyLVxcdUE4RjdcXHVBOEZCXFx1QTkwQS1cXHVBOTI1XFx1QTkzMC1cXHVBOTQ2XFx1QTk2MC1cXHVBOTdDXFx1QTk4NC1cXHVBOUIyXFx1QTlDRlxcdUFBMDAtXFx1QUEyOFxcdUFBNDAtXFx1QUE0MlxcdUFBNDQtXFx1QUE0QlxcdUFBNjAtXFx1QUE3NlxcdUFBN0FcXHVBQTgwLVxcdUFBQUZcXHVBQUIxXFx1QUFCNVxcdUFBQjZcXHVBQUI5LVxcdUFBQkRcXHVBQUMwXFx1QUFDMlxcdUFBREItXFx1QUFERFxcdUFBRTAtXFx1QUFFQVxcdUFBRjItXFx1QUFGNFxcdUFCMDEtXFx1QUIwNlxcdUFCMDktXFx1QUIwRVxcdUFCMTEtXFx1QUIxNlxcdUFCMjAtXFx1QUIyNlxcdUFCMjgtXFx1QUIyRVxcdUFCQzAtXFx1QUJFMlxcdUFDMDAtXFx1RDdBM1xcdUQ3QjAtXFx1RDdDNlxcdUQ3Q0ItXFx1RDdGQlxcdUY5MDAtXFx1RkE2RFxcdUZBNzAtXFx1RkFEOVxcdUZCMDAtXFx1RkIwNlxcdUZCMTMtXFx1RkIxN1xcdUZCMURcXHVGQjFGLVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFNzAtXFx1RkU3NFxcdUZFNzYtXFx1RkVGQ1xcdUZGMjEtXFx1RkYzQVxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ10vLFxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyMDc1MDcwXG4gICAgJyonOiAvLi9cbiAgfTtcblxuICAvKiogTWFza2luZyBieSBSZWdFeHAgKi9cbiAgY2xhc3MgTWFza2VkUmVnRXhwIGV4dGVuZHMgTWFza2VkIHtcbiAgICAvKiogKi9cblxuICAgIC8qKiBFbmFibGUgY2hhcmFjdGVycyBvdmVyd3JpdGluZyAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIGNvbnN0IG1hc2sgPSBvcHRzLm1hc2s7XG4gICAgICBpZiAobWFzaykgb3B0cy52YWxpZGF0ZSA9IHZhbHVlID0+IHZhbHVlLnNlYXJjaChtYXNrKSA+PSAwO1xuICAgICAgc3VwZXIuX3VwZGF0ZShvcHRzKTtcbiAgICB9XG4gIH1cbiAgSU1hc2suTWFza2VkUmVnRXhwID0gTWFza2VkUmVnRXhwO1xuXG4gIC8qKiBQYXR0ZXJuIG1hc2sgKi9cbiAgY2xhc3MgTWFza2VkUGF0dGVybiBleHRlbmRzIE1hc2tlZCB7XG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiBTaW5nbGUgY2hhciBmb3IgZW1wdHkgaW5wdXQgKi9cblxuICAgIC8qKiBTaW5nbGUgY2hhciBmb3IgZmlsbGVkIGlucHV0ICovXG5cbiAgICAvKiogU2hvdyBwbGFjZWhvbGRlciBvbmx5IHdoZW4gbmVlZGVkICovXG5cbiAgICAvKiogRW5hYmxlIGNoYXJhY3RlcnMgb3ZlcndyaXRpbmcgKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIHN1cGVyKHtcbiAgICAgICAgLi4uTWFza2VkUGF0dGVybi5ERUZBVUxUUyxcbiAgICAgICAgLi4ub3B0cyxcbiAgICAgICAgZGVmaW5pdGlvbnM6IE9iamVjdC5hc3NpZ24oe30sIFBhdHRlcm5JbnB1dERlZmluaXRpb24uREVGQVVMVF9ERUZJTklUSU9OUywgb3B0cyA9PSBudWxsID8gdm9pZCAwIDogb3B0cy5kZWZpbml0aW9ucylcbiAgICAgIH0pO1xuICAgIH1cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgb3B0cy5kZWZpbml0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuZGVmaW5pdGlvbnMsIG9wdHMuZGVmaW5pdGlvbnMpO1xuICAgICAgc3VwZXIuX3VwZGF0ZShvcHRzKTtcbiAgICAgIHRoaXMuX3JlYnVpbGRNYXNrKCk7XG4gICAgfVxuICAgIF9yZWJ1aWxkTWFzaygpIHtcbiAgICAgIGNvbnN0IGRlZnMgPSB0aGlzLmRlZmluaXRpb25zO1xuICAgICAgdGhpcy5fYmxvY2tzID0gW107XG4gICAgICB0aGlzLmV4cG9zZUJsb2NrID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5fc3RvcHMgPSBbXTtcbiAgICAgIHRoaXMuX21hc2tlZEJsb2NrcyA9IHt9O1xuICAgICAgY29uc3QgcGF0dGVybiA9IHRoaXMubWFzaztcbiAgICAgIGlmICghcGF0dGVybiB8fCAhZGVmcykgcmV0dXJuO1xuICAgICAgbGV0IHVubWFza2luZ0Jsb2NrID0gZmFsc2U7XG4gICAgICBsZXQgb3B0aW9uYWxCbG9jayA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXR0ZXJuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmICh0aGlzLmJsb2Nrcykge1xuICAgICAgICAgIGNvbnN0IHAgPSBwYXR0ZXJuLnNsaWNlKGkpO1xuICAgICAgICAgIGNvbnN0IGJOYW1lcyA9IE9iamVjdC5rZXlzKHRoaXMuYmxvY2tzKS5maWx0ZXIoYk5hbWUgPT4gcC5pbmRleE9mKGJOYW1lKSA9PT0gMCk7XG4gICAgICAgICAgLy8gb3JkZXIgYnkga2V5IGxlbmd0aFxuICAgICAgICAgIGJOYW1lcy5zb3J0KChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoKTtcbiAgICAgICAgICAvLyB1c2UgYmxvY2sgbmFtZSB3aXRoIG1heCBsZW5ndGhcbiAgICAgICAgICBjb25zdCBiTmFtZSA9IGJOYW1lc1swXTtcbiAgICAgICAgICBpZiAoYk5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgICAgZXhwb3NlLFxuICAgICAgICAgICAgICByZXBlYXQsXG4gICAgICAgICAgICAgIC4uLmJPcHRzXG4gICAgICAgICAgICB9ID0gbm9ybWFsaXplT3B0cyh0aGlzLmJsb2Nrc1tiTmFtZV0pOyAvLyBUT0RPIHR5cGUgT3B0czxBcmcgJiBFeHRyYT5cbiAgICAgICAgICAgIGNvbnN0IGJsb2NrT3B0cyA9IHtcbiAgICAgICAgICAgICAgbGF6eTogdGhpcy5sYXp5LFxuICAgICAgICAgICAgICBlYWdlcjogdGhpcy5lYWdlcixcbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXJDaGFyOiB0aGlzLnBsYWNlaG9sZGVyQ2hhcixcbiAgICAgICAgICAgICAgZGlzcGxheUNoYXI6IHRoaXMuZGlzcGxheUNoYXIsXG4gICAgICAgICAgICAgIG92ZXJ3cml0ZTogdGhpcy5vdmVyd3JpdGUsXG4gICAgICAgICAgICAgIGF1dG9maXg6IHRoaXMuYXV0b2ZpeCxcbiAgICAgICAgICAgICAgLi4uYk9wdHMsXG4gICAgICAgICAgICAgIHJlcGVhdCxcbiAgICAgICAgICAgICAgcGFyZW50OiB0aGlzXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgbWFza2VkQmxvY2sgPSByZXBlYXQgIT0gbnVsbCA/IG5ldyBJTWFzay5SZXBlYXRCbG9jayhibG9ja09wdHMgLyogVE9ETyAqLykgOiBjcmVhdGVNYXNrKGJsb2NrT3B0cyk7XG4gICAgICAgICAgICBpZiAobWFza2VkQmxvY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5fYmxvY2tzLnB1c2gobWFza2VkQmxvY2spO1xuICAgICAgICAgICAgICBpZiAoZXhwb3NlKSB0aGlzLmV4cG9zZUJsb2NrID0gbWFza2VkQmxvY2s7XG5cbiAgICAgICAgICAgICAgLy8gc3RvcmUgYmxvY2sgaW5kZXhcbiAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tYXNrZWRCbG9ja3NbYk5hbWVdKSB0aGlzLl9tYXNrZWRCbG9ja3NbYk5hbWVdID0gW107XG4gICAgICAgICAgICAgIHRoaXMuX21hc2tlZEJsb2Nrc1tiTmFtZV0ucHVzaCh0aGlzLl9ibG9ja3MubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpICs9IGJOYW1lLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNoYXIgPSBwYXR0ZXJuW2ldO1xuICAgICAgICBsZXQgaXNJbnB1dCA9IChjaGFyIGluIGRlZnMpO1xuICAgICAgICBpZiAoY2hhciA9PT0gTWFza2VkUGF0dGVybi5TVE9QX0NIQVIpIHtcbiAgICAgICAgICB0aGlzLl9zdG9wcy5wdXNoKHRoaXMuX2Jsb2Nrcy5sZW5ndGgpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFyID09PSAneycgfHwgY2hhciA9PT0gJ30nKSB7XG4gICAgICAgICAgdW5tYXNraW5nQmxvY2sgPSAhdW5tYXNraW5nQmxvY2s7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYXIgPT09ICdbJyB8fCBjaGFyID09PSAnXScpIHtcbiAgICAgICAgICBvcHRpb25hbEJsb2NrID0gIW9wdGlvbmFsQmxvY2s7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYXIgPT09IE1hc2tlZFBhdHRlcm4uRVNDQVBFX0NIQVIpIHtcbiAgICAgICAgICArK2k7XG4gICAgICAgICAgY2hhciA9IHBhdHRlcm5baV07XG4gICAgICAgICAgaWYgKCFjaGFyKSBicmVhaztcbiAgICAgICAgICBpc0lucHV0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGVmID0gaXNJbnB1dCA/IG5ldyBQYXR0ZXJuSW5wdXREZWZpbml0aW9uKHtcbiAgICAgICAgICBpc09wdGlvbmFsOiBvcHRpb25hbEJsb2NrLFxuICAgICAgICAgIGxhenk6IHRoaXMubGF6eSxcbiAgICAgICAgICBlYWdlcjogdGhpcy5lYWdlcixcbiAgICAgICAgICBwbGFjZWhvbGRlckNoYXI6IHRoaXMucGxhY2Vob2xkZXJDaGFyLFxuICAgICAgICAgIGRpc3BsYXlDaGFyOiB0aGlzLmRpc3BsYXlDaGFyLFxuICAgICAgICAgIC4uLm5vcm1hbGl6ZU9wdHMoZGVmc1tjaGFyXSksXG4gICAgICAgICAgcGFyZW50OiB0aGlzXG4gICAgICAgIH0pIDogbmV3IFBhdHRlcm5GaXhlZERlZmluaXRpb24oe1xuICAgICAgICAgIGNoYXIsXG4gICAgICAgICAgZWFnZXI6IHRoaXMuZWFnZXIsXG4gICAgICAgICAgaXNVbm1hc2tpbmc6IHVubWFza2luZ0Jsb2NrXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9ibG9ja3MucHVzaChkZWYpO1xuICAgICAgfVxuICAgIH1cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5zdXBlci5zdGF0ZSxcbiAgICAgICAgX2Jsb2NrczogdGhpcy5fYmxvY2tzLm1hcChiID0+IGIuc3RhdGUpXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXQgc3RhdGUoc3RhdGUpIHtcbiAgICAgIGlmICghc3RhdGUpIHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCB7XG4gICAgICAgIF9ibG9ja3MsXG4gICAgICAgIC4uLm1hc2tlZFN0YXRlXG4gICAgICB9ID0gc3RhdGU7XG4gICAgICB0aGlzLl9ibG9ja3MuZm9yRWFjaCgoYiwgYmkpID0+IGIuc3RhdGUgPSBfYmxvY2tzW2JpXSk7XG4gICAgICBzdXBlci5zdGF0ZSA9IG1hc2tlZFN0YXRlO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgIHN1cGVyLnJlc2V0KCk7XG4gICAgICB0aGlzLl9ibG9ja3MuZm9yRWFjaChiID0+IGIucmVzZXQoKSk7XG4gICAgfVxuICAgIGdldCBpc0NvbXBsZXRlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwb3NlQmxvY2sgPyB0aGlzLmV4cG9zZUJsb2NrLmlzQ29tcGxldGUgOiB0aGlzLl9ibG9ja3MuZXZlcnkoYiA9PiBiLmlzQ29tcGxldGUpO1xuICAgIH1cbiAgICBnZXQgaXNGaWxsZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYmxvY2tzLmV2ZXJ5KGIgPT4gYi5pc0ZpbGxlZCk7XG4gICAgfVxuICAgIGdldCBpc0ZpeGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Jsb2Nrcy5ldmVyeShiID0+IGIuaXNGaXhlZCk7XG4gICAgfVxuICAgIGdldCBpc09wdGlvbmFsKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Jsb2Nrcy5ldmVyeShiID0+IGIuaXNPcHRpb25hbCk7XG4gICAgfVxuICAgIGRvQ29tbWl0KCkge1xuICAgICAgdGhpcy5fYmxvY2tzLmZvckVhY2goYiA9PiBiLmRvQ29tbWl0KCkpO1xuICAgICAgc3VwZXIuZG9Db21taXQoKTtcbiAgICB9XG4gICAgZ2V0IHVubWFza2VkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBvc2VCbG9jayA/IHRoaXMuZXhwb3NlQmxvY2sudW5tYXNrZWRWYWx1ZSA6IHRoaXMuX2Jsb2Nrcy5yZWR1Y2UoKHN0ciwgYikgPT4gc3RyICs9IGIudW5tYXNrZWRWYWx1ZSwgJycpO1xuICAgIH1cbiAgICBzZXQgdW5tYXNrZWRWYWx1ZSh1bm1hc2tlZFZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5leHBvc2VCbG9jaykge1xuICAgICAgICBjb25zdCB0YWlsID0gdGhpcy5leHRyYWN0VGFpbCh0aGlzLl9ibG9ja1N0YXJ0UG9zKHRoaXMuX2Jsb2Nrcy5pbmRleE9mKHRoaXMuZXhwb3NlQmxvY2spKSArIHRoaXMuZXhwb3NlQmxvY2suZGlzcGxheVZhbHVlLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuZXhwb3NlQmxvY2sudW5tYXNrZWRWYWx1ZSA9IHVubWFza2VkVmFsdWU7XG4gICAgICAgIHRoaXMuYXBwZW5kVGFpbCh0YWlsKTtcbiAgICAgICAgdGhpcy5kb0NvbW1pdCgpO1xuICAgICAgfSBlbHNlIHN1cGVyLnVubWFza2VkVmFsdWUgPSB1bm1hc2tlZFZhbHVlO1xuICAgIH1cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBvc2VCbG9jayA/IHRoaXMuZXhwb3NlQmxvY2sudmFsdWUgOlxuICAgICAgLy8gVE9ETyByZXR1cm4gX3ZhbHVlIHdoZW4gbm90IGluIGNoYW5nZT9cbiAgICAgIHRoaXMuX2Jsb2Nrcy5yZWR1Y2UoKHN0ciwgYikgPT4gc3RyICs9IGIudmFsdWUsICcnKTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5leHBvc2VCbG9jaykge1xuICAgICAgICBjb25zdCB0YWlsID0gdGhpcy5leHRyYWN0VGFpbCh0aGlzLl9ibG9ja1N0YXJ0UG9zKHRoaXMuX2Jsb2Nrcy5pbmRleE9mKHRoaXMuZXhwb3NlQmxvY2spKSArIHRoaXMuZXhwb3NlQmxvY2suZGlzcGxheVZhbHVlLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuZXhwb3NlQmxvY2sudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5hcHBlbmRUYWlsKHRhaWwpO1xuICAgICAgICB0aGlzLmRvQ29tbWl0KCk7XG4gICAgICB9IGVsc2Ugc3VwZXIudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgZ2V0IHR5cGVkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBvc2VCbG9jayA/IHRoaXMuZXhwb3NlQmxvY2sudHlwZWRWYWx1ZSA6IHN1cGVyLnR5cGVkVmFsdWU7XG4gICAgfVxuICAgIHNldCB0eXBlZFZhbHVlKHZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5leHBvc2VCbG9jaykge1xuICAgICAgICBjb25zdCB0YWlsID0gdGhpcy5leHRyYWN0VGFpbCh0aGlzLl9ibG9ja1N0YXJ0UG9zKHRoaXMuX2Jsb2Nrcy5pbmRleE9mKHRoaXMuZXhwb3NlQmxvY2spKSArIHRoaXMuZXhwb3NlQmxvY2suZGlzcGxheVZhbHVlLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuZXhwb3NlQmxvY2sudHlwZWRWYWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmFwcGVuZFRhaWwodGFpbCk7XG4gICAgICAgIHRoaXMuZG9Db21taXQoKTtcbiAgICAgIH0gZWxzZSBzdXBlci50eXBlZFZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIGdldCBkaXNwbGF5VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYmxvY2tzLnJlZHVjZSgoc3RyLCBiKSA9PiBzdHIgKz0gYi5kaXNwbGF5VmFsdWUsICcnKTtcbiAgICB9XG4gICAgYXBwZW5kVGFpbCh0YWlsKSB7XG4gICAgICByZXR1cm4gc3VwZXIuYXBwZW5kVGFpbCh0YWlsKS5hZ2dyZWdhdGUodGhpcy5fYXBwZW5kUGxhY2Vob2xkZXIoKSk7XG4gICAgfVxuICAgIF9hcHBlbmRFYWdlcigpIHtcbiAgICAgIHZhciBfdGhpcyRfbWFwUG9zVG9CbG9jaztcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgbGV0IHN0YXJ0QmxvY2tJbmRleCA9IChfdGhpcyRfbWFwUG9zVG9CbG9jayA9IHRoaXMuX21hcFBvc1RvQmxvY2sodGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoKSkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJF9tYXBQb3NUb0Jsb2NrLmluZGV4O1xuICAgICAgaWYgKHN0YXJ0QmxvY2tJbmRleCA9PSBudWxsKSByZXR1cm4gZGV0YWlscztcblxuICAgICAgLy8gVE9ETyB0ZXN0IGlmIGl0IHdvcmtzIGZvciBuZXN0ZWQgcGF0dGVybiBtYXNrc1xuICAgICAgaWYgKHRoaXMuX2Jsb2Nrc1tzdGFydEJsb2NrSW5kZXhdLmlzRmlsbGVkKSArK3N0YXJ0QmxvY2tJbmRleDtcbiAgICAgIGZvciAobGV0IGJpID0gc3RhcnRCbG9ja0luZGV4OyBiaSA8IHRoaXMuX2Jsb2Nrcy5sZW5ndGg7ICsrYmkpIHtcbiAgICAgICAgY29uc3QgZCA9IHRoaXMuX2Jsb2Nrc1tiaV0uX2FwcGVuZEVhZ2VyKCk7XG4gICAgICAgIGlmICghZC5pbnNlcnRlZCkgYnJlYWs7XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKGQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIF9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJsb2NrSXRlciA9IHRoaXMuX21hcFBvc1RvQmxvY2sodGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoKTtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgaWYgKCFibG9ja0l0ZXIpIHJldHVybiBkZXRhaWxzO1xuICAgICAgZm9yIChsZXQgYmkgPSBibG9ja0l0ZXIuaW5kZXgsIGJsb2NrOyBibG9jayA9IHRoaXMuX2Jsb2Nrc1tiaV07ICsrYmkpIHtcbiAgICAgICAgdmFyIF9mbGFncyRfYmVmb3JlVGFpbFN0YTtcbiAgICAgICAgY29uc3QgYmxvY2tEZXRhaWxzID0gYmxvY2suX2FwcGVuZENoYXIoY2gsIHtcbiAgICAgICAgICAuLi5mbGFncyxcbiAgICAgICAgICBfYmVmb3JlVGFpbFN0YXRlOiAoX2ZsYWdzJF9iZWZvcmVUYWlsU3RhID0gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSkgPT0gbnVsbCB8fCAoX2ZsYWdzJF9iZWZvcmVUYWlsU3RhID0gX2ZsYWdzJF9iZWZvcmVUYWlsU3RhLl9ibG9ja3MpID09IG51bGwgPyB2b2lkIDAgOiBfZmxhZ3MkX2JlZm9yZVRhaWxTdGFbYmldXG4gICAgICAgIH0pO1xuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShibG9ja0RldGFpbHMpO1xuICAgICAgICBpZiAoYmxvY2tEZXRhaWxzLmNvbnN1bWVkKSBicmVhazsgLy8gZ28gbmV4dCBjaGFyXG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgZXh0cmFjdFRhaWwoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNodW5rVGFpbCA9IG5ldyBDaHVua3NUYWlsRGV0YWlscygpO1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHRvUG9zKSByZXR1cm4gY2h1bmtUYWlsO1xuICAgICAgdGhpcy5fZm9yRWFjaEJsb2Nrc0luUmFuZ2UoZnJvbVBvcywgdG9Qb3MsIChiLCBiaSwgYkZyb21Qb3MsIGJUb1BvcykgPT4ge1xuICAgICAgICBjb25zdCBibG9ja0NodW5rID0gYi5leHRyYWN0VGFpbChiRnJvbVBvcywgYlRvUG9zKTtcbiAgICAgICAgYmxvY2tDaHVuay5zdG9wID0gdGhpcy5fZmluZFN0b3BCZWZvcmUoYmkpO1xuICAgICAgICBibG9ja0NodW5rLmZyb20gPSB0aGlzLl9ibG9ja1N0YXJ0UG9zKGJpKTtcbiAgICAgICAgaWYgKGJsb2NrQ2h1bmsgaW5zdGFuY2VvZiBDaHVua3NUYWlsRGV0YWlscykgYmxvY2tDaHVuay5ibG9ja0luZGV4ID0gYmk7XG4gICAgICAgIGNodW5rVGFpbC5leHRlbmQoYmxvY2tDaHVuayk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjaHVua1RhaWw7XG4gICAgfVxuICAgIGV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdG9Qb3MpIHJldHVybiAnJztcbiAgICAgIGxldCBpbnB1dCA9ICcnO1xuICAgICAgdGhpcy5fZm9yRWFjaEJsb2Nrc0luUmFuZ2UoZnJvbVBvcywgdG9Qb3MsIChiLCBfLCBmcm9tUG9zLCB0b1BvcykgPT4ge1xuICAgICAgICBpbnB1dCArPSBiLmV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfVxuICAgIF9maW5kU3RvcEJlZm9yZShibG9ja0luZGV4KSB7XG4gICAgICBsZXQgc3RvcEJlZm9yZTtcbiAgICAgIGZvciAobGV0IHNpID0gMDsgc2kgPCB0aGlzLl9zdG9wcy5sZW5ndGg7ICsrc2kpIHtcbiAgICAgICAgY29uc3Qgc3RvcCA9IHRoaXMuX3N0b3BzW3NpXTtcbiAgICAgICAgaWYgKHN0b3AgPD0gYmxvY2tJbmRleCkgc3RvcEJlZm9yZSA9IHN0b3A7ZWxzZSBicmVhaztcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdG9wQmVmb3JlO1xuICAgIH1cblxuICAgIC8qKiBBcHBlbmRzIHBsYWNlaG9sZGVyIGRlcGVuZGluZyBvbiBsYXppbmVzcyAqL1xuICAgIF9hcHBlbmRQbGFjZWhvbGRlcih0b0Jsb2NrSW5kZXgpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgaWYgKHRoaXMubGF6eSAmJiB0b0Jsb2NrSW5kZXggPT0gbnVsbCkgcmV0dXJuIGRldGFpbHM7XG4gICAgICBjb25zdCBzdGFydEJsb2NrSXRlciA9IHRoaXMuX21hcFBvc1RvQmxvY2sodGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoKTtcbiAgICAgIGlmICghc3RhcnRCbG9ja0l0ZXIpIHJldHVybiBkZXRhaWxzO1xuICAgICAgY29uc3Qgc3RhcnRCbG9ja0luZGV4ID0gc3RhcnRCbG9ja0l0ZXIuaW5kZXg7XG4gICAgICBjb25zdCBlbmRCbG9ja0luZGV4ID0gdG9CbG9ja0luZGV4ICE9IG51bGwgPyB0b0Jsb2NrSW5kZXggOiB0aGlzLl9ibG9ja3MubGVuZ3RoO1xuICAgICAgdGhpcy5fYmxvY2tzLnNsaWNlKHN0YXJ0QmxvY2tJbmRleCwgZW5kQmxvY2tJbmRleCkuZm9yRWFjaChiID0+IHtcbiAgICAgICAgaWYgKCFiLmxhenkgfHwgdG9CbG9ja0luZGV4ICE9IG51bGwpIHtcbiAgICAgICAgICB2YXIgX2Jsb2NrczI7XG4gICAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUoYi5fYXBwZW5kUGxhY2Vob2xkZXIoKF9ibG9ja3MyID0gYi5fYmxvY2tzKSA9PSBudWxsID8gdm9pZCAwIDogX2Jsb2NrczIubGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuXG4gICAgLyoqIEZpbmRzIGJsb2NrIGluIHBvcyAqL1xuICAgIF9tYXBQb3NUb0Jsb2NrKHBvcykge1xuICAgICAgbGV0IGFjY1ZhbCA9ICcnO1xuICAgICAgZm9yIChsZXQgYmkgPSAwOyBiaSA8IHRoaXMuX2Jsb2Nrcy5sZW5ndGg7ICsrYmkpIHtcbiAgICAgICAgY29uc3QgYmxvY2sgPSB0aGlzLl9ibG9ja3NbYmldO1xuICAgICAgICBjb25zdCBibG9ja1N0YXJ0UG9zID0gYWNjVmFsLmxlbmd0aDtcbiAgICAgICAgYWNjVmFsICs9IGJsb2NrLmRpc3BsYXlWYWx1ZTtcbiAgICAgICAgaWYgKHBvcyA8PSBhY2NWYWwubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGluZGV4OiBiaSxcbiAgICAgICAgICAgIG9mZnNldDogcG9zIC0gYmxvY2tTdGFydFBvc1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgX2Jsb2NrU3RhcnRQb3MoYmxvY2tJbmRleCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Jsb2Nrcy5zbGljZSgwLCBibG9ja0luZGV4KS5yZWR1Y2UoKHBvcywgYikgPT4gcG9zICs9IGIuZGlzcGxheVZhbHVlLmxlbmd0aCwgMCk7XG4gICAgfVxuICAgIF9mb3JFYWNoQmxvY2tzSW5SYW5nZShmcm9tUG9zLCB0b1BvcywgZm4pIHtcbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgY29uc3QgZnJvbUJsb2NrSXRlciA9IHRoaXMuX21hcFBvc1RvQmxvY2soZnJvbVBvcyk7XG4gICAgICBpZiAoZnJvbUJsb2NrSXRlcikge1xuICAgICAgICBjb25zdCB0b0Jsb2NrSXRlciA9IHRoaXMuX21hcFBvc1RvQmxvY2sodG9Qb3MpO1xuICAgICAgICAvLyBwcm9jZXNzIGZpcnN0IGJsb2NrXG4gICAgICAgIGNvbnN0IGlzU2FtZUJsb2NrID0gdG9CbG9ja0l0ZXIgJiYgZnJvbUJsb2NrSXRlci5pbmRleCA9PT0gdG9CbG9ja0l0ZXIuaW5kZXg7XG4gICAgICAgIGNvbnN0IGZyb21CbG9ja1N0YXJ0UG9zID0gZnJvbUJsb2NrSXRlci5vZmZzZXQ7XG4gICAgICAgIGNvbnN0IGZyb21CbG9ja0VuZFBvcyA9IHRvQmxvY2tJdGVyICYmIGlzU2FtZUJsb2NrID8gdG9CbG9ja0l0ZXIub2Zmc2V0IDogdGhpcy5fYmxvY2tzW2Zyb21CbG9ja0l0ZXIuaW5kZXhdLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICAgIGZuKHRoaXMuX2Jsb2Nrc1tmcm9tQmxvY2tJdGVyLmluZGV4XSwgZnJvbUJsb2NrSXRlci5pbmRleCwgZnJvbUJsb2NrU3RhcnRQb3MsIGZyb21CbG9ja0VuZFBvcyk7XG4gICAgICAgIGlmICh0b0Jsb2NrSXRlciAmJiAhaXNTYW1lQmxvY2spIHtcbiAgICAgICAgICAvLyBwcm9jZXNzIGludGVybWVkaWF0ZSBibG9ja3NcbiAgICAgICAgICBmb3IgKGxldCBiaSA9IGZyb21CbG9ja0l0ZXIuaW5kZXggKyAxOyBiaSA8IHRvQmxvY2tJdGVyLmluZGV4OyArK2JpKSB7XG4gICAgICAgICAgICBmbih0aGlzLl9ibG9ja3NbYmldLCBiaSwgMCwgdGhpcy5fYmxvY2tzW2JpXS5kaXNwbGF5VmFsdWUubGVuZ3RoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBwcm9jZXNzIGxhc3QgYmxvY2tcbiAgICAgICAgICBmbih0aGlzLl9ibG9ja3NbdG9CbG9ja0l0ZXIuaW5kZXhdLCB0b0Jsb2NrSXRlci5pbmRleCwgMCwgdG9CbG9ja0l0ZXIub2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZW1vdmUoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlbW92ZURldGFpbHMgPSBzdXBlci5yZW1vdmUoZnJvbVBvcywgdG9Qb3MpO1xuICAgICAgdGhpcy5fZm9yRWFjaEJsb2Nrc0luUmFuZ2UoZnJvbVBvcywgdG9Qb3MsIChiLCBfLCBiRnJvbVBvcywgYlRvUG9zKSA9PiB7XG4gICAgICAgIHJlbW92ZURldGFpbHMuYWdncmVnYXRlKGIucmVtb3ZlKGJGcm9tUG9zLCBiVG9Qb3MpKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlbW92ZURldGFpbHM7XG4gICAgfVxuICAgIG5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIGRpcmVjdGlvbikge1xuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IERJUkVDVElPTi5OT05FO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLl9ibG9ja3MubGVuZ3RoKSByZXR1cm4gMDtcbiAgICAgIGNvbnN0IGN1cnNvciA9IG5ldyBQYXR0ZXJuQ3Vyc29yKHRoaXMsIGN1cnNvclBvcyk7XG4gICAgICBpZiAoZGlyZWN0aW9uID09PSBESVJFQ1RJT04uTk9ORSkge1xuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vIE5PTkUgc2hvdWxkIG9ubHkgZ28gb3V0IGZyb20gZml4ZWQgdG8gdGhlIHJpZ2h0IVxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIGlmIChjdXJzb3IucHVzaFJpZ2h0QmVmb3JlSW5wdXQoKSkgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgIGN1cnNvci5wb3BTdGF0ZSgpO1xuICAgICAgICBpZiAoY3Vyc29yLnB1c2hMZWZ0QmVmb3JlSW5wdXQoKSkgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIC8vIEZPUkNFIGlzIG9ubHkgYWJvdXQgYXwqIG90aGVyd2lzZSBpcyAwXG4gICAgICBpZiAoZGlyZWN0aW9uID09PSBESVJFQ1RJT04uTEVGVCB8fCBkaXJlY3Rpb24gPT09IERJUkVDVElPTi5GT1JDRV9MRUZUKSB7XG4gICAgICAgIC8vIHRyeSB0byBicmVhayBmYXN0IHdoZW4gKnxhXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09IERJUkVDVElPTi5MRUZUKSB7XG4gICAgICAgICAgY3Vyc29yLnB1c2hSaWdodEJlZm9yZUZpbGxlZCgpO1xuICAgICAgICAgIGlmIChjdXJzb3Iub2sgJiYgY3Vyc29yLnBvcyA9PT0gY3Vyc29yUG9zKSByZXR1cm4gY3Vyc29yUG9zO1xuICAgICAgICAgIGN1cnNvci5wb3BTdGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9yd2FyZCBmbG93XG4gICAgICAgIGN1cnNvci5wdXNoTGVmdEJlZm9yZUlucHV0KCk7XG4gICAgICAgIGN1cnNvci5wdXNoTGVmdEJlZm9yZVJlcXVpcmVkKCk7XG4gICAgICAgIGN1cnNvci5wdXNoTGVmdEJlZm9yZUZpbGxlZCgpO1xuXG4gICAgICAgIC8vIGJhY2t3YXJkIGZsb3dcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkxFRlQpIHtcbiAgICAgICAgICBjdXJzb3IucHVzaFJpZ2h0QmVmb3JlSW5wdXQoKTtcbiAgICAgICAgICBjdXJzb3IucHVzaFJpZ2h0QmVmb3JlUmVxdWlyZWQoKTtcbiAgICAgICAgICBpZiAoY3Vyc29yLm9rICYmIGN1cnNvci5wb3MgPD0gY3Vyc29yUG9zKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgICBjdXJzb3IucG9wU3RhdGUoKTtcbiAgICAgICAgICBpZiAoY3Vyc29yLm9rICYmIGN1cnNvci5wb3MgPD0gY3Vyc29yUG9zKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgICBjdXJzb3IucG9wU3RhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY3Vyc29yLm9rKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkZPUkNFX0xFRlQpIHJldHVybiAwO1xuICAgICAgICBjdXJzb3IucG9wU3RhdGUoKTtcbiAgICAgICAgaWYgKGN1cnNvci5vaykgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgIGN1cnNvci5wb3BTdGF0ZSgpO1xuICAgICAgICBpZiAoY3Vyc29yLm9rKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgICBpZiAoZGlyZWN0aW9uID09PSBESVJFQ1RJT04uUklHSFQgfHwgZGlyZWN0aW9uID09PSBESVJFQ1RJT04uRk9SQ0VfUklHSFQpIHtcbiAgICAgICAgLy8gZm9yd2FyZCBmbG93XG4gICAgICAgIGN1cnNvci5wdXNoUmlnaHRCZWZvcmVJbnB1dCgpO1xuICAgICAgICBjdXJzb3IucHVzaFJpZ2h0QmVmb3JlUmVxdWlyZWQoKTtcbiAgICAgICAgaWYgKGN1cnNvci5wdXNoUmlnaHRCZWZvcmVGaWxsZWQoKSkgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09IERJUkVDVElPTi5GT1JDRV9SSUdIVCkgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcblxuICAgICAgICAvLyBiYWNrd2FyZCBmbG93XG4gICAgICAgIGN1cnNvci5wb3BTdGF0ZSgpO1xuICAgICAgICBpZiAoY3Vyc29yLm9rKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgY3Vyc29yLnBvcFN0YXRlKCk7XG4gICAgICAgIGlmIChjdXJzb3Iub2spIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICByZXR1cm4gdGhpcy5uZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBESVJFQ1RJT04uTEVGVCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3Vyc29yUG9zO1xuICAgIH1cbiAgICB0b3RhbElucHV0UG9zaXRpb25zKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBsZXQgdG90YWwgPSAwO1xuICAgICAgdGhpcy5fZm9yRWFjaEJsb2Nrc0luUmFuZ2UoZnJvbVBvcywgdG9Qb3MsIChiLCBfLCBiRnJvbVBvcywgYlRvUG9zKSA9PiB7XG4gICAgICAgIHRvdGFsICs9IGIudG90YWxJbnB1dFBvc2l0aW9ucyhiRnJvbVBvcywgYlRvUG9zKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRvdGFsO1xuICAgIH1cblxuICAgIC8qKiBHZXQgYmxvY2sgYnkgbmFtZSAqL1xuICAgIG1hc2tlZEJsb2NrKG5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZEJsb2NrcyhuYW1lKVswXTtcbiAgICB9XG5cbiAgICAvKiogR2V0IGFsbCBibG9ja3MgYnkgbmFtZSAqL1xuICAgIG1hc2tlZEJsb2NrcyhuYW1lKSB7XG4gICAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5fbWFza2VkQmxvY2tzW25hbWVdO1xuICAgICAgaWYgKCFpbmRpY2VzKSByZXR1cm4gW107XG4gICAgICByZXR1cm4gaW5kaWNlcy5tYXAoZ2kgPT4gdGhpcy5fYmxvY2tzW2dpXSk7XG4gICAgfVxuICAgIHBhZChmbGFncykge1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICB0aGlzLl9mb3JFYWNoQmxvY2tzSW5SYW5nZSgwLCB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgsIGIgPT4gZGV0YWlscy5hZ2dyZWdhdGUoYi5wYWQoZmxhZ3MpKSk7XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gIH1cbiAgTWFza2VkUGF0dGVybi5ERUZBVUxUUyA9IHtcbiAgICAuLi5NYXNrZWQuREVGQVVMVFMsXG4gICAgbGF6eTogdHJ1ZSxcbiAgICBwbGFjZWhvbGRlckNoYXI6ICdfJ1xuICB9O1xuICBNYXNrZWRQYXR0ZXJuLlNUT1BfQ0hBUiA9ICdgJztcbiAgTWFza2VkUGF0dGVybi5FU0NBUEVfQ0hBUiA9ICdcXFxcJztcbiAgTWFza2VkUGF0dGVybi5JbnB1dERlZmluaXRpb24gPSBQYXR0ZXJuSW5wdXREZWZpbml0aW9uO1xuICBNYXNrZWRQYXR0ZXJuLkZpeGVkRGVmaW5pdGlvbiA9IFBhdHRlcm5GaXhlZERlZmluaXRpb247XG4gIElNYXNrLk1hc2tlZFBhdHRlcm4gPSBNYXNrZWRQYXR0ZXJuO1xuXG4gIC8qKiBQYXR0ZXJuIHdoaWNoIGFjY2VwdHMgcmFuZ2VzICovXG4gIGNsYXNzIE1hc2tlZFJhbmdlIGV4dGVuZHMgTWFza2VkUGF0dGVybiB7XG4gICAgLyoqXG4gICAgICBPcHRpb25hbGx5IHNldHMgbWF4IGxlbmd0aCBvZiBwYXR0ZXJuLlxuICAgICAgVXNlZCB3aGVuIHBhdHRlcm4gbGVuZ3RoIGlzIGxvbmdlciB0aGVuIGB0b2AgcGFyYW0gbGVuZ3RoLiBQYWRzIHplcm9zIGF0IHN0YXJ0IGluIHRoaXMgY2FzZS5cbiAgICAqL1xuXG4gICAgLyoqIE1pbiBib3VuZCAqL1xuXG4gICAgLyoqIE1heCBib3VuZCAqL1xuXG4gICAgZ2V0IF9tYXRjaEZyb20oKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXhMZW5ndGggLSBTdHJpbmcodGhpcy5mcm9tKS5sZW5ndGg7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIHN1cGVyKG9wdHMpOyAvLyBtYXNrIHdpbGwgYmUgY3JlYXRlZCBpbiBfdXBkYXRlXG4gICAgfVxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHRvID0gdGhpcy50byB8fCAwLFxuICAgICAgICBmcm9tID0gdGhpcy5mcm9tIHx8IDAsXG4gICAgICAgIG1heExlbmd0aCA9IHRoaXMubWF4TGVuZ3RoIHx8IDAsXG4gICAgICAgIGF1dG9maXggPSB0aGlzLmF1dG9maXgsXG4gICAgICAgIC4uLnBhdHRlcm5PcHRzXG4gICAgICB9ID0gb3B0cztcbiAgICAgIHRoaXMudG8gPSB0bztcbiAgICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgICB0aGlzLm1heExlbmd0aCA9IE1hdGgubWF4KFN0cmluZyh0bykubGVuZ3RoLCBtYXhMZW5ndGgpO1xuICAgICAgdGhpcy5hdXRvZml4ID0gYXV0b2ZpeDtcbiAgICAgIGNvbnN0IGZyb21TdHIgPSBTdHJpbmcodGhpcy5mcm9tKS5wYWRTdGFydCh0aGlzLm1heExlbmd0aCwgJzAnKTtcbiAgICAgIGNvbnN0IHRvU3RyID0gU3RyaW5nKHRoaXMudG8pLnBhZFN0YXJ0KHRoaXMubWF4TGVuZ3RoLCAnMCcpO1xuICAgICAgbGV0IHNhbWVDaGFyc0NvdW50ID0gMDtcbiAgICAgIHdoaWxlIChzYW1lQ2hhcnNDb3VudCA8IHRvU3RyLmxlbmd0aCAmJiB0b1N0cltzYW1lQ2hhcnNDb3VudF0gPT09IGZyb21TdHJbc2FtZUNoYXJzQ291bnRdKSArK3NhbWVDaGFyc0NvdW50O1xuICAgICAgcGF0dGVybk9wdHMubWFzayA9IHRvU3RyLnNsaWNlKDAsIHNhbWVDaGFyc0NvdW50KS5yZXBsYWNlKC8wL2csICdcXFxcMCcpICsgJzAnLnJlcGVhdCh0aGlzLm1heExlbmd0aCAtIHNhbWVDaGFyc0NvdW50KTtcbiAgICAgIHN1cGVyLl91cGRhdGUocGF0dGVybk9wdHMpO1xuICAgIH1cbiAgICBnZXQgaXNDb21wbGV0ZSgpIHtcbiAgICAgIHJldHVybiBzdXBlci5pc0NvbXBsZXRlICYmIEJvb2xlYW4odGhpcy52YWx1ZSk7XG4gICAgfVxuICAgIGJvdW5kYXJpZXMoc3RyKSB7XG4gICAgICBsZXQgbWluc3RyID0gJyc7XG4gICAgICBsZXQgbWF4c3RyID0gJyc7XG4gICAgICBjb25zdCBbLCBwbGFjZWhvbGRlciwgbnVtXSA9IHN0ci5tYXRjaCgvXihcXEQqKShcXGQqKShcXEQqKS8pIHx8IFtdO1xuICAgICAgaWYgKG51bSkge1xuICAgICAgICBtaW5zdHIgPSAnMCcucmVwZWF0KHBsYWNlaG9sZGVyLmxlbmd0aCkgKyBudW07XG4gICAgICAgIG1heHN0ciA9ICc5Jy5yZXBlYXQocGxhY2Vob2xkZXIubGVuZ3RoKSArIG51bTtcbiAgICAgIH1cbiAgICAgIG1pbnN0ciA9IG1pbnN0ci5wYWRFbmQodGhpcy5tYXhMZW5ndGgsICcwJyk7XG4gICAgICBtYXhzdHIgPSBtYXhzdHIucGFkRW5kKHRoaXMubWF4TGVuZ3RoLCAnOScpO1xuICAgICAgcmV0dXJuIFttaW5zdHIsIG1heHN0cl07XG4gICAgfVxuICAgIGRvUHJlcGFyZUNoYXIoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgbGV0IGRldGFpbHM7XG4gICAgICBbY2gsIGRldGFpbHNdID0gc3VwZXIuZG9QcmVwYXJlQ2hhcihjaC5yZXBsYWNlKC9cXEQvZywgJycpLCBmbGFncyk7XG4gICAgICBpZiAoIWNoKSBkZXRhaWxzLnNraXAgPSAhdGhpcy5pc0NvbXBsZXRlO1xuICAgICAgcmV0dXJuIFtjaCwgZGV0YWlsc107XG4gICAgfVxuICAgIF9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5hdXRvZml4IHx8IHRoaXMudmFsdWUubGVuZ3RoICsgMSA+IHRoaXMubWF4TGVuZ3RoKSByZXR1cm4gc3VwZXIuX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKTtcbiAgICAgIGNvbnN0IGZyb21TdHIgPSBTdHJpbmcodGhpcy5mcm9tKS5wYWRTdGFydCh0aGlzLm1heExlbmd0aCwgJzAnKTtcbiAgICAgIGNvbnN0IHRvU3RyID0gU3RyaW5nKHRoaXMudG8pLnBhZFN0YXJ0KHRoaXMubWF4TGVuZ3RoLCAnMCcpO1xuICAgICAgY29uc3QgW21pbnN0ciwgbWF4c3RyXSA9IHRoaXMuYm91bmRhcmllcyh0aGlzLnZhbHVlICsgY2gpO1xuICAgICAgaWYgKE51bWJlcihtYXhzdHIpIDwgdGhpcy5mcm9tKSByZXR1cm4gc3VwZXIuX2FwcGVuZENoYXJSYXcoZnJvbVN0clt0aGlzLnZhbHVlLmxlbmd0aF0sIGZsYWdzKTtcbiAgICAgIGlmIChOdW1iZXIobWluc3RyKSA+IHRoaXMudG8pIHtcbiAgICAgICAgaWYgKCFmbGFncy50YWlsICYmIHRoaXMuYXV0b2ZpeCA9PT0gJ3BhZCcgJiYgdGhpcy52YWx1ZS5sZW5ndGggKyAxIDwgdGhpcy5tYXhMZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gc3VwZXIuX2FwcGVuZENoYXJSYXcoZnJvbVN0clt0aGlzLnZhbHVlLmxlbmd0aF0sIGZsYWdzKS5hZ2dyZWdhdGUodGhpcy5fYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwZXIuX2FwcGVuZENoYXJSYXcodG9TdHJbdGhpcy52YWx1ZS5sZW5ndGhdLCBmbGFncyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3VwZXIuX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKTtcbiAgICB9XG4gICAgZG9WYWxpZGF0ZShmbGFncykge1xuICAgICAgY29uc3Qgc3RyID0gdGhpcy52YWx1ZTtcbiAgICAgIGNvbnN0IGZpcnN0Tm9uWmVybyA9IHN0ci5zZWFyY2goL1teMF0vKTtcbiAgICAgIGlmIChmaXJzdE5vblplcm8gPT09IC0xICYmIHN0ci5sZW5ndGggPD0gdGhpcy5fbWF0Y2hGcm9tKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGNvbnN0IFttaW5zdHIsIG1heHN0cl0gPSB0aGlzLmJvdW5kYXJpZXMoc3RyKTtcbiAgICAgIHJldHVybiB0aGlzLmZyb20gPD0gTnVtYmVyKG1heHN0cikgJiYgTnVtYmVyKG1pbnN0cikgPD0gdGhpcy50byAmJiBzdXBlci5kb1ZhbGlkYXRlKGZsYWdzKTtcbiAgICB9XG4gICAgcGFkKGZsYWdzKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGlmICh0aGlzLnZhbHVlLmxlbmd0aCA9PT0gdGhpcy5tYXhMZW5ndGgpIHJldHVybiBkZXRhaWxzO1xuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLnZhbHVlO1xuICAgICAgY29uc3QgcGFkTGVuZ3RoID0gdGhpcy5tYXhMZW5ndGggLSB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgICAgIGlmIChwYWRMZW5ndGgpIHtcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhZExlbmd0aDsgKytpKSB7XG4gICAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUoc3VwZXIuX2FwcGVuZENoYXJSYXcoJzAnLCBmbGFncykpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYXBwZW5kIHRhaWxcbiAgICAgICAgdmFsdWUuc3BsaXQoJycpLmZvckVhY2goY2ggPT4gdGhpcy5fYXBwZW5kQ2hhclJhdyhjaCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICB9XG4gIElNYXNrLk1hc2tlZFJhbmdlID0gTWFza2VkUmFuZ2U7XG5cbiAgY29uc3QgRGVmYXVsdFBhdHRlcm4gPSAnZHsufWBtey59YFknO1xuXG4gIC8vIE1ha2UgZm9ybWF0IGFuZCBwYXJzZSByZXF1aXJlZCB3aGVuIHBhdHRlcm4gaXMgcHJvdmlkZWRcblxuICAvKiogRGF0ZSBtYXNrICovXG4gIGNsYXNzIE1hc2tlZERhdGUgZXh0ZW5kcyBNYXNrZWRQYXR0ZXJuIHtcbiAgICBzdGF0aWMgZXh0cmFjdFBhdHRlcm5PcHRpb25zKG9wdHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbWFzayxcbiAgICAgICAgcGF0dGVybixcbiAgICAgICAgLi4ucGF0dGVybk9wdHNcbiAgICAgIH0gPSBvcHRzO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4ucGF0dGVybk9wdHMsXG4gICAgICAgIG1hc2s6IGlzU3RyaW5nKG1hc2spID8gbWFzayA6IHBhdHRlcm5cbiAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqIFBhdHRlcm4gbWFzayBmb3IgZGF0ZSBhY2NvcmRpbmcgdG8ge0BsaW5rIE1hc2tlZERhdGUjZm9ybWF0fSAqL1xuXG4gICAgLyoqIFN0YXJ0IGRhdGUgKi9cblxuICAgIC8qKiBFbmQgZGF0ZSAqL1xuXG4gICAgLyoqIEZvcm1hdCB0eXBlZCB2YWx1ZSB0byBzdHJpbmcgKi9cblxuICAgIC8qKiBQYXJzZSBzdHJpbmcgdG8gZ2V0IHR5cGVkIHZhbHVlICovXG5cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBzdXBlcihNYXNrZWREYXRlLmV4dHJhY3RQYXR0ZXJuT3B0aW9ucyh7XG4gICAgICAgIC4uLk1hc2tlZERhdGUuREVGQVVMVFMsXG4gICAgICAgIC4uLm9wdHNcbiAgICAgIH0pKTtcbiAgICB9XG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbWFzayxcbiAgICAgICAgcGF0dGVybixcbiAgICAgICAgYmxvY2tzLFxuICAgICAgICAuLi5wYXR0ZXJuT3B0c1xuICAgICAgfSA9IHtcbiAgICAgICAgLi4uTWFza2VkRGF0ZS5ERUZBVUxUUyxcbiAgICAgICAgLi4ub3B0c1xuICAgICAgfTtcbiAgICAgIGNvbnN0IHBhdHRlcm5CbG9ja3MgPSBPYmplY3QuYXNzaWduKHt9LCBNYXNrZWREYXRlLkdFVF9ERUZBVUxUX0JMT0NLUygpKTtcbiAgICAgIC8vIGFkanVzdCB5ZWFyIGJsb2NrXG4gICAgICBpZiAob3B0cy5taW4pIHBhdHRlcm5CbG9ja3MuWS5mcm9tID0gb3B0cy5taW4uZ2V0RnVsbFllYXIoKTtcbiAgICAgIGlmIChvcHRzLm1heCkgcGF0dGVybkJsb2Nrcy5ZLnRvID0gb3B0cy5tYXguZ2V0RnVsbFllYXIoKTtcbiAgICAgIGlmIChvcHRzLm1pbiAmJiBvcHRzLm1heCAmJiBwYXR0ZXJuQmxvY2tzLlkuZnJvbSA9PT0gcGF0dGVybkJsb2Nrcy5ZLnRvKSB7XG4gICAgICAgIHBhdHRlcm5CbG9ja3MubS5mcm9tID0gb3B0cy5taW4uZ2V0TW9udGgoKSArIDE7XG4gICAgICAgIHBhdHRlcm5CbG9ja3MubS50byA9IG9wdHMubWF4LmdldE1vbnRoKCkgKyAxO1xuICAgICAgICBpZiAocGF0dGVybkJsb2Nrcy5tLmZyb20gPT09IHBhdHRlcm5CbG9ja3MubS50bykge1xuICAgICAgICAgIHBhdHRlcm5CbG9ja3MuZC5mcm9tID0gb3B0cy5taW4uZ2V0RGF0ZSgpO1xuICAgICAgICAgIHBhdHRlcm5CbG9ja3MuZC50byA9IG9wdHMubWF4LmdldERhdGUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgT2JqZWN0LmFzc2lnbihwYXR0ZXJuQmxvY2tzLCB0aGlzLmJsb2NrcywgYmxvY2tzKTtcbiAgICAgIHN1cGVyLl91cGRhdGUoe1xuICAgICAgICAuLi5wYXR0ZXJuT3B0cyxcbiAgICAgICAgbWFzazogaXNTdHJpbmcobWFzaykgPyBtYXNrIDogcGF0dGVybixcbiAgICAgICAgYmxvY2tzOiBwYXR0ZXJuQmxvY2tzXG4gICAgICB9KTtcbiAgICB9XG4gICAgZG9WYWxpZGF0ZShmbGFncykge1xuICAgICAgY29uc3QgZGF0ZSA9IHRoaXMuZGF0ZTtcbiAgICAgIHJldHVybiBzdXBlci5kb1ZhbGlkYXRlKGZsYWdzKSAmJiAoIXRoaXMuaXNDb21wbGV0ZSB8fCB0aGlzLmlzRGF0ZUV4aXN0KHRoaXMudmFsdWUpICYmIGRhdGUgIT0gbnVsbCAmJiAodGhpcy5taW4gPT0gbnVsbCB8fCB0aGlzLm1pbiA8PSBkYXRlKSAmJiAodGhpcy5tYXggPT0gbnVsbCB8fCBkYXRlIDw9IHRoaXMubWF4KSk7XG4gICAgfVxuXG4gICAgLyoqIENoZWNrcyBpZiBkYXRlIGlzIGV4aXN0cyAqL1xuICAgIGlzRGF0ZUV4aXN0KHN0cikge1xuICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0KHRoaXMucGFyc2Uoc3RyLCB0aGlzKSwgdGhpcykuaW5kZXhPZihzdHIpID49IDA7XG4gICAgfVxuXG4gICAgLyoqIFBhcnNlZCBEYXRlICovXG4gICAgZ2V0IGRhdGUoKSB7XG4gICAgICByZXR1cm4gdGhpcy50eXBlZFZhbHVlO1xuICAgIH1cbiAgICBzZXQgZGF0ZShkYXRlKSB7XG4gICAgICB0aGlzLnR5cGVkVmFsdWUgPSBkYXRlO1xuICAgIH1cbiAgICBnZXQgdHlwZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlzQ29tcGxldGUgPyBzdXBlci50eXBlZFZhbHVlIDogbnVsbDtcbiAgICB9XG4gICAgc2V0IHR5cGVkVmFsdWUodmFsdWUpIHtcbiAgICAgIHN1cGVyLnR5cGVkVmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgbWFza0VxdWFscyhtYXNrKSB7XG4gICAgICByZXR1cm4gbWFzayA9PT0gRGF0ZSB8fCBzdXBlci5tYXNrRXF1YWxzKG1hc2spO1xuICAgIH1cbiAgICBvcHRpb25zSXNDaGFuZ2VkKG9wdHMpIHtcbiAgICAgIHJldHVybiBzdXBlci5vcHRpb25zSXNDaGFuZ2VkKE1hc2tlZERhdGUuZXh0cmFjdFBhdHRlcm5PcHRpb25zKG9wdHMpKTtcbiAgICB9XG4gIH1cbiAgTWFza2VkRGF0ZS5HRVRfREVGQVVMVF9CTE9DS1MgPSAoKSA9PiAoe1xuICAgIGQ6IHtcbiAgICAgIG1hc2s6IE1hc2tlZFJhbmdlLFxuICAgICAgZnJvbTogMSxcbiAgICAgIHRvOiAzMSxcbiAgICAgIG1heExlbmd0aDogMlxuICAgIH0sXG4gICAgbToge1xuICAgICAgbWFzazogTWFza2VkUmFuZ2UsXG4gICAgICBmcm9tOiAxLFxuICAgICAgdG86IDEyLFxuICAgICAgbWF4TGVuZ3RoOiAyXG4gICAgfSxcbiAgICBZOiB7XG4gICAgICBtYXNrOiBNYXNrZWRSYW5nZSxcbiAgICAgIGZyb206IDE5MDAsXG4gICAgICB0bzogOTk5OVxuICAgIH1cbiAgfSk7XG4gIE1hc2tlZERhdGUuREVGQVVMVFMgPSB7XG4gICAgLi4uTWFza2VkUGF0dGVybi5ERUZBVUxUUyxcbiAgICBtYXNrOiBEYXRlLFxuICAgIHBhdHRlcm46IERlZmF1bHRQYXR0ZXJuLFxuICAgIGZvcm1hdDogKGRhdGUsIG1hc2tlZCkgPT4ge1xuICAgICAgaWYgKCFkYXRlKSByZXR1cm4gJyc7XG4gICAgICBjb25zdCBkYXkgPSBTdHJpbmcoZGF0ZS5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJyk7XG4gICAgICBjb25zdCBtb250aCA9IFN0cmluZyhkYXRlLmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCAnMCcpO1xuICAgICAgY29uc3QgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgIHJldHVybiBbZGF5LCBtb250aCwgeWVhcl0uam9pbignLicpO1xuICAgIH0sXG4gICAgcGFyc2U6IChzdHIsIG1hc2tlZCkgPT4ge1xuICAgICAgY29uc3QgW2RheSwgbW9udGgsIHllYXJdID0gc3RyLnNwbGl0KCcuJykubWFwKE51bWJlcik7XG4gICAgICByZXR1cm4gbmV3IERhdGUoeWVhciwgbW9udGggLSAxLCBkYXkpO1xuICAgIH1cbiAgfTtcbiAgSU1hc2suTWFza2VkRGF0ZSA9IE1hc2tlZERhdGU7XG5cbiAgLyoqIER5bmFtaWMgbWFzayBmb3IgY2hvb3NpbmcgYXBwcm9wcmlhdGUgbWFzayBpbiBydW4tdGltZSAqL1xuICBjbGFzcyBNYXNrZWREeW5hbWljIGV4dGVuZHMgTWFza2VkIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICBzdXBlcih7XG4gICAgICAgIC4uLk1hc2tlZER5bmFtaWMuREVGQVVMVFMsXG4gICAgICAgIC4uLm9wdHNcbiAgICAgIH0pO1xuICAgICAgdGhpcy5jdXJyZW50TWFzayA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIHN1cGVyLl91cGRhdGUob3B0cyk7XG4gICAgICBpZiAoJ21hc2snIGluIG9wdHMpIHtcbiAgICAgICAgdGhpcy5leHBvc2VNYXNrID0gdW5kZWZpbmVkO1xuICAgICAgICAvLyBtYXNrIGNvdWxkIGJlIHRvdGFsbHkgZHluYW1pYyB3aXRoIG9ubHkgYGRpc3BhdGNoYCBvcHRpb25cbiAgICAgICAgdGhpcy5jb21waWxlZE1hc2tzID0gQXJyYXkuaXNBcnJheShvcHRzLm1hc2spID8gb3B0cy5tYXNrLm1hcChtID0+IHtcbiAgICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBleHBvc2UsXG4gICAgICAgICAgICAuLi5tYXNrT3B0c1xuICAgICAgICAgIH0gPSBub3JtYWxpemVPcHRzKG0pO1xuICAgICAgICAgIGNvbnN0IG1hc2tlZCA9IGNyZWF0ZU1hc2soe1xuICAgICAgICAgICAgb3ZlcndyaXRlOiB0aGlzLl9vdmVyd3JpdGUsXG4gICAgICAgICAgICBlYWdlcjogdGhpcy5fZWFnZXIsXG4gICAgICAgICAgICBza2lwSW52YWxpZDogdGhpcy5fc2tpcEludmFsaWQsXG4gICAgICAgICAgICAuLi5tYXNrT3B0c1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChleHBvc2UpIHRoaXMuZXhwb3NlTWFzayA9IG1hc2tlZDtcbiAgICAgICAgICByZXR1cm4gbWFza2VkO1xuICAgICAgICB9KSA6IFtdO1xuXG4gICAgICAgIC8vIHRoaXMuY3VycmVudE1hc2sgPSB0aGlzLmRvRGlzcGF0Y2goJycpOyAvLyBwcm9iYWJseSBub3QgbmVlZGVkIGJ1dCBsZXRzIHNlZVxuICAgICAgfVxuICAgIH1cbiAgICBfYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBjb25zdCBkZXRhaWxzID0gdGhpcy5fYXBwbHlEaXNwYXRjaChjaCwgZmxhZ3MpO1xuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHtcbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5jdXJyZW50TWFzay5fYXBwZW5kQ2hhcihjaCwgdGhpcy5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIF9hcHBseURpc3BhdGNoKGFwcGVuZGVkLCBmbGFncywgdGFpbCkge1xuICAgICAgaWYgKGFwcGVuZGVkID09PSB2b2lkIDApIHtcbiAgICAgICAgYXBwZW5kZWQgPSAnJztcbiAgICAgIH1cbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAodGFpbCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRhaWwgPSAnJztcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByZXZWYWx1ZUJlZm9yZVRhaWwgPSBmbGFncy50YWlsICYmIGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUgIT0gbnVsbCA/IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUuX3ZhbHVlIDogdGhpcy52YWx1ZTtcbiAgICAgIGNvbnN0IGlucHV0VmFsdWUgPSB0aGlzLnJhd0lucHV0VmFsdWU7XG4gICAgICBjb25zdCBpbnNlcnRWYWx1ZSA9IGZsYWdzLnRhaWwgJiYgZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSAhPSBudWxsID8gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZS5fcmF3SW5wdXRWYWx1ZSA6IGlucHV0VmFsdWU7XG4gICAgICBjb25zdCB0YWlsVmFsdWUgPSBpbnB1dFZhbHVlLnNsaWNlKGluc2VydFZhbHVlLmxlbmd0aCk7XG4gICAgICBjb25zdCBwcmV2TWFzayA9IHRoaXMuY3VycmVudE1hc2s7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGNvbnN0IHByZXZNYXNrU3RhdGUgPSBwcmV2TWFzayA9PSBudWxsID8gdm9pZCAwIDogcHJldk1hc2suc3RhdGU7XG5cbiAgICAgIC8vIGNsb25lIGZsYWdzIHRvIHByZXZlbnQgb3ZlcndyaXRpbmcgYF9iZWZvcmVUYWlsU3RhdGVgXG4gICAgICB0aGlzLmN1cnJlbnRNYXNrID0gdGhpcy5kb0Rpc3BhdGNoKGFwcGVuZGVkLCB7XG4gICAgICAgIC4uLmZsYWdzXG4gICAgICB9LCB0YWlsKTtcblxuICAgICAgLy8gcmVzdG9yZSBzdGF0ZSBhZnRlciBkaXNwYXRjaFxuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2sgIT09IHByZXZNYXNrKSB7XG4gICAgICAgICAgLy8gaWYgbWFzayBjaGFuZ2VkIHJlYXBwbHkgaW5wdXRcbiAgICAgICAgICB0aGlzLmN1cnJlbnRNYXNrLnJlc2V0KCk7XG4gICAgICAgICAgaWYgKGluc2VydFZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNYXNrLmFwcGVuZChpbnNlcnRWYWx1ZSwge1xuICAgICAgICAgICAgICByYXc6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGV0YWlscy50YWlsU2hpZnQgPSB0aGlzLmN1cnJlbnRNYXNrLnZhbHVlLmxlbmd0aCAtIHByZXZWYWx1ZUJlZm9yZVRhaWwubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGFpbFZhbHVlKSB7XG4gICAgICAgICAgICBkZXRhaWxzLnRhaWxTaGlmdCArPSB0aGlzLmN1cnJlbnRNYXNrLmFwcGVuZCh0YWlsVmFsdWUsIHtcbiAgICAgICAgICAgICAgcmF3OiB0cnVlLFxuICAgICAgICAgICAgICB0YWlsOiB0cnVlXG4gICAgICAgICAgICB9KS50YWlsU2hpZnQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHByZXZNYXNrU3RhdGUpIHtcbiAgICAgICAgICAvLyBEaXNwYXRjaCBjYW4gZG8gc29tZXRoaW5nIGJhZCB3aXRoIHN0YXRlLCBzb1xuICAgICAgICAgIC8vIHJlc3RvcmUgcHJldiBtYXNrIHN0YXRlXG4gICAgICAgICAgdGhpcy5jdXJyZW50TWFzay5zdGF0ZSA9IHByZXZNYXNrU3RhdGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBfYXBwZW5kUGxhY2Vob2xkZXIoKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gdGhpcy5fYXBwbHlEaXNwYXRjaCgpO1xuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHtcbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5jdXJyZW50TWFzay5fYXBwZW5kUGxhY2Vob2xkZXIoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgX2FwcGVuZEVhZ2VyKCkge1xuICAgICAgY29uc3QgZGV0YWlscyA9IHRoaXMuX2FwcGx5RGlzcGF0Y2goKTtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB7XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuY3VycmVudE1hc2suX2FwcGVuZEVhZ2VyKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIGFwcGVuZFRhaWwodGFpbCkge1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBpZiAodGFpbCkgZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5fYXBwbHlEaXNwYXRjaCgnJywge30sIHRhaWwpKTtcbiAgICAgIHJldHVybiBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5hcHBlbmRUYWlsKHRhaWwpIDogc3VwZXIuYXBwZW5kVGFpbCh0YWlsKSk7XG4gICAgfVxuICAgIGN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpIHtcbiAgICAgIHZhciBfZmxhZ3MkX2JlZm9yZVRhaWxTdGEsIF9mbGFncyRfYmVmb3JlVGFpbFN0YTI7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5mbGFncyxcbiAgICAgICAgX2JlZm9yZVRhaWxTdGF0ZTogKChfZmxhZ3MkX2JlZm9yZVRhaWxTdGEgPSBmbGFncy5fYmVmb3JlVGFpbFN0YXRlKSA9PSBudWxsID8gdm9pZCAwIDogX2ZsYWdzJF9iZWZvcmVUYWlsU3RhLmN1cnJlbnRNYXNrUmVmKSA9PT0gdGhpcy5jdXJyZW50TWFzayAmJiAoKF9mbGFncyRfYmVmb3JlVGFpbFN0YTIgPSBmbGFncy5fYmVmb3JlVGFpbFN0YXRlKSA9PSBudWxsID8gdm9pZCAwIDogX2ZsYWdzJF9iZWZvcmVUYWlsU3RhMi5jdXJyZW50TWFzaykgfHwgZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZVxuICAgICAgfTtcbiAgICB9XG4gICAgZG9EaXNwYXRjaChhcHBlbmRlZCwgZmxhZ3MsIHRhaWwpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBpZiAodGFpbCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRhaWwgPSAnJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKGFwcGVuZGVkLCB0aGlzLCBmbGFncywgdGFpbCk7XG4gICAgfVxuICAgIGRvVmFsaWRhdGUoZmxhZ3MpIHtcbiAgICAgIHJldHVybiBzdXBlci5kb1ZhbGlkYXRlKGZsYWdzKSAmJiAoIXRoaXMuY3VycmVudE1hc2sgfHwgdGhpcy5jdXJyZW50TWFzay5kb1ZhbGlkYXRlKHRoaXMuY3VycmVudE1hc2tGbGFncyhmbGFncykpKTtcbiAgICB9XG4gICAgZG9QcmVwYXJlKHN0ciwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBsZXQgW3MsIGRldGFpbHNdID0gc3VwZXIuZG9QcmVwYXJlKHN0ciwgZmxhZ3MpO1xuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHtcbiAgICAgICAgbGV0IGN1cnJlbnREZXRhaWxzO1xuICAgICAgICBbcywgY3VycmVudERldGFpbHNdID0gc3VwZXIuZG9QcmVwYXJlKHMsIHRoaXMuY3VycmVudE1hc2tGbGFncyhmbGFncykpO1xuICAgICAgICBkZXRhaWxzID0gZGV0YWlscy5hZ2dyZWdhdGUoY3VycmVudERldGFpbHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtzLCBkZXRhaWxzXTtcbiAgICB9XG4gICAgZG9QcmVwYXJlQ2hhcihzdHIsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgbGV0IFtzLCBkZXRhaWxzXSA9IHN1cGVyLmRvUHJlcGFyZUNoYXIoc3RyLCBmbGFncyk7XG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykge1xuICAgICAgICBsZXQgY3VycmVudERldGFpbHM7XG4gICAgICAgIFtzLCBjdXJyZW50RGV0YWlsc10gPSBzdXBlci5kb1ByZXBhcmVDaGFyKHMsIHRoaXMuY3VycmVudE1hc2tGbGFncyhmbGFncykpO1xuICAgICAgICBkZXRhaWxzID0gZGV0YWlscy5hZ2dyZWdhdGUoY3VycmVudERldGFpbHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtzLCBkZXRhaWxzXTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICB2YXIgX3RoaXMkY3VycmVudE1hc2s7XG4gICAgICAoX3RoaXMkY3VycmVudE1hc2sgPSB0aGlzLmN1cnJlbnRNYXNrKSA9PSBudWxsIHx8IF90aGlzJGN1cnJlbnRNYXNrLnJlc2V0KCk7XG4gICAgICB0aGlzLmNvbXBpbGVkTWFza3MuZm9yRWFjaChtID0+IG0ucmVzZXQoKSk7XG4gICAgfVxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cG9zZU1hc2sgPyB0aGlzLmV4cG9zZU1hc2sudmFsdWUgOiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay52YWx1ZSA6ICcnO1xuICAgIH1cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmV4cG9zZU1hc2spIHtcbiAgICAgICAgdGhpcy5leHBvc2VNYXNrLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuY3VycmVudE1hc2sgPSB0aGlzLmV4cG9zZU1hc2s7XG4gICAgICAgIHRoaXMuX2FwcGx5RGlzcGF0Y2goKTtcbiAgICAgIH0gZWxzZSBzdXBlci52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBnZXQgdW5tYXNrZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cG9zZU1hc2sgPyB0aGlzLmV4cG9zZU1hc2sudW5tYXNrZWRWYWx1ZSA6IHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLnVubWFza2VkVmFsdWUgOiAnJztcbiAgICB9XG4gICAgc2V0IHVubWFza2VkVmFsdWUodW5tYXNrZWRWYWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZXhwb3NlTWFzaykge1xuICAgICAgICB0aGlzLmV4cG9zZU1hc2sudW5tYXNrZWRWYWx1ZSA9IHVubWFza2VkVmFsdWU7XG4gICAgICAgIHRoaXMuY3VycmVudE1hc2sgPSB0aGlzLmV4cG9zZU1hc2s7XG4gICAgICAgIHRoaXMuX2FwcGx5RGlzcGF0Y2goKTtcbiAgICAgIH0gZWxzZSBzdXBlci51bm1hc2tlZFZhbHVlID0gdW5tYXNrZWRWYWx1ZTtcbiAgICB9XG4gICAgZ2V0IHR5cGVkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBvc2VNYXNrID8gdGhpcy5leHBvc2VNYXNrLnR5cGVkVmFsdWUgOiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay50eXBlZFZhbHVlIDogJyc7XG4gICAgfVxuICAgIHNldCB0eXBlZFZhbHVlKHR5cGVkVmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmV4cG9zZU1hc2spIHtcbiAgICAgICAgdGhpcy5leHBvc2VNYXNrLnR5cGVkVmFsdWUgPSB0eXBlZFZhbHVlO1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXNrID0gdGhpcy5leHBvc2VNYXNrO1xuICAgICAgICB0aGlzLl9hcHBseURpc3BhdGNoKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCB1bm1hc2tlZFZhbHVlID0gU3RyaW5nKHR5cGVkVmFsdWUpO1xuXG4gICAgICAvLyBkb3VibGUgY2hlY2sgaXRcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1hc2sudHlwZWRWYWx1ZSA9IHR5cGVkVmFsdWU7XG4gICAgICAgIHVubWFza2VkVmFsdWUgPSB0aGlzLmN1cnJlbnRNYXNrLnVubWFza2VkVmFsdWU7XG4gICAgICB9XG4gICAgICB0aGlzLnVubWFza2VkVmFsdWUgPSB1bm1hc2tlZFZhbHVlO1xuICAgIH1cbiAgICBnZXQgZGlzcGxheVZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLmRpc3BsYXlWYWx1ZSA6ICcnO1xuICAgIH1cbiAgICBnZXQgaXNDb21wbGV0ZSgpIHtcbiAgICAgIHZhciBfdGhpcyRjdXJyZW50TWFzazI7XG4gICAgICByZXR1cm4gQm9vbGVhbigoX3RoaXMkY3VycmVudE1hc2syID0gdGhpcy5jdXJyZW50TWFzaykgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJGN1cnJlbnRNYXNrMi5pc0NvbXBsZXRlKTtcbiAgICB9XG4gICAgZ2V0IGlzRmlsbGVkKCkge1xuICAgICAgdmFyIF90aGlzJGN1cnJlbnRNYXNrMztcbiAgICAgIHJldHVybiBCb29sZWFuKChfdGhpcyRjdXJyZW50TWFzazMgPSB0aGlzLmN1cnJlbnRNYXNrKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkY3VycmVudE1hc2szLmlzRmlsbGVkKTtcbiAgICB9XG4gICAgcmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB7XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuY3VycmVudE1hc2sucmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSlcbiAgICAgICAgLy8gdXBkYXRlIHdpdGggZGlzcGF0Y2hcbiAgICAgICAgLmFnZ3JlZ2F0ZSh0aGlzLl9hcHBseURpc3BhdGNoKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHZhciBfdGhpcyRjdXJyZW50TWFzazQ7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5zdXBlci5zdGF0ZSxcbiAgICAgICAgX3Jhd0lucHV0VmFsdWU6IHRoaXMucmF3SW5wdXRWYWx1ZSxcbiAgICAgICAgY29tcGlsZWRNYXNrczogdGhpcy5jb21waWxlZE1hc2tzLm1hcChtID0+IG0uc3RhdGUpLFxuICAgICAgICBjdXJyZW50TWFza1JlZjogdGhpcy5jdXJyZW50TWFzayxcbiAgICAgICAgY3VycmVudE1hc2s6IChfdGhpcyRjdXJyZW50TWFzazQgPSB0aGlzLmN1cnJlbnRNYXNrKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkY3VycmVudE1hc2s0LnN0YXRlXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXQgc3RhdGUoc3RhdGUpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgY29tcGlsZWRNYXNrcyxcbiAgICAgICAgY3VycmVudE1hc2tSZWYsXG4gICAgICAgIGN1cnJlbnRNYXNrLFxuICAgICAgICAuLi5tYXNrZWRTdGF0ZVxuICAgICAgfSA9IHN0YXRlO1xuICAgICAgaWYgKGNvbXBpbGVkTWFza3MpIHRoaXMuY29tcGlsZWRNYXNrcy5mb3JFYWNoKChtLCBtaSkgPT4gbS5zdGF0ZSA9IGNvbXBpbGVkTWFza3NbbWldKTtcbiAgICAgIGlmIChjdXJyZW50TWFza1JlZiAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuY3VycmVudE1hc2sgPSBjdXJyZW50TWFza1JlZjtcbiAgICAgICAgdGhpcy5jdXJyZW50TWFzay5zdGF0ZSA9IGN1cnJlbnRNYXNrO1xuICAgICAgfVxuICAgICAgc3VwZXIuc3RhdGUgPSBtYXNrZWRTdGF0ZTtcbiAgICB9XG4gICAgZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncykge1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLmV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpIDogJyc7XG4gICAgfVxuICAgIGV4dHJhY3RUYWlsKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2suZXh0cmFjdFRhaWwoZnJvbVBvcywgdG9Qb3MpIDogc3VwZXIuZXh0cmFjdFRhaWwoZnJvbVBvcywgdG9Qb3MpO1xuICAgIH1cbiAgICBkb0NvbW1pdCgpIHtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB0aGlzLmN1cnJlbnRNYXNrLmRvQ29tbWl0KCk7XG4gICAgICBzdXBlci5kb0NvbW1pdCgpO1xuICAgIH1cbiAgICBuZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBkaXJlY3Rpb24pIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5uZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBkaXJlY3Rpb24pIDogc3VwZXIubmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgZGlyZWN0aW9uKTtcbiAgICB9XG4gICAgZ2V0IG92ZXJ3cml0ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5vdmVyd3JpdGUgOiB0aGlzLl9vdmVyd3JpdGU7XG4gICAgfVxuICAgIHNldCBvdmVyd3JpdGUob3ZlcndyaXRlKSB7XG4gICAgICB0aGlzLl9vdmVyd3JpdGUgPSBvdmVyd3JpdGU7XG4gICAgfVxuICAgIGdldCBlYWdlcigpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5lYWdlciA6IHRoaXMuX2VhZ2VyO1xuICAgIH1cbiAgICBzZXQgZWFnZXIoZWFnZXIpIHtcbiAgICAgIHRoaXMuX2VhZ2VyID0gZWFnZXI7XG4gICAgfVxuICAgIGdldCBza2lwSW52YWxpZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5za2lwSW52YWxpZCA6IHRoaXMuX3NraXBJbnZhbGlkO1xuICAgIH1cbiAgICBzZXQgc2tpcEludmFsaWQoc2tpcEludmFsaWQpIHtcbiAgICAgIHRoaXMuX3NraXBJbnZhbGlkID0gc2tpcEludmFsaWQ7XG4gICAgfVxuICAgIGdldCBhdXRvZml4KCkge1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLmF1dG9maXggOiB0aGlzLl9hdXRvZml4O1xuICAgIH1cbiAgICBzZXQgYXV0b2ZpeChhdXRvZml4KSB7XG4gICAgICB0aGlzLl9hdXRvZml4ID0gYXV0b2ZpeDtcbiAgICB9XG4gICAgbWFza0VxdWFscyhtYXNrKSB7XG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShtYXNrKSA/IHRoaXMuY29tcGlsZWRNYXNrcy5ldmVyeSgobSwgbWkpID0+IHtcbiAgICAgICAgaWYgKCFtYXNrW21pXSkgcmV0dXJuO1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgbWFzazogb2xkTWFzayxcbiAgICAgICAgICAuLi5yZXN0T3B0c1xuICAgICAgICB9ID0gbWFza1ttaV07XG4gICAgICAgIHJldHVybiBvYmplY3RJbmNsdWRlcyhtLCByZXN0T3B0cykgJiYgbS5tYXNrRXF1YWxzKG9sZE1hc2spO1xuICAgICAgfSkgOiBzdXBlci5tYXNrRXF1YWxzKG1hc2spO1xuICAgIH1cbiAgICB0eXBlZFZhbHVlRXF1YWxzKHZhbHVlKSB7XG4gICAgICB2YXIgX3RoaXMkY3VycmVudE1hc2s1O1xuICAgICAgcmV0dXJuIEJvb2xlYW4oKF90aGlzJGN1cnJlbnRNYXNrNSA9IHRoaXMuY3VycmVudE1hc2spID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRjdXJyZW50TWFzazUudHlwZWRWYWx1ZUVxdWFscyh2YWx1ZSkpO1xuICAgIH1cbiAgfVxuICAvKiogQ3VycmVudGx5IGNob3NlbiBtYXNrICovXG4gIC8qKiBDdXJyZW50bHkgY2hvc2VuIG1hc2sgKi9cbiAgLyoqIENvbXBsaWxlZCB7QGxpbmsgTWFza2VkfSBvcHRpb25zICovXG4gIC8qKiBDaG9vc2VzIHtAbGluayBNYXNrZWR9IGRlcGVuZGluZyBvbiBpbnB1dCB2YWx1ZSAqL1xuICBNYXNrZWREeW5hbWljLkRFRkFVTFRTID0ge1xuICAgIC4uLk1hc2tlZC5ERUZBVUxUUyxcbiAgICBkaXNwYXRjaDogKGFwcGVuZGVkLCBtYXNrZWQsIGZsYWdzLCB0YWlsKSA9PiB7XG4gICAgICBpZiAoIW1hc2tlZC5jb21waWxlZE1hc2tzLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgY29uc3QgaW5wdXRWYWx1ZSA9IG1hc2tlZC5yYXdJbnB1dFZhbHVlO1xuXG4gICAgICAvLyBzaW11bGF0ZSBpbnB1dFxuICAgICAgY29uc3QgaW5wdXRzID0gbWFza2VkLmNvbXBpbGVkTWFza3MubWFwKChtLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBpc0N1cnJlbnQgPSBtYXNrZWQuY3VycmVudE1hc2sgPT09IG07XG4gICAgICAgIGNvbnN0IHN0YXJ0SW5wdXRQb3MgPSBpc0N1cnJlbnQgPyBtLmRpc3BsYXlWYWx1ZS5sZW5ndGggOiBtLm5lYXJlc3RJbnB1dFBvcyhtLmRpc3BsYXlWYWx1ZS5sZW5ndGgsIERJUkVDVElPTi5GT1JDRV9MRUZUKTtcbiAgICAgICAgaWYgKG0ucmF3SW5wdXRWYWx1ZSAhPT0gaW5wdXRWYWx1ZSkge1xuICAgICAgICAgIG0ucmVzZXQoKTtcbiAgICAgICAgICBtLmFwcGVuZChpbnB1dFZhbHVlLCB7XG4gICAgICAgICAgICByYXc6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICghaXNDdXJyZW50KSB7XG4gICAgICAgICAgbS5yZW1vdmUoc3RhcnRJbnB1dFBvcyk7XG4gICAgICAgIH1cbiAgICAgICAgbS5hcHBlbmQoYXBwZW5kZWQsIG1hc2tlZC5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSk7XG4gICAgICAgIG0uYXBwZW5kVGFpbCh0YWlsKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICB3ZWlnaHQ6IG0ucmF3SW5wdXRWYWx1ZS5sZW5ndGgsXG4gICAgICAgICAgdG90YWxJbnB1dFBvc2l0aW9uczogbS50b3RhbElucHV0UG9zaXRpb25zKDAsIE1hdGgubWF4KHN0YXJ0SW5wdXRQb3MsIG0ubmVhcmVzdElucHV0UG9zKG0uZGlzcGxheVZhbHVlLmxlbmd0aCwgRElSRUNUSU9OLkZPUkNFX0xFRlQpKSlcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBwb3AgbWFza3Mgd2l0aCBsb25nZXIgdmFsdWVzIGZpcnN0XG4gICAgICBpbnB1dHMuc29ydCgoaTEsIGkyKSA9PiBpMi53ZWlnaHQgLSBpMS53ZWlnaHQgfHwgaTIudG90YWxJbnB1dFBvc2l0aW9ucyAtIGkxLnRvdGFsSW5wdXRQb3NpdGlvbnMpO1xuICAgICAgcmV0dXJuIG1hc2tlZC5jb21waWxlZE1hc2tzW2lucHV0c1swXS5pbmRleF07XG4gICAgfVxuICB9O1xuICBJTWFzay5NYXNrZWREeW5hbWljID0gTWFza2VkRHluYW1pYztcblxuICAvKiogUGF0dGVybiB3aGljaCB2YWxpZGF0ZXMgZW51bSB2YWx1ZXMgKi9cbiAgY2xhc3MgTWFza2VkRW51bSBleHRlbmRzIE1hc2tlZFBhdHRlcm4ge1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIHN1cGVyKHtcbiAgICAgICAgLi4uTWFza2VkRW51bS5ERUZBVUxUUyxcbiAgICAgICAgLi4ub3B0c1xuICAgICAgfSk7IC8vIG1hc2sgd2lsbCBiZSBjcmVhdGVkIGluIF91cGRhdGVcbiAgICB9XG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgZW51bTogZW51bV8sXG4gICAgICAgIC4uLmVvcHRzXG4gICAgICB9ID0gb3B0cztcbiAgICAgIGlmIChlbnVtXykge1xuICAgICAgICBjb25zdCBsZW5ndGhzID0gZW51bV8ubWFwKGUgPT4gZS5sZW5ndGgpO1xuICAgICAgICBjb25zdCByZXF1aXJlZExlbmd0aCA9IE1hdGgubWluKC4uLmxlbmd0aHMpO1xuICAgICAgICBjb25zdCBvcHRpb25hbExlbmd0aCA9IE1hdGgubWF4KC4uLmxlbmd0aHMpIC0gcmVxdWlyZWRMZW5ndGg7XG4gICAgICAgIGVvcHRzLm1hc2sgPSAnKicucmVwZWF0KHJlcXVpcmVkTGVuZ3RoKTtcbiAgICAgICAgaWYgKG9wdGlvbmFsTGVuZ3RoKSBlb3B0cy5tYXNrICs9ICdbJyArICcqJy5yZXBlYXQob3B0aW9uYWxMZW5ndGgpICsgJ10nO1xuICAgICAgICB0aGlzLmVudW0gPSBlbnVtXztcbiAgICAgIH1cbiAgICAgIHN1cGVyLl91cGRhdGUoZW9wdHMpO1xuICAgIH1cbiAgICBfYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBjb25zdCBtYXRjaEZyb20gPSBNYXRoLm1pbih0aGlzLm5lYXJlc3RJbnB1dFBvcygwLCBESVJFQ1RJT04uRk9SQ0VfUklHSFQpLCB0aGlzLnZhbHVlLmxlbmd0aCk7XG4gICAgICBjb25zdCBtYXRjaGVzID0gdGhpcy5lbnVtLmZpbHRlcihlID0+IHRoaXMubWF0Y2hWYWx1ZShlLCB0aGlzLnVubWFza2VkVmFsdWUgKyBjaCwgbWF0Y2hGcm9tKSk7XG4gICAgICBpZiAobWF0Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgdGhpcy5fZm9yRWFjaEJsb2Nrc0luUmFuZ2UoMCwgdGhpcy52YWx1ZS5sZW5ndGgsIChiLCBiaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWNoID0gbWF0Y2hlc1swXVtiaV07XG4gICAgICAgICAgICBpZiAoYmkgPj0gdGhpcy52YWx1ZS5sZW5ndGggfHwgbWNoID09PSBiLnZhbHVlKSByZXR1cm47XG4gICAgICAgICAgICBiLnJlc2V0KCk7XG4gICAgICAgICAgICBiLl9hcHBlbmRDaGFyKG1jaCwgZmxhZ3MpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGQgPSBzdXBlci5fYXBwZW5kQ2hhclJhdyhtYXRjaGVzWzBdW3RoaXMudmFsdWUubGVuZ3RoXSwgZmxhZ3MpO1xuICAgICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICBtYXRjaGVzWzBdLnNsaWNlKHRoaXMudW5tYXNrZWRWYWx1ZS5sZW5ndGgpLnNwbGl0KCcnKS5mb3JFYWNoKG1jaCA9PiBkLmFnZ3JlZ2F0ZShzdXBlci5fYXBwZW5kQ2hhclJhdyhtY2gpKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoe1xuICAgICAgICBza2lwOiAhdGhpcy5pc0NvbXBsZXRlXG4gICAgICB9KTtcbiAgICB9XG4gICAgZXh0cmFjdFRhaWwoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIC8vIGp1c3QgZHJvcCB0YWlsXG4gICAgICByZXR1cm4gbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscygnJywgZnJvbVBvcyk7XG4gICAgfVxuICAgIHJlbW92ZShmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGZyb21Qb3MgPT09IHRvUG9zKSByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGNvbnN0IG1hdGNoRnJvbSA9IE1hdGgubWluKHN1cGVyLm5lYXJlc3RJbnB1dFBvcygwLCBESVJFQ1RJT04uRk9SQ0VfUklHSFQpLCB0aGlzLnZhbHVlLmxlbmd0aCk7XG4gICAgICBsZXQgcG9zO1xuICAgICAgZm9yIChwb3MgPSBmcm9tUG9zOyBwb3MgPj0gMDsgLS1wb3MpIHtcbiAgICAgICAgY29uc3QgbWF0Y2hlcyA9IHRoaXMuZW51bS5maWx0ZXIoZSA9PiB0aGlzLm1hdGNoVmFsdWUoZSwgdGhpcy52YWx1ZS5zbGljZShtYXRjaEZyb20sIHBvcyksIG1hdGNoRnJvbSkpO1xuICAgICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPiAxKSBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRldGFpbHMgPSBzdXBlci5yZW1vdmUocG9zLCB0b1Bvcyk7XG4gICAgICBkZXRhaWxzLnRhaWxTaGlmdCArPSBwb3MgLSBmcm9tUG9zO1xuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIGdldCBpc0NvbXBsZXRlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZW51bS5pbmRleE9mKHRoaXMudmFsdWUpID49IDA7XG4gICAgfVxuICB9XG4gIC8qKiBNYXRjaCBlbnVtIHZhbHVlICovXG4gIE1hc2tlZEVudW0uREVGQVVMVFMgPSB7XG4gICAgLi4uTWFza2VkUGF0dGVybi5ERUZBVUxUUyxcbiAgICBtYXRjaFZhbHVlOiAoZXN0ciwgaXN0ciwgbWF0Y2hGcm9tKSA9PiBlc3RyLmluZGV4T2YoaXN0ciwgbWF0Y2hGcm9tKSA9PT0gbWF0Y2hGcm9tXG4gIH07XG4gIElNYXNrLk1hc2tlZEVudW0gPSBNYXNrZWRFbnVtO1xuXG4gIC8qKiBNYXNraW5nIGJ5IGN1c3RvbSBGdW5jdGlvbiAqL1xuICBjbGFzcyBNYXNrZWRGdW5jdGlvbiBleHRlbmRzIE1hc2tlZCB7XG4gICAgLyoqICovXG5cbiAgICAvKiogRW5hYmxlIGNoYXJhY3RlcnMgb3ZlcndyaXRpbmcgKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBzdXBlci5fdXBkYXRlKHtcbiAgICAgICAgLi4ub3B0cyxcbiAgICAgICAgdmFsaWRhdGU6IG9wdHMubWFza1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIElNYXNrLk1hc2tlZEZ1bmN0aW9uID0gTWFza2VkRnVuY3Rpb247XG5cbiAgdmFyIF9NYXNrZWROdW1iZXI7XG4gIC8qKiBOdW1iZXIgbWFzayAqL1xuICBjbGFzcyBNYXNrZWROdW1iZXIgZXh0ZW5kcyBNYXNrZWQge1xuICAgIC8qKiBTaW5nbGUgY2hhciAqL1xuXG4gICAgLyoqIFNpbmdsZSBjaGFyICovXG5cbiAgICAvKiogQXJyYXkgb2Ygc2luZ2xlIGNoYXJzICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqIERpZ2l0cyBhZnRlciBwb2ludCAqL1xuXG4gICAgLyoqIEZsYWcgdG8gcmVtb3ZlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHplcm9zIGluIHRoZSBlbmQgb2YgZWRpdGluZyAqL1xuXG4gICAgLyoqIEZsYWcgdG8gcGFkIHRyYWlsaW5nIHplcm9zIGFmdGVyIHBvaW50IGluIHRoZSBlbmQgb2YgZWRpdGluZyAqL1xuXG4gICAgLyoqIEVuYWJsZSBjaGFyYWN0ZXJzIG92ZXJ3cml0aW5nICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogRm9ybWF0IHR5cGVkIHZhbHVlIHRvIHN0cmluZyAqL1xuXG4gICAgLyoqIFBhcnNlIHN0cmluZyB0byBnZXQgdHlwZWQgdmFsdWUgKi9cblxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIHN1cGVyKHtcbiAgICAgICAgLi4uTWFza2VkTnVtYmVyLkRFRkFVTFRTLFxuICAgICAgICAuLi5vcHRzXG4gICAgICB9KTtcbiAgICB9XG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIHN1cGVyLl91cGRhdGUob3B0cyk7XG4gICAgICB0aGlzLl91cGRhdGVSZWdFeHBzKCk7XG4gICAgfVxuICAgIF91cGRhdGVSZWdFeHBzKCkge1xuICAgICAgY29uc3Qgc3RhcnQgPSAnXicgKyAodGhpcy5hbGxvd05lZ2F0aXZlID8gJ1srfFxcXFwtXT8nIDogJycpO1xuICAgICAgY29uc3QgbWlkID0gJ1xcXFxkKic7XG4gICAgICBjb25zdCBlbmQgPSAodGhpcy5zY2FsZSA/IFwiKFwiICsgZXNjYXBlUmVnRXhwKHRoaXMucmFkaXgpICsgXCJcXFxcZHswLFwiICsgdGhpcy5zY2FsZSArIFwifSk/XCIgOiAnJykgKyAnJCc7XG4gICAgICB0aGlzLl9udW1iZXJSZWdFeHAgPSBuZXcgUmVnRXhwKHN0YXJ0ICsgbWlkICsgZW5kKTtcbiAgICAgIHRoaXMuX21hcFRvUmFkaXhSZWdFeHAgPSBuZXcgUmVnRXhwKFwiW1wiICsgdGhpcy5tYXBUb1JhZGl4Lm1hcChlc2NhcGVSZWdFeHApLmpvaW4oJycpICsgXCJdXCIsICdnJyk7XG4gICAgICB0aGlzLl90aG91c2FuZHNTZXBhcmF0b3JSZWdFeHAgPSBuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cCh0aGlzLnRob3VzYW5kc1NlcGFyYXRvciksICdnJyk7XG4gICAgfVxuICAgIF9yZW1vdmVUaG91c2FuZHNTZXBhcmF0b3JzKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUucmVwbGFjZSh0aGlzLl90aG91c2FuZHNTZXBhcmF0b3JSZWdFeHAsICcnKTtcbiAgICB9XG4gICAgX2luc2VydFRob3VzYW5kc1NlcGFyYXRvcnModmFsdWUpIHtcbiAgICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI5MDExMDIvaG93LXRvLXByaW50LWEtbnVtYmVyLXdpdGgtY29tbWFzLWFzLXRob3VzYW5kcy1zZXBhcmF0b3JzLWluLWphdmFzY3JpcHRcbiAgICAgIGNvbnN0IHBhcnRzID0gdmFsdWUuc3BsaXQodGhpcy5yYWRpeCk7XG4gICAgICBwYXJ0c1swXSA9IHBhcnRzWzBdLnJlcGxhY2UoL1xcQig/PShcXGR7M30pKyg/IVxcZCkpL2csIHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yKTtcbiAgICAgIHJldHVybiBwYXJ0cy5qb2luKHRoaXMucmFkaXgpO1xuICAgIH1cbiAgICBkb1ByZXBhcmVDaGFyKGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IFtwcmVwQ2gsIGRldGFpbHNdID0gc3VwZXIuZG9QcmVwYXJlQ2hhcih0aGlzLl9yZW1vdmVUaG91c2FuZHNTZXBhcmF0b3JzKHRoaXMuc2NhbGUgJiYgdGhpcy5tYXBUb1JhZGl4Lmxlbmd0aCAmJiAoXG4gICAgICAvKlxuICAgICAgICByYWRpeCBzaG91bGQgYmUgbWFwcGVkIHdoZW5cbiAgICAgICAgMSkgaW5wdXQgaXMgZG9uZSBmcm9tIGtleWJvYXJkID0gZmxhZ3MuaW5wdXQgJiYgZmxhZ3MucmF3XG4gICAgICAgIDIpIHVubWFza2VkIHZhbHVlIGlzIHNldCA9ICFmbGFncy5pbnB1dCAmJiAhZmxhZ3MucmF3XG4gICAgICAgIGFuZCBzaG91bGQgbm90IGJlIG1hcHBlZCB3aGVuXG4gICAgICAgIDEpIHZhbHVlIGlzIHNldCA9IGZsYWdzLmlucHV0ICYmICFmbGFncy5yYXdcbiAgICAgICAgMikgcmF3IHZhbHVlIGlzIHNldCA9ICFmbGFncy5pbnB1dCAmJiBmbGFncy5yYXdcbiAgICAgICovXG4gICAgICBmbGFncy5pbnB1dCAmJiBmbGFncy5yYXcgfHwgIWZsYWdzLmlucHV0ICYmICFmbGFncy5yYXcpID8gY2gucmVwbGFjZSh0aGlzLl9tYXBUb1JhZGl4UmVnRXhwLCB0aGlzLnJhZGl4KSA6IGNoKSwgZmxhZ3MpO1xuICAgICAgaWYgKGNoICYmICFwcmVwQ2gpIGRldGFpbHMuc2tpcCA9IHRydWU7XG4gICAgICBpZiAocHJlcENoICYmICF0aGlzLmFsbG93UG9zaXRpdmUgJiYgIXRoaXMudmFsdWUgJiYgcHJlcENoICE9PSAnLScpIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuX2FwcGVuZENoYXIoJy0nKSk7XG4gICAgICByZXR1cm4gW3ByZXBDaCwgZGV0YWlsc107XG4gICAgfVxuICAgIF9zZXBhcmF0b3JzQ291bnQodG8sIGV4dGVuZE9uU2VwYXJhdG9ycykge1xuICAgICAgaWYgKGV4dGVuZE9uU2VwYXJhdG9ycyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGV4dGVuZE9uU2VwYXJhdG9ycyA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgbGV0IGNvdW50ID0gMDtcbiAgICAgIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IHRvOyArK3Bvcykge1xuICAgICAgICBpZiAodGhpcy5fdmFsdWUuaW5kZXhPZih0aGlzLnRob3VzYW5kc1NlcGFyYXRvciwgcG9zKSA9PT0gcG9zKSB7XG4gICAgICAgICAgKytjb3VudDtcbiAgICAgICAgICBpZiAoZXh0ZW5kT25TZXBhcmF0b3JzKSB0byArPSB0aGlzLnRob3VzYW5kc1NlcGFyYXRvci5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjb3VudDtcbiAgICB9XG4gICAgX3NlcGFyYXRvcnNDb3VudEZyb21TbGljZShzbGljZSkge1xuICAgICAgaWYgKHNsaWNlID09PSB2b2lkIDApIHtcbiAgICAgICAgc2xpY2UgPSB0aGlzLl92YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9zZXBhcmF0b3JzQ291bnQodGhpcy5fcmVtb3ZlVGhvdXNhbmRzU2VwYXJhdG9ycyhzbGljZSkubGVuZ3RoLCB0cnVlKTtcbiAgICB9XG4gICAgZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgW2Zyb21Qb3MsIHRvUG9zXSA9IHRoaXMuX2FkanVzdFJhbmdlV2l0aFNlcGFyYXRvcnMoZnJvbVBvcywgdG9Qb3MpO1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbW92ZVRob3VzYW5kc1NlcGFyYXRvcnMoc3VwZXIuZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncykpO1xuICAgIH1cbiAgICBfYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBjb25zdCBwcmV2QmVmb3JlVGFpbFZhbHVlID0gZmxhZ3MudGFpbCAmJiBmbGFncy5fYmVmb3JlVGFpbFN0YXRlID8gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZS5fdmFsdWUgOiB0aGlzLl92YWx1ZTtcbiAgICAgIGNvbnN0IHByZXZCZWZvcmVUYWlsU2VwYXJhdG9yc0NvdW50ID0gdGhpcy5fc2VwYXJhdG9yc0NvdW50RnJvbVNsaWNlKHByZXZCZWZvcmVUYWlsVmFsdWUpO1xuICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLl9yZW1vdmVUaG91c2FuZHNTZXBhcmF0b3JzKHRoaXMudmFsdWUpO1xuICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLl92YWx1ZTtcbiAgICAgIHRoaXMuX3ZhbHVlICs9IGNoO1xuICAgICAgY29uc3QgbnVtID0gdGhpcy5udW1iZXI7XG4gICAgICBsZXQgYWNjZXB0ZWQgPSAhaXNOYU4obnVtKTtcbiAgICAgIGxldCBza2lwID0gZmFsc2U7XG4gICAgICBpZiAoYWNjZXB0ZWQpIHtcbiAgICAgICAgbGV0IGZpeGVkTnVtO1xuICAgICAgICBpZiAodGhpcy5taW4gIT0gbnVsbCAmJiB0aGlzLm1pbiA8IDAgJiYgdGhpcy5udW1iZXIgPCB0aGlzLm1pbikgZml4ZWROdW0gPSB0aGlzLm1pbjtcbiAgICAgICAgaWYgKHRoaXMubWF4ICE9IG51bGwgJiYgdGhpcy5tYXggPiAwICYmIHRoaXMubnVtYmVyID4gdGhpcy5tYXgpIGZpeGVkTnVtID0gdGhpcy5tYXg7XG4gICAgICAgIGlmIChmaXhlZE51bSAhPSBudWxsKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYXV0b2ZpeCkge1xuICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLmZvcm1hdChmaXhlZE51bSwgdGhpcykucmVwbGFjZShNYXNrZWROdW1iZXIuVU5NQVNLRURfUkFESVgsIHRoaXMucmFkaXgpO1xuICAgICAgICAgICAgc2tpcCB8fCAoc2tpcCA9IG9sZFZhbHVlID09PSB0aGlzLl92YWx1ZSAmJiAhZmxhZ3MudGFpbCk7IC8vIGlmIG5vdCBjaGFuZ2VkIG9uIHRhaWwgaXQncyBzdGlsbCBvayB0byBwcm9jZWVkXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFjY2VwdGVkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGFjY2VwdGVkICYmIChhY2NlcHRlZCA9IEJvb2xlYW4odGhpcy5fdmFsdWUubWF0Y2godGhpcy5fbnVtYmVyUmVnRXhwKSkpO1xuICAgICAgfVxuICAgICAgbGV0IGFwcGVuZERldGFpbHM7XG4gICAgICBpZiAoIWFjY2VwdGVkKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gb2xkVmFsdWU7XG4gICAgICAgIGFwcGVuZERldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwZW5kRGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKHtcbiAgICAgICAgICBpbnNlcnRlZDogdGhpcy5fdmFsdWUuc2xpY2Uob2xkVmFsdWUubGVuZ3RoKSxcbiAgICAgICAgICByYXdJbnNlcnRlZDogc2tpcCA/ICcnIDogY2gsXG4gICAgICAgICAgc2tpcFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3ZhbHVlID0gdGhpcy5faW5zZXJ0VGhvdXNhbmRzU2VwYXJhdG9ycyh0aGlzLl92YWx1ZSk7XG4gICAgICBjb25zdCBiZWZvcmVUYWlsVmFsdWUgPSBmbGFncy50YWlsICYmIGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUgPyBmbGFncy5fYmVmb3JlVGFpbFN0YXRlLl92YWx1ZSA6IHRoaXMuX3ZhbHVlO1xuICAgICAgY29uc3QgYmVmb3JlVGFpbFNlcGFyYXRvcnNDb3VudCA9IHRoaXMuX3NlcGFyYXRvcnNDb3VudEZyb21TbGljZShiZWZvcmVUYWlsVmFsdWUpO1xuICAgICAgYXBwZW5kRGV0YWlscy50YWlsU2hpZnQgKz0gKGJlZm9yZVRhaWxTZXBhcmF0b3JzQ291bnQgLSBwcmV2QmVmb3JlVGFpbFNlcGFyYXRvcnNDb3VudCkgKiB0aGlzLnRob3VzYW5kc1NlcGFyYXRvci5sZW5ndGg7XG4gICAgICByZXR1cm4gYXBwZW5kRGV0YWlscztcbiAgICB9XG4gICAgX2ZpbmRTZXBhcmF0b3JBcm91bmQocG9zKSB7XG4gICAgICBpZiAodGhpcy50aG91c2FuZHNTZXBhcmF0b3IpIHtcbiAgICAgICAgY29uc3Qgc2VhcmNoRnJvbSA9IHBvcyAtIHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLmxlbmd0aCArIDE7XG4gICAgICAgIGNvbnN0IHNlcGFyYXRvclBvcyA9IHRoaXMudmFsdWUuaW5kZXhPZih0aGlzLnRob3VzYW5kc1NlcGFyYXRvciwgc2VhcmNoRnJvbSk7XG4gICAgICAgIGlmIChzZXBhcmF0b3JQb3MgPD0gcG9zKSByZXR1cm4gc2VwYXJhdG9yUG9zO1xuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBfYWRqdXN0UmFuZ2VXaXRoU2VwYXJhdG9ycyhmcm9tLCB0bykge1xuICAgICAgY29uc3Qgc2VwYXJhdG9yQXJvdW5kRnJvbVBvcyA9IHRoaXMuX2ZpbmRTZXBhcmF0b3JBcm91bmQoZnJvbSk7XG4gICAgICBpZiAoc2VwYXJhdG9yQXJvdW5kRnJvbVBvcyA+PSAwKSBmcm9tID0gc2VwYXJhdG9yQXJvdW5kRnJvbVBvcztcbiAgICAgIGNvbnN0IHNlcGFyYXRvckFyb3VuZFRvUG9zID0gdGhpcy5fZmluZFNlcGFyYXRvckFyb3VuZCh0byk7XG4gICAgICBpZiAoc2VwYXJhdG9yQXJvdW5kVG9Qb3MgPj0gMCkgdG8gPSBzZXBhcmF0b3JBcm91bmRUb1BvcyArIHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLmxlbmd0aDtcbiAgICAgIHJldHVybiBbZnJvbSwgdG9dO1xuICAgIH1cbiAgICByZW1vdmUoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIFtmcm9tUG9zLCB0b1Bvc10gPSB0aGlzLl9hZGp1c3RSYW5nZVdpdGhTZXBhcmF0b3JzKGZyb21Qb3MsIHRvUG9zKTtcbiAgICAgIGNvbnN0IHZhbHVlQmVmb3JlUG9zID0gdGhpcy52YWx1ZS5zbGljZSgwLCBmcm9tUG9zKTtcbiAgICAgIGNvbnN0IHZhbHVlQWZ0ZXJQb3MgPSB0aGlzLnZhbHVlLnNsaWNlKHRvUG9zKTtcbiAgICAgIGNvbnN0IHByZXZCZWZvcmVUYWlsU2VwYXJhdG9yc0NvdW50ID0gdGhpcy5fc2VwYXJhdG9yc0NvdW50KHZhbHVlQmVmb3JlUG9zLmxlbmd0aCk7XG4gICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuX2luc2VydFRob3VzYW5kc1NlcGFyYXRvcnModGhpcy5fcmVtb3ZlVGhvdXNhbmRzU2VwYXJhdG9ycyh2YWx1ZUJlZm9yZVBvcyArIHZhbHVlQWZ0ZXJQb3MpKTtcbiAgICAgIGNvbnN0IGJlZm9yZVRhaWxTZXBhcmF0b3JzQ291bnQgPSB0aGlzLl9zZXBhcmF0b3JzQ291bnRGcm9tU2xpY2UodmFsdWVCZWZvcmVQb3MpO1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKHtcbiAgICAgICAgdGFpbFNoaWZ0OiAoYmVmb3JlVGFpbFNlcGFyYXRvcnNDb3VudCAtIHByZXZCZWZvcmVUYWlsU2VwYXJhdG9yc0NvdW50KSAqIHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuICAgIG5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIGRpcmVjdGlvbikge1xuICAgICAgaWYgKCF0aGlzLnRob3VzYW5kc1NlcGFyYXRvcikgcmV0dXJuIGN1cnNvclBvcztcbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLk5PTkU6XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkxFRlQ6XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkZPUkNFX0xFRlQ6XG4gICAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgc2VwYXJhdG9yQXRMZWZ0UG9zID0gdGhpcy5fZmluZFNlcGFyYXRvckFyb3VuZChjdXJzb3JQb3MgLSAxKTtcbiAgICAgICAgICAgIGlmIChzZXBhcmF0b3JBdExlZnRQb3MgPj0gMCkge1xuICAgICAgICAgICAgICBjb25zdCBzZXBhcmF0b3JBdExlZnRFbmRQb3MgPSBzZXBhcmF0b3JBdExlZnRQb3MgKyB0aGlzLnRob3VzYW5kc1NlcGFyYXRvci5sZW5ndGg7XG4gICAgICAgICAgICAgIGlmIChjdXJzb3JQb3MgPCBzZXBhcmF0b3JBdExlZnRFbmRQb3MgfHwgdGhpcy52YWx1ZS5sZW5ndGggPD0gc2VwYXJhdG9yQXRMZWZ0RW5kUG9zIHx8IGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkZPUkNFX0xFRlQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VwYXJhdG9yQXRMZWZ0UG9zO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLlJJR0hUOlxuICAgICAgICBjYXNlIERJUkVDVElPTi5GT1JDRV9SSUdIVDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBzZXBhcmF0b3JBdFJpZ2h0UG9zID0gdGhpcy5fZmluZFNlcGFyYXRvckFyb3VuZChjdXJzb3JQb3MpO1xuICAgICAgICAgICAgaWYgKHNlcGFyYXRvckF0UmlnaHRQb3MgPj0gMCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VwYXJhdG9yQXRSaWdodFBvcyArIHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLmxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY3Vyc29yUG9zO1xuICAgIH1cbiAgICBkb0NvbW1pdCgpIHtcbiAgICAgIGlmICh0aGlzLnZhbHVlKSB7XG4gICAgICAgIGNvbnN0IG51bWJlciA9IHRoaXMubnVtYmVyO1xuICAgICAgICBsZXQgdmFsaWRudW0gPSBudW1iZXI7XG5cbiAgICAgICAgLy8gY2hlY2sgYm91bmRzXG4gICAgICAgIGlmICh0aGlzLm1pbiAhPSBudWxsKSB2YWxpZG51bSA9IE1hdGgubWF4KHZhbGlkbnVtLCB0aGlzLm1pbik7XG4gICAgICAgIGlmICh0aGlzLm1heCAhPSBudWxsKSB2YWxpZG51bSA9IE1hdGgubWluKHZhbGlkbnVtLCB0aGlzLm1heCk7XG4gICAgICAgIGlmICh2YWxpZG51bSAhPT0gbnVtYmVyKSB0aGlzLnVubWFza2VkVmFsdWUgPSB0aGlzLmZvcm1hdCh2YWxpZG51bSwgdGhpcyk7XG4gICAgICAgIGxldCBmb3JtYXR0ZWQgPSB0aGlzLnZhbHVlO1xuICAgICAgICBpZiAodGhpcy5ub3JtYWxpemVaZXJvcykgZm9ybWF0dGVkID0gdGhpcy5fbm9ybWFsaXplWmVyb3MoZm9ybWF0dGVkKTtcbiAgICAgICAgaWYgKHRoaXMucGFkRnJhY3Rpb25hbFplcm9zICYmIHRoaXMuc2NhbGUgPiAwKSBmb3JtYXR0ZWQgPSB0aGlzLl9wYWRGcmFjdGlvbmFsWmVyb3MoZm9ybWF0dGVkKTtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBmb3JtYXR0ZWQ7XG4gICAgICB9XG4gICAgICBzdXBlci5kb0NvbW1pdCgpO1xuICAgIH1cbiAgICBfbm9ybWFsaXplWmVyb3ModmFsdWUpIHtcbiAgICAgIGNvbnN0IHBhcnRzID0gdGhpcy5fcmVtb3ZlVGhvdXNhbmRzU2VwYXJhdG9ycyh2YWx1ZSkuc3BsaXQodGhpcy5yYWRpeCk7XG5cbiAgICAgIC8vIHJlbW92ZSBsZWFkaW5nIHplcm9zXG4gICAgICBwYXJ0c1swXSA9IHBhcnRzWzBdLnJlcGxhY2UoL14oXFxEKikoMCopKFxcZCopLywgKG1hdGNoLCBzaWduLCB6ZXJvcywgbnVtKSA9PiBzaWduICsgbnVtKTtcbiAgICAgIC8vIGFkZCBsZWFkaW5nIHplcm9cbiAgICAgIGlmICh2YWx1ZS5sZW5ndGggJiYgIS9cXGQkLy50ZXN0KHBhcnRzWzBdKSkgcGFydHNbMF0gPSBwYXJ0c1swXSArICcwJztcbiAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHBhcnRzWzFdID0gcGFydHNbMV0ucmVwbGFjZSgvMCokLywgJycpOyAvLyByZW1vdmUgdHJhaWxpbmcgemVyb3NcbiAgICAgICAgaWYgKCFwYXJ0c1sxXS5sZW5ndGgpIHBhcnRzLmxlbmd0aCA9IDE7IC8vIHJlbW92ZSBmcmFjdGlvbmFsXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5faW5zZXJ0VGhvdXNhbmRzU2VwYXJhdG9ycyhwYXJ0cy5qb2luKHRoaXMucmFkaXgpKTtcbiAgICB9XG4gICAgX3BhZEZyYWN0aW9uYWxaZXJvcyh2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuIHZhbHVlO1xuICAgICAgY29uc3QgcGFydHMgPSB2YWx1ZS5zcGxpdCh0aGlzLnJhZGl4KTtcbiAgICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSBwYXJ0cy5wdXNoKCcnKTtcbiAgICAgIHBhcnRzWzFdID0gcGFydHNbMV0ucGFkRW5kKHRoaXMuc2NhbGUsICcwJyk7XG4gICAgICByZXR1cm4gcGFydHMuam9pbih0aGlzLnJhZGl4KTtcbiAgICB9XG4gICAgZG9Ta2lwSW52YWxpZChjaCwgZmxhZ3MsIGNoZWNrVGFpbCkge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRyb3BGcmFjdGlvbmFsID0gdGhpcy5zY2FsZSA9PT0gMCAmJiBjaCAhPT0gdGhpcy50aG91c2FuZHNTZXBhcmF0b3IgJiYgKGNoID09PSB0aGlzLnJhZGl4IHx8IGNoID09PSBNYXNrZWROdW1iZXIuVU5NQVNLRURfUkFESVggfHwgdGhpcy5tYXBUb1JhZGl4LmluY2x1ZGVzKGNoKSk7XG4gICAgICByZXR1cm4gc3VwZXIuZG9Ta2lwSW52YWxpZChjaCwgZmxhZ3MsIGNoZWNrVGFpbCkgJiYgIWRyb3BGcmFjdGlvbmFsO1xuICAgIH1cbiAgICBnZXQgdW5tYXNrZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZW1vdmVUaG91c2FuZHNTZXBhcmF0b3JzKHRoaXMuX25vcm1hbGl6ZVplcm9zKHRoaXMudmFsdWUpKS5yZXBsYWNlKHRoaXMucmFkaXgsIE1hc2tlZE51bWJlci5VTk1BU0tFRF9SQURJWCk7XG4gICAgfVxuICAgIHNldCB1bm1hc2tlZFZhbHVlKHVubWFza2VkVmFsdWUpIHtcbiAgICAgIHN1cGVyLnVubWFza2VkVmFsdWUgPSB1bm1hc2tlZFZhbHVlO1xuICAgIH1cbiAgICBnZXQgdHlwZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlKHRoaXMudW5tYXNrZWRWYWx1ZSwgdGhpcyk7XG4gICAgfVxuICAgIHNldCB0eXBlZFZhbHVlKG4pIHtcbiAgICAgIHRoaXMucmF3SW5wdXRWYWx1ZSA9IHRoaXMuZm9ybWF0KG4sIHRoaXMpLnJlcGxhY2UoTWFza2VkTnVtYmVyLlVOTUFTS0VEX1JBRElYLCB0aGlzLnJhZGl4KTtcbiAgICB9XG5cbiAgICAvKiogUGFyc2VkIE51bWJlciAqL1xuICAgIGdldCBudW1iZXIoKSB7XG4gICAgICByZXR1cm4gdGhpcy50eXBlZFZhbHVlO1xuICAgIH1cbiAgICBzZXQgbnVtYmVyKG51bWJlcikge1xuICAgICAgdGhpcy50eXBlZFZhbHVlID0gbnVtYmVyO1xuICAgIH1cbiAgICBnZXQgYWxsb3dOZWdhdGl2ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1pbiAhPSBudWxsICYmIHRoaXMubWluIDwgMCB8fCB0aGlzLm1heCAhPSBudWxsICYmIHRoaXMubWF4IDwgMDtcbiAgICB9XG4gICAgZ2V0IGFsbG93UG9zaXRpdmUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5taW4gIT0gbnVsbCAmJiB0aGlzLm1pbiA+IDAgfHwgdGhpcy5tYXggIT0gbnVsbCAmJiB0aGlzLm1heCA+IDA7XG4gICAgfVxuICAgIHR5cGVkVmFsdWVFcXVhbHModmFsdWUpIHtcbiAgICAgIC8vIGhhbmRsZSAgMCAtPiAnJyBjYXNlICh0eXBlZCA9IDAgZXZlbiBpZiB2YWx1ZSA9ICcnKVxuICAgICAgLy8gZm9yIGRldGFpbHMgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS91Tm1Bbk5lUi9pbWFza2pzL2lzc3Vlcy8xMzRcbiAgICAgIHJldHVybiAoc3VwZXIudHlwZWRWYWx1ZUVxdWFscyh2YWx1ZSkgfHwgTWFza2VkTnVtYmVyLkVNUFRZX1ZBTFVFUy5pbmNsdWRlcyh2YWx1ZSkgJiYgTWFza2VkTnVtYmVyLkVNUFRZX1ZBTFVFUy5pbmNsdWRlcyh0aGlzLnR5cGVkVmFsdWUpKSAmJiAhKHZhbHVlID09PSAwICYmIHRoaXMudmFsdWUgPT09ICcnKTtcbiAgICB9XG4gIH1cbiAgX01hc2tlZE51bWJlciA9IE1hc2tlZE51bWJlcjtcbiAgTWFza2VkTnVtYmVyLlVOTUFTS0VEX1JBRElYID0gJy4nO1xuICBNYXNrZWROdW1iZXIuRU1QVFlfVkFMVUVTID0gWy4uLk1hc2tlZC5FTVBUWV9WQUxVRVMsIDBdO1xuICBNYXNrZWROdW1iZXIuREVGQVVMVFMgPSB7XG4gICAgLi4uTWFza2VkLkRFRkFVTFRTLFxuICAgIG1hc2s6IE51bWJlcixcbiAgICByYWRpeDogJywnLFxuICAgIHRob3VzYW5kc1NlcGFyYXRvcjogJycsXG4gICAgbWFwVG9SYWRpeDogW19NYXNrZWROdW1iZXIuVU5NQVNLRURfUkFESVhdLFxuICAgIG1pbjogTnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIsXG4gICAgbWF4OiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgICBzY2FsZTogMixcbiAgICBub3JtYWxpemVaZXJvczogdHJ1ZSxcbiAgICBwYWRGcmFjdGlvbmFsWmVyb3M6IGZhbHNlLFxuICAgIHBhcnNlOiBOdW1iZXIsXG4gICAgZm9ybWF0OiBuID0+IG4udG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJywge1xuICAgICAgdXNlR3JvdXBpbmc6IGZhbHNlLFxuICAgICAgbWF4aW11bUZyYWN0aW9uRGlnaXRzOiAyMFxuICAgIH0pXG4gIH07XG4gIElNYXNrLk1hc2tlZE51bWJlciA9IE1hc2tlZE51bWJlcjtcblxuICAvKiogTWFzayBwaXBlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gdHlwZXMgKi9cbiAgY29uc3QgUElQRV9UWVBFID0ge1xuICAgIE1BU0tFRDogJ3ZhbHVlJyxcbiAgICBVTk1BU0tFRDogJ3VubWFza2VkVmFsdWUnLFxuICAgIFRZUEVEOiAndHlwZWRWYWx1ZSdcbiAgfTtcbiAgLyoqIENyZWF0ZXMgbmV3IHBpcGUgZnVuY3Rpb24gZGVwZW5kaW5nIG9uIG1hc2sgdHlwZSwgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBvcHRpb25zICovXG4gIGZ1bmN0aW9uIGNyZWF0ZVBpcGUoYXJnLCBmcm9tLCB0bykge1xuICAgIGlmIChmcm9tID09PSB2b2lkIDApIHtcbiAgICAgIGZyb20gPSBQSVBFX1RZUEUuTUFTS0VEO1xuICAgIH1cbiAgICBpZiAodG8gPT09IHZvaWQgMCkge1xuICAgICAgdG8gPSBQSVBFX1RZUEUuTUFTS0VEO1xuICAgIH1cbiAgICBjb25zdCBtYXNrZWQgPSBjcmVhdGVNYXNrKGFyZyk7XG4gICAgcmV0dXJuIHZhbHVlID0+IG1hc2tlZC5ydW5Jc29sYXRlZChtID0+IHtcbiAgICAgIG1bZnJvbV0gPSB2YWx1ZTtcbiAgICAgIHJldHVybiBtW3RvXTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBQaXBlcyB2YWx1ZSB0aHJvdWdoIG1hc2sgZGVwZW5kaW5nIG9uIG1hc2sgdHlwZSwgc291cmNlIGFuZCBkZXN0aW5hdGlvbiBvcHRpb25zICovXG4gIGZ1bmN0aW9uIHBpcGUodmFsdWUsIG1hc2ssIGZyb20sIHRvKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVBpcGUobWFzaywgZnJvbSwgdG8pKHZhbHVlKTtcbiAgfVxuICBJTWFzay5QSVBFX1RZUEUgPSBQSVBFX1RZUEU7XG4gIElNYXNrLmNyZWF0ZVBpcGUgPSBjcmVhdGVQaXBlO1xuICBJTWFzay5waXBlID0gcGlwZTtcblxuICAvKiogUGF0dGVybiBtYXNrICovXG4gIGNsYXNzIFJlcGVhdEJsb2NrIGV4dGVuZHMgTWFza2VkUGF0dGVybiB7XG4gICAgZ2V0IHJlcGVhdEZyb20oKSB7XG4gICAgICB2YXIgX3JlZjtcbiAgICAgIHJldHVybiAoX3JlZiA9IEFycmF5LmlzQXJyYXkodGhpcy5yZXBlYXQpID8gdGhpcy5yZXBlYXRbMF0gOiB0aGlzLnJlcGVhdCA9PT0gSW5maW5pdHkgPyAwIDogdGhpcy5yZXBlYXQpICE9IG51bGwgPyBfcmVmIDogMDtcbiAgICB9XG4gICAgZ2V0IHJlcGVhdFRvKCkge1xuICAgICAgdmFyIF9yZWYyO1xuICAgICAgcmV0dXJuIChfcmVmMiA9IEFycmF5LmlzQXJyYXkodGhpcy5yZXBlYXQpID8gdGhpcy5yZXBlYXRbMV0gOiB0aGlzLnJlcGVhdCkgIT0gbnVsbCA/IF9yZWYyIDogSW5maW5pdHk7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIHN1cGVyKG9wdHMpO1xuICAgIH1cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgdmFyIF9yZWYzLCBfcmVmNCwgX3RoaXMkX2Jsb2NrcztcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgcmVwZWF0LFxuICAgICAgICAuLi5ibG9ja09wdHNcbiAgICAgIH0gPSBub3JtYWxpemVPcHRzKG9wdHMpOyAvLyBUT0RPIHR5cGVcbiAgICAgIHRoaXMuX2Jsb2NrT3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuX2Jsb2NrT3B0cywgYmxvY2tPcHRzKTtcbiAgICAgIGNvbnN0IGJsb2NrID0gY3JlYXRlTWFzayh0aGlzLl9ibG9ja09wdHMpO1xuICAgICAgdGhpcy5yZXBlYXQgPSAoX3JlZjMgPSAoX3JlZjQgPSByZXBlYXQgIT0gbnVsbCA/IHJlcGVhdCA6IGJsb2NrLnJlcGVhdCkgIT0gbnVsbCA/IF9yZWY0IDogdGhpcy5yZXBlYXQpICE9IG51bGwgPyBfcmVmMyA6IEluZmluaXR5OyAvLyBUT0RPIHR5cGVcblxuICAgICAgc3VwZXIuX3VwZGF0ZSh7XG4gICAgICAgIG1hc2s6ICdtJy5yZXBlYXQoTWF0aC5tYXgodGhpcy5yZXBlYXRUbyA9PT0gSW5maW5pdHkgJiYgKChfdGhpcyRfYmxvY2tzID0gdGhpcy5fYmxvY2tzKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkX2Jsb2Nrcy5sZW5ndGgpIHx8IDAsIHRoaXMucmVwZWF0RnJvbSkpLFxuICAgICAgICBibG9ja3M6IHtcbiAgICAgICAgICBtOiBibG9ja1xuICAgICAgICB9LFxuICAgICAgICBlYWdlcjogYmxvY2suZWFnZXIsXG4gICAgICAgIG92ZXJ3cml0ZTogYmxvY2sub3ZlcndyaXRlLFxuICAgICAgICBza2lwSW52YWxpZDogYmxvY2suc2tpcEludmFsaWQsXG4gICAgICAgIGxhenk6IGJsb2NrLmxhenksXG4gICAgICAgIHBsYWNlaG9sZGVyQ2hhcjogYmxvY2sucGxhY2Vob2xkZXJDaGFyLFxuICAgICAgICBkaXNwbGF5Q2hhcjogYmxvY2suZGlzcGxheUNoYXJcbiAgICAgIH0pO1xuICAgIH1cbiAgICBfYWxsb2NhdGVCbG9jayhiaSkge1xuICAgICAgaWYgKGJpIDwgdGhpcy5fYmxvY2tzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX2Jsb2Nrc1tiaV07XG4gICAgICBpZiAodGhpcy5yZXBlYXRUbyA9PT0gSW5maW5pdHkgfHwgdGhpcy5fYmxvY2tzLmxlbmd0aCA8IHRoaXMucmVwZWF0VG8pIHtcbiAgICAgICAgdGhpcy5fYmxvY2tzLnB1c2goY3JlYXRlTWFzayh0aGlzLl9ibG9ja09wdHMpKTtcbiAgICAgICAgdGhpcy5tYXNrICs9ICdtJztcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Jsb2Nrc1t0aGlzLl9ibG9ja3MubGVuZ3RoIC0gMV07XG4gICAgICB9XG4gICAgfVxuICAgIF9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgZm9yIChsZXQgYmkgPSAoX3RoaXMkX21hcFBvc1RvQmxvY2skID0gKF90aGlzJF9tYXBQb3NUb0Jsb2NrID0gdGhpcy5fbWFwUG9zVG9CbG9jayh0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgpKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkX21hcFBvc1RvQmxvY2suaW5kZXgpICE9IG51bGwgPyBfdGhpcyRfbWFwUG9zVG9CbG9jayQgOiBNYXRoLm1heCh0aGlzLl9ibG9ja3MubGVuZ3RoIC0gMSwgMCksIGJsb2NrLCBhbGxvY2F0ZWQ7XG4gICAgICAvLyB0cnkgdG8gZ2V0IGEgYmxvY2sgb3JcbiAgICAgIC8vIHRyeSB0byBhbGxvY2F0ZSBhIG5ldyBibG9jayBpZiBub3QgYWxsb2NhdGVkIGFscmVhZHlcbiAgICAgIGJsb2NrID0gKF90aGlzJF9ibG9ja3MkYmkgPSB0aGlzLl9ibG9ja3NbYmldKSAhPSBudWxsID8gX3RoaXMkX2Jsb2NrcyRiaSA6IGFsbG9jYXRlZCA9ICFhbGxvY2F0ZWQgJiYgdGhpcy5fYWxsb2NhdGVCbG9jayhiaSk7ICsrYmkpIHtcbiAgICAgICAgdmFyIF90aGlzJF9tYXBQb3NUb0Jsb2NrJCwgX3RoaXMkX21hcFBvc1RvQmxvY2ssIF90aGlzJF9ibG9ja3MkYmksIF9mbGFncyRfYmVmb3JlVGFpbFN0YTtcbiAgICAgICAgY29uc3QgYmxvY2tEZXRhaWxzID0gYmxvY2suX2FwcGVuZENoYXIoY2gsIHtcbiAgICAgICAgICAuLi5mbGFncyxcbiAgICAgICAgICBfYmVmb3JlVGFpbFN0YXRlOiAoX2ZsYWdzJF9iZWZvcmVUYWlsU3RhID0gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSkgPT0gbnVsbCB8fCAoX2ZsYWdzJF9iZWZvcmVUYWlsU3RhID0gX2ZsYWdzJF9iZWZvcmVUYWlsU3RhLl9ibG9ja3MpID09IG51bGwgPyB2b2lkIDAgOiBfZmxhZ3MkX2JlZm9yZVRhaWxTdGFbYmldXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoYmxvY2tEZXRhaWxzLnNraXAgJiYgYWxsb2NhdGVkKSB7XG4gICAgICAgICAgLy8gcmVtb3ZlIHRoZSBsYXN0IGFsbG9jYXRlZCBibG9jayBhbmQgYnJlYWtcbiAgICAgICAgICB0aGlzLl9ibG9ja3MucG9wKCk7XG4gICAgICAgICAgdGhpcy5tYXNrID0gdGhpcy5tYXNrLnNsaWNlKDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKGJsb2NrRGV0YWlscyk7XG4gICAgICAgIGlmIChibG9ja0RldGFpbHMuY29uc3VtZWQpIGJyZWFrOyAvLyBnbyBuZXh0IGNoYXJcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBfdHJpbUVtcHR5VGFpbChmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgdmFyIF90aGlzJF9tYXBQb3NUb0Jsb2NrMiwgX3RoaXMkX21hcFBvc1RvQmxvY2szO1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZpcnN0QmxvY2tJbmRleCA9IE1hdGgubWF4KCgoX3RoaXMkX21hcFBvc1RvQmxvY2syID0gdGhpcy5fbWFwUG9zVG9CbG9jayhmcm9tUG9zKSkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJF9tYXBQb3NUb0Jsb2NrMi5pbmRleCkgfHwgMCwgdGhpcy5yZXBlYXRGcm9tLCAwKTtcbiAgICAgIGxldCBsYXN0QmxvY2tJbmRleDtcbiAgICAgIGlmICh0b1BvcyAhPSBudWxsKSBsYXN0QmxvY2tJbmRleCA9IChfdGhpcyRfbWFwUG9zVG9CbG9jazMgPSB0aGlzLl9tYXBQb3NUb0Jsb2NrKHRvUG9zKSkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJF9tYXBQb3NUb0Jsb2NrMy5pbmRleDtcbiAgICAgIGlmIChsYXN0QmxvY2tJbmRleCA9PSBudWxsKSBsYXN0QmxvY2tJbmRleCA9IHRoaXMuX2Jsb2Nrcy5sZW5ndGggLSAxO1xuICAgICAgbGV0IHJlbW92ZUNvdW50ID0gMDtcbiAgICAgIGZvciAobGV0IGJsb2NrSW5kZXggPSBsYXN0QmxvY2tJbmRleDsgZmlyc3RCbG9ja0luZGV4IDw9IGJsb2NrSW5kZXg7IC0tYmxvY2tJbmRleCwgKytyZW1vdmVDb3VudCkge1xuICAgICAgICBpZiAodGhpcy5fYmxvY2tzW2Jsb2NrSW5kZXhdLnVubWFza2VkVmFsdWUpIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKHJlbW92ZUNvdW50KSB7XG4gICAgICAgIHRoaXMuX2Jsb2Nrcy5zcGxpY2UobGFzdEJsb2NrSW5kZXggLSByZW1vdmVDb3VudCArIDEsIHJlbW92ZUNvdW50KTtcbiAgICAgICAgdGhpcy5tYXNrID0gdGhpcy5tYXNrLnNsaWNlKHJlbW92ZUNvdW50KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICBzdXBlci5yZXNldCgpO1xuICAgICAgdGhpcy5fdHJpbUVtcHR5VGFpbCgpO1xuICAgIH1cbiAgICByZW1vdmUoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlbW92ZURldGFpbHMgPSBzdXBlci5yZW1vdmUoZnJvbVBvcywgdG9Qb3MpO1xuICAgICAgdGhpcy5fdHJpbUVtcHR5VGFpbChmcm9tUG9zLCB0b1Bvcyk7XG4gICAgICByZXR1cm4gcmVtb3ZlRGV0YWlscztcbiAgICB9XG4gICAgdG90YWxJbnB1dFBvc2l0aW9ucyhmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PSBudWxsICYmIHRoaXMucmVwZWF0VG8gPT09IEluZmluaXR5KSByZXR1cm4gSW5maW5pdHk7XG4gICAgICByZXR1cm4gc3VwZXIudG90YWxJbnB1dFBvc2l0aW9ucyhmcm9tUG9zLCB0b1Bvcyk7XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHJldHVybiBzdXBlci5zdGF0ZTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHN0YXRlKSB7XG4gICAgICB0aGlzLl9ibG9ja3MubGVuZ3RoID0gc3RhdGUuX2Jsb2Nrcy5sZW5ndGg7XG4gICAgICB0aGlzLm1hc2sgPSB0aGlzLm1hc2suc2xpY2UoMCwgdGhpcy5fYmxvY2tzLmxlbmd0aCk7XG4gICAgICBzdXBlci5zdGF0ZSA9IHN0YXRlO1xuICAgIH1cbiAgfVxuICBJTWFzay5SZXBlYXRCbG9jayA9IFJlcGVhdEJsb2NrO1xuXG4gIHRyeSB7XG4gICAgZ2xvYmFsVGhpcy5JTWFzayA9IElNYXNrO1xuICB9IGNhdGNoIHt9XG5cbiAgZXhwb3J0cy5DaGFuZ2VEZXRhaWxzID0gQ2hhbmdlRGV0YWlscztcbiAgZXhwb3J0cy5DaHVua3NUYWlsRGV0YWlscyA9IENodW5rc1RhaWxEZXRhaWxzO1xuICBleHBvcnRzLkRJUkVDVElPTiA9IERJUkVDVElPTjtcbiAgZXhwb3J0cy5IVE1MQ29udGVudGVkaXRhYmxlTWFza0VsZW1lbnQgPSBIVE1MQ29udGVudGVkaXRhYmxlTWFza0VsZW1lbnQ7XG4gIGV4cG9ydHMuSFRNTElucHV0TWFza0VsZW1lbnQgPSBIVE1MSW5wdXRNYXNrRWxlbWVudDtcbiAgZXhwb3J0cy5IVE1MTWFza0VsZW1lbnQgPSBIVE1MTWFza0VsZW1lbnQ7XG4gIGV4cG9ydHMuSW5wdXRNYXNrID0gSW5wdXRNYXNrO1xuICBleHBvcnRzLk1hc2tFbGVtZW50ID0gTWFza0VsZW1lbnQ7XG4gIGV4cG9ydHMuTWFza2VkID0gTWFza2VkO1xuICBleHBvcnRzLk1hc2tlZERhdGUgPSBNYXNrZWREYXRlO1xuICBleHBvcnRzLk1hc2tlZER5bmFtaWMgPSBNYXNrZWREeW5hbWljO1xuICBleHBvcnRzLk1hc2tlZEVudW0gPSBNYXNrZWRFbnVtO1xuICBleHBvcnRzLk1hc2tlZEZ1bmN0aW9uID0gTWFza2VkRnVuY3Rpb247XG4gIGV4cG9ydHMuTWFza2VkTnVtYmVyID0gTWFza2VkTnVtYmVyO1xuICBleHBvcnRzLk1hc2tlZFBhdHRlcm4gPSBNYXNrZWRQYXR0ZXJuO1xuICBleHBvcnRzLk1hc2tlZFJhbmdlID0gTWFza2VkUmFuZ2U7XG4gIGV4cG9ydHMuTWFza2VkUmVnRXhwID0gTWFza2VkUmVnRXhwO1xuICBleHBvcnRzLlBJUEVfVFlQRSA9IFBJUEVfVFlQRTtcbiAgZXhwb3J0cy5QYXR0ZXJuRml4ZWREZWZpbml0aW9uID0gUGF0dGVybkZpeGVkRGVmaW5pdGlvbjtcbiAgZXhwb3J0cy5QYXR0ZXJuSW5wdXREZWZpbml0aW9uID0gUGF0dGVybklucHV0RGVmaW5pdGlvbjtcbiAgZXhwb3J0cy5SZXBlYXRCbG9jayA9IFJlcGVhdEJsb2NrO1xuICBleHBvcnRzLmNyZWF0ZU1hc2sgPSBjcmVhdGVNYXNrO1xuICBleHBvcnRzLmNyZWF0ZVBpcGUgPSBjcmVhdGVQaXBlO1xuICBleHBvcnRzLmRlZmF1bHQgPSBJTWFzaztcbiAgZXhwb3J0cy5mb3JjZURpcmVjdGlvbiA9IGZvcmNlRGlyZWN0aW9uO1xuICBleHBvcnRzLm5vcm1hbGl6ZU9wdHMgPSBub3JtYWxpemVPcHRzO1xuICBleHBvcnRzLnBpcGUgPSBwaXBlO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWltYXNrLmpzLm1hcFxuIiwiaW1wb3J0IGlNYXNrIGZyb20gJ2ltYXNrJztcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgY29uc3QgZHJvcGRvd25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgW2RhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIl1gKTtcbiAgY29uc3QgZWRpdExpbmsgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1hY3Rpb249XCJlZGl0XCJdYCk7XG4gIGNvbnN0IGZvcm0gPSBkb2N1bWVudC5mb3Jtc1swXTtcbiAgbGV0IGVsZW1zID0gW107XG4gIGlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIGZvcm0pIHtcbiAgICBlbGVtcyA9IE9iamVjdC52YWx1ZXMoZm9ybS5lbGVtZW50cykuXG4gICAgICAgIGZpbHRlcigoZWwpID0+IGVsICYmIGVsLmNsYXNzTGlzdC5jb250YWlucygnaXMtZWRpdGFibGUnKSk7XG4gICAgY29uc3QgcGhvbmUgPSBmb3JtLmVsZW1lbnRzLnBob25lO1xuICAgIGlmIChudWxsICE9PSBwaG9uZSkge1xuICAgICAgY29uc3QgbmV3TWFzayA9IGlNYXNrKHBob25lLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1hc2s6ICcrezM3NX0gKDAwKSAwMDAtMDAtMDAnLFxuICAgICAgICAgICAgbGF6eTogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgKS5vbignY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gdG9kbzpcbiAgICAgIH0pO1xuICAgICAgY29uc29sZS5sb2cobmV3TWFzayk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG51bGwgIT09IGVkaXRMaW5rKSB7XG4gICAgZWRpdExpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZWxlbXMuZm9yRWFjaCgoZWxlbSkgPT4ge1xuICAgICAgICBlbGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2xlYWQtZm9ybV9fZ3JvdXAtLWRpc2FibGVkJyk7XG4gICAgICAgIGNvbnN0IGlucHV0RWwgPSBlbGVtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgICAgIGlucHV0RWwucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgaWYgKG51bGwgIT09IGRyb3Bkb3ducykge1xuICAgIGRyb3Bkb3ducy5mb3JFYWNoKChkcm9wZG93bikgPT4ge1xuICAgICAgZHJvcGRvd24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRJZCA9IGRyb3Bkb3duLmRhdGFzZXQudGFyZ2V0LnJlcGxhY2UoJyMnLCAnJyk7XG4gICAgICAgIGlmIChudWxsICE9PSBjb250ZW50SWQpIHtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGVudElkKTtcbiAgICAgICAgICBjb250ZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLWhpZGRlbicpO1xuICAgICAgICAgIGRyb3Bkb3duLmNsYXNzTGlzdC50b2dnbGUoJ2lzLW9wZW4nKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn0pO1xuIl19
