var fs = require('fs');
var formidable = require('formidable');
var util = require('util');

function GetFile(req, res) 
{
	try
	{
		if (req.method.toLowerCase() != 'get')
			return;
		
		var url = req.url;
		url = url.replace("/GetFile=",""); 

		fs.exists("./tmp/" + url, function(exists) 
		{
			try
			{
				if (exists)
				{
					var pdf = fs.createReadStream("./tmp/" + url);

					res.writeHead(200, {
						'Content-Type': 'application/force-download',
						'Content-Disposition': 'attachment; filename=' + url
					});
					
					pdf.pipe(res);
				}
				else
				{
					res.writeHead(404);
					res.end();
				}
			}
			catch(e)
			{
				console.log(e);
			}
		});
	}
	catch(e)
	{
		console.log(e);
	}
}

function UpFile(req, res) 
{
	try
	{
		console.log(req.url);
		console.log(2);
		if (req.url == '/UpFile' && req.method.toLowerCase() === 'post') 
		{
			console.log(1);
			// 处理上传的文件
			var form = new formidable.IncomingForm();
			form.uploadDir="./tmp";
			form.parse(req, function(err, fields, files) 
			{
				try
				{
					fs.renameSync(files.upload.path, "./tmp/" + fields.title);
					res.writeHead(200, {'content-type': 'text/plain'});
					res.write('received upload:\n\n');
					res.end(util.inspect({fields: fields, files: files}));
				}
				catch(e)
				{
					res.writeHead(200, {'content-type': 'text/plain'});
					res.end(e.stack);
					console.log(e);
				}
			});
			return;
		}
		else if (req.url != '/' && req.url != '/UpFile' && req.method.toLowerCase() === 'get')
		{
			fs.exists("./tmp" + req.url, function(exists) 
			{
				try
				{
					if (exists)
					{
						var pdf = fs.createReadStream("./tmp" + req.url);
 
						res.writeHead(200, {
							'Content-Type': 'application/force-download',
							'Content-Disposition': 'attachment; filename=' + req.url.substr(1)
						});
						
						pdf.pipe(res);
					}
					else
					{
						res.writeHead(404);
						res.end();
					}
				}
				catch(e)
				{
					console.log(e);
				}
			});
			
		}
		else
		{
			// 显示一个用于上传的form
			res.writeHead(200, {'content-type': 'text/html'});
			res.end(
				'<form action="/UpFile" enctype="multipart/form-data" method="post">'+
				'<input type="text" name="title" /> '+
				'<input type="file" name="upload" multiple="multiple" /> '+
				'<input type="submit" value="Upload" />'+
				'</form>'
			);
		}
	}
	catch(e)
	{
		console.log(e);
	}
}

exports.UpFile = UpFile;
exports.GetFile = GetFile;

