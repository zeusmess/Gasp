package com.dailyhabits.glass;

import org.json.JSONException;
import org.json.JSONObject;

/** A single daily healthy habit with a target number of repetitions per day. */
public class Habit {
    public final String id;
    public String emoji;
    public String name;
    public String hint;
    public int target;
    public int count;

    public Habit(String id, String emoji, String name, String hint, int target) {
        this.id = id;
        this.emoji = emoji;
        this.name = name;
        this.hint = hint;
        this.target = Math.max(1, target);
        this.count = 0;
    }

    public boolean isDone() {
        return count >= target;
    }

    public float progress() {
        return Math.min(1f, count / (float) target);
    }

    JSONObject toJson() throws JSONException {
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("emoji", emoji);
        o.put("name", name);
        o.put("hint", hint);
        o.put("target", target);
        o.put("count", count);
        return o;
    }

    static Habit fromJson(JSONObject o) {
        Habit h = new Habit(
                o.optString("id"),
                o.optString("emoji", "✨"),
                o.optString("name"),
                o.optString("hint", ""),
                o.optInt("target", 1));
        h.count = o.optInt("count", 0);
        return h;
    }
}
