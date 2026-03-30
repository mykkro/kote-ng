/*
window.requestAnimationFrame = window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || function(f){return setTimeout(f, 1000/60)} // simulate calling code 60 
 
window.cancelAnimationFrame = window.cancelAnimationFrame
    || window.mozCancelAnimationFrame
    || function(requestID){clearTimeout(requestID)} //fall back
*/

window.rtimeOut=function(callback,delay){
 var dateNow=Date.now,
     requestAnimation=window.requestAnimationFrame,
     start=dateNow(),
     stop,
     timeoutFunc=function(){
      dateNow()-start<delay?stop||requestAnimation(timeoutFunc):callback()
     };
 requestAnimation(timeoutFunc);
 return{
  clear:function(){stop=1}
 }
}

window.rInterval=function(callback,delay){
 var dateNow=Date.now,
     requestAnimation=window.requestAnimationFrame,
     start=dateNow(),
     stop,
     intervalFunc=function(){
      dateNow()-start<delay||(start+=delay,callback());
      stop||requestAnimation(intervalFunc)
     }
 requestAnimation(intervalFunc);
 return{
  clear:function(){stop=1}
 }
}

/*
var timer = new Timer();
timer.start({precision: 'secondTenths', callback: function (values) {
	console.log(values);
	var elapsedMillis = values.secondTenths * 100 + values.seconds * 1000 + values.minutes * 60000 + values.hours * 3600000;
    console.log(elapsedMillis);
}});
*/
