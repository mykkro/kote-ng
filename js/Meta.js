/*
    Object wrapper for index.json - a database of all games and gamepacks.
*/

var Meta = function(index) {
  var self = this;
	this.index = index;
  this.appMap = {};
  this.localeMap = {};
  this.index.apps.forEach(function(a) {
    var fullName = a.name + ":" + (a.gamepackName || "default");
  	self.appMap[fullName] = a;
  });
  this.index.locales.forEach(function(a) {
  	self.localeMap[a.name] = a;
  });
  console.log("Main:", index);
}
Meta.prototype.app = function(fullName) {
  var app = this.appMap[fullName];
  if(app) {
    return new MetaApp(app);
  }
}
Meta.prototype.locale = function(name) {
  var loc = this.localeMap[name];
  if(loc) {
    return new MetaLocale(loc);
  }
}
Meta.prototype.hasLocale = function(name) {
	return (name in this.localeMap) && !!this.localeMap[name];
}
Meta.prototype.hasApp = function(fullName) {
	return (fullName in this.appMap) && !!this.appMap[fullName];
}
Meta.prototype.locales = function() {
	return this.index.locales.map(function(l) { return l.name; });
}
Meta.prototype.apps = function() {
	return this.index.apps.map(function(a) { 
    return { name: a.name, gamepackName: (a.gamepackName || "default") }; 
  });
}
Meta.prototype.appsByLocale = function(loc) {
	var apps = [];
  var self = this;
  this.apps().forEach(function(a) {
    var fullName = a.name +":" + a.gamepackName;
  	var aa = self.app(fullName);
  	if(aa.hasLocale(loc)) {
      var gamepackName = (aa.gamepackName || "default");
      var gp = aa.gamepack(gamepackName);
      if(gp && gp.hasLocale(loc)) {
        apps.push({ name: a.name, gamepackName: gamepackName });
      }
    }
  });
  return apps;
}
Meta.prototype.localized = function(localeName) {
  if(!this.hasLocale(localeName)) {
    console.error("Locale not found: "+localeName);
    return null;
  }
  return new MetaLocalized(this, localeName);
}
Meta.prototype.instance = function(appName, gamepackName, localeName) {
	if(!this.hasLocale(localeName)) {
  	console.error("Locale not found: "+localeName);
    return null;
  }
  var app = this.app(appName + ":" + gamepackName);
  if(!app) {
  	console.error("App not found: "+appName + ":" + gamepackName);
    return null;
  }
	if(!app.hasLocale(localeName)) {
  	console.error("Locale not found for app '"+appName+"': "+localeName);
    return null;
  }
	if(!app.hasGamepack(gamepackName)) {
  	console.error("Gamepack not found for app '"+appName+"': "+gamepackName);
    return null;
  }
  return new MetaInstance(this, appName, gamepackName, localeName);
}

var MetaLocalized = function(meta, localeName) {
  this.meta = meta;
  this.localeName = localeName;
  this.locale = this.meta.locale(localeName);

  // extract metadata...
  this.metadata = {};
  var mm = this.locale.metadata();
  for(var key in mm) {
    this.metadata[key] = mm[key];
  }

  // extract translations...
  this.translations = {};
  var tr = this.locale.translations();
  for(var key in tr) {
    this.translations[key] = tr[key];
  }

  this.credits = this.locale.credits();
}
// translation method
MetaLocalized.prototype.tr = function(str) {
  if(str) {
    if(str.length>0 && str[0]=="$") {
      str = str.substring(1)
      return str in this.metadata ? this.metadata[str] : "$" + str;
    }
    return str in this.translations ? this.translations[str] : "{" + str + "}";
  }
}

var MetaInstance = function(meta, appName, gamepackName, localeName) {
	this.meta = meta;
	this.appName = appName;
  this.gamepackName = gamepackName;
  this.localeName = localeName;
  this.app = meta.app(appName + ":" + gamepackName);
  this.gamepack = this.app.gamepack(gamepackName);
  this.locale = this.meta.locale(localeName);
  this.appLocale = this.app.locale(localeName);
  this.gamepackLocale = this.gamepack.locale(localeName);

  // extract metadata...
  this.metadata = {};
  var mm = this.locale.metadata();
  for(var key in mm) {
  	this.metadata[key] = mm[key];
  }
  mm = this.appLocale.metadata()
  for(var key in mm) {
    if(mm[key]) {
    	this.metadata[key] = mm[key];
    }
  }
  mm = this.gamepackLocale.metadata()
  for(var key in mm) {
    if(mm[key]) {
	    this.metadata[key] = mm[key];
    }
  }

  // extract translations...
  this.translations = {};
  var tr = this.locale.translations();
  for(var key in tr) {
  	this.translations[key] = tr[key];
  }
  tr = this.appLocale.translations();
  for(var key in tr) {
    if(tr[key]) {
	    this.translations[key] = tr[key];
    }
  }
  tr = this.gamepackLocale.translations()
  for(var key in tr) {
    if(tr[key]) {
      this.translations[key] = tr[key];
    }
  }

  // extract credits...
  var self = this;
  this.credits = [];
  var cr;
  cr = this.locale.credits();
  cr.forEach(function(c) { self.credits.push(c);});
  cr = this.appLocale.credits();
  cr.forEach(function(c) { self.credits.push(c);});
  cr = this.gamepackLocale.credits()
  cr.forEach(function(c) { self.credits.push(c);});


  // find preview url
  this.appBaseUrl = "apps/" + appName;
  var gamepackUrl = "gamepacks/" + gamepackName;
  var gamepackPreviewUrl = gamepackUrl + "/preview.png";
  var appLocaleUrl = "locales/" + localeName;
  var gamepackLocaleUrl = gamepackUrl + "/locales/" + localeName;

  var previewUrl = null;
  if(this.app.hasPreview()) {
  	previewUrl = "preview.png";
  }
  if(this.appLocale.hasPreview()) {
  	previewUrl = appLocaleUrl + "/preview.png";
  }
  if(this.gamepack.hasPreview()) {
  	previewUrl = gamepackUrl + "/preview.png";
  }
  if(this.gamepackLocale.hasPreview()) {
  	previewUrl = gamepackLocaleUrl + "/preview.png";
  }
  this.previewUrl = previewUrl;

  // configuration...
  this.config = this.gamepack.config() || this.app.config() || [];

  // settings
  this.settings = {};
  var ss = this.app.settings();
  for(var key in ss) {
  	this.settings[key] = ss[key];
  }
  ss = this.gamepack.settings();
  for(var key in ss) {
  	this.settings[key] = ss[key];
  }

  // resources
  this.appResources = this.app.resources();
  this.gamepackResources = this.gamepack.resources();

  var resourceMap = {};
  for(var key in this.appResources) {
  	resourceMap[key] = "assets/" + this.appResources[key];
  }
  for(var key in this.gamepackResources) {
  	resourceMap[key] = gamepackUrl + "/assets/" + this.gamepackResources[key];
  }
  this.resourceMap = resourceMap;
}
// translation method
MetaInstance.prototype.tr = function(str) {
	if(str) {
  	if(str.length>0 && str[0]=="$") {
    	str = str.substring(1)
			return str in this.metadata ? this.metadata[str] : "$" + str;
    }
		return str in this.translations ? this.translations[str] : "{" + str + "}";
  }
}
MetaInstance.prototype.res = function(name) {
  if(name=="preview") {
  	return this.previewUrl;
  }
	return this.resourceMap[name];
}

var MetaApp = function(app) {
  var self = this;
	this.app = app;
  this.name = app.name;
  this.gamepackName = app.gamepackName || "default";
  this.fullName = this.name + ":" + this.gamepackName;
  this.gamepackMap = {};
  this.localeMap = {};
  this.app.gamepacks.forEach(function(g) {
  	self.gamepackMap[g.name] = g;
  });
  this.app.locales.forEach(function(l) {
  	self.localeMap[l.name] = l;
  });
}
MetaApp.prototype.hasPreview = function() {
  return !!this.app.preview;
}
MetaApp.prototype.locales = function() {
	return this.app.locales.map(function(l) { return l.name; });
}
MetaApp.prototype.gamepacks = function() {
	return this.app.gamepacks.map(function(l) { return l.name; });
}
MetaApp.prototype.defaultGamepack = function(loc) {
  // get all gamepacks that have this locale  
  var gps = [];
  var def = this.gamepack("default");
  if(def && def.hasLocale(loc)) {
    return def;
  }
  var self = this;
  this.gamepacks().forEach(function(g) {
    var gp = self.gamepack(g);
    if(gp.hasLocale(loc)) {
      gps.push(gp);
    }
  });
  return (gps.length > 0) ? gps[0] : null;
}
MetaApp.prototype.hasGamepack = function(name) {
	return (name in this.gamepackMap) && !!this.gamepackMap[name];
}
MetaApp.prototype.hasLocale = function(name) {
	return (name in this.localeMap) && !!this.localeMap[name];
}
MetaApp.prototype.locale = function(name) {
  var loc = this.localeMap[name];
  if(loc) {
    return new MetaLocale(loc);
  }
}
MetaApp.prototype.gamepack = function(name) {
  var gp = this.gamepackMap[name];
  if(gp) {
    return new MetaGamepack(gp);
  }
}
MetaApp.prototype.resources = function() {
  return this.app.resources || {};
}
MetaApp.prototype.settings = function() {
  return this.app.settings;
}
MetaApp.prototype.config = function() {
  return this.app.config;
}
MetaLocale = function(locale) {
	this.locale = locale;
  this.name = locale.name
}
MetaLocale.prototype.metadata = function() {
  return this.locale.metadata || {};
}
MetaLocale.prototype.translations = function() {
  return this.locale.translations || {};
}
MetaLocale.prototype.credits = function() {
  return this.locale.credits || [];
}
MetaLocale.prototype.hasPreview = function() {
  return !!this.locale.preview;
}

var MetaGamepack = function(gamepack) {
  var self = this;
	this.gamepack = gamepack;
  this.name = gamepack.name;
  this.localeMap = {};
  this.gamepack.locales.forEach(function(l) {
  	self.localeMap[l.name] = l;
  });
}
MetaGamepack.prototype.hasPreview = function() {
  return !!this.gamepack.preview;
}
MetaGamepack.prototype.locales = function() {
	return this.gamepack.locales.map(function(l) { return l.name; });
}
MetaGamepack.prototype.hasLocale = function(name) {
	return (name in this.localeMap) && !!this.localeMap[name];
}
MetaGamepack.prototype.locale = function(name) {
  var loc = this.localeMap[name];
  if(loc) {
    return new MetaLocale(loc);
  }
}
MetaGamepack.prototype.resources = function() {
  return this.gamepack.resources || {};
}
MetaGamepack.prototype.settings = function() {
  return this.gamepack.settings;
}
MetaGamepack.prototype.config = function() {
  return this.gamepack.config;
}
/*
meta = new Meta(INDEX)
instance = meta.instance("memory-game", "sports", "en")
*/
