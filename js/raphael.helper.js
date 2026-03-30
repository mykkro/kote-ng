// various RaphaelJS helper functions

RaphaelHelper = {}

/**
 * Draws a grid spanning 1000 x 1000 units.
 */
RaphaelHelper.drawGrid = function(r, color) {
    var grid = r.set();
    var thinLineStyle = {stroke: color,"stroke-width": 1, fill: "none"};
    var thickLineStyle = {stroke: color,"stroke-width": 3, fill: "none"};
    for(var i=0; i<100; i++) {
    	var line = r.path("M0," + i*10 + " L1000," + i*10).attr(thinLineStyle);
    	grid.push(line);
    	var line = r.path("M" + i*10 + ",0L" + i*10 + ",1000").attr(thinLineStyle);
    	grid.push(line);
    }
    for(var i=0; i<10; i++) {
    	var line = r.path("M0," + i*100 + " L1000," + i*100).attr(thickLineStyle);
    	grid.push(line);
    	var line = r.path("M" + i*100 + ",0L" + i*100 + ",1000").attr(thickLineStyle);
    	grid.push(line);
    }
    return grid;
}


Raphael.fn.line = function(startX, startY, endX, endY){
    return this.path('M' + startX + ' ' + startY + ' L' + endX + ' ' + endY);
};

// from: http://www.remy-mellet.com/blog/179-draw-rectangle-with-123-or-4-rounded-corner/
//roundedRectangle(x, y, width, height, upper_left_corner, upper_right_corner, lower_right_corner, lower_left_corner)
Raphael.fn.roundedRectangle = function (x, y, w, h, r1, r2, r3, r4){
    var array = [];
    array = array.concat(["M",x,r1+y, "Q",x,y, x+r1,y]); //A
    array = array.concat(["L",x+w-r2,y, "Q",x+w,y, x+w,y+r2]); //B
    array = array.concat(["L",x+w,y+h-r3, "Q",x+w,y+h, x+w-r3,y+h]); //C
    array = array.concat(["L",x+r4,y+h, "Q",x,y+h, x,y+h-r4, "Z"]); //D

    return this.path(array);
};


// clears element completely together with set contents if nested
Raphael.fn.wipe = function(g) {
    if(g) {
        if(g.type=="set") {
            g.forEach(function(ggg) {
                Raphael.fn.wipe(ggg);
            });
        }
        g.remove();
    }
}
