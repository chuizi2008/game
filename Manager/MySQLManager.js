var mysql = require('mysql');
var OtherManager = require("./OtherManager");

var pool  = mysql.createPool({
	connectionLimit : 10,
	host     : '127.0.0.1',
	user     : 'root',
	password : '',
	database : 'account'
});

function Query(strQuery, callBack)
{
	pool.getConnection(function(err, connection) 
	{
		if (err)
		{
			OtherManager.ServerLog(3, err);
			if (callBack)
				callBack(null);
			return;
		}
			
		connection.query(strQuery, function(err, rows) 
		{
			try
			{
				if (err)
				{
					OtherManager.ServerLog(3, err);
					if (callBack)
						callBack(null);
					return;
				}
		
				connection.release();
				
				if (callBack)
					callBack(rows);
			}
			catch (err)
			{
				console.log(err);
				if (callBack)
					callBack(null);
			}
		});
	});
}

exports.Query	   = Query;