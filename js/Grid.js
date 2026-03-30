var Grid = Base.extend({
	constructor: function(rows, cols, filler) {
		this.rows = rows;
		this.cols = cols;
		this.grid = [];
		for(var i=0; i<rows; i++) {
			var row = [];
			for(var j=0; j<cols; j++) {
				var val = filler;
				if(typeof(val)=="function") {
					val = filler(i, j);
				}
				row.push(val);
			}
			this.grid.push(row);
		}
	},
	filledRandomlyBy: function(val, count) {
		// make list of indices in grid
		var indices = [];
		for(var i=0; i<this.rows*this.cols; i++) {
			indices.push(i);
		}
		shuffle(indices);
		for(var i=0; i<Math.min(count, indices.length); i++) {
			var ndx = indices[i];
			this.grid[Math.floor(ndx/this.cols)][ndx % this.cols] = val;
		}
		return this;
	},
	getValue: function(i,j) {
		return this.grid[i][j];
	},
	setValue: function(i,j, value) {
		this.grid[i][j] = value;
		this.valueChanged(i, j, value);
	},
	updateAll: function() {
		for(var i=0; i<this.rows; i++) {
			for(var j=0; j<this.cols; j++) {
				this.valueChanged(i, j, this.grid[i][j]);
			}
		}		
	},
	forEach: function(fun) {
		for(var i=0; i<this.rows; i++) {
			for(var j=0; j<this.cols; j++) {
				fun(i, j, this.getValue(i,j));
			}
		}		
	},
	valueChanged: function(i, j, value) {
		if(typeof(i) == "function") {
			this._valueChanged = i;
		} else if(this._valueChanged) {
			this._valueChanged(i, j, value);
		}
	}
});
