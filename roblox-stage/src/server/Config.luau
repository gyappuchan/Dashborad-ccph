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

	-- Gift -> action. Gift names are PLACEHOLDERS: rename them to the real TikTok gift names.
	-- Action (see GiftActions.luau):
	--   Hearts     floating hearts over the newest dancer
	--   Spotlight  a spotlight on the newest dancer        (Seconds)
	--   Giant      the newest dancer grows                 (Seconds, Scale)
	--   Fireworks  fireworks over the whole stage
	--   ThemeSwap  switch the map theme for a while        (Theme, Seconds)
	--   QueueJump  the sender's join goes to the front of the queue
	-- Or use Effect = "Confetti" | "Fire" | "Stars" for a plain particle burst.
	-- Stay = extra seconds added to the newest dancer's time on stage.
	Gifts = {
		Rose = { Action = "Hearts", Stay = 0 }, -- small
		TikTok = { Action = "Spotlight", Seconds = 6, Stay = 0 }, -- small
		Lion = { Action = "Giant", Seconds = 8, Scale = 2, Stay = 5 }, -- medium
		Galaxy = { Action = "Fireworks", Stay = 10 }, -- large
		Universe = { Action = "ThemeSwap", Theme = "DiscoNeon", Seconds = 30, Stay = 0 }, -- large
		Interstellar = { Action = "QueueJump", Stay = 0 }, -- large
	},
	DefaultGift = { Effect = "Confetti", Stay = 0 },
	MaxActiveEffects = 3, -- gifts wait in the queue while this many effects are still playing
	PriorityWindow = 120, -- seconds a QueueJump gift stays valid if the sender has not joined yet

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
