package com.dailyhabits.glass;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import java.util.Calendar;
import java.util.List;

/** Fires every hour: posts a habit reminder notification and schedules the next one. */
public class ReminderReceiver extends BroadcastReceiver {
    public static final String ACTION_FIRE = "com.dailyhabits.glass.FIRE";
    public static final int NOTIF_ID = 2001;

    @Override
    public void onReceive(Context context, Intent intent) {
        showReminder(context);
        ReminderScheduler.scheduleNext(context);
    }

    public static void showReminder(Context ctx) {
        if (Build.VERSION.SDK_INT >= 33 && ctx.checkSelfPermission(
                android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        ReminderScheduler.ensureChannel(ctx);
        HabitStore store = new HabitStore(ctx);
        List<Habit> habits = store.load();
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        Habit h = HabitStore.pickForReminder(habits, hour);

        String title;
        String text;
        if (h == null) {
            title = ctx.getString(R.string.all_done_title);
            text = Tips.forHour(hour);
        } else {
            title = h.emoji + "  " + h.name + "  (" + h.count + "/" + h.target + ")";
            text = (h.hint.isEmpty() ? "" : h.hint + "\n") + "💡 " + Tips.forHour(hour);
        }

        PendingIntent open = PendingIntent.getActivity(ctx, 0,
                new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = new Notification.Builder(ctx, ReminderScheduler.CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notif)
                .setColor(0xFF7C5CFF)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(open)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER);

        if (h != null) {
            Intent done = new Intent(ctx, ActionReceiver.class)
                    .setAction(ActionReceiver.ACTION_INCREMENT)
                    .putExtra(ActionReceiver.EXTRA_ID, h.id)
                    .putExtra(ActionReceiver.EXTRA_DISMISS, true);
            PendingIntent donePi = PendingIntent.getBroadcast(ctx, h.id.hashCode(), done,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            b.addAction(new Notification.Action.Builder(null, ctx.getString(R.string.action_done), donePi).build());

            Intent later = new Intent(ctx, ActionReceiver.class).setAction(ActionReceiver.ACTION_DISMISS);
            PendingIntent laterPi = PendingIntent.getBroadcast(ctx, 7, later,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            b.addAction(new Notification.Action.Builder(null, ctx.getString(R.string.action_later), laterPi).build());
        }

        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(NOTIF_ID, b.build());
    }
}
