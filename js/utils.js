/**
 *  Returns a random point from region [x1,x2]x[y1,y2].
 */
var randomPoint = function(x1, x2, y1, y2) {
    return {
        x: x1 + Math.random()*(x2-x1),
        y: y1 + Math.random()*(y2-y1)
    }
};

/**
 *  Returns random number from range <0, n-1>
 */
var randomInt = function(max) {
	return Math.floor(Math.random()*max);
};

/**
 *  Returns random number from range <0, n-1>
 */
var randomIntVector = function(len, max) {
  var vec = makeZeroes(len);
  for(var i=0; i<len; i++) {
    vec[i] = randomInt(max);
  }
  return vec;
};

/**
 *  Returns random number from range <0, n-1>, except 
 */
var randomIntExcept = function(max, except) {
    var index = 0;
    if(max>1) {
      do {
        index = randomInt(max);
      }
      while(index == except);
      return index;
    }
};

/**
 *  Returns random item from an array.
 */
var pickRandom = function(arr) {
    return arr[randomInt(arr.length)];
};

/**
 *  Returns random item from an array.
 */
var pickRandomExcludeIndex = function(arr, excludeIndex) {
    var index = 0;
    if(arr.length>1) {
      do {
        index = randomInt(arr.length);
      }
      while(index == excludeIndex);
      return arr[index];
    }
};

/**
 *  Shuffles an array in place.
 */
var shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// creates array [0 1 2 3... n-1]
var makeRange = function(n) {
    var indices = [];
    for(var i=0; i<n; i++) {
        indices[i] = i;
    }
    return indices;
}

// creates array [0 0 0 .. 0] of length n
var makeZeroes = function(n) {
    var indices = [];
    for(var i=0; i<n; i++) {
        indices[i] = 0;
    }
    return indices;
}

var makeFilled = function(n, val) {
    var indices = [];
    for(var i=0; i<n; i++) {
        indices[i] = val;
    }
    return indices;
}


// from: http://stackoverflow.com/questions/3954438/remove-item-from-array-by-value
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

Array.prototype.shuffle = function() {
  var o = this;
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return this;
};


if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
}


function basename(str)
{
   var base = new String(str).substring(str.lastIndexOf('/') + 1); 
    if(base.lastIndexOf(".") != -1)       
        base = base.substring(0, base.lastIndexOf("."));
   return base;
}

function dirname (path) {
  //  discuss at: http://locutus.io/php/dirname/
  // original by: Ozh
  // improved by: XoraX (http://www.xorax.info)
  //   example 1: dirname('/etc/passwd')
  //   returns 1: '/etc'
  //   example 2: dirname('c:/Temp/x')
  //   returns 2: 'c:/Temp'
  //   example 3: dirname('/dir/test/')
  //   returns 3: '/dir'
  return path.replace(/\\/g, '/')
    .replace(/\/[^/]*\/?$/, '')
}


// required for older versions of Android (<4.4 ?)
if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function() {
        this.parentNode.removeChild(this);
    };
}



function truncateOnWord(str, limit) {
    var trimmable = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF';
    var reg = new RegExp('(?=[' + trimmable + '])');
    var words = str.split(reg);
    var count = 0;
    var result = words.filter(function(word) {
        count += word.length;
        return count <= limit;
    }).join('');
    if(result != str) {
        result += "...";
    }
    return result;
}



// @license http://opensource.org/licenses/MIT
// copyright Paul Irish 2015

// Date.now() is supported everywhere except IE8. For IE8 we use the Date.now polyfill
//   github.com/Financial-Times/polyfill-service/blob/master/polyfills/Date.now/polyfill.js
// as Safari 6 doesn't have support for NavigationTiming, we use a Date.now() timestamp for relative values

// if you want values similar to what you'd get with real perf.now, place this towards the head of the page
// but in reality, you're just getting the delta between now() calls, so it's not terribly important where it's placed
(function(){

  if ("performance" in window == false) {
      window.performance = {};
  }
  
  Date.now = (Date.now || function () {  // thanks IE8
    return new Date().getTime();
  });

  if ("now" in window.performance == false){
    
    var nowOffset = Date.now();
    
    if (performance.timing && performance.timing.navigationStart){
      nowOffset = performance.timing.navigationStart
    }

    window.performance.now = function now(){
      return Date.now() - nowOffset;
    }
  }

})();

/*
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}
*/


function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};


/**
 * Minimal DOM element builder (replaces jQuery's $('<tag>') chains).
 * Usage: h('div', {class:'foo'}, child1, child2, 'text node')
 */
var h = function(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
        for (var key in attrs) {
            if (key === 'class') {
                el.className = attrs[key];
            } else {
                el.setAttribute(key, attrs[key]);
            }
        }
    }
    for (var i = 2; i < arguments.length; i++) {
        var child = arguments[i];
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child) {
            el.appendChild(child);
        }
    }
    return el;
};

