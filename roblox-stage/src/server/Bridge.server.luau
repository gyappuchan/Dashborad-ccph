-- Receives join/gift messages from the Node.js TikTok bridge (Open Cloud Messaging Service)
-- and forwards them to the stage queue. Only works in a PUBLISHED game's live servers.
local MessagingService = game:GetService("MessagingService")
local HttpService = game:GetService("HttpService")
local Config = require(script.Parent.Config)
local StageAPI = require(script.Parent.StageAPI)

local MAX_GIFT_REPEAT = 5

local function handle(raw: string)
	local ok, data = pcall(function()
		return HttpService:JSONDecode(raw)
	end)
	if not ok or type(data) ~= "table" then
		return
	end

	if data.kind == "join" and type(data.username) == "string" then
		-- Roblox usernames: 3-20 chars, letters/digits/underscore only
		if data.username:match("^[%w_]+$") and #data.username >= 3 and #data.username <= 20 then
			StageAPI.enqueueJoin(data.username)
		end
	elseif data.kind == "gift" and type(data.gift) == "string" and #data.gift <= 50 then
		local count = math.clamp(math.floor(tonumber(data.count) or 1), 1, MAX_GIFT_REPEAT)
		local by = if type(data.by) == "string" then data.by else ""
		for _ = 1, count do
			StageAPI.enqueueGift(data.gift, by)
		end
	end
end

local ok, err = pcall(function()
	MessagingService:SubscribeAsync(Config.MessagingTopic, function(message)
		handle(message.Data)
	end)
end)

if ok then
	print("[Stage] Listening for bridge messages on topic:", Config.MessagingTopic)
else
	warn("[Stage] Could not subscribe to MessagingService:", err)
end
