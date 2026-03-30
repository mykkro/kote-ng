
var CombineWordsGame = TimedGame.extend({
    constructor: function(config) {
        this.base(config);
    },
    createGUI: function(r) {
        var self = this;
        var btn = new ButtonWidget(this.loc("OK"), {fontSize: 40, border: 20, anchor: "middle", radius: 30});
        btn.setDisabled(true);
        btn.setPosition(455, 800);
        btn.onClick(function() {
            // evaluate the result...
            self.finish(self.answer);
        });
        this.okButton = btn;
    },
    generateTaskData: function(options) {
        return pickRandom(this.gamepack.wordlist.sets);
    },            
    renderFrame: function() {
        var self = this;

        var cAs = [];
        var cBs = [];
        var lastCA = null;
        var lastCB = null;
        var selectedA = null;
        var selectedB = null;

        noConnections = 0;
        connections = {};

        var disconnectComponents = function(cA, cB) {
            cA.child.setStyle({"fill": "white"}); 
            cB.child.setStyle({"fill": "white"}); 
            cA.selected = false;
            cB.selected = false;
            noConnections--;
            delete connections[cA.order];
            self.okButton.setDisabled(true);
        }


        var connectComponents = function(cA, cB) {
            cA.child.setStyle({"fill": "gray"}); 
            cB.child.setStyle({"fill": "gray"}); 
            cA.selected = true;
            cB.selected = true;
            selectedA = null;
            selectedB = null;
            lastCA = null;
            lastCB = null;
            var nA = cA.order;
            var nB = cB.order;
            r.line(350+10, nA*self.lineHeight+300+self.boxHeight/2, 650-10, nB*self.lineHeight+300+self.boxHeight/2).attr({
                "stroke-width": 10, "stroke": "red", 'arrow-end': 'classic-wide-long', 
        'arrow-start': 'classic-wide-long' }).click(function() {
                this.remove();
                disconnectComponents(cAs[nA], cBs[nB]);
            });
            connections[nA] = nB;
            noConnections++;
            if(noConnections == self.orig.length) {
                self.answer = [];
                for(var i=0; i<self.orig.length; i++) {
                    var ccA = cAs[i];
                    var ccB = cBs[connections[i]];
                    self.answer.push(ccB.number);
                }
                self.okButton.setDisabled(false);   
            }
        }

        var boxHeight = 60;
        this.boxHeight = boxHeight;
        var gap = 20;
        var lineHeight = boxHeight + gap;
        this.lineHeight = lineHeight;
        var fontSize = 35;
        var labelBoxWidth = 200;
        var labelWidth = 150;
        for(var i=0; i<self.orig.length; i++) {
            var bkgrA = new RectWidget(labelBoxWidth, boxHeight);
            bkgrA.setPosition(150, 300+lineHeight*i);
            var bkgrB = new RectWidget(labelBoxWidth, boxHeight);
            bkgrB.setPosition(650, 300+lineHeight*i);
            var labelA = new TextWidget(labelWidth, fontSize, "middle", self.p1[self.orig[i]]);
            labelA.setPosition(150+25, 300+10+lineHeight*i);
            var labelB = new TextWidget(labelWidth, fontSize, "middle", self.p2[self.perm[i]]);
            labelB.setPosition(650+25, 300+10+lineHeight*i);
            var cA = new Clickable(bkgrA);
            cA.order = self.orig[i];
            cA.number = self.orig[i];
            cA.onClick(function(cc, e) {
                if(cc.selected) return;
                if(lastCA) {
                    lastCA.child.setStyle({"fill": "white"});    
                }
                if(lastCA != cc) {
                    cc.child.setStyle({"fill": "green"});
                    lastCA = cc;
                    selectedA = cc.order;
                    if(selectedA !== null && selectedB !== null) {
                        connectComponents(cAs[selectedA], cBs[selectedB]);
                    }
                }
            });
            var cB = new Clickable(bkgrB);
            cB.number = self.perm[i];
            cB.order = self.orig[i];
            cB.onClick(function(cc, e) {
                if(cc.selected) return;
                if(lastCB) {
                    lastCB.child.setStyle({"fill": "white"});    
                }
                if(lastCB != cc) {                        
                    cc.child.setStyle({"fill": "orange"});
                    lastCB = cc;
                    selectedB = cc.order;
                    if(selectedA !== null && selectedB !== null) {
                        connectComponents(cAs[selectedA], cBs[selectedB]);
                    }
                }
            });
            cAs.push(cA);
            cBs.push(cB);

        }

    },

    generateReport: function(evalResult) {
        console.log("Generate report", evalResult);
        return [
            this.loc("Correctness") + ": "+ sprintf("%.1f%%", evalResult.correctness * 100),
            this.loc("Total time") + ": " + sprintf("%.2f s", this.stopwatch.millis() / 1000)
        ];
    },

  update: function(elapsedMillis) {
  },
  loadGamepackData: function() {
        var self = this;
        var name = self.meta.gamepackName;
        var gamepackUrl = self.meta.appBaseUrl + "/gamepacks/" + name;
        var wordlistUrl = self.meta.appBaseUrl + "/"+ self.meta.res("wordlist");
        return fetch(wordlistUrl).then(function(r) { return r.json(); }).then(function(wordlist) {
            console.log("Data loaded:", wordlist, wordlistUrl);
            return {name:name, url:gamepackUrl, wordlistUrl: wordlistUrl, wordlist:wordlist};
        });
    },
    initializeTask: function() {
        var gamedata = this.gamedata;
        var self = this;
        self.wordlistBaseUrl = dirname(self.gamepack.wordlistUrl);

        var p1=[], p2=[], orig=[], perm=[];
        var i=0;
        gamedata.forEach(function(p) {
            var pp = p.split("-");
            p1.push(pp[0]);
            p2.push(pp[1]);  
            orig.push(i);
            perm.push(i++);                  
        });
        shuffle(perm);
        this.p1 = p1;
        this.p2 = p2;
        this.orig = orig;
        this.perm = perm;

        this.task = new SequenceBinaryTask(this.orig);
    }
},{
    sets: [
        [
            "AUTO-MOBIL",
            "TELE-VIZE",
            "PREZI-DENT",
            "EKO-LOGIE",
            "KALKU-LACE",
            "DOMOV-NICE"
        ],
        [
            "DINO-SAURUS",
            "ABE-CEDA",
            "NOSO-ROŽEC",
            "ANTI-LOPA",
            "MANDA-RINKA",
            "ČOKO-LÁDA"
        ], [
            "TRAKTO-RISTA",
            "PALA-ČINKA",
            "ROVNO-VÁHA",
            "KOLO-BĚŽKA",
            "ZELE-NINA",
            "ALI-GÁTOR"
        ], [
            "PÍSKO-VIŠTĚ",
            "ANA-KONDA",
            "POLI-CIE",
            "KORMI-DELNÍK",
            "AKVÁ-RIUM",
            "LOKOMO-TIVA"
        ], [
            "ORAN-GUTAN",
            "KATE-DRÁLA",
            "MODE-LÍNA",
            "DALE-KOHLED",
            "LIMO-NÁDA",
            "KAPI-TOLA"
        ], [
            "HORO-LEZEC",
            "FANTA-ZIE",
            "VYSVĚD-ČENÍ",
            "CHAME-LEON",
            "NOHA-VICE",
            "HARMO-NIKA"
        ], [
            "NÁPO-VĚDA",
            "ŘEDI-TELNA",
            "MUCHO-LAPKA",
            "KAPI-TOLA",
            "GRAVI-TACE",
            "SITU-ACE"
        ]
    ]
});
