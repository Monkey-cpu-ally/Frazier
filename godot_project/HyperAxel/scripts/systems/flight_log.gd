extends Node

# Flight log - mechanical explorer journal

signal entry_added(entry: Dictionary)

var entries: Array[Dictionary] = []

func add_entry(text: String, category: String = "general") -> void:
	var entry := {"text": text, "category": category, "time": Time.get_ticks_msec()}
	entries.push_front(entry)
	if entries.size() > 50:
		entries.pop_back()
	emit_signal("entry_added", entry)

func recent(count: int = 5) -> Array[Dictionary]:
	return entries.slice(0, min(count, entries.size()))

func clear() -> void:
	entries.clear()
