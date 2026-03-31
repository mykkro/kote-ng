


class DifferencesGame extends Game {
    constructor(config) {
        super(config);
        this.currentFrame = 0;
        this.lastFrame = null;
    }

    pointInEllipse(x, y, cx, cy, rx, ry) {
        return ((x-cx)*(x-cx)/(rx*rx) + (y-cy)*(y-cy)/(ry*ry)) <= 1;
    }

    pointInRegion(x, y) {
        for(var i=0; i<this.positions.length; i++) {
            var pp = this.positions[i];
            if(this.pointInEllipse(x, y, pp.x, pp.y, pp.rx, pp.ry)) {
                return i;
            }
        }
        return -1;
    }

    createGUI(r) {
        // create grid
        var self = this;
        //var btn = new HtmlButtonWidget(200, 100, {"class":"btn3"}, "OK");
        var btn = new ButtonWidget("OK", {fontSize: 40, border: 20, anchor: "middle", radius: 30});
        btn.setDisabled(true);
        btn.setPosition(500-btn.w/2, 800);
        btn.onClick(function() {
            // evaluate the result...
            self.finish(self.answer);
        })
        this.okButton = btn;

        var img = new ImageWidget(self.baseUrl + "/assets/image.jpg", 1000, 562);
        img.setPosition(0, 200);
    }

    generateTaskData(options) {
        return DifferencesGame.regions;
    }

    putMarker(x, y) {
        var self = this;
        var marker = r.circle(x, y, 30).attr({fill:"red", opacity: 0.5, stroke: "blue"});
        var touchMarkerHandler = function(e) {
            self.circles.exclude(marker);
            marker.remove();
            self.okButton.setDisabled(true);
            self.updateBar(self.grp, self.circles.items.length);
            e.stopPropagation();
        }
        if(MOBILE) {
            marker.touchstart(touchMarkerHandler);
        } else {
            marker.mousedown(touchMarkerHandler);
        }
        self.circles.push(marker);
        self.updateBar(self.grp, self.circles.items.length);
    }

    updateBar(grp, n) {
        for(var i=0; i<grp.items.length; i++) {
            var rect = grp.items[i];
            if(i<n) {
                rect.show();
            } else {
                rect.hide();
            }
        }
    }

    clearBar(grp) {
        for(var i=0;i<this.circles.items.length; i++) {
            this.circles.items[i].remove();
        }
        this.circles = r.set();
        this.updateBar(grp,0);
    }

    renderFrame() {
        var self = this;
        /*
        for(var i=0; i<this.positions.length; i++) {
            var pp = this.positions[i];
            r.ellipse(pp.x, pp.y, pp.rx, pp.ry).attr({fill: "cyan", "fill-opacity": 0.5});
        }
        */

        var circles = r.set();
        this.circles = circles;

        var N = this.regions.length;
        var grp = r.set();
        var bkgr = r.rect(365, 150, N*30, 30).attr({fill:"#ccc", stroke:"#666", "stroke-width": 3});
        for(var i=0; i<N; i++) {
            var alpha = i/N;
            var R = 255*alpha;
            var G = 255*(1-alpha);
            var B = 0;
            var rect = r.rect(365+i*30, 150, 30, 30).attr({fill:"rgb("+R+","+G+","+B+")"});
            rect.hide();
            grp.push(rect);
        }
        this.grp = grp;
        this.updateBar(grp, circles.items.length);


        var touchHandler = function(e) {
            var bnds = e.target.getBoundingClientRect();
            var ee = MOBILE ? e.targetTouches[0] : e;
            var fx = (ee.clientX - bnds.left)/bnds.width * overlay.attrs.width;
            var fy = (ee.clientY - bnds.top)/bnds.height * overlay.attrs.height;

            var res = self.pointInRegion(fx,fy);
            if(res >= 0) {
                console.log("Region "+res+" hit!");
            }

            if(fx>=0 && fx <= 500 && fy >= 0 && fy <= 562 && self.circles.items.length < self.grp.items.length) {
                self.answer[self.circles.items.length] = [fx, fy+100, 30, 30];
                self.putMarker(fx, fy+200);
                self.okButton.setDisabled(self.circles.items.length != 9);
            }
            e.stopPropagation();
        }

        var overlay = r.rect(0,200,1000,562).attr({stroke:"none", fill: "white", opacity:0});
        overlay.attr({
            cursor: 'pointer',
        });
        if(MOBILE) {
            overlay.touchstart(touchHandler);
        } else {
            overlay.mousedown(touchHandler);
        }

    }

    start(gamedata) {
        // alert("Starting game!");
        gamedata = gamedata || this.generateTaskData();
        super.start(gamedata);
        this.regions = gamedata;
        var positions = [];
        this.answer = [];
        var self = this;
        this.regions.forEach(function(r) {
            var reg = {x:r[0], y:r[1]+100, rx:r[2], ry:r[2]};
            if(r.length>2) {
                reg.ry = r[3];
            }
            positions.push(reg);
            self.answer.push([0,0,0]);
        });
        this.positions = positions;

        this.task = new HitMissScalarTask(this.regions);
        this.renderFrame();

    }

    static regions = [
        [ 45, 553, 30, 30 ],
        [ 94, 636, 30, 30 ],
        [ 300, 605, 30, 30 ],
        [ 474, 582, 30, 50 ],
        [ 358, 497, 30, 30 ],
        [ 210, 434, 30, 30 ],
        [ 274, 298, 40, 20 ],
        [ 464, 312, 30, 30 ],
        [ 176, 216, 170, 60 ]
    ];
}

window.DifferencesGame = DifferencesGame;
