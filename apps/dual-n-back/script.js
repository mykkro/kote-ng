
var NBackDualGame = NBackGame.extend({
    constructor: function(config) {
        this.base(config);
    },
    createGUI: function(r) {
        // create grid
        var self = this;
        this.r = r;
        self.createBackground(r);
        // create buttons
        var useColors = true;

        var buttonStyle = {fontSize: 40, border: 20, anchor: "middle", radius: 30};

        this.button1 = new ButtonWidget(this.loc("Position"), buttonStyle);
        this.button1.setPosition(300-this.button1.w/2, 850);
        this.button1.onClick(function() {
            //player.playSound("click");
            if(self.currentFrame >= self.N) {
                self.answer[0][self.currentFrame-self.N] = 1;
            }
        });
        this.button2 = new ButtonWidget(this.dualType=="colors" ? this.loc("Color") : this.loc("Sign"), buttonStyle);
        this.button2.setPosition(500-this.button2.w/2, 850);
        this.button2.onClick(function() {
            //player.playSound("click");
            if(self.currentFrame >= self.N) {
                self.answer[1][self.currentFrame-self.N] = 1;
            }
        });
        this.button3 = new ButtonWidget(this.loc("Both"), buttonStyle);
        this.button3.setPosition(700-this.button2.w/2, 850);
        this.button3.onClick(function() {
            //player.playSound("click");
            if(self.currentFrame >= self.N) {
                self.answer[0][self.currentFrame-self.N] = 1;
                self.answer[1][self.currentFrame-self.N] = 1;
            }
        });
    },
    showObject: function() {
        var self = this;
        var data1 = self.gamedata[0][self.currentFrame];
        var data2 = self.gamedata[1][self.currentFrame];
        var p = self.indexAsPosition(data1);
        if(self.dualType == "colors") {
            self.lastBox = self.drawBox(r, p.x, p.y, NBackGame.colors[data2]);
        } else {
            self.lastBox = self.drawImage(r, p.x, p.y, self.baseUrl + "/"+ NBackGame.signImages[data2]);
        }
        player.playSound("newBox");
    },
    generateTaskData: function(options) {
        var sequence1 = this.generateNBackSequence(this.L, this.N, this.matchProbability, 9);
        var sequence2 = this.generateNBackSequence(this.L, this.N, this.matchProbability, this.dualType == "colors" ? this.maxColors : this.maxSigns);
        console.log("NBackDualGame.generateTaskData", sequence1, sequence2);
        return [sequence1, sequence2];
    },
    generateReport: function(evalResult) {
        console.log("Generate report", evalResult);
        return [
            this.loc("Correctness") + ": "+ sprintf("%.1f%%", evalResult.correctness * 100)
            // this.loc("Total time") + ": " + (this.currentTime / 1000) + " s"
        ];
    },
    initializeTask: function() {
        this.task = new NBackDualScalarTask(this.gamedata, this.N);
        this.answer = [[],[]];
        for(var i=0; i<this.L-this.N; i++) {
            this.answer[0].push(0);
            this.answer[1].push(0);
        }
    }
});


