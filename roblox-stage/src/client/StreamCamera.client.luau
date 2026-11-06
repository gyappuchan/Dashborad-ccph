-- Stage camera for the live stream. The theme sets the starting view (Workspace attributes written by
-- ThemeManager); the streamer can then move it:
--   * Gamepad:    left stick orbits / zooms, right stick orbits / tilts, triggers zoom, R3 resets
--   * Keyboard:   WASD (A/D orbit, W/S zoom), mouse: hold right button and drag, wheel zooms, R resets
--   * Touch:      the on-screen thumbstick works like WASD; the panel also has camera buttons
-- Moving the character is not needed, so its walk speed is set to 0 and the inputs steer the camera instead.
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")
local CameraRig = require(script.Parent.CameraRig)

local player = Players.LocalPlayer

local ORBIT_SPEED = 1.4 -- radians per second at full stick
local TILT_SPEED = 1.0
local ZOOM_SPEED = 1.2 -- e-folds per second
local DEADZONE = 0.15

local function dead(value: number): number
	if math.abs(value) < DEADZONE then
		return 0
	end
	return value
end

-- The avatar of the streamer is never in shot, so keep it from wandering off when inputs are used
local function freeze(character: Model)
	local humanoid = character:WaitForChild("Humanoid", 10)
	if humanoid and humanoid:IsA("Humanoid") then
		humanoid.WalkSpeed = 0
		humanoid.JumpHeight = 0
	end
end
player.CharacterAdded:Connect(freeze)
if player.Character then
	task.spawn(freeze, player.Character)
end

-- Mouse: hold the right button and drag to orbit/tilt, wheel to zoom
UserInputService.InputChanged:Connect(function(input, processed)
	if processed then
		return
	end
	if input.UserInputType == Enum.UserInputType.MouseMovement and UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton2) then
		CameraRig.nudge(-input.Delta.X * 0.005, input.Delta.Y * 0.005, 1)
	elseif input.UserInputType == Enum.UserInputType.MouseWheel then
		CameraRig.nudge(0, 0, 0.9 ^ input.Position.Z)
	end
end)

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then
		return -- typing in a text box
	end
	if input.KeyCode == Enum.KeyCode.R or input.KeyCode == Enum.KeyCode.ButtonR3 then
		CameraRig.reset()
	end
end)

-- Right stick and triggers of the first gamepad
local function gamepad(): (Vector2, number)
	local stick = Vector2.new(0, 0)
	local zoom = 0
	for _, input in UserInputService:GetGamepadState(Enum.UserInputType.Gamepad1) do
		if input.KeyCode == Enum.KeyCode.Thumbstick2 then
			stick = Vector2.new(dead(input.Position.X), dead(input.Position.Y))
		elseif input.KeyCode == Enum.KeyCode.ButtonL2 then
			zoom += input.Position.Z -- left trigger zooms out
		elseif input.KeyCode == Enum.KeyCode.ButtonR2 then
			zoom -= input.Position.Z -- right trigger zooms in
		end
	end
	return stick, zoom
end

RunService:BindToRenderStep("StageCamera", Enum.RenderPriority.Camera.Value + 1, function(dt)
	local position = Workspace:GetAttribute("StageCamPos")
	local lookAt = Workspace:GetAttribute("StageCamLook")
	local camera = Workspace.CurrentCamera
	if not camera or typeof(position) ~= "Vector3" or typeof(lookAt) ~= "Vector3" then
		return -- no theme yet: leave the default camera alone
	end

	camera.CameraType = Enum.CameraType.Scriptable
	camera.FieldOfView = Workspace:GetAttribute("StageCamFov") or 50

	-- Movement input (WASD, left stick, touch thumbstick) in camera space: x = right, z = back
	local humanoid = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
	local move = Vector3.new(0, 0, 0)
	if humanoid then
		move = camera.CFrame:VectorToObjectSpace(humanoid.MoveDirection)
	end
	local stick, trigger = gamepad()

	local orbit = move.X + stick.X
	local tilt = stick.Y
	local zoomInput = move.Z + trigger -- forward (negative) zooms in
	CameraRig.nudge(orbit * ORBIT_SPEED * dt, tilt * TILT_SPEED * dt, math.exp(zoomInput * ZOOM_SPEED * dt))
	if Workspace:GetAttribute("StageCamOrbit") then
		CameraRig.nudge(0.15 * dt, 0, 1) -- slow automatic orbit
	end

	camera.CFrame = CameraRig.compute(position, lookAt)
end)
