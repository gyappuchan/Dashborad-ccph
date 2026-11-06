-- Main loop: takes items from the queue, spawns avatars, plays gift effects.
local Config = require(script.Parent.Config)
local StageAPI = require(script.Parent.StageAPI)
local StageActor = require(script.Parent.StageActor)
local Effects = require(script.Parent.Effects)
local ThemeManager = require(script.Parent.ThemeManager)
local GiftActions = require(script.Parent.GiftActions)

local queue = StageAPI.getQueue()
local onStage: { Model } = {}

local function cleanupStage()
	for i = #onStage, 1, -1 do
		local model = onStage[i]
		if StageActor.isExpired(model) then
			model:Destroy()
		end
		if not model.Parent then
			table.remove(onStage, i)
		end
	end
end

local function freeSlot(): number?
	for slot = 1, Config.StageSlots do
		local taken = false
		for _, m in onStage do
			if m:GetAttribute("Slot") == slot then
				taken = true
				break
			end
		end
		if not taken then
			return slot
		end
	end
	return nil
end

local function handleJoin(item)
	if StageActor.isOnStage(item.username) then
		print("[Stage] Already on stage, skipped:", item.username)
		return true -- consumed
	end
	local slot = freeSlot()
	if not slot then
		-- No slot yet: put the join back at the front and wait
		return false
	end
	local model, reason = StageActor.spawn(item.username, slot)
	if not model then
		warn("[Stage] Join failed for", item.username, reason)
		return true -- consumed, skip it
	end
	model:SetAttribute("Slot", slot)
	table.insert(onStage, model)
	StageActor.setStay(model, Config.BaseStayTime)
	Effects.Play("Confetti", model:GetPivot().Position)
	return true
end

local function handleGift(item)
	local rule = Config.Gifts[item.gift] or Config.DefaultGift
	if rule.Action and GiftActions.busy() then
		return false -- too many effects playing: keep the gift in the queue until one finishes
	end
	cleanupStage()
	local target = onStage[#onStage]
	local pos = target and target:GetPivot().Position or Config.StageOrigin
	GiftActions.run(rule, { target = target, position = pos, onStage = onStage, sender = item.sender or "" })
	if target and rule.Stay > 0 then
		local current = math.max(0, (target:GetAttribute("LeaveAt") or os.clock()) - os.clock())
		local extra = math.min(current + rule.Stay + Config.GiftStayBonus, Config.MaxStayTime)
		StageActor.setStay(target, extra)
	end
	return true
end

ThemeManager.apply(Config.Theme)

task.spawn(function()
	while true do
		cleanupStage()
		local item = queue.items[1]
		if item then
			local done
			if item.kind == "join" then
				done = handleJoin(item)
			else
				done = handleGift(item)
			end
			if done then
				queue:pop()
			end
		end
		task.wait(Config.ProcessInterval)
	end
end)

print("[Stage] Ready. Queue limit:", Config.QueueLimit)
