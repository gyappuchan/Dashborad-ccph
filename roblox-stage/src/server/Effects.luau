-- Visual effects triggered by gifts. Each effect takes a Vector3 position.
local Debris = game:GetService("Debris")

local function burst(position: Vector3, color: Color3, rate: number, life: number)
	local anchor = Instance.new("Part")
	anchor.Anchored = true
	anchor.CanCollide = false
	anchor.Transparency = 1
	anchor.Size = Vector3.new(1, 1, 1)
	anchor.Position = position
	anchor.Parent = workspace

	local emitter = Instance.new("ParticleEmitter")
	emitter.Color = ColorSequence.new(color)
	emitter.Rate = 0
	emitter.Lifetime = NumberRange.new(1, 2)
	emitter.Speed = NumberRange.new(8, 16)
	emitter.SpreadAngle = Vector2.new(180, 180)
	emitter.Parent = anchor
	emitter:Emit(rate)

	Debris:AddItem(anchor, life)
end

local Effects = {}

function Effects.Confetti(position: Vector3)
	burst(position, Color3.fromRGB(255, 120, 200), 60, 3)
end

function Effects.Fire(position: Vector3)
	burst(position, Color3.fromRGB(255, 110, 30), 120, 3)
end

function Effects.Stars(position: Vector3)
	burst(position, Color3.fromRGB(255, 240, 150), 80, 3)
end

-- Fallback for unknown effect names
function Effects.Play(name: string, position: Vector3)
	local fn = Effects[name]
	if fn then
		fn(position)
	else
		warn("[Stage] Unknown effect:", name)
	end
end

return Effects
