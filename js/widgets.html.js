class HtmlWidget extends Base {
    constructor(width, height, options) {
        super();
        this.width   = width;
        this.height  = height;
        this.options = options || {};
        this.box = document.createElement('div');
        this.box.className = 'html-widget';
        this.box.style.width  = this.width  + 'px';
        this.box.style.height = this.height + 'px';
        this.setPosition(0, 0);
        this.initialize(options);
        if ("class" in options) {
            this.addClass(options.class);
        }
        document.getElementById('html-widgets').appendChild(this.box);
    }
    addClass(cls) {
        this.box.classList.add(cls);
    }
    removeClass(cls) {
        this.box.classList.remove(cls);
    }
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.box.style.left = x + 'px';
        this.box.style.top  = y + 'px';
    }
    initialize() {
        // override in subclasses...
        this.box.style.backgroundColor = 'red';
    }
}

class HtmlLabelWidget extends HtmlWidget {
    constructor(width, height, options, text) {
        console.log("Creating label widget");
        super(width, height, options);
        this.setText(text);
        this.box.classList.add("html-label-widget");
    }
    initialize() {
        this.body = document.createElement('div');
        Object.assign(this.body.style, {
            width:     this.width  + 'px',
            height:    this.height + 'px',
            textAlign: 'center'
        });
        if (this.options.backgroundColor) {
            this.body.style.backgroundColor = this.options.backgroundColor;
        }
        this.box.innerHTML = '';
        this.box.appendChild(this.body);
    }
    setText(text) {
        this.text = text;
        this.body.textContent = text;
    }
}


class HtmlImageWidget extends HtmlWidget {
    constructor(width, height, options, src) {
        console.log("Creating image widget");
        this.src = src;
        super(width, height, options);
        this.box.classList.add("html-image-widget");
    }
    initialize() {
        this.body = document.createElement('img');
        this.body.src = this.src;
        Object.assign(this.body.style, {
            width:     this.width  + 'px',
            height:    this.height + 'px',
            textAlign: 'center'
        });
        if (this.options.backgroundColor) {
            this.body.style.backgroundColor = this.options.backgroundColor;
        }
        this.box.innerHTML = '';
        this.box.appendChild(this.body);
    }
}


class HtmlInputWidget extends HtmlWidget {
    constructor(width, height, options, value) {
        console.log("Creating input widget");
        super(width, height, options);
        this.val(value);
        this.box.classList.add("html-input-widget");
    }
    initialize() {
        var self = this;
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.name = 'textfield';
        if (this.options.maxlength) {
            this.input.maxLength = this.options.maxlength;
        }
        Object.assign(this.input.style, {
            width:     this.width  + 'px',
            height:    this.height + 'px',
            textAlign: 'center',
            border:    'none'
        });
        this.input.readOnly = !!this.options.readonly;
        this.input.addEventListener('input', function(e) {
            console.log("changed!", self.val());
            self.onChange(self.val());
        });
        if (this.options.numbersOnly) {
            this.input.addEventListener('keydown', function(e) {
                // Allow: backspace, delete, tab, escape, enter and .
                if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
                    // Allow: Ctrl+A
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    // Allow: Ctrl+C
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    // Allow: Ctrl+X
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    return;
                }
                // Ensure that it is a number and stop the keypress
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
        }
        if (this.options.lettersOnly) {
            this.input.addEventListener('keydown', function(e) {
                // Allow: backspace, delete, tab, escape, enter and .
                if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
                    // Allow: Ctrl+A
                    (e.keyCode === 65 && e.ctrlKey === true) ||
                    // Allow: Ctrl+C
                    (e.keyCode === 67 && e.ctrlKey === true) ||
                    // Allow: Ctrl+X
                    (e.keyCode === 88 && e.ctrlKey === true) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                    return;
                }
                // Ensure that it is a letter and stop the keypress
                if (e.shiftKey || (e.keyCode < 65 || e.keyCode > 90)) {
                    e.preventDefault();
                }
            });
        }
        this.box.innerHTML = '';
        this.box.appendChild(this.input);
    }
    onChange(val) {
        if (typeof(val) === "function") {
            this._onChange = val;
        } else {
            if (this._onChange) this._onChange(val);
        }
    }
    val(value) {
        if (arguments.length === 1) {
            this.value = value;
            this.input.value = this.value;
        } else {
            return this.input.value;
        }
    }
}

class HtmlButtonWidget extends HtmlWidget {
    constructor(width, height, options, text) {
        console.log("Creating button widget");
        super(width, height, options);
        this.setText(text);
        this.box.classList.add("html-button-widget");
    }
    initialize() {
        var self = this;
        this.input = document.createElement('button');
        Object.assign(this.input.style, {
            width:     this.width  + 'px',
            height:    this.height + 'px',
            textAlign: 'center'
        });
        if (this.options.backgroundColor) {
            this.input.style.backgroundColor = this.options.backgroundColor;
        }
        this.input.addEventListener('click', function(e) {
            console.log("clicked!");
            self.onClick();
        });
        this.box.innerHTML = '';
        this.box.appendChild(this.input);
    }
    setText(text) {
        this.text = text;
        this.input.textContent = text;
    }
    setDisabled(flag) {
        this.input.disabled = flag;
    }
    onClick(val) {
        if (typeof(val) === "function") {
            this._onClick = val;
        } else {
            if (this._onClick) this._onClick(this);
        }
    }
}



class HtmlGridInputWidget extends HtmlWidget {
    constructor(width, height, rows, cols, options, value) {
        this.rows  = rows;
        this.cols  = cols;
        this.value = value;
        super(width, height, options);
        this.val(value);
        this.box.classList.add("html-grid-input-widget");
    }
    initialize() {
        var self = this;
        var gap  = this.options.gap || 0;
        var w = (this.width  - (this.cols - 1) * gap) / this.cols;
        var h = (this.height - (this.rows - 1) * gap) / this.rows;
        this.inputs = [];
        var i = 0;
        for (var y = 0; y < this.rows; y++) {
            for (var x = 0; x < this.cols; x++) {
                var opts = Object.assign({}, this.options);
                if (this.options.filledReadonly && this.value[i]) {
                    opts.readonly = true;
                }
                var inp = new HtmlInputWidget(w, h, opts, this.value[i]);
                inp.setPosition(x * w + x * gap, y * h + y * gap);
                inp.onChange(function(val) {
                    self.onChange(self.val());
                });
                this.inputs.push(inp);
                this.box.appendChild(inp.box);
                i++;
            }
        }
    }
    onChange(val) {
        if (typeof(val) === "function") {
            this._onChange = val;
        } else {
            if (this._onChange) this._onChange(val);
        }
    }
    val(value) {
        if (arguments.length === 1) {
            this.value = value;
            this._setValue(this.value);
        } else {
            return this._getValue();
        }
    }
    isFilled() {
        for (var i = 0; i < this.inputs.length; i++) {
            if (!this.inputs[i].val()) return false;
        }
        return true;
    }
    _setValue(val) {
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].val(val[i]);
        }
    }
    _getValue() {
        var out = [];
        for (var i = 0; i < this.inputs.length; i++) {
            out.push(this.inputs[i].val());
        }
        return out;
    }
}



class HtmlSeriesInputWidget extends HtmlWidget {
    constructor(width, height, options, value) {
        this.value = value;
        super(width, height, options);
        this.val(value);
        this.box.classList.add("html-series-input-widget");
    }
    initialize() {
        var self = this;
        var gap  = this.options.gap || 0;
        var w    = (this.width - (this.value.length - 1) * gap) / this.value.length;
        this.inputs = [];
        var i = 0;
        for (var x = 0; x < this.value.length; x++) {
            var opts = Object.assign({}, this.options);
            if (this.options.filledReadonly && this.value[i]) {
                opts.readonly = true;
            }
            var inp = new HtmlInputWidget(w, this.height, opts, this.value[i]);
            inp.setPosition(x * w + (x - 1) * gap, 0);
            inp.onChange(function(val) {
                self.onChange(self.val());
            });
            this.inputs.push(inp);
            this.box.appendChild(inp.box);
            i++;
        }
    }
    onChange(val) {
        if (typeof(val) === "function") {
            this._onChange = val;
        } else {
            if (this._onChange) this._onChange(val);
        }
    }
    val(value) {
        if (arguments.length === 1) {
            this.value = value;
            this._setValue(this.value);
        } else {
            return this._getValue();
        }
    }
    isFilled() {
        for (var i = 0; i < this.inputs.length; i++) {
            if (!this.inputs[i].val()) return false;
        }
        return true;
    }
    _setValue(val) {
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].val(val[i]);
        }
    }
    _getValue() {
        var out = [];
        for (var i = 0; i < this.inputs.length; i++) {
            out.push(this.inputs[i].val());
        }
        return out;
    }
}


class HtmlMultiSeriesInputWidget extends HtmlWidget {
    constructor(width, height, options, value) {
        this.value = value;
        super(width, height, options);
        this.val(value);
        this.box.classList.add("html-multi-series-input-widget");
    }
    initialize() {
        var self = this;
        var gap  = this.options.gap  || 0;
        var vgap = this.options.vgap || 0;
        var rows = this.value.length;
        var cols = 0;
        for (var i = 0; i < this.value.length; i++) {
            if (this.value[i].length > cols) cols = this.value[i].length;
        }
        var hh = (this.height - (rows - 1) * vgap) / rows;
        var ww = (this.width  - (cols - 1) * gap)  / cols;
        this.inputs = [];
        for (var y = 0; y < rows; y++) {
            var rowWidth = Math.floor(this.value[y].length * ww + (this.value[y].length - 1) * gap);
            var opts = Object.assign({}, this.options);
            var inp  = new HtmlSeriesInputWidget(rowWidth, hh, opts, this.value[y]);
            inp.setPosition(
                Math.floor((this.width - rowWidth) / 2),
                Math.floor(y * (hh + vgap))
            );
            inp.onChange(function(val) {
                self.onChange(self.val());
            });
            this.inputs.push(inp);
            this.box.appendChild(inp.box);
        }
    }
    onChange(val) {
        if (typeof(val) === "function") {
            this._onChange = val;
        } else {
            if (this._onChange) this._onChange(val);
        }
    }
    val(value) {
        if (arguments.length === 1) {
            this.value = value;
            this._setValue(this.value);
        } else {
            return this._getValue();
        }
    }
    isFilled() {
        for (var i = 0; i < this.inputs.length; i++) {
            if (!this.inputs[i].isFilled()) return false;
        }
        return true;
    }
    _setValue(val) {
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].val(val[i]);
        }
    }
    _getValue() {
        var out = [];
        for (var i = 0; i < this.inputs.length; i++) {
            out.push(this.inputs[i].val());
        }
        return out;
    }
}


class HtmlTimerWidget extends HtmlWidget {
    constructor(width, height, options, countdown) {
        console.log("Creating timer widget");
        super(width, height, options);
        this.countdown = countdown;
        this.box.classList.add("html-timer-widget");
    }
    initialize() {
        this.input = document.createElement('div');
        Object.assign(this.input.style, {
            width:  this.width  + 'px',
            height: this.height + 'px'
        });
        // NOTE: jquery.polartimer plugin removed (jQuery dependency eliminated).
        // HtmlTimerWidget is currently unused by any game.
        this.box.innerHTML = '';
        this.box.appendChild(this.input);
    }
}
