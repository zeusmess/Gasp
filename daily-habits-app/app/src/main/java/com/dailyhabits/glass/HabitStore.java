package com.dailyhabits.glass;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/**
 * Persists habits and settings in SharedPreferences. Counts reset automatically
 * when the day changes, and a streak of "good days" (≥ 70% done) is kept.
 */
public class HabitStore {
    private static final String PREFS = "habits_store";
    private static final String KEY_HABITS = "habits";
    private static final String KEY_DAY = "day";
    private static final String KEY_STREAK = "streak";
    private static final String KEY_REMINDERS = "reminders_on";
    private static final String KEY_START = "start_hour";
    private static final String KEY_END = "end_hour";
    private static final String KEY_NEXT = "next_reminder";

    private static final float GOOD_DAY = 0.7f;

    private final SharedPreferences prefs;

    public HabitStore(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    // ---------------------------------------------------------------- habits

    public synchronized List<Habit> load() {
        List<Habit> habits = readRaw();
        String today = today();
        String day = prefs.getString(KEY_DAY, null);
        if (day == null) {
            prefs.edit().putString(KEY_DAY, today).apply();
        } else if (!day.equals(today)) {
            // New day: update streak from yesterday's progress, then reset counts.
            int streak = prefs.getInt(KEY_STREAK, 0);
            boolean wasYesterday = day.equals(dayOffset(-1));
            if (overall(habits) >= GOOD_DAY && wasYesterday) {
                streak++;
            } else {
                streak = 0;
            }
            for (Habit h : habits) h.count = 0;
            prefs.edit().putString(KEY_DAY, today).putInt(KEY_STREAK, streak).apply();
            save(habits);
        }
        return habits;
    }

    private List<Habit> readRaw() {
        String raw = prefs.getString(KEY_HABITS, null);
        List<Habit> list = new ArrayList<>();
        if (raw == null) {
            list = defaults();
            save(list);
            return list;
        }
        try {
            JSONArray arr = new JSONArray(raw);
            for (int i = 0; i < arr.length(); i++) list.add(Habit.fromJson(arr.getJSONObject(i)));
        } catch (JSONException e) {
            list = defaults();
        }
        return list;
    }

    public synchronized void save(List<Habit> habits) {
        JSONArray arr = new JSONArray();
        try {
            for (Habit h : habits) arr.put(h.toJson());
        } catch (JSONException ignored) {
        }
        prefs.edit().putString(KEY_HABITS, arr.toString()).apply();
    }

    public synchronized Habit increment(String id, int delta) {
        List<Habit> habits = load();
        Habit found = null;
        for (Habit h : habits) {
            if (h.id.equals(id)) {
                h.count = Math.max(0, Math.min(h.target * 3, h.count + delta));
                found = h;
                break;
            }
        }
        save(habits);
        return found;
    }

    public synchronized void add(Habit habit) {
        List<Habit> habits = load();
        habits.add(habit);
        save(habits);
    }

    public synchronized void remove(String id) {
        List<Habit> habits = load();
        for (int i = habits.size() - 1; i >= 0; i--) {
            if (habits.get(i).id.equals(id)) habits.remove(i);
        }
        save(habits);
    }

    public int streak() {
        return prefs.getInt(KEY_STREAK, 0);
    }

    public static float overall(List<Habit> habits) {
        if (habits.isEmpty()) return 0f;
        float sum = 0f;
        for (Habit h : habits) sum += h.progress();
        return sum / habits.size();
    }

    public static int doneCount(List<Habit> habits) {
        int n = 0;
        for (Habit h : habits) if (h.isDone()) n++;
        return n;
    }

    /** The habit that most needs attention right now (lowest progress), rotated by hour. */
    public static Habit pickForReminder(List<Habit> habits, int hour) {
        Habit best = null;
        int size = habits.size();
        for (int i = 0; i < size; i++) {
            Habit h = habits.get((i + hour) % size);
            if (h.isDone()) continue;
            if (best == null || h.progress() < best.progress()) best = h;
        }
        return best;
    }

    // -------------------------------------------------------------- settings

    public boolean remindersOn() {
        return prefs.getBoolean(KEY_REMINDERS, true);
    }

    public void setRemindersOn(boolean on) {
        prefs.edit().putBoolean(KEY_REMINDERS, on).apply();
    }

    public int startHour() {
        return prefs.getInt(KEY_START, 8);
    }

    public int endHour() {
        return prefs.getInt(KEY_END, 23);
    }

    public void setHours(int start, int end) {
        prefs.edit().putInt(KEY_START, start).putInt(KEY_END, end).apply();
    }

    public long nextReminder() {
        return prefs.getLong(KEY_NEXT, 0L);
    }

    public void setNextReminder(long at) {
        prefs.edit().putLong(KEY_NEXT, at).apply();
    }

    // ----------------------------------------------------------------- utils

    private static String today() {
        return dayOffset(0);
    }

    private static String dayOffset(int days) {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, days);
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(c.getTime());
    }

    public static List<Habit> defaults() {
        List<Habit> list = new ArrayList<>();
        list.add(new Habit("water", "💧", "اشرب كوب ماء", "جسمك يحتاج ٨ أكواب يومياً", 8));
        list.add(new Habit("stretch", "🧘", "تمدّد وحرّك جسمك", "دقيقتان من الإطالة تنشّط الدورة الدموية", 4));
        list.add(new Habit("eyes", "👀", "راحة للعين ٢٠-٢٠-٢٠", "انظر لشيء بعيد ٢٠ قدماً لمدة ٢٠ ثانية", 6));
        list.add(new Habit("walk", "🚶", "امشِ ٥ دقائق", "الحركة كل ساعة تقلل أضرار الجلوس الطويل", 4));
        list.add(new Habit("breath", "🌬️", "تنفّس بعمق دقيقة", "شهيق ٤ ثوانٍ، حبس ٤، زفير ٦", 3));
        list.add(new Habit("posture", "🪑", "عدّل جلستك", "ظهر مستقيم وكتفان مرتخيان", 4));
        list.add(new Habit("fruit", "🍎", "تناول فاكهة أو خضار", "٥ حصص يومياً لصحة أفضل", 3));
        list.add(new Habit("screen", "📵", "استراحة من الشاشة", "١٠ دقائق بعيداً عن الهاتف", 2));
        return list;
    }
}
