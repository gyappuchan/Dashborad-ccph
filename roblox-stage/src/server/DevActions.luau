-- Developer actions shared by the chat commands and the on-screen DevPanel.
-- Every input is validated here because the panel's RemoteEvent arguments come from a client.
local Config = require(script.Parent.Config)
local StageAPI = require(script.Parent.StageAPI)
local ThemeManager = require(script.Parent.ThemeManager)

local DevActions = {}

-- Returns a short result text.
function DevActions.run(action: any, arg: any, extra: any): string
	if action == "join" then
		if not StageAPI.isValidUsername(arg) then
			return "invalid username"
		end
		return if StageAPI.enqueueJoin(arg) then "join queued" else "queue full"
	elseif action == "gift" then
		if type(arg) ~= "string" or #arg == 0 or #arg > 50 then
			return "invalid gift"
		end
		local sender = if type(extra) == "string" and extra ~= "" then extra else "dev"
		return if StageAPI.enqueueGift(arg, sender) then "gift queued" else "queue full"
	elseif action == "theme" then
		if not ThemeManager.exists(arg) then
			return "unknown theme (available: " .. table.concat(ThemeManager.names(), ", ") .. ")"
		end
		ThemeManager.apply(arg :: string)
		return "theme: " .. (arg :: string)
	end
	return "unknown action"
end

-- Gift names from Config.Gifts, sorted (used to build the panel's buttons).
function DevActions.giftNames(): { string }
	local names = {}
	for name in Config.Gifts do
		table.insert(names, name)
	end
	table.sort(names)
	return names
end

return DevActions
