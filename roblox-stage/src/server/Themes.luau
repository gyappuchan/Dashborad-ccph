-- Map themes: pure data. To add a theme, copy one block and change the values.
-- Positions in Props are offsets from the stage centre; y = 0 means "on the floor".
-- Prop kinds (see ThemeManager.luau): Pumpkin, Candle, Pillar, DeadTree, Gravestone, Fence, Mist,
-- RingLine, Moon, Spotlight, NeonTile, DiscoBall.
-- Optional per theme: ColorCorrection = { Saturation, Contrast, TintColor }, Depth = { FarIntensity, FocusDistance, InFocusRadius, NearIntensity }.
-- Camera positions are offsets from Config.StageOrigin.
local V3 = Vector3.new
local RGB = Color3.fromRGB

local function add(list, prop)
	table.insert(list, prop)
end

-- Ring of neon floor tiles, colours cycling through `colors`.
local function neonRing(list, count: number, radius: number, colors, size: number, phase: number?)
	for i = 1, count do
		local angle = (i - 1) / count * math.pi * 2 + (phase or 0)
		add(list, {
			kind = "NeonTile",
			pos = V3(math.cos(angle) * radius, 0, math.sin(angle) * radius),
			size = size,
			color = colors[(i - 1) % #colors + 1],
		})
	end
end

local Themes = {}

----------------------------------------------------------------------------------------------------
-- Halloween: purple marble stage, pumpkins, candles, dead trees under a full moon
----------------------------------------------------------------------------------------------------
do
	local props = {}
	for _, p in
		{
			{ -17, -3, 1.3 },
			{ -20.5, 0, 1 },
			{ -18.5, -7, 1.1 },
			{ 17, -3, 1.3 },
			{ 20.5, 0, 1 },
			{ 18.5, -7, 1.1 },
			{ -9, -14, 1.2 },
			{ 9, -14, 1.2 },
			{ 0, -17, 1.6 },
		}
	do
		add(props, { kind = "Pumpkin", pos = V3(p[1], 0, p[2]), scale = p[3] })
	end
	for _, p in { { -13, 9, 1 }, { 13, 9, 1 }, { -15, 7.5, 0.8 }, { 15, 7.5, 0.8 }, { -6, 12, 0.7 }, { 6, 12, 0.7 } } do
		add(props, { kind = "Candle", pos = V3(p[1], 0, p[2]), scale = p[3] })
	end
	add(props, { kind = "Pillar", pos = V3(-24, 0, -8), height = 20, radius = 1.6 })
	add(props, { kind = "Pillar", pos = V3(24, 0, -8), height = 20, radius = 1.6 })
	add(props, { kind = "DeadTree", pos = V3(-32, 0, -22), scale = 1.4 })
	add(props, { kind = "DeadTree", pos = V3(32, 0, -20), scale = 1.2 })
	add(props, { kind = "DeadTree", pos = V3(-44, 0, -6), scale = 1.1 })
	add(props, { kind = "DeadTree", pos = V3(44, 0, -8), scale = 1 })
	for _, g in { { -12, -11, 1.1, 0.15, -0.08 }, { -25, -1, 1.2, 0.5, 0.06 }, { 12, -12, 1, -0.2, 0.05 }, { 26, 2, 1.2, -0.4, -0.05 }, { 20, -13, 0.9, 0.1, 0.1 }, { -19, -14, 1, 0, -0.1 } } do
		add(props, { kind = "Gravestone", pos = V3(g[1], 0, g[2]), scale = g[3], yaw = g[4], tilt = g[5] })
	end
	add(props, { kind = "Fence", pos = V3(-34, 0, -30), to = V3(-8, 0, -30) })
	add(props, { kind = "Fence", pos = V3(8, 0, -30), to = V3(34, 0, -30) })
	add(props, { kind = "Mist", pos = V3(0, 0, -4), size = V3(60, 3, 40), color = RGB(150, 110, 220), rate = 7 })
	add(props, { kind = "RingLine", radius = 13.5, color = RGB(190, 90, 255), width = 0.3 })
	add(props, { kind = "RingLine", radius = 19, color = RGB(255, 140, 40), width = 0.3 })
	add(props, { kind = "Moon", pos = V3(-45, 75, -150), size = 40, color = RGB(255, 245, 200) })
	add(props, { kind = "Spotlight", pos = V3(-16, 20, -10), aim = V3(0, 2, 0), color = RGB(170, 80, 255) })
	add(props, { kind = "Spotlight", pos = V3(16, 20, -10), aim = V3(0, 2, 0), color = RGB(255, 140, 40) })

	Themes.Halloween = {
		Display = "Halloween",
		Lighting = {
			ClockTime = 0,
			Brightness = 0.6,
			Ambient = RGB(50, 35, 90),
			OutdoorAmbient = RGB(60, 45, 110),
			FogColor = RGB(25, 15, 45),
			FogStart = 60,
			FogEnd = 220,
		},
		Atmosphere = { Density = 0.3, Offset = 0.2, Color = RGB(120, 80, 200), Decay = RGB(60, 30, 100), Glare = 0, Haze = 1 },
		Bloom = { Intensity = 0.5, Size = 24, Threshold = 1 },
		ColorCorrection = { Saturation = 0.2, Contrast = 0.12, TintColor = RGB(235, 225, 255) },
		Depth = { FarIntensity = 0.3, FocusDistance = 30, InFocusRadius = 28, NearIntensity = 0 },
		Ground = { Color = RGB(18, 14, 28), Material = Enum.Material.Slate },
		Floor = { Radius = 22, Thickness = 2, Color = RGB(60, 25, 110), Material = Enum.Material.Marble, RingColor = RGB(200, 100, 255) },
		Props = props,
		Camera = { Pos = V3(0, 4, 26), Look = V3(0, 0, 0), Fov = 50, Orbit = false },
	}
end

----------------------------------------------------------------------------------------------------
-- DiscoNeon: dark glossy stage, glowing floor tiles, disco ball and coloured spotlights
----------------------------------------------------------------------------------------------------
do
	local props = {}
	local colors = { RGB(255, 0, 170), RGB(0, 255, 230), RGB(255, 230, 0) }
	neonRing(props, 16, 15, colors, 3.4)
	neonRing(props, 8, 8, colors, 2.6, math.pi / 8)
	add(props, { kind = "RingLine", radius = 18, color = RGB(255, 0, 170), width = 0.3 })
	add(props, { kind = "RingLine", radius = 11, color = RGB(0, 255, 230), width = 0.3 })
	add(props, { kind = "DiscoBall", pos = V3(0, 24, -2), size = 6 })
	add(props, { kind = "Spotlight", pos = V3(-20, 24, -12), aim = V3(0, 2, 0), color = RGB(255, 0, 170) })
	add(props, { kind = "Spotlight", pos = V3(20, 24, -12), aim = V3(0, 2, 0), color = RGB(0, 255, 230) })
	add(props, { kind = "Spotlight", pos = V3(-20, 24, 12), aim = V3(0, 2, 0), color = RGB(255, 230, 0) })
	add(props, { kind = "Spotlight", pos = V3(20, 24, 12), aim = V3(0, 2, 0), color = RGB(120, 255, 80) })
	add(props, { kind = "Pillar", pos = V3(-24, 0, -10), height = 22, radius = 1, color = RGB(255, 0, 170), neon = true })
	add(props, { kind = "Pillar", pos = V3(24, 0, -10), height = 22, radius = 1, color = RGB(0, 255, 230), neon = true })

	Themes.DiscoNeon = {
		Display = "Disco Neon",
		Lighting = {
			ClockTime = 0,
			Brightness = 0.2,
			Ambient = RGB(10, 5, 30),
			OutdoorAmbient = RGB(15, 10, 40),
			FogColor = RGB(10, 0, 30),
			FogStart = 100,
			FogEnd = 300,
		},
		Atmosphere = { Density = 0.15, Offset = 0, Color = RGB(60, 0, 120), Decay = RGB(20, 0, 60), Glare = 0, Haze = 0.5 },
		Bloom = { Intensity = 1.2, Size = 30, Threshold = 0.8 },
		ColorCorrection = { Saturation = 0.3, Contrast = 0.15, TintColor = RGB(255, 245, 255) },
		Depth = { FarIntensity = 0.2, FocusDistance = 30, InFocusRadius = 30, NearIntensity = 0 },
		Ground = { Color = RGB(8, 6, 16), Material = Enum.Material.SmoothPlastic },
		Floor = { Radius = 20, Thickness = 2, Color = RGB(15, 10, 30), Material = Enum.Material.SmoothPlastic, RingColor = RGB(0, 255, 230) },
		Props = props,
		Camera = { Pos = V3(0, 4, 26), Look = V3(0, 0, 0), Fov = 50, Orbit = false },
	}
end

----------------------------------------------------------------------------------------------------
-- Simple: bright, plain platform; good for testing and for a clean look
----------------------------------------------------------------------------------------------------
do
	local props = {}
	add(props, { kind = "Pillar", pos = V3(-22, 0, -8), height = 12, radius = 1.2, color = RGB(235, 235, 240) })
	add(props, { kind = "Pillar", pos = V3(22, 0, -8), height = 12, radius = 1.2, color = RGB(235, 235, 240) })
	add(props, { kind = "RingLine", radius = 12, color = RGB(80, 160, 255), width = 0.3 })

	Themes.Simple = {
		Display = "Simple",
		Lighting = {
			ClockTime = 14,
			Brightness = 2.5,
			Ambient = RGB(140, 140, 150),
			OutdoorAmbient = RGB(160, 170, 190),
			FogColor = RGB(200, 210, 230),
			FogStart = 200,
			FogEnd = 1000,
		},
		Atmosphere = { Density = 0.2, Offset = 0, Color = RGB(199, 210, 230), Decay = RGB(106, 112, 125), Glare = 0, Haze = 0 },
		Bloom = { Intensity = 0.2, Size = 24, Threshold = 2 },
		Ground = { Color = RGB(120, 180, 110), Material = Enum.Material.Grass },
		Floor = { Radius = 20, Thickness = 2, Color = RGB(230, 230, 235), Material = Enum.Material.SmoothPlastic, RingColor = RGB(80, 160, 255) },
		Props = props,
		Camera = { Pos = V3(0, 4, 26), Look = V3(0, 0, 0), Fov = 50, Orbit = false },
	}
end

return Themes
