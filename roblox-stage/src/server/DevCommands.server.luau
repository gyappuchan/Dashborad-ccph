-- Local testing. Accepted only from the game's creator (or anyone inside Studio).
-- Chat commands:   /join <RobloxUsername>   /gift <GiftName> [sender]   /theme <ThemeName>
-- On-screen panel: DevPanel.client.luau fires the StageDevAction remote created below.
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DevActions = require(script.Parent.DevActions)
local ThemeManager = require(script.Parent.ThemeManager)

local function allowed(player: Player): boolean
	return RunService:IsStudio() or player.UserId == game.CreatorId
end

local function onChat(player: Player, message: string)
	if not allowed(player) then
		return
	end
	local cmd, arg, extra = message:match("^/(%a+)%s*(%S*)%s*(%S*)")
	if cmd == "join" or cmd == "gift" or cmd == "theme" then
		print("[Dev]", DevActions.run(cmd, arg, extra))
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

-- Names for the panel's buttons are published before the remote exists (the panel waits for the remote).
workspace:SetAttribute("StageGiftNames", table.concat(DevActions.giftLabels(), ","))
workspace:SetAttribute("StageThemeNames", table.concat(ThemeManager.names(), ","))

local remote = Instance.new("RemoteEvent")
remote.Name = "StageDevAction"
remote.OnServerEvent:Connect(function(player, action, arg, extra)
	if allowed(player) then
		print("[Dev]", DevActions.run(action, arg, extra))
	end
end)
remote.Parent = ReplicatedStorage
