var NetConfiguration = require("../fight/MsgManager/NetConfiguration");

function SendBuffer(len, msgID)
{
	this.nMsgMaxLength = NetConfiguration.MsgHeadSize + len;
	this.buffData = new Buffer(this.nMsgMaxLength);
	this.buffData.writeUInt16LE(len, 0);
	this.buffData.writeUInt16LE(msgID, 2);
	this.nOffset = 4;
}

SendBuffer.prototype.WriteUInt16LE = function(val)
{
	var myself = this;
	
	if (myself.buffData == null)
		throw new Error("no call WriteMsgHead");
			
	if (myself.nOffset >= myself.nMsgMaxLength)
		throw new Error("myself.nOffset[" + myself.nOffset + "] >= myself.nMsgMaxLength[" + myself.nMsgMaxLength + "]");
			
	if (myself.nOffset + 2 > myself.nMsgMaxLength)
		throw new Error("write data is so big");
	
	if (val > 65535 || val < 0)
		throw new Error("val[" + val + "] not is UInt16");
	
	myself.buffData.writeUInt16LE(val, myself.nOffset);
	myself.nOffset += 2;
}

SendBuffer.prototype.WriteString = function(val)
{
	var myself = this;
	
	if (myself.buffData == null)
		throw new Error("no call WriteMsgHead");
	
	if (myself.nOffset >= myself.nMsgMaxLength)
		throw new Error("myself.nOffset[" + myself.nOffset + "] >= myself.nMsgMaxLength[" + myself.nMsgMaxLength + "]");
	
	var utf8Len = Buffer.byteLength(val, 'utf8');
	if (utf8Len == 0)
		throw new Error("utf8Len == 0");

	if (myself.nOffset + 2 + myself.utf8Len > myself.nMsgMaxLength)
		throw new Error("write data is so big");

	myself.buffData.writeUInt16LE(utf8Len, myself.nOffset);
	myself.buffData.write(val, myself.nOffset + 2);
	myself.nOffset += (utf8Len + 2);
}

SendBuffer.prototype.SendMsg = function(client, fun)
{
	var myself = this;
	
	if (myself.buffData == null)
		throw new Error("no call WriteMsgHead  ");
	
	if (myself.nOffset != myself.nMsgMaxLength)
		throw new Error("nOffset[" + myself.nOffset + "] != nMsgMaxLength[" + myself.nMsgMaxLength + "]  ");
	
	if (fun != null)
		client.write(myself.buffData, 'utf-8', fun);
	else
		client.write(myself.buffData, 'utf-8');
}

module.exports = SendBuffer;