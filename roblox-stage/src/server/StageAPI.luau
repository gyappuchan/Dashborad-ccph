-- Single entry point for the queue. The TikTok bridge (later) and dev commands both call this.
local GiftQueue = require(script.Parent.GiftQueue)
local Config = require(script.Parent.Config)

local queue = GiftQueue.new(Config.QueueLimit)

local StageAPI = {}

function StageAPI.enqueueJoin(username: string): boolean
	return queue:push({ kind = "join", username = username })
end

function StageAPI.enqueueGift(giftName: string, sender: string?): boolean
	return queue:push({ kind = "gift", gift = giftName, sender = sender or "" })
end

-- Roblox usernames: 3-20 characters, letters/digits/underscore only.
function StageAPI.isValidUsername(name: any): boolean
	return type(name) == "string" and #name >= 3 and #name <= 20 and name:match("^[%w_]+$") ~= nil
end

function StageAPI.getQueue()
	return queue
end

return StageAPI
