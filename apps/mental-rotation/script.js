

var MentalRotationGame = Game.extend({
    constructor: function(config) {
        this.base(config);
        this.currentFrame = 0;
        this.totalFrames = 0;
    },
    createGUI: function(r) {
        // create grid
        var self = this;

        var labelSvg = new TextWidget(600, 50, "middle", "");
        labelSvg.setPosition(200, 160)
        labelSvg.setStyle({"fill": "black"});
        this.label = labelSvg;
        this.updateCounter();

        this.label2 = new TextWidget(500, 30, "start", this.loc("Which of the shapes below is a rotated version of the shape shown left?"));
        //this.label2.addClass("instruction");
        this.label2.setPosition(300, 300);       
        
        this.body = new GroupWidget(); 
    },
    updateCounter: function() {
        this.label.setText((this.currentFrame+1)+"/"+this.totalFrames);
    },
    generateTaskData: function(options) {
        return MentalRotationGame.data;
    },    
    renderFrame: function() {
        var self = this;
        this.body.clearContents();

        this.updateCounter();
        var g = this.goals[this.currentFrame];
        console.log(g);

        // render original...
        var img0 = new ImageWidget(self.baseUrl + "/" + g.offered, 150, 150); 
        img0.setPosition(100, 300);
        this.body.addChild(img0);
        //img0.addClass("item item-offered");

        // render rest of items
        var y0 = 600;
        var n = g.rest.length;
        for(var i=0; i<n; i++) {
            (function() {
                var gg = g.rest[i];
                var img = new ImageWidget(self.baseUrl + "/" + gg.item, 150, 150); 
                self.body.addChild(img);
                //img.addClass("item item-choice");
                img.setPosition(100 + 200*i, y0);     
                var clk = new Clickable(img);
                clk.onClick(function()  {
                    // collect answer!
                    player.playSound("click");
                    self.answer[self.currentFrame] = gg.match;
                    self.advanceFrame();
                });
            })();
        }
    },
    advanceFrame: function() {
        this.currentFrame++;
        if(this.currentFrame == this.goals.length) {
            this.finish(this.answer);
        } else {
            this.renderFrame();
        }
    },
    start: function(gamedata) {
        this.base(gamedata);

        var self = this;
        this.currentFrame = 0;
        self.totalFrames = self.gamedata.length;
        self.answer = [];
        self.goals = [];

        // prepare data...
        this.gamedata.forEach(function(gd) {
            console.log("Gamedata:", gd);
            var N = gd[2];
            // offered item will come from the first array
            // rest of items will be added to the second array            
            // total length of array = N
            var src = gd[0].slice();
            var ri = Math.floor(Math.random() * src.length); // Random Index position in the array
            var offered = src.splice(ri, 1);
            var rest = [];
            src.forEach(function(s) {
                rest.push({"item": s, "match": true});
            });
            gd[1].forEach(function(s) {
                rest.push({"item": s, "match": false});
            });
            shuffle(rest);
            rest.slice(0,N);

            console.log("Shuffled and selected:", offered, rest)

            self.goals.push({ offered:offered[0], rest:rest});
            self.answer.push(null);

        });

        self.task = new BinaryMultiTask();

        self.renderFrame();

    }
},{
    data: [
        // show 5 items, the first array - the "same" items, second array - the rest of items
        [["assets/a0.png", "assets/a1.png"], ["assets/a2.png", "assets/a3.png", "assets/a4.png"], 5],
        [["assets/b0.png", "assets/b1.png"], ["assets/b2.png", "assets/b3.png", "assets/b4.png"], 5],
        [["assets/c0.png", "assets/c1.png"], ["assets/c2.png", "assets/c3.png", "assets/c4.png"], 5]
    ]
});





