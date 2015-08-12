var fs = require('fs');
var formidable = require('formidable');
var pageHtml = fs.readFileSync("./data/Main.html","utf-8");

function Send(res, roleObj) 
{
    try 
	{
		res.writeHead(200, {'content-type': 'text/html'});
		res.end(pageHtml);
    }
    catch (err) 
	{
        console.log("Exception:  " + err + "]");
    }
}

function Recv(req, res) 
{
}

exports.Send = Send;
exports.Recv = Recv;