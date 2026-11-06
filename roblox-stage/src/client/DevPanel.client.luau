-- On-screen test panel for the game's creator and for Studio. It can be collapsed (arrow button) or hidden
-- completely (press H) so it never shows up in the stream. It only sends requests; the server re-checks
-- permission and validates everything. For live control use the local bridge app instead.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")
local CameraRig = require(script.Parent.CameraRig)

local player = Players.LocalPlayer
if not (RunService:IsStudio() or player.UserId == game.CreatorId) then
	return
end

local remote = ReplicatedStorage:WaitForChild("StageDevAction", 30)
if not remote then
	return
end

local gui = Instance.new("ScreenGui")
gui.Name = "StageDevPanel"
gui.ResetOnSpawn = false
gui.DisplayOrder = 100
gui.Parent = player:WaitForChild("PlayerGui")

local panel = Instance.new("Frame")
panel.Position = UDim2.fromOffset(10, 60)
panel.Size = UDim2.fromOffset(230, 0)
panel.AutomaticSize = Enum.AutomaticSize.Y
panel.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
panel.BackgroundTransparency = 0.15
panel.BorderSizePixel = 0
panel.Parent = gui

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 6)
padding.PaddingBottom = UDim.new(0, 6)
padding.PaddingLeft = UDim.new(0, 8)
padding.PaddingRight = UDim.new(0, 8)
padding.Parent = panel

local layout = Instance.new("UIListLayout")
layout.Padding = UDim.new(0, 6)
layout.SortOrder = Enum.SortOrder.LayoutOrder
layout.Parent = panel

-- The part that collapses
local body = Instance.new("Frame")
body.LayoutOrder = 2
body.Size = UDim2.new(1, 0, 0, 0)
body.AutomaticSize = Enum.AutomaticSize.Y
body.BackgroundTransparency = 1
body.Parent = panel

local bodyLayout = Instance.new("UIListLayout")
bodyLayout.Padding = UDim.new(0, 6)
bodyLayout.SortOrder = Enum.SortOrder.LayoutOrder
bodyLayout.Parent = body

local header = Instance.new("TextButton")
header.LayoutOrder = 1
header.Size = UDim2.new(1, 0, 0, 26)
header.BackgroundTransparency = 1
header.Font = Enum.Font.GothamBold
header.TextSize = 14
header.TextXAlignment = Enum.TextXAlignment.Left
header.TextColor3 = Color3.fromRGB(220, 220, 240)
header.Parent = panel

local function setCollapsed(collapsed: boolean)
	body.Visible = not collapsed
	header.Text = (if collapsed then "▸ " else "▾ ") .. "Stage panel  (H hides)"
end
header.Activated:Connect(function()
	setCollapsed(body.Visible)
end)
setCollapsed(false)

UserInputService.InputBegan:Connect(function(input, processed)
	if not processed and input.KeyCode == Enum.KeyCode.H then
		gui.Enabled = not gui.Enabled
	end
end)

local order = 0
local function nextOrder(): number
	order += 1
	return order
end

local function label(text: string)
	local l = Instance.new("TextLabel")
	l.LayoutOrder = nextOrder()
	l.Size = UDim2.new(1, 0, 0, 18)
	l.BackgroundTransparency = 1
	l.Font = Enum.Font.GothamBold
	l.TextSize = 13
	l.TextXAlignment = Enum.TextXAlignment.Left
	l.TextColor3 = Color3.fromRGB(170, 170, 200)
	l.Text = text
	l.Parent = body
end

local function button(parent: Instance, text: string, onClick: () -> ()): TextButton
	local b = Instance.new("TextButton")
	b.LayoutOrder = nextOrder()
	b.Size = UDim2.new(1, 0, 0, 28)
	b.BackgroundColor3 = Color3.fromRGB(90, 60, 200)
	b.BorderSizePixel = 0
	b.Font = Enum.Font.Gotham
	b.TextSize = 14
	b.TextColor3 = Color3.new(1, 1, 1)
	b.Text = text
	b.Parent = parent
	b.Activated:Connect(onClick)
	return b
end

-- Gift / theme names are published by DevCommands as "Name|Detail,Name|Detail"
local function entries(attribute: string): { { string } }
	local result = {}
	for entry in string.gmatch(Workspace:GetAttribute(attribute) or "", "[^,]+") do
		local name, detail = string.match(entry, "^(.-)|(.*)$")
		table.insert(result, { name or entry, detail or "" })
	end
	return result
end

label("Join")
local box = Instance.new("TextBox")
box.LayoutOrder = nextOrder()
box.Size = UDim2.new(1, 0, 0, 28)
box.BackgroundColor3 = Color3.fromRGB(40, 40, 55)
box.BorderSizePixel = 0
box.Font = Enum.Font.Gotham
box.TextSize = 14
box.TextColor3 = Color3.new(1, 1, 1)
box.PlaceholderText = "Roblox username"
box.Text = ""
box.ClearTextOnFocus = false
box.Parent = body
button(body, "Join stage", function()
	remote:FireServer("join", box.Text)
end)

label("Gifts")
for _, gift in entries("StageGiftNames") do
	button(body, if gift[2] ~= "" then gift[1] .. " · " .. gift[2] else gift[1], function()
		remote:FireServer("gift", gift[1])
	end)
end

label("Theme")
for _, theme in entries("StageThemeNames") do
	button(body, theme[1], function()
		remote:FireServer("theme", theme[1])
	end)
end

label("Camera")
local cameraRow = Instance.new("Frame")
cameraRow.LayoutOrder = nextOrder()
cameraRow.Size = UDim2.new(1, 0, 0, 28)
cameraRow.BackgroundTransparency = 1
cameraRow.Parent = body
local rowLayout = Instance.new("UIListLayout")
rowLayout.FillDirection = Enum.FillDirection.Horizontal
rowLayout.SortOrder = Enum.SortOrder.LayoutOrder
rowLayout.Padding = UDim.new(0, 4)
rowLayout.Parent = cameraRow

for _, control in
	{
		{ "◀", -0.2, 0, 1 },
		{ "▶", 0.2, 0, 1 },
		{ "▲", 0, 0.12, 1 },
		{ "▼", 0, -0.12, 1 },
		{ "＋", 0, 0, 0.85 },
		{ "－", 0, 0, 1.18 },
		{ "⟲", nil, nil, nil },
	}
do
	local b = button(cameraRow, control[1], function()
		if control[2] == nil then
			CameraRig.reset()
		else
			CameraRig.nudge(control[2], control[3], control[4])
		end
	end)
	b.Size = UDim2.new(1 / 7, -4, 1, 0)
end
