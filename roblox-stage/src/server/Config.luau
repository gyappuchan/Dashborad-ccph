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

	-- Spawn positions for stage slots (edit to match your place)
	StageOrigin = Vector3.new(0, 5, 0),
	SlotSpacing = 8,
}
