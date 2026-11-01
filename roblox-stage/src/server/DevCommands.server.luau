-- Local testing only: the place owner types commands in chat.
--   /join <RobloxUsername>
--   /gift <GiftName> [sender]
local Players = game:GetService("Players")
local StageAPI = require(script.Parent.StageAPI)

local function onChat(player: Player, message: string)
	local cmd, arg, extra = message:match("^/(%a+)%s*(%S*)%s*(%S*)")
	if cmd == "join" and arg ~= "" then
		print("[Dev] join", arg, StageAPI.enqueueJoin(arg) and "queued" or "queue full")
	elseif cmd == "gift" and arg ~= "" then
		print("[Dev] gift", arg, StageAPI.enqueueGift(arg, extra) and "queued" or "queue full")
	end
end

local function hook(player: Player)
	player.Chatted:Connect(function(message)
		onChat(player, message)
	end)
end

for _, p in Players:GetPlayers() do
	hook(p)
end
Players.PlayerAdded:Connect(hook)
