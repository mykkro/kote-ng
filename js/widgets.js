
function isPhoneGap() {
    return (window.cordova || window.PhoneGap || window.phonegap) 
    && /^file:\/{3}[^\/]/i.test(window.location.href) 
    && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent);
}


var r = null;
var DEBUG = false;
var MOBILE = isPhoneGap();

// basic UI widget
var Widget = Base.extend({
    constructor: function() {
        this.x = 0;
        this.y = 0;
        this.root = r.set();
    },
    setPosition: function(x, y) {
        this.x = x;
        this.y = y;
        this.root.transform("T"+x+","+y);
    },
    setStyle: function(attr) {
        // apply your styles here...
        this.style = attr;
    },
    clear: function() {        
        r.wipe(this.root);
    }
}, {
    // global styles/utility functions
    layoutButtons: function(buttons, gap, y) {
        var totalWidth = 0;
        buttons.forEach(function(b) {
            if(totalWidth) totalWidth += gap;
            totalWidth += b.w;
        });
        xx = (1000-totalWidth)/2;
        buttons.forEach(function(b) {
            b.setPosition(xx, y);
            xx += b.w + gap;
        });
    }
});

// UI widget with defined dimensions
var SizedWidget = Widget.extend({
    constructor: function(w, h) {
        this.base();
        this.w = w;
        this.h = h;
    }
});

// bb = new ButtonWidget("Hello, world", 20, 10, 20)
var ButtonWidget = Widget.extend({
    constructor: function(text, options) {
        this.base();
        var o = options || {};
        o.backgroundStyle = Object.assign({}, ButtonWidget.backgroundStyle, o.backgroundStyle);
        o.clickedBackgroundStyle = Object.assign({}, ButtonWidget.clickedBackgroundStyle, o.clickedBackgroundStyle);
        o.highlightedBackgroundStyle = Object.assign({}, ButtonWidget.highlightedBackgroundStyle, o.highlightedBackgroundStyle);
        o.disabledBackgroundStyle = Object.assign({}, ButtonWidget.disabledBackgroundStyle, o.disabledBackgroundStyle);
        o.fontSize = o.fontSize || 40;
        o.fontFamily = o.fontFamily || "Helvetica";
        o.fontWeight = o.fontWeight || "normal",
        o.textStyle = {"font-family" : o.fontFamily, "font-size" : o.fontSize, "font-weight": o.fontWeight, "text-anchor" : "start"};
        this.o = o;
        this.text = text;
        this.createElement();
    },
    createElement: function() {
        var o = this.o;
        var text = this.text;
        o.border = o.border || 20;
        o.radius = o.radius || 30;
        var anchor = o.anchor;
        var border = o.border;
        var radius = o.radius;
        var ttt = r.text(0,0,text).attr(this.o.textStyle);
        var bbox = ttt.node.getBBox();
        var tw = bbox.width;
        var th = bbox.height;
        var tx = bbox.x;
        var ty = bbox.y;
        var x = 0;
        var y = 0;
        this.dx = border - tx;
        this.dy = border - ty;
        this.ttt = ttt;
        ttt.transform("T"+(x + this.dx)+","+(y + this.dy));
        var rrr = r.rect(x, y, tw+2*border, th+2*border, radius).attr(this.o.backgroundStyle);
        ttt.toFront();
        this.rrr = rrr;
        this.buttonBackground = rrr;
        var bbb = r.rect(x, y, tw+2*border, th+2*border, radius).attr(ButtonWidget.emptyStyle);    
        bbb.node.setAttribute("class","svgbutton");
        this.root.push(rrr);
        this.root.push(ttt);
        this.root.push(bbb);   
        var self = this; 
        // use Raphael's touch events
        if(MOBILE) {
            bbb.touchstart(function(e) {
                if(!self.disabled) {
                    self.onClick();
                }
            });
        } else {
            bbb.mousedown(function(e) {
                if(!self.disabled) {
                    self.onClick();
                }
            });            
        }
        this.w = tw+2*border;
        this.h = th + 2*border;
    },
    setPosition: function(x, y) {
        this.base(x, y);
        this.ttt.transform("T"+(x + this.dx)+","+(y + this.dy));
    },
    setEnabled: function(flag) {
        this.setDisabled(!flag);
    },
    setDisabled: function(flag) {
        this.disabled = flag;
        this.buttonBackground.attr(flag 
            ? this.o.disabledBackgroundStyle 
            : this.o.backgroundStyle);
    },
    setHighlighted: function(flag, style) {
        var st = this.o.backgroundStyle;
        if(flag) {
            st = Object.assign(this.o.highlightedBackgroundStyle, style);
        }
        this.highlighted = flag;
        this.buttonBackground.attr(st);
    },
    onClick: function(val) {
        if(typeof(val)=="function") {
            this._onClick = val;
        } else {
            // animate button
            var self = this;            
            if(self._beforeClick) self._beforeClick(self);
            var originalBackgroundStyle = self.buttonBackground.attr();
            self.buttonBackground.animate(self.o.clickedBackgroundStyle, 100, ">", function() {
                self.buttonBackground.animate(originalBackgroundStyle, 100, "<", function() {            
                    if(self._onClickAnimationComplete) self._onClickAnimationComplete(self);
                });
                if(self._onClick) self._onClick(self);
            });
        }
    },
    // TODO change it - way too complicated...
    onClickAnimationComplete: function(val) {
        if(typeof(val)=="function") {
            this._onClickAnimationComplete = val;
        } else {
            var self = this;            
            if(self._onClickAnimationComplete) self._onClickAnimationComplete(self);
        }
    }
}, {
    emptyStyle: {"fill": "none", "stroke":"none"},
    backgroundStyle: {"fill": "#aac", "stroke":"#333", "stroke-width": 2},
    clickedBackgroundStyle: {"fill": "#77a", "stroke":"#333", "stroke-width": 2},
    highlightedBackgroundStyle: {"fill": "#c66", "stroke":"#333", "stroke-width": 2},
    disabledBackgroundStyle: {"fill": "#eee", "stroke":"#333", "stroke-width": 2}
});

//var aa = new RoundButtonWidget(100, 100, {"class":klazz, "backgroundColor":"cyan"}, caption);
var RoundButtonWidget = ButtonWidget.extend({
    constructor: function(text, options) {
        this.base(text, options);
    },
    createElement: function() {
        var o = this.o;
        var text = this.text;
        o.rotation = o.rotation || 0;
        this.rotation = o.rotation;
        o.fontSize = o.fontSize || 50;
        o.fontWeight = o.fontWeight || 'bold';
        o.border = o.border || 10;
        var anchor = o.anchor;
        var border = o.border;
        var radius = o.radius;
        var ttt = r.text(0,0,text).attr(this.o.textStyle);
        var bbox = ttt.node.getBBox();
        var tw = bbox.width;
        var th = bbox.height;
        var tx = bbox.x;
        var ty = bbox.y;
        var x = 0;
        var y = 0;
        o.radius = o.radius || Math.max(tw+2*border, th+2*border);
        this.dx = -tw/2;
        this.dy = 0;
        this.ttt = ttt;
        ttt.transform("T"+(x + this.dx)+","+(y + this.dy));
        var rrr = r.circle(x, y, o.radius).attr(this.o.backgroundStyle);
        ttt.toFront();
        this.rrr = rrr;
        var bbb = r.circle(x, y, o.radius).attr(ButtonWidget.emptyStyle);    
        bbb.node.setAttribute("class","svgbutton");
        this.buttonBackground = rrr;
        this.root.push(rrr);
        this.root.push(ttt);
        this.root.push(bbb);   
        var self = this; 
        // use Raphael's touch events
        if(MOBILE) {
            bbb.touchstart(function(e) {
                if(!self.disabled) {
                    self.onClick();
                }
            });
        } else {
            bbb.mousedown(function(e) {
                if(!self.disabled) {
                    self.onClick();
                }
            });            
        }
        this.w = o.radius;
        this.h = o.radius;
    },
    setPosition: function(x, y) {
        this.base(x, y);
        this.root.rotate(this.rotation);
    }
});


// resizable UI widget with defined dimensions
var ResizableWidget = SizedWidget.extend({
    constructor: function(w, h) {
        this.base(w, h);
    },
    setSize: function(w, h) {
        this.w = w;
        this.h = h;
    }
});

// dummy widget - simple rectangle
var RectWidget = ResizableWidget.extend({
    constructor: function(w, h, radius) {
        this.base(w, h);
        this.shape = r.rect(this.x, this.y, this.w, this.h, radius);
        this.setStyle({"stroke": "red", "fill": "white"});
        this.root.push(this.shape);
    },
    setStyle: function(attr) {
        this.base(attr);
        this.shape.attr(attr);
    },
    setSize: function(w, h) {
        this.base(w, h);
        this.shape.attr({"width": this.w, "height": this.h});
    }
});

// dummy widget - simple circle
var CircleWidget = ResizableWidget.extend({
    constructor: function(radius) {
        this.radius = radius;
        this.base(2*radius, 2*radius);
        this.x = radius;
        this.y = radius;
        this.shape = r.circle(this.x, this.y, this.radius);
        this.setStyle({"stroke": "red", "fill": "white"});
        this.root.push(this.shape);
    },
    setStyle: function(attr) {
        this.base(attr);
        this.shape.attr(attr);
    },
    setRadius: function(r) {
        var x = this.x - this.radius;
        var y = this.y - this.radius;
        this.radius = r;
        this.setPosition(x + this.radius, y + this.radius);
        this.setSize(x + this.radius, y + this.radius);
        this.shape.attr({"r": this.radius});
    },
    // do not call tjhis directly
    // use setRadius instead
    setSize: function(w, h) {
        this.base(w, h);
    }
});

function sector(cx, cy, radius, startAngle, endAngle, params) {
    var rad = Math.PI / 180;
    var x1 = cx + radius * Math.cos(-startAngle * rad),
        x2 = cx + radius * Math.cos(-endAngle * rad),
        y1 = cy + radius * Math.sin(-startAngle * rad),
        y2 = cy + radius * Math.sin(-endAngle * rad);
    return r.path(["M", cx, cy, "L", x1, y1, "A", radius, radius, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
}

var PieWidget = ResizableWidget.extend({
    constructor: function(radius, startAngle, endAngle) {
        this.radius = radius;
        this.base(2*radius, 2*radius);
        this.x = 0;
        this.y = 0;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.style = {"stroke": "red", "fill": "white"};
        this._updateShape();
    },
    _updateShape: function() {
        if(this.shape) {
            this.shape.remove();
        }
        this.root.clear();
        this.shape = sector(this.x+this.radius, this.y+this.radius, this.radius, this.startAngle, this.endAngle, {});
        this.setStyle(this.style);
        this.root.push(this.shape);
    },
    setStyle: function(attr) {
        this.base(attr);
        this.shape.attr(attr);
    },
    setAngles: function(startAngle, endAngle) {
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this._updateShape();
    },
    setPosition: function(x, y) {
        this.base(x, y);
        this._updateShape();
    }
});

// multi-line text label widget
// anchor - one of: start middle end
// !!!!! multiline works properly only for anchor=start!
var TextWidget = Widget.extend({
    constructor: function(maxWidth, fontSize, anchor, text, style) {
        this.base();
        this.maxWidth = maxWidth;
        this.fontSize = fontSize;
        this.anchor = anchor;
        this.textStyle = {"font-family" : "Helvetica", "font-weight" : "bold", "font-size" : fontSize, "text-anchor" : anchor};
        this.setText(text);
    },
    setStyle: function(attr) {
        this.base(attr);
        this.shapes.forEach(function(s) { s.attr(attr); });
    },
    // TODO test it...
    setCssClass: function(css) {
        TTT = this;
        this.shapes.forEach(function(s) { s[0].node.setAttribute("class", css); })
    },    
    setText: function(text) {
        var self = this;
        this.text = text || "";
        var x = 0;
        /*
        if(this.anchor == "middle") {
            x = this.maxWidth/2;                            
        } else if(this.anchor == "end") {
            x = this.maxWidth;
        }
        */
        this.lines = this.text.split("\n"); //.filter(function(l) { return l != ""; });
        var yy = this.fontSize / 2; 
        this.shapes = [];
        this.lines.forEach(function(l) {
            /* 
            // obsolete...
            var shape = r.paragraph({
                x : x, 
                y : yy, 
                maxWidth : self.maxWidth, 
                text : l, 
                textStyle : self.textStyle,
                lineHeight : self.fontSize * 1.35
                // TODO maxHeight
            });
            */
            var shape = r.multitext({
                x : x, 
                y : yy, 
                maxWidth : self.maxWidth, 
                text : l, 
                textStyle : self.textStyle,
                lineHeight : self.fontSize * 1.35
                // TODO maxHeight
            });

            var bbox = shape.getBBox();
            yy += Math.max(bbox.height + self.fontSize * 0.5, self.fontSize * 1.15);
            self.shapes.push(shape);
        });
        // clear Raphael set
        var set = this.root;
        set.forEach(function(el, idx) {
            el.remove();
            set.exclude(el);
        });
        this.shapes.forEach(function(s) { self.root.push(s); });
        this.setPosition(this.x, this.y);
    },
    getTextboxSize: function() {
        var bbox = this.root.getBBox();
        return { width: bbox.x2 - this.x, height: bbox.y2 - this.y };
    }
});


var ImageWidget = ResizableWidget.extend({
    constructor: function(url, width, height) {
        this.base(width, height);
        this.image = r.image(url, 0, 0, this.w, this.h);
        this.root.push(this.image);
    },
    setSize: function(w, h) {
        this.base(w, h);
        this.image.attr({"width": this.w, "height": this.h});
    },
    setSrc: function(url) {
        this.image.attr('src', url);
    },
    getSrc: function() {
        return this.image.attr('src');
    },
    setBlank: function() {
        this.setSrc("assets/blank.png");
    }
});


// TODO: setPosition does not work OK (it moves only the overlay)
var Clickable = SizedWidget.extend({
    constructor: function(child) {
        this.child = child;
        this.base(child.w, child.h);
        var self = this;
        var overlay = r.rect(child.x, child.y, child.w, child.h).attr({"fill":"white", "stroke": "none", "opacity": 0.001});
        this.root.push(child);
        this.root.push(overlay);
        if(MOBILE) {
            overlay.touchstart(function(e) {
                if(!self.disabled) {
                    self.onClick(e);
                }
            });
        } else {
            overlay.mousedown(function(e) {
                if(!self.disabled) {
                    self.onClick(e);
                }
            });            
        }
    },
    _getMouseCoordinates: function(e) {
        var bnds = e.target.getBoundingClientRect();   
        var fx = (e.clientX - bnds.left)/bnds.width * this.w;
        var fy = (e.clientY - bnds.top)/bnds.height * this.h;
        return { x: fx, y: fy };
    },
    onClick: function(val) {
        if(typeof(val)=="function") {
            this._onClick = val;
        } else {
            if(this._onClick) this._onClick(this, val);
        }
    },
    clear: function() {
        this.child.clear();
        this.base();
    }    
});

var GroupWidget = Widget.extend({
    constructor: function(children) {
        this.children = children || [];
        this.base();
        var self = this;
        this.children.forEach(function(c) {
            self.addChild(c);
        });
    },
    addChild: function(widget) {
        this.children.push(widget);
        this.root.push(widget.root);
    },
    clearContents: function() {
        var self = this;
        this.children.forEach(function(c) {
            self.root.exclude(c.root);
            c.clear();
        });
        this.children = [];
    }
});


// use like this:
// bb = new AppPreviewWidget("apps/mental-rotation/preview.png", "Title", "Subtitle", ["perception", "memory"])
// TODO button behaviour merge with Clickable
var AppPreviewWidget = Widget.extend({    
    constructor: function(previewUrl, title, subtitle, tags, size) {
        this.base();
        var size = size || 250.0;
        var alpha = size/250.0;
        var previewWidth = Math.floor(250*alpha);
        var previewHeight = Math.floor(250*alpha);
        var previewImageWidth = Math.floor(150*alpha);
        var previewImageHeight = Math.floor(150*alpha);
        var titleStyle = { "fill": "black", "stroke": "none", "font-size": Math.floor(22*alpha), "anchor": "middle"};
        var tagsStyle = { "fill": "blue", "stroke": "none", "font-size": Math.floor(14*alpha), "anchor": "middle"};
        var roundingSmall = Math.floor(5*alpha);
        var roundingBig = Math.floor(30*alpha);
        var imageY = Math.floor(10*alpha);
        var titleY = Math.floor(30*alpha);
        var tagsY = Math.floor(80*alpha);
        this.background = r.roundedRectangle(0, 0, previewWidth, previewHeight, roundingSmall, roundingSmall, roundingBig, roundingSmall).attr(AppPreviewWidget.backgroundStyle);
        this.image = r.image(previewUrl, (previewWidth-previewImageWidth)/2, imageY, previewImageWidth, previewImageHeight);                
        this.title = r.text(previewWidth/2,previewImageHeight + titleY,title).attr(titleStyle);
        //this.subtitle = r.text(previewWidth/2,previewImageHeight + 57,subtitle).attr(AppPreviewWidget.subtitleStyle);
        this.tags = r.text(previewWidth/2,previewImageHeight + tagsY,(tags || []).join(", ")).attr(tagsStyle);
        this.overlay = r.rect(0, 0, previewWidth, previewHeight).attr(ButtonWidget.emptyStyle);
        var bbb = this.overlay;
        bbb.node.setAttribute("class","svgbutton");
        this.root.push(this.background);
        this.root.push(this.image);
        this.root.push(this.title);
        //this.root.push(this.subtitle);
        this.root.push(this.tags);
        this.root.push(this.overlay);
        this.w = previewWidth;
        this.h = previewHeight;
        var self = this;
        // use Raphael's touch events        
        if(MOBILE) {
            bbb.touchstart(function(e) {
                if(!self.disabled) {
                    self.onClick();
                }
            });
        } else {
            bbb.mousedown(function(e) {
                if(!self.disabled) {
                    self.onClick();
                }
            });            
        }
    },
    onClick: function(val) {
        if(typeof(val)=="function") {
            this._onClick = val;
        } else {
            if(this._onClick) this._onClick(this);
        }
    }
}, {
    backgroundStyle: {"fill":"white", "stroke": "none", "opacity": 0.6},
    titleStyle: { "fill": "black", "stroke": "none", "font-size": "22", "anchor": "middle"},
    subtitleStyle: { "fill": "black", "stroke": "none", "font-size": "16", "anchor": "middle"},
    tagsStyle: { "fill": "blue", "stroke": "none", "font-size": "14", "anchor": "middle"}
});
