-- Spawns an NPC that copies a Roblox user's avatar, dances on its stage slot, and is removed later.
local Players = game:GetService("Players")
local Config = require(script.Parent.Config)
local Layout = require(script.Parent.Layout)

local StageActor = {}

local function facing(position: Vector3): CFrame
	return CFrame.lookAt(position, position + Config.FaceDirection)
end

-- Plays a random dance animation. If none can be loaded the avatar bobs instead.
local function startDancing(model: Model, humanoid: Humanoid, position: Vector3)
	task.spawn(function()
		local ids = Config.DanceAnimations
		if #ids > 0 then
			local animator = humanoid:FindFirstChildOfClass("Animator")
			if not animator then
				animator = Instance.new("Animator")
				animator.Parent = humanoid
			end
			local animation = Instance.new("Animation")
			animation.AnimationId = ids[math.random(1, #ids)]
			local ok, track = pcall(function()
				return (animator :: Animator):LoadAnimation(animation)
			end)
			if ok and track then
				track.Looped = true
				track:Play()
				task.wait(1)
				if not model.Parent then
					return
				end
				if track.Length > 0 then
					return -- the animation loaded and is playing
				end
				track:Stop()
			end
		end

		local t = 0
		while model.Parent do
			t += task.wait(0.03)
			model:PivotTo(facing(position + Vector3.new(0, math.sin(t * 4) * 0.5, 0)))
		end
	end)
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
	model:SetAttribute("StageActor", true)
	local root = model:FindFirstChild("HumanoidRootPart") :: BasePart?
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	if not root or not humanoid then
		model:Destroy()
		return nil, "avatar has no humanoid"
	end
	model.PrimaryPart = root
	-- Anchor only the root: the limbs follow through their joints, so animations can still move them.
	root.Anchored = true
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff

	-- Nametag
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(140, 26)
	gui.StudsOffset = Vector3.new(0, 3, 0)
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

	local position = Layout.slotPosition(slot)
	model:PivotTo(facing(position))
	model.Parent = workspace
	startDancing(model, humanoid, position)

	return model, nil
end

-- True when this username is already dancing on the stage (case-insensitive).
function StageActor.isOnStage(username: string): boolean
	local wanted = string.lower(username)
	for _, child in workspace:GetChildren() do
		if child:GetAttribute("StageActor") and string.lower(child.Name) == wanted then
			return true
		end
	end
	return false
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
