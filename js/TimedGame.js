// TimedGame.js


var StopWatch = Base.extend({
    constructor: function() {
        this.frozen = null;
        this.reset();
    },
    reset: function() {
        this.lastTime = window.performance.now();
    },
    now: function() {
        if(this.frozen !== null) {
            return this.frozen;
        }
        return window.performance.now() - this.lastTime;
    },
    millis: function() {
        return Math.floor(this.now());
    },
    seconds: function() {
        return this.now() / 1000;
    },
    freeze: function() {
        this.frozen = this.now();
    },
    unfreeze: function() {
        this.frozen = null;
    }
})


var TimedGame = Game.extend({
    constructor: function(config) {
        this.base(config);
        this.currentTime = 0;        
        this.stopwatch = new StopWatch();
    },
    // override in subclasses
    // return a promise returning a gamepack
    loadGamepackData: function() {
        // override in subclasses — must return a Promise
        return Promise.resolve({});
    },
    start: function() {
        var self = this;
        console.log("TimedGame.start");

        self.loadGamepackData().then(function(gamepack) {
        	self.gamepackLoaded(gamepack);            
            self.onStart(self.gamedata);
        });
    },
    gamepackLoaded: function(gamepack) {
    	var self = this;
        console.log("TimedGame.gamepackLoaded", gamepack);
        self.gamepack = gamepack;
        self.gamedata = self.generateTaskData();
        self.initializeTask();
        self.renderFrame();
        self.startTimer();
    },
    // override in subclasses
    renderFrame: function() {
    	var self = this;
        console.log("TimedGame.renderFrame");
    },
    // override in subclasses...
    initializeTask: function() {
    	var self = this;
        self.answer = null;
        self.task = new NullTask();    	
    },
    // override in subclasses...
    generateReport: function(evalResult) {
        return [
            this.loc("Total time") + ": " + (evalResult.totalTime / 1000) + " s"
        ];
    },
    startTimer: function() {
        var self = this;
        self.currentTime = 0;
        self.stopwatch.reset();
        var timer = new Timer();
        this.timer = timer;
        timer.start({precision: 'secondTenths', callback: function (values) {
            var elapsedMillis = values.secondTenths * 100 + values.seconds * 1000 + values.minutes * 60000 + values.hours * 3600000;
            self.currentTime = elapsedMillis;
            self.update(elapsedMillis);
        }});
    },
    // override in subclasses
    update: function(elapsedMillis) {
    	console.log("TimedGame.update", elapsedMillis, this.stopwatch.millis());
    },
    abort: function() {
        this.base();       
        this.timer.stop(); 
    },
    finish: function(result) {
        this.timer.stop(); 
        this.base(result);       
    }
},{
});
