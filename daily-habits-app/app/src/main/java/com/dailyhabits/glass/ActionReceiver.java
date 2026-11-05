package com.dailyhabits.glass;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Handles "done" taps from notifications and the "+" button on the widget. */
public class ActionReceiver extends BroadcastReceiver {
    public static final String ACTION_INCREMENT = "com.dailyhabits.glass.INCREMENT";
    public static final String ACTION_DISMISS = "com.dailyhabits.glass.DISMISS";
    public static final String EXTRA_ID = "habit_id";
    public static final String EXTRA_DISMISS = "dismiss";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (ACTION_INCREMENT.equals(action)) {
            String id = intent.getStringExtra(EXTRA_ID);
            if (id != null) new HabitStore(context).increment(id, 1);
            if (intent.getBooleanExtra(EXTRA_DISMISS, false)) cancelNotification(context);
            GlassWidgetProvider.updateAll(context);
            MainActivity.notifyChanged();
        } else if (ACTION_DISMISS.equals(action)) {
            cancelNotification(context);
        }
    }

    private static void cancelNotification(Context ctx) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) nm.cancel(ReminderReceiver.NOTIF_ID);
    }
}
