-- Camera offsets (orbit, tilt, zoom) applied on top of a theme's camera. Pure maths with no input
-- handling, so it can be tested. StreamCamera.client.luau feeds it joystick / keyboard / mouse input.
local CameraRig = {}

CameraRig.yaw = 0 -- radians, positive moves the camera to the right around the stage
CameraRig.pitch = 0 -- radians, positive raises the camera
CameraRig.zoom = 1 -- distance multiplier, below 1 is closer

local MIN_ZOOM, MAX_ZOOM = 0.35, 2.5
local MIN_PITCH, MAX_PITCH = -0.25, 1.0

function CameraRig.nudge(deltaYaw: number, deltaPitch: number, zoomFactor: number)
	CameraRig.yaw += deltaYaw
	CameraRig.pitch = math.clamp(CameraRig.pitch + deltaPitch, MIN_PITCH, MAX_PITCH)
	CameraRig.zoom = math.clamp(CameraRig.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM)
end

function CameraRig.reset()
	CameraRig.yaw = 0
	CameraRig.pitch = 0
	CameraRig.zoom = 1
end

-- Camera frame for a theme camera (position, lookAt) plus the current offsets.
function CameraRig.compute(position: Vector3, lookAt: Vector3): CFrame
	local offset = (position - lookAt) * CameraRig.zoom
	offset = CFrame.Angles(-CameraRig.pitch, 0, 0):VectorToWorldSpace(offset)
	offset = CFrame.Angles(0, CameraRig.yaw, 0):VectorToWorldSpace(offset)
	return CFrame.lookAt(lookAt + offset, lookAt)
end

return CameraRig
