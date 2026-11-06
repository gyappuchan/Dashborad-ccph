-- Shared stage geometry so avatars, the map and the camera always agree.
local Config = require(script.Parent.Config)

local Layout = {}

-- Distance from an R15 root part to the soles of its feet (HipHeight 2 + half of the 2-stud root).
local ROOT_TO_FEET = 3
Layout.ROOT_TO_FEET = ROOT_TO_FEET

function Layout.floorTopY(): number
	return Config.StageOrigin.Y - ROOT_TO_FEET
end

function Layout.slotPosition(slot: number): Vector3
	local offset = (slot - (Config.StageSlots + 1) / 2) * Config.SlotSpacing
	return Config.StageOrigin + Vector3.new(offset, 0, 0)
end

-- Offset relative to the stage centre on the floor (y = 0 means standing on the floor).
function Layout.fromFloor(offset: Vector3): Vector3
	return Vector3.new(Config.StageOrigin.X + offset.X, Layout.floorTopY() + offset.Y, Config.StageOrigin.Z + offset.Z)
end

-- Offset relative to StageOrigin itself (used for camera positions).
function Layout.fromOrigin(offset: Vector3): Vector3
	return Config.StageOrigin + offset
end

return Layout
