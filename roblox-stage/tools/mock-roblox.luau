-- Minimal Roblox API mock used by smoke-test.mjs. Property names, enum names and value types are
-- validated against the real Roblox API dump (injected as PROPS and ENUMS), so typos fail loudly.
-- The two placeholder tokens below are replaced by the test runner.
local PROPS = __PROPS__
local ENUMS = __ENUMS__

local warnings = {}
function warn(...)
	local parts = table.pack(...)
	for i = 1, parts.n do
		parts[i] = tostring(parts[i])
	end
	table.insert(warnings, table.concat(parts, " ", 1, parts.n))
end

----------------------------------------------------------------------------------------------------
-- Value types
----------------------------------------------------------------------------------------------------
local V3mt = {}
local function V3(x, y, z)
	return setmetatable({ X = x, Y = y, Z = z, __type = "Vector3" }, V3mt)
end
V3mt.__index = function(self, k)
	if k == "Magnitude" then
		return math.sqrt(self.X * self.X + self.Y * self.Y + self.Z * self.Z)
	elseif k == "Unit" then
		local m = self.Magnitude
		return V3(self.X / m, self.Y / m, self.Z / m)
	end
	return nil
end
V3mt.__add = function(a, b)
	return V3(a.X + b.X, a.Y + b.Y, a.Z + b.Z)
end
V3mt.__sub = function(a, b)
	return V3(a.X - b.X, a.Y - b.Y, a.Z - b.Z)
end
V3mt.__mul = function(a, b)
	if type(a) == "number" then
		return V3(a * b.X, a * b.Y, a * b.Z)
	elseif type(b) == "number" then
		return V3(a.X * b, a.Y * b, a.Z * b)
	end
	return V3(a.X * b.X, a.Y * b.Y, a.Z * b.Z)
end
V3mt.__div = function(a, b)
	return V3(a.X / b, a.Y / b, a.Z / b)
end
Vector3 = {
	new = function(x, y, z)
		return V3(x or 0, y or 0, z or 0)
	end,
}

Color3 = {
	new = function(r, g, b)
		return { R = r, G = g, B = b, __type = "Color3" }
	end,
	fromRGB = function(r, g, b)
		return { R = r / 255, G = g / 255, B = b / 255, __type = "Color3" }
	end,
}

UDim2 = {
	fromOffset = function(x, y)
		return { X = x, Y = y, __type = "UDim2" }
	end,
	fromScale = function(x, y)
		return { X = x, Y = y, __type = "UDim2" }
	end,
}

Vector2 = {
	new = function(x, y)
		return { X = x, Y = y, __type = "Vector2" }
	end,
}
NumberRange = {
	new = function(min, max)
		return { Min = min, Max = max or min, __type = "NumberRange" }
	end,
}
NumberSequence = {
	new = function(a, b)
		return { Keypoints = { { 0, a }, { 1, b or a } }, __type = "NumberSequence" }
	end,
}
ColorSequence = {
	new = function(a, b)
		return { Keypoints = { { 0, a }, { 1, b or a } }, __type = "ColorSequence" }
	end,
}
TweenInfo = {
	new = function(time)
		return { Time = time, __type = "TweenInfo" }
	end,
}

-- CFrame: position plus orientation as three column vectors (Right, Up, Back), like Roblox.
local CFmt = {}
local function CF(position, right, up, back)
	return setmetatable({ Position = position, RightVector = right, UpVector = up, BackVector = back, __type = "CFrame" }, CFmt)
end
local function rotate(cf, v)
	return cf.RightVector * v.X + cf.UpVector * v.Y + cf.BackVector * v.Z
end
local function cross(a, b)
	return V3(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X)
end
CFmt.__index = {
	VectorToWorldSpace = function(self, v)
		return rotate(self, v)
	end,
}
CFmt.__mul = function(a, b)
	if b.__type == "Vector3" then
		return a.Position + rotate(a, b)
	end
	return CF(a.Position + rotate(a, b.Position), rotate(a, b.RightVector), rotate(a, b.UpVector), rotate(a, b.BackVector))
end
local ZERO = V3(0, 0, 0)
local function axisRotation(axis, angle)
	local c, s = math.cos(angle), math.sin(angle)
	if axis == "X" then
		return CF(ZERO, V3(1, 0, 0), V3(0, c, s), V3(0, -s, c))
	elseif axis == "Y" then
		return CF(ZERO, V3(c, 0, -s), V3(0, 1, 0), V3(s, 0, c))
	end
	return CF(ZERO, V3(c, s, 0), V3(-s, c, 0), V3(0, 0, 1))
end
CFrame = {
	new = function(x, y, z)
		local p = if type(x) == "table" then x else V3(x or 0, y or 0, z or 0)
		return CF(p, V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, 1))
	end,
	Angles = function(rx, ry, rz)
		return axisRotation("X", rx) * axisRotation("Y", ry) * axisRotation("Z", rz)
	end,
	lookAt = function(from, to)
		local look = (to - from).Unit
		local up = V3(0, 1, 0)
		if math.abs(look.Y) > 0.9999 then
			up = V3(0, 0, -1) -- looking straight up/down: pick another reference
		end
		local right = cross(look, up).Unit
		return CF(from, right, cross(right, look), look * -1)
	end,
}

----------------------------------------------------------------------------------------------------
-- Enum: "Enum.<Name>.<Item>" strings, validated against the Roblox API dump
----------------------------------------------------------------------------------------------------
Enum = setmetatable({}, {
	__index = function(_, enumName)
		local items = ENUMS[enumName]
		if not items then
			error("Enum." .. tostring(enumName) .. " does not exist", 2)
		end
		return setmetatable({}, {
			__index = function(_, item)
				if not items[item] then
					error("Enum." .. enumName .. "." .. tostring(item) .. " does not exist", 2)
				end
				return "Enum." .. enumName .. "." .. item
			end,
		})
	end,
})

----------------------------------------------------------------------------------------------------
-- Instances
----------------------------------------------------------------------------------------------------
local registry = setmetatable({}, { __mode = "k" })

function typeof(value)
	if type(value) == "table" then
		if registry[value] then
			return "Instance"
		end
		return rawget(value, "__type") or "table"
	end
	return type(value)
end

local function checkValue(className, prop, value)
	local info = PROPS[className][prop]
	if info == nil then
		error(className .. " has no property '" .. prop .. "'", 3)
	end
	if not info.writable then
		error(className .. "." .. prop .. " is not writable from scripts", 3)
	end
	local expected = info.type
	local actual = typeof(value)
	local enumName = expected:match("^Enum:(.+)$")
	local ok = true
	if enumName then
		ok = type(value) == "string" and value:sub(1, #enumName + 6) == "Enum." .. enumName .. "."
	elseif expected == "Float32" or expected == "Float64" or expected == "Int32" or expected == "Int64" then
		ok = actual == "number"
	elseif expected == "Bool" then
		ok = actual == "boolean"
	elseif expected == "String" or expected == "ContentId" or expected == "Content" then
		ok = actual == "string"
	elseif expected == "Vector3" or expected == "Color3" or expected == "CFrame" or expected == "UDim2" or expected == "Vector2" or expected == "NumberRange" or expected == "NumberSequence" or expected == "ColorSequence" then
		ok = actual == expected
	end
	if not ok then
		error(("%s.%s expects %s, got %s"):format(className, prop, expected, actual), 3)
	end
end

local newInstance
local function descendants(obj, out)
	for _, child in registry[obj].children do
		table.insert(out, child)
		descendants(child, out)
	end
	return out
end

local methods = {}
function methods.Destroy(self)
	self.Parent = nil
end
function methods.FindFirstChild(self, name)
	for _, child in registry[self].children do
		if child.Name == name then
			return child
		end
	end
	return nil
end
function methods.FindFirstChildOfClass(self, className)
	for _, child in registry[self].children do
		if child.ClassName == className then
			return child
		end
	end
	return nil
end
function methods.GetChildren(self)
	return table.clone(registry[self].children)
end
function methods.GetDescendants(self)
	return descendants(self, {})
end
function methods.SetAttribute(self, key, value)
	registry[self].attributes[key] = value
end
function methods.GetAttribute(self, key)
	return registry[self].attributes[key]
end
function methods.PivotTo(self, cf)
	registry[self].pivot = cf
end
function methods.GetPivot(self)
	return registry[self].pivot or CFrame.new(0, 0, 0)
end
function methods.ScaleTo(self, scale)
	local data = registry[self]
	data.scale = scale
	table.insert(data.scaleLog, scale)
end
function methods.GetScale(self)
	return registry[self].scale
end
function methods.Emit() end
animationLength = 1
function methods.LoadAnimation(_, _)
	return {
		Looped = false,
		Length = animationLength,
		Play = function() end,
		Stop = function() end,
	}
end

function newInstance(className)
	if not PROPS[className] then
		error("Instance.new: class '" .. tostring(className) .. "' is not mocked", 2)
	end
	local data = { className = className, name = className, children = {}, attributes = {}, props = {}, scale = 1, scaleLog = {} }
	local obj = {}
	registry[obj] = data
	return setmetatable(obj, {
		__index = function(self, key)
			if key == "ClassName" then
				return data.className
			elseif key == "Name" then
				return data.name
			elseif key == "Parent" then
				return data.parent
			elseif methods[key] then
				return methods[key]
			end
			return data.props[key]
		end,
		__newindex = function(self, key, value)
			if key == "Parent" then
				local old = data.parent
				if old then
					local list = registry[old].children
					table.remove(list, table.find(list, self))
				end
				data.parent = value
				if value then
					table.insert(registry[value].children, self)
				end
			elseif key == "Name" then
				data.name = value
			else
				checkValue(className, key, value)
				data.props[key] = value
			end
		end,
	})
end
Instance = { new = newInstance }

----------------------------------------------------------------------------------------------------
-- Services
----------------------------------------------------------------------------------------------------
workspace = newInstance("Workspace")
local Lighting = newInstance("Lighting")

-- Fake clock: task.wait advances it, so loops that wait for time to pass finish instantly.
local now = 0
local realOs = os
os = { clock = function() return now end, time = realOs.time, date = realOs.date }

local spawned = {}
local delayed = {} -- { seconds, fn }: run them from a test with mock.runDelayed()
task = {
	spawn = function(fn)
		table.insert(spawned, fn)
	end,
	wait = function(t)
		now += t or 0.03
		return t or 0.03
	end,
	delay = function(seconds, fn)
		table.insert(delayed, { seconds, fn })
	end,
}

local Players = {
	GetUserIdFromNameAsync = function(_, name)
		if name:find("bad") then
			error("not found")
		end
		return 1234
	end,
	GetHumanoidDescriptionFromUserId = function()
		return {}
	end,
	CreateHumanoidModelFromDescription = function()
		local model = newInstance("Model")
		local root = newInstance("Part")
		root.Name = "HumanoidRootPart"
		root.Parent = model
		local humanoid = newInstance("Humanoid")
		humanoid.Parent = model
		return model
	end,
	GetPlayers = function()
		return {}
	end,
}


-- Strict JSON decoder (errors on malformed input like the real HttpService:JSONDecode)
local function jsonDecode(s)
	local pos = 1
	local function skip()
		pos = s:find("%S", pos) or #s + 1
	end
	local value
	local function str()
		local out, i = {}, pos + 1
		local escapes = { n = "\n", t = "\t", ['"'] = '"', ["\\"] = "\\", ["/"] = "/" }
		while true do
			local c = s:sub(i, i)
			if c == "" then
				error("unterminated string")
			elseif c == '"' then
				pos = i + 1
				return table.concat(out)
			elseif c == "\\" then
				local e = escapes[s:sub(i + 1, i + 1)]
				if not e then
					error("bad escape")
				end
				table.insert(out, e)
				i += 2
			else
				table.insert(out, c)
				i += 1
			end
		end
	end
	function value()
		skip()
		local c = s:sub(pos, pos)
		if c == "{" then
			pos += 1
			local obj = {}
			skip()
			if s:sub(pos, pos) == "}" then
				pos += 1
				return obj
			end
			while true do
				skip()
				if s:sub(pos, pos) ~= '"' then
					error("expected key")
				end
				local key = str()
				skip()
				if s:sub(pos, pos) ~= ":" then
					error("expected colon")
				end
				pos += 1
				obj[key] = value()
				skip()
				local d = s:sub(pos, pos)
				pos += 1
				if d == "}" then
					return obj
				elseif d ~= "," then
					error("expected comma or brace")
				end
			end
		elseif c == "[" then
			pos += 1
			local arr = {}
			skip()
			if s:sub(pos, pos) == "]" then
				pos += 1
				return arr
			end
			while true do
				table.insert(arr, value())
				skip()
				local d = s:sub(pos, pos)
				pos += 1
				if d == "]" then
					return arr
				elseif d ~= "," then
					error("expected comma or bracket")
				end
			end
		elseif c == '"' then
			return str()
		elseif s:sub(pos, pos + 3) == "true" then
			pos += 4
			return true
		elseif s:sub(pos, pos + 4) == "false" then
			pos += 5
			return false
		elseif s:sub(pos, pos + 3) == "null" then
			pos += 4
			return nil
		end
		local num = s:match("^-?%d+%.?%d*[eE]?[+-]?%d*", pos)
		if not num or num == "" then
			error("bad value")
		end
		pos += #num
		return tonumber(num)
	end
	local result = value()
	skip()
	if pos <= #s then
		error("trailing characters")
	end
	return result
end

local subscribers = {}
local debris = {}

local services = {
	Lighting = Lighting,
	Workspace = workspace,
	Players = Players,
	RunService = {
		IsRunning = function()
			return false
		end,
		IsStudio = function()
			return true
		end,
	},
	TweenService = {
		-- Applies the goal when played, so wrong property names or types in tweens are caught too
		Create = function(_, instance, _info, goal)
			return {
				Play = function()
					for key, value in goal do
						instance[key] = value
					end
				end,
			}
		end,
	},
	Debris = {
		AddItem = function(_, instance, seconds)
			table.insert(debris, { instance, seconds })
		end,
	},
	HttpService = {
		JSONDecode = function(_, s)
			return jsonDecode(s)
		end,
	},
	MessagingService = {
		SubscribeAsync = function(_, topic, callback)
			subscribers[topic] = callback
			return { Disconnect = function() end }
		end,
	},
}
game = {
	CreatorId = 0,
	GetService = function(_, name)
		local service = services[name]
		if not service then
			error("service '" .. name .. "' is not mocked", 2)
		end
		return service
	end,
}

-- Plain-table snapshot of an instance and its children (explicitly set properties only).
local function describe(obj)
	local data = registry[obj]
	local out = { class = data.className, name = data.name, props = {}, children = {} }
	for key, value in data.props do
		out.props[key] = value
	end
	for _, child in data.children do
		table.insert(out.children, describe(child))
	end
	return out
end

-- Runs every delayed callback (including ones queued while running) in order
local function runDelayed()
	local i = 1
	while delayed[i] do
		assert(i < 2000, "too many delayed callbacks")
		delayed[i][2]()
		i += 1
	end
	table.clear(delayed)
end

return {
	runDelayed = runDelayed,
	delayed = delayed,
	debris = debris,
	data = function(obj)
		return registry[obj]
	end,
	warnings = warnings,
	spawned = spawned,
	subscribers = subscribers,
	Lighting = Lighting,
	describe = describe,
}
