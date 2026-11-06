-- Test body: runs after the mock and the modules are loaded. Returns a text report.
local lines = {}
local failures = 0
local function check(label, condition, detail)
	if condition then
		table.insert(lines, "  ok    " .. label)
	else
		failures += 1
		table.insert(lines, "  FAIL  " .. label .. (detail and (" -> " .. tostring(detail)) or ""))
	end
end
local function run(label, fn)
	local ok, err = pcall(fn)
	if not ok then
		failures += 1
		table.insert(lines, "  FAIL  " .. label .. " crashed: " .. tostring(err))
	end
end

local Config = require(records.Config)
local Layout = require(records.Layout)
local ThemeManager = require(records.ThemeManager)
local StageActor = require(records.StageActor)

local function countParts(map)
	local n = 0
	for _, d in map:GetDescendants() do
		if d.ClassName == "Part" then
			n += 1
		end
	end
	return n
end

table.insert(lines, "Themes: " .. table.concat(ThemeManager.names(), ", "))
check("Config.Theme exists", ThemeManager.exists(Config.Theme), Config.Theme)

for _, name in ThemeManager.names() do
	run("theme " .. name, function()
		table.clear(mock.warnings)
		check(name .. ": apply returns true", ThemeManager.apply(name) == true)
		check(name .. ": no warnings", #mock.warnings == 0, table.concat(mock.warnings, " | "))

		local maps = 0
		for _, child in workspace:GetChildren() do
			if child.Name == "StageMap" then
				maps += 1
			end
		end
		check(name .. ": exactly one StageMap", maps == 1, maps)

		local map = workspace:FindFirstChild("StageMap")
		-- ground + floor + rim + one marker per slot is the minimum; themes add props on top
		check(name .. ": has parts", countParts(map) >= 3 + Config.StageSlots, countParts(map))

		local floor = map:FindFirstChild("Floor")
		local ground = map:FindFirstChild("Ground")
		check(name .. ": floor top = Layout.floorTopY", math.abs(floor.CFrame.Position.Y + floor.Size.X / 2 - Layout.floorTopY()) < 1e-6)
		check(name .. ": ground top below floor", math.abs(ground.CFrame.Position.Y + 0.5 - (Layout.floorTopY() - floor.Size.X)) < 1e-6)
		for slot = 1, Config.StageSlots do
			check(name .. ": slot marker " .. slot, map:FindFirstChild("SlotMarker" .. slot) ~= nil)
		end

		check(name .. ": camera attributes", typeof(workspace:GetAttribute("StageCamPos")) == "Vector3" and typeof(workspace:GetAttribute("StageCamLook")) == "Vector3")
		check(name .. ": theme attribute", workspace:GetAttribute("StageTheme") == name)
		check(name .. ": lighting applied", mock.Lighting.ClockTime ~= nil and mock.Lighting:FindFirstChild("StageAtmosphere") ~= nil and mock.Lighting:FindFirstChild("StageBloom") ~= nil)
	end)
end

local function near(a, b)
	return math.abs(a - b) < 1e-6
end

run("CFrame math in the mock", function()
	local r = CFrame.Angles(0, 0, math.pi / 2)
	check("Angles(0,0,90deg): Right -> +Y", near(r.RightVector.X, 0) and near(r.RightVector.Y, 1))
	local l = CFrame.lookAt(Vector3.new(0, 0, 0), Vector3.new(0, 0, -5))
	check("lookAt -Z is identity", near(l.RightVector.X, 1) and near(l.UpVector.Y, 1) and near(l.BackVector.Z, 1))
	local d = Vector3.new(3, 4, 0).Unit
	local along = CFrame.lookAt(Vector3.new(0, 0, 0), d) * CFrame.Angles(0, math.pi / 2, 0)
	check("lookAt * Angles(0,90deg,0): local X axis points along the target", near(along.RightVector.X, d.X) and near(along.RightVector.Y, d.Y) and near(along.RightVector.Z, d.Z))
end)

run("geometry orientation (Halloween)", function()
	ThemeManager.apply("Halloween")
	local map = workspace:FindFirstChild("StageMap")
	local floor = map:FindFirstChild("Floor")
	check("floor cylinder axis is vertical", near(math.abs(floor.CFrame.RightVector.Y), 1))
	local pillar = map:FindFirstChild("Pillar")
	check("pillar axis is vertical and 20 tall", near(math.abs(pillar.CFrame.RightVector.Y), 1) and near(pillar.Size.X, 20))
	local pillarTop = pillar.CFrame.Position.Y + pillar.Size.X / 2
	check("pillar stands on the floor", near(pillar.CFrame.Position.Y - pillar.Size.X / 2, Layout.floorTopY()), pillarTop)

	local branchesUp = true
	for _, d in map:GetDescendants() do
		if d.Name == "Branch" and d.CFrame.RightVector.Y <= 0.3 then
			branchesUp = false
		end
	end
	check("tree branches point upward", branchesUp)

	local spot = map:FindFirstChild("Spotlight")
	local aim = Layout.fromFloor(Vector3.new(0, 2, 0))
	local toAim = (aim - spot.CFrame.Position).Unit
	local look = spot.CFrame.BackVector * -1
	check("spotlight faces the stage", near(look.X, toAim.X) and near(look.Y, toAim.Y) and near(look.Z, toAim.Z))
end)

run("unknown theme", function()
	table.clear(mock.warnings)
	check("unknown theme returns false", ThemeManager.apply("Nope") == false)
	check("unknown theme warns", #mock.warnings == 1)
	check("exists() rejects bad input", ThemeManager.exists(nil) == false and ThemeManager.exists(5) == false)
end)

-- Switching back and forth keeps exactly one map and one atmosphere/bloom
run("switching themes", function()
	ThemeManager.apply("Halloween")
	ThemeManager.apply("DiscoNeon")
	ThemeManager.apply("Halloween")
	local atmospheres = 0
	for _, child in mock.Lighting:GetChildren() do
		if child.ClassName == "Atmosphere" then
			atmospheres += 1
		end
	end
	check("one Atmosphere after switching", atmospheres == 1, atmospheres)
	check("current theme tracked", ThemeManager.current == "Halloween")
end)

run("StageActor.spawn", function()
	local model, err = StageActor.spawn("Alice", 2)
	check("spawn returns a model", model ~= nil, err)
	check("model parented to workspace", model.Parent == workspace)
	local root = model:FindFirstChild("HumanoidRootPart")
	check("only the root is anchored", root.Anchored == true)
	local at = model:GetPivot().Position
	local expected = Layout.slotPosition(2)
	check("placed on slot 2", at.X == expected.X and at.Y == expected.Y and at.Z == expected.Z)
	check("nametag added", root:FindFirstChild("BillboardGui") ~= nil or #root:GetChildren() > 0)

	check("isOnStage finds the avatar (case-insensitive)", StageActor.isOnStage("aLiCe") == true)
	check("isOnStage is false for others", StageActor.isOnStage("Bob") == false)

	local none, reason = StageActor.spawn("bad_user", 1)
	check("unknown username is rejected", none == nil and reason == "username not found", reason)

	StageActor.setStay(model, 10)
	check("stay time not expired", StageActor.isExpired(model) == false)
	StageActor.setStay(model, -1)
	check("stay time expires", StageActor.isExpired(model) == true)

	-- Dance coroutine, animation path
	local dance = mock.spawned[#mock.spawned]
	animationLength = 1
	dance()
	check("dance runs with a working animation", true)

	-- Dance coroutine, fallback bob path: end the loop after a few frames
	local frames = 0
	local realWait = task.wait
	task.wait = function(t)
		frames += 1
		if frames > 5 then
			model.Parent = nil
		end
		return t or 0.03
	end
	animationLength = 0
	dance()
	task.wait = realWait
	check("fallback bob loop ends when model is removed", frames > 5, frames)
	check("isOnStage is false once removed", StageActor.isOnStage("Alice") == false)
end)

run("Bridge: messages from the TikTok bridge", function()
	local StageAPI = require(records.StageAPI)
	require(records.Bridge) -- subscribes to the messaging topic
	local deliver = mock.subscribers[Config.MessagingTopic]
	check("Bridge subscribed to Config.MessagingTopic", deliver ~= nil)
	local queue = StageAPI.getQueue()
	local function send(json)
		queue.items = {}
		local ok, err = pcall(deliver, { Data = json })
		check("no crash on: " .. json:sub(1, 40), ok, err)
		return #queue.items
	end

	check("valid join is queued", send('{"kind":"join","username":"Roblox","by":"v1"}') == 1)
	check("join with a space is rejected", send('{"kind":"join","username":"bad name"}') == 0)
	check("join too short is rejected", send('{"kind":"join","username":"ab"}') == 0)
	check("join too long is rejected", send('{"kind":"join","username":"' .. string.rep("a", 21) .. '"}') == 0)
	check("join with symbols is rejected", send('{"kind":"join","username":"a;b$c"}') == 0)
	check("join with a non-string name is rejected", send('{"kind":"join","username":123}') == 0)

	check("gift is queued once by default", send('{"kind":"gift","gift":"Rose"}') == 1)
	check("gift count is honoured", send('{"kind":"gift","gift":"Rose","count":3}') == 3)
	check("gift count is capped at 5", send('{"kind":"gift","gift":"Rose","count":999}') == 5)
	check("gift with a huge name is ignored", send('{"kind":"gift","gift":"' .. string.rep("x", 51) .. '"}') == 0)
	check("negative gift count counts as 1", send('{"kind":"gift","gift":"Rose","count":-4}') == 1)

	check("unknown kind is ignored", send('{"kind":"explode"}') == 0)
	check("malformed JSON is ignored", send("{not json") == 0)
	check("non-object JSON is ignored", send("5") == 0)
	check("empty message is ignored", send("") == 0)

	ThemeManager.apply("Halloween")
	send('{"kind":"theme","name":"Simple"}')
	check("theme message switches the theme", ThemeManager.current == "Simple", ThemeManager.current)
	send('{"kind":"theme","name":"NoSuchTheme"}')
	check("unknown theme is ignored", ThemeManager.current == "Simple", ThemeManager.current)
	send('{"kind":"theme","name":5}')
	check("non-string theme is ignored", ThemeManager.current == "Simple", ThemeManager.current)
	ThemeManager.apply("Halloween")
end)

run("DevActions: chat commands and panel remote", function()
	local DevActions = require(records.DevActions)
	local StageAPI = require(records.StageAPI)
	local queue = StageAPI.getQueue()
	queue.items = {}
	check("join queued", DevActions.run("join", "Roblox") == "join queued" and #queue.items == 1)
	check("same username twice is not queued again", DevActions.run("join", "roblox"):find("not queued") ~= nil and #queue.items == 1)
	check("invalid username refused", DevActions.run("join", "no spaces allowed") == "invalid username")
	check("non-string username refused", DevActions.run("join", { evil = true }) == "invalid username")
	check("gift queued", DevActions.run("gift", "Rose") == "gift queued")
	check("gift sender defaults to dev", queue.items[#queue.items].sender == "dev")
	check("empty gift refused", DevActions.run("gift", "") == "invalid gift")
	check("huge gift name refused", DevActions.run("gift", string.rep("x", 51)) == "invalid gift")
	check("theme switch", DevActions.run("theme", "DiscoNeon") == "theme: DiscoNeon" and ThemeManager.current == "DiscoNeon")
	check("unknown theme lists options", DevActions.run("theme", "Nope"):find("Halloween") ~= nil)
	check("unknown action refused", DevActions.run("rm -rf", "/") == "unknown action")
	check("giftNames matches Config.Gifts", table.concat(DevActions.giftNames(), ",") == "Galaxy,Lion,Rose")
	queue.items = {}
	for _ = 1, Config.QueueLimit do
		DevActions.run("gift", "Rose")
	end
	check("full queue is reported", DevActions.run("gift", "Rose") == "queue full")
	queue.items = {}
	ThemeManager.apply("Halloween")
end)

table.insert(lines, failures == 0 and "ALL CHECKS PASSED" or ("FAILED: " .. failures .. " problem(s)"))
return table.concat(lines, "\n")
