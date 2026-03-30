var QuestionaryTask = Task.extend({
    validate: function(answer) {
        return (answer.length > 0);
    },
    evaluate: function(answer) {
        var questionsTotal = answer.length;
        return {
            questionsTotal: questionsTotal
        }
    }
});



var Questionary = Game.extend({
    constructor: function(config) {
        this.base(config);
    },
    // set default embedding options for this Game
    getEmbeddingOptions: function() {
        return {
            renderTitle: false,
            renderAbortButton: true
        };
    },
    createGUI: function(r) {
        var self = this;
        this.body = new GroupWidget();         
    },
    generateTaskData: function(options) {
        return null;
    },            
    renderQuestion: function(q, moreQuestions) {
        var self = this;
        console.log("Questionary.renderQuestion", q, moreQuestions);
        this.body.clearContents();
        this.renderQuestionTitle(q);
        var ans = q.answers;
        var yy = 200;
        var ndx = 0;
        this.answerWidgets = [];
        ans.forEach(function(a) {
            var qa = self.renderQuestionAnswer(a, ndx, yy);
            yy = qa["y"];
            self.answerWidgets.push(qa["btn"]);
            ndx++;
        });
        if(moreQuestions) {
            this.renderNextButton(q);
        } else {
            this.renderFinishButton(q);
        }
    },
    evaluateTest: function(answers) {
        console.log("Questionary.evaluate");
        console.log("Answers:", answers);
        this.timer.stop(); 
        var scoring = this.questionary.scoring;
        var questions = this.questionary.questions;
        var score = 0;
        for(var i=0; i<answers.length; i++) {
            var ndx = answers[i];
            var question = questions[i];
            var selectedAnswer = question.answers[ndx];
            console.log("Question:", question.question, "Answer:", selectedAnswer);
            score += selectedAnswer.score;
        }
        console.log("Total score:", score);
        var ndx = -1;
        for(var i=0; i<scoring.length; i++) {
            var sc = scoring[i];
            if(score >= sc.from && score <= sc.to) {
                ndx = i;
                break;
            }
        }
        var verdict = "unknown";
        if(ndx >= 0) {
            verdict = scoring[ndx].verdict;
        }
        console.log("Result:", verdict);
        this.body.clearContents();
        this.renderResultsPage(this.questionary, score, ndx, verdict);
    },
    renderFrame: function() {
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
    },
    renderSlideBackground: function(slide) {
        if(slide.backgroundUrl) {
            var img = new ImageWidget(this.gamepack.questionaryBaseUrl + "/" + slide.backgroundUrl, 1000, 1000);
            this.body.addChild(img);
        }
    },
    renderQuestionTitle: function(slide) {
        if(slide.question) {
            var labelSvg = new TextWidget(600, 40, "middle", slide.question);
            labelSvg.setPosition(200, 30)
            labelSvg.setStyle({"fill": "orange"})
            this.body.addChild(labelSvg);
        }
    },
    renderQuestionAnswer: function(ans, ndx, yy) {
        var self = this;
        if(ans.answer) {
            var labelSvg = new TextWidget(700, 40, "start", ans.answer);
            labelSvg.setPosition(200, yy)
            labelSvg.setStyle({"fill": "black"})
            this.body.addChild(labelSvg);
            // add "radio" button
            var circ = new CircleWidget(30);
            circ.setPosition(100, yy-10);
            var unselectedBtnStyle = {"fill": "white", "stroke": "black", "stroke-width": 3};
            var selectedBtnStyle = {"fill": "green", "stroke": "black", "stroke-width": 3};
            circ.setStyle(unselectedBtnStyle);
            var clk = new Clickable(circ);
            clk.onClick(function() {
                console.log("Clicked!", ans, ndx);
                self.answer[self.currentFrame] = ndx;
                for(var i=0; i<self.answerWidgets.length; i++) {
                    self.answerWidgets[i].setStyle(i==ndx ? selectedBtnStyle : unselectedBtnStyle);
                    self.nextButton.setEnabled(true);
                }
            });
            // TODO move this stuff to TextWidget
            var bbox = labelSvg.getTextboxSize();
            yy += Math.min(100, bbox.height) + 100;
            this.body.addChild(clk);
        }
        return { "y": yy, "btn": circ };
    },
    renderPageTitle: function(slide) {
        if(slide.title) {
            var labelSvg = new TextWidget(600, 40, "middle", slide.title);
            labelSvg.setPosition(200, 30)
            labelSvg.setStyle({"fill": "orange"})
            this.body.addChild(labelSvg);
        }
    },
    renderPageSubtitle: function(slide) {
        if(slide.subtitle) {
            var tw = new TextWidget(600, 30, "middle", slide.subtitle);
            tw.setStyle({"fill": "#ddd"})
            tw.setPosition(200, 130);
            this.body.addChild(tw);
        }
    },
    renderPageDescription: function(slide) {
        if(slide.description) {
            var tw = new TextWidget(800, 20, "start", slide.description);
            tw.setStyle({"fill": "white"})
            tw.setPosition(100, 200);
            this.body.addChild(tw);
        }
    },
    renderPageInstructions: function(slide) {
        if(slide.instructions) {
            var tw = new TextWidget(800, 20, "start", slide.instructions);
            tw.setStyle({"fill": "white"})
            tw.setPosition(100, 300);
            this.body.addChild(tw);
        }
    },
    renderStartButton: function(slide) {
        var self = this;
        btn1 = new ButtonWidget(this.loc("Start"), {fontSize: 35, border: 20, anchor: "middle", radius: 30});
        btn1.setPosition(500-btn1.w/2, 900);
        btn1.onClick(function() {
            self.startSurvey();
        });
        this.body.addChild(btn1);
    },
    renderNextButton: function(slide) {
        var self = this;
        btn1 = new ButtonWidget(this.loc("Next"), {fontSize: 35, border: 20, anchor: "middle", radius: 30});
        btn1.setPosition(500-btn1.w/2, 900);
        btn1.setEnabled(false);
        btn1.onClick(function() {
            self.currentFrame++;
            self.showQuestion();
        });
        this.nextButton = btn1;
        this.body.addChild(btn1);
    },
    renderFinishButton: function(slide) {
        var self = this;
        btn1 = new ButtonWidget(this.loc("Finish"), {fontSize: 35, border: 20, anchor: "middle", radius: 30});
        btn1.setPosition(500-btn1.w/2, 900);
        btn1.setEnabled(false);
        btn1.onClick(function() {
            self.evaluateTest(self.answer);
        });
        this.nextButton = btn1;
        this.body.addChild(btn1);
    },
    renderResultsButton: function(slide) {
        var self = this;
        btn1 = new ButtonWidget(this.loc("OK"), {fontSize: 35, border: 20, anchor: "middle", radius: 30});
        btn1.setPosition(500-btn1.w/2, 900);
        btn1.onClick(function() {
            self.finish(self.answer);
        });
        this.body.addChild(btn1);
    },
    renderIntroPage: function(questionary) {
        this.renderStartButton(questionary);
        this.renderPageTitle(questionary);
        this.renderPageSubtitle(questionary);
        this.renderPageDescription(questionary);
        this.renderPageInstructions(questionary);
    },
    renderResultsPage: function(questionary, score, ndx, verdict) {
        this.renderPageTitle(questionary);
        this.renderResultsButton(questionary);
        var tw = new TextWidget(600, 30, "middle", this.loc("Score"));
        tw.setStyle({"fill": "gray"})
        tw.setPosition(200, 240);
        var tw2 = new TextWidget(600, 100, "middle", ""+score);
        tw2.setStyle({"fill": "white"})
        tw2.setPosition(200, 300);
        var tw3 = new TextWidget(600, 30, "middle", this.loc("Result"));
        tw3.setStyle({"fill": "gray"})
        tw3.setPosition(200, 490);
        var tw4 = new TextWidget(600, 60, "middle", verdict);
        tw4.setStyle({"fill": "white"})
        tw4.setPosition(200, 550);
        this.body.addChild(tw);
        this.body.addChild(tw2);
        this.body.addChild(tw3);
        this.body.addChild(tw4);
    },
    loadGamepackData: function() {
        var self = this;
        var name = self.meta.gamepackName;
        console.log("Questionary.loadGamepack", name);
        var gamepackUrl = self.meta.appBaseUrl + "/gamepacks/" + name;
        var questionaryUrl = self.meta.appBaseUrl + "/"+ self.meta.res("questionary");
        console.log("Questionary.loadGamepack:getJSON", questionaryUrl);
        return fetch(questionaryUrl)
            .then(function(r) { return r.json(); })
            .then(function(questionary) {
                console.log("Questionary data loaded:", questionary);
                return {name:name, url:gamepackUrl, questionaryUrl: questionaryUrl, questionaryBaseUrl: dirname(questionaryUrl), questionary:questionary};
            })
            .catch(function(err) { console.error(err); });
    },
    start: function(gamedata) {
        this.base(gamedata);
        var self = this;
        console.log("Questionary:start", self.meta);

        // choose a gamepack
        self.loadGamepackData().then(function(gamepack) {
            console.log("Gamepack loaded", gamepack);
            self.gamepack = gamepack;
            self.questionary = gamepack.questionary;
            self.renderIntroPage(self.questionary);
        });
    },
    startSurvey: function() {
        var self = this;
        console.log("Questionary.startSurvey", self.questionary);
        self.currentFrame = 0;
        self.totalFrames = self.questionary.questions.length;
        self.answer = makeFilled(self.totalFrames, -1);
        self.task = new QuestionaryTask();
        self.startTimer();
        self.showQuestion();
    },
    showQuestion: function() {
        // gets next question and displays it...
        if(this.currentFrame < this.totalFrames) {
            var question = this.questionary.questions[this.currentFrame];
            var moreQuestions = (this.currentFrame < this.totalFrames-1);
            this.renderQuestion(question, moreQuestions);
        } else {
            console.error("No more questions!");
        }
    },
    generateReport: function(evalResult) {
        var qa = this.questionary.questions;
        var totalScore = 0;
        for(var i=0; i<qa.length; i++) {
            var question = truncateOnWord(qa[i].question, 25);
            var score = qa[i].answers[this.answer[i]].score;
            totalScore += score;
        }
        console.log("Questions:", qa, "answers:", this.answer);
        var out = [
            this.loc("Score") + ": " + totalScore,
            this.loc("Question count") + ": " + evalResult.questionsTotal,
            ""
        ];
        for(var i=0; i<qa.length; i++) {
            var question = truncateOnWord(qa[i].question, 25);
            var score = qa[i].answers[this.answer[i]].score + "";
            out.push({"items":[
                {x:0, text: (i+1)+".", textAnchor: "start"},
                {x:50, text: question, textAnchor: "start"},
                {x:600, text: score, textAnchor: "start"}
            ]});
        }
        return out;
    },
    startTimer: function() {
        var self = this;
        self.currentTime = 0;
        var timer = new Timer();
        this.timer = timer;
        timer.start({precision: 'secondTenths', callback: function (values) {
            var elapsedMillis = values.secondTenths * 100 + values.seconds * 1000 + values.minutes * 60000 + values.hours * 3600000;
            self.currentTime = elapsedMillis;
            // console.log("Time", self.currentTime);
        }});
    },
    abort: function() {
        this.base();       
        if(this.timer) {
            this.timer.stop();
        }
    },
    finish: function(result) {
        this.timer.stop(); 
        this.base(result);       
    }
},{
});
