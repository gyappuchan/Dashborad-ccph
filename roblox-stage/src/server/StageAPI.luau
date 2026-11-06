-- Single entry point for the queue. The TikTok bridge (later) and dev commands both call this.
local GiftQueue = require(script.Parent.GiftQueue)
local Config = require(script.Parent.Config)

local queue = GiftQueue.new(Config.QueueLimit)

local StageAPI = {}

-- Sender -> time until which their next join goes to the front (set by a QueueJump gift).
local priority: { [string]: number } = {}

-- Returns false when the queue is full or this username is already waiting in it.
-- `by` is the TikTok viewer who asked; a viewer with a QueueJump gift jumps to the front.
function StageAPI.enqueueJoin(username: string, by: string?): boolean
	local wanted = string.lower(username)
	for _, item in queue.items do
		if item.kind == "join" and string.lower(item.username) == wanted then
			return false
		end
	end
	local item = { kind = "join", username = username, by = by or "" }
	if by and by ~= "" and (priority[by] or 0) > os.clock() then
		priority[by] = nil
		if #queue.items >= Config.QueueLimit then
			return false
		end
		table.insert(queue.items, 1, item)
		return true
	end
	return queue:push(item)
end

-- Moves the sender's waiting join to the front. If they have none yet, their next join goes first.
-- Returns true when an existing join was moved.
function StageAPI.promote(sender: string): boolean
	for i, item in queue.items do
		if item.kind == "join" and item.by == sender then
			table.remove(queue.items, i)
			table.insert(queue.items, 1, item)
			return true
		end
	end
	priority[sender] = os.clock() + Config.PriorityWindow
	return false
end

function StageAPI.enqueueGift(giftName: string, sender: string?): boolean
	return queue:push({ kind = "gift", gift = giftName, sender = sender or "" })
end

-- Roblox usernames: 3-20 characters, letters/digits/underscore only.
function StageAPI.isValidUsername(name: any): boolean
	return type(name) == "string" and #name >= 3 and #name <= 20 and name:match("^[%w_]+$") ~= nil
end

function StageAPI.getQueue()
	return queue
end

return StageAPI
