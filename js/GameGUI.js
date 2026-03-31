
/* Game GUI manager. */
class GameGUI extends Base {
    constructor(appgui, instance, options) {
        super();
        console.log("Creating Game GUI", instance);
        this.appgui = appgui;
        this.instance = instance;
        this.url = instance.appBaseUrl;
        this.options = options || {};
        this.settingskey = "settings-" + this.appgui.usertoken + "-" + this.instance.appName + "-" + this.appgui.locale
        console.log("SettingsKey:", this.settingskey)
    }

    logGameEvent(eventType, eventData, eventData2, eventData3) {
        historyLogger.logGameEvent(this.instance.appName, this.instance.gamepackName, this.appgui.locale, this.gameSettings, eventType, eventData, eventData2, eventData3);
    }

    loadScriptAndStyle() {
        var self = this;
        // load style dynamically
        var link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = this.url + '/style.css';
        document.head.appendChild(link);
        // load script dynamically — executes in global scope, same as jQuery's dataType:'script'
        return new Promise(function(resolve, reject) {
            var script = document.createElement('script');
            script.src = self.url + '/script.js';
            script.onload  = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // show various GUI pages
    showGameLauncherPage() {
        r.clear();
        this.showGameTitle();
        this.showGamePreviewImage();
        this.showGameSubtitle();
        this.createGameLauncherButtons();
    }

    showInstructionsPage() {
        r.clear();
        this.showGameTitle();
        this.showGameDescription();
        this.showGameInstructions();
        this.showGameSubtitle();
        this.createInstructionsPageButtons();
    }

    showSettingsPage() {
        r.clear();
        this.showGameTitle();
        this.createSettingsPageButtons();
        document.getElementById('settings-form-outer').style.display = 'block';
    }

    showHistoryPage() {
        r.clear();
        this.showHtmlHistoryPage();
        this.showGameTitle();
        this.createHistoryPageButtons();
    }

    showHtmlHistoryPage() {
        var self = this;
        document.getElementById('history-form-outer').style.display = 'block';
        // TODO search only this game's data
        FINDERBYGAME(this.instance.appName, this.instance.gamepackName, this.appgui.locale).then(function(data) {
            self.appgui.historyLogger.renderHistory(self.appgui.localeLong, data, self.instance.tr("History is empty"));
        });
    }

    hideHtmlHistoryPage() {
        document.getElementById('history-form-outer').style.display = 'none';
    }

    createHistoryPageButtons() {
        var backBtn = new ButtonWidget(this.instance.tr("Back"), this.buttonStyle);
        var gap = 40;
        var yy = 900;
        Widget.layoutButtons([backBtn], gap, yy);
        var self = this;

        backBtn.onClick(function() {
            self.hideHtmlHistoryPage();
            self.showGameLauncherPage();
        });

        return [backBtn];
    }

    showAboutPage() {
        r.clear();
        /* display SVG About Page */
        if(!AppsGUI.showHTML) {
            this.showCredits();
        } else {
            this.showHtmlAboutPage();
        }
        this.showGameTitle();
        this.createAboutPageButtons();
    }

    showHtmlAboutPage() {
        document.getElementById('about-form-outer').style.display = 'block';
        var credits = this.instance.credits;
        AppsGUI.displayCreditsTextHtml(credits);
    }

    hideHtmlAboutPage() {
        document.getElementById('about-form-outer').style.display = 'none';
    }

    showCredits() {
        var credits = this.instance.credits;
        AppsGUI.displayCreditsText(credits);
    }

    createAboutPageButtons() {
        var backBtn = new ButtonWidget(this.instance.tr("Back"), this.buttonStyle);
        var gap = 40;
        var yy = 900;
        Widget.layoutButtons([backBtn], gap, yy);
        var self = this;

        backBtn.onClick(function() {
            self.hideHtmlAboutPage();
            self.showGameLauncherPage();
        });

        return [backBtn];
    }

    showResultsPage(results, messages) {
        r.clear();
        this.showGameTitle();
        this.showGameResults(results, messages);
        this.createResultsPageButtons();
    }

    showGameSelectionPage() {
        // If we were launched from an external page (e.g. apps.php), go back there.
        if (typeof KOTE_BACK_URL !== 'undefined' && KOTE_BACK_URL) {
            window.location.href = KOTE_BACK_URL;
        } else {
            this.appgui.showMainPage();
        }
    }

    // render various widgets
    showGameResults(results, messages) {
        var labelSvg = new TextWidget(600, 40, "middle", this.instance.tr("Results"));
        labelSvg.setPosition(200, 160);
        labelSvg.setStyle({"fill": "black"});

        var yy = 250;
        messages.forEach(function(m) {
            // m can be object!
            var textItems = [];
            if(m.text || m.items) {
                if(m.text) {
                    textItems.push(m);
                } else {
                    textItems = m.items;
                }
            } else {
                textItems.push({text: m});
            }
            textItems.forEach(function(ti) {
                var x = ti.x || 0;
                var fontSize = ti.fontSize || 30;
                var textAnchor = ti.textAnchor || "middle";
                var msg = new TextWidget(600, fontSize, textAnchor, ti.text);
                msg.setPosition(200+x, yy);
            })
            yy += 40;
        });

    }

    showGameSubtitle() {
        var tw = new TextWidget(600, 30, "middle", this.instance.tr("$subtitle"));
        tw.setStyle({"fill": "#ddd"})
        tw.setPosition(200, 130);
    }

    showGameDescription() {
        var tw = new TextWidget(800, 20, "start", this.instance.tr("$description"));
        tw.setStyle({"fill": "white"})
        tw.setPosition(100, 200);
    }

    showGameInstructions() {
        var tw = new TextWidget(800, 25, "start", this.instance.tr("$instructions"));
        tw.setStyle({"fill": "white"})
        tw.setPosition(100, 400);
    }

    showGameTitle() {
        var labelSvg = new TextWidget(600, 40, "middle", this.instance.tr("$title"));
        labelSvg.setPosition(200, 60)
        labelSvg.setStyle({"fill": "orange"})
        return labelSvg;
    }

    showGamePreviewImage() {
        var self = this;
        var previewUrl = this.instance.appBaseUrl + "/"+ this.instance.res("preview");
        var img = new ImageWidget(previewUrl, 500, 500);
        img.setPosition(250, 200);
        var clk = new Clickable(img);
        clk.onClick(function() {
            self.startGame();
        });
        return clk;
    }

    // lays out buttons in centered layout
    // create buttons
    createGameLauncherButtons() {
        var self = this;
        var startBtn = new ButtonWidget(this.instance.tr("Start"), this.buttonStyle);
        var settingsBtn = null;
        var instrBtn = new ButtonWidget(this.instance.tr("Instructions"), this.buttonStyle);
        var exitBtn = null;
        if(!(this.options.hideEndButton)) {
            exitBtn = new ButtonWidget(this.instance.tr("Exit"), this.buttonStyle);
            exitBtn.onClick(function() {
                self.showGameSelectionPage();
            });
        }
        var historyBtn = new ButtonWidget(this.instance.tr("History"), this.buttonStyle);
        historyBtn.onClick(function() {
            self.showHistoryPage();
        });

        /*
        var aboutBtn = new ButtonWidget(this.instance.tr("About"), this.buttonStyle);
        aboutBtn.setEnabled(true);
        aboutBtn.onClick(function() {
            self.showAboutPage();
        });
        */

        var configFields = this.instance.config || [];
        console.log("Config fields:", configFields);
        if(configFields.length > 0) {
            settingsBtn = new ButtonWidget(this.instance.tr("Settings"), this.buttonStyle);
            settingsBtn.onClick(function() {
                self.showSettingsPage();
            });
        }

        var gap = 30;
        var yy = 900;
        var btns = [];
        btns.push(startBtn);
        if(settingsBtn) {
            btns.push(settingsBtn);
        }
        btns.push(instrBtn);
        btns.push(historyBtn);
        //btns.push(aboutBtn);
        if(exitBtn) {
            btns.push(exitBtn);
        }
        Widget.layoutButtons(btns, gap, yy);

        // bind events
        startBtn.onClick(function() {
            self.startGame();
        });


        instrBtn.onClick(function() {
            self.showInstructionsPage();
        });

        return btns;
    }

    createInstructionsPageButtons() {
        var backBtn = new ButtonWidget(this.instance.tr("Back"), this.buttonStyle);
        var gap = 40;
        var yy = 900;
        Widget.layoutButtons([backBtn], gap, yy);
        var self = this;

        // bind events
        backBtn.onClick(function() {
            self.showGameLauncherPage();
        });

        return [backBtn];
    }

    retryUntilWritten(db, doc) {
        return db.get(doc._id).then(function (origDoc) {
          doc._rev = origDoc._rev;
          return db.put(doc);
        }).catch(function (err) {
          if (err.status === 409) {
            return retryUntilWritten(doc);
          } else { // new doc
            return db.put(doc);
          }
        });
    }

    createSettingsPageButtons() {
        var saveBtn = new ButtonWidget(this.instance.tr("Save"), this.buttonStyle);
        var resetBtn = new ButtonWidget(this.instance.tr("Reset"), this.buttonStyle);
        var backBtn = new ButtonWidget(this.instance.tr("Back"), this.buttonStyle);
        var gap = 40;
        var yy = 900;
        Widget.layoutButtons([saveBtn, resetBtn, backBtn], gap, yy);
        var self = this;

        // bind events
        saveBtn.onClick(function() {
            // TODO validate settings
            var valid = self.form.validate();
            if(valid) {
                self.gameSettings = self.form.val();
                // TODO store the settings to the DB
                self.retryUntilWritten(self.appgui.db, {_id: self.settingskey, settings: self.gameSettings}).then(function() {
                    console.log("Game settings: ", self.gameSettings);
                    // TODO store globally...
                    document.getElementById('settings-form-outer').style.display = 'none';
                    self.showGameLauncherPage();
                })
            } else {
                console.log("Form not valid!");
            }
        });

        resetBtn.onClick(function() {
            self.form.val(self.gameSettings);
            self.form.validate();
        });

        backBtn.onClick(function() {
            document.getElementById('settings-form-outer').style.display = 'none';
            self.showGameLauncherPage();
        });

        return [saveBtn, resetBtn, backBtn];
    }

    createResultsPageButtons() {
        var againBtn = new ButtonWidget(this.instance.tr("Run again"), this.buttonStyle);
        var backBtn = new ButtonWidget(this.instance.tr("Back"), this.buttonStyle);
        var gap = 40;
        var yy = 900;
        Widget.layoutButtons([againBtn, backBtn], gap, yy);
        var self = this;

        // bind events
        againBtn.onClick(function() {
            self.startGame();
        });

        backBtn.onClick(function() {
            self.showGameLauncherPage();
        });

        return [againBtn, backBtn];
    }

    createAbortButton() {
        var abortBtn = new ButtonWidget(this.instance.tr("Exit"), {fontSize: 30, border: 15, anchor: "middle", radius: 20});
        abortBtn.setPosition(1000-abortBtn.w-10, 10);
        return abortBtn;
    }

    /**
     *  Initializes the game widget abnd starts the game.
    */
    startGame() {
        var self = this;
        console.log("Starting the game!");
        var game = new window[self.instance.app.app.gameClass](this.gameSettings);

        // log event: start game
        self.logGameEvent("gameCreated", null);

        game.baseUrl = self.url;
        game.meta = self.instance;
        game.gui = self;

        game.loc = function(str) {
            return self.instance.tr(str);
        };
        this.gameInstance = game;
        this.appgui.resetScene();

        game.createGUI(r);

        var eo = game.embeddingOptions;
        console.log("Embedding options:", eo);

        if(eo.renderTitle) {
            var labelSvg = this.showGameTitle();
        }
        if(eo.renderAbortButton) {
            var abortBtn = this.createAbortButton();
            abortBtn.onClick(function() {
                game.abort();
                self.showGameLauncherPage();
            });
        }

        game.onFinish(function(result, messages) {
            console.log("Finished with result:", result);
            self.showResultsPage(result, messages);
        });
        game.onAbort(function() {
            console.log("Aborted!");
            self.showGameLauncherPage();
        });
        game.start();
    }

    start() {
        var self = this;
        self.loadScriptAndStyle().then(function() {
            console.log("GameGUI.start - script and style loaded!")
            console.log(self.instance);
            self.settings = self.instance.settings;

            // put code here...
            self.appgui.resetScene();

            self.game = new window[self.instance.app.app.gameClass]({});
            self.game.baseUrl = self.url;
            self.game.gui = self;

            var configForm = {
                "title": self.instance.tr("Settings"),
                "description": "",
                "fields": self.instance.config
            }
            self.form = new Form(configForm, function(loc) { return self.instance.tr(loc); });
            var formEl = document.getElementById('form');
            formEl.innerHTML = '';
            formEl.appendChild(self.form.body);

            self.appgui.db.get(self.settingskey)
            .then(function(data) {
                console.log("Received data from DB!", data)
                self.doStart(data.settings)
            }).catch(function(err) {
                console.log("Cannot retrieve settings, using defaults")
                self.gameSettings = self.form.val();
                self.doStart(self.gameSettings)
            })

        });
    }

    doStart(settings) {
        var self = this;
        self.gameSettings = settings
        self.form.val(settings);
        console.log("Using settings:", self.gameSettings);
        self.showGameLauncherPage();
    }

    static buttonStyle = {
        fontSize: 30, border: 15, anchor: "middle", radius: 25
    };
}
