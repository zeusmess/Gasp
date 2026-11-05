package com.dailyhabits.glass;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/** Frosted-glass home-screen widget: today's progress, the next habit and quick "+" buttons. */
public class GlassWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    public static void updateAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        if (mgr == null) return;
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, GlassWidgetProvider.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = build(ctx);
        for (int id : ids) mgr.updateAppWidget(id, views);
    }

    private static RemoteViews build(Context ctx) {
        HabitStore store = new HabitStore(ctx);
        List<Habit> habits = store.load();
        int pct = Math.round(HabitStore.overall(habits) * 100);
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        Habit next = HabitStore.pickForReminder(habits, hour);
        Habit water = null;
        for (Habit h : habits) if ("water".equals(h.id)) water = h;

        Locale ar = new Locale("ar");
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_glass);
        v.setTextViewText(R.id.w_date, new SimpleDateFormat("EEEE d MMMM", ar).format(new Date()));
        v.setTextViewText(R.id.w_percent, pct + "%");
        v.setProgressBar(R.id.w_progress, 100, pct, false);
        v.setTextViewText(R.id.w_done, ctx.getString(R.string.done_of,
                HabitStore.doneCount(habits), habits.size()));

        if (next != null) {
            v.setTextViewText(R.id.w_next, next.emoji + "  " + next.name);
            v.setTextViewText(R.id.w_next_count, next.count + " / " + next.target);
            v.setOnClickPendingIntent(R.id.w_next_plus, incrementIntent(ctx, next.id, 11));
            v.setViewVisibility(R.id.w_next_plus, android.view.View.VISIBLE);
        } else {
            v.setTextViewText(R.id.w_next, ctx.getString(R.string.all_done_title));
            v.setTextViewText(R.id.w_next_count, "");
            v.setViewVisibility(R.id.w_next_plus, android.view.View.GONE);
        }

        if (water != null) {
            v.setTextViewText(R.id.w_water, "💧 " + water.count + "/" + water.target);
            v.setOnClickPendingIntent(R.id.w_water, incrementIntent(ctx, water.id, 12));
            v.setViewVisibility(R.id.w_water, android.view.View.VISIBLE);
        } else {
            v.setViewVisibility(R.id.w_water, android.view.View.GONE);
        }

        String footer;
        long nextAt = store.nextReminder();
        if (store.remindersOn() && nextAt > System.currentTimeMillis()) {
            footer = "⏰ " + new SimpleDateFormat("h:mm a", ar).format(new Date(nextAt));
        } else {
            footer = ctx.getString(R.string.reminders_off_short);
        }
        footer += "   🔥 " + store.streak();
        v.setTextViewText(R.id.w_footer, footer);

        PendingIntent open = PendingIntent.getActivity(ctx, 10,
                new Intent(ctx, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_root, open);
        return v;
    }

    private static PendingIntent incrementIntent(Context ctx, String id, int req) {
        Intent i = new Intent(ctx, ActionReceiver.class)
                .setAction(ActionReceiver.ACTION_INCREMENT)
                .putExtra(ActionReceiver.EXTRA_ID, id);
        return PendingIntent.getBroadcast(ctx, req, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
