-- Central settings. Edit here; no code changes needed for gift tuning.
-- Gift entries are PLACEHOLDERS: rename them to match the real TikTok gift names later.
return {
	-- Stage timing (seconds)
	BaseStayTime = 20, -- how long a joined avatar stays on stage by default
	MaxStayTime = 45, -- hard cap so the stage never freezes
	GiftStayBonus = 5, -- extra seconds added per gift that targets an avatar on stage
	QueueLimit = 15, -- max pending items; extra joins/gifts are dropped
	StageSlots = 3, -- how many avatars can be on stage at once
	ProcessInterval = 0.25, -- how often the queue checks for work

	-- Messages from the Node.js bridge arrive on this topic (must match ROBLOX_TOPIC in bridge/.env)
	MessagingTopic = "TikTokStage",

	-- Gift -> effect mapping (placeholder)
	-- Effect must match a key in Effects.luau. Action "Effect" plays a visual,
	-- "Stay" adds stay time to the newest avatar on stage.
	Gifts = {
		Rose = { Effect = "Confetti", Stay = 0 },
		Lion = { Effect = "Fire", Stay = 5 },
		Galaxy = { Effect = "Stars", Stay = 10 },
	},
	DefaultGift = { Effect = "Confetti", Stay = 0 },

	-- Stage layout. StageOrigin is where the middle avatar's root part stands:
	-- an R15 avatar's feet are about 3 studs lower, so the floor top is StageOrigin.Y - 3.
	StageOrigin = Vector3.new(0, 5, 0),
	SlotSpacing = 8,
	FaceDirection = Vector3.new(0, 0, 1), -- avatars face this way (towards the stream camera)

	-- Map theme applied at game start. Names live in Themes.luau; switch live with /theme <name>.
	Theme = "Halloween",

	-- Dance animations for R15 avatars (a random one per avatar). These are Roblox's standard
	-- emote animations; if one fails to load the avatar falls back to a simple bob.
	DanceAnimations = {
		"rbxassetid://507771019",
		"rbxassetid://507776043",
		"rbxassetid://507777268",
	},
}
