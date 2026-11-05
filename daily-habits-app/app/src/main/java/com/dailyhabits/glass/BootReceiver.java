package com.dailyhabits.glass;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Re-arms the hourly alarm after reboot, app update, or clock changes. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        ReminderScheduler.scheduleNext(context);
    }
}
