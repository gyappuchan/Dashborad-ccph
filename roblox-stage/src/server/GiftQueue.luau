-- FIFO queue with a hard size limit. Items: { kind = "join" | "gift", ... }
local GiftQueue = {}
GiftQueue.__index = GiftQueue

function GiftQueue.new(limit: number)
	return setmetatable({ items = {}, limit = limit }, GiftQueue)
end

function GiftQueue:push(item): boolean
	if #self.items >= self.limit then
		return false -- queue full, drop it
	end
	table.insert(self.items, item)
	return true
end

function GiftQueue:pop(): any?
	if #self.items == 0 then
		return nil
	end
	return table.remove(self.items, 1)
end

function GiftQueue:size(): number
	return #self.items
end

return GiftQueue
