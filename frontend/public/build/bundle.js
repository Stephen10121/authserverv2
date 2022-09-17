
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty$1() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var jsbiUmd = createCommonjsModule(function (module, exports) {
    (function(e,t){module.exports=t();})(commonjsGlobal,function(){var e=Math.imul,t=Math.clz32;function i(e){"@babel/helpers - typeof";return i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},i(e)}function _(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function n(e,t){for(var _,n=0;n<t.length;n++)_=t[n],_.enumerable=_.enumerable||!1,_.configurable=!0,"value"in _&&(_.writable=!0),Object.defineProperty(e,_.key,_);}function l(e,t,i){return t&&n(e.prototype,t),i&&n(e,i),Object.defineProperty(e,"prototype",{writable:!1}),e}function g(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&u(e,t);}function a(e){return a=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)},a(e)}function u(e,t){return u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},u(e,t)}function s(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(t){return !1}}function r(){return r=s()?Reflect.construct:function(e,t,i){var _=[null];_.push.apply(_,t);var n=Function.bind.apply(e,_),l=new n;return i&&u(l,i.prototype),l},r.apply(null,arguments)}function d(e){return -1!==Function.toString.call(e).indexOf("[native code]")}function h(e){var t="function"==typeof Map?new Map:void 0;return h=function(e){function i(){return r(e,arguments,a(this).constructor)}if(null===e||!d(e))return e;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if("undefined"!=typeof t){if(t.has(e))return t.get(e);t.set(e,i);}return i.prototype=Object.create(e.prototype,{constructor:{value:i,enumerable:!1,writable:!0,configurable:!0}}),u(i,e)},h(e)}function b(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function m(e,t){if(t&&("object"==typeof t||"function"==typeof t))return t;if(void 0!==t)throw new TypeError("Derived constructors may only return object or undefined");return b(e)}function c(e){var t=s();return function(){var i,_=a(e);if(t){var n=a(this).constructor;i=Reflect.construct(_,arguments,n);}else i=_.apply(this,arguments);return m(this,i)}}function v(e,t){return y(e)||f(e,t)||D(e,t)||k()}function y(e){if(Array.isArray(e))return e}function f(e,t){var i=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=i){var _,n,l=[],g=!0,o=!1;try{for(i=i.call(e);!(g=(_=i.next()).done)&&(l.push(_.value),!(t&&l.length===t));g=!0);}catch(e){o=!0,n=e;}finally{try{g||null==i["return"]||i["return"]();}finally{if(o)throw n}}return l}}function D(e,t){if(e){if("string"==typeof e)return p(e,t);var i=Object.prototype.toString.call(e).slice(8,-1);return "Object"===i&&e.constructor&&(i=e.constructor.name),"Map"===i||"Set"===i?Array.from(e):"Arguments"===i||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i)?p(e,t):void 0}}function p(e,t){(null==t||t>e.length)&&(t=e.length);for(var _=0,n=Array(t);_<t;_++)n[_]=e[_];return n}function k(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function B(e,t){var _="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!_){if(Array.isArray(e)||(_=D(e))||t&&e&&"number"==typeof e.length){_&&(e=_);var n=0,l=function(){};return {s:l,n:function(){return n>=e.length?{done:!0}:{done:!1,value:e[n++]}},e:function(t){throw t},f:l}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var g,a=!0,u=!1;return {s:function(){_=_.call(e);},n:function(){var e=_.next();return a=e.done,e},e:function(t){u=!0,g=t;},f:function(){try{a||null==_.return||_.return();}finally{if(u)throw g}}}}var S=function(e){var t=Math.abs,n=Math.max,o=Math.floor;function a(e,t){var i;if(_(this,a),i=u.call(this,e),i.sign=t,Object.setPrototypeOf(b(i),a.prototype),e>a.__kMaxLength)throw new RangeError("Maximum BigInt size exceeded");return i}g(a,e);var u=c(a);return l(a,[{key:"toDebugString",value:function(){var e,t=["BigInt["],i=B(this);try{for(i.s();!(e=i.n()).done;){var _=e.value;t.push((_?(_>>>0).toString(16):_)+", ");}}catch(e){i.e(e);}finally{i.f();}return t.push("]"),t.join("")}},{key:"toString",value:function(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:10;if(2>e||36<e)throw new RangeError("toString() radix argument must be between 2 and 36");return 0===this.length?"0":0==(e&e-1)?a.__toStringBasePowerOfTwo(this,e):a.__toStringGeneric(this,e,!1)}},{key:"valueOf",value:function(){throw new Error("Convert JSBI instances to native numbers using `toNumber`.")}},{key:"__copy",value:function(){for(var e=new a(this.length,this.sign),t=0;t<this.length;t++)e[t]=this[t];return e}},{key:"__trim",value:function(){for(var e=this.length,t=this[e-1];0===t;)e--,t=this[e-1],this.pop();return 0===e&&(this.sign=!1),this}},{key:"__initializeDigits",value:function(){for(var e=0;e<this.length;e++)this[e]=0;}},{key:"__clzmsd",value:function(){return a.__clz30(this.__digit(this.length-1))}},{key:"__inplaceMultiplyAdd",value:function(e,t,_){_>this.length&&(_=this.length);for(var n=32767&e,l=e>>>15,g=0,o=t,u=0;u<_;u++){var s=this.__digit(u),r=32767&s,d=s>>>15,h=a.__imul(r,n),b=a.__imul(r,l),m=a.__imul(d,n),c=a.__imul(d,l),v=o+h+g;g=v>>>30,v&=1073741823,v+=((32767&b)<<15)+((32767&m)<<15),g+=v>>>30,o=c+(b>>>15)+(m>>>15),this.__setDigit(u,1073741823&v);}if(0!==g||0!==o)throw new Error("implementation bug")}},{key:"__inplaceAdd",value:function(e,t,_){for(var n,l=0,g=0;g<_;g++)n=this.__halfDigit(t+g)+e.__halfDigit(g)+l,l=n>>>15,this.__setHalfDigit(t+g,32767&n);return l}},{key:"__inplaceSub",value:function(e,t,_){var n=0;if(1&t){t>>=1;for(var l=this.__digit(t),g=32767&l,o=0;o<_-1>>>1;o++){var a=e.__digit(o),u=(l>>>15)-(32767&a)-n;n=1&u>>>15,this.__setDigit(t+o,(32767&u)<<15|32767&g),l=this.__digit(t+o+1),g=(32767&l)-(a>>>15)-n,n=1&g>>>15;}var s=e.__digit(o),r=(l>>>15)-(32767&s)-n;n=1&r>>>15,this.__setDigit(t+o,(32767&r)<<15|32767&g);if(t+o+1>=this.length)throw new RangeError("out of bounds");0==(1&_)&&(l=this.__digit(t+o+1),g=(32767&l)-(s>>>15)-n,n=1&g>>>15,this.__setDigit(t+e.length,1073709056&l|32767&g));}else {t>>=1;for(var d=0;d<e.length-1;d++){var h=this.__digit(t+d),b=e.__digit(d),m=(32767&h)-(32767&b)-n;n=1&m>>>15;var c=(h>>>15)-(b>>>15)-n;n=1&c>>>15,this.__setDigit(t+d,(32767&c)<<15|32767&m);}var v=this.__digit(t+d),y=e.__digit(d),f=(32767&v)-(32767&y)-n;n=1&f>>>15;var D=0;0==(1&_)&&(D=(v>>>15)-(y>>>15)-n,n=1&D>>>15),this.__setDigit(t+d,(32767&D)<<15|32767&f);}return n}},{key:"__inplaceRightShift",value:function(e){if(0!==e){for(var t,_=this.__digit(0)>>>e,n=this.length-1,l=0;l<n;l++)t=this.__digit(l+1),this.__setDigit(l,1073741823&t<<30-e|_),_=t>>>e;this.__setDigit(n,_);}}},{key:"__digit",value:function(e){return this[e]}},{key:"__unsignedDigit",value:function(e){return this[e]>>>0}},{key:"__setDigit",value:function(e,t){this[e]=0|t;}},{key:"__setDigitGrow",value:function(e,t){this[e]=0|t;}},{key:"__halfDigitLength",value:function(){var e=this.length;return 32767>=this.__unsignedDigit(e-1)?2*e-1:2*e}},{key:"__halfDigit",value:function(e){return 32767&this[e>>>1]>>>15*(1&e)}},{key:"__setHalfDigit",value:function(e,t){var i=e>>>1,_=this.__digit(i),n=1&e?32767&_|t<<15:1073709056&_|32767&t;this.__setDigit(i,n);}}],[{key:"BigInt",value:function(e){var t=Number.isFinite;if("number"==typeof e){if(0===e)return a.__zero();if(a.__isOneDigitInt(e))return 0>e?a.__oneDigit(-e,!0):a.__oneDigit(e,!1);if(!t(e)||o(e)!==e)throw new RangeError("The number "+e+" cannot be converted to BigInt because it is not an integer");return a.__fromDouble(e)}if("string"==typeof e){var _=a.__fromString(e);if(null===_)throw new SyntaxError("Cannot convert "+e+" to a BigInt");return _}if("boolean"==typeof e)return !0===e?a.__oneDigit(1,!1):a.__zero();if("object"===i(e)){if(e.constructor===a)return e;var n=a.__toPrimitive(e);return a.BigInt(n)}throw new TypeError("Cannot convert "+e+" to a BigInt")}},{key:"toNumber",value:function(e){var t=e.length;if(0===t)return 0;if(1===t){var i=e.__unsignedDigit(0);return e.sign?-i:i}var _=e.__digit(t-1),n=a.__clz30(_),l=30*t-n;if(1024<l)return e.sign?-Infinity:1/0;var g=l-1,o=_,u=t-1,s=n+3,r=32===s?0:o<<s;r>>>=12;var d=s-12,h=12<=s?0:o<<20+s,b=20+s;for(0<d&&0<u&&(u--,o=e.__digit(u),r|=o>>>30-d,h=o<<d+2,b=d+2);0<b&&0<u;)u--,o=e.__digit(u),h|=30<=b?o<<b-30:o>>>30-b,b-=30;var m=a.__decideRounding(e,b,u,o);if((1===m||0===m&&1==(1&h))&&(h=h+1>>>0,0===h&&(r++,0!=r>>>20&&(r=0,g++,1023<g))))return e.sign?-Infinity:1/0;var c=e.sign?-2147483648:0;return g=g+1023<<20,a.__kBitConversionInts[1]=c|g|r,a.__kBitConversionInts[0]=h,a.__kBitConversionDouble[0]}},{key:"unaryMinus",value:function(e){if(0===e.length)return e;var t=e.__copy();return t.sign=!e.sign,t}},{key:"bitwiseNot",value:function(e){return e.sign?a.__absoluteSubOne(e).__trim():a.__absoluteAddOne(e,!0)}},{key:"exponentiate",value:function(e,t){if(t.sign)throw new RangeError("Exponent must be positive");if(0===t.length)return a.__oneDigit(1,!1);if(0===e.length)return e;if(1===e.length&&1===e.__digit(0))return e.sign&&0==(1&t.__digit(0))?a.unaryMinus(e):e;if(1<t.length)throw new RangeError("BigInt too big");var i=t.__unsignedDigit(0);if(1===i)return e;if(i>=a.__kMaxLengthBits)throw new RangeError("BigInt too big");if(1===e.length&&2===e.__digit(0)){var _=1+(0|i/30),n=e.sign&&0!=(1&i),l=new a(_,n);l.__initializeDigits();var g=1<<i%30;return l.__setDigit(_-1,g),l}var o=null,u=e;for(0!=(1&i)&&(o=e),i>>=1;0!==i;i>>=1)u=a.multiply(u,u),0!=(1&i)&&(null===o?o=u:o=a.multiply(o,u));return o}},{key:"multiply",value:function(e,t){if(0===e.length)return e;if(0===t.length)return t;var _=e.length+t.length;30<=e.__clzmsd()+t.__clzmsd()&&_--;var n=new a(_,e.sign!==t.sign);n.__initializeDigits();for(var l=0;l<e.length;l++)a.__multiplyAccumulate(t,e.__digit(l),n,l);return n.__trim()}},{key:"divide",value:function(e,t){if(0===t.length)throw new RangeError("Division by zero");if(0>a.__absoluteCompare(e,t))return a.__zero();var i,_=e.sign!==t.sign,n=t.__unsignedDigit(0);if(1===t.length&&32767>=n){if(1===n)return _===e.sign?e:a.unaryMinus(e);i=a.__absoluteDivSmall(e,n,null);}else i=a.__absoluteDivLarge(e,t,!0,!1);return i.sign=_,i.__trim()}},{key:"remainder",value:function i(e,t){if(0===t.length)throw new RangeError("Division by zero");if(0>a.__absoluteCompare(e,t))return e;var _=t.__unsignedDigit(0);if(1===t.length&&32767>=_){if(1===_)return a.__zero();var n=a.__absoluteModSmall(e,_);return 0===n?a.__zero():a.__oneDigit(n,e.sign)}var i=a.__absoluteDivLarge(e,t,!1,!0);return i.sign=e.sign,i.__trim()}},{key:"add",value:function(e,t){var i=e.sign;return i===t.sign?a.__absoluteAdd(e,t,i):0<=a.__absoluteCompare(e,t)?a.__absoluteSub(e,t,i):a.__absoluteSub(t,e,!i)}},{key:"subtract",value:function(e,t){var i=e.sign;return i===t.sign?0<=a.__absoluteCompare(e,t)?a.__absoluteSub(e,t,i):a.__absoluteSub(t,e,!i):a.__absoluteAdd(e,t,i)}},{key:"leftShift",value:function(e,t){return 0===t.length||0===e.length?e:t.sign?a.__rightShiftByAbsolute(e,t):a.__leftShiftByAbsolute(e,t)}},{key:"signedRightShift",value:function(e,t){return 0===t.length||0===e.length?e:t.sign?a.__leftShiftByAbsolute(e,t):a.__rightShiftByAbsolute(e,t)}},{key:"unsignedRightShift",value:function(){throw new TypeError("BigInts have no unsigned right shift; use >> instead")}},{key:"lessThan",value:function(e,t){return 0>a.__compareToBigInt(e,t)}},{key:"lessThanOrEqual",value:function(e,t){return 0>=a.__compareToBigInt(e,t)}},{key:"greaterThan",value:function(e,t){return 0<a.__compareToBigInt(e,t)}},{key:"greaterThanOrEqual",value:function(e,t){return 0<=a.__compareToBigInt(e,t)}},{key:"equal",value:function(e,t){if(e.sign!==t.sign)return !1;if(e.length!==t.length)return !1;for(var _=0;_<e.length;_++)if(e.__digit(_)!==t.__digit(_))return !1;return !0}},{key:"notEqual",value:function(e,t){return !a.equal(e,t)}},{key:"bitwiseAnd",value:function(e,t){if(!e.sign&&!t.sign)return a.__absoluteAnd(e,t).__trim();if(e.sign&&t.sign){var i=n(e.length,t.length)+1,_=a.__absoluteSubOne(e,i),l=a.__absoluteSubOne(t);return _=a.__absoluteOr(_,l,_),a.__absoluteAddOne(_,!0,_).__trim()}if(e.sign){var g=[t,e];e=g[0],t=g[1];}return a.__absoluteAndNot(e,a.__absoluteSubOne(t)).__trim()}},{key:"bitwiseXor",value:function(e,t){if(!e.sign&&!t.sign)return a.__absoluteXor(e,t).__trim();if(e.sign&&t.sign){var i=n(e.length,t.length),_=a.__absoluteSubOne(e,i),l=a.__absoluteSubOne(t);return a.__absoluteXor(_,l,_).__trim()}var g=n(e.length,t.length)+1;if(e.sign){var o=[t,e];e=o[0],t=o[1];}var u=a.__absoluteSubOne(t,g);return u=a.__absoluteXor(u,e,u),a.__absoluteAddOne(u,!0,u).__trim()}},{key:"bitwiseOr",value:function(e,t){var i=n(e.length,t.length);if(!e.sign&&!t.sign)return a.__absoluteOr(e,t).__trim();if(e.sign&&t.sign){var _=a.__absoluteSubOne(e,i),l=a.__absoluteSubOne(t);return _=a.__absoluteAnd(_,l,_),a.__absoluteAddOne(_,!0,_).__trim()}if(e.sign){var g=[t,e];e=g[0],t=g[1];}var o=a.__absoluteSubOne(t,i);return o=a.__absoluteAndNot(o,e,o),a.__absoluteAddOne(o,!0,o).__trim()}},{key:"asIntN",value:function(e,t){if(0===t.length)return t;if(e=o(e),0>e)throw new RangeError("Invalid value: not (convertible to) a safe integer");if(0===e)return a.__zero();if(e>=a.__kMaxLengthBits)return t;var _=0|(e+29)/30;if(t.length<_)return t;var l=t.__unsignedDigit(_-1),g=1<<(e-1)%30;if(t.length===_&&l<g)return t;if(!((l&g)===g))return a.__truncateToNBits(e,t);if(!t.sign)return a.__truncateAndSubFromPowerOfTwo(e,t,!0);if(0==(l&g-1)){for(var u=_-2;0<=u;u--)if(0!==t.__digit(u))return a.__truncateAndSubFromPowerOfTwo(e,t,!1);return t.length===_&&l===g?t:a.__truncateToNBits(e,t)}return a.__truncateAndSubFromPowerOfTwo(e,t,!1)}},{key:"asUintN",value:function(e,t){if(0===t.length)return t;if(e=o(e),0>e)throw new RangeError("Invalid value: not (convertible to) a safe integer");if(0===e)return a.__zero();if(t.sign){if(e>a.__kMaxLengthBits)throw new RangeError("BigInt too big");return a.__truncateAndSubFromPowerOfTwo(e,t,!1)}if(e>=a.__kMaxLengthBits)return t;var i=0|(e+29)/30;if(t.length<i)return t;var _=e%30;if(t.length==i){if(0===_)return t;var l=t.__digit(i-1);if(0==l>>>_)return t}return a.__truncateToNBits(e,t)}},{key:"ADD",value:function(e,t){if(e=a.__toPrimitive(e),t=a.__toPrimitive(t),"string"==typeof e)return "string"!=typeof t&&(t=t.toString()),e+t;if("string"==typeof t)return e.toString()+t;if(e=a.__toNumeric(e),t=a.__toNumeric(t),a.__isBigInt(e)&&a.__isBigInt(t))return a.add(e,t);if("number"==typeof e&&"number"==typeof t)return e+t;throw new TypeError("Cannot mix BigInt and other types, use explicit conversions")}},{key:"LT",value:function(e,t){return a.__compare(e,t,0)}},{key:"LE",value:function(e,t){return a.__compare(e,t,1)}},{key:"GT",value:function(e,t){return a.__compare(e,t,2)}},{key:"GE",value:function(e,t){return a.__compare(e,t,3)}},{key:"EQ",value:function(e,t){for(;;){if(a.__isBigInt(e))return a.__isBigInt(t)?a.equal(e,t):a.EQ(t,e);if("number"==typeof e){if(a.__isBigInt(t))return a.__equalToNumber(t,e);if("object"!==i(t))return e==t;t=a.__toPrimitive(t);}else if("string"==typeof e){if(a.__isBigInt(t))return e=a.__fromString(e),null!==e&&a.equal(e,t);if("object"!==i(t))return e==t;t=a.__toPrimitive(t);}else if("boolean"==typeof e){if(a.__isBigInt(t))return a.__equalToNumber(t,+e);if("object"!==i(t))return e==t;t=a.__toPrimitive(t);}else if("symbol"===i(e)){if(a.__isBigInt(t))return !1;if("object"!==i(t))return e==t;t=a.__toPrimitive(t);}else if("object"===i(e)){if("object"===i(t)&&t.constructor!==a)return e==t;e=a.__toPrimitive(e);}else return e==t}}},{key:"NE",value:function(e,t){return !a.EQ(e,t)}},{key:"DataViewGetBigInt64",value:function(e,t){var i=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2];return a.asIntN(64,a.DataViewGetBigUint64(e,t,i))}},{key:"DataViewGetBigUint64",value:function(e,t){var i=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2],_=i?[4,0]:[0,4],n=v(_,2),g=n[0],o=n[1],l=e.getUint32(t+g,i),u=e.getUint32(t+o,i),s=new a(3,!1);return s.__setDigit(0,1073741823&u),s.__setDigit(1,(268435455&l)<<2|u>>>30),s.__setDigit(2,l>>>28),s.__trim()}},{key:"DataViewSetBigInt64",value:function(e,t,i){var _=!!(3<arguments.length&&void 0!==arguments[3])&&arguments[3];a.DataViewSetBigUint64(e,t,i,_);}},{key:"DataViewSetBigUint64",value:function(e,t,i){var _=!!(3<arguments.length&&void 0!==arguments[3])&&arguments[3];i=a.asUintN(64,i);var n=0,g=0;if(0<i.length&&(g=i.__digit(0),1<i.length)){var o=i.__digit(1);g|=o<<30,n=o>>>2,2<i.length&&(n|=i.__digit(2)<<28);}var u=_?[4,0]:[0,4],s=v(u,2),r=s[0],d=s[1];e.setUint32(t+r,n,_),e.setUint32(t+d,g,_);}},{key:"__zero",value:function(){return new a(0,!1)}},{key:"__oneDigit",value:function(e,t){var i=new a(1,t);return i.__setDigit(0,e),i}},{key:"__decideRounding",value:function(e,t,i,_){if(0<t)return -1;var n;if(0>t)n=-t-1;else {if(0===i)return -1;i--,_=e.__digit(i),n=29;}var l=1<<n;if(0==(_&l))return -1;if(l-=1,0!=(_&l))return 1;for(;0<i;)if(i--,0!==e.__digit(i))return 1;return 0}},{key:"__fromDouble",value:function(e){a.__kBitConversionDouble[0]=e;var t,i=2047&a.__kBitConversionInts[1]>>>20,_=i-1023,n=(0|_/30)+1,l=new a(n,0>e),g=1048575&a.__kBitConversionInts[1]|1048576,o=a.__kBitConversionInts[0],u=20,s=_%30,r=0;if(s<u){var d=u-s;r=d+32,t=g>>>d,g=g<<32-d|o>>>d,o<<=32-d;}else if(s===u)r=32,t=g,g=o,o=0;else {var h=s-u;r=32-h,t=g<<h|o>>>32-h,g=o<<h,o=0;}l.__setDigit(n-1,t);for(var b=n-2;0<=b;b--)0<r?(r-=30,t=g>>>2,g=g<<30|o>>>2,o<<=30):t=0,l.__setDigit(b,t);return l.__trim()}},{key:"__isWhitespace",value:function(e){return !!(13>=e&&9<=e)||(159>=e?32==e:131071>=e?160==e||5760==e:196607>=e?(e&=131071,10>=e||40==e||41==e||47==e||95==e||4096==e):65279==e)}},{key:"__fromString",value:function(e){var t=1<arguments.length&&void 0!==arguments[1]?arguments[1]:0,i=0,_=e.length,n=0;if(n===_)return a.__zero();for(var l=e.charCodeAt(n);a.__isWhitespace(l);){if(++n===_)return a.__zero();l=e.charCodeAt(n);}if(43===l){if(++n===_)return null;l=e.charCodeAt(n),i=1;}else if(45===l){if(++n===_)return null;l=e.charCodeAt(n),i=-1;}if(0===t){if(t=10,48===l){if(++n===_)return a.__zero();if(l=e.charCodeAt(n),88===l||120===l){if(t=16,++n===_)return null;l=e.charCodeAt(n);}else if(79===l||111===l){if(t=8,++n===_)return null;l=e.charCodeAt(n);}else if(66===l||98===l){if(t=2,++n===_)return null;l=e.charCodeAt(n);}}}else if(16===t&&48===l){if(++n===_)return a.__zero();if(l=e.charCodeAt(n),88===l||120===l){if(++n===_)return null;l=e.charCodeAt(n);}}if(0!==i&&10!==t)return null;for(;48===l;){if(++n===_)return a.__zero();l=e.charCodeAt(n);}var g=_-n,o=a.__kMaxBitsPerChar[t],u=a.__kBitsPerCharTableMultiplier-1;if(g>1073741824/o)return null;var s=o*g+u>>>a.__kBitsPerCharTableShift,r=new a(0|(s+29)/30,!1),h=10>t?t:10,b=10<t?t-10:0;if(0==(t&t-1)){o>>=a.__kBitsPerCharTableShift;var c=[],v=[],y=!1;do{for(var f,D=0,p=0;;){if(f=void 0,l-48>>>0<h)f=l-48;else if((32|l)-97>>>0<b)f=(32|l)-87;else {y=!0;break}if(p+=o,D=D<<o|f,++n===_){y=!0;break}if(l=e.charCodeAt(n),30<p+o)break}c.push(D),v.push(p);}while(!y);a.__fillFromParts(r,c,v);}else {r.__initializeDigits();var k=!1,B=0;do{for(var S,C=0,I=1;;){if(S=void 0,l-48>>>0<h)S=l-48;else if((32|l)-97>>>0<b)S=(32|l)-87;else {k=!0;break}var A=I*t;if(1073741823<A)break;if(I=A,C=C*t+S,B++,++n===_){k=!0;break}l=e.charCodeAt(n);}u=30*a.__kBitsPerCharTableMultiplier-1;var m=0|(o*B+u>>>a.__kBitsPerCharTableShift)/30;r.__inplaceMultiplyAdd(I,C,m);}while(!k)}if(n!==_){if(!a.__isWhitespace(l))return null;for(n++;n<_;n++)if(l=e.charCodeAt(n),!a.__isWhitespace(l))return null}return r.sign=-1===i,r.__trim()}},{key:"__fillFromParts",value:function(e,t,_){for(var n=0,l=0,g=0,o=t.length-1;0<=o;o--){var a=t[o],u=_[o];l|=a<<g,g+=u,30===g?(e.__setDigit(n++,l),g=0,l=0):30<g&&(e.__setDigit(n++,1073741823&l),g-=30,l=a>>>u-g);}if(0!==l){if(n>=e.length)throw new Error("implementation bug");e.__setDigit(n++,l);}for(;n<e.length;n++)e.__setDigit(n,0);}},{key:"__toStringBasePowerOfTwo",value:function(e,t){var _=e.length,n=t-1;n=(85&n>>>1)+(85&n),n=(51&n>>>2)+(51&n),n=(15&n>>>4)+(15&n);var l=n,g=t-1,o=e.__digit(_-1),u=a.__clz30(o),s=0|(30*_-u+l-1)/l;if(e.sign&&s++,268435456<s)throw new Error("string too long");for(var r=Array(s),d=s-1,h=0,b=0,m=0;m<_-1;m++){var c=e.__digit(m),v=(h|c<<b)&g;r[d--]=a.__kConversionChars[v];var y=l-b;for(h=c>>>y,b=30-y;b>=l;)r[d--]=a.__kConversionChars[h&g],h>>>=l,b-=l;}var f=(h|o<<b)&g;for(r[d--]=a.__kConversionChars[f],h=o>>>l-b;0!==h;)r[d--]=a.__kConversionChars[h&g],h>>>=l;if(e.sign&&(r[d--]="-"),-1!==d)throw new Error("implementation bug");return r.join("")}},{key:"__toStringGeneric",value:function(e,t,_){var n=e.length;if(0===n)return "";if(1===n){var l=e.__unsignedDigit(0).toString(t);return !1===_&&e.sign&&(l="-"+l),l}var g=30*n-a.__clz30(e.__digit(n-1)),o=a.__kMaxBitsPerChar[t],u=o-1,s=g*a.__kBitsPerCharTableMultiplier;s+=u-1,s=0|s/u;var r,d,h=s+1>>1,b=a.exponentiate(a.__oneDigit(t,!1),a.__oneDigit(h,!1)),m=b.__unsignedDigit(0);if(1===b.length&&32767>=m){r=new a(e.length,!1),r.__initializeDigits();for(var c,v=0,y=2*e.length-1;0<=y;y--)c=v<<15|e.__halfDigit(y),r.__setHalfDigit(y,0|c/m),v=0|c%m;d=v.toString(t);}else {var f=a.__absoluteDivLarge(e,b,!0,!0);r=f.quotient;var D=f.remainder.__trim();d=a.__toStringGeneric(D,t,!0);}r.__trim();for(var p=a.__toStringGeneric(r,t,!0);d.length<h;)d="0"+d;return !1===_&&e.sign&&(p="-"+p),p+d}},{key:"__unequalSign",value:function(e){return e?-1:1}},{key:"__absoluteGreater",value:function(e){return e?-1:1}},{key:"__absoluteLess",value:function(e){return e?1:-1}},{key:"__compareToBigInt",value:function(e,t){var i=e.sign;if(i!==t.sign)return a.__unequalSign(i);var _=a.__absoluteCompare(e,t);return 0<_?a.__absoluteGreater(i):0>_?a.__absoluteLess(i):0}},{key:"__compareToNumber",value:function(e,i){if(a.__isOneDigitInt(i)){var _=e.sign,n=0>i;if(_!==n)return a.__unequalSign(_);if(0===e.length){if(n)throw new Error("implementation bug");return 0===i?0:-1}if(1<e.length)return a.__absoluteGreater(_);var l=t(i),g=e.__unsignedDigit(0);return g>l?a.__absoluteGreater(_):g<l?a.__absoluteLess(_):0}return a.__compareToDouble(e,i)}},{key:"__compareToDouble",value:function(e,t){if(t!==t)return t;if(t===1/0)return -1;if(t===-Infinity)return 1;var i=e.sign;if(i!==0>t)return a.__unequalSign(i);if(0===t)throw new Error("implementation bug: should be handled elsewhere");if(0===e.length)return -1;a.__kBitConversionDouble[0]=t;var _=2047&a.__kBitConversionInts[1]>>>20;if(2047==_)throw new Error("implementation bug: handled elsewhere");var n=_-1023;if(0>n)return a.__absoluteGreater(i);var l=e.length,g=e.__digit(l-1),o=a.__clz30(g),u=30*l-o,s=n+1;if(u<s)return a.__absoluteLess(i);if(u>s)return a.__absoluteGreater(i);var r=1048576|1048575&a.__kBitConversionInts[1],d=a.__kBitConversionInts[0],h=20,b=29-o;if(b!==(0|(u-1)%30))throw new Error("implementation bug");var m,c=0;if(b<h){var v=h-b;c=v+32,m=r>>>v,r=r<<32-v|d>>>v,d<<=32-v;}else if(b===h)c=32,m=r,r=d,d=0;else {var y=b-h;c=32-y,m=r<<y|d>>>32-y,r=d<<y,d=0;}if(g>>>=0,m>>>=0,g>m)return a.__absoluteGreater(i);if(g<m)return a.__absoluteLess(i);for(var f=l-2;0<=f;f--){0<c?(c-=30,m=r>>>2,r=r<<30|d>>>2,d<<=30):m=0;var D=e.__unsignedDigit(f);if(D>m)return a.__absoluteGreater(i);if(D<m)return a.__absoluteLess(i)}if(0!==r||0!==d){if(0===c)throw new Error("implementation bug");return a.__absoluteLess(i)}return 0}},{key:"__equalToNumber",value:function(e,i){return a.__isOneDigitInt(i)?0===i?0===e.length:1===e.length&&e.sign===0>i&&e.__unsignedDigit(0)===t(i):0===a.__compareToDouble(e,i)}},{key:"__comparisonResultToBool",value:function(e,t){return 0===t?0>e:1===t?0>=e:2===t?0<e:3===t?0<=e:void 0}},{key:"__compare",value:function(e,t,i){if(e=a.__toPrimitive(e),t=a.__toPrimitive(t),"string"==typeof e&&"string"==typeof t)switch(i){case 0:return e<t;case 1:return e<=t;case 2:return e>t;case 3:return e>=t;}if(a.__isBigInt(e)&&"string"==typeof t)return t=a.__fromString(t),null!==t&&a.__comparisonResultToBool(a.__compareToBigInt(e,t),i);if("string"==typeof e&&a.__isBigInt(t))return e=a.__fromString(e),null!==e&&a.__comparisonResultToBool(a.__compareToBigInt(e,t),i);if(e=a.__toNumeric(e),t=a.__toNumeric(t),a.__isBigInt(e)){if(a.__isBigInt(t))return a.__comparisonResultToBool(a.__compareToBigInt(e,t),i);if("number"!=typeof t)throw new Error("implementation bug");return a.__comparisonResultToBool(a.__compareToNumber(e,t),i)}if("number"!=typeof e)throw new Error("implementation bug");if(a.__isBigInt(t))return a.__comparisonResultToBool(a.__compareToNumber(t,e),2^i);if("number"!=typeof t)throw new Error("implementation bug");return 0===i?e<t:1===i?e<=t:2===i?e>t:3===i?e>=t:void 0}},{key:"__absoluteAdd",value:function(e,t,_){if(e.length<t.length)return a.__absoluteAdd(t,e,_);if(0===e.length)return e;if(0===t.length)return e.sign===_?e:a.unaryMinus(e);var n=e.length;(0===e.__clzmsd()||t.length===e.length&&0===t.__clzmsd())&&n++;for(var l,g=new a(n,_),o=0,u=0;u<t.length;u++)l=e.__digit(u)+t.__digit(u)+o,o=l>>>30,g.__setDigit(u,1073741823&l);for(;u<e.length;u++){var s=e.__digit(u)+o;o=s>>>30,g.__setDigit(u,1073741823&s);}return u<g.length&&g.__setDigit(u,o),g.__trim()}},{key:"__absoluteSub",value:function(e,t,_){if(0===e.length)return e;if(0===t.length)return e.sign===_?e:a.unaryMinus(e);for(var n,l=new a(e.length,_),g=0,o=0;o<t.length;o++)n=e.__digit(o)-t.__digit(o)-g,g=1&n>>>30,l.__setDigit(o,1073741823&n);for(;o<e.length;o++){var u=e.__digit(o)-g;g=1&u>>>30,l.__setDigit(o,1073741823&u);}return l.__trim()}},{key:"__absoluteAddOne",value:function(e,t){var _=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,n=e.length;null===_?_=new a(n,t):_.sign=t;for(var l,g=1,o=0;o<n;o++)l=e.__digit(o)+g,g=l>>>30,_.__setDigit(o,1073741823&l);return 0!==g&&_.__setDigitGrow(n,1),_}},{key:"__absoluteSubOne",value:function(e,t){var _=e.length;t=t||_;for(var n,l=new a(t,!1),g=1,o=0;o<_;o++)n=e.__digit(o)-g,g=1&n>>>30,l.__setDigit(o,1073741823&n);if(0!==g)throw new Error("implementation bug");for(var u=_;u<t;u++)l.__setDigit(u,0);return l}},{key:"__absoluteAnd",value:function(e,t){var _=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,n=e.length,l=t.length,g=l;if(n<l){g=n;var o=e,u=n;e=t,n=l,t=o,l=u;}var s=g;null===_?_=new a(s,!1):s=_.length;for(var r=0;r<g;r++)_.__setDigit(r,e.__digit(r)&t.__digit(r));for(;r<s;r++)_.__setDigit(r,0);return _}},{key:"__absoluteAndNot",value:function(e,t){var _=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,n=e.length,l=t.length,g=l;n<l&&(g=n);var o=n;null===_?_=new a(o,!1):o=_.length;for(var u=0;u<g;u++)_.__setDigit(u,e.__digit(u)&~t.__digit(u));for(;u<n;u++)_.__setDigit(u,e.__digit(u));for(;u<o;u++)_.__setDigit(u,0);return _}},{key:"__absoluteOr",value:function(e,t){var _=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,n=e.length,l=t.length,g=l;if(n<l){g=n;var o=e,u=n;e=t,n=l,t=o,l=u;}var s=n;null===_?_=new a(s,!1):s=_.length;for(var r=0;r<g;r++)_.__setDigit(r,e.__digit(r)|t.__digit(r));for(;r<n;r++)_.__setDigit(r,e.__digit(r));for(;r<s;r++)_.__setDigit(r,0);return _}},{key:"__absoluteXor",value:function(e,t){var _=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,n=e.length,l=t.length,g=l;if(n<l){g=n;var o=e,u=n;e=t,n=l,t=o,l=u;}var s=n;null===_?_=new a(s,!1):s=_.length;for(var r=0;r<g;r++)_.__setDigit(r,e.__digit(r)^t.__digit(r));for(;r<n;r++)_.__setDigit(r,e.__digit(r));for(;r<s;r++)_.__setDigit(r,0);return _}},{key:"__absoluteCompare",value:function(e,t){var _=e.length-t.length;if(0!=_)return _;for(var n=e.length-1;0<=n&&e.__digit(n)===t.__digit(n);)n--;return 0>n?0:e.__unsignedDigit(n)>t.__unsignedDigit(n)?1:-1}},{key:"__multiplyAccumulate",value:function(e,t,_,n){if(0!==t){for(var l=32767&t,g=t>>>15,o=0,u=0,s=0;s<e.length;s++,n++){var r=_.__digit(n),d=e.__digit(s),h=32767&d,b=d>>>15,m=a.__imul(h,l),c=a.__imul(h,g),v=a.__imul(b,l),y=a.__imul(b,g);r+=u+m+o,o=r>>>30,r&=1073741823,r+=((32767&c)<<15)+((32767&v)<<15),o+=r>>>30,u=y+(c>>>15)+(v>>>15),_.__setDigit(n,1073741823&r);}for(;0!==o||0!==u;n++){var f=_.__digit(n);f+=o+u,u=0,o=f>>>30,_.__setDigit(n,1073741823&f);}}}},{key:"__internalMultiplyAdd",value:function(e,t,_,l,g){for(var o=_,u=0,s=0;s<l;s++){var d=e.__digit(s),h=a.__imul(32767&d,t),b=a.__imul(d>>>15,t),m=h+((32767&b)<<15)+u+o;o=m>>>30,u=b>>>15,g.__setDigit(s,1073741823&m);}if(g.length>l)for(g.__setDigit(l++,o+u);l<g.length;)g.__setDigit(l++,0);else if(0!==o+u)throw new Error("implementation bug")}},{key:"__absoluteDivSmall",value:function(e,t){var _=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null;null===_&&(_=new a(e.length,!1));for(var n=0,l=2*e.length-1;0<=l;l-=2){var g=(n<<15|e.__halfDigit(l))>>>0,o=0|g/t;n=0|g%t,g=(n<<15|e.__halfDigit(l-1))>>>0;var u=0|g/t;n=0|g%t,_.__setDigit(l>>>1,o<<15|u);}return _}},{key:"__absoluteModSmall",value:function(e,t){for(var _,n=0,l=2*e.length-1;0<=l;l--)_=(n<<15|e.__halfDigit(l))>>>0,n=0|_%t;return n}},{key:"__absoluteDivLarge",value:function(e,t,i,_){var l=t.__halfDigitLength(),n=t.length,g=e.__halfDigitLength()-l,o=null;i&&(o=new a(g+2>>>1,!1),o.__initializeDigits());var s=new a(l+2>>>1,!1);s.__initializeDigits();var r=a.__clz15(t.__halfDigit(l-1));0<r&&(t=a.__specialLeftShift(t,r,0));for(var d=a.__specialLeftShift(e,r,1),u=t.__halfDigit(l-1),h=0,b=g;0<=b;b--){var m=32767,v=d.__halfDigit(b+l);if(v!==u){var y=(v<<15|d.__halfDigit(b+l-1))>>>0;m=0|y/u;for(var f=0|y%u,D=t.__halfDigit(l-2),p=d.__halfDigit(b+l-2);a.__imul(m,D)>>>0>(f<<16|p)>>>0&&(m--,f+=u,!(32767<f)););}a.__internalMultiplyAdd(t,m,0,n,s);var k=d.__inplaceSub(s,b,l+1);0!==k&&(k=d.__inplaceAdd(t,b,l),d.__setHalfDigit(b+l,32767&d.__halfDigit(b+l)+k),m--),i&&(1&b?h=m<<15:o.__setDigit(b>>>1,h|m));}if(_)return d.__inplaceRightShift(r),i?{quotient:o,remainder:d}:d;if(i)return o;throw new Error("unreachable")}},{key:"__clz15",value:function(e){return a.__clz30(e)-15}},{key:"__specialLeftShift",value:function(e,t,_){var l=e.length,n=new a(l+_,!1);if(0===t){for(var g=0;g<l;g++)n.__setDigit(g,e.__digit(g));return 0<_&&n.__setDigit(l,0),n}for(var o,u=0,s=0;s<l;s++)o=e.__digit(s),n.__setDigit(s,1073741823&o<<t|u),u=o>>>30-t;return 0<_&&n.__setDigit(l,u),n}},{key:"__leftShiftByAbsolute",value:function(e,t){var _=a.__toShiftAmount(t);if(0>_)throw new RangeError("BigInt too big");var n=0|_/30,l=_%30,g=e.length,o=0!==l&&0!=e.__digit(g-1)>>>30-l,u=g+n+(o?1:0),s=new a(u,e.sign);if(0===l){for(var r=0;r<n;r++)s.__setDigit(r,0);for(;r<u;r++)s.__setDigit(r,e.__digit(r-n));}else {for(var h=0,b=0;b<n;b++)s.__setDigit(b,0);for(var m,c=0;c<g;c++)m=e.__digit(c),s.__setDigit(c+n,1073741823&m<<l|h),h=m>>>30-l;if(o)s.__setDigit(g+n,h);else if(0!==h)throw new Error("implementation bug")}return s.__trim()}},{key:"__rightShiftByAbsolute",value:function(e,t){var _=e.length,n=e.sign,l=a.__toShiftAmount(t);if(0>l)return a.__rightShiftByMaximum(n);var g=0|l/30,o=l%30,u=_-g;if(0>=u)return a.__rightShiftByMaximum(n);var s=!1;if(n){if(0!=(e.__digit(g)&(1<<o)-1))s=!0;else for(var r=0;r<g;r++)if(0!==e.__digit(r)){s=!0;break}}if(s&&0===o){var h=e.__digit(_-1);0==~h&&u++;}var b=new a(u,n);if(0===o){b.__setDigit(u-1,0);for(var m=g;m<_;m++)b.__setDigit(m-g,e.__digit(m));}else {for(var c,v=e.__digit(g)>>>o,y=_-g-1,f=0;f<y;f++)c=e.__digit(f+g+1),b.__setDigit(f,1073741823&c<<30-o|v),v=c>>>o;b.__setDigit(y,v);}return s&&(b=a.__absoluteAddOne(b,!0,b)),b.__trim()}},{key:"__rightShiftByMaximum",value:function(e){return e?a.__oneDigit(1,!0):a.__zero()}},{key:"__toShiftAmount",value:function(e){if(1<e.length)return -1;var t=e.__unsignedDigit(0);return t>a.__kMaxLengthBits?-1:t}},{key:"__toPrimitive",value:function(e){var t=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"default";if("object"!==i(e))return e;if(e.constructor===a)return e;if("undefined"!=typeof Symbol&&"symbol"===i(Symbol.toPrimitive)){var _=e[Symbol.toPrimitive];if(_){var n=_(t);if("object"!==i(n))return n;throw new TypeError("Cannot convert object to primitive value")}}var l=e.valueOf;if(l){var g=l.call(e);if("object"!==i(g))return g}var o=e.toString;if(o){var u=o.call(e);if("object"!==i(u))return u}throw new TypeError("Cannot convert object to primitive value")}},{key:"__toNumeric",value:function(e){return a.__isBigInt(e)?e:+e}},{key:"__isBigInt",value:function(e){return "object"===i(e)&&null!==e&&e.constructor===a}},{key:"__truncateToNBits",value:function(e,t){for(var _=0|(e+29)/30,n=new a(_,t.sign),l=_-1,g=0;g<l;g++)n.__setDigit(g,t.__digit(g));var o=t.__digit(l);if(0!=e%30){var u=32-e%30;o=o<<u>>>u;}return n.__setDigit(l,o),n.__trim()}},{key:"__truncateAndSubFromPowerOfTwo",value:function(e,t,_){for(var n=Math.min,l,g=0|(e+29)/30,o=new a(g,_),u=0,s=g-1,d=0,h=n(s,t.length);u<h;u++)l=0-t.__digit(u)-d,d=1&l>>>30,o.__setDigit(u,1073741823&l);for(;u<s;u++)o.__setDigit(u,0|1073741823&-d);var b,m=s<t.length?t.__digit(s):0,c=e%30;if(0===c)b=0-m-d,b&=1073741823;else {var v=32-c;m=m<<v>>>v;var y=1<<32-v;b=y-m-d,b&=y-1;}return o.__setDigit(s,b),o.__trim()}},{key:"__digitPow",value:function(e,t){for(var i=1;0<t;)1&t&&(i*=e),t>>>=1,e*=e;return i}},{key:"__isOneDigitInt",value:function(e){return (1073741823&e)===e}}]),a}(h(Array));return S.__kMaxLength=33554432,S.__kMaxLengthBits=S.__kMaxLength<<5,S.__kMaxBitsPerChar=[0,0,32,51,64,75,83,90,96,102,107,111,115,119,122,126,128,131,134,136,139,141,143,145,147,149,151,153,154,156,158,159,160,162,163,165,166],S.__kBitsPerCharTableShift=5,S.__kBitsPerCharTableMultiplier=1<<S.__kBitsPerCharTableShift,S.__kConversionChars=["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"],S.__kBitConversionBuffer=new ArrayBuffer(8),S.__kBitConversionDouble=new Float64Array(S.__kBitConversionBuffer),S.__kBitConversionInts=new Int32Array(S.__kBitConversionBuffer),S.__clz30=t?function(e){return t(e)-2}:function(e){var t=Math.LN2,i=Math.log;return 0===e?30:0|29-(0|i(e>>>0)/t)},S.__imul=e||function(e,t){return 0|e*t},S});

    });

    const t={};function MakeIntrinsicClass(e,t){Object.defineProperty(e.prototype,Symbol.toStringTag,{value:t,writable:!1,enumerable:!1,configurable:!0});for(const t of Object.getOwnPropertyNames(e)){const o=Object.getOwnPropertyDescriptor(e,t);o.configurable&&o.enumerable&&(o.enumerable=!1,Object.defineProperty(e,t,o));}for(const t of Object.getOwnPropertyNames(e.prototype)){const o=Object.getOwnPropertyDescriptor(e.prototype,t);o.configurable&&o.enumerable&&(o.enumerable=!1,Object.defineProperty(e.prototype,t,o));}DefineIntrinsic(t,e),DefineIntrinsic(`${t}.prototype`,e.prototype);}function DefineIntrinsic(e,o){const n=`%${e}%`;if(void 0!==t[n])throw new Error(`intrinsic ${e} already exists`);t[n]=o;}function GetIntrinsic(e){return t[e]}const o="slot-epochNanoSeconds",n="slot-timezone-identifier",r$1="slot-year",a="slot-month",i$1="slot-day",s="slot-hour",l="slot-minute",d="slot-second",m="slot-millisecond",c="slot-microsecond",h="slot-nanosecond",T="slot-calendar",u="slot-cached-instant",p="slot-time-zone",f="slot-years",y="slot-months",S="slot-weeks",g="slot-days",w="slot-hours",I="slot-minutes",G="slot-seconds",D="slot-milliseconds",v="slot-microseconds",O="slot-nanoseconds",C="slot-calendar-identifier",E=new WeakMap;function CreateSlots(e){E.set(e,Object.create(null));}function GetSlots(e){return E.get(e)}function HasSlot(e,...t){if(!e||"object"!=typeof e)return !1;const o=GetSlots(e);return !!o&&t.reduce(((e,t)=>e&&t in o),!0)}function GetSlot(e,t){const o=GetSlots(e)[t];if(void 0===o)throw new TypeError(`Missing internal slot ${t}`);return o}function SetSlot(e,t,o){GetSlots(e)[t]=o;}const b=Array.prototype.includes,R=Array.prototype.push,M=globalThis.Intl.DateTimeFormat,Z=Array.prototype.sort,F=Math.abs,Y=Math.floor,P=Object.entries,j=Object.keys,B={};class Calendar{constructor(e){if(arguments.length<1)throw new RangeError("missing argument: id is required");const t=ToString(e);if(!IsBuiltinCalendar(t))throw new RangeError(`invalid calendar identifier ${t}`);CreateSlots(this),SetSlot(this,C,t);}get id(){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return ToString(this)}dateFromFields(e,t){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid fields");const o=GetOptionsObject(t);return B[GetSlot(this,C)].dateFromFields(e,o,this)}yearMonthFromFields(e,t){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid fields");const o=GetOptionsObject(t);return B[GetSlot(this,C)].yearMonthFromFields(e,o,this)}monthDayFromFields(e,t){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid fields");const o=GetOptionsObject(t);return B[GetSlot(this,C)].monthDayFromFields(e,o,this)}fields(e){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");const t=[],o=new Set(["year","month","monthCode","day","hour","minute","second","millisecond","microsecond","nanosecond"]);for(const n of e){if("string"!=typeof n)throw new TypeError("invalid fields");if(!o.has(n))throw new RangeError(`invalid field name ${n}`);o.delete(n),R.call(t,n);}return B[GetSlot(this,C)].fields(t)}mergeFields(e,t){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return B[GetSlot(this,C)].mergeFields(e,t)}dateAdd(e,t,o){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");const n=ToTemporalDate(e),r=ToTemporalDuration(t),a=ToTemporalOverflow(GetOptionsObject(o)),{days:i}=BalanceDuration(GetSlot(r,g),GetSlot(r,w),GetSlot(r,I),GetSlot(r,G),GetSlot(r,D),GetSlot(r,v),GetSlot(r,O),"day");return B[GetSlot(this,C)].dateAdd(n,GetSlot(r,f),GetSlot(r,y),GetSlot(r,S),i,a,this)}dateUntil(e,t,o){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");const n=ToTemporalDate(e),r=ToTemporalDate(t),a=ToLargestTemporalUnit(GetOptionsObject(o),"auto",["hour","minute","second","millisecond","microsecond","nanosecond"],"day"),{years:i,months:s,weeks:l,days:d}=B[GetSlot(this,C)].dateUntil(n,r,a);return new(GetIntrinsic("%Temporal.Duration%"))(i,s,l,d,0,0,0,0,0,0)}year(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalYearMonth(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].year(t)}month(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");if(IsTemporalMonthDay(t))throw new TypeError("use monthCode on PlainMonthDay instead");return IsTemporalYearMonth(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].month(t)}monthCode(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalYearMonth(t)||IsTemporalMonthDay(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].monthCode(t)}day(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalMonthDay(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].day(t)}era(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalYearMonth(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].era(t)}eraYear(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalYearMonth(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].eraYear(t)}dayOfWeek(e){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");const t=ToTemporalDate(e);return B[GetSlot(this,C)].dayOfWeek(t)}dayOfYear(e){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");const t=ToTemporalDate(e);return B[GetSlot(this,C)].dayOfYear(t)}weekOfYear(e){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");const t=ToTemporalDate(e);return B[GetSlot(this,C)].weekOfYear(t)}daysInWeek(e){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");const t=ToTemporalDate(e);return B[GetSlot(this,C)].daysInWeek(t)}daysInMonth(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalYearMonth(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].daysInMonth(t)}daysInYear(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalYearMonth(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].daysInYear(t)}monthsInYear(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalYearMonth(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].monthsInYear(t)}inLeapYear(e){let t=e;if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return IsTemporalYearMonth(t)||(t=ToTemporalDate(t)),B[GetSlot(this,C)].inLeapYear(t)}toString(){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return GetSlot(this,C)}toJSON(){if(!IsTemporalCalendar(this))throw new TypeError("invalid receiver");return ToString(this)}static from(e){return ToTemporalCalendar(e)}}function monthCodeNumberPart(e){if(!e.startsWith("M"))throw new RangeError(`Invalid month code: ${e}.  Month codes must start with M.`);const t=+e.slice(1);if(isNaN(t))throw new RangeError(`Invalid month code: ${e}`);return t}function buildMonthCode(e,t=!1){return `M${e.toString().padStart(2,"0")}${t?"L":""}`}function resolveNonLunisolarMonth(e,t,o=12){let{month:n,monthCode:r}=e;if(void 0===r){if(void 0===n)throw new TypeError("Either month or monthCode are required");"reject"===t&&RejectToRange(n,1,o),"constrain"===t&&(n=ConstrainToRange(n,1,o)),r=buildMonthCode(n);}else {const e=monthCodeNumberPart(r);if(void 0!==n&&n!==e)throw new RangeError(`monthCode ${r} and month ${n} must match if both are present`);if(r!==buildMonthCode(e))throw new RangeError(`Invalid month code: ${r}`);if(n=e,n<1||n>o)throw new RangeError(`Invalid monthCode: ${r}`)}return {...e,month:n,monthCode:r}}MakeIntrinsicClass(Calendar,"Temporal.Calendar"),DefineIntrinsic("Temporal.Calendar.from",Calendar.from),B.iso8601={dateFromFields(e,t,o){const n=ToTemporalOverflow(t);let r=PrepareTemporalFields(e,[["day"],["month",void 0],["monthCode",void 0],["year"]]);r=resolveNonLunisolarMonth(r);let{year:a,month:i,day:s}=r;return ({year:a,month:i,day:s}=RegulateISODate(a,i,s,n)),CreateTemporalDate(a,i,s,o)},yearMonthFromFields(e,t,o){const n=ToTemporalOverflow(t);let r=PrepareTemporalFields(e,[["month",void 0],["monthCode",void 0],["year"]]);r=resolveNonLunisolarMonth(r);let{year:a,month:i}=r;return ({year:a,month:i}=function RegulateISOYearMonth(e,t,o){let n=e,r=t;const a=1;switch(o){case"reject":RejectISODate(n,r,a);break;case"constrain":({year:n,month:r}=ConstrainISODate(n,r));}return {year:n,month:r}}(a,i,n)),CreateTemporalYearMonth(a,i,o,1)},monthDayFromFields(e,t,o){const n=ToTemporalOverflow(t);let r=PrepareTemporalFields(e,[["day"],["month",void 0],["monthCode",void 0],["year",void 0]]);if(void 0!==r.month&&void 0===r.year&&void 0===r.monthCode)throw new TypeError("either year or monthCode required with month");const a=void 0===r.monthCode;r=resolveNonLunisolarMonth(r);let{month:i,day:s,year:l}=r;return ({month:i,day:s}=RegulateISODate(a?l:1972,i,s,n)),CreateTemporalMonthDay(i,s,o,1972)},fields:e=>e,mergeFields(e,t){const o={};for(const t of j(e))"month"!==t&&"monthCode"!==t&&(o[t]=e[t]);const n=j(t);for(const e of n)o[e]=t[e];if(!b.call(n,"month")&&!b.call(n,"monthCode")){const{month:t,monthCode:n}=e;void 0!==t&&(o.month=t),void 0!==n&&(o.monthCode=n);}return o},dateAdd(e,t,o,n,s,l,d){let m=GetSlot(e,r$1),c=GetSlot(e,a),h=GetSlot(e,i$1);return ({year:m,month:c,day:h}=AddISODate(m,c,h,t,o,n,s,l)),CreateTemporalDate(m,c,h,d)},dateUntil:(e,t,o)=>DifferenceISODate(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1),GetSlot(t,r$1),GetSlot(t,a),GetSlot(t,i$1),o),year:e=>GetSlot(e,r$1),era(){},eraYear(){},month:e=>GetSlot(e,a),monthCode:e=>buildMonthCode(GetSlot(e,a)),day:e=>GetSlot(e,i$1),dayOfWeek:e=>DayOfWeek(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1)),dayOfYear:e=>DayOfYear(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1)),weekOfYear:e=>function WeekOfYear(e,t,o){const n=DayOfYear(e,t,o),r=DayOfWeek(e,t,o)||7,a=DayOfWeek(e,1,1),i=de((n-r+10)/7);if(i<1)return 5===a||6===a&&LeapYear(e-1)?53:52;if(53===i&&(LeapYear(e)?366:365)-n<4-r)return 1;return i}(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1)),daysInWeek:()=>7,daysInMonth:e=>ISODaysInMonth(GetSlot(e,r$1),GetSlot(e,a)),daysInYear(e){let t=e;return HasSlot(t,r$1)||(t=ToTemporalDate(t)),LeapYear(GetSlot(t,r$1))?366:365},monthsInYear:()=>12,inLeapYear(e){let t=e;return HasSlot(t,r$1)||(t=ToTemporalDate(t)),LeapYear(GetSlot(t,r$1))}};class OneObjectCache{constructor(e){if(this.map=new Map,this.calls=0,this.hits=0,this.misses=0,this.now=globalThis.performance?globalThis.performance.now():Date.now(),void 0!==e){let t=0;for(const o of e.map.entries()){if(++t>OneObjectCache.MAX_CACHE_ENTRIES)break;this.map.set(...o);}}}get(e){const t=this.map.get(e);return t&&(this.hits++,this.report()),this.calls++,t}set(e,t){this.map.set(e,t),this.misses++,this.report();}report(){}setObject(e){if(OneObjectCache.objectMap.get(e))throw new RangeError("object already cached");OneObjectCache.objectMap.set(e,this),this.report();}static getCacheForObject(e){let t=OneObjectCache.objectMap.get(e);return t||(t=new OneObjectCache,OneObjectCache.objectMap.set(e,t)),t}}function toUtcIsoDateString({isoYear:e,isoMonth:t,isoDay:o}){return `${ISOYearString(e)}-${ISODateTimePartString(t)}-${ISODateTimePartString(o)}T00:00Z`}function simpleDateDiff(e,t){return {years:e.year-t.year,months:e.month-t.month,days:e.day-t.day}}OneObjectCache.objectMap=new WeakMap,OneObjectCache.MAX_CACHE_ENTRIES=1e3;class HelperBase{constructor(){this.eraLength="short",this.hasEra=!0;}getFormatter(){return void 0===this.formatter&&(this.formatter=new M(`en-US-u-ca-${this.id}`,{day:"numeric",month:"numeric",year:"numeric",era:this.eraLength,timeZone:"UTC"})),this.formatter}isoToCalendarDate(e,t){const{year:o,month:n,day:r}=e,a=JSON.stringify({func:"isoToCalendarDate",isoYear:o,isoMonth:n,isoDay:r,id:this.id}),i=t.get(a);if(i)return i;const s=this.getFormatter();let l,d;try{d=toUtcIsoDateString({isoYear:o,isoMonth:n,isoDay:r}),l=s.formatToParts(new Date(d));}catch(e){throw new RangeError(`Invalid ISO date: ${JSON.stringify({isoYear:o,isoMonth:n,isoDay:r})}`)}const m={};for(let{type:e,value:t}of l){if("year"===e&&(m.eraYear=+t),"relatedYear"===e&&(m.eraYear=+t),"month"===e){const e=/^([0-9]*)(.*?)$/.exec(t);if(!e||3!=e.length||!e[1]&&!e[2])throw new RangeError(`Unexpected month: ${t}`);if(m.month=e[1]?+e[1]:1,m.month<1)throw new RangeError(`Invalid month ${t} from ${d}[u-ca-${this.id}] (probably due to https://bugs.chromium.org/p/v8/issues/detail?id=10527)`);if(m.month>13)throw new RangeError(`Invalid month ${t} from ${d}[u-ca-${this.id}] (probably due to https://bugs.chromium.org/p/v8/issues/detail?id=10529)`);e[2]&&(m.monthExtra=e[2]);}"day"===e&&(m.day=+t),this.hasEra&&"era"===e&&null!=t&&""!==t&&(t=t.split(" (")[0],m.era=t.normalize("NFD").replace(/[^-0-9 \p{L}]/gu,"").replace(" ","-").toLowerCase());}if(void 0===m.eraYear)throw new RangeError(`Intl.DateTimeFormat.formatToParts lacks relatedYear in ${this.id} calendar. Try Node 14+ or modern browsers.`);if(this.reviseIntlEra){const{era:t,eraYear:o}=this.reviseIntlEra(m,e);m.era=t,m.eraYear=o;}this.checkIcuBugs&&this.checkIcuBugs(e);const c=this.adjustCalendarDate(m,t,"constrain",!0);if(void 0===c.year)throw new RangeError(`Missing year converting ${JSON.stringify(e)}`);if(void 0===c.month)throw new RangeError(`Missing month converting ${JSON.stringify(e)}`);if(void 0===c.day)throw new RangeError(`Missing day converting ${JSON.stringify(e)}`);return t.set(a,c),["constrain","reject"].forEach((o=>{const n=JSON.stringify({func:"calendarToIsoDate",year:c.year,month:c.month,day:c.day,overflow:o,id:this.id});t.set(n,e);})),c}validateCalendarDate(e){const{era:t,month:o,year:n,day:r,eraYear:a,monthCode:i,monthExtra:s}=e;if(void 0!==s)throw new RangeError("Unexpected `monthExtra` value");if(void 0===n&&void 0===a)throw new TypeError("year or eraYear is required");if(void 0===o&&void 0===i)throw new TypeError("month or monthCode is required");if(void 0===r)throw new RangeError("Missing day");if(void 0!==i){if("string"!=typeof i)throw new RangeError("monthCode must be a string, not "+typeof i);if(!/^M([01]?\d)(L?)$/.test(i))throw new RangeError(`Invalid monthCode: ${i}`)}if(this.constantEra){if(void 0!==t&&t!==this.constantEra)throw new RangeError(`era must be ${this.constantEra}, not ${t}`);if(void 0!==a&&void 0!==n&&a!==n)throw new RangeError(`eraYear ${a} does not match year ${n}`)}}adjustCalendarDate(e,t,o="constrain",n=!1){if("lunisolar"===this.calendarType)throw new RangeError("Override required for lunisolar calendars");let r=e;if(this.validateCalendarDate(r),this.constantEra){const{year:e,eraYear:t}=r;r={...r,era:this.constantEra,year:void 0!==e?e:t,eraYear:void 0!==t?t:e};}const a=this.monthsInYear(r,t);let{month:i,monthCode:s}=r;return ({month:i,monthCode:s}=resolveNonLunisolarMonth(r,o,a)),{...r,month:i,monthCode:s}}regulateMonthDayNaive(e,t,o){const n=this.monthsInYear(e,o);let{month:r,day:a}=e;return "reject"===t?(RejectToRange(r,1,n),RejectToRange(a,1,this.maximumMonthLength(e))):(r=ConstrainToRange(r,1,n),a=ConstrainToRange(a,1,this.maximumMonthLength({...e,month:r}))),{...e,month:r,day:a}}calendarToIsoDate(e,t="constrain",o){const n=e;let r=this.adjustCalendarDate(e,o,t,!1);r=this.regulateMonthDayNaive(r,t,o);const{year:a,month:i,day:s}=r,l=JSON.stringify({func:"calendarToIsoDate",year:a,month:i,day:s,overflow:t,id:this.id});let d,m=o.get(l);if(m)return m;if(void 0!==n.year&&void 0!==n.month&&void 0!==n.day&&(n.year!==r.year||n.month!==r.month||n.day!==r.day)&&(d=JSON.stringify({func:"calendarToIsoDate",year:n.year,month:n.month,day:n.day,overflow:t,id:this.id}),m=o.get(d),m))return m;let c=this.estimateIsoDate({year:a,month:i,day:s});const calculateSameMonthResult=e=>{let n=this.addDaysIso(c,e);if(r.day>this.minimumMonthLength(r)){let e=this.isoToCalendarDate(n,o);for(;e.month!==i||e.year!==a;){if("reject"===t)throw new RangeError(`day ${s} does not exist in month ${i} of year ${a}`);n=this.addDaysIso(n,-1),e=this.isoToCalendarDate(n,o);}}return n};let h=0,T=this.isoToCalendarDate(c,o),u=simpleDateDiff(r,T);if(0!==u.years||0!==u.months||0!==u.days){const e=365*u.years+30*u.months+u.days;c=this.addDaysIso(c,e),T=this.isoToCalendarDate(c,o),u=simpleDateDiff(r,T),0===u.years&&0===u.months?c=calculateSameMonthResult(u.days):h=this.compareCalendarDates(r,T);}let p=8,f=!1;for(;h;){c=this.addDaysIso(c,h*p);const e=T;T=this.isoToCalendarDate(c,o);const a=h;if(h=this.compareCalendarDates(r,T),h)if(u=simpleDateDiff(r,T),0===u.years&&0===u.months)c=calculateSameMonthResult(u.days),h=0,f=r.day>this.minimumMonthLength(r);else if(a&&h!==a)if(p>1)p/=2;else {if("reject"===t)throw new RangeError(`Can't find ISO date from calendar date: ${JSON.stringify({...n})}`);this.compareCalendarDates(T,e)>0&&(c=this.addDaysIso(c,-1)),f=!0,h=0;}}if(o.set(l,c),d&&o.set(d,c),void 0===r.year||void 0===r.month||void 0===r.day||void 0===r.monthCode||this.hasEra&&(void 0===r.era||void 0===r.eraYear))throw new RangeError("Unexpected missing property");if(!f){const e=JSON.stringify({func:"isoToCalendarDate",isoYear:c.year,isoMonth:c.month,isoDay:c.day,id:this.id});o.set(e,r);}return c}temporalToCalendarDate(e,t){const o={year:GetSlot(e,r$1),month:GetSlot(e,a),day:GetSlot(e,i$1)};return this.isoToCalendarDate(o,t)}compareCalendarDates(e,t){const o=PrepareTemporalFields(e,[["day"],["month"],["year"]]),n=PrepareTemporalFields(t,[["day"],["month"],["year"]]);return o.year!==n.year?ComparisonResult(o.year-n.year):o.month!==n.month?ComparisonResult(o.month-n.month):o.day!==n.day?ComparisonResult(o.day-n.day):0}regulateDate(e,t="constrain",o){const n=this.calendarToIsoDate(e,t,o);return this.isoToCalendarDate(n,o)}addDaysIso(e,t){return AddISODate(e.year,e.month,e.day,0,0,0,t,"constrain")}addDaysCalendar(e,t,o){const n=this.calendarToIsoDate(e,"constrain",o),r=this.addDaysIso(n,t);return this.isoToCalendarDate(r,o)}addMonthsCalendar(e,t,o,n){let r=e;const{day:a}=r;for(let e=0,o=F(t);e<o;e++){const{month:e}=r,o=r,i=t<0?-Math.max(a,this.daysInPreviousMonth(r,n)):this.daysInMonth(r,n),s=this.calendarToIsoDate(r,"constrain",n);let l=this.addDaysIso(s,i);if(r=this.isoToCalendarDate(l,n),t>0){const t=this.monthsInYear(o,n);for(;r.month-1!=e%t;)l=this.addDaysIso(l,-1),r=this.isoToCalendarDate(l,n);}r.day!==a&&(r=this.regulateDate({...r,day:a},"constrain",n));}if("reject"===o&&r.day!==a)throw new RangeError(`Day ${a} does not exist in resulting calendar month`);return r}addCalendar(e,{years:t=0,months:o=0,weeks:n=0,days:r=0},a,i){const{year:s,month:l,day:d}=e,m=this.addMonthsCalendar({year:s+t,month:l,day:d},o,a,i),c=r+7*n;return this.addDaysCalendar(m,c,i)}untilCalendar(e,t,o,n){let r=0,a=0,i=0,s=0;switch(o){case"day":r=this.calendarDaysUntil(e,t,n);break;case"week":{const o=this.calendarDaysUntil(e,t,n);r=o%7,a=(o-r)/7;break}case"month":case"year":{const a=t.year-e.year,l=t.month-e.month,d=t.day-e.day,m=this.compareCalendarDates(t,e);if("year"===o&&a){s=l*m<0||0===l&&d*m<0?a-m:a;}let c,h=s?this.addCalendar(e,{years:s},"constrain",n):e;do{i+=m,c=h,h=this.addMonthsCalendar(c,m,"constrain",n),h.day!==e.day&&(h=this.regulateDate({...h,day:e.day},"constrain",n));}while(this.compareCalendarDates(t,h)*m>=0);i-=m;r=this.calendarDaysUntil(c,t,n);break}}return {years:s,months:i,weeks:a,days:r}}daysInMonth(e,t){const{day:o}=e,n=this.maximumMonthLength(e),r=this.minimumMonthLength(e);if(r===n)return r;const a=o<=n-r?n:r,i=this.calendarToIsoDate(e,"constrain",t),s=this.addDaysIso(i,a),l=this.isoToCalendarDate(s,t),d=this.addDaysIso(s,-l.day);return this.isoToCalendarDate(d,t).day}daysInPreviousMonth(e,t){const{day:o,month:n,year:r}=e;let a={year:n>1?r:r-1,month:n,day:1};const i=n>1?n-1:this.monthsInYear(a,t);a={...a,month:i};const s=this.minimumMonthLength(a),l=this.maximumMonthLength(a);if(s===l)return l;const d=this.calendarToIsoDate(e,"constrain",t),m=this.addDaysIso(d,-o);return this.isoToCalendarDate(m,t).day}startOfCalendarYear(e){return {year:e.year,month:1,day:1}}startOfCalendarMonth(e){return {year:e.year,month:e.month,day:1}}calendarDaysUntil(e,t,o){const n=this.calendarToIsoDate(e,"constrain",o),r=this.calendarToIsoDate(t,"constrain",o);return this.isoDaysUntil(n,r)}isoDaysUntil(e,t){return DifferenceISODate(e.year,e.month,e.day,t.year,t.month,t.day,"day").days}monthDayFromFields(e,t,o){let n,r,a,i,s,{year:l,month:d,monthCode:m,day:c,era:h,eraYear:T}=e;if(void 0===m){if(void 0===l&&(void 0===h||void 0===T))throw new TypeError("`monthCode`, `year`, or `era` and `eraYear` is required");({monthCode:m,year:l}=this.adjustCalendarDate({year:l,month:d,monthCode:m,day:c,era:h,eraYear:T},o,t));}const{year:u}=this.isoToCalendarDate({year:1972,month:1,day:1},o);for(let e=0;e<100;e++){const l=this.adjustCalendarDate({day:c,monthCode:m,year:u-e},o),d=this.calendarToIsoDate(l,"constrain",o),h=this.isoToCalendarDate(d,o);if(({year:n,month:r,day:a}=d),h.monthCode===m&&h.day===c)return {month:r,day:a,year:n};"constrain"===t&&(void 0===i||h.monthCode===i.monthCode&&h.day>i.day)&&(i=h,s=d);}if("constrain"===t&&void 0!==s)return s;throw new RangeError(`No recent ${this.id} year with monthCode ${m} and day ${c}`)}}class HebrewHelper extends HelperBase{constructor(){super(...arguments),this.id="hebrew",this.calendarType="lunisolar",this.months={Tishri:{leap:1,regular:1,monthCode:"M01",days:30},Heshvan:{leap:2,regular:2,monthCode:"M02",days:{min:29,max:30}},Kislev:{leap:3,regular:3,monthCode:"M03",days:{min:29,max:30}},Tevet:{leap:4,regular:4,monthCode:"M04",days:29},Shevat:{leap:5,regular:5,monthCode:"M05",days:30},Adar:{leap:void 0,regular:6,monthCode:"M06",days:29},"Adar I":{leap:6,regular:void 0,monthCode:"M05L",days:30},"Adar II":{leap:7,regular:void 0,monthCode:"M06",days:29},Nisan:{leap:8,regular:7,monthCode:"M07",days:30},Iyar:{leap:9,regular:8,monthCode:"M08",days:29},Sivan:{leap:10,regular:9,monthCode:"M09",days:30},Tamuz:{leap:11,regular:10,monthCode:"M10",days:29},Av:{leap:12,regular:11,monthCode:"M11",days:30},Elul:{leap:13,regular:12,monthCode:"M12",days:29}},this.hasEra=!1;}inLeapYear(e){const{year:t}=e;return (7*t+1)%19<7}monthsInYear(e){return this.inLeapYear(e)?13:12}minimumMonthLength(e){return this.minMaxMonthLength(e,"min")}maximumMonthLength(e){return this.minMaxMonthLength(e,"max")}minMaxMonthLength(e,t){const{month:o,year:n}=e,r=this.getMonthCode(n,o),a=P(this.months).find((e=>e[1].monthCode===r));if(void 0===a)throw new RangeError(`unmatched Hebrew month: ${o}`);const i=a[1].days;return "number"==typeof i?i:i[t]}estimateIsoDate(e){const{year:t}=e;return {year:t-3760,month:1,day:1}}getMonthCode(e,t){return this.inLeapYear({year:e})?6===t?buildMonthCode(5,!0):buildMonthCode(t<6?t:t-1):buildMonthCode(t)}adjustCalendarDate(e,t,o="constrain",n=!1){let{year:r,eraYear:a,month:i,monthCode:s,day:l,monthExtra:d}=e;if(void 0===r&&void 0!==a&&(r=a),void 0===a&&void 0!==r&&(a=r),n){if(d){const e=this.months[d];if(!e)throw new RangeError(`Unrecognized month from formatToParts: ${d}`);i=this.inLeapYear({year:r})?e.leap:e.regular;}s=this.getMonthCode(r,i);return {year:r,month:i,day:l,era:void 0,eraYear:a,monthCode:s}}if(this.validateCalendarDate(e),void 0===i)if(s.endsWith("L")){if("M05L"!==s)throw new RangeError(`Hebrew leap month must have monthCode M05L, not ${s}`);if(i=6,!this.inLeapYear({year:r})){if("reject"===o)throw new RangeError(`Hebrew monthCode M05L is invalid in year ${r} which is not a leap year`);i=5,l=30,s="M05";}}else {i=monthCodeNumberPart(s),this.inLeapYear({year:r})&&i>6&&i++;const e=this.monthsInYear({year:r});if(i<1||i>e)throw new RangeError(`Invalid monthCode: ${s}`)}else if("reject"===o?(RejectToRange(i,1,this.monthsInYear({year:r})),RejectToRange(l,1,this.maximumMonthLength({year:r,month:i}))):(i=ConstrainToRange(i,1,this.monthsInYear({year:r})),l=ConstrainToRange(l,1,this.maximumMonthLength({year:r,month:i}))),void 0===s)s=this.getMonthCode(r,i);else {if(this.getMonthCode(r,i)!==s)throw new RangeError(`monthCode ${s} doesn't correspond to month ${i} in Hebrew year ${r}`)}return {...e,day:l,month:i,monthCode:s,year:r,eraYear:a}}}class IslamicBaseHelper extends HelperBase{constructor(){super(...arguments),this.calendarType="lunar",this.DAYS_PER_ISLAMIC_YEAR=354+11/30,this.DAYS_PER_ISO_YEAR=365.2425,this.constantEra="ah";}inLeapYear(e,t){return 30===this.daysInMonth({year:e.year,month:12,day:1},t)}monthsInYear(){return 12}minimumMonthLength(){return 29}maximumMonthLength(){return 30}estimateIsoDate(e){const{year:t}=this.adjustCalendarDate(e);return {year:Y(t*this.DAYS_PER_ISLAMIC_YEAR/this.DAYS_PER_ISO_YEAR)+622,month:1,day:1}}}class IslamicHelper extends IslamicBaseHelper{constructor(){super(...arguments),this.id="islamic";}}class IslamicUmalquraHelper extends IslamicBaseHelper{constructor(){super(...arguments),this.id="islamic-umalqura";}}class IslamicTblaHelper extends IslamicBaseHelper{constructor(){super(...arguments),this.id="islamic-tbla";}}class IslamicCivilHelper extends IslamicBaseHelper{constructor(){super(...arguments),this.id="islamic-civil";}}class IslamicRgsaHelper extends IslamicBaseHelper{constructor(){super(...arguments),this.id="islamic-rgsa";}}class IslamicCcHelper extends IslamicBaseHelper{constructor(){super(...arguments),this.id="islamicc";}}class PersianHelper extends HelperBase{constructor(){super(...arguments),this.id="persian",this.calendarType="solar",this.constantEra="ap";}inLeapYear(e,t){return IslamicHelper.prototype.inLeapYear.call(this,e,t)}monthsInYear(){return 12}minimumMonthLength(e){const{month:t}=e;return 12===t?29:t<=6?31:30}maximumMonthLength(e){const{month:t}=e;return 12===t?30:t<=6?31:30}estimateIsoDate(e){const{year:t}=this.adjustCalendarDate(e);return {year:t+621,month:1,day:1}}}class IndianHelper extends HelperBase{constructor(){super(...arguments),this.id="indian",this.calendarType="solar",this.constantEra="saka",this.months={1:{length:30,month:3,day:22,leap:{length:31,month:3,day:21}},2:{length:31,month:4,day:21},3:{length:31,month:5,day:22},4:{length:31,month:6,day:22},5:{length:31,month:7,day:23},6:{length:31,month:8,day:23},7:{length:30,month:9,day:23},8:{length:30,month:10,day:23},9:{length:30,month:11,day:22},10:{length:30,month:12,day:22},11:{length:30,month:1,nextYear:!0,day:21},12:{length:30,month:2,nextYear:!0,day:20}},this.vulnerableToBceBug="10/11/-79 Saka"!==new Date("0000-01-01T00:00Z").toLocaleDateString("en-US-u-ca-indian",{timeZone:"UTC"});}inLeapYear(e){return isGregorianLeapYear(e.year+78)}monthsInYear(){return 12}minimumMonthLength(e){return this.getMonthInfo(e).length}maximumMonthLength(e){return this.getMonthInfo(e).length}getMonthInfo(e){const{month:t}=e;let o=this.months[t];if(void 0===o)throw new RangeError(`Invalid month: ${t}`);return this.inLeapYear(e)&&o.leap&&(o=o.leap),o}estimateIsoDate(e){const t=this.adjustCalendarDate(e),o=this.getMonthInfo(t);return AddISODate(t.year+78+(o.nextYear?1:0),o.month,o.day,0,0,0,t.day-1,"constrain")}checkIcuBugs(e){if(this.vulnerableToBceBug&&e.year<1)throw new RangeError(`calendar '${this.id}' is broken for ISO dates before 0001-01-01 (see https://bugs.chromium.org/p/v8/issues/detail?id=10529)`)}}function isGregorianLeapYear(e){return e%4==0&&(e%100!=0||e%400==0)}class GregorianBaseHelper extends HelperBase{constructor(e,t){super(),this.calendarType="solar",this.v8IsVulnerableToJulianBug=new Date("+001001-01-01T00:00Z").toLocaleDateString("en-US-u-ca-japanese",{timeZone:"UTC"}).startsWith("12"),this.calendarIsVulnerableToJulianBug=!1,this.id=e;const{eras:o,anchorEra:n}=function adjustEras(e){let t,o=e;if(0===o.length)throw new RangeError("Invalid era data: eras are required");if(1===o.length&&o[0].reverseOf)throw new RangeError("Invalid era data: anchor era cannot count years backwards");if(1===o.length&&!o[0].name)throw new RangeError("Invalid era data: at least one named era is required");if(o.filter((e=>null!=e.reverseOf)).length>1)throw new RangeError("Invalid era data: only one era can count years backwards");o.forEach((e=>{if(e.isAnchor||!e.anchorEpoch&&!e.reverseOf){if(t)throw new RangeError("Invalid era data: cannot have multiple anchor eras");t=e,e.anchorEpoch={year:e.hasYearZero?0:1};}else if(!e.name)throw new RangeError("If era name is blank, it must be the anchor era")})),o=o.filter((e=>e.name)),o.forEach((e=>{const{reverseOf:t}=e;if(t){const n=o.find((e=>e.name===t));if(void 0===n)throw new RangeError(`Invalid era data: unmatched reverseOf era: ${t}`);e.reverseOf=n,e.anchorEpoch=n.anchorEpoch,e.isoEpoch=n.isoEpoch;}void 0===e.anchorEpoch.month&&(e.anchorEpoch.month=1),void 0===e.anchorEpoch.day&&(e.anchorEpoch.day=1);})),Z.call(o,((e,t)=>{if(e.reverseOf)return 1;if(t.reverseOf)return -1;if(!e.isoEpoch||!t.isoEpoch)throw new RangeError("Invalid era data: missing ISO epoch");return t.isoEpoch.year-e.isoEpoch.year}));const n=o[o.length-1].reverseOf;if(n&&n!==o[o.length-2])throw new RangeError("Invalid era data: invalid reverse-sign era");return o.forEach(((e,t)=>{e.genericName="era"+(o.length-1-t);})),{eras:o,anchorEra:t||o[0]}}(t);this.anchorEra=n,this.eras=o;}inLeapYear(e){const{year:t}=this.estimateIsoDate({month:1,day:1,year:e.year});return isGregorianLeapYear(t)}monthsInYear(){return 12}minimumMonthLength(e){const{month:t}=e;return 2===t?this.inLeapYear(e)?29:28:[4,6,9,11].indexOf(t)>=0?30:31}maximumMonthLength(e){return this.minimumMonthLength(e)}completeEraYear(e){const checkField=(t,o)=>{const n=e[t];if(null!=n&&n!=o)throw new RangeError(`Input ${t} ${n} doesn't match calculated value ${o}`)},eraFromYear=t=>{let o;const n={...e,year:t},r=this.eras.find(((e,r)=>{if(r===this.eras.length-1){if(e.reverseOf){if(t>0)throw new RangeError(`Signed year ${t} is invalid for era ${e.name}`);return o=e.anchorEpoch.year-t,!0}return o=t-e.anchorEpoch.year+(e.hasYearZero?0:1),!0}return this.compareCalendarDates(n,e.anchorEpoch)>=0&&(o=t-e.anchorEpoch.year+(e.hasYearZero?0:1),!0)}));if(!r)throw new RangeError(`Year ${t} was not matched by any era`);return {eraYear:o,era:r.name}};let{year:t,eraYear:o,era:n}=e;if(null!=t)(({eraYear:o,era:n}=eraFromYear(t))),checkField("era",n),checkField("eraYear",o);else {if(null==o)throw new RangeError("Either `year` or `eraYear` and `era` are required");{const e=void 0===n?void 0:this.eras.find((e=>e.name===n||e.genericName===n));if(!e)throw new RangeError(`Era ${n} (ISO year ${o}) was not matched by any era`);if(o<1&&e.reverseOf)throw new RangeError(`Years in ${n} era must be positive, not ${t}`);t=e.reverseOf?e.anchorEpoch.year-o:o+e.anchorEpoch.year-(e.hasYearZero?0:1),checkField("year",t),({eraYear:o,era:n}=eraFromYear(t));}}return {...e,year:t,eraYear:o,era:n}}adjustCalendarDate(e,t,o="constrain"){let n=e;const{month:r,monthCode:a}=n;return void 0===r&&(n={...n,month:monthCodeNumberPart(a)}),this.validateCalendarDate(n),n=this.completeEraYear(n),super.adjustCalendarDate(n,t,o)}estimateIsoDate(e){const t=this.adjustCalendarDate(e),{year:o,month:n,day:r}=t,{anchorEra:a}=this;return RegulateISODate(o+a.isoEpoch.year-(a.hasYearZero?0:1),n,r,"constrain")}checkIcuBugs(e){if(this.calendarIsVulnerableToJulianBug&&this.v8IsVulnerableToJulianBug){if(CompareISODate(e.year,e.month,e.day,1582,10,15)<0)throw new RangeError(`calendar '${this.id}' is broken for ISO dates before 1582-10-15 (see https://bugs.chromium.org/p/chromium/issues/detail?id=1173158)`)}}}class OrthodoxBaseHelper extends GregorianBaseHelper{constructor(e,t){super(e,t);}inLeapYear(e){const{year:t}=e;return (t+1)%4==0}monthsInYear(){return 13}minimumMonthLength(e){const{month:t}=e;return 13===t?this.inLeapYear(e)?6:5:30}maximumMonthLength(e){return this.minimumMonthLength(e)}}class EthioaaHelper extends OrthodoxBaseHelper{constructor(){super("ethioaa",[{name:"era0",isoEpoch:{year:-5492,month:7,day:17}}]);}}class CopticHelper extends OrthodoxBaseHelper{constructor(){super("coptic",[{name:"era1",isoEpoch:{year:284,month:8,day:29}},{name:"era0",reverseOf:"era1"}]);}}class EthiopicHelper extends OrthodoxBaseHelper{constructor(){super("ethiopic",[{name:"era0",isoEpoch:{year:-5492,month:7,day:17}},{name:"era1",isoEpoch:{year:8,month:8,day:27},anchorEpoch:{year:5501}}]);}}class RocHelper extends GregorianBaseHelper{constructor(){super("roc",[{name:"minguo",isoEpoch:{year:1912,month:1,day:1}},{name:"before-roc",reverseOf:"minguo"}]),this.calendarIsVulnerableToJulianBug=!0;}}class BuddhistHelper extends GregorianBaseHelper{constructor(){super("buddhist",[{name:"be",hasYearZero:!0,isoEpoch:{year:-543,month:1,day:1}}]),this.calendarIsVulnerableToJulianBug=!0;}}class GregoryHelper extends GregorianBaseHelper{constructor(){super("gregory",[{name:"ce",isoEpoch:{year:1,month:1,day:1}},{name:"bce",reverseOf:"ce"}]);}reviseIntlEra(e){let{era:t,eraYear:o}=e;return "bc"!==t&&"b"!==t||(t="bce"),"ad"!==t&&"a"!==t||(t="ce"),{era:t,eraYear:o}}}class JapaneseHelper extends GregorianBaseHelper{constructor(){super("japanese",[{name:"reiwa",isoEpoch:{year:2019,month:5,day:1},anchorEpoch:{year:2019,month:5,day:1}},{name:"heisei",isoEpoch:{year:1989,month:1,day:8},anchorEpoch:{year:1989,month:1,day:8}},{name:"showa",isoEpoch:{year:1926,month:12,day:25},anchorEpoch:{year:1926,month:12,day:25}},{name:"taisho",isoEpoch:{year:1912,month:7,day:30},anchorEpoch:{year:1912,month:7,day:30}},{name:"meiji",isoEpoch:{year:1868,month:9,day:8},anchorEpoch:{year:1868,month:9,day:8}},{name:"ce",isoEpoch:{year:1,month:1,day:1}},{name:"bce",reverseOf:"ce"}]),this.calendarIsVulnerableToJulianBug=!0,this.eraLength="long";}reviseIntlEra(e,t){const{era:o,eraYear:n}=e,{year:r}=t;return this.eras.find((e=>e.name===o))?{era:o,eraYear:n}:r<1?{era:"bce",eraYear:1-r}:{era:"ce",eraYear:r}}}class ChineseBaseHelper extends HelperBase{constructor(){super(...arguments),this.calendarType="lunisolar",this.hasEra=!1;}inLeapYear(e,t){const o=this.getMonthList(e.year,t);return 13===P(o).length}monthsInYear(e,t){return this.inLeapYear(e,t)?13:12}minimumMonthLength(){return 29}maximumMonthLength(){return 30}getMonthList(e,t){if(void 0===e)throw new TypeError("Missing year");const o=JSON.stringify({func:"getMonthList",calendarYear:e,id:this.id}),n=t.get(o);if(n)return n;const r=this.getFormatter(),getCalendarDate=(e,t)=>{const o=toUtcIsoDateString({isoYear:e,isoMonth:2,isoDay:1}),n=new Date(o);n.setUTCDate(t+1);const a=r.formatToParts(n),i=a.find((e=>"month"===e.type)).value,s=+a.find((e=>"day"===e.type)).value;let l=a.find((e=>"relatedYear"===e.type));if(void 0===l)throw new RangeError(`Intl.DateTimeFormat.formatToParts lacks relatedYear in ${this.id} calendar. Try Node 14+ or modern browsers.`);return l=+l.value,{calendarMonthString:i,calendarDay:s,calendarYearToVerify:l}};let a=17,{calendarMonthString:i,calendarDay:s,calendarYearToVerify:l}=getCalendarDate(e,a);"1"!==i&&(a+=29,({calendarMonthString:i,calendarDay:s}=getCalendarDate(e,a))),a-=s-5;const d={};let m,c,h=1,T=!1;do{(({calendarMonthString:i,calendarDay:s,calendarYearToVerify:l}=getCalendarDate(e,a))),m&&(d[c].daysInMonth=m+30-s),l!==e?T=!0:(d[i]={monthIndex:h++},a+=30),m=s,c=i;}while(!T);return d[c].daysInMonth=m+30-s,t.set(o,d),d}estimateIsoDate(e){const{year:t,month:o}=e;return {year:t,month:o>=12?12:o+1,day:1}}adjustCalendarDate(e,t,o="constrain",n=!1){let{year:r,month:a,monthExtra:i,day:s,monthCode:l,eraYear:d}=e;if(n){if(r=d,i&&"bis"!==i)throw new RangeError(`Unexpected leap month suffix: ${i}`);const e=buildMonthCode(a,void 0!==i),o=`${a}${i||""}`,n=this.getMonthList(r,t)[o];if(void 0===n)throw new RangeError(`Unmatched month ${o} in Chinese year ${r}`);return a=n.monthIndex,{year:r,month:a,day:s,era:void 0,eraYear:d,monthCode:e}}if(this.validateCalendarDate(e),void 0===r&&(r=d),void 0===d&&(d=r),void 0===a){const e=this.getMonthList(r,t);let n=l.replace("L","bis").slice(1);"0"===n[0]&&(n=n.slice(1));let i=e[n];if(a=i&&i.monthIndex,void 0===a&&l.endsWith("L")&&!b.call(["M01L","M12L","M13L"],l)&&"constrain"===o){let t=l.slice(1,-1);"0"===t[0]&&(t=t.slice(1)),i=e[t],i&&(({daysInMonth:s,monthIndex:a}=i),l=buildMonthCode(t));}if(void 0===a)throw new RangeError(`Unmatched month ${l} in Chinese year ${r}`)}else if(void 0===l){const e=this.getMonthList(r,t),n=P(e),i=n.length;"reject"===o?(RejectToRange(a,1,i),RejectToRange(s,1,this.maximumMonthLength())):(a=ConstrainToRange(a,1,i),s=ConstrainToRange(s,1,this.maximumMonthLength()));const d=n.find((([,e])=>e.monthIndex===a));if(void 0===d)throw new RangeError(`Invalid month ${a} in Chinese year ${r}`);l=buildMonthCode(d[0].replace("bis",""),-1!==d[0].indexOf("bis"));}else {const e=this.getMonthList(r,t);let o=l.replace("L","bis").slice(1);"0"===o[0]&&(o=o.slice(1));const n=e[o];if(!n)throw new RangeError(`Unmatched monthCode ${l} in Chinese year ${r}`);if(a!==n.monthIndex)throw new RangeError(`monthCode ${l} doesn't correspond to month ${a} in Chinese year ${r}`)}return {...e,year:r,eraYear:d,month:a,monthCode:l,day:s}}}class ChineseHelper extends ChineseBaseHelper{constructor(){super(...arguments),this.id="chinese";}}class DangiHelper extends ChineseBaseHelper{constructor(){super(...arguments),this.id="dangi";}}const N={helper:void 0,dateFromFields(e,t,o){const n=ToTemporalOverflow(t),r=new OneObjectCache,a=PrepareTemporalFields(e,[["day"],["era",void 0],["eraYear",void 0],["month",void 0],["monthCode",void 0],["year",void 0]]),{year:i,month:s,day:l}=this.helper.calendarToIsoDate(a,n,r),d=CreateTemporalDate(i,s,l,o);return r.setObject(d),d},yearMonthFromFields(e,t,o){const n=ToTemporalOverflow(t),r=new OneObjectCache,a=PrepareTemporalFields(e,[["era",void 0],["eraYear",void 0],["month",void 0],["monthCode",void 0],["year",void 0]]),{year:i,month:s,day:l}=this.helper.calendarToIsoDate({...a,day:1},n,r),d=CreateTemporalYearMonth(i,s,o,l);return r.setObject(d),d},monthDayFromFields(e,t,o){const n=ToTemporalOverflow(t),r=new OneObjectCache,a=PrepareTemporalFields(e,[["day"],["era",void 0],["eraYear",void 0],["month",void 0],["monthCode",void 0],["year",void 0]]),{year:i,month:s,day:l}=this.helper.monthDayFromFields(a,n,r),d=CreateTemporalMonthDay(s,l,o,i);return r.setObject(d),d},fields(e){let t=e;return b.call(t,"year")&&(t=[...t,"era","eraYear"]),t},mergeFields(e,t){const o={...e},n={...t},{month:r,monthCode:a,year:i,era:s,eraYear:l,...d}=o,{month:m,monthCode:c,year:h,era:T,eraYear:u}=n;return void 0===m&&void 0===c&&(d.month=r,d.monthCode=a),void 0===h&&void 0===T&&void 0===u&&(d.year=i),{...d,...n}},dateAdd(e,t,o,n,r,a,i){const s=OneObjectCache.getCacheForObject(e),l=this.helper.temporalToCalendarDate(e,s),d=this.helper.addCalendar(l,{years:t,months:o,weeks:n,days:r},a,s),m=this.helper.calendarToIsoDate(d,"constrain",s),{year:c,month:h,day:T}=m,u=CreateTemporalDate(c,h,T,i);return new OneObjectCache(s).setObject(u),u},dateUntil(e,t,o){const n=OneObjectCache.getCacheForObject(e),r=OneObjectCache.getCacheForObject(t),a=this.helper.temporalToCalendarDate(e,n),i=this.helper.temporalToCalendarDate(t,r);return this.helper.untilCalendar(a,i,o,n)},year(e){const t=OneObjectCache.getCacheForObject(e);return this.helper.temporalToCalendarDate(e,t).year},month(e){const t=OneObjectCache.getCacheForObject(e);return this.helper.temporalToCalendarDate(e,t).month},day(e){const t=OneObjectCache.getCacheForObject(e);return this.helper.temporalToCalendarDate(e,t).day},era(e){if(!this.helper.hasEra)return;const t=OneObjectCache.getCacheForObject(e);return this.helper.temporalToCalendarDate(e,t).era},eraYear(e){if(!this.helper.hasEra)return;const t=OneObjectCache.getCacheForObject(e);return this.helper.temporalToCalendarDate(e,t).eraYear},monthCode(e){const t=OneObjectCache.getCacheForObject(e);return this.helper.temporalToCalendarDate(e,t).monthCode},dayOfWeek:e=>B.iso8601.dayOfWeek(e),dayOfYear(e){const t=OneObjectCache.getCacheForObject(e),o=this.helper.isoToCalendarDate(e,t),n=this.helper.startOfCalendarYear(o);return this.helper.calendarDaysUntil(n,o,t)+1},weekOfYear:e=>B.iso8601.weekOfYear(e),daysInWeek:e=>B.iso8601.daysInWeek(e),daysInMonth(e){const t=OneObjectCache.getCacheForObject(e),o=this.helper.temporalToCalendarDate(e,t),n=this.helper.maximumMonthLength(o);if(n===this.helper.minimumMonthLength(o))return n;const r=this.helper.startOfCalendarMonth(o),a=this.helper.addMonthsCalendar(r,1,"constrain",t);return this.helper.calendarDaysUntil(r,a,t)},daysInYear(e){let t=e;HasSlot(t,r$1)||(t=ToTemporalDate(t));const o=OneObjectCache.getCacheForObject(t),n=this.helper.temporalToCalendarDate(t,o),a=this.helper.startOfCalendarYear(n),i=this.helper.addCalendar(a,{years:1},"constrain",o);return this.helper.calendarDaysUntil(a,i,o)},monthsInYear(e){const t=OneObjectCache.getCacheForObject(e),o=this.helper.temporalToCalendarDate(e,t);return this.helper.monthsInYear(o,t)},inLeapYear(e){let t=e;HasSlot(t,r$1)||(t=ToTemporalDate(t));const o=OneObjectCache.getCacheForObject(t),n=this.helper.temporalToCalendarDate(t,o);return this.helper.inLeapYear(n,o)}};for(const e of [HebrewHelper,PersianHelper,EthiopicHelper,EthioaaHelper,CopticHelper,ChineseHelper,DangiHelper,RocHelper,IndianHelper,BuddhistHelper,GregoryHelper,JapaneseHelper,IslamicHelper,IslamicUmalquraHelper,IslamicTblaHelper,IslamicCivilHelper,IslamicRgsaHelper,IslamicCcHelper]){const t=new e;B[t.id]={...N,helper:t};}const $=Object.keys(B);function IsBuiltinCalendar(e){return b.call($,e)}const k=/\.[-A-Za-z_]|\.\.[-A-Za-z._]{1,12}|\.[-A-Za-z_][-A-Za-z._]{0,12}|[A-Za-z_][-A-Za-z._]{0,13}/,L=new RegExp(`(?:(?:${k.source})(?:\\/(?:${k.source}))*|Etc/GMT[-+]\\d{1,2}|${/(?:[+\u2212-][0-2][0-9](?::?[0-5][0-9](?::?[0-5][0-9](?:[.,]\d{1,9})?)?)?)/.source})`),U=/[A-Za-z0-9]{3,8}/,A=new RegExp(`(?:${U.source}(?:-${U.source})*)`),x=/(?:[+\u2212-]\d{6}|\d{4})/,H=/(?:0[1-9]|1[0-2])/,q=/(?:0[1-9]|[12]\d|3[01])/,W=new RegExp(`(${x.source})(?:-(${H.source})-(${q.source})|(${H.source})(${q.source}))`),z=/(\d{2})(?::(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?|(\d{2})(?:(\d{2})(?:[.,](\d{1,9}))?)?)?/,J=/([+\u2212-])([01][0-9]|2[0-3])(?::?([0-5][0-9])(?::?([0-5][0-9])(?:[.,](\d{1,9}))?)?)?/,V=new RegExp(`(?:([zZ])|(?:${J.source})?)(?:\\[(${L.source})\\])?`),_=new RegExp(`\\[u-ca=(${A.source})\\]`),X=new RegExp(`^${W.source}(?:(?:T|\\s+)${z.source})?${V.source}(?:${_.source})?$`,"i"),K=new RegExp(`^T?${z.source}(?:${V.source})?(?:${_.source})?$`,"i"),Q=new RegExp(`^(${x.source})-?(${H.source})$`),ee=new RegExp(`^(?:--)?(${H.source})-?(${q.source})$`),te=/(\d+)(?:[.,](\d{1,9}))?/,oe=new RegExp(`(?:${te.source}H)?(?:${te.source}M)?(?:${te.source}S)?`),ne=new RegExp(`^([+−-])?P${/(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?/.source}(?:T(?!$)${oe.source})?$`,"i"),re$1=Array.prototype.push,ae=globalThis.Intl.DateTimeFormat,ie=Math.min,se=Math.max,le=Math.abs,de=Math.floor,me=Math.sign,ce=Math.trunc,he=Number.isNaN,Te=Number.isFinite,ue=Number,pe=String,fe=Number.MAX_SAFE_INTEGER,ye=Object.create,Se=Object.is,ge=Reflect.apply,we=jsbiUmd.BigInt(0),Ie=jsbiUmd.BigInt(1),Ge=jsbiUmd.BigInt(60),De=jsbiUmd.BigInt(1e3),ve=jsbiUmd.BigInt(1e6),Oe=jsbiUmd.BigInt(1e9),Ce=jsbiUmd.BigInt(-1),Ee=jsbiUmd.multiply(jsbiUmd.BigInt(86400),Oe),be=jsbiUmd.multiply(jsbiUmd.BigInt(-86400),jsbiUmd.BigInt(1e17)),Re=jsbiUmd.multiply(jsbiUmd.BigInt(86400),jsbiUmd.BigInt(1e17)),Me=jsbiUmd.multiply(jsbiUmd.BigInt(-388152),jsbiUmd.BigInt(1e13)),Ze=jsbiUmd.multiply(Ee,jsbiUmd.BigInt(3660)),Fe=jsbiUmd.multiply(Ee,jsbiUmd.BigInt(366)),Ye=jsbiUmd.multiply(Ee,jsbiUmd.BigInt(14));function IsInteger(e){if("number"!=typeof e||!Te(e))return !1;const t=le(e);return de(t)===t}function IsObject(e){return "object"==typeof e&&null!==e||"function"==typeof e}function ToNumber(e){if("bigint"==typeof e)throw new TypeError("Cannot convert BigInt to number");return ue(e)}function ToInteger(e){const t=ToNumber(e);if(he(t))return 0;const o=ce(t);return 0===t?0:o}function ToString(e){if("symbol"==typeof e)throw new TypeError("Cannot convert a Symbol value to a String");return pe(e)}function ToIntegerThrowOnInfinity(e){const t=ToInteger(e);if(!Te(t))throw new RangeError("infinity is out of range");return t}function ToPositiveInteger(e,t){const o=ToInteger(e);if(!Te(o))throw new RangeError("infinity is out of range");if(o<1){if(void 0!==t)throw new RangeError(`property '${t}' cannot be a a number less than one`);throw new RangeError("Cannot convert a number less than one to a positive integer")}return o}function ToIntegerWithoutRounding(e){const t=ToNumber(e);if(he(t))return 0;if(!Te(t))throw new RangeError("infinity is out of range");if(!IsInteger(t))throw new RangeError(`unsupported fractional value ${t}`);return ToInteger(t)}function divmod(t,o){return {quotient:jsbiUmd.divide(t,o),remainder:jsbiUmd.remainder(t,o)}}function abs(t){return jsbiUmd.lessThan(t,we)?jsbiUmd.multiply(t,Ce):t}const Pe=new Map([["year",ToIntegerThrowOnInfinity],["month",ToPositiveInteger],["monthCode",ToString],["day",ToPositiveInteger],["hour",ToIntegerThrowOnInfinity],["minute",ToIntegerThrowOnInfinity],["second",ToIntegerThrowOnInfinity],["millisecond",ToIntegerThrowOnInfinity],["microsecond",ToIntegerThrowOnInfinity],["nanosecond",ToIntegerThrowOnInfinity],["years",ToIntegerWithoutRounding],["months",ToIntegerWithoutRounding],["weeks",ToIntegerWithoutRounding],["days",ToIntegerWithoutRounding],["hours",ToIntegerWithoutRounding],["minutes",ToIntegerWithoutRounding],["seconds",ToIntegerWithoutRounding],["milliseconds",ToIntegerWithoutRounding],["microseconds",ToIntegerWithoutRounding],["nanoseconds",ToIntegerWithoutRounding],["era",ToString],["eraYear",ToInteger],["offset",ToString]]),je=["year","month","week","day","hour","minute","second","millisecond","microsecond","nanosecond"],Be=[["years","year"],["months","month"],["weeks","week"],["days","day"],["hours","hour"],["minutes","minute"],["seconds","second"],["milliseconds","millisecond"],["microseconds","microsecond"],["nanoseconds","nanosecond"]],Ne=new Map;function getIntlDateTimeFormatEnUsForTimeZone(e){let t=Ne.get(e);return void 0===t&&(t=new ae("en-us",{timeZone:pe(e),hour12:!1,era:"short",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}),Ne.set(e,t)),t}function IsTemporalInstant(e){return HasSlot(e,o)&&!HasSlot(e,p,T)}function IsTemporalTimeZone(e){return HasSlot(e,n)}function IsTemporalCalendar(e){return HasSlot(e,C)}function IsTemporalDuration(e){return HasSlot(e,f,y,g,w,I,G,D,v,O)}function IsTemporalDate(e){return HasSlot(e,"slot-date-brand")}function IsTemporalTime(e){return HasSlot(e,s,l,d,m,c,h)&&!HasSlot(e,r$1,a,i$1)}function IsTemporalDateTime(e){return HasSlot(e,r$1,a,i$1,s,l,d,m,c,h)}function IsTemporalYearMonth(e){return HasSlot(e,"slot-year-month-brand")}function IsTemporalMonthDay(e){return HasSlot(e,"slot-month-day-brand")}function IsTemporalZonedDateTime(e){return HasSlot(e,o,p,T)}function RejectObjectWithCalendarOrTimeZone(e){if(HasSlot(e,T)||HasSlot(e,p))throw new TypeError("with() does not support a calendar or timeZone property");if(void 0!==e.calendar)throw new TypeError("with() does not support a calendar property");if(void 0!==e.timeZone)throw new TypeError("with() does not support a timeZone property")}function ParseTemporalTimeZone(e){let{ianaName:t,offset:o,z:n}=function ParseTemporalTimeZoneString(e){try{let t=GetCanonicalTimeZoneIdentifier(e);if(t)return t=t.toString(),TestTimeZoneOffsetString(t)?{offset:t}:{ianaName:t}}catch{}try{const t=ParseISODateTime(e);if(t.z||t.offset||t.ianaName)return t}catch{}throw new RangeError(`Invalid time zone: ${e}`)}(e);return t||(n?"UTC":o)}function FormatCalendarAnnotation(e,t){return "never"===t||"auto"===t&&"iso8601"===e?"":`[u-ca=${e}]`}function ParseISODateTime(e){const t=X.exec(e);if(!t)throw new RangeError(`invalid ISO 8601 string: ${e}`);let o=t[1];if("−"===o[0]&&(o=`-${o.slice(1)}`),"-000000"===o)throw new RangeError(`invalid ISO 8601 string: ${e}`);const n=ToInteger(o),r=ToInteger(t[2]||t[4]),a=ToInteger(t[3]||t[5]),i=ToInteger(t[6]),s=void 0!==t[6],l=ToInteger(t[7]||t[10]);let d=ToInteger(t[8]||t[11]);60===d&&(d=59);const m=(t[9]||t[12])+"000000000",c=ToInteger(m.slice(0,3)),h=ToInteger(m.slice(3,6)),T=ToInteger(m.slice(6,9));let u,p=!1;if(t[13])u=void 0,p=!0;else if(t[14]&&t[15]){const e="-"===t[14]||"−"===t[14]?"-":"+",o=t[15]||"00",n=t[16]||"00",r=t[17]||"00";let a=t[18]||"0";if(u=`${e}${o}:${n}`,+a){for(;a.endsWith("0");)a=a.slice(0,-1);u+=`:${r}.${a}`;}else +r&&(u+=`:${r}`);"-00:00"===u&&(u="+00:00");}let f=t[19];if(f)try{f=GetCanonicalTimeZoneIdentifier(f).toString();}catch{}return {year:n,month:r,day:a,hasTime:s,hour:i,minute:l,second:d,millisecond:c,microsecond:h,nanosecond:T,ianaName:f,offset:u,z:p,calendar:t[20]}}function ParseTemporalYearMonthString(e){const t=Q.exec(e);let o,n,r,a;if(t){let a=t[1];if("−"===a[0]&&(a=`-${a.slice(1)}`),"-000000"===a)throw new RangeError(`invalid ISO 8601 string: ${e}`);o=ToInteger(a),n=ToInteger(t[2]),r=t[3];}else {let t;if(({year:o,month:n,calendar:r,day:a,z:t}=ParseISODateTime(e)),t)throw new RangeError("Z designator not supported for PlainYearMonth")}return {year:o,month:n,calendar:r,referenceISODay:a}}function ParseTemporalMonthDayString(e){const t=ee.exec(e);let o,n,r,a;if(t)o=ToInteger(t[1]),n=ToInteger(t[2]);else {let t;if(({month:o,day:n,calendar:r,year:a,z:t}=ParseISODateTime(e)),t)throw new RangeError("Z designator not supported for PlainMonthDay")}return {month:o,day:n,calendar:r,referenceISOYear:a}}function ParseTemporalDurationString(e){const t=ne.exec(e);if(!t)throw new RangeError(`invalid duration: ${e}`);if(t.slice(2).every((e=>void 0===e)))throw new RangeError(`invalid duration: ${e}`);const o="-"===t[1]||"−"===t[1]?-1:1,n=ToInteger(t[2])*o,r=ToInteger(t[3])*o,a=ToInteger(t[4])*o,i=ToInteger(t[5])*o,s=ToInteger(t[6])*o;let l=t[7],d=ToInteger(t[8])*o,m=t[9],c=ToInteger(t[10])*o;const h=t[11]+"000000000";let T=ToInteger(h.slice(0,3))*o,u=ToInteger(h.slice(3,6))*o,p=ToInteger(h.slice(6,9))*o;return l=l?o*ToInteger(l)/10**l.length:0,m=m?o*ToInteger(m)/10**m.length:0,({minutes:d,seconds:c,milliseconds:T,microseconds:u,nanoseconds:p}=function DurationHandleFractions(e,t,o,n,r,a,i){let s=e,l=t,d=o,m=n,c=r,h=a,T=i;if(0!==s){[l,d,m,c,h,T].forEach((e=>{if(0!==e)throw new RangeError("only the smallest unit can be fractional")}));const e=60*s;l=ce(e),d=e%1;}if(0!==d){[m,c,h,T].forEach((e=>{if(0!==e)throw new RangeError("only the smallest unit can be fractional")}));const e=60*d;m=ce(e);const t=e%1;if(0!==t){const e=1e3*t;c=ce(e);const o=e%1;if(0!==o){const e=1e3*o;h=ce(e);const t=e%1;if(0!==t){T=ce(1e3*t);}}}}return {minutes:l,seconds:m,milliseconds:c,microseconds:h,nanoseconds:T}}(l,d,m,c,T,u,p)),{years:n,months:r,weeks:a,days:i,hours:s,minutes:d,seconds:c,milliseconds:T,microseconds:u,nanoseconds:p}}function ParseTemporalInstant(t){const{year:o,month:n,day:r,hour:a,minute:i,second:s,millisecond:l,microsecond:d,nanosecond:m,offset:c,z:h}=function ParseTemporalInstantString(e){const t=ParseISODateTime(e);if(!t.z&&!t.offset)throw new RangeError("Temporal.Instant requires a time zone offset");return t}(t),T=GetEpochFromISOParts(o,n,r,a,i,s,l,d,m);if(null===T)throw new RangeError("DateTime outside of supported range");const u=h?0:ParseTimeZoneOffsetString(c);return jsbiUmd.subtract(T,jsbiUmd.BigInt(u))}function RegulateISODate(e,t,o,n){let r=e,a=t,i=o;switch(n){case"reject":RejectISODate(r,a,i);break;case"constrain":({year:r,month:a,day:i}=ConstrainISODate(r,a,i));}return {year:r,month:a,day:i}}function RegulateTime(e,t,o,n,r,a,i){let s=e,l=t,d=o,m=n,c=r,h=a;switch(i){case"reject":RejectTime(s,l,d,m,c,h);break;case"constrain":({hour:s,minute:l,second:d,millisecond:m,microsecond:c,nanosecond:h}=function ConstrainTime(e,t,o,n,r,a){const i=ConstrainToRange(e,0,23),s=ConstrainToRange(t,0,59),l=ConstrainToRange(o,0,59),d=ConstrainToRange(n,0,999),m=ConstrainToRange(r,0,999),c=ConstrainToRange(a,0,999);return {hour:i,minute:s,second:l,millisecond:d,microsecond:m,nanosecond:c}}(s,l,d,m,c,h));}return {hour:s,minute:l,second:d,millisecond:m,microsecond:c,nanosecond:h}}function ToTemporalDurationRecord(e){if(IsTemporalDuration(e))return {years:GetSlot(e,f),months:GetSlot(e,y),weeks:GetSlot(e,S),days:GetSlot(e,g),hours:GetSlot(e,w),minutes:GetSlot(e,I),seconds:GetSlot(e,G),milliseconds:GetSlot(e,D),microseconds:GetSlot(e,v),nanoseconds:GetSlot(e,O)};const t=ToPartialRecord(e,["days","hours","microseconds","milliseconds","minutes","months","nanoseconds","seconds","weeks","years"]);if(!t)throw new TypeError("invalid duration-like");const{years:o=0,months:n=0,weeks:r=0,days:a=0,hours:i=0,minutes:s=0,seconds:l=0,milliseconds:d=0,microseconds:m=0,nanoseconds:c=0}=t;return {years:o,months:n,weeks:r,days:a,hours:i,minutes:s,seconds:l,milliseconds:d,microseconds:m,nanoseconds:c}}function ToLimitedTemporalDuration(e,t=[]){let o;if(IsObject(e))o=ToTemporalDurationRecord(e);else {o=ParseTemporalDurationString(ToString(e));}const{years:n,months:r,weeks:a,days:i,hours:s,minutes:l,seconds:d,milliseconds:m,microseconds:c,nanoseconds:h}=o;RejectDuration(n,r,a,i,s,l,d,m,c,h);for(const e of t)if(0!==o[e])throw new RangeError(`Duration field ${e} not supported by Temporal.Instant. Try Temporal.ZonedDateTime instead.`);return o}function ToTemporalOverflow(e){return GetOption(e,"overflow",["constrain","reject"],"constrain")}function ToTemporalDisambiguation(e){return GetOption(e,"disambiguation",["compatible","earlier","later","reject"],"compatible")}function ToTemporalRoundingMode(e,t){return GetOption(e,"roundingMode",["ceil","floor","trunc","halfExpand"],t)}function NegateTemporalRoundingMode(e){switch(e){case"ceil":return "floor";case"floor":return "ceil";default:return e}}function ToTemporalOffset(e,t){return GetOption(e,"offset",["prefer","use","ignore","reject"],t)}function ToShowCalendarOption(e){return GetOption(e,"calendarName",["auto","always","never"],"auto")}function ToTemporalRoundingIncrement(e,t,o){let n=1/0;void 0!==t&&(n=t),o||void 0===t||(n=t>1?t-1:1);const r=function GetNumberOption(e,t,o,n,r){let a=e[t];if(void 0===a)return r;const i=ToNumber(a);if(he(i)||i<o||i>n)throw new RangeError(`${t} must be between ${o} and ${n}, not ${i}`);return de(i)}(e,"roundingIncrement",1,n,1);if(void 0!==t&&t%r!=0)throw new RangeError(`Rounding increment must divide evenly into ${t}`);return r}function ToTemporalDateTimeRoundingIncrement(e,t){return ToTemporalRoundingIncrement(e,{year:void 0,month:void 0,week:void 0,day:void 0,hour:24,minute:60,second:60,millisecond:1e3,microsecond:1e3,nanosecond:1e3}[t],!1)}function ToSecondsStringPrecision(e){switch(ToSmallestTemporalUnit(e,void 0,["year","month","week","day","hour"])){case"minute":return {precision:"minute",unit:"minute",increment:1};case"second":return {precision:0,unit:"second",increment:1};case"millisecond":return {precision:3,unit:"millisecond",increment:1};case"microsecond":return {precision:6,unit:"microsecond",increment:1};case"nanosecond":return {precision:9,unit:"nanosecond",increment:1}}let t=e.fractionalSecondDigits;if(void 0===t&&(t="auto"),"number"!=typeof t){const e=ToString(t);if("auto"===e)return {precision:"auto",unit:"nanosecond",increment:1};throw new RangeError(`fractionalSecondDigits must be 'auto' or 0 through 9, not ${e}`)}if(he(t)||t<0||t>9)throw new RangeError(`fractionalSecondDigits must be 'auto' or 0 through 9, not ${t}`);const o=de(t);switch(o){case 0:return {precision:o,unit:"second",increment:1};case 1:case 2:case 3:return {precision:o,unit:"millisecond",increment:10**(3-o)};case 4:case 5:case 6:return {precision:o,unit:"microsecond",increment:10**(6-o)};case 7:case 8:case 9:return {precision:o,unit:"nanosecond",increment:10**(9-o)};default:throw new RangeError(`fractionalSecondDigits must be 'auto' or 0 through 9, not ${t}`)}}function ToLargestTemporalUnit(e,t,o=[],n){const r=new Map(Be.filter((([,e])=>!o.includes(e)))),a=new Set(je);for(const e of o)a.delete(e);const i=GetOption(e,"largestUnit",["auto",...a,...r.keys()],t);return "auto"===i&&void 0!==n?n:r.has(i)?r.get(i):i}function ToSmallestTemporalUnit(e,t,o=[]){const n=new Map(Be.filter((([,e])=>!o.includes(e)))),r=new Set(je);for(const e of o)r.delete(e);const a=GetOption(e,"smallestUnit",[...r,...n.keys()],t);return n.has(a)?n.get(a):a}function ToRelativeTemporalObject(e){const t=e.relativeTo;if(void 0===t)return t;let o,n,r,a,i,s,l,d,m,c,h,T,u="option",p=!1;if(IsObject(t)){if(IsTemporalZonedDateTime(t)||IsTemporalDate(t))return t;if(IsTemporalDateTime(t))return TemporalDateTimeToDate(t);c=GetTemporalCalendarWithISODefault(t);const e=ToTemporalDateTimeFields(t,CalendarFields(c,["day","hour","microsecond","millisecond","minute","month","monthCode","nanosecond","second","year"])),p=ye(null);p.overflow="constrain",({year:o,month:n,day:r,hour:a,minute:i,second:s,millisecond:l,microsecond:d,nanosecond:m}=InterpretTemporalDateTimeFields(c,e,p)),T=t.offset,void 0===T&&(u="wall"),h=t.timeZone;}else {let e,f;(({year:o,month:n,day:r,hour:a,minute:i,second:s,millisecond:l,microsecond:d,nanosecond:m,calendar:c,ianaName:e,offset:T,z:f}=ParseISODateTime(ToString(t)))),e&&(h=e),f?u="exact":T||(u="wall"),c||(c=GetISO8601Calendar()),c=ToTemporalCalendar(c),p=!0;}if(h){h=ToTemporalTimeZone(h);let e=0;"option"===u&&(e=ParseTimeZoneOffsetString(ToString(T)));return CreateTemporalZonedDateTime(InterpretISODateTimeOffset(o,n,r,a,i,s,l,d,m,u,e,h,"compatible","reject",p),h,c)}return CreateTemporalDate(o,n,r,c)}function ValidateTemporalUnitRange(e,t){if(je.indexOf(e)>je.indexOf(t))throw new RangeError(`largestUnit ${e} cannot be smaller than smallestUnit ${t}`)}function DefaultTemporalLargestUnit(e,t,o,n,r,a,i,s,l,d){const m=new Map(Be);for(const[c,h]of [["years",e],["months",t],["weeks",o],["days",n],["hours",r],["minutes",a],["seconds",i],["milliseconds",s],["microseconds",l],["nanoseconds",d]])if(0!==h)return m.get(c);return "nanosecond"}function LargerOfTwoTemporalUnits(e,t){return je.indexOf(e)>je.indexOf(t)?t:e}function ToPartialRecord(e,t){const o=e,n=t;let r=!1,a={};for(const e of n){const t=o[e];void 0!==t&&(r=!0,Pe.has(e)?a[e]=Pe.get(e)(t):a[e]=t);}return !!r&&a}function PrepareTemporalFields(e,t){const o=e,n=t,r={};let a=!1;for(const e of n){const[t,n]=e;let i=o[t];if(void 0===i){if(1===e.length)throw new TypeError(`required property '${t}' missing or undefined`);i=n;}else a=!0,Pe.has(t)&&(i=Pe.get(t)(i));r[t]=i;}if(!a)throw new TypeError("no supported properties found");if(void 0===r.era!=(void 0===r.eraYear))throw new RangeError("properties 'era' and 'eraYear' must be provided together");return r}function ToTemporalDateFields(e,t){const o=[["day",void 0],["month",void 0],["monthCode",void 0],["year",void 0]];return t.forEach((e=>{o.some((([t])=>t===e))||o.push([e,void 0]);})),PrepareTemporalFields(e,o)}function ToTemporalDateTimeFields(e,t){const o=[["day",void 0],["hour",0],["microsecond",0],["millisecond",0],["minute",0],["month",void 0],["monthCode",void 0],["nanosecond",0],["second",0],["year",void 0]];return t.forEach((e=>{o.some((([t])=>t===e))||o.push([e,void 0]);})),PrepareTemporalFields(e,o)}function ToTemporalMonthDayFields(e,t){const o=[["day",void 0],["month",void 0],["monthCode",void 0],["year",void 0]];return t.forEach((e=>{o.some((([t])=>t===e))||o.push([e,void 0]);})),PrepareTemporalFields(e,o)}function ToTemporalTimeRecord(e){return PrepareTemporalFields(e,[["hour",0],["microsecond",0],["millisecond",0],["minute",0],["nanosecond",0],["second",0]])}function ToTemporalYearMonthFields(e,t){const o=[["month",void 0],["monthCode",void 0],["year",void 0]];return t.forEach((e=>{o.some((([t])=>t===e))||o.push([e,void 0]);})),PrepareTemporalFields(e,o)}function ToTemporalDate(e,t=ye(null)){let o=e;if(IsObject(o)){if(IsTemporalDate(o))return o;if(IsTemporalZonedDateTime(o)&&(o=BuiltinTimeZoneGetPlainDateTimeFor(GetSlot(o,p),GetSlot(o,u),GetSlot(o,T))),IsTemporalDateTime(o))return CreateTemporalDate(GetSlot(o,r$1),GetSlot(o,a),GetSlot(o,i$1),GetSlot(o,T));const e=GetTemporalCalendarWithISODefault(o);return DateFromFields(e,ToTemporalDateFields(o,CalendarFields(e,["day","month","monthCode","year"])),t)}ToTemporalOverflow(t);const{year:n,month:s,day:l,calendar:d,z:m}=function ParseTemporalDateString(e){return ParseISODateTime(e)}(ToString(o));if(m)throw new RangeError("Z designator not supported for PlainDate");return new(GetIntrinsic("%Temporal.PlainDate%"))(n,s,l,d)}function InterpretTemporalDateTimeFields(e,t,o){let{hour:n,minute:s,second:l,millisecond:d,microsecond:m,nanosecond:c}=ToTemporalTimeRecord(t);const h=ToTemporalOverflow(o),T=DateFromFields(e,t,o),u=GetSlot(T,r$1),p=GetSlot(T,a),f=GetSlot(T,i$1);return ({hour:n,minute:s,second:l,millisecond:d,microsecond:m,nanosecond:c}=RegulateTime(n,s,l,d,m,c,h)),{year:u,month:p,day:f,hour:n,minute:s,second:l,millisecond:d,microsecond:m,nanosecond:c}}function ToTemporalDateTime(e,t=ye(null)){let o,n,s,l,d,m,c,h,f,y;if(IsObject(e)){if(IsTemporalDateTime(e))return e;if(IsTemporalZonedDateTime(e))return BuiltinTimeZoneGetPlainDateTimeFor(GetSlot(e,p),GetSlot(e,u),GetSlot(e,T));if(IsTemporalDate(e))return CreateTemporalDateTime(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1),0,0,0,0,0,0,GetSlot(e,T));y=GetTemporalCalendarWithISODefault(e);const S=ToTemporalDateTimeFields(e,CalendarFields(y,["day","hour","microsecond","millisecond","minute","month","monthCode","nanosecond","second","year"]));({year:o,month:n,day:s,hour:l,minute:d,second:m,millisecond:c,microsecond:h,nanosecond:f}=InterpretTemporalDateTimeFields(y,S,t));}else {let r;if(ToTemporalOverflow(t),({year:o,month:n,day:s,hour:l,minute:d,second:m,millisecond:c,microsecond:h,nanosecond:f,calendar:y,z:r}=function ParseTemporalDateTimeString(e){return ParseISODateTime(e)}(ToString(e))),r)throw new RangeError("Z designator not supported for PlainDateTime");RejectDateTime(o,n,s,l,d,m,c,h,f),void 0===y&&(y=GetISO8601Calendar()),y=ToTemporalCalendar(y);}return CreateTemporalDateTime(o,n,s,l,d,m,c,h,f,y)}function ToTemporalDuration(e){let t,o,n,r,a,i,s,l,d,m;if(IsObject(e)){if(IsTemporalDuration(e))return e;({years:t,months:o,weeks:n,days:r,hours:a,minutes:i,seconds:s,milliseconds:l,microseconds:d,nanoseconds:m}=ToTemporalDurationRecord(e));}else ({years:t,months:o,weeks:n,days:r,hours:a,minutes:i,seconds:s,milliseconds:l,microseconds:d,nanoseconds:m}=ParseTemporalDurationString(ToString(e)));return new(GetIntrinsic("%Temporal.Duration%"))(t,o,n,r,a,i,s,l,d,m)}function ToTemporalInstant(e){if(IsTemporalInstant(e))return e;if(IsTemporalZonedDateTime(e)){return new(GetIntrinsic("%Temporal.Instant%"))(GetSlot(e,o))}const t=ParseTemporalInstant(ToString(e));return new(GetIntrinsic("%Temporal.Instant%"))(t)}function ToTemporalMonthDay(e,t=ye(null)){if(IsObject(e)){if(IsTemporalMonthDay(e))return e;let o,n;if(HasSlot(e,T))o=GetSlot(e,T),n=!1;else {let t=e.calendar;n=void 0===t,void 0===t&&(t=GetISO8601Calendar()),o=ToTemporalCalendar(t);}const r=ToTemporalMonthDayFields(e,CalendarFields(o,["day","month","monthCode","year"]));return n&&void 0!==r.month&&void 0===r.monthCode&&void 0===r.year&&(r.year=1972),MonthDayFromFields(o,r,t)}ToTemporalOverflow(t);let{month:o,day:n,referenceISOYear:r,calendar:a}=ParseTemporalMonthDayString(ToString(e)),i=a;if(void 0===i&&(i=GetISO8601Calendar()),i=ToTemporalCalendar(i),void 0===r)return RejectISODate(1972,o,n),CreateTemporalMonthDay(o,n,i);return MonthDayFromFields(i,CreateTemporalMonthDay(o,n,i,r),ye(null))}function ToTemporalTime(e,t="constrain"){let o,n,r,a,i,f,y,S=e;if(IsObject(S)){if(IsTemporalTime(S))return S;if(IsTemporalZonedDateTime(S)&&(S=BuiltinTimeZoneGetPlainDateTimeFor(GetSlot(S,p),GetSlot(S,u),GetSlot(S,T))),IsTemporalDateTime(S)){return new(GetIntrinsic("%Temporal.PlainTime%"))(GetSlot(S,s),GetSlot(S,l),GetSlot(S,d),GetSlot(S,m),GetSlot(S,c),GetSlot(S,h))}if(y=GetTemporalCalendarWithISODefault(S),"iso8601"!==ToString(y))throw new RangeError("PlainTime can only have iso8601 calendar");(({hour:o,minute:n,second:r,millisecond:a,microsecond:i,nanosecond:f}=ToTemporalTimeRecord(S))),({hour:o,minute:n,second:r,millisecond:a,microsecond:i,nanosecond:f}=RegulateTime(o,n,r,a,i,f,t));}else if(({hour:o,minute:n,second:r,millisecond:a,microsecond:i,nanosecond:f,calendar:y}=function ParseTemporalTimeString(e){const t=K.exec(e);let o,n,r,a,i,s,l;if(t){o=ToInteger(t[1]),n=ToInteger(t[2]||t[5]),r=ToInteger(t[3]||t[6]),60===r&&(r=59);const e=(t[4]||t[7])+"000000000";a=ToInteger(e.slice(0,3)),i=ToInteger(e.slice(3,6)),s=ToInteger(e.slice(6,9)),l=t[15];}else {let t,d;if(({hasTime:d,hour:o,minute:n,second:r,millisecond:a,microsecond:i,nanosecond:s,calendar:l,z:t}=ParseISODateTime(e)),!d)throw new RangeError(`time is missing in string: ${e}`);if(t)throw new RangeError("Z designator not supported for PlainTime")}if(/[tT ][0-9][0-9]/.test(e))return {hour:o,minute:n,second:r,millisecond:a,microsecond:i,nanosecond:s,calendar:l};try{const{month:t,day:o}=ParseTemporalMonthDayString(e);RejectISODate(1972,t,o);}catch{try{const{year:t,month:o}=ParseTemporalYearMonthString(e);RejectISODate(t,o,1);}catch{return {hour:o,minute:n,second:r,millisecond:a,microsecond:i,nanosecond:s,calendar:l}}}throw new RangeError(`invalid ISO 8601 time-only string ${e}; may need a T prefix`)}(ToString(S))),RejectTime(o,n,r,a,i,f),void 0!==y&&"iso8601"!==y)throw new RangeError("PlainTime can only have iso8601 calendar");return new(GetIntrinsic("%Temporal.PlainTime%"))(o,n,r,a,i,f)}function ToTemporalYearMonth(e,t=ye(null)){if(IsObject(e)){if(IsTemporalYearMonth(e))return e;const o=GetTemporalCalendarWithISODefault(e);return YearMonthFromFields(o,ToTemporalYearMonthFields(e,CalendarFields(o,["month","monthCode","year"])),t)}ToTemporalOverflow(t);let{year:o,month:n,referenceISODay:r,calendar:a}=ParseTemporalYearMonthString(ToString(e)),i=a;if(void 0===i&&(i=GetISO8601Calendar()),i=ToTemporalCalendar(i),void 0===r)return RejectISODate(o,n,1),CreateTemporalYearMonth(o,n,i);return YearMonthFromFields(i,CreateTemporalYearMonth(o,n,i,r),ye(null))}function InterpretISODateTimeOffset(t,r,a,i,s,l,d,m,c,h,T,u,p,f,y){const S=new(GetIntrinsic("%Temporal.PlainDateTime%"))(t,r,a,i,s,l,d,m,c);if("wall"===h||"ignore"===f){return GetSlot(BuiltinTimeZoneGetInstantFor(u,S,p),o)}if("exact"===h||"use"===f){const o=GetEpochFromISOParts(t,r,a,i,s,l,d,m,c);if(null===o)throw new RangeError("ZonedDateTime outside of supported range");return jsbiUmd.subtract(o,jsbiUmd.BigInt(T))}const g=GetPossibleInstantsFor(u,S);for(const t of g){const n=GetOffsetNanosecondsFor(u,t),r=jsbiUmd.toNumber(RoundNumberToIncrement(jsbiUmd.BigInt(n),6e10,"halfExpand"));if(n===T||y&&r===T)return GetSlot(t,o)}if("reject"===f){const e=FormatTimeZoneOffsetString(T),t=IsTemporalTimeZone(u)?GetSlot(u,n):"time zone";throw new RangeError(`Offset ${e} is invalid for ${S.toString()} in ${t}`)}return GetSlot(DisambiguatePossibleInstants(g,u,S,p),o)}function ToTemporalZonedDateTime(e,t=ye(null)){let o,n,r,a,i,s,l,d,m,c,h,T,u=!1,p="option";if(IsObject(e)){if(IsTemporalZonedDateTime(e))return e;T=GetTemporalCalendarWithISODefault(e);const u=function ToTemporalZonedDateTimeFields(e,t){const o=[["day",void 0],["hour",0],["microsecond",0],["millisecond",0],["minute",0],["month",void 0],["monthCode",void 0],["nanosecond",0],["second",0],["year",void 0],["offset",void 0],["timeZone"]];return t.forEach((e=>{o.some((([t])=>t===e))||o.push([e,void 0]);})),PrepareTemporalFields(e,o)}(e,CalendarFields(T,["day","hour","microsecond","millisecond","minute","month","monthCode","nanosecond","second","year"]));(({year:o,month:n,day:r,hour:a,minute:i,second:s,millisecond:l,microsecond:d,nanosecond:m}=InterpretTemporalDateTimeFields(T,u,t))),c=ToTemporalTimeZone(u.timeZone),h=u.offset,void 0===h?p="wall":h=ToString(h);}else {let f,y;if(ToTemporalOverflow(t),({year:o,month:n,day:r,hour:a,minute:i,second:s,millisecond:l,microsecond:d,nanosecond:m,ianaName:f,offset:h,z:y,calendar:T}=function ParseTemporalZonedDateTimeString(e){const t=ParseISODateTime(e);if(!t.ianaName)throw new RangeError("Temporal.ZonedDateTime requires a time zone ID in brackets");return t}(ToString(e))),!f)throw new RangeError("time zone ID required in brackets");y?p="exact":h||(p="wall");c=new(GetIntrinsic("%Temporal.TimeZone%"))(f),T||(T=GetISO8601Calendar()),T=ToTemporalCalendar(T),u=!0;}let f=0;"option"===p&&(f=ParseTimeZoneOffsetString(h));return CreateTemporalZonedDateTime(InterpretISODateTimeOffset(o,n,r,a,i,s,l,d,m,p,f,c,ToTemporalDisambiguation(t),ToTemporalOffset(t,"reject"),u),c,T)}function CreateTemporalDateSlots(e,t,o,n,s){RejectISODate(t,o,n),RejectDateRange(t,o,n),CreateSlots(e),SetSlot(e,r$1,t),SetSlot(e,a,o),SetSlot(e,i$1,n),SetSlot(e,T,s),SetSlot(e,"slot-date-brand",!0);}function CreateTemporalDate(e,t,o,n=GetISO8601Calendar()){const r=GetIntrinsic("%Temporal.PlainDate%"),a=ye(r.prototype);return CreateTemporalDateSlots(a,e,t,o,n),a}function CreateTemporalDateTimeSlots(e,t,o,n,u,p,f,y,S,g,w){RejectDateTime(t,o,n,u,p,f,y,S,g),RejectDateTimeRange(t,o,n,u,p,f,y,S,g),CreateSlots(e),SetSlot(e,r$1,t),SetSlot(e,a,o),SetSlot(e,i$1,n),SetSlot(e,s,u),SetSlot(e,l,p),SetSlot(e,d,f),SetSlot(e,m,y),SetSlot(e,c,S),SetSlot(e,h,g),SetSlot(e,T,w);}function CreateTemporalDateTime(e,t,o,n,r,a,i,s,l,d=GetISO8601Calendar()){const m=GetIntrinsic("%Temporal.PlainDateTime%"),c=ye(m.prototype);return CreateTemporalDateTimeSlots(c,e,t,o,n,r,a,i,s,l,d),c}function CreateTemporalMonthDaySlots(e,t,o,n,s){RejectISODate(s,t,o),RejectDateRange(s,t,o),CreateSlots(e),SetSlot(e,a,t),SetSlot(e,i$1,o),SetSlot(e,r$1,s),SetSlot(e,T,n),SetSlot(e,"slot-month-day-brand",!0);}function CreateTemporalMonthDay(e,t,o=GetISO8601Calendar(),n=1972){const r=GetIntrinsic("%Temporal.PlainMonthDay%"),a=ye(r.prototype);return CreateTemporalMonthDaySlots(a,e,t,o,n),a}function CreateTemporalYearMonthSlots(e,t,o,n,s){RejectISODate(t,o,s),function RejectYearMonthRange(e,t){RejectToRange(e,-271821,275760),-271821===e?RejectToRange(t,4,12):275760===e&&RejectToRange(t,1,9);}(t,o),CreateSlots(e),SetSlot(e,r$1,t),SetSlot(e,a,o),SetSlot(e,i$1,s),SetSlot(e,T,n),SetSlot(e,"slot-year-month-brand",!0);}function CreateTemporalYearMonth(e,t,o=GetISO8601Calendar(),n=1){const r=GetIntrinsic("%Temporal.PlainYearMonth%"),a=ye(r.prototype);return CreateTemporalYearMonthSlots(a,e,t,o,n),a}function CreateTemporalZonedDateTimeSlots(e,t,n,r){ValidateEpochNanoseconds(t),CreateSlots(e),SetSlot(e,o,t),SetSlot(e,p,n),SetSlot(e,T,r);const a=new(GetIntrinsic("%Temporal.Instant%"))(GetSlot(e,o));SetSlot(e,u,a);}function CreateTemporalZonedDateTime(e,t,o=GetISO8601Calendar()){const n=GetIntrinsic("%Temporal.ZonedDateTime%"),r=ye(n.prototype);return CreateTemporalZonedDateTimeSlots(r,e,t,o),r}function GetISO8601Calendar(){return new(GetIntrinsic("%Temporal.Calendar%"))("iso8601")}function CalendarFields(e,t){let o=t;e.fields&&(o=e.fields(o));const n=[];for(const e of o){if("string"!=typeof e)throw new TypeError("bad return from calendar.fields()");re$1.call(n,e);}return n}function CalendarMergeFields(e,t,o){const n=e.mergeFields;if(!n)return {...t,...o};const r=Reflect.apply(n,e,[t,o]);if(!IsObject(r))throw new TypeError("bad return from calendar.mergeFields()");return r}function CalendarDateAdd(e,t,o,n,r){let a=r;void 0===a&&(a=e.dateAdd);const i=ge(a,e,[t,o,n]);if(!IsTemporalDate(i))throw new TypeError("invalid result");return i}function CalendarDateUntil(e,t,o,n,r){let a=r;void 0===a&&(a=e.dateUntil);const i=ge(a,e,[t,o,n]);if(!IsTemporalDuration(i))throw new TypeError("invalid result");return i}function CalendarYear(e,t){const o=e.year(t);if(void 0===o)throw new RangeError("calendar year result must be an integer");return ToIntegerThrowOnInfinity(o)}function CalendarMonth(e,t){const o=e.month(t);if(void 0===o)throw new RangeError("calendar month result must be a positive integer");return ToPositiveInteger(o)}function CalendarMonthCode(e,t){const o=e.monthCode(t);if(void 0===o)throw new RangeError("calendar monthCode result must be a string");return ToString(o)}function CalendarDay(e,t){const o=e.day(t);if(void 0===o)throw new RangeError("calendar day result must be a positive integer");return ToPositiveInteger(o)}function CalendarEra(e,t){let o=e.era(t);return void 0!==o&&(o=ToString(o)),o}function CalendarEraYear(e,t){let o=e.eraYear(t);return void 0!==o&&(o=ToIntegerThrowOnInfinity(o)),o}function CalendarDayOfWeek(e,t){return e.dayOfWeek(t)}function CalendarDayOfYear(e,t){return e.dayOfYear(t)}function CalendarWeekOfYear(e,t){return e.weekOfYear(t)}function CalendarDaysInWeek(e,t){return e.daysInWeek(t)}function CalendarDaysInMonth(e,t){return e.daysInMonth(t)}function CalendarDaysInYear(e,t){return e.daysInYear(t)}function CalendarMonthsInYear(e,t){return e.monthsInYear(t)}function CalendarInLeapYear(e,t){return e.inLeapYear(t)}function ToTemporalCalendar(e){let t=e;if(IsObject(t)){if(HasSlot(t,T))return GetSlot(t,T);if(!("calendar"in t))return t;if(t=t.calendar,IsObject(t)&&!("calendar"in t))return t}const o=ToString(t),n=GetIntrinsic("%Temporal.Calendar%");if(IsBuiltinCalendar(o))return new n(o);let r;try{({calendar:r}=ParseISODateTime(o));}catch{throw new RangeError(`Invalid calendar: ${o}`)}return r||(r="iso8601"),new n(r)}function GetTemporalCalendarWithISODefault(e){if(HasSlot(e,T))return GetSlot(e,T);const{calendar:t}=e;return void 0===t?GetISO8601Calendar():ToTemporalCalendar(t)}function CalendarEquals(e,t){if(e===t)return !0;return ToString(e)===ToString(t)}function ConsolidateCalendars(e,t){if(e===t)return t;const o=ToString(e),n=ToString(t);if(o===n||"iso8601"===o)return t;if("iso8601"===n)return e;throw new RangeError("irreconcilable calendars")}function DateFromFields(e,t,o){const n=e.dateFromFields(t,o);if(!IsTemporalDate(n))throw new TypeError("invalid result");return n}function YearMonthFromFields(e,t,o){const n=e.yearMonthFromFields(t,o);if(!IsTemporalYearMonth(n))throw new TypeError("invalid result");return n}function MonthDayFromFields(e,t,o){const n=e.monthDayFromFields(t,o);if(!IsTemporalMonthDay(n))throw new TypeError("invalid result");return n}function ToTemporalTimeZone(e){let t=e;if(IsObject(t)){if(IsTemporalZonedDateTime(t))return GetSlot(t,p);if(!("timeZone"in t))return t;if(t=t.timeZone,IsObject(t)&&!("timeZone"in t))return t}const o=ParseTemporalTimeZone(ToString(t));return new(GetIntrinsic("%Temporal.TimeZone%"))(o)}function TimeZoneEquals(e,t){if(e===t)return !0;return ToString(e)===ToString(t)}function TemporalDateTimeToDate(e){return CreateTemporalDate(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1),GetSlot(e,T))}function TemporalDateTimeToTime(e){return new(GetIntrinsic("%Temporal.PlainTime%"))(GetSlot(e,s),GetSlot(e,l),GetSlot(e,d),GetSlot(e,m),GetSlot(e,c),GetSlot(e,h))}function GetOffsetNanosecondsFor(e,t){let o=e.getOffsetNanosecondsFor;if("function"!=typeof o)throw new TypeError("getOffsetNanosecondsFor not callable");const n=Reflect.apply(o,e,[t]);if("number"!=typeof n)throw new TypeError("bad return from getOffsetNanosecondsFor");if(!IsInteger(n)||le(n)>864e11)throw new RangeError("out-of-range return from getOffsetNanosecondsFor");return n}function BuiltinTimeZoneGetOffsetStringFor(e,t){return FormatTimeZoneOffsetString(GetOffsetNanosecondsFor(e,t))}function BuiltinTimeZoneGetPlainDateTimeFor(e,t,n){const r=GetSlot(t,o),a=GetOffsetNanosecondsFor(e,t);let{year:i,month:s,day:l,hour:d,minute:m,second:c,millisecond:h,microsecond:T,nanosecond:u}=GetISOPartsFromEpoch(r);return ({year:i,month:s,day:l,hour:d,minute:m,second:c,millisecond:h,microsecond:T,nanosecond:u}=BalanceISODateTime(i,s,l,d,m,c,h,T,u+a)),CreateTemporalDateTime(i,s,l,d,m,c,h,T,u,n)}function BuiltinTimeZoneGetInstantFor(e,t,o){return DisambiguatePossibleInstants(GetPossibleInstantsFor(e,t),e,t,o)}function DisambiguatePossibleInstants(t,o,n,u){const p=GetIntrinsic("%Temporal.Instant%"),f=t.length;if(1===f)return t[0];if(f)switch(u){case"compatible":case"earlier":return t[0];case"later":return t[f-1];case"reject":throw new RangeError("multiple instants found")}const y=GetSlot(n,r$1),S=GetSlot(n,a),g=GetSlot(n,i$1),w=GetSlot(n,s),I=GetSlot(n,l),G=GetSlot(n,d),D=GetSlot(n,m),v=GetSlot(n,c),O=GetSlot(n,h),C=GetEpochFromISOParts(y,S,g,w,I,G,D,v,O);if(null===C)throw new RangeError("DateTime outside of supported range");const E=new p(jsbiUmd.subtract(C,Ee)),b=new p(jsbiUmd.add(C,Ee)),R=GetOffsetNanosecondsFor(o,E),M=GetOffsetNanosecondsFor(o,b)-R;switch(u){case"earlier":{const e=GetSlot(n,T),t=GetIntrinsic("%Temporal.PlainDateTime%"),r=AddDateTime(y,S,g,w,I,G,D,v,O,e,0,0,0,0,0,0,0,0,0,-M,void 0);return GetPossibleInstantsFor(o,new t(r.year,r.month,r.day,r.hour,r.minute,r.second,r.millisecond,r.microsecond,r.nanosecond,e))[0]}case"compatible":case"later":{const e=GetSlot(n,T),t=GetIntrinsic("%Temporal.PlainDateTime%"),r=AddDateTime(y,S,g,w,I,G,D,v,O,e,0,0,0,0,0,0,0,0,0,M,void 0),a=GetPossibleInstantsFor(o,new t(r.year,r.month,r.day,r.hour,r.minute,r.second,r.millisecond,r.microsecond,r.nanosecond,e));return a[a.length-1]}case"reject":throw new RangeError("no such instant found")}}function GetPossibleInstantsFor(e,t){const o=e.getPossibleInstantsFor(t),n=[];for(const e of o){if(!IsTemporalInstant(e))throw new TypeError("bad return from getPossibleInstantsFor");re$1.call(n,e);}return n}function ISOYearString(e){let t;if(e<1e3||e>9999){t=(e<0?"-":"+")+`000000${le(e)}`.slice(-6);}else t=`${e}`;return t}function ISODateTimePartString(e){return `00${e}`.slice(-2)}function FormatSecondsStringPart(e,t,o,n,r){if("minute"===r)return "";const a=`:${ISODateTimePartString(e)}`;let i,s=1e6*t+1e3*o+n;if("auto"===r){if(0===s)return a;for(i=`${s}`.padStart(9,"0");"0"===i[i.length-1];)i=i.slice(0,-1);}else {if(0===r)return a;i=`${s}`.padStart(9,"0").slice(0,r);}return `${a}.${i}`}function TemporalInstantToString(e,t,o){let n=t;if(void 0===n){n=new(GetIntrinsic("%Temporal.TimeZone%"))("UTC");}const T=BuiltinTimeZoneGetPlainDateTimeFor(n,e,GetISO8601Calendar()),u=ISOYearString(GetSlot(T,r$1)),p=ISODateTimePartString(GetSlot(T,a)),f=ISODateTimePartString(GetSlot(T,i$1)),y=ISODateTimePartString(GetSlot(T,s)),S=ISODateTimePartString(GetSlot(T,l)),g=FormatSecondsStringPart(GetSlot(T,d),GetSlot(T,m),GetSlot(T,c),GetSlot(T,h),o);let w="Z";if(void 0!==t){w=FormatISOTimeZoneOffsetString(GetOffsetNanosecondsFor(n,e));}return `${u}-${p}-${f}T${y}:${S}${g}${w}`}function TemporalDurationToString(t,o="auto",n){function formatNumber(t){return t<=fe?t.toString(10):jsbiUmd.BigInt(t).toString(10)}const r=GetSlot(t,f),a=GetSlot(t,y),i=GetSlot(t,S),s=GetSlot(t,g),l=GetSlot(t,w),d=GetSlot(t,I);let m=GetSlot(t,G),c=GetSlot(t,D),h=GetSlot(t,v),T=GetSlot(t,O);const u=DurationSign(r,a,i,s,l,d,m,c,h,T);if(n){const{unit:e,increment:t,roundingMode:o}=n;({seconds:m,milliseconds:c,microseconds:h,nanoseconds:T}=RoundDuration(0,0,0,0,0,0,m,c,h,T,t,e,o));}const p=[];r&&p.push(`${formatNumber(le(r))}Y`),a&&p.push(`${formatNumber(le(a))}M`),i&&p.push(`${formatNumber(le(i))}W`),s&&p.push(`${formatNumber(le(s))}D`);const C=[];l&&C.push(`${formatNumber(le(l))}H`),d&&C.push(`${formatNumber(le(d))}M`);const E=[];let b,R,M,Z,F=TotalDurationNanoseconds(0,0,0,m,c,h,T,0);(({quotient:F,remainder:b}=divmod(F,De))),({quotient:F,remainder:R}=divmod(F,De)),({quotient:Z,remainder:M}=divmod(F,De));const Y=1e6*le(jsbiUmd.toNumber(M))+1e3*le(jsbiUmd.toNumber(R))+le(jsbiUmd.toNumber(b));let P;if("auto"===o){if(0!==Y)for(P=`${Y}`.padStart(9,"0");"0"===P[P.length-1];)P=P.slice(0,-1);}else 0!==o&&(P=`${Y}`.padStart(9,"0").slice(0,o));return P&&E.unshift(".",P),jsbiUmd.equal(Z,we)&&!E.length&&"auto"===o||E.unshift(abs(Z).toString()),E.length&&C.push(`${E.join("")}S`),C.length&&C.unshift("T"),p.length||C.length?`${u<0?"-":""}P${p.join("")}${C.join("")}`:"PT0S"}function TemporalDateToString(e,t="auto"){return `${ISOYearString(GetSlot(e,r$1))}-${ISODateTimePartString(GetSlot(e,a))}-${ISODateTimePartString(GetSlot(e,i$1))}${FormatCalendarAnnotation(ToString(GetSlot(e,T)),t)}`}function TemporalDateTimeToString(e,t,o="auto",n){let u=GetSlot(e,r$1),p=GetSlot(e,a),f=GetSlot(e,i$1),y=GetSlot(e,s),S=GetSlot(e,l),g=GetSlot(e,d),w=GetSlot(e,m),I=GetSlot(e,c),G=GetSlot(e,h);if(n){const{unit:e,increment:t,roundingMode:o}=n;({year:u,month:p,day:f,hour:y,minute:S,second:g,millisecond:w,microsecond:I,nanosecond:G}=RoundISODateTime(u,p,f,y,S,g,w,I,G,t,e,o));}return `${ISOYearString(u)}-${ISODateTimePartString(p)}-${ISODateTimePartString(f)}T${ISODateTimePartString(y)}:${ISODateTimePartString(S)}${FormatSecondsStringPart(g,w,I,G,t)}${FormatCalendarAnnotation(ToString(GetSlot(e,T)),o)}`}function TemporalMonthDayToString(e,t="auto"){let o=`${ISODateTimePartString(GetSlot(e,a))}-${ISODateTimePartString(GetSlot(e,i$1))}`;const n=ToString(GetSlot(e,T));if("iso8601"!==n){o=`${ISOYearString(GetSlot(e,r$1))}-${o}`;}const s=FormatCalendarAnnotation(n,t);return s&&(o+=s),o}function TemporalYearMonthToString(e,t="auto"){let o=`${ISOYearString(GetSlot(e,r$1))}-${ISODateTimePartString(GetSlot(e,a))}`;const n=ToString(GetSlot(e,T));if("iso8601"!==n){o+=`-${ISODateTimePartString(GetSlot(e,i$1))}`;}const s=FormatCalendarAnnotation(n,t);return s&&(o+=s),o}function TemporalZonedDateTimeToString(e,t,n="auto",f="auto",y="auto",S){let g=GetSlot(e,u);if(S){const{unit:t,increment:n,roundingMode:r}=S,a=RoundInstant(GetSlot(e,o),n,t,r);g=new(GetIntrinsic("%Temporal.Instant%"))(a);}const w=GetSlot(e,p),I=BuiltinTimeZoneGetPlainDateTimeFor(w,g,GetISO8601Calendar());let G=`${ISOYearString(GetSlot(I,r$1))}-${ISODateTimePartString(GetSlot(I,a))}-${ISODateTimePartString(GetSlot(I,i$1))}T${ISODateTimePartString(GetSlot(I,s))}:${ISODateTimePartString(GetSlot(I,l))}${FormatSecondsStringPart(GetSlot(I,d),GetSlot(I,m),GetSlot(I,c),GetSlot(I,h),t)}`;if("never"!==y){G+=FormatISOTimeZoneOffsetString(GetOffsetNanosecondsFor(w,g));}"never"!==f&&(G+=`[${w}]`);return G+=FormatCalendarAnnotation(ToString(GetSlot(e,T)),n),G}function TestTimeZoneOffsetString(e){return ke.test(pe(e))}function ParseTimeZoneOffsetString(e){const t=ke.exec(pe(e));if(!t)throw new RangeError(`invalid time zone offset: ${e}`);return ("-"===t[1]||"−"===t[1]?-1:1)*(1e9*(60*(60*+t[2]+ +(t[3]||0))+ +(t[4]||0))+ +((t[5]||0)+"000000000").slice(0,9))}function GetCanonicalTimeZoneIdentifier(e){if(TestTimeZoneOffsetString(e)){return FormatTimeZoneOffsetString(ParseTimeZoneOffsetString(e))}return getIntlDateTimeFormatEnUsForTimeZone(pe(e)).resolvedOptions().timeZone}function GetIANATimeZoneOffsetNanoseconds(t,o){const{year:n,month:r,day:a,hour:i,minute:s,second:l,millisecond:d,microsecond:m,nanosecond:c}=GetIANATimeZoneDateTimeParts(t,o),h=GetEpochFromISOParts(n,r,a,i,s,l,d,m,c);if(null===h)throw new RangeError("Date outside of supported range");return jsbiUmd.toNumber(jsbiUmd.subtract(h,t))}function FormatTimeZoneOffsetString(e){const t=e<0?"-":"+",o=le(e),n=o%1e9,r=de(o/1e9)%60,a=de(o/6e10)%60,i=ISODateTimePartString(de(o/36e11)),s=ISODateTimePartString(a),l=ISODateTimePartString(r);let d="";if(n){let e=`${n}`.padStart(9,"0");for(;"0"===e[e.length-1];)e=e.slice(0,-1);d=`:${l}.${e}`;}else r&&(d=`:${l}`);return `${t}${i}:${s}${d}`}function FormatISOTimeZoneOffsetString(t){let o=jsbiUmd.toNumber(RoundNumberToIncrement(jsbiUmd.BigInt(t),6e10,"halfExpand"));const n=o<0?"-":"+";o=le(o);const r=o/6e10%60;return `${n}${ISODateTimePartString(de(o/36e11))}:${ISODateTimePartString(r)}`}function GetEpochFromISOParts(t,o,n,r,a,i,s,l,d){const m=new Date;m.setUTCHours(r,a,i,s),m.setUTCFullYear(t,o-1,n);const c=m.getTime();if(he(c))return null;let h=jsbiUmd.multiply(jsbiUmd.BigInt(c),ve);return h=jsbiUmd.add(h,jsbiUmd.multiply(jsbiUmd.BigInt(l),De)),h=jsbiUmd.add(h,jsbiUmd.BigInt(d)),jsbiUmd.lessThan(h,be)||jsbiUmd.greaterThan(h,Re)?null:h}function GetISOPartsFromEpoch(t){const{quotient:o,remainder:n}=divmod(t,ve);let r=jsbiUmd.toNumber(o),a=jsbiUmd.toNumber(n);a<0&&(a+=1e6,r-=1);const i=de(a/1e3)%1e3,s=a%1e3,l=new Date(r);return {epochMilliseconds:r,year:l.getUTCFullYear(),month:l.getUTCMonth()+1,day:l.getUTCDate(),hour:l.getUTCHours(),minute:l.getUTCMinutes(),second:l.getUTCSeconds(),millisecond:l.getUTCMilliseconds(),microsecond:i,nanosecond:s}}function GetIANATimeZoneDateTimeParts(e,t){const{epochMilliseconds:o,millisecond:n,microsecond:r,nanosecond:a}=GetISOPartsFromEpoch(e),{year:i,month:s,day:l,hour:d,minute:m,second:c}=function GetFormatterParts(e,t){const o=getIntlDateTimeFormatEnUsForTimeZone(e);return function parseFromEnUsFormat(e){const t=e.split(/[^\w]+/);if(7!==t.length)throw new RangeError(`expected 7 parts in "${e}`);const o=+t[0],n=+t[1];let r=+t[2];const a=t[3].toUpperCase();if("B"===a||"BC"===a)r=1-r;else if("A"!==a&&"AD"!==a)throw new RangeError(`Unknown era ${a} in "${e}`);let i=+t[4];24===i&&(i=0);const s=+t[5],l=+t[6];if(!(Te(r)&&Te(o)&&Te(n)&&Te(i)&&Te(s)&&Te(l)))throw new RangeError(`Invalid number in "${e}`);return {year:r,month:o,day:n,hour:i,minute:s,second:l}}(o.format(new Date(t)))}(t,o);return BalanceISODateTime(i,s,l,d,m,c,n,r,a)}function maxJSBI(t,o){return jsbiUmd.lessThan(t,o)?o:t}function afterLatestPossibleTzdbRuleChange(){return jsbiUmd.add($e(),Ze)}function GetIANATimeZonePreviousTransition(t,o){const n=afterLatestPossibleTzdbRuleChange(),r=jsbiUmd.greaterThan(t,n),a=r?jsbiUmd.subtract(t,Fe):Me;let i=jsbiUmd.subtract(t,Ie);const s=GetIANATimeZoneOffsetNanoseconds(i,o);let l=i,d=s;for(;s===d&&jsbiUmd.greaterThan(i,a);)l=jsbiUmd.subtract(i,Ye),d=GetIANATimeZoneOffsetNanoseconds(l,o),s===d&&(i=l);if(s===d){if(r){return GetIANATimeZonePreviousTransition(jsbiUmd.subtract(n,Ee),o)}return null}return bisect((e=>GetIANATimeZoneOffsetNanoseconds(e,o)),l,i,d,s)}function LeapYear(e){if(void 0===e)return !1;return e%4==0&&(!(e%100==0)||e%400==0)}function ISODaysInMonth(e,t){return {standard:[31,28,31,30,31,30,31,31,30,31,30,31],leapyear:[31,29,31,30,31,30,31,31,30,31,30,31]}[LeapYear(e)?"leapyear":"standard"][t-1]}function DayOfWeek(e,t,o){const n=t+(t<3?10:-2),r=e-(t<3?1:0),a=de(r/100),i=r-100*a,s=(o+de(2.6*n-.2)+(i+de(i/4))+(de(a/4)-2*a))%7;return s+(s<=0?7:0)}function DayOfYear(e,t,o){let n=o;for(let o=t-1;o>0;o--)n+=ISODaysInMonth(e,o);return n}function DurationSign(e,t,o,n,r,a,i,s,l,d){for(const m of [e,t,o,n,r,a,i,s,l,d])if(0!==m)return m<0?-1:1;return 0}function BalanceISOYearMonth(e,t){let o=e,n=t;if(!Te(o)||!Te(n))throw new RangeError("infinity is out of range");return n-=1,o+=de(n/12),n%=12,n<0&&(n+=12),n+=1,{year:o,month:n}}function BalanceISODate(e,t,o){let n=e,r=t,a=o;if(!Te(a))throw new RangeError("infinity is out of range");({year:n,month:r}=BalanceISOYearMonth(n,r));let i=0,s=r>2?n:n-1;for(;i=LeapYear(s)?366:365,a<-i;)n-=1,s-=1,a+=i;for(s+=1;i=LeapYear(s)?366:365,a>i;)n+=1,s+=1,a-=i;for(;a<1;)(({year:n,month:r}=BalanceISOYearMonth(n,r-1))),a+=ISODaysInMonth(n,r);for(;a>ISODaysInMonth(n,r);)a-=ISODaysInMonth(n,r),({year:n,month:r}=BalanceISOYearMonth(n,r+1));return {year:n,month:r,day:a}}function BalanceISODateTime(e,t,o,n,r,a,i,s,l){const{deltaDays:d,hour:m,minute:c,second:h,millisecond:T,microsecond:u,nanosecond:p}=BalanceTime(n,r,a,i,s,l),{year:f,month:y,day:S}=BalanceISODate(e,t,o+d);return {year:f,month:y,day:S,hour:m,minute:c,second:h,millisecond:T,microsecond:u,nanosecond:p}}function BalanceTime(e,t,o,n,r,a){let i=e,s=t,l=o,d=n,m=r,c=a;if(!(Te(i)&&Te(s)&&Te(l)&&Te(d)&&Te(m)&&Te(c)))throw new RangeError("infinity is out of range");m+=de(c/1e3),c=NonNegativeModulo(c,1e3),d+=de(m/1e3),m=NonNegativeModulo(m,1e3),l+=de(d/1e3),d=NonNegativeModulo(d,1e3),s+=de(l/60),l=NonNegativeModulo(l,60),i+=de(s/60),s=NonNegativeModulo(s,60);const h=de(i/24);return i=NonNegativeModulo(i,24),{deltaDays:h,hour:i,minute:s,second:l,millisecond:d,microsecond:m,nanosecond:c}}function TotalDurationNanoseconds(t,o,n,r,a,i,s,l){const d=jsbiUmd.BigInt(t);let m=jsbiUmd.BigInt(s);0!==t&&(m=jsbiUmd.subtract(jsbiUmd.BigInt(s),jsbiUmd.BigInt(l)));const c=jsbiUmd.add(jsbiUmd.BigInt(o),jsbiUmd.multiply(d,jsbiUmd.BigInt(24))),h=jsbiUmd.add(jsbiUmd.BigInt(n),jsbiUmd.multiply(c,Ge)),T=jsbiUmd.add(jsbiUmd.BigInt(r),jsbiUmd.multiply(h,Ge)),u=jsbiUmd.add(jsbiUmd.BigInt(a),jsbiUmd.multiply(T,De)),p=jsbiUmd.add(jsbiUmd.BigInt(i),jsbiUmd.multiply(u,De));return jsbiUmd.add(jsbiUmd.BigInt(m),jsbiUmd.multiply(p,De))}function NanosecondsToDays(t,n){const f=GetIntrinsic("%Temporal.Instant%"),y=me(jsbiUmd.toNumber(t));let S=jsbiUmd.BigInt(t),g=864e11;if(0===y)return {days:0,nanoseconds:we,dayLengthNs:g};if(!IsTemporalZonedDateTime(n)){let t;return ({quotient:t,remainder:S}=divmod(S,jsbiUmd.BigInt(g))),{days:jsbiUmd.toNumber(t),nanoseconds:S,dayLengthNs:g}}const w=GetSlot(n,o),I=GetSlot(n,u),G=jsbiUmd.add(w,S),D=new f(G),v=GetSlot(n,p),O=GetSlot(n,T),C=BuiltinTimeZoneGetPlainDateTimeFor(v,I,O),E=BuiltinTimeZoneGetPlainDateTimeFor(v,D,O);let{days:b}=DifferenceISODateTime(GetSlot(C,r$1),GetSlot(C,a),GetSlot(C,i$1),GetSlot(C,s),GetSlot(C,l),GetSlot(C,d),GetSlot(C,m),GetSlot(C,c),GetSlot(C,h),GetSlot(E,r$1),GetSlot(E,a),GetSlot(E,i$1),GetSlot(E,s),GetSlot(E,l),GetSlot(E,d),GetSlot(E,m),GetSlot(E,c),GetSlot(E,h),O,"day"),R=AddZonedDateTime(I,v,O,0,0,0,b,0,0,0,0,0,0);if(1===y)for(;b>0&&jsbiUmd.greaterThan(R,G);)--b,R=AddZonedDateTime(I,v,O,0,0,0,b,0,0,0,0,0,0);S=jsbiUmd.subtract(G,R);let M=!1,Z=new f(R);do{const t=AddZonedDateTime(Z,v,O,0,0,0,y,0,0,0,0,0,0),n=GetSlot(Z,o);g=jsbiUmd.toNumber(jsbiUmd.subtract(t,n)),M=jsbiUmd.greaterThan(jsbiUmd.multiply(jsbiUmd.subtract(S,jsbiUmd.BigInt(g)),jsbiUmd.BigInt(y)),we),M&&(S=jsbiUmd.subtract(S,jsbiUmd.BigInt(g)),Z=new f(t),b+=y);}while(M);return {days:b,nanoseconds:S,dayLengthNs:le(g)}}function BalanceDuration(t,n,r,a,i,s,l,d,m){let c,h,f,y,S,g,w=t;if(IsTemporalZonedDateTime(m)){const t=AddZonedDateTime(GetSlot(m,u),GetSlot(m,p),GetSlot(m,T),0,0,0,w,n,r,a,i,s,l),d=GetSlot(m,o);c=jsbiUmd.subtract(t,d);}else c=TotalDurationNanoseconds(w,n,r,a,i,s,l,0);"year"===d||"month"===d||"week"===d||"day"===d?({days:w,nanoseconds:c}=NanosecondsToDays(c,m)):w=0;const I=jsbiUmd.lessThan(c,we)?-1:1;switch(c=abs(c),h=f=y=S=g=we,d){case"year":case"month":case"week":case"day":case"hour":(({quotient:h,remainder:c}=divmod(c,De))),({quotient:f,remainder:h}=divmod(h,De)),({quotient:y,remainder:f}=divmod(f,De)),({quotient:S,remainder:y}=divmod(y,Ge)),({quotient:g,remainder:S}=divmod(S,Ge));break;case"minute":(({quotient:h,remainder:c}=divmod(c,De))),({quotient:f,remainder:h}=divmod(h,De)),({quotient:y,remainder:f}=divmod(f,De)),({quotient:S,remainder:y}=divmod(y,Ge));break;case"second":(({quotient:h,remainder:c}=divmod(c,De))),({quotient:f,remainder:h}=divmod(h,De)),({quotient:y,remainder:f}=divmod(f,De));break;case"millisecond":(({quotient:h,remainder:c}=divmod(c,De))),({quotient:f,remainder:h}=divmod(h,De));break;case"microsecond":({quotient:h,remainder:c}=divmod(c,De));break;case"nanosecond":break;default:throw new Error("assert not reached")}return {days:w,hours:jsbiUmd.toNumber(g)*I,minutes:jsbiUmd.toNumber(S)*I,seconds:jsbiUmd.toNumber(y)*I,milliseconds:jsbiUmd.toNumber(f)*I,microseconds:jsbiUmd.toNumber(h)*I,nanoseconds:jsbiUmd.toNumber(c)*I}}function UnbalanceDurationRelative(e,t,o,n,r,a){let i=e,s=t,l=o,d=n;const m=GetIntrinsic("%Temporal.Duration%"),c=DurationSign(i,s,l,d,0,0,0,0,0,0);let h,u;a&&(u=ToTemporalDate(a),h=GetSlot(u,T));const p=new m(c),f=new m(0,c),S=new m(0,0,c);switch(r){case"year":break;case"month":{if(!h)throw new RangeError("a starting point is required for months balancing");const e=h.dateAdd,t=h.dateUntil;let o=u;for(;le(i)>0;){const n=CalendarDateAdd(h,o,p,ye(null),e),r=ye(null);r.largestUnit="month";const a=GetSlot(CalendarDateUntil(h,o,n,r,t),y);o=n,s+=a,i-=c;}}break;case"week":if(!h)throw new RangeError("a starting point is required for weeks balancing");for(;le(i)>0;){let e;(({relativeTo:u,days:e}=MoveRelativeDate(h,u,p))),d+=e,i-=c;}for(;le(s)>0;){let e;(({relativeTo:u,days:e}=MoveRelativeDate(h,u,f))),d+=e,s-=c;}break;default:for(;le(i)>0;){if(!h)throw new RangeError("a starting point is required for balancing calendar units");let e;(({relativeTo:u,days:e}=MoveRelativeDate(h,u,p))),d+=e,i-=c;}for(;le(s)>0;){if(!h)throw new RangeError("a starting point is required for balancing calendar units");let e;(({relativeTo:u,days:e}=MoveRelativeDate(h,u,f))),d+=e,s-=c;}for(;le(l)>0;){if(!h)throw new RangeError("a starting point is required for balancing calendar units");let e;(({relativeTo:u,days:e}=MoveRelativeDate(h,u,S))),d+=e,l-=c;}}return {years:i,months:s,weeks:l,days:d}}function CalculateOffsetShift(e,t,o,n,r,a,i,s,l,d,m){if(IsTemporalZonedDateTime(e)){const c=GetSlot(e,u),h=GetSlot(e,p),f=GetSlot(e,T),y=GetOffsetNanosecondsFor(h,c),S=AddZonedDateTime(c,h,f,t,o,n,r,a,i,s,l,d,m);return GetOffsetNanosecondsFor(h,new(GetIntrinsic("%Temporal.Instant%"))(S))-y}return 0}function CreateNegatedTemporalDuration(e){return new(GetIntrinsic("%Temporal.Duration%"))(-GetSlot(e,f),-GetSlot(e,y),-GetSlot(e,S),-GetSlot(e,g),-GetSlot(e,w),-GetSlot(e,I),-GetSlot(e,G),-GetSlot(e,D),-GetSlot(e,v),-GetSlot(e,O))}function ConstrainToRange(e,t,o){return ie(o,se(t,e))}function ConstrainISODate(e,t,o){const n=ConstrainToRange(t,1,12);return {year:e,month:n,day:ConstrainToRange(o,1,ISODaysInMonth(e,n))}}function RejectToRange(e,t,o){if(e<t||e>o)throw new RangeError(`value out of range: ${t} <= ${e} <= ${o}`)}function RejectISODate(e,t,o){RejectToRange(t,1,12),RejectToRange(o,1,ISODaysInMonth(e,t));}function RejectDateRange(e,t,o){RejectDateTimeRange(e,t,o,12,0,0,0,0,0);}function RejectTime(e,t,o,n,r,a){RejectToRange(e,0,23),RejectToRange(t,0,59),RejectToRange(o,0,59),RejectToRange(n,0,999),RejectToRange(r,0,999),RejectToRange(a,0,999);}function RejectDateTime(e,t,o,n,r,a,i,s,l){RejectISODate(e,t,o),RejectTime(n,r,a,i,s,l);}function RejectDateTimeRange(e,t,o,n,r,a,i,s,l){if(RejectToRange(e,-271821,275760),-271821===e&&null==GetEpochFromISOParts(e,t,o+1,n,r,a,i,s,l-1)||275760===e&&null==GetEpochFromISOParts(e,t,o-1,n,r,a,i,s,l+1))throw new RangeError("DateTime outside of supported range")}function ValidateEpochNanoseconds(t){if(jsbiUmd.lessThan(t,be)||jsbiUmd.greaterThan(t,Re))throw new RangeError("Instant outside of supported range")}function RejectDuration(e,t,o,n,r,a,i,s,l,d){const m=DurationSign(e,t,o,n,r,a,i,s,l,d);for(const c of [e,t,o,n,r,a,i,s,l,d]){if(!Te(c))throw new RangeError("infinite values not allowed as duration fields");const e=me(c);if(0!==e&&e!==m)throw new RangeError("mixed-sign values not allowed as duration fields")}}function DifferenceISODate(e,t,o,n,r,a,i){switch(i){case"year":case"month":{const s=-CompareISODate(e,t,o,n,r,a);if(0===s)return {years:0,months:0,weeks:0,days:0};const l={year:e,month:t,day:o},d={year:n,month:r,day:a};let m=d.year-l.year,c=AddISODate(e,t,o,m,0,0,0,"constrain"),h=-CompareISODate(c.year,c.month,c.day,n,r,a);if(0===h)return "year"===i?{years:m,months:0,weeks:0,days:0}:{years:0,months:12*m,weeks:0,days:0};let T=d.month-l.month;if(h!==s&&(m-=s,T+=12*s),c=AddISODate(e,t,o,m,T,0,0,"constrain"),h=-CompareISODate(c.year,c.month,c.day,n,r,a),0===h)return "year"===i?{years:m,months:T,weeks:0,days:0}:{years:0,months:T+12*m,weeks:0,days:0};h!==s&&(T-=s,T===-s&&(m-=s,T=11*s),c=AddISODate(e,t,o,m,T,0,0,"constrain"),h=-CompareISODate(e,t,o,c.year,c.month,c.day));let u=0;return u=c.month===d.month?d.day-c.day:s<0?-c.day-(ISODaysInMonth(d.year,d.month)-d.day):d.day+(ISODaysInMonth(c.year,c.month)-c.day),"month"===i&&(T+=12*m,m=0),{years:m,months:T,weeks:0,days:u}}case"week":case"day":{let s,l,d;CompareISODate(e,t,o,n,r,a)<0?(l={year:e,month:t,day:o},s={year:n,month:r,day:a},d=1):(l={year:n,month:r,day:a},s={year:e,month:t,day:o},d=-1);let m=DayOfYear(s.year,s.month,s.day)-DayOfYear(l.year,l.month,l.day);for(let e=l.year;e<s.year;++e)m+=LeapYear(e)?366:365;let c=0;return "week"===i&&(c=de(m/7),m%=7),c*=d,m*=d,{years:0,months:0,weeks:c,days:m}}default:throw new Error("assert not reached")}}function DifferenceTime(e,t,o,n,r,a,i,s,l,d,m,c){let h=i-e,T=s-t,u=l-o,p=d-n,f=m-r,y=c-a;const S=DurationSign(0,0,0,0,h,T,u,p,f,y);h*=S,T*=S,u*=S,p*=S,f*=S,y*=S;let g=0;return ({deltaDays:g,hour:h,minute:T,second:u,millisecond:p,microsecond:f,nanosecond:y}=BalanceTime(h,T,u,p,f,y)),g*=S,h*=S,T*=S,u*=S,p*=S,f*=S,y*=S,{deltaDays:g,hours:h,minutes:T,seconds:u,milliseconds:p,microseconds:f,nanoseconds:y}}function DifferenceInstant(t,o,n,r,a){const i=jsbiUmd.subtract(o,t),s=jsbiUmd.remainder(i,jsbiUmd.BigInt(864e11)),l=jsbiUmd.subtract(i,s),d=RoundNumberToIncrement(s,Le[r]*n,a),m=jsbiUmd.add(l,d),c=jsbiUmd.toNumber(jsbiUmd.remainder(m,De)),h=jsbiUmd.toNumber(jsbiUmd.remainder(jsbiUmd.divide(m,De),De)),T=jsbiUmd.toNumber(jsbiUmd.remainder(jsbiUmd.divide(m,ve),De));return {seconds:jsbiUmd.toNumber(jsbiUmd.divide(m,Oe)),milliseconds:T,microseconds:h,nanoseconds:c}}function DifferenceISODateTime(e,t,o,n,r,a,i,s,l,d,m,c,h,T,u,p,f,y,S,g,w=ye(null)){let I=e,G=t,D=o,{deltaDays:v,hours:O,minutes:C,seconds:E,milliseconds:b,microseconds:R,nanoseconds:M}=DifferenceTime(n,r,a,i,s,l,h,T,u,p,f,y);const Z=DurationSign(0,0,0,v,O,C,E,b,R,M);({year:I,month:G,day:D}=BalanceISODate(I,G,D+v));CompareISODate(d,m,c,I,G,D)===-Z&&(({year:I,month:G,day:D}=BalanceISODate(I,G,D-Z)),({hours:O,minutes:C,seconds:E,milliseconds:b,microseconds:R,nanoseconds:M}=BalanceDuration(-Z,O,C,E,b,R,M,g)));const F=CreateTemporalDate(I,G,D,S),Y=CreateTemporalDate(d,m,c,S),P={...w,largestUnit:LargerOfTwoTemporalUnits("day",g)};let{years:j,months:B,weeks:N,days:$}=CalendarDateUntil(S,F,Y,P);return ({days:$,hours:O,minutes:C,seconds:E,milliseconds:b,microseconds:R,nanoseconds:M}=BalanceDuration($,O,C,E,b,R,M,g)),{years:j,months:B,weeks:N,days:$,hours:O,minutes:C,seconds:E,milliseconds:b,microseconds:R,nanoseconds:M}}function DifferenceZonedDateTime(t,o,n,T,u,p){const f=jsbiUmd.subtract(o,t);if(jsbiUmd.equal(f,we))return {years:0,months:0,weeks:0,days:0,hours:0,minutes:0,seconds:0,milliseconds:0,microseconds:0,nanoseconds:0};const y=GetIntrinsic("%Temporal.Instant%"),S=new y(t),g=new y(o),w=BuiltinTimeZoneGetPlainDateTimeFor(n,S,T),I=BuiltinTimeZoneGetPlainDateTimeFor(n,g,T);let{years:G,months:D,weeks:v,days:O}=DifferenceISODateTime(GetSlot(w,r$1),GetSlot(w,a),GetSlot(w,i$1),GetSlot(w,s),GetSlot(w,l),GetSlot(w,d),GetSlot(w,m),GetSlot(w,c),GetSlot(w,h),GetSlot(I,r$1),GetSlot(I,a),GetSlot(I,i$1),GetSlot(I,s),GetSlot(I,l),GetSlot(I,d),GetSlot(I,m),GetSlot(I,c),GetSlot(I,h),T,u,p);const C=AddZonedDateTime(S,n,T,G,D,v,0,0,0,0,0,0,0);let E=jsbiUmd.subtract(o,C);const b=CreateTemporalZonedDateTime(C,n,T);({nanoseconds:E,days:O}=NanosecondsToDays(E,b));const{hours:R,minutes:M,seconds:Z,milliseconds:F,microseconds:Y,nanoseconds:P}=BalanceDuration(0,0,0,0,0,0,jsbiUmd.toNumber(E),"hour");return {years:G,months:D,weeks:v,days:O,hours:R,minutes:M,seconds:Z,milliseconds:F,microseconds:Y,nanoseconds:P}}function AddISODate(e,t,o,n,r,a,i,s){let l=e,d=t,m=o,c=a,h=i;return l+=n,d+=r,({year:l,month:d}=BalanceISOYearMonth(l,d)),({year:l,month:d,day:m}=RegulateISODate(l,d,m,s)),h+=7*c,m+=h,({year:l,month:d,day:m}=BalanceISODate(l,d,m)),{year:l,month:d,day:m}}function AddTime(e,t,o,n,r,a,i,s,l,d,m,c){let h=e,T=t,u=o,p=n,f=r,y=a;h+=i,T+=s,u+=l,p+=d,f+=m,y+=c;let S=0;return ({deltaDays:S,hour:h,minute:T,second:u,millisecond:p,microsecond:f,nanosecond:y}=BalanceTime(h,T,u,p,f,y)),{deltaDays:S,hour:h,minute:T,second:u,millisecond:p,microsecond:f,nanosecond:y}}function AddDuration(e,t,n,r,a,i,s,l,d,m,c,h,f,y,S,g,w,I,G,D,v){const O=LargerOfTwoTemporalUnits(DefaultTemporalLargestUnit(e,t,n,r,a,i,s,l,d,m),DefaultTemporalLargestUnit(c,h,f,y,S,g,w,I,G,D));let C,E,b,R,M,Z,F,Y,P,j;if(v)if(IsTemporalDate(v)){const o=GetIntrinsic("%Temporal.Duration%"),u=GetSlot(v,T),p=new o(e,t,n,r,0,0,0,0,0,0),B=new o(c,h,f,y,0,0,0,0,0,0),N=u.dateAdd,$=CalendarDateAdd(u,v,p,ye(null),N),k=CalendarDateAdd(u,$,B,ye(null),N),L=LargerOfTwoTemporalUnits("day",O),U=ye(null);U.largestUnit=L,({years:C,months:E,weeks:b,days:R}=CalendarDateUntil(u,v,k,U)),({days:R,hours:M,minutes:Z,seconds:F,milliseconds:Y,microseconds:P,nanoseconds:j}=BalanceDuration(R,a+S,i+g,s+w,l+I,d+G,m+D,O));}else {const B=GetIntrinsic("%Temporal.Instant%"),N=GetSlot(v,p),$=GetSlot(v,T),k=AddZonedDateTime(GetSlot(v,u),N,$,e,t,n,r,a,i,s,l,d,m),L=AddZonedDateTime(new B(k),N,$,c,h,f,y,S,g,w,I,G,D);"year"!==O&&"month"!==O&&"week"!==O&&"day"!==O?(C=0,E=0,b=0,R=0,({seconds:F,milliseconds:Y,microseconds:P,nanoseconds:j}=DifferenceInstant(GetSlot(v,o),L,1,"nanosecond","halfExpand")),({hours:M,minutes:Z,seconds:F,milliseconds:Y,microseconds:P,nanoseconds:j}=BalanceDuration(0,0,0,F,Y,P,j,O))):({years:C,months:E,weeks:b,days:R,hours:M,minutes:Z,seconds:F,milliseconds:Y,microseconds:P,nanoseconds:j}=DifferenceZonedDateTime(GetSlot(v,o),L,N,$,O));}else {if("year"===O||"month"===O||"week"===O)throw new RangeError("relativeTo is required for years, months, or weeks arithmetic");C=E=b=0,({days:R,hours:M,minutes:Z,seconds:F,milliseconds:Y,microseconds:P,nanoseconds:j}=BalanceDuration(r+y,a+S,i+g,s+w,l+I,d+G,m+D,O));}return RejectDuration(C,E,b,R,M,Z,F,Y,P,j),{years:C,months:E,weeks:b,days:R,hours:M,minutes:Z,seconds:F,milliseconds:Y,microseconds:P,nanoseconds:j}}function AddInstant(t,o,n,r,a,i,s){let l=we;l=jsbiUmd.add(l,jsbiUmd.BigInt(s)),l=jsbiUmd.add(l,jsbiUmd.multiply(jsbiUmd.BigInt(i),De)),l=jsbiUmd.add(l,jsbiUmd.multiply(jsbiUmd.BigInt(a),ve)),l=jsbiUmd.add(l,jsbiUmd.multiply(jsbiUmd.BigInt(r),Oe)),l=jsbiUmd.add(l,jsbiUmd.multiply(jsbiUmd.BigInt(n),jsbiUmd.BigInt(6e10))),l=jsbiUmd.add(l,jsbiUmd.multiply(jsbiUmd.BigInt(o),jsbiUmd.BigInt(36e11)));const d=jsbiUmd.add(t,l);return ValidateEpochNanoseconds(d),d}function AddDateTime(e,t,o,n,s,l,d,m,c,h,T,u,p,f,y,S,g,w,I,G,D){let v=f,{deltaDays:O,hour:C,minute:E,second:b,millisecond:R,microsecond:M,nanosecond:Z}=AddTime(n,s,l,d,m,c,y,S,g,w,I,G);v+=O;const F=GetIntrinsic("%Temporal.Duration%"),Y=CalendarDateAdd(h,CreateTemporalDate(e,t,o,h),new F(T,u,p,v,0,0,0,0,0,0),D);return {year:GetSlot(Y,r$1),month:GetSlot(Y,a),day:GetSlot(Y,i$1),hour:C,minute:E,second:b,millisecond:R,microsecond:M,nanosecond:Z}}function AddZonedDateTime(e,t,n,T,u,p,f,y,S,g,w,I,G,D){const v=GetIntrinsic("%Temporal.Duration%");if(0===DurationSign(T,u,p,f,0,0,0,0,0,0))return AddInstant(GetSlot(e,o),y,S,g,w,I,G);const O=BuiltinTimeZoneGetPlainDateTimeFor(t,e,n),C=CalendarDateAdd(n,CreateTemporalDate(GetSlot(O,r$1),GetSlot(O,a),GetSlot(O,i$1),n),new v(T,u,p,f,0,0,0,0,0,0),D),E=CreateTemporalDateTime(GetSlot(C,r$1),GetSlot(C,a),GetSlot(C,i$1),GetSlot(O,s),GetSlot(O,l),GetSlot(O,d),GetSlot(O,m),GetSlot(O,c),GetSlot(O,h),n);return AddInstant(GetSlot(BuiltinTimeZoneGetInstantFor(t,E,"compatible"),o),y,S,g,w,I,G)}function RoundNumberToIncrement(t,o,n){if(1===o)return t;let{quotient:r,remainder:a}=divmod(t,jsbiUmd.BigInt(o));if(jsbiUmd.equal(a,we))return t;const i=jsbiUmd.lessThan(a,we)?-1:1;switch(n){case"ceil":i>0&&(r=jsbiUmd.add(r,jsbiUmd.BigInt(i)));break;case"floor":i<0&&(r=jsbiUmd.add(r,jsbiUmd.BigInt(i)));break;case"trunc":break;case"halfExpand":jsbiUmd.toNumber(abs(jsbiUmd.multiply(a,jsbiUmd.BigInt(2))))>=o&&(r=jsbiUmd.add(r,jsbiUmd.BigInt(i)));}return jsbiUmd.multiply(r,jsbiUmd.BigInt(o))}function RoundInstant(t,o,n,r){let a=jsbiUmd.remainder(t,jsbiUmd.BigInt(864e11));jsbiUmd.lessThan(a,we)&&(a=jsbiUmd.add(a,jsbiUmd.BigInt(864e11)));const i=jsbiUmd.subtract(t,a),s=RoundNumberToIncrement(a,Le[n]*o,r);return jsbiUmd.add(i,s)}function RoundISODateTime(e,t,o,n,r,a,i,s,l,d,m,c,h=864e11){const{deltaDays:T,hour:u,minute:p,second:f,millisecond:y,microsecond:S,nanosecond:g}=RoundTime(n,r,a,i,s,l,d,m,c,h),{year:w,month:I,day:G}=BalanceISODate(e,t,o+T);return {year:w,month:I,day:G,hour:u,minute:p,second:f,millisecond:y,microsecond:S,nanosecond:g}}function RoundTime(t,o,n,r,a,i,s,l,d,m=864e11){let c=we;switch(l){case"day":case"hour":c=jsbiUmd.BigInt(t);case"minute":c=jsbiUmd.add(jsbiUmd.multiply(c,Ge),jsbiUmd.BigInt(o));case"second":c=jsbiUmd.add(jsbiUmd.multiply(c,Ge),jsbiUmd.BigInt(n));case"millisecond":c=jsbiUmd.add(jsbiUmd.multiply(c,De),jsbiUmd.BigInt(r));case"microsecond":c=jsbiUmd.add(jsbiUmd.multiply(c,De),jsbiUmd.BigInt(a));case"nanosecond":c=jsbiUmd.add(jsbiUmd.multiply(c,De),jsbiUmd.BigInt(i));}const h="day"===l?m:Le[l],T=RoundNumberToIncrement(c,h*s,d),u=jsbiUmd.toNumber(jsbiUmd.divide(T,jsbiUmd.BigInt(h)));switch(l){case"day":return {deltaDays:u,hour:0,minute:0,second:0,millisecond:0,microsecond:0,nanosecond:0};case"hour":return BalanceTime(u,0,0,0,0,0);case"minute":return BalanceTime(t,u,0,0,0,0);case"second":return BalanceTime(t,o,u,0,0,0);case"millisecond":return BalanceTime(t,o,n,u,0,0);case"microsecond":return BalanceTime(t,o,n,r,u,0);case"nanosecond":return BalanceTime(t,o,n,r,a,u);default:throw new Error(`Invalid unit ${l}`)}}function DaysUntil(e,t){return DifferenceISODate(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1),GetSlot(t,r$1),GetSlot(t,a),GetSlot(t,i$1),"day").days}function MoveRelativeDate(e,t,o){const n=CalendarDateAdd(e,t,o,ye(null));return {relativeTo:n,days:DaysUntil(t,n)}}function MoveRelativeZonedDateTime(e,t,o,n,r){const a=GetSlot(e,p),i=GetSlot(e,T);return CreateTemporalZonedDateTime(AddZonedDateTime(GetSlot(e,u),a,i,t,o,n,r,0,0,0,0,0,0),a,i)}function AdjustRoundedDurationDays(t,o,n,r,a,i,s,l,d,m,c,h,f,y){let S=t,g=o,w=n,I=r,G=a,D=i,v=s,O=l,C=d,E=m;if(!IsTemporalZonedDateTime(y)||"year"===h||"month"===h||"week"===h||"day"===h||"nanosecond"===h&&1===c)return {years:S,months:g,weeks:w,days:I,hours:G,minutes:D,seconds:v,milliseconds:O,microseconds:C,nanoseconds:E};let b=TotalDurationNanoseconds(0,G,D,v,O,C,E,0);const R=me(jsbiUmd.toNumber(b)),M=GetSlot(y,p),Z=GetSlot(y,T),F=AddZonedDateTime(GetSlot(y,u),M,Z,S,g,w,I,0,0,0,0,0,0),Y=AddZonedDateTime(new(GetIntrinsic("%Temporal.Instant%"))(F),M,Z,0,0,0,R,0,0,0,0,0,0),P=jsbiUmd.subtract(Y,F);return jsbiUmd.greaterThanOrEqual(jsbiUmd.multiply(jsbiUmd.subtract(b,P),jsbiUmd.BigInt(R)),we)&&(({years:S,months:g,weeks:w,days:I}=AddDuration(S,g,w,I,0,0,0,0,0,0,0,0,0,R,0,0,0,0,0,0,y)),b=RoundInstant(jsbiUmd.subtract(b,P),c,h,f),({hours:G,minutes:D,seconds:v,milliseconds:O,microseconds:C,nanoseconds:E}=BalanceDuration(0,0,0,0,0,0,jsbiUmd.toNumber(b),"hour"))),{years:S,months:g,weeks:w,days:I,hours:G,minutes:D,seconds:v,milliseconds:O,microseconds:C,nanoseconds:E}}function RoundDuration(t,o,n,r,a,i,s,l,d,m,c,h,u,p){let f=t,y=o,S=n,g=r,w=a,I=i,G=s,D=l,v=d,O=jsbiUmd.BigInt(m);const C=GetIntrinsic("%Temporal.Duration%");let E,b,R,M,Z=p;if(Z){if(IsTemporalZonedDateTime(Z))b=Z,Z=ToTemporalDate(Z);else if(!IsTemporalDate(Z))throw new TypeError("starting point must be PlainDate or ZonedDateTime");E=GetSlot(Z,T);}if("year"===h||"month"===h||"week"===h||"day"===h){let t,o,n;O=TotalDurationNanoseconds(0,w,I,G,D,v,m,0),b&&(t=MoveRelativeZonedDateTime(b,f,y,S,g)),({days:o,nanoseconds:O,dayLengthNs:n}=NanosecondsToDays(O,t)),R=jsbiUmd.BigInt(n),g+=o,w=I=G=D=v=0;}switch(h){case"year":{if(!E)throw new RangeError("A starting point is required for years rounding");const t=new C(f),o=E.dateAdd,n=CalendarDateAdd(E,Z,t,ye(null),o),r=CalendarDateAdd(E,Z,new C(f,y,S),ye(null),o);Z=n,g+=DaysUntil(n,r);const a=CalendarDateAdd(E,Z,{days:g},ye(null),o),i=ye(null);i.largestUnit="year";const s=CalendarDateUntil(E,Z,a,i).years;f+=s;const l=Z;Z=CalendarDateAdd(E,Z,{years:s},ye(null),o);g-=DaysUntil(l,Z);const d=new C(g<0?-1:1);let{days:m}=MoveRelativeDate(E,Z,d);m=le(m);const h=jsbiUmd.multiply(jsbiUmd.BigInt(m),R);O=jsbiUmd.add(jsbiUmd.add(jsbiUmd.multiply(h,jsbiUmd.BigInt(f)),jsbiUmd.multiply(jsbiUmd.BigInt(g),R)),O);const T=RoundNumberToIncrement(O,jsbiUmd.toNumber(jsbiUmd.multiply(h,jsbiUmd.BigInt(c))),u);M=jsbiUmd.toNumber(O)/jsbiUmd.toNumber(h),f=jsbiUmd.toNumber(jsbiUmd.divide(T,h)),O=we,y=S=g=0;break}case"month":{if(!E)throw new RangeError("A starting point is required for months rounding");const t=new C(f,y),o=E.dateAdd,n=CalendarDateAdd(E,Z,t,ye(null),o),r=CalendarDateAdd(E,Z,new C(f,y,S),ye(null),o);Z=n,g+=DaysUntil(n,r);const a=me(g),i=new C(0,g<0?-1:1);let s;for(({relativeTo:Z,days:s}=MoveRelativeDate(E,Z,i));le(g)>=le(s);)y+=a,g-=s,({relativeTo:Z,days:s}=MoveRelativeDate(E,Z,i));s=le(s);const l=jsbiUmd.multiply(jsbiUmd.BigInt(s),R);O=jsbiUmd.add(jsbiUmd.add(jsbiUmd.multiply(l,jsbiUmd.BigInt(y)),jsbiUmd.multiply(jsbiUmd.BigInt(g),R)),O);const d=RoundNumberToIncrement(O,jsbiUmd.toNumber(jsbiUmd.multiply(l,jsbiUmd.BigInt(c))),u);M=jsbiUmd.toNumber(O)/jsbiUmd.toNumber(l),y=jsbiUmd.toNumber(jsbiUmd.divide(d,l)),O=we,S=g=0;break}case"week":{if(!E)throw new RangeError("A starting point is required for weeks rounding");const t=me(g),o=new C(0,0,g<0?-1:1);let n;for(({relativeTo:Z,days:n}=MoveRelativeDate(E,Z,o));le(g)>=le(n);)S+=t,g-=n,({relativeTo:Z,days:n}=MoveRelativeDate(E,Z,o));n=le(n);const r=jsbiUmd.multiply(jsbiUmd.BigInt(n),R);O=jsbiUmd.add(jsbiUmd.add(jsbiUmd.multiply(r,jsbiUmd.BigInt(S)),jsbiUmd.multiply(jsbiUmd.BigInt(g),R)),O);const a=RoundNumberToIncrement(O,jsbiUmd.toNumber(jsbiUmd.multiply(r,jsbiUmd.BigInt(c))),u);M=jsbiUmd.toNumber(O)/jsbiUmd.toNumber(r),S=jsbiUmd.toNumber(jsbiUmd.divide(a,r)),O=we,g=0;break}case"day":{const t=R;O=jsbiUmd.add(jsbiUmd.multiply(t,jsbiUmd.BigInt(g)),O);const o=RoundNumberToIncrement(O,jsbiUmd.toNumber(jsbiUmd.multiply(t,jsbiUmd.BigInt(c))),u);M=jsbiUmd.toNumber(O)/jsbiUmd.toNumber(t),g=jsbiUmd.toNumber(jsbiUmd.divide(o,t)),O=we;break}case"hour":{const t=36e11;let o=jsbiUmd.multiply(jsbiUmd.BigInt(w),jsbiUmd.BigInt(36e11));o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(I),jsbiUmd.BigInt(6e10))),o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(G),Oe)),o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(D),ve)),o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(v),De)),o=jsbiUmd.add(o,O),M=jsbiUmd.toNumber(o)/t;const n=RoundNumberToIncrement(o,t*c,u);w=jsbiUmd.toNumber(jsbiUmd.divide(n,jsbiUmd.BigInt(t))),O=we,I=G=D=v=0;break}case"minute":{const t=6e10;let o=jsbiUmd.multiply(jsbiUmd.BigInt(I),jsbiUmd.BigInt(6e10));o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(G),Oe)),o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(D),ve)),o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(v),De)),o=jsbiUmd.add(o,O),M=jsbiUmd.toNumber(o)/t;const n=RoundNumberToIncrement(o,t*c,u);I=jsbiUmd.toNumber(jsbiUmd.divide(n,jsbiUmd.BigInt(t))),O=we,G=D=v=0;break}case"second":{const t=1e9;let o=jsbiUmd.multiply(jsbiUmd.BigInt(G),Oe);o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(D),ve)),o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(v),De)),o=jsbiUmd.add(o,O),M=jsbiUmd.toNumber(o)/t;const n=RoundNumberToIncrement(o,t*c,u);G=jsbiUmd.toNumber(jsbiUmd.divide(n,jsbiUmd.BigInt(t))),O=we,D=v=0;break}case"millisecond":{const t=1e6;let o=jsbiUmd.multiply(jsbiUmd.BigInt(D),ve);o=jsbiUmd.add(o,jsbiUmd.multiply(jsbiUmd.BigInt(v),De)),o=jsbiUmd.add(o,O),M=jsbiUmd.toNumber(o)/t;const n=RoundNumberToIncrement(o,t*c,u);D=jsbiUmd.toNumber(jsbiUmd.divide(n,jsbiUmd.BigInt(t))),O=we,v=0;break}case"microsecond":{const t=1e3;let o=jsbiUmd.multiply(jsbiUmd.BigInt(v),De);o=jsbiUmd.add(o,O),M=jsbiUmd.toNumber(o)/t;const n=RoundNumberToIncrement(o,t*c,u);v=jsbiUmd.toNumber(jsbiUmd.divide(n,jsbiUmd.BigInt(t))),O=we;break}case"nanosecond":M=jsbiUmd.toNumber(O),O=RoundNumberToIncrement(O,c,u);}return {years:f,months:y,weeks:S,days:g,hours:w,minutes:I,seconds:G,milliseconds:D,microseconds:v,nanoseconds:jsbiUmd.toNumber(O),total:M}}function CompareISODate(e,t,o,n,r,a){for(const[i,s]of [[e,n],[t,r],[o,a]])if(i!==s)return ComparisonResult(i-s);return 0}function NonNegativeModulo(e,t){let o=e%t;return Se(o,-0)?0:(o<0&&(o+=t),o)}function ToBigIntExternal(e){const t=ToBigInt(e);return void 0!==globalThis.BigInt?globalThis.BigInt(t.toString(10)):t}function ToBigInt(t){if(t instanceof jsbiUmd)return t;let o=t;if("object"==typeof t){const e=t[Symbol.toPrimitive];e&&"function"==typeof e&&(o=ge(e,t,["number"]));}switch(typeof o){case"undefined":case"object":case"number":case"symbol":default:throw new TypeError(`cannot convert ${typeof t} to bigint`);case"string":if(!o.match(/^\s*(?:[+-]?\d+\s*)?$/))throw new SyntaxError("invalid BigInt syntax");case"bigint":try{return jsbiUmd.BigInt(o.toString())}catch(e){if(e instanceof Error&&e.message.startsWith("Invalid integer"))throw new SyntaxError(e.message);throw e}case"boolean":return o?Ie:we}}const $e=(()=>{let t=jsbiUmd.BigInt(Date.now()%1e6);return ()=>{const o=jsbiUmd.BigInt(Date.now()),n=jsbiUmd.add(jsbiUmd.multiply(o,ve),t);return t=jsbiUmd.divide(o,ve),jsbiUmd.greaterThan(n,Re)?Re:jsbiUmd.lessThan(n,be)?be:n}})();function ComparisonResult(e){return e<0?-1:e>0?1:e}function GetOptionsObject(e){if(void 0===e)return ye(null);if(IsObject(e)&&null!==e)return e;throw new TypeError("Options parameter must be an object, not "+(null===e?"null":""+typeof e))}function CreateOnePropObject(e,t){const o=ye(null);return o[e]=t,o}function GetOption(e,t,o,n){let r=e[t];if(void 0!==r){if(r=ToString(r),!o.includes(r))throw new RangeError(`${t} must be one of ${o.join(", ")}, not ${r}`);return r}return n}const ke=new RegExp(`^${J.source}$`);function bisect(t,o,n,r=t(o),a=t(n)){let i=jsbiUmd.BigInt(o),s=jsbiUmd.BigInt(n),l=r,d=a;for(;jsbiUmd.greaterThan(jsbiUmd.subtract(s,i),Ie);){const o=jsbiUmd.divide(jsbiUmd.add(i,s),jsbiUmd.BigInt(2)),n=t(o);if(n===l)i=o,l=n;else {if(n!==d)throw new Error(`invalid state in bisection ${l} - ${n} - ${d}`);s=o,d=n;}}return s}const Le={hour:36e11,minute:6e10,second:1e9,millisecond:1e6,microsecond:1e3,nanosecond:1},Ue=Symbol("date"),Ae=Symbol("ym"),xe=Symbol("md"),He=Symbol("time"),qe=Symbol("datetime"),We=Symbol("zoneddatetime"),ze=Symbol("instant"),Je=Symbol("original"),Ve=Symbol("timezone"),_e=Symbol("timezone-id-given"),Xe=Symbol("calendar-id"),Ke=Symbol("locale"),Qe=Symbol("options"),descriptor=e=>({value:e,enumerable:!0,writable:!1,configurable:!0}),et=globalThis.Intl.DateTimeFormat,tt=Object.assign,ot=Object.prototype.hasOwnProperty,nt=Reflect.apply;function getPropLazy(e,t){let o=e[t];return "function"==typeof o&&(o=new et(e[Ke],o(e[Qe])),e[t]=o),o}function getResolvedTimeZoneLazy(e){let t=e[Ve];return "string"==typeof t&&(t=ToTemporalTimeZone(t),e[Ve]=t),t}function DateTimeFormatImpl(e,t={}){if(!(this instanceof DateTimeFormatImpl))return new DateTimeFormatImpl(e,t);const o=void 0!==t,n=o?tt({},t):{},r=new et(e,n),a=r.resolvedOptions();if(o){const e=tt({},a);for(const t in e)nt(ot,n,[t])||delete e[t];this[Qe]=e;}else this[Qe]=n;this[_e]=n.timeZone?n.timeZone:null,this[Ke]=a.locale,this[Je]=r,this[Ve]=a.timeZone,this[Xe]=a.calendar,this[Ue]=dateAmend,this[Ae]=yearMonthAmend,this[xe]=monthDayAmend,this[He]=timeAmend,this[qe]=datetimeAmend,this[We]=zonedDateTimeAmend,this[ze]=instantAmend;}Object.defineProperty(DateTimeFormatImpl,"name",{writable:!0,value:"DateTimeFormat"}),DateTimeFormatImpl.supportedLocalesOf=function(e,t){return et.supportedLocalesOf(e,t)};const rt={resolvedOptions:descriptor((function resolvedOptions(){return this[Je].resolvedOptions()})),format:descriptor((function format(e,...t){let{instant:o,formatter:n,timeZone:r}=extractOverrides(e,this);if(o&&n)return n=adjustFormatterTimeZone(n,r),n.format(o.epochMilliseconds);return this[Je].format(e,...t)})),formatRange:descriptor((function formatRange(e,t){if(isTemporalObject(e)||isTemporalObject(t)){if(!sameTemporalType(e,t))throw new TypeError("Intl.DateTimeFormat.formatRange accepts two values of the same type");const{instant:o,formatter:n,timeZone:r}=extractOverrides(e,this),{instant:a,formatter:i,timeZone:s}=extractOverrides(t,this);if(r&&s&&r!==s)throw new RangeError("cannot format range between different time zones");if(o&&a&&n&&i&&n===i){return adjustFormatterTimeZone(n,r).formatRange(o.epochMilliseconds,a.epochMilliseconds)}}return this[Je].formatRange(e,t)}))};"formatToParts"in et.prototype&&(rt.formatToParts=descriptor((function formatToParts(e,...t){let{instant:o,formatter:n,timeZone:r}=extractOverrides(e,this);if(o&&n)return n=adjustFormatterTimeZone(n,r),n.formatToParts(o.epochMilliseconds);return this[Je].formatToParts(e,...t)}))),"formatRangeToParts"in et.prototype&&(rt.formatRangeToParts=descriptor((function formatRangeToParts(e,t){if(isTemporalObject(e)||isTemporalObject(t)){if(!sameTemporalType(e,t))throw new TypeError("Intl.DateTimeFormat.formatRangeToParts accepts two values of the same type");const{instant:o,formatter:n,timeZone:r}=extractOverrides(e,this),{instant:a,formatter:i,timeZone:s}=extractOverrides(t,this);if(r&&s&&r!==s)throw new RangeError("cannot format range between different time zones");if(o&&a&&n&&i&&n===i){return adjustFormatterTimeZone(n,r).formatRangeToParts(o.epochMilliseconds,a.epochMilliseconds)}}return this[Je].formatRangeToParts(e,t)}))),DateTimeFormatImpl.prototype=Object.create(et.prototype,rt),Object.defineProperty(DateTimeFormatImpl,"prototype",{writable:!1,enumerable:!1,configurable:!1});const at=DateTimeFormatImpl;function adjustFormatterTimeZone(e,t){if(!t)return e;const o=e.resolvedOptions();return o.timeZone===t?e:((o.dateStyle||o.timeStyle)&&(delete o.weekday,delete o.era,delete o.year,delete o.month,delete o.day,delete o.hour,delete o.minute,delete o.second,delete o.timeZoneName,delete o.hourCycle,delete o.hour12,delete o.dayPeriod),new et(o.locale,{...o,timeZone:t}))}function amend(e={},t={}){const o=tt({},e);for(const e of ["year","month","day","hour","minute","second","weekday","dayPeriod","timeZoneName","dateStyle","timeStyle"])o[e]=e in t?t[e]:o[e],!1!==o[e]&&void 0!==o[e]||delete o[e];return o}function timeAmend(e){let t=amend(e,{year:!1,month:!1,day:!1,weekday:!1,timeZoneName:!1,dateStyle:!1});return hasTimeOptions(t)||(t=tt({},t,{hour:"numeric",minute:"numeric",second:"numeric"})),t}function yearMonthAmend(e){let t=amend(e,{day:!1,hour:!1,minute:!1,second:!1,weekday:!1,dayPeriod:!1,timeZoneName:!1,dateStyle:!1,timeStyle:!1});return "year"in t||"month"in t||(t=tt(t,{year:"numeric",month:"numeric"})),t}function monthDayAmend(e){let t=amend(e,{year:!1,hour:!1,minute:!1,second:!1,weekday:!1,dayPeriod:!1,timeZoneName:!1,dateStyle:!1,timeStyle:!1});return "month"in t||"day"in t||(t=tt({},t,{month:"numeric",day:"numeric"})),t}function dateAmend(e){let t=amend(e,{hour:!1,minute:!1,second:!1,dayPeriod:!1,timeZoneName:!1,timeStyle:!1});return hasDateOptions(t)||(t=tt({},t,{year:"numeric",month:"numeric",day:"numeric"})),t}function datetimeAmend(e){let t=amend(e,{timeZoneName:!1});return hasTimeOptions(t)||hasDateOptions(t)||(t=tt({},t,{year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"})),t}function zonedDateTimeAmend(e){let t=e;return hasTimeOptions(t)||hasDateOptions(t)||(t=tt({},t,{year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}),void 0===t.timeZoneName&&(t.timeZoneName="short")),t}function instantAmend(e){let t=e;return hasTimeOptions(t)||hasDateOptions(t)||(t=tt({},t,{year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"})),t}function hasDateOptions(e){return "year"in e||"month"in e||"day"in e||"weekday"in e||"dateStyle"in e}function hasTimeOptions(e){return "hour"in e||"minute"in e||"second"in e||"timeStyle"in e||"dayPeriod"in e}function isTemporalObject(e){return IsTemporalDate(e)||IsTemporalTime(e)||IsTemporalDateTime(e)||IsTemporalZonedDateTime(e)||IsTemporalYearMonth(e)||IsTemporalMonthDay(e)||IsTemporalInstant(e)}function sameTemporalType(e,t){return !(!isTemporalObject(e)||!isTemporalObject(t))&&(!(IsTemporalTime(e)&&!IsTemporalTime(t))&&(!(IsTemporalDate(e)&&!IsTemporalDate(t))&&(!(IsTemporalDateTime(e)&&!IsTemporalDateTime(t))&&(!(IsTemporalZonedDateTime(e)&&!IsTemporalZonedDateTime(t))&&(!(IsTemporalYearMonth(e)&&!IsTemporalYearMonth(t))&&(!(IsTemporalMonthDay(e)&&!IsTemporalMonthDay(t))&&!(IsTemporalInstant(e)&&!IsTemporalInstant(t))))))))}function extractOverrides(e,t){const o=GetIntrinsic("%Temporal.PlainDateTime%");if(IsTemporalTime(e)){const n=new o(1970,1,1,GetSlot(e,s),GetSlot(e,l),GetSlot(e,d),GetSlot(e,m),GetSlot(e,c),GetSlot(e,h),t[Xe]);return {instant:BuiltinTimeZoneGetInstantFor(getResolvedTimeZoneLazy(t),n,"compatible"),formatter:getPropLazy(t,He)}}if(IsTemporalYearMonth(e)){const n=GetSlot(e,r$1),s=GetSlot(e,a),l=GetSlot(e,i$1),d=ToString(GetSlot(e,T));if(d!==t[Xe])throw new RangeError(`cannot format PlainYearMonth with calendar ${d} in locale with calendar ${t[Xe]}`);const m=new o(n,s,l,12,0,0,0,0,0,d);return {instant:BuiltinTimeZoneGetInstantFor(getResolvedTimeZoneLazy(t),m,"compatible"),formatter:getPropLazy(t,Ae)}}if(IsTemporalMonthDay(e)){const n=GetSlot(e,r$1),s=GetSlot(e,a),l=GetSlot(e,i$1),d=ToString(GetSlot(e,T));if(d!==t[Xe])throw new RangeError(`cannot format PlainMonthDay with calendar ${d} in locale with calendar ${t[Xe]}`);const m=new o(n,s,l,12,0,0,0,0,0,d);return {instant:BuiltinTimeZoneGetInstantFor(getResolvedTimeZoneLazy(t),m,"compatible"),formatter:getPropLazy(t,xe)}}if(IsTemporalDate(e)){const n=GetSlot(e,r$1),s=GetSlot(e,a),l=GetSlot(e,i$1),d=ToString(GetSlot(e,T));if("iso8601"!==d&&d!==t[Xe])throw new RangeError(`cannot format PlainDate with calendar ${d} in locale with calendar ${t[Xe]}`);const m=new o(n,s,l,12,0,0,0,0,0,t[Xe]);return {instant:BuiltinTimeZoneGetInstantFor(getResolvedTimeZoneLazy(t),m,"compatible"),formatter:getPropLazy(t,Ue)}}if(IsTemporalDateTime(e)){const n=GetSlot(e,r$1),u=GetSlot(e,a),p=GetSlot(e,i$1),f=GetSlot(e,s),y=GetSlot(e,l),S=GetSlot(e,d),g=GetSlot(e,m),w=GetSlot(e,c),I=GetSlot(e,h),G=ToString(GetSlot(e,T));if("iso8601"!==G&&G!==t[Xe])throw new RangeError(`cannot format PlainDateTime with calendar ${G} in locale with calendar ${t[Xe]}`);let D=e;return "iso8601"===G&&(D=new o(n,u,p,f,y,S,g,w,I,t[Xe])),{instant:BuiltinTimeZoneGetInstantFor(getResolvedTimeZoneLazy(t),D,"compatible"),formatter:getPropLazy(t,qe)}}if(IsTemporalZonedDateTime(e)){const o=ToString(GetSlot(e,T));if("iso8601"!==o&&o!==t[Xe])throw new RangeError(`cannot format ZonedDateTime with calendar ${o} in locale with calendar ${t[Xe]}`);const n=ToString(GetSlot(e,p));if(t[_e]&&t[_e]!==n)throw new RangeError(`timeZone option ${t[_e]} doesn't match actual time zone ${n}`);return {instant:GetSlot(e,u),formatter:getPropLazy(t,We),timeZone:n}}return IsTemporalInstant(e)?{instant:e,formatter:getPropLazy(t,ze)}:{}}Object.freeze({__proto__:null,DateTimeFormat:at});const st=["year","month","week","day"],lt={hour:24,minute:60,second:60,millisecond:1e3,microsecond:1e3,nanosecond:1e3};class Instant{constructor(e){if(arguments.length<1)throw new TypeError("missing argument: epochNanoseconds is required");const t=ToBigInt(e);ValidateEpochNanoseconds(t),CreateSlots(this),SetSlot(this,o,t);}get epochSeconds(){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const t=GetSlot(this,o);return jsbiUmd.toNumber(jsbiUmd.divide(t,Oe))}get epochMilliseconds(){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const t=jsbiUmd.BigInt(GetSlot(this,o));return jsbiUmd.toNumber(jsbiUmd.divide(t,ve))}get epochMicroseconds(){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const t=jsbiUmd.BigInt(GetSlot(this,o));return ToBigIntExternal(jsbiUmd.divide(t,De))}get epochNanoseconds(){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");return ToBigIntExternal(jsbiUmd.BigInt(GetSlot(this,o)))}add(e){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const{hours:t,minutes:n,seconds:r,milliseconds:a,microseconds:i,nanoseconds:s}=ToLimitedTemporalDuration(e,["years","months","weeks","days"]),l=AddInstant(GetSlot(this,o),t,n,r,a,i,s);return new Instant(l)}subtract(e){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const{hours:t,minutes:n,seconds:r,milliseconds:a,microseconds:i,nanoseconds:s}=ToLimitedTemporalDuration(e,["years","months","weeks","days"]),l=AddInstant(GetSlot(this,o),-t,-n,-r,-a,-i,-s);return new Instant(l)}until(e,t){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const n=ToTemporalInstant(e),r=GetOptionsObject(t),a=ToSmallestTemporalUnit(r,"nanosecond",st),i=LargerOfTwoTemporalUnits("second",a),s=ToLargestTemporalUnit(r,"auto",st,i);ValidateTemporalUnitRange(s,a);const l=ToTemporalRoundingMode(r,"trunc"),d=ToTemporalRoundingIncrement(r,lt[a],!1),m=GetSlot(this,o),c=GetSlot(n,o);let h,T,{seconds:u,milliseconds:p,microseconds:f,nanoseconds:y}=DifferenceInstant(m,c,d,a,l);({hours:h,minutes:T,seconds:u,milliseconds:p,microseconds:f,nanoseconds:y}=BalanceDuration(0,0,0,u,p,f,y,s));return new(GetIntrinsic("%Temporal.Duration%"))(0,0,0,0,h,T,u,p,f,y)}since(e,t){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const n=ToTemporalInstant(e),r=GetOptionsObject(t),a=ToSmallestTemporalUnit(r,"nanosecond",st),i=LargerOfTwoTemporalUnits("second",a),s=ToLargestTemporalUnit(r,"auto",st,i);ValidateTemporalUnitRange(s,a);const l=ToTemporalRoundingMode(r,"trunc"),d=ToTemporalRoundingIncrement(r,lt[a],!1),m=GetSlot(n,o),c=GetSlot(this,o);let h,T,{seconds:u,milliseconds:p,microseconds:f,nanoseconds:y}=DifferenceInstant(m,c,d,a,l);({hours:h,minutes:T,seconds:u,milliseconds:p,microseconds:f,nanoseconds:y}=BalanceDuration(0,0,0,u,p,f,y,s));return new(GetIntrinsic("%Temporal.Duration%"))(0,0,0,0,h,T,u,p,f,y)}round(e){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");if(void 0===e)throw new TypeError("options parameter is required");const t="string"==typeof e?CreateOnePropObject("smallestUnit",e):GetOptionsObject(e),n=ToSmallestTemporalUnit(t,void 0,st);if(void 0===n)throw new RangeError("smallestUnit is required");const r=ToTemporalRoundingMode(t,"halfExpand"),a=ToTemporalRoundingIncrement(t,{hour:24,minute:1440,second:86400,millisecond:864e5,microsecond:864e8,nanosecond:864e11}[n],!0),i=RoundInstant(GetSlot(this,o),a,n,r);return new Instant(i)}equals(t){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const n=ToTemporalInstant(t),r=GetSlot(this,o),a=GetSlot(n,o);return jsbiUmd.equal(jsbiUmd.BigInt(r),jsbiUmd.BigInt(a))}toString(e){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");const t=GetOptionsObject(e);let n=t.timeZone;void 0!==n&&(n=ToTemporalTimeZone(n));const{precision:r,unit:a,increment:i}=ToSecondsStringPrecision(t),s=ToTemporalRoundingMode(t,"trunc"),l=RoundInstant(GetSlot(this,o),i,a,s);return TemporalInstantToString(new Instant(l),n,r)}toJSON(){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");return TemporalInstantToString(this,void 0,"auto")}toLocaleString(e,t){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");return new at(e,t).format(this)}valueOf(){throw new TypeError("use compare() or equals() to compare Temporal.Instant")}toZonedDateTime(e){if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid argument in toZonedDateTime");const t=e.calendar;if(void 0===t)throw new TypeError("missing calendar property in toZonedDateTime");const n=ToTemporalCalendar(t),r=e.timeZone;if(void 0===r)throw new TypeError("missing timeZone property in toZonedDateTime");const a=ToTemporalTimeZone(r);return CreateTemporalZonedDateTime(GetSlot(this,o),a,n)}toZonedDateTimeISO(e){let t=e;if(!IsTemporalInstant(this))throw new TypeError("invalid receiver");if(IsObject(t)){const e=t.timeZone;void 0!==e&&(t=e);}const n=ToTemporalTimeZone(t),r=GetISO8601Calendar();return CreateTemporalZonedDateTime(GetSlot(this,o),n,r)}static fromEpochSeconds(t){const o=ToNumber(t),n=jsbiUmd.multiply(jsbiUmd.BigInt(o),Oe);return ValidateEpochNanoseconds(n),new Instant(n)}static fromEpochMilliseconds(t){const o=ToNumber(t),n=jsbiUmd.multiply(jsbiUmd.BigInt(o),ve);return ValidateEpochNanoseconds(n),new Instant(n)}static fromEpochMicroseconds(t){const o=ToBigInt(t),n=jsbiUmd.multiply(o,De);return ValidateEpochNanoseconds(n),new Instant(n)}static fromEpochNanoseconds(e){const t=ToBigInt(e);return ValidateEpochNanoseconds(t),new Instant(t)}static from(e){return IsTemporalInstant(e)?new Instant(GetSlot(e,o)):ToTemporalInstant(e)}static compare(t,n){const r=ToTemporalInstant(t),a=ToTemporalInstant(n),i=GetSlot(r,o),s=GetSlot(a,o);return jsbiUmd.lessThan(i,s)?-1:jsbiUmd.greaterThan(i,s)?1:0}}MakeIntrinsicClass(Instant,"Temporal.Instant");const dt=["hour","minute","second","millisecond","microsecond","nanosecond"];class PlainDate{constructor(e,t,o,n=GetISO8601Calendar()){const r=ToIntegerThrowOnInfinity(e),a=ToIntegerThrowOnInfinity(t),i=ToIntegerThrowOnInfinity(o),s=ToTemporalCalendar(n);if(arguments.length<3)throw new RangeError("missing argument: isoYear, isoMonth and isoDay are required");CreateTemporalDateSlots(this,r,a,i,s);}get calendar(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return GetSlot(this,T)}get era(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarEra(GetSlot(this,T),this)}get eraYear(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarEraYear(GetSlot(this,T),this)}get year(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarYear(GetSlot(this,T),this)}get month(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarMonth(GetSlot(this,T),this)}get monthCode(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarMonthCode(GetSlot(this,T),this)}get day(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarDay(GetSlot(this,T),this)}get dayOfWeek(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarDayOfWeek(GetSlot(this,T),this)}get dayOfYear(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarDayOfYear(GetSlot(this,T),this)}get weekOfYear(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarWeekOfYear(GetSlot(this,T),this)}get daysInWeek(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarDaysInWeek(GetSlot(this,T),this)}get daysInMonth(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarDaysInMonth(GetSlot(this,T),this)}get daysInYear(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarDaysInYear(GetSlot(this,T),this)}get monthsInYear(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarMonthsInYear(GetSlot(this,T),this)}get inLeapYear(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return CalendarInLeapYear(GetSlot(this,T),this)}with(e,t){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid argument");RejectObjectWithCalendarOrTimeZone(e);const o=GetSlot(this,T),n=CalendarFields(o,["day","month","monthCode","year"]),r=ToPartialRecord(e,n);if(!r)throw new TypeError("invalid date-like");let a=ToTemporalDateFields(this,n);a=CalendarMergeFields(o,a,r),a=ToTemporalDateFields(a,n);return DateFromFields(o,a,GetOptionsObject(t))}withCalendar(e){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const t=ToTemporalCalendar(e);return new PlainDate(GetSlot(this,r$1),GetSlot(this,a),GetSlot(this,i$1),t)}add(e,t){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const o=ToTemporalDuration(e),n=GetOptionsObject(t);return CalendarDateAdd(GetSlot(this,T),this,o,n)}subtract(e,t){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const o=CreateNegatedTemporalDuration(ToTemporalDuration(e)),n=GetOptionsObject(t);return CalendarDateAdd(GetSlot(this,T),this,o,n)}until(e,t){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const o=ToTemporalDate(e),n=GetSlot(this,T),r=GetSlot(o,T),a=ToString(n),i=ToString(r);if(a!==i)throw new RangeError(`cannot compute difference between dates of ${a} and ${i} calendars`);const s=GetOptionsObject(t),l=ToSmallestTemporalUnit(s,"day",dt),d=LargerOfTwoTemporalUnits("day",l),m=ToLargestTemporalUnit(s,"auto",dt,d);ValidateTemporalUnitRange(m,l);const c=ToTemporalRoundingMode(s,"trunc"),h=ToTemporalRoundingIncrement(s,void 0,!1),u=CalendarDateUntil(n,this,o,{...s,largestUnit:m});if("day"===l&&1===h)return u;let{years:p,months:f,weeks:y,days:S}=u;({years:p,months:f,weeks:y,days:S}=RoundDuration(p,f,y,S,0,0,0,0,0,0,h,l,c,this));return new(GetIntrinsic("%Temporal.Duration%"))(p,f,y,S,0,0,0,0,0,0)}since(e,t){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const o=ToTemporalDate(e),n=GetSlot(this,T),r=GetSlot(o,T),a=ToString(n),i=ToString(r);if(a!==i)throw new RangeError(`cannot compute difference between dates of ${a} and ${i} calendars`);const s=GetOptionsObject(t),l=ToSmallestTemporalUnit(s,"day",dt),d=LargerOfTwoTemporalUnits("day",l),m=ToLargestTemporalUnit(s,"auto",dt,d);ValidateTemporalUnitRange(m,l);const c=ToTemporalRoundingMode(s,"trunc"),h=ToTemporalRoundingIncrement(s,void 0,!1),u={...s,largestUnit:m};let{years:p,months:f,weeks:y,days:S}=CalendarDateUntil(n,this,o,u);const g=GetIntrinsic("%Temporal.Duration%");return "day"===l&&1===h||({years:p,months:f,weeks:y,days:S}=RoundDuration(p,f,y,S,0,0,0,0,0,0,h,l,NegateTemporalRoundingMode(c),this)),new g(-p,-f,-y,-S,0,0,0,0,0,0)}equals(e){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const t=ToTemporalDate(e);for(const e of [r$1,a,i$1]){if(GetSlot(this,e)!==GetSlot(t,e))return !1}return CalendarEquals(GetSlot(this,T),GetSlot(t,T))}toString(e){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return TemporalDateToString(this,ToShowCalendarOption(GetOptionsObject(e)))}toJSON(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return TemporalDateToString(this)}toLocaleString(e,t){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return new at(e,t).format(this)}valueOf(){throw new TypeError("use compare() or equals() to compare Temporal.PlainDate")}toPlainDateTime(e){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const t=GetSlot(this,r$1),o=GetSlot(this,a),n=GetSlot(this,i$1),u=GetSlot(this,T);if(void 0===e)return CreateTemporalDateTime(t,o,n,0,0,0,0,0,0,u);const p=ToTemporalTime(e);return CreateTemporalDateTime(t,o,n,GetSlot(p,s),GetSlot(p,l),GetSlot(p,d),GetSlot(p,m),GetSlot(p,c),GetSlot(p,h),u)}toZonedDateTime(e){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");let t,n;if(IsObject(e)){const o=e.timeZone;void 0===o?t=ToTemporalTimeZone(e):(t=ToTemporalTimeZone(o),n=e.plainTime);}else t=ToTemporalTimeZone(e);const u=GetSlot(this,r$1),p=GetSlot(this,a),f=GetSlot(this,i$1),y=GetSlot(this,T);let S=0,g=0,w=0,I=0,G=0,D=0;void 0!==n&&(n=ToTemporalTime(n),S=GetSlot(n,s),g=GetSlot(n,l),w=GetSlot(n,d),I=GetSlot(n,m),G=GetSlot(n,c),D=GetSlot(n,h));return CreateTemporalZonedDateTime(GetSlot(BuiltinTimeZoneGetInstantFor(t,CreateTemporalDateTime(u,p,f,S,g,w,I,G,D,y),"compatible"),o),t,y)}toPlainYearMonth(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const e=GetSlot(this,T);return YearMonthFromFields(e,ToTemporalYearMonthFields(this,CalendarFields(e,["monthCode","year"])))}toPlainMonthDay(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");const e=GetSlot(this,T);return MonthDayFromFields(e,ToTemporalMonthDayFields(this,CalendarFields(e,["day","monthCode"])))}getISOFields(){if(!IsTemporalDate(this))throw new TypeError("invalid receiver");return {calendar:GetSlot(this,T),isoDay:GetSlot(this,i$1),isoMonth:GetSlot(this,a),isoYear:GetSlot(this,r$1)}}static from(e,t){const o=GetOptionsObject(t);return IsTemporalDate(e)?(ToTemporalOverflow(o),CreateTemporalDate(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1),GetSlot(e,T))):ToTemporalDate(e,o)}static compare(e,t){const o=ToTemporalDate(e),n=ToTemporalDate(t);return CompareISODate(GetSlot(o,r$1),GetSlot(o,a),GetSlot(o,i$1),GetSlot(n,r$1),GetSlot(n,a),GetSlot(n,i$1))}}MakeIntrinsicClass(PlainDate,"Temporal.PlainDate");class PlainDateTime{constructor(e,t,o,n=0,r=0,a=0,i=0,s=0,l=0,d=GetISO8601Calendar()){const m=ToIntegerThrowOnInfinity(e),c=ToIntegerThrowOnInfinity(t),h=ToIntegerThrowOnInfinity(o),T=ToIntegerThrowOnInfinity(n),u=ToIntegerThrowOnInfinity(r),p=ToIntegerThrowOnInfinity(a),f=ToIntegerThrowOnInfinity(i),y=ToIntegerThrowOnInfinity(s),S=ToIntegerThrowOnInfinity(l),g=ToTemporalCalendar(d);if(arguments.length<3)throw new RangeError("missing argument: isoYear, isoMonth and isoDay are required");CreateTemporalDateTimeSlots(this,m,c,h,T,u,p,f,y,S,g);}get calendar(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,T)}get year(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarYear(GetSlot(this,T),this)}get month(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarMonth(GetSlot(this,T),this)}get monthCode(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarMonthCode(GetSlot(this,T),this)}get day(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarDay(GetSlot(this,T),this)}get hour(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,s)}get minute(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,l)}get second(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,d)}get millisecond(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,m)}get microsecond(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,c)}get nanosecond(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,h)}get era(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarEra(GetSlot(this,T),this)}get eraYear(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarEraYear(GetSlot(this,T),this)}get dayOfWeek(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarDayOfWeek(GetSlot(this,T),this)}get dayOfYear(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarDayOfYear(GetSlot(this,T),this)}get weekOfYear(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarWeekOfYear(GetSlot(this,T),this)}get daysInWeek(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarDaysInWeek(GetSlot(this,T),this)}get daysInYear(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarDaysInYear(GetSlot(this,T),this)}get daysInMonth(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarDaysInMonth(GetSlot(this,T),this)}get monthsInYear(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarMonthsInYear(GetSlot(this,T),this)}get inLeapYear(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return CalendarInLeapYear(GetSlot(this,T),this)}with(e,t){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid argument");RejectObjectWithCalendarOrTimeZone(e);const o=GetOptionsObject(t),n=GetSlot(this,T),r=CalendarFields(n,["day","hour","microsecond","millisecond","minute","month","monthCode","nanosecond","second","year"]),a=ToPartialRecord(e,r);if(!a)throw new TypeError("invalid date-time-like");let i=ToTemporalDateTimeFields(this,r);i=CalendarMergeFields(n,i,a),i=ToTemporalDateTimeFields(i,r);const{year:s,month:l,day:d,hour:m,minute:c,second:h,millisecond:u,microsecond:p,nanosecond:f}=InterpretTemporalDateTimeFields(n,i,o);return CreateTemporalDateTime(s,l,d,m,c,h,u,p,f,n)}withPlainTime(e){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const t=GetSlot(this,r$1),o=GetSlot(this,a),n=GetSlot(this,i$1),u=GetSlot(this,T);if(void 0===e)return CreateTemporalDateTime(t,o,n,0,0,0,0,0,0,u);const p=ToTemporalTime(e);return CreateTemporalDateTime(t,o,n,GetSlot(p,s),GetSlot(p,l),GetSlot(p,d),GetSlot(p,m),GetSlot(p,c),GetSlot(p,h),u)}withPlainDate(e){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const t=ToTemporalDate(e),o=GetSlot(t,r$1),n=GetSlot(t,a),u=GetSlot(t,i$1);let p=GetSlot(t,T);const f=GetSlot(this,s),y=GetSlot(this,l),S=GetSlot(this,d),g=GetSlot(this,m),w=GetSlot(this,c),I=GetSlot(this,h);return p=ConsolidateCalendars(GetSlot(this,T),p),CreateTemporalDateTime(o,n,u,f,y,S,g,w,I,p)}withCalendar(e){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const t=ToTemporalCalendar(e);return new PlainDateTime(GetSlot(this,r$1),GetSlot(this,a),GetSlot(this,i$1),GetSlot(this,s),GetSlot(this,l),GetSlot(this,d),GetSlot(this,m),GetSlot(this,c),GetSlot(this,h),t)}add(e,t){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const o=ToLimitedTemporalDuration(e),{years:n,months:u,weeks:p,days:f,hours:y,minutes:S,seconds:g,milliseconds:w,microseconds:I,nanoseconds:G}=o,D=GetOptionsObject(t),v=GetSlot(this,T),{year:O,month:C,day:E,hour:b,minute:R,second:M,millisecond:Z,microsecond:F,nanosecond:Y}=AddDateTime(GetSlot(this,r$1),GetSlot(this,a),GetSlot(this,i$1),GetSlot(this,s),GetSlot(this,l),GetSlot(this,d),GetSlot(this,m),GetSlot(this,c),GetSlot(this,h),v,n,u,p,f,y,S,g,w,I,G,D);return CreateTemporalDateTime(O,C,E,b,R,M,Z,F,Y,v)}subtract(e,t){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const o=ToLimitedTemporalDuration(e),{years:n,months:u,weeks:p,days:f,hours:y,minutes:S,seconds:g,milliseconds:w,microseconds:I,nanoseconds:G}=o,D=GetOptionsObject(t),v=GetSlot(this,T),{year:O,month:C,day:E,hour:b,minute:R,second:M,millisecond:Z,microsecond:F,nanosecond:Y}=AddDateTime(GetSlot(this,r$1),GetSlot(this,a),GetSlot(this,i$1),GetSlot(this,s),GetSlot(this,l),GetSlot(this,d),GetSlot(this,m),GetSlot(this,c),GetSlot(this,h),v,-n,-u,-p,-f,-y,-S,-g,-w,-I,-G,D);return CreateTemporalDateTime(O,C,E,b,R,M,Z,F,Y,v)}until(e,t){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const o=ToTemporalDateTime(e),n=GetSlot(this,T),u=GetSlot(o,T),p=ToString(n),f=ToString(u);if(p!==f)throw new RangeError(`cannot compute difference between dates of ${p} and ${f} calendars`);const y=GetOptionsObject(t),S=ToSmallestTemporalUnit(y,"nanosecond"),g=ToLargestTemporalUnit(y,"auto",[],LargerOfTwoTemporalUnits("day",S));ValidateTemporalUnitRange(g,S);const w=ToTemporalRoundingMode(y,"trunc"),I=ToTemporalDateTimeRoundingIncrement(y,S);let{years:G,months:D,weeks:v,days:O,hours:C,minutes:E,seconds:b,milliseconds:R,microseconds:M,nanoseconds:Z}=DifferenceISODateTime(GetSlot(this,r$1),GetSlot(this,a),GetSlot(this,i$1),GetSlot(this,s),GetSlot(this,l),GetSlot(this,d),GetSlot(this,m),GetSlot(this,c),GetSlot(this,h),GetSlot(o,r$1),GetSlot(o,a),GetSlot(o,i$1),GetSlot(o,s),GetSlot(o,l),GetSlot(o,d),GetSlot(o,m),GetSlot(o,c),GetSlot(o,h),n,g,y);const F=TemporalDateTimeToDate(this);(({years:G,months:D,weeks:v,days:O,hours:C,minutes:E,seconds:b,milliseconds:R,microseconds:M,nanoseconds:Z}=RoundDuration(G,D,v,O,C,E,b,R,M,Z,I,S,w,F))),({days:O,hours:C,minutes:E,seconds:b,milliseconds:R,microseconds:M,nanoseconds:Z}=BalanceDuration(O,C,E,b,R,M,Z,g));return new(GetIntrinsic("%Temporal.Duration%"))(G,D,v,O,C,E,b,R,M,Z)}since(e,t){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const o=ToTemporalDateTime(e),n=GetSlot(this,T),u=GetSlot(o,T),p=ToString(n),f=ToString(u);if(p!==f)throw new RangeError(`cannot compute difference between dates of ${p} and ${f} calendars`);const y=GetOptionsObject(t),S=ToSmallestTemporalUnit(y,"nanosecond"),g=ToLargestTemporalUnit(y,"auto",[],LargerOfTwoTemporalUnits("day",S));ValidateTemporalUnitRange(g,S);const w=ToTemporalRoundingMode(y,"trunc"),I=ToTemporalDateTimeRoundingIncrement(y,S);let{years:G,months:D,weeks:v,days:O,hours:C,minutes:E,seconds:b,milliseconds:R,microseconds:M,nanoseconds:Z}=DifferenceISODateTime(GetSlot(this,r$1),GetSlot(this,a),GetSlot(this,i$1),GetSlot(this,s),GetSlot(this,l),GetSlot(this,d),GetSlot(this,m),GetSlot(this,c),GetSlot(this,h),GetSlot(o,r$1),GetSlot(o,a),GetSlot(o,i$1),GetSlot(o,s),GetSlot(o,l),GetSlot(o,d),GetSlot(o,m),GetSlot(o,c),GetSlot(o,h),n,g,y);const F=TemporalDateTimeToDate(this);(({years:G,months:D,weeks:v,days:O,hours:C,minutes:E,seconds:b,milliseconds:R,microseconds:M,nanoseconds:Z}=RoundDuration(G,D,v,O,C,E,b,R,M,Z,I,S,NegateTemporalRoundingMode(w),F))),({days:O,hours:C,minutes:E,seconds:b,milliseconds:R,microseconds:M,nanoseconds:Z}=BalanceDuration(O,C,E,b,R,M,Z,g));return new(GetIntrinsic("%Temporal.Duration%"))(-G,-D,-v,-O,-C,-E,-b,-R,-M,-Z)}round(e){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");if(void 0===e)throw new TypeError("options parameter is required");const t="string"==typeof e?CreateOnePropObject("smallestUnit",e):GetOptionsObject(e),o=ToSmallestTemporalUnit(t,void 0,["year","month","week"]);if(void 0===o)throw new RangeError("smallestUnit is required");const n=ToTemporalRoundingMode(t,"halfExpand"),u=ToTemporalRoundingIncrement(t,{day:1,hour:24,minute:60,second:60,millisecond:1e3,microsecond:1e3,nanosecond:1e3}[o],!1);let p=GetSlot(this,r$1),f=GetSlot(this,a),y=GetSlot(this,i$1),S=GetSlot(this,s),g=GetSlot(this,l),w=GetSlot(this,d),I=GetSlot(this,m),G=GetSlot(this,c),D=GetSlot(this,h);return ({year:p,month:f,day:y,hour:S,minute:g,second:w,millisecond:I,microsecond:G,nanosecond:D}=RoundISODateTime(p,f,y,S,g,w,I,G,D,u,o,n)),CreateTemporalDateTime(p,f,y,S,g,w,I,G,D,GetSlot(this,T))}equals(e){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const t=ToTemporalDateTime(e);for(const e of [r$1,a,i$1,s,l,d,m,c,h]){if(GetSlot(this,e)!==GetSlot(t,e))return !1}return CalendarEquals(GetSlot(this,T),GetSlot(t,T))}toString(e){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const t=GetOptionsObject(e),{precision:o,unit:n,increment:r}=ToSecondsStringPrecision(t);return TemporalDateTimeToString(this,o,ToShowCalendarOption(t),{unit:n,increment:r,roundingMode:ToTemporalRoundingMode(t,"trunc")})}toJSON(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return TemporalDateTimeToString(this,"auto")}toLocaleString(e,t){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return new at(e,t).format(this)}valueOf(){throw new TypeError("use compare() or equals() to compare Temporal.PlainDateTime")}toZonedDateTime(e,t){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const n=ToTemporalTimeZone(e);return CreateTemporalZonedDateTime(GetSlot(BuiltinTimeZoneGetInstantFor(n,this,ToTemporalDisambiguation(GetOptionsObject(t))),o),n,GetSlot(this,T))}toPlainDate(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return TemporalDateTimeToDate(this)}toPlainYearMonth(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const e=GetSlot(this,T);return YearMonthFromFields(e,ToTemporalYearMonthFields(this,CalendarFields(e,["monthCode","year"])))}toPlainMonthDay(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");const e=GetSlot(this,T);return MonthDayFromFields(e,ToTemporalMonthDayFields(this,CalendarFields(e,["day","monthCode"])))}toPlainTime(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return TemporalDateTimeToTime(this)}getISOFields(){if(!IsTemporalDateTime(this))throw new TypeError("invalid receiver");return {calendar:GetSlot(this,T),isoDay:GetSlot(this,i$1),isoHour:GetSlot(this,s),isoMicrosecond:GetSlot(this,c),isoMillisecond:GetSlot(this,m),isoMinute:GetSlot(this,l),isoMonth:GetSlot(this,a),isoNanosecond:GetSlot(this,h),isoSecond:GetSlot(this,d),isoYear:GetSlot(this,r$1)}}static from(e,t){const o=GetOptionsObject(t);return IsTemporalDateTime(e)?(ToTemporalOverflow(o),CreateTemporalDateTime(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1),GetSlot(e,s),GetSlot(e,l),GetSlot(e,d),GetSlot(e,m),GetSlot(e,c),GetSlot(e,h),GetSlot(e,T))):ToTemporalDateTime(e,o)}static compare(e,t){const o=ToTemporalDateTime(e),n=ToTemporalDateTime(t);for(const e of [r$1,a,i$1,s,l,d,m,c,h]){const t=GetSlot(o,e),r=GetSlot(n,e);if(t!==r)return ComparisonResult(t-r)}return 0}}MakeIntrinsicClass(PlainDateTime,"Temporal.PlainDateTime");class Duration{constructor(e=0,t=0,o=0,n=0,r=0,a=0,i=0,s=0,l=0,d=0){const m=ToIntegerWithoutRounding(e),c=ToIntegerWithoutRounding(t),h=ToIntegerWithoutRounding(o),T=ToIntegerWithoutRounding(n),u=ToIntegerWithoutRounding(r),p=ToIntegerWithoutRounding(a),C=ToIntegerWithoutRounding(i),E=ToIntegerWithoutRounding(s),b=ToIntegerWithoutRounding(l),R=ToIntegerWithoutRounding(d),M=DurationSign(m,c,h,T,u,p,C,E,b,R);for(const e of [m,c,h,T,u,p,C,E,b,R]){if(!Number.isFinite(e))throw new RangeError("infinite values not allowed as duration fields");const t=Math.sign(e);if(0!==t&&t!==M)throw new RangeError("mixed-sign values not allowed as duration fields")}CreateSlots(this),SetSlot(this,f,m),SetSlot(this,y,c),SetSlot(this,S,h),SetSlot(this,g,T),SetSlot(this,w,u),SetSlot(this,I,p),SetSlot(this,G,C),SetSlot(this,D,E),SetSlot(this,v,b),SetSlot(this,O,R);}get years(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,f)}get months(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,y)}get weeks(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,S)}get days(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,g)}get hours(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,w)}get minutes(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,I)}get seconds(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,G)}get milliseconds(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,D)}get microseconds(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,v)}get nanoseconds(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return GetSlot(this,O)}get sign(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return DurationSign(GetSlot(this,f),GetSlot(this,y),GetSlot(this,S),GetSlot(this,g),GetSlot(this,w),GetSlot(this,I),GetSlot(this,G),GetSlot(this,D),GetSlot(this,v),GetSlot(this,O))}get blank(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return 0===DurationSign(GetSlot(this,f),GetSlot(this,y),GetSlot(this,S),GetSlot(this,g),GetSlot(this,w),GetSlot(this,I),GetSlot(this,G),GetSlot(this,D),GetSlot(this,v),GetSlot(this,O))}with(e){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");const t=ToPartialRecord(e,["days","hours","microseconds","milliseconds","minutes","months","nanoseconds","seconds","weeks","years"]);if(!t)throw new TypeError("invalid duration-like");const{years:o=GetSlot(this,f),months:n=GetSlot(this,y),weeks:r=GetSlot(this,S),days:a=GetSlot(this,g),hours:i=GetSlot(this,w),minutes:s=GetSlot(this,I),seconds:l=GetSlot(this,G),milliseconds:d=GetSlot(this,D),microseconds:m=GetSlot(this,v),nanoseconds:c=GetSlot(this,O)}=t;return new Duration(o,n,r,a,i,s,l,d,m,c)}negated(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return CreateNegatedTemporalDuration(this)}abs(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return new Duration(Math.abs(GetSlot(this,f)),Math.abs(GetSlot(this,y)),Math.abs(GetSlot(this,S)),Math.abs(GetSlot(this,g)),Math.abs(GetSlot(this,w)),Math.abs(GetSlot(this,I)),Math.abs(GetSlot(this,G)),Math.abs(GetSlot(this,D)),Math.abs(GetSlot(this,v)),Math.abs(GetSlot(this,O)))}add(e,t){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");let{years:o,months:n,weeks:r,days:a,hours:i,minutes:s,seconds:l,milliseconds:d,microseconds:m,nanoseconds:c}=ToLimitedTemporalDuration(e);const h=ToRelativeTemporalObject(GetOptionsObject(t));return ({years:o,months:n,weeks:r,days:a,hours:i,minutes:s,seconds:l,milliseconds:d,microseconds:m,nanoseconds:c}=AddDuration(GetSlot(this,f),GetSlot(this,y),GetSlot(this,S),GetSlot(this,g),GetSlot(this,w),GetSlot(this,I),GetSlot(this,G),GetSlot(this,D),GetSlot(this,v),GetSlot(this,O),o,n,r,a,i,s,l,d,m,c,h)),new Duration(o,n,r,a,i,s,l,d,m,c)}subtract(e,t){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");let{years:o,months:n,weeks:r,days:a,hours:i,minutes:s,seconds:l,milliseconds:d,microseconds:m,nanoseconds:c}=ToLimitedTemporalDuration(e);const h=ToRelativeTemporalObject(GetOptionsObject(t));return ({years:o,months:n,weeks:r,days:a,hours:i,minutes:s,seconds:l,milliseconds:d,microseconds:m,nanoseconds:c}=AddDuration(GetSlot(this,f),GetSlot(this,y),GetSlot(this,S),GetSlot(this,g),GetSlot(this,w),GetSlot(this,I),GetSlot(this,G),GetSlot(this,D),GetSlot(this,v),GetSlot(this,O),-o,-n,-r,-a,-i,-s,-l,-d,-m,-c,h)),new Duration(o,n,r,a,i,s,l,d,m,c)}round(e){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");if(void 0===e)throw new TypeError("options parameter is required");let t=GetSlot(this,f),o=GetSlot(this,y),n=GetSlot(this,S),r=GetSlot(this,g),a=GetSlot(this,w),i=GetSlot(this,I),s=GetSlot(this,G),l=GetSlot(this,D),d=GetSlot(this,v),m=GetSlot(this,O),c=DefaultTemporalLargestUnit(t,o,n,r,a,i,s,l,d,m);const h="string"==typeof e?CreateOnePropObject("smallestUnit",e):GetOptionsObject(e);let u=ToSmallestTemporalUnit(h,void 0),p=!0;u||(p=!1,u="nanosecond"),c=LargerOfTwoTemporalUnits(c,u);let C=ToLargestTemporalUnit(h,void 0),E=!0;if(C||(E=!1,C=c),"auto"===C&&(C=c),!p&&!E)throw new RangeError("at least one of smallestUnit or largestUnit is required");ValidateTemporalUnitRange(C,u);const b=ToTemporalRoundingMode(h,"halfExpand"),R=ToTemporalDateTimeRoundingIncrement(h,u);let M=ToRelativeTemporalObject(h);return ({years:t,months:o,weeks:n,days:r}=UnbalanceDurationRelative(t,o,n,r,C,M)),({years:t,months:o,weeks:n,days:r,hours:a,minutes:i,seconds:s,milliseconds:l,microseconds:d,nanoseconds:m}=RoundDuration(t,o,n,r,a,i,s,l,d,m,R,u,b,M)),({years:t,months:o,weeks:n,days:r,hours:a,minutes:i,seconds:s,milliseconds:l,microseconds:d,nanoseconds:m}=AdjustRoundedDurationDays(t,o,n,r,a,i,s,l,d,m,R,u,b,M)),({years:t,months:o,weeks:n,days:r}=function BalanceDurationRelative(e,t,o,n,r,a){let i=e,s=t,l=o,d=n;const m=GetIntrinsic("%Temporal.Duration%"),c=DurationSign(i,s,l,d,0,0,0,0,0,0);if(0===c)return {years:i,months:s,weeks:l,days:d};let h,u;a&&(u=ToTemporalDate(a),h=GetSlot(u,T));const p=new m(c),f=new m(0,c),S=new m(0,0,c);switch(r){case"year":{if(!h)throw new RangeError("a starting point is required for years balancing");let e,t,o;for(({relativeTo:e,days:t}=MoveRelativeDate(h,u,p));le(d)>=le(t);)d-=t,i+=c,u=e,({relativeTo:e,days:t}=MoveRelativeDate(h,u,p));for(({relativeTo:e,days:o}=MoveRelativeDate(h,u,f));le(d)>=le(o);)d-=o,s+=c,u=e,({relativeTo:e,days:o}=MoveRelativeDate(h,u,f));const n=h.dateAdd;e=CalendarDateAdd(h,u,p,ye(null),n);const r=h.dateUntil,a=ye(null);a.largestUnit="month";let l=CalendarDateUntil(h,u,e,a,r),m=GetSlot(l,y);for(;le(s)>=le(m);){s-=m,i+=c,u=e,e=CalendarDateAdd(h,u,p,ye(null),n);const t=ye(null);t.largestUnit="month",l=CalendarDateUntil(h,u,e,t,r),m=GetSlot(l,y);}break}case"month":{if(!h)throw new RangeError("a starting point is required for months balancing");let e,t;for(({relativeTo:e,days:t}=MoveRelativeDate(h,u,f));le(d)>=le(t);)d-=t,s+=c,u=e,({relativeTo:e,days:t}=MoveRelativeDate(h,u,f));break}case"week":{if(!h)throw new RangeError("a starting point is required for weeks balancing");let e,t;for(({relativeTo:e,days:t}=MoveRelativeDate(h,u,S));le(d)>=le(t);)d-=t,l+=c,u=e,({relativeTo:e,days:t}=MoveRelativeDate(h,u,S));break}}return {years:i,months:s,weeks:l,days:d}}(t,o,n,r,C,M)),IsTemporalZonedDateTime(M)&&(M=MoveRelativeZonedDateTime(M,t,o,n,0)),({days:r,hours:a,minutes:i,seconds:s,milliseconds:l,microseconds:d,nanoseconds:m}=BalanceDuration(r,a,i,s,l,d,m,C,M)),new Duration(t,o,n,r,a,i,s,l,d,m)}total(e){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");let t=GetSlot(this,f),o=GetSlot(this,y),n=GetSlot(this,S),r=GetSlot(this,g),a=GetSlot(this,w),i=GetSlot(this,I),s=GetSlot(this,G),l=GetSlot(this,D),d=GetSlot(this,v),m=GetSlot(this,O);if(void 0===e)throw new TypeError("options argument is required");const c="string"==typeof e?CreateOnePropObject("unit",e):GetOptionsObject(e),h=function ToTemporalDurationTotalUnit(e){const t=new Map(Be),o=GetOption(e,"unit",[...t.values(),...t.keys()],void 0);return t.has(o)?t.get(o):o}(c);if(void 0===h)throw new RangeError("unit option is required");const T=ToRelativeTemporalObject(c);let u;(({years:t,months:o,weeks:n,days:r}=UnbalanceDurationRelative(t,o,n,r,h,T))),IsTemporalZonedDateTime(T)&&(u=MoveRelativeZonedDateTime(T,t,o,n,0)),({days:r,hours:a,minutes:i,seconds:s,milliseconds:l,microseconds:d,nanoseconds:m}=BalanceDuration(r,a,i,s,l,d,m,h,u));const{total:p}=RoundDuration(t,o,n,r,a,i,s,l,d,m,1,h,"trunc",T);return p}toString(e){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");const t=GetOptionsObject(e),{precision:o,unit:n,increment:r}=ToSecondsStringPrecision(t);if("minute"===o)throw new RangeError('smallestUnit must not be "minute"');return TemporalDurationToString(this,o,{unit:n,increment:r,roundingMode:ToTemporalRoundingMode(t,"trunc")})}toJSON(){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return TemporalDurationToString(this)}toLocaleString(e,t){if(!IsTemporalDuration(this))throw new TypeError("invalid receiver");return "undefined"!=typeof Intl&&void 0!==Intl.DurationFormat?new Intl.DurationFormat(e,t).format(this):(console.warn("Temporal.Duration.prototype.toLocaleString() requires Intl.DurationFormat."),TemporalDurationToString(this))}valueOf(){throw new TypeError("use compare() to compare Temporal.Duration")}static from(e){return IsTemporalDuration(e)?new Duration(GetSlot(e,f),GetSlot(e,y),GetSlot(e,S),GetSlot(e,g),GetSlot(e,w),GetSlot(e,I),GetSlot(e,G),GetSlot(e,D),GetSlot(e,v),GetSlot(e,O)):ToTemporalDuration(e)}static compare(t,o,n){const r=ToTemporalDuration(t),a=ToTemporalDuration(o),i=ToRelativeTemporalObject(GetOptionsObject(n)),s=GetSlot(r,f),l=GetSlot(r,y),d=GetSlot(r,S);let m=GetSlot(r,g);const c=GetSlot(r,w),h=GetSlot(r,I),T=GetSlot(r,G),u=GetSlot(r,D),p=GetSlot(r,v);let C=GetSlot(r,O);const E=GetSlot(a,f),b=GetSlot(a,y),R=GetSlot(a,S);let M=GetSlot(a,g);const Z=GetSlot(a,w),F=GetSlot(a,I),Y=GetSlot(a,G),P=GetSlot(a,D),j=GetSlot(a,v);let B=GetSlot(a,O);const N=CalculateOffsetShift(i,s,l,d,m,c,h,T,u,p,C),$=CalculateOffsetShift(i,E,b,R,M,Z,F,Y,P,j,B);0===s&&0===E&&0===l&&0===b&&0===d&&0===R||(({days:m}=UnbalanceDurationRelative(s,l,d,m,"day",i)),({days:M}=UnbalanceDurationRelative(E,b,R,M,"day",i)));const k=TotalDurationNanoseconds(m,c,h,T,u,p,C,N),L=TotalDurationNanoseconds(M,Z,F,Y,P,j,B,$);return ComparisonResult(jsbiUmd.toNumber(jsbiUmd.subtract(k,L)))}}MakeIntrinsicClass(Duration,"Temporal.Duration");const mt=Object.create;class PlainMonthDay{constructor(e,t,o=GetISO8601Calendar(),n=1972){const r=ToIntegerThrowOnInfinity(e),a=ToIntegerThrowOnInfinity(t),i=ToTemporalCalendar(o),s=ToIntegerThrowOnInfinity(n);if(arguments.length<2)throw new RangeError("missing argument: isoMonth and isoDay are required");CreateTemporalMonthDaySlots(this,r,a,i,s);}get monthCode(){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");return CalendarMonthCode(GetSlot(this,T),this)}get day(){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");return CalendarDay(GetSlot(this,T),this)}get calendar(){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");return GetSlot(this,T)}with(e,t){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid argument");RejectObjectWithCalendarOrTimeZone(e);const o=GetSlot(this,T),n=CalendarFields(o,["day","month","monthCode","year"]),r=ToPartialRecord(e,n);if(!r)throw new TypeError("invalid month-day-like");let a=ToTemporalMonthDayFields(this,n);a=CalendarMergeFields(o,a,r),a=ToTemporalMonthDayFields(a,n);return MonthDayFromFields(o,a,GetOptionsObject(t))}equals(e){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");const t=ToTemporalMonthDay(e);for(const e of [a,i$1,r$1]){if(GetSlot(this,e)!==GetSlot(t,e))return !1}return CalendarEquals(GetSlot(this,T),GetSlot(t,T))}toString(e){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");return TemporalMonthDayToString(this,ToShowCalendarOption(GetOptionsObject(e)))}toJSON(){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");return TemporalMonthDayToString(this)}toLocaleString(e,t){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");return new at(e,t).format(this)}valueOf(){throw new TypeError("use equals() to compare Temporal.PlainMonthDay")}toPlainDate(e){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("argument should be an object");const t=GetSlot(this,T),o=CalendarFields(t,["day","monthCode"]),n=ToTemporalMonthDayFields(this,o),r=CalendarFields(t,["year"]),a=[["year",void 0]];r.forEach((e=>{a.some((([t])=>t===e))||a.push([e,void 0]);}));let i=CalendarMergeFields(t,n,PrepareTemporalFields(e,a));const s=[...new Set([...o,...r])],l=[];s.forEach((e=>{l.some((([t])=>t===e))||l.push([e,void 0]);})),i=PrepareTemporalFields(i,l);const d=mt(null);return d.overflow="reject",DateFromFields(t,i,d)}getISOFields(){if(!IsTemporalMonthDay(this))throw new TypeError("invalid receiver");return {calendar:GetSlot(this,T),isoDay:GetSlot(this,i$1),isoMonth:GetSlot(this,a),isoYear:GetSlot(this,r$1)}}static from(e,t){const o=GetOptionsObject(t);return IsTemporalMonthDay(e)?(ToTemporalOverflow(o),CreateTemporalMonthDay(GetSlot(e,a),GetSlot(e,i$1),GetSlot(e,T),GetSlot(e,r$1))):ToTemporalMonthDay(e,o)}}MakeIntrinsicClass(PlainMonthDay,"Temporal.PlainMonthDay");const instant=()=>new(GetIntrinsic("%Temporal.Instant%"))($e()),plainDateTime=(e,t=timeZone())=>{const o=ToTemporalTimeZone(t),n=ToTemporalCalendar(e);return BuiltinTimeZoneGetPlainDateTimeFor(o,instant(),n)},plainDateTimeISO=(e=timeZone())=>{const t=ToTemporalTimeZone(e),o=GetISO8601Calendar();return BuiltinTimeZoneGetPlainDateTimeFor(t,instant(),o)},zonedDateTime=(e,t=timeZone())=>{const o=ToTemporalTimeZone(t),n=ToTemporalCalendar(e);return CreateTemporalZonedDateTime($e(),o,n)},timeZone=()=>function SystemTimeZone(){const e=new ae("en-us");return new(GetIntrinsic("%Temporal.TimeZone%"))(ParseTemporalTimeZone(e.resolvedOptions().timeZone))}(),ct={instant,plainDateTime,plainDateTimeISO,plainDate:(e,t=timeZone())=>TemporalDateTimeToDate(plainDateTime(e,t)),plainDateISO:(e=timeZone())=>TemporalDateTimeToDate(plainDateTimeISO(e)),plainTimeISO:(e=timeZone())=>TemporalDateTimeToTime(plainDateTimeISO(e)),timeZone,zonedDateTime,zonedDateTimeISO:(e=timeZone())=>zonedDateTime(GetISO8601Calendar(),e),[Symbol.toStringTag]:"Temporal.Now"};Object.defineProperty(ct,Symbol.toStringTag,{value:"Temporal.Now",writable:!1,enumerable:!1,configurable:!0});const ht=Object.assign,Tt=["year","month","week","day"],ut={hour:24,minute:60,second:60,millisecond:1e3,microsecond:1e3,nanosecond:1e3};function TemporalTimeToString(e,t,o){let n=GetSlot(e,s),r=GetSlot(e,l),a=GetSlot(e,d),i=GetSlot(e,m),T=GetSlot(e,c),u=GetSlot(e,h);if(o){const{unit:e,increment:t,roundingMode:s}=o;({hour:n,minute:r,second:a,millisecond:i,microsecond:T,nanosecond:u}=RoundTime(n,r,a,i,T,u,t,e,s));}return `${ISODateTimePartString(n)}:${ISODateTimePartString(r)}${FormatSecondsStringPart(a,i,T,u,t)}`}class PlainTime{constructor(e=0,t=0,o=0,n=0,r=0,a=0){const i=ToIntegerThrowOnInfinity(e),u=ToIntegerThrowOnInfinity(t),p=ToIntegerThrowOnInfinity(o),f=ToIntegerThrowOnInfinity(n),y=ToIntegerThrowOnInfinity(r),S=ToIntegerThrowOnInfinity(a);RejectTime(i,u,p,f,y,S),CreateSlots(this),SetSlot(this,s,i),SetSlot(this,l,u),SetSlot(this,d,p),SetSlot(this,m,f),SetSlot(this,c,y),SetSlot(this,h,S),SetSlot(this,T,GetISO8601Calendar());}get calendar(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return GetSlot(this,T)}get hour(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return GetSlot(this,s)}get minute(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return GetSlot(this,l)}get second(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return GetSlot(this,d)}get millisecond(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return GetSlot(this,m)}get microsecond(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return GetSlot(this,c)}get nanosecond(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return GetSlot(this,h)}with(e,t){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid argument");RejectObjectWithCalendarOrTimeZone(e);const o=ToTemporalOverflow(GetOptionsObject(t)),n=ToPartialRecord(e,["hour","microsecond","millisecond","minute","nanosecond","second"]);if(!n)throw new TypeError("invalid time-like");const r=ToTemporalTimeRecord(this);let{hour:a,minute:i,second:s,millisecond:l,microsecond:d,nanosecond:m}=ht(r,n);return ({hour:a,minute:i,second:s,millisecond:l,microsecond:d,nanosecond:m}=RegulateTime(a,i,s,l,d,m,o)),new PlainTime(a,i,s,l,d,m)}add(e){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");const t=ToLimitedTemporalDuration(e),{hours:o,minutes:n,seconds:r,milliseconds:a,microseconds:i,nanoseconds:T}=t;let u=GetSlot(this,s),p=GetSlot(this,l),f=GetSlot(this,d),y=GetSlot(this,m),S=GetSlot(this,c),g=GetSlot(this,h);return ({hour:u,minute:p,second:f,millisecond:y,microsecond:S,nanosecond:g}=AddTime(u,p,f,y,S,g,o,n,r,a,i,T)),({hour:u,minute:p,second:f,millisecond:y,microsecond:S,nanosecond:g}=RegulateTime(u,p,f,y,S,g,"reject")),new PlainTime(u,p,f,y,S,g)}subtract(e){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");const t=ToLimitedTemporalDuration(e),{hours:o,minutes:n,seconds:r,milliseconds:a,microseconds:i,nanoseconds:T}=t;let u=GetSlot(this,s),p=GetSlot(this,l),f=GetSlot(this,d),y=GetSlot(this,m),S=GetSlot(this,c),g=GetSlot(this,h);return ({hour:u,minute:p,second:f,millisecond:y,microsecond:S,nanosecond:g}=AddTime(u,p,f,y,S,g,-o,-n,-r,-a,-i,-T)),({hour:u,minute:p,second:f,millisecond:y,microsecond:S,nanosecond:g}=RegulateTime(u,p,f,y,S,g,"reject")),new PlainTime(u,p,f,y,S,g)}until(e,t){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");const o=ToTemporalTime(e),n=GetOptionsObject(t),r=ToLargestTemporalUnit(n,"auto",Tt,"hour"),a=ToSmallestTemporalUnit(n,"nanosecond",Tt);ValidateTemporalUnitRange(r,a);const i=ToTemporalRoundingMode(n,"trunc"),T=ToTemporalRoundingIncrement(n,ut[a],!1);let{hours:u,minutes:p,seconds:f,milliseconds:y,microseconds:S,nanoseconds:g}=DifferenceTime(GetSlot(this,s),GetSlot(this,l),GetSlot(this,d),GetSlot(this,m),GetSlot(this,c),GetSlot(this,h),GetSlot(o,s),GetSlot(o,l),GetSlot(o,d),GetSlot(o,m),GetSlot(o,c),GetSlot(o,h));(({hours:u,minutes:p,seconds:f,milliseconds:y,microseconds:S,nanoseconds:g}=RoundDuration(0,0,0,0,u,p,f,y,S,g,T,a,i))),({hours:u,minutes:p,seconds:f,milliseconds:y,microseconds:S,nanoseconds:g}=BalanceDuration(0,u,p,f,y,S,g,r));return new(GetIntrinsic("%Temporal.Duration%"))(0,0,0,0,u,p,f,y,S,g)}since(e,t){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");const o=ToTemporalTime(e),n=GetOptionsObject(t),r=ToLargestTemporalUnit(n,"auto",Tt,"hour"),a=ToSmallestTemporalUnit(n,"nanosecond",Tt);ValidateTemporalUnitRange(r,a);const i=ToTemporalRoundingMode(n,"trunc"),T=ToTemporalRoundingIncrement(n,ut[a],!1);let{hours:u,minutes:p,seconds:f,milliseconds:y,microseconds:S,nanoseconds:g}=DifferenceTime(GetSlot(o,s),GetSlot(o,l),GetSlot(o,d),GetSlot(o,m),GetSlot(o,c),GetSlot(o,h),GetSlot(this,s),GetSlot(this,l),GetSlot(this,d),GetSlot(this,m),GetSlot(this,c),GetSlot(this,h));(({hours:u,minutes:p,seconds:f,milliseconds:y,microseconds:S,nanoseconds:g}=RoundDuration(0,0,0,0,-u,-p,-f,-y,-S,-g,T,a,NegateTemporalRoundingMode(i)))),u=-u,p=-p,f=-f,y=-y,S=-S,g=-g,({hours:u,minutes:p,seconds:f,milliseconds:y,microseconds:S,nanoseconds:g}=BalanceDuration(0,u,p,f,y,S,g,r));return new(GetIntrinsic("%Temporal.Duration%"))(0,0,0,0,u,p,f,y,S,g)}round(e){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");if(void 0===e)throw new TypeError("options parameter is required");const t="string"==typeof e?CreateOnePropObject("smallestUnit",e):GetOptionsObject(e),o=ToSmallestTemporalUnit(t,void 0,Tt);if(void 0===o)throw new RangeError("smallestUnit is required");const n=ToTemporalRoundingMode(t,"halfExpand"),r=ToTemporalRoundingIncrement(t,ut[o],!1);let a=GetSlot(this,s),i=GetSlot(this,l),T=GetSlot(this,d),u=GetSlot(this,m),p=GetSlot(this,c),f=GetSlot(this,h);return ({hour:a,minute:i,second:T,millisecond:u,microsecond:p,nanosecond:f}=RoundTime(a,i,T,u,p,f,r,o,n)),new PlainTime(a,i,T,u,p,f)}equals(e){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");const t=ToTemporalTime(e);for(const e of [s,l,d,m,c,h]){if(GetSlot(this,e)!==GetSlot(t,e))return !1}return !0}toString(e){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");const t=GetOptionsObject(e),{precision:o,unit:n,increment:r}=ToSecondsStringPrecision(t);return TemporalTimeToString(this,o,{unit:n,increment:r,roundingMode:ToTemporalRoundingMode(t,"trunc")})}toJSON(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return TemporalTimeToString(this,"auto")}toLocaleString(e,t){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return new at(e,t).format(this)}valueOf(){throw new TypeError("use compare() or equals() to compare Temporal.PlainTime")}toPlainDateTime(e){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");const t=ToTemporalDate(e),o=GetSlot(t,r$1),n=GetSlot(t,a),u=GetSlot(t,i$1),p=GetSlot(t,T);return CreateTemporalDateTime(o,n,u,GetSlot(this,s),GetSlot(this,l),GetSlot(this,d),GetSlot(this,m),GetSlot(this,c),GetSlot(this,h),p)}toZonedDateTime(e){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid argument");const t=e.plainDate;if(void 0===t)throw new TypeError("missing date property");const n=ToTemporalDate(t),u=e.timeZone;if(void 0===u)throw new TypeError("missing timeZone property");const p=ToTemporalTimeZone(u),f=GetSlot(n,r$1),y=GetSlot(n,a),S=GetSlot(n,i$1),g=GetSlot(n,T),w=GetSlot(this,s),I=GetSlot(this,l),G=GetSlot(this,d),D=GetSlot(this,m),v=GetSlot(this,c),O=GetSlot(this,h);return CreateTemporalZonedDateTime(GetSlot(BuiltinTimeZoneGetInstantFor(p,new(GetIntrinsic("%Temporal.PlainDateTime%"))(f,y,S,w,I,G,D,v,O,g),"compatible"),o),p,g)}getISOFields(){if(!IsTemporalTime(this))throw new TypeError("invalid receiver");return {calendar:GetSlot(this,T),isoHour:GetSlot(this,s),isoMicrosecond:GetSlot(this,c),isoMillisecond:GetSlot(this,m),isoMinute:GetSlot(this,l),isoNanosecond:GetSlot(this,h),isoSecond:GetSlot(this,d)}}static from(e,t){const o=ToTemporalOverflow(GetOptionsObject(t));return IsTemporalTime(e)?new PlainTime(GetSlot(e,s),GetSlot(e,l),GetSlot(e,d),GetSlot(e,m),GetSlot(e,c),GetSlot(e,h)):ToTemporalTime(e,o)}static compare(e,t){const o=ToTemporalTime(e),n=ToTemporalTime(t);for(const e of [s,l,d,m,c,h]){const t=GetSlot(o,e),r=GetSlot(n,e);if(t!==r)return ComparisonResult(t-r)}return 0}}MakeIntrinsicClass(PlainTime,"Temporal.PlainTime");class TimeZone{constructor(e){if(arguments.length<1)throw new RangeError("missing argument: identifier is required");const t=GetCanonicalTimeZoneIdentifier(e);CreateSlots(this),SetSlot(this,n,t);}get id(){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");return ToString(this)}getOffsetNanosecondsFor(e){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");const t=ToTemporalInstant(e),r=GetSlot(this,n);return TestTimeZoneOffsetString(r)?ParseTimeZoneOffsetString(r):GetIANATimeZoneOffsetNanoseconds(GetSlot(t,o),r)}getOffsetStringFor(e){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");return BuiltinTimeZoneGetOffsetStringFor(this,ToTemporalInstant(e))}getPlainDateTimeFor(e,t=GetISO8601Calendar()){return BuiltinTimeZoneGetPlainDateTimeFor(this,ToTemporalInstant(e),ToTemporalCalendar(t))}getInstantFor(e,t){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");return BuiltinTimeZoneGetInstantFor(this,ToTemporalDateTime(e),ToTemporalDisambiguation(GetOptionsObject(t)))}getPossibleInstantsFor(t){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");const o=ToTemporalDateTime(t),T=GetIntrinsic("%Temporal.Instant%"),u=GetSlot(this,n);if(TestTimeZoneOffsetString(u)){const t=GetEpochFromISOParts(GetSlot(o,r$1),GetSlot(o,a),GetSlot(o,i$1),GetSlot(o,s),GetSlot(o,l),GetSlot(o,d),GetSlot(o,m),GetSlot(o,c),GetSlot(o,h));if(null===t)throw new RangeError("DateTime outside of supported range");const n=ParseTimeZoneOffsetString(u);return [new T(jsbiUmd.subtract(t,jsbiUmd.BigInt(n)))]}return function GetIANATimeZoneEpochValue(t,o,n,r,a,i,s,l,d,m){const c=GetEpochFromISOParts(o,n,r,a,i,s,l,d,m);if(null===c)throw new RangeError("DateTime outside of supported range");let h=jsbiUmd.subtract(c,Ee);jsbiUmd.lessThan(h,be)&&(h=c);let T=jsbiUmd.add(c,Ee);jsbiUmd.greaterThan(T,Re)&&(T=c);const u=GetIANATimeZoneOffsetNanoseconds(h,t),p=GetIANATimeZoneOffsetNanoseconds(T,t);return (u===p?[u]:[u,p]).map((h=>{const T=jsbiUmd.subtract(c,jsbiUmd.BigInt(h)),u=GetIANATimeZoneDateTimeParts(T,t);if(o===u.year&&n===u.month&&r===u.day&&a===u.hour&&i===u.minute&&s===u.second&&l===u.millisecond&&d===u.microsecond&&m===u.nanosecond)return T})).filter((e=>void 0!==e))}(u,GetSlot(o,r$1),GetSlot(o,a),GetSlot(o,i$1),GetSlot(o,s),GetSlot(o,l),GetSlot(o,d),GetSlot(o,m),GetSlot(o,c),GetSlot(o,h)).map((e=>new T(e)))}getNextTransition(t){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");const r=ToTemporalInstant(t),a=GetSlot(this,n);if(TestTimeZoneOffsetString(a)||"UTC"===a)return null;let i=GetSlot(r,o);const s=GetIntrinsic("%Temporal.Instant%");return i=function GetIANATimeZoneNextTransition(t,o){const n=jsbiUmd.add(t,Fe),r=maxJSBI(afterLatestPossibleTzdbRuleChange(),n);let a=maxJSBI(Me,t);const i=GetIANATimeZoneOffsetNanoseconds(a,o);let s=a,l=i;for(;i===l&&jsbiUmd.lessThan(jsbiUmd.BigInt(a),r);)s=jsbiUmd.add(a,Ye),l=GetIANATimeZoneOffsetNanoseconds(s,o),i===l&&(a=s);return i===l?null:bisect((e=>GetIANATimeZoneOffsetNanoseconds(e,o)),a,s,i,l)}(i,a),null===i?null:new s(i)}getPreviousTransition(e){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");const t=ToTemporalInstant(e),r=GetSlot(this,n);if(TestTimeZoneOffsetString(r)||"UTC"===r)return null;let a=GetSlot(t,o);const i=GetIntrinsic("%Temporal.Instant%");return a=GetIANATimeZonePreviousTransition(a,r),null===a?null:new i(a)}toString(){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");return ToString(GetSlot(this,n))}toJSON(){if(!IsTemporalTimeZone(this))throw new TypeError("invalid receiver");return ToString(this)}static from(e){return ToTemporalTimeZone(e)}}MakeIntrinsicClass(TimeZone,"Temporal.TimeZone");const pt=Object.create,ft=["week","day","hour","minute","second","millisecond","microsecond","nanosecond"];class PlainYearMonth{constructor(e,t,o=GetISO8601Calendar(),n=1){const r=ToIntegerThrowOnInfinity(e),a=ToIntegerThrowOnInfinity(t),i=ToTemporalCalendar(o),s=ToIntegerThrowOnInfinity(n);if(arguments.length<2)throw new RangeError("missing argument: isoYear and isoMonth are required");CreateTemporalYearMonthSlots(this,r,a,i,s);}get year(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarYear(GetSlot(this,T),this)}get month(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarMonth(GetSlot(this,T),this)}get monthCode(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarMonthCode(GetSlot(this,T),this)}get calendar(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return GetSlot(this,T)}get era(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarEra(GetSlot(this,T),this)}get eraYear(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarEraYear(GetSlot(this,T),this)}get daysInMonth(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarDaysInMonth(GetSlot(this,T),this)}get daysInYear(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarDaysInYear(GetSlot(this,T),this)}get monthsInYear(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarMonthsInYear(GetSlot(this,T),this)}get inLeapYear(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return CalendarInLeapYear(GetSlot(this,T),this)}with(e,t){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid argument");RejectObjectWithCalendarOrTimeZone(e);const o=GetSlot(this,T),n=CalendarFields(o,["month","monthCode","year"]),r=ToPartialRecord(e,n);if(!r)throw new TypeError("invalid year-month-like");let a=ToTemporalYearMonthFields(this,n);a=CalendarMergeFields(o,a,r),a=ToTemporalYearMonthFields(a,n);return YearMonthFromFields(o,a,GetOptionsObject(t))}add(e,t){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");const o=ToLimitedTemporalDuration(e);let{years:n,months:r,weeks:a,days:i,hours:s,minutes:l,seconds:d,milliseconds:m,microseconds:c,nanoseconds:h}=o;({days:i}=BalanceDuration(i,s,l,d,m,c,h,"day"));const u=GetOptionsObject(t),p=GetSlot(this,T),f=CalendarFields(p,["monthCode","year"]),y=DateFromFields(p,{...ToTemporalYearMonthFields(this,f),day:DurationSign(n,r,a,i,0,0,0,0,0,0)<0?ToPositiveInteger(CalendarDaysInMonth(p,this)):1}),S={...u};return YearMonthFromFields(p,ToTemporalYearMonthFields(CalendarDateAdd(p,y,{...o,days:i},u),f),S)}subtract(e,t){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");let o=ToLimitedTemporalDuration(e);o={years:-o.years,months:-o.months,weeks:-o.weeks,days:-o.days,hours:-o.hours,minutes:-o.minutes,seconds:-o.seconds,milliseconds:-o.milliseconds,microseconds:-o.microseconds,nanoseconds:-o.nanoseconds};let{years:n,months:r,weeks:a,days:i,hours:s,minutes:l,seconds:d,milliseconds:m,microseconds:c,nanoseconds:h}=o;({days:i}=BalanceDuration(i,s,l,d,m,c,h,"day"));const u=GetOptionsObject(t),p=GetSlot(this,T),f=CalendarFields(p,["monthCode","year"]),y=DateFromFields(p,{...ToTemporalYearMonthFields(this,f),day:DurationSign(n,r,a,i,0,0,0,0,0,0)<0?ToPositiveInteger(CalendarDaysInMonth(p,this)):1}),S={...u};return YearMonthFromFields(p,ToTemporalYearMonthFields(CalendarDateAdd(p,y,{...o,days:i},u),f),S)}until(e,t){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");const o=ToTemporalYearMonth(e),n=GetSlot(this,T),r=GetSlot(o,T),a=ToString(n),i=ToString(r);if(a!==i)throw new RangeError(`cannot compute difference between months of ${a} and ${i} calendars`);const s=GetOptionsObject(t),l=ToSmallestTemporalUnit(s,"month",ft),d=ToLargestTemporalUnit(s,"auto",ft,"year");ValidateTemporalUnitRange(d,l);const m=ToTemporalRoundingMode(s,"trunc"),c=ToTemporalRoundingIncrement(s,void 0,!1),h=CalendarFields(n,["monthCode","year"]),u=ToTemporalYearMonthFields(o,h),p=ToTemporalYearMonthFields(this,h),f=DateFromFields(n,{...u,day:1}),y=DateFromFields(n,{...p,day:1}),S=CalendarDateUntil(n,y,f,{...s,largestUnit:d});if("month"===l&&1===c)return S;let{years:g,months:w}=S;({years:g,months:w}=RoundDuration(g,w,0,0,0,0,0,0,0,0,c,l,m,y));return new(GetIntrinsic("%Temporal.Duration%"))(g,w,0,0,0,0,0,0,0,0)}since(e,t){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");const o=ToTemporalYearMonth(e),n=GetSlot(this,T),r=GetSlot(o,T),a=ToString(n),i=ToString(r);if(a!==i)throw new RangeError(`cannot compute difference between months of ${a} and ${i} calendars`);const s=GetOptionsObject(t),l=ToSmallestTemporalUnit(s,"month",ft),d=ToLargestTemporalUnit(s,"auto",ft,"year");ValidateTemporalUnitRange(d,l);const m=ToTemporalRoundingMode(s,"trunc"),c=ToTemporalRoundingIncrement(s,void 0,!1),h=CalendarFields(n,["monthCode","year"]),u=ToTemporalYearMonthFields(o,h),p=ToTemporalYearMonthFields(this,h),f=DateFromFields(n,{...u,day:1}),y=DateFromFields(n,{...p,day:1}),S={...s,largestUnit:d};let{years:g,months:w}=CalendarDateUntil(n,y,f,S);const I=GetIntrinsic("%Temporal.Duration%");return "month"===l&&1===c||({years:g,months:w}=RoundDuration(g,w,0,0,0,0,0,0,0,0,c,l,NegateTemporalRoundingMode(m),y)),new I(-g,-w,0,0,0,0,0,0,0,0)}equals(e){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");const t=ToTemporalYearMonth(e);for(const e of [r$1,a,i$1]){if(GetSlot(this,e)!==GetSlot(t,e))return !1}return CalendarEquals(GetSlot(this,T),GetSlot(t,T))}toString(e){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return TemporalYearMonthToString(this,ToShowCalendarOption(GetOptionsObject(e)))}toJSON(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return TemporalYearMonthToString(this)}toLocaleString(e,t){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return new at(e,t).format(this)}valueOf(){throw new TypeError("use compare() or equals() to compare Temporal.PlainYearMonth")}toPlainDate(e){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("argument should be an object");const t=GetSlot(this,T),o=CalendarFields(t,["monthCode","year"]),n=ToTemporalYearMonthFields(this,o),r=CalendarFields(t,["day"]),a=[["day"]];r.forEach((e=>{a.some((([t])=>t===e))||a.push([e,void 0]);}));let i=CalendarMergeFields(t,n,PrepareTemporalFields(e,a));const s=[...new Set([...o,...r])],l=[];s.forEach((e=>{l.some((([t])=>t===e))||l.push([e,void 0]);})),i=PrepareTemporalFields(i,l);const d=pt(null);return d.overflow="reject",DateFromFields(t,i,d)}getISOFields(){if(!IsTemporalYearMonth(this))throw new TypeError("invalid receiver");return {calendar:GetSlot(this,T),isoDay:GetSlot(this,i$1),isoMonth:GetSlot(this,a),isoYear:GetSlot(this,r$1)}}static from(e,t){const o=GetOptionsObject(t);return IsTemporalYearMonth(e)?(ToTemporalOverflow(o),CreateTemporalYearMonth(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,T),GetSlot(e,i$1))):ToTemporalYearMonth(e,o)}static compare(e,t){const o=ToTemporalYearMonth(e),n=ToTemporalYearMonth(t);return CompareISODate(GetSlot(o,r$1),GetSlot(o,a),GetSlot(o,i$1),GetSlot(n,r$1),GetSlot(n,a),GetSlot(n,i$1))}}MakeIntrinsicClass(PlainYearMonth,"Temporal.PlainYearMonth");const yt=Array.prototype.push;class ZonedDateTime{constructor(e,t,o=GetISO8601Calendar()){if(arguments.length<1)throw new TypeError("missing argument: epochNanoseconds is required");CreateTemporalZonedDateTimeSlots(this,ToBigInt(e),ToTemporalTimeZone(t),ToTemporalCalendar(o));}get calendar(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,T)}get timeZone(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetSlot(this,p)}get year(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarYear(GetSlot(this,T),dateTime(this))}get month(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarMonth(GetSlot(this,T),dateTime(this))}get monthCode(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarMonthCode(GetSlot(this,T),dateTime(this))}get day(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarDay(GetSlot(this,T),dateTime(this))}get hour(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetSlot(dateTime(this),s)}get minute(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetSlot(dateTime(this),l)}get second(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetSlot(dateTime(this),d)}get millisecond(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetSlot(dateTime(this),m)}get microsecond(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetSlot(dateTime(this),c)}get nanosecond(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetSlot(dateTime(this),h)}get era(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarEra(GetSlot(this,T),dateTime(this))}get eraYear(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarEraYear(GetSlot(this,T),dateTime(this))}get epochSeconds(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=GetSlot(this,o);return jsbiUmd.toNumber(jsbiUmd.divide(t,Oe))}get epochMilliseconds(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=GetSlot(this,o);return jsbiUmd.toNumber(jsbiUmd.divide(t,ve))}get epochMicroseconds(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=GetSlot(this,o);return ToBigIntExternal(jsbiUmd.divide(t,De))}get epochNanoseconds(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return ToBigIntExternal(GetSlot(this,o))}get dayOfWeek(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarDayOfWeek(GetSlot(this,T),dateTime(this))}get dayOfYear(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarDayOfYear(GetSlot(this,T),dateTime(this))}get weekOfYear(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarWeekOfYear(GetSlot(this,T),dateTime(this))}get hoursInDay(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=dateTime(this),n=GetIntrinsic("%Temporal.PlainDateTime%"),s=GetSlot(t,r$1),l=GetSlot(t,a),d=GetSlot(t,i$1),m=new n(s,l,d,0,0,0,0,0,0),c=AddISODate(s,l,d,0,0,0,1,"reject"),h=new n(c.year,c.month,c.day,0,0,0,0,0,0),T=GetSlot(this,p),u=GetSlot(BuiltinTimeZoneGetInstantFor(T,m,"compatible"),o),f=GetSlot(BuiltinTimeZoneGetInstantFor(T,h,"compatible"),o);return jsbiUmd.toNumber(jsbiUmd.subtract(f,u))/36e11}get daysInWeek(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarDaysInWeek(GetSlot(this,T),dateTime(this))}get daysInMonth(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarDaysInMonth(GetSlot(this,T),dateTime(this))}get daysInYear(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarDaysInYear(GetSlot(this,T),dateTime(this))}get monthsInYear(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarMonthsInYear(GetSlot(this,T),dateTime(this))}get inLeapYear(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return CalendarInLeapYear(GetSlot(this,T),dateTime(this))}get offset(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return BuiltinTimeZoneGetOffsetStringFor(GetSlot(this,p),GetSlot(this,u))}get offsetNanoseconds(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return GetOffsetNanosecondsFor(GetSlot(this,p),GetSlot(this,u))}with(e,t){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");if(!IsObject(e))throw new TypeError("invalid zoned-date-time-like");RejectObjectWithCalendarOrTimeZone(e);const o=GetOptionsObject(t),n=ToTemporalDisambiguation(o),r=ToTemporalOffset(o,"prefer"),a=GetSlot(this,p),i=GetSlot(this,T),s=CalendarFields(i,["day","hour","microsecond","millisecond","minute","month","monthCode","nanosecond","second","year"]);yt.call(s,"offset");const l=ToPartialRecord(e,s);if(!l)throw new TypeError("invalid zoned-date-time-like");const d=[["day",void 0],["hour",0],["microsecond",0],["millisecond",0],["minute",0],["month",void 0],["monthCode",void 0],["nanosecond",0],["second",0],["year",void 0],["offset"],["timeZone"]];s.forEach((e=>{d.some((([t])=>t===e))||d.push([e,void 0]);}));let m=PrepareTemporalFields(this,d);m=CalendarMergeFields(i,m,l),m=PrepareTemporalFields(m,d);const{year:c,month:h,day:u,hour:f,minute:y,second:S,millisecond:g,microsecond:w,nanosecond:I}=InterpretTemporalDateTimeFields(i,m,o);return CreateTemporalZonedDateTime(InterpretISODateTimeOffset(c,h,u,f,y,S,g,w,I,"option",ParseTimeZoneOffsetString(m.offset),a,n,r,!1),GetSlot(this,p),i)}withPlainDate(e){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=ToTemporalDate(e),n=GetSlot(t,r$1),u=GetSlot(t,a),f=GetSlot(t,i$1);let y=GetSlot(t,T);const S=dateTime(this),g=GetSlot(S,s),w=GetSlot(S,l),I=GetSlot(S,d),G=GetSlot(S,m),D=GetSlot(S,c),v=GetSlot(S,h);y=ConsolidateCalendars(GetSlot(this,T),y);const O=GetSlot(this,p);return CreateTemporalZonedDateTime(GetSlot(BuiltinTimeZoneGetInstantFor(O,new(GetIntrinsic("%Temporal.PlainDateTime%"))(n,u,f,g,w,I,G,D,v,y),"compatible"),o),O,y)}withPlainTime(e){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=GetIntrinsic("%Temporal.PlainTime%"),n=null==e?new t:ToTemporalTime(e),u=dateTime(this),f=GetSlot(u,r$1),y=GetSlot(u,a),S=GetSlot(u,i$1),g=GetSlot(this,T),w=GetSlot(n,s),I=GetSlot(n,l),G=GetSlot(n,d),D=GetSlot(n,m),v=GetSlot(n,c),O=GetSlot(n,h),C=GetSlot(this,p);return CreateTemporalZonedDateTime(GetSlot(BuiltinTimeZoneGetInstantFor(C,new(GetIntrinsic("%Temporal.PlainDateTime%"))(f,y,S,w,I,G,D,v,O,g),"compatible"),o),C,g)}withTimeZone(e){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=ToTemporalTimeZone(e);return CreateTemporalZonedDateTime(GetSlot(this,o),t,GetSlot(this,T))}withCalendar(e){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=ToTemporalCalendar(e);return CreateTemporalZonedDateTime(GetSlot(this,o),GetSlot(this,p),t)}add(e,t){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const o=ToLimitedTemporalDuration(e),{years:n,months:r,weeks:a,days:i,hours:s,minutes:l,seconds:d,milliseconds:m,microseconds:c,nanoseconds:h}=o,f=GetOptionsObject(t),y=GetSlot(this,p),S=GetSlot(this,T);return CreateTemporalZonedDateTime(AddZonedDateTime(GetSlot(this,u),y,S,n,r,a,i,s,l,d,m,c,h,f),y,S)}subtract(e,t){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const o=ToLimitedTemporalDuration(e),{years:n,months:r,weeks:a,days:i,hours:s,minutes:l,seconds:d,milliseconds:m,microseconds:c,nanoseconds:h}=o,f=GetOptionsObject(t),y=GetSlot(this,p),S=GetSlot(this,T);return CreateTemporalZonedDateTime(AddZonedDateTime(GetSlot(this,u),y,S,-n,-r,-a,-i,-s,-l,-d,-m,-c,-h,f),y,S)}until(e,t){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const n=ToTemporalZonedDateTime(e),r=GetSlot(this,T),a=GetSlot(n,T),i=ToString(r),s=ToString(a);if(i!==s)throw new RangeError(`cannot compute difference between dates of ${i} and ${s} calendars`);const l=GetOptionsObject(t),d=ToSmallestTemporalUnit(l,"nanosecond"),m=ToLargestTemporalUnit(l,"auto",[],LargerOfTwoTemporalUnits("hour",d));ValidateTemporalUnitRange(m,d);const c=ToTemporalRoundingMode(l,"trunc"),h=ToTemporalDateTimeRoundingIncrement(l,d),u=GetSlot(this,o),f=GetSlot(n,o);let y,S,g,w,I,G,D,v,O,C;if("year"!==m&&"month"!==m&&"week"!==m&&"day"!==m)y=0,S=0,g=0,w=0,({seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=DifferenceInstant(u,f,h,d,c)),({hours:I,minutes:G,seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=BalanceDuration(0,0,0,D,v,O,C,m));else {const e=GetSlot(this,p);if(!TimeZoneEquals(e,GetSlot(n,p)))throw new RangeError("When calculating difference between time zones, largestUnit must be 'hours' or smaller because day lengths can vary between time zones due to DST or time zone offset changes.");const t={...l,largestUnit:m};(({years:y,months:S,weeks:g,days:w,hours:I,minutes:G,seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=DifferenceZonedDateTime(u,f,e,r,m,t))),({years:y,months:S,weeks:g,days:w,hours:I,minutes:G,seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=RoundDuration(y,S,g,w,I,G,D,v,O,C,h,d,c,this)),({years:y,months:S,weeks:g,days:w,hours:I,minutes:G,seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=AdjustRoundedDurationDays(y,S,g,w,I,G,D,v,O,C,h,d,c,this));}return new(GetIntrinsic("%Temporal.Duration%"))(y,S,g,w,I,G,D,v,O,C)}since(e,t){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const n=ToTemporalZonedDateTime(e),r=GetSlot(this,T),a=GetSlot(n,T),i=ToString(r),s=ToString(a);if(i!==s)throw new RangeError(`cannot compute difference between dates of ${i} and ${s} calendars`);const l=GetOptionsObject(t),d=ToSmallestTemporalUnit(l,"nanosecond"),m=ToLargestTemporalUnit(l,"auto",[],LargerOfTwoTemporalUnits("hour",d));ValidateTemporalUnitRange(m,d);let c=ToTemporalRoundingMode(l,"trunc");c=NegateTemporalRoundingMode(c);const h=ToTemporalDateTimeRoundingIncrement(l,d),u=GetSlot(this,o),f=GetSlot(n,o);let y,S,g,w,I,G,D,v,O,C;if("year"!==m&&"month"!==m&&"week"!==m&&"day"!==m)y=0,S=0,g=0,w=0,({seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=DifferenceInstant(u,f,h,d,c)),({hours:I,minutes:G,seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=BalanceDuration(0,0,0,D,v,O,C,m));else {const e=GetSlot(this,p);if(!TimeZoneEquals(e,GetSlot(n,p)))throw new RangeError("When calculating difference between time zones, largestUnit must be 'hours' or smaller because day lengths can vary between time zones due to DST or time zone offset changes.");const t={...l,largestUnit:m};(({years:y,months:S,weeks:g,days:w,hours:I,minutes:G,seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=DifferenceZonedDateTime(u,f,e,r,m,t))),({years:y,months:S,weeks:g,days:w,hours:I,minutes:G,seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=RoundDuration(y,S,g,w,I,G,D,v,O,C,h,d,c,this)),({years:y,months:S,weeks:g,days:w,hours:I,minutes:G,seconds:D,milliseconds:v,microseconds:O,nanoseconds:C}=AdjustRoundedDurationDays(y,S,g,w,I,G,D,v,O,C,h,d,c,this));}return new(GetIntrinsic("%Temporal.Duration%"))(-y,-S,-g,-w,-I,-G,-D,-v,-O,-C)}round(t){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");if(void 0===t)throw new TypeError("options parameter is required");const n="string"==typeof t?CreateOnePropObject("smallestUnit",t):GetOptionsObject(t),f=ToSmallestTemporalUnit(n,void 0,["year","month","week"]);if(void 0===f)throw new RangeError("smallestUnit is required");const y=ToTemporalRoundingMode(n,"halfExpand"),S=ToTemporalRoundingIncrement(n,{day:1,hour:24,minute:60,second:60,millisecond:1e3,microsecond:1e3,nanosecond:1e3}[f],!1),g=dateTime(this);let w=GetSlot(g,r$1),I=GetSlot(g,a),G=GetSlot(g,i$1),D=GetSlot(g,s),v=GetSlot(g,l),O=GetSlot(g,d),C=GetSlot(g,m),E=GetSlot(g,c),b=GetSlot(g,h);const R=GetIntrinsic("%Temporal.PlainDateTime%"),M=GetSlot(this,p),Z=GetSlot(this,T),F=BuiltinTimeZoneGetInstantFor(M,new R(GetSlot(g,r$1),GetSlot(g,a),GetSlot(g,i$1),0,0,0,0,0,0),"compatible"),Y=AddZonedDateTime(F,M,Z,0,0,0,1,0,0,0,0,0,0),P=jsbiUmd.subtract(Y,jsbiUmd.BigInt(GetSlot(F,o)));if(jsbiUmd.equal(P,we))throw new RangeError("cannot round a ZonedDateTime in a calendar with zero-length days");({year:w,month:I,day:G,hour:D,minute:v,second:O,millisecond:C,microsecond:E,nanosecond:b}=RoundISODateTime(w,I,G,D,v,O,C,E,b,S,f,y,jsbiUmd.toNumber(P)));return CreateTemporalZonedDateTime(InterpretISODateTimeOffset(w,I,G,D,v,O,C,E,b,"option",GetOffsetNanosecondsFor(M,GetSlot(this,u)),M,"compatible","prefer",!1),M,GetSlot(this,T))}equals(t){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const n=ToTemporalZonedDateTime(t),r=GetSlot(this,o),a=GetSlot(n,o);return !!jsbiUmd.equal(jsbiUmd.BigInt(r),jsbiUmd.BigInt(a))&&(!!TimeZoneEquals(GetSlot(this,p),GetSlot(n,p))&&CalendarEquals(GetSlot(this,T),GetSlot(n,T)))}toString(e){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const t=GetOptionsObject(e),{precision:o,unit:n,increment:r}=ToSecondsStringPrecision(t),a=ToTemporalRoundingMode(t,"trunc");return TemporalZonedDateTimeToString(this,o,ToShowCalendarOption(t),function ToShowTimeZoneNameOption(e){return GetOption(e,"timeZoneName",["auto","never"],"auto")}(t),function ToShowOffsetOption(e){return GetOption(e,"offset",["auto","never"],"auto")}(t),{unit:n,increment:r,roundingMode:a})}toLocaleString(e,t){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return new at(e,t).format(this)}toJSON(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return TemporalZonedDateTimeToString(this,"auto")}valueOf(){throw new TypeError("use compare() or equals() to compare Temporal.ZonedDateTime")}startOfDay(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const e=dateTime(this),t=GetIntrinsic("%Temporal.PlainDateTime%"),n=GetSlot(this,T),s=new t(GetSlot(e,r$1),GetSlot(e,a),GetSlot(e,i$1),0,0,0,0,0,0,n),l=GetSlot(this,p);return CreateTemporalZonedDateTime(GetSlot(BuiltinTimeZoneGetInstantFor(l,s,"compatible"),o),l,n)}toInstant(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return new(GetIntrinsic("%Temporal.Instant%"))(GetSlot(this,o))}toPlainDate(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return TemporalDateTimeToDate(dateTime(this))}toPlainTime(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return TemporalDateTimeToTime(dateTime(this))}toPlainDateTime(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");return dateTime(this)}toPlainYearMonth(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const e=GetSlot(this,T);return YearMonthFromFields(e,ToTemporalYearMonthFields(this,CalendarFields(e,["monthCode","year"])))}toPlainMonthDay(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const e=GetSlot(this,T);return MonthDayFromFields(e,ToTemporalMonthDayFields(this,CalendarFields(e,["day","monthCode"])))}getISOFields(){if(!IsTemporalZonedDateTime(this))throw new TypeError("invalid receiver");const e=dateTime(this),t=GetSlot(this,p);return {calendar:GetSlot(this,T),isoDay:GetSlot(e,i$1),isoHour:GetSlot(e,s),isoMicrosecond:GetSlot(e,c),isoMillisecond:GetSlot(e,m),isoMinute:GetSlot(e,l),isoMonth:GetSlot(e,a),isoNanosecond:GetSlot(e,h),isoSecond:GetSlot(e,d),isoYear:GetSlot(e,r$1),offset:BuiltinTimeZoneGetOffsetStringFor(t,GetSlot(this,u)),timeZone:t}}static from(e,t){const n=GetOptionsObject(t);return IsTemporalZonedDateTime(e)?(ToTemporalOverflow(n),ToTemporalDisambiguation(n),ToTemporalOffset(n,"reject"),CreateTemporalZonedDateTime(GetSlot(e,o),GetSlot(e,p),GetSlot(e,T))):ToTemporalZonedDateTime(e,n)}static compare(t,n){const r=ToTemporalZonedDateTime(t),a=ToTemporalZonedDateTime(n),i=GetSlot(r,o),s=GetSlot(a,o);return jsbiUmd.lessThan(jsbiUmd.BigInt(i),jsbiUmd.BigInt(s))?-1:jsbiUmd.greaterThan(jsbiUmd.BigInt(i),jsbiUmd.BigInt(s))?1:0}}function dateTime(e){return BuiltinTimeZoneGetPlainDateTimeFor(GetSlot(e,p),GetSlot(e,u),GetSlot(e,T))}MakeIntrinsicClass(ZonedDateTime,"Temporal.ZonedDateTime");var St=Object.freeze({__proto__:null,Instant,Calendar,PlainDate,PlainDateTime,Duration,PlainMonthDay,Now:ct,PlainTime,TimeZone,PlainYearMonth,ZonedDateTime});const gt=[Instant,Calendar,PlainDate,PlainDateTime,Duration,PlainMonthDay,PlainTime,TimeZone,PlainYearMonth,ZonedDateTime];for(const e of gt){const t=Object.getOwnPropertyDescriptor(e,"prototype");(t.configurable||t.enumerable||t.writable)&&(t.configurable=!1,t.enumerable=!1,t.writable=!1,Object.defineProperty(e,"prototype",t));}

    /* src\components\Date.svelte generated by Svelte v3.48.0 */
    const file$c = "src\\components\\Date.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let p0;
    	let t3;
    	let p1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = `${/*months*/ ctx[1][/*newDate*/ ctx[0].month]}  ${/*newDate*/ ctx[0].year}`;
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = `${/*newDate*/ ctx[0].day}`;
    			attr_dev(p0, "class", "mon svelte-h4aeu2");
    			add_location(p0, file$c, 19, 2, 368);
    			attr_dev(p1, "class", "day svelte-h4aeu2");
    			add_location(p1, file$c, 20, 2, 429);
    			attr_dev(div, "class", "date-part svelte-h4aeu2");
    			add_location(div, file$c, 18, 0, 341);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, p1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Date', slots, []);
    	let newDate = St.Now.zonedDateTimeISO();

    	const months = {
    		1: "Jan",
    		2: "Feb",
    		3: "March",
    		4: "April",
    		5: "May",
    		6: "June",
    		7: "July",
    		8: "Aug",
    		9: "Sep",
    		10: "Oct",
    		11: "Nov",
    		12: "Dec"
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Date> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Temporal: St, newDate, months });

    	$$self.$inject_state = $$props => {
    		if ('newDate' in $$props) $$invalidate(0, newDate = $$props.newDate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [newDate, months];
    }

    class Date$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Date",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const map_range = (value, low1, high1, low2, high2) => {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    };

    /* src\components\Meter.svelte generated by Svelte v3.48.0 */
    const file$b = "src\\components\\Meter.svelte";

    function create_fragment$c(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div1;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(/*rotate*/ ctx[0]);
    			t1 = text("/");
    			t2 = text(/*max*/ ctx[1]);
    			t3 = space();
    			div1 = element("div");
    			attr_dev(p, "class", "svelte-jqkp86");
    			add_location(p, file$b, 13, 29, 403);
    			attr_dev(div0, "class", "semi-circle svelte-jqkp86");
    			add_location(div0, file$b, 13, 4, 378);
    			attr_dev(div1, "class", "semi-circle--mask svelte-jqkp86");
    			set_style(div1, "transform", "rotate(" + /*rotate2*/ ctx[3] + "deg) translate3d(0, 0, 0)");
    			add_location(div1, file$b, 14, 4, 436);
    			attr_dev(div2, "class", "mask svelte-jqkp86");
    			add_location(div2, file$b, 12, 2, 354);
    			set_style(div3, "--theme-color", /*gaugeColor*/ ctx[2]);
    			attr_dev(div3, "class", "gauge--1 svelte-jqkp86");
    			add_location(div3, file$b, 11, 0, 292);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rotate*/ 1) set_data_dev(t0, /*rotate*/ ctx[0]);
    			if (dirty & /*max*/ 2) set_data_dev(t2, /*max*/ ctx[1]);

    			if (dirty & /*rotate2*/ 8) {
    				set_style(div1, "transform", "rotate(" + /*rotate2*/ ctx[3] + "deg) translate3d(0, 0, 0)");
    			}

    			if (dirty & /*gaugeColor*/ 4) {
    				set_style(div3, "--theme-color", /*gaugeColor*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Meter', slots, []);
    	let { rotate } = $$props;
    	let { max } = $$props;
    	let { gaugeColor } = $$props;
    	let rotate2 = map_range(rotate, 0, max, 0, 360);
    	const writable_props = ['rotate', 'max', 'gaugeColor'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Meter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('rotate' in $$props) $$invalidate(0, rotate = $$props.rotate);
    		if ('max' in $$props) $$invalidate(1, max = $$props.max);
    		if ('gaugeColor' in $$props) $$invalidate(2, gaugeColor = $$props.gaugeColor);
    	};

    	$$self.$capture_state = () => ({
    		map_range,
    		rotate,
    		max,
    		gaugeColor,
    		rotate2
    	});

    	$$self.$inject_state = $$props => {
    		if ('rotate' in $$props) $$invalidate(0, rotate = $$props.rotate);
    		if ('max' in $$props) $$invalidate(1, max = $$props.max);
    		if ('gaugeColor' in $$props) $$invalidate(2, gaugeColor = $$props.gaugeColor);
    		if ('rotate2' in $$props) $$invalidate(3, rotate2 = $$props.rotate2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*rotate, max*/ 3) {
    			{
    				$$invalidate(3, rotate2 = map_range(rotate, 0, max, 0, 180));
    			}
    		}
    	};

    	return [rotate, max, gaugeColor, rotate2];
    }

    class Meter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { rotate: 0, max: 1, gaugeColor: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Meter",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*rotate*/ ctx[0] === undefined && !('rotate' in props)) {
    			console.warn("<Meter> was created without expected prop 'rotate'");
    		}

    		if (/*max*/ ctx[1] === undefined && !('max' in props)) {
    			console.warn("<Meter> was created without expected prop 'max'");
    		}

    		if (/*gaugeColor*/ ctx[2] === undefined && !('gaugeColor' in props)) {
    			console.warn("<Meter> was created without expected prop 'gaugeColor'");
    		}
    	}

    	get rotate() {
    		throw new Error("<Meter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<Meter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Meter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Meter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gaugeColor() {
    		throw new Error("<Meter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gaugeColor(value) {
    		throw new Error("<Meter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Prompt.svelte generated by Svelte v3.48.0 */
    const file$a = "src\\components\\Prompt.svelte";

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Are you sure?";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Yes";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "No";
    			attr_dev(p, "class", "svelte-1wt71df");
    			add_location(p, file$a, 15, 4, 343);
    			attr_dev(button0, "class", "yes svelte-1wt71df");
    			add_location(button0, file$a, 16, 4, 369);
    			attr_dev(button1, "class", "no svelte-1wt71df");
    			add_location(button1, file$a, 22, 4, 490);
    			attr_dev(div0, "class", "yesNo svelte-1wt71df");
    			add_location(div0, file$a, 14, 2, 318);
    			attr_dev(div1, "class", "prompt svelte-1wt71df");
    			add_location(div1, file$a, 5, 0, 144);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div0, t1);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(div1, "click", /*click_handler_2*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Prompt', slots, []);
    	const dispatch = createEventDispatcher();
    	let trueit = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Prompt> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dispatch("answer", true);
    	};

    	const click_handler_1 = () => {
    		dispatch("closeit", true);
    	};

    	const click_handler_2 = ({ target }) => {
    		// @ts-ignore
    		if (target.classList.contains("prompt")) {
    			dispatch("closeit", true);
    		}
    	};

    	$$self.$capture_state = () => ({ createEventDispatcher, dispatch, trueit });

    	$$self.$inject_state = $$props => {
    		if ('trueit' in $$props) trueit = $$props.trueit;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [dispatch, click_handler, click_handler_1, click_handler_2];
    }

    class Prompt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prompt",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\components\Password.svelte generated by Svelte v3.48.0 */
    const file$9 = "src\\components\\Password.svelte";

    // (14:2) {#if showPrompt}
    function create_if_block$4(ctx) {
    	let prompt;
    	let current;
    	prompt = new Prompt({ $$inline: true });
    	prompt.$on("closeit", /*closeit_handler*/ ctx[3]);
    	prompt.$on("answer", /*answer_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(prompt.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(prompt, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prompt.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prompt.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(prompt, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(14:2) {#if showPrompt}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let p;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*showPrompt*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Danger Zone";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Change Password";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Delete Account";
    			t5 = space();
    			if (if_block) if_block.c();
    			attr_dev(p, "class", "svelte-mjzr86");
    			add_location(p, file$9, 6, 2, 149);
    			attr_dev(button0, "class", "svelte-mjzr86");
    			add_location(button0, file$9, 7, 2, 171);
    			attr_dev(button1, "class", "svelte-mjzr86");
    			add_location(button1, file$9, 8, 2, 207);
    			attr_dev(div, "class", "password svelte-mjzr86");
    			add_location(div, file$9, 5, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			append_dev(div, t5);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button1, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showPrompt*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showPrompt*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Password', slots, []);
    	let showPrompt = false;
    	let deleteAccount = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Password> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, showPrompt = true);
    	};

    	const closeit_handler = () => {
    		$$invalidate(0, showPrompt = false);
    	};

    	const answer_handler = () => {
    		$$invalidate(1, deleteAccount = true);
    		$$invalidate(0, showPrompt = false);
    	};

    	$$self.$capture_state = () => ({ Prompt, showPrompt, deleteAccount });

    	$$self.$inject_state = $$props => {
    		if ('showPrompt' in $$props) $$invalidate(0, showPrompt = $$props.showPrompt);
    		if ('deleteAccount' in $$props) $$invalidate(1, deleteAccount = $$props.deleteAccount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showPrompt, deleteAccount, click_handler, closeit_handler, answer_handler];
    }

    class Password extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Password",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\StatCard.svelte generated by Svelte v3.48.0 */

    const file$8 = "src\\components\\StatCard.svelte";

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t1_value = (/*title*/ ctx[2] ? /*title*/ ctx[2] : "N/A") + "";
    	let t1;
    	let t2;
    	let p;
    	let t3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*answer*/ ctx[0]);
    			if (!src_url_equal(img.src, img_src_value = /*icon*/ ctx[1] ? /*icon*/ ctx[1] : null)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Icon");
    			attr_dev(img, "class", "svelte-3zes9f");
    			add_location(img, file$8, 11, 5, 254);

    			set_style(div0, "background-color", /*iconBackground*/ ctx[3]
    			? /*iconBackground*/ ctx[3]
    			: 'rgba(79, 0, 153, 0.7)');

    			attr_dev(div0, "class", "svelte-3zes9f");
    			add_location(div0, file$8, 7, 2, 138);
    			attr_dev(h2, "class", "svelte-3zes9f");
    			add_location(h2, file$8, 13, 2, 311);
    			attr_dev(p, "class", "svelte-3zes9f");
    			add_location(p, file$8, 14, 2, 347);
    			attr_dev(div1, "class", "card svelte-3zes9f");
    			add_location(div1, file$8, 6, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*icon*/ 2 && !src_url_equal(img.src, img_src_value = /*icon*/ ctx[1] ? /*icon*/ ctx[1] : null)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*iconBackground*/ 8) {
    				set_style(div0, "background-color", /*iconBackground*/ ctx[3]
    				? /*iconBackground*/ ctx[3]
    				: 'rgba(79, 0, 153, 0.7)');
    			}

    			if (dirty & /*title*/ 4 && t1_value !== (t1_value = (/*title*/ ctx[2] ? /*title*/ ctx[2] : "N/A") + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*answer*/ 1) set_data_dev(t3, /*answer*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StatCard', slots, []);
    	let { answer } = $$props;
    	let { icon } = $$props;
    	let { title } = $$props;
    	let { iconBackground } = $$props;
    	const writable_props = ['answer', 'icon', 'title', 'iconBackground'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StatCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('answer' in $$props) $$invalidate(0, answer = $$props.answer);
    		if ('icon' in $$props) $$invalidate(1, icon = $$props.icon);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('iconBackground' in $$props) $$invalidate(3, iconBackground = $$props.iconBackground);
    	};

    	$$self.$capture_state = () => ({ answer, icon, title, iconBackground });

    	$$self.$inject_state = $$props => {
    		if ('answer' in $$props) $$invalidate(0, answer = $$props.answer);
    		if ('icon' in $$props) $$invalidate(1, icon = $$props.icon);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('iconBackground' in $$props) $$invalidate(3, iconBackground = $$props.iconBackground);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [answer, icon, title, iconBackground];
    }

    class StatCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			answer: 0,
    			icon: 1,
    			title: 2,
    			iconBackground: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatCard",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*answer*/ ctx[0] === undefined && !('answer' in props)) {
    			console.warn("<StatCard> was created without expected prop 'answer'");
    		}

    		if (/*icon*/ ctx[1] === undefined && !('icon' in props)) {
    			console.warn("<StatCard> was created without expected prop 'icon'");
    		}

    		if (/*title*/ ctx[2] === undefined && !('title' in props)) {
    			console.warn("<StatCard> was created without expected prop 'title'");
    		}

    		if (/*iconBackground*/ ctx[3] === undefined && !('iconBackground' in props)) {
    			console.warn("<StatCard> was created without expected prop 'iconBackground'");
    		}
    	}

    	get answer() {
    		throw new Error("<StatCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answer(value) {
    		throw new Error("<StatCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<StatCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<StatCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<StatCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<StatCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconBackground() {
    		throw new Error("<StatCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconBackground(value) {
    		throw new Error("<StatCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Stats.svelte generated by Svelte v3.48.0 */
    const file$7 = "src\\components\\Stats.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let p;
    	let t1;
    	let statcard0;
    	let t2;
    	let statcard1;
    	let t3;
    	let statcard2;
    	let t4;
    	let statcard3;
    	let current;

    	statcard0 = new StatCard({
    			props: {
    				answer: /*logins*/ ctx[0],
    				icon: "./shield-lock.svg",
    				title: "Attempted Logins",
    				iconBackground: "rgba(79, 0, 153, 0.7)"
    			},
    			$$inline: true
    		});

    	statcard1 = new StatCard({
    			props: {
    				answer: /*failed*/ ctx[1],
    				icon: "./shield-x.svg",
    				title: "Failed Attempts",
    				iconBackground: "rgba(0, 82, 195, 0.7)"
    			},
    			$$inline: true
    		});

    	statcard2 = new StatCard({
    			props: {
    				answer: /*subscriptions*/ ctx[3],
    				icon: "./shield-check.svg",
    				title: "Subscriptions",
    				iconBackground: "rgba(195, 0, 40, 0.7)"
    			},
    			$$inline: true
    		});

    	statcard3 = new StatCard({
    			props: {
    				answer: /*mostPopular*/ ctx[2],
    				icon: "./bar-chart-line.svg",
    				title: "Most Popular",
    				iconBackground: "rgba(116, 233, 36, 0.7)"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Statistics";
    			t1 = space();
    			create_component(statcard0.$$.fragment);
    			t2 = space();
    			create_component(statcard1.$$.fragment);
    			t3 = space();
    			create_component(statcard2.$$.fragment);
    			t4 = space();
    			create_component(statcard3.$$.fragment);
    			attr_dev(p, "class", "svelte-1txuqok");
    			add_location(p, file$7, 8, 2, 189);
    			attr_dev(div, "class", "stats svelte-1txuqok");
    			add_location(div, file$7, 7, 0, 166);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);
    			mount_component(statcard0, div, null);
    			append_dev(div, t2);
    			mount_component(statcard1, div, null);
    			append_dev(div, t3);
    			mount_component(statcard2, div, null);
    			append_dev(div, t4);
    			mount_component(statcard3, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const statcard0_changes = {};
    			if (dirty & /*logins*/ 1) statcard0_changes.answer = /*logins*/ ctx[0];
    			statcard0.$set(statcard0_changes);
    			const statcard1_changes = {};
    			if (dirty & /*failed*/ 2) statcard1_changes.answer = /*failed*/ ctx[1];
    			statcard1.$set(statcard1_changes);
    			const statcard2_changes = {};
    			if (dirty & /*subscriptions*/ 8) statcard2_changes.answer = /*subscriptions*/ ctx[3];
    			statcard2.$set(statcard2_changes);
    			const statcard3_changes = {};
    			if (dirty & /*mostPopular*/ 4) statcard3_changes.answer = /*mostPopular*/ ctx[2];
    			statcard3.$set(statcard3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statcard0.$$.fragment, local);
    			transition_in(statcard1.$$.fragment, local);
    			transition_in(statcard2.$$.fragment, local);
    			transition_in(statcard3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statcard0.$$.fragment, local);
    			transition_out(statcard1.$$.fragment, local);
    			transition_out(statcard2.$$.fragment, local);
    			transition_out(statcard3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(statcard0);
    			destroy_component(statcard1);
    			destroy_component(statcard2);
    			destroy_component(statcard3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Stats', slots, []);
    	let { logins } = $$props;
    	let { failed } = $$props;
    	let { mostPopular } = $$props;
    	let { subscriptions } = $$props;
    	const writable_props = ['logins', 'failed', 'mostPopular', 'subscriptions'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Stats> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('logins' in $$props) $$invalidate(0, logins = $$props.logins);
    		if ('failed' in $$props) $$invalidate(1, failed = $$props.failed);
    		if ('mostPopular' in $$props) $$invalidate(2, mostPopular = $$props.mostPopular);
    		if ('subscriptions' in $$props) $$invalidate(3, subscriptions = $$props.subscriptions);
    	};

    	$$self.$capture_state = () => ({
    		StatCard,
    		logins,
    		failed,
    		mostPopular,
    		subscriptions
    	});

    	$$self.$inject_state = $$props => {
    		if ('logins' in $$props) $$invalidate(0, logins = $$props.logins);
    		if ('failed' in $$props) $$invalidate(1, failed = $$props.failed);
    		if ('mostPopular' in $$props) $$invalidate(2, mostPopular = $$props.mostPopular);
    		if ('subscriptions' in $$props) $$invalidate(3, subscriptions = $$props.subscriptions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [logins, failed, mostPopular, subscriptions];
    }

    class Stats extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			logins: 0,
    			failed: 1,
    			mostPopular: 2,
    			subscriptions: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stats",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*logins*/ ctx[0] === undefined && !('logins' in props)) {
    			console.warn("<Stats> was created without expected prop 'logins'");
    		}

    		if (/*failed*/ ctx[1] === undefined && !('failed' in props)) {
    			console.warn("<Stats> was created without expected prop 'failed'");
    		}

    		if (/*mostPopular*/ ctx[2] === undefined && !('mostPopular' in props)) {
    			console.warn("<Stats> was created without expected prop 'mostPopular'");
    		}

    		if (/*subscriptions*/ ctx[3] === undefined && !('subscriptions' in props)) {
    			console.warn("<Stats> was created without expected prop 'subscriptions'");
    		}
    	}

    	get logins() {
    		throw new Error("<Stats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logins(value) {
    		throw new Error("<Stats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get failed() {
    		throw new Error("<Stats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set failed(value) {
    		throw new Error("<Stats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mostPopular() {
    		throw new Error("<Stats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mostPopular(value) {
    		throw new Error("<Stats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subscriptions() {
    		throw new Error("<Stats>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subscriptions(value) {
    		throw new Error("<Stats>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const r = document.querySelector(':root');

    const toggle = () => {
        const theme = window.localStorage.getItem("theme");
        if (theme === "dark" || !theme) {
            r.style.setProperty('--header-background-color', '#202020');
            r.style.setProperty('--header-color', 'rgb(179, 179, 179)');
            r.style.setProperty('--main-background-color', 'rgb(25, 32, 43)');
            r.style.setProperty('--main-color', '#dfdfdf');
            r.style.setProperty('--shadow', 'rgb(0 0 0) 0px 3px 8px');
            window.localStorage.setItem("theme", "light");
        } else {
            r.style.setProperty('--header-background-color', '#f3f3f3');
            r.style.setProperty('--header-color', '#000000');
            r.style.setProperty('--main-background-color', '#dfdfdf');
            r.style.setProperty('--main-color', '#000000');
            r.style.setProperty('--shadow', 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px');
            window.localStorage.setItem("theme", "dark");
        }
    };

    const toggleStartup = () => {
        if (window.localStorage.getItem("theme") === "light" | !window.localStorage.getItem("theme")) {
            r.style.setProperty('--header-background-color', '#202020');
            r.style.setProperty('--header-color', 'rgb(179, 179, 179)');
            r.style.setProperty('--main-background-color', 'rgb(25, 32, 43)');
            r.style.setProperty('--main-color', '#dfdfdf');
            r.style.setProperty('--shadow', 'rgb(0 0 0) 0px 3px 8px');
        } else {
            r.style.setProperty('--header-background-color', '#f3f3f3');
            r.style.setProperty('--header-color', '#000000');
            r.style.setProperty('--main-background-color', '#dfdfdf');
            r.style.setProperty('--main-color', '#000000');
            r.style.setProperty('--shadow', 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px');
        }
    };

    /* src\components\Website.svelte generated by Svelte v3.48.0 */

    const { console: console_1$2 } = globals;
    const file$6 = "src\\components\\Website.svelte";

    // (20:2) {#if blackListed}
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "BlackListed";
    			attr_dev(p, "class", "blacklist-p svelte-7bpd7q");
    			add_location(p, file$6, 20, 4, 462);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(20:2) {#if blackListed}",
    		ctx
    	});

    	return block;
    }

    // (40:2) {:else}
    function create_else_block$2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./shield-x.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Blacklist");
    			attr_dev(img, "class", "svelte-7bpd7q");
    			add_location(img, file$6, 46, 24, 1195);
    			attr_dev(button, "name", "Blacklist");
    			attr_dev(button, "title", "Blacklist");
    			attr_dev(button, "class", "svelte-7bpd7q");
    			add_location(button, file$6, 40, 4, 992);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(40:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:2) {#if blackListed}
    function create_if_block$3(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./shield-check.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Un-Blacklist");
    			attr_dev(img, "class", "svelte-7bpd7q");
    			add_location(img, file$6, 37, 6, 909);
    			attr_dev(button, "name", "Un-Blacklist");
    			attr_dev(button, "title", "Un-Blacklist");
    			attr_dev(button, "class", "svelte-7bpd7q");
    			add_location(button, file$6, 25, 4, 641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(25:2) {#if blackListed}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let t0;
    	let img;
    	let img_src_value;
    	let t1;
    	let p;
    	let t2_value = (/*name*/ ctx[0] ? /*name*/ ctx[0] : "N/A") + "";
    	let t2;
    	let t3;
    	let div_class_value;
    	let if_block0 = /*blackListed*/ ctx[3] && create_if_block_1$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*blackListed*/ ctx[3]) return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			img = element("img");
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			if_block1.c();
    			attr_dev(img, "class", "web-img svelte-7bpd7q");
    			if (!src_url_equal(img.src, img_src_value = "./window.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Website");
    			add_location(img, file$6, 22, 2, 513);
    			attr_dev(p, "class", "name svelte-7bpd7q");
    			add_location(p, file$6, 23, 2, 573);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*blackListed*/ ctx[3] ? "blackList" : "website") + " svelte-7bpd7q"));
    			add_location(div, file$6, 18, 0, 384);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, img);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(div, t3);
    			if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*blackListed*/ ctx[3]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*name*/ 1 && t2_value !== (t2_value = (/*name*/ ctx[0] ? /*name*/ ctx[0] : "N/A") + "")) set_data_dev(t2, t2_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			}

    			if (dirty & /*blackListed*/ 8 && div_class_value !== (div_class_value = "" + (null_to_empty(/*blackListed*/ ctx[3] ? "blackList" : "website") + " svelte-7bpd7q"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Website', slots, []);
    	const dispatch = createEventDispatcher();
    	let { name } = $$props;
    	let { socket } = $$props;
    	let { userData } = $$props;
    	let { blackList } = $$props;
    	let blackListed;

    	if (blackList === "false") {
    		blackListed = false;
    	} else {
    		blackListed = true;
    	}

    	socket.on("blacklist", data => {
    		console.log(data);
    	});

    	const writable_props = ['name', 'socket', 'userData', 'blackList'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Website> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(3, blackListed = false);

    		socket.emit("blacklist", {
    			name,
    			key: userData.data,
    			blackList: false
    		});
    	};

    	const click_handler_1 = () => {
    		$$invalidate(3, blackListed = true);

    		socket.emit("blacklist", {
    			name,
    			key: userData.data,
    			blackList: true
    		});
    	};

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('socket' in $$props) $$invalidate(1, socket = $$props.socket);
    		if ('userData' in $$props) $$invalidate(2, userData = $$props.userData);
    		if ('blackList' in $$props) $$invalidate(4, blackList = $$props.blackList);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		name,
    		socket,
    		userData,
    		blackList,
    		blackListed
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('socket' in $$props) $$invalidate(1, socket = $$props.socket);
    		if ('userData' in $$props) $$invalidate(2, userData = $$props.userData);
    		if ('blackList' in $$props) $$invalidate(4, blackList = $$props.blackList);
    		if ('blackListed' in $$props) $$invalidate(3, blackListed = $$props.blackListed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, socket, userData, blackListed, blackList, click_handler, click_handler_1];
    }

    class Website extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			name: 0,
    			socket: 1,
    			userData: 2,
    			blackList: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Website",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console_1$2.warn("<Website> was created without expected prop 'name'");
    		}

    		if (/*socket*/ ctx[1] === undefined && !('socket' in props)) {
    			console_1$2.warn("<Website> was created without expected prop 'socket'");
    		}

    		if (/*userData*/ ctx[2] === undefined && !('userData' in props)) {
    			console_1$2.warn("<Website> was created without expected prop 'userData'");
    		}

    		if (/*blackList*/ ctx[4] === undefined && !('blackList' in props)) {
    			console_1$2.warn("<Website> was created without expected prop 'blackList'");
    		}
    	}

    	get name() {
    		throw new Error("<Website>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Website>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socket() {
    		throw new Error("<Website>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socket(value) {
    		throw new Error("<Website>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userData() {
    		throw new Error("<Website>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userData(value) {
    		throw new Error("<Website>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get blackList() {
    		throw new Error("<Website>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set blackList(value) {
    		throw new Error("<Website>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Websites.svelte generated by Svelte v3.48.0 */
    const file$5 = "src\\components\\Websites.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (8:2) {#each sites as site}
    function create_each_block$1(ctx) {
    	let website;
    	let current;

    	website = new Website({
    			props: {
    				userData: /*userData*/ ctx[2],
    				socket: /*socket*/ ctx[1],
    				name: /*site*/ ctx[3].site,
    				blackList: /*site*/ ctx[3].blackList
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(website.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(website, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const website_changes = {};
    			if (dirty & /*userData*/ 4) website_changes.userData = /*userData*/ ctx[2];
    			if (dirty & /*socket*/ 2) website_changes.socket = /*socket*/ ctx[1];
    			if (dirty & /*sites*/ 1) website_changes.name = /*site*/ ctx[3].site;
    			if (dirty & /*sites*/ 1) website_changes.blackList = /*site*/ ctx[3].blackList;
    			website.$set(website_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(website.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(website.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(website, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(8:2) {#each sites as site}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let current;
    	let each_value = /*sites*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "websites svelte-awbw33");
    			add_location(div, file$5, 6, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*userData, socket, sites*/ 7) {
    				each_value = /*sites*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Websites', slots, []);
    	let { sites } = $$props;
    	let { socket } = $$props;
    	let { userData } = $$props;
    	const writable_props = ['sites', 'socket', 'userData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Websites> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('sites' in $$props) $$invalidate(0, sites = $$props.sites);
    		if ('socket' in $$props) $$invalidate(1, socket = $$props.socket);
    		if ('userData' in $$props) $$invalidate(2, userData = $$props.userData);
    	};

    	$$self.$capture_state = () => ({ Website, sites, socket, userData });

    	$$self.$inject_state = $$props => {
    		if ('sites' in $$props) $$invalidate(0, sites = $$props.sites);
    		if ('socket' in $$props) $$invalidate(1, socket = $$props.socket);
    		if ('userData' in $$props) $$invalidate(2, userData = $$props.userData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sites, socket, userData];
    }

    class Websites extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { sites: 0, socket: 1, userData: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Websites",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sites*/ ctx[0] === undefined && !('sites' in props)) {
    			console.warn("<Websites> was created without expected prop 'sites'");
    		}

    		if (/*socket*/ ctx[1] === undefined && !('socket' in props)) {
    			console.warn("<Websites> was created without expected prop 'socket'");
    		}

    		if (/*userData*/ ctx[2] === undefined && !('userData' in props)) {
    			console.warn("<Websites> was created without expected prop 'userData'");
    		}
    	}

    	get sites() {
    		throw new Error("<Websites>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sites(value) {
    		throw new Error("<Websites>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socket() {
    		throw new Error("<Websites>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socket(value) {
    		throw new Error("<Websites>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userData() {
    		throw new Error("<Websites>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userData(value) {
    		throw new Error("<Websites>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Add2fa.svelte generated by Svelte v3.48.0 */
    const file$4 = "src\\components\\Add2fa.svelte";

    function create_fragment$5(ctx) {
    	let div3;
    	let div2;
    	let p;
    	let span0;
    	let span1;
    	let t0;
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t1;
    	let input;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let button2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			p = element("p");
    			span0 = element("span");
    			span1 = element("span");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Begin";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Finish";
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "Cancel";
    			attr_dev(span0, "id", "success");
    			attr_dev(span0, "class", "svelte-7bekkk");
    			add_location(span0, file$4, 7, 22, 204);
    			attr_dev(span1, "id", "error");
    			attr_dev(span1, "class", "svelte-7bekkk");
    			add_location(span1, file$4, 7, 43, 225);
    			attr_dev(p, "class", "status svelte-7bekkk");
    			add_location(p, file$4, 7, 4, 186);
    			if (!src_url_equal(img.src, img_src_value = "/icons/cursor-text.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Person");
    			attr_dev(img, "class", "svelte-7bekkk");
    			add_location(img, file$4, 10, 9, 313);
    			attr_dev(div0, "class", "iconpart svelte-7bekkk");
    			add_location(div0, file$4, 9, 6, 281);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "2fa Method Name (e.g., Bobs Security Key).");
    			attr_dev(input, "id", "keyName");
    			attr_dev(input, "class", "svelte-7bekkk");
    			add_location(input, file$4, 12, 6, 384);
    			attr_dev(div1, "class", "label svelte-7bekkk");
    			add_location(div1, file$4, 8, 4, 254);
    			attr_dev(button0, "id", "btnBegin");
    			attr_dev(button0, "class", "svelte-7bekkk");
    			add_location(button0, file$4, 18, 4, 527);
    			attr_dev(button1, "id", "finishButton");
    			set_style(button1, "display", "none");
    			attr_dev(button1, "onclick", "relocate()");
    			attr_dev(button1, "class", "svelte-7bekkk");
    			add_location(button1, file$4, 19, 4, 569);
    			attr_dev(button2, "id", "cancelButton");
    			attr_dev(button2, "class", "svelte-7bekkk");
    			add_location(button2, file$4, 22, 4, 673);
    			attr_dev(div2, "class", "addOnBox svelte-7bekkk");
    			add_location(div2, file$4, 6, 2, 158);
    			attr_dev(div3, "class", "addOn svelte-7bekkk");
    			attr_dev(div3, "id", "addOnCover");
    			add_location(div3, file$4, 5, 0, 119);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, p);
    			append_dev(p, span0);
    			append_dev(p, span1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t1);
    			append_dev(div1, input);
    			append_dev(div2, t2);
    			append_dev(div2, button0);
    			append_dev(div2, t4);
    			append_dev(div2, button1);
    			append_dev(div2, t6);
    			append_dev(div2, button2);

    			if (!mounted) {
    				dispose = listen_dev(button2, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Add2fa', slots, []);
    	const dispatch = createEventDispatcher();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Add2fa> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		dispatch("cancel", true);
    	};

    	$$self.$capture_state = () => ({ createEventDispatcher, dispatch });
    	return [dispatch, click_handler];
    }

    class Add2fa extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Add2fa",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\Key.svelte generated by Svelte v3.48.0 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\components\\Key.svelte";

    // (9:0) {#if deleteIt}
    function create_if_block$2(ctx) {
    	let prompt;
    	let current;
    	prompt = new Prompt({ $$inline: true });
    	prompt.$on("closeit", /*closeit_handler*/ ctx[3]);
    	prompt.$on("answer", /*answer_handler*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(prompt.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(prompt, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prompt.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prompt.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(prompt, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(9:0) {#if deleteIt}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let t0;
    	let div;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let p;
    	let t2_value = (/*name*/ ctx[0] ? /*name*/ ctx[0] : "N/A") + "";
    	let t2;
    	let t3;
    	let button;
    	let img1;
    	let img1_src_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*deleteIt*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			img0 = element("img");
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			img1 = element("img");
    			attr_dev(img0, "class", "web-img svelte-1g9ne50");
    			if (!src_url_equal(img0.src, img0_src_value = "./key.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Key");
    			add_location(img0, file$3, 22, 2, 402);
    			attr_dev(p, "class", "name svelte-1g9ne50");
    			add_location(p, file$3, 23, 2, 455);
    			if (!src_url_equal(img1.src, img1_src_value = "./trash3.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Delete");
    			attr_dev(img1, "class", "svelte-1g9ne50");
    			add_location(img1, file$3, 29, 7, 602);
    			attr_dev(button, "name", "delete");
    			attr_dev(button, "title", "Delete");
    			attr_dev(button, "class", "svelte-1g9ne50");
    			add_location(button, file$3, 24, 2, 500);
    			attr_dev(div, "class", "website svelte-1g9ne50");
    			add_location(div, file$3, 21, 0, 377);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, img0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(div, t3);
    			append_dev(div, button);
    			append_dev(button, img1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*deleteIt*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*deleteIt*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*name*/ 1) && t2_value !== (t2_value = (/*name*/ ctx[0] ? /*name*/ ctx[0] : "N/A") + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Key', slots, []);
    	let { name } = $$props;
    	let { id } = $$props;
    	let deleteIt = false;
    	const writable_props = ['name', 'id'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Key> was created with unknown prop '${key}'`);
    	});

    	const closeit_handler = () => {
    		$$invalidate(2, deleteIt = false);
    	};

    	const answer_handler = ({ detail }) => {
    		if (detail) {
    			console.log(`delete ${name}. id: ${id}`);
    			$$invalidate(2, deleteIt = false);
    		}
    	};

    	const click_handler = () => {
    		$$invalidate(2, deleteIt = true);
    	};

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({ Prompt, name, id, deleteIt });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('id' in $$props) $$invalidate(1, id = $$props.id);
    		if ('deleteIt' in $$props) $$invalidate(2, deleteIt = $$props.deleteIt);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, id, deleteIt, closeit_handler, answer_handler, click_handler];
    }

    class Key extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { name: 0, id: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Key",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
    			console_1$1.warn("<Key> was created without expected prop 'name'");
    		}

    		if (/*id*/ ctx[1] === undefined && !('id' in props)) {
    			console_1$1.warn("<Key> was created without expected prop 'id'");
    		}
    	}

    	get name() {
    		throw new Error("<Key>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Key>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Key>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Key>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SecondFactor.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\components\\SecondFactor.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (25:2) {:else}
    function create_else_block$1(ctx) {
    	let t0;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*tfaKeys*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			button = element("button");
    			button.textContent = "Add another method";
    			attr_dev(button, "class", "enable svelte-1pxkw04");
    			add_location(button, file$2, 28, 4, 712);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tfaKeys*/ 1) {
    				each_value = /*tfaKeys*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t0.parentNode, t0);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(25:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:2) {#if !tfa2}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Enable 2fa";
    			attr_dev(button, "class", "enable svelte-1pxkw04");
    			add_location(button, file$2, 18, 4, 496);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(18:2) {#if !tfa2}",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#each tfaKeys as key}
    function create_each_block(ctx) {
    	let key;
    	let current;

    	key = new Key({
    			props: {
    				name: /*key*/ ctx[7].name,
    				id: /*key*/ ctx[7].id
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(key.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(key, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const key_changes = {};
    			if (dirty & /*tfaKeys*/ 1) key_changes.name = /*key*/ ctx[7].name;
    			if (dirty & /*tfaKeys*/ 1) key_changes.id = /*key*/ ctx[7].id;
    			key.$set(key_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(key, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(26:4) {#each tfaKeys as key}",
    		ctx
    	});

    	return block;
    }

    // (36:2) {#if showAdd}
    function create_if_block$1(ctx) {
    	let add2fa;
    	let current;
    	add2fa = new Add2fa({ $$inline: true });
    	add2fa.$on("cancel", /*cancel_handler*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(add2fa.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(add2fa, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(add2fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(add2fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(add2fa, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(36:2) {#if showAdd}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let p0;
    	let t1;
    	let div0;
    	let t3;
    	let p1;
    	let t5;
    	let current_block_type_index;
    	let if_block0;
    	let t6;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*tfa2*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*showAdd*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "?";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Add a second layer of protection with biometrics or security key.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "2 factor authentication";
    			t5 = space();
    			if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(p0, "class", "svelte-1pxkw04");
    			add_location(p0, file$2, 11, 4, 300);
    			attr_dev(div0, "class", "show svelte-1pxkw04");
    			add_location(div0, file$2, 12, 4, 314);
    			attr_dev(div1, "class", "extraInfo svelte-1pxkw04");
    			add_location(div1, file$2, 10, 2, 271);
    			attr_dev(p1, "class", "title svelte-1pxkw04");
    			add_location(p1, file$2, 16, 2, 431);
    			attr_dev(div2, "class", "twofactor svelte-1pxkw04");
    			add_location(div2, file$2, 9, 0, 244);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div2, t3);
    			append_dev(div2, p1);
    			append_dev(div2, t5);
    			if_blocks[current_block_type_index].m(div2, null);
    			append_dev(div2, t6);
    			if (if_block1) if_block1.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if_block0.p(ctx, dirty);

    			if (/*showAdd*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*showAdd*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SecondFactor', slots, []);
    	let { tfa } = $$props;
    	let { tfaKeys } = $$props;
    	let tfa2 = tfa === "1" ? true : false;
    	let showAdd = false;
    	const writable_props = ['tfa', 'tfaKeys'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SecondFactor> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(1, showAdd = true);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(1, showAdd = true);
    	};

    	const cancel_handler = () => {
    		$$invalidate(1, showAdd = false);
    	};

    	$$self.$$set = $$props => {
    		if ('tfa' in $$props) $$invalidate(3, tfa = $$props.tfa);
    		if ('tfaKeys' in $$props) $$invalidate(0, tfaKeys = $$props.tfaKeys);
    	};

    	$$self.$capture_state = () => ({ Add2fa, Key, tfa, tfaKeys, tfa2, showAdd });

    	$$self.$inject_state = $$props => {
    		if ('tfa' in $$props) $$invalidate(3, tfa = $$props.tfa);
    		if ('tfaKeys' in $$props) $$invalidate(0, tfaKeys = $$props.tfaKeys);
    		if ('tfa2' in $$props) $$invalidate(2, tfa2 = $$props.tfa2);
    		if ('showAdd' in $$props) $$invalidate(1, showAdd = $$props.showAdd);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tfaKeys, showAdd, tfa2, tfa, click_handler, click_handler_1, cancel_handler];
    }

    class SecondFactor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { tfa: 3, tfaKeys: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SecondFactor",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tfa*/ ctx[3] === undefined && !('tfa' in props)) {
    			console.warn("<SecondFactor> was created without expected prop 'tfa'");
    		}

    		if (/*tfaKeys*/ ctx[0] === undefined && !('tfaKeys' in props)) {
    			console.warn("<SecondFactor> was created without expected prop 'tfaKeys'");
    		}
    	}

    	get tfa() {
    		throw new Error("<SecondFactor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tfa(value) {
    		throw new Error("<SecondFactor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tfaKeys() {
    		throw new Error("<SecondFactor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tfaKeys(value) {
    		throw new Error("<SecondFactor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Dashboard.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\components\\Dashboard.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let header;
    	let h10;
    	let t1;
    	let ul;
    	let li0;
    	let button;
    	let t3;
    	let li1;
    	let a;
    	let t5;
    	let section7;
    	let section0;
    	let p0;
    	let t7;
    	let div1;
    	let p1;
    	let t9;
    	let div0;
    	let t11;
    	let meter;
    	let t12;
    	let section1;
    	let stats;
    	let t13;
    	let section2;
    	let h11;
    	let t14;
    	let t15_value = /*userData*/ ctx[0].userData.name + "";
    	let t15;
    	let t16;
    	let section3;
    	let websites;
    	let t17;
    	let section4;
    	let date;
    	let t18;
    	let section5;
    	let password;
    	let t19;
    	let section6;
    	let secondfactor;
    	let current;
    	let mounted;
    	let dispose;

    	meter = new Meter({
    			props: {
    				max: /*subscriptions*/ ctx[6],
    				rotate: /*secureSubs*/ ctx[2],
    				gaugeColor: "#430498"
    			},
    			$$inline: true
    		});

    	stats = new Stats({
    			props: {
    				mostPopular: /*popular*/ ctx[5],
    				failed: /*failed*/ ctx[4],
    				logins: /*logins*/ ctx[3],
    				subscriptions: /*subscriptions*/ ctx[6]
    			},
    			$$inline: true
    		});

    	websites = new Websites({
    			props: {
    				sites: /*userData*/ ctx[0].sites,
    				socket: /*socket*/ ctx[1],
    				userData: /*userData*/ ctx[0].userData
    			},
    			$$inline: true
    		});

    	date = new Date$1({ $$inline: true });
    	password = new Password({ $$inline: true });

    	secondfactor = new SecondFactor({
    			props: {
    				tfa: /*tfa*/ ctx[7],
    				tfaKeys: /*tfaKeys*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			h10 = element("h1");
    			h10.textContent = "Auth Dashboard";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			button = element("button");
    			button.textContent = "Toggle Theme";
    			t3 = space();
    			li1 = element("li");
    			a = element("a");
    			a.textContent = "Logout";
    			t5 = space();
    			section7 = element("section");
    			section0 = element("section");
    			p0 = element("p");
    			p0.textContent = "Secure Subscriptions";
    			t7 = space();
    			div1 = element("div");
    			p1 = element("p");
    			p1.textContent = "?";
    			t9 = space();
    			div0 = element("div");
    			div0.textContent = "Percentage of websites your subscribed to that encrypts their data.";
    			t11 = space();
    			create_component(meter.$$.fragment);
    			t12 = space();
    			section1 = element("section");
    			create_component(stats.$$.fragment);
    			t13 = space();
    			section2 = element("section");
    			h11 = element("h1");
    			t14 = text("Hi ");
    			t15 = text(t15_value);
    			t16 = space();
    			section3 = element("section");
    			create_component(websites.$$.fragment);
    			t17 = space();
    			section4 = element("section");
    			create_component(date.$$.fragment);
    			t18 = space();
    			section5 = element("section");
    			create_component(password.$$.fragment);
    			t19 = space();
    			section6 = element("section");
    			create_component(secondfactor.$$.fragment);
    			attr_dev(h10, "class", "svelte-1bja8ak");
    			add_location(h10, file$1, 23, 4, 770);
    			attr_dev(button, "class", "svelte-1bja8ak");
    			add_location(button, file$1, 25, 10, 815);
    			attr_dev(li0, "class", "svelte-1bja8ak");
    			add_location(li0, file$1, 25, 6, 811);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "svelte-1bja8ak");
    			add_location(a, file$1, 26, 10, 879);
    			attr_dev(li1, "class", "svelte-1bja8ak");
    			add_location(li1, file$1, 26, 6, 875);
    			add_location(ul, file$1, 24, 4, 799);
    			attr_dev(header, "class", "svelte-1bja8ak");
    			add_location(header, file$1, 22, 2, 756);
    			attr_dev(p0, "class", "meter-title svelte-1bja8ak");
    			add_location(p0, file$1, 31, 6, 1002);
    			attr_dev(p1, "class", "svelte-1bja8ak");
    			add_location(p1, file$1, 33, 8, 1090);
    			attr_dev(div0, "class", "show svelte-1bja8ak");
    			add_location(div0, file$1, 34, 8, 1108);
    			attr_dev(div1, "class", "extraInfo svelte-1bja8ak");
    			add_location(div1, file$1, 32, 6, 1057);
    			attr_dev(section0, "class", "meterPart tile svelte-1bja8ak");
    			add_location(section0, file$1, 30, 4, 962);
    			attr_dev(section1, "class", "stats tile svelte-1bja8ak");
    			add_location(section1, file$1, 40, 4, 1335);
    			attr_dev(h11, "class", "svelte-1bja8ak");
    			add_location(h11, file$1, 44, 6, 1494);
    			attr_dev(section2, "class", "chart tile svelte-1bja8ak");
    			add_location(section2, file$1, 43, 4, 1458);
    			attr_dev(section3, "class", "tile websites svelte-1bja8ak");
    			add_location(section3, file$1, 46, 4, 1552);
    			attr_dev(section4, "class", "date tile svelte-1bja8ak");
    			add_location(section4, file$1, 49, 4, 1686);
    			attr_dev(section5, "class", "password tile svelte-1bja8ak");
    			add_location(section5, file$1, 52, 4, 1751);
    			attr_dev(section6, "class", "ips tile svelte-1bja8ak");
    			add_location(section6, file$1, 55, 4, 1824);
    			attr_dev(section7, "class", "main svelte-1bja8ak");
    			add_location(section7, file$1, 29, 2, 934);
    			attr_dev(main, "class", "svelte-1bja8ak");
    			add_location(main, file$1, 21, 0, 746);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, h10);
    			append_dev(header, t1);
    			append_dev(header, ul);
    			append_dev(ul, li0);
    			append_dev(li0, button);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, a);
    			append_dev(main, t5);
    			append_dev(main, section7);
    			append_dev(section7, section0);
    			append_dev(section0, p0);
    			append_dev(section0, t7);
    			append_dev(section0, div1);
    			append_dev(div1, p1);
    			append_dev(div1, t9);
    			append_dev(div1, div0);
    			append_dev(section0, t11);
    			mount_component(meter, section0, null);
    			append_dev(section7, t12);
    			append_dev(section7, section1);
    			mount_component(stats, section1, null);
    			append_dev(section7, t13);
    			append_dev(section7, section2);
    			append_dev(section2, h11);
    			append_dev(h11, t14);
    			append_dev(h11, t15);
    			append_dev(section7, t16);
    			append_dev(section7, section3);
    			mount_component(websites, section3, null);
    			append_dev(section7, t17);
    			append_dev(section7, section4);
    			mount_component(date, section4, null);
    			append_dev(section7, t18);
    			append_dev(section7, section5);
    			mount_component(password, section5, null);
    			append_dev(section7, t19);
    			append_dev(section7, section6);
    			mount_component(secondfactor, section6, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", toggle, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*userData*/ 1) && t15_value !== (t15_value = /*userData*/ ctx[0].userData.name + "")) set_data_dev(t15, t15_value);
    			const websites_changes = {};
    			if (dirty & /*userData*/ 1) websites_changes.sites = /*userData*/ ctx[0].sites;
    			if (dirty & /*socket*/ 2) websites_changes.socket = /*socket*/ ctx[1];
    			if (dirty & /*userData*/ 1) websites_changes.userData = /*userData*/ ctx[0].userData;
    			websites.$set(websites_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(meter.$$.fragment, local);
    			transition_in(stats.$$.fragment, local);
    			transition_in(websites.$$.fragment, local);
    			transition_in(date.$$.fragment, local);
    			transition_in(password.$$.fragment, local);
    			transition_in(secondfactor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(meter.$$.fragment, local);
    			transition_out(stats.$$.fragment, local);
    			transition_out(websites.$$.fragment, local);
    			transition_out(date.$$.fragment, local);
    			transition_out(password.$$.fragment, local);
    			transition_out(secondfactor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(meter);
    			destroy_component(stats);
    			destroy_component(websites);
    			destroy_component(date);
    			destroy_component(password);
    			destroy_component(secondfactor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dashboard', slots, []);
    	let { userData } = $$props;
    	let { socket } = $$props;
    	let secureSubs = userData.https;
    	let logins = userData.attemptedLogins;
    	let failed = userData.failedLogins;
    	let popular = userData.mostPopular;
    	let subscriptions = userData.sites.length;
    	let tfa = userData.tfa;
    	let tfaKeys = userData.tfaKeys;
    	toggleStartup();
    	const writable_props = ['userData', 'socket'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('userData' in $$props) $$invalidate(0, userData = $$props.userData);
    		if ('socket' in $$props) $$invalidate(1, socket = $$props.socket);
    	};

    	$$self.$capture_state = () => ({
    		Date: Date$1,
    		Meter,
    		Password,
    		Stats,
    		toggle,
    		toggleStartup,
    		Websites,
    		SecondFactor,
    		userData,
    		socket,
    		secureSubs,
    		logins,
    		failed,
    		popular,
    		subscriptions,
    		tfa,
    		tfaKeys
    	});

    	$$self.$inject_state = $$props => {
    		if ('userData' in $$props) $$invalidate(0, userData = $$props.userData);
    		if ('socket' in $$props) $$invalidate(1, socket = $$props.socket);
    		if ('secureSubs' in $$props) $$invalidate(2, secureSubs = $$props.secureSubs);
    		if ('logins' in $$props) $$invalidate(3, logins = $$props.logins);
    		if ('failed' in $$props) $$invalidate(4, failed = $$props.failed);
    		if ('popular' in $$props) $$invalidate(5, popular = $$props.popular);
    		if ('subscriptions' in $$props) $$invalidate(6, subscriptions = $$props.subscriptions);
    		if ('tfa' in $$props) $$invalidate(7, tfa = $$props.tfa);
    		if ('tfaKeys' in $$props) $$invalidate(8, tfaKeys = $$props.tfaKeys);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		userData,
    		socket,
    		secureSubs,
    		logins,
    		failed,
    		popular,
    		subscriptions,
    		tfa,
    		tfaKeys
    	];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { userData: 0, socket: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*userData*/ ctx[0] === undefined && !('userData' in props)) {
    			console.warn("<Dashboard> was created without expected prop 'userData'");
    		}

    		if (/*socket*/ ctx[1] === undefined && !('socket' in props)) {
    			console.warn("<Dashboard> was created without expected prop 'socket'");
    		}
    	}

    	get userData() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userData(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socket() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socket(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const popupCenter = ({postServer, key, title, w, h, where}) => {
        // Fixes dual-screen position                             Most browsers      Firefox
        const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
        const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;
        const url = `${where}auth?website=${postServer}&key=${key}`;
        const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        const systemZoom = width / window.screen.availWidth;
        const left = (width - w) / 2 / systemZoom + dualScreenLeft;
        const top = (height - h) / 2 / systemZoom + dualScreenTop;
        const newWindow = window.open(url, title, 
          `
      scrollbars=yes,
      width=${w / systemZoom}, 
      height=${h / systemZoom}, 
      top=${top}, 
      left=${left}
      `
        );

        if (window.focus) newWindow.focus();
    };

    const loginIt = (location, key) => {
        popupCenter({postServer:`${location}myAuth`, key, title: 'Authenticate', w: 520, h: 570, where:location});
    };

    /* src\components\NotLogged.svelte generated by Svelte v3.48.0 */
    const file = "src\\components\\NotLogged.svelte";

    function create_fragment$1(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let button0;
    	let t1;
    	let p0;
    	let t3;
    	let header;
    	let a0;
    	let h10;
    	let t5;
    	let ul;
    	let li0;
    	let button1;
    	let t7;
    	let li1;
    	let button2;
    	let t9;
    	let li2;
    	let button3;
    	let t11;
    	let main;
    	let section2;
    	let section0;
    	let div2;
    	let button4;
    	let t12;
    	let span;
    	let img0;
    	let img0_src_value;
    	let br0;
    	let br1;
    	let t13;
    	let a1;
    	let t15;
    	let section1;
    	let img1;
    	let img1_src_value;
    	let t16;
    	let section5;
    	let section3;
    	let img2;
    	let img2_src_value;
    	let t17;
    	let section4;
    	let form;
    	let input;
    	let t18;
    	let textarea;
    	let t19;
    	let button5;
    	let t21;
    	let section8;
    	let section6;
    	let div3;
    	let h11;
    	let t23;
    	let p1;
    	let t25;
    	let section7;
    	let img3;
    	let img3_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "✖";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "N/A";
    			t3 = space();
    			header = element("header");
    			a0 = element("a");
    			h10 = element("h1");
    			h10.textContent = "Gruzservices";
    			t5 = space();
    			ul = element("ul");
    			li0 = element("li");
    			button1 = element("button");
    			button1.textContent = "Home";
    			t7 = space();
    			li1 = element("li");
    			button2 = element("button");
    			button2.textContent = "Contact";
    			t9 = space();
    			li2 = element("li");
    			button3 = element("button");
    			button3.textContent = "About";
    			t11 = space();
    			main = element("main");
    			section2 = element("section");
    			section0 = element("section");
    			div2 = element("div");
    			button4 = element("button");
    			t12 = text("Login with Gruzservices ");
    			span = element("span");
    			img0 = element("img");
    			br0 = element("br");
    			br1 = element("br");
    			t13 = space();
    			a1 = element("a");
    			a1.textContent = "Signup to Gruzservices";
    			t15 = space();
    			section1 = element("section");
    			img1 = element("img");
    			t16 = space();
    			section5 = element("section");
    			section3 = element("section");
    			img2 = element("img");
    			t17 = space();
    			section4 = element("section");
    			form = element("form");
    			input = element("input");
    			t18 = space();
    			textarea = element("textarea");
    			t19 = space();
    			button5 = element("button");
    			button5.textContent = "Send";
    			t21 = space();
    			section8 = element("section");
    			section6 = element("section");
    			div3 = element("div");
    			h11 = element("h1");
    			h11.textContent = "What is this?";
    			t23 = space();
    			p1 = element("p");
    			p1.textContent = "Every time I build a website, I have to do the authentication part\r\n            every single time. It is unnecessary and not convenient to the end\r\n            user. Now I only need to plug my server to this authentication\r\n            server and not worry about it again.";
    			t25 = space();
    			section7 = element("section");
    			img3 = element("img");
    			attr_dev(button0, "class", "svelte-1gxutbd");
    			add_location(button0, file, 50, 9, 1262);
    			attr_dev(div0, "class", "svelte-1gxutbd");
    			add_location(div0, file, 50, 4, 1257);
    			attr_dev(p0, "id", "message");
    			attr_dev(p0, "class", "svelte-1gxutbd");
    			add_location(p0, file, 51, 4, 1317);
    			attr_dev(div1, "class", "popup svelte-1gxutbd");
    			add_location(div1, file, 49, 2, 1213);
    			attr_dev(h10, "class", "svelte-1gxutbd");
    			add_location(h10, file, 54, 16, 1380);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-1gxutbd");
    			add_location(a0, file, 54, 4, 1368);
    			attr_dev(button1, "class", "svelte-1gxutbd");
    			add_location(button1, file, 57, 9, 1480);
    			attr_dev(li0, "id", "bhome");
    			attr_dev(li0, "class", "hide svelte-1gxutbd");
    			add_location(li0, file, 56, 6, 1423);
    			attr_dev(button2, "class", "svelte-1gxutbd");
    			add_location(button2, file, 59, 10, 1542);
    			attr_dev(li1, "class", "svelte-1gxutbd");
    			add_location(li1, file, 59, 6, 1538);
    			attr_dev(button3, "class", "svelte-1gxutbd");
    			add_location(button3, file, 60, 10, 1602);
    			attr_dev(li2, "class", "svelte-1gxutbd");
    			add_location(li2, file, 60, 6, 1598);
    			attr_dev(ul, "class", "svelte-1gxutbd");
    			add_location(ul, file, 55, 4, 1411);
    			attr_dev(header, "class", "svelte-1gxutbd");
    			add_location(header, file, 53, 2, 1354);
    			if (!src_url_equal(img0.src, img0_src_value = "/lock2.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lock");
    			add_location(img0, file, 69, 15, 1911);
    			attr_dev(span, "class", "svelte-1gxutbd");
    			add_location(span, file, 68, 37, 1889);
    			attr_dev(button4, "id", "sauth-login");
    			attr_dev(button4, "class", "svelte-1gxutbd");
    			add_location(button4, file, 67, 10, 1783);
    			add_location(br0, file, 71, 11, 1988);
    			add_location(br1, file, 71, 17, 1994);
    			attr_dev(a1, "id", "sauth-signup");
    			attr_dev(a1, "href", "/signup");
    			attr_dev(a1, "class", "svelte-1gxutbd");
    			add_location(a1, file, 72, 10, 2012);
    			attr_dev(div2, "class", "svelte-1gxutbd");
    			add_location(div2, file, 66, 8, 1766);
    			attr_dev(section0, "class", "sec1 svelte-1gxutbd");
    			add_location(section0, file, 65, 6, 1734);
    			if (!src_url_equal(img1.src, img1_src_value = "/lock.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Lock Icon");
    			attr_dev(img1, "class", "svelte-1gxutbd");
    			add_location(img1, file, 76, 8, 2148);
    			attr_dev(section1, "class", "sec2 svelte-1gxutbd");
    			add_location(section1, file, 75, 6, 2116);
    			attr_dev(section2, "class", "home svelte-1gxutbd");
    			add_location(section2, file, 64, 4, 1686);
    			if (!src_url_equal(img2.src, img2_src_value = "/contact.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Lock Icon");
    			attr_dev(img2, "class", "svelte-1gxutbd");
    			add_location(img2, file, 81, 8, 2318);
    			attr_dev(section3, "class", "sec2 svelte-1gxutbd");
    			add_location(section3, file, 80, 6, 2286);
    			attr_dev(input, "name", "email");
    			attr_dev(input, "type", "email");
    			attr_dev(input, "placeholder", "Email");
    			input.required = true;
    			attr_dev(input, "class", "svelte-1gxutbd");
    			add_location(input, file, 85, 10, 2495);
    			attr_dev(textarea, "name", "what");
    			attr_dev(textarea, "id", "textarea");
    			attr_dev(textarea, "cols", "30");
    			attr_dev(textarea, "rows", "10");
    			attr_dev(textarea, "placeholder", "What do you want to tell me?");
    			textarea.required = true;
    			attr_dev(textarea, "class", "svelte-1gxutbd");
    			add_location(textarea, file, 86, 10, 2571);
    			attr_dev(button5, "type", "submit");
    			attr_dev(button5, "class", "svelte-1gxutbd");
    			add_location(button5, file, 94, 10, 2782);
    			attr_dev(form, "id", "contactform");
    			attr_dev(form, "class", "contact svelte-1gxutbd");
    			add_location(form, file, 84, 8, 2418);
    			attr_dev(section4, "class", "sec1 svelte-1gxutbd");
    			add_location(section4, file, 83, 6, 2386);
    			attr_dev(section5, "class", "contact hide svelte-1gxutbd");
    			add_location(section5, file, 79, 4, 2227);
    			attr_dev(h11, "class", "svelte-1gxutbd");
    			add_location(h11, file, 101, 10, 2978);
    			attr_dev(p1, "class", "svelte-1gxutbd");
    			add_location(p1, file, 102, 10, 3012);
    			attr_dev(div3, "class", "svelte-1gxutbd");
    			add_location(div3, file, 100, 8, 2961);
    			attr_dev(section6, "class", "sec1 svelte-1gxutbd");
    			add_location(section6, file, 99, 6, 2929);
    			if (!src_url_equal(img3.src, img3_src_value = "/about.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Lock Icon");
    			attr_dev(img3, "class", "svelte-1gxutbd");
    			add_location(img3, file, 111, 8, 3391);
    			attr_dev(section7, "class", "sec2 svelte-1gxutbd");
    			add_location(section7, file, 110, 6, 3359);
    			attr_dev(section8, "class", "about hide svelte-1gxutbd");
    			add_location(section8, file, 98, 4, 2874);
    			attr_dev(main, "class", "svelte-1gxutbd");
    			add_location(main, file, 63, 2, 1674);
    			attr_dev(div4, "class", "main svelte-1gxutbd");
    			add_location(div4, file, 48, 0, 1191);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div1, t1);
    			append_dev(div1, p0);
    			/*div1_binding*/ ctx[12](div1);
    			append_dev(div4, t3);
    			append_dev(div4, header);
    			append_dev(header, a0);
    			append_dev(a0, h10);
    			append_dev(header, t5);
    			append_dev(header, ul);
    			append_dev(ul, li0);
    			append_dev(li0, button1);
    			/*li0_binding*/ ctx[13](li0);
    			append_dev(ul, t7);
    			append_dev(ul, li1);
    			append_dev(li1, button2);
    			append_dev(ul, t9);
    			append_dev(ul, li2);
    			append_dev(li2, button3);
    			append_dev(div4, t11);
    			append_dev(div4, main);
    			append_dev(main, section2);
    			append_dev(section2, section0);
    			append_dev(section0, div2);
    			append_dev(div2, button4);
    			append_dev(button4, t12);
    			append_dev(button4, span);
    			append_dev(span, img0);
    			append_dev(div2, br0);
    			append_dev(div2, br1);
    			append_dev(div2, t13);
    			append_dev(div2, a1);
    			append_dev(section2, t15);
    			append_dev(section2, section1);
    			append_dev(section1, img1);
    			/*section2_binding*/ ctx[15](section2);
    			append_dev(main, t16);
    			append_dev(main, section5);
    			append_dev(section5, section3);
    			append_dev(section3, img2);
    			append_dev(section5, t17);
    			append_dev(section5, section4);
    			append_dev(section4, form);
    			append_dev(form, input);
    			append_dev(form, t18);
    			append_dev(form, textarea);
    			append_dev(form, t19);
    			append_dev(form, button5);
    			/*section5_binding*/ ctx[16](section5);
    			append_dev(main, t21);
    			append_dev(main, section8);
    			append_dev(section8, section6);
    			append_dev(section6, div3);
    			append_dev(div3, h11);
    			append_dev(div3, t23);
    			append_dev(div3, p1);
    			append_dev(section8, t25);
    			append_dev(section8, section7);
    			append_dev(section7, img3);
    			/*section8_binding*/ ctx[17](section8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*closeN*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*home*/ ctx[9], false, false, false),
    					listen_dev(button2, "click", /*contact*/ ctx[7], false, false, false),
    					listen_dev(button3, "click", /*about*/ ctx[8], false, false, false),
    					listen_dev(button4, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(form, "submit", /*submitContact*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			/*div1_binding*/ ctx[12](null);
    			/*li0_binding*/ ctx[13](null);
    			/*section2_binding*/ ctx[15](null);
    			/*section5_binding*/ ctx[16](null);
    			/*section8_binding*/ ctx[17](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NotLogged', slots, []);
    	let { socket } = $$props;
    	let { PROXY } = $$props;
    	let popup1;
    	let home1;
    	let contact1;
    	let about1;
    	let bhome1;

    	const contact = () => {
    		home1.classList.add("hide");
    		contact1.classList.remove("hide");
    		about1.classList.add("hide");
    		bhome1.classList.remove("hide");
    	};

    	const about = () => {
    		home1.classList.add("hide");
    		about1.classList.remove("hide");
    		contact1.classList.add("hide");
    		bhome1.classList.remove("hide");
    	};

    	const home = () => {
    		about1.classList.add("hide");
    		home1.classList.remove("hide");
    		contact1.classList.add("hide");
    		bhome1.classList.add("hide");
    	};

    	const submitContact = e => {
    		e.preventDefault();

    		fetch(`${PROXY}contact`, {
    			method: "POST",
    			body: JSON.stringify({
    				email: e.target[0].value,
    				what: e.target[1].value
    			})
    		});
    	};

    	const closeN = () => {
    		popup1.classList.remove("movedown");
    		popup1.classList.add("moveup");
    		return;
    	};

    	const openN = () => {
    		popup1.classList.remove("moveup");
    		popup1.classList.add("movedown");
    		return;
    	};

    	const writable_props = ['socket', 'PROXY'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NotLogged> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			popup1 = $$value;
    			$$invalidate(2, popup1);
    		});
    	}

    	function li0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			bhome1 = $$value;
    			$$invalidate(6, bhome1);
    		});
    	}

    	const click_handler = () => loginIt(PROXY, socket.id);

    	function section2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			home1 = $$value;
    			$$invalidate(3, home1);
    		});
    	}

    	function section5_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			contact1 = $$value;
    			$$invalidate(4, contact1);
    		});
    	}

    	function section8_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			about1 = $$value;
    			$$invalidate(5, about1);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('socket' in $$props) $$invalidate(0, socket = $$props.socket);
    		if ('PROXY' in $$props) $$invalidate(1, PROXY = $$props.PROXY);
    	};

    	$$self.$capture_state = () => ({
    		loginIt,
    		socket,
    		PROXY,
    		popup1,
    		home1,
    		contact1,
    		about1,
    		bhome1,
    		contact,
    		about,
    		home,
    		submitContact,
    		closeN,
    		openN
    	});

    	$$self.$inject_state = $$props => {
    		if ('socket' in $$props) $$invalidate(0, socket = $$props.socket);
    		if ('PROXY' in $$props) $$invalidate(1, PROXY = $$props.PROXY);
    		if ('popup1' in $$props) $$invalidate(2, popup1 = $$props.popup1);
    		if ('home1' in $$props) $$invalidate(3, home1 = $$props.home1);
    		if ('contact1' in $$props) $$invalidate(4, contact1 = $$props.contact1);
    		if ('about1' in $$props) $$invalidate(5, about1 = $$props.about1);
    		if ('bhome1' in $$props) $$invalidate(6, bhome1 = $$props.bhome1);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		socket,
    		PROXY,
    		popup1,
    		home1,
    		contact1,
    		about1,
    		bhome1,
    		contact,
    		about,
    		home,
    		submitContact,
    		closeN,
    		div1_binding,
    		li0_binding,
    		click_handler,
    		section2_binding,
    		section5_binding,
    		section8_binding
    	];
    }

    class NotLogged extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { socket: 0, PROXY: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotLogged",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*socket*/ ctx[0] === undefined && !('socket' in props)) {
    			console.warn("<NotLogged> was created without expected prop 'socket'");
    		}

    		if (/*PROXY*/ ctx[1] === undefined && !('PROXY' in props)) {
    			console.warn("<NotLogged> was created without expected prop 'PROXY'");
    		}
    	}

    	get socket() {
    		throw new Error("<NotLogged>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socket(value) {
    		throw new Error("<NotLogged>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get PROXY() {
    		throw new Error("<NotLogged>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set PROXY(value) {
    		throw new Error("<NotLogged>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const PACKET_TYPES = Object.create(null); // no Map = no polyfill
    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";
    const PACKET_TYPES_REVERSE = Object.create(null);
    Object.keys(PACKET_TYPES).forEach(key => {
        PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });
    const ERROR_PACKET = { type: "error", data: "parser error" };

    const withNativeBlob$1 = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
    const withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
    // ArrayBuffer.isView method is not defined in IE10
    const isView$1 = obj => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj && obj.buffer instanceof ArrayBuffer;
    };
    const encodePacket = ({ type, data }, supportsBinary, callback) => {
        if (withNativeBlob$1 && data instanceof Blob) {
            if (supportsBinary) {
                return callback(data);
            }
            else {
                return encodeBlobAsBase64(data, callback);
            }
        }
        else if (withNativeArrayBuffer$2 &&
            (data instanceof ArrayBuffer || isView$1(data))) {
            if (supportsBinary) {
                return callback(data);
            }
            else {
                return encodeBlobAsBase64(new Blob([data]), callback);
            }
        }
        // plain string
        return callback(PACKET_TYPES[type] + (data || ""));
    };
    const encodeBlobAsBase64 = (data, callback) => {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            const content = fileReader.result.split(",")[1];
            callback("b" + content);
        };
        return fileReader.readAsDataURL(data);
    };

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    // Use a lookup table to find the index.
    const lookup$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
        lookup$1[chars.charCodeAt(i)] = i;
    }
    const decode$1 = (base64) => {
        let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
        if (base64[base64.length - 1] === '=') {
            bufferLength--;
            if (base64[base64.length - 2] === '=') {
                bufferLength--;
            }
        }
        const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
        for (i = 0; i < len; i += 4) {
            encoded1 = lookup$1[base64.charCodeAt(i)];
            encoded2 = lookup$1[base64.charCodeAt(i + 1)];
            encoded3 = lookup$1[base64.charCodeAt(i + 2)];
            encoded4 = lookup$1[base64.charCodeAt(i + 3)];
            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }
        return arraybuffer;
    };

    const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
    const decodePacket = (encodedPacket, binaryType) => {
        if (typeof encodedPacket !== "string") {
            return {
                type: "message",
                data: mapBinary(encodedPacket, binaryType)
            };
        }
        const type = encodedPacket.charAt(0);
        if (type === "b") {
            return {
                type: "message",
                data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
            };
        }
        const packetType = PACKET_TYPES_REVERSE[type];
        if (!packetType) {
            return ERROR_PACKET;
        }
        return encodedPacket.length > 1
            ? {
                type: PACKET_TYPES_REVERSE[type],
                data: encodedPacket.substring(1)
            }
            : {
                type: PACKET_TYPES_REVERSE[type]
            };
    };
    const decodeBase64Packet = (data, binaryType) => {
        if (withNativeArrayBuffer$1) {
            const decoded = decode$1(data);
            return mapBinary(decoded, binaryType);
        }
        else {
            return { base64: true, data }; // fallback for old browsers
        }
    };
    const mapBinary = (data, binaryType) => {
        switch (binaryType) {
            case "blob":
                return data instanceof ArrayBuffer ? new Blob([data]) : data;
            case "arraybuffer":
            default:
                return data; // assuming the data is already an ArrayBuffer
        }
    };

    const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
    const encodePayload = (packets, callback) => {
        // some packets may be added to the array while encoding, so the initial length must be saved
        const length = packets.length;
        const encodedPackets = new Array(length);
        let count = 0;
        packets.forEach((packet, i) => {
            // force base64 encoding for binary packets
            encodePacket(packet, false, encodedPacket => {
                encodedPackets[i] = encodedPacket;
                if (++count === length) {
                    callback(encodedPackets.join(SEPARATOR));
                }
            });
        });
    };
    const decodePayload = (encodedPayload, binaryType) => {
        const encodedPackets = encodedPayload.split(SEPARATOR);
        const packets = [];
        for (let i = 0; i < encodedPackets.length; i++) {
            const decodedPacket = decodePacket(encodedPackets[i], binaryType);
            packets.push(decodedPacket);
            if (decodedPacket.type === "error") {
                break;
            }
        }
        return packets;
    };
    const protocol$1 = 4;

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }

    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    // alias used for reserved events (protected method)
    Emitter.prototype.emitReserved = Emitter.prototype.emit;

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };

    const globalThisShim = (() => {
        if (typeof self !== "undefined") {
            return self;
        }
        else if (typeof window !== "undefined") {
            return window;
        }
        else {
            return Function("return this")();
        }
    })();

    function pick(obj, ...attr) {
        return attr.reduce((acc, k) => {
            if (obj.hasOwnProperty(k)) {
                acc[k] = obj[k];
            }
            return acc;
        }, {});
    }
    // Keep a reference to the real timeout functions so they can be used when overridden
    const NATIVE_SET_TIMEOUT = setTimeout;
    const NATIVE_CLEAR_TIMEOUT = clearTimeout;
    function installTimerFunctions(obj, opts) {
        if (opts.useNativeTimers) {
            obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
            obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
        }
        else {
            obj.setTimeoutFn = setTimeout.bind(globalThisShim);
            obj.clearTimeoutFn = clearTimeout.bind(globalThisShim);
        }
    }
    // base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
    const BASE64_OVERHEAD = 1.33;
    // we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
    function byteLength(obj) {
        if (typeof obj === "string") {
            return utf8Length(obj);
        }
        // arraybuffer or blob
        return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
    }
    function utf8Length(str) {
        let c = 0, length = 0;
        for (let i = 0, l = str.length; i < l; i++) {
            c = str.charCodeAt(i);
            if (c < 0x80) {
                length += 1;
            }
            else if (c < 0x800) {
                length += 2;
            }
            else if (c < 0xd800 || c >= 0xe000) {
                length += 3;
            }
            else {
                i++;
                length += 4;
            }
        }
        return length;
    }

    class TransportError extends Error {
        constructor(reason, description, context) {
            super(reason);
            this.description = description;
            this.context = context;
            this.type = "TransportError";
        }
    }
    class Transport extends Emitter {
        /**
         * Transport abstract constructor.
         *
         * @param {Object} options.
         * @api private
         */
        constructor(opts) {
            super();
            this.writable = false;
            installTimerFunctions(this, opts);
            this.opts = opts;
            this.query = opts.query;
            this.readyState = "";
            this.socket = opts.socket;
        }
        /**
         * Emits an error.
         *
         * @param {String} reason
         * @param description
         * @param context - the error context
         * @return {Transport} for chaining
         * @api protected
         */
        onError(reason, description, context) {
            super.emitReserved("error", new TransportError(reason, description, context));
            return this;
        }
        /**
         * Opens the transport.
         *
         * @api public
         */
        open() {
            if ("closed" === this.readyState || "" === this.readyState) {
                this.readyState = "opening";
                this.doOpen();
            }
            return this;
        }
        /**
         * Closes the transport.
         *
         * @api public
         */
        close() {
            if ("opening" === this.readyState || "open" === this.readyState) {
                this.doClose();
                this.onClose();
            }
            return this;
        }
        /**
         * Sends multiple packets.
         *
         * @param {Array} packets
         * @api public
         */
        send(packets) {
            if ("open" === this.readyState) {
                this.write(packets);
            }
        }
        /**
         * Called upon open
         *
         * @api protected
         */
        onOpen() {
            this.readyState = "open";
            this.writable = true;
            super.emitReserved("open");
        }
        /**
         * Called with data.
         *
         * @param {String} data
         * @api protected
         */
        onData(data) {
            const packet = decodePacket(data, this.socket.binaryType);
            this.onPacket(packet);
        }
        /**
         * Called with a decoded packet.
         *
         * @api protected
         */
        onPacket(packet) {
            super.emitReserved("packet", packet);
        }
        /**
         * Called upon close.
         *
         * @api protected
         */
        onClose(details) {
            this.readyState = "closed";
            super.emitReserved("close", details);
        }
    }

    // imported from https://github.com/unshiftio/yeast
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''), length = 64, map = {};
    let seed = 0, i = 0, prev;
    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
    function encode$1(num) {
        let encoded = '';
        do {
            encoded = alphabet[num % length] + encoded;
            num = Math.floor(num / length);
        } while (num > 0);
        return encoded;
    }
    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
    function yeast() {
        const now = encode$1(+new Date());
        if (now !== prev)
            return seed = 0, prev = now;
        return now + '.' + encode$1(seed++);
    }
    //
    // Map each character to its index.
    //
    for (; i < length; i++)
        map[alphabet[i]] = i;

    // imported from https://github.com/galkn/querystring
    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */
    function encode(obj) {
        let str = '';
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (str.length)
                    str += '&';
                str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
            }
        }
        return str;
    }
    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */
    function decode(qs) {
        let qry = {};
        let pairs = qs.split('&');
        for (let i = 0, l = pairs.length; i < l; i++) {
            let pair = pairs[i].split('=');
            qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return qry;
    }

    // imported from https://github.com/component/has-cors
    let value = false;
    try {
        value = typeof XMLHttpRequest !== 'undefined' &&
            'withCredentials' in new XMLHttpRequest();
    }
    catch (err) {
        // if XMLHttp support is disabled in IE then it will throw
        // when trying to create
    }
    const hasCORS = value;

    // browser shim for xmlhttprequest module
    function XHR(opts) {
        const xdomain = opts.xdomain;
        // XMLHttpRequest can be disabled on IE
        try {
            if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
                return new XMLHttpRequest();
            }
        }
        catch (e) { }
        if (!xdomain) {
            try {
                return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
            }
            catch (e) { }
        }
    }

    function empty() { }
    const hasXHR2 = (function () {
        const xhr = new XHR({
            xdomain: false
        });
        return null != xhr.responseType;
    })();
    class Polling extends Transport {
        /**
         * XHR Polling constructor.
         *
         * @param {Object} opts
         * @api public
         */
        constructor(opts) {
            super(opts);
            this.polling = false;
            if (typeof location !== "undefined") {
                const isSSL = "https:" === location.protocol;
                let port = location.port;
                // some user agents have empty `location.port`
                if (!port) {
                    port = isSSL ? "443" : "80";
                }
                this.xd =
                    (typeof location !== "undefined" &&
                        opts.hostname !== location.hostname) ||
                        port !== opts.port;
                this.xs = opts.secure !== isSSL;
            }
            /**
             * XHR supports binary
             */
            const forceBase64 = opts && opts.forceBase64;
            this.supportsBinary = hasXHR2 && !forceBase64;
        }
        /**
         * Transport name.
         */
        get name() {
            return "polling";
        }
        /**
         * Opens the socket (triggers polling). We write a PING message to determine
         * when the transport is open.
         *
         * @api private
         */
        doOpen() {
            this.poll();
        }
        /**
         * Pauses polling.
         *
         * @param {Function} callback upon buffers are flushed and transport is paused
         * @api private
         */
        pause(onPause) {
            this.readyState = "pausing";
            const pause = () => {
                this.readyState = "paused";
                onPause();
            };
            if (this.polling || !this.writable) {
                let total = 0;
                if (this.polling) {
                    total++;
                    this.once("pollComplete", function () {
                        --total || pause();
                    });
                }
                if (!this.writable) {
                    total++;
                    this.once("drain", function () {
                        --total || pause();
                    });
                }
            }
            else {
                pause();
            }
        }
        /**
         * Starts polling cycle.
         *
         * @api public
         */
        poll() {
            this.polling = true;
            this.doPoll();
            this.emitReserved("poll");
        }
        /**
         * Overloads onData to detect payloads.
         *
         * @api private
         */
        onData(data) {
            const callback = packet => {
                // if its the first message we consider the transport open
                if ("opening" === this.readyState && packet.type === "open") {
                    this.onOpen();
                }
                // if its a close packet, we close the ongoing requests
                if ("close" === packet.type) {
                    this.onClose({ description: "transport closed by the server" });
                    return false;
                }
                // otherwise bypass onData and handle the message
                this.onPacket(packet);
            };
            // decode payload
            decodePayload(data, this.socket.binaryType).forEach(callback);
            // if an event did not trigger closing
            if ("closed" !== this.readyState) {
                // if we got data we're not polling
                this.polling = false;
                this.emitReserved("pollComplete");
                if ("open" === this.readyState) {
                    this.poll();
                }
            }
        }
        /**
         * For polling, send a close packet.
         *
         * @api private
         */
        doClose() {
            const close = () => {
                this.write([{ type: "close" }]);
            };
            if ("open" === this.readyState) {
                close();
            }
            else {
                // in case we're trying to close while
                // handshaking is in progress (GH-164)
                this.once("open", close);
            }
        }
        /**
         * Writes a packets payload.
         *
         * @param {Array} data packets
         * @param {Function} drain callback
         * @api private
         */
        write(packets) {
            this.writable = false;
            encodePayload(packets, data => {
                this.doWrite(data, () => {
                    this.writable = true;
                    this.emitReserved("drain");
                });
            });
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */
        uri() {
            let query = this.query || {};
            const schema = this.opts.secure ? "https" : "http";
            let port = "";
            // cache busting is forced
            if (false !== this.opts.timestampRequests) {
                query[this.opts.timestampParam] = yeast();
            }
            if (!this.supportsBinary && !query.sid) {
                query.b64 = 1;
            }
            // avoid port if default for schema
            if (this.opts.port &&
                (("https" === schema && Number(this.opts.port) !== 443) ||
                    ("http" === schema && Number(this.opts.port) !== 80))) {
                port = ":" + this.opts.port;
            }
            const encodedQuery = encode(query);
            const ipv6 = this.opts.hostname.indexOf(":") !== -1;
            return (schema +
                "://" +
                (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
                port +
                this.opts.path +
                (encodedQuery.length ? "?" + encodedQuery : ""));
        }
        /**
         * Creates a request.
         *
         * @param {String} method
         * @api private
         */
        request(opts = {}) {
            Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
            return new Request(this.uri(), opts);
        }
        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @api private
         */
        doWrite(data, fn) {
            const req = this.request({
                method: "POST",
                data: data
            });
            req.on("success", fn);
            req.on("error", (xhrStatus, context) => {
                this.onError("xhr post error", xhrStatus, context);
            });
        }
        /**
         * Starts a poll cycle.
         *
         * @api private
         */
        doPoll() {
            const req = this.request();
            req.on("data", this.onData.bind(this));
            req.on("error", (xhrStatus, context) => {
                this.onError("xhr poll error", xhrStatus, context);
            });
            this.pollXhr = req;
        }
    }
    class Request extends Emitter {
        /**
         * Request constructor
         *
         * @param {Object} options
         * @api public
         */
        constructor(uri, opts) {
            super();
            installTimerFunctions(this, opts);
            this.opts = opts;
            this.method = opts.method || "GET";
            this.uri = uri;
            this.async = false !== opts.async;
            this.data = undefined !== opts.data ? opts.data : null;
            this.create();
        }
        /**
         * Creates the XHR object and sends the request.
         *
         * @api private
         */
        create() {
            const opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
            opts.xdomain = !!this.opts.xd;
            opts.xscheme = !!this.opts.xs;
            const xhr = (this.xhr = new XHR(opts));
            try {
                xhr.open(this.method, this.uri, this.async);
                try {
                    if (this.opts.extraHeaders) {
                        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                        for (let i in this.opts.extraHeaders) {
                            if (this.opts.extraHeaders.hasOwnProperty(i)) {
                                xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                            }
                        }
                    }
                }
                catch (e) { }
                if ("POST" === this.method) {
                    try {
                        xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                    }
                    catch (e) { }
                }
                try {
                    xhr.setRequestHeader("Accept", "*/*");
                }
                catch (e) { }
                // ie6 check
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = this.opts.withCredentials;
                }
                if (this.opts.requestTimeout) {
                    xhr.timeout = this.opts.requestTimeout;
                }
                xhr.onreadystatechange = () => {
                    if (4 !== xhr.readyState)
                        return;
                    if (200 === xhr.status || 1223 === xhr.status) {
                        this.onLoad();
                    }
                    else {
                        // make sure the `error` event handler that's user-set
                        // does not throw in the same tick and gets caught here
                        this.setTimeoutFn(() => {
                            this.onError(typeof xhr.status === "number" ? xhr.status : 0);
                        }, 0);
                    }
                };
                xhr.send(this.data);
            }
            catch (e) {
                // Need to defer since .create() is called directly from the constructor
                // and thus the 'error' event can only be only bound *after* this exception
                // occurs.  Therefore, also, we cannot throw here at all.
                this.setTimeoutFn(() => {
                    this.onError(e);
                }, 0);
                return;
            }
            if (typeof document !== "undefined") {
                this.index = Request.requestsCount++;
                Request.requests[this.index] = this;
            }
        }
        /**
         * Called upon error.
         *
         * @api private
         */
        onError(err) {
            this.emitReserved("error", err, this.xhr);
            this.cleanup(true);
        }
        /**
         * Cleans up house.
         *
         * @api private
         */
        cleanup(fromError) {
            if ("undefined" === typeof this.xhr || null === this.xhr) {
                return;
            }
            this.xhr.onreadystatechange = empty;
            if (fromError) {
                try {
                    this.xhr.abort();
                }
                catch (e) { }
            }
            if (typeof document !== "undefined") {
                delete Request.requests[this.index];
            }
            this.xhr = null;
        }
        /**
         * Called upon load.
         *
         * @api private
         */
        onLoad() {
            const data = this.xhr.responseText;
            if (data !== null) {
                this.emitReserved("data", data);
                this.emitReserved("success");
                this.cleanup();
            }
        }
        /**
         * Aborts the request.
         *
         * @api public
         */
        abort() {
            this.cleanup();
        }
    }
    Request.requestsCount = 0;
    Request.requests = {};
    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */
    if (typeof document !== "undefined") {
        // @ts-ignore
        if (typeof attachEvent === "function") {
            // @ts-ignore
            attachEvent("onunload", unloadHandler);
        }
        else if (typeof addEventListener === "function") {
            const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
            addEventListener(terminationEvent, unloadHandler, false);
        }
    }
    function unloadHandler() {
        for (let i in Request.requests) {
            if (Request.requests.hasOwnProperty(i)) {
                Request.requests[i].abort();
            }
        }
    }

    const nextTick = (() => {
        const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
        if (isPromiseAvailable) {
            return cb => Promise.resolve().then(cb);
        }
        else {
            return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
        }
    })();
    const WebSocket = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
    const usingBrowserWebSocket = true;
    const defaultBinaryType = "arraybuffer";

    // detect ReactNative environment
    const isReactNative = typeof navigator !== "undefined" &&
        typeof navigator.product === "string" &&
        navigator.product.toLowerCase() === "reactnative";
    class WS extends Transport {
        /**
         * WebSocket transport constructor.
         *
         * @api {Object} connection options
         * @api public
         */
        constructor(opts) {
            super(opts);
            this.supportsBinary = !opts.forceBase64;
        }
        /**
         * Transport name.
         *
         * @api public
         */
        get name() {
            return "websocket";
        }
        /**
         * Opens socket.
         *
         * @api private
         */
        doOpen() {
            if (!this.check()) {
                // let probe timeout
                return;
            }
            const uri = this.uri();
            const protocols = this.opts.protocols;
            // React Native only supports the 'headers' option, and will print a warning if anything else is passed
            const opts = isReactNative
                ? {}
                : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
            if (this.opts.extraHeaders) {
                opts.headers = this.opts.extraHeaders;
            }
            try {
                this.ws =
                    usingBrowserWebSocket && !isReactNative
                        ? protocols
                            ? new WebSocket(uri, protocols)
                            : new WebSocket(uri)
                        : new WebSocket(uri, protocols, opts);
            }
            catch (err) {
                return this.emitReserved("error", err);
            }
            this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
            this.addEventListeners();
        }
        /**
         * Adds event listeners to the socket
         *
         * @api private
         */
        addEventListeners() {
            this.ws.onopen = () => {
                if (this.opts.autoUnref) {
                    this.ws._socket.unref();
                }
                this.onOpen();
            };
            this.ws.onclose = closeEvent => this.onClose({
                description: "websocket connection closed",
                context: closeEvent
            });
            this.ws.onmessage = ev => this.onData(ev.data);
            this.ws.onerror = e => this.onError("websocket error", e);
        }
        /**
         * Writes data to socket.
         *
         * @param {Array} array of packets.
         * @api private
         */
        write(packets) {
            this.writable = false;
            // encodePacket efficient as it uses WS framing
            // no need for encodePayload
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                const lastPacket = i === packets.length - 1;
                encodePacket(packet, this.supportsBinary, data => {
                    // always create a new object (GH-437)
                    const opts = {};
                    // Sometimes the websocket has already been closed but the browser didn't
                    // have a chance of informing us about it yet, in that case send will
                    // throw an error
                    try {
                        if (usingBrowserWebSocket) {
                            // TypeError is thrown when passing the second argument on Safari
                            this.ws.send(data);
                        }
                    }
                    catch (e) {
                    }
                    if (lastPacket) {
                        // fake drain
                        // defer to next tick to allow Socket to clear writeBuffer
                        nextTick(() => {
                            this.writable = true;
                            this.emitReserved("drain");
                        }, this.setTimeoutFn);
                    }
                });
            }
        }
        /**
         * Closes socket.
         *
         * @api private
         */
        doClose() {
            if (typeof this.ws !== "undefined") {
                this.ws.close();
                this.ws = null;
            }
        }
        /**
         * Generates uri for connection.
         *
         * @api private
         */
        uri() {
            let query = this.query || {};
            const schema = this.opts.secure ? "wss" : "ws";
            let port = "";
            // avoid port if default for schema
            if (this.opts.port &&
                (("wss" === schema && Number(this.opts.port) !== 443) ||
                    ("ws" === schema && Number(this.opts.port) !== 80))) {
                port = ":" + this.opts.port;
            }
            // append timestamp to URI
            if (this.opts.timestampRequests) {
                query[this.opts.timestampParam] = yeast();
            }
            // communicate binary support capabilities
            if (!this.supportsBinary) {
                query.b64 = 1;
            }
            const encodedQuery = encode(query);
            const ipv6 = this.opts.hostname.indexOf(":") !== -1;
            return (schema +
                "://" +
                (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
                port +
                this.opts.path +
                (encodedQuery.length ? "?" + encodedQuery : ""));
        }
        /**
         * Feature detection for WebSocket.
         *
         * @return {Boolean} whether this transport is available.
         * @api public
         */
        check() {
            return !!WebSocket;
        }
    }

    const transports = {
        websocket: WS,
        polling: Polling
    };

    // imported from https://github.com/galkn/parseuri
    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    const re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    const parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];
    function parse(str) {
        const src = str, b = str.indexOf('['), e = str.indexOf(']');
        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }
        let m = re.exec(str || ''), uri = {}, i = 14;
        while (i--) {
            uri[parts[i]] = m[i] || '';
        }
        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }
        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);
        return uri;
    }
    function pathNames(obj, path) {
        const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
        if (path.substr(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.substr(path.length - 1, 1) == '/') {
            names.splice(names.length - 1, 1);
        }
        return names;
    }
    function queryKey(uri, query) {
        const data = {};
        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });
        return data;
    }

    class Socket$1 extends Emitter {
        /**
         * Socket constructor.
         *
         * @param {String|Object} uri or options
         * @param {Object} opts - options
         * @api public
         */
        constructor(uri, opts = {}) {
            super();
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = null;
            }
            if (uri) {
                uri = parse(uri);
                opts.hostname = uri.host;
                opts.secure = uri.protocol === "https" || uri.protocol === "wss";
                opts.port = uri.port;
                if (uri.query)
                    opts.query = uri.query;
            }
            else if (opts.host) {
                opts.hostname = parse(opts.host).host;
            }
            installTimerFunctions(this, opts);
            this.secure =
                null != opts.secure
                    ? opts.secure
                    : typeof location !== "undefined" && "https:" === location.protocol;
            if (opts.hostname && !opts.port) {
                // if no port is specified manually, use the protocol default
                opts.port = this.secure ? "443" : "80";
            }
            this.hostname =
                opts.hostname ||
                    (typeof location !== "undefined" ? location.hostname : "localhost");
            this.port =
                opts.port ||
                    (typeof location !== "undefined" && location.port
                        ? location.port
                        : this.secure
                            ? "443"
                            : "80");
            this.transports = opts.transports || ["polling", "websocket"];
            this.readyState = "";
            this.writeBuffer = [];
            this.prevBufferLen = 0;
            this.opts = Object.assign({
                path: "/engine.io",
                agent: false,
                withCredentials: false,
                upgrade: true,
                timestampParam: "t",
                rememberUpgrade: false,
                rejectUnauthorized: true,
                perMessageDeflate: {
                    threshold: 1024
                },
                transportOptions: {},
                closeOnBeforeunload: true
            }, opts);
            this.opts.path = this.opts.path.replace(/\/$/, "") + "/";
            if (typeof this.opts.query === "string") {
                this.opts.query = decode(this.opts.query);
            }
            // set on handshake
            this.id = null;
            this.upgrades = null;
            this.pingInterval = null;
            this.pingTimeout = null;
            // set on heartbeat
            this.pingTimeoutTimer = null;
            if (typeof addEventListener === "function") {
                if (this.opts.closeOnBeforeunload) {
                    // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
                    // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
                    // closed/reloaded)
                    addEventListener("beforeunload", () => {
                        if (this.transport) {
                            // silently close the transport
                            this.transport.removeAllListeners();
                            this.transport.close();
                        }
                    }, false);
                }
                if (this.hostname !== "localhost") {
                    this.offlineEventListener = () => {
                        this.onClose("transport close", {
                            description: "network connection lost"
                        });
                    };
                    addEventListener("offline", this.offlineEventListener, false);
                }
            }
            this.open();
        }
        /**
         * Creates transport of the given type.
         *
         * @param {String} transport name
         * @return {Transport}
         * @api private
         */
        createTransport(name) {
            const query = Object.assign({}, this.opts.query);
            // append engine.io protocol identifier
            query.EIO = protocol$1;
            // transport name
            query.transport = name;
            // session id if we already have one
            if (this.id)
                query.sid = this.id;
            const opts = Object.assign({}, this.opts.transportOptions[name], this.opts, {
                query,
                socket: this,
                hostname: this.hostname,
                secure: this.secure,
                port: this.port
            });
            return new transports[name](opts);
        }
        /**
         * Initializes transport to use and starts probe.
         *
         * @api private
         */
        open() {
            let transport;
            if (this.opts.rememberUpgrade &&
                Socket$1.priorWebsocketSuccess &&
                this.transports.indexOf("websocket") !== -1) {
                transport = "websocket";
            }
            else if (0 === this.transports.length) {
                // Emit error on next tick so it can be listened to
                this.setTimeoutFn(() => {
                    this.emitReserved("error", "No transports available");
                }, 0);
                return;
            }
            else {
                transport = this.transports[0];
            }
            this.readyState = "opening";
            // Retry with the next transport if the transport is disabled (jsonp: false)
            try {
                transport = this.createTransport(transport);
            }
            catch (e) {
                this.transports.shift();
                this.open();
                return;
            }
            transport.open();
            this.setTransport(transport);
        }
        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @api private
         */
        setTransport(transport) {
            if (this.transport) {
                this.transport.removeAllListeners();
            }
            // set up transport
            this.transport = transport;
            // set up transport listeners
            transport
                .on("drain", this.onDrain.bind(this))
                .on("packet", this.onPacket.bind(this))
                .on("error", this.onError.bind(this))
                .on("close", reason => this.onClose("transport close", reason));
        }
        /**
         * Probes a transport.
         *
         * @param {String} transport name
         * @api private
         */
        probe(name) {
            let transport = this.createTransport(name);
            let failed = false;
            Socket$1.priorWebsocketSuccess = false;
            const onTransportOpen = () => {
                if (failed)
                    return;
                transport.send([{ type: "ping", data: "probe" }]);
                transport.once("packet", msg => {
                    if (failed)
                        return;
                    if ("pong" === msg.type && "probe" === msg.data) {
                        this.upgrading = true;
                        this.emitReserved("upgrading", transport);
                        if (!transport)
                            return;
                        Socket$1.priorWebsocketSuccess = "websocket" === transport.name;
                        this.transport.pause(() => {
                            if (failed)
                                return;
                            if ("closed" === this.readyState)
                                return;
                            cleanup();
                            this.setTransport(transport);
                            transport.send([{ type: "upgrade" }]);
                            this.emitReserved("upgrade", transport);
                            transport = null;
                            this.upgrading = false;
                            this.flush();
                        });
                    }
                    else {
                        const err = new Error("probe error");
                        // @ts-ignore
                        err.transport = transport.name;
                        this.emitReserved("upgradeError", err);
                    }
                });
            };
            function freezeTransport() {
                if (failed)
                    return;
                // Any callback called by transport should be ignored since now
                failed = true;
                cleanup();
                transport.close();
                transport = null;
            }
            // Handle any error that happens while probing
            const onerror = err => {
                const error = new Error("probe error: " + err);
                // @ts-ignore
                error.transport = transport.name;
                freezeTransport();
                this.emitReserved("upgradeError", error);
            };
            function onTransportClose() {
                onerror("transport closed");
            }
            // When the socket is closed while we're probing
            function onclose() {
                onerror("socket closed");
            }
            // When the socket is upgraded while we're probing
            function onupgrade(to) {
                if (transport && to.name !== transport.name) {
                    freezeTransport();
                }
            }
            // Remove all listeners on the transport and on self
            const cleanup = () => {
                transport.removeListener("open", onTransportOpen);
                transport.removeListener("error", onerror);
                transport.removeListener("close", onTransportClose);
                this.off("close", onclose);
                this.off("upgrading", onupgrade);
            };
            transport.once("open", onTransportOpen);
            transport.once("error", onerror);
            transport.once("close", onTransportClose);
            this.once("close", onclose);
            this.once("upgrading", onupgrade);
            transport.open();
        }
        /**
         * Called when connection is deemed open.
         *
         * @api private
         */
        onOpen() {
            this.readyState = "open";
            Socket$1.priorWebsocketSuccess = "websocket" === this.transport.name;
            this.emitReserved("open");
            this.flush();
            // we check for `readyState` in case an `open`
            // listener already closed the socket
            if ("open" === this.readyState &&
                this.opts.upgrade &&
                this.transport.pause) {
                let i = 0;
                const l = this.upgrades.length;
                for (; i < l; i++) {
                    this.probe(this.upgrades[i]);
                }
            }
        }
        /**
         * Handles a packet.
         *
         * @api private
         */
        onPacket(packet) {
            if ("opening" === this.readyState ||
                "open" === this.readyState ||
                "closing" === this.readyState) {
                this.emitReserved("packet", packet);
                // Socket is live - any packet counts
                this.emitReserved("heartbeat");
                switch (packet.type) {
                    case "open":
                        this.onHandshake(JSON.parse(packet.data));
                        break;
                    case "ping":
                        this.resetPingTimeout();
                        this.sendPacket("pong");
                        this.emitReserved("ping");
                        this.emitReserved("pong");
                        break;
                    case "error":
                        const err = new Error("server error");
                        // @ts-ignore
                        err.code = packet.data;
                        this.onError(err);
                        break;
                    case "message":
                        this.emitReserved("data", packet.data);
                        this.emitReserved("message", packet.data);
                        break;
                }
            }
        }
        /**
         * Called upon handshake completion.
         *
         * @param {Object} data - handshake obj
         * @api private
         */
        onHandshake(data) {
            this.emitReserved("handshake", data);
            this.id = data.sid;
            this.transport.query.sid = data.sid;
            this.upgrades = this.filterUpgrades(data.upgrades);
            this.pingInterval = data.pingInterval;
            this.pingTimeout = data.pingTimeout;
            this.maxPayload = data.maxPayload;
            this.onOpen();
            // In case open handler closes socket
            if ("closed" === this.readyState)
                return;
            this.resetPingTimeout();
        }
        /**
         * Sets and resets ping timeout timer based on server pings.
         *
         * @api private
         */
        resetPingTimeout() {
            this.clearTimeoutFn(this.pingTimeoutTimer);
            this.pingTimeoutTimer = this.setTimeoutFn(() => {
                this.onClose("ping timeout");
            }, this.pingInterval + this.pingTimeout);
            if (this.opts.autoUnref) {
                this.pingTimeoutTimer.unref();
            }
        }
        /**
         * Called on `drain` event
         *
         * @api private
         */
        onDrain() {
            this.writeBuffer.splice(0, this.prevBufferLen);
            // setting prevBufferLen = 0 is very important
            // for example, when upgrading, upgrade packet is sent over,
            // and a nonzero prevBufferLen could cause problems on `drain`
            this.prevBufferLen = 0;
            if (0 === this.writeBuffer.length) {
                this.emitReserved("drain");
            }
            else {
                this.flush();
            }
        }
        /**
         * Flush write buffers.
         *
         * @api private
         */
        flush() {
            if ("closed" !== this.readyState &&
                this.transport.writable &&
                !this.upgrading &&
                this.writeBuffer.length) {
                const packets = this.getWritablePackets();
                this.transport.send(packets);
                // keep track of current length of writeBuffer
                // splice writeBuffer and callbackBuffer on `drain`
                this.prevBufferLen = packets.length;
                this.emitReserved("flush");
            }
        }
        /**
         * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
         * long-polling)
         *
         * @private
         */
        getWritablePackets() {
            const shouldCheckPayloadSize = this.maxPayload &&
                this.transport.name === "polling" &&
                this.writeBuffer.length > 1;
            if (!shouldCheckPayloadSize) {
                return this.writeBuffer;
            }
            let payloadSize = 1; // first packet type
            for (let i = 0; i < this.writeBuffer.length; i++) {
                const data = this.writeBuffer[i].data;
                if (data) {
                    payloadSize += byteLength(data);
                }
                if (i > 0 && payloadSize > this.maxPayload) {
                    return this.writeBuffer.slice(0, i);
                }
                payloadSize += 2; // separator + packet type
            }
            return this.writeBuffer;
        }
        /**
         * Sends a message.
         *
         * @param {String} message.
         * @param {Function} callback function.
         * @param {Object} options.
         * @return {Socket} for chaining.
         * @api public
         */
        write(msg, options, fn) {
            this.sendPacket("message", msg, options, fn);
            return this;
        }
        send(msg, options, fn) {
            this.sendPacket("message", msg, options, fn);
            return this;
        }
        /**
         * Sends a packet.
         *
         * @param {String} packet type.
         * @param {String} data.
         * @param {Object} options.
         * @param {Function} callback function.
         * @api private
         */
        sendPacket(type, data, options, fn) {
            if ("function" === typeof data) {
                fn = data;
                data = undefined;
            }
            if ("function" === typeof options) {
                fn = options;
                options = null;
            }
            if ("closing" === this.readyState || "closed" === this.readyState) {
                return;
            }
            options = options || {};
            options.compress = false !== options.compress;
            const packet = {
                type: type,
                data: data,
                options: options
            };
            this.emitReserved("packetCreate", packet);
            this.writeBuffer.push(packet);
            if (fn)
                this.once("flush", fn);
            this.flush();
        }
        /**
         * Closes the connection.
         *
         * @api public
         */
        close() {
            const close = () => {
                this.onClose("forced close");
                this.transport.close();
            };
            const cleanupAndClose = () => {
                this.off("upgrade", cleanupAndClose);
                this.off("upgradeError", cleanupAndClose);
                close();
            };
            const waitForUpgrade = () => {
                // wait for upgrade to finish since we can't send packets while pausing a transport
                this.once("upgrade", cleanupAndClose);
                this.once("upgradeError", cleanupAndClose);
            };
            if ("opening" === this.readyState || "open" === this.readyState) {
                this.readyState = "closing";
                if (this.writeBuffer.length) {
                    this.once("drain", () => {
                        if (this.upgrading) {
                            waitForUpgrade();
                        }
                        else {
                            close();
                        }
                    });
                }
                else if (this.upgrading) {
                    waitForUpgrade();
                }
                else {
                    close();
                }
            }
            return this;
        }
        /**
         * Called upon transport error
         *
         * @api private
         */
        onError(err) {
            Socket$1.priorWebsocketSuccess = false;
            this.emitReserved("error", err);
            this.onClose("transport error", err);
        }
        /**
         * Called upon transport close.
         *
         * @api private
         */
        onClose(reason, description) {
            if ("opening" === this.readyState ||
                "open" === this.readyState ||
                "closing" === this.readyState) {
                // clear timers
                this.clearTimeoutFn(this.pingTimeoutTimer);
                // stop event from firing again for transport
                this.transport.removeAllListeners("close");
                // ensure transport won't stay open
                this.transport.close();
                // ignore further transport communication
                this.transport.removeAllListeners();
                if (typeof removeEventListener === "function") {
                    removeEventListener("offline", this.offlineEventListener, false);
                }
                // set ready state
                this.readyState = "closed";
                // clear session id
                this.id = null;
                // emit close event
                this.emitReserved("close", reason, description);
                // clean buffers after, so users can still
                // grab the buffers on `close` event
                this.writeBuffer = [];
                this.prevBufferLen = 0;
            }
        }
        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} server upgrades
         * @api private
         *
         */
        filterUpgrades(upgrades) {
            const filteredUpgrades = [];
            let i = 0;
            const j = upgrades.length;
            for (; i < j; i++) {
                if (~this.transports.indexOf(upgrades[i]))
                    filteredUpgrades.push(upgrades[i]);
            }
            return filteredUpgrades;
        }
    }
    Socket$1.protocol = protocol$1;

    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */
    function url(uri, path = "", loc) {
        let obj = uri;
        // default to window.location
        loc = loc || (typeof location !== "undefined" && location);
        if (null == uri)
            uri = loc.protocol + "//" + loc.host;
        // relative path support
        if (typeof uri === "string") {
            if ("/" === uri.charAt(0)) {
                if ("/" === uri.charAt(1)) {
                    uri = loc.protocol + uri;
                }
                else {
                    uri = loc.host + uri;
                }
            }
            if (!/^(https?|wss?):\/\//.test(uri)) {
                if ("undefined" !== typeof loc) {
                    uri = loc.protocol + "//" + uri;
                }
                else {
                    uri = "https://" + uri;
                }
            }
            // parse
            obj = parse(uri);
        }
        // make sure we treat `localhost:80` and `localhost` equally
        if (!obj.port) {
            if (/^(http|ws)$/.test(obj.protocol)) {
                obj.port = "80";
            }
            else if (/^(http|ws)s$/.test(obj.protocol)) {
                obj.port = "443";
            }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        // define unique id
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        // define href
        obj.href =
            obj.protocol +
                "://" +
                host +
                (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
    }

    const withNativeArrayBuffer = typeof ArrayBuffer === "function";
    const isView = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
    };
    const toString = Object.prototype.toString;
    const withNativeBlob = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
    const withNativeFile = typeof File === "function" ||
        (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */
    function isBinary(obj) {
        return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File));
    }
    function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (Array.isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (hasBinary(obj[i])) {
                    return true;
                }
            }
            return false;
        }
        if (isBinary(obj)) {
            return true;
        }
        if (obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1) {
            return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */
    function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length; // number of binary 'attachments'
        return { packet: pack, buffers: buffers };
    }
    function _deconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (isBinary(data)) {
            const placeholder = { _placeholder: true, num: buffers.length };
            buffers.push(data);
            return placeholder;
        }
        else if (Array.isArray(data)) {
            const newData = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                newData[i] = _deconstructPacket(data[i], buffers);
            }
            return newData;
        }
        else if (typeof data === "object" && !(data instanceof Date)) {
            const newData = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    newData[key] = _deconstructPacket(data[key], buffers);
                }
            }
            return newData;
        }
        return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */
    function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        packet.attachments = undefined; // no longer useful
        return packet;
    }
    function _reconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (data && data._placeholder) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = _reconstructPacket(data[i], buffers);
            }
        }
        else if (typeof data === "object") {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    data[key] = _reconstructPacket(data[key], buffers);
                }
            }
        }
        return data;
    }

    /**
     * Protocol version.
     *
     * @public
     */
    const protocol = 5;
    var PacketType;
    (function (PacketType) {
        PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
        PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType[PacketType["EVENT"] = 2] = "EVENT";
        PacketType[PacketType["ACK"] = 3] = "ACK";
        PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType || (PacketType = {}));
    /**
     * A socket.io Encoder instance
     */
    class Encoder {
        /**
         * Encoder constructor
         *
         * @param {function} replacer - custom replacer to pass down to JSON.parse
         */
        constructor(replacer) {
            this.replacer = replacer;
        }
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
            if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
                if (hasBinary(obj)) {
                    obj.type =
                        obj.type === PacketType.EVENT
                            ? PacketType.BINARY_EVENT
                            : PacketType.BINARY_ACK;
                    return this.encodeAsBinary(obj);
                }
            }
            return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (obj.type === PacketType.BINARY_EVENT ||
                obj.type === PacketType.BINARY_ACK) {
                str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
                str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
                str += obj.id;
            }
            // json data
            if (null != obj.data) {
                str += JSON.stringify(obj.data, this.replacer);
            }
            return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
            const deconstruction = deconstructPacket(obj);
            const pack = this.encodeAsString(deconstruction.packet);
            const buffers = deconstruction.buffers;
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
        }
    }
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */
    class Decoder extends Emitter {
        /**
         * Decoder constructor
         *
         * @param {function} reviver - custom reviver to pass down to JSON.stringify
         */
        constructor(reviver) {
            super();
            this.reviver = reviver;
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
            let packet;
            if (typeof obj === "string") {
                packet = this.decodeString(obj);
                if (packet.type === PacketType.BINARY_EVENT ||
                    packet.type === PacketType.BINARY_ACK) {
                    // binary packet's json
                    this.reconstructor = new BinaryReconstructor(packet);
                    // no attachments, labeled binary but no binary data to follow
                    if (packet.attachments === 0) {
                        super.emitReserved("decoded", packet);
                    }
                }
                else {
                    // non-binary full packet
                    super.emitReserved("decoded", packet);
                }
            }
            else if (isBinary(obj) || obj.base64) {
                // raw binary data
                if (!this.reconstructor) {
                    throw new Error("got binary data when not reconstructing a packet");
                }
                else {
                    packet = this.reconstructor.takeBinaryData(obj);
                    if (packet) {
                        // received final buffer
                        this.reconstructor = null;
                        super.emitReserved("decoded", packet);
                    }
                }
            }
            else {
                throw new Error("Unknown type: " + obj);
            }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
            let i = 0;
            // look up type
            const p = {
                type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
                throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (p.type === PacketType.BINARY_EVENT ||
                p.type === PacketType.BINARY_ACK) {
                const start = i + 1;
                while (str.charAt(++i) !== "-" && i != str.length) { }
                const buf = str.substring(start, i);
                if (buf != Number(buf) || str.charAt(i) !== "-") {
                    throw new Error("Illegal attachments");
                }
                p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if ("," === c)
                        break;
                    if (i === str.length)
                        break;
                }
                p.nsp = str.substring(start, i);
            }
            else {
                p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if (null == c || Number(c) != c) {
                        --i;
                        break;
                    }
                    if (i === str.length)
                        break;
                }
                p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
                const payload = this.tryParse(str.substr(i));
                if (Decoder.isPayloadValid(p.type, payload)) {
                    p.data = payload;
                }
                else {
                    throw new Error("invalid payload");
                }
            }
            return p;
        }
        tryParse(str) {
            try {
                return JSON.parse(str, this.reviver);
            }
            catch (e) {
                return false;
            }
        }
        static isPayloadValid(type, payload) {
            switch (type) {
                case PacketType.CONNECT:
                    return typeof payload === "object";
                case PacketType.DISCONNECT:
                    return payload === undefined;
                case PacketType.CONNECT_ERROR:
                    return typeof payload === "string" || typeof payload === "object";
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    return Array.isArray(payload) && payload.length > 0;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    return Array.isArray(payload);
            }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
            if (this.reconstructor) {
                this.reconstructor.finishedReconstruction();
            }
        }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */
    class BinaryReconstructor {
        constructor(packet) {
            this.packet = packet;
            this.buffers = [];
            this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
            this.buffers.push(binData);
            if (this.buffers.length === this.reconPack.attachments) {
                // done with buffer list
                const packet = reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
            }
            return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
            this.reconPack = null;
            this.buffers = [];
        }
    }

    var parser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        protocol: protocol,
        get PacketType () { return PacketType; },
        Encoder: Encoder,
        Decoder: Decoder
    });

    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
            obj.off(ev, fn);
        };
    }

    /**
     * Internal events.
     * These events can't be emitted by the user.
     */
    const RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1,
    });
    class Socket extends Emitter {
        /**
         * `Socket` constructor.
         *
         * @public
         */
        constructor(io, nsp, opts) {
            super();
            this.connected = false;
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.ids = 0;
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            if (opts && opts.auth) {
                this.auth = opts.auth;
            }
            if (this.io._autoConnect)
                this.open();
        }
        /**
         * Whether the socket is currently disconnected
         */
        get disconnected() {
            return !this.connected;
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
            if (this.subs)
                return;
            const io = this.io;
            this.subs = [
                on(io, "open", this.onopen.bind(this)),
                on(io, "packet", this.onpacket.bind(this)),
                on(io, "error", this.onerror.bind(this)),
                on(io, "close", this.onclose.bind(this)),
            ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects
         */
        get active() {
            return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @public
         */
        connect() {
            if (this.connected)
                return this;
            this.subEvents();
            if (!this.io["_reconnecting"])
                this.io.open(); // ensure open
            if ("open" === this.io._readyState)
                this.onopen();
            return this;
        }
        /**
         * Alias for connect()
         */
        open() {
            return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * @return self
         * @public
         */
        send(...args) {
            args.unshift("message");
            this.emit.apply(this, args);
            return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @return self
         * @public
         */
        emit(ev, ...args) {
            if (RESERVED_EVENTS.hasOwnProperty(ev)) {
                throw new Error('"' + ev + '" is a reserved event name');
            }
            args.unshift(ev);
            const packet = {
                type: PacketType.EVENT,
                data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
                const id = this.ids++;
                const ack = args.pop();
                this._registerAckCallback(id, ack);
                packet.id = id;
            }
            const isTransportWritable = this.io.engine &&
                this.io.engine.transport &&
                this.io.engine.transport.writable;
            const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
            if (discardPacket) ;
            else if (this.connected) {
                this.notifyOutgoingListeners(packet);
                this.packet(packet);
            }
            else {
                this.sendBuffer.push(packet);
            }
            this.flags = {};
            return this;
        }
        /**
         * @private
         */
        _registerAckCallback(id, ack) {
            const timeout = this.flags.timeout;
            if (timeout === undefined) {
                this.acks[id] = ack;
                return;
            }
            // @ts-ignore
            const timer = this.io.setTimeoutFn(() => {
                delete this.acks[id];
                for (let i = 0; i < this.sendBuffer.length; i++) {
                    if (this.sendBuffer[i].id === id) {
                        this.sendBuffer.splice(i, 1);
                    }
                }
                ack.call(this, new Error("operation has timed out"));
            }, timeout);
            this.acks[id] = (...args) => {
                // @ts-ignore
                this.io.clearTimeoutFn(timer);
                ack.apply(this, [null, ...args]);
            };
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
            packet.nsp = this.nsp;
            this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
            if (typeof this.auth == "function") {
                this.auth((data) => {
                    this.packet({ type: PacketType.CONNECT, data });
                });
            }
            else {
                this.packet({ type: PacketType.CONNECT, data: this.auth });
            }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
            if (!this.connected) {
                this.emitReserved("connect_error", err);
            }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @param description
         * @private
         */
        onclose(reason, description) {
            this.connected = false;
            delete this.id;
            this.emitReserved("disconnect", reason, description);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
            const sameNamespace = packet.nsp === this.nsp;
            if (!sameNamespace)
                return;
            switch (packet.type) {
                case PacketType.CONNECT:
                    if (packet.data && packet.data.sid) {
                        const id = packet.data.sid;
                        this.onconnect(id);
                    }
                    else {
                        this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                    }
                    break;
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    this.onevent(packet);
                    break;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    this.onack(packet);
                    break;
                case PacketType.DISCONNECT:
                    this.ondisconnect();
                    break;
                case PacketType.CONNECT_ERROR:
                    this.destroy();
                    const err = new Error(packet.data.message);
                    // @ts-ignore
                    err.data = packet.data.data;
                    this.emitReserved("connect_error", err);
                    break;
            }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
            const args = packet.data || [];
            if (null != packet.id) {
                args.push(this.ack(packet.id));
            }
            if (this.connected) {
                this.emitEvent(args);
            }
            else {
                this.receiveBuffer.push(Object.freeze(args));
            }
        }
        emitEvent(args) {
            if (this._anyListeners && this._anyListeners.length) {
                const listeners = this._anyListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, args);
                }
            }
            super.emit.apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
            const self = this;
            let sent = false;
            return function (...args) {
                // prevent double callbacks
                if (sent)
                    return;
                sent = true;
                self.packet({
                    type: PacketType.ACK,
                    id: id,
                    data: args,
                });
            };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
            const ack = this.acks[packet.id];
            if ("function" === typeof ack) {
                ack.apply(this, packet.data);
                delete this.acks[packet.id];
            }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id) {
            this.id = id;
            this.connected = true;
            this.emitBuffered();
            this.emitReserved("connect");
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
            this.receiveBuffer.forEach((args) => this.emitEvent(args));
            this.receiveBuffer = [];
            this.sendBuffer.forEach((packet) => {
                this.notifyOutgoingListeners(packet);
                this.packet(packet);
            });
            this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
            this.destroy();
            this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
            if (this.subs) {
                // clean subscriptions to avoid reconnections
                this.subs.forEach((subDestroy) => subDestroy());
                this.subs = undefined;
            }
            this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually.
         *
         * @return self
         * @public
         */
        disconnect() {
            if (this.connected) {
                this.packet({ type: PacketType.DISCONNECT });
            }
            // remove socket from pool
            this.destroy();
            if (this.connected) {
                // fire events
                this.onclose("io client disconnect");
            }
            return this;
        }
        /**
         * Alias for disconnect()
         *
         * @return self
         * @public
         */
        close() {
            return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         * @public
         */
        compress(compress) {
            this.flags.compress = compress;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @returns self
         * @public
         */
        get volatile() {
            this.flags.volatile = true;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
         * given number of milliseconds have elapsed without an acknowledgement from the server:
         *
         * ```
         * socket.timeout(5000).emit("my-event", (err) => {
         *   if (err) {
         *     // the server did not acknowledge the event in the given delay
         *   }
         * });
         * ```
         *
         * @returns self
         * @public
         */
        timeout(timeout) {
            this.flags.timeout = timeout;
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         * @public
         */
        onAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         * @public
         */
        prependAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         * @public
         */
        offAny(listener) {
            if (!this._anyListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */
        listenersAny() {
            return this._anyListeners || [];
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         *
         * <pre><code>
         *
         * socket.onAnyOutgoing((event, ...args) => {
         *   console.log(event);
         * });
         *
         * </pre></code>
         *
         * @public
         */
        onAnyOutgoing(listener) {
            this._anyOutgoingListeners = this._anyOutgoingListeners || [];
            this._anyOutgoingListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         *
         * <pre><code>
         *
         * socket.prependAnyOutgoing((event, ...args) => {
         *   console.log(event);
         * });
         *
         * </pre></code>
         *
         * @public
         */
        prependAnyOutgoing(listener) {
            this._anyOutgoingListeners = this._anyOutgoingListeners || [];
            this._anyOutgoingListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         *
         * <pre><code>
         *
         * const handler = (event, ...args) => {
         *   console.log(event);
         * }
         *
         * socket.onAnyOutgoing(handler);
         *
         * // then later
         * socket.offAnyOutgoing(handler);
         *
         * </pre></code>
         *
         * @public
         */
        offAnyOutgoing(listener) {
            if (!this._anyOutgoingListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyOutgoingListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyOutgoingListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */
        listenersAnyOutgoing() {
            return this._anyOutgoingListeners || [];
        }
        /**
         * Notify the listeners for each packet sent
         *
         * @param packet
         *
         * @private
         */
        notifyOutgoingListeners(packet) {
            if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
                const listeners = this._anyOutgoingListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, packet.data);
                }
            }
        }
    }

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */
    function Backoff(opts) {
        opts = opts || {};
        this.ms = opts.min || 100;
        this.max = opts.max || 10000;
        this.factor = opts.factor || 2;
        this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
        this.attempts = 0;
    }
    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */
    Backoff.prototype.duration = function () {
        var ms = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
            var rand = Math.random();
            var deviation = Math.floor(rand * this.jitter * ms);
            ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
        }
        return Math.min(ms, this.max) | 0;
    };
    /**
     * Reset the number of attempts.
     *
     * @api public
     */
    Backoff.prototype.reset = function () {
        this.attempts = 0;
    };
    /**
     * Set the minimum duration
     *
     * @api public
     */
    Backoff.prototype.setMin = function (min) {
        this.ms = min;
    };
    /**
     * Set the maximum duration
     *
     * @api public
     */
    Backoff.prototype.setMax = function (max) {
        this.max = max;
    };
    /**
     * Set the jitter
     *
     * @api public
     */
    Backoff.prototype.setJitter = function (jitter) {
        this.jitter = jitter;
    };

    class Manager extends Emitter {
        constructor(uri, opts) {
            var _a;
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            installTimerFunctions(this, opts);
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
            this.backoff = new Backoff({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || parser;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect)
                this.open();
        }
        reconnection(v) {
            if (!arguments.length)
                return this._reconnection;
            this._reconnection = !!v;
            return this;
        }
        reconnectionAttempts(v) {
            if (v === undefined)
                return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
        }
        reconnectionDelay(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
            return this;
        }
        randomizationFactor(v) {
            var _a;
            if (v === undefined)
                return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
            return this;
        }
        reconnectionDelayMax(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
            return this;
        }
        timeout(v) {
            if (!arguments.length)
                return this._timeout;
            this._timeout = v;
            return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
            // Only try to reconnect if it's the first time we're connecting
            if (!this._reconnecting &&
                this._reconnection &&
                this.backoff.attempts === 0) {
                // keeps reconnection from firing twice for the same reconnection loop
                this.reconnect();
            }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
            if (~this._readyState.indexOf("open"))
                return this;
            this.engine = new Socket$1(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = on(socket, "open", function () {
                self.onopen();
                fn && fn();
            });
            // emit `error`
            const errorSub = on(socket, "error", (err) => {
                self.cleanup();
                self._readyState = "closed";
                this.emitReserved("error", err);
                if (fn) {
                    fn(err);
                }
                else {
                    // Only do this if there is no fn to handle the error
                    self.maybeReconnectOnOpen();
                }
            });
            if (false !== this._timeout) {
                const timeout = this._timeout;
                if (timeout === 0) {
                    openSubDestroy(); // prevents a race condition with the 'open' event
                }
                // set timer
                const timer = this.setTimeoutFn(() => {
                    openSubDestroy();
                    socket.close();
                    // @ts-ignore
                    socket.emit("error", new Error("timeout"));
                }, timeout);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
            this.subs.push(openSubDestroy);
            this.subs.push(errorSub);
            return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
            return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            this.emitReserved("open");
            // add new subs
            const socket = this.engine;
            this.subs.push(on(socket, "ping", this.onping.bind(this)), on(socket, "data", this.ondata.bind(this)), on(socket, "error", this.onerror.bind(this)), on(socket, "close", this.onclose.bind(this)), on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
            this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
            this.decoder.add(data);
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
            this.emitReserved("packet", packet);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
            this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
            let socket = this.nsps[nsp];
            if (!socket) {
                socket = new Socket(this, nsp, opts);
                this.nsps[nsp] = socket;
            }
            return socket;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
                const socket = this.nsps[nsp];
                if (socket.active) {
                    return;
                }
            }
            this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
            const encodedPackets = this.encoder.encode(packet);
            for (let i = 0; i < encodedPackets.length; i++) {
                this.engine.write(encodedPackets[i], packet.options);
            }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs.length = 0;
            this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
            this.skipReconnect = true;
            this._reconnecting = false;
            this.onclose("forced close");
            if (this.engine)
                this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
            return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason, description) {
            this.cleanup();
            this.backoff.reset();
            this._readyState = "closed";
            this.emitReserved("close", reason, description);
            if (this._reconnection && !this.skipReconnect) {
                this.reconnect();
            }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
            if (this._reconnecting || this.skipReconnect)
                return this;
            const self = this;
            if (this.backoff.attempts >= this._reconnectionAttempts) {
                this.backoff.reset();
                this.emitReserved("reconnect_failed");
                this._reconnecting = false;
            }
            else {
                const delay = this.backoff.duration();
                this._reconnecting = true;
                const timer = this.setTimeoutFn(() => {
                    if (self.skipReconnect)
                        return;
                    this.emitReserved("reconnect_attempt", self.backoff.attempts);
                    // check again for the case socket closed in above events
                    if (self.skipReconnect)
                        return;
                    self.open((err) => {
                        if (err) {
                            self._reconnecting = false;
                            self.reconnect();
                            this.emitReserved("reconnect_error", err);
                        }
                        else {
                            self.onreconnect();
                        }
                    });
                }, delay);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
            const attempt = this.backoff.attempts;
            this._reconnecting = false;
            this.backoff.reset();
            this.emitReserved("reconnect", attempt);
        }
    }

    /**
     * Managers cache.
     */
    const cache = {};
    function lookup(uri, opts) {
        if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        const parsed = url(uri, opts.path || "/socket.io");
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
        let io;
        if (newConnection) {
            io = new Manager(source, opts);
        }
        else {
            if (!cache[id]) {
                cache[id] = new Manager(source, opts);
            }
            io = cache[id];
        }
        if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
        }
        return io.socket(parsed.path, opts);
    }
    // so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
    // namespace (e.g. `io.connect(...)`), for backward compatibility
    Object.assign(lookup, {
        Manager,
        Socket,
        io: lookup,
        connect: lookup,
    });

    const useSocket = (url) => {
        const socket = lookup(url);
        return socket;
    };

    /* src\App.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;

    // (18:0) {:else}
    function create_else_block(ctx) {
    	let notlogged;
    	let current;

    	notlogged = new NotLogged({
    			props: {
    				PROXY: /*PROXY*/ ctx[2],
    				socket: /*socket*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(notlogged.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notlogged, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notlogged.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notlogged.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notlogged, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:0) {#if loggedIn}
    function create_if_block(ctx) {
    	let dashboard;
    	let current;

    	dashboard = new Dashboard({
    			props: {
    				userData: /*userData*/ ctx[1],
    				socket: /*socket*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(dashboard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dashboard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dashboard_changes = {};
    			if (dirty & /*userData*/ 2) dashboard_changes.userData = /*userData*/ ctx[1];
    			dashboard.$set(dashboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dashboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dashboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dashboard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:0) {#if loggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*loggedIn*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty$1();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const PROXY = window.location.href;

    	// const PROXY = "http://localhost:4000/";
    	const socket = useSocket(PROXY);

    	let loggedIn = false;
    	let userData;

    	socket.on("login", data => {
    		console.log(data);
    		$$invalidate(1, userData = data);
    		$$invalidate(0, loggedIn = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Dashboard,
    		NotLogged,
    		useSocket,
    		PROXY,
    		socket,
    		loggedIn,
    		userData
    	});

    	$$self.$inject_state = $$props => {
    		if ('loggedIn' in $$props) $$invalidate(0, loggedIn = $$props.loggedIn);
    		if ('userData' in $$props) $$invalidate(1, userData = $$props.userData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loggedIn, userData, PROXY, socket];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    // @ts-ignore
    // const app = new App({
    // 	target: document.body,
    // 	props: {
    // 		name: 'world'
    // 	}
    // });
    const app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
