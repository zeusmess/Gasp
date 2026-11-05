package com.dailyhabits.glass;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;

/** Schedules one alarm at the top of the next active hour; each alarm schedules the next. */
public final class ReminderScheduler {
    public static final String CHANNEL_ID = "hourly_habits";
    private static final int REQ_ALARM = 1001;

    private ReminderScheduler() {
    }

    public static void ensureChannel(Context ctx) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID,
                ctx.getString(R.string.channel_name), NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription(ctx.getString(R.string.channel_desc));
        ch.enableVibration(true);
        nm.createNotificationChannel(ch);
    }

    /** Next full hour that falls inside [start, end]; jumps to tomorrow's start hour otherwise. */
    public static long computeNext(int startHour, int endHour, long now) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        c.add(Calendar.HOUR_OF_DAY, 1);
        for (int i = 0; i < 48; i++) {
            if (isActive(c.get(Calendar.HOUR_OF_DAY), startHour, endHour)) break;
            c.add(Calendar.HOUR_OF_DAY, 1);
        }
        return c.getTimeInMillis();
    }

    static boolean isActive(int hour, int start, int end) {
        if (start == end) return true;
        if (start < end) return hour >= start && hour <= end;
        return hour >= start || hour <= end; // window that crosses midnight
    }

    public static void scheduleNext(Context ctx) {
        HabitStore store = new HabitStore(ctx);
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null) return;
        PendingIntent pi = alarmIntent(ctx);
        am.cancel(pi);
        if (!store.remindersOn()) {
            store.setNextReminder(0L);
            GlassWidgetProvider.updateAll(ctx);
            return;
        }
        long at = computeNext(store.startHour(), store.endHour(), System.currentTimeMillis());
        if (canExact(am)) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } else {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
        store.setNextReminder(at);
        GlassWidgetProvider.updateAll(ctx);
    }

    public static boolean canExact(AlarmManager am) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
    }

    private static PendingIntent alarmIntent(Context ctx) {
        Intent i = new Intent(ctx, ReminderReceiver.class).setAction(ReminderReceiver.ACTION_FIRE);
        return PendingIntent.getBroadcast(ctx, REQ_ALARM, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
