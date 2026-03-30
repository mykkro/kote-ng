// distance between point and ellipse

var ellipse_tan_dot = function(rx, ry, px, py, theta) {
    /* Dot product of the equation of the line formed by the point with another point on the ellipse's boundary and the tangent of the ellipse at that point on the boundary.
    */
    return ((rx * rx - ry * ry) * Math.cos(theta) * Math.sin(theta) -
            px * rx * Math.sin(theta) + py * ry * Math.cos(theta));
}


var ellipse_tan_dot_derivative = function(rx, ry, px, py, theta) {
    // The derivative of ellipse_tan_dot.
    return ((rx * rx - ry * ry) * (Math.cos(theta) * Math.cos(theta) - Math.sin(theta) * Math.sin(theta)) -
            px * rx * Math.cos(theta) - py * ry * Math.sin(theta));

}

// takes into account also the interior of the ellipse...
var safe_estimate_distance = function(x, y, rx, ry, x0, y0, angle, error) {
    var xx = x - x0;
    var yy = y - y0;
    if (angle) {
        // rotate the points onto an ellipse whose rx, and ry lay on the x, y axis
        angle = -Math.PI / 180.0 * angle;
        var xxx = xx * Math.cos(angle) - yy * Math.sin(angle);
        var yyy = xx * Math.sin(angle) + yy * Math.cos(angle);
        xx = xxx;
        yy = yyy;
    }
    // does the point lie inside the ellipse?
    var val = xx*xx/(rx*rx) + yy*yy/(ry*ry);
    if(val<=1) {
        return 0;
    } else {
        return estimate_distance(x, y, rx, ry, x0, y0, angle, error);
    }
}

var estimate_distance = function(x, y, rx, ry, x0, y0, angle, error) {
    /*
    Given a point (x, y), and an ellipse with major - minor axis (rx, ry),
    its center at (x0, y0), and with a counter clockwise rotation of
    `angle` degrees, will return the distance between the ellipse and the
    closest point on the ellipses boundary.
    */
    if(!error) error = 1e-5;
    x -= x0;
    y -= y0;
    if (angle) {
        // rotate the points onto an ellipse whose rx, and ry lay on the x, y axis
        angle = -Math.PI / 180.0 * angle;
        var xx = x * Math.cos(angle) - y * Math.sin(angle);
        var yy = x * Math.sin(angle) + y * Math.cos(angle);
        x = xx;
        y = yy;
    }
    var theta = Math.atan2(rx * y, ry * x);
    while (Math.abs(ellipse_tan_dot(rx, ry, x, y, theta)) > error) {
        theta -= ellipse_tan_dot(rx, ry, x, y, theta) / ellipse_tan_dot_derivative(rx, ry, x, y, theta);
    }

    px = rx * Math.cos(theta);
    py = ry * Math.sin(theta);
    return Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
}
