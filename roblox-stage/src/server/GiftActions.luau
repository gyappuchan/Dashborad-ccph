-- What each gift does on stage. An action starts its own tasks and returns at once.
-- Actions are chosen by `Action = "..."` in Config.Gifts.
local Debris = game:GetService("Debris")
local TweenService = game:GetService("TweenService")
local Config = require(script.Parent.Config)
local Effects = require(script.Parent.Effects)
local Layout = require(script.Parent.Layout)
local StageActor = require(script.Parent.StageActor)
local StageAPI = require(script.Parent.StageAPI)
local ThemeManager = require(script.Parent.ThemeManager)

local GiftActions = {}

----------------------------------------------------------------------------------------------------
-- Limit on effects playing at once. Main leaves gifts in the queue while this is full.
----------------------------------------------------------------------------------------------------
local active = 0

local function track(seconds: number)
	active += 1
	task.delay(seconds, function()
		active = math.max(0, active - 1)
	end)
end

function GiftActions.busy(): boolean
	return active >= Config.MaxActiveEffects
end

----------------------------------------------------------------------------------------------------
-- Helpers
----------------------------------------------------------------------------------------------------
local function fxFolder(): Instance
	local folder = workspace:FindFirstChild("StageFx")
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = "StageFx"
		folder.Parent = workspace
	end
	return folder
end

-- An invisible anchored part used to hold lights, guis and particles.
local function anchorPart(cframe: CFrame): Part
	local part = Instance.new("Part")
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.Transparency = 1
	part.Size = Vector3.new(1, 1, 1)
	part.CFrame = cframe
	part.Parent = fxFolder()
	return part
end

local FIREWORK_COLORS = {
	Color3.fromRGB(255, 80, 80),
	Color3.fromRGB(255, 200, 60),
	Color3.fromRGB(80, 200, 255),
	Color3.fromRGB(200, 100, 255),
	Color3.fromRGB(120, 255, 140),
}

----------------------------------------------------------------------------------------------------
-- Actions: actions[name](rule, ctx)
-- ctx = { target = newest dancer (Model?), position = Vector3, onStage = { Model }, sender = string }
----------------------------------------------------------------------------------------------------
local actions: { [string]: (any, any) -> () } = {}

function actions.Hearts(_rule, ctx)
	track(3)
	local origin = ctx.position + Vector3.new(0, 4, 0)
	for i = 1, 8 do
		task.delay((i - 1) * 0.15, function()
			local jitter = Vector3.new((math.random() - 0.5) * 4, 0, (math.random() - 0.5) * 2)
			local anchor = anchorPart(CFrame.new(origin + jitter))

			local gui = Instance.new("BillboardGui")
			gui.Size = UDim2.fromOffset(44, 44)
			gui.AlwaysOnTop = true
			gui.Adornee = anchor
			local heart = Instance.new("TextLabel")
			heart.Size = UDim2.fromScale(1, 1)
			heart.BackgroundTransparency = 1
			heart.TextScaled = true
			heart.Text = "♥"
			heart.TextColor3 = Color3.fromRGB(255, 80, 140)
			heart.Parent = gui
			gui.Parent = anchor

			TweenService:Create(gui, TweenInfo.new(2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { StudsOffset = Vector3.new(0, 8, 0) }):Play()
			TweenService:Create(heart, TweenInfo.new(2), { TextTransparency = 1 }):Play()
			Debris:AddItem(anchor, 2.2)
		end)
	end
end

function actions.Spotlight(rule, ctx)
	local seconds = rule.Seconds or 6
	track(seconds)
	local target = ctx.position
	local lamp = anchorPart(CFrame.lookAt(target + Vector3.new(0, 16, 12), target))
	local light = Instance.new("SpotLight")
	light.Face = Enum.NormalId.Front
	light.Angle = 40
	light.Range = 50
	light.Brightness = 8
	light.Color = Color3.fromRGB(255, 240, 200)
	light.Shadows = false
	light.Parent = lamp
	Debris:AddItem(lamp, seconds)
end

function actions.Giant(rule, ctx)
	local model = ctx.target
	if not model then
		return -- nobody on stage to grow
	end
	local scale = rule.Scale or 2
	local seconds = rule.Seconds or 8
	track(seconds + 1)
	task.spawn(function()
		local steps = 6
		for step = 1, steps do -- grow smoothly
			if not model.Parent then
				return
			end
			StageActor.setScale(model, 1 + (scale - 1) * step / steps)
			task.wait(0.05)
		end
		task.wait(seconds)
		for step = steps - 1, 0, -1 do -- shrink back
			if not model.Parent then
				return
			end
			StageActor.setScale(model, 1 + (scale - 1) * step / steps)
			task.wait(0.05)
		end
	end)
end

function actions.Fireworks(_rule, _ctx)
	track(5)
	local floorY = Layout.floorTopY()
	for i = 1, 6 do
		task.delay((i - 1) * 0.5, function()
			local angle = math.random() * math.pi * 2
			local start = Vector3.new(Config.StageOrigin.X + math.cos(angle) * 14, floorY + 1, Config.StageOrigin.Z + math.sin(angle) * 10 - 8)
			local top = start + Vector3.new(0, 30 + math.random() * 10, 0)
			local color = FIREWORK_COLORS[math.random(1, #FIREWORK_COLORS)]

			local rocket = anchorPart(CFrame.new(start))
			rocket.Size = Vector3.new(0.5, 2, 0.5)
			rocket.Transparency = 0
			rocket.Color = color
			rocket.Material = Enum.Material.Neon
			TweenService:Create(rocket, TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Position = top }):Play()

			task.delay(0.8, function()
				rocket.Transparency = 1
				local flash = Instance.new("PointLight")
				flash.Brightness = 8
				flash.Range = 70
				flash.Color = color
				flash.Shadows = false
				flash.Parent = rocket
				TweenService:Create(flash, TweenInfo.new(0.6), { Brightness = 0 }):Play()
				Effects.Burst(top, color, 140, 3)
				Debris:AddItem(rocket, 1)
			end)
		end)
	end
end

-- Theme swap: the first swap remembers the theme to return to; later swaps only extend the time.
local swap = { token = 0, base = nil :: string?, endsAt = 0 }

function actions.ThemeSwap(rule, _ctx)
	local theme, seconds = rule.Theme, rule.Seconds or 30
	if not ThemeManager.exists(theme) then
		warn("[Stage] ThemeSwap: unknown theme", theme)
		return
	end
	swap.token += 1
	local token = swap.token
	if swap.base == nil then
		swap.base = ThemeManager.current
	end
	swap.endsAt = os.clock() + seconds
	if ThemeManager.current ~= theme then
		ThemeManager.apply(theme)
	end
	task.spawn(function()
		while os.clock() < swap.endsAt do
			task.wait(1)
		end
		if token ~= swap.token then
			return -- a newer swap took over
		end
		local base = swap.base
		swap.base = nil
		-- Restore only if nobody changed the theme by hand in the meantime
		if base and ThemeManager.current == theme then
			ThemeManager.apply(base)
		end
	end)
end

function actions.QueueJump(_rule, ctx)
	local sender = ctx.sender
	if sender ~= "" then
		StageAPI.promote(sender)
	end
	-- Free a slot sooner: the dancer with the least time left gets at most 5 more seconds
	if #ctx.onStage >= Config.StageSlots then
		local soonest
		for _, model in ctx.onStage do
			if model.Parent and (soonest == nil or StageActor.remaining(model) < StageActor.remaining(soonest)) then
				soonest = model
			end
		end
		if soonest then
			StageActor.setStay(soonest, math.min(StageActor.remaining(soonest), 5))
		end
	end
	Effects.Play("Stars", ctx.position)
end

----------------------------------------------------------------------------------------------------
-- Entry point
----------------------------------------------------------------------------------------------------
function GiftActions.run(rule, ctx)
	local action = rule.Action and actions[rule.Action]
	if action then
		action(rule, ctx)
	elseif rule.Action then
		warn("[Stage] Unknown gift action:", rule.Action)
	elseif rule.Effect then
		Effects.Play(rule.Effect, ctx.position)
	end
end

function GiftActions.names(): { string }
	local list = {}
	for name in actions do
		table.insert(list, name)
	end
	table.sort(list)
	return list
end

return GiftActions
