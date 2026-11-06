-- On-screen test panel (join / gift / theme buttons) for the game's creator and for Studio.
-- It only sends requests; the server re-checks permission and validates everything.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

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
panel.Position = UDim2.fromOffset(10, 10)
panel.Size = UDim2.fromOffset(230, 0)
panel.AutomaticSize = Enum.AutomaticSize.Y
panel.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
panel.BackgroundTransparency = 0.15
panel.BorderSizePixel = 0
panel.Parent = gui

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 8)
padding.PaddingBottom = UDim.new(0, 8)
padding.PaddingLeft = UDim.new(0, 8)
padding.PaddingRight = UDim.new(0, 8)
padding.Parent = panel

local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 6)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = panel

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
	l.TextSize = 14
	l.TextXAlignment = Enum.TextXAlignment.Left
	l.TextColor3 = Color3.fromRGB(200, 200, 220)
	l.Text = text
	l.Parent = panel
end

local function button(text: string, onClick: () -> ())
	local b = Instance.new("TextButton")
	b.LayoutOrder = nextOrder()
	b.Size = UDim2.new(1, 0, 0, 28)
	b.BackgroundColor3 = Color3.fromRGB(90, 60, 200)
	b.BorderSizePixel = 0
	b.Font = Enum.Font.Gotham
	b.TextSize = 14
	b.TextColor3 = Color3.new(1, 1, 1)
	b.Text = text
	b.Parent = panel
	b.Activated:Connect(onClick)
end

local function names(attribute: string): { string }
	local result = {}
	for name in string.gmatch(Workspace:GetAttribute(attribute) or "", "[^,]+") do
		table.insert(result, name)
	end
	return result
end

label("Stage test panel")
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
box.Parent = panel
button("Join stage", function()
	remote:FireServer("join", box.Text)
end)

label("Gifts")
for _, name in names("StageGiftNames") do
	button(name, function()
		remote:FireServer("gift", name)
	end)
end

label("Theme")
for _, name in names("StageThemeNames") do
	button(name, function()
		remote:FireServer("theme", name)
	end)
end
