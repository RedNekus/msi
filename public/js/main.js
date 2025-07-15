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

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _imask = _interopRequireDefault(require("imask"));
var _validate = _interopRequireDefault(require("validate.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
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
  if ('undefined' !== typeof form && form.elements) {
    elems = Object.values(form.elements);
    if (elems) {
      elems.filter(function (el) {
        return el.nodeName === 'INPUT' && el.classList.contains('is-editable');
      });
    }
    var phone = form.elements.phone;
    if ('undefined' !== typeof phone) {
      (0, _imask["default"])(phone, {
        mask: '+{375} (00) 000-00-00',
        lazy: true
      }).on('complete', function () {
        // todo:
      });
    }
    Object.values(form.elements).forEach(function (el) {
      if (el.nodeName === 'INPUT') {
        el.addEventListener('change', function () {
          el.classList.remove('invalid');
          var msg = el.parentElement.querySelector('.messages');
          if (!msg) {
            msg = el.parentElement.parentElement.querySelector('.messages');
          }
          if (msg) {
            msg.classList.remove('error');
            msg.innerHTML = '';
          }
        });
      }
    });
    var checkFields = function checkFields(constraints) {
      var errors = (0, _validate["default"])(form, constraints);
      if (errors) {
        Object.entries(errors).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
            id = _ref2[0],
            error = _ref2[1];
          var isRadio = 0;
          var input = form.elements[id];
          if (input instanceof Array || input instanceof RadioNodeList) {
            input = input[0];
            isRadio = 1;
          }
          if (input) {
            input.classList.add('invalid');
            var msg = input.parentElement.querySelector('.messages');
            if (isRadio && !msg) {
              msg = input.parentElement.parentElement.querySelector('.messages');
            }
            if (null !== msg) {
              msg.innerHTML = error[0];
              msg.classList.add('error');
            }
          }
        });
        return false;
      } else {
        return true;
      }
    };
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
          agreement_fszn: {
            presence: {
              message: "^\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u043D\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u0438\u0437 \u0424\u0421\u0417\u041D"
            }
          }
        };
        if (checkFields(constraints)) {
          form.submit();
        }
      }
      if (form.id === 'register_address') {
        e.preventDefault();
        var _constraints = {
          matches: {
            presence: {
              message: "^\u0412\u044B\u0431\u0435\u0440\u0435\u0442\u0438\u0442\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435!"
            }
          }
        };
        if (checkFields(_constraints)) {
          form.submit();
        }
      }
    });
  }
  if (null !== form && form.id === 'confirmation') {
    var timer = document.querySelector("[data-timer]");
    var resend = document.querySelector("[data-resend]");
    var timeEl = document.querySelector("[data-time]");
    var timerFunc = function timerFunc() {
      var timerId = setInterval(function () {
        var time = timeEl.dataset.time;
        --time;
        if (time >= 0) {
          timeEl.innerHTML = time;
          timeEl.dataset.time = time;
        } else {
          clearInterval(timerId);
          timer.classList.add("is-hidden");
          resend.classList.remove("is-hidden");
        }
      }, 1000);
    };
    timerFunc();
    resend.addEventListener('click', /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(e) {
        var response, json;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              e.preventDefault();
              timeEl.innerHTML = 59;
              timeEl.dataset.time = 59;
              timer.classList.remove("is-hidden");
              resend.classList.add("is-hidden");
              _context.next = 7;
              return fetch('/lead/sendsms');
            case 7:
              response = _context.sent;
              if (!response.ok) {
                _context.next = 13;
                break;
              }
              _context.next = 11;
              return response.json();
            case 11:
              json = _context.sent;
              console.log(json);
            case 13:
              timerFunc();
            case 14:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      return function (_x) {
        return _ref3.apply(this, arguments);
      };
    }());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvaW1hc2svZGlzdC9pbWFzay5qcyIsIm5vZGVfbW9kdWxlcy92YWxpZGF0ZS5qcy92YWxpZGF0ZS5qcyIsInNyYy9qcy9zY3JpcHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDempIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDcnVDQSxJQUFBLE1BQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLFNBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFBbUMsU0FBQSx1QkFBQSxDQUFBLFdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxVQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBO0FBQUEsU0FBQSxvQkFBQSxrQkFBbkMscUpBQUEsbUJBQUEsWUFBQSxvQkFBQSxXQUFBLENBQUEsU0FBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsU0FBQSxFQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsY0FBQSxFQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsY0FBQSxjQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLEtBQUEsS0FBQSxDQUFBLHdCQUFBLE1BQUEsR0FBQSxNQUFBLE9BQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxRQUFBLGtCQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsYUFBQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLFdBQUEsOEJBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsV0FBQSxNQUFBLENBQUEsY0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLElBQUEsS0FBQSxFQUFBLENBQUEsRUFBQSxVQUFBLE1BQUEsWUFBQSxNQUFBLFFBQUEsU0FBQSxDQUFBLENBQUEsQ0FBQSxXQUFBLE1BQUEsbUJBQUEsQ0FBQSxJQUFBLE1BQUEsWUFBQSxPQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxLQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxTQUFBLFlBQUEsU0FBQSxHQUFBLENBQUEsR0FBQSxTQUFBLEVBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBLFNBQUEsR0FBQSxDQUFBLE9BQUEsT0FBQSxDQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBLENBQUEsZUFBQSxLQUFBLEVBQUEsZ0JBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLGFBQUEsU0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsbUJBQUEsSUFBQSxZQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLGNBQUEsQ0FBQSxhQUFBLElBQUEsV0FBQSxHQUFBLEVBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxNQUFBLENBQUEscUJBQUEsQ0FBQSxxQkFBQSxDQUFBLGdCQUFBLENBQUEsZ0JBQUEsQ0FBQSxnQkFBQSxVQUFBLGNBQUEsa0JBQUEsY0FBQSwyQkFBQSxTQUFBLENBQUEsT0FBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEscUNBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLE1BQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxHQUFBLENBQUEsT0FBQSxDQUFBLEdBQUEsMEJBQUEsQ0FBQSxTQUFBLEdBQUEsU0FBQSxDQUFBLFNBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsWUFBQSxzQkFBQSxDQUFBLGdDQUFBLE9BQUEsV0FBQSxDQUFBLElBQUEsTUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLFlBQUEsQ0FBQSxnQkFBQSxPQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsc0JBQUEsY0FBQSxDQUFBLEVBQUEsQ0FBQSxhQUFBLE9BQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxRQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxtQkFBQSxDQUFBLENBQUEsSUFBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsS0FBQSxTQUFBLENBQUEsZ0JBQUEsT0FBQSxDQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsZUFBQSxDQUFBLENBQUEsT0FBQSxDQUFBLENBQUEsQ0FBQSxPQUFBLEVBQUEsSUFBQSxXQUFBLENBQUEsSUFBQSxNQUFBLFNBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLGdCQUFBLENBQUEsSUFBQSxNQUFBLFVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLEVBQUEsSUFBQSxXQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsS0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQSxnQkFBQSxDQUFBLFdBQUEsTUFBQSxVQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxTQUFBLENBQUEsRUFBQSxDQUFBLG9CQUFBLEtBQUEsV0FBQSxNQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsMkJBQUEsZUFBQSxDQUFBLFdBQUEsQ0FBQSxFQUFBLENBQUEsSUFBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxnQkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsMEJBQUEsRUFBQSwwQkFBQSxJQUFBLDBCQUFBLHFCQUFBLGlCQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxLQUFBLHNDQUFBLENBQUEsS0FBQSxDQUFBLG9CQUFBLENBQUEsUUFBQSxDQUFBLFdBQUEsS0FBQSxFQUFBLENBQUEsRUFBQSxJQUFBLGVBQUEsQ0FBQSxDQUFBLE1BQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxRQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxtQkFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLENBQUEsS0FBQSxDQUFBLG1CQUFBLENBQUEscUJBQUEsQ0FBQSxDQUFBLE1BQUEsRUFBQSxDQUFBLENBQUEsSUFBQSxHQUFBLENBQUEsQ0FBQSxLQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsc0JBQUEsQ0FBQSxDQUFBLE1BQUEsUUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUEsaUJBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSx1QkFBQSxDQUFBLENBQUEsTUFBQSxJQUFBLENBQUEsQ0FBQSxNQUFBLFdBQUEsQ0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxRQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLG9CQUFBLENBQUEsQ0FBQSxJQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsR0FBQSxLQUFBLENBQUEscUJBQUEsS0FBQSxFQUFBLENBQUEsQ0FBQSxHQUFBLEVBQUEsSUFBQSxFQUFBLENBQUEsQ0FBQSxJQUFBLGtCQUFBLENBQUEsQ0FBQSxJQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsTUFBQSxZQUFBLENBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsbUJBQUEsb0JBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLE1BQUEsRUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsUUFBQSxxQkFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLFFBQUEsZUFBQSxDQUFBLENBQUEsTUFBQSxhQUFBLENBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQSxFQUFBLG1CQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsZUFBQSxDQUFBLENBQUEsTUFBQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLE1BQUEsWUFBQSxDQUFBLENBQUEsR0FBQSxPQUFBLFNBQUEsdUNBQUEsQ0FBQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxHQUFBLFFBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLENBQUEsR0FBQSxtQkFBQSxDQUFBLENBQUEsSUFBQSxTQUFBLENBQUEsQ0FBQSxNQUFBLFlBQUEsQ0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQSxRQUFBLFNBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsVUFBQSxJQUFBLENBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQSxDQUFBLElBQUEsR0FBQSxDQUFBLENBQUEsT0FBQSxlQUFBLENBQUEsQ0FBQSxNQUFBLEtBQUEsQ0FBQSxDQUFBLE1BQUEsV0FBQSxDQUFBLENBQUEsR0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsUUFBQSxTQUFBLENBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLE1BQUEsWUFBQSxDQUFBLENBQUEsR0FBQSxPQUFBLFNBQUEsc0NBQUEsQ0FBQSxDQUFBLFFBQUEsU0FBQSxDQUFBLGNBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSxLQUFBLE1BQUEsRUFBQSxDQUFBLFlBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxRQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsVUFBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsUUFBQSxHQUFBLENBQUEsV0FBQSxVQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsY0FBQSxjQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLFVBQUEsUUFBQSxDQUFBLENBQUEsSUFBQSxvQkFBQSxDQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQSxVQUFBLEdBQUEsQ0FBQSxhQUFBLFFBQUEsQ0FBQSxTQUFBLFVBQUEsTUFBQSxNQUFBLGFBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxZQUFBLGNBQUEsS0FBQSxpQkFBQSxPQUFBLENBQUEsUUFBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsNEJBQUEsQ0FBQSxDQUFBLElBQUEsU0FBQSxDQUFBLE9BQUEsS0FBQSxDQUFBLENBQUEsQ0FBQSxNQUFBLFNBQUEsQ0FBQSxPQUFBLENBQUEsWUFBQSxLQUFBLGFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxNQUFBLE9BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxVQUFBLElBQUEsQ0FBQSxLQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsSUFBQSxPQUFBLElBQUEsU0FBQSxJQUFBLENBQUEsS0FBQSxHQUFBLENBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxPQUFBLElBQUEsWUFBQSxDQUFBLENBQUEsSUFBQSxHQUFBLENBQUEsZ0JBQUEsU0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLGtDQUFBLGlCQUFBLENBQUEsU0FBQSxHQUFBLDBCQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUEsbUJBQUEsS0FBQSxFQUFBLDBCQUFBLEVBQUEsWUFBQSxTQUFBLENBQUEsQ0FBQSwwQkFBQSxtQkFBQSxLQUFBLEVBQUEsaUJBQUEsRUFBQSxZQUFBLFNBQUEsaUJBQUEsQ0FBQSxXQUFBLEdBQUEsTUFBQSxDQUFBLDBCQUFBLEVBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUEsbUJBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSx3QkFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLFdBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLGlCQUFBLDZCQUFBLENBQUEsQ0FBQSxXQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsT0FBQSxDQUFBLENBQUEsSUFBQSxhQUFBLENBQUEsV0FBQSxNQUFBLENBQUEsY0FBQSxHQUFBLE1BQUEsQ0FBQSxjQUFBLENBQUEsQ0FBQSxFQUFBLDBCQUFBLEtBQUEsQ0FBQSxDQUFBLFNBQUEsR0FBQSwwQkFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSx5QkFBQSxDQUFBLENBQUEsU0FBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsS0FBQSxhQUFBLENBQUEsYUFBQSxPQUFBLEVBQUEsQ0FBQSxPQUFBLHFCQUFBLENBQUEsYUFBQSxDQUFBLFNBQUEsR0FBQSxNQUFBLENBQUEsYUFBQSxDQUFBLFNBQUEsRUFBQSxDQUFBLGlDQUFBLENBQUEsQ0FBQSxhQUFBLEdBQUEsYUFBQSxFQUFBLENBQUEsQ0FBQSxLQUFBLGFBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsZUFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLE9BQUEsT0FBQSxDQUFBLE9BQUEsYUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxtQkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLElBQUEsR0FBQSxJQUFBLFdBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLEtBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxXQUFBLHFCQUFBLENBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxnQkFBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsaUNBQUEsTUFBQSxDQUFBLENBQUEsNkRBQUEsQ0FBQSxDQUFBLElBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxPQUFBLGFBQUEsS0FBQSxXQUFBLENBQUEsQ0FBQSxNQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsU0FBQSxJQUFBLENBQUEsS0FBQSxHQUFBLENBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxPQUFBLElBQUEsV0FBQSxJQUFBLENBQUEsSUFBQSxPQUFBLElBQUEsUUFBQSxDQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsRUFBQSxPQUFBLENBQUEsU0FBQSxLQUFBLFdBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxXQUFBLE1BQUEsQ0FBQSxhQUFBLElBQUEsV0FBQSxJQUFBLFdBQUEsSUFBQSxRQUFBLEtBQUEsR0FBQSxDQUFBLE9BQUEsSUFBQSxZQUFBLFFBQUEsY0FBQSxNQUFBLGdCQUFBLEdBQUEsR0FBQSxDQUFBLE9BQUEsVUFBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLElBQUEsQ0FBQSxXQUFBLENBQUEsa0JBQUEsQ0FBQSxDQUFBLE1BQUEsT0FBQSxDQUFBLENBQUEsSUFBQSxPQUFBLENBQUEsTUFBQSxLQUFBLEVBQUEsQ0FBQSxDQUFBLEtBQUEsY0FBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLElBQUEsV0FBQSxLQUFBLFNBQUEsSUFBQSxXQUFBLENBQUEsUUFBQSxVQUFBLElBQUEsVUFBQSxrQkFBQSxDQUFBLENBQUEsSUFBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLGNBQUEsSUFBQSxLQUFBLGlCQUFBLFdBQUEsa0JBQUEsQ0FBQSxhQUFBLElBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxrQkFBQSxPQUFBLENBQUEsRUFBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBLElBQUEsWUFBQSxDQUFBLENBQUEsR0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsSUFBQSxHQUFBLENBQUEsRUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLE1BQUEsV0FBQSxDQUFBLENBQUEsR0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQSxRQUFBLFVBQUEsQ0FBQSxNQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxDQUFBLFFBQUEsVUFBQSxDQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLFVBQUEsaUJBQUEsQ0FBQSxDQUFBLE1BQUEsU0FBQSxNQUFBLGFBQUEsQ0FBQSxDQUFBLE1BQUEsU0FBQSxJQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxlQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEscUJBQUEsQ0FBQSxJQUFBLENBQUEsYUFBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLFFBQUEsU0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBLFFBQUEsZ0JBQUEsSUFBQSxHQUFBLENBQUEsQ0FBQSxVQUFBLFNBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxVQUFBLGNBQUEsQ0FBQSxhQUFBLElBQUEsR0FBQSxDQUFBLENBQUEsUUFBQSxTQUFBLE1BQUEsQ0FBQSxDQUFBLENBQUEsUUFBQSxxQkFBQSxDQUFBLFFBQUEsS0FBQSxxREFBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLFVBQUEsU0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBLFVBQUEsWUFBQSxNQUFBLFdBQUEsT0FBQSxDQUFBLEVBQUEsQ0FBQSxhQUFBLENBQUEsUUFBQSxVQUFBLENBQUEsTUFBQSxNQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsQ0FBQSxRQUFBLFVBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLE1BQUEsU0FBQSxJQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLHdCQUFBLElBQUEsR0FBQSxDQUFBLENBQUEsVUFBQSxRQUFBLENBQUEsR0FBQSxDQUFBLGFBQUEsQ0FBQSxpQkFBQSxDQUFBLG1CQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsTUFBQSxJQUFBLENBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLFVBQUEsS0FBQSxDQUFBLGNBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsVUFBQSxjQUFBLENBQUEsQ0FBQSxJQUFBLEdBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQSxFQUFBLENBQUEsU0FBQSxNQUFBLGdCQUFBLElBQUEsR0FBQSxDQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsU0FBQSxRQUFBLENBQUEsQ0FBQSxNQUFBLFFBQUEsV0FBQSxTQUFBLENBQUEsRUFBQSxDQUFBLG9CQUFBLENBQUEsQ0FBQSxJQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEscUJBQUEsQ0FBQSxDQUFBLElBQUEsbUJBQUEsQ0FBQSxDQUFBLElBQUEsUUFBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsZ0JBQUEsQ0FBQSxDQUFBLElBQUEsU0FBQSxJQUFBLFFBQUEsR0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLE9BQUEsTUFBQSxrQkFBQSxJQUFBLHlCQUFBLENBQUEsQ0FBQSxJQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLE1BQUEsV0FBQSxPQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsVUFBQSxDQUFBLE1BQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLENBQUEsUUFBQSxVQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQSxVQUFBLEtBQUEsQ0FBQSxjQUFBLFFBQUEsQ0FBQSxDQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsQ0FBQSxRQUFBLEdBQUEsYUFBQSxDQUFBLENBQUEsR0FBQSxDQUFBLHlCQUFBLE9BQUEsQ0FBQSxhQUFBLENBQUEsUUFBQSxVQUFBLENBQUEsTUFBQSxNQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsQ0FBQSxRQUFBLFVBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLE1BQUEsS0FBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxVQUFBLGtCQUFBLENBQUEsQ0FBQSxJQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLEVBQUEsYUFBQSxDQUFBLENBQUEsWUFBQSxDQUFBLFlBQUEsS0FBQSw4QkFBQSxhQUFBLFdBQUEsY0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsZ0JBQUEsUUFBQSxLQUFBLFFBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQSxHQUFBLFVBQUEsRUFBQSxDQUFBLEVBQUEsT0FBQSxFQUFBLENBQUEsb0JBQUEsTUFBQSxVQUFBLEdBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxPQUFBLENBQUE7QUFBQSxTQUFBLG1CQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsY0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxLQUFBLFdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxPQUFBLENBQUEsT0FBQSxDQUFBLENBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQSxFQUFBLENBQUE7QUFBQSxTQUFBLGtCQUFBLENBQUEsNkJBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxTQUFBLGFBQUEsT0FBQSxXQUFBLENBQUEsRUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsWUFBQSxNQUFBLENBQUEsSUFBQSxrQkFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLFVBQUEsQ0FBQSxjQUFBLE9BQUEsQ0FBQSxJQUFBLGtCQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsV0FBQSxDQUFBLEtBQUEsS0FBQTtBQUFBLFNBQUEsZUFBQSxDQUFBLEVBQUEsQ0FBQSxXQUFBLGVBQUEsQ0FBQSxDQUFBLEtBQUEscUJBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxLQUFBLDJCQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsS0FBQSxnQkFBQTtBQUFBLFNBQUEsaUJBQUEsY0FBQSxTQUFBO0FBQUEsU0FBQSw0QkFBQSxDQUFBLEVBQUEsQ0FBQSxRQUFBLENBQUEsMkJBQUEsQ0FBQSxTQUFBLGlCQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLE1BQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLEVBQUEsS0FBQSw2QkFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBLFdBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLFdBQUEsQ0FBQSxJQUFBLGFBQUEsQ0FBQSxjQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsb0JBQUEsQ0FBQSwrQ0FBQSxJQUFBLENBQUEsQ0FBQSxJQUFBLGlCQUFBLENBQUEsQ0FBQSxFQUFBLENBQUE7QUFBQSxTQUFBLGtCQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsTUFBQSxNQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsTUFBQSxZQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLFVBQUEsQ0FBQTtBQUFBLFNBQUEsc0JBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLFdBQUEsQ0FBQSxnQ0FBQSxNQUFBLElBQUEsQ0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLEtBQUEsQ0FBQSw0QkFBQSxDQUFBLFFBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsUUFBQSxDQUFBLFFBQUEsTUFBQSxDQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsQ0FBQSx1QkFBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsTUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxLQUFBLEdBQUEsQ0FBQSxDQUFBLE1BQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBLElBQUEsQ0FBQSxPQUFBLENBQUEsR0FBQSxDQUFBLHlCQUFBLENBQUEsWUFBQSxDQUFBLGVBQUEsQ0FBQSxHQUFBLENBQUEsY0FBQSxNQUFBLENBQUEsQ0FBQSxNQUFBLENBQUEsMkJBQUEsQ0FBQSxRQUFBLENBQUEsYUFBQSxDQUFBO0FBQUEsU0FBQSxnQkFBQSxDQUFBLFFBQUEsS0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLFVBQUEsQ0FBQTtBQUVBLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxZQUFNO0VBQ2xELElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsNkJBQTJCLENBQUM7RUFDdkUsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEseUJBQXVCLENBQUM7RUFDL0QsSUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7RUFDOUIsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7RUFDaEQsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUM7RUFDdEQsSUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUM7RUFDMUQsSUFBSSxLQUFLLEdBQUcsRUFBRTtFQUVkLElBQUksU0FBUyxFQUFFO0lBQ2IsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxZQUFNO01BQ3pDLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsYUFBYTtNQUNuRCxJQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDO01BQzFELFNBQVMsQ0FBQyxPQUFPLEdBQUcsS0FBSztNQUN6QixJQUFJLFdBQVcsRUFBRTtRQUNmLFdBQVcsQ0FBQyxPQUFPLENBQUUsVUFBQyxJQUFJLEVBQUs7VUFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1FBQ3BDLENBQUMsQ0FBQztRQUNGLElBQU0sZUFBZSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2xELElBQUksZUFBZSxFQUFFO1VBQ25CLGVBQWUsQ0FBQyxPQUFPLEdBQUcsSUFBSTtVQUM5QixlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BEO01BQ0Y7SUFDRixDQUFDLENBQUM7SUFDRixXQUFXLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFlBQU07TUFDM0MsSUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxhQUFhO01BQ25ELElBQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUM7TUFDMUQsSUFBSSxXQUFXLEVBQUU7UUFDZixXQUFXLENBQUMsT0FBTyxDQUFFLFVBQUMsSUFBSSxFQUFLO1VBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztRQUNqQyxDQUFDLENBQUM7TUFDSjtJQUNGLENBQUMsQ0FBQztFQUNKO0VBQ0EsSUFBSSxLQUFLLEVBQUU7SUFDVCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFVBQUMsQ0FBQyxFQUFLO01BQ3RDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtRQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRTtRQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRTtRQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztRQUN2RCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztRQUN4RCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQzVCLFNBQVMsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUM7UUFDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUM3QixTQUFTLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDO01BQ2pELENBQUMsTUFBTTtRQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQzFELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO1FBQzNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FDNUIsU0FBUyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsQ0FBQztRQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQzdCLFNBQVMsQ0FBQyxNQUFNLENBQUMsNEJBQTRCLENBQUM7TUFDcEQ7SUFDRixDQUFDLENBQUM7RUFDSjtFQUNBLElBQUksV0FBVyxLQUFLLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDaEQsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUNwQyxJQUFJLEtBQUssRUFBRTtNQUNULEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBQyxFQUFFO1FBQUEsT0FBSyxFQUFFLENBQUMsUUFBUSxLQUFLLE9BQU8sSUFDMUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO01BQUEsRUFBQztJQUN6QztJQUNBLElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSztJQUNqQyxJQUFJLFdBQVcsS0FBSyxPQUFPLEtBQUssRUFBRTtNQUNoQyxJQUFBLGlCQUFLLEVBQUMsS0FBSyxFQUNQO1FBQ0UsSUFBSSxFQUFFLHVCQUF1QjtRQUM3QixJQUFJLEVBQUU7TUFDUixDQUNKLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQVc7UUFDMUI7TUFBQSxDQUNELENBQUM7SUFDSjtJQUVBLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEVBQUUsRUFBSTtNQUMxQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFO1FBQzNCLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsWUFBTTtVQUNsQyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7VUFDOUIsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO1VBQ3JELElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDUixHQUFHLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FDakIsYUFBYSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7VUFDL0M7VUFDQSxJQUFJLEdBQUcsRUFBRTtZQUNQLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUM3QixHQUFHLENBQUMsU0FBUyxHQUFHLEVBQUU7VUFDcEI7UUFDRixDQUFDLENBQUM7TUFDSjtJQUNGLENBQUMsQ0FBQztJQUNGLElBQU0sV0FBVyxHQUFHLFNBQWQsV0FBVyxDQUFJLFdBQVcsRUFBSztNQUNuQyxJQUFNLE1BQU0sR0FBRyxJQUFBLG9CQUFRLEVBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQztNQUMxQyxJQUFJLE1BQU0sRUFBRTtRQUNWLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBQSxFQUFpQjtVQUFBLElBQUEsS0FBQSxHQUFBLGNBQUEsQ0FBQSxJQUFBO1lBQWYsRUFBRSxHQUFBLEtBQUE7WUFBRSxLQUFLLEdBQUEsS0FBQTtVQUN4QyxJQUFJLE9BQU8sR0FBRyxDQUFDO1VBQ2YsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7VUFDN0IsSUFBSSxLQUFLLFlBQVksS0FBSyxJQUFJLEtBQUssWUFBWSxhQUFhLEVBQUU7WUFDNUQsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDaEIsT0FBTyxHQUFHLENBQUM7VUFDYjtVQUNBLElBQUksS0FBSyxFQUFFO1lBQ1QsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1lBQzlCLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztZQUN4RCxJQUFJLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRTtjQUNuQixHQUFHLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FDcEIsYUFBYSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7WUFDL0M7WUFDQSxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUU7Y0FDaEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO2NBQ3hCLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUM1QjtVQUNGO1FBQ0YsQ0FBQyxDQUFDO1FBQ0YsT0FBTyxLQUFLO01BQ2QsQ0FBQyxNQUFNO1FBQ0wsT0FBTyxJQUFJO01BQ2I7SUFDRixDQUFDO0lBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFDLENBQUMsRUFBSztNQUNyQyxJQUFJLElBQUksQ0FBQyxFQUFFLEtBQUssWUFBWSxFQUFFO1FBQzVCLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNsQjtRQUNBLElBQU0sV0FBVyxHQUFHO1VBQ2xCLGdCQUFnQixFQUFFO1lBQ2hCLFFBQVEsRUFBRTtjQUNSLE9BQU87WUFFVDtVQUNGLENBQUM7VUFDRCxjQUFjLEVBQUU7WUFDZCxRQUFRLEVBQUU7Y0FDUixPQUFPO1lBQ1Q7VUFDRjtRQUNGLENBQUM7UUFDRCxJQUFJLFdBQVcsQ0FBQyxXQUFXLENBQUMsRUFBRTtVQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDZjtNQUNGO01BQ0EsSUFBSSxJQUFJLENBQUMsRUFBRSxLQUFLLGtCQUFrQixFQUFFO1FBQ2xDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNsQixJQUFNLFlBQVcsR0FBRztVQUNsQixPQUFPLEVBQUU7WUFDUCxRQUFRLEVBQUU7Y0FDUixPQUFPO1lBQ1Q7VUFDRjtRQUNGLENBQUM7UUFDRCxJQUFJLFdBQVcsQ0FBQyxZQUFXLENBQUMsRUFBRTtVQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDZjtNQUNGO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7RUFFQSxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsS0FBSyxjQUFjLEVBQUU7SUFDL0MsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsZUFBZSxDQUFDO0lBQ3BELElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLGdCQUFnQixDQUFDO0lBQ3RELElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLGNBQWMsQ0FBQztJQUNwRCxJQUFNLFNBQVMsR0FBRyxTQUFaLFNBQVMsQ0FBQSxFQUFTO01BQ3RCLElBQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxZQUFNO1FBQ2hDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSTtRQUM5QixFQUFFLElBQUk7UUFDTixJQUFJLElBQUksSUFBSSxDQUFDLEVBQUU7VUFDYixNQUFNLENBQUMsU0FBUyxHQUFHLElBQUk7VUFDdkIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSTtRQUM1QixDQUFDLE1BQU07VUFDTCxhQUFhLENBQUMsT0FBTyxDQUFDO1VBQ3RCLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxZQUFZLENBQUM7VUFDaEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLFlBQVksQ0FBQztRQUN0QztNQUNGLENBQUMsRUFBRSxJQUFJLENBQUM7SUFDVixDQUFDO0lBQ0QsU0FBUyxDQUFDLENBQUM7SUFDWCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTztNQUFBLElBQUEsS0FBQSxHQUFBLGlCQUFBLGNBQUEsbUJBQUEsR0FBQSxJQUFBLENBQUUsU0FBQSxRQUFPLENBQUM7UUFBQSxJQUFBLFFBQUEsRUFBQSxJQUFBO1FBQUEsT0FBQSxtQkFBQSxHQUFBLElBQUEsVUFBQSxTQUFBLFFBQUE7VUFBQSxrQkFBQSxRQUFBLENBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBO1lBQUE7Y0FDdkMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2NBQ2xCLE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRTtjQUNyQixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxFQUFFO2NBQ3hCLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxZQUFZLENBQUM7Y0FDbkMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFlBQVksQ0FBQztjQUFDLFFBQUEsQ0FBQSxJQUFBO2NBQUEsT0FDWCxLQUFLLENBQUMsZUFBZSxDQUFDO1lBQUE7Y0FBdkMsUUFBUSxHQUFBLFFBQUEsQ0FBQSxJQUFBO2NBQUEsS0FDVixRQUFRLENBQUMsRUFBRTtnQkFBQSxRQUFBLENBQUEsSUFBQTtnQkFBQTtjQUFBO2NBQUEsUUFBQSxDQUFBLElBQUE7Y0FBQSxPQUNNLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUFBO2NBQTVCLElBQUksR0FBQSxRQUFBLENBQUEsSUFBQTtjQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQUM7Y0FFcEIsU0FBUyxDQUFDLENBQUM7WUFBQztZQUFBO2NBQUEsT0FBQSxRQUFBLENBQUEsSUFBQTtVQUFBO1FBQUEsR0FBQSxPQUFBO01BQUEsQ0FDYjtNQUFBLGlCQUFBLEVBQUE7UUFBQSxPQUFBLEtBQUEsQ0FBQSxLQUFBLE9BQUEsU0FBQTtNQUFBO0lBQUEsSUFBQztFQUNKO0VBRUEsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFO0lBQ3JCLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBQyxDQUFDLEVBQUs7TUFDeEMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO01BQ2xCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJLEVBQUs7UUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsNEJBQTRCLENBQUM7UUFDbkQsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7UUFDM0MsT0FBTyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUM7TUFDckMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7RUFDQSxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7SUFDdEIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFFBQVEsRUFBSztNQUM5QixRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFlBQU07UUFDdkMsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7UUFDMUQsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO1VBQ3RCLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO1VBQ2xELE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQztVQUNyQyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFDdEM7TUFDRixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjtFQUVBLElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQywyQkFBMkIsQ0FBQztFQUM1RTtFQUNBLGFBQWEsQ0FBQyxPQUFPLENBQUMsVUFBUyxHQUFHLEVBQUU7SUFDbEMsSUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQztJQUN2RSxJQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLDBCQUEwQixDQUFDO0lBQ2pFLElBQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7SUFDbkQsSUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLHNCQUFzQjtJQUM1QyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFlBQVc7TUFDbEQsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxPQUFPLEVBQUU7UUFDekMsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTTtRQUNsQyxjQUFjLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7TUFDNUMsQ0FBQyxNQUFNO1FBQ0wsV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTztRQUNuQyxjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7TUFDekM7SUFDRixDQUFDLENBQUM7SUFDRjtJQUNBLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBUyxNQUFNLEVBQUU7TUFDL0IsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxZQUFXO1FBQzFDLGNBQWMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVc7UUFDL0MsU0FBUyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUs7UUFDdEMsSUFBTSxPQUFPLEdBQUcsU0FBUyxDQUNwQixhQUFhLGFBQUEsTUFBQSxDQUFZLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxRQUFJLENBQUM7UUFDdkQsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNO1FBQ2xDLGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztNQUM1QyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7SUFDRjtJQUNBLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBUyxDQUFDLEVBQUU7TUFDM0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQzNCLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU07UUFDbEMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO01BQzVDO0lBQ0YsQ0FBQyxDQUFDO0VBQ0osQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAoZ2xvYmFsID0gdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsVGhpcyA6IGdsb2JhbCB8fCBzZWxmLCBmYWN0b3J5KGdsb2JhbC5JTWFzayA9IHt9KSk7XG59KSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKiBDaGVja3MgaWYgdmFsdWUgaXMgc3RyaW5nICovXG4gIGZ1bmN0aW9uIGlzU3RyaW5nKHN0cikge1xuICAgIHJldHVybiB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyB8fCBzdHIgaW5zdGFuY2VvZiBTdHJpbmc7XG4gIH1cblxuICAvKiogQ2hlY2tzIGlmIHZhbHVlIGlzIG9iamVjdCAqL1xuICBmdW5jdGlvbiBpc09iamVjdChvYmopIHtcbiAgICB2YXIgX29iaiRjb25zdHJ1Y3RvcjtcbiAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgb2JqICE9IG51bGwgJiYgKG9iaiA9PSBudWxsIHx8IChfb2JqJGNvbnN0cnVjdG9yID0gb2JqLmNvbnN0cnVjdG9yKSA9PSBudWxsID8gdm9pZCAwIDogX29iaiRjb25zdHJ1Y3Rvci5uYW1lKSA9PT0gJ09iamVjdCc7XG4gIH1cbiAgZnVuY3Rpb24gcGljayhvYmosIGtleXMpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkgcmV0dXJuIHBpY2sob2JqLCAoXywgaykgPT4ga2V5cy5pbmNsdWRlcyhrKSk7XG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKG9iaikucmVkdWNlKChhY2MsIF9yZWYpID0+IHtcbiAgICAgIGxldCBbaywgdl0gPSBfcmVmO1xuICAgICAgaWYgKGtleXModiwgaykpIGFjY1trXSA9IHY7XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9KTtcbiAgfVxuXG4gIC8qKiBEaXJlY3Rpb24gKi9cbiAgY29uc3QgRElSRUNUSU9OID0ge1xuICAgIE5PTkU6ICdOT05FJyxcbiAgICBMRUZUOiAnTEVGVCcsXG4gICAgRk9SQ0VfTEVGVDogJ0ZPUkNFX0xFRlQnLFxuICAgIFJJR0hUOiAnUklHSFQnLFxuICAgIEZPUkNFX1JJR0hUOiAnRk9SQ0VfUklHSFQnXG4gIH07XG5cbiAgLyoqIERpcmVjdGlvbiAqL1xuXG4gIGZ1bmN0aW9uIGZvcmNlRGlyZWN0aW9uKGRpcmVjdGlvbikge1xuICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICBjYXNlIERJUkVDVElPTi5MRUZUOlxuICAgICAgICByZXR1cm4gRElSRUNUSU9OLkZPUkNFX0xFRlQ7XG4gICAgICBjYXNlIERJUkVDVElPTi5SSUdIVDpcbiAgICAgICAgcmV0dXJuIERJUkVDVElPTi5GT1JDRV9SSUdIVDtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBkaXJlY3Rpb247XG4gICAgfVxuICB9XG5cbiAgLyoqIEVzY2FwZXMgcmVndWxhciBleHByZXNzaW9uIGNvbnRyb2wgY2hhcnMgKi9cbiAgZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFsuKis/Xj0hOiR7fSgpfFtcXF0vXFxcXF0pL2csICdcXFxcJDEnKTtcbiAgfVxuXG4gIC8vIGNsb25lZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9lcG9iZXJlemtpbi9mYXN0LWRlZXAtZXF1YWwgd2l0aCBzbWFsbCBjaGFuZ2VzXG4gIGZ1bmN0aW9uIG9iamVjdEluY2x1ZGVzKGIsIGEpIHtcbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgYXJyQSA9IEFycmF5LmlzQXJyYXkoYSksXG4gICAgICBhcnJCID0gQXJyYXkuaXNBcnJheShiKTtcbiAgICBsZXQgaTtcbiAgICBpZiAoYXJyQSAmJiBhcnJCKSB7XG4gICAgICBpZiAoYS5sZW5ndGggIT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSBpZiAoIW9iamVjdEluY2x1ZGVzKGFbaV0sIGJbaV0pKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGFyckEgIT0gYXJyQikgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhICYmIGIgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnICYmIHR5cGVvZiBiID09PSAnb2JqZWN0Jykge1xuICAgICAgY29uc3QgZGF0ZUEgPSBhIGluc3RhbmNlb2YgRGF0ZSxcbiAgICAgICAgZGF0ZUIgPSBiIGluc3RhbmNlb2YgRGF0ZTtcbiAgICAgIGlmIChkYXRlQSAmJiBkYXRlQikgcmV0dXJuIGEuZ2V0VGltZSgpID09IGIuZ2V0VGltZSgpO1xuICAgICAgaWYgKGRhdGVBICE9IGRhdGVCKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCByZWdleHBBID0gYSBpbnN0YW5jZW9mIFJlZ0V4cCxcbiAgICAgICAgcmVnZXhwQiA9IGIgaW5zdGFuY2VvZiBSZWdFeHA7XG4gICAgICBpZiAocmVnZXhwQSAmJiByZWdleHBCKSByZXR1cm4gYS50b1N0cmluZygpID09IGIudG9TdHJpbmcoKTtcbiAgICAgIGlmIChyZWdleHBBICE9IHJlZ2V4cEIpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhhKTtcbiAgICAgIC8vIGlmIChrZXlzLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoYikubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBrZXlzW2ldKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIGlmICghb2JqZWN0SW5jbHVkZXMoYltrZXlzW2ldXSwgYVtrZXlzW2ldXSkpIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoYSAmJiBiICYmIHR5cGVvZiBhID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBiID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKiBTZWxlY3Rpb24gcmFuZ2UgKi9cblxuICAvKiogUHJvdmlkZXMgZGV0YWlscyBvZiBjaGFuZ2luZyBpbnB1dCAqL1xuICBjbGFzcyBBY3Rpb25EZXRhaWxzIHtcbiAgICAvKiogQ3VycmVudCBpbnB1dCB2YWx1ZSAqL1xuXG4gICAgLyoqIEN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uICovXG5cbiAgICAvKiogT2xkIGlucHV0IHZhbHVlICovXG5cbiAgICAvKiogT2xkIHNlbGVjdGlvbiAqL1xuXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBvcHRzKTtcblxuICAgICAgLy8gZG91YmxlIGNoZWNrIGlmIGxlZnQgcGFydCB3YXMgY2hhbmdlZCAoYXV0b2ZpbGxpbmcsIG90aGVyIG5vbi1zdGFuZGFyZCBpbnB1dCB0cmlnZ2VycylcbiAgICAgIHdoaWxlICh0aGlzLnZhbHVlLnNsaWNlKDAsIHRoaXMuc3RhcnRDaGFuZ2VQb3MpICE9PSB0aGlzLm9sZFZhbHVlLnNsaWNlKDAsIHRoaXMuc3RhcnRDaGFuZ2VQb3MpKSB7XG4gICAgICAgIC0tdGhpcy5vbGRTZWxlY3Rpb24uc3RhcnQ7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pbnNlcnRlZENvdW50KSB7XG4gICAgICAgIC8vIGRvdWJsZSBjaGVjayByaWdodCBwYXJ0XG4gICAgICAgIHdoaWxlICh0aGlzLnZhbHVlLnNsaWNlKHRoaXMuY3Vyc29yUG9zKSAhPT0gdGhpcy5vbGRWYWx1ZS5zbGljZSh0aGlzLm9sZFNlbGVjdGlvbi5lbmQpKSB7XG4gICAgICAgICAgaWYgKHRoaXMudmFsdWUubGVuZ3RoIC0gdGhpcy5jdXJzb3JQb3MgPCB0aGlzLm9sZFZhbHVlLmxlbmd0aCAtIHRoaXMub2xkU2VsZWN0aW9uLmVuZCkgKyt0aGlzLm9sZFNlbGVjdGlvbi5lbmQ7ZWxzZSArK3RoaXMuY3Vyc29yUG9zO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFN0YXJ0IGNoYW5naW5nIHBvc2l0aW9uICovXG4gICAgZ2V0IHN0YXJ0Q2hhbmdlUG9zKCkge1xuICAgICAgcmV0dXJuIE1hdGgubWluKHRoaXMuY3Vyc29yUG9zLCB0aGlzLm9sZFNlbGVjdGlvbi5zdGFydCk7XG4gICAgfVxuXG4gICAgLyoqIEluc2VydGVkIHN5bWJvbHMgY291bnQgKi9cbiAgICBnZXQgaW5zZXJ0ZWRDb3VudCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnNvclBvcyAtIHRoaXMuc3RhcnRDaGFuZ2VQb3M7XG4gICAgfVxuXG4gICAgLyoqIEluc2VydGVkIHN5bWJvbHMgKi9cbiAgICBnZXQgaW5zZXJ0ZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZS5zdWJzdHIodGhpcy5zdGFydENoYW5nZVBvcywgdGhpcy5pbnNlcnRlZENvdW50KTtcbiAgICB9XG5cbiAgICAvKiogUmVtb3ZlZCBzeW1ib2xzIGNvdW50ICovXG4gICAgZ2V0IHJlbW92ZWRDb3VudCgpIHtcbiAgICAgIC8vIE1hdGgubWF4IGZvciBvcHBvc2l0ZSBvcGVyYXRpb25cbiAgICAgIHJldHVybiBNYXRoLm1heCh0aGlzLm9sZFNlbGVjdGlvbi5lbmQgLSB0aGlzLnN0YXJ0Q2hhbmdlUG9zIHx8XG4gICAgICAvLyBmb3IgRGVsZXRlXG4gICAgICB0aGlzLm9sZFZhbHVlLmxlbmd0aCAtIHRoaXMudmFsdWUubGVuZ3RoLCAwKTtcbiAgICB9XG5cbiAgICAvKiogUmVtb3ZlZCBzeW1ib2xzICovXG4gICAgZ2V0IHJlbW92ZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5vbGRWYWx1ZS5zdWJzdHIodGhpcy5zdGFydENoYW5nZVBvcywgdGhpcy5yZW1vdmVkQ291bnQpO1xuICAgIH1cblxuICAgIC8qKiBVbmNoYW5nZWQgaGVhZCBzeW1ib2xzICovXG4gICAgZ2V0IGhlYWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZS5zdWJzdHJpbmcoMCwgdGhpcy5zdGFydENoYW5nZVBvcyk7XG4gICAgfVxuXG4gICAgLyoqIFVuY2hhbmdlZCB0YWlsIHN5bWJvbHMgKi9cbiAgICBnZXQgdGFpbCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlLnN1YnN0cmluZyh0aGlzLnN0YXJ0Q2hhbmdlUG9zICsgdGhpcy5pbnNlcnRlZENvdW50KTtcbiAgICB9XG5cbiAgICAvKiogUmVtb3ZlIGRpcmVjdGlvbiAqL1xuICAgIGdldCByZW1vdmVEaXJlY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMucmVtb3ZlZENvdW50IHx8IHRoaXMuaW5zZXJ0ZWRDb3VudCkgcmV0dXJuIERJUkVDVElPTi5OT05FO1xuXG4gICAgICAvLyBhbGlnbiByaWdodCBpZiBkZWxldGUgYXQgcmlnaHRcbiAgICAgIHJldHVybiAodGhpcy5vbGRTZWxlY3Rpb24uZW5kID09PSB0aGlzLmN1cnNvclBvcyB8fCB0aGlzLm9sZFNlbGVjdGlvbi5zdGFydCA9PT0gdGhpcy5jdXJzb3JQb3MpICYmXG4gICAgICAvLyBpZiBub3QgcmFuZ2UgcmVtb3ZlZCAoZXZlbnQgd2l0aCBiYWNrc3BhY2UpXG4gICAgICB0aGlzLm9sZFNlbGVjdGlvbi5lbmQgPT09IHRoaXMub2xkU2VsZWN0aW9uLnN0YXJ0ID8gRElSRUNUSU9OLlJJR0hUIDogRElSRUNUSU9OLkxFRlQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIEFwcGxpZXMgbWFzayBvbiBlbGVtZW50ICovXG4gIGZ1bmN0aW9uIElNYXNrKGVsLCBvcHRzKSB7XG4gICAgLy8gY3VycmVudGx5IGF2YWlsYWJsZSBvbmx5IGZvciBpbnB1dC1saWtlIGVsZW1lbnRzXG4gICAgcmV0dXJuIG5ldyBJTWFzay5JbnB1dE1hc2soZWwsIG9wdHMpO1xuICB9XG5cbiAgLy8gVE9ETyBjYW4ndCB1c2Ugb3ZlcmxvYWRzIGhlcmUgYmVjYXVzZSBvZiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzUwNzU0XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBzdHJpbmcpOiB0eXBlb2YgTWFza2VkUGF0dGVybjtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IERhdGVDb25zdHJ1Y3Rvcik6IHR5cGVvZiBNYXNrZWREYXRlO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogTnVtYmVyQ29uc3RydWN0b3IpOiB0eXBlb2YgTWFza2VkTnVtYmVyO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3MobWFzazogQXJyYXk8YW55PiB8IEFycmF5Q29uc3RydWN0b3IpOiB0eXBlb2YgTWFza2VkRHluYW1pYztcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZERhdGUpOiB0eXBlb2YgTWFza2VkRGF0ZTtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZE51bWJlcik6IHR5cGVvZiBNYXNrZWROdW1iZXI7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWRFbnVtKTogdHlwZW9mIE1hc2tlZEVudW07XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWRSYW5nZSk6IHR5cGVvZiBNYXNrZWRSYW5nZTtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZFJlZ0V4cCk6IHR5cGVvZiBNYXNrZWRSZWdFeHA7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiBNYXNrZWRGdW5jdGlvbik6IHR5cGVvZiBNYXNrZWRGdW5jdGlvbjtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZFBhdHRlcm4pOiB0eXBlb2YgTWFza2VkUGF0dGVybjtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZER5bmFtaWMpOiB0eXBlb2YgTWFza2VkRHluYW1pYztcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IE1hc2tlZCk6IHR5cGVvZiBNYXNrZWQ7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkKTogdHlwZW9mIE1hc2tlZDtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWREYXRlKTogdHlwZW9mIE1hc2tlZERhdGU7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkTnVtYmVyKTogdHlwZW9mIE1hc2tlZE51bWJlcjtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWRFbnVtKTogdHlwZW9mIE1hc2tlZEVudW07XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkUmFuZ2UpOiB0eXBlb2YgTWFza2VkUmFuZ2U7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkUmVnRXhwKTogdHlwZW9mIE1hc2tlZFJlZ0V4cDtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWRGdW5jdGlvbik6IHR5cGVvZiBNYXNrZWRGdW5jdGlvbjtcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IHR5cGVvZiBNYXNrZWRQYXR0ZXJuKTogdHlwZW9mIE1hc2tlZFBhdHRlcm47XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiB0eXBlb2YgTWFza2VkRHluYW1pYyk6IHR5cGVvZiBNYXNrZWREeW5hbWljO1xuICAvLyBleHBvcnQgZnVuY3Rpb24gbWFza2VkQ2xhc3M8TWFzayBleHRlbmRzIHR5cGVvZiBNYXNrZWQ+IChtYXNrOiBNYXNrKTogTWFzaztcbiAgLy8gZXhwb3J0IGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2s6IFJlZ0V4cCk6IHR5cGVvZiBNYXNrZWRSZWdFeHA7XG4gIC8vIGV4cG9ydCBmdW5jdGlvbiBtYXNrZWRDbGFzcyhtYXNrOiAodmFsdWU6IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IGJvb2xlYW4pOiB0eXBlb2YgTWFza2VkRnVuY3Rpb247XG5cbiAgLyoqIEdldCBNYXNrZWQgY2xhc3MgYnkgbWFzayB0eXBlICovXG4gIGZ1bmN0aW9uIG1hc2tlZENsYXNzKG1hc2spIC8qIFRPRE8gKi97XG4gICAgaWYgKG1hc2sgPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCdtYXNrIHByb3BlcnR5IHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgaWYgKG1hc2sgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiBJTWFzay5NYXNrZWRSZWdFeHA7XG4gICAgaWYgKGlzU3RyaW5nKG1hc2spKSByZXR1cm4gSU1hc2suTWFza2VkUGF0dGVybjtcbiAgICBpZiAobWFzayA9PT0gRGF0ZSkgcmV0dXJuIElNYXNrLk1hc2tlZERhdGU7XG4gICAgaWYgKG1hc2sgPT09IE51bWJlcikgcmV0dXJuIElNYXNrLk1hc2tlZE51bWJlcjtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShtYXNrKSB8fCBtYXNrID09PSBBcnJheSkgcmV0dXJuIElNYXNrLk1hc2tlZER5bmFtaWM7XG4gICAgaWYgKElNYXNrLk1hc2tlZCAmJiBtYXNrLnByb3RvdHlwZSBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZCkgcmV0dXJuIG1hc2s7XG4gICAgaWYgKElNYXNrLk1hc2tlZCAmJiBtYXNrIGluc3RhbmNlb2YgSU1hc2suTWFza2VkKSByZXR1cm4gbWFzay5jb25zdHJ1Y3RvcjtcbiAgICBpZiAobWFzayBpbnN0YW5jZW9mIEZ1bmN0aW9uKSByZXR1cm4gSU1hc2suTWFza2VkRnVuY3Rpb247XG4gICAgY29uc29sZS53YXJuKCdNYXNrIG5vdCBmb3VuZCBmb3IgbWFzaycsIG1hc2spOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcbiAgICByZXR1cm4gSU1hc2suTWFza2VkO1xuICB9XG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU9wdHMob3B0cykge1xuICAgIGlmICghb3B0cykgdGhyb3cgbmV3IEVycm9yKCdPcHRpb25zIGluIG5vdCBkZWZpbmVkJyk7XG4gICAgaWYgKElNYXNrLk1hc2tlZCkge1xuICAgICAgaWYgKG9wdHMucHJvdG90eXBlIGluc3RhbmNlb2YgSU1hc2suTWFza2VkKSByZXR1cm4ge1xuICAgICAgICBtYXNrOiBvcHRzXG4gICAgICB9O1xuXG4gICAgICAvKlxuICAgICAgICBoYW5kbGUgY2FzZXMgbGlrZTpcbiAgICAgICAgMSkgb3B0cyA9IE1hc2tlZFxuICAgICAgICAyKSBvcHRzID0geyBtYXNrOiBNYXNrZWQsIC4uLmluc3RhbmNlT3B0cyB9XG4gICAgICAqL1xuICAgICAgY29uc3Qge1xuICAgICAgICBtYXNrID0gdW5kZWZpbmVkLFxuICAgICAgICAuLi5pbnN0YW5jZU9wdHNcbiAgICAgIH0gPSBvcHRzIGluc3RhbmNlb2YgSU1hc2suTWFza2VkID8ge1xuICAgICAgICBtYXNrOiBvcHRzXG4gICAgICB9IDogaXNPYmplY3Qob3B0cykgJiYgb3B0cy5tYXNrIGluc3RhbmNlb2YgSU1hc2suTWFza2VkID8gb3B0cyA6IHt9O1xuICAgICAgaWYgKG1hc2spIHtcbiAgICAgICAgY29uc3QgX21hc2sgPSBtYXNrLm1hc2s7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucGljayhtYXNrLCAoXywgaykgPT4gIWsuc3RhcnRzV2l0aCgnXycpKSxcbiAgICAgICAgICBtYXNrOiBtYXNrLmNvbnN0cnVjdG9yLFxuICAgICAgICAgIF9tYXNrLFxuICAgICAgICAgIC4uLmluc3RhbmNlT3B0c1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWlzT2JqZWN0KG9wdHMpKSByZXR1cm4ge1xuICAgICAgbWFzazogb3B0c1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLm9wdHNcbiAgICB9O1xuICB9XG5cbiAgLy8gVE9ETyBjYW4ndCB1c2Ugb3ZlcmxvYWRzIGhlcmUgYmVjYXVzZSBvZiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzUwNzU0XG5cbiAgLy8gRnJvbSBtYXNrZWRcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkLCBSZXR1cm5NYXNrZWQ9T3B0cz4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIC8vIEZyb20gbWFza2VkIGNsYXNzXG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZD4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZD1JbnN0YW5jZVR5cGU8T3B0c1snbWFzayddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZERhdGU+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWREYXRlPU1hc2tlZERhdGU8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkTnVtYmVyPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkTnVtYmVyPU1hc2tlZE51bWJlcjxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWRFbnVtPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkRW51bT1NYXNrZWRFbnVtPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZFJhbmdlPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkUmFuZ2U9TWFza2VkUmFuZ2U8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkUmVnRXhwPiwgUmV0dXJuTWFza2VkIGV4dGVuZHMgTWFza2VkUmVnRXhwPU1hc2tlZFJlZ0V4cDxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPHR5cGVvZiBNYXNrZWRGdW5jdGlvbj4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZEZ1bmN0aW9uPU1hc2tlZEZ1bmN0aW9uPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE9wdGlvbnM8dHlwZW9mIE1hc2tlZFBhdHRlcm4+LCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRQYXR0ZXJuPU1hc2tlZFBhdHRlcm48T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczx0eXBlb2YgTWFza2VkRHluYW1pYz4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZER5bmFtaWM9TWFza2VkRHluYW1pYzxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyAvLyBGcm9tIG1hc2sgb3B0c1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPE1hc2tlZD4sIFJldHVybk1hc2tlZD1PcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczxpbmZlciBNPiA/IE0gOiBuZXZlcj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZE51bWJlck9wdGlvbnMsIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZE51bWJlcj1NYXNrZWROdW1iZXI8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkRGF0ZUZhY3RvcnlPcHRpb25zLCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWREYXRlPU1hc2tlZERhdGU8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkRW51bU9wdGlvbnMsIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZEVudW09TWFza2VkRW51bTxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRSYW5nZU9wdGlvbnMsIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZFJhbmdlPU1hc2tlZFJhbmdlPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG4gIC8vIGV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZU1hc2s8T3B0cyBleHRlbmRzIE1hc2tlZFBhdHRlcm5PcHRpb25zLCBSZXR1cm5NYXNrZWQgZXh0ZW5kcyBNYXNrZWRQYXR0ZXJuPU1hc2tlZFBhdHRlcm48T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkRHluYW1pY09wdGlvbnMsIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZER5bmFtaWM9TWFza2VkRHluYW1pYzxPcHRzWydwYXJlbnQnXT4+IChvcHRzOiBPcHRzKTogUmV0dXJuTWFza2VkO1xuICAvLyBleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVNYXNrPE9wdHMgZXh0ZW5kcyBNYXNrZWRPcHRpb25zPFJlZ0V4cD4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZFJlZ0V4cD1NYXNrZWRSZWdFeHA8T3B0c1sncGFyZW50J10+PiAob3B0czogT3B0cyk6IFJldHVybk1hc2tlZDtcbiAgLy8gZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlTWFzazxPcHRzIGV4dGVuZHMgTWFza2VkT3B0aW9uczxGdW5jdGlvbj4sIFJldHVybk1hc2tlZCBleHRlbmRzIE1hc2tlZEZ1bmN0aW9uPU1hc2tlZEZ1bmN0aW9uPE9wdHNbJ3BhcmVudCddPj4gKG9wdHM6IE9wdHMpOiBSZXR1cm5NYXNrZWQ7XG5cbiAgLyoqIENyZWF0ZXMgbmV3IHtAbGluayBNYXNrZWR9IGRlcGVuZGluZyBvbiBtYXNrIHR5cGUgKi9cbiAgZnVuY3Rpb24gY3JlYXRlTWFzayhvcHRzKSB7XG4gICAgaWYgKElNYXNrLk1hc2tlZCAmJiBvcHRzIGluc3RhbmNlb2YgSU1hc2suTWFza2VkKSByZXR1cm4gb3B0cztcbiAgICBjb25zdCBuT3B0cyA9IG5vcm1hbGl6ZU9wdHMob3B0cyk7XG4gICAgY29uc3QgTWFza2VkQ2xhc3MgPSBtYXNrZWRDbGFzcyhuT3B0cy5tYXNrKTtcbiAgICBpZiAoIU1hc2tlZENsYXNzKSB0aHJvdyBuZXcgRXJyb3IoXCJNYXNrZWQgY2xhc3MgaXMgbm90IGZvdW5kIGZvciBwcm92aWRlZCBtYXNrIFwiICsgbk9wdHMubWFzayArIFwiLCBhcHByb3ByaWF0ZSBtb2R1bGUgbmVlZHMgdG8gYmUgaW1wb3J0ZWQgbWFudWFsbHkgYmVmb3JlIGNyZWF0aW5nIG1hc2suXCIpO1xuICAgIGlmIChuT3B0cy5tYXNrID09PSBNYXNrZWRDbGFzcykgZGVsZXRlIG5PcHRzLm1hc2s7XG4gICAgaWYgKG5PcHRzLl9tYXNrKSB7XG4gICAgICBuT3B0cy5tYXNrID0gbk9wdHMuX21hc2s7XG4gICAgICBkZWxldGUgbk9wdHMuX21hc2s7XG4gICAgfVxuICAgIHJldHVybiBuZXcgTWFza2VkQ2xhc3Mobk9wdHMpO1xuICB9XG4gIElNYXNrLmNyZWF0ZU1hc2sgPSBjcmVhdGVNYXNrO1xuXG4gIC8qKiAgR2VuZXJpYyBlbGVtZW50IEFQSSB0byB1c2Ugd2l0aCBtYXNrICovXG4gIGNsYXNzIE1hc2tFbGVtZW50IHtcbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogU2FmZWx5IHJldHVybnMgc2VsZWN0aW9uIHN0YXJ0ICovXG4gICAgZ2V0IHNlbGVjdGlvblN0YXJ0KCkge1xuICAgICAgbGV0IHN0YXJ0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgc3RhcnQgPSB0aGlzLl91bnNhZmVTZWxlY3Rpb25TdGFydDtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIHJldHVybiBzdGFydCAhPSBudWxsID8gc3RhcnQgOiB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKiogU2FmZWx5IHJldHVybnMgc2VsZWN0aW9uIGVuZCAqL1xuICAgIGdldCBzZWxlY3Rpb25FbmQoKSB7XG4gICAgICBsZXQgZW5kO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZW5kID0gdGhpcy5fdW5zYWZlU2VsZWN0aW9uRW5kO1xuICAgICAgfSBjYXRjaCB7fVxuICAgICAgcmV0dXJuIGVuZCAhPSBudWxsID8gZW5kIDogdGhpcy52YWx1ZS5sZW5ndGg7XG4gICAgfVxuXG4gICAgLyoqIFNhZmVseSBzZXRzIGVsZW1lbnQgc2VsZWN0aW9uICovXG4gICAgc2VsZWN0KHN0YXJ0LCBlbmQpIHtcbiAgICAgIGlmIChzdGFydCA9PSBudWxsIHx8IGVuZCA9PSBudWxsIHx8IHN0YXJ0ID09PSB0aGlzLnNlbGVjdGlvblN0YXJ0ICYmIGVuZCA9PT0gdGhpcy5zZWxlY3Rpb25FbmQpIHJldHVybjtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuX3Vuc2FmZVNlbGVjdChzdGFydCwgZW5kKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG5cbiAgICAvKiogKi9cbiAgICBnZXQgaXNBY3RpdmUoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cbiAgfVxuICBJTWFzay5NYXNrRWxlbWVudCA9IE1hc2tFbGVtZW50O1xuXG4gIGNvbnN0IEtFWV9aID0gOTA7XG4gIGNvbnN0IEtFWV9ZID0gODk7XG5cbiAgLyoqIEJyaWRnZSBiZXR3ZWVuIEhUTUxFbGVtZW50IGFuZCB7QGxpbmsgTWFza2VkfSAqL1xuICBjbGFzcyBIVE1MTWFza0VsZW1lbnQgZXh0ZW5kcyBNYXNrRWxlbWVudCB7XG4gICAgLyoqIEhUTUxFbGVtZW50IHRvIHVzZSBtYXNrIG9uICovXG5cbiAgICBjb25zdHJ1Y3RvcihpbnB1dCkge1xuICAgICAgc3VwZXIoKTtcbiAgICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICAgIHRoaXMuX29uS2V5ZG93biA9IHRoaXMuX29uS2V5ZG93bi5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25JbnB1dCA9IHRoaXMuX29uSW5wdXQuYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uQmVmb3JlaW5wdXQgPSB0aGlzLl9vbkJlZm9yZWlucHV0LmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vbkNvbXBvc2l0aW9uRW5kID0gdGhpcy5fb25Db21wb3NpdGlvbkVuZC5iaW5kKHRoaXMpO1xuICAgIH1cbiAgICBnZXQgcm9vdEVsZW1lbnQoKSB7XG4gICAgICB2YXIgX3RoaXMkaW5wdXQkZ2V0Um9vdE5vLCBfdGhpcyRpbnB1dCRnZXRSb290Tm8yLCBfdGhpcyRpbnB1dDtcbiAgICAgIHJldHVybiAoX3RoaXMkaW5wdXQkZ2V0Um9vdE5vID0gKF90aGlzJGlucHV0JGdldFJvb3RObzIgPSAoX3RoaXMkaW5wdXQgPSB0aGlzLmlucHV0KS5nZXRSb290Tm9kZSkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJGlucHV0JGdldFJvb3RObzIuY2FsbChfdGhpcyRpbnB1dCkpICE9IG51bGwgPyBfdGhpcyRpbnB1dCRnZXRSb290Tm8gOiBkb2N1bWVudDtcbiAgICB9XG5cbiAgICAvKiogSXMgZWxlbWVudCBpbiBmb2N1cyAqL1xuICAgIGdldCBpc0FjdGl2ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlucHV0ID09PSB0aGlzLnJvb3RFbGVtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqIEJpbmRzIEhUTUxFbGVtZW50IGV2ZW50cyB0byBtYXNrIGludGVybmFsIGV2ZW50cyAqL1xuICAgIGJpbmRFdmVudHMoaGFuZGxlcnMpIHtcbiAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5ZG93bik7XG4gICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgdGhpcy5fb25JbnB1dCk7XG4gICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2JlZm9yZWlucHV0JywgdGhpcy5fb25CZWZvcmVpbnB1dCk7XG4gICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbXBvc2l0aW9uZW5kJywgdGhpcy5fb25Db21wb3NpdGlvbkVuZCk7XG4gICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCBoYW5kbGVycy5kcm9wKTtcbiAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVycy5jbGljayk7XG4gICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgaGFuZGxlcnMuZm9jdXMpO1xuICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlcnMuY29tbWl0KTtcbiAgICAgIHRoaXMuX2hhbmRsZXJzID0gaGFuZGxlcnM7XG4gICAgfVxuICAgIF9vbktleWRvd24oZSkge1xuICAgICAgaWYgKHRoaXMuX2hhbmRsZXJzLnJlZG8gJiYgKGUua2V5Q29kZSA9PT0gS0VZX1ogJiYgZS5zaGlmdEtleSAmJiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSkgfHwgZS5rZXlDb2RlID09PSBLRVlfWSAmJiBlLmN0cmxLZXkpKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZXJzLnJlZG8oZSk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5faGFuZGxlcnMudW5kbyAmJiBlLmtleUNvZGUgPT09IEtFWV9aICYmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5KSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVycy51bmRvKGUpO1xuICAgICAgfVxuICAgICAgaWYgKCFlLmlzQ29tcG9zaW5nKSB0aGlzLl9oYW5kbGVycy5zZWxlY3Rpb25DaGFuZ2UoZSk7XG4gICAgfVxuICAgIF9vbkJlZm9yZWlucHV0KGUpIHtcbiAgICAgIGlmIChlLmlucHV0VHlwZSA9PT0gJ2hpc3RvcnlVbmRvJyAmJiB0aGlzLl9oYW5kbGVycy51bmRvKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZXJzLnVuZG8oZSk7XG4gICAgICB9XG4gICAgICBpZiAoZS5pbnB1dFR5cGUgPT09ICdoaXN0b3J5UmVkbycgJiYgdGhpcy5faGFuZGxlcnMucmVkbykge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVycy5yZWRvKGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBfb25Db21wb3NpdGlvbkVuZChlKSB7XG4gICAgICB0aGlzLl9oYW5kbGVycy5pbnB1dChlKTtcbiAgICB9XG4gICAgX29uSW5wdXQoZSkge1xuICAgICAgaWYgKCFlLmlzQ29tcG9zaW5nKSB0aGlzLl9oYW5kbGVycy5pbnB1dChlKTtcbiAgICB9XG5cbiAgICAvKiogVW5iaW5kcyBIVE1MRWxlbWVudCBldmVudHMgdG8gbWFzayBpbnRlcm5hbCBldmVudHMgKi9cbiAgICB1bmJpbmRFdmVudHMoKSB7XG4gICAgICB0aGlzLmlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleWRvd24pO1xuICAgICAgdGhpcy5pbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdpbnB1dCcsIHRoaXMuX29uSW5wdXQpO1xuICAgICAgdGhpcy5pbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdiZWZvcmVpbnB1dCcsIHRoaXMuX29uQmVmb3JlaW5wdXQpO1xuICAgICAgdGhpcy5pbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdjb21wb3NpdGlvbmVuZCcsIHRoaXMuX29uQ29tcG9zaXRpb25FbmQpO1xuICAgICAgdGhpcy5pbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5faGFuZGxlcnMuZHJvcCk7XG4gICAgICB0aGlzLmlucHV0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5faGFuZGxlcnMuY2xpY2spO1xuICAgICAgdGhpcy5pbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKCdmb2N1cycsIHRoaXMuX2hhbmRsZXJzLmZvY3VzKTtcbiAgICAgIHRoaXMuaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignYmx1cicsIHRoaXMuX2hhbmRsZXJzLmNvbW1pdCk7XG4gICAgICB0aGlzLl9oYW5kbGVycyA9IHt9O1xuICAgIH1cbiAgfVxuICBJTWFzay5IVE1MTWFza0VsZW1lbnQgPSBIVE1MTWFza0VsZW1lbnQ7XG5cbiAgLyoqIEJyaWRnZSBiZXR3ZWVuIElucHV0RWxlbWVudCBhbmQge0BsaW5rIE1hc2tlZH0gKi9cbiAgY2xhc3MgSFRNTElucHV0TWFza0VsZW1lbnQgZXh0ZW5kcyBIVE1MTWFza0VsZW1lbnQge1xuICAgIC8qKiBJbnB1dEVsZW1lbnQgdG8gdXNlIG1hc2sgb24gKi9cblxuICAgIGNvbnN0cnVjdG9yKGlucHV0KSB7XG4gICAgICBzdXBlcihpbnB1dCk7XG4gICAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gICAgfVxuXG4gICAgLyoqIFJldHVybnMgSW5wdXRFbGVtZW50IHNlbGVjdGlvbiBzdGFydCAqL1xuICAgIGdldCBfdW5zYWZlU2VsZWN0aW9uU3RhcnQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnB1dC5zZWxlY3Rpb25TdGFydCAhPSBudWxsID8gdGhpcy5pbnB1dC5zZWxlY3Rpb25TdGFydCA6IHRoaXMudmFsdWUubGVuZ3RoO1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIElucHV0RWxlbWVudCBzZWxlY3Rpb24gZW5kICovXG4gICAgZ2V0IF91bnNhZmVTZWxlY3Rpb25FbmQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnB1dC5zZWxlY3Rpb25FbmQ7XG4gICAgfVxuXG4gICAgLyoqIFNldHMgSW5wdXRFbGVtZW50IHNlbGVjdGlvbiAqL1xuICAgIF91bnNhZmVTZWxlY3Qoc3RhcnQsIGVuZCkge1xuICAgICAgdGhpcy5pbnB1dC5zZXRTZWxlY3Rpb25SYW5nZShzdGFydCwgZW5kKTtcbiAgICB9XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5wdXQudmFsdWU7XG4gICAgfVxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgdGhpcy5pbnB1dC52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICBJTWFzay5IVE1MTWFza0VsZW1lbnQgPSBIVE1MTWFza0VsZW1lbnQ7XG5cbiAgY2xhc3MgSFRNTENvbnRlbnRlZGl0YWJsZU1hc2tFbGVtZW50IGV4dGVuZHMgSFRNTE1hc2tFbGVtZW50IHtcbiAgICAvKiogUmV0dXJucyBIVE1MRWxlbWVudCBzZWxlY3Rpb24gc3RhcnQgKi9cbiAgICBnZXQgX3Vuc2FmZVNlbGVjdGlvblN0YXJ0KCkge1xuICAgICAgY29uc3Qgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgICBjb25zdCBzZWxlY3Rpb24gPSByb290LmdldFNlbGVjdGlvbiAmJiByb290LmdldFNlbGVjdGlvbigpO1xuICAgICAgY29uc3QgYW5jaG9yT2Zmc2V0ID0gc2VsZWN0aW9uICYmIHNlbGVjdGlvbi5hbmNob3JPZmZzZXQ7XG4gICAgICBjb25zdCBmb2N1c09mZnNldCA9IHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24uZm9jdXNPZmZzZXQ7XG4gICAgICBpZiAoZm9jdXNPZmZzZXQgPT0gbnVsbCB8fCBhbmNob3JPZmZzZXQgPT0gbnVsbCB8fCBhbmNob3JPZmZzZXQgPCBmb2N1c09mZnNldCkge1xuICAgICAgICByZXR1cm4gYW5jaG9yT2Zmc2V0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZvY3VzT2Zmc2V0O1xuICAgIH1cblxuICAgIC8qKiBSZXR1cm5zIEhUTUxFbGVtZW50IHNlbGVjdGlvbiBlbmQgKi9cbiAgICBnZXQgX3Vuc2FmZVNlbGVjdGlvbkVuZCgpIHtcbiAgICAgIGNvbnN0IHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcm9vdC5nZXRTZWxlY3Rpb24gJiYgcm9vdC5nZXRTZWxlY3Rpb24oKTtcbiAgICAgIGNvbnN0IGFuY2hvck9mZnNldCA9IHNlbGVjdGlvbiAmJiBzZWxlY3Rpb24uYW5jaG9yT2Zmc2V0O1xuICAgICAgY29uc3QgZm9jdXNPZmZzZXQgPSBzZWxlY3Rpb24gJiYgc2VsZWN0aW9uLmZvY3VzT2Zmc2V0O1xuICAgICAgaWYgKGZvY3VzT2Zmc2V0ID09IG51bGwgfHwgYW5jaG9yT2Zmc2V0ID09IG51bGwgfHwgYW5jaG9yT2Zmc2V0ID4gZm9jdXNPZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIGFuY2hvck9mZnNldDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmb2N1c09mZnNldDtcbiAgICB9XG5cbiAgICAvKiogU2V0cyBIVE1MRWxlbWVudCBzZWxlY3Rpb24gKi9cbiAgICBfdW5zYWZlU2VsZWN0KHN0YXJ0LCBlbmQpIHtcbiAgICAgIGlmICghdGhpcy5yb290RWxlbWVudC5jcmVhdGVSYW5nZSkgcmV0dXJuO1xuICAgICAgY29uc3QgcmFuZ2UgPSB0aGlzLnJvb3RFbGVtZW50LmNyZWF0ZVJhbmdlKCk7XG4gICAgICByYW5nZS5zZXRTdGFydCh0aGlzLmlucHV0LmZpcnN0Q2hpbGQgfHwgdGhpcy5pbnB1dCwgc3RhcnQpO1xuICAgICAgcmFuZ2Uuc2V0RW5kKHRoaXMuaW5wdXQubGFzdENoaWxkIHx8IHRoaXMuaW5wdXQsIGVuZCk7XG4gICAgICBjb25zdCByb290ID0gdGhpcy5yb290RWxlbWVudDtcbiAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHJvb3QuZ2V0U2VsZWN0aW9uICYmIHJvb3QuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgICAgc2VsZWN0aW9uLmFkZFJhbmdlKHJhbmdlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogSFRNTEVsZW1lbnQgdmFsdWUgKi9cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnB1dC50ZXh0Q29udGVudCB8fCAnJztcbiAgICB9XG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICB0aGlzLmlucHV0LnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIElNYXNrLkhUTUxDb250ZW50ZWRpdGFibGVNYXNrRWxlbWVudCA9IEhUTUxDb250ZW50ZWRpdGFibGVNYXNrRWxlbWVudDtcblxuICBjbGFzcyBJbnB1dEhpc3Rvcnkge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgdGhpcy5zdGF0ZXMgPSBbXTtcbiAgICAgIHRoaXMuY3VycmVudEluZGV4ID0gMDtcbiAgICB9XG4gICAgZ2V0IGN1cnJlbnRTdGF0ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YXRlc1t0aGlzLmN1cnJlbnRJbmRleF07XG4gICAgfVxuICAgIGdldCBpc0VtcHR5KCkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdGVzLmxlbmd0aCA9PT0gMDtcbiAgICB9XG4gICAgcHVzaChzdGF0ZSkge1xuICAgICAgLy8gaWYgY3VycmVudCBpbmRleCBwb2ludHMgYmVmb3JlIHRoZSBsYXN0IGVsZW1lbnQgdGhlbiByZW1vdmUgdGhlIGZ1dHVyZVxuICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4IDwgdGhpcy5zdGF0ZXMubGVuZ3RoIC0gMSkgdGhpcy5zdGF0ZXMubGVuZ3RoID0gdGhpcy5jdXJyZW50SW5kZXggKyAxO1xuICAgICAgdGhpcy5zdGF0ZXMucHVzaChzdGF0ZSk7XG4gICAgICBpZiAodGhpcy5zdGF0ZXMubGVuZ3RoID4gSW5wdXRIaXN0b3J5Lk1BWF9MRU5HVEgpIHRoaXMuc3RhdGVzLnNoaWZ0KCk7XG4gICAgICB0aGlzLmN1cnJlbnRJbmRleCA9IHRoaXMuc3RhdGVzLmxlbmd0aCAtIDE7XG4gICAgfVxuICAgIGdvKHN0ZXBzKSB7XG4gICAgICB0aGlzLmN1cnJlbnRJbmRleCA9IE1hdGgubWluKE1hdGgubWF4KHRoaXMuY3VycmVudEluZGV4ICsgc3RlcHMsIDApLCB0aGlzLnN0YXRlcy5sZW5ndGggLSAxKTtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRTdGF0ZTtcbiAgICB9XG4gICAgdW5kbygpIHtcbiAgICAgIHJldHVybiB0aGlzLmdvKC0xKTtcbiAgICB9XG4gICAgcmVkbygpIHtcbiAgICAgIHJldHVybiB0aGlzLmdvKCsxKTtcbiAgICB9XG4gICAgY2xlYXIoKSB7XG4gICAgICB0aGlzLnN0YXRlcy5sZW5ndGggPSAwO1xuICAgICAgdGhpcy5jdXJyZW50SW5kZXggPSAwO1xuICAgIH1cbiAgfVxuICBJbnB1dEhpc3RvcnkuTUFYX0xFTkdUSCA9IDEwMDtcblxuICAvKiogTGlzdGVucyB0byBlbGVtZW50IGV2ZW50cyBhbmQgY29udHJvbHMgY2hhbmdlcyBiZXR3ZWVuIGVsZW1lbnQgYW5kIHtAbGluayBNYXNrZWR9ICovXG4gIGNsYXNzIElucHV0TWFzayB7XG4gICAgLyoqXG4gICAgICBWaWV3IGVsZW1lbnRcbiAgICAqL1xuXG4gICAgLyoqIEludGVybmFsIHtAbGluayBNYXNrZWR9IG1vZGVsICovXG5cbiAgICBjb25zdHJ1Y3RvcihlbCwgb3B0cykge1xuICAgICAgdGhpcy5lbCA9IGVsIGluc3RhbmNlb2YgTWFza0VsZW1lbnQgPyBlbCA6IGVsLmlzQ29udGVudEVkaXRhYmxlICYmIGVsLnRhZ05hbWUgIT09ICdJTlBVVCcgJiYgZWwudGFnTmFtZSAhPT0gJ1RFWFRBUkVBJyA/IG5ldyBIVE1MQ29udGVudGVkaXRhYmxlTWFza0VsZW1lbnQoZWwpIDogbmV3IEhUTUxJbnB1dE1hc2tFbGVtZW50KGVsKTtcbiAgICAgIHRoaXMubWFza2VkID0gY3JlYXRlTWFzayhvcHRzKTtcbiAgICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xuICAgICAgdGhpcy5fdmFsdWUgPSAnJztcbiAgICAgIHRoaXMuX3VubWFza2VkVmFsdWUgPSAnJztcbiAgICAgIHRoaXMuX3Jhd0lucHV0VmFsdWUgPSAnJztcbiAgICAgIHRoaXMuaGlzdG9yeSA9IG5ldyBJbnB1dEhpc3RvcnkoKTtcbiAgICAgIHRoaXMuX3NhdmVTZWxlY3Rpb24gPSB0aGlzLl9zYXZlU2VsZWN0aW9uLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vbklucHV0ID0gdGhpcy5fb25JbnB1dC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25DaGFuZ2UgPSB0aGlzLl9vbkNoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25Ecm9wID0gdGhpcy5fb25Ecm9wLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9vbkZvY3VzID0gdGhpcy5fb25Gb2N1cy5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25DbGljayA9IHRoaXMuX29uQ2xpY2suYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuX29uVW5kbyA9IHRoaXMuX29uVW5kby5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5fb25SZWRvID0gdGhpcy5fb25SZWRvLmJpbmQodGhpcyk7XG4gICAgICB0aGlzLmFsaWduQ3Vyc29yID0gdGhpcy5hbGlnbkN1cnNvci5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5hbGlnbkN1cnNvckZyaWVuZGx5ID0gdGhpcy5hbGlnbkN1cnNvckZyaWVuZGx5LmJpbmQodGhpcyk7XG4gICAgICB0aGlzLl9iaW5kRXZlbnRzKCk7XG5cbiAgICAgIC8vIHJlZnJlc2hcbiAgICAgIHRoaXMudXBkYXRlVmFsdWUoKTtcbiAgICAgIHRoaXMuX29uQ2hhbmdlKCk7XG4gICAgfVxuICAgIG1hc2tFcXVhbHMobWFzaykge1xuICAgICAgdmFyIF90aGlzJG1hc2tlZDtcbiAgICAgIHJldHVybiBtYXNrID09IG51bGwgfHwgKChfdGhpcyRtYXNrZWQgPSB0aGlzLm1hc2tlZCkgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJG1hc2tlZC5tYXNrRXF1YWxzKG1hc2spKTtcbiAgICB9XG5cbiAgICAvKiogTWFza2VkICovXG4gICAgZ2V0IG1hc2soKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQubWFzaztcbiAgICB9XG4gICAgc2V0IG1hc2sobWFzaykge1xuICAgICAgaWYgKHRoaXMubWFza0VxdWFscyhtYXNrKSkgcmV0dXJuO1xuICAgICAgaWYgKCEobWFzayBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZCkgJiYgdGhpcy5tYXNrZWQuY29uc3RydWN0b3IgPT09IG1hc2tlZENsYXNzKG1hc2spKSB7XG4gICAgICAgIC8vIFRPRE8gXCJhbnlcIiBubyBpZGVhXG4gICAgICAgIHRoaXMubWFza2VkLnVwZGF0ZU9wdGlvbnMoe1xuICAgICAgICAgIG1hc2tcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1hc2tlZCA9IG1hc2sgaW5zdGFuY2VvZiBJTWFzay5NYXNrZWQgPyBtYXNrIDogY3JlYXRlTWFzayh7XG4gICAgICAgIG1hc2tcbiAgICAgIH0pO1xuICAgICAgbWFza2VkLnVubWFza2VkVmFsdWUgPSB0aGlzLm1hc2tlZC51bm1hc2tlZFZhbHVlO1xuICAgICAgdGhpcy5tYXNrZWQgPSBtYXNrZWQ7XG4gICAgfVxuXG4gICAgLyoqIFJhdyB2YWx1ZSAqL1xuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKHN0cikge1xuICAgICAgaWYgKHRoaXMudmFsdWUgPT09IHN0cikgcmV0dXJuO1xuICAgICAgdGhpcy5tYXNrZWQudmFsdWUgPSBzdHI7XG4gICAgICB0aGlzLnVwZGF0ZUNvbnRyb2woJ2F1dG8nKTtcbiAgICB9XG5cbiAgICAvKiogVW5tYXNrZWQgdmFsdWUgKi9cbiAgICBnZXQgdW5tYXNrZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl91bm1hc2tlZFZhbHVlO1xuICAgIH1cbiAgICBzZXQgdW5tYXNrZWRWYWx1ZShzdHIpIHtcbiAgICAgIGlmICh0aGlzLnVubWFza2VkVmFsdWUgPT09IHN0cikgcmV0dXJuO1xuICAgICAgdGhpcy5tYXNrZWQudW5tYXNrZWRWYWx1ZSA9IHN0cjtcbiAgICAgIHRoaXMudXBkYXRlQ29udHJvbCgnYXV0bycpO1xuICAgIH1cblxuICAgIC8qKiBSYXcgaW5wdXQgdmFsdWUgKi9cbiAgICBnZXQgcmF3SW5wdXRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yYXdJbnB1dFZhbHVlO1xuICAgIH1cbiAgICBzZXQgcmF3SW5wdXRWYWx1ZShzdHIpIHtcbiAgICAgIGlmICh0aGlzLnJhd0lucHV0VmFsdWUgPT09IHN0cikgcmV0dXJuO1xuICAgICAgdGhpcy5tYXNrZWQucmF3SW5wdXRWYWx1ZSA9IHN0cjtcbiAgICAgIHRoaXMudXBkYXRlQ29udHJvbCgpO1xuICAgICAgdGhpcy5hbGlnbkN1cnNvcigpO1xuICAgIH1cblxuICAgIC8qKiBUeXBlZCB1bm1hc2tlZCB2YWx1ZSAqL1xuICAgIGdldCB0eXBlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLnR5cGVkVmFsdWU7XG4gICAgfVxuICAgIHNldCB0eXBlZFZhbHVlKHZhbCkge1xuICAgICAgaWYgKHRoaXMubWFza2VkLnR5cGVkVmFsdWVFcXVhbHModmFsKSkgcmV0dXJuO1xuICAgICAgdGhpcy5tYXNrZWQudHlwZWRWYWx1ZSA9IHZhbDtcbiAgICAgIHRoaXMudXBkYXRlQ29udHJvbCgnYXV0bycpO1xuICAgIH1cblxuICAgIC8qKiBEaXNwbGF5IHZhbHVlICovXG4gICAgZ2V0IGRpc3BsYXlWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5kaXNwbGF5VmFsdWU7XG4gICAgfVxuXG4gICAgLyoqIFN0YXJ0cyBsaXN0ZW5pbmcgdG8gZWxlbWVudCBldmVudHMgKi9cbiAgICBfYmluZEV2ZW50cygpIHtcbiAgICAgIHRoaXMuZWwuYmluZEV2ZW50cyh7XG4gICAgICAgIHNlbGVjdGlvbkNoYW5nZTogdGhpcy5fc2F2ZVNlbGVjdGlvbixcbiAgICAgICAgaW5wdXQ6IHRoaXMuX29uSW5wdXQsXG4gICAgICAgIGRyb3A6IHRoaXMuX29uRHJvcCxcbiAgICAgICAgY2xpY2s6IHRoaXMuX29uQ2xpY2ssXG4gICAgICAgIGZvY3VzOiB0aGlzLl9vbkZvY3VzLFxuICAgICAgICBjb21taXQ6IHRoaXMuX29uQ2hhbmdlLFxuICAgICAgICB1bmRvOiB0aGlzLl9vblVuZG8sXG4gICAgICAgIHJlZG86IHRoaXMuX29uUmVkb1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqIFN0b3BzIGxpc3RlbmluZyB0byBlbGVtZW50IGV2ZW50cyAqL1xuICAgIF91bmJpbmRFdmVudHMoKSB7XG4gICAgICBpZiAodGhpcy5lbCkgdGhpcy5lbC51bmJpbmRFdmVudHMoKTtcbiAgICB9XG5cbiAgICAvKiogRmlyZXMgY3VzdG9tIGV2ZW50ICovXG4gICAgX2ZpcmVFdmVudChldiwgZSkge1xuICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fbGlzdGVuZXJzW2V2XTtcbiAgICAgIGlmICghbGlzdGVuZXJzKSByZXR1cm47XG4gICAgICBsaXN0ZW5lcnMuZm9yRWFjaChsID0+IGwoZSkpO1xuICAgIH1cblxuICAgIC8qKiBDdXJyZW50IHNlbGVjdGlvbiBzdGFydCAqL1xuICAgIGdldCBzZWxlY3Rpb25TdGFydCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jdXJzb3JDaGFuZ2luZyA/IHRoaXMuX2NoYW5naW5nQ3Vyc29yUG9zIDogdGhpcy5lbC5zZWxlY3Rpb25TdGFydDtcbiAgICB9XG5cbiAgICAvKiogQ3VycmVudCBjdXJzb3IgcG9zaXRpb24gKi9cbiAgICBnZXQgY3Vyc29yUG9zKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2N1cnNvckNoYW5naW5nID8gdGhpcy5fY2hhbmdpbmdDdXJzb3JQb3MgOiB0aGlzLmVsLnNlbGVjdGlvbkVuZDtcbiAgICB9XG4gICAgc2V0IGN1cnNvclBvcyhwb3MpIHtcbiAgICAgIGlmICghdGhpcy5lbCB8fCAhdGhpcy5lbC5pc0FjdGl2ZSkgcmV0dXJuO1xuICAgICAgdGhpcy5lbC5zZWxlY3QocG9zLCBwb3MpO1xuICAgICAgdGhpcy5fc2F2ZVNlbGVjdGlvbigpO1xuICAgIH1cblxuICAgIC8qKiBTdG9yZXMgY3VycmVudCBzZWxlY3Rpb24gKi9cbiAgICBfc2F2ZVNlbGVjdGlvbiggLyogZXYgKi9cbiAgICApIHtcbiAgICAgIGlmICh0aGlzLmRpc3BsYXlWYWx1ZSAhPT0gdGhpcy5lbC52YWx1ZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ0VsZW1lbnQgdmFsdWUgd2FzIGNoYW5nZWQgb3V0c2lkZSBvZiBtYXNrLiBTeW5jcm9uaXplIG1hc2sgdXNpbmcgYG1hc2sudXBkYXRlVmFsdWUoKWAgdG8gd29yayBwcm9wZXJseS4nKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gICAgICB9XG4gICAgICB0aGlzLl9zZWxlY3Rpb24gPSB7XG4gICAgICAgIHN0YXJ0OiB0aGlzLnNlbGVjdGlvblN0YXJ0LFxuICAgICAgICBlbmQ6IHRoaXMuY3Vyc29yUG9zXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qKiBTeW5jcm9uaXplcyBtb2RlbCB2YWx1ZSBmcm9tIHZpZXcgKi9cbiAgICB1cGRhdGVWYWx1ZSgpIHtcbiAgICAgIHRoaXMubWFza2VkLnZhbHVlID0gdGhpcy5lbC52YWx1ZTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdGhpcy5tYXNrZWQudmFsdWU7XG4gICAgICB0aGlzLl91bm1hc2tlZFZhbHVlID0gdGhpcy5tYXNrZWQudW5tYXNrZWRWYWx1ZTtcbiAgICAgIHRoaXMuX3Jhd0lucHV0VmFsdWUgPSB0aGlzLm1hc2tlZC5yYXdJbnB1dFZhbHVlO1xuICAgIH1cblxuICAgIC8qKiBTeW5jcm9uaXplcyB2aWV3IGZyb20gbW9kZWwgdmFsdWUsIGZpcmVzIGNoYW5nZSBldmVudHMgKi9cbiAgICB1cGRhdGVDb250cm9sKGN1cnNvclBvcykge1xuICAgICAgY29uc3QgbmV3VW5tYXNrZWRWYWx1ZSA9IHRoaXMubWFza2VkLnVubWFza2VkVmFsdWU7XG4gICAgICBjb25zdCBuZXdWYWx1ZSA9IHRoaXMubWFza2VkLnZhbHVlO1xuICAgICAgY29uc3QgbmV3UmF3SW5wdXRWYWx1ZSA9IHRoaXMubWFza2VkLnJhd0lucHV0VmFsdWU7XG4gICAgICBjb25zdCBuZXdEaXNwbGF5VmFsdWUgPSB0aGlzLmRpc3BsYXlWYWx1ZTtcbiAgICAgIGNvbnN0IGlzQ2hhbmdlZCA9IHRoaXMudW5tYXNrZWRWYWx1ZSAhPT0gbmV3VW5tYXNrZWRWYWx1ZSB8fCB0aGlzLnZhbHVlICE9PSBuZXdWYWx1ZSB8fCB0aGlzLl9yYXdJbnB1dFZhbHVlICE9PSBuZXdSYXdJbnB1dFZhbHVlO1xuICAgICAgdGhpcy5fdW5tYXNrZWRWYWx1ZSA9IG5ld1VubWFza2VkVmFsdWU7XG4gICAgICB0aGlzLl92YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgdGhpcy5fcmF3SW5wdXRWYWx1ZSA9IG5ld1Jhd0lucHV0VmFsdWU7XG4gICAgICBpZiAodGhpcy5lbC52YWx1ZSAhPT0gbmV3RGlzcGxheVZhbHVlKSB0aGlzLmVsLnZhbHVlID0gbmV3RGlzcGxheVZhbHVlO1xuICAgICAgaWYgKGN1cnNvclBvcyA9PT0gJ2F1dG8nKSB0aGlzLmFsaWduQ3Vyc29yKCk7ZWxzZSBpZiAoY3Vyc29yUG9zICE9IG51bGwpIHRoaXMuY3Vyc29yUG9zID0gY3Vyc29yUG9zO1xuICAgICAgaWYgKGlzQ2hhbmdlZCkgdGhpcy5fZmlyZUNoYW5nZUV2ZW50cygpO1xuICAgICAgaWYgKCF0aGlzLl9oaXN0b3J5Q2hhbmdpbmcgJiYgKGlzQ2hhbmdlZCB8fCB0aGlzLmhpc3RvcnkuaXNFbXB0eSkpIHRoaXMuaGlzdG9yeS5wdXNoKHtcbiAgICAgICAgdW5tYXNrZWRWYWx1ZTogbmV3VW5tYXNrZWRWYWx1ZSxcbiAgICAgICAgc2VsZWN0aW9uOiB7XG4gICAgICAgICAgc3RhcnQ6IHRoaXMuc2VsZWN0aW9uU3RhcnQsXG4gICAgICAgICAgZW5kOiB0aGlzLmN1cnNvclBvc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKiogVXBkYXRlcyBvcHRpb25zIHdpdGggZGVlcCBlcXVhbCBjaGVjaywgcmVjcmVhdGVzIHtAbGluayBNYXNrZWR9IG1vZGVsIGlmIG1hc2sgdHlwZSBjaGFuZ2VzICovXG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIG1hc2ssXG4gICAgICAgIC4uLnJlc3RPcHRzXG4gICAgICB9ID0gb3B0czsgLy8gVE9ETyB0eXBlcywgeWVzLCBtYXNrIGlzIG9wdGlvbmFsXG5cbiAgICAgIGNvbnN0IHVwZGF0ZU1hc2sgPSAhdGhpcy5tYXNrRXF1YWxzKG1hc2spO1xuICAgICAgY29uc3QgdXBkYXRlT3B0cyA9IHRoaXMubWFza2VkLm9wdGlvbnNJc0NoYW5nZWQocmVzdE9wdHMpO1xuICAgICAgaWYgKHVwZGF0ZU1hc2spIHRoaXMubWFzayA9IG1hc2s7XG4gICAgICBpZiAodXBkYXRlT3B0cykgdGhpcy5tYXNrZWQudXBkYXRlT3B0aW9ucyhyZXN0T3B0cyk7IC8vIFRPRE9cblxuICAgICAgaWYgKHVwZGF0ZU1hc2sgfHwgdXBkYXRlT3B0cykgdGhpcy51cGRhdGVDb250cm9sKCk7XG4gICAgfVxuXG4gICAgLyoqIFVwZGF0ZXMgY3Vyc29yICovXG4gICAgdXBkYXRlQ3Vyc29yKGN1cnNvclBvcykge1xuICAgICAgaWYgKGN1cnNvclBvcyA9PSBudWxsKSByZXR1cm47XG4gICAgICB0aGlzLmN1cnNvclBvcyA9IGN1cnNvclBvcztcblxuICAgICAgLy8gYWxzbyBxdWV1ZSBjaGFuZ2UgY3Vyc29yIGZvciBtb2JpbGUgYnJvd3NlcnNcbiAgICAgIHRoaXMuX2RlbGF5VXBkYXRlQ3Vyc29yKGN1cnNvclBvcyk7XG4gICAgfVxuXG4gICAgLyoqIERlbGF5cyBjdXJzb3IgdXBkYXRlIHRvIHN1cHBvcnQgbW9iaWxlIGJyb3dzZXJzICovXG4gICAgX2RlbGF5VXBkYXRlQ3Vyc29yKGN1cnNvclBvcykge1xuICAgICAgdGhpcy5fYWJvcnRVcGRhdGVDdXJzb3IoKTtcbiAgICAgIHRoaXMuX2NoYW5naW5nQ3Vyc29yUG9zID0gY3Vyc29yUG9zO1xuICAgICAgdGhpcy5fY3Vyc29yQ2hhbmdpbmcgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmVsKSByZXR1cm47IC8vIGlmIHdhcyBkZXN0cm95ZWRcbiAgICAgICAgdGhpcy5jdXJzb3JQb3MgPSB0aGlzLl9jaGFuZ2luZ0N1cnNvclBvcztcbiAgICAgICAgdGhpcy5fYWJvcnRVcGRhdGVDdXJzb3IoKTtcbiAgICAgIH0sIDEwKTtcbiAgICB9XG5cbiAgICAvKiogRmlyZXMgY3VzdG9tIGV2ZW50cyAqL1xuICAgIF9maXJlQ2hhbmdlRXZlbnRzKCkge1xuICAgICAgdGhpcy5fZmlyZUV2ZW50KCdhY2NlcHQnLCB0aGlzLl9pbnB1dEV2ZW50KTtcbiAgICAgIGlmICh0aGlzLm1hc2tlZC5pc0NvbXBsZXRlKSB0aGlzLl9maXJlRXZlbnQoJ2NvbXBsZXRlJywgdGhpcy5faW5wdXRFdmVudCk7XG4gICAgfVxuXG4gICAgLyoqIEFib3J0cyBkZWxheWVkIGN1cnNvciB1cGRhdGUgKi9cbiAgICBfYWJvcnRVcGRhdGVDdXJzb3IoKSB7XG4gICAgICBpZiAodGhpcy5fY3Vyc29yQ2hhbmdpbmcpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2N1cnNvckNoYW5naW5nKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2N1cnNvckNoYW5naW5nO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKiBBbGlnbnMgY3Vyc29yIHRvIG5lYXJlc3QgYXZhaWxhYmxlIHBvc2l0aW9uICovXG4gICAgYWxpZ25DdXJzb3IoKSB7XG4gICAgICB0aGlzLmN1cnNvclBvcyA9IHRoaXMubWFza2VkLm5lYXJlc3RJbnB1dFBvcyh0aGlzLm1hc2tlZC5uZWFyZXN0SW5wdXRQb3ModGhpcy5jdXJzb3JQb3MsIERJUkVDVElPTi5MRUZUKSk7XG4gICAgfVxuXG4gICAgLyoqIEFsaWducyBjdXJzb3Igb25seSBpZiBzZWxlY3Rpb24gaXMgZW1wdHkgKi9cbiAgICBhbGlnbkN1cnNvckZyaWVuZGx5KCkge1xuICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uU3RhcnQgIT09IHRoaXMuY3Vyc29yUG9zKSByZXR1cm47IC8vIHNraXAgaWYgcmFuZ2UgaXMgc2VsZWN0ZWRcbiAgICAgIHRoaXMuYWxpZ25DdXJzb3IoKTtcbiAgICB9XG5cbiAgICAvKiogQWRkcyBsaXN0ZW5lciBvbiBjdXN0b20gZXZlbnQgKi9cbiAgICBvbihldiwgaGFuZGxlcikge1xuICAgICAgaWYgKCF0aGlzLl9saXN0ZW5lcnNbZXZdKSB0aGlzLl9saXN0ZW5lcnNbZXZdID0gW107XG4gICAgICB0aGlzLl9saXN0ZW5lcnNbZXZdLnB1c2goaGFuZGxlcik7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogUmVtb3ZlcyBjdXN0b20gZXZlbnQgbGlzdGVuZXIgKi9cbiAgICBvZmYoZXYsIGhhbmRsZXIpIHtcbiAgICAgIGlmICghdGhpcy5fbGlzdGVuZXJzW2V2XSkgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2xpc3RlbmVyc1tldl07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgY29uc3QgaEluZGV4ID0gdGhpcy5fbGlzdGVuZXJzW2V2XS5pbmRleE9mKGhhbmRsZXIpO1xuICAgICAgaWYgKGhJbmRleCA+PSAwKSB0aGlzLl9saXN0ZW5lcnNbZXZdLnNwbGljZShoSW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqIEhhbmRsZXMgdmlldyBpbnB1dCBldmVudCAqL1xuICAgIF9vbklucHV0KGUpIHtcbiAgICAgIHRoaXMuX2lucHV0RXZlbnQgPSBlO1xuICAgICAgdGhpcy5fYWJvcnRVcGRhdGVDdXJzb3IoKTtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQWN0aW9uRGV0YWlscyh7XG4gICAgICAgIC8vIG5ldyBzdGF0ZVxuICAgICAgICB2YWx1ZTogdGhpcy5lbC52YWx1ZSxcbiAgICAgICAgY3Vyc29yUG9zOiB0aGlzLmN1cnNvclBvcyxcbiAgICAgICAgLy8gb2xkIHN0YXRlXG4gICAgICAgIG9sZFZhbHVlOiB0aGlzLmRpc3BsYXlWYWx1ZSxcbiAgICAgICAgb2xkU2VsZWN0aW9uOiB0aGlzLl9zZWxlY3Rpb25cbiAgICAgIH0pO1xuICAgICAgY29uc3Qgb2xkUmF3VmFsdWUgPSB0aGlzLm1hc2tlZC5yYXdJbnB1dFZhbHVlO1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5tYXNrZWQuc3BsaWNlKGRldGFpbHMuc3RhcnRDaGFuZ2VQb3MsIGRldGFpbHMucmVtb3ZlZC5sZW5ndGgsIGRldGFpbHMuaW5zZXJ0ZWQsIGRldGFpbHMucmVtb3ZlRGlyZWN0aW9uLCB7XG4gICAgICAgIGlucHV0OiB0cnVlLFxuICAgICAgICByYXc6IHRydWVcbiAgICAgIH0pLm9mZnNldDtcblxuICAgICAgLy8gZm9yY2UgYWxpZ24gaW4gcmVtb3ZlIGRpcmVjdGlvbiBvbmx5IGlmIG5vIGlucHV0IGNoYXJzIHdlcmUgcmVtb3ZlZFxuICAgICAgLy8gb3RoZXJ3aXNlIHdlIHN0aWxsIG5lZWQgdG8gYWxpZ24gd2l0aCBOT05FICh0byBnZXQgb3V0IGZyb20gZml4ZWQgc3ltYm9scyBmb3IgaW5zdGFuY2UpXG4gICAgICBjb25zdCByZW1vdmVEaXJlY3Rpb24gPSBvbGRSYXdWYWx1ZSA9PT0gdGhpcy5tYXNrZWQucmF3SW5wdXRWYWx1ZSA/IGRldGFpbHMucmVtb3ZlRGlyZWN0aW9uIDogRElSRUNUSU9OLk5PTkU7XG4gICAgICBsZXQgY3Vyc29yUG9zID0gdGhpcy5tYXNrZWQubmVhcmVzdElucHV0UG9zKGRldGFpbHMuc3RhcnRDaGFuZ2VQb3MgKyBvZmZzZXQsIHJlbW92ZURpcmVjdGlvbik7XG4gICAgICBpZiAocmVtb3ZlRGlyZWN0aW9uICE9PSBESVJFQ1RJT04uTk9ORSkgY3Vyc29yUG9zID0gdGhpcy5tYXNrZWQubmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgRElSRUNUSU9OLk5PTkUpO1xuICAgICAgdGhpcy51cGRhdGVDb250cm9sKGN1cnNvclBvcyk7XG4gICAgICBkZWxldGUgdGhpcy5faW5wdXRFdmVudDtcbiAgICB9XG5cbiAgICAvKiogSGFuZGxlcyB2aWV3IGNoYW5nZSBldmVudCBhbmQgY29tbWl0cyBtb2RlbCB2YWx1ZSAqL1xuICAgIF9vbkNoYW5nZSgpIHtcbiAgICAgIGlmICh0aGlzLmRpc3BsYXlWYWx1ZSAhPT0gdGhpcy5lbC52YWx1ZSkgdGhpcy51cGRhdGVWYWx1ZSgpO1xuICAgICAgdGhpcy5tYXNrZWQuZG9Db21taXQoKTtcbiAgICAgIHRoaXMudXBkYXRlQ29udHJvbCgpO1xuICAgICAgdGhpcy5fc2F2ZVNlbGVjdGlvbigpO1xuICAgIH1cblxuICAgIC8qKiBIYW5kbGVzIHZpZXcgZHJvcCBldmVudCwgcHJldmVudHMgYnkgZGVmYXVsdCAqL1xuICAgIF9vbkRyb3AoZXYpIHtcbiAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICAvKiogUmVzdG9yZSBsYXN0IHNlbGVjdGlvbiBvbiBmb2N1cyAqL1xuICAgIF9vbkZvY3VzKGV2KSB7XG4gICAgICB0aGlzLmFsaWduQ3Vyc29yRnJpZW5kbHkoKTtcbiAgICB9XG5cbiAgICAvKiogUmVzdG9yZSBsYXN0IHNlbGVjdGlvbiBvbiBmb2N1cyAqL1xuICAgIF9vbkNsaWNrKGV2KSB7XG4gICAgICB0aGlzLmFsaWduQ3Vyc29yRnJpZW5kbHkoKTtcbiAgICB9XG4gICAgX29uVW5kbygpIHtcbiAgICAgIHRoaXMuX2FwcGx5SGlzdG9yeVN0YXRlKHRoaXMuaGlzdG9yeS51bmRvKCkpO1xuICAgIH1cbiAgICBfb25SZWRvKCkge1xuICAgICAgdGhpcy5fYXBwbHlIaXN0b3J5U3RhdGUodGhpcy5oaXN0b3J5LnJlZG8oKSk7XG4gICAgfVxuICAgIF9hcHBseUhpc3RvcnlTdGF0ZShzdGF0ZSkge1xuICAgICAgaWYgKCFzdGF0ZSkgcmV0dXJuO1xuICAgICAgdGhpcy5faGlzdG9yeUNoYW5naW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMudW5tYXNrZWRWYWx1ZSA9IHN0YXRlLnVubWFza2VkVmFsdWU7XG4gICAgICB0aGlzLmVsLnNlbGVjdChzdGF0ZS5zZWxlY3Rpb24uc3RhcnQsIHN0YXRlLnNlbGVjdGlvbi5lbmQpO1xuICAgICAgdGhpcy5fc2F2ZVNlbGVjdGlvbigpO1xuICAgICAgdGhpcy5faGlzdG9yeUNoYW5naW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIFVuYmluZCB2aWV3IGV2ZW50cyBhbmQgcmVtb3ZlcyBlbGVtZW50IHJlZmVyZW5jZSAqL1xuICAgIGRlc3Ryb3koKSB7XG4gICAgICB0aGlzLl91bmJpbmRFdmVudHMoKTtcbiAgICAgIHRoaXMuX2xpc3RlbmVycy5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuZWw7XG4gICAgfVxuICB9XG4gIElNYXNrLklucHV0TWFzayA9IElucHV0TWFzaztcblxuICAvKiogUHJvdmlkZXMgZGV0YWlscyBvZiBjaGFuZ2luZyBtb2RlbCB2YWx1ZSAqL1xuICBjbGFzcyBDaGFuZ2VEZXRhaWxzIHtcbiAgICAvKiogSW5zZXJ0ZWQgc3ltYm9scyAqL1xuXG4gICAgLyoqIEFkZGl0aW9uYWwgb2Zmc2V0IGlmIGFueSBjaGFuZ2VzIG9jY3VycmVkIGJlZm9yZSB0YWlsICovXG5cbiAgICAvKiogUmF3IGluc2VydGVkIGlzIHVzZWQgYnkgZHluYW1pYyBtYXNrICovXG5cbiAgICAvKiogQ2FuIHNraXAgY2hhcnMgKi9cblxuICAgIHN0YXRpYyBub3JtYWxpemUocHJlcCkge1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocHJlcCkgPyBwcmVwIDogW3ByZXAsIG5ldyBDaGFuZ2VEZXRhaWxzKCldO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihkZXRhaWxzKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcbiAgICAgICAgaW5zZXJ0ZWQ6ICcnLFxuICAgICAgICByYXdJbnNlcnRlZDogJycsXG4gICAgICAgIHRhaWxTaGlmdDogMCxcbiAgICAgICAgc2tpcDogZmFsc2VcbiAgICAgIH0sIGRldGFpbHMpO1xuICAgIH1cblxuICAgIC8qKiBBZ2dyZWdhdGUgY2hhbmdlcyAqL1xuICAgIGFnZ3JlZ2F0ZShkZXRhaWxzKSB7XG4gICAgICB0aGlzLmluc2VydGVkICs9IGRldGFpbHMuaW5zZXJ0ZWQ7XG4gICAgICB0aGlzLnJhd0luc2VydGVkICs9IGRldGFpbHMucmF3SW5zZXJ0ZWQ7XG4gICAgICB0aGlzLnRhaWxTaGlmdCArPSBkZXRhaWxzLnRhaWxTaGlmdDtcbiAgICAgIHRoaXMuc2tpcCA9IHRoaXMuc2tpcCB8fCBkZXRhaWxzLnNraXA7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKiogVG90YWwgb2Zmc2V0IGNvbnNpZGVyaW5nIGFsbCBjaGFuZ2VzICovXG4gICAgZ2V0IG9mZnNldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnRhaWxTaGlmdCArIHRoaXMuaW5zZXJ0ZWQubGVuZ3RoO1xuICAgIH1cbiAgICBnZXQgY29uc3VtZWQoKSB7XG4gICAgICByZXR1cm4gQm9vbGVhbih0aGlzLnJhd0luc2VydGVkKSB8fCB0aGlzLnNraXA7XG4gICAgfVxuICAgIGVxdWFscyhkZXRhaWxzKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbnNlcnRlZCA9PT0gZGV0YWlscy5pbnNlcnRlZCAmJiB0aGlzLnRhaWxTaGlmdCA9PT0gZGV0YWlscy50YWlsU2hpZnQgJiYgdGhpcy5yYXdJbnNlcnRlZCA9PT0gZGV0YWlscy5yYXdJbnNlcnRlZCAmJiB0aGlzLnNraXAgPT09IGRldGFpbHMuc2tpcDtcbiAgICB9XG4gIH1cbiAgSU1hc2suQ2hhbmdlRGV0YWlscyA9IENoYW5nZURldGFpbHM7XG5cbiAgLyoqIFByb3ZpZGVzIGRldGFpbHMgb2YgY29udGludW91cyBleHRyYWN0ZWQgdGFpbCAqL1xuICBjbGFzcyBDb250aW51b3VzVGFpbERldGFpbHMge1xuICAgIC8qKiBUYWlsIHZhbHVlIGFzIHN0cmluZyAqL1xuXG4gICAgLyoqIFRhaWwgc3RhcnQgcG9zaXRpb24gKi9cblxuICAgIC8qKiBTdGFydCBwb3NpdGlvbiAqL1xuXG4gICAgY29uc3RydWN0b3IodmFsdWUsIGZyb20sIHN0b3ApIHtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHZhbHVlID0gJyc7XG4gICAgICB9XG4gICAgICBpZiAoZnJvbSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb20gPSAwO1xuICAgICAgfVxuICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgdGhpcy5mcm9tID0gZnJvbTtcbiAgICAgIHRoaXMuc3RvcCA9IHN0b3A7XG4gICAgfVxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICAgIGV4dGVuZCh0YWlsKSB7XG4gICAgICB0aGlzLnZhbHVlICs9IFN0cmluZyh0YWlsKTtcbiAgICB9XG4gICAgYXBwZW5kVG8obWFza2VkKSB7XG4gICAgICByZXR1cm4gbWFza2VkLmFwcGVuZCh0aGlzLnRvU3RyaW5nKCksIHtcbiAgICAgICAgdGFpbDogdHJ1ZVxuICAgICAgfSkuYWdncmVnYXRlKG1hc2tlZC5fYXBwZW5kUGxhY2Vob2xkZXIoKSk7XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB0aGlzLnZhbHVlLFxuICAgICAgICBmcm9tOiB0aGlzLmZyb20sXG4gICAgICAgIHN0b3A6IHRoaXMuc3RvcFxuICAgICAgfTtcbiAgICB9XG4gICAgc2V0IHN0YXRlKHN0YXRlKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHN0YXRlKTtcbiAgICB9XG4gICAgdW5zaGlmdChiZWZvcmVQb3MpIHtcbiAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGggfHwgYmVmb3JlUG9zICE9IG51bGwgJiYgdGhpcy5mcm9tID49IGJlZm9yZVBvcykgcmV0dXJuICcnO1xuICAgICAgY29uc3Qgc2hpZnRDaGFyID0gdGhpcy52YWx1ZVswXTtcbiAgICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIHNoaWZ0Q2hhcjtcbiAgICB9XG4gICAgc2hpZnQoKSB7XG4gICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKSByZXR1cm4gJyc7XG4gICAgICBjb25zdCBzaGlmdENoYXIgPSB0aGlzLnZhbHVlW3RoaXMudmFsdWUubGVuZ3RoIC0gMV07XG4gICAgICB0aGlzLnZhbHVlID0gdGhpcy52YWx1ZS5zbGljZSgwLCAtMSk7XG4gICAgICByZXR1cm4gc2hpZnRDaGFyO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBBcHBlbmQgZmxhZ3MgKi9cblxuICAvKiogRXh0cmFjdCBmbGFncyAqL1xuXG4gIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzYyMjNcblxuICAvKiogUHJvdmlkZXMgY29tbW9uIG1hc2tpbmcgc3R1ZmYgKi9cbiAgY2xhc3MgTWFza2VkIHtcbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqIFRyYW5zZm9ybXMgdmFsdWUgYmVmb3JlIG1hc2sgcHJvY2Vzc2luZyAqL1xuXG4gICAgLyoqIFRyYW5zZm9ybXMgZWFjaCBjaGFyIGJlZm9yZSBtYXNrIHByb2Nlc3NpbmcgKi9cblxuICAgIC8qKiBWYWxpZGF0ZXMgaWYgdmFsdWUgaXMgYWNjZXB0YWJsZSAqL1xuXG4gICAgLyoqIERvZXMgYWRkaXRpb25hbCBwcm9jZXNzaW5nIGF0IHRoZSBlbmQgb2YgZWRpdGluZyAqL1xuXG4gICAgLyoqIEZvcm1hdCB0eXBlZCB2YWx1ZSB0byBzdHJpbmcgKi9cblxuICAgIC8qKiBQYXJzZSBzdHJpbmcgdG8gZ2V0IHR5cGVkIHZhbHVlICovXG5cbiAgICAvKiogRW5hYmxlIGNoYXJhY3RlcnMgb3ZlcndyaXRpbmcgKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgdGhpcy5fdmFsdWUgPSAnJztcbiAgICAgIHRoaXMuX3VwZGF0ZSh7XG4gICAgICAgIC4uLk1hc2tlZC5ERUZBVUxUUyxcbiAgICAgICAgLi4ub3B0c1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLyoqIFNldHMgYW5kIGFwcGxpZXMgbmV3IG9wdGlvbnMgKi9cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zSXNDaGFuZ2VkKG9wdHMpKSByZXR1cm47XG4gICAgICB0aGlzLndpdGhWYWx1ZVJlZnJlc2godGhpcy5fdXBkYXRlLmJpbmQodGhpcywgb3B0cykpO1xuICAgIH1cblxuICAgIC8qKiBTZXRzIG5ldyBvcHRpb25zICovXG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIG9wdHMpO1xuICAgIH1cblxuICAgIC8qKiBNYXNrIHN0YXRlICovXG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgX3ZhbHVlOiB0aGlzLnZhbHVlLFxuICAgICAgICBfcmF3SW5wdXRWYWx1ZTogdGhpcy5yYXdJbnB1dFZhbHVlXG4gICAgICB9O1xuICAgIH1cbiAgICBzZXQgc3RhdGUoc3RhdGUpIHtcbiAgICAgIHRoaXMuX3ZhbHVlID0gc3RhdGUuX3ZhbHVlO1xuICAgIH1cblxuICAgIC8qKiBSZXNldHMgdmFsdWUgKi9cbiAgICByZXNldCgpIHtcbiAgICAgIHRoaXMuX3ZhbHVlID0gJyc7XG4gICAgfVxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcbiAgICB9XG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICB0aGlzLnJlc29sdmUodmFsdWUsIHtcbiAgICAgICAgaW5wdXQ6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKiBSZXNvbHZlIG5ldyB2YWx1ZSAqL1xuICAgIHJlc29sdmUodmFsdWUsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHtcbiAgICAgICAgICBpbnB1dDogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgdGhpcy5hcHBlbmQodmFsdWUsIGZsYWdzLCAnJyk7XG4gICAgICB0aGlzLmRvQ29tbWl0KCk7XG4gICAgfVxuICAgIGdldCB1bm1hc2tlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICAgIHNldCB1bm1hc2tlZFZhbHVlKHZhbHVlKSB7XG4gICAgICB0aGlzLnJlc29sdmUodmFsdWUsIHt9KTtcbiAgICB9XG4gICAgZ2V0IHR5cGVkVmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZSA/IHRoaXMucGFyc2UodGhpcy52YWx1ZSwgdGhpcykgOiB0aGlzLnVubWFza2VkVmFsdWU7XG4gICAgfVxuICAgIHNldCB0eXBlZFZhbHVlKHZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5mb3JtYXQpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZm9ybWF0KHZhbHVlLCB0aGlzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudW5tYXNrZWRWYWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqIFZhbHVlIHRoYXQgaW5jbHVkZXMgcmF3IHVzZXIgaW5wdXQgKi9cbiAgICBnZXQgcmF3SW5wdXRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4dHJhY3RJbnB1dCgwLCB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgsIHtcbiAgICAgICAgcmF3OiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgc2V0IHJhd0lucHV0VmFsdWUodmFsdWUpIHtcbiAgICAgIHRoaXMucmVzb2x2ZSh2YWx1ZSwge1xuICAgICAgICByYXc6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBnZXQgZGlzcGxheVZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICAgIGdldCBpc0NvbXBsZXRlKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGdldCBpc0ZpbGxlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlzQ29tcGxldGU7XG4gICAgfVxuXG4gICAgLyoqIEZpbmRzIG5lYXJlc3QgaW5wdXQgcG9zaXRpb24gaW4gZGlyZWN0aW9uICovXG4gICAgbmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgZGlyZWN0aW9uKSB7XG4gICAgICByZXR1cm4gY3Vyc29yUG9zO1xuICAgIH1cbiAgICB0b3RhbElucHV0UG9zaXRpb25zKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gTWF0aC5taW4odGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoLCB0b1BvcyAtIGZyb21Qb3MpO1xuICAgIH1cblxuICAgIC8qKiBFeHRyYWN0cyB2YWx1ZSBpbiByYW5nZSBjb25zaWRlcmluZyBmbGFncyAqL1xuICAgIGV4dHJhY3RJbnB1dChmcm9tUG9zLCB0b1BvcywgZmxhZ3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZS5zbGljZShmcm9tUG9zLCB0b1Bvcyk7XG4gICAgfVxuXG4gICAgLyoqIEV4dHJhY3RzIHRhaWwgaW4gcmFuZ2UgKi9cbiAgICBleHRyYWN0VGFpbChmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBDb250aW51b3VzVGFpbERldGFpbHModGhpcy5leHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MpLCBmcm9tUG9zKTtcbiAgICB9XG5cbiAgICAvKiogQXBwZW5kcyB0YWlsICovXG4gICAgYXBwZW5kVGFpbCh0YWlsKSB7XG4gICAgICBpZiAoaXNTdHJpbmcodGFpbCkpIHRhaWwgPSBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKFN0cmluZyh0YWlsKSk7XG4gICAgICByZXR1cm4gdGFpbC5hcHBlbmRUbyh0aGlzKTtcbiAgICB9XG5cbiAgICAvKiogQXBwZW5kcyBjaGFyICovXG4gICAgX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoIWNoKSByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIHRoaXMuX3ZhbHVlICs9IGNoO1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKHtcbiAgICAgICAgaW5zZXJ0ZWQ6IGNoLFxuICAgICAgICByYXdJbnNlcnRlZDogY2hcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKiBBcHBlbmRzIGNoYXIgKi9cbiAgICBfYXBwZW5kQ2hhcihjaCwgZmxhZ3MsIGNoZWNrVGFpbCkge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNvbnNpc3RlbnRTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICBsZXQgZGV0YWlscztcbiAgICAgIFtjaCwgZGV0YWlsc10gPSB0aGlzLmRvUHJlcGFyZUNoYXIoY2gsIGZsYWdzKTtcbiAgICAgIGlmIChjaCkge1xuICAgICAgICBkZXRhaWxzID0gZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5fYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpKTtcblxuICAgICAgICAvLyBUT0RPIGhhbmRsZSBgc2tpcGA/XG5cbiAgICAgICAgLy8gdHJ5IGBhdXRvZml4YCBsb29rYWhlYWRcbiAgICAgICAgaWYgKCFkZXRhaWxzLnJhd0luc2VydGVkICYmIHRoaXMuYXV0b2ZpeCA9PT0gJ3BhZCcpIHtcbiAgICAgICAgICBjb25zdCBub0ZpeFN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgICB0aGlzLnN0YXRlID0gY29uc2lzdGVudFN0YXRlO1xuICAgICAgICAgIGxldCBmaXhEZXRhaWxzID0gdGhpcy5wYWQoZmxhZ3MpO1xuICAgICAgICAgIGNvbnN0IGNoRGV0YWlscyA9IHRoaXMuX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKTtcbiAgICAgICAgICBmaXhEZXRhaWxzID0gZml4RGV0YWlscy5hZ2dyZWdhdGUoY2hEZXRhaWxzKTtcblxuICAgICAgICAgIC8vIGlmIGZpeCB3YXMgYXBwbGllZCBvclxuICAgICAgICAgIC8vIGlmIGRldGFpbHMgYXJlIGVxdWFsIHVzZSBza2lwIHJlc3RvcmluZyBzdGF0ZSBvcHRpbWl6YXRpb25cbiAgICAgICAgICBpZiAoY2hEZXRhaWxzLnJhd0luc2VydGVkIHx8IGZpeERldGFpbHMuZXF1YWxzKGRldGFpbHMpKSB7XG4gICAgICAgICAgICBkZXRhaWxzID0gZml4RGV0YWlscztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IG5vRml4U3RhdGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZGV0YWlscy5pbnNlcnRlZCkge1xuICAgICAgICBsZXQgY29uc2lzdGVudFRhaWw7XG4gICAgICAgIGxldCBhcHBlbmRlZCA9IHRoaXMuZG9WYWxpZGF0ZShmbGFncykgIT09IGZhbHNlO1xuICAgICAgICBpZiAoYXBwZW5kZWQgJiYgY2hlY2tUYWlsICE9IG51bGwpIHtcbiAgICAgICAgICAvLyB2YWxpZGF0aW9uIG9rLCBjaGVjayB0YWlsXG4gICAgICAgICAgY29uc3QgYmVmb3JlVGFpbFN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgICBpZiAodGhpcy5vdmVyd3JpdGUgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGNvbnNpc3RlbnRUYWlsID0gY2hlY2tUYWlsLnN0YXRlO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXRhaWxzLnJhd0luc2VydGVkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIGNoZWNrVGFpbC51bnNoaWZ0KHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCAtIGRldGFpbHMudGFpbFNoaWZ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IHRhaWxEZXRhaWxzID0gdGhpcy5hcHBlbmRUYWlsKGNoZWNrVGFpbCk7XG4gICAgICAgICAgYXBwZW5kZWQgPSB0YWlsRGV0YWlscy5yYXdJbnNlcnRlZC5sZW5ndGggPT09IGNoZWNrVGFpbC50b1N0cmluZygpLmxlbmd0aDtcblxuICAgICAgICAgIC8vIG5vdCBvaywgdHJ5IHNoaWZ0XG4gICAgICAgICAgaWYgKCEoYXBwZW5kZWQgJiYgdGFpbERldGFpbHMuaW5zZXJ0ZWQpICYmIHRoaXMub3ZlcndyaXRlID09PSAnc2hpZnQnKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gYmVmb3JlVGFpbFN0YXRlO1xuICAgICAgICAgICAgY29uc2lzdGVudFRhaWwgPSBjaGVja1RhaWwuc3RhdGU7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRldGFpbHMucmF3SW5zZXJ0ZWQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgY2hlY2tUYWlsLnNoaWZ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YWlsRGV0YWlscyA9IHRoaXMuYXBwZW5kVGFpbChjaGVja1RhaWwpO1xuICAgICAgICAgICAgYXBwZW5kZWQgPSB0YWlsRGV0YWlscy5yYXdJbnNlcnRlZC5sZW5ndGggPT09IGNoZWNrVGFpbC50b1N0cmluZygpLmxlbmd0aDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBpZiBvaywgcm9sbGJhY2sgc3RhdGUgYWZ0ZXIgdGFpbFxuICAgICAgICAgIGlmIChhcHBlbmRlZCAmJiB0YWlsRGV0YWlscy5pbnNlcnRlZCkgdGhpcy5zdGF0ZSA9IGJlZm9yZVRhaWxTdGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJldmVydCBhbGwgaWYgc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgICAgaWYgKCFhcHBlbmRlZCkge1xuICAgICAgICAgIGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgICAgIHRoaXMuc3RhdGUgPSBjb25zaXN0ZW50U3RhdGU7XG4gICAgICAgICAgaWYgKGNoZWNrVGFpbCAmJiBjb25zaXN0ZW50VGFpbCkgY2hlY2tUYWlsLnN0YXRlID0gY29uc2lzdGVudFRhaWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cblxuICAgIC8qKiBBcHBlbmRzIG9wdGlvbmFsIHBsYWNlaG9sZGVyIGF0IHRoZSBlbmQgKi9cbiAgICBfYXBwZW5kUGxhY2Vob2xkZXIoKSB7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICB9XG5cbiAgICAvKiogQXBwZW5kcyBvcHRpb25hbCBlYWdlciBwbGFjZWhvbGRlciBhdCB0aGUgZW5kICovXG4gICAgX2FwcGVuZEVhZ2VyKCkge1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgfVxuXG4gICAgLyoqIEFwcGVuZHMgc3ltYm9scyBjb25zaWRlcmluZyBmbGFncyAqL1xuICAgIGFwcGVuZChzdHIsIGZsYWdzLCB0YWlsKSB7XG4gICAgICBpZiAoIWlzU3RyaW5nKHN0cikpIHRocm93IG5ldyBFcnJvcigndmFsdWUgc2hvdWxkIGJlIHN0cmluZycpO1xuICAgICAgY29uc3QgY2hlY2tUYWlsID0gaXNTdHJpbmcodGFpbCkgPyBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKFN0cmluZyh0YWlsKSkgOiB0YWlsO1xuICAgICAgaWYgKGZsYWdzICE9IG51bGwgJiYgZmxhZ3MudGFpbCkgZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICBsZXQgZGV0YWlscztcbiAgICAgIFtzdHIsIGRldGFpbHNdID0gdGhpcy5kb1ByZXBhcmUoc3RyLCBmbGFncyk7XG4gICAgICBmb3IgKGxldCBjaSA9IDA7IGNpIDwgc3RyLmxlbmd0aDsgKytjaSkge1xuICAgICAgICBjb25zdCBkID0gdGhpcy5fYXBwZW5kQ2hhcihzdHJbY2ldLCBmbGFncywgY2hlY2tUYWlsKTtcbiAgICAgICAgaWYgKCFkLnJhd0luc2VydGVkICYmICF0aGlzLmRvU2tpcEludmFsaWQoc3RyW2NpXSwgZmxhZ3MsIGNoZWNrVGFpbCkpIGJyZWFrO1xuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShkKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5lYWdlciA9PT0gdHJ1ZSB8fCB0aGlzLmVhZ2VyID09PSAnYXBwZW5kJykgJiYgZmxhZ3MgIT0gbnVsbCAmJiBmbGFncy5pbnB1dCAmJiBzdHIpIHtcbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5fYXBwZW5kRWFnZXIoKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGFwcGVuZCB0YWlsIGJ1dCBhZ2dyZWdhdGUgb25seSB0YWlsU2hpZnRcbiAgICAgIGlmIChjaGVja1RhaWwgIT0gbnVsbCkge1xuICAgICAgICBkZXRhaWxzLnRhaWxTaGlmdCArPSB0aGlzLmFwcGVuZFRhaWwoY2hlY2tUYWlsKS50YWlsU2hpZnQ7XG4gICAgICAgIC8vIFRPRE8gaXQncyBhIGdvb2QgaWRlYSB0byBjbGVhciBzdGF0ZSBhZnRlciBhcHBlbmRpbmcgZW5kc1xuICAgICAgICAvLyBidXQgaXQgY2F1c2VzIGJ1Z3Mgd2hlbiBvbmUgYXBwZW5kIGNhbGxzIGFub3RoZXIgKHdoZW4gZHluYW1pYyBkaXNwYXRjaCBzZXQgcmF3SW5wdXRWYWx1ZSlcbiAgICAgICAgLy8gdGhpcy5fcmVzZXRCZWZvcmVUYWlsU3RhdGUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICByZW1vdmUoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3ZhbHVlID0gdGhpcy5kaXNwbGF5VmFsdWUuc2xpY2UoMCwgZnJvbVBvcykgKyB0aGlzLmRpc3BsYXlWYWx1ZS5zbGljZSh0b1Bvcyk7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICB9XG5cbiAgICAvKiogQ2FsbHMgZnVuY3Rpb24gYW5kIHJlYXBwbGllcyBjdXJyZW50IHZhbHVlICovXG4gICAgd2l0aFZhbHVlUmVmcmVzaChmbikge1xuICAgICAgaWYgKHRoaXMuX3JlZnJlc2hpbmcgfHwgIXRoaXMuX2luaXRpYWxpemVkKSByZXR1cm4gZm4oKTtcbiAgICAgIHRoaXMuX3JlZnJlc2hpbmcgPSB0cnVlO1xuICAgICAgY29uc3QgcmF3SW5wdXQgPSB0aGlzLnJhd0lucHV0VmFsdWU7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICBjb25zdCByZXQgPSBmbigpO1xuICAgICAgdGhpcy5yYXdJbnB1dFZhbHVlID0gcmF3SW5wdXQ7XG4gICAgICAvLyBhcHBlbmQgbG9zdCB0cmFpbGluZyBjaGFycyBhdCB0aGUgZW5kXG4gICAgICBpZiAodGhpcy52YWx1ZSAmJiB0aGlzLnZhbHVlICE9PSB2YWx1ZSAmJiB2YWx1ZS5pbmRleE9mKHRoaXMudmFsdWUpID09PSAwKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKHZhbHVlLnNsaWNlKHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCksIHt9LCAnJyk7XG4gICAgICAgIHRoaXMuZG9Db21taXQoKTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLl9yZWZyZXNoaW5nO1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgcnVuSXNvbGF0ZWQoZm4pIHtcbiAgICAgIGlmICh0aGlzLl9pc29sYXRlZCB8fCAhdGhpcy5faW5pdGlhbGl6ZWQpIHJldHVybiBmbih0aGlzKTtcbiAgICAgIHRoaXMuX2lzb2xhdGVkID0gdHJ1ZTtcbiAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgIGNvbnN0IHJldCA9IGZuKHRoaXMpO1xuICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgICAgZGVsZXRlIHRoaXMuX2lzb2xhdGVkO1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgZG9Ta2lwSW52YWxpZChjaCwgZmxhZ3MsIGNoZWNrVGFpbCkge1xuICAgICAgcmV0dXJuIEJvb2xlYW4odGhpcy5za2lwSW52YWxpZCk7XG4gICAgfVxuXG4gICAgLyoqIFByZXBhcmVzIHN0cmluZyBiZWZvcmUgbWFzayBwcm9jZXNzaW5nICovXG4gICAgZG9QcmVwYXJlKHN0ciwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICByZXR1cm4gQ2hhbmdlRGV0YWlscy5ub3JtYWxpemUodGhpcy5wcmVwYXJlID8gdGhpcy5wcmVwYXJlKHN0ciwgdGhpcywgZmxhZ3MpIDogc3RyKTtcbiAgICB9XG5cbiAgICAvKiogUHJlcGFyZXMgZWFjaCBjaGFyIGJlZm9yZSBtYXNrIHByb2Nlc3NpbmcgKi9cbiAgICBkb1ByZXBhcmVDaGFyKHN0ciwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICByZXR1cm4gQ2hhbmdlRGV0YWlscy5ub3JtYWxpemUodGhpcy5wcmVwYXJlQ2hhciA/IHRoaXMucHJlcGFyZUNoYXIoc3RyLCB0aGlzLCBmbGFncykgOiBzdHIpO1xuICAgIH1cblxuICAgIC8qKiBWYWxpZGF0ZXMgaWYgdmFsdWUgaXMgYWNjZXB0YWJsZSAqL1xuICAgIGRvVmFsaWRhdGUoZmxhZ3MpIHtcbiAgICAgIHJldHVybiAoIXRoaXMudmFsaWRhdGUgfHwgdGhpcy52YWxpZGF0ZSh0aGlzLnZhbHVlLCB0aGlzLCBmbGFncykpICYmICghdGhpcy5wYXJlbnQgfHwgdGhpcy5wYXJlbnQuZG9WYWxpZGF0ZShmbGFncykpO1xuICAgIH1cblxuICAgIC8qKiBEb2VzIGFkZGl0aW9uYWwgcHJvY2Vzc2luZyBhdCB0aGUgZW5kIG9mIGVkaXRpbmcgKi9cbiAgICBkb0NvbW1pdCgpIHtcbiAgICAgIGlmICh0aGlzLmNvbW1pdCkgdGhpcy5jb21taXQodGhpcy52YWx1ZSwgdGhpcyk7XG4gICAgfVxuICAgIHNwbGljZShzdGFydCwgZGVsZXRlQ291bnQsIGluc2VydGVkLCByZW1vdmVEaXJlY3Rpb24sIGZsYWdzKSB7XG4gICAgICBpZiAoaW5zZXJ0ZWQgPT09IHZvaWQgMCkge1xuICAgICAgICBpbnNlcnRlZCA9ICcnO1xuICAgICAgfVxuICAgICAgaWYgKHJlbW92ZURpcmVjdGlvbiA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHJlbW92ZURpcmVjdGlvbiA9IERJUkVDVElPTi5OT05FO1xuICAgICAgfVxuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7XG4gICAgICAgICAgaW5wdXQ6IHRydWVcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRhaWxQb3MgPSBzdGFydCArIGRlbGV0ZUNvdW50O1xuICAgICAgY29uc3QgdGFpbCA9IHRoaXMuZXh0cmFjdFRhaWwodGFpbFBvcyk7XG4gICAgICBjb25zdCBlYWdlclJlbW92ZSA9IHRoaXMuZWFnZXIgPT09IHRydWUgfHwgdGhpcy5lYWdlciA9PT0gJ3JlbW92ZSc7XG4gICAgICBsZXQgb2xkUmF3VmFsdWU7XG4gICAgICBpZiAoZWFnZXJSZW1vdmUpIHtcbiAgICAgICAgcmVtb3ZlRGlyZWN0aW9uID0gZm9yY2VEaXJlY3Rpb24ocmVtb3ZlRGlyZWN0aW9uKTtcbiAgICAgICAgb2xkUmF3VmFsdWUgPSB0aGlzLmV4dHJhY3RJbnB1dCgwLCB0YWlsUG9zLCB7XG4gICAgICAgICAgcmF3OiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgbGV0IHN0YXJ0Q2hhbmdlUG9zID0gc3RhcnQ7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcblxuICAgICAgLy8gaWYgaXQgaXMganVzdCBkZWxldGlvbiB3aXRob3V0IGluc2VydGlvblxuICAgICAgaWYgKHJlbW92ZURpcmVjdGlvbiAhPT0gRElSRUNUSU9OLk5PTkUpIHtcbiAgICAgICAgc3RhcnRDaGFuZ2VQb3MgPSB0aGlzLm5lYXJlc3RJbnB1dFBvcyhzdGFydCwgZGVsZXRlQ291bnQgPiAxICYmIHN0YXJ0ICE9PSAwICYmICFlYWdlclJlbW92ZSA/IERJUkVDVElPTi5OT05FIDogcmVtb3ZlRGlyZWN0aW9uKTtcblxuICAgICAgICAvLyBhZGp1c3QgdGFpbFNoaWZ0IGlmIHN0YXJ0IHdhcyBhbGlnbmVkXG4gICAgICAgIGRldGFpbHMudGFpbFNoaWZ0ID0gc3RhcnRDaGFuZ2VQb3MgLSBzdGFydDtcbiAgICAgIH1cbiAgICAgIGRldGFpbHMuYWdncmVnYXRlKHRoaXMucmVtb3ZlKHN0YXJ0Q2hhbmdlUG9zKSk7XG4gICAgICBpZiAoZWFnZXJSZW1vdmUgJiYgcmVtb3ZlRGlyZWN0aW9uICE9PSBESVJFQ1RJT04uTk9ORSAmJiBvbGRSYXdWYWx1ZSA9PT0gdGhpcy5yYXdJbnB1dFZhbHVlKSB7XG4gICAgICAgIGlmIChyZW1vdmVEaXJlY3Rpb24gPT09IERJUkVDVElPTi5GT1JDRV9MRUZUKSB7XG4gICAgICAgICAgbGV0IHZhbExlbmd0aDtcbiAgICAgICAgICB3aGlsZSAob2xkUmF3VmFsdWUgPT09IHRoaXMucmF3SW5wdXRWYWx1ZSAmJiAodmFsTGVuZ3RoID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoKSkge1xuICAgICAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUobmV3IENoYW5nZURldGFpbHMoe1xuICAgICAgICAgICAgICB0YWlsU2hpZnQ6IC0xXG4gICAgICAgICAgICB9KSkuYWdncmVnYXRlKHRoaXMucmVtb3ZlKHZhbExlbmd0aCAtIDEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocmVtb3ZlRGlyZWN0aW9uID09PSBESVJFQ1RJT04uRk9SQ0VfUklHSFQpIHtcbiAgICAgICAgICB0YWlsLnVuc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuYXBwZW5kKGluc2VydGVkLCBmbGFncywgdGFpbCkpO1xuICAgIH1cbiAgICBtYXNrRXF1YWxzKG1hc2spIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2sgPT09IG1hc2s7XG4gICAgfVxuICAgIG9wdGlvbnNJc0NoYW5nZWQob3B0cykge1xuICAgICAgcmV0dXJuICFvYmplY3RJbmNsdWRlcyh0aGlzLCBvcHRzKTtcbiAgICB9XG4gICAgdHlwZWRWYWx1ZUVxdWFscyh2YWx1ZSkge1xuICAgICAgY29uc3QgdHZhbCA9IHRoaXMudHlwZWRWYWx1ZTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gdHZhbCB8fCBNYXNrZWQuRU1QVFlfVkFMVUVTLmluY2x1ZGVzKHZhbHVlKSAmJiBNYXNrZWQuRU1QVFlfVkFMVUVTLmluY2x1ZGVzKHR2YWwpIHx8ICh0aGlzLmZvcm1hdCA/IHRoaXMuZm9ybWF0KHZhbHVlLCB0aGlzKSA9PT0gdGhpcy5mb3JtYXQodGhpcy50eXBlZFZhbHVlLCB0aGlzKSA6IGZhbHNlKTtcbiAgICB9XG4gICAgcGFkKGZsYWdzKSB7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICB9XG4gIH1cbiAgTWFza2VkLkRFRkFVTFRTID0ge1xuICAgIHNraXBJbnZhbGlkOiB0cnVlXG4gIH07XG4gIE1hc2tlZC5FTVBUWV9WQUxVRVMgPSBbdW5kZWZpbmVkLCBudWxsLCAnJ107XG4gIElNYXNrLk1hc2tlZCA9IE1hc2tlZDtcblxuICBjbGFzcyBDaHVua3NUYWlsRGV0YWlscyB7XG4gICAgLyoqICovXG5cbiAgICBjb25zdHJ1Y3RvcihjaHVua3MsIGZyb20pIHtcbiAgICAgIGlmIChjaHVua3MgPT09IHZvaWQgMCkge1xuICAgICAgICBjaHVua3MgPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmIChmcm9tID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbSA9IDA7XG4gICAgICB9XG4gICAgICB0aGlzLmNodW5rcyA9IGNodW5rcztcbiAgICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgfVxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2h1bmtzLm1hcChTdHJpbmcpLmpvaW4oJycpO1xuICAgIH1cbiAgICBleHRlbmQodGFpbENodW5rKSB7XG4gICAgICBpZiAoIVN0cmluZyh0YWlsQ2h1bmspKSByZXR1cm47XG4gICAgICB0YWlsQ2h1bmsgPSBpc1N0cmluZyh0YWlsQ2h1bmspID8gbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscyhTdHJpbmcodGFpbENodW5rKSkgOiB0YWlsQ2h1bms7XG4gICAgICBjb25zdCBsYXN0Q2h1bmsgPSB0aGlzLmNodW5rc1t0aGlzLmNodW5rcy5sZW5ndGggLSAxXTtcbiAgICAgIGNvbnN0IGV4dGVuZExhc3QgPSBsYXN0Q2h1bmsgJiYgKFxuICAgICAgLy8gaWYgc3RvcHMgYXJlIHNhbWUgb3IgdGFpbCBoYXMgbm8gc3RvcFxuICAgICAgbGFzdENodW5rLnN0b3AgPT09IHRhaWxDaHVuay5zdG9wIHx8IHRhaWxDaHVuay5zdG9wID09IG51bGwpICYmXG4gICAgICAvLyBpZiB0YWlsIGNodW5rIGdvZXMganVzdCBhZnRlciBsYXN0IGNodW5rXG4gICAgICB0YWlsQ2h1bmsuZnJvbSA9PT0gbGFzdENodW5rLmZyb20gKyBsYXN0Q2h1bmsudG9TdHJpbmcoKS5sZW5ndGg7XG4gICAgICBpZiAodGFpbENodW5rIGluc3RhbmNlb2YgQ29udGludW91c1RhaWxEZXRhaWxzKSB7XG4gICAgICAgIC8vIGNoZWNrIHRoZSBhYmlsaXR5IHRvIGV4dGVuZCBwcmV2aW91cyBjaHVua1xuICAgICAgICBpZiAoZXh0ZW5kTGFzdCkge1xuICAgICAgICAgIC8vIGV4dGVuZCBwcmV2aW91cyBjaHVua1xuICAgICAgICAgIGxhc3RDaHVuay5leHRlbmQodGFpbENodW5rLnRvU3RyaW5nKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGFwcGVuZCBuZXcgY2h1bmtcbiAgICAgICAgICB0aGlzLmNodW5rcy5wdXNoKHRhaWxDaHVuayk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGFpbENodW5rIGluc3RhbmNlb2YgQ2h1bmtzVGFpbERldGFpbHMpIHtcbiAgICAgICAgaWYgKHRhaWxDaHVuay5zdG9wID09IG51bGwpIHtcbiAgICAgICAgICAvLyB1bndyYXAgZmxvYXRpbmcgY2h1bmtzIHRvIHBhcmVudCwga2VlcGluZyBgZnJvbWAgcG9zXG4gICAgICAgICAgbGV0IGZpcnN0VGFpbENodW5rO1xuICAgICAgICAgIHdoaWxlICh0YWlsQ2h1bmsuY2h1bmtzLmxlbmd0aCAmJiB0YWlsQ2h1bmsuY2h1bmtzWzBdLnN0b3AgPT0gbnVsbCkge1xuICAgICAgICAgICAgZmlyc3RUYWlsQ2h1bmsgPSB0YWlsQ2h1bmsuY2h1bmtzLnNoaWZ0KCk7IC8vIG5vdCBwb3NzaWJsZSB0byBiZSBgdW5kZWZpbmVkYCBiZWNhdXNlIGxlbmd0aCB3YXMgY2hlY2tlZCBhYm92ZVxuICAgICAgICAgICAgZmlyc3RUYWlsQ2h1bmsuZnJvbSArPSB0YWlsQ2h1bmsuZnJvbTtcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5kKGZpcnN0VGFpbENodW5rKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0YWlsIGNodW5rIHN0aWxsIGhhcyB2YWx1ZVxuICAgICAgICBpZiAodGFpbENodW5rLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgICAvLyBpZiBjaHVua3MgY29udGFpbnMgc3RvcHMsIHRoZW4gcG9wdXAgc3RvcCB0byBjb250YWluZXJcbiAgICAgICAgICB0YWlsQ2h1bmsuc3RvcCA9IHRhaWxDaHVuay5ibG9ja0luZGV4O1xuICAgICAgICAgIHRoaXMuY2h1bmtzLnB1c2godGFpbENodW5rKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBhcHBlbmRUbyhtYXNrZWQpIHtcbiAgICAgIGlmICghKG1hc2tlZCBpbnN0YW5jZW9mIElNYXNrLk1hc2tlZFBhdHRlcm4pKSB7XG4gICAgICAgIGNvbnN0IHRhaWwgPSBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKHRoaXMudG9TdHJpbmcoKSk7XG4gICAgICAgIHJldHVybiB0YWlsLmFwcGVuZFRvKG1hc2tlZCk7XG4gICAgICB9XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGZvciAobGV0IGNpID0gMDsgY2kgPCB0aGlzLmNodW5rcy5sZW5ndGg7ICsrY2kpIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSB0aGlzLmNodW5rc1tjaV07XG4gICAgICAgIGNvbnN0IGxhc3RCbG9ja0l0ZXIgPSBtYXNrZWQuX21hcFBvc1RvQmxvY2sobWFza2VkLmRpc3BsYXlWYWx1ZS5sZW5ndGgpO1xuICAgICAgICBjb25zdCBzdG9wID0gY2h1bmsuc3RvcDtcbiAgICAgICAgbGV0IGNodW5rQmxvY2s7XG4gICAgICAgIGlmIChzdG9wICE9IG51bGwgJiYgKFxuICAgICAgICAvLyBpZiBibG9jayBub3QgZm91bmQgb3Igc3RvcCBpcyBiZWhpbmQgbGFzdEJsb2NrXG4gICAgICAgICFsYXN0QmxvY2tJdGVyIHx8IGxhc3RCbG9ja0l0ZXIuaW5kZXggPD0gc3RvcCkpIHtcbiAgICAgICAgICBpZiAoY2h1bmsgaW5zdGFuY2VvZiBDaHVua3NUYWlsRGV0YWlscyB8fFxuICAgICAgICAgIC8vIGZvciBjb250aW51b3VzIGJsb2NrIGFsc28gY2hlY2sgaWYgc3RvcCBpcyBleGlzdFxuICAgICAgICAgIG1hc2tlZC5fc3RvcHMuaW5kZXhPZihzdG9wKSA+PSAwKSB7XG4gICAgICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShtYXNrZWQuX2FwcGVuZFBsYWNlaG9sZGVyKHN0b3ApKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2h1bmtCbG9jayA9IGNodW5rIGluc3RhbmNlb2YgQ2h1bmtzVGFpbERldGFpbHMgJiYgbWFza2VkLl9ibG9ja3Nbc3RvcF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNodW5rQmxvY2spIHtcbiAgICAgICAgICBjb25zdCB0YWlsRGV0YWlscyA9IGNodW5rQmxvY2suYXBwZW5kVGFpbChjaHVuayk7XG4gICAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUodGFpbERldGFpbHMpO1xuXG4gICAgICAgICAgLy8gZ2V0IG5vdCBpbnNlcnRlZCBjaGFyc1xuICAgICAgICAgIGNvbnN0IHJlbWFpbkNoYXJzID0gY2h1bmsudG9TdHJpbmcoKS5zbGljZSh0YWlsRGV0YWlscy5yYXdJbnNlcnRlZC5sZW5ndGgpO1xuICAgICAgICAgIGlmIChyZW1haW5DaGFycykgZGV0YWlscy5hZ2dyZWdhdGUobWFza2VkLmFwcGVuZChyZW1haW5DaGFycywge1xuICAgICAgICAgICAgdGFpbDogdHJ1ZVxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShtYXNrZWQuYXBwZW5kKGNodW5rLnRvU3RyaW5nKCksIHtcbiAgICAgICAgICAgIHRhaWw6IHRydWVcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjaHVua3M6IHRoaXMuY2h1bmtzLm1hcChjID0+IGMuc3RhdGUpLFxuICAgICAgICBmcm9tOiB0aGlzLmZyb20sXG4gICAgICAgIHN0b3A6IHRoaXMuc3RvcCxcbiAgICAgICAgYmxvY2tJbmRleDogdGhpcy5ibG9ja0luZGV4XG4gICAgICB9O1xuICAgIH1cbiAgICBzZXQgc3RhdGUoc3RhdGUpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgY2h1bmtzLFxuICAgICAgICAuLi5wcm9wc1xuICAgICAgfSA9IHN0YXRlO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBwcm9wcyk7XG4gICAgICB0aGlzLmNodW5rcyA9IGNodW5rcy5tYXAoY3N0YXRlID0+IHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSBcImNodW5rc1wiIGluIGNzdGF0ZSA/IG5ldyBDaHVua3NUYWlsRGV0YWlscygpIDogbmV3IENvbnRpbnVvdXNUYWlsRGV0YWlscygpO1xuICAgICAgICBjaHVuay5zdGF0ZSA9IGNzdGF0ZTtcbiAgICAgICAgcmV0dXJuIGNodW5rO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHVuc2hpZnQoYmVmb3JlUG9zKSB7XG4gICAgICBpZiAoIXRoaXMuY2h1bmtzLmxlbmd0aCB8fCBiZWZvcmVQb3MgIT0gbnVsbCAmJiB0aGlzLmZyb20gPj0gYmVmb3JlUG9zKSByZXR1cm4gJyc7XG4gICAgICBjb25zdCBjaHVua1NoaWZ0UG9zID0gYmVmb3JlUG9zICE9IG51bGwgPyBiZWZvcmVQb3MgLSB0aGlzLmZyb20gOiBiZWZvcmVQb3M7XG4gICAgICBsZXQgY2kgPSAwO1xuICAgICAgd2hpbGUgKGNpIDwgdGhpcy5jaHVua3MubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGNodW5rID0gdGhpcy5jaHVua3NbY2ldO1xuICAgICAgICBjb25zdCBzaGlmdENoYXIgPSBjaHVuay51bnNoaWZ0KGNodW5rU2hpZnRQb3MpO1xuICAgICAgICBpZiAoY2h1bmsudG9TdHJpbmcoKSkge1xuICAgICAgICAgIC8vIGNodW5rIHN0aWxsIGNvbnRhaW5zIHZhbHVlXG4gICAgICAgICAgLy8gYnV0IG5vdCBzaGlmdGVkIC0gbWVhbnMgbm8gbW9yZSBhdmFpbGFibGUgY2hhcnMgdG8gc2hpZnRcbiAgICAgICAgICBpZiAoIXNoaWZ0Q2hhcikgYnJlYWs7XG4gICAgICAgICAgKytjaTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBjbGVhbiBpZiBjaHVuayBoYXMgbm8gdmFsdWVcbiAgICAgICAgICB0aGlzLmNodW5rcy5zcGxpY2UoY2ksIDEpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaGlmdENoYXIpIHJldHVybiBzaGlmdENoYXI7XG4gICAgICB9XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHNoaWZ0KCkge1xuICAgICAgaWYgKCF0aGlzLmNodW5rcy5sZW5ndGgpIHJldHVybiAnJztcbiAgICAgIGxldCBjaSA9IHRoaXMuY2h1bmtzLmxlbmd0aCAtIDE7XG4gICAgICB3aGlsZSAoMCA8PSBjaSkge1xuICAgICAgICBjb25zdCBjaHVuayA9IHRoaXMuY2h1bmtzW2NpXTtcbiAgICAgICAgY29uc3Qgc2hpZnRDaGFyID0gY2h1bmsuc2hpZnQoKTtcbiAgICAgICAgaWYgKGNodW5rLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgICAvLyBjaHVuayBzdGlsbCBjb250YWlucyB2YWx1ZVxuICAgICAgICAgIC8vIGJ1dCBub3Qgc2hpZnRlZCAtIG1lYW5zIG5vIG1vcmUgYXZhaWxhYmxlIGNoYXJzIHRvIHNoaWZ0XG4gICAgICAgICAgaWYgKCFzaGlmdENoYXIpIGJyZWFrO1xuICAgICAgICAgIC0tY2k7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gY2xlYW4gaWYgY2h1bmsgaGFzIG5vIHZhbHVlXG4gICAgICAgICAgdGhpcy5jaHVua3Muc3BsaWNlKGNpLCAxKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hpZnRDaGFyKSByZXR1cm4gc2hpZnRDaGFyO1xuICAgICAgfVxuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIFBhdHRlcm5DdXJzb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1hc2tlZCwgcG9zKSB7XG4gICAgICB0aGlzLm1hc2tlZCA9IG1hc2tlZDtcbiAgICAgIHRoaXMuX2xvZyA9IFtdO1xuICAgICAgY29uc3Qge1xuICAgICAgICBvZmZzZXQsXG4gICAgICAgIGluZGV4XG4gICAgICB9ID0gbWFza2VkLl9tYXBQb3NUb0Jsb2NrKHBvcykgfHwgKHBvcyA8IDAgP1xuICAgICAgLy8gZmlyc3RcbiAgICAgIHtcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICAgIG9mZnNldDogMFxuICAgICAgfSA6XG4gICAgICAvLyBsYXN0XG4gICAgICB7XG4gICAgICAgIGluZGV4OiB0aGlzLm1hc2tlZC5fYmxvY2tzLmxlbmd0aCxcbiAgICAgICAgb2Zmc2V0OiAwXG4gICAgICB9KTtcbiAgICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgICAgdGhpcy5vayA9IGZhbHNlO1xuICAgIH1cbiAgICBnZXQgYmxvY2soKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQuX2Jsb2Nrc1t0aGlzLmluZGV4XTtcbiAgICB9XG4gICAgZ2V0IHBvcygpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5fYmxvY2tTdGFydFBvcyh0aGlzLmluZGV4KSArIHRoaXMub2Zmc2V0O1xuICAgIH1cbiAgICBnZXQgc3RhdGUoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpbmRleDogdGhpcy5pbmRleCxcbiAgICAgICAgb2Zmc2V0OiB0aGlzLm9mZnNldCxcbiAgICAgICAgb2s6IHRoaXMub2tcbiAgICAgIH07XG4gICAgfVxuICAgIHNldCBzdGF0ZShzKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHMpO1xuICAgIH1cbiAgICBwdXNoU3RhdGUoKSB7XG4gICAgICB0aGlzLl9sb2cucHVzaCh0aGlzLnN0YXRlKTtcbiAgICB9XG4gICAgcG9wU3RhdGUoKSB7XG4gICAgICBjb25zdCBzID0gdGhpcy5fbG9nLnBvcCgpO1xuICAgICAgaWYgKHMpIHRoaXMuc3RhdGUgPSBzO1xuICAgICAgcmV0dXJuIHM7XG4gICAgfVxuICAgIGJpbmRCbG9jaygpIHtcbiAgICAgIGlmICh0aGlzLmJsb2NrKSByZXR1cm47XG4gICAgICBpZiAodGhpcy5pbmRleCA8IDApIHtcbiAgICAgICAgdGhpcy5pbmRleCA9IDA7XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMubWFza2VkLl9ibG9ja3MubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuaW5kZXggPSB0aGlzLm1hc2tlZC5fYmxvY2tzLmxlbmd0aCAtIDE7XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gdGhpcy5ibG9jay5kaXNwbGF5VmFsdWUubGVuZ3RoOyAvLyBUT0RPIHRoaXMgaXMgc3R1cGlkIHR5cGUgZXJyb3IsIGBibG9ja2AgZGVwZW5kcyBvbiBpbmRleCB0aGF0IHdhcyBjaGFuZ2VkIGFib3ZlXG4gICAgICB9XG4gICAgfVxuICAgIF9wdXNoTGVmdChmbikge1xuICAgICAgdGhpcy5wdXNoU3RhdGUoKTtcbiAgICAgIGZvciAodGhpcy5iaW5kQmxvY2soKTsgMCA8PSB0aGlzLmluZGV4OyAtLXRoaXMuaW5kZXgsIHRoaXMub2Zmc2V0ID0gKChfdGhpcyRibG9jayA9IHRoaXMuYmxvY2spID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRibG9jay5kaXNwbGF5VmFsdWUubGVuZ3RoKSB8fCAwKSB7XG4gICAgICAgIHZhciBfdGhpcyRibG9jaztcbiAgICAgICAgaWYgKGZuKCkpIHJldHVybiB0aGlzLm9rID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm9rID0gZmFsc2U7XG4gICAgfVxuICAgIF9wdXNoUmlnaHQoZm4pIHtcbiAgICAgIHRoaXMucHVzaFN0YXRlKCk7XG4gICAgICBmb3IgKHRoaXMuYmluZEJsb2NrKCk7IHRoaXMuaW5kZXggPCB0aGlzLm1hc2tlZC5fYmxvY2tzLmxlbmd0aDsgKyt0aGlzLmluZGV4LCB0aGlzLm9mZnNldCA9IDApIHtcbiAgICAgICAgaWYgKGZuKCkpIHJldHVybiB0aGlzLm9rID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm9rID0gZmFsc2U7XG4gICAgfVxuICAgIHB1c2hMZWZ0QmVmb3JlRmlsbGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hMZWZ0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYmxvY2suaXNGaXhlZCB8fCAhdGhpcy5ibG9jay52YWx1ZSkgcmV0dXJuO1xuICAgICAgICB0aGlzLm9mZnNldCA9IHRoaXMuYmxvY2submVhcmVzdElucHV0UG9zKHRoaXMub2Zmc2V0LCBESVJFQ1RJT04uRk9SQ0VfTEVGVCk7XG4gICAgICAgIGlmICh0aGlzLm9mZnNldCAhPT0gMCkgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcHVzaExlZnRCZWZvcmVJbnB1dCgpIHtcbiAgICAgIC8vIGNhc2VzOlxuICAgICAgLy8gZmlsbGVkIGlucHV0OiAwMHxcbiAgICAgIC8vIG9wdGlvbmFsIGVtcHR5IGlucHV0OiAwMFtdfFxuICAgICAgLy8gbmVzdGVkIGJsb2NrOiBYWDxbXT58XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaExlZnQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5ibG9jay5pc0ZpeGVkKSByZXR1cm47XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gdGhpcy5ibG9jay5uZWFyZXN0SW5wdXRQb3ModGhpcy5vZmZzZXQsIERJUkVDVElPTi5MRUZUKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcHVzaExlZnRCZWZvcmVSZXF1aXJlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdXNoTGVmdCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmJsb2NrLmlzRml4ZWQgfHwgdGhpcy5ibG9jay5pc09wdGlvbmFsICYmICF0aGlzLmJsb2NrLnZhbHVlKSByZXR1cm47XG4gICAgICAgIHRoaXMub2Zmc2V0ID0gdGhpcy5ibG9jay5uZWFyZXN0SW5wdXRQb3ModGhpcy5vZmZzZXQsIERJUkVDVElPTi5MRUZUKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcHVzaFJpZ2h0QmVmb3JlRmlsbGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3B1c2hSaWdodCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmJsb2NrLmlzRml4ZWQgfHwgIXRoaXMuYmxvY2sudmFsdWUpIHJldHVybjtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmJsb2NrLm5lYXJlc3RJbnB1dFBvcyh0aGlzLm9mZnNldCwgRElSRUNUSU9OLkZPUkNFX1JJR0hUKTtcbiAgICAgICAgaWYgKHRoaXMub2Zmc2V0ICE9PSB0aGlzLmJsb2NrLnZhbHVlLmxlbmd0aCkgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcHVzaFJpZ2h0QmVmb3JlSW5wdXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaFJpZ2h0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYmxvY2suaXNGaXhlZCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIGNvbnN0IG8gPSB0aGlzLm9mZnNldDtcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmJsb2NrLm5lYXJlc3RJbnB1dFBvcyh0aGlzLm9mZnNldCwgRElSRUNUSU9OLk5PTkUpO1xuICAgICAgICAvLyBIQUNLIGNhc2VzIGxpa2UgKFNUSUxMIERPRVMgTk9UIFdPUksgRk9SIE5FU1RFRClcbiAgICAgICAgLy8gYWF8WFxuICAgICAgICAvLyBhYTxYfFtdPlhfICAgIC0gdGhpcyB3aWxsIG5vdCB3b3JrXG4gICAgICAgIC8vIGlmIChvICYmIG8gPT09IHRoaXMub2Zmc2V0ICYmIHRoaXMuYmxvY2sgaW5zdGFuY2VvZiBQYXR0ZXJuSW5wdXREZWZpbml0aW9uKSBjb250aW51ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcHVzaFJpZ2h0QmVmb3JlUmVxdWlyZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcHVzaFJpZ2h0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuYmxvY2suaXNGaXhlZCB8fCB0aGlzLmJsb2NrLmlzT3B0aW9uYWwgJiYgIXRoaXMuYmxvY2sudmFsdWUpIHJldHVybjtcblxuICAgICAgICAvLyBUT0RPIGNoZWNrIHxbKl1YWF9cbiAgICAgICAgdGhpcy5vZmZzZXQgPSB0aGlzLmJsb2NrLm5lYXJlc3RJbnB1dFBvcyh0aGlzLm9mZnNldCwgRElSRUNUSU9OLk5PTkUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNsYXNzIFBhdHRlcm5GaXhlZERlZmluaXRpb24ge1xuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgb3B0cyk7XG4gICAgICB0aGlzLl92YWx1ZSA9ICcnO1xuICAgICAgdGhpcy5pc0ZpeGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICAgIH1cbiAgICBnZXQgdW5tYXNrZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlzVW5tYXNraW5nID8gdGhpcy52YWx1ZSA6ICcnO1xuICAgIH1cbiAgICBnZXQgcmF3SW5wdXRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pc1Jhd0lucHV0ID8gdGhpcy52YWx1ZSA6ICcnO1xuICAgIH1cbiAgICBnZXQgZGlzcGxheVZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgdGhpcy5faXNSYXdJbnB1dCA9IGZhbHNlO1xuICAgICAgdGhpcy5fdmFsdWUgPSAnJztcbiAgICB9XG4gICAgcmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLl92YWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuX3ZhbHVlLnNsaWNlKDAsIGZyb21Qb3MpICsgdGhpcy5fdmFsdWUuc2xpY2UodG9Qb3MpO1xuICAgICAgaWYgKCF0aGlzLl92YWx1ZSkgdGhpcy5faXNSYXdJbnB1dCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgfVxuICAgIG5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIGRpcmVjdGlvbikge1xuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IERJUkVDVElPTi5OT05FO1xuICAgICAgfVxuICAgICAgY29uc3QgbWluUG9zID0gMDtcbiAgICAgIGNvbnN0IG1heFBvcyA9IHRoaXMuX3ZhbHVlLmxlbmd0aDtcbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkxFRlQ6XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkZPUkNFX0xFRlQ6XG4gICAgICAgICAgcmV0dXJuIG1pblBvcztcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uTk9ORTpcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uUklHSFQ6XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkZPUkNFX1JJR0hUOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBtYXhQb3M7XG4gICAgICB9XG4gICAgfVxuICAgIHRvdGFsSW5wdXRQb3NpdGlvbnMoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuX3ZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9pc1Jhd0lucHV0ID8gdG9Qb3MgLSBmcm9tUG9zIDogMDtcbiAgICB9XG4gICAgZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5fdmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmbGFncy5yYXcgJiYgdGhpcy5faXNSYXdJbnB1dCAmJiB0aGlzLl92YWx1ZS5zbGljZShmcm9tUG9zLCB0b1BvcykgfHwgJyc7XG4gICAgfVxuICAgIGdldCBpc0NvbXBsZXRlKCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGdldCBpc0ZpbGxlZCgpIHtcbiAgICAgIHJldHVybiBCb29sZWFuKHRoaXMuX3ZhbHVlKTtcbiAgICB9XG4gICAgX2FwcGVuZENoYXIoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNGaWxsZWQpIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgY29uc3QgYXBwZW5kRWFnZXIgPSB0aGlzLmVhZ2VyID09PSB0cnVlIHx8IHRoaXMuZWFnZXIgPT09ICdhcHBlbmQnO1xuICAgICAgY29uc3QgYXBwZW5kZWQgPSB0aGlzLmNoYXIgPT09IGNoO1xuICAgICAgY29uc3QgaXNSZXNvbHZlZCA9IGFwcGVuZGVkICYmICh0aGlzLmlzVW5tYXNraW5nIHx8IGZsYWdzLmlucHV0IHx8IGZsYWdzLnJhdykgJiYgKCFmbGFncy5yYXcgfHwgIWFwcGVuZEVhZ2VyKSAmJiAhZmxhZ3MudGFpbDtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscyh7XG4gICAgICAgIGluc2VydGVkOiB0aGlzLmNoYXIsXG4gICAgICAgIHJhd0luc2VydGVkOiBpc1Jlc29sdmVkID8gdGhpcy5jaGFyIDogJydcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLmNoYXI7XG4gICAgICB0aGlzLl9pc1Jhd0lucHV0ID0gaXNSZXNvbHZlZCAmJiAoZmxhZ3MucmF3IHx8IGZsYWdzLmlucHV0KTtcbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBfYXBwZW5kRWFnZXIoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYXBwZW5kQ2hhcih0aGlzLmNoYXIsIHtcbiAgICAgICAgdGFpbDogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIF9hcHBlbmRQbGFjZWhvbGRlcigpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgaWYgKHRoaXMuaXNGaWxsZWQpIHJldHVybiBkZXRhaWxzO1xuICAgICAgdGhpcy5fdmFsdWUgPSBkZXRhaWxzLmluc2VydGVkID0gdGhpcy5jaGFyO1xuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIGV4dHJhY3RUYWlsKCkge1xuICAgICAgcmV0dXJuIG5ldyBDb250aW51b3VzVGFpbERldGFpbHMoJycpO1xuICAgIH1cbiAgICBhcHBlbmRUYWlsKHRhaWwpIHtcbiAgICAgIGlmIChpc1N0cmluZyh0YWlsKSkgdGFpbCA9IG5ldyBDb250aW51b3VzVGFpbERldGFpbHMoU3RyaW5nKHRhaWwpKTtcbiAgICAgIHJldHVybiB0YWlsLmFwcGVuZFRvKHRoaXMpO1xuICAgIH1cbiAgICBhcHBlbmQoc3RyLCBmbGFncywgdGFpbCkge1xuICAgICAgY29uc3QgZGV0YWlscyA9IHRoaXMuX2FwcGVuZENoYXIoc3RyWzBdLCBmbGFncyk7XG4gICAgICBpZiAodGFpbCAhPSBudWxsKSB7XG4gICAgICAgIGRldGFpbHMudGFpbFNoaWZ0ICs9IHRoaXMuYXBwZW5kVGFpbCh0YWlsKS50YWlsU2hpZnQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgZG9Db21taXQoKSB7fVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIF92YWx1ZTogdGhpcy5fdmFsdWUsXG4gICAgICAgIF9yYXdJbnB1dFZhbHVlOiB0aGlzLnJhd0lucHV0VmFsdWVcbiAgICAgIH07XG4gICAgfVxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xuICAgICAgdGhpcy5fdmFsdWUgPSBzdGF0ZS5fdmFsdWU7XG4gICAgICB0aGlzLl9pc1Jhd0lucHV0ID0gQm9vbGVhbihzdGF0ZS5fcmF3SW5wdXRWYWx1ZSk7XG4gICAgfVxuICAgIHBhZChmbGFncykge1xuICAgICAgcmV0dXJuIHRoaXMuX2FwcGVuZFBsYWNlaG9sZGVyKCk7XG4gICAgfVxuICB9XG5cbiAgY2xhc3MgUGF0dGVybklucHV0RGVmaW5pdGlvbiB7XG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgcGFyZW50LFxuICAgICAgICBpc09wdGlvbmFsLFxuICAgICAgICBwbGFjZWhvbGRlckNoYXIsXG4gICAgICAgIGRpc3BsYXlDaGFyLFxuICAgICAgICBsYXp5LFxuICAgICAgICBlYWdlcixcbiAgICAgICAgLi4ubWFza09wdHNcbiAgICAgIH0gPSBvcHRzO1xuICAgICAgdGhpcy5tYXNrZWQgPSBjcmVhdGVNYXNrKG1hc2tPcHRzKTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywge1xuICAgICAgICBwYXJlbnQsXG4gICAgICAgIGlzT3B0aW9uYWwsXG4gICAgICAgIHBsYWNlaG9sZGVyQ2hhcixcbiAgICAgICAgZGlzcGxheUNoYXIsXG4gICAgICAgIGxhenksXG4gICAgICAgIGVhZ2VyXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICB0aGlzLmlzRmlsbGVkID0gZmFsc2U7XG4gICAgICB0aGlzLm1hc2tlZC5yZXNldCgpO1xuICAgIH1cbiAgICByZW1vdmUoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMudmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGZyb21Qb3MgPT09IDAgJiYgdG9Qb3MgPj0gMSkge1xuICAgICAgICB0aGlzLmlzRmlsbGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5yZW1vdmUoZnJvbVBvcywgdG9Qb3MpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgfVxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC52YWx1ZSB8fCAodGhpcy5pc0ZpbGxlZCAmJiAhdGhpcy5pc09wdGlvbmFsID8gdGhpcy5wbGFjZWhvbGRlckNoYXIgOiAnJyk7XG4gICAgfVxuICAgIGdldCB1bm1hc2tlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLnVubWFza2VkVmFsdWU7XG4gICAgfVxuICAgIGdldCByYXdJbnB1dFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkLnJhd0lucHV0VmFsdWU7XG4gICAgfVxuICAgIGdldCBkaXNwbGF5VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQudmFsdWUgJiYgdGhpcy5kaXNwbGF5Q2hhciB8fCB0aGlzLnZhbHVlO1xuICAgIH1cbiAgICBnZXQgaXNDb21wbGV0ZSgpIHtcbiAgICAgIHJldHVybiBCb29sZWFuKHRoaXMubWFza2VkLnZhbHVlKSB8fCB0aGlzLmlzT3B0aW9uYWw7XG4gICAgfVxuICAgIF9hcHBlbmRDaGFyKGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlzRmlsbGVkKSByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tYXNrZWQuc3RhdGU7XG4gICAgICAvLyBzaW11bGF0ZSBpbnB1dFxuICAgICAgbGV0IGRldGFpbHMgPSB0aGlzLm1hc2tlZC5fYXBwZW5kQ2hhcihjaCwgdGhpcy5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSk7XG4gICAgICBpZiAoZGV0YWlscy5pbnNlcnRlZCAmJiB0aGlzLmRvVmFsaWRhdGUoZmxhZ3MpID09PSBmYWxzZSkge1xuICAgICAgICBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgICAgdGhpcy5tYXNrZWQuc3RhdGUgPSBzdGF0ZTtcbiAgICAgIH1cbiAgICAgIGlmICghZGV0YWlscy5pbnNlcnRlZCAmJiAhdGhpcy5pc09wdGlvbmFsICYmICF0aGlzLmxhenkgJiYgIWZsYWdzLmlucHV0KSB7XG4gICAgICAgIGRldGFpbHMuaW5zZXJ0ZWQgPSB0aGlzLnBsYWNlaG9sZGVyQ2hhcjtcbiAgICAgIH1cbiAgICAgIGRldGFpbHMuc2tpcCA9ICFkZXRhaWxzLmluc2VydGVkICYmICF0aGlzLmlzT3B0aW9uYWw7XG4gICAgICB0aGlzLmlzRmlsbGVkID0gQm9vbGVhbihkZXRhaWxzLmluc2VydGVkKTtcbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBhcHBlbmQoc3RyLCBmbGFncywgdGFpbCkge1xuICAgICAgLy8gVE9ETyBwcm9iYWJseSBzaG91bGQgYmUgZG9uZSB2aWEgX2FwcGVuZENoYXJcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5hcHBlbmQoc3RyLCB0aGlzLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpLCB0YWlsKTtcbiAgICB9XG4gICAgX2FwcGVuZFBsYWNlaG9sZGVyKCkge1xuICAgICAgaWYgKHRoaXMuaXNGaWxsZWQgfHwgdGhpcy5pc09wdGlvbmFsKSByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIHRoaXMuaXNGaWxsZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKHtcbiAgICAgICAgaW5zZXJ0ZWQ6IHRoaXMucGxhY2Vob2xkZXJDaGFyXG4gICAgICB9KTtcbiAgICB9XG4gICAgX2FwcGVuZEVhZ2VyKCkge1xuICAgICAgcmV0dXJuIG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgfVxuICAgIGV4dHJhY3RUYWlsKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQuZXh0cmFjdFRhaWwoZnJvbVBvcywgdG9Qb3MpO1xuICAgIH1cbiAgICBhcHBlbmRUYWlsKHRhaWwpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5hcHBlbmRUYWlsKHRhaWwpO1xuICAgIH1cbiAgICBleHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLnZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm1hc2tlZC5leHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKTtcbiAgICB9XG4gICAgbmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgZGlyZWN0aW9uKSB7XG4gICAgICBpZiAoZGlyZWN0aW9uID09PSB2b2lkIDApIHtcbiAgICAgICAgZGlyZWN0aW9uID0gRElSRUNUSU9OLk5PTkU7XG4gICAgICB9XG4gICAgICBjb25zdCBtaW5Qb3MgPSAwO1xuICAgICAgY29uc3QgbWF4UG9zID0gdGhpcy52YWx1ZS5sZW5ndGg7XG4gICAgICBjb25zdCBib3VuZFBvcyA9IE1hdGgubWluKE1hdGgubWF4KGN1cnNvclBvcywgbWluUG9zKSwgbWF4UG9zKTtcbiAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkxFRlQ6XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkZPUkNFX0xFRlQ6XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaXNDb21wbGV0ZSA/IGJvdW5kUG9zIDogbWluUG9zO1xuICAgICAgICBjYXNlIERJUkVDVElPTi5SSUdIVDpcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uRk9SQ0VfUklHSFQ6XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaXNDb21wbGV0ZSA/IGJvdW5kUG9zIDogbWF4UG9zO1xuICAgICAgICBjYXNlIERJUkVDVElPTi5OT05FOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBib3VuZFBvcztcbiAgICAgIH1cbiAgICB9XG4gICAgdG90YWxJbnB1dFBvc2l0aW9ucyhmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy52YWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZS5zbGljZShmcm9tUG9zLCB0b1BvcykubGVuZ3RoO1xuICAgIH1cbiAgICBkb1ZhbGlkYXRlKGZsYWdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXNrZWQuZG9WYWxpZGF0ZSh0aGlzLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpKSAmJiAoIXRoaXMucGFyZW50IHx8IHRoaXMucGFyZW50LmRvVmFsaWRhdGUodGhpcy5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSkpO1xuICAgIH1cbiAgICBkb0NvbW1pdCgpIHtcbiAgICAgIHRoaXMubWFza2VkLmRvQ29tbWl0KCk7XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIF92YWx1ZTogdGhpcy52YWx1ZSxcbiAgICAgICAgX3Jhd0lucHV0VmFsdWU6IHRoaXMucmF3SW5wdXRWYWx1ZSxcbiAgICAgICAgbWFza2VkOiB0aGlzLm1hc2tlZC5zdGF0ZSxcbiAgICAgICAgaXNGaWxsZWQ6IHRoaXMuaXNGaWxsZWRcbiAgICAgIH07XG4gICAgfVxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xuICAgICAgdGhpcy5tYXNrZWQuc3RhdGUgPSBzdGF0ZS5tYXNrZWQ7XG4gICAgICB0aGlzLmlzRmlsbGVkID0gc3RhdGUuaXNGaWxsZWQ7XG4gICAgfVxuICAgIGN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpIHtcbiAgICAgIHZhciBfZmxhZ3MkX2JlZm9yZVRhaWxTdGE7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5mbGFncyxcbiAgICAgICAgX2JlZm9yZVRhaWxTdGF0ZTogKGZsYWdzID09IG51bGwgfHwgKF9mbGFncyRfYmVmb3JlVGFpbFN0YSA9IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUpID09IG51bGwgPyB2b2lkIDAgOiBfZmxhZ3MkX2JlZm9yZVRhaWxTdGEubWFza2VkKSB8fCAoZmxhZ3MgPT0gbnVsbCA/IHZvaWQgMCA6IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUpXG4gICAgICB9O1xuICAgIH1cbiAgICBwYWQoZmxhZ3MpIHtcbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgIH1cbiAgfVxuICBQYXR0ZXJuSW5wdXREZWZpbml0aW9uLkRFRkFVTFRfREVGSU5JVElPTlMgPSB7XG4gICAgJzAnOiAvXFxkLyxcbiAgICAnYSc6IC9bXFx1MDA0MS1cXHUwMDVBXFx1MDA2MS1cXHUwMDdBXFx1MDBBQVxcdTAwQjVcXHUwMEJBXFx1MDBDMC1cXHUwMEQ2XFx1MDBEOC1cXHUwMEY2XFx1MDBGOC1cXHUwMkMxXFx1MDJDNi1cXHUwMkQxXFx1MDJFMC1cXHUwMkU0XFx1MDJFQ1xcdTAyRUVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN0EtXFx1MDM3RFxcdTAzODZcXHUwMzg4LVxcdTAzOEFcXHUwMzhDXFx1MDM4RS1cXHUwM0ExXFx1MDNBMy1cXHUwM0Y1XFx1MDNGNy1cXHUwNDgxXFx1MDQ4QS1cXHUwNTI3XFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1RDAtXFx1MDVFQVxcdTA1RjAtXFx1MDVGMlxcdTA2MjAtXFx1MDY0QVxcdTA2NkVcXHUwNjZGXFx1MDY3MS1cXHUwNkQzXFx1MDZENVxcdTA2RTVcXHUwNkU2XFx1MDZFRVxcdTA2RUZcXHUwNkZBLVxcdTA2RkNcXHUwNkZGXFx1MDcxMFxcdTA3MTItXFx1MDcyRlxcdTA3NEQtXFx1MDdBNVxcdTA3QjFcXHUwN0NBLVxcdTA3RUFcXHUwN0Y0XFx1MDdGNVxcdTA3RkFcXHUwODAwLVxcdTA4MTVcXHUwODFBXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwOEEwXFx1MDhBMi1cXHUwOEFDXFx1MDkwNC1cXHUwOTM5XFx1MDkzRFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N0ZcXHUwOTg1LVxcdTA5OENcXHUwOThGXFx1MDk5MFxcdTA5OTMtXFx1MDlBOFxcdTA5QUEtXFx1MDlCMFxcdTA5QjJcXHUwOUI2LVxcdTA5QjlcXHUwOUJEXFx1MDlDRVxcdTA5RENcXHUwOUREXFx1MDlERi1cXHUwOUUxXFx1MDlGMFxcdTA5RjFcXHUwQTA1LVxcdTBBMEFcXHUwQTBGXFx1MEExMFxcdTBBMTMtXFx1MEEyOFxcdTBBMkEtXFx1MEEzMFxcdTBBMzJcXHUwQTMzXFx1MEEzNVxcdTBBMzZcXHUwQTM4XFx1MEEzOVxcdTBBNTktXFx1MEE1Q1xcdTBBNUVcXHUwQTcyLVxcdTBBNzRcXHUwQTg1LVxcdTBBOERcXHUwQThGLVxcdTBBOTFcXHUwQTkzLVxcdTBBQThcXHUwQUFBLVxcdTBBQjBcXHUwQUIyXFx1MEFCM1xcdTBBQjUtXFx1MEFCOVxcdTBBQkRcXHUwQUQwXFx1MEFFMFxcdTBBRTFcXHUwQjA1LVxcdTBCMENcXHUwQjBGXFx1MEIxMFxcdTBCMTMtXFx1MEIyOFxcdTBCMkEtXFx1MEIzMFxcdTBCMzJcXHUwQjMzXFx1MEIzNS1cXHUwQjM5XFx1MEIzRFxcdTBCNUNcXHUwQjVEXFx1MEI1Ri1cXHUwQjYxXFx1MEI3MVxcdTBCODNcXHUwQjg1LVxcdTBCOEFcXHUwQjhFLVxcdTBCOTBcXHUwQjkyLVxcdTBCOTVcXHUwQjk5XFx1MEI5QVxcdTBCOUNcXHUwQjlFXFx1MEI5RlxcdTBCQTNcXHUwQkE0XFx1MEJBOC1cXHUwQkFBXFx1MEJBRS1cXHUwQkI5XFx1MEJEMFxcdTBDMDUtXFx1MEMwQ1xcdTBDMEUtXFx1MEMxMFxcdTBDMTItXFx1MEMyOFxcdTBDMkEtXFx1MEMzM1xcdTBDMzUtXFx1MEMzOVxcdTBDM0RcXHUwQzU4XFx1MEM1OVxcdTBDNjBcXHUwQzYxXFx1MEM4NS1cXHUwQzhDXFx1MEM4RS1cXHUwQzkwXFx1MEM5Mi1cXHUwQ0E4XFx1MENBQS1cXHUwQ0IzXFx1MENCNS1cXHUwQ0I5XFx1MENCRFxcdTBDREVcXHUwQ0UwXFx1MENFMVxcdTBDRjFcXHUwQ0YyXFx1MEQwNS1cXHUwRDBDXFx1MEQwRS1cXHUwRDEwXFx1MEQxMi1cXHUwRDNBXFx1MEQzRFxcdTBENEVcXHUwRDYwXFx1MEQ2MVxcdTBEN0EtXFx1MEQ3RlxcdTBEODUtXFx1MEQ5NlxcdTBEOUEtXFx1MERCMVxcdTBEQjMtXFx1MERCQlxcdTBEQkRcXHUwREMwLVxcdTBEQzZcXHUwRTAxLVxcdTBFMzBcXHUwRTMyXFx1MEUzM1xcdTBFNDAtXFx1MEU0NlxcdTBFODFcXHUwRTgyXFx1MEU4NFxcdTBFODdcXHUwRTg4XFx1MEU4QVxcdTBFOERcXHUwRTk0LVxcdTBFOTdcXHUwRTk5LVxcdTBFOUZcXHUwRUExLVxcdTBFQTNcXHUwRUE1XFx1MEVBN1xcdTBFQUFcXHUwRUFCXFx1MEVBRC1cXHUwRUIwXFx1MEVCMlxcdTBFQjNcXHUwRUJEXFx1MEVDMC1cXHUwRUM0XFx1MEVDNlxcdTBFREMtXFx1MEVERlxcdTBGMDBcXHUwRjQwLVxcdTBGNDdcXHUwRjQ5LVxcdTBGNkNcXHUwRjg4LVxcdTBGOENcXHUxMDAwLVxcdTEwMkFcXHUxMDNGXFx1MTA1MC1cXHUxMDU1XFx1MTA1QS1cXHUxMDVEXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2RS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4RVxcdTEwQTAtXFx1MTBDNVxcdTEwQzdcXHUxMENEXFx1MTBEMC1cXHUxMEZBXFx1MTBGQy1cXHUxMjQ4XFx1MTI0QS1cXHUxMjREXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNUEtXFx1MTI1RFxcdTEyNjAtXFx1MTI4OFxcdTEyOEEtXFx1MTI4RFxcdTEyOTAtXFx1MTJCMFxcdTEyQjItXFx1MTJCNVxcdTEyQjgtXFx1MTJCRVxcdTEyQzBcXHUxMkMyLVxcdTEyQzVcXHUxMkM4LVxcdTEyRDZcXHUxMkQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNUFcXHUxMzgwLVxcdTEzOEZcXHUxM0EwLVxcdTEzRjRcXHUxNDAxLVxcdTE2NkNcXHUxNjZGLVxcdTE2N0ZcXHUxNjgxLVxcdTE2OUFcXHUxNkEwLVxcdTE2RUFcXHUxNzAwLVxcdTE3MENcXHUxNzBFLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NkNcXHUxNzZFLVxcdTE3NzBcXHUxNzgwLVxcdTE3QjNcXHUxN0Q3XFx1MTdEQ1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThBOFxcdTE4QUFcXHUxOEIwLVxcdTE4RjVcXHUxOTAwLVxcdTE5MUNcXHUxOTUwLVxcdTE5NkRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5QUJcXHUxOUMxLVxcdTE5QzdcXHUxQTAwLVxcdTFBMTZcXHUxQTIwLVxcdTFBNTRcXHUxQUE3XFx1MUIwNS1cXHUxQjMzXFx1MUI0NS1cXHUxQjRCXFx1MUI4My1cXHUxQkEwXFx1MUJBRVxcdTFCQUZcXHUxQkJBLVxcdTFCRTVcXHUxQzAwLVxcdTFDMjNcXHUxQzRELVxcdTFDNEZcXHUxQzVBLVxcdTFDN0RcXHUxQ0U5LVxcdTFDRUNcXHUxQ0VFLVxcdTFDRjFcXHUxQ0Y1XFx1MUNGNlxcdTFEMDAtXFx1MURCRlxcdTFFMDAtXFx1MUYxNVxcdTFGMTgtXFx1MUYxRFxcdTFGMjAtXFx1MUY0NVxcdTFGNDgtXFx1MUY0RFxcdTFGNTAtXFx1MUY1N1xcdTFGNTlcXHUxRjVCXFx1MUY1RFxcdTFGNUYtXFx1MUY3RFxcdTFGODAtXFx1MUZCNFxcdTFGQjYtXFx1MUZCQ1xcdTFGQkVcXHUxRkMyLVxcdTFGQzRcXHUxRkM2LVxcdTFGQ0NcXHUxRkQwLVxcdTFGRDNcXHUxRkQ2LVxcdTFGREJcXHUxRkUwLVxcdTFGRUNcXHUxRkYyLVxcdTFGRjRcXHUxRkY2LVxcdTFGRkNcXHUyMDcxXFx1MjA3RlxcdTIwOTAtXFx1MjA5Q1xcdTIxMDJcXHUyMTA3XFx1MjEwQS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExRFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMkEtXFx1MjEyRFxcdTIxMkYtXFx1MjEzOVxcdTIxM0MtXFx1MjEzRlxcdTIxNDUtXFx1MjE0OVxcdTIxNEVcXHUyMTgzXFx1MjE4NFxcdTJDMDAtXFx1MkMyRVxcdTJDMzAtXFx1MkM1RVxcdTJDNjAtXFx1MkNFNFxcdTJDRUItXFx1MkNFRVxcdTJDRjJcXHUyQ0YzXFx1MkQwMC1cXHUyRDI1XFx1MkQyN1xcdTJEMkRcXHUyRDMwLVxcdTJENjdcXHUyRDZGXFx1MkQ4MC1cXHUyRDk2XFx1MkRBMC1cXHUyREE2XFx1MkRBOC1cXHUyREFFXFx1MkRCMC1cXHUyREI2XFx1MkRCOC1cXHUyREJFXFx1MkRDMC1cXHUyREM2XFx1MkRDOC1cXHUyRENFXFx1MkREMC1cXHUyREQ2XFx1MkREOC1cXHUyRERFXFx1MkUyRlxcdTMwMDVcXHUzMDA2XFx1MzAzMS1cXHUzMDM1XFx1MzAzQlxcdTMwM0NcXHUzMDQxLVxcdTMwOTZcXHUzMDlELVxcdTMwOUZcXHUzMEExLVxcdTMwRkFcXHUzMEZDLVxcdTMwRkZcXHUzMTA1LVxcdTMxMkRcXHUzMTMxLVxcdTMxOEVcXHUzMUEwLVxcdTMxQkFcXHUzMUYwLVxcdTMxRkZcXHUzNDAwLVxcdTREQjVcXHU0RTAwLVxcdTlGQ0NcXHVBMDAwLVxcdUE0OENcXHVBNEQwLVxcdUE0RkRcXHVBNTAwLVxcdUE2MENcXHVBNjEwLVxcdUE2MUZcXHVBNjJBXFx1QTYyQlxcdUE2NDAtXFx1QTY2RVxcdUE2N0YtXFx1QTY5N1xcdUE2QTAtXFx1QTZFNVxcdUE3MTctXFx1QTcxRlxcdUE3MjItXFx1QTc4OFxcdUE3OEItXFx1QTc4RVxcdUE3OTAtXFx1QTc5M1xcdUE3QTAtXFx1QTdBQVxcdUE3RjgtXFx1QTgwMVxcdUE4MDMtXFx1QTgwNVxcdUE4MDctXFx1QTgwQVxcdUE4MEMtXFx1QTgyMlxcdUE4NDAtXFx1QTg3M1xcdUE4ODItXFx1QThCM1xcdUE4RjItXFx1QThGN1xcdUE4RkJcXHVBOTBBLVxcdUE5MjVcXHVBOTMwLVxcdUE5NDZcXHVBOTYwLVxcdUE5N0NcXHVBOTg0LVxcdUE5QjJcXHVBOUNGXFx1QUEwMC1cXHVBQTI4XFx1QUE0MC1cXHVBQTQyXFx1QUE0NC1cXHVBQTRCXFx1QUE2MC1cXHVBQTc2XFx1QUE3QVxcdUFBODAtXFx1QUFBRlxcdUFBQjFcXHVBQUI1XFx1QUFCNlxcdUFBQjktXFx1QUFCRFxcdUFBQzBcXHVBQUMyXFx1QUFEQi1cXHVBQUREXFx1QUFFMC1cXHVBQUVBXFx1QUFGMi1cXHVBQUY0XFx1QUIwMS1cXHVBQjA2XFx1QUIwOS1cXHVBQjBFXFx1QUIxMS1cXHVBQjE2XFx1QUIyMC1cXHVBQjI2XFx1QUIyOC1cXHVBQjJFXFx1QUJDMC1cXHVBQkUyXFx1QUMwMC1cXHVEN0EzXFx1RDdCMC1cXHVEN0M2XFx1RDdDQi1cXHVEN0ZCXFx1RjkwMC1cXHVGQTZEXFx1RkE3MC1cXHVGQUQ5XFx1RkIwMC1cXHVGQjA2XFx1RkIxMy1cXHVGQjE3XFx1RkIxRFxcdUZCMUYtXFx1RkIyOFxcdUZCMkEtXFx1RkIzNlxcdUZCMzgtXFx1RkIzQ1xcdUZCM0VcXHVGQjQwXFx1RkI0MVxcdUZCNDNcXHVGQjQ0XFx1RkI0Ni1cXHVGQkIxXFx1RkJEMy1cXHVGRDNEXFx1RkQ1MC1cXHVGRDhGXFx1RkQ5Mi1cXHVGREM3XFx1RkRGMC1cXHVGREZCXFx1RkU3MC1cXHVGRTc0XFx1RkU3Ni1cXHVGRUZDXFx1RkYyMS1cXHVGRjNBXFx1RkY0MS1cXHVGRjVBXFx1RkY2Ni1cXHVGRkJFXFx1RkZDMi1cXHVGRkM3XFx1RkZDQS1cXHVGRkNGXFx1RkZEMi1cXHVGRkQ3XFx1RkZEQS1cXHVGRkRDXS8sXG4gICAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjIwNzUwNzBcbiAgICAnKic6IC8uL1xuICB9O1xuXG4gIC8qKiBNYXNraW5nIGJ5IFJlZ0V4cCAqL1xuICBjbGFzcyBNYXNrZWRSZWdFeHAgZXh0ZW5kcyBNYXNrZWQge1xuICAgIC8qKiAqL1xuXG4gICAgLyoqIEVuYWJsZSBjaGFyYWN0ZXJzIG92ZXJ3cml0aW5nICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgY29uc3QgbWFzayA9IG9wdHMubWFzaztcbiAgICAgIGlmIChtYXNrKSBvcHRzLnZhbGlkYXRlID0gdmFsdWUgPT4gdmFsdWUuc2VhcmNoKG1hc2spID49IDA7XG4gICAgICBzdXBlci5fdXBkYXRlKG9wdHMpO1xuICAgIH1cbiAgfVxuICBJTWFzay5NYXNrZWRSZWdFeHAgPSBNYXNrZWRSZWdFeHA7XG5cbiAgLyoqIFBhdHRlcm4gbWFzayAqL1xuICBjbGFzcyBNYXNrZWRQYXR0ZXJuIGV4dGVuZHMgTWFza2VkIHtcbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqIFNpbmdsZSBjaGFyIGZvciBlbXB0eSBpbnB1dCAqL1xuXG4gICAgLyoqIFNpbmdsZSBjaGFyIGZvciBmaWxsZWQgaW5wdXQgKi9cblxuICAgIC8qKiBTaG93IHBsYWNlaG9sZGVyIG9ubHkgd2hlbiBuZWVkZWQgKi9cblxuICAgIC8qKiBFbmFibGUgY2hhcmFjdGVycyBvdmVyd3JpdGluZyAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgc3VwZXIoe1xuICAgICAgICAuLi5NYXNrZWRQYXR0ZXJuLkRFRkFVTFRTLFxuICAgICAgICAuLi5vcHRzLFxuICAgICAgICBkZWZpbml0aW9uczogT2JqZWN0LmFzc2lnbih7fSwgUGF0dGVybklucHV0RGVmaW5pdGlvbi5ERUZBVUxUX0RFRklOSVRJT05TLCBvcHRzID09IG51bGwgPyB2b2lkIDAgOiBvcHRzLmRlZmluaXRpb25zKVxuICAgICAgfSk7XG4gICAgfVxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICBvcHRzLmRlZmluaXRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5kZWZpbml0aW9ucywgb3B0cy5kZWZpbml0aW9ucyk7XG4gICAgICBzdXBlci5fdXBkYXRlKG9wdHMpO1xuICAgICAgdGhpcy5fcmVidWlsZE1hc2soKTtcbiAgICB9XG4gICAgX3JlYnVpbGRNYXNrKCkge1xuICAgICAgY29uc3QgZGVmcyA9IHRoaXMuZGVmaW5pdGlvbnM7XG4gICAgICB0aGlzLl9ibG9ja3MgPSBbXTtcbiAgICAgIHRoaXMuZXhwb3NlQmxvY2sgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9zdG9wcyA9IFtdO1xuICAgICAgdGhpcy5fbWFza2VkQmxvY2tzID0ge307XG4gICAgICBjb25zdCBwYXR0ZXJuID0gdGhpcy5tYXNrO1xuICAgICAgaWYgKCFwYXR0ZXJuIHx8ICFkZWZzKSByZXR1cm47XG4gICAgICBsZXQgdW5tYXNraW5nQmxvY2sgPSBmYWxzZTtcbiAgICAgIGxldCBvcHRpb25hbEJsb2NrID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdHRlcm4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHRoaXMuYmxvY2tzKSB7XG4gICAgICAgICAgY29uc3QgcCA9IHBhdHRlcm4uc2xpY2UoaSk7XG4gICAgICAgICAgY29uc3QgYk5hbWVzID0gT2JqZWN0LmtleXModGhpcy5ibG9ja3MpLmZpbHRlcihiTmFtZSA9PiBwLmluZGV4T2YoYk5hbWUpID09PSAwKTtcbiAgICAgICAgICAvLyBvcmRlciBieSBrZXkgbGVuZ3RoXG4gICAgICAgICAgYk5hbWVzLnNvcnQoKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGgpO1xuICAgICAgICAgIC8vIHVzZSBibG9jayBuYW1lIHdpdGggbWF4IGxlbmd0aFxuICAgICAgICAgIGNvbnN0IGJOYW1lID0gYk5hbWVzWzBdO1xuICAgICAgICAgIGlmIChiTmFtZSkge1xuICAgICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgICBleHBvc2UsXG4gICAgICAgICAgICAgIHJlcGVhdCxcbiAgICAgICAgICAgICAgLi4uYk9wdHNcbiAgICAgICAgICAgIH0gPSBub3JtYWxpemVPcHRzKHRoaXMuYmxvY2tzW2JOYW1lXSk7IC8vIFRPRE8gdHlwZSBPcHRzPEFyZyAmIEV4dHJhPlxuICAgICAgICAgICAgY29uc3QgYmxvY2tPcHRzID0ge1xuICAgICAgICAgICAgICBsYXp5OiB0aGlzLmxhenksXG4gICAgICAgICAgICAgIGVhZ2VyOiB0aGlzLmVhZ2VyLFxuICAgICAgICAgICAgICBwbGFjZWhvbGRlckNoYXI6IHRoaXMucGxhY2Vob2xkZXJDaGFyLFxuICAgICAgICAgICAgICBkaXNwbGF5Q2hhcjogdGhpcy5kaXNwbGF5Q2hhcixcbiAgICAgICAgICAgICAgb3ZlcndyaXRlOiB0aGlzLm92ZXJ3cml0ZSxcbiAgICAgICAgICAgICAgYXV0b2ZpeDogdGhpcy5hdXRvZml4LFxuICAgICAgICAgICAgICAuLi5iT3B0cyxcbiAgICAgICAgICAgICAgcmVwZWF0LFxuICAgICAgICAgICAgICBwYXJlbnQ6IHRoaXNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCBtYXNrZWRCbG9jayA9IHJlcGVhdCAhPSBudWxsID8gbmV3IElNYXNrLlJlcGVhdEJsb2NrKGJsb2NrT3B0cyAvKiBUT0RPICovKSA6IGNyZWF0ZU1hc2soYmxvY2tPcHRzKTtcbiAgICAgICAgICAgIGlmIChtYXNrZWRCbG9jaykge1xuICAgICAgICAgICAgICB0aGlzLl9ibG9ja3MucHVzaChtYXNrZWRCbG9jayk7XG4gICAgICAgICAgICAgIGlmIChleHBvc2UpIHRoaXMuZXhwb3NlQmxvY2sgPSBtYXNrZWRCbG9jaztcblxuICAgICAgICAgICAgICAvLyBzdG9yZSBibG9jayBpbmRleFxuICAgICAgICAgICAgICBpZiAoIXRoaXMuX21hc2tlZEJsb2Nrc1tiTmFtZV0pIHRoaXMuX21hc2tlZEJsb2Nrc1tiTmFtZV0gPSBbXTtcbiAgICAgICAgICAgICAgdGhpcy5fbWFza2VkQmxvY2tzW2JOYW1lXS5wdXNoKHRoaXMuX2Jsb2Nrcy5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgKz0gYk5hbWUubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgY2hhciA9IHBhdHRlcm5baV07XG4gICAgICAgIGxldCBpc0lucHV0ID0gKGNoYXIgaW4gZGVmcyk7XG4gICAgICAgIGlmIChjaGFyID09PSBNYXNrZWRQYXR0ZXJuLlNUT1BfQ0hBUikge1xuICAgICAgICAgIHRoaXMuX3N0b3BzLnB1c2godGhpcy5fYmxvY2tzLmxlbmd0aCk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYXIgPT09ICd7JyB8fCBjaGFyID09PSAnfScpIHtcbiAgICAgICAgICB1bm1hc2tpbmdCbG9jayA9ICF1bm1hc2tpbmdCbG9jaztcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhciA9PT0gJ1snIHx8IGNoYXIgPT09ICddJykge1xuICAgICAgICAgIG9wdGlvbmFsQmxvY2sgPSAhb3B0aW9uYWxCbG9jaztcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhciA9PT0gTWFza2VkUGF0dGVybi5FU0NBUEVfQ0hBUikge1xuICAgICAgICAgICsraTtcbiAgICAgICAgICBjaGFyID0gcGF0dGVybltpXTtcbiAgICAgICAgICBpZiAoIWNoYXIpIGJyZWFrO1xuICAgICAgICAgIGlzSW5wdXQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkZWYgPSBpc0lucHV0ID8gbmV3IFBhdHRlcm5JbnB1dERlZmluaXRpb24oe1xuICAgICAgICAgIGlzT3B0aW9uYWw6IG9wdGlvbmFsQmxvY2ssXG4gICAgICAgICAgbGF6eTogdGhpcy5sYXp5LFxuICAgICAgICAgIGVhZ2VyOiB0aGlzLmVhZ2VyLFxuICAgICAgICAgIHBsYWNlaG9sZGVyQ2hhcjogdGhpcy5wbGFjZWhvbGRlckNoYXIsXG4gICAgICAgICAgZGlzcGxheUNoYXI6IHRoaXMuZGlzcGxheUNoYXIsXG4gICAgICAgICAgLi4ubm9ybWFsaXplT3B0cyhkZWZzW2NoYXJdKSxcbiAgICAgICAgICBwYXJlbnQ6IHRoaXNcbiAgICAgICAgfSkgOiBuZXcgUGF0dGVybkZpeGVkRGVmaW5pdGlvbih7XG4gICAgICAgICAgY2hhcixcbiAgICAgICAgICBlYWdlcjogdGhpcy5lYWdlcixcbiAgICAgICAgICBpc1VubWFza2luZzogdW5tYXNraW5nQmxvY2tcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2Jsb2Nrcy5wdXNoKGRlZik7XG4gICAgICB9XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnN1cGVyLnN0YXRlLFxuICAgICAgICBfYmxvY2tzOiB0aGlzLl9ibG9ja3MubWFwKGIgPT4gYi5zdGF0ZSlcbiAgICAgIH07XG4gICAgfVxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xuICAgICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgX2Jsb2NrcyxcbiAgICAgICAgLi4ubWFza2VkU3RhdGVcbiAgICAgIH0gPSBzdGF0ZTtcbiAgICAgIHRoaXMuX2Jsb2Nrcy5mb3JFYWNoKChiLCBiaSkgPT4gYi5zdGF0ZSA9IF9ibG9ja3NbYmldKTtcbiAgICAgIHN1cGVyLnN0YXRlID0gbWFza2VkU3RhdGU7XG4gICAgfVxuICAgIHJlc2V0KCkge1xuICAgICAgc3VwZXIucmVzZXQoKTtcbiAgICAgIHRoaXMuX2Jsb2Nrcy5mb3JFYWNoKGIgPT4gYi5yZXNldCgpKTtcbiAgICB9XG4gICAgZ2V0IGlzQ29tcGxldGUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5leHBvc2VCbG9jayA/IHRoaXMuZXhwb3NlQmxvY2suaXNDb21wbGV0ZSA6IHRoaXMuX2Jsb2Nrcy5ldmVyeShiID0+IGIuaXNDb21wbGV0ZSk7XG4gICAgfVxuICAgIGdldCBpc0ZpbGxlZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9ibG9ja3MuZXZlcnkoYiA9PiBiLmlzRmlsbGVkKTtcbiAgICB9XG4gICAgZ2V0IGlzRml4ZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYmxvY2tzLmV2ZXJ5KGIgPT4gYi5pc0ZpeGVkKTtcbiAgICB9XG4gICAgZ2V0IGlzT3B0aW9uYWwoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYmxvY2tzLmV2ZXJ5KGIgPT4gYi5pc09wdGlvbmFsKTtcbiAgICB9XG4gICAgZG9Db21taXQoKSB7XG4gICAgICB0aGlzLl9ibG9ja3MuZm9yRWFjaChiID0+IGIuZG9Db21taXQoKSk7XG4gICAgICBzdXBlci5kb0NvbW1pdCgpO1xuICAgIH1cbiAgICBnZXQgdW5tYXNrZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cG9zZUJsb2NrID8gdGhpcy5leHBvc2VCbG9jay51bm1hc2tlZFZhbHVlIDogdGhpcy5fYmxvY2tzLnJlZHVjZSgoc3RyLCBiKSA9PiBzdHIgKz0gYi51bm1hc2tlZFZhbHVlLCAnJyk7XG4gICAgfVxuICAgIHNldCB1bm1hc2tlZFZhbHVlKHVubWFza2VkVmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmV4cG9zZUJsb2NrKSB7XG4gICAgICAgIGNvbnN0IHRhaWwgPSB0aGlzLmV4dHJhY3RUYWlsKHRoaXMuX2Jsb2NrU3RhcnRQb3ModGhpcy5fYmxvY2tzLmluZGV4T2YodGhpcy5leHBvc2VCbG9jaykpICsgdGhpcy5leHBvc2VCbG9jay5kaXNwbGF5VmFsdWUubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5leHBvc2VCbG9jay51bm1hc2tlZFZhbHVlID0gdW5tYXNrZWRWYWx1ZTtcbiAgICAgICAgdGhpcy5hcHBlbmRUYWlsKHRhaWwpO1xuICAgICAgICB0aGlzLmRvQ29tbWl0KCk7XG4gICAgICB9IGVsc2Ugc3VwZXIudW5tYXNrZWRWYWx1ZSA9IHVubWFza2VkVmFsdWU7XG4gICAgfVxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cG9zZUJsb2NrID8gdGhpcy5leHBvc2VCbG9jay52YWx1ZSA6XG4gICAgICAvLyBUT0RPIHJldHVybiBfdmFsdWUgd2hlbiBub3QgaW4gY2hhbmdlP1xuICAgICAgdGhpcy5fYmxvY2tzLnJlZHVjZSgoc3RyLCBiKSA9PiBzdHIgKz0gYi52YWx1ZSwgJycpO1xuICAgIH1cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmV4cG9zZUJsb2NrKSB7XG4gICAgICAgIGNvbnN0IHRhaWwgPSB0aGlzLmV4dHJhY3RUYWlsKHRoaXMuX2Jsb2NrU3RhcnRQb3ModGhpcy5fYmxvY2tzLmluZGV4T2YodGhpcy5leHBvc2VCbG9jaykpICsgdGhpcy5leHBvc2VCbG9jay5kaXNwbGF5VmFsdWUubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5leHBvc2VCbG9jay52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmFwcGVuZFRhaWwodGFpbCk7XG4gICAgICAgIHRoaXMuZG9Db21taXQoKTtcbiAgICAgIH0gZWxzZSBzdXBlci52YWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBnZXQgdHlwZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cG9zZUJsb2NrID8gdGhpcy5leHBvc2VCbG9jay50eXBlZFZhbHVlIDogc3VwZXIudHlwZWRWYWx1ZTtcbiAgICB9XG4gICAgc2V0IHR5cGVkVmFsdWUodmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmV4cG9zZUJsb2NrKSB7XG4gICAgICAgIGNvbnN0IHRhaWwgPSB0aGlzLmV4dHJhY3RUYWlsKHRoaXMuX2Jsb2NrU3RhcnRQb3ModGhpcy5fYmxvY2tzLmluZGV4T2YodGhpcy5leHBvc2VCbG9jaykpICsgdGhpcy5leHBvc2VCbG9jay5kaXNwbGF5VmFsdWUubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5leHBvc2VCbG9jay50eXBlZFZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuYXBwZW5kVGFpbCh0YWlsKTtcbiAgICAgICAgdGhpcy5kb0NvbW1pdCgpO1xuICAgICAgfSBlbHNlIHN1cGVyLnR5cGVkVmFsdWUgPSB2YWx1ZTtcbiAgICB9XG4gICAgZ2V0IGRpc3BsYXlWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9ibG9ja3MucmVkdWNlKChzdHIsIGIpID0+IHN0ciArPSBiLmRpc3BsYXlWYWx1ZSwgJycpO1xuICAgIH1cbiAgICBhcHBlbmRUYWlsKHRhaWwpIHtcbiAgICAgIHJldHVybiBzdXBlci5hcHBlbmRUYWlsKHRhaWwpLmFnZ3JlZ2F0ZSh0aGlzLl9hcHBlbmRQbGFjZWhvbGRlcigpKTtcbiAgICB9XG4gICAgX2FwcGVuZEVhZ2VyKCkge1xuICAgICAgdmFyIF90aGlzJF9tYXBQb3NUb0Jsb2NrO1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBsZXQgc3RhcnRCbG9ja0luZGV4ID0gKF90aGlzJF9tYXBQb3NUb0Jsb2NrID0gdGhpcy5fbWFwUG9zVG9CbG9jayh0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgpKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkX21hcFBvc1RvQmxvY2suaW5kZXg7XG4gICAgICBpZiAoc3RhcnRCbG9ja0luZGV4ID09IG51bGwpIHJldHVybiBkZXRhaWxzO1xuXG4gICAgICAvLyBUT0RPIHRlc3QgaWYgaXQgd29ya3MgZm9yIG5lc3RlZCBwYXR0ZXJuIG1hc2tzXG4gICAgICBpZiAodGhpcy5fYmxvY2tzW3N0YXJ0QmxvY2tJbmRleF0uaXNGaWxsZWQpICsrc3RhcnRCbG9ja0luZGV4O1xuICAgICAgZm9yIChsZXQgYmkgPSBzdGFydEJsb2NrSW5kZXg7IGJpIDwgdGhpcy5fYmxvY2tzLmxlbmd0aDsgKytiaSkge1xuICAgICAgICBjb25zdCBkID0gdGhpcy5fYmxvY2tzW2JpXS5fYXBwZW5kRWFnZXIoKTtcbiAgICAgICAgaWYgKCFkLmluc2VydGVkKSBicmVhaztcbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUoZCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgYmxvY2tJdGVyID0gdGhpcy5fbWFwUG9zVG9CbG9jayh0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgpO1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBpZiAoIWJsb2NrSXRlcikgcmV0dXJuIGRldGFpbHM7XG4gICAgICBmb3IgKGxldCBiaSA9IGJsb2NrSXRlci5pbmRleCwgYmxvY2s7IGJsb2NrID0gdGhpcy5fYmxvY2tzW2JpXTsgKytiaSkge1xuICAgICAgICB2YXIgX2ZsYWdzJF9iZWZvcmVUYWlsU3RhO1xuICAgICAgICBjb25zdCBibG9ja0RldGFpbHMgPSBibG9jay5fYXBwZW5kQ2hhcihjaCwge1xuICAgICAgICAgIC4uLmZsYWdzLFxuICAgICAgICAgIF9iZWZvcmVUYWlsU3RhdGU6IChfZmxhZ3MkX2JlZm9yZVRhaWxTdGEgPSBmbGFncy5fYmVmb3JlVGFpbFN0YXRlKSA9PSBudWxsIHx8IChfZmxhZ3MkX2JlZm9yZVRhaWxTdGEgPSBfZmxhZ3MkX2JlZm9yZVRhaWxTdGEuX2Jsb2NrcykgPT0gbnVsbCA/IHZvaWQgMCA6IF9mbGFncyRfYmVmb3JlVGFpbFN0YVtiaV1cbiAgICAgICAgfSk7XG4gICAgICAgIGRldGFpbHMuYWdncmVnYXRlKGJsb2NrRGV0YWlscyk7XG4gICAgICAgIGlmIChibG9ja0RldGFpbHMuY29uc3VtZWQpIGJyZWFrOyAvLyBnbyBuZXh0IGNoYXJcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBleHRyYWN0VGFpbChmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgY29uc3QgY2h1bmtUYWlsID0gbmV3IENodW5rc1RhaWxEZXRhaWxzKCk7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdG9Qb3MpIHJldHVybiBjaHVua1RhaWw7XG4gICAgICB0aGlzLl9mb3JFYWNoQmxvY2tzSW5SYW5nZShmcm9tUG9zLCB0b1BvcywgKGIsIGJpLCBiRnJvbVBvcywgYlRvUG9zKSA9PiB7XG4gICAgICAgIGNvbnN0IGJsb2NrQ2h1bmsgPSBiLmV4dHJhY3RUYWlsKGJGcm9tUG9zLCBiVG9Qb3MpO1xuICAgICAgICBibG9ja0NodW5rLnN0b3AgPSB0aGlzLl9maW5kU3RvcEJlZm9yZShiaSk7XG4gICAgICAgIGJsb2NrQ2h1bmsuZnJvbSA9IHRoaXMuX2Jsb2NrU3RhcnRQb3MoYmkpO1xuICAgICAgICBpZiAoYmxvY2tDaHVuayBpbnN0YW5jZW9mIENodW5rc1RhaWxEZXRhaWxzKSBibG9ja0NodW5rLmJsb2NrSW5kZXggPSBiaTtcbiAgICAgICAgY2h1bmtUYWlsLmV4dGVuZChibG9ja0NodW5rKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNodW5rVGFpbDtcbiAgICB9XG4gICAgZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmIChmcm9tUG9zID09PSB0b1BvcykgcmV0dXJuICcnO1xuICAgICAgbGV0IGlucHV0ID0gJyc7XG4gICAgICB0aGlzLl9mb3JFYWNoQmxvY2tzSW5SYW5nZShmcm9tUG9zLCB0b1BvcywgKGIsIF8sIGZyb21Qb3MsIHRvUG9zKSA9PiB7XG4gICAgICAgIGlucHV0ICs9IGIuZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncyk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG4gICAgX2ZpbmRTdG9wQmVmb3JlKGJsb2NrSW5kZXgpIHtcbiAgICAgIGxldCBzdG9wQmVmb3JlO1xuICAgICAgZm9yIChsZXQgc2kgPSAwOyBzaSA8IHRoaXMuX3N0b3BzLmxlbmd0aDsgKytzaSkge1xuICAgICAgICBjb25zdCBzdG9wID0gdGhpcy5fc3RvcHNbc2ldO1xuICAgICAgICBpZiAoc3RvcCA8PSBibG9ja0luZGV4KSBzdG9wQmVmb3JlID0gc3RvcDtlbHNlIGJyZWFrO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN0b3BCZWZvcmU7XG4gICAgfVxuXG4gICAgLyoqIEFwcGVuZHMgcGxhY2Vob2xkZXIgZGVwZW5kaW5nIG9uIGxhemluZXNzICovXG4gICAgX2FwcGVuZFBsYWNlaG9sZGVyKHRvQmxvY2tJbmRleCkge1xuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBpZiAodGhpcy5sYXp5ICYmIHRvQmxvY2tJbmRleCA9PSBudWxsKSByZXR1cm4gZGV0YWlscztcbiAgICAgIGNvbnN0IHN0YXJ0QmxvY2tJdGVyID0gdGhpcy5fbWFwUG9zVG9CbG9jayh0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGgpO1xuICAgICAgaWYgKCFzdGFydEJsb2NrSXRlcikgcmV0dXJuIGRldGFpbHM7XG4gICAgICBjb25zdCBzdGFydEJsb2NrSW5kZXggPSBzdGFydEJsb2NrSXRlci5pbmRleDtcbiAgICAgIGNvbnN0IGVuZEJsb2NrSW5kZXggPSB0b0Jsb2NrSW5kZXggIT0gbnVsbCA/IHRvQmxvY2tJbmRleCA6IHRoaXMuX2Jsb2Nrcy5sZW5ndGg7XG4gICAgICB0aGlzLl9ibG9ja3Muc2xpY2Uoc3RhcnRCbG9ja0luZGV4LCBlbmRCbG9ja0luZGV4KS5mb3JFYWNoKGIgPT4ge1xuICAgICAgICBpZiAoIWIubGF6eSB8fCB0b0Jsb2NrSW5kZXggIT0gbnVsbCkge1xuICAgICAgICAgIHZhciBfYmxvY2tzMjtcbiAgICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShiLl9hcHBlbmRQbGFjZWhvbGRlcigoX2Jsb2NrczIgPSBiLl9ibG9ja3MpID09IG51bGwgPyB2b2lkIDAgOiBfYmxvY2tzMi5sZW5ndGgpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG5cbiAgICAvKiogRmluZHMgYmxvY2sgaW4gcG9zICovXG4gICAgX21hcFBvc1RvQmxvY2socG9zKSB7XG4gICAgICBsZXQgYWNjVmFsID0gJyc7XG4gICAgICBmb3IgKGxldCBiaSA9IDA7IGJpIDwgdGhpcy5fYmxvY2tzLmxlbmd0aDsgKytiaSkge1xuICAgICAgICBjb25zdCBibG9jayA9IHRoaXMuX2Jsb2Nrc1tiaV07XG4gICAgICAgIGNvbnN0IGJsb2NrU3RhcnRQb3MgPSBhY2NWYWwubGVuZ3RoO1xuICAgICAgICBhY2NWYWwgKz0gYmxvY2suZGlzcGxheVZhbHVlO1xuICAgICAgICBpZiAocG9zIDw9IGFjY1ZhbC5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5kZXg6IGJpLFxuICAgICAgICAgICAgb2Zmc2V0OiBwb3MgLSBibG9ja1N0YXJ0UG9zXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBfYmxvY2tTdGFydFBvcyhibG9ja0luZGV4KSB7XG4gICAgICByZXR1cm4gdGhpcy5fYmxvY2tzLnNsaWNlKDAsIGJsb2NrSW5kZXgpLnJlZHVjZSgocG9zLCBiKSA9PiBwb3MgKz0gYi5kaXNwbGF5VmFsdWUubGVuZ3RoLCAwKTtcbiAgICB9XG4gICAgX2ZvckVhY2hCbG9ja3NJblJhbmdlKGZyb21Qb3MsIHRvUG9zLCBmbikge1xuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBjb25zdCBmcm9tQmxvY2tJdGVyID0gdGhpcy5fbWFwUG9zVG9CbG9jayhmcm9tUG9zKTtcbiAgICAgIGlmIChmcm9tQmxvY2tJdGVyKSB7XG4gICAgICAgIGNvbnN0IHRvQmxvY2tJdGVyID0gdGhpcy5fbWFwUG9zVG9CbG9jayh0b1Bvcyk7XG4gICAgICAgIC8vIHByb2Nlc3MgZmlyc3QgYmxvY2tcbiAgICAgICAgY29uc3QgaXNTYW1lQmxvY2sgPSB0b0Jsb2NrSXRlciAmJiBmcm9tQmxvY2tJdGVyLmluZGV4ID09PSB0b0Jsb2NrSXRlci5pbmRleDtcbiAgICAgICAgY29uc3QgZnJvbUJsb2NrU3RhcnRQb3MgPSBmcm9tQmxvY2tJdGVyLm9mZnNldDtcbiAgICAgICAgY29uc3QgZnJvbUJsb2NrRW5kUG9zID0gdG9CbG9ja0l0ZXIgJiYgaXNTYW1lQmxvY2sgPyB0b0Jsb2NrSXRlci5vZmZzZXQgOiB0aGlzLl9ibG9ja3NbZnJvbUJsb2NrSXRlci5pbmRleF0uZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgICAgZm4odGhpcy5fYmxvY2tzW2Zyb21CbG9ja0l0ZXIuaW5kZXhdLCBmcm9tQmxvY2tJdGVyLmluZGV4LCBmcm9tQmxvY2tTdGFydFBvcywgZnJvbUJsb2NrRW5kUG9zKTtcbiAgICAgICAgaWYgKHRvQmxvY2tJdGVyICYmICFpc1NhbWVCbG9jaykge1xuICAgICAgICAgIC8vIHByb2Nlc3MgaW50ZXJtZWRpYXRlIGJsb2Nrc1xuICAgICAgICAgIGZvciAobGV0IGJpID0gZnJvbUJsb2NrSXRlci5pbmRleCArIDE7IGJpIDwgdG9CbG9ja0l0ZXIuaW5kZXg7ICsrYmkpIHtcbiAgICAgICAgICAgIGZuKHRoaXMuX2Jsb2Nrc1tiaV0sIGJpLCAwLCB0aGlzLl9ibG9ja3NbYmldLmRpc3BsYXlWYWx1ZS5sZW5ndGgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHByb2Nlc3MgbGFzdCBibG9ja1xuICAgICAgICAgIGZuKHRoaXMuX2Jsb2Nrc1t0b0Jsb2NrSXRlci5pbmRleF0sIHRvQmxvY2tJdGVyLmluZGV4LCAwLCB0b0Jsb2NrSXRlci5vZmZzZXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJlbW92ZShmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVtb3ZlRGV0YWlscyA9IHN1cGVyLnJlbW92ZShmcm9tUG9zLCB0b1Bvcyk7XG4gICAgICB0aGlzLl9mb3JFYWNoQmxvY2tzSW5SYW5nZShmcm9tUG9zLCB0b1BvcywgKGIsIF8sIGJGcm9tUG9zLCBiVG9Qb3MpID0+IHtcbiAgICAgICAgcmVtb3ZlRGV0YWlscy5hZ2dyZWdhdGUoYi5yZW1vdmUoYkZyb21Qb3MsIGJUb1BvcykpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVtb3ZlRGV0YWlscztcbiAgICB9XG4gICAgbmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgZGlyZWN0aW9uKSB7XG4gICAgICBpZiAoZGlyZWN0aW9uID09PSB2b2lkIDApIHtcbiAgICAgICAgZGlyZWN0aW9uID0gRElSRUNUSU9OLk5PTkU7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuX2Jsb2Nrcy5sZW5ndGgpIHJldHVybiAwO1xuICAgICAgY29uc3QgY3Vyc29yID0gbmV3IFBhdHRlcm5DdXJzb3IodGhpcywgY3Vyc29yUG9zKTtcbiAgICAgIGlmIChkaXJlY3Rpb24gPT09IERJUkVDVElPTi5OT05FKSB7XG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgLy8gTk9ORSBzaG91bGQgb25seSBnbyBvdXQgZnJvbSBmaXhlZCB0byB0aGUgcmlnaHQhXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgaWYgKGN1cnNvci5wdXNoUmlnaHRCZWZvcmVJbnB1dCgpKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgY3Vyc29yLnBvcFN0YXRlKCk7XG4gICAgICAgIGlmIChjdXJzb3IucHVzaExlZnRCZWZvcmVJbnB1dCgpKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgLy8gRk9SQ0UgaXMgb25seSBhYm91dCBhfCogb3RoZXJ3aXNlIGlzIDBcbiAgICAgIGlmIChkaXJlY3Rpb24gPT09IERJUkVDVElPTi5MRUZUIHx8IGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkZPUkNFX0xFRlQpIHtcbiAgICAgICAgLy8gdHJ5IHRvIGJyZWFrIGZhc3Qgd2hlbiAqfGFcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkxFRlQpIHtcbiAgICAgICAgICBjdXJzb3IucHVzaFJpZ2h0QmVmb3JlRmlsbGVkKCk7XG4gICAgICAgICAgaWYgKGN1cnNvci5vayAmJiBjdXJzb3IucG9zID09PSBjdXJzb3JQb3MpIHJldHVybiBjdXJzb3JQb3M7XG4gICAgICAgICAgY3Vyc29yLnBvcFN0YXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3J3YXJkIGZsb3dcbiAgICAgICAgY3Vyc29yLnB1c2hMZWZ0QmVmb3JlSW5wdXQoKTtcbiAgICAgICAgY3Vyc29yLnB1c2hMZWZ0QmVmb3JlUmVxdWlyZWQoKTtcbiAgICAgICAgY3Vyc29yLnB1c2hMZWZ0QmVmb3JlRmlsbGVkKCk7XG5cbiAgICAgICAgLy8gYmFja3dhcmQgZmxvd1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSBESVJFQ1RJT04uTEVGVCkge1xuICAgICAgICAgIGN1cnNvci5wdXNoUmlnaHRCZWZvcmVJbnB1dCgpO1xuICAgICAgICAgIGN1cnNvci5wdXNoUmlnaHRCZWZvcmVSZXF1aXJlZCgpO1xuICAgICAgICAgIGlmIChjdXJzb3Iub2sgJiYgY3Vyc29yLnBvcyA8PSBjdXJzb3JQb3MpIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICAgIGN1cnNvci5wb3BTdGF0ZSgpO1xuICAgICAgICAgIGlmIChjdXJzb3Iub2sgJiYgY3Vyc29yLnBvcyA8PSBjdXJzb3JQb3MpIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICAgIGN1cnNvci5wb3BTdGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjdXJzb3Iub2spIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSBESVJFQ1RJT04uRk9SQ0VfTEVGVCkgcmV0dXJuIDA7XG4gICAgICAgIGN1cnNvci5wb3BTdGF0ZSgpO1xuICAgICAgICBpZiAoY3Vyc29yLm9rKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgY3Vyc29yLnBvcFN0YXRlKCk7XG4gICAgICAgIGlmIChjdXJzb3Iub2spIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIGlmIChkaXJlY3Rpb24gPT09IERJUkVDVElPTi5SSUdIVCB8fCBkaXJlY3Rpb24gPT09IERJUkVDVElPTi5GT1JDRV9SSUdIVCkge1xuICAgICAgICAvLyBmb3J3YXJkIGZsb3dcbiAgICAgICAgY3Vyc29yLnB1c2hSaWdodEJlZm9yZUlucHV0KCk7XG4gICAgICAgIGN1cnNvci5wdXNoUmlnaHRCZWZvcmVSZXF1aXJlZCgpO1xuICAgICAgICBpZiAoY3Vyc29yLnB1c2hSaWdodEJlZm9yZUZpbGxlZCgpKSByZXR1cm4gY3Vyc29yLnBvcztcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gRElSRUNUSU9OLkZPUkNFX1JJR0hUKSByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuXG4gICAgICAgIC8vIGJhY2t3YXJkIGZsb3dcbiAgICAgICAgY3Vyc29yLnBvcFN0YXRlKCk7XG4gICAgICAgIGlmIChjdXJzb3Iub2spIHJldHVybiBjdXJzb3IucG9zO1xuICAgICAgICBjdXJzb3IucG9wU3RhdGUoKTtcbiAgICAgICAgaWYgKGN1cnNvci5vaykgcmV0dXJuIGN1cnNvci5wb3M7XG4gICAgICAgIHJldHVybiB0aGlzLm5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIERJUkVDVElPTi5MRUZUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdXJzb3JQb3M7XG4gICAgfVxuICAgIHRvdGFsSW5wdXRQb3NpdGlvbnMoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGlmIChmcm9tUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgZnJvbVBvcyA9IDA7XG4gICAgICB9XG4gICAgICBpZiAodG9Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICB0b1BvcyA9IHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGxldCB0b3RhbCA9IDA7XG4gICAgICB0aGlzLl9mb3JFYWNoQmxvY2tzSW5SYW5nZShmcm9tUG9zLCB0b1BvcywgKGIsIF8sIGJGcm9tUG9zLCBiVG9Qb3MpID0+IHtcbiAgICAgICAgdG90YWwgKz0gYi50b3RhbElucHV0UG9zaXRpb25zKGJGcm9tUG9zLCBiVG9Qb3MpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdG90YWw7XG4gICAgfVxuXG4gICAgLyoqIEdldCBibG9jayBieSBuYW1lICovXG4gICAgbWFza2VkQmxvY2sobmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMubWFza2VkQmxvY2tzKG5hbWUpWzBdO1xuICAgIH1cblxuICAgIC8qKiBHZXQgYWxsIGJsb2NrcyBieSBuYW1lICovXG4gICAgbWFza2VkQmxvY2tzKG5hbWUpIHtcbiAgICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLl9tYXNrZWRCbG9ja3NbbmFtZV07XG4gICAgICBpZiAoIWluZGljZXMpIHJldHVybiBbXTtcbiAgICAgIHJldHVybiBpbmRpY2VzLm1hcChnaSA9PiB0aGlzLl9ibG9ja3NbZ2ldKTtcbiAgICB9XG4gICAgcGFkKGZsYWdzKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIHRoaXMuX2ZvckVhY2hCbG9ja3NJblJhbmdlKDAsIHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCwgYiA9PiBkZXRhaWxzLmFnZ3JlZ2F0ZShiLnBhZChmbGFncykpKTtcbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgfVxuICBNYXNrZWRQYXR0ZXJuLkRFRkFVTFRTID0ge1xuICAgIC4uLk1hc2tlZC5ERUZBVUxUUyxcbiAgICBsYXp5OiB0cnVlLFxuICAgIHBsYWNlaG9sZGVyQ2hhcjogJ18nXG4gIH07XG4gIE1hc2tlZFBhdHRlcm4uU1RPUF9DSEFSID0gJ2AnO1xuICBNYXNrZWRQYXR0ZXJuLkVTQ0FQRV9DSEFSID0gJ1xcXFwnO1xuICBNYXNrZWRQYXR0ZXJuLklucHV0RGVmaW5pdGlvbiA9IFBhdHRlcm5JbnB1dERlZmluaXRpb247XG4gIE1hc2tlZFBhdHRlcm4uRml4ZWREZWZpbml0aW9uID0gUGF0dGVybkZpeGVkRGVmaW5pdGlvbjtcbiAgSU1hc2suTWFza2VkUGF0dGVybiA9IE1hc2tlZFBhdHRlcm47XG5cbiAgLyoqIFBhdHRlcm4gd2hpY2ggYWNjZXB0cyByYW5nZXMgKi9cbiAgY2xhc3MgTWFza2VkUmFuZ2UgZXh0ZW5kcyBNYXNrZWRQYXR0ZXJuIHtcbiAgICAvKipcbiAgICAgIE9wdGlvbmFsbHkgc2V0cyBtYXggbGVuZ3RoIG9mIHBhdHRlcm4uXG4gICAgICBVc2VkIHdoZW4gcGF0dGVybiBsZW5ndGggaXMgbG9uZ2VyIHRoZW4gYHRvYCBwYXJhbSBsZW5ndGguIFBhZHMgemVyb3MgYXQgc3RhcnQgaW4gdGhpcyBjYXNlLlxuICAgICovXG5cbiAgICAvKiogTWluIGJvdW5kICovXG5cbiAgICAvKiogTWF4IGJvdW5kICovXG5cbiAgICBnZXQgX21hdGNoRnJvbSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1heExlbmd0aCAtIFN0cmluZyh0aGlzLmZyb20pLmxlbmd0aDtcbiAgICB9XG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgc3VwZXIob3B0cyk7IC8vIG1hc2sgd2lsbCBiZSBjcmVhdGVkIGluIF91cGRhdGVcbiAgICB9XG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgdG8gPSB0aGlzLnRvIHx8IDAsXG4gICAgICAgIGZyb20gPSB0aGlzLmZyb20gfHwgMCxcbiAgICAgICAgbWF4TGVuZ3RoID0gdGhpcy5tYXhMZW5ndGggfHwgMCxcbiAgICAgICAgYXV0b2ZpeCA9IHRoaXMuYXV0b2ZpeCxcbiAgICAgICAgLi4ucGF0dGVybk9wdHNcbiAgICAgIH0gPSBvcHRzO1xuICAgICAgdGhpcy50byA9IHRvO1xuICAgICAgdGhpcy5mcm9tID0gZnJvbTtcbiAgICAgIHRoaXMubWF4TGVuZ3RoID0gTWF0aC5tYXgoU3RyaW5nKHRvKS5sZW5ndGgsIG1heExlbmd0aCk7XG4gICAgICB0aGlzLmF1dG9maXggPSBhdXRvZml4O1xuICAgICAgY29uc3QgZnJvbVN0ciA9IFN0cmluZyh0aGlzLmZyb20pLnBhZFN0YXJ0KHRoaXMubWF4TGVuZ3RoLCAnMCcpO1xuICAgICAgY29uc3QgdG9TdHIgPSBTdHJpbmcodGhpcy50bykucGFkU3RhcnQodGhpcy5tYXhMZW5ndGgsICcwJyk7XG4gICAgICBsZXQgc2FtZUNoYXJzQ291bnQgPSAwO1xuICAgICAgd2hpbGUgKHNhbWVDaGFyc0NvdW50IDwgdG9TdHIubGVuZ3RoICYmIHRvU3RyW3NhbWVDaGFyc0NvdW50XSA9PT0gZnJvbVN0cltzYW1lQ2hhcnNDb3VudF0pICsrc2FtZUNoYXJzQ291bnQ7XG4gICAgICBwYXR0ZXJuT3B0cy5tYXNrID0gdG9TdHIuc2xpY2UoMCwgc2FtZUNoYXJzQ291bnQpLnJlcGxhY2UoLzAvZywgJ1xcXFwwJykgKyAnMCcucmVwZWF0KHRoaXMubWF4TGVuZ3RoIC0gc2FtZUNoYXJzQ291bnQpO1xuICAgICAgc3VwZXIuX3VwZGF0ZShwYXR0ZXJuT3B0cyk7XG4gICAgfVxuICAgIGdldCBpc0NvbXBsZXRlKCkge1xuICAgICAgcmV0dXJuIHN1cGVyLmlzQ29tcGxldGUgJiYgQm9vbGVhbih0aGlzLnZhbHVlKTtcbiAgICB9XG4gICAgYm91bmRhcmllcyhzdHIpIHtcbiAgICAgIGxldCBtaW5zdHIgPSAnJztcbiAgICAgIGxldCBtYXhzdHIgPSAnJztcbiAgICAgIGNvbnN0IFssIHBsYWNlaG9sZGVyLCBudW1dID0gc3RyLm1hdGNoKC9eKFxcRCopKFxcZCopKFxcRCopLykgfHwgW107XG4gICAgICBpZiAobnVtKSB7XG4gICAgICAgIG1pbnN0ciA9ICcwJy5yZXBlYXQocGxhY2Vob2xkZXIubGVuZ3RoKSArIG51bTtcbiAgICAgICAgbWF4c3RyID0gJzknLnJlcGVhdChwbGFjZWhvbGRlci5sZW5ndGgpICsgbnVtO1xuICAgICAgfVxuICAgICAgbWluc3RyID0gbWluc3RyLnBhZEVuZCh0aGlzLm1heExlbmd0aCwgJzAnKTtcbiAgICAgIG1heHN0ciA9IG1heHN0ci5wYWRFbmQodGhpcy5tYXhMZW5ndGgsICc5Jyk7XG4gICAgICByZXR1cm4gW21pbnN0ciwgbWF4c3RyXTtcbiAgICB9XG4gICAgZG9QcmVwYXJlQ2hhcihjaCwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBsZXQgZGV0YWlscztcbiAgICAgIFtjaCwgZGV0YWlsc10gPSBzdXBlci5kb1ByZXBhcmVDaGFyKGNoLnJlcGxhY2UoL1xcRC9nLCAnJyksIGZsYWdzKTtcbiAgICAgIGlmICghY2gpIGRldGFpbHMuc2tpcCA9ICF0aGlzLmlzQ29tcGxldGU7XG4gICAgICByZXR1cm4gW2NoLCBkZXRhaWxzXTtcbiAgICB9XG4gICAgX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLmF1dG9maXggfHwgdGhpcy52YWx1ZS5sZW5ndGggKyAxID4gdGhpcy5tYXhMZW5ndGgpIHJldHVybiBzdXBlci5fYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpO1xuICAgICAgY29uc3QgZnJvbVN0ciA9IFN0cmluZyh0aGlzLmZyb20pLnBhZFN0YXJ0KHRoaXMubWF4TGVuZ3RoLCAnMCcpO1xuICAgICAgY29uc3QgdG9TdHIgPSBTdHJpbmcodGhpcy50bykucGFkU3RhcnQodGhpcy5tYXhMZW5ndGgsICcwJyk7XG4gICAgICBjb25zdCBbbWluc3RyLCBtYXhzdHJdID0gdGhpcy5ib3VuZGFyaWVzKHRoaXMudmFsdWUgKyBjaCk7XG4gICAgICBpZiAoTnVtYmVyKG1heHN0cikgPCB0aGlzLmZyb20pIHJldHVybiBzdXBlci5fYXBwZW5kQ2hhclJhdyhmcm9tU3RyW3RoaXMudmFsdWUubGVuZ3RoXSwgZmxhZ3MpO1xuICAgICAgaWYgKE51bWJlcihtaW5zdHIpID4gdGhpcy50bykge1xuICAgICAgICBpZiAoIWZsYWdzLnRhaWwgJiYgdGhpcy5hdXRvZml4ID09PSAncGFkJyAmJiB0aGlzLnZhbHVlLmxlbmd0aCArIDEgPCB0aGlzLm1heExlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBzdXBlci5fYXBwZW5kQ2hhclJhdyhmcm9tU3RyW3RoaXMudmFsdWUubGVuZ3RoXSwgZmxhZ3MpLmFnZ3JlZ2F0ZSh0aGlzLl9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdXBlci5fYXBwZW5kQ2hhclJhdyh0b1N0clt0aGlzLnZhbHVlLmxlbmd0aF0sIGZsYWdzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdXBlci5fYXBwZW5kQ2hhclJhdyhjaCwgZmxhZ3MpO1xuICAgIH1cbiAgICBkb1ZhbGlkYXRlKGZsYWdzKSB7XG4gICAgICBjb25zdCBzdHIgPSB0aGlzLnZhbHVlO1xuICAgICAgY29uc3QgZmlyc3ROb25aZXJvID0gc3RyLnNlYXJjaCgvW14wXS8pO1xuICAgICAgaWYgKGZpcnN0Tm9uWmVybyA9PT0gLTEgJiYgc3RyLmxlbmd0aCA8PSB0aGlzLl9tYXRjaEZyb20pIHJldHVybiB0cnVlO1xuICAgICAgY29uc3QgW21pbnN0ciwgbWF4c3RyXSA9IHRoaXMuYm91bmRhcmllcyhzdHIpO1xuICAgICAgcmV0dXJuIHRoaXMuZnJvbSA8PSBOdW1iZXIobWF4c3RyKSAmJiBOdW1iZXIobWluc3RyKSA8PSB0aGlzLnRvICYmIHN1cGVyLmRvVmFsaWRhdGUoZmxhZ3MpO1xuICAgIH1cbiAgICBwYWQoZmxhZ3MpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgaWYgKHRoaXMudmFsdWUubGVuZ3RoID09PSB0aGlzLm1heExlbmd0aCkgcmV0dXJuIGRldGFpbHM7XG4gICAgICBjb25zdCB2YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICBjb25zdCBwYWRMZW5ndGggPSB0aGlzLm1heExlbmd0aCAtIHRoaXMudmFsdWUubGVuZ3RoO1xuICAgICAgaWYgKHBhZExlbmd0aCkge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFkTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZShzdXBlci5fYXBwZW5kQ2hhclJhdygnMCcsIGZsYWdzKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhcHBlbmQgdGFpbFxuICAgICAgICB2YWx1ZS5zcGxpdCgnJykuZm9yRWFjaChjaCA9PiB0aGlzLl9hcHBlbmRDaGFyUmF3KGNoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gIH1cbiAgSU1hc2suTWFza2VkUmFuZ2UgPSBNYXNrZWRSYW5nZTtcblxuICBjb25zdCBEZWZhdWx0UGF0dGVybiA9ICdkey59YG17Ln1gWSc7XG5cbiAgLy8gTWFrZSBmb3JtYXQgYW5kIHBhcnNlIHJlcXVpcmVkIHdoZW4gcGF0dGVybiBpcyBwcm92aWRlZFxuXG4gIC8qKiBEYXRlIG1hc2sgKi9cbiAgY2xhc3MgTWFza2VkRGF0ZSBleHRlbmRzIE1hc2tlZFBhdHRlcm4ge1xuICAgIHN0YXRpYyBleHRyYWN0UGF0dGVybk9wdGlvbnMob3B0cykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBtYXNrLFxuICAgICAgICBwYXR0ZXJuLFxuICAgICAgICAuLi5wYXR0ZXJuT3B0c1xuICAgICAgfSA9IG9wdHM7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5wYXR0ZXJuT3B0cyxcbiAgICAgICAgbWFzazogaXNTdHJpbmcobWFzaykgPyBtYXNrIDogcGF0dGVyblxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKiogUGF0dGVybiBtYXNrIGZvciBkYXRlIGFjY29yZGluZyB0byB7QGxpbmsgTWFza2VkRGF0ZSNmb3JtYXR9ICovXG5cbiAgICAvKiogU3RhcnQgZGF0ZSAqL1xuXG4gICAgLyoqIEVuZCBkYXRlICovXG5cbiAgICAvKiogRm9ybWF0IHR5cGVkIHZhbHVlIHRvIHN0cmluZyAqL1xuXG4gICAgLyoqIFBhcnNlIHN0cmluZyB0byBnZXQgdHlwZWQgdmFsdWUgKi9cblxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIHN1cGVyKE1hc2tlZERhdGUuZXh0cmFjdFBhdHRlcm5PcHRpb25zKHtcbiAgICAgICAgLi4uTWFza2VkRGF0ZS5ERUZBVUxUUyxcbiAgICAgICAgLi4ub3B0c1xuICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBtYXNrLFxuICAgICAgICBwYXR0ZXJuLFxuICAgICAgICBibG9ja3MsXG4gICAgICAgIC4uLnBhdHRlcm5PcHRzXG4gICAgICB9ID0ge1xuICAgICAgICAuLi5NYXNrZWREYXRlLkRFRkFVTFRTLFxuICAgICAgICAuLi5vcHRzXG4gICAgICB9O1xuICAgICAgY29uc3QgcGF0dGVybkJsb2NrcyA9IE9iamVjdC5hc3NpZ24oe30sIE1hc2tlZERhdGUuR0VUX0RFRkFVTFRfQkxPQ0tTKCkpO1xuICAgICAgLy8gYWRqdXN0IHllYXIgYmxvY2tcbiAgICAgIGlmIChvcHRzLm1pbikgcGF0dGVybkJsb2Nrcy5ZLmZyb20gPSBvcHRzLm1pbi5nZXRGdWxsWWVhcigpO1xuICAgICAgaWYgKG9wdHMubWF4KSBwYXR0ZXJuQmxvY2tzLlkudG8gPSBvcHRzLm1heC5nZXRGdWxsWWVhcigpO1xuICAgICAgaWYgKG9wdHMubWluICYmIG9wdHMubWF4ICYmIHBhdHRlcm5CbG9ja3MuWS5mcm9tID09PSBwYXR0ZXJuQmxvY2tzLlkudG8pIHtcbiAgICAgICAgcGF0dGVybkJsb2Nrcy5tLmZyb20gPSBvcHRzLm1pbi5nZXRNb250aCgpICsgMTtcbiAgICAgICAgcGF0dGVybkJsb2Nrcy5tLnRvID0gb3B0cy5tYXguZ2V0TW9udGgoKSArIDE7XG4gICAgICAgIGlmIChwYXR0ZXJuQmxvY2tzLm0uZnJvbSA9PT0gcGF0dGVybkJsb2Nrcy5tLnRvKSB7XG4gICAgICAgICAgcGF0dGVybkJsb2Nrcy5kLmZyb20gPSBvcHRzLm1pbi5nZXREYXRlKCk7XG4gICAgICAgICAgcGF0dGVybkJsb2Nrcy5kLnRvID0gb3B0cy5tYXguZ2V0RGF0ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBPYmplY3QuYXNzaWduKHBhdHRlcm5CbG9ja3MsIHRoaXMuYmxvY2tzLCBibG9ja3MpO1xuICAgICAgc3VwZXIuX3VwZGF0ZSh7XG4gICAgICAgIC4uLnBhdHRlcm5PcHRzLFxuICAgICAgICBtYXNrOiBpc1N0cmluZyhtYXNrKSA/IG1hc2sgOiBwYXR0ZXJuLFxuICAgICAgICBibG9ja3M6IHBhdHRlcm5CbG9ja3NcbiAgICAgIH0pO1xuICAgIH1cbiAgICBkb1ZhbGlkYXRlKGZsYWdzKSB7XG4gICAgICBjb25zdCBkYXRlID0gdGhpcy5kYXRlO1xuICAgICAgcmV0dXJuIHN1cGVyLmRvVmFsaWRhdGUoZmxhZ3MpICYmICghdGhpcy5pc0NvbXBsZXRlIHx8IHRoaXMuaXNEYXRlRXhpc3QodGhpcy52YWx1ZSkgJiYgZGF0ZSAhPSBudWxsICYmICh0aGlzLm1pbiA9PSBudWxsIHx8IHRoaXMubWluIDw9IGRhdGUpICYmICh0aGlzLm1heCA9PSBudWxsIHx8IGRhdGUgPD0gdGhpcy5tYXgpKTtcbiAgICB9XG5cbiAgICAvKiogQ2hlY2tzIGlmIGRhdGUgaXMgZXhpc3RzICovXG4gICAgaXNEYXRlRXhpc3Qoc3RyKSB7XG4gICAgICByZXR1cm4gdGhpcy5mb3JtYXQodGhpcy5wYXJzZShzdHIsIHRoaXMpLCB0aGlzKS5pbmRleE9mKHN0cikgPj0gMDtcbiAgICB9XG5cbiAgICAvKiogUGFyc2VkIERhdGUgKi9cbiAgICBnZXQgZGF0ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLnR5cGVkVmFsdWU7XG4gICAgfVxuICAgIHNldCBkYXRlKGRhdGUpIHtcbiAgICAgIHRoaXMudHlwZWRWYWx1ZSA9IGRhdGU7XG4gICAgfVxuICAgIGdldCB0eXBlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaXNDb21wbGV0ZSA/IHN1cGVyLnR5cGVkVmFsdWUgOiBudWxsO1xuICAgIH1cbiAgICBzZXQgdHlwZWRWYWx1ZSh2YWx1ZSkge1xuICAgICAgc3VwZXIudHlwZWRWYWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBtYXNrRXF1YWxzKG1hc2spIHtcbiAgICAgIHJldHVybiBtYXNrID09PSBEYXRlIHx8IHN1cGVyLm1hc2tFcXVhbHMobWFzayk7XG4gICAgfVxuICAgIG9wdGlvbnNJc0NoYW5nZWQob3B0cykge1xuICAgICAgcmV0dXJuIHN1cGVyLm9wdGlvbnNJc0NoYW5nZWQoTWFza2VkRGF0ZS5leHRyYWN0UGF0dGVybk9wdGlvbnMob3B0cykpO1xuICAgIH1cbiAgfVxuICBNYXNrZWREYXRlLkdFVF9ERUZBVUxUX0JMT0NLUyA9ICgpID0+ICh7XG4gICAgZDoge1xuICAgICAgbWFzazogTWFza2VkUmFuZ2UsXG4gICAgICBmcm9tOiAxLFxuICAgICAgdG86IDMxLFxuICAgICAgbWF4TGVuZ3RoOiAyXG4gICAgfSxcbiAgICBtOiB7XG4gICAgICBtYXNrOiBNYXNrZWRSYW5nZSxcbiAgICAgIGZyb206IDEsXG4gICAgICB0bzogMTIsXG4gICAgICBtYXhMZW5ndGg6IDJcbiAgICB9LFxuICAgIFk6IHtcbiAgICAgIG1hc2s6IE1hc2tlZFJhbmdlLFxuICAgICAgZnJvbTogMTkwMCxcbiAgICAgIHRvOiA5OTk5XG4gICAgfVxuICB9KTtcbiAgTWFza2VkRGF0ZS5ERUZBVUxUUyA9IHtcbiAgICAuLi5NYXNrZWRQYXR0ZXJuLkRFRkFVTFRTLFxuICAgIG1hc2s6IERhdGUsXG4gICAgcGF0dGVybjogRGVmYXVsdFBhdHRlcm4sXG4gICAgZm9ybWF0OiAoZGF0ZSwgbWFza2VkKSA9PiB7XG4gICAgICBpZiAoIWRhdGUpIHJldHVybiAnJztcbiAgICAgIGNvbnN0IGRheSA9IFN0cmluZyhkYXRlLmdldERhdGUoKSkucGFkU3RhcnQoMiwgJzAnKTtcbiAgICAgIGNvbnN0IG1vbnRoID0gU3RyaW5nKGRhdGUuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsICcwJyk7XG4gICAgICBjb25zdCB5ZWFyID0gZGF0ZS5nZXRGdWxsWWVhcigpO1xuICAgICAgcmV0dXJuIFtkYXksIG1vbnRoLCB5ZWFyXS5qb2luKCcuJyk7XG4gICAgfSxcbiAgICBwYXJzZTogKHN0ciwgbWFza2VkKSA9PiB7XG4gICAgICBjb25zdCBbZGF5LCBtb250aCwgeWVhcl0gPSBzdHIuc3BsaXQoJy4nKS5tYXAoTnVtYmVyKTtcbiAgICAgIHJldHVybiBuZXcgRGF0ZSh5ZWFyLCBtb250aCAtIDEsIGRheSk7XG4gICAgfVxuICB9O1xuICBJTWFzay5NYXNrZWREYXRlID0gTWFza2VkRGF0ZTtcblxuICAvKiogRHluYW1pYyBtYXNrIGZvciBjaG9vc2luZyBhcHByb3ByaWF0ZSBtYXNrIGluIHJ1bi10aW1lICovXG4gIGNsYXNzIE1hc2tlZER5bmFtaWMgZXh0ZW5kcyBNYXNrZWQge1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgIHN1cGVyKHtcbiAgICAgICAgLi4uTWFza2VkRHluYW1pYy5ERUZBVUxUUyxcbiAgICAgICAgLi4ub3B0c1xuICAgICAgfSk7XG4gICAgICB0aGlzLmN1cnJlbnRNYXNrID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgc3VwZXIuX3VwZGF0ZShvcHRzKTtcbiAgICAgIGlmICgnbWFzaycgaW4gb3B0cykge1xuICAgICAgICB0aGlzLmV4cG9zZU1hc2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIC8vIG1hc2sgY291bGQgYmUgdG90YWxseSBkeW5hbWljIHdpdGggb25seSBgZGlzcGF0Y2hgIG9wdGlvblxuICAgICAgICB0aGlzLmNvbXBpbGVkTWFza3MgPSBBcnJheS5pc0FycmF5KG9wdHMubWFzaykgPyBvcHRzLm1hc2subWFwKG0gPT4ge1xuICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGV4cG9zZSxcbiAgICAgICAgICAgIC4uLm1hc2tPcHRzXG4gICAgICAgICAgfSA9IG5vcm1hbGl6ZU9wdHMobSk7XG4gICAgICAgICAgY29uc3QgbWFza2VkID0gY3JlYXRlTWFzayh7XG4gICAgICAgICAgICBvdmVyd3JpdGU6IHRoaXMuX292ZXJ3cml0ZSxcbiAgICAgICAgICAgIGVhZ2VyOiB0aGlzLl9lYWdlcixcbiAgICAgICAgICAgIHNraXBJbnZhbGlkOiB0aGlzLl9za2lwSW52YWxpZCxcbiAgICAgICAgICAgIC4uLm1hc2tPcHRzXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKGV4cG9zZSkgdGhpcy5leHBvc2VNYXNrID0gbWFza2VkO1xuICAgICAgICAgIHJldHVybiBtYXNrZWQ7XG4gICAgICAgIH0pIDogW107XG5cbiAgICAgICAgLy8gdGhpcy5jdXJyZW50TWFzayA9IHRoaXMuZG9EaXNwYXRjaCgnJyk7IC8vIHByb2JhYmx5IG5vdCBuZWVkZWQgYnV0IGxldHMgc2VlXG4gICAgICB9XG4gICAgfVxuICAgIF9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLl9hcHBseURpc3BhdGNoKGNoLCBmbGFncyk7XG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykge1xuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLmN1cnJlbnRNYXNrLl9hcHBlbmRDaGFyKGNoLCB0aGlzLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgX2FwcGx5RGlzcGF0Y2goYXBwZW5kZWQsIGZsYWdzLCB0YWlsKSB7XG4gICAgICBpZiAoYXBwZW5kZWQgPT09IHZvaWQgMCkge1xuICAgICAgICBhcHBlbmRlZCA9ICcnO1xuICAgICAgfVxuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICh0YWlsID09PSB2b2lkIDApIHtcbiAgICAgICAgdGFpbCA9ICcnO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJldlZhbHVlQmVmb3JlVGFpbCA9IGZsYWdzLnRhaWwgJiYgZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSAhPSBudWxsID8gZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZS5fdmFsdWUgOiB0aGlzLnZhbHVlO1xuICAgICAgY29uc3QgaW5wdXRWYWx1ZSA9IHRoaXMucmF3SW5wdXRWYWx1ZTtcbiAgICAgIGNvbnN0IGluc2VydFZhbHVlID0gZmxhZ3MudGFpbCAmJiBmbGFncy5fYmVmb3JlVGFpbFN0YXRlICE9IG51bGwgPyBmbGFncy5fYmVmb3JlVGFpbFN0YXRlLl9yYXdJbnB1dFZhbHVlIDogaW5wdXRWYWx1ZTtcbiAgICAgIGNvbnN0IHRhaWxWYWx1ZSA9IGlucHV0VmFsdWUuc2xpY2UoaW5zZXJ0VmFsdWUubGVuZ3RoKTtcbiAgICAgIGNvbnN0IHByZXZNYXNrID0gdGhpcy5jdXJyZW50TWFzaztcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgY29uc3QgcHJldk1hc2tTdGF0ZSA9IHByZXZNYXNrID09IG51bGwgPyB2b2lkIDAgOiBwcmV2TWFzay5zdGF0ZTtcblxuICAgICAgLy8gY2xvbmUgZmxhZ3MgdG8gcHJldmVudCBvdmVyd3JpdGluZyBgX2JlZm9yZVRhaWxTdGF0ZWBcbiAgICAgIHRoaXMuY3VycmVudE1hc2sgPSB0aGlzLmRvRGlzcGF0Y2goYXBwZW5kZWQsIHtcbiAgICAgICAgLi4uZmxhZ3NcbiAgICAgIH0sIHRhaWwpO1xuXG4gICAgICAvLyByZXN0b3JlIHN0YXRlIGFmdGVyIGRpc3BhdGNoXG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50TWFzayAhPT0gcHJldk1hc2spIHtcbiAgICAgICAgICAvLyBpZiBtYXNrIGNoYW5nZWQgcmVhcHBseSBpbnB1dFxuICAgICAgICAgIHRoaXMuY3VycmVudE1hc2sucmVzZXQoKTtcbiAgICAgICAgICBpZiAoaW5zZXJ0VmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudE1hc2suYXBwZW5kKGluc2VydFZhbHVlLCB7XG4gICAgICAgICAgICAgIHJhdzogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkZXRhaWxzLnRhaWxTaGlmdCA9IHRoaXMuY3VycmVudE1hc2sudmFsdWUubGVuZ3RoIC0gcHJldlZhbHVlQmVmb3JlVGFpbC5sZW5ndGg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0YWlsVmFsdWUpIHtcbiAgICAgICAgICAgIGRldGFpbHMudGFpbFNoaWZ0ICs9IHRoaXMuY3VycmVudE1hc2suYXBwZW5kKHRhaWxWYWx1ZSwge1xuICAgICAgICAgICAgICByYXc6IHRydWUsXG4gICAgICAgICAgICAgIHRhaWw6IHRydWVcbiAgICAgICAgICAgIH0pLnRhaWxTaGlmdDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocHJldk1hc2tTdGF0ZSkge1xuICAgICAgICAgIC8vIERpc3BhdGNoIGNhbiBkbyBzb21ldGhpbmcgYmFkIHdpdGggc3RhdGUsIHNvXG4gICAgICAgICAgLy8gcmVzdG9yZSBwcmV2IG1hc2sgc3RhdGVcbiAgICAgICAgICB0aGlzLmN1cnJlbnRNYXNrLnN0YXRlID0gcHJldk1hc2tTdGF0ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIF9hcHBlbmRQbGFjZWhvbGRlcigpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLl9hcHBseURpc3BhdGNoKCk7XG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykge1xuICAgICAgICBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLmN1cnJlbnRNYXNrLl9hcHBlbmRQbGFjZWhvbGRlcigpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXRhaWxzO1xuICAgIH1cbiAgICBfYXBwZW5kRWFnZXIoKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gdGhpcy5fYXBwbHlEaXNwYXRjaCgpO1xuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHtcbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5jdXJyZW50TWFzay5fYXBwZW5kRWFnZXIoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgYXBwZW5kVGFpbCh0YWlsKSB7XG4gICAgICBjb25zdCBkZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoKTtcbiAgICAgIGlmICh0YWlsKSBkZXRhaWxzLmFnZ3JlZ2F0ZSh0aGlzLl9hcHBseURpc3BhdGNoKCcnLCB7fSwgdGFpbCkpO1xuICAgICAgcmV0dXJuIGRldGFpbHMuYWdncmVnYXRlKHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLmFwcGVuZFRhaWwodGFpbCkgOiBzdXBlci5hcHBlbmRUYWlsKHRhaWwpKTtcbiAgICB9XG4gICAgY3VycmVudE1hc2tGbGFncyhmbGFncykge1xuICAgICAgdmFyIF9mbGFncyRfYmVmb3JlVGFpbFN0YSwgX2ZsYWdzJF9iZWZvcmVUYWlsU3RhMjtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmZsYWdzLFxuICAgICAgICBfYmVmb3JlVGFpbFN0YXRlOiAoKF9mbGFncyRfYmVmb3JlVGFpbFN0YSA9IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUpID09IG51bGwgPyB2b2lkIDAgOiBfZmxhZ3MkX2JlZm9yZVRhaWxTdGEuY3VycmVudE1hc2tSZWYpID09PSB0aGlzLmN1cnJlbnRNYXNrICYmICgoX2ZsYWdzJF9iZWZvcmVUYWlsU3RhMiA9IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUpID09IG51bGwgPyB2b2lkIDAgOiBfZmxhZ3MkX2JlZm9yZVRhaWxTdGEyLmN1cnJlbnRNYXNrKSB8fCBmbGFncy5fYmVmb3JlVGFpbFN0YXRlXG4gICAgICB9O1xuICAgIH1cbiAgICBkb0Rpc3BhdGNoKGFwcGVuZGVkLCBmbGFncywgdGFpbCkge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICh0YWlsID09PSB2b2lkIDApIHtcbiAgICAgICAgdGFpbCA9ICcnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goYXBwZW5kZWQsIHRoaXMsIGZsYWdzLCB0YWlsKTtcbiAgICB9XG4gICAgZG9WYWxpZGF0ZShmbGFncykge1xuICAgICAgcmV0dXJuIHN1cGVyLmRvVmFsaWRhdGUoZmxhZ3MpICYmICghdGhpcy5jdXJyZW50TWFzayB8fCB0aGlzLmN1cnJlbnRNYXNrLmRvVmFsaWRhdGUodGhpcy5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSkpO1xuICAgIH1cbiAgICBkb1ByZXBhcmUoc3RyLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGxldCBbcywgZGV0YWlsc10gPSBzdXBlci5kb1ByZXBhcmUoc3RyLCBmbGFncyk7XG4gICAgICBpZiAodGhpcy5jdXJyZW50TWFzaykge1xuICAgICAgICBsZXQgY3VycmVudERldGFpbHM7XG4gICAgICAgIFtzLCBjdXJyZW50RGV0YWlsc10gPSBzdXBlci5kb1ByZXBhcmUocywgdGhpcy5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSk7XG4gICAgICAgIGRldGFpbHMgPSBkZXRhaWxzLmFnZ3JlZ2F0ZShjdXJyZW50RGV0YWlscyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gW3MsIGRldGFpbHNdO1xuICAgIH1cbiAgICBkb1ByZXBhcmVDaGFyKHN0ciwgZmxhZ3MpIHtcbiAgICAgIGlmIChmbGFncyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZsYWdzID0ge307XG4gICAgICB9XG4gICAgICBsZXQgW3MsIGRldGFpbHNdID0gc3VwZXIuZG9QcmVwYXJlQ2hhcihzdHIsIGZsYWdzKTtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRNYXNrKSB7XG4gICAgICAgIGxldCBjdXJyZW50RGV0YWlscztcbiAgICAgICAgW3MsIGN1cnJlbnREZXRhaWxzXSA9IHN1cGVyLmRvUHJlcGFyZUNoYXIocywgdGhpcy5jdXJyZW50TWFza0ZsYWdzKGZsYWdzKSk7XG4gICAgICAgIGRldGFpbHMgPSBkZXRhaWxzLmFnZ3JlZ2F0ZShjdXJyZW50RGV0YWlscyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gW3MsIGRldGFpbHNdO1xuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgIHZhciBfdGhpcyRjdXJyZW50TWFzaztcbiAgICAgIChfdGhpcyRjdXJyZW50TWFzayA9IHRoaXMuY3VycmVudE1hc2spID09IG51bGwgfHwgX3RoaXMkY3VycmVudE1hc2sucmVzZXQoKTtcbiAgICAgIHRoaXMuY29tcGlsZWRNYXNrcy5mb3JFYWNoKG0gPT4gbS5yZXNldCgpKTtcbiAgICB9XG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwb3NlTWFzayA/IHRoaXMuZXhwb3NlTWFzay52YWx1ZSA6IHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLnZhbHVlIDogJyc7XG4gICAgfVxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZXhwb3NlTWFzaykge1xuICAgICAgICB0aGlzLmV4cG9zZU1hc2sudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWFzayA9IHRoaXMuZXhwb3NlTWFzaztcbiAgICAgICAgdGhpcy5fYXBwbHlEaXNwYXRjaCgpO1xuICAgICAgfSBlbHNlIHN1cGVyLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIGdldCB1bm1hc2tlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZXhwb3NlTWFzayA/IHRoaXMuZXhwb3NlTWFzay51bm1hc2tlZFZhbHVlIDogdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2sudW5tYXNrZWRWYWx1ZSA6ICcnO1xuICAgIH1cbiAgICBzZXQgdW5tYXNrZWRWYWx1ZSh1bm1hc2tlZFZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5leHBvc2VNYXNrKSB7XG4gICAgICAgIHRoaXMuZXhwb3NlTWFzay51bm1hc2tlZFZhbHVlID0gdW5tYXNrZWRWYWx1ZTtcbiAgICAgICAgdGhpcy5jdXJyZW50TWFzayA9IHRoaXMuZXhwb3NlTWFzaztcbiAgICAgICAgdGhpcy5fYXBwbHlEaXNwYXRjaCgpO1xuICAgICAgfSBlbHNlIHN1cGVyLnVubWFza2VkVmFsdWUgPSB1bm1hc2tlZFZhbHVlO1xuICAgIH1cbiAgICBnZXQgdHlwZWRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLmV4cG9zZU1hc2sgPyB0aGlzLmV4cG9zZU1hc2sudHlwZWRWYWx1ZSA6IHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLnR5cGVkVmFsdWUgOiAnJztcbiAgICB9XG4gICAgc2V0IHR5cGVkVmFsdWUodHlwZWRWYWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZXhwb3NlTWFzaykge1xuICAgICAgICB0aGlzLmV4cG9zZU1hc2sudHlwZWRWYWx1ZSA9IHR5cGVkVmFsdWU7XG4gICAgICAgIHRoaXMuY3VycmVudE1hc2sgPSB0aGlzLmV4cG9zZU1hc2s7XG4gICAgICAgIHRoaXMuX2FwcGx5RGlzcGF0Y2goKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbGV0IHVubWFza2VkVmFsdWUgPSBTdHJpbmcodHlwZWRWYWx1ZSk7XG5cbiAgICAgIC8vIGRvdWJsZSBjaGVjayBpdFxuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHtcbiAgICAgICAgdGhpcy5jdXJyZW50TWFzay50eXBlZFZhbHVlID0gdHlwZWRWYWx1ZTtcbiAgICAgICAgdW5tYXNrZWRWYWx1ZSA9IHRoaXMuY3VycmVudE1hc2sudW5tYXNrZWRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMudW5tYXNrZWRWYWx1ZSA9IHVubWFza2VkVmFsdWU7XG4gICAgfVxuICAgIGdldCBkaXNwbGF5VmFsdWUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2suZGlzcGxheVZhbHVlIDogJyc7XG4gICAgfVxuICAgIGdldCBpc0NvbXBsZXRlKCkge1xuICAgICAgdmFyIF90aGlzJGN1cnJlbnRNYXNrMjtcbiAgICAgIHJldHVybiBCb29sZWFuKChfdGhpcyRjdXJyZW50TWFzazIgPSB0aGlzLmN1cnJlbnRNYXNrKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkY3VycmVudE1hc2syLmlzQ29tcGxldGUpO1xuICAgIH1cbiAgICBnZXQgaXNGaWxsZWQoKSB7XG4gICAgICB2YXIgX3RoaXMkY3VycmVudE1hc2szO1xuICAgICAgcmV0dXJuIEJvb2xlYW4oKF90aGlzJGN1cnJlbnRNYXNrMyA9IHRoaXMuY3VycmVudE1hc2spID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRjdXJyZW50TWFzazMuaXNGaWxsZWQpO1xuICAgIH1cbiAgICByZW1vdmUoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIGNvbnN0IGRldGFpbHMgPSBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHtcbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5jdXJyZW50TWFzay5yZW1vdmUoZnJvbVBvcywgdG9Qb3MpKVxuICAgICAgICAvLyB1cGRhdGUgd2l0aCBkaXNwYXRjaFxuICAgICAgICAuYWdncmVnYXRlKHRoaXMuX2FwcGx5RGlzcGF0Y2goKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgdmFyIF90aGlzJGN1cnJlbnRNYXNrNDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnN1cGVyLnN0YXRlLFxuICAgICAgICBfcmF3SW5wdXRWYWx1ZTogdGhpcy5yYXdJbnB1dFZhbHVlLFxuICAgICAgICBjb21waWxlZE1hc2tzOiB0aGlzLmNvbXBpbGVkTWFza3MubWFwKG0gPT4gbS5zdGF0ZSksXG4gICAgICAgIGN1cnJlbnRNYXNrUmVmOiB0aGlzLmN1cnJlbnRNYXNrLFxuICAgICAgICBjdXJyZW50TWFzazogKF90aGlzJGN1cnJlbnRNYXNrNCA9IHRoaXMuY3VycmVudE1hc2spID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRjdXJyZW50TWFzazQuc3RhdGVcbiAgICAgIH07XG4gICAgfVxuICAgIHNldCBzdGF0ZShzdGF0ZSkge1xuICAgICAgY29uc3Qge1xuICAgICAgICBjb21waWxlZE1hc2tzLFxuICAgICAgICBjdXJyZW50TWFza1JlZixcbiAgICAgICAgY3VycmVudE1hc2ssXG4gICAgICAgIC4uLm1hc2tlZFN0YXRlXG4gICAgICB9ID0gc3RhdGU7XG4gICAgICBpZiAoY29tcGlsZWRNYXNrcykgdGhpcy5jb21waWxlZE1hc2tzLmZvckVhY2goKG0sIG1pKSA9PiBtLnN0YXRlID0gY29tcGlsZWRNYXNrc1ttaV0pO1xuICAgICAgaWYgKGN1cnJlbnRNYXNrUmVmICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50TWFzayA9IGN1cnJlbnRNYXNrUmVmO1xuICAgICAgICB0aGlzLmN1cnJlbnRNYXNrLnN0YXRlID0gY3VycmVudE1hc2s7XG4gICAgICB9XG4gICAgICBzdXBlci5zdGF0ZSA9IG1hc2tlZFN0YXRlO1xuICAgIH1cbiAgICBleHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2suZXh0cmFjdElucHV0KGZyb21Qb3MsIHRvUG9zLCBmbGFncykgOiAnJztcbiAgICB9XG4gICAgZXh0cmFjdFRhaWwoZnJvbVBvcywgdG9Qb3MpIHtcbiAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRNYXNrID8gdGhpcy5jdXJyZW50TWFzay5leHRyYWN0VGFpbChmcm9tUG9zLCB0b1BvcykgOiBzdXBlci5leHRyYWN0VGFpbChmcm9tUG9zLCB0b1Bvcyk7XG4gICAgfVxuICAgIGRvQ29tbWl0KCkge1xuICAgICAgaWYgKHRoaXMuY3VycmVudE1hc2spIHRoaXMuY3VycmVudE1hc2suZG9Db21taXQoKTtcbiAgICAgIHN1cGVyLmRvQ29tbWl0KCk7XG4gICAgfVxuICAgIG5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIGRpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLm5lYXJlc3RJbnB1dFBvcyhjdXJzb3JQb3MsIGRpcmVjdGlvbikgOiBzdXBlci5uZWFyZXN0SW5wdXRQb3MoY3Vyc29yUG9zLCBkaXJlY3Rpb24pO1xuICAgIH1cbiAgICBnZXQgb3ZlcndyaXRlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLm92ZXJ3cml0ZSA6IHRoaXMuX292ZXJ3cml0ZTtcbiAgICB9XG4gICAgc2V0IG92ZXJ3cml0ZShvdmVyd3JpdGUpIHtcbiAgICAgIHRoaXMuX292ZXJ3cml0ZSA9IG92ZXJ3cml0ZTtcbiAgICB9XG4gICAgZ2V0IGVhZ2VyKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLmVhZ2VyIDogdGhpcy5fZWFnZXI7XG4gICAgfVxuICAgIHNldCBlYWdlcihlYWdlcikge1xuICAgICAgdGhpcy5fZWFnZXIgPSBlYWdlcjtcbiAgICB9XG4gICAgZ2V0IHNraXBJbnZhbGlkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuY3VycmVudE1hc2sgPyB0aGlzLmN1cnJlbnRNYXNrLnNraXBJbnZhbGlkIDogdGhpcy5fc2tpcEludmFsaWQ7XG4gICAgfVxuICAgIHNldCBza2lwSW52YWxpZChza2lwSW52YWxpZCkge1xuICAgICAgdGhpcy5fc2tpcEludmFsaWQgPSBza2lwSW52YWxpZDtcbiAgICB9XG4gICAgZ2V0IGF1dG9maXgoKSB7XG4gICAgICByZXR1cm4gdGhpcy5jdXJyZW50TWFzayA/IHRoaXMuY3VycmVudE1hc2suYXV0b2ZpeCA6IHRoaXMuX2F1dG9maXg7XG4gICAgfVxuICAgIHNldCBhdXRvZml4KGF1dG9maXgpIHtcbiAgICAgIHRoaXMuX2F1dG9maXggPSBhdXRvZml4O1xuICAgIH1cbiAgICBtYXNrRXF1YWxzKG1hc2spIHtcbiAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KG1hc2spID8gdGhpcy5jb21waWxlZE1hc2tzLmV2ZXJ5KChtLCBtaSkgPT4ge1xuICAgICAgICBpZiAoIW1hc2tbbWldKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBtYXNrOiBvbGRNYXNrLFxuICAgICAgICAgIC4uLnJlc3RPcHRzXG4gICAgICAgIH0gPSBtYXNrW21pXTtcbiAgICAgICAgcmV0dXJuIG9iamVjdEluY2x1ZGVzKG0sIHJlc3RPcHRzKSAmJiBtLm1hc2tFcXVhbHMob2xkTWFzayk7XG4gICAgICB9KSA6IHN1cGVyLm1hc2tFcXVhbHMobWFzayk7XG4gICAgfVxuICAgIHR5cGVkVmFsdWVFcXVhbHModmFsdWUpIHtcbiAgICAgIHZhciBfdGhpcyRjdXJyZW50TWFzazU7XG4gICAgICByZXR1cm4gQm9vbGVhbigoX3RoaXMkY3VycmVudE1hc2s1ID0gdGhpcy5jdXJyZW50TWFzaykgPT0gbnVsbCA/IHZvaWQgMCA6IF90aGlzJGN1cnJlbnRNYXNrNS50eXBlZFZhbHVlRXF1YWxzKHZhbHVlKSk7XG4gICAgfVxuICB9XG4gIC8qKiBDdXJyZW50bHkgY2hvc2VuIG1hc2sgKi9cbiAgLyoqIEN1cnJlbnRseSBjaG9zZW4gbWFzayAqL1xuICAvKiogQ29tcGxpbGVkIHtAbGluayBNYXNrZWR9IG9wdGlvbnMgKi9cbiAgLyoqIENob29zZXMge0BsaW5rIE1hc2tlZH0gZGVwZW5kaW5nIG9uIGlucHV0IHZhbHVlICovXG4gIE1hc2tlZER5bmFtaWMuREVGQVVMVFMgPSB7XG4gICAgLi4uTWFza2VkLkRFRkFVTFRTLFxuICAgIGRpc3BhdGNoOiAoYXBwZW5kZWQsIG1hc2tlZCwgZmxhZ3MsIHRhaWwpID0+IHtcbiAgICAgIGlmICghbWFza2VkLmNvbXBpbGVkTWFza3MubGVuZ3RoKSByZXR1cm47XG4gICAgICBjb25zdCBpbnB1dFZhbHVlID0gbWFza2VkLnJhd0lucHV0VmFsdWU7XG5cbiAgICAgIC8vIHNpbXVsYXRlIGlucHV0XG4gICAgICBjb25zdCBpbnB1dHMgPSBtYXNrZWQuY29tcGlsZWRNYXNrcy5tYXAoKG0sIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGlzQ3VycmVudCA9IG1hc2tlZC5jdXJyZW50TWFzayA9PT0gbTtcbiAgICAgICAgY29uc3Qgc3RhcnRJbnB1dFBvcyA9IGlzQ3VycmVudCA/IG0uZGlzcGxheVZhbHVlLmxlbmd0aCA6IG0ubmVhcmVzdElucHV0UG9zKG0uZGlzcGxheVZhbHVlLmxlbmd0aCwgRElSRUNUSU9OLkZPUkNFX0xFRlQpO1xuICAgICAgICBpZiAobS5yYXdJbnB1dFZhbHVlICE9PSBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgbS5yZXNldCgpO1xuICAgICAgICAgIG0uYXBwZW5kKGlucHV0VmFsdWUsIHtcbiAgICAgICAgICAgIHJhdzogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKCFpc0N1cnJlbnQpIHtcbiAgICAgICAgICBtLnJlbW92ZShzdGFydElucHV0UG9zKTtcbiAgICAgICAgfVxuICAgICAgICBtLmFwcGVuZChhcHBlbmRlZCwgbWFza2VkLmN1cnJlbnRNYXNrRmxhZ3MoZmxhZ3MpKTtcbiAgICAgICAgbS5hcHBlbmRUYWlsKHRhaWwpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGluZGV4LFxuICAgICAgICAgIHdlaWdodDogbS5yYXdJbnB1dFZhbHVlLmxlbmd0aCxcbiAgICAgICAgICB0b3RhbElucHV0UG9zaXRpb25zOiBtLnRvdGFsSW5wdXRQb3NpdGlvbnMoMCwgTWF0aC5tYXgoc3RhcnRJbnB1dFBvcywgbS5uZWFyZXN0SW5wdXRQb3MobS5kaXNwbGF5VmFsdWUubGVuZ3RoLCBESVJFQ1RJT04uRk9SQ0VfTEVGVCkpKVxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICAgIC8vIHBvcCBtYXNrcyB3aXRoIGxvbmdlciB2YWx1ZXMgZmlyc3RcbiAgICAgIGlucHV0cy5zb3J0KChpMSwgaTIpID0+IGkyLndlaWdodCAtIGkxLndlaWdodCB8fCBpMi50b3RhbElucHV0UG9zaXRpb25zIC0gaTEudG90YWxJbnB1dFBvc2l0aW9ucyk7XG4gICAgICByZXR1cm4gbWFza2VkLmNvbXBpbGVkTWFza3NbaW5wdXRzWzBdLmluZGV4XTtcbiAgICB9XG4gIH07XG4gIElNYXNrLk1hc2tlZER5bmFtaWMgPSBNYXNrZWREeW5hbWljO1xuXG4gIC8qKiBQYXR0ZXJuIHdoaWNoIHZhbGlkYXRlcyBlbnVtIHZhbHVlcyAqL1xuICBjbGFzcyBNYXNrZWRFbnVtIGV4dGVuZHMgTWFza2VkUGF0dGVybiB7XG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgc3VwZXIoe1xuICAgICAgICAuLi5NYXNrZWRFbnVtLkRFRkFVTFRTLFxuICAgICAgICAuLi5vcHRzXG4gICAgICB9KTsgLy8gbWFzayB3aWxsIGJlIGNyZWF0ZWQgaW4gX3VwZGF0ZVxuICAgIH1cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgY29uc3Qge1xuICAgICAgICBlbnVtOiBlbnVtXyxcbiAgICAgICAgLi4uZW9wdHNcbiAgICAgIH0gPSBvcHRzO1xuICAgICAgaWYgKGVudW1fKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aHMgPSBlbnVtXy5tYXAoZSA9PiBlLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkTGVuZ3RoID0gTWF0aC5taW4oLi4ubGVuZ3Rocyk7XG4gICAgICAgIGNvbnN0IG9wdGlvbmFsTGVuZ3RoID0gTWF0aC5tYXgoLi4ubGVuZ3RocykgLSByZXF1aXJlZExlbmd0aDtcbiAgICAgICAgZW9wdHMubWFzayA9ICcqJy5yZXBlYXQocmVxdWlyZWRMZW5ndGgpO1xuICAgICAgICBpZiAob3B0aW9uYWxMZW5ndGgpIGVvcHRzLm1hc2sgKz0gJ1snICsgJyonLnJlcGVhdChvcHRpb25hbExlbmd0aCkgKyAnXSc7XG4gICAgICAgIHRoaXMuZW51bSA9IGVudW1fO1xuICAgICAgfVxuICAgICAgc3VwZXIuX3VwZGF0ZShlb3B0cyk7XG4gICAgfVxuICAgIF9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1hdGNoRnJvbSA9IE1hdGgubWluKHRoaXMubmVhcmVzdElucHV0UG9zKDAsIERJUkVDVElPTi5GT1JDRV9SSUdIVCksIHRoaXMudmFsdWUubGVuZ3RoKTtcbiAgICAgIGNvbnN0IG1hdGNoZXMgPSB0aGlzLmVudW0uZmlsdGVyKGUgPT4gdGhpcy5tYXRjaFZhbHVlKGUsIHRoaXMudW5tYXNrZWRWYWx1ZSArIGNoLCBtYXRjaEZyb20pKTtcbiAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCkge1xuICAgICAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICB0aGlzLl9mb3JFYWNoQmxvY2tzSW5SYW5nZSgwLCB0aGlzLnZhbHVlLmxlbmd0aCwgKGIsIGJpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtY2ggPSBtYXRjaGVzWzBdW2JpXTtcbiAgICAgICAgICAgIGlmIChiaSA+PSB0aGlzLnZhbHVlLmxlbmd0aCB8fCBtY2ggPT09IGIudmFsdWUpIHJldHVybjtcbiAgICAgICAgICAgIGIucmVzZXQoKTtcbiAgICAgICAgICAgIGIuX2FwcGVuZENoYXIobWNoLCBmbGFncyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZCA9IHN1cGVyLl9hcHBlbmRDaGFyUmF3KG1hdGNoZXNbMF1bdGhpcy52YWx1ZS5sZW5ndGhdLCBmbGFncyk7XG4gICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIG1hdGNoZXNbMF0uc2xpY2UodGhpcy51bm1hc2tlZFZhbHVlLmxlbmd0aCkuc3BsaXQoJycpLmZvckVhY2gobWNoID0+IGQuYWdncmVnYXRlKHN1cGVyLl9hcHBlbmRDaGFyUmF3KG1jaCkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscyh7XG4gICAgICAgIHNraXA6ICF0aGlzLmlzQ29tcGxldGVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBleHRyYWN0VGFpbChmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgLy8ganVzdCBkcm9wIHRhaWxcbiAgICAgIHJldHVybiBuZXcgQ29udGludW91c1RhaWxEZXRhaWxzKCcnLCBmcm9tUG9zKTtcbiAgICB9XG4gICAgcmVtb3ZlKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdG9Qb3MpIHJldHVybiBuZXcgQ2hhbmdlRGV0YWlscygpO1xuICAgICAgY29uc3QgbWF0Y2hGcm9tID0gTWF0aC5taW4oc3VwZXIubmVhcmVzdElucHV0UG9zKDAsIERJUkVDVElPTi5GT1JDRV9SSUdIVCksIHRoaXMudmFsdWUubGVuZ3RoKTtcbiAgICAgIGxldCBwb3M7XG4gICAgICBmb3IgKHBvcyA9IGZyb21Qb3M7IHBvcyA+PSAwOyAtLXBvcykge1xuICAgICAgICBjb25zdCBtYXRjaGVzID0gdGhpcy5lbnVtLmZpbHRlcihlID0+IHRoaXMubWF0Y2hWYWx1ZShlLCB0aGlzLnZhbHVlLnNsaWNlKG1hdGNoRnJvbSwgcG9zKSwgbWF0Y2hGcm9tKSk7XG4gICAgICAgIGlmIChtYXRjaGVzLmxlbmd0aCA+IDEpIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29uc3QgZGV0YWlscyA9IHN1cGVyLnJlbW92ZShwb3MsIHRvUG9zKTtcbiAgICAgIGRldGFpbHMudGFpbFNoaWZ0ICs9IHBvcyAtIGZyb21Qb3M7XG4gICAgICByZXR1cm4gZGV0YWlscztcbiAgICB9XG4gICAgZ2V0IGlzQ29tcGxldGUoKSB7XG4gICAgICByZXR1cm4gdGhpcy5lbnVtLmluZGV4T2YodGhpcy52YWx1ZSkgPj0gMDtcbiAgICB9XG4gIH1cbiAgLyoqIE1hdGNoIGVudW0gdmFsdWUgKi9cbiAgTWFza2VkRW51bS5ERUZBVUxUUyA9IHtcbiAgICAuLi5NYXNrZWRQYXR0ZXJuLkRFRkFVTFRTLFxuICAgIG1hdGNoVmFsdWU6IChlc3RyLCBpc3RyLCBtYXRjaEZyb20pID0+IGVzdHIuaW5kZXhPZihpc3RyLCBtYXRjaEZyb20pID09PSBtYXRjaEZyb21cbiAgfTtcbiAgSU1hc2suTWFza2VkRW51bSA9IE1hc2tlZEVudW07XG5cbiAgLyoqIE1hc2tpbmcgYnkgY3VzdG9tIEZ1bmN0aW9uICovXG4gIGNsYXNzIE1hc2tlZEZ1bmN0aW9uIGV4dGVuZHMgTWFza2VkIHtcbiAgICAvKiogKi9cblxuICAgIC8qKiBFbmFibGUgY2hhcmFjdGVycyBvdmVyd3JpdGluZyAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiAqL1xuXG4gICAgdXBkYXRlT3B0aW9ucyhvcHRzKSB7XG4gICAgICBzdXBlci51cGRhdGVPcHRpb25zKG9wdHMpO1xuICAgIH1cbiAgICBfdXBkYXRlKG9wdHMpIHtcbiAgICAgIHN1cGVyLl91cGRhdGUoe1xuICAgICAgICAuLi5vcHRzLFxuICAgICAgICB2YWxpZGF0ZTogb3B0cy5tYXNrXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgSU1hc2suTWFza2VkRnVuY3Rpb24gPSBNYXNrZWRGdW5jdGlvbjtcblxuICB2YXIgX01hc2tlZE51bWJlcjtcbiAgLyoqIE51bWJlciBtYXNrICovXG4gIGNsYXNzIE1hc2tlZE51bWJlciBleHRlbmRzIE1hc2tlZCB7XG4gICAgLyoqIFNpbmdsZSBjaGFyICovXG5cbiAgICAvKiogU2luZ2xlIGNoYXIgKi9cblxuICAgIC8qKiBBcnJheSBvZiBzaW5nbGUgY2hhcnMgKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogRGlnaXRzIGFmdGVyIHBvaW50ICovXG5cbiAgICAvKiogRmxhZyB0byByZW1vdmUgbGVhZGluZyBhbmQgdHJhaWxpbmcgemVyb3MgaW4gdGhlIGVuZCBvZiBlZGl0aW5nICovXG5cbiAgICAvKiogRmxhZyB0byBwYWQgdHJhaWxpbmcgemVyb3MgYWZ0ZXIgcG9pbnQgaW4gdGhlIGVuZCBvZiBlZGl0aW5nICovXG5cbiAgICAvKiogRW5hYmxlIGNoYXJhY3RlcnMgb3ZlcndyaXRpbmcgKi9cblxuICAgIC8qKiAqL1xuXG4gICAgLyoqICovXG5cbiAgICAvKiogKi9cblxuICAgIC8qKiBGb3JtYXQgdHlwZWQgdmFsdWUgdG8gc3RyaW5nICovXG5cbiAgICAvKiogUGFyc2Ugc3RyaW5nIHRvIGdldCB0eXBlZCB2YWx1ZSAqL1xuXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgc3VwZXIoe1xuICAgICAgICAuLi5NYXNrZWROdW1iZXIuREVGQVVMVFMsXG4gICAgICAgIC4uLm9wdHNcbiAgICAgIH0pO1xuICAgIH1cbiAgICB1cGRhdGVPcHRpb25zKG9wdHMpIHtcbiAgICAgIHN1cGVyLnVwZGF0ZU9wdGlvbnMob3B0cyk7XG4gICAgfVxuICAgIF91cGRhdGUob3B0cykge1xuICAgICAgc3VwZXIuX3VwZGF0ZShvcHRzKTtcbiAgICAgIHRoaXMuX3VwZGF0ZVJlZ0V4cHMoKTtcbiAgICB9XG4gICAgX3VwZGF0ZVJlZ0V4cHMoKSB7XG4gICAgICBjb25zdCBzdGFydCA9ICdeJyArICh0aGlzLmFsbG93TmVnYXRpdmUgPyAnWyt8XFxcXC1dPycgOiAnJyk7XG4gICAgICBjb25zdCBtaWQgPSAnXFxcXGQqJztcbiAgICAgIGNvbnN0IGVuZCA9ICh0aGlzLnNjYWxlID8gXCIoXCIgKyBlc2NhcGVSZWdFeHAodGhpcy5yYWRpeCkgKyBcIlxcXFxkezAsXCIgKyB0aGlzLnNjYWxlICsgXCJ9KT9cIiA6ICcnKSArICckJztcbiAgICAgIHRoaXMuX251bWJlclJlZ0V4cCA9IG5ldyBSZWdFeHAoc3RhcnQgKyBtaWQgKyBlbmQpO1xuICAgICAgdGhpcy5fbWFwVG9SYWRpeFJlZ0V4cCA9IG5ldyBSZWdFeHAoXCJbXCIgKyB0aGlzLm1hcFRvUmFkaXgubWFwKGVzY2FwZVJlZ0V4cCkuam9pbignJykgKyBcIl1cIiwgJ2cnKTtcbiAgICAgIHRoaXMuX3Rob3VzYW5kc1NlcGFyYXRvclJlZ0V4cCA9IG5ldyBSZWdFeHAoZXNjYXBlUmVnRXhwKHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yKSwgJ2cnKTtcbiAgICB9XG4gICAgX3JlbW92ZVRob3VzYW5kc1NlcGFyYXRvcnModmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKHRoaXMuX3Rob3VzYW5kc1NlcGFyYXRvclJlZ0V4cCwgJycpO1xuICAgIH1cbiAgICBfaW5zZXJ0VGhvdXNhbmRzU2VwYXJhdG9ycyh2YWx1ZSkge1xuICAgICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjkwMTEwMi9ob3ctdG8tcHJpbnQtYS1udW1iZXItd2l0aC1jb21tYXMtYXMtdGhvdXNhbmRzLXNlcGFyYXRvcnMtaW4tamF2YXNjcmlwdFxuICAgICAgY29uc3QgcGFydHMgPSB2YWx1ZS5zcGxpdCh0aGlzLnJhZGl4KTtcbiAgICAgIHBhcnRzWzBdID0gcGFydHNbMF0ucmVwbGFjZSgvXFxCKD89KFxcZHszfSkrKD8hXFxkKSkvZywgdGhpcy50aG91c2FuZHNTZXBhcmF0b3IpO1xuICAgICAgcmV0dXJuIHBhcnRzLmpvaW4odGhpcy5yYWRpeCk7XG4gICAgfVxuICAgIGRvUHJlcGFyZUNoYXIoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgW3ByZXBDaCwgZGV0YWlsc10gPSBzdXBlci5kb1ByZXBhcmVDaGFyKHRoaXMuX3JlbW92ZVRob3VzYW5kc1NlcGFyYXRvcnModGhpcy5zY2FsZSAmJiB0aGlzLm1hcFRvUmFkaXgubGVuZ3RoICYmIChcbiAgICAgIC8qXG4gICAgICAgIHJhZGl4IHNob3VsZCBiZSBtYXBwZWQgd2hlblxuICAgICAgICAxKSBpbnB1dCBpcyBkb25lIGZyb20ga2V5Ym9hcmQgPSBmbGFncy5pbnB1dCAmJiBmbGFncy5yYXdcbiAgICAgICAgMikgdW5tYXNrZWQgdmFsdWUgaXMgc2V0ID0gIWZsYWdzLmlucHV0ICYmICFmbGFncy5yYXdcbiAgICAgICAgYW5kIHNob3VsZCBub3QgYmUgbWFwcGVkIHdoZW5cbiAgICAgICAgMSkgdmFsdWUgaXMgc2V0ID0gZmxhZ3MuaW5wdXQgJiYgIWZsYWdzLnJhd1xuICAgICAgICAyKSByYXcgdmFsdWUgaXMgc2V0ID0gIWZsYWdzLmlucHV0ICYmIGZsYWdzLnJhd1xuICAgICAgKi9cbiAgICAgIGZsYWdzLmlucHV0ICYmIGZsYWdzLnJhdyB8fCAhZmxhZ3MuaW5wdXQgJiYgIWZsYWdzLnJhdykgPyBjaC5yZXBsYWNlKHRoaXMuX21hcFRvUmFkaXhSZWdFeHAsIHRoaXMucmFkaXgpIDogY2gpLCBmbGFncyk7XG4gICAgICBpZiAoY2ggJiYgIXByZXBDaCkgZGV0YWlscy5za2lwID0gdHJ1ZTtcbiAgICAgIGlmIChwcmVwQ2ggJiYgIXRoaXMuYWxsb3dQb3NpdGl2ZSAmJiAhdGhpcy52YWx1ZSAmJiBwcmVwQ2ggIT09ICctJykgZGV0YWlscy5hZ2dyZWdhdGUodGhpcy5fYXBwZW5kQ2hhcignLScpKTtcbiAgICAgIHJldHVybiBbcHJlcENoLCBkZXRhaWxzXTtcbiAgICB9XG4gICAgX3NlcGFyYXRvcnNDb3VudCh0bywgZXh0ZW5kT25TZXBhcmF0b3JzKSB7XG4gICAgICBpZiAoZXh0ZW5kT25TZXBhcmF0b3JzID09PSB2b2lkIDApIHtcbiAgICAgICAgZXh0ZW5kT25TZXBhcmF0b3JzID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBsZXQgY291bnQgPSAwO1xuICAgICAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgdG87ICsrcG9zKSB7XG4gICAgICAgIGlmICh0aGlzLl92YWx1ZS5pbmRleE9mKHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLCBwb3MpID09PSBwb3MpIHtcbiAgICAgICAgICArK2NvdW50O1xuICAgICAgICAgIGlmIChleHRlbmRPblNlcGFyYXRvcnMpIHRvICs9IHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNvdW50O1xuICAgIH1cbiAgICBfc2VwYXJhdG9yc0NvdW50RnJvbVNsaWNlKHNsaWNlKSB7XG4gICAgICBpZiAoc2xpY2UgPT09IHZvaWQgMCkge1xuICAgICAgICBzbGljZSA9IHRoaXMuX3ZhbHVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX3NlcGFyYXRvcnNDb3VudCh0aGlzLl9yZW1vdmVUaG91c2FuZHNTZXBhcmF0b3JzKHNsaWNlKS5sZW5ndGgsIHRydWUpO1xuICAgIH1cbiAgICBleHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9Qb3MgPSB0aGlzLmRpc3BsYXlWYWx1ZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBbZnJvbVBvcywgdG9Qb3NdID0gdGhpcy5fYWRqdXN0UmFuZ2VXaXRoU2VwYXJhdG9ycyhmcm9tUG9zLCB0b1Bvcyk7XG4gICAgICByZXR1cm4gdGhpcy5fcmVtb3ZlVGhvdXNhbmRzU2VwYXJhdG9ycyhzdXBlci5leHRyYWN0SW5wdXQoZnJvbVBvcywgdG9Qb3MsIGZsYWdzKSk7XG4gICAgfVxuICAgIF9hcHBlbmRDaGFyUmF3KGNoLCBmbGFncykge1xuICAgICAgaWYgKGZsYWdzID09PSB2b2lkIDApIHtcbiAgICAgICAgZmxhZ3MgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByZXZCZWZvcmVUYWlsVmFsdWUgPSBmbGFncy50YWlsICYmIGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUgPyBmbGFncy5fYmVmb3JlVGFpbFN0YXRlLl92YWx1ZSA6IHRoaXMuX3ZhbHVlO1xuICAgICAgY29uc3QgcHJldkJlZm9yZVRhaWxTZXBhcmF0b3JzQ291bnQgPSB0aGlzLl9zZXBhcmF0b3JzQ291bnRGcm9tU2xpY2UocHJldkJlZm9yZVRhaWxWYWx1ZSk7XG4gICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuX3JlbW92ZVRob3VzYW5kc1NlcGFyYXRvcnModGhpcy52YWx1ZSk7XG4gICAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXMuX3ZhbHVlO1xuICAgICAgdGhpcy5fdmFsdWUgKz0gY2g7XG4gICAgICBjb25zdCBudW0gPSB0aGlzLm51bWJlcjtcbiAgICAgIGxldCBhY2NlcHRlZCA9ICFpc05hTihudW0pO1xuICAgICAgbGV0IHNraXAgPSBmYWxzZTtcbiAgICAgIGlmIChhY2NlcHRlZCkge1xuICAgICAgICBsZXQgZml4ZWROdW07XG4gICAgICAgIGlmICh0aGlzLm1pbiAhPSBudWxsICYmIHRoaXMubWluIDwgMCAmJiB0aGlzLm51bWJlciA8IHRoaXMubWluKSBmaXhlZE51bSA9IHRoaXMubWluO1xuICAgICAgICBpZiAodGhpcy5tYXggIT0gbnVsbCAmJiB0aGlzLm1heCA+IDAgJiYgdGhpcy5udW1iZXIgPiB0aGlzLm1heCkgZml4ZWROdW0gPSB0aGlzLm1heDtcbiAgICAgICAgaWYgKGZpeGVkTnVtICE9IG51bGwpIHtcbiAgICAgICAgICBpZiAodGhpcy5hdXRvZml4KSB7XG4gICAgICAgICAgICB0aGlzLl92YWx1ZSA9IHRoaXMuZm9ybWF0KGZpeGVkTnVtLCB0aGlzKS5yZXBsYWNlKE1hc2tlZE51bWJlci5VTk1BU0tFRF9SQURJWCwgdGhpcy5yYWRpeCk7XG4gICAgICAgICAgICBza2lwIHx8IChza2lwID0gb2xkVmFsdWUgPT09IHRoaXMuX3ZhbHVlICYmICFmbGFncy50YWlsKTsgLy8gaWYgbm90IGNoYW5nZWQgb24gdGFpbCBpdCdzIHN0aWxsIG9rIHRvIHByb2NlZWRcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWNjZXB0ZWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYWNjZXB0ZWQgJiYgKGFjY2VwdGVkID0gQm9vbGVhbih0aGlzLl92YWx1ZS5tYXRjaCh0aGlzLl9udW1iZXJSZWdFeHApKSk7XG4gICAgICB9XG4gICAgICBsZXQgYXBwZW5kRGV0YWlscztcbiAgICAgIGlmICghYWNjZXB0ZWQpIHtcbiAgICAgICAgdGhpcy5fdmFsdWUgPSBvbGRWYWx1ZTtcbiAgICAgICAgYXBwZW5kRGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHBlbmREZXRhaWxzID0gbmV3IENoYW5nZURldGFpbHMoe1xuICAgICAgICAgIGluc2VydGVkOiB0aGlzLl92YWx1ZS5zbGljZShvbGRWYWx1ZS5sZW5ndGgpLFxuICAgICAgICAgIHJhd0luc2VydGVkOiBza2lwID8gJycgOiBjaCxcbiAgICAgICAgICBza2lwXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy5fdmFsdWUgPSB0aGlzLl9pbnNlcnRUaG91c2FuZHNTZXBhcmF0b3JzKHRoaXMuX3ZhbHVlKTtcbiAgICAgIGNvbnN0IGJlZm9yZVRhaWxWYWx1ZSA9IGZsYWdzLnRhaWwgJiYgZmxhZ3MuX2JlZm9yZVRhaWxTdGF0ZSA/IGZsYWdzLl9iZWZvcmVUYWlsU3RhdGUuX3ZhbHVlIDogdGhpcy5fdmFsdWU7XG4gICAgICBjb25zdCBiZWZvcmVUYWlsU2VwYXJhdG9yc0NvdW50ID0gdGhpcy5fc2VwYXJhdG9yc0NvdW50RnJvbVNsaWNlKGJlZm9yZVRhaWxWYWx1ZSk7XG4gICAgICBhcHBlbmREZXRhaWxzLnRhaWxTaGlmdCArPSAoYmVmb3JlVGFpbFNlcGFyYXRvcnNDb3VudCAtIHByZXZCZWZvcmVUYWlsU2VwYXJhdG9yc0NvdW50KSAqIHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLmxlbmd0aDtcbiAgICAgIHJldHVybiBhcHBlbmREZXRhaWxzO1xuICAgIH1cbiAgICBfZmluZFNlcGFyYXRvckFyb3VuZChwb3MpIHtcbiAgICAgIGlmICh0aGlzLnRob3VzYW5kc1NlcGFyYXRvcikge1xuICAgICAgICBjb25zdCBzZWFyY2hGcm9tID0gcG9zIC0gdGhpcy50aG91c2FuZHNTZXBhcmF0b3IubGVuZ3RoICsgMTtcbiAgICAgICAgY29uc3Qgc2VwYXJhdG9yUG9zID0gdGhpcy52YWx1ZS5pbmRleE9mKHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLCBzZWFyY2hGcm9tKTtcbiAgICAgICAgaWYgKHNlcGFyYXRvclBvcyA8PSBwb3MpIHJldHVybiBzZXBhcmF0b3JQb3M7XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIF9hZGp1c3RSYW5nZVdpdGhTZXBhcmF0b3JzKGZyb20sIHRvKSB7XG4gICAgICBjb25zdCBzZXBhcmF0b3JBcm91bmRGcm9tUG9zID0gdGhpcy5fZmluZFNlcGFyYXRvckFyb3VuZChmcm9tKTtcbiAgICAgIGlmIChzZXBhcmF0b3JBcm91bmRGcm9tUG9zID49IDApIGZyb20gPSBzZXBhcmF0b3JBcm91bmRGcm9tUG9zO1xuICAgICAgY29uc3Qgc2VwYXJhdG9yQXJvdW5kVG9Qb3MgPSB0aGlzLl9maW5kU2VwYXJhdG9yQXJvdW5kKHRvKTtcbiAgICAgIGlmIChzZXBhcmF0b3JBcm91bmRUb1BvcyA+PSAwKSB0byA9IHNlcGFyYXRvckFyb3VuZFRvUG9zICsgdGhpcy50aG91c2FuZHNTZXBhcmF0b3IubGVuZ3RoO1xuICAgICAgcmV0dXJuIFtmcm9tLCB0b107XG4gICAgfVxuICAgIHJlbW92ZShmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgW2Zyb21Qb3MsIHRvUG9zXSA9IHRoaXMuX2FkanVzdFJhbmdlV2l0aFNlcGFyYXRvcnMoZnJvbVBvcywgdG9Qb3MpO1xuICAgICAgY29uc3QgdmFsdWVCZWZvcmVQb3MgPSB0aGlzLnZhbHVlLnNsaWNlKDAsIGZyb21Qb3MpO1xuICAgICAgY29uc3QgdmFsdWVBZnRlclBvcyA9IHRoaXMudmFsdWUuc2xpY2UodG9Qb3MpO1xuICAgICAgY29uc3QgcHJldkJlZm9yZVRhaWxTZXBhcmF0b3JzQ291bnQgPSB0aGlzLl9zZXBhcmF0b3JzQ291bnQodmFsdWVCZWZvcmVQb3MubGVuZ3RoKTtcbiAgICAgIHRoaXMuX3ZhbHVlID0gdGhpcy5faW5zZXJ0VGhvdXNhbmRzU2VwYXJhdG9ycyh0aGlzLl9yZW1vdmVUaG91c2FuZHNTZXBhcmF0b3JzKHZhbHVlQmVmb3JlUG9zICsgdmFsdWVBZnRlclBvcykpO1xuICAgICAgY29uc3QgYmVmb3JlVGFpbFNlcGFyYXRvcnNDb3VudCA9IHRoaXMuX3NlcGFyYXRvcnNDb3VudEZyb21TbGljZSh2YWx1ZUJlZm9yZVBvcyk7XG4gICAgICByZXR1cm4gbmV3IENoYW5nZURldGFpbHMoe1xuICAgICAgICB0YWlsU2hpZnQ6IChiZWZvcmVUYWlsU2VwYXJhdG9yc0NvdW50IC0gcHJldkJlZm9yZVRhaWxTZXBhcmF0b3JzQ291bnQpICogdGhpcy50aG91c2FuZHNTZXBhcmF0b3IubGVuZ3RoXG4gICAgICB9KTtcbiAgICB9XG4gICAgbmVhcmVzdElucHV0UG9zKGN1cnNvclBvcywgZGlyZWN0aW9uKSB7XG4gICAgICBpZiAoIXRoaXMudGhvdXNhbmRzU2VwYXJhdG9yKSByZXR1cm4gY3Vyc29yUG9zO1xuICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uTk9ORTpcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uTEVGVDpcbiAgICAgICAgY2FzZSBESVJFQ1RJT04uRk9SQ0VfTEVGVDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBzZXBhcmF0b3JBdExlZnRQb3MgPSB0aGlzLl9maW5kU2VwYXJhdG9yQXJvdW5kKGN1cnNvclBvcyAtIDEpO1xuICAgICAgICAgICAgaWYgKHNlcGFyYXRvckF0TGVmdFBvcyA+PSAwKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHNlcGFyYXRvckF0TGVmdEVuZFBvcyA9IHNlcGFyYXRvckF0TGVmdFBvcyArIHRoaXMudGhvdXNhbmRzU2VwYXJhdG9yLmxlbmd0aDtcbiAgICAgICAgICAgICAgaWYgKGN1cnNvclBvcyA8IHNlcGFyYXRvckF0TGVmdEVuZFBvcyB8fCB0aGlzLnZhbHVlLmxlbmd0aCA8PSBzZXBhcmF0b3JBdExlZnRFbmRQb3MgfHwgZGlyZWN0aW9uID09PSBESVJFQ1RJT04uRk9SQ0VfTEVGVCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXBhcmF0b3JBdExlZnRQb3M7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgY2FzZSBESVJFQ1RJT04uUklHSFQ6XG4gICAgICAgIGNhc2UgRElSRUNUSU9OLkZPUkNFX1JJR0hUOlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHNlcGFyYXRvckF0UmlnaHRQb3MgPSB0aGlzLl9maW5kU2VwYXJhdG9yQXJvdW5kKGN1cnNvclBvcyk7XG4gICAgICAgICAgICBpZiAoc2VwYXJhdG9yQXRSaWdodFBvcyA+PSAwKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZXBhcmF0b3JBdFJpZ2h0UG9zICsgdGhpcy50aG91c2FuZHNTZXBhcmF0b3IubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjdXJzb3JQb3M7XG4gICAgfVxuICAgIGRvQ29tbWl0KCkge1xuICAgICAgaWYgKHRoaXMudmFsdWUpIHtcbiAgICAgICAgY29uc3QgbnVtYmVyID0gdGhpcy5udW1iZXI7XG4gICAgICAgIGxldCB2YWxpZG51bSA9IG51bWJlcjtcblxuICAgICAgICAvLyBjaGVjayBib3VuZHNcbiAgICAgICAgaWYgKHRoaXMubWluICE9IG51bGwpIHZhbGlkbnVtID0gTWF0aC5tYXgodmFsaWRudW0sIHRoaXMubWluKTtcbiAgICAgICAgaWYgKHRoaXMubWF4ICE9IG51bGwpIHZhbGlkbnVtID0gTWF0aC5taW4odmFsaWRudW0sIHRoaXMubWF4KTtcbiAgICAgICAgaWYgKHZhbGlkbnVtICE9PSBudW1iZXIpIHRoaXMudW5tYXNrZWRWYWx1ZSA9IHRoaXMuZm9ybWF0KHZhbGlkbnVtLCB0aGlzKTtcbiAgICAgICAgbGV0IGZvcm1hdHRlZCA9IHRoaXMudmFsdWU7XG4gICAgICAgIGlmICh0aGlzLm5vcm1hbGl6ZVplcm9zKSBmb3JtYXR0ZWQgPSB0aGlzLl9ub3JtYWxpemVaZXJvcyhmb3JtYXR0ZWQpO1xuICAgICAgICBpZiAodGhpcy5wYWRGcmFjdGlvbmFsWmVyb3MgJiYgdGhpcy5zY2FsZSA+IDApIGZvcm1hdHRlZCA9IHRoaXMuX3BhZEZyYWN0aW9uYWxaZXJvcyhmb3JtYXR0ZWQpO1xuICAgICAgICB0aGlzLl92YWx1ZSA9IGZvcm1hdHRlZDtcbiAgICAgIH1cbiAgICAgIHN1cGVyLmRvQ29tbWl0KCk7XG4gICAgfVxuICAgIF9ub3JtYWxpemVaZXJvcyh2YWx1ZSkge1xuICAgICAgY29uc3QgcGFydHMgPSB0aGlzLl9yZW1vdmVUaG91c2FuZHNTZXBhcmF0b3JzKHZhbHVlKS5zcGxpdCh0aGlzLnJhZGl4KTtcblxuICAgICAgLy8gcmVtb3ZlIGxlYWRpbmcgemVyb3NcbiAgICAgIHBhcnRzWzBdID0gcGFydHNbMF0ucmVwbGFjZSgvXihcXEQqKSgwKikoXFxkKikvLCAobWF0Y2gsIHNpZ24sIHplcm9zLCBudW0pID0+IHNpZ24gKyBudW0pO1xuICAgICAgLy8gYWRkIGxlYWRpbmcgemVyb1xuICAgICAgaWYgKHZhbHVlLmxlbmd0aCAmJiAhL1xcZCQvLnRlc3QocGFydHNbMF0pKSBwYXJ0c1swXSA9IHBhcnRzWzBdICsgJzAnO1xuICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgcGFydHNbMV0gPSBwYXJ0c1sxXS5yZXBsYWNlKC8wKiQvLCAnJyk7IC8vIHJlbW92ZSB0cmFpbGluZyB6ZXJvc1xuICAgICAgICBpZiAoIXBhcnRzWzFdLmxlbmd0aCkgcGFydHMubGVuZ3RoID0gMTsgLy8gcmVtb3ZlIGZyYWN0aW9uYWxcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9pbnNlcnRUaG91c2FuZHNTZXBhcmF0b3JzKHBhcnRzLmpvaW4odGhpcy5yYWRpeCkpO1xuICAgIH1cbiAgICBfcGFkRnJhY3Rpb25hbFplcm9zKHZhbHVlKSB7XG4gICAgICBpZiAoIXZhbHVlKSByZXR1cm4gdmFsdWU7XG4gICAgICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KHRoaXMucmFkaXgpO1xuICAgICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHBhcnRzLnB1c2goJycpO1xuICAgICAgcGFydHNbMV0gPSBwYXJ0c1sxXS5wYWRFbmQodGhpcy5zY2FsZSwgJzAnKTtcbiAgICAgIHJldHVybiBwYXJ0cy5qb2luKHRoaXMucmFkaXgpO1xuICAgIH1cbiAgICBkb1NraXBJbnZhbGlkKGNoLCBmbGFncywgY2hlY2tUYWlsKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgZHJvcEZyYWN0aW9uYWwgPSB0aGlzLnNjYWxlID09PSAwICYmIGNoICE9PSB0aGlzLnRob3VzYW5kc1NlcGFyYXRvciAmJiAoY2ggPT09IHRoaXMucmFkaXggfHwgY2ggPT09IE1hc2tlZE51bWJlci5VTk1BU0tFRF9SQURJWCB8fCB0aGlzLm1hcFRvUmFkaXguaW5jbHVkZXMoY2gpKTtcbiAgICAgIHJldHVybiBzdXBlci5kb1NraXBJbnZhbGlkKGNoLCBmbGFncywgY2hlY2tUYWlsKSAmJiAhZHJvcEZyYWN0aW9uYWw7XG4gICAgfVxuICAgIGdldCB1bm1hc2tlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbW92ZVRob3VzYW5kc1NlcGFyYXRvcnModGhpcy5fbm9ybWFsaXplWmVyb3ModGhpcy52YWx1ZSkpLnJlcGxhY2UodGhpcy5yYWRpeCwgTWFza2VkTnVtYmVyLlVOTUFTS0VEX1JBRElYKTtcbiAgICB9XG4gICAgc2V0IHVubWFza2VkVmFsdWUodW5tYXNrZWRWYWx1ZSkge1xuICAgICAgc3VwZXIudW5tYXNrZWRWYWx1ZSA9IHVubWFza2VkVmFsdWU7XG4gICAgfVxuICAgIGdldCB0eXBlZFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2UodGhpcy51bm1hc2tlZFZhbHVlLCB0aGlzKTtcbiAgICB9XG4gICAgc2V0IHR5cGVkVmFsdWUobikge1xuICAgICAgdGhpcy5yYXdJbnB1dFZhbHVlID0gdGhpcy5mb3JtYXQobiwgdGhpcykucmVwbGFjZShNYXNrZWROdW1iZXIuVU5NQVNLRURfUkFESVgsIHRoaXMucmFkaXgpO1xuICAgIH1cblxuICAgIC8qKiBQYXJzZWQgTnVtYmVyICovXG4gICAgZ2V0IG51bWJlcigpIHtcbiAgICAgIHJldHVybiB0aGlzLnR5cGVkVmFsdWU7XG4gICAgfVxuICAgIHNldCBudW1iZXIobnVtYmVyKSB7XG4gICAgICB0aGlzLnR5cGVkVmFsdWUgPSBudW1iZXI7XG4gICAgfVxuICAgIGdldCBhbGxvd05lZ2F0aXZlKCkge1xuICAgICAgcmV0dXJuIHRoaXMubWluICE9IG51bGwgJiYgdGhpcy5taW4gPCAwIHx8IHRoaXMubWF4ICE9IG51bGwgJiYgdGhpcy5tYXggPCAwO1xuICAgIH1cbiAgICBnZXQgYWxsb3dQb3NpdGl2ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm1pbiAhPSBudWxsICYmIHRoaXMubWluID4gMCB8fCB0aGlzLm1heCAhPSBudWxsICYmIHRoaXMubWF4ID4gMDtcbiAgICB9XG4gICAgdHlwZWRWYWx1ZUVxdWFscyh2YWx1ZSkge1xuICAgICAgLy8gaGFuZGxlICAwIC0+ICcnIGNhc2UgKHR5cGVkID0gMCBldmVuIGlmIHZhbHVlID0gJycpXG4gICAgICAvLyBmb3IgZGV0YWlscyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3VObUFuTmVSL2ltYXNranMvaXNzdWVzLzEzNFxuICAgICAgcmV0dXJuIChzdXBlci50eXBlZFZhbHVlRXF1YWxzKHZhbHVlKSB8fCBNYXNrZWROdW1iZXIuRU1QVFlfVkFMVUVTLmluY2x1ZGVzKHZhbHVlKSAmJiBNYXNrZWROdW1iZXIuRU1QVFlfVkFMVUVTLmluY2x1ZGVzKHRoaXMudHlwZWRWYWx1ZSkpICYmICEodmFsdWUgPT09IDAgJiYgdGhpcy52YWx1ZSA9PT0gJycpO1xuICAgIH1cbiAgfVxuICBfTWFza2VkTnVtYmVyID0gTWFza2VkTnVtYmVyO1xuICBNYXNrZWROdW1iZXIuVU5NQVNLRURfUkFESVggPSAnLic7XG4gIE1hc2tlZE51bWJlci5FTVBUWV9WQUxVRVMgPSBbLi4uTWFza2VkLkVNUFRZX1ZBTFVFUywgMF07XG4gIE1hc2tlZE51bWJlci5ERUZBVUxUUyA9IHtcbiAgICAuLi5NYXNrZWQuREVGQVVMVFMsXG4gICAgbWFzazogTnVtYmVyLFxuICAgIHJhZGl4OiAnLCcsXG4gICAgdGhvdXNhbmRzU2VwYXJhdG9yOiAnJyxcbiAgICBtYXBUb1JhZGl4OiBbX01hc2tlZE51bWJlci5VTk1BU0tFRF9SQURJWF0sXG4gICAgbWluOiBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUixcbiAgICBtYXg6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLFxuICAgIHNjYWxlOiAyLFxuICAgIG5vcm1hbGl6ZVplcm9zOiB0cnVlLFxuICAgIHBhZEZyYWN0aW9uYWxaZXJvczogZmFsc2UsXG4gICAgcGFyc2U6IE51bWJlcixcbiAgICBmb3JtYXQ6IG4gPT4gbi50b0xvY2FsZVN0cmluZygnZW4tVVMnLCB7XG4gICAgICB1c2VHcm91cGluZzogZmFsc2UsXG4gICAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDIwXG4gICAgfSlcbiAgfTtcbiAgSU1hc2suTWFza2VkTnVtYmVyID0gTWFza2VkTnVtYmVyO1xuXG4gIC8qKiBNYXNrIHBpcGUgc291cmNlIGFuZCBkZXN0aW5hdGlvbiB0eXBlcyAqL1xuICBjb25zdCBQSVBFX1RZUEUgPSB7XG4gICAgTUFTS0VEOiAndmFsdWUnLFxuICAgIFVOTUFTS0VEOiAndW5tYXNrZWRWYWx1ZScsXG4gICAgVFlQRUQ6ICd0eXBlZFZhbHVlJ1xuICB9O1xuICAvKiogQ3JlYXRlcyBuZXcgcGlwZSBmdW5jdGlvbiBkZXBlbmRpbmcgb24gbWFzayB0eXBlLCBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIG9wdGlvbnMgKi9cbiAgZnVuY3Rpb24gY3JlYXRlUGlwZShhcmcsIGZyb20sIHRvKSB7XG4gICAgaWYgKGZyb20gPT09IHZvaWQgMCkge1xuICAgICAgZnJvbSA9IFBJUEVfVFlQRS5NQVNLRUQ7XG4gICAgfVxuICAgIGlmICh0byA9PT0gdm9pZCAwKSB7XG4gICAgICB0byA9IFBJUEVfVFlQRS5NQVNLRUQ7XG4gICAgfVxuICAgIGNvbnN0IG1hc2tlZCA9IGNyZWF0ZU1hc2soYXJnKTtcbiAgICByZXR1cm4gdmFsdWUgPT4gbWFza2VkLnJ1bklzb2xhdGVkKG0gPT4ge1xuICAgICAgbVtmcm9tXSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIG1bdG9dO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIFBpcGVzIHZhbHVlIHRocm91Z2ggbWFzayBkZXBlbmRpbmcgb24gbWFzayB0eXBlLCBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uIG9wdGlvbnMgKi9cbiAgZnVuY3Rpb24gcGlwZSh2YWx1ZSwgbWFzaywgZnJvbSwgdG8pIHtcbiAgICByZXR1cm4gY3JlYXRlUGlwZShtYXNrLCBmcm9tLCB0bykodmFsdWUpO1xuICB9XG4gIElNYXNrLlBJUEVfVFlQRSA9IFBJUEVfVFlQRTtcbiAgSU1hc2suY3JlYXRlUGlwZSA9IGNyZWF0ZVBpcGU7XG4gIElNYXNrLnBpcGUgPSBwaXBlO1xuXG4gIC8qKiBQYXR0ZXJuIG1hc2sgKi9cbiAgY2xhc3MgUmVwZWF0QmxvY2sgZXh0ZW5kcyBNYXNrZWRQYXR0ZXJuIHtcbiAgICBnZXQgcmVwZWF0RnJvbSgpIHtcbiAgICAgIHZhciBfcmVmO1xuICAgICAgcmV0dXJuIChfcmVmID0gQXJyYXkuaXNBcnJheSh0aGlzLnJlcGVhdCkgPyB0aGlzLnJlcGVhdFswXSA6IHRoaXMucmVwZWF0ID09PSBJbmZpbml0eSA/IDAgOiB0aGlzLnJlcGVhdCkgIT0gbnVsbCA/IF9yZWYgOiAwO1xuICAgIH1cbiAgICBnZXQgcmVwZWF0VG8oKSB7XG4gICAgICB2YXIgX3JlZjI7XG4gICAgICByZXR1cm4gKF9yZWYyID0gQXJyYXkuaXNBcnJheSh0aGlzLnJlcGVhdCkgPyB0aGlzLnJlcGVhdFsxXSA6IHRoaXMucmVwZWF0KSAhPSBudWxsID8gX3JlZjIgOiBJbmZpbml0eTtcbiAgICB9XG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgc3VwZXIob3B0cyk7XG4gICAgfVxuICAgIHVwZGF0ZU9wdGlvbnMob3B0cykge1xuICAgICAgc3VwZXIudXBkYXRlT3B0aW9ucyhvcHRzKTtcbiAgICB9XG4gICAgX3VwZGF0ZShvcHRzKSB7XG4gICAgICB2YXIgX3JlZjMsIF9yZWY0LCBfdGhpcyRfYmxvY2tzO1xuICAgICAgY29uc3Qge1xuICAgICAgICByZXBlYXQsXG4gICAgICAgIC4uLmJsb2NrT3B0c1xuICAgICAgfSA9IG5vcm1hbGl6ZU9wdHMob3B0cyk7IC8vIFRPRE8gdHlwZVxuICAgICAgdGhpcy5fYmxvY2tPcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5fYmxvY2tPcHRzLCBibG9ja09wdHMpO1xuICAgICAgY29uc3QgYmxvY2sgPSBjcmVhdGVNYXNrKHRoaXMuX2Jsb2NrT3B0cyk7XG4gICAgICB0aGlzLnJlcGVhdCA9IChfcmVmMyA9IChfcmVmNCA9IHJlcGVhdCAhPSBudWxsID8gcmVwZWF0IDogYmxvY2sucmVwZWF0KSAhPSBudWxsID8gX3JlZjQgOiB0aGlzLnJlcGVhdCkgIT0gbnVsbCA/IF9yZWYzIDogSW5maW5pdHk7IC8vIFRPRE8gdHlwZVxuXG4gICAgICBzdXBlci5fdXBkYXRlKHtcbiAgICAgICAgbWFzazogJ20nLnJlcGVhdChNYXRoLm1heCh0aGlzLnJlcGVhdFRvID09PSBJbmZpbml0eSAmJiAoKF90aGlzJF9ibG9ja3MgPSB0aGlzLl9ibG9ja3MpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRfYmxvY2tzLmxlbmd0aCkgfHwgMCwgdGhpcy5yZXBlYXRGcm9tKSksXG4gICAgICAgIGJsb2Nrczoge1xuICAgICAgICAgIG06IGJsb2NrXG4gICAgICAgIH0sXG4gICAgICAgIGVhZ2VyOiBibG9jay5lYWdlcixcbiAgICAgICAgb3ZlcndyaXRlOiBibG9jay5vdmVyd3JpdGUsXG4gICAgICAgIHNraXBJbnZhbGlkOiBibG9jay5za2lwSW52YWxpZCxcbiAgICAgICAgbGF6eTogYmxvY2subGF6eSxcbiAgICAgICAgcGxhY2Vob2xkZXJDaGFyOiBibG9jay5wbGFjZWhvbGRlckNoYXIsXG4gICAgICAgIGRpc3BsYXlDaGFyOiBibG9jay5kaXNwbGF5Q2hhclxuICAgICAgfSk7XG4gICAgfVxuICAgIF9hbGxvY2F0ZUJsb2NrKGJpKSB7XG4gICAgICBpZiAoYmkgPCB0aGlzLl9ibG9ja3MubGVuZ3RoKSByZXR1cm4gdGhpcy5fYmxvY2tzW2JpXTtcbiAgICAgIGlmICh0aGlzLnJlcGVhdFRvID09PSBJbmZpbml0eSB8fCB0aGlzLl9ibG9ja3MubGVuZ3RoIDwgdGhpcy5yZXBlYXRUbykge1xuICAgICAgICB0aGlzLl9ibG9ja3MucHVzaChjcmVhdGVNYXNrKHRoaXMuX2Jsb2NrT3B0cykpO1xuICAgICAgICB0aGlzLm1hc2sgKz0gJ20nO1xuICAgICAgICByZXR1cm4gdGhpcy5fYmxvY2tzW3RoaXMuX2Jsb2Nrcy5sZW5ndGggLSAxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgX2FwcGVuZENoYXJSYXcoY2gsIGZsYWdzKSB7XG4gICAgICBpZiAoZmxhZ3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmbGFncyA9IHt9O1xuICAgICAgfVxuICAgICAgY29uc3QgZGV0YWlscyA9IG5ldyBDaGFuZ2VEZXRhaWxzKCk7XG4gICAgICBmb3IgKGxldCBiaSA9IChfdGhpcyRfbWFwUG9zVG9CbG9jayQgPSAoX3RoaXMkX21hcFBvc1RvQmxvY2sgPSB0aGlzLl9tYXBQb3NUb0Jsb2NrKHRoaXMuZGlzcGxheVZhbHVlLmxlbmd0aCkpID09IG51bGwgPyB2b2lkIDAgOiBfdGhpcyRfbWFwUG9zVG9CbG9jay5pbmRleCkgIT0gbnVsbCA/IF90aGlzJF9tYXBQb3NUb0Jsb2NrJCA6IE1hdGgubWF4KHRoaXMuX2Jsb2Nrcy5sZW5ndGggLSAxLCAwKSwgYmxvY2ssIGFsbG9jYXRlZDtcbiAgICAgIC8vIHRyeSB0byBnZXQgYSBibG9jayBvclxuICAgICAgLy8gdHJ5IHRvIGFsbG9jYXRlIGEgbmV3IGJsb2NrIGlmIG5vdCBhbGxvY2F0ZWQgYWxyZWFkeVxuICAgICAgYmxvY2sgPSAoX3RoaXMkX2Jsb2NrcyRiaSA9IHRoaXMuX2Jsb2Nrc1tiaV0pICE9IG51bGwgPyBfdGhpcyRfYmxvY2tzJGJpIDogYWxsb2NhdGVkID0gIWFsbG9jYXRlZCAmJiB0aGlzLl9hbGxvY2F0ZUJsb2NrKGJpKTsgKytiaSkge1xuICAgICAgICB2YXIgX3RoaXMkX21hcFBvc1RvQmxvY2skLCBfdGhpcyRfbWFwUG9zVG9CbG9jaywgX3RoaXMkX2Jsb2NrcyRiaSwgX2ZsYWdzJF9iZWZvcmVUYWlsU3RhO1xuICAgICAgICBjb25zdCBibG9ja0RldGFpbHMgPSBibG9jay5fYXBwZW5kQ2hhcihjaCwge1xuICAgICAgICAgIC4uLmZsYWdzLFxuICAgICAgICAgIF9iZWZvcmVUYWlsU3RhdGU6IChfZmxhZ3MkX2JlZm9yZVRhaWxTdGEgPSBmbGFncy5fYmVmb3JlVGFpbFN0YXRlKSA9PSBudWxsIHx8IChfZmxhZ3MkX2JlZm9yZVRhaWxTdGEgPSBfZmxhZ3MkX2JlZm9yZVRhaWxTdGEuX2Jsb2NrcykgPT0gbnVsbCA/IHZvaWQgMCA6IF9mbGFncyRfYmVmb3JlVGFpbFN0YVtiaV1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChibG9ja0RldGFpbHMuc2tpcCAmJiBhbGxvY2F0ZWQpIHtcbiAgICAgICAgICAvLyByZW1vdmUgdGhlIGxhc3QgYWxsb2NhdGVkIGJsb2NrIGFuZCBicmVha1xuICAgICAgICAgIHRoaXMuX2Jsb2Nrcy5wb3AoKTtcbiAgICAgICAgICB0aGlzLm1hc2sgPSB0aGlzLm1hc2suc2xpY2UoMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZGV0YWlscy5hZ2dyZWdhdGUoYmxvY2tEZXRhaWxzKTtcbiAgICAgICAgaWYgKGJsb2NrRGV0YWlscy5jb25zdW1lZCkgYnJlYWs7IC8vIGdvIG5leHQgY2hhclxuICAgICAgfVxuICAgICAgcmV0dXJuIGRldGFpbHM7XG4gICAgfVxuICAgIF90cmltRW1wdHlUYWlsKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICB2YXIgX3RoaXMkX21hcFBvc1RvQmxvY2syLCBfdGhpcyRfbWFwUG9zVG9CbG9jazM7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgY29uc3QgZmlyc3RCbG9ja0luZGV4ID0gTWF0aC5tYXgoKChfdGhpcyRfbWFwUG9zVG9CbG9jazIgPSB0aGlzLl9tYXBQb3NUb0Jsb2NrKGZyb21Qb3MpKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkX21hcFBvc1RvQmxvY2syLmluZGV4KSB8fCAwLCB0aGlzLnJlcGVhdEZyb20sIDApO1xuICAgICAgbGV0IGxhc3RCbG9ja0luZGV4O1xuICAgICAgaWYgKHRvUG9zICE9IG51bGwpIGxhc3RCbG9ja0luZGV4ID0gKF90aGlzJF9tYXBQb3NUb0Jsb2NrMyA9IHRoaXMuX21hcFBvc1RvQmxvY2sodG9Qb3MpKSA9PSBudWxsID8gdm9pZCAwIDogX3RoaXMkX21hcFBvc1RvQmxvY2szLmluZGV4O1xuICAgICAgaWYgKGxhc3RCbG9ja0luZGV4ID09IG51bGwpIGxhc3RCbG9ja0luZGV4ID0gdGhpcy5fYmxvY2tzLmxlbmd0aCAtIDE7XG4gICAgICBsZXQgcmVtb3ZlQ291bnQgPSAwO1xuICAgICAgZm9yIChsZXQgYmxvY2tJbmRleCA9IGxhc3RCbG9ja0luZGV4OyBmaXJzdEJsb2NrSW5kZXggPD0gYmxvY2tJbmRleDsgLS1ibG9ja0luZGV4LCArK3JlbW92ZUNvdW50KSB7XG4gICAgICAgIGlmICh0aGlzLl9ibG9ja3NbYmxvY2tJbmRleF0udW5tYXNrZWRWYWx1ZSkgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAocmVtb3ZlQ291bnQpIHtcbiAgICAgICAgdGhpcy5fYmxvY2tzLnNwbGljZShsYXN0QmxvY2tJbmRleCAtIHJlbW92ZUNvdW50ICsgMSwgcmVtb3ZlQ291bnQpO1xuICAgICAgICB0aGlzLm1hc2sgPSB0aGlzLm1hc2suc2xpY2UocmVtb3ZlQ291bnQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXNldCgpIHtcbiAgICAgIHN1cGVyLnJlc2V0KCk7XG4gICAgICB0aGlzLl90cmltRW1wdHlUYWlsKCk7XG4gICAgfVxuICAgIHJlbW92ZShmcm9tUG9zLCB0b1Bvcykge1xuICAgICAgaWYgKGZyb21Qb3MgPT09IHZvaWQgMCkge1xuICAgICAgICBmcm9tUG9zID0gMDtcbiAgICAgIH1cbiAgICAgIGlmICh0b1BvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRvUG9zID0gdGhpcy5kaXNwbGF5VmFsdWUubGVuZ3RoO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVtb3ZlRGV0YWlscyA9IHN1cGVyLnJlbW92ZShmcm9tUG9zLCB0b1Bvcyk7XG4gICAgICB0aGlzLl90cmltRW1wdHlUYWlsKGZyb21Qb3MsIHRvUG9zKTtcbiAgICAgIHJldHVybiByZW1vdmVEZXRhaWxzO1xuICAgIH1cbiAgICB0b3RhbElucHV0UG9zaXRpb25zKGZyb21Qb3MsIHRvUG9zKSB7XG4gICAgICBpZiAoZnJvbVBvcyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZyb21Qb3MgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHRvUG9zID09IG51bGwgJiYgdGhpcy5yZXBlYXRUbyA9PT0gSW5maW5pdHkpIHJldHVybiBJbmZpbml0eTtcbiAgICAgIHJldHVybiBzdXBlci50b3RhbElucHV0UG9zaXRpb25zKGZyb21Qb3MsIHRvUG9zKTtcbiAgICB9XG4gICAgZ2V0IHN0YXRlKCkge1xuICAgICAgcmV0dXJuIHN1cGVyLnN0YXRlO1xuICAgIH1cbiAgICBzZXQgc3RhdGUoc3RhdGUpIHtcbiAgICAgIHRoaXMuX2Jsb2Nrcy5sZW5ndGggPSBzdGF0ZS5fYmxvY2tzLmxlbmd0aDtcbiAgICAgIHRoaXMubWFzayA9IHRoaXMubWFzay5zbGljZSgwLCB0aGlzLl9ibG9ja3MubGVuZ3RoKTtcbiAgICAgIHN1cGVyLnN0YXRlID0gc3RhdGU7XG4gICAgfVxuICB9XG4gIElNYXNrLlJlcGVhdEJsb2NrID0gUmVwZWF0QmxvY2s7XG5cbiAgdHJ5IHtcbiAgICBnbG9iYWxUaGlzLklNYXNrID0gSU1hc2s7XG4gIH0gY2F0Y2gge31cblxuICBleHBvcnRzLkNoYW5nZURldGFpbHMgPSBDaGFuZ2VEZXRhaWxzO1xuICBleHBvcnRzLkNodW5rc1RhaWxEZXRhaWxzID0gQ2h1bmtzVGFpbERldGFpbHM7XG4gIGV4cG9ydHMuRElSRUNUSU9OID0gRElSRUNUSU9OO1xuICBleHBvcnRzLkhUTUxDb250ZW50ZWRpdGFibGVNYXNrRWxlbWVudCA9IEhUTUxDb250ZW50ZWRpdGFibGVNYXNrRWxlbWVudDtcbiAgZXhwb3J0cy5IVE1MSW5wdXRNYXNrRWxlbWVudCA9IEhUTUxJbnB1dE1hc2tFbGVtZW50O1xuICBleHBvcnRzLkhUTUxNYXNrRWxlbWVudCA9IEhUTUxNYXNrRWxlbWVudDtcbiAgZXhwb3J0cy5JbnB1dE1hc2sgPSBJbnB1dE1hc2s7XG4gIGV4cG9ydHMuTWFza0VsZW1lbnQgPSBNYXNrRWxlbWVudDtcbiAgZXhwb3J0cy5NYXNrZWQgPSBNYXNrZWQ7XG4gIGV4cG9ydHMuTWFza2VkRGF0ZSA9IE1hc2tlZERhdGU7XG4gIGV4cG9ydHMuTWFza2VkRHluYW1pYyA9IE1hc2tlZER5bmFtaWM7XG4gIGV4cG9ydHMuTWFza2VkRW51bSA9IE1hc2tlZEVudW07XG4gIGV4cG9ydHMuTWFza2VkRnVuY3Rpb24gPSBNYXNrZWRGdW5jdGlvbjtcbiAgZXhwb3J0cy5NYXNrZWROdW1iZXIgPSBNYXNrZWROdW1iZXI7XG4gIGV4cG9ydHMuTWFza2VkUGF0dGVybiA9IE1hc2tlZFBhdHRlcm47XG4gIGV4cG9ydHMuTWFza2VkUmFuZ2UgPSBNYXNrZWRSYW5nZTtcbiAgZXhwb3J0cy5NYXNrZWRSZWdFeHAgPSBNYXNrZWRSZWdFeHA7XG4gIGV4cG9ydHMuUElQRV9UWVBFID0gUElQRV9UWVBFO1xuICBleHBvcnRzLlBhdHRlcm5GaXhlZERlZmluaXRpb24gPSBQYXR0ZXJuRml4ZWREZWZpbml0aW9uO1xuICBleHBvcnRzLlBhdHRlcm5JbnB1dERlZmluaXRpb24gPSBQYXR0ZXJuSW5wdXREZWZpbml0aW9uO1xuICBleHBvcnRzLlJlcGVhdEJsb2NrID0gUmVwZWF0QmxvY2s7XG4gIGV4cG9ydHMuY3JlYXRlTWFzayA9IGNyZWF0ZU1hc2s7XG4gIGV4cG9ydHMuY3JlYXRlUGlwZSA9IGNyZWF0ZVBpcGU7XG4gIGV4cG9ydHMuZGVmYXVsdCA9IElNYXNrO1xuICBleHBvcnRzLmZvcmNlRGlyZWN0aW9uID0gZm9yY2VEaXJlY3Rpb247XG4gIGV4cG9ydHMubm9ybWFsaXplT3B0cyA9IG5vcm1hbGl6ZU9wdHM7XG4gIGV4cG9ydHMucGlwZSA9IHBpcGU7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW1hc2suanMubWFwXG4iLCIvKiFcbiAqIHZhbGlkYXRlLmpzIDAuMTMuMVxuICpcbiAqIChjKSAyMDEzLTIwMTkgTmlja2xhcyBBbnNtYW4sIDIwMTMgV3JhcHBcbiAqIFZhbGlkYXRlLmpzIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICogRm9yIGFsbCBkZXRhaWxzIGFuZCBkb2N1bWVudGF0aW9uOlxuICogaHR0cDovL3ZhbGlkYXRlanMub3JnL1xuICovXG5cbihmdW5jdGlvbihleHBvcnRzLCBtb2R1bGUsIGRlZmluZSkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICAvLyBUaGUgbWFpbiBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSB2YWxpZGF0b3JzIHNwZWNpZmllZCBieSB0aGUgY29uc3RyYWludHMuXG4gIC8vIFRoZSBvcHRpb25zIGFyZSB0aGUgZm9sbG93aW5nOlxuICAvLyAgIC0gZm9ybWF0IChzdHJpbmcpIC0gQW4gb3B0aW9uIHRoYXQgY29udHJvbHMgaG93IHRoZSByZXR1cm5lZCB2YWx1ZSBpcyBmb3JtYXR0ZWRcbiAgLy8gICAgICogZmxhdCAtIFJldHVybnMgYSBmbGF0IGFycmF5IG9mIGp1c3QgdGhlIGVycm9yIG1lc3NhZ2VzXG4gIC8vICAgICAqIGdyb3VwZWQgLSBSZXR1cm5zIHRoZSBtZXNzYWdlcyBncm91cGVkIGJ5IGF0dHJpYnV0ZSAoZGVmYXVsdClcbiAgLy8gICAgICogZGV0YWlsZWQgLSBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSByYXcgdmFsaWRhdGlvbiBkYXRhXG4gIC8vICAgLSBmdWxsTWVzc2FnZXMgKGJvb2xlYW4pIC0gSWYgYHRydWVgIChkZWZhdWx0KSB0aGUgYXR0cmlidXRlIG5hbWUgaXMgcHJlcGVuZGVkIHRvIHRoZSBlcnJvci5cbiAgLy9cbiAgLy8gUGxlYXNlIG5vdGUgdGhhdCB0aGUgb3B0aW9ucyBhcmUgYWxzbyBwYXNzZWQgdG8gZWFjaCB2YWxpZGF0b3IuXG4gIHZhciB2YWxpZGF0ZSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB2Lm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgdmFyIHJlc3VsdHMgPSB2LnJ1blZhbGlkYXRpb25zKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzLCBvcHRpb25zKVxuICAgICAgLCBhdHRyXG4gICAgICAsIHZhbGlkYXRvcjtcblxuICAgIGlmIChyZXN1bHRzLnNvbWUoZnVuY3Rpb24ocikgeyByZXR1cm4gdi5pc1Byb21pc2Uoci5lcnJvcik7IH0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVc2UgdmFsaWRhdGUuYXN5bmMgaWYgeW91IHdhbnQgc3VwcG9ydCBmb3IgcHJvbWlzZXNcIik7XG4gICAgfVxuICAgIHJldHVybiB2YWxpZGF0ZS5wcm9jZXNzVmFsaWRhdGlvblJlc3VsdHMocmVzdWx0cywgb3B0aW9ucyk7XG4gIH07XG5cbiAgdmFyIHYgPSB2YWxpZGF0ZTtcblxuICAvLyBDb3BpZXMgb3ZlciBhdHRyaWJ1dGVzIGZyb20gb25lIG9yIG1vcmUgc291cmNlcyB0byBhIHNpbmdsZSBkZXN0aW5hdGlvbi5cbiAgLy8gVmVyeSBtdWNoIHNpbWlsYXIgdG8gdW5kZXJzY29yZSdzIGV4dGVuZC5cbiAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IGlzIHRoZSB0YXJnZXQgb2JqZWN0IGFuZCB0aGUgcmVtYWluaW5nIGFyZ3VtZW50cyB3aWxsIGJlXG4gIC8vIHVzZWQgYXMgc291cmNlcy5cbiAgdi5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkuZm9yRWFjaChmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGZvciAodmFyIGF0dHIgaW4gc291cmNlKSB7XG4gICAgICAgIG9ialthdHRyXSA9IHNvdXJjZVthdHRyXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIHYuZXh0ZW5kKHZhbGlkYXRlLCB7XG4gICAgLy8gVGhpcyBpcyB0aGUgdmVyc2lvbiBvZiB0aGUgbGlicmFyeSBhcyBhIHNlbXZlci5cbiAgICAvLyBUaGUgdG9TdHJpbmcgZnVuY3Rpb24gd2lsbCBhbGxvdyBpdCB0byBiZSBjb2VyY2VkIGludG8gYSBzdHJpbmdcbiAgICB2ZXJzaW9uOiB7XG4gICAgICBtYWpvcjogMCxcbiAgICAgIG1pbm9yOiAxMyxcbiAgICAgIHBhdGNoOiAxLFxuICAgICAgbWV0YWRhdGE6IG51bGwsXG4gICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2ZXJzaW9uID0gdi5mb3JtYXQoXCIle21ham9yfS4le21pbm9yfS4le3BhdGNofVwiLCB2LnZlcnNpb24pO1xuICAgICAgICBpZiAoIXYuaXNFbXB0eSh2LnZlcnNpb24ubWV0YWRhdGEpKSB7XG4gICAgICAgICAgdmVyc2lvbiArPSBcIitcIiArIHYudmVyc2lvbi5tZXRhZGF0YTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmVyc2lvbjtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gQmVsb3cgaXMgdGhlIGRlcGVuZGVuY2llcyB0aGF0IGFyZSB1c2VkIGluIHZhbGlkYXRlLmpzXG5cbiAgICAvLyBUaGUgY29uc3RydWN0b3Igb2YgdGhlIFByb21pc2UgaW1wbGVtZW50YXRpb24uXG4gICAgLy8gSWYgeW91IGFyZSB1c2luZyBRLmpzLCBSU1ZQIG9yIGFueSBvdGhlciBBKyBjb21wYXRpYmxlIGltcGxlbWVudGF0aW9uXG4gICAgLy8gb3ZlcnJpZGUgdGhpcyBhdHRyaWJ1dGUgdG8gYmUgdGhlIGNvbnN0cnVjdG9yIG9mIHRoYXQgcHJvbWlzZS5cbiAgICAvLyBTaW5jZSBqUXVlcnkgcHJvbWlzZXMgYXJlbid0IEErIGNvbXBhdGlibGUgdGhleSB3b24ndCB3b3JrLlxuICAgIFByb21pc2U6IHR5cGVvZiBQcm9taXNlICE9PSBcInVuZGVmaW5lZFwiID8gUHJvbWlzZSA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIG51bGwsXG5cbiAgICBFTVBUWV9TVFJJTkdfUkVHRVhQOiAvXlxccyokLyxcblxuICAgIC8vIFJ1bnMgdGhlIHZhbGlkYXRvcnMgc3BlY2lmaWVkIGJ5IHRoZSBjb25zdHJhaW50cyBvYmplY3QuXG4gICAgLy8gV2lsbCByZXR1cm4gYW4gYXJyYXkgb2YgdGhlIGZvcm1hdDpcbiAgICAvLyAgICAgW3thdHRyaWJ1dGU6IFwiPGF0dHJpYnV0ZSBuYW1lPlwiLCBlcnJvcjogXCI8dmFsaWRhdGlvbiByZXN1bHQ+XCJ9LCAuLi5dXG4gICAgcnVuVmFsaWRhdGlvbnM6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzLCBvcHRpb25zKSB7XG4gICAgICB2YXIgcmVzdWx0cyA9IFtdXG4gICAgICAgICwgYXR0clxuICAgICAgICAsIHZhbGlkYXRvck5hbWVcbiAgICAgICAgLCB2YWx1ZVxuICAgICAgICAsIHZhbGlkYXRvcnNcbiAgICAgICAgLCB2YWxpZGF0b3JcbiAgICAgICAgLCB2YWxpZGF0b3JPcHRpb25zXG4gICAgICAgICwgZXJyb3I7XG5cbiAgICAgIGlmICh2LmlzRG9tRWxlbWVudChhdHRyaWJ1dGVzKSB8fCB2LmlzSnF1ZXJ5RWxlbWVudChhdHRyaWJ1dGVzKSkge1xuICAgICAgICBhdHRyaWJ1dGVzID0gdi5jb2xsZWN0Rm9ybVZhbHVlcyhhdHRyaWJ1dGVzKTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9vcHMgdGhyb3VnaCBlYWNoIGNvbnN0cmFpbnRzLCBmaW5kcyB0aGUgY29ycmVjdCB2YWxpZGF0b3IgYW5kIHJ1biBpdC5cbiAgICAgIGZvciAoYXR0ciBpbiBjb25zdHJhaW50cykge1xuICAgICAgICB2YWx1ZSA9IHYuZ2V0RGVlcE9iamVjdFZhbHVlKGF0dHJpYnV0ZXMsIGF0dHIpO1xuICAgICAgICAvLyBUaGlzIGFsbG93cyB0aGUgY29uc3RyYWludHMgZm9yIGFuIGF0dHJpYnV0ZSB0byBiZSBhIGZ1bmN0aW9uLlxuICAgICAgICAvLyBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgd2l0aCB0aGUgdmFsdWUsIGF0dHJpYnV0ZSBuYW1lLCB0aGUgY29tcGxldGUgZGljdCBvZlxuICAgICAgICAvLyBhdHRyaWJ1dGVzIGFzIHdlbGwgYXMgdGhlIG9wdGlvbnMgYW5kIGNvbnN0cmFpbnRzIHBhc3NlZCBpbi5cbiAgICAgICAgLy8gVGhpcyBpcyB1c2VmdWwgd2hlbiB5b3Ugd2FudCB0byBoYXZlIGRpZmZlcmVudFxuICAgICAgICAvLyB2YWxpZGF0aW9ucyBkZXBlbmRpbmcgb24gdGhlIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgICAgdmFsaWRhdG9ycyA9IHYucmVzdWx0KGNvbnN0cmFpbnRzW2F0dHJdLCB2YWx1ZSwgYXR0cmlidXRlcywgYXR0ciwgb3B0aW9ucywgY29uc3RyYWludHMpO1xuXG4gICAgICAgIGZvciAodmFsaWRhdG9yTmFtZSBpbiB2YWxpZGF0b3JzKSB7XG4gICAgICAgICAgdmFsaWRhdG9yID0gdi52YWxpZGF0b3JzW3ZhbGlkYXRvck5hbWVdO1xuXG4gICAgICAgICAgaWYgKCF2YWxpZGF0b3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gdi5mb3JtYXQoXCJVbmtub3duIHZhbGlkYXRvciAle25hbWV9XCIsIHtuYW1lOiB2YWxpZGF0b3JOYW1lfSk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhbGlkYXRvck9wdGlvbnMgPSB2YWxpZGF0b3JzW3ZhbGlkYXRvck5hbWVdO1xuICAgICAgICAgIC8vIFRoaXMgYWxsb3dzIHRoZSBvcHRpb25zIHRvIGJlIGEgZnVuY3Rpb24uIFRoZSBmdW5jdGlvbiB3aWxsIGJlXG4gICAgICAgICAgLy8gY2FsbGVkIHdpdGggdGhlIHZhbHVlLCBhdHRyaWJ1dGUgbmFtZSwgdGhlIGNvbXBsZXRlIGRpY3Qgb2ZcbiAgICAgICAgICAvLyBhdHRyaWJ1dGVzIGFzIHdlbGwgYXMgdGhlIG9wdGlvbnMgYW5kIGNvbnN0cmFpbnRzIHBhc3NlZCBpbi5cbiAgICAgICAgICAvLyBUaGlzIGlzIHVzZWZ1bCB3aGVuIHlvdSB3YW50IHRvIGhhdmUgZGlmZmVyZW50XG4gICAgICAgICAgLy8gdmFsaWRhdGlvbnMgZGVwZW5kaW5nIG9uIHRoZSBhdHRyaWJ1dGUgdmFsdWUuXG4gICAgICAgICAgdmFsaWRhdG9yT3B0aW9ucyA9IHYucmVzdWx0KHZhbGlkYXRvck9wdGlvbnMsIHZhbHVlLCBhdHRyaWJ1dGVzLCBhdHRyLCBvcHRpb25zLCBjb25zdHJhaW50cyk7XG4gICAgICAgICAgaWYgKCF2YWxpZGF0b3JPcHRpb25zKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZTogYXR0cixcbiAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgIHZhbGlkYXRvcjogdmFsaWRhdG9yTmFtZSxcbiAgICAgICAgICAgIGdsb2JhbE9wdGlvbnM6IG9wdGlvbnMsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICAgICAgb3B0aW9uczogdmFsaWRhdG9yT3B0aW9ucyxcbiAgICAgICAgICAgIGVycm9yOiB2YWxpZGF0b3IuY2FsbCh2YWxpZGF0b3IsXG4gICAgICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBhdHRyLFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucylcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9LFxuXG4gICAgLy8gVGFrZXMgdGhlIG91dHB1dCBmcm9tIHJ1blZhbGlkYXRpb25zIGFuZCBjb252ZXJ0cyBpdCB0byB0aGUgY29ycmVjdFxuICAgIC8vIG91dHB1dCBmb3JtYXQuXG4gICAgcHJvY2Vzc1ZhbGlkYXRpb25SZXN1bHRzOiBmdW5jdGlvbihlcnJvcnMsIG9wdGlvbnMpIHtcbiAgICAgIGVycm9ycyA9IHYucHJ1bmVFbXB0eUVycm9ycyhlcnJvcnMsIG9wdGlvbnMpO1xuICAgICAgZXJyb3JzID0gdi5leHBhbmRNdWx0aXBsZUVycm9ycyhlcnJvcnMsIG9wdGlvbnMpO1xuICAgICAgZXJyb3JzID0gdi5jb252ZXJ0RXJyb3JNZXNzYWdlcyhlcnJvcnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgZm9ybWF0ID0gb3B0aW9ucy5mb3JtYXQgfHwgXCJncm91cGVkXCI7XG5cbiAgICAgIGlmICh0eXBlb2Ygdi5mb3JtYXR0ZXJzW2Zvcm1hdF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZXJyb3JzID0gdi5mb3JtYXR0ZXJzW2Zvcm1hdF0oZXJyb3JzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih2LmZvcm1hdChcIlVua25vd24gZm9ybWF0ICV7Zm9ybWF0fVwiLCBvcHRpb25zKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2LmlzRW1wdHkoZXJyb3JzKSA/IHVuZGVmaW5lZCA6IGVycm9ycztcbiAgICB9LFxuXG4gICAgLy8gUnVucyB0aGUgdmFsaWRhdGlvbnMgd2l0aCBzdXBwb3J0IGZvciBwcm9taXNlcy5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IGlzIHNldHRsZWQgd2hlbiBhbGwgdGhlXG4gICAgLy8gdmFsaWRhdGlvbiBwcm9taXNlcyBoYXZlIGJlZW4gY29tcGxldGVkLlxuICAgIC8vIEl0IGNhbiBiZSBjYWxsZWQgZXZlbiBpZiBubyB2YWxpZGF0aW9ucyByZXR1cm5lZCBhIHByb21pc2UuXG4gICAgYXN5bmM6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHYuYXN5bmMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgIHZhciBXcmFwRXJyb3JzID0gb3B0aW9ucy53cmFwRXJyb3JzIHx8IGZ1bmN0aW9uKGVycm9ycykge1xuICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgfTtcblxuICAgICAgLy8gUmVtb3ZlcyB1bmtub3duIGF0dHJpYnV0ZXNcbiAgICAgIGlmIChvcHRpb25zLmNsZWFuQXR0cmlidXRlcyAhPT0gZmFsc2UpIHtcbiAgICAgICAgYXR0cmlidXRlcyA9IHYuY2xlYW5BdHRyaWJ1dGVzKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHJlc3VsdHMgPSB2LnJ1blZhbGlkYXRpb25zKGF0dHJpYnV0ZXMsIGNvbnN0cmFpbnRzLCBvcHRpb25zKTtcblxuICAgICAgcmV0dXJuIG5ldyB2LlByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHYud2FpdEZvclJlc3VsdHMocmVzdWx0cykudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgZXJyb3JzID0gdi5wcm9jZXNzVmFsaWRhdGlvblJlc3VsdHMocmVzdWx0cywgb3B0aW9ucyk7XG4gICAgICAgICAgaWYgKGVycm9ycykge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBXcmFwRXJyb3JzKGVycm9ycywgb3B0aW9ucywgYXR0cmlidXRlcywgY29uc3RyYWludHMpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZShhdHRyaWJ1dGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzaW5nbGU6IGZ1bmN0aW9uKHZhbHVlLCBjb25zdHJhaW50cywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB2LnNpbmdsZS5vcHRpb25zLCBvcHRpb25zLCB7XG4gICAgICAgIGZvcm1hdDogXCJmbGF0XCIsXG4gICAgICAgIGZ1bGxNZXNzYWdlczogZmFsc2VcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHYoe3NpbmdsZTogdmFsdWV9LCB7c2luZ2xlOiBjb25zdHJhaW50c30sIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gYWxsIHByb21pc2VzIGluIHRoZSByZXN1bHRzIGFycmF5XG4gICAgLy8gYXJlIHNldHRsZWQuIFRoZSBwcm9taXNlIHJldHVybmVkIGZyb20gdGhpcyBmdW5jdGlvbiBpcyBhbHdheXMgcmVzb2x2ZWQsXG4gICAgLy8gbmV2ZXIgcmVqZWN0ZWQuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBtb2RpZmllcyB0aGUgaW5wdXQgYXJndW1lbnQsIGl0IHJlcGxhY2VzIHRoZSBwcm9taXNlc1xuICAgIC8vIHdpdGggdGhlIHZhbHVlIHJldHVybmVkIGZyb20gdGhlIHByb21pc2UuXG4gICAgd2FpdEZvclJlc3VsdHM6IGZ1bmN0aW9uKHJlc3VsdHMpIHtcbiAgICAgIC8vIENyZWF0ZSBhIHNlcXVlbmNlIG9mIGFsbCB0aGUgcmVzdWx0cyBzdGFydGluZyB3aXRoIGEgcmVzb2x2ZWQgcHJvbWlzZS5cbiAgICAgIHJldHVybiByZXN1bHRzLnJlZHVjZShmdW5jdGlvbihtZW1vLCByZXN1bHQpIHtcbiAgICAgICAgLy8gSWYgdGhpcyByZXN1bHQgaXNuJ3QgYSBwcm9taXNlIHNraXAgaXQgaW4gdGhlIHNlcXVlbmNlLlxuICAgICAgICBpZiAoIXYuaXNQcm9taXNlKHJlc3VsdC5lcnJvcikpIHtcbiAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtZW1vLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdC5lcnJvci50aGVuKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICByZXN1bHQuZXJyb3IgPSBlcnJvciB8fCBudWxsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0sIG5ldyB2LlByb21pc2UoZnVuY3Rpb24ocikgeyByKCk7IH0pKTsgLy8gQSByZXNvbHZlZCBwcm9taXNlXG4gICAgfSxcblxuICAgIC8vIElmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIGNhbGw6IGZ1bmN0aW9uIHRoZSBhbmQ6IGZ1bmN0aW9uIHJldHVybiB0aGUgdmFsdWVcbiAgICAvLyBvdGhlcndpc2UganVzdCByZXR1cm4gdGhlIHZhbHVlLiBBZGRpdGlvbmFsIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhc1xuICAgIC8vIGFyZ3VtZW50cyB0byB0aGUgZnVuY3Rpb24uXG4gICAgLy8gRXhhbXBsZTpcbiAgICAvLyBgYGBcbiAgICAvLyByZXN1bHQoJ2ZvbycpIC8vICdmb28nXG4gICAgLy8gcmVzdWx0KE1hdGgubWF4LCAxLCAyKSAvLyAyXG4gICAgLy8gYGBgXG4gICAgcmVzdWx0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcblxuICAgIC8vIENoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYSBudW1iZXIuIFRoaXMgZnVuY3Rpb24gZG9lcyBub3QgY29uc2lkZXIgTmFOIGFcbiAgICAvLyBudW1iZXIgbGlrZSBtYW55IG90aGVyIGBpc051bWJlcmAgZnVuY3Rpb25zIGRvLlxuICAgIGlzTnVtYmVyOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHZhbHVlKTtcbiAgICB9LFxuXG4gICAgLy8gUmV0dXJucyBmYWxzZSBpZiB0aGUgb2JqZWN0IGlzIG5vdCBhIGZ1bmN0aW9uXG4gICAgaXNGdW5jdGlvbjogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG4gICAgfSxcblxuICAgIC8vIEEgc2ltcGxlIGNoZWNrIHRvIHZlcmlmeSB0aGF0IHRoZSB2YWx1ZSBpcyBhbiBpbnRlZ2VyLiBVc2VzIGBpc051bWJlcmBcbiAgICAvLyBhbmQgYSBzaW1wbGUgbW9kdWxvIGNoZWNrLlxuICAgIGlzSW50ZWdlcjogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB2LmlzTnVtYmVyKHZhbHVlKSAmJiB2YWx1ZSAlIDEgPT09IDA7XG4gICAgfSxcblxuICAgIC8vIENoZWNrcyBpZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuXG4gICAgaXNCb29sZWFuOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nO1xuICAgIH0sXG5cbiAgICAvLyBVc2VzIHRoZSBgT2JqZWN0YCBmdW5jdGlvbiB0byBjaGVjayBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gb2JqZWN0LlxuICAgIGlzT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICAgIH0sXG5cbiAgICAvLyBTaW1wbHkgY2hlY2tzIGlmIHRoZSBvYmplY3QgaXMgYW4gaW5zdGFuY2Ugb2YgYSBkYXRlXG4gICAgaXNEYXRlOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBEYXRlO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm5zIGZhbHNlIGlmIHRoZSBvYmplY3QgaXMgYG51bGxgIG9mIGB1bmRlZmluZWRgXG4gICAgaXNEZWZpbmVkOiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogIT09IG51bGwgJiYgb2JqICE9PSB1bmRlZmluZWQ7XG4gICAgfSxcblxuICAgIC8vIENoZWNrcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBwcm9taXNlLiBBbnl0aGluZyB3aXRoIGEgYHRoZW5gXG4gICAgLy8gZnVuY3Rpb24gaXMgY29uc2lkZXJlZCBhIHByb21pc2UuXG4gICAgaXNQcm9taXNlOiBmdW5jdGlvbihwKSB7XG4gICAgICByZXR1cm4gISFwICYmIHYuaXNGdW5jdGlvbihwLnRoZW4pO1xuICAgIH0sXG5cbiAgICBpc0pxdWVyeUVsZW1lbnQ6IGZ1bmN0aW9uKG8pIHtcbiAgICAgIHJldHVybiBvICYmIHYuaXNTdHJpbmcoby5qcXVlcnkpO1xuICAgIH0sXG5cbiAgICBpc0RvbUVsZW1lbnQ6IGZ1bmN0aW9uKG8pIHtcbiAgICAgIGlmICghbykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICghby5xdWVyeVNlbGVjdG9yQWxsIHx8ICFvLnF1ZXJ5U2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAodi5pc09iamVjdChkb2N1bWVudCkgJiYgbyA9PT0gZG9jdW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM4NDM4MC82OTkzMDRcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAodHlwZW9mIEhUTUxFbGVtZW50ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBvIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbyAmJlxuICAgICAgICAgIHR5cGVvZiBvID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgICAgbyAhPT0gbnVsbCAmJlxuICAgICAgICAgIG8ubm9kZVR5cGUgPT09IDEgJiZcbiAgICAgICAgICB0eXBlb2Ygby5ub2RlTmFtZSA9PT0gXCJzdHJpbmdcIjtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgaXNFbXB0eTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHZhciBhdHRyO1xuXG4gICAgICAvLyBOdWxsIGFuZCB1bmRlZmluZWQgYXJlIGVtcHR5XG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gZnVuY3Rpb25zIGFyZSBub24gZW1wdHlcbiAgICAgIGlmICh2LmlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gV2hpdGVzcGFjZSBvbmx5IHN0cmluZ3MgYXJlIGVtcHR5XG4gICAgICBpZiAodi5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHYuRU1QVFlfU1RSSU5HX1JFR0VYUC50ZXN0KHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gRm9yIGFycmF5cyB3ZSB1c2UgdGhlIGxlbmd0aCBwcm9wZXJ0eVxuICAgICAgaWYgKHYuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCA9PT0gMDtcbiAgICAgIH1cblxuICAgICAgLy8gRGF0ZXMgaGF2ZSBubyBhdHRyaWJ1dGVzIGJ1dCBhcmVuJ3QgZW1wdHlcbiAgICAgIGlmICh2LmlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSBmaW5kIGF0IGxlYXN0IG9uZSBwcm9wZXJ0eSB3ZSBjb25zaWRlciBpdCBub24gZW1wdHlcbiAgICAgIGlmICh2LmlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICBmb3IgKGF0dHIgaW4gdmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gRm9ybWF0cyB0aGUgc3BlY2lmaWVkIHN0cmluZ3Mgd2l0aCB0aGUgZ2l2ZW4gdmFsdWVzIGxpa2Ugc286XG4gICAgLy8gYGBgXG4gICAgLy8gZm9ybWF0KFwiRm9vOiAle2Zvb31cIiwge2ZvbzogXCJiYXJcIn0pIC8vIFwiRm9vIGJhclwiXG4gICAgLy8gYGBgXG4gICAgLy8gSWYgeW91IHdhbnQgdG8gd3JpdGUgJXsuLi59IHdpdGhvdXQgaGF2aW5nIGl0IHJlcGxhY2VkIHNpbXBseVxuICAgIC8vIHByZWZpeCBpdCB3aXRoICUgbGlrZSB0aGlzIGBGb286ICUle2Zvb31gIGFuZCBpdCB3aWxsIGJlIHJldHVybmVkXG4gICAgLy8gYXMgYFwiRm9vOiAle2Zvb31cImBcbiAgICBmb3JtYXQ6IHYuZXh0ZW5kKGZ1bmN0aW9uKHN0ciwgdmFscykge1xuICAgICAgaWYgKCF2LmlzU3RyaW5nKHN0cikpIHtcbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdHIucmVwbGFjZSh2LmZvcm1hdC5GT1JNQVRfUkVHRVhQLCBmdW5jdGlvbihtMCwgbTEsIG0yKSB7XG4gICAgICAgIGlmIChtMSA9PT0gJyUnKSB7XG4gICAgICAgICAgcmV0dXJuIFwiJXtcIiArIG0yICsgXCJ9XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFN0cmluZyh2YWxzW20yXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sIHtcbiAgICAgIC8vIEZpbmRzICV7a2V5fSBzdHlsZSBwYXR0ZXJucyBpbiB0aGUgZ2l2ZW4gc3RyaW5nXG4gICAgICBGT1JNQVRfUkVHRVhQOiAvKCU/KSVcXHsoW15cXH1dKylcXH0vZ1xuICAgIH0pLFxuXG4gICAgLy8gXCJQcmV0dGlmaWVzXCIgdGhlIGdpdmVuIHN0cmluZy5cbiAgICAvLyBQcmV0dGlmeWluZyBtZWFucyByZXBsYWNpbmcgWy5cXF8tXSB3aXRoIHNwYWNlcyBhcyB3ZWxsIGFzIHNwbGl0dGluZ1xuICAgIC8vIGNhbWVsIGNhc2Ugd29yZHMuXG4gICAgcHJldHRpZnk6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgaWYgKHYuaXNOdW1iZXIoc3RyKSkge1xuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbW9yZSB0aGFuIDIgZGVjaW1hbHMgcm91bmQgaXQgdG8gdHdvXG4gICAgICAgIGlmICgoc3RyICogMTAwKSAlIDEgPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gXCJcIiArIHN0cjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChNYXRoLnJvdW5kKHN0ciAqIDEwMCkgLyAxMDApLnRvRml4ZWQoMik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHYuaXNBcnJheShzdHIpKSB7XG4gICAgICAgIHJldHVybiBzdHIubWFwKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHYucHJldHRpZnkocyk7IH0pLmpvaW4oXCIsIFwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHYuaXNPYmplY3Qoc3RyKSkge1xuICAgICAgICBpZiAoIXYuaXNEZWZpbmVkKHN0ci50b1N0cmluZykpIHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc3RyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdHIudG9TdHJpbmcoKTtcbiAgICAgIH1cblxuICAgICAgLy8gRW5zdXJlIHRoZSBzdHJpbmcgaXMgYWN0dWFsbHkgYSBzdHJpbmdcbiAgICAgIHN0ciA9IFwiXCIgKyBzdHI7XG5cbiAgICAgIHJldHVybiBzdHJcbiAgICAgICAgLy8gU3BsaXRzIGtleXMgc2VwYXJhdGVkIGJ5IHBlcmlvZHNcbiAgICAgICAgLnJlcGxhY2UoLyhbXlxcc10pXFwuKFteXFxzXSkvZywgJyQxICQyJylcbiAgICAgICAgLy8gUmVtb3ZlcyBiYWNrc2xhc2hlc1xuICAgICAgICAucmVwbGFjZSgvXFxcXCsvZywgJycpXG4gICAgICAgIC8vIFJlcGxhY2VzIC0gYW5kIC0gd2l0aCBzcGFjZVxuICAgICAgICAucmVwbGFjZSgvW18tXS9nLCAnICcpXG4gICAgICAgIC8vIFNwbGl0cyBjYW1lbCBjYXNlZCB3b3Jkc1xuICAgICAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgZnVuY3Rpb24obTAsIG0xLCBtMikge1xuICAgICAgICAgIHJldHVybiBcIlwiICsgbTEgKyBcIiBcIiArIG0yLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpO1xuICAgIH0sXG5cbiAgICBzdHJpbmdpZnlWYWx1ZTogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBwcmV0dGlmeSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5wcmV0dGlmeSB8fCB2LnByZXR0aWZ5O1xuICAgICAgcmV0dXJuIHByZXR0aWZ5KHZhbHVlKTtcbiAgICB9LFxuXG4gICAgaXNTdHJpbmc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbiAgICB9LFxuXG4gICAgaXNBcnJheTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB7fS50b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIGlmIHRoZSBvYmplY3QgaXMgYSBoYXNoLCB3aGljaCBpcyBlcXVpdmFsZW50IHRvIGFuIG9iamVjdCB0aGF0XG4gICAgLy8gaXMgbmVpdGhlciBhbiBhcnJheSBub3IgYSBmdW5jdGlvbi5cbiAgICBpc0hhc2g6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdi5pc09iamVjdCh2YWx1ZSkgJiYgIXYuaXNBcnJheSh2YWx1ZSkgJiYgIXYuaXNGdW5jdGlvbih2YWx1ZSk7XG4gICAgfSxcblxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihvYmosIHZhbHVlKSB7XG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKG9iaikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKHYuaXNBcnJheShvYmopKSB7XG4gICAgICAgIHJldHVybiBvYmouaW5kZXhPZih2YWx1ZSkgIT09IC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZhbHVlIGluIG9iajtcbiAgICB9LFxuXG4gICAgdW5pcXVlOiBmdW5jdGlvbihhcnJheSkge1xuICAgICAgaWYgKCF2LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcnJheS5maWx0ZXIoZnVuY3Rpb24oZWwsIGluZGV4LCBhcnJheSkge1xuICAgICAgICByZXR1cm4gYXJyYXkuaW5kZXhPZihlbCkgPT0gaW5kZXg7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgZm9yRWFjaEtleUluS2V5cGF0aDogZnVuY3Rpb24ob2JqZWN0LCBrZXlwYXRoLCBjYWxsYmFjaykge1xuICAgICAgaWYgKCF2LmlzU3RyaW5nKGtleXBhdGgpKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBrZXkgPSBcIlwiXG4gICAgICAgICwgaVxuICAgICAgICAsIGVzY2FwZSA9IGZhbHNlO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwga2V5cGF0aC5sZW5ndGg7ICsraSkge1xuICAgICAgICBzd2l0Y2ggKGtleXBhdGhbaV0pIHtcbiAgICAgICAgICBjYXNlICcuJzpcbiAgICAgICAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgICAgICAgZXNjYXBlID0gZmFsc2U7XG4gICAgICAgICAgICAgIGtleSArPSAnLic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBvYmplY3QgPSBjYWxsYmFjayhvYmplY3QsIGtleSwgZmFsc2UpO1xuICAgICAgICAgICAgICBrZXkgPSBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICdcXFxcJzpcbiAgICAgICAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgICAgICAgZXNjYXBlID0gZmFsc2U7XG4gICAgICAgICAgICAgIGtleSArPSAnXFxcXCc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlc2NhcGUgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgZXNjYXBlID0gZmFsc2U7XG4gICAgICAgICAgICBrZXkgKz0ga2V5cGF0aFtpXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYWxsYmFjayhvYmplY3QsIGtleSwgdHJ1ZSk7XG4gICAgfSxcblxuICAgIGdldERlZXBPYmplY3RWYWx1ZTogZnVuY3Rpb24ob2JqLCBrZXlwYXRoKSB7XG4gICAgICBpZiAoIXYuaXNPYmplY3Qob2JqKSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdi5mb3JFYWNoS2V5SW5LZXlwYXRoKG9iaiwga2V5cGF0aCwgZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICAgICAgaWYgKHYuaXNPYmplY3Qob2JqKSkge1xuICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIFRoaXMgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHZhbHVlcyBvZiB0aGUgZm9ybS5cbiAgICAvLyBJdCB1c2VzIHRoZSBpbnB1dCBuYW1lIGFzIGtleSBhbmQgdGhlIHZhbHVlIGFzIHZhbHVlXG4gICAgLy8gU28gZm9yIGV4YW1wbGUgdGhpczpcbiAgICAvLyA8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwiZW1haWxcIiB2YWx1ZT1cImZvb0BiYXIuY29tXCIgLz5cbiAgICAvLyB3b3VsZCByZXR1cm46XG4gICAgLy8ge2VtYWlsOiBcImZvb0BiYXIuY29tXCJ9XG4gICAgY29sbGVjdEZvcm1WYWx1ZXM6IGZ1bmN0aW9uKGZvcm0sIG9wdGlvbnMpIHtcbiAgICAgIHZhciB2YWx1ZXMgPSB7fVxuICAgICAgICAsIGlcbiAgICAgICAgLCBqXG4gICAgICAgICwgaW5wdXRcbiAgICAgICAgLCBpbnB1dHNcbiAgICAgICAgLCBvcHRpb25cbiAgICAgICAgLCB2YWx1ZTtcblxuICAgICAgaWYgKHYuaXNKcXVlcnlFbGVtZW50KGZvcm0pKSB7XG4gICAgICAgIGZvcm0gPSBmb3JtWzBdO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWZvcm0pIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgIGlucHV0cyA9IGZvcm0ucXVlcnlTZWxlY3RvckFsbChcImlucHV0W25hbWVdLCB0ZXh0YXJlYVtuYW1lXVwiKTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaW5wdXQgPSBpbnB1dHMuaXRlbShpKTtcblxuICAgICAgICBpZiAodi5pc0RlZmluZWQoaW5wdXQuZ2V0QXR0cmlidXRlKFwiZGF0YS1pZ25vcmVkXCIpKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5hbWUgPSBpbnB1dC5uYW1lLnJlcGxhY2UoL1xcLi9nLCBcIlxcXFxcXFxcLlwiKTtcbiAgICAgICAgdmFsdWUgPSB2LnNhbml0aXplRm9ybVZhbHVlKGlucHV0LnZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlID8gK3ZhbHVlIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC50eXBlID09PSBcImNoZWNrYm94XCIpIHtcbiAgICAgICAgICBpZiAoaW5wdXQuYXR0cmlidXRlcy52YWx1ZSkge1xuICAgICAgICAgICAgaWYgKCFpbnB1dC5jaGVja2VkKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gdmFsdWVzW25hbWVdIHx8IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gaW5wdXQuY2hlY2tlZDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXQudHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgICAgICAgaWYgKCFpbnB1dC5jaGVja2VkKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlc1tuYW1lXSB8fCBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgaW5wdXRzID0gZm9ybS5xdWVyeVNlbGVjdG9yQWxsKFwic2VsZWN0W25hbWVdXCIpO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpbnB1dCA9IGlucHV0cy5pdGVtKGkpO1xuICAgICAgICBpZiAodi5pc0RlZmluZWQoaW5wdXQuZ2V0QXR0cmlidXRlKFwiZGF0YS1pZ25vcmVkXCIpKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlucHV0Lm11bHRpcGxlKSB7XG4gICAgICAgICAgdmFsdWUgPSBbXTtcbiAgICAgICAgICBmb3IgKGogaW4gaW5wdXQub3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9uID0gaW5wdXQub3B0aW9uc1tqXTtcbiAgICAgICAgICAgICBpZiAob3B0aW9uICYmIG9wdGlvbi5zZWxlY3RlZCkge1xuICAgICAgICAgICAgICB2YWx1ZS5wdXNoKHYuc2FuaXRpemVGb3JtVmFsdWUob3B0aW9uLnZhbHVlLCBvcHRpb25zKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBfdmFsID0gdHlwZW9mIGlucHV0Lm9wdGlvbnNbaW5wdXQuc2VsZWN0ZWRJbmRleF0gIT09ICd1bmRlZmluZWQnID8gaW5wdXQub3B0aW9uc1tpbnB1dC5zZWxlY3RlZEluZGV4XS52YWx1ZSA6IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovICcnO1xuICAgICAgICAgIHZhbHVlID0gdi5zYW5pdGl6ZUZvcm1WYWx1ZShfdmFsLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZXNbaW5wdXQubmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9LFxuXG4gICAgc2FuaXRpemVGb3JtVmFsdWU6IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucy50cmltICYmIHYuaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUudHJpbSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5udWxsaWZ5ICE9PSBmYWxzZSAmJiB2YWx1ZSA9PT0gXCJcIikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuXG4gICAgY2FwaXRhbGl6ZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICBpZiAoIXYuaXNTdHJpbmcoc3RyKSkge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN0clswXS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgYWxsIGVycm9ycyB3aG8ncyBlcnJvciBhdHRyaWJ1dGUgaXMgZW1wdHkgKG51bGwgb3IgdW5kZWZpbmVkKVxuICAgIHBydW5lRW1wdHlFcnJvcnM6IGZ1bmN0aW9uKGVycm9ycykge1xuICAgICAgcmV0dXJuIGVycm9ycy5maWx0ZXIoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuICF2LmlzRW1wdHkoZXJyb3IuZXJyb3IpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIEluXG4gICAgLy8gW3tlcnJvcjogW1wiZXJyMVwiLCBcImVycjJcIl0sIC4uLn1dXG4gICAgLy8gT3V0XG4gICAgLy8gW3tlcnJvcjogXCJlcnIxXCIsIC4uLn0sIHtlcnJvcjogXCJlcnIyXCIsIC4uLn1dXG4gICAgLy9cbiAgICAvLyBBbGwgYXR0cmlidXRlcyBpbiBhbiBlcnJvciB3aXRoIG11bHRpcGxlIG1lc3NhZ2VzIGFyZSBkdXBsaWNhdGVkXG4gICAgLy8gd2hlbiBleHBhbmRpbmcgdGhlIGVycm9ycy5cbiAgICBleHBhbmRNdWx0aXBsZUVycm9yczogZnVuY3Rpb24oZXJyb3JzKSB7XG4gICAgICB2YXIgcmV0ID0gW107XG4gICAgICBlcnJvcnMuZm9yRWFjaChmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAvLyBSZW1vdmVzIGVycm9ycyB3aXRob3V0IGEgbWVzc2FnZVxuICAgICAgICBpZiAodi5pc0FycmF5KGVycm9yLmVycm9yKSkge1xuICAgICAgICAgIGVycm9yLmVycm9yLmZvckVhY2goZnVuY3Rpb24obXNnKSB7XG4gICAgICAgICAgICByZXQucHVzaCh2LmV4dGVuZCh7fSwgZXJyb3IsIHtlcnJvcjogbXNnfSkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldC5wdXNoKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG5cbiAgICAvLyBDb252ZXJ0cyB0aGUgZXJyb3IgbWVzYWdlcyBieSBwcmVwZW5kaW5nIHRoZSBhdHRyaWJ1dGUgbmFtZSB1bmxlc3MgdGhlXG4gICAgLy8gbWVzc2FnZSBpcyBwcmVmaXhlZCBieSBeXG4gICAgY29udmVydEVycm9yTWVzc2FnZXM6IGZ1bmN0aW9uKGVycm9ycywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgIHZhciByZXQgPSBbXVxuICAgICAgICAsIHByZXR0aWZ5ID0gb3B0aW9ucy5wcmV0dGlmeSB8fCB2LnByZXR0aWZ5O1xuICAgICAgZXJyb3JzLmZvckVhY2goZnVuY3Rpb24oZXJyb3JJbmZvKSB7XG4gICAgICAgIHZhciBlcnJvciA9IHYucmVzdWx0KGVycm9ySW5mby5lcnJvcixcbiAgICAgICAgICAgIGVycm9ySW5mby52YWx1ZSxcbiAgICAgICAgICAgIGVycm9ySW5mby5hdHRyaWJ1dGUsXG4gICAgICAgICAgICBlcnJvckluZm8ub3B0aW9ucyxcbiAgICAgICAgICAgIGVycm9ySW5mby5hdHRyaWJ1dGVzLFxuICAgICAgICAgICAgZXJyb3JJbmZvLmdsb2JhbE9wdGlvbnMpO1xuXG4gICAgICAgIGlmICghdi5pc1N0cmluZyhlcnJvcikpIHtcbiAgICAgICAgICByZXQucHVzaChlcnJvckluZm8pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvclswXSA9PT0gJ14nKSB7XG4gICAgICAgICAgZXJyb3IgPSBlcnJvci5zbGljZSgxKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmZ1bGxNZXNzYWdlcyAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBlcnJvciA9IHYuY2FwaXRhbGl6ZShwcmV0dGlmeShlcnJvckluZm8uYXR0cmlidXRlKSkgKyBcIiBcIiArIGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yID0gZXJyb3IucmVwbGFjZSgvXFxcXFxcXi9nLCBcIl5cIik7XG4gICAgICAgIGVycm9yID0gdi5mb3JtYXQoZXJyb3IsIHtcbiAgICAgICAgICB2YWx1ZTogdi5zdHJpbmdpZnlWYWx1ZShlcnJvckluZm8udmFsdWUsIG9wdGlvbnMpXG4gICAgICAgIH0pO1xuICAgICAgICByZXQucHVzaCh2LmV4dGVuZCh7fSwgZXJyb3JJbmZvLCB7ZXJyb3I6IGVycm9yfSkpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH0sXG5cbiAgICAvLyBJbjpcbiAgICAvLyBbe2F0dHJpYnV0ZTogXCI8YXR0cmlidXRlTmFtZT5cIiwgLi4ufV1cbiAgICAvLyBPdXQ6XG4gICAgLy8ge1wiPGF0dHJpYnV0ZU5hbWU+XCI6IFt7YXR0cmlidXRlOiBcIjxhdHRyaWJ1dGVOYW1lPlwiLCAuLi59XX1cbiAgICBncm91cEVycm9yc0J5QXR0cmlidXRlOiBmdW5jdGlvbihlcnJvcnMpIHtcbiAgICAgIHZhciByZXQgPSB7fTtcbiAgICAgIGVycm9ycy5mb3JFYWNoKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIHZhciBsaXN0ID0gcmV0W2Vycm9yLmF0dHJpYnV0ZV07XG4gICAgICAgIGlmIChsaXN0KSB7XG4gICAgICAgICAgbGlzdC5wdXNoKGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXRbZXJyb3IuYXR0cmlidXRlXSA9IFtlcnJvcl07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuXG4gICAgLy8gSW46XG4gICAgLy8gW3tlcnJvcjogXCI8bWVzc2FnZSAxPlwiLCAuLi59LCB7ZXJyb3I6IFwiPG1lc3NhZ2UgMj5cIiwgLi4ufV1cbiAgICAvLyBPdXQ6XG4gICAgLy8gW1wiPG1lc3NhZ2UgMT5cIiwgXCI8bWVzc2FnZSAyPlwiXVxuICAgIGZsYXR0ZW5FcnJvcnNUb0FycmF5OiBmdW5jdGlvbihlcnJvcnMpIHtcbiAgICAgIHJldHVybiBlcnJvcnNcbiAgICAgICAgLm1hcChmdW5jdGlvbihlcnJvcikgeyByZXR1cm4gZXJyb3IuZXJyb3I7IH0pXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24odmFsdWUsIGluZGV4LCBzZWxmKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4O1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2xlYW5BdHRyaWJ1dGVzOiBmdW5jdGlvbihhdHRyaWJ1dGVzLCB3aGl0ZWxpc3QpIHtcbiAgICAgIGZ1bmN0aW9uIHdoaXRlbGlzdENyZWF0b3Iob2JqLCBrZXksIGxhc3QpIHtcbiAgICAgICAgaWYgKHYuaXNPYmplY3Qob2JqW2tleV0pKSB7XG4gICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAob2JqW2tleV0gPSBsYXN0ID8gdHJ1ZSA6IHt9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYnVpbGRPYmplY3RXaGl0ZWxpc3Qod2hpdGVsaXN0KSB7XG4gICAgICAgIHZhciBvdyA9IHt9XG4gICAgICAgICAgLCBsYXN0T2JqZWN0XG4gICAgICAgICAgLCBhdHRyO1xuICAgICAgICBmb3IgKGF0dHIgaW4gd2hpdGVsaXN0KSB7XG4gICAgICAgICAgaWYgKCF3aGl0ZWxpc3RbYXR0cl0pIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2LmZvckVhY2hLZXlJbktleXBhdGgob3csIGF0dHIsIHdoaXRlbGlzdENyZWF0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdztcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2xlYW5SZWN1cnNpdmUoYXR0cmlidXRlcywgd2hpdGVsaXN0KSB7XG4gICAgICAgIGlmICghdi5pc09iamVjdChhdHRyaWJ1dGVzKSkge1xuICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJldCA9IHYuZXh0ZW5kKHt9LCBhdHRyaWJ1dGVzKVxuICAgICAgICAgICwgd1xuICAgICAgICAgICwgYXR0cmlidXRlO1xuXG4gICAgICAgIGZvciAoYXR0cmlidXRlIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICB3ID0gd2hpdGVsaXN0W2F0dHJpYnV0ZV07XG5cbiAgICAgICAgICBpZiAodi5pc09iamVjdCh3KSkge1xuICAgICAgICAgICAgcmV0W2F0dHJpYnV0ZV0gPSBjbGVhblJlY3Vyc2l2ZShyZXRbYXR0cmlidXRlXSwgdyk7XG4gICAgICAgICAgfSBlbHNlIGlmICghdykge1xuICAgICAgICAgICAgZGVsZXRlIHJldFthdHRyaWJ1dGVdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfVxuXG4gICAgICBpZiAoIXYuaXNPYmplY3Qod2hpdGVsaXN0KSB8fCAhdi5pc09iamVjdChhdHRyaWJ1dGVzKSkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG5cbiAgICAgIHdoaXRlbGlzdCA9IGJ1aWxkT2JqZWN0V2hpdGVsaXN0KHdoaXRlbGlzdCk7XG4gICAgICByZXR1cm4gY2xlYW5SZWN1cnNpdmUoYXR0cmlidXRlcywgd2hpdGVsaXN0KTtcbiAgICB9LFxuXG4gICAgZXhwb3NlTW9kdWxlOiBmdW5jdGlvbih2YWxpZGF0ZSwgcm9vdCwgZXhwb3J0cywgbW9kdWxlLCBkZWZpbmUpIHtcbiAgICAgIGlmIChleHBvcnRzKSB7XG4gICAgICAgIGlmIChtb2R1bGUgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSB2YWxpZGF0ZTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRzLnZhbGlkYXRlID0gdmFsaWRhdGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByb290LnZhbGlkYXRlID0gdmFsaWRhdGU7XG4gICAgICAgIGlmICh2YWxpZGF0ZS5pc0Z1bmN0aW9uKGRlZmluZSkgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsaWRhdGU7IH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIHdhcm46IGZ1bmN0aW9uKG1zZykge1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbdmFsaWRhdGUuanNdIFwiICsgbXNnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZXJyb3I6IGZ1bmN0aW9uKG1zZykge1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlt2YWxpZGF0ZS5qc10gXCIgKyBtc2cpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgdmFsaWRhdGUudmFsaWRhdG9ycyA9IHtcbiAgICAvLyBQcmVzZW5jZSB2YWxpZGF0ZXMgdGhhdCB0aGUgdmFsdWUgaXNuJ3QgZW1wdHlcbiAgICBwcmVzZW5jZTogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB2LmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgIGlmIChvcHRpb25zLmFsbG93RW1wdHkgIT09IGZhbHNlID8gIXYuaXNEZWZpbmVkKHZhbHVlKSA6IHYuaXNFbXB0eSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubWVzc2FnZSB8fCB0aGlzLm1lc3NhZ2UgfHwgXCJjYW4ndCBiZSBibGFua1wiO1xuICAgICAgfVxuICAgIH0sXG4gICAgbGVuZ3RoOiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucywgYXR0cmlidXRlKSB7XG4gICAgICAvLyBFbXB0eSB2YWx1ZXMgYXJlIGFsbG93ZWRcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgaXMgPSBvcHRpb25zLmlzXG4gICAgICAgICwgbWF4aW11bSA9IG9wdGlvbnMubWF4aW11bVxuICAgICAgICAsIG1pbmltdW0gPSBvcHRpb25zLm1pbmltdW1cbiAgICAgICAgLCB0b2tlbml6ZXIgPSBvcHRpb25zLnRva2VuaXplciB8fCBmdW5jdGlvbih2YWwpIHsgcmV0dXJuIHZhbDsgfVxuICAgICAgICAsIGVyclxuICAgICAgICAsIGVycm9ycyA9IFtdO1xuXG4gICAgICB2YWx1ZSA9IHRva2VuaXplcih2YWx1ZSk7XG4gICAgICB2YXIgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgICAgaWYoIXYuaXNOdW1iZXIobGVuZ3RoKSkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5tZXNzYWdlIHx8IHRoaXMubm90VmFsaWQgfHwgXCJoYXMgYW4gaW5jb3JyZWN0IGxlbmd0aFwiO1xuICAgICAgfVxuXG4gICAgICAvLyBJcyBjaGVja3NcbiAgICAgIGlmICh2LmlzTnVtYmVyKGlzKSAmJiBsZW5ndGggIT09IGlzKSB7XG4gICAgICAgIGVyciA9IG9wdGlvbnMud3JvbmdMZW5ndGggfHxcbiAgICAgICAgICB0aGlzLndyb25nTGVuZ3RoIHx8XG4gICAgICAgICAgXCJpcyB0aGUgd3JvbmcgbGVuZ3RoIChzaG91bGQgYmUgJXtjb3VudH0gY2hhcmFjdGVycylcIjtcbiAgICAgICAgZXJyb3JzLnB1c2godi5mb3JtYXQoZXJyLCB7Y291bnQ6IGlzfSkpO1xuICAgICAgfVxuXG4gICAgICBpZiAodi5pc051bWJlcihtaW5pbXVtKSAmJiBsZW5ndGggPCBtaW5pbXVtKSB7XG4gICAgICAgIGVyciA9IG9wdGlvbnMudG9vU2hvcnQgfHxcbiAgICAgICAgICB0aGlzLnRvb1Nob3J0IHx8XG4gICAgICAgICAgXCJpcyB0b28gc2hvcnQgKG1pbmltdW0gaXMgJXtjb3VudH0gY2hhcmFjdGVycylcIjtcbiAgICAgICAgZXJyb3JzLnB1c2godi5mb3JtYXQoZXJyLCB7Y291bnQ6IG1pbmltdW19KSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh2LmlzTnVtYmVyKG1heGltdW0pICYmIGxlbmd0aCA+IG1heGltdW0pIHtcbiAgICAgICAgZXJyID0gb3B0aW9ucy50b29Mb25nIHx8XG4gICAgICAgICAgdGhpcy50b29Mb25nIHx8XG4gICAgICAgICAgXCJpcyB0b28gbG9uZyAobWF4aW11bSBpcyAle2NvdW50fSBjaGFyYWN0ZXJzKVwiO1xuICAgICAgICBlcnJvcnMucHVzaCh2LmZvcm1hdChlcnIsIHtjb3VudDogbWF4aW11bX0pKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLm1lc3NhZ2UgfHwgZXJyb3JzO1xuICAgICAgfVxuICAgIH0sXG4gICAgbnVtZXJpY2FsaXR5OiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucywgYXR0cmlidXRlLCBhdHRyaWJ1dGVzLCBnbG9iYWxPcHRpb25zKSB7XG4gICAgICAvLyBFbXB0eSB2YWx1ZXMgYXJlIGZpbmVcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgZXJyb3JzID0gW11cbiAgICAgICAgLCBuYW1lXG4gICAgICAgICwgY291bnRcbiAgICAgICAgLCBjaGVja3MgPSB7XG4gICAgICAgICAgICBncmVhdGVyVGhhbjogICAgICAgICAgZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA+IGM7IH0sXG4gICAgICAgICAgICBncmVhdGVyVGhhbk9yRXF1YWxUbzogZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA+PSBjOyB9LFxuICAgICAgICAgICAgZXF1YWxUbzogICAgICAgICAgICAgIGZ1bmN0aW9uKHYsIGMpIHsgcmV0dXJuIHYgPT09IGM7IH0sXG4gICAgICAgICAgICBsZXNzVGhhbjogICAgICAgICAgICAgZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA8IGM7IH0sXG4gICAgICAgICAgICBsZXNzVGhhbk9yRXF1YWxUbzogICAgZnVuY3Rpb24odiwgYykgeyByZXR1cm4gdiA8PSBjOyB9LFxuICAgICAgICAgICAgZGl2aXNpYmxlQnk6ICAgICAgICAgIGZ1bmN0aW9uKHYsIGMpIHsgcmV0dXJuIHYgJSBjID09PSAwOyB9XG4gICAgICAgICAgfVxuICAgICAgICAsIHByZXR0aWZ5ID0gb3B0aW9ucy5wcmV0dGlmeSB8fFxuICAgICAgICAgIChnbG9iYWxPcHRpb25zICYmIGdsb2JhbE9wdGlvbnMucHJldHRpZnkpIHx8XG4gICAgICAgICAgdi5wcmV0dGlmeTtcblxuICAgICAgLy8gU3RyaWN0IHdpbGwgY2hlY2sgdGhhdCBpdCBpcyBhIHZhbGlkIGxvb2tpbmcgbnVtYmVyXG4gICAgICBpZiAodi5pc1N0cmluZyh2YWx1ZSkgJiYgb3B0aW9ucy5zdHJpY3QpIHtcbiAgICAgICAgdmFyIHBhdHRlcm4gPSBcIl4tPygwfFsxLTldXFxcXGQqKVwiO1xuICAgICAgICBpZiAoIW9wdGlvbnMub25seUludGVnZXIpIHtcbiAgICAgICAgICBwYXR0ZXJuICs9IFwiKFxcXFwuXFxcXGQrKT9cIjtcbiAgICAgICAgfVxuICAgICAgICBwYXR0ZXJuICs9IFwiJFwiO1xuXG4gICAgICAgIGlmICghKG5ldyBSZWdFeHAocGF0dGVybikudGVzdCh2YWx1ZSkpKSB7XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnMubWVzc2FnZSB8fFxuICAgICAgICAgICAgb3B0aW9ucy5ub3RWYWxpZCB8fFxuICAgICAgICAgICAgdGhpcy5ub3RWYWxpZCB8fFxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlIHx8XG4gICAgICAgICAgICBcIm11c3QgYmUgYSB2YWxpZCBudW1iZXJcIjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBDb2VyY2UgdGhlIHZhbHVlIHRvIGEgbnVtYmVyIHVubGVzcyB3ZSdyZSBiZWluZyBzdHJpY3QuXG4gICAgICBpZiAob3B0aW9ucy5ub1N0cmluZ3MgIT09IHRydWUgJiYgdi5pc1N0cmluZyh2YWx1ZSkgJiYgIXYuaXNFbXB0eSh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSArdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0J3Mgbm90IGEgbnVtYmVyIHdlIHNob3VsZG4ndCBjb250aW51ZSBzaW5jZSBpdCB3aWxsIGNvbXBhcmUgaXQuXG4gICAgICBpZiAoIXYuaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLm1lc3NhZ2UgfHxcbiAgICAgICAgICBvcHRpb25zLm5vdFZhbGlkIHx8XG4gICAgICAgICAgdGhpcy5ub3RWYWxpZCB8fFxuICAgICAgICAgIHRoaXMubWVzc2FnZSB8fFxuICAgICAgICAgIFwiaXMgbm90IGEgbnVtYmVyXCI7XG4gICAgICB9XG5cbiAgICAgIC8vIFNhbWUgbG9naWMgYXMgYWJvdmUsIHNvcnQgb2YuIERvbid0IGJvdGhlciB3aXRoIGNvbXBhcmlzb25zIGlmIHRoaXNcbiAgICAgIC8vIGRvZXNuJ3QgcGFzcy5cbiAgICAgIGlmIChvcHRpb25zLm9ubHlJbnRlZ2VyICYmICF2LmlzSW50ZWdlcih2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMubWVzc2FnZSB8fFxuICAgICAgICAgIG9wdGlvbnMubm90SW50ZWdlciB8fFxuICAgICAgICAgIHRoaXMubm90SW50ZWdlciB8fFxuICAgICAgICAgIHRoaXMubWVzc2FnZSB8fFxuICAgICAgICAgIFwibXVzdCBiZSBhbiBpbnRlZ2VyXCI7XG4gICAgICB9XG5cbiAgICAgIGZvciAobmFtZSBpbiBjaGVja3MpIHtcbiAgICAgICAgY291bnQgPSBvcHRpb25zW25hbWVdO1xuICAgICAgICBpZiAodi5pc051bWJlcihjb3VudCkgJiYgIWNoZWNrc1tuYW1lXSh2YWx1ZSwgY291bnQpKSB7XG4gICAgICAgICAgLy8gVGhpcyBwaWNrcyB0aGUgZGVmYXVsdCBtZXNzYWdlIGlmIHNwZWNpZmllZFxuICAgICAgICAgIC8vIEZvciBleGFtcGxlIHRoZSBncmVhdGVyVGhhbiBjaGVjayB1c2VzIHRoZSBtZXNzYWdlIGZyb21cbiAgICAgICAgICAvLyB0aGlzLm5vdEdyZWF0ZXJUaGFuIHNvIHdlIGNhcGl0YWxpemUgdGhlIG5hbWUgYW5kIHByZXBlbmQgXCJub3RcIlxuICAgICAgICAgIHZhciBrZXkgPSBcIm5vdFwiICsgdi5jYXBpdGFsaXplKG5hbWUpO1xuICAgICAgICAgIHZhciBtc2cgPSBvcHRpb25zW2tleV0gfHxcbiAgICAgICAgICAgIHRoaXNba2V5XSB8fFxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlIHx8XG4gICAgICAgICAgICBcIm11c3QgYmUgJXt0eXBlfSAle2NvdW50fVwiO1xuXG4gICAgICAgICAgZXJyb3JzLnB1c2godi5mb3JtYXQobXNnLCB7XG4gICAgICAgICAgICBjb3VudDogY291bnQsXG4gICAgICAgICAgICB0eXBlOiBwcmV0dGlmeShuYW1lKVxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5vZGQgJiYgdmFsdWUgJSAyICE9PSAxKSB7XG4gICAgICAgIGVycm9ycy5wdXNoKG9wdGlvbnMubm90T2RkIHx8XG4gICAgICAgICAgICB0aGlzLm5vdE9kZCB8fFxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlIHx8XG4gICAgICAgICAgICBcIm11c3QgYmUgb2RkXCIpO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuZXZlbiAmJiB2YWx1ZSAlIDIgIT09IDApIHtcbiAgICAgICAgZXJyb3JzLnB1c2gob3B0aW9ucy5ub3RFdmVuIHx8XG4gICAgICAgICAgICB0aGlzLm5vdEV2ZW4gfHxcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSB8fFxuICAgICAgICAgICAgXCJtdXN0IGJlIGV2ZW5cIik7XG4gICAgICB9XG5cbiAgICAgIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLm1lc3NhZ2UgfHwgZXJyb3JzO1xuICAgICAgfVxuICAgIH0sXG4gICAgZGF0ZXRpbWU6IHYuZXh0ZW5kKGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICBpZiAoIXYuaXNGdW5jdGlvbih0aGlzLnBhcnNlKSB8fCAhdi5pc0Z1bmN0aW9uKHRoaXMuZm9ybWF0KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCb3RoIHRoZSBwYXJzZSBhbmQgZm9ybWF0IGZ1bmN0aW9ucyBuZWVkcyB0byBiZSBzZXQgdG8gdXNlIHRoZSBkYXRldGltZS9kYXRlIHZhbGlkYXRvclwiKTtcbiAgICAgIH1cblxuICAgICAgLy8gRW1wdHkgdmFsdWVzIGFyZSBmaW5lXG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMgPSB2LmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgdmFyIGVyclxuICAgICAgICAsIGVycm9ycyA9IFtdXG4gICAgICAgICwgZWFybGllc3QgPSBvcHRpb25zLmVhcmxpZXN0ID8gdGhpcy5wYXJzZShvcHRpb25zLmVhcmxpZXN0LCBvcHRpb25zKSA6IE5hTlxuICAgICAgICAsIGxhdGVzdCA9IG9wdGlvbnMubGF0ZXN0ID8gdGhpcy5wYXJzZShvcHRpb25zLmxhdGVzdCwgb3B0aW9ucykgOiBOYU47XG5cbiAgICAgIHZhbHVlID0gdGhpcy5wYXJzZSh2YWx1ZSwgb3B0aW9ucyk7XG5cbiAgICAgIC8vIDg2NDAwMDAwIGlzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGluIGEgZGF5LCB0aGlzIGlzIHVzZWQgdG8gcmVtb3ZlXG4gICAgICAvLyB0aGUgdGltZSBmcm9tIHRoZSBkYXRlXG4gICAgICBpZiAoaXNOYU4odmFsdWUpIHx8IG9wdGlvbnMuZGF0ZU9ubHkgJiYgdmFsdWUgJSA4NjQwMDAwMCAhPT0gMCkge1xuICAgICAgICBlcnIgPSBvcHRpb25zLm5vdFZhbGlkIHx8XG4gICAgICAgICAgb3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgICAgdGhpcy5ub3RWYWxpZCB8fFxuICAgICAgICAgIFwibXVzdCBiZSBhIHZhbGlkIGRhdGVcIjtcbiAgICAgICAgcmV0dXJuIHYuZm9ybWF0KGVyciwge3ZhbHVlOiBhcmd1bWVudHNbMF19KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc05hTihlYXJsaWVzdCkgJiYgdmFsdWUgPCBlYXJsaWVzdCkge1xuICAgICAgICBlcnIgPSBvcHRpb25zLnRvb0Vhcmx5IHx8XG4gICAgICAgICAgb3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgICAgdGhpcy50b29FYXJseSB8fFxuICAgICAgICAgIFwibXVzdCBiZSBubyBlYXJsaWVyIHRoYW4gJXtkYXRlfVwiO1xuICAgICAgICBlcnIgPSB2LmZvcm1hdChlcnIsIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5mb3JtYXQodmFsdWUsIG9wdGlvbnMpLFxuICAgICAgICAgIGRhdGU6IHRoaXMuZm9ybWF0KGVhcmxpZXN0LCBvcHRpb25zKVxuICAgICAgICB9KTtcbiAgICAgICAgZXJyb3JzLnB1c2goZXJyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc05hTihsYXRlc3QpICYmIHZhbHVlID4gbGF0ZXN0KSB7XG4gICAgICAgIGVyciA9IG9wdGlvbnMudG9vTGF0ZSB8fFxuICAgICAgICAgIG9wdGlvbnMubWVzc2FnZSB8fFxuICAgICAgICAgIHRoaXMudG9vTGF0ZSB8fFxuICAgICAgICAgIFwibXVzdCBiZSBubyBsYXRlciB0aGFuICV7ZGF0ZX1cIjtcbiAgICAgICAgZXJyID0gdi5mb3JtYXQoZXJyLCB7XG4gICAgICAgICAgZGF0ZTogdGhpcy5mb3JtYXQobGF0ZXN0LCBvcHRpb25zKSxcbiAgICAgICAgICB2YWx1ZTogdGhpcy5mb3JtYXQodmFsdWUsIG9wdGlvbnMpXG4gICAgICAgIH0pO1xuICAgICAgICBlcnJvcnMucHVzaChlcnIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdi51bmlxdWUoZXJyb3JzKTtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICBwYXJzZTogbnVsbCxcbiAgICAgIGZvcm1hdDogbnVsbFxuICAgIH0pLFxuICAgIGRhdGU6IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIG9wdGlvbnMsIHtkYXRlT25seTogdHJ1ZX0pO1xuICAgICAgcmV0dXJuIHYudmFsaWRhdG9ycy5kYXRldGltZS5jYWxsKHYudmFsaWRhdG9ycy5kYXRldGltZSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgIH0sXG4gICAgZm9ybWF0OiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgaWYgKHYuaXNTdHJpbmcob3B0aW9ucykgfHwgKG9wdGlvbnMgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7cGF0dGVybjogb3B0aW9uc307XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMgPSB2LmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgdmFyIG1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgdGhpcy5tZXNzYWdlIHx8IFwiaXMgaW52YWxpZFwiXG4gICAgICAgICwgcGF0dGVybiA9IG9wdGlvbnMucGF0dGVyblxuICAgICAgICAsIG1hdGNoO1xuXG4gICAgICAvLyBFbXB0eSB2YWx1ZXMgYXJlIGFsbG93ZWRcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghdi5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh2LmlzU3RyaW5nKHBhdHRlcm4pKSB7XG4gICAgICAgIHBhdHRlcm4gPSBuZXcgUmVnRXhwKG9wdGlvbnMucGF0dGVybiwgb3B0aW9ucy5mbGFncyk7XG4gICAgICB9XG4gICAgICBtYXRjaCA9IHBhdHRlcm4uZXhlYyh2YWx1ZSk7XG4gICAgICBpZiAoIW1hdGNoIHx8IG1hdGNoWzBdLmxlbmd0aCAhPSB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICB9XG4gICAgfSxcbiAgICBpbmNsdXNpb246IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAvLyBFbXB0eSB2YWx1ZXMgYXJlIGZpbmVcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh2LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt3aXRoaW46IG9wdGlvbnN9O1xuICAgICAgfVxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgaWYgKHYuY29udGFpbnMob3B0aW9ucy53aXRoaW4sIHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fFxuICAgICAgICB0aGlzLm1lc3NhZ2UgfHxcbiAgICAgICAgXCJeJXt2YWx1ZX0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBsaXN0XCI7XG4gICAgICByZXR1cm4gdi5mb3JtYXQobWVzc2FnZSwge3ZhbHVlOiB2YWx1ZX0pO1xuICAgIH0sXG4gICAgZXhjbHVzaW9uOiBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgLy8gRW1wdHkgdmFsdWVzIGFyZSBmaW5lXG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAodi5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7d2l0aGluOiBvcHRpb25zfTtcbiAgICAgIH1cbiAgICAgIG9wdGlvbnMgPSB2LmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgIGlmICghdi5jb250YWlucyhvcHRpb25zLndpdGhpbiwgdmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBtZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlIHx8IHRoaXMubWVzc2FnZSB8fCBcIl4le3ZhbHVlfSBpcyByZXN0cmljdGVkXCI7XG4gICAgICBpZiAodi5pc1N0cmluZyhvcHRpb25zLndpdGhpblt2YWx1ZV0pKSB7XG4gICAgICAgIHZhbHVlID0gb3B0aW9ucy53aXRoaW5bdmFsdWVdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHYuZm9ybWF0KG1lc3NhZ2UsIHt2YWx1ZTogdmFsdWV9KTtcbiAgICB9LFxuICAgIGVtYWlsOiB2LmV4dGVuZChmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgdmFyIG1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2UgfHwgdGhpcy5tZXNzYWdlIHx8IFwiaXMgbm90IGEgdmFsaWQgZW1haWxcIjtcbiAgICAgIC8vIEVtcHR5IHZhbHVlcyBhcmUgZmluZVxuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCF2LmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5QQVRURVJOLmV4ZWModmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIFBBVFRFUk46IC9eKD86W2EtejAtOSEjJCUmJyorLz0/Xl9ge3x9fi1dKyg/OlxcLlthLXowLTkhIyQlJicqKy89P15fYHt8fX4tXSspKnxcIig/OltcXHgwMS1cXHgwOFxceDBiXFx4MGNcXHgwZS1cXHgxZlxceDIxXFx4MjMtXFx4NWJcXHg1ZC1cXHg3Zl18XFxcXFtcXHgwMS1cXHgwOVxceDBiXFx4MGNcXHgwZS1cXHg3Zl0pKlwiKUAoPzooPzpbYS16MC05XSg/OlthLXowLTktXSpbYS16MC05XSk/XFwuKStbYS16MC05XSg/OlthLXowLTktXSpbYS16MC05XSk/fFxcWyg/Oig/OjI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPylcXC4pezN9KD86MjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/fFthLXowLTktXSpbYS16MC05XTooPzpbXFx4MDEtXFx4MDhcXHgwYlxceDBjXFx4MGUtXFx4MWZcXHgyMS1cXHg1YVxceDUzLVxceDdmXXxcXFxcW1xceDAxLVxceDA5XFx4MGJcXHgwY1xceDBlLVxceDdmXSkrKVxcXSkkL2lcbiAgICB9KSxcbiAgICBlcXVhbGl0eTogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMsIGF0dHJpYnV0ZSwgYXR0cmlidXRlcywgZ2xvYmFsT3B0aW9ucykge1xuICAgICAgaWYgKCF2LmlzRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodi5pc1N0cmluZyhvcHRpb25zKSkge1xuICAgICAgICBvcHRpb25zID0ge2F0dHJpYnV0ZTogb3B0aW9uc307XG4gICAgICB9XG4gICAgICBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICB2YXIgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fFxuICAgICAgICB0aGlzLm1lc3NhZ2UgfHxcbiAgICAgICAgXCJpcyBub3QgZXF1YWwgdG8gJXthdHRyaWJ1dGV9XCI7XG5cbiAgICAgIGlmICh2LmlzRW1wdHkob3B0aW9ucy5hdHRyaWJ1dGUpIHx8ICF2LmlzU3RyaW5nKG9wdGlvbnMuYXR0cmlidXRlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgYXR0cmlidXRlIG11c3QgYmUgYSBub24gZW1wdHkgc3RyaW5nXCIpO1xuICAgICAgfVxuXG4gICAgICB2YXIgb3RoZXJWYWx1ZSA9IHYuZ2V0RGVlcE9iamVjdFZhbHVlKGF0dHJpYnV0ZXMsIG9wdGlvbnMuYXR0cmlidXRlKVxuICAgICAgICAsIGNvbXBhcmF0b3IgPSBvcHRpb25zLmNvbXBhcmF0b3IgfHwgZnVuY3Rpb24odjEsIHYyKSB7XG4gICAgICAgICAgcmV0dXJuIHYxID09PSB2MjtcbiAgICAgICAgfVxuICAgICAgICAsIHByZXR0aWZ5ID0gb3B0aW9ucy5wcmV0dGlmeSB8fFxuICAgICAgICAgIChnbG9iYWxPcHRpb25zICYmIGdsb2JhbE9wdGlvbnMucHJldHRpZnkpIHx8XG4gICAgICAgICAgdi5wcmV0dGlmeTtcblxuICAgICAgaWYgKCFjb21wYXJhdG9yKHZhbHVlLCBvdGhlclZhbHVlLCBvcHRpb25zLCBhdHRyaWJ1dGUsIGF0dHJpYnV0ZXMpKSB7XG4gICAgICAgIHJldHVybiB2LmZvcm1hdChtZXNzYWdlLCB7YXR0cmlidXRlOiBwcmV0dGlmeShvcHRpb25zLmF0dHJpYnV0ZSl9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIEEgVVJMIHZhbGlkYXRvciB0aGF0IGlzIHVzZWQgdG8gdmFsaWRhdGUgVVJMcyB3aXRoIHRoZSBhYmlsaXR5IHRvXG4gICAgLy8gcmVzdHJpY3Qgc2NoZW1lcyBhbmQgc29tZSBkb21haW5zLlxuICAgIHVybDogZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgIGlmICghdi5pc0RlZmluZWQodmFsdWUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IHYuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZSB8fCB0aGlzLm1lc3NhZ2UgfHwgXCJpcyBub3QgYSB2YWxpZCB1cmxcIlxuICAgICAgICAsIHNjaGVtZXMgPSBvcHRpb25zLnNjaGVtZXMgfHwgdGhpcy5zY2hlbWVzIHx8IFsnaHR0cCcsICdodHRwcyddXG4gICAgICAgICwgYWxsb3dMb2NhbCA9IG9wdGlvbnMuYWxsb3dMb2NhbCB8fCB0aGlzLmFsbG93TG9jYWwgfHwgZmFsc2VcbiAgICAgICAgLCBhbGxvd0RhdGFVcmwgPSBvcHRpb25zLmFsbG93RGF0YVVybCB8fCB0aGlzLmFsbG93RGF0YVVybCB8fCBmYWxzZTtcbiAgICAgIGlmICghdi5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIC8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2RwZXJpbmkvNzI5Mjk0XG4gICAgICB2YXIgcmVnZXggPVxuICAgICAgICBcIl5cIiArXG4gICAgICAgIC8vIHByb3RvY29sIGlkZW50aWZpZXJcbiAgICAgICAgXCIoPzooPzpcIiArIHNjaGVtZXMuam9pbihcInxcIikgKyBcIik6Ly8pXCIgK1xuICAgICAgICAvLyB1c2VyOnBhc3MgYXV0aGVudGljYXRpb25cbiAgICAgICAgXCIoPzpcXFxcUysoPzo6XFxcXFMqKT9AKT9cIiArXG4gICAgICAgIFwiKD86XCI7XG5cbiAgICAgIHZhciB0bGQgPSBcIig/OlxcXFwuKD86W2EtelxcXFx1MDBhMS1cXFxcdWZmZmZdezIsfSkpXCI7XG5cbiAgICAgIGlmIChhbGxvd0xvY2FsKSB7XG4gICAgICAgIHRsZCArPSBcIj9cIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZ2V4ICs9XG4gICAgICAgICAgLy8gSVAgYWRkcmVzcyBleGNsdXNpb25cbiAgICAgICAgICAvLyBwcml2YXRlICYgbG9jYWwgbmV0d29ya3NcbiAgICAgICAgICBcIig/ISg/OjEwfDEyNykoPzpcXFxcLlxcXFxkezEsM30pezN9KVwiICtcbiAgICAgICAgICBcIig/ISg/OjE2OVxcXFwuMjU0fDE5MlxcXFwuMTY4KSg/OlxcXFwuXFxcXGR7MSwzfSl7Mn0pXCIgK1xuICAgICAgICAgIFwiKD8hMTcyXFxcXC4oPzoxWzYtOV18MlxcXFxkfDNbMC0xXSkoPzpcXFxcLlxcXFxkezEsM30pezJ9KVwiO1xuICAgICAgfVxuXG4gICAgICByZWdleCArPVxuICAgICAgICAgIC8vIElQIGFkZHJlc3MgZG90dGVkIG5vdGF0aW9uIG9jdGV0c1xuICAgICAgICAgIC8vIGV4Y2x1ZGVzIGxvb3BiYWNrIG5ldHdvcmsgMC4wLjAuMFxuICAgICAgICAgIC8vIGV4Y2x1ZGVzIHJlc2VydmVkIHNwYWNlID49IDIyNC4wLjAuMFxuICAgICAgICAgIC8vIGV4Y2x1ZGVzIG5ldHdvcmsgJiBicm9hY2FzdCBhZGRyZXNzZXNcbiAgICAgICAgICAvLyAoZmlyc3QgJiBsYXN0IElQIGFkZHJlc3Mgb2YgZWFjaCBjbGFzcylcbiAgICAgICAgICBcIig/OlsxLTldXFxcXGQ/fDFcXFxcZFxcXFxkfDJbMDFdXFxcXGR8MjJbMC0zXSlcIiArXG4gICAgICAgICAgXCIoPzpcXFxcLig/OjE/XFxcXGR7MSwyfXwyWzAtNF1cXFxcZHwyNVswLTVdKSl7Mn1cIiArXG4gICAgICAgICAgXCIoPzpcXFxcLig/OlsxLTldXFxcXGQ/fDFcXFxcZFxcXFxkfDJbMC00XVxcXFxkfDI1WzAtNF0pKVwiICtcbiAgICAgICAgXCJ8XCIgK1xuICAgICAgICAgIC8vIGhvc3QgbmFtZVxuICAgICAgICAgIFwiKD86KD86W2EtelxcXFx1MDBhMS1cXFxcdWZmZmYwLTldLSopKlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XSspXCIgK1xuICAgICAgICAgIC8vIGRvbWFpbiBuYW1lXG4gICAgICAgICAgXCIoPzpcXFxcLig/OlthLXpcXFxcdTAwYTEtXFxcXHVmZmZmMC05XS0qKSpbYS16XFxcXHUwMGExLVxcXFx1ZmZmZjAtOV0rKSpcIiArXG4gICAgICAgICAgdGxkICtcbiAgICAgICAgXCIpXCIgK1xuICAgICAgICAvLyBwb3J0IG51bWJlclxuICAgICAgICBcIig/OjpcXFxcZHsyLDV9KT9cIiArXG4gICAgICAgIC8vIHJlc291cmNlIHBhdGhcbiAgICAgICAgXCIoPzpbLz8jXVxcXFxTKik/XCIgK1xuICAgICAgXCIkXCI7XG5cbiAgICAgIGlmIChhbGxvd0RhdGFVcmwpIHtcbiAgICAgICAgLy8gUkZDIDIzOTdcbiAgICAgICAgdmFyIG1lZGlhVHlwZSA9IFwiXFxcXHcrXFxcXC9bLSsuXFxcXHddKyg/OjtbXFxcXHc9XSspKlwiO1xuICAgICAgICB2YXIgdXJsY2hhciA9IFwiW0EtWmEtejAtOS1fLiF+XFxcXConKCk7XFxcXC8/OkAmPSskLCVdKlwiO1xuICAgICAgICB2YXIgZGF0YXVybCA9IFwiZGF0YTooPzpcIittZWRpYVR5cGUrXCIpPyg/OjtiYXNlNjQpPyxcIit1cmxjaGFyO1xuICAgICAgICByZWdleCA9IFwiKD86XCIrcmVnZXgrXCIpfCg/Ol5cIitkYXRhdXJsK1wiJClcIjtcbiAgICAgIH1cblxuICAgICAgdmFyIFBBVFRFUk4gPSBuZXcgUmVnRXhwKHJlZ2V4LCAnaScpO1xuICAgICAgaWYgKCFQQVRURVJOLmV4ZWModmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBtZXNzYWdlO1xuICAgICAgfVxuICAgIH0sXG4gICAgdHlwZTogdi5leHRlbmQoZnVuY3Rpb24odmFsdWUsIG9yaWdpbmFsT3B0aW9ucywgYXR0cmlidXRlLCBhdHRyaWJ1dGVzLCBnbG9iYWxPcHRpb25zKSB7XG4gICAgICBpZiAodi5pc1N0cmluZyhvcmlnaW5hbE9wdGlvbnMpKSB7XG4gICAgICAgIG9yaWdpbmFsT3B0aW9ucyA9IHt0eXBlOiBvcmlnaW5hbE9wdGlvbnN9O1xuICAgICAgfVxuXG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBvcHRpb25zID0gdi5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3JpZ2luYWxPcHRpb25zKTtcblxuICAgICAgdmFyIHR5cGUgPSBvcHRpb25zLnR5cGU7XG4gICAgICBpZiAoIXYuaXNEZWZpbmVkKHR5cGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHR5cGUgd2FzIHNwZWNpZmllZFwiKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGNoZWNrO1xuICAgICAgaWYgKHYuaXNGdW5jdGlvbih0eXBlKSkge1xuICAgICAgICBjaGVjayA9IHR5cGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjaGVjayA9IHRoaXMudHlwZXNbdHlwZV07XG4gICAgICB9XG5cbiAgICAgIGlmICghdi5pc0Z1bmN0aW9uKGNoZWNrKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ2YWxpZGF0ZS52YWxpZGF0b3JzLnR5cGUudHlwZXMuXCIgKyB0eXBlICsgXCIgbXVzdCBiZSBhIGZ1bmN0aW9uLlwiKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFjaGVjayh2YWx1ZSwgb3B0aW9ucywgYXR0cmlidXRlLCBhdHRyaWJ1dGVzLCBnbG9iYWxPcHRpb25zKSkge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IG9yaWdpbmFsT3B0aW9ucy5tZXNzYWdlIHx8XG4gICAgICAgICAgdGhpcy5tZXNzYWdlc1t0eXBlXSB8fFxuICAgICAgICAgIHRoaXMubWVzc2FnZSB8fFxuICAgICAgICAgIG9wdGlvbnMubWVzc2FnZSB8fFxuICAgICAgICAgICh2LmlzRnVuY3Rpb24odHlwZSkgPyBcIm11c3QgYmUgb2YgdGhlIGNvcnJlY3QgdHlwZVwiIDogXCJtdXN0IGJlIG9mIHR5cGUgJXt0eXBlfVwiKTtcblxuICAgICAgICBpZiAodi5pc0Z1bmN0aW9uKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UodmFsdWUsIG9yaWdpbmFsT3B0aW9ucywgYXR0cmlidXRlLCBhdHRyaWJ1dGVzLCBnbG9iYWxPcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2LmZvcm1hdChtZXNzYWdlLCB7YXR0cmlidXRlOiB2LnByZXR0aWZ5KGF0dHJpYnV0ZSksIHR5cGU6IHR5cGV9KTtcbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICB0eXBlczoge1xuICAgICAgICBvYmplY3Q6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgcmV0dXJuIHYuaXNPYmplY3QodmFsdWUpICYmICF2LmlzQXJyYXkodmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICBhcnJheTogdi5pc0FycmF5LFxuICAgICAgICBpbnRlZ2VyOiB2LmlzSW50ZWdlcixcbiAgICAgICAgbnVtYmVyOiB2LmlzTnVtYmVyLFxuICAgICAgICBzdHJpbmc6IHYuaXNTdHJpbmcsXG4gICAgICAgIGRhdGU6IHYuaXNEYXRlLFxuICAgICAgICBib29sZWFuOiB2LmlzQm9vbGVhblxuICAgICAgfSxcbiAgICAgIG1lc3NhZ2VzOiB7fVxuICAgIH0pXG4gIH07XG5cbiAgdmFsaWRhdGUuZm9ybWF0dGVycyA9IHtcbiAgICBkZXRhaWxlZDogZnVuY3Rpb24oZXJyb3JzKSB7cmV0dXJuIGVycm9yczt9LFxuICAgIGZsYXQ6IHYuZmxhdHRlbkVycm9yc1RvQXJyYXksXG4gICAgZ3JvdXBlZDogZnVuY3Rpb24oZXJyb3JzKSB7XG4gICAgICB2YXIgYXR0cjtcblxuICAgICAgZXJyb3JzID0gdi5ncm91cEVycm9yc0J5QXR0cmlidXRlKGVycm9ycyk7XG4gICAgICBmb3IgKGF0dHIgaW4gZXJyb3JzKSB7XG4gICAgICAgIGVycm9yc1thdHRyXSA9IHYuZmxhdHRlbkVycm9yc1RvQXJyYXkoZXJyb3JzW2F0dHJdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgfSxcbiAgICBjb25zdHJhaW50OiBmdW5jdGlvbihlcnJvcnMpIHtcbiAgICAgIHZhciBhdHRyO1xuICAgICAgZXJyb3JzID0gdi5ncm91cEVycm9yc0J5QXR0cmlidXRlKGVycm9ycyk7XG4gICAgICBmb3IgKGF0dHIgaW4gZXJyb3JzKSB7XG4gICAgICAgIGVycm9yc1thdHRyXSA9IGVycm9yc1thdHRyXS5tYXAoZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdC52YWxpZGF0b3I7XG4gICAgICAgIH0pLnNvcnQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlcnJvcnM7XG4gICAgfVxuICB9O1xuXG4gIHZhbGlkYXRlLmV4cG9zZU1vZHVsZSh2YWxpZGF0ZSwgdGhpcywgZXhwb3J0cywgbW9kdWxlLCBkZWZpbmUpO1xufSkuY2FsbCh0aGlzLFxuICAgICAgICB0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgPyAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBleHBvcnRzIDogbnVsbCxcbiAgICAgICAgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqLyBtb2R1bGUgOiBudWxsLFxuICAgICAgICB0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyA/IC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovIGRlZmluZSA6IG51bGwpO1xuIiwiaW1wb3J0IGlNYXNrIGZyb20gJ2ltYXNrJztcbmltcG9ydCB2YWxpZGF0ZSBmcm9tICd2YWxpZGF0ZS5qcyc7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gIGNvbnN0IGRyb3Bkb3ducyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtkYXRhLXRvZ2dsZT1cImRyb3Bkb3duXCJdYCk7XG4gIGNvbnN0IGVkaXRMaW5rID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgW2RhdGEtYWN0aW9uPVwiZWRpdFwiXWApO1xuICBjb25zdCBmb3JtID0gZG9jdW1lbnQuZm9ybXNbMF07XG4gIGNvbnN0IGNoZWNrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlY2lkZWQnKTtcbiAgY29uc3QgbGlhYmlsaXR5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xpYWJpbGl0eScpO1xuICBjb25zdCBsaWFiaWxpdHlObyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsaWFiaWxpdHlfMCcpO1xuICBsZXQgZWxlbXMgPSBbXTtcblxuICBpZiAobGlhYmlsaXR5KSB7XG4gICAgbGlhYmlsaXR5LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGJsb2NrID0gbGlhYmlsaXR5LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgIGNvbnN0IGhpZGRlbkVsZW1zID0gYmxvY2sucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtc2hvd25dJyk7XG4gICAgICBsaWFiaWxpdHkuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgaWYgKGhpZGRlbkVsZW1zKSB7XG4gICAgICAgIGhpZGRlbkVsZW1zLmZvckVhY2goIChpdGVtKSA9PiB7XG4gICAgICAgICAgaXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdpcy1oaWRkZW4nKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGZpcnN0SGlkZGVuRWxlbSA9IGhpZGRlbkVsZW1zWzBdLmNoaWxkcmVuWzBdO1xuICAgICAgICBpZiAoZmlyc3RIaWRkZW5FbGVtKSB7XG4gICAgICAgICAgZmlyc3RIaWRkZW5FbGVtLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgIGZpcnN0SGlkZGVuRWxlbS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2hhbmdlJykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgbGlhYmlsaXR5Tm8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgY29uc3QgYmxvY2sgPSBsaWFiaWxpdHkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgY29uc3QgaGlkZGVuRWxlbXMgPSBibG9jay5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1zaG93bl0nKTtcbiAgICAgIGlmIChoaWRkZW5FbGVtcykge1xuICAgICAgICBoaWRkZW5FbGVtcy5mb3JFYWNoKCAoaXRlbSkgPT4ge1xuICAgICAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZCgnaXMtaGlkZGVuJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGlmIChjaGVjaykge1xuICAgIGNoZWNrLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG4gICAgICBpZiAoY2hlY2suY2hlY2tlZCkge1xuICAgICAgICBmb3JtLmVsZW1lbnRzLmxpbmsudmFsdWUgPSAnJztcbiAgICAgICAgZm9ybS5lbGVtZW50cy5tb2RlbC52YWx1ZSA9ICcnO1xuICAgICAgICBmb3JtLmVsZW1lbnRzLmxpbmsuc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xuICAgICAgICBmb3JtLmVsZW1lbnRzLm1vZGVsLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5saW5rLnBhcmVudEVsZW1lbnQuXG4gICAgICAgICAgICBjbGFzc0xpc3QuYWRkKCdsZWFkLWZvcm1fX2dyb3VwLS1kaXNhYmxlZCcpO1xuICAgICAgICBmb3JtLmVsZW1lbnRzLm1vZGVsLnBhcmVudEVsZW1lbnQuXG4gICAgICAgICAgICBjbGFzc0xpc3QuYWRkKCdsZWFkLWZvcm1fX2dyb3VwLS1kaXNhYmxlZCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5saW5rLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5tb2RlbC5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyk7XG4gICAgICAgIGZvcm0uZWxlbWVudHMubGluay5wYXJlbnRFbGVtZW50LlxuICAgICAgICAgICAgY2xhc3NMaXN0LnJlbW92ZSgnbGVhZC1mb3JtX19ncm91cC0tZGlzYWJsZWQnKTtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5tb2RlbC5wYXJlbnRFbGVtZW50LlxuICAgICAgICAgICAgY2xhc3NMaXN0LnJlbW92ZSgnbGVhZC1mb3JtX19ncm91cC0tZGlzYWJsZWQnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBpZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBmb3JtICYmIGZvcm0uZWxlbWVudHMpIHtcbiAgICBlbGVtcyA9IE9iamVjdC52YWx1ZXMoZm9ybS5lbGVtZW50cyk7XG4gICAgaWYgKGVsZW1zKSB7XG4gICAgICBlbGVtcy5maWx0ZXIoKGVsKSA9PiBlbC5ub2RlTmFtZSA9PT0gJ0lOUFVUJyAmJlxuICAgICAgICBlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2lzLWVkaXRhYmxlJykpO1xuICAgIH1cbiAgICBjb25zdCBwaG9uZSA9IGZvcm0uZWxlbWVudHMucGhvbmU7XG4gICAgaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgcGhvbmUpIHtcbiAgICAgIGlNYXNrKHBob25lLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1hc2s6ICcrezM3NX0gKDAwKSAwMDAtMDAtMDAnLFxuICAgICAgICAgICAgbGF6eTogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgKS5vbignY29tcGxldGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gdG9kbzpcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIE9iamVjdC52YWx1ZXMoZm9ybS5lbGVtZW50cykuZm9yRWFjaCgoZWwpID0+e1xuICAgICAgaWYgKGVsLm5vZGVOYW1lID09PSAnSU5QVVQnKSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdpbnZhbGlkJyk7XG4gICAgICAgICAgbGV0IG1zZyA9IGVsLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcignLm1lc3NhZ2VzJyk7XG4gICAgICAgICAgaWYgKCFtc2cpIHtcbiAgICAgICAgICAgIG1zZyA9IGVsLnBhcmVudEVsZW1lbnRcbiAgICAgICAgICAgICAgICAucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubWVzc2FnZXMnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1zZykge1xuICAgICAgICAgICAgbXNnLmNsYXNzTGlzdC5yZW1vdmUoJ2Vycm9yJyk7XG4gICAgICAgICAgICBtc2cuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBjaGVja0ZpZWxkcyA9IChjb25zdHJhaW50cykgPT4ge1xuICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdGUoZm9ybSwgY29uc3RyYWludHMpO1xuICAgICAgaWYgKGVycm9ycykge1xuICAgICAgICBPYmplY3QuZW50cmllcyhlcnJvcnMpLmZvckVhY2goKFtpZCwgZXJyb3JdKSA9PiB7XG4gICAgICAgICAgbGV0IGlzUmFkaW8gPSAwO1xuICAgICAgICAgIGxldCBpbnB1dCA9IGZvcm0uZWxlbWVudHNbaWRdO1xuICAgICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEFycmF5IHx8IGlucHV0IGluc3RhbmNlb2YgUmFkaW9Ob2RlTGlzdCkge1xuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dFswXTtcbiAgICAgICAgICAgIGlzUmFkaW8gPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaW5wdXQpIHtcbiAgICAgICAgICAgIGlucHV0LmNsYXNzTGlzdC5hZGQoJ2ludmFsaWQnKTtcbiAgICAgICAgICAgIGxldCBtc2cgPSBpbnB1dC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlcycpO1xuICAgICAgICAgICAgaWYgKGlzUmFkaW8gJiYgIW1zZykge1xuICAgICAgICAgICAgICBtc2cgPSBpbnB1dC5wYXJlbnRFbGVtZW50XG4gICAgICAgICAgICAgICAgICAucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubWVzc2FnZXMnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChudWxsICE9PSBtc2cpIHtcbiAgICAgICAgICAgICAgbXNnLmlubmVySFRNTCA9IGVycm9yWzBdO1xuICAgICAgICAgICAgICBtc2cuY2xhc3NMaXN0LmFkZCgnZXJyb3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGUpID0+IHtcbiAgICAgIGlmIChmb3JtLmlkID09PSAnYWdyZWVtZW50cycpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAvLyBjb25zdCBkYXRhID0gbmV3IEZvcm1EYXRhKGZvcm0pO1xuICAgICAgICBjb25zdCBjb25zdHJhaW50cyA9IHtcbiAgICAgICAgICBhZ3JlZW1lbnRfcmVwb3J0OiB7XG4gICAgICAgICAgICBwcmVzZW5jZToge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBgXtCf0L7QtNGC0LLQtdGA0LTQuNGC0LUg0YHQvtCz0LvQsNGB0LjQtSDQvdCwINC/0YDQtdC00L7RgdGC0LDQstC70LXQvdC40LVcbiAgICAgICAgICAgICAg0LrRgNC10LTQuNGC0L3QvtCz0L4g0L7RgtGH0LXRgtCwYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhZ3JlZW1lbnRfZnN6bjoge1xuICAgICAgICAgICAgcHJlc2VuY2U6IHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogYF7Qn9C+0LTRgtCy0LXRgNC00LjRgtC1INGB0L7Qs9C70LDRgdC40LUg0L3QsCDQv9C+0LvRg9GH0LXQvdC40LUg0LTQsNC90L3Ri9GFINC40Lcg0KTQodCX0J1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBpZiAoY2hlY2tGaWVsZHMoY29uc3RyYWludHMpKSB7XG4gICAgICAgICAgZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGZvcm0uaWQgPT09ICdyZWdpc3Rlcl9hZGRyZXNzJykge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGNvbnN0cmFpbnRzID0ge1xuICAgICAgICAgIG1hdGNoZXM6IHtcbiAgICAgICAgICAgIHByZXNlbmNlOiB7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGBe0JLRi9Cx0LXRgNC10YLQuNGC0LUg0LfQvdCw0YfQtdC90LjQtSFgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBpZiAoY2hlY2tGaWVsZHMoY29uc3RyYWludHMpKSB7XG4gICAgICAgICAgZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgaWYgKG51bGwgIT09IGZvcm0gJiYgZm9ybS5pZCA9PT0gJ2NvbmZpcm1hdGlvbicpIHtcbiAgICBjb25zdCB0aW1lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXRpbWVyXWApO1xuICAgIGNvbnN0IHJlc2VuZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLXJlc2VuZF1gKTtcbiAgICBjb25zdCB0aW1lRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS10aW1lXWApO1xuICAgIGNvbnN0IHRpbWVyRnVuYyA9ICgpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVySWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIGxldCB0aW1lID0gdGltZUVsLmRhdGFzZXQudGltZTtcbiAgICAgICAgLS10aW1lO1xuICAgICAgICBpZiAodGltZSA+PSAwKSB7XG4gICAgICAgICAgdGltZUVsLmlubmVySFRNTCA9IHRpbWU7XG4gICAgICAgICAgdGltZUVsLmRhdGFzZXQudGltZSA9IHRpbWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcklkKTtcbiAgICAgICAgICB0aW1lci5jbGFzc0xpc3QuYWRkKGBpcy1oaWRkZW5gKTtcbiAgICAgICAgICByZXNlbmQuY2xhc3NMaXN0LnJlbW92ZShgaXMtaGlkZGVuYCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDEwMDApO1xuICAgIH07XG4gICAgdGltZXJGdW5jKCk7XG4gICAgcmVzZW5kLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRpbWVFbC5pbm5lckhUTUwgPSA1OTtcbiAgICAgIHRpbWVFbC5kYXRhc2V0LnRpbWUgPSA1OTtcbiAgICAgIHRpbWVyLmNsYXNzTGlzdC5yZW1vdmUoYGlzLWhpZGRlbmApO1xuICAgICAgcmVzZW5kLmNsYXNzTGlzdC5hZGQoYGlzLWhpZGRlbmApO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnL2xlYWQvc2VuZHNtcycpO1xuICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgIGNvbnN0IGpzb24gPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGpzb24pO1xuICAgICAgfVxuICAgICAgdGltZXJGdW5jKCk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAobnVsbCAhPT0gZWRpdExpbmspIHtcbiAgICBlZGl0TGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlbGVtcy5mb3JFYWNoKChlbGVtKSA9PiB7XG4gICAgICAgIGVsZW0uY2xhc3NMaXN0LnJlbW92ZSgnbGVhZC1mb3JtX19ncm91cC0tZGlzYWJsZWQnKTtcbiAgICAgICAgY29uc3QgaW5wdXRFbCA9IGVsZW0ucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgaW5wdXRFbC5yZW1vdmVBdHRyaWJ1dGUoJ3JlYWRvbmx5Jyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBpZiAobnVsbCAhPT0gZHJvcGRvd25zKSB7XG4gICAgZHJvcGRvd25zLmZvckVhY2goKGRyb3Bkb3duKSA9PiB7XG4gICAgICBkcm9wZG93bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgY29uc3QgY29udGVudElkID0gZHJvcGRvd24uZGF0YXNldC50YXJnZXQucmVwbGFjZSgnIycsICcnKTtcbiAgICAgICAgaWYgKG51bGwgIT09IGNvbnRlbnRJZCkge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250ZW50SWQpO1xuICAgICAgICAgIGNvbnRlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtaGlkZGVuJyk7XG4gICAgICAgICAgZHJvcGRvd24uY2xhc3NMaXN0LnRvZ2dsZSgnaXMtb3BlbicpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGN1c3RvbVNlbGVjdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubGVhZC1mb3JtX19jdXN0b20tc2VsZWN0Jyk7XG4gIC8vIEF0dGFjaCBjbGljayBldmVudCBsaXN0ZW5lcnMgdG8gZWFjaCBjdXN0b20gc2VsZWN0XG4gIGN1c3RvbVNlbGVjdHMuZm9yRWFjaChmdW5jdGlvbihzZWwpIHtcbiAgICBjb25zdCBzZWxlY3RTZWxlY3RlZCA9IHNlbC5xdWVyeVNlbGVjdG9yKCcubGVhZC1mb3JtX19zZWxlY3Qtc2VsZWN0ZWQnKTtcbiAgICBjb25zdCBzZWxlY3RJdGVtcyA9IHNlbC5xdWVyeVNlbGVjdG9yKCcubGVhZC1mb3JtX19zZWxlY3QtaXRlbXMnKTtcbiAgICBjb25zdCBvcHRpb25zID0gc2VsZWN0SXRlbXMucXVlcnlTZWxlY3RvckFsbCgnZGl2Jyk7XG4gICAgY29uc3Qgc2VsSGlkZGVuID0gc2VsLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG4gICAgc2VsZWN0U2VsZWN0ZWQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzZWxlY3RJdGVtcy5zdHlsZS5kaXNwbGF5ID09PSAnYmxvY2snKSB7XG4gICAgICAgIHNlbGVjdEl0ZW1zLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHNlbGVjdFNlbGVjdGVkLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLW9wZW4nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGVjdEl0ZW1zLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICBzZWxlY3RTZWxlY3RlZC5jbGFzc0xpc3QuYWRkKCdpcy1vcGVuJyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gU2V0IHRoZSBzZWxlY3RlZCBvcHRpb24gYW5kIGhpZGUgdGhlIGRyb3Bkb3duIHdoZW4gYW4gb3B0aW9uIGlzIGNsaWNrZWRcbiAgICBvcHRpb25zLmZvckVhY2goZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZWN0U2VsZWN0ZWQudGV4dENvbnRlbnQgPSBvcHRpb24udGV4dENvbnRlbnQ7XG4gICAgICAgIHNlbEhpZGRlbi52YWx1ZSA9IG9wdGlvbi5kYXRhc2V0LnZhbHVlO1xuICAgICAgICBjb25zdCBzZWxJdGVtID0gc2VsSGlkZGVuXG4gICAgICAgICAgICAucXVlcnlTZWxlY3RvcihgW3ZhbHVlPVwiJHtvcHRpb24uZGF0YXNldC52YWx1ZX1cIl1gKTtcbiAgICAgICAgc2VsSXRlbS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnY2xpY2snKSk7XG4gICAgICAgIHNlbGVjdEl0ZW1zLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHNlbGVjdFNlbGVjdGVkLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLW9wZW4nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vIENsb3NlIHRoZSBkcm9wZG93biBpZiB0aGUgdXNlciBjbGlja3Mgb3V0c2lkZSBvZiBpdFxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghc2VsLmNvbnRhaW5zKGUudGFyZ2V0KSkge1xuICAgICAgICBzZWxlY3RJdGVtcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICBzZWxlY3RTZWxlY3RlZC5jbGFzc0xpc3QucmVtb3ZlKCdpcy1vcGVuJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
