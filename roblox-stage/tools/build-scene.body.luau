-- Applies the default theme with the real ThemeManager and returns the resulting map + lighting as JSON,
-- so build-place.mjs can bake the full scene into the .rbxlx (you see the stage as soon as you open it).
local Config = require(records.Config)
local ThemeManager = require(records.ThemeManager)

assert(ThemeManager.apply(Config.Theme), "default theme failed to apply")
assert(#mock.warnings == 0, table.concat(mock.warnings, " | "))

local function number(n)
	assert(n == n and n ~= math.huge and n ~= -math.huge, "non-finite number in scene")
	return string.format("%.9g", n)
end

local function quote(s)
	return '"' .. s:gsub("\\", "\\\\"):gsub('"', '\\"'):gsub("\n", "\\n") .. '"'
end

local function vec(v)
	return "[" .. number(v.X) .. "," .. number(v.Y) .. "," .. number(v.Z) .. "]"
end

local encode
function encode(v)
	local kind = typeof(v)
	if kind == "number" then
		return number(v)
	elseif kind == "boolean" then
		return tostring(v)
	elseif kind == "string" then
		return quote(v)
	elseif kind == "Vector3" then
		return '{"t":"Vector3","v":' .. vec(v) .. "}"
	elseif kind == "Color3" then
		return '{"t":"Color3","v":[' .. number(v.R) .. "," .. number(v.G) .. "," .. number(v.B) .. "]}"
	elseif kind == "CFrame" then
		return '{"t":"CFrame","p":' .. vec(v.Position) .. ',"r":' .. vec(v.RightVector) .. ',"u":' .. vec(v.UpVector) .. ',"b":' .. vec(v.BackVector) .. "}"
	elseif kind == "table" then
		if v[1] ~= nil or next(v) == nil then
			local items = {}
			for _, item in v do
				table.insert(items, encode(item))
			end
			return "[" .. table.concat(items, ",") .. "]"
		end
		local keys = {}
		for key in v do
			table.insert(keys, key)
		end
		table.sort(keys)
		local items = {}
		for _, key in keys do
			table.insert(items, quote(key) .. ":" .. encode(v[key]))
		end
		return "{" .. table.concat(items, ",") .. "}"
	end
	error("cannot encode " .. kind)
end

return encode({
	theme = Config.Theme,
	map = mock.describe(workspace:FindFirstChild("StageMap")),
	lighting = mock.describe(mock.Lighting),
})
