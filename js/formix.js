var renderHeader = function(title, description) {
    return h('h2', null, title);
}

var renderLabel = function(label) {
    return h('label', null, label);
}

var renderInput = function(fld, loc) {
    if(fld.type == "boolean") {
        return new CheckboxInput(fld, loc);
    }
    if(fld.type == "int") {
        if(fld.maxValue-fld.minValue < 10) {
            if(fld.maxValue-fld.minValue < 5) {
                return new RadioInput(fld, loc);
            }
            return new SelectInput(fld, loc);
        }
        return new NumberInput(fld, loc);
    }
    if(fld.values) {
        if(fld.values.length < 5) {
            return new RadioInput(fld, loc);
        }
        return new SelectInput(fld, loc);
    }
    return new TextInput(fld, loc);
}

var Input = Base.extend({
    constructor: function(fld, loc) {
        this.loc = loc || function(t) { return t; };
        this.fld = fld;
    },
    val: function(val) {
        if(arguments.length) {
            this._setValue(val);
        } else {
            return this._getValue();
        }
    },
    _setValue: function(val) {
    },
    _getValue: function() {
    },
    validate: function() {
        var val = this._getValue();
        console.log("Validating input", val, this.fld);
        return !!val;
    }
});

var TextInput = Input.extend({
    constructor: function(fld, loc) {
        this.base(fld, loc);
        this.input = h('input', { type: 'text', name: fld.name, value: fld.default });
    },
    _setValue: function(val) {
        this.input.value = val;
    },
    _getValue: function() {
        return this.input.value;
    }
});

var NumberInput = Input.extend({
    constructor: function(fld, loc) {
        this.base(fld, loc);
        this.input = h('input', { type: 'text', name: fld.name, value: fld.default });
    },
    _setValue: function(val) {
        this.input.value = val;
    },
    _getValue: function() {
        return parseInt(this.input.value);
    },
    validate: function() {
        var val = this._getValue();
        console.log("Validating number input", val, this.fld);
        var isParentValid = this.base();
        if(isParentValid) {
            var isNumber = !isNaN(parseInt(val));
            if(isNumber) {
                var isInRange = (val >= this.fld.minValue) && (val <= this.fld.maxValue);
                return isInRange;
            }
        }
        return false;
    }
});

var CheckboxInput = Input.extend({
    constructor: function(fld, loc) {
        this.base(fld, loc);
        var inp = h('input', { type: 'checkbox', name: fld.name });
        inp.checked = !!fld.default;
        this.input = inp;
    },
    _setValue: function(val) {
        this.input.checked = !!val;
    },
    _getValue: function() {
        return this.input.checked;
    },
    validate: function() {
        return true;
    }
});

var SelectInput = Input.extend({
    constructor: function(fld, loc) {
        this.base(fld, loc);
        var self = this;
        console.log("Rendering select input", fld);
        var out = h('select', { name: fld.name });
        var values = fld.values;
        var valueLabels = fld.valueLabels || values || [];
        valueLabels = valueLabels.map(function(l) { return self.loc(l); });
        if(fld.type=="int") {
            values = [];
            valueLabels = [];
            for(var j=fld.minValue; j<=fld.maxValue; j++) {
                values.push(""+j);
                valueLabels.push(""+j);
            }
        }
        for(var i=0; i<values.length; i++) {
            out.appendChild(h('option', { value: values[i] }, valueLabels[i]));
        }
        out.value = fld.default;
        this.input = out;
    },
    _setValue: function(val) {
        this.input.value = val;
    },
    _getValue: function() {
        var out = this.input.value;
        if(this.fld.type == "int") {
            out = parseInt(out);
        }
        return out;
    }
});

var RadioInput = Input.extend({
    constructor: function(fld, loc) {
        this.base(fld, loc);
        var self = this;
        console.log("Rendering radio input", fld);
        var out = h('div', { 'class': 'formix-radiogroup' });
        var values = fld.values;
        var valueLabels = fld.valueLabels || fld.values || [];
        valueLabels = valueLabels.map(function(l) { return self.loc(l); });
        if(fld.type=="int") {
            values = [];
            valueLabels = [];
            for(var j=fld.minValue; j<=fld.maxValue; j++) {
                values.push(""+j);
                valueLabels.push(""+j);
            }
        }
        for(var i=0; i<values.length; i++) {
            out.appendChild(h('span', null, valueLabels[i]));
            var inp = h('input', { type: 'radio', name: fld.name, value: values[i] });
            if(values[i] == fld.default) {
                inp.checked = true;
            }
            out.appendChild(inp);
        }
        this.input = out;
    },
    _setValue: function(val) {
        var radios = document.querySelectorAll('input[type="radio"][name="' + this.fld.name + '"]');
        radios.forEach(function(radio) {
            radio.checked = (radio.value === "" + val);
        });
    },
    _getValue: function() {
        var checked = document.querySelector('input[type="radio"][name="' + this.fld.name + '"]:checked');
        var out = checked ? checked.value : undefined;
        if(this.fld.type == "int") {
            out = parseInt(out);
        }
        return out;
    }
});


var Field = Base.extend({
    constructor: function(fld, loc) {
        this.loc = loc || function(t) { return t; };
        this.f = fld;
        this.name = fld.name;
        this.title = fld.title || fld.name;
        this.input = renderInput(fld, this.loc);
        this.body = h('div', { 'class': 'formix-field' },
            renderLabel(this.loc(this.title)),
            this.input.input
        );
    },
    val: function(value) {
        if(arguments.length) {
            this.input.val(value);
        } else {
            return this.input.val();
        }
    },
    // returns true if the field has correct value
    // returns false otherwise
    validate: function() {
        var valid = this.input.validate();
        if(!valid) {
            this.body.classList.add("error");
        } else {
            this.body.classList.remove("error");
        }
        return valid;
    }
});

var Form = Base.extend({
    constructor: function(frm, loc) {
        this.loc = loc || function(t) { return t; };
        this.fields = [];
        var self = this;
        var body = h('div', { 'class': 'formix-body' });
        var out  = h('div', { 'class': 'formix' },
            renderHeader(frm.title, frm.descripton),
            body
        );
        frm.fields.forEach(function(fld) {
            var f = new Field(fld, self.loc);
            self.fields.push(f);
            body.appendChild(f.body);
        });
        this.body = out;
    },
    val: function(value) {
        if(arguments.length) {
            this._setValue(value);
        } else {
            return this._getValue();
        }
    },
    _setValue: function(val) {
        this.fields.forEach(function(ff) {
            ff.val(val[ff.name]);
        });
    },
    _getValue: function() {
        var out = {};
        this.fields.forEach(function(ff) {
            out[ff.name] = ff.val();
        });
        return out;
    },
    validate: function() {
        console.log("Validating form", this.fields);
        var self = this;
        var valid = true;
        self.fields.forEach(function(f) {
            valid = valid && f.validate();
        });
        return valid;
    }
});
