
var NBackSingleGame = NBackGame.extend({
    constructor: function(config) {
        this.base(config);
    },
    createGUI: function(r) {
        // create grid
        var self = this;
        self.createBackground(r);
        // create buttons
        var useColors = true;

        this.button1 = new ButtonWidget(this.loc("Position"), {fontSize: 40, border: 20, anchor: "middle", radius: 30});
        this.button1.setPosition(500-this.button1.w/2, 850);
        this.button1.onClick(function() {
            if(self.currentFrame >= self.N) {
                //player.playSound("click");
                self.answer[self.currentFrame-self.N] = 1;
            }
        });
    },
    showObject: function() {
        var self = this;
        var data = self.gamedata[self.currentFrame];
        var p = self.indexAsPosition(data);
        self.lastBox = self.drawBox(r, p.x, p.y, "blue");
        player.playSound("new-box");
    },
    generateReport: function(evalResult) {
        console.log("Generate report", evalResult);
        return [
            this.loc("Correctness") + ": "+ sprintf("%.1f%%", evalResult.correctness * 100)
            // this.loc("Total time") + ": " + (this.currentTime / 1000) + " s"
        ];
    },
    generateTaskData: function(options) {
        var sequence = this.generateNBackSequence(this.L, this.N, this.matchProbability, 9);
        console.log("NBackSingleGame.generateTaskData", sequence);
        return sequence;
    },
    initializeTask: function() {
        var gamedata = this.gamedata;
        this.task = new NBackScalarTask(gamedata, this.N);
        this.answer = [];
        for(var i=0; i<this.L-this.N; i++) {
            this.answer.push(0);
        }
    }
});

