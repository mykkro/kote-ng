
function isPhoneGap() {
    return (window.cordova || window.PhoneGap || window.phonegap)
        && /^file:\/{3}[^\/]/i.test(window.location.href)
        && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent);
}

var r = null;
var DEBUG = false;
var MOBILE = isPhoneGap();


// ─── SVG element wrapper ─────────────────────────────────────────────────────
// Wraps a native SVG element with a Raphael-compatible API surface.
// Used by the three game scripts (differences, combine-words, sudoku) that call
// r.circle() / r.rect() / r.line() directly.

function SvgElem(svgEl) {
    this.node = svgEl;
    this.attrs = {};
}

SvgElem.prototype.attr = function(key, val) {
    if (typeof key === 'object') {
        for (var k in key) { this._setAttr(k, key[k]); }
        return this;
    }
    if (val !== undefined) {
        this._setAttr(key, val);
        return this;
    }
    return this.attrs[key];
};

SvgElem.prototype._setAttr = function(k, v) {
    this.attrs[k] = v;
    if (k === 'text') {
        this.node.textContent = v;
    } else if (k === 'src') {
        // Raphael uses 'src' for image URLs; SVG uses 'href'
        this.node.setAttribute('href', v);
    } else if (k === 'arrow-end') {
        this.node.setAttribute('marker-end', 'url(#kote-arrow-end)');
    } else if (k === 'arrow-start') {
        this.node.setAttribute('marker-start', 'url(#kote-arrow-start)');
    } else {
        this.node.setAttribute(k, v);
    }
};

SvgElem.prototype.remove = function() {
    if (this.node.parentNode) this.node.parentNode.removeChild(this.node);
};

SvgElem.prototype.show = function() {
    this.node.style.display = '';
    return this;
};

SvgElem.prototype.hide = function() {
    this.node.style.display = 'none';
    return this;
};

SvgElem.prototype.mousedown = function(cb) {
    this.node.style.pointerEvents = 'all';
    this.node.addEventListener('mousedown', cb);
    return this;
};

SvgElem.prototype.touchstart = function(cb) {
    this.node.style.pointerEvents = 'all';
    this.node.addEventListener('touchstart', cb);
    return this;
};

SvgElem.prototype.click = function(cb) {
    this.node.style.pointerEvents = 'all';
    this.node.addEventListener('click', cb);
    return this;
};

SvgElem.prototype.getBBox = function() {
    try { return this.node.getBBox(); } catch (e) { return { x: 0, y: 0, width: 0, height: 0 }; }
};

SvgElem.prototype.transform = function() { return this; };
SvgElem.prototype.animate   = function() { return this; };


// ─── SVG Set ─────────────────────────────────────────────────────────────────
// Raphael-compatible collection object.  Games access .items[] directly.

function SvgSet() {
    this.items = [];  // Raphael-compatible public array
}

SvgSet.prototype.push = function(el) { this.items.push(el); return this; };
SvgSet.prototype.pop  = function()   { return this.items.pop(); };

SvgSet.prototype.forEach = function(cb) {
    this.items.forEach(cb);
    return this;
};

SvgSet.prototype.exclude = function(el) {
    var i = this.items.indexOf(el);
    if (i >= 0) this.items.splice(i, 1);
    return this;
};

SvgSet.prototype.remove = function() {
    this.items.forEach(function(el) { el.remove && el.remove(); });
    this.items = [];
};

SvgSet.prototype.clear = function() { this.remove(); };

SvgSet.prototype.getBBox = function() {
    var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    this.items.forEach(function(el) {
        var bb = el.getBBox ? el.getBBox() : null;
        if (bb) {
            x1 = Math.min(x1, bb.x);
            y1 = Math.min(y1, bb.y);
            x2 = Math.max(x2, bb.x + bb.width);
            y2 = Math.max(y2, bb.y + bb.height);
        }
    });
    return { x: x1, y: y1, x2: x2, y2: y2, width: x2 - x1, height: y2 - y1 };
};

SvgSet.prototype.attr      = function(a) { this.items.forEach(function(el) { el.attr && el.attr(a); }); return this; };
SvgSet.prototype.transform = function()  { return this; };
SvgSet.prototype.animate   = function()  { return this; };


// ─── DOMPaper ────────────────────────────────────────────────────────────────
// Replaces the Raphael paper object.
//   r.el      → the #paper div (all widget <div>s are appended here)
//   r._svg    → a <svg> overlay for direct SVG calls from game scripts

function DOMPaper(containerEl) {
    this.el   = containerEl;
    this._svg = null;
}

DOMPaper.prototype._getSvg = function() {
    if (!this._svg) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 1000 1000');
        svg.id = 'svg-layer';
        svg.style.cssText = 'position:absolute;top:0;left:0;width:1000px;height:1000px;' +
                            'pointer-events:none;z-index:1;overflow:visible;';
        // Arrow marker definitions used by combine-words (r.line + arrow-end/arrow-start)
        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML =
            '<marker id="kote-arrow-end" markerUnits="userSpaceOnUse" markerWidth="24" markerHeight="16" ' +
            '  refX="24" refY="8" orient="auto">' +
            '  <polygon points="0 0, 24 8, 0 16" fill="context-stroke"/>' +
            '</marker>' +
            '<marker id="kote-arrow-start" markerUnits="userSpaceOnUse" markerWidth="24" markerHeight="16" ' +
            '  refX="0" refY="8" orient="auto-start-reverse">' +
            '  <polygon points="0 0, 24 8, 0 16" fill="context-stroke"/>' +
            '</marker>';
        svg.appendChild(defs);
        this.el.appendChild(svg);
        this._svg = svg;
    }
    return this._svg;
};

DOMPaper.prototype._makeSvgEl = function(type) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', type);
    this._getSvg().appendChild(el);
    return new SvgElem(el);
};

DOMPaper.prototype.clear = function() {
    this.el.innerHTML = '';
    this._svg = null;
};

// ── factory methods used by game scripts ──

DOMPaper.prototype.set = function() { return new SvgSet(); };

DOMPaper.prototype.rect = function(x, y, w, h, radius) {
    var el = this._makeSvgEl('rect');
    el.node.setAttribute('x', x);
    el.node.setAttribute('y', y);
    el.node.setAttribute('width', w);
    el.node.setAttribute('height', h);
    if (radius) el.node.setAttribute('rx', radius);
    el.attrs.x = x; el.attrs.y = y; el.attrs.width = w; el.attrs.height = h;
    return el;
};

DOMPaper.prototype.circle = function(cx, cy, rad) {
    var el = this._makeSvgEl('circle');
    el.node.setAttribute('cx', cx);
    el.node.setAttribute('cy', cy);
    el.node.setAttribute('r', rad);
    return el;
};

DOMPaper.prototype.line = function(x1, y1, x2, y2) {
    var el = this._makeSvgEl('line');
    el.node.setAttribute('x1', x1);
    el.node.setAttribute('y1', y1);
    el.node.setAttribute('x2', x2);
    el.node.setAttribute('y2', y2);
    return el;
};

DOMPaper.prototype.ellipse = function(cx, cy, rx, ry) {
    var el = this._makeSvgEl('ellipse');
    el.node.setAttribute('cx', cx);
    el.node.setAttribute('cy', cy);
    el.node.setAttribute('rx', rx);
    el.node.setAttribute('ry', ry);
    return el;
};

DOMPaper.prototype.text = function(x, y, text) {
    var el = this._makeSvgEl('text');
    el.node.setAttribute('x', x);
    el.node.setAttribute('y', y);
    el.node.textContent = text;
    return el;
};

DOMPaper.prototype.path = function(d) {
    var el = this._makeSvgEl('path');
    el.node.setAttribute('d', Array.isArray(d) ? d.join(' ') : d);
    return el;
};

DOMPaper.prototype.image = function(url, x, y, width, height) {
    var el = this._makeSvgEl('image');
    el.node.setAttribute('href', url);
    el.node.setAttribute('x', x);
    el.node.setAttribute('y', y);
    el.node.setAttribute('width', width);
    el.node.setAttribute('height', height);
    el.attrs.x = x; el.attrs.y = y; el.attrs.width = width; el.attrs.height = height;
    return el;
};


// ─── Style helpers ───────────────────────────────────────────────────────────

// Maps SVG-style attr names (fill, stroke, …) to CSS on a plain <div>.
function _applyRectStyle(el, attr) {
    for (var key in attr) {
        var v = attr[key];
        if      (key === 'fill')         el.style.backgroundColor = (v === 'none') ? 'transparent' : v;
        else if (key === 'stroke')       el.style.borderColor     = (v === 'none') ? 'transparent' : v;
        else if (key === 'stroke-width') el.style.borderWidth     = (parseInt(v) || 0) + 'px';
        else if (key === 'opacity')      el.style.opacity         = v;
        else if (key === 'fill-opacity') el.style.opacity         = v;
    }
}

// Uses Canvas 2D to measure rendered text width (avoids DOM append/measure round-trip).
function _measureTextWidth(text, fontFamily, fontSize, fontWeight) {
    var canvas = document.createElement('canvas');
    var ctx    = canvas.getContext('2d');
    ctx.font   = (fontWeight || 'normal') + ' ' + fontSize + 'px ' + (fontFamily || 'Helvetica');
    return ctx.measureText(text || '').width;
}


// ─── Widget ──────────────────────────────────────────────────────────────────

class Widget extends Base {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.el = document.createElement('div');
        this.el.style.position = 'absolute';
        this.el.style.left = '0px';
        this.el.style.top  = '0px';
        r.el.appendChild(this.el);
    }
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.el.style.left = x + 'px';
        this.el.style.top  = y + 'px';
    }
    setStyle(attr) {
        this.style = attr;
    }
    clear() {
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }
    static layoutButtons(buttons, gap, y) {
        var totalWidth = 0;
        buttons.forEach(function(b) {
            if (totalWidth) totalWidth += gap;
            totalWidth += b.w;
        });
        var xx = (1000 - totalWidth) / 2;
        buttons.forEach(function(b) {
            b.setPosition(xx, y);
            xx += b.w + gap;
        });
    }
}


// ─── SizedWidget ─────────────────────────────────────────────────────────────

class SizedWidget extends Widget {
    constructor(w, h) {
        super();
        this.w = w;
        this.h = h;
    }
}


// ─── ButtonWidget ─────────────────────────────────────────────────────────────

class ButtonWidget extends Widget {
    constructor(text, options) {
        super();
        var o = options || {};
        o.backgroundStyle          = Object.assign({}, ButtonWidget.backgroundStyle,          o.backgroundStyle);
        o.clickedBackgroundStyle   = Object.assign({}, ButtonWidget.clickedBackgroundStyle,   o.clickedBackgroundStyle);
        o.highlightedBackgroundStyle = Object.assign({}, ButtonWidget.highlightedBackgroundStyle, o.highlightedBackgroundStyle);
        o.disabledBackgroundStyle  = Object.assign({}, ButtonWidget.disabledBackgroundStyle,  o.disabledBackgroundStyle);
        o.fontSize   = o.fontSize   || 40;
        o.fontFamily = o.fontFamily || 'Helvetica';
        o.fontWeight = o.fontWeight || 'normal';
        o.border     = o.border     || 20;
        o.radius     = o.radius     || 30;
        this.o    = o;
        this.text = text;
        this._buildElement();
    }
    _buildElement() {
        var o = this.o;
        Object.assign(this.el.style, {
            display:         'inline-flex',
            alignItems:      'center',
            justifyContent:  'center',
            padding:         o.border + 'px',
            borderRadius:    o.radius + 'px',
            backgroundColor: o.backgroundStyle.fill,
            border:          (o.backgroundStyle['stroke-width'] || 2) + 'px solid ' + (o.backgroundStyle.stroke || '#333'),
            fontFamily:      o.fontFamily,
            fontSize:        o.fontSize + 'px',
            fontWeight:      o.fontWeight,
            color:           'black',
            cursor:          'pointer',
            userSelect:      'none',
            whiteSpace:      'nowrap',
            boxSizing:       'border-box',
            zIndex:          '10'
        });
        this.el.textContent = this.text;
        // offsetWidth forces synchronous layout — el is already in r.el
        this.w = this.el.offsetWidth;
        this.h = this.el.offsetHeight;
        var self = this;
        this.el.addEventListener(MOBILE ? 'touchstart' : 'mousedown', function() {
            if (!self.disabled) self.onClick();
        });
    }
    setEnabled(flag) { this.setDisabled(!flag); }
    setDisabled(flag) {
        this.disabled = flag;
        var st = flag ? this.o.disabledBackgroundStyle : this.o.backgroundStyle;
        this.el.style.backgroundColor = st.fill;
    }
    setHighlighted(flag, style) {
        var st = this.o.backgroundStyle;
        if (flag) st = Object.assign({}, this.o.highlightedBackgroundStyle, style);
        this.highlighted = flag;
        this.el.style.backgroundColor = st.fill;
        if (st.stroke) this.el.style.borderColor = st.stroke;
    }
    onClick(val) {
        if (typeof val === 'function') {
            this._onClick = val;
        } else {
            var self = this;
            if (self._beforeClick) self._beforeClick(self);
            var origBg = self.o.backgroundStyle.fill;
            self.el.style.backgroundColor = self.o.clickedBackgroundStyle.fill;
            setTimeout(function() {
                self.el.style.backgroundColor = origBg;
                if (self._onClick) self._onClick(self);
                setTimeout(function() {
                    if (self._onClickAnimationComplete) self._onClickAnimationComplete(self);
                }, 100);
            }, 100);
        }
    }
    onClickAnimationComplete(val) {
        if (typeof val === 'function') {
            this._onClickAnimationComplete = val;
        } else {
            if (this._onClickAnimationComplete) this._onClickAnimationComplete(this);
        }
    }
    static backgroundStyle          = { fill: '#aac', stroke: '#333', 'stroke-width': 2 };
    static clickedBackgroundStyle   = { fill: '#77a', stroke: '#333', 'stroke-width': 2 };
    static highlightedBackgroundStyle = { fill: '#c66', stroke: '#333', 'stroke-width': 2 };
    static disabledBackgroundStyle  = { fill: '#eee', stroke: '#333', 'stroke-width': 2 };
}


// ─── RoundButtonWidget ────────────────────────────────────────────────────────

class RoundButtonWidget extends ButtonWidget {
    constructor(text, options) {
        super(text, options);
    }
    _buildElement() {
        var o = this.o;
        o.fontSize   = o.fontSize   || 50;
        o.fontWeight = o.fontWeight || 'bold';
        o.border     = o.border     || 10;
        var measuredW = _measureTextWidth(this.text, o.fontFamily, o.fontSize, o.fontWeight);
        var measuredH = o.fontSize * 1.2;
        var minDiam   = Math.ceil(Math.max(measuredW + 2 * o.border, measuredH + 2 * o.border));
        o.radius = o.radius || minDiam;
        var diam = o.radius * 2;
        Object.assign(this.el.style, {
            display:         'inline-flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           diam + 'px',
            height:          diam + 'px',
            borderRadius:    '50%',
            backgroundColor: o.backgroundStyle.fill,
            border:          (o.backgroundStyle['stroke-width'] || 2) + 'px solid ' + (o.backgroundStyle.stroke || '#333'),
            fontFamily:      o.fontFamily || 'Helvetica',
            fontSize:        o.fontSize + 'px',
            fontWeight:      o.fontWeight,
            color:           'black',
            cursor:          'pointer',
            userSelect:      'none',
            boxSizing:       'border-box',
            zIndex:          '10'
        });
        this.el.textContent = this.text;
        this.w = diam;
        this.h = diam;
        var self = this;
        this.el.addEventListener(MOBILE ? 'touchstart' : 'mousedown', function() {
            if (!self.disabled) self.onClick();
        });
    }
}


// ─── ResizableWidget ─────────────────────────────────────────────────────────

class ResizableWidget extends SizedWidget {
    constructor(w, h) {
        super(w, h);
    }
    setSize(w, h) {
        this.w = w;
        this.h = h;
    }
}


// ─── RectWidget ──────────────────────────────────────────────────────────────

class RectWidget extends ResizableWidget {
    constructor(w, h, radius) {
        super(w, h);
        this.el.style.width      = w + 'px';
        this.el.style.height     = h + 'px';
        this.el.style.boxSizing  = 'border-box';
        if (radius) this.el.style.borderRadius = radius + 'px';
        this.setStyle({ stroke: 'red', fill: 'white' });
    }
    setStyle(attr) {
        this.style = Object.assign(this.style || {}, attr);
        _applyRectStyle(this.el, attr);
    }
    setSize(w, h) {
        super.setSize(w, h);
        this.el.style.width  = w + 'px';
        this.el.style.height = h + 'px';
    }
}


// ─── CircleWidget ─────────────────────────────────────────────────────────────

class CircleWidget extends ResizableWidget {
    constructor(radius) {
        super(2 * radius, 2 * radius);
        this.radius = radius;
        this.el.style.width        = (2 * radius) + 'px';
        this.el.style.height       = (2 * radius) + 'px';
        this.el.style.borderRadius = '50%';
        this.el.style.boxSizing    = 'border-box';
        this.setStyle({ stroke: 'red', fill: 'white' });
    }
    setStyle(attr) {
        this.style = Object.assign(this.style || {}, attr);
        _applyRectStyle(this.el, attr);
    }
    setRadius(newRadius) {
        this.radius = newRadius;
        this.w = 2 * newRadius;
        this.h = 2 * newRadius;
        this.el.style.width  = this.w + 'px';
        this.el.style.height = this.h + 'px';
    }
    setSize(w, h) {
        super.setSize(w, h);
    }
}


// ─── PieWidget (sector via conic-gradient) ────────────────────────────────────

// sector() kept for backward compat — still usable via the SVG shim if needed.
function sector(cx, cy, radius, startAngle, endAngle, params) {
    var rad = Math.PI / 180;
    var x1  = cx + radius * Math.cos(-startAngle * rad);
    var x2  = cx + radius * Math.cos(-endAngle   * rad);
    var y1  = cy + radius * Math.sin(-startAngle * rad);
    var y2  = cy + radius * Math.sin(-endAngle   * rad);
    return r.path(
        ['M', cx, cy, 'L', x1, y1, 'A', radius, radius, 0,
         +(endAngle - startAngle > 180), 0, x2, y2, 'z'].join(' ')
    ).attr(params || {});
}

class PieWidget extends ResizableWidget {
    constructor(radius, startAngle, endAngle) {
        super(2 * radius, 2 * radius);
        this.radius     = radius;
        this.startAngle = startAngle;
        this.endAngle   = endAngle;
        this._pieStyle  = { stroke: 'none', fill: 'white' };
        this.el.style.width        = (2 * radius) + 'px';
        this.el.style.height       = (2 * radius) + 'px';
        this.el.style.borderRadius = '50%';
        this._updatePie();
    }
    _updatePie() {
        var fill = this._pieStyle.fill || 'white';
        if (fill === 'none') fill = 'transparent';
        // CSS conic-gradient starts from north; Raphael angles start from east.
        var s = this.startAngle - 90;
        var e = this.endAngle   - 90;
        this.el.style.background =
            'conic-gradient(transparent ' + s + 'deg, ' + fill + ' ' + s + 'deg ' + e + 'deg, transparent ' + e + 'deg)';
    }
    setStyle(attr) {
        this._pieStyle = Object.assign(this._pieStyle, attr);
        this._updatePie();
    }
    setAngles(startAngle, endAngle) {
        this.startAngle = startAngle;
        this.endAngle   = endAngle;
        this._updatePie();
    }
}


// ─── TextWidget ───────────────────────────────────────────────────────────────

class TextWidget extends Widget {
    constructor(maxWidth, fontSize, anchor, text) {
        super();
        this.maxWidth = maxWidth;
        this.fontSize = fontSize;
        this.anchor   = anchor;
        Object.assign(this.el.style, {
            width:      maxWidth + 'px',
            fontSize:   fontSize + 'px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            lineHeight: (fontSize * 1.35) + 'px',
            whiteSpace: 'pre-wrap',
            wordWrap:   'break-word',
            textAlign:  anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left',
            color:        'black',   // SVG text defaulted to black; match that here
            zIndex:       '3',       // render above SVG layer (z:1) and Clickable (z:2)
            pointerEvents:'none'     // let clicks pass through to Clickable beneath
        });
        this.setText(text || '');
    }
    setText(text) {
        this.text = text || '';
        this.el.textContent = this.text;
    }
    setStyle(attr) {
        this.style = attr;
        for (var key in attr) {
            var v = attr[key];
            if      (key === 'fill')        this.el.style.color      = (v === 'none') ? 'transparent' : v;
            else if (key === 'font-size')   this.el.style.fontSize   = v + 'px';
            else if (key === 'font-family') this.el.style.fontFamily = v;
            else if (key === 'font-weight') this.el.style.fontWeight = v;
        }
    }
    setCssClass(css) {
        this.el.className = css;
    }
    getTextboxSize() {
        return { width: this.el.offsetWidth, height: this.el.offsetHeight };
    }
}


// ─── ImageWidget ──────────────────────────────────────────────────────────────

class ImageWidget extends ResizableWidget {
    constructor(url, width, height) {
        super(width, height);
        this.el.style.width    = width  + 'px';
        this.el.style.height   = height + 'px';
        this.el.style.overflow = 'hidden';
        this.image = document.createElement('img');
        this.image.src = url;
        Object.assign(this.image.style, {
            width:          width  + 'px',
            height:         height + 'px',
            display:        'block',
            pointerEvents:  'none',
            transition:     ''
        });
        // Raphael-compatible animate() shim used by memory-game
        this.image.animate = function(attrs, duration, callback) {
            var el = this;
            var ms = duration || 200;
            el.style.transition = 'opacity ' + ms + 'ms';
            if ('opacity' in attrs) el.style.opacity = attrs.opacity;
            if (callback) setTimeout(function() { callback(); }, ms);
        };
        this.el.appendChild(this.image);
    }
    setSize(w, h) {
        super.setSize(w, h);
        this.el.style.width      = w + 'px';
        this.el.style.height     = h + 'px';
        this.image.style.width   = w + 'px';
        this.image.style.height  = h + 'px';
    }
    setSrc(url)  { this.image.src = url; }
    getSrc()     { return this.image.src; }
    setBlank()   { this.setSrc('assets/blank.png'); }
}


// ─── Clickable ────────────────────────────────────────────────────────────────
// Wraps a child widget and forwards pointer events to it.
// The child's el is re-parented inside this widget's el; child coordinates
// are then relative to the Clickable's origin (matches Raphael set behaviour).

class Clickable extends SizedWidget {
    constructor(child) {
        super(child.w, child.h);
        this.child = child;
        this.el.style.width  = child.w + 'px';
        this.el.style.height = child.h + 'px';
        this.el.style.cursor = 'pointer';
        this.el.style.zIndex = '2';
        // Adopt child — move it from r.el into this container.
        // Games often call child.setPosition(x,y) BEFORE wrapping in Clickable.
        // We inherit that position for the Clickable itself and reset the child to (0,0).
        if (child.el.parentNode) child.el.parentNode.removeChild(child.el);
        child.el.style.left = '0px';
        child.el.style.top  = '0px';
        child.el.style.pointerEvents = 'none';
        this.el.appendChild(child.el);
        // Place the Clickable where the child was so the hit area matches the visual.
        this.setPosition(child.x, child.y);
        var self = this;
        this.el.addEventListener(MOBILE ? 'touchstart' : 'mousedown', function(e) {
            if (!self.disabled) self.onClick(e);
        });
    }
    _getMouseCoordinates(e) {
        var bnds = e.currentTarget.getBoundingClientRect();
        var fx = (e.clientX - bnds.left) / bnds.width  * this.w;
        var fy = (e.clientY - bnds.top)  / bnds.height * this.h;
        return { x: fx, y: fy };
    }
    onClick(val) {
        if (typeof val === 'function') {
            this._onClick = val;
        } else {
            if (this._onClick) this._onClick(this, val);
        }
    }
    clear() {
        this.child.clear();
        super.clear();
    }
}


// ─── GroupWidget ──────────────────────────────────────────────────────────────
// Container widget.  addChild() re-parents the child's el inside the group's el
// so child coordinates are relative to the group (mirrors Raphael set transforms).

class GroupWidget extends Widget {
    constructor(children) {
        super();
        this.children = [];
        var self = this;
        (children || []).forEach(function(c) { self.addChild(c); });
    }
    addChild(widget) {
        this.children.push(widget);
        if (widget.el && widget.el.parentNode) widget.el.parentNode.removeChild(widget.el);
        this.el.appendChild(widget.el);
    }
    clearContents() {
        this.children.forEach(function(c) { c.clear(); });
        this.children = [];
    }
}


// ─── AppPreviewWidget ─────────────────────────────────────────────────────────

class AppPreviewWidget extends Widget {
    constructor(previewUrl, title, _subtitle, tags, size) {
        super();
        size = size || 250;
        var a    = size / 250;
        var imgS = Math.floor(150 * a);
        var rSm  = Math.floor(5  * a);
        var rBig = Math.floor(30 * a);
        var pad  = Math.floor(10 * a);
        Object.assign(this.el.style, {
            width:           size + 'px',
            height:          size + 'px',
            backgroundColor: 'rgba(255,255,255,0.6)',
            borderRadius:    rSm + 'px ' + rSm + 'px ' + rBig + 'px ' + rSm + 'px',
            cursor:          'pointer',
            overflow:        'hidden',
            display:         'flex',
            flexDirection:   'column',
            alignItems:      'center',
            justifyContent:  'center',
            padding:         pad + 'px',
            boxSizing:       'border-box',
            userSelect:      'none',
            zIndex:          '10'
        });
        var img = document.createElement('img');
        img.src = previewUrl;
        img.style.cssText = 'width:' + imgS + 'px;height:' + imgS + 'px;display:block;pointer-events:none;flex-shrink:0;';
        this.el.appendChild(img);

        var titleEl = document.createElement('div');
        titleEl.textContent = title;
        titleEl.style.cssText = 'font-size:' + Math.floor(22 * a) + 'px;color:#000;text-align:center;' +
            'margin-top:' + Math.floor(8 * a) + 'px;pointer-events:none;overflow:hidden;width:100%;word-wrap:break-word;';
        this.el.appendChild(titleEl);

        var tagsEl = document.createElement('div');
        tagsEl.textContent = (tags || []).join(', ');
        tagsEl.style.cssText = 'font-size:' + Math.floor(14 * a) + 'px;color:blue;text-align:center;' +
            'margin-top:' + Math.floor(4 * a) + 'px;pointer-events:none;overflow:hidden;width:100%;';
        this.el.appendChild(tagsEl);

        this.w = size;
        this.h = size;
        var self = this;
        this.el.addEventListener(MOBILE ? 'touchstart' : 'mousedown', function() {
            if (!self.disabled) self.onClick();
        });
    }
    onClick(val) {
        if (typeof val === 'function') {
            this._onClick = val;
        } else {
            if (this._onClick) this._onClick(this);
        }
    }
    static backgroundStyle = { fill: 'white', stroke: 'none', opacity: 0.6 };
}
