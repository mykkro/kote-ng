// source: http://stackoverflow.com/questions/19026331/call-multiple-json-data-files-in-one-getjson-request

/**
 * Load multiple json files, with progress.
 *
 * Example usage:
 *
 * jQuery.getMultipleJSON('file1.json', 'file2.json')
 *   .progress(function(percent, count, total){})
 *   .fail(function(jqxhr, textStatus, error){})
 *   .done(function(file1, file2){})
 * ;
 */
jQuery.getMultipleJSON = function(){
  var 
    num = 0,
    def = jQuery.Deferred(),
    map = jQuery.map(arguments, function(jsonfile){
      return jQuery.getJSON(jsonfile).then(function(){
        def.notify(1/map.length * ++num, num, map.length);
        return arguments;
      });
    })
  ;
  jQuery.when.apply(jQuery, map)
    .fail(function(){ def.rejectWith(def, arguments); })
    .done(function(){
      def.resolveWith(def, jQuery.map(arguments, function(response){
        return response[0];
      }));
    })
  ;
  return def;
};