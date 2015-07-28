var fs = require('fs');
var path = require('path');

function FindJSInDirectory(currentDir) 
{
	console.log('module load begin');
	var actions = [];
	var files = fs.readdirSync(currentDir);

	for(var i in files) 
	{
		var filepath = path.normalize(path.join(currentDir, files[i]));
		var fState = fs.statSync(filepath);

		if(fState.isFile()) 
		{
			var reg = /js(\S+)\.js$/i;
			var captured = reg.exec(filepath);
			if(captured.length > 0) {
				var httpPath = captured[1].replace("\\", "/");
				console.log("pid: " + process.pid + " Add request handler [" + filepath + "] to path [" + httpPath + "]");
				actions[httpPath] = require('../' + filepath);
			}
		}
	}
	
	console.log('module load end');
	return actions;
};

exports.FindJSInDirectory = FindJSInDirectory;

