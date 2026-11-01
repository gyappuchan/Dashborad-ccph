-- Spawns an NPC that copies a Roblox user's avatar, bobs on stage, then removes itself.
local Players = game:GetService("Players")
local Config = require(script.Parent.Config)

local StageActor = {}

local function slotPosition(slot: number): Vector3
	local offset = (slot - (Config.StageSlots + 1) / 2) * Config.SlotSpacing
	return Config.StageOrigin + Vector3.new(offset, 0, 0)
end

-- Returns the model, or nil + reason if the username cannot be resolved.
function StageActor.spawn(username: string, slot: number): (Model?, string?)
	local okId, userId = pcall(function()
		return Players:GetUserIdFromNameAsync(username)
	end)
	if not okId then
		return nil, "username not found"
	end

	local okDesc, description = pcall(function()
		return Players:GetHumanoidDescriptionFromUserId(userId)
	end)
	if not okDesc then
		return nil, "could not load avatar"
	end

	local model = Players:CreateHumanoidModelFromDescription(description, Enum.HumanoidRigType.R15)
	model.Name = username
	local root = model:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not root then
		model:Destroy()
		return nil, "no root part"
	end
	model.PrimaryPart = root
	for _, part in model:GetDescendants() do
		if part:IsA("BasePart") then
			part.Anchored = true
		end
	end

	-- Nametag
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(200, 40)
	gui.StudsOffset = Vector3.new(0, 3.5, 0)
	gui.AlwaysOnTop = true
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.TextScaled = true
	label.Font = Enum.Font.GothamBold
	label.TextColor3 = Color3.new(1, 1, 1)
	label.TextStrokeTransparency = 0
	label.Text = username
	label.Parent = gui
	gui.Parent = root

	model:PivotTo(CFrame.new(slotPosition(slot)))
	model.Parent = workspace

	-- Placeholder dance: bob up and down until removed
	task.spawn(function()
		local t = 0
		while model.Parent do
			t += task.wait(0.03)
			local y = math.sin(t * 4) * 0.5
			model:PivotTo(CFrame.new(slotPosition(slot) + Vector3.new(0, y, 0)))
		end
	end)

	return model, nil
end

-- Sets an expiry time. Calling again replaces it, so gifts can extend the stay.
-- Main.server.luau removes avatars once their LeaveAt time has passed.
function StageActor.setStay(model: Model, seconds: number)
	model:SetAttribute("LeaveAt", os.clock() + seconds)
end

function StageActor.isExpired(model: Model): boolean
	local leaveAt = model:GetAttribute("LeaveAt")
	return leaveAt ~= nil and os.clock() >= leaveAt
end

return StageActor
