-- Builds the stage map from a theme in Themes.luau. Safe to call again to switch themes.
-- In Studio (edit mode) run this in the Command Bar to preview a theme:
--   require(game.ServerScriptService.Stage.ThemeManager).apply("Halloween")
local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Config = require(script.Parent.Config)
local Layout = require(script.Parent.Layout)
local Themes = require(script.Parent.Themes)

local MAP_NAME = "StageMap"
local ATMOSPHERE_NAME = "StageAtmosphere"
local BLOOM_NAME = "StageBloom"

local ThemeManager = {}
ThemeManager.current = nil :: string?

----------------------------------------------------------------------------------------------------
-- Part helpers
----------------------------------------------------------------------------------------------------

local function newPart(parent: Instance, props): Part
	local part = Instance.new("Part")
	part.Anchored = true
	part.CanCollide = false
	part.CanTouch = false
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	for key, value in props do
		(part :: any)[key] = value
	end
	part.Parent = parent
	return part
end

-- A cylinder whose long axis runs from point a to point b.
local function cylinderBetween(parent: Instance, a: Vector3, b: Vector3, diameter: number, props)
	local delta = b - a
	local center = (a + b) / 2
	local cf
	if math.abs(delta.Unit.Y) > 0.999 then
		cf = CFrame.new(center) * CFrame.Angles(0, 0, math.pi / 2) -- vertical
	else
		cf = CFrame.lookAt(center, b) * CFrame.Angles(0, math.pi / 2, 0)
	end
	local full = { Shape = Enum.PartType.Cylinder, Size = Vector3.new(delta.Magnitude, diameter, diameter), CFrame = cf }
	for key, value in props do
		full[key] = value
	end
	return newPart(parent, full)
end

local function light(className: string, parent: Instance, props)
	local l = Instance.new(className)
	for key, value in props do
		(l :: any)[key] = value
	end
	l.Parent = parent
	return l
end

----------------------------------------------------------------------------------------------------
-- Prop builders: builders[kind](parent, prop)
----------------------------------------------------------------------------------------------------

local builders: { [string]: (Instance, any) -> () } = {}

function builders.Pumpkin(parent, prop)
	local s = prop.scale or 1
	local center = Layout.fromFloor(prop.pos) + Vector3.new(0, 2 * s, 0)
	local orange = Color3.fromRGB(240, 110, 20)
	newPart(parent, {
		Name = "Pumpkin",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(4, 4, 4) * s,
		CFrame = CFrame.new(center),
		Color = orange,
		Material = Enum.Material.SmoothPlastic,
	})
	newPart(parent, {
		Name = "Stem",
		Size = Vector3.new(0.5, 1, 0.5) * s,
		CFrame = CFrame.new(center + Vector3.new(0, 2.1 * s, 0)),
		Color = Color3.fromRGB(70, 45, 20),
		Material = Enum.Material.Wood,
	})
	-- Carved face on the +Z side (towards the camera); the mouth carries the glow
	local glow = Color3.fromRGB(255, 200, 60)
	for _, x in { -0.8, 0.8 } do
		newPart(parent, {
			Name = "Eye",
			Size = Vector3.new(0.6, 0.6, 0.4) * s,
			CFrame = CFrame.new(center + Vector3.new(x * s, 0.5 * s, 1.76 * s)),
			Color = glow,
			Material = Enum.Material.Neon,
		})
	end
	local mouth = newPart(parent, {
		Name = "Mouth",
		Size = Vector3.new(1.6, 0.4, 0.4) * s,
		CFrame = CFrame.new(center + Vector3.new(0, -0.7 * s, 1.87 * s)),
		Color = glow,
		Material = Enum.Material.Neon,
	})
	light("PointLight", mouth, { Brightness = 2, Range = 12 * s, Color = Color3.fromRGB(255, 150, 50), Shadows = false })
end

function builders.Candle(parent, prop)
	local s = prop.scale or 1
	local base = Layout.fromFloor(prop.pos)
	local height = 2.5 * s
	cylinderBetween(parent, base, base + Vector3.new(0, height, 0), 0.8 * s, {
		Name = "Candle",
		Color = Color3.fromRGB(240, 235, 215),
		Material = Enum.Material.SmoothPlastic,
	})
	local flame = newPart(parent, {
		Name = "Flame",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(0.6, 0.6, 0.6) * s,
		CFrame = CFrame.new(base + Vector3.new(0, height + 0.3 * s, 0)),
		Color = Color3.fromRGB(255, 170, 60),
		Material = Enum.Material.Neon,
	})
	light("PointLight", flame, { Brightness = 1.5, Range = 10, Color = Color3.fromRGB(255, 170, 80), Shadows = false })
end

function builders.Pillar(parent, prop)
	local base = Layout.fromFloor(prop.pos)
	local height = prop.height or 16
	local radius = prop.radius or 1.5
	cylinderBetween(parent, base, base + Vector3.new(0, height, 0), radius * 2, {
		Name = "Pillar",
		Color = prop.color or Color3.fromRGB(70, 70, 85),
		Material = if prop.neon then Enum.Material.Neon else Enum.Material.Concrete,
	})
	if not prop.neon then
		cylinderBetween(parent, base + Vector3.new(0, height, 0), base + Vector3.new(0, height + 0.8, 0), radius * 2.8, {
			Name = "PillarCap",
			Color = prop.color or Color3.fromRGB(70, 70, 85),
			Material = Enum.Material.Concrete,
		})
	end
end

function builders.DeadTree(parent, prop)
	local s = prop.scale or 1
	local base = Layout.fromFloor(prop.pos)
	local bark = { Color = Color3.fromRGB(50, 35, 25), Material = Enum.Material.Wood }
	cylinderBetween(parent, base, base + Vector3.new(0, 12 * s, 0), 1.6 * s, { Name = "Trunk", Color = bark.Color, Material = bark.Material })
	-- { height fraction on trunk, yaw (radians), branch length }
	for _, b in { { 0.4, 3.6, 4 }, { 0.55, 0.3, 6 }, { 0.7, 2.4, 5 }, { 0.85, 4.2, 4.5 } } do
		local attach = base + Vector3.new(0, 12 * s * b[1], 0)
		local direction = Vector3.new(math.cos(b[2]) * 0.8, 0.6, math.sin(b[2]) * 0.8).Unit
		cylinderBetween(parent, attach, attach + direction * b[3] * s, 0.7 * s, { Name = "Branch", Color = bark.Color, Material = bark.Material })
	end
end

function builders.Moon(parent, prop)
	local size = prop.size or 40
	newPart(parent, {
		Name = "Moon",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(size, size, size),
		CFrame = CFrame.new(Layout.fromFloor(prop.pos)),
		Color = prop.color or Color3.fromRGB(255, 245, 200),
		Material = Enum.Material.Neon,
		CastShadow = false,
	})
end

function builders.Spotlight(parent, prop)
	local pos = Layout.fromFloor(prop.pos)
	local target = Layout.fromFloor(prop.aim or Vector3.new(0, 2, 0))
	local housing = newPart(parent, {
		Name = "Spotlight",
		Size = Vector3.new(1.4, 1.4, 2),
		CFrame = CFrame.lookAt(pos, target),
		Color = Color3.fromRGB(25, 25, 30),
		Material = Enum.Material.Metal,
	})
	light("SpotLight", housing, {
		Face = Enum.NormalId.Front,
		Angle = prop.angle or 60,
		Range = prop.range or 60,
		Brightness = prop.brightness or 4,
		Color = prop.color or Color3.new(1, 1, 1),
		Shadows = false,
	})
end

function builders.NeonTile(parent, prop)
	local size = prop.size or 3
	newPart(parent, {
		Name = "NeonTile",
		Size = Vector3.new(size, 0.2, size),
		CFrame = CFrame.new(Layout.fromFloor(prop.pos) + Vector3.new(0, 0.1, 0)),
		Color = prop.color or Color3.new(1, 1, 1),
		Material = Enum.Material.Neon,
	})
end

function builders.DiscoBall(parent, prop)
	local size = prop.size or 6
	local center = Layout.fromFloor(prop.pos)
	local core = newPart(parent, {
		Name = "DiscoBall",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(size, size, size),
		CFrame = CFrame.new(center),
		Color = Color3.fromRGB(190, 190, 210),
		Material = Enum.Material.Metal,
		Reflectance = 0.4,
	})
	-- Mirror facets spread over the sphere (Fibonacci lattice)
	local facetColors = { Color3.new(1, 1, 1), Color3.fromRGB(255, 150, 230), Color3.fromRGB(150, 255, 245) }
	local count = 60
	for i = 1, count do
		local y = 1 - (i - 0.5) * 2 / count
		local ring = math.sqrt(1 - y * y)
		local theta = i * 2.399963
		local direction = Vector3.new(math.cos(theta) * ring, y, math.sin(theta) * ring)
		local at = center + direction * (size / 2)
		newPart(parent, {
			Name = "Facet",
			Size = Vector3.new(size * 0.14, size * 0.14, size * 0.05),
			CFrame = CFrame.lookAt(at, at + direction),
			Color = facetColors[i % #facetColors + 1],
			Material = Enum.Material.Neon,
		})
	end
	-- Slowly cycling coloured glow (property changes only, so it is cheap to replicate)
	local glow = light("PointLight", core, { Brightness = 2, Range = 40, Color = facetColors[2], Shadows = false })
	if RunService:IsRunning() then
		task.spawn(function()
			local palette = { Color3.fromRGB(255, 0, 170), Color3.fromRGB(0, 255, 230), Color3.fromRGB(255, 230, 0) }
			local index = 1
			while glow.Parent do
				index = index % #palette + 1
				TweenService:Create(glow, TweenInfo.new(1.5), { Color = palette[index] }):Play()
				task.wait(1.5)
			end
		end)
	end
end

----------------------------------------------------------------------------------------------------
-- Map pieces
----------------------------------------------------------------------------------------------------

local function buildGround(map: Instance, theme)
	local groundTop = Layout.floorTopY() - theme.Floor.Thickness
	newPart(map, {
		Name = "Ground",
		Size = Vector3.new(500, 1, 500),
		CFrame = CFrame.new(Config.StageOrigin.X, groundTop - 0.5, Config.StageOrigin.Z),
		Color = theme.Ground.Color,
		Material = theme.Ground.Material,
		CanCollide = true,
	})
end

local function buildFloor(map: Instance, theme)
	local floor = theme.Floor
	local top = Layout.floorTopY()
	local cx, cz = Config.StageOrigin.X, Config.StageOrigin.Z
	local upright = CFrame.Angles(0, 0, math.pi / 2) -- cylinders lie along X by default
	newPart(map, {
		Name = "Floor",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(floor.Thickness, floor.Radius * 2, floor.Radius * 2),
		CFrame = CFrame.new(cx, top - floor.Thickness / 2, cz) * upright,
		Color = floor.Color,
		Material = floor.Material,
		CanCollide = true,
	})
	-- Glowing rim: a slightly larger, thin disc just under the floor surface
	newPart(map, {
		Name = "FloorRim",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.4, floor.Radius * 2 + 1.2, floor.Radius * 2 + 1.2),
		CFrame = CFrame.new(cx, top - 0.25, cz) * upright,
		Color = floor.RingColor,
		Material = Enum.Material.Neon,
	})
	-- A marker where each avatar will stand
	for slot = 1, Config.StageSlots do
		local at = Layout.slotPosition(slot)
		newPart(map, {
			Name = "SlotMarker" .. slot,
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(0.1, 5, 5),
			CFrame = CFrame.new(at.X, top + 0.05, at.Z) * upright,
			Color = floor.RingColor,
			Material = Enum.Material.Neon,
			Transparency = 0.4,
		})
	end
end

local function applyLighting(theme)
	for key, value in theme.Lighting do
		(Lighting :: any)[key] = value
	end
	Lighting.GlobalShadows = true

	for _, name in { ATMOSPHERE_NAME, BLOOM_NAME } do
		local old = Lighting:FindFirstChild(name)
		if old then
			old:Destroy()
		end
	end
	local atmosphere = Instance.new("Atmosphere")
	atmosphere.Name = ATMOSPHERE_NAME
	for key, value in theme.Atmosphere do
		(atmosphere :: any)[key] = value
	end
	atmosphere.Parent = Lighting

	local bloom = Instance.new("BloomEffect")
	bloom.Name = BLOOM_NAME
	for key, value in theme.Bloom do
		(bloom :: any)[key] = value
	end
	bloom.Parent = Lighting
end

-- The client camera script reads these attributes (see StreamCamera.client.luau).
local function publishCamera(name: string, theme)
	local camera = theme.Camera
	workspace:SetAttribute("StageTheme", name)
	workspace:SetAttribute("StageCamPos", Layout.fromOrigin(camera.Pos))
	workspace:SetAttribute("StageCamLook", Layout.fromOrigin(camera.Look))
	workspace:SetAttribute("StageCamFov", camera.Fov or 50)
	workspace:SetAttribute("StageCamOrbit", camera.Orbit or false)
end

----------------------------------------------------------------------------------------------------
-- Public API
----------------------------------------------------------------------------------------------------

function ThemeManager.names(): { string }
	local list = {}
	for name in Themes do
		table.insert(list, name)
	end
	table.sort(list)
	return list
end

function ThemeManager.exists(name: any): boolean
	return type(name) == "string" and Themes[name] ~= nil
end

-- Returns true when the theme was applied.
function ThemeManager.apply(name: string): boolean
	local theme = Themes[name]
	if not theme then
		warn("[Stage] Unknown theme:", name, "- available:", table.concat(ThemeManager.names(), ", "))
		return false
	end

	local old = workspace:FindFirstChild(MAP_NAME)
	if old then
		old:Destroy()
	end
	local map = Instance.new("Folder")
	map.Name = MAP_NAME

	buildGround(map, theme)
	buildFloor(map, theme)
	for _, prop in theme.Props do
		local build = builders[prop.kind]
		if not build then
			warn("[Stage] Unknown prop kind:", prop.kind)
		else
			local ok, err = pcall(build, map, prop)
			if not ok then
				warn("[Stage] Prop failed:", prop.kind, err)
			end
		end
	end
	map.Parent = workspace

	applyLighting(theme)
	publishCamera(name, theme)
	ThemeManager.current = name
	print("[Stage] Theme applied:", name)
	return true
end

return ThemeManager
