var fs = require('fs');
var formidable = require('formidable');
var redis = require("../util/util_cache");

function Send(req, res, roleObj) 
{
    try 
	{
        var val = fs.readFileSync("./data/Main.txt","utf-8");  
		res.writeHead(200, {'content-type': 'text/html'});
		res.write('<head><meta charset="utf-8"/></head>');  
		res.write("<table border=\"1\">");
		res.write("<tr>");
		res.write("<td>帐号&nbsp;&nbsp;&nbsp;</td>");
		res.write("<td>" + roleObj.account + "&nbsp;&nbsp;&nbsp;</td>");
		res.write("<tr>");
		res.write("<tr>");
		res.write("<td>角色名&nbsp;&nbsp;&nbsp;</td>");
		res.write("<td>" + roleObj.account + "&nbsp;&nbsp;&nbsp;</td>");
		res.write("</tr>");
		res.write("</table>");
		res.write("<br />");
		val = val.replace("@@@1", roleObj.account); 
		val = val.replace("@@@2", roleObj.LoginKey); 
		res.end(val);
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