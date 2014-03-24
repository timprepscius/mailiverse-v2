define(['jquery'], function(jQuery) {
	"use strict";

    var Mime = function($) {
        var obj = function Mime(defaultBoundary) {
            if (!this instanceof Mime) {
                return new Mime();
            }

            function processHeader(header) {
                var data = $.trim(header).split("\n");

                for (var line in data) {
                    if (data[line].indexOf("boundary") !== -1) {
                        var temp = data[line].split(";");

                        for (var item in temp) {
                            if (temp[item].indexOf("boundary") !== -1) {
                            	var re = /boundary=([\S]+)/gmi;
                            	var matches = re.exec(temp[item]);
                            	if (matches)
                            		return Util.trimQuotes(matches[1]);
                            }
                        }
                    }
                }

                return defaultBoundary;
            }

            function processBody(boundary, body) {
                if (body == null)
                    return null;
                
                var data;
            	if (boundary != null)
            		data = body.split("--" + boundary);
            	else
            		data = [body];
                var messages = [];

                for (var part in data) {
                    var partData = $.trim(data[part]);
                    if (partData == '')
                    	continue;
                    
                    partData = partData.replace(/\r\n/,'\n').split('\n');
                    if (boundary && partData.length && partData[0]=="--")
                    	partData.shift();
                    
                    // if there are lines
                    if (partData.length) {
                        var message = {
                        	headers : [],
                        	data: null
                        };

                        var currentKey = null;
                    	var currentKeyValue = null;

                        for (var item in partData) {

                        	var line = partData[item];
                        	
                        	if (message.data == null && $.trim(line) != "")
                        	{
                        		if (line[0] == ' ' || line[0] == '\t')
                        		{
                        			currentKeyValue.value += '\r\n' + line;
                        		}
                        		else
                        		{
                        			var colon = line.indexOf(': ');
                        			var key = line.substr(0, colon);
                        			var value = line.substr(colon+2);
                        			
                        			currentKey = key;
                        			currentKeyValue = {key:currentKey, value:value};
                        			
                        			message.headers.push(currentKeyValue);
                        		}
                        	}
                        	else
                        	{
                        		if (message.data == null)
                        			message.data = '';
                        		message.data += line + "\r\n";
                        	}
                        }
                        
                        var innerBoundary = processHeader(data[part]);
                        if (innerBoundary != defaultBoundary)
                        {
                        	message.data = processBody(innerBoundary, message.data);
                        }
                        
                        message.original = data[part];
                        messages.push(message);
                    }
                }

                return messages;
            }

            obj.prototype.processMessage = function(data) {
                return processBody(null, data);
            }
        };

        return obj;
    }(jQuery);
    
    return Mime;
});