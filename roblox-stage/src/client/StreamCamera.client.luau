-- Fixed (or slowly orbiting) camera on the stage for the live stream.
-- ThemeManager publishes the camera as Workspace attributes whenever a theme is applied.
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local angle = 0

RunService:BindToRenderStep("StageCamera", Enum.RenderPriority.Camera.Value + 1, function(dt)
	local position = Workspace:GetAttribute("StageCamPos")
	local lookAt = Workspace:GetAttribute("StageCamLook")
	local camera = Workspace.CurrentCamera
	if not camera or typeof(position) ~= "Vector3" or typeof(lookAt) ~= "Vector3" then
		return -- no theme yet: leave the default camera alone
	end

	camera.CameraType = Enum.CameraType.Scriptable
	camera.FieldOfView = Workspace:GetAttribute("StageCamFov") or 50

	local offset = position - lookAt
	if Workspace:GetAttribute("StageCamOrbit") then
		angle += dt * 0.15
		offset = CFrame.Angles(0, angle, 0):VectorToWorldSpace(offset)
	end
	camera.CFrame = CFrame.lookAt(lookAt + offset, lookAt)
end)
