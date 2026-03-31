


class Slideshow extends Game {
    constructor(config) {
        super(config);
    }
    // set default embedding options for this Game
    getEmbeddingOptions() {
        return {
            renderTitle: false,
            renderAbortButton: false
        };
    }
    createGUI(r) {
        var self = this;
        this.body = new GroupWidget();
    }
    generateTaskData(options) {
        return null;
    }
    renderFrame() {
        var self = this;
        this.body.clearContents();
        if(this.currentFrame >= this.totalFrames) {
            // no more slides!
        } else {
            var slide = this.slides[this.currentFrame];
            console.log("slide:", slide);
            if(slide.type=="intro") {
                this.renderIntroSlide(slide);
            } else if(slide.type=="content") {
                this.renderContentSlide(slide);
            } else if(slide.type=="outro") {
                this.renderOutroSlide(slide);
            } else {
                console.error("Unsupported slide type: "+slide.type);
            }
        }
    }
    renderSlideBackground(slide) {
        if(slide.backgroundUrl) {
            var img = new ImageWidget(this.gamepack.slideshowBaseUrl + "/" + slide.backgroundUrl, 1000, 1000);
            this.body.addChild(img);
        }
    }
    renderSlideTitle(slide) {
        if(slide.title) {
            var labelSvg = new TextWidget(600, 40, "middle", slide.title);
            labelSvg.setPosition(200, 30)
            labelSvg.setStyle({"fill": "orange"})
            this.body.addChild(labelSvg);
        }
    }
    renderSlideSubtitle(slide) {
        if(slide.subtitle) {
            var tw = new TextWidget(600, 30, "middle", slide.subtitle);
            tw.setStyle({"fill": "#ddd"})
            tw.setPosition(200, 130);
            this.body.addChild(tw);
        }
    }
    renderSlideDescription(slide) {
        if(slide.description) {
            var tw = new TextWidget(800, 20, "start", slide.description);
            tw.setStyle({"fill": "white"})
            tw.setPosition(100, 200);
            this.body.addChild(tw);
        }
    }
    renderContentSlideTitle(slide) {
        if(slide.title) {
            var labelSvg = new TextWidget(600, 40, "middle", slide.title);
            labelSvg.setPosition(200, 30)
            labelSvg.setStyle({"fill": "orange"})
            this.body.addChild(labelSvg);
        }
    }
    renderStartButton(slide) {
        var self = this;
        btn1 = new ButtonWidget(this.loc("Start"), {fontSize: 35, border: 20, anchor: "middle", radius: 30});
        btn1.setPosition(500-btn1.w/2, 900);
        btn1.onClick(function() {
            self.goToNextSlide();
        });
        this.body.addChild(btn1);
    }
    renderNextButton(slide) {
        var self = this;
        btn1 = new ButtonWidget(this.loc("Next"), {fontSize: 35, border: 20, anchor: "middle", radius: 30});
        btn1.setPosition(500-btn1.w/2, 900);
        btn1.onClick(function() {
            self.goToNextSlide();
        });
        this.body.addChild(btn1);
    }
    renderFinishButton(slide) {
        var self = this;
        btn1 = new ButtonWidget(this.loc("Finish"), {fontSize: 35, border: 20, anchor: "middle", radius: 30});
        btn1.setPosition(500-btn1.w/2, 900);
        btn1.onClick(function() {
            self.answer[self.currentFrame] = 1;
            self.finish(self.answer);
        });
        this.body.addChild(btn1);
    }
    renderIntroSlide(slide) {
        this.renderSlideBackground(slide);
        this.renderStartButton(slide);
        this.renderSlideTitle(slide);
        this.renderSlideSubtitle(slide);
        this.renderSlideDescription(slide);
    }
    renderOutroSlide(slide) {
        this.renderSlideBackground(slide);
        this.renderFinishButton(slide);
        this.renderSlideTitle(slide);
        this.renderSlideSubtitle(slide);
        this.renderSlideDescription(slide);
    }
    renderContentSlide(slide) {
        this.renderSlideBackground(slide);
        this.renderNextButton(slide);
        this.renderContentSlideTitle(slide);
    }
    goToNextSlide() {
        this.advanceFrame();
    }
    advanceFrame() {
        // indicate that the slide has been read
        // TODO also when
        var slide = this.slides[this.currentFrame];
        console.log("Last slide", slide, "Time", this.currentTime);
        this.answer[this.currentFrame] = 1;
        this.currentFrame++;
        this.renderFrame();
    }
    loadGamepackData() {
        var self = this;
        var gamepackUrl = self.meta.appBaseUrl + "/gamepacks/" + self.meta.gamepackName;
        var slideshowUrl = self.meta.appBaseUrl + "/"+ self.meta.res("slideshow");
        var slideshowBaseUrl = dirname(slideshowUrl);
        return fetch(slideshowUrl).then(function(r) { return r.json(); }).then(function(slideshow) {
            console.log("Slideshow data loaded:", slideshow);
            return {name:name, url:gamepackUrl, slideshowUrl: slideshowUrl, slideshowBaseUrl: slideshowBaseUrl, slideshow:slideshow};
        });
    }
    start(gamedata) {
        super.start(gamedata);
        var self = this;
        console.log("Slideshow:start", self.meta);

        self.loadGamepackData().then(function(gamepack) {
            console.log("Gamepack loaded", gamepack);
            self.gamepack = gamepack;
            self.slides = gamepack.slideshow.slides;
            self.currentFrame = 0;
            self.totalFrames = self.slides.length;
            self.answer = makeZeroes(self.totalFrames);

            self.task = new InstructionalTask();
            self.startTimer();
            self.renderFrame();
        });
    }
    generateReport(evalResult) {
        return [
            this.loc("Page count") + ": " + evalResult.pagesTotal
        ];
    }
    startTimer() {
        var self = this;
        self.currentTime = 0;
        var timer = new Timer();
        this.timer = timer;
        timer.start({precision: 'secondTenths', callback: function (values) {
            var elapsedMillis = values.secondTenths * 100 + values.seconds * 1000 + values.minutes * 60000 + values.hours * 3600000;
            self.currentTime = elapsedMillis;
            console.log("Time", self.currentTime);
        }});
    }
    abort() {
        super.abort();
        this.timer.stop();
    }
    finish(result) {
        this.timer.stop();
        super.finish(result);
    }
}

window.Slideshow = Slideshow;
