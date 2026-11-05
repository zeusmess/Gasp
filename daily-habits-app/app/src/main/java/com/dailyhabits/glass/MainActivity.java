package com.dailyhabits.glass;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.RenderEffect;
import android.graphics.Shader;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.NumberPicker;
import android.widget.ProgressBar;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import java.lang.ref.WeakReference;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class MainActivity extends Activity {
    private static WeakReference<MainActivity> current = new WeakReference<>(null);

    private HabitStore store;
    private LinearLayout list;
    private ProgressRingView ring;
    private TextView greeting, date, doneText, streakText, nextText, tipText, hoursText, exactHint;
    private Switch remindersSwitch;
    private final Locale ar = new Locale("ar");

    /** Called from receivers so an open screen refreshes after a notification/widget tap. */
    public static void notifyChanged() {
        MainActivity a = current.get();
        if (a != null) new Handler(Looper.getMainLooper()).post(a::refresh);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        setContentView(R.layout.activity_main);
        store = new HabitStore(this);

        View content = findViewById(R.id.content);
        final int basePad = content.getPaddingTop();
        content.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(v.getPaddingLeft(), basePad + insets.getSystemWindowInsetTop(),
                    v.getPaddingRight(), basePad + insets.getSystemWindowInsetBottom());
            return insets;
        });

        if (Build.VERSION.SDK_INT >= 31) {
            findViewById(R.id.blobs).setRenderEffect(
                    RenderEffect.createBlurEffect(60f, 60f, Shader.TileMode.DECAL));
        }

        list = findViewById(R.id.habit_list);
        ring = findViewById(R.id.ring);
        greeting = findViewById(R.id.greeting);
        date = findViewById(R.id.date);
        doneText = findViewById(R.id.done_text);
        streakText = findViewById(R.id.streak_text);
        nextText = findViewById(R.id.next_text);
        tipText = findViewById(R.id.tip_text);
        hoursText = findViewById(R.id.hours_text);
        exactHint = findViewById(R.id.exact_hint);
        remindersSwitch = findViewById(R.id.reminders_switch);

        remindersSwitch.setChecked(store.remindersOn());
        remindersSwitch.setOnCheckedChangeListener((b, on) -> {
            store.setRemindersOn(on);
            ReminderScheduler.scheduleNext(this);
            refresh();
        });
        findViewById(R.id.hours_row).setOnClickListener(v -> showHoursDialog());
        findViewById(R.id.add_button).setOnClickListener(v -> showAddDialog());
        findViewById(R.id.test_button).setOnClickListener(v -> {
            if (hasNotifPermission()) {
                ReminderReceiver.showReminder(this);
            } else {
                requestNotifPermission();
            }
        });
        findViewById(R.id.widget_button).setOnClickListener(v -> pinWidget());
        exactHint.setOnClickListener(v -> {
            if (Build.VERSION.SDK_INT >= 31) {
                startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:" + getPackageName())));
            }
        });

        ReminderScheduler.ensureChannel(this);
        if (!hasNotifPermission()) requestNotifPermission();
    }

    @Override
    protected void onResume() {
        super.onResume();
        current = new WeakReference<>(this);
        ReminderScheduler.scheduleNext(this);
        refresh();
    }

    @Override
    protected void onPause() {
        super.onPause();
        current = new WeakReference<>(null);
    }

    // ----------------------------------------------------------------- render

    private void refresh() {
        List<Habit> habits = store.load();
        Calendar now = Calendar.getInstance();
        int hour = now.get(Calendar.HOUR_OF_DAY);

        greeting.setText(hour < 12 ? R.string.good_morning : hour < 18 ? R.string.good_afternoon : R.string.good_evening);
        date.setText(new SimpleDateFormat("EEEE، d MMMM", ar).format(now.getTime()));

        int done = HabitStore.doneCount(habits);
        ring.setProgress(HabitStore.overall(habits), getString(R.string.today));
        doneText.setText(getString(R.string.done_of, done, habits.size()));
        streakText.setText(getString(R.string.streak_days, store.streak()));
        long next = store.nextReminder();
        if (store.remindersOn() && next > 0) {
            nextText.setText(getString(R.string.next_reminder,
                    new SimpleDateFormat("h:mm a", ar).format(new Date(next))));
        } else {
            nextText.setText(R.string.reminders_off_short);
        }
        tipText.setText(Tips.forHour(hour));
        hoursText.setText(getString(R.string.hours_value, hourLabel(store.startHour()), hourLabel(store.endHour())));

        AlarmManager am = getSystemService(AlarmManager.class);
        exactHint.setVisibility(am != null && !ReminderScheduler.canExact(am) && store.remindersOn()
                ? View.VISIBLE : View.GONE);

        list.removeAllViews();
        LayoutInflater inf = LayoutInflater.from(this);
        for (Habit h : habits) list.addView(buildItem(inf, h));
        GlassWidgetProvider.updateAll(this);
    }

    private View buildItem(LayoutInflater inf, Habit h) {
        View item = inf.inflate(R.layout.item_habit, list, false);
        ((TextView) item.findViewById(R.id.h_emoji)).setText(h.emoji);
        ((TextView) item.findViewById(R.id.h_name)).setText(h.name);
        ((TextView) item.findViewById(R.id.h_hint)).setText(h.hint);
        ((TextView) item.findViewById(R.id.h_count)).setText(h.count + " / " + h.target);
        ProgressBar pb = item.findViewById(R.id.h_progress);
        pb.setMax(h.target);
        pb.setProgress(Math.min(h.count, h.target));
        TextView plus = item.findViewById(R.id.h_plus);
        if (h.isDone()) {
            plus.setText("✓");
            item.setAlpha(0.75f);
        }
        View.OnClickListener inc = v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            item.animate().scaleX(0.96f).scaleY(0.96f).setDuration(80)
                    .withEndAction(() -> item.animate().scaleX(1f).scaleY(1f).setDuration(120)
                            .withEndAction(() -> {
                                Habit after = store.increment(h.id, 1);
                                if (after != null && after.count == after.target) {
                                    Toast.makeText(this, getString(R.string.habit_done, after.emoji),
                                            Toast.LENGTH_SHORT).show();
                                }
                                refresh();
                            }).start()).start();
        };
        plus.setOnClickListener(inc);
        item.setOnClickListener(inc);
        item.setOnLongClickListener(v -> {
            showItemMenu(h);
            return true;
        });
        return item;
    }

    // ---------------------------------------------------------------- dialogs

    private void showItemMenu(Habit h) {
        String[] options = {getString(R.string.minus_one), getString(R.string.reset), getString(R.string.delete)};
        new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle(h.emoji + "  " + h.name)
                .setItems(options, (d, which) -> {
                    if (which == 0) store.increment(h.id, -1);
                    else if (which == 1) store.increment(h.id, -h.count);
                    else store.remove(h.id);
                    refresh();
                })
                .show();
    }

    private void showAddDialog() {
        int pad = dp(20);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(pad, pad / 2, pad, 0);

        EditText emoji = new EditText(this);
        emoji.setHint(R.string.emoji_hint);
        emoji.setText("✨");
        EditText name = new EditText(this);
        name.setHint(R.string.name_hint);
        name.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        EditText hint = new EditText(this);
        hint.setHint(R.string.note_hint);

        TextView tl = new TextView(this);
        tl.setText(R.string.times_per_day);
        tl.setPadding(0, pad / 2, 0, 0);
        NumberPicker target = new NumberPicker(this);
        target.setMinValue(1);
        target.setMaxValue(20);
        target.setValue(3);

        box.addView(emoji);
        box.addView(name);
        box.addView(hint);
        box.addView(tl);
        box.addView(target);

        new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle(R.string.add_habit)
                .setView(box)
                .setPositiveButton(R.string.save, (d, w) -> {
                    String n = name.getText().toString().trim();
                    if (n.isEmpty()) return;
                    String e = emoji.getText().toString().trim();
                    store.add(new Habit("h" + System.currentTimeMillis(), e.isEmpty() ? "✨" : e, n,
                            hint.getText().toString().trim(), target.getValue()));
                    refresh();
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void showHoursDialog() {
        String[] labels = new String[24];
        for (int i = 0; i < 24; i++) labels[i] = hourLabel(i);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.HORIZONTAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(16), dp(12), dp(16), 0);

        NumberPicker from = picker(labels, store.startHour());
        NumberPicker to = picker(labels, store.endHour());
        box.addView(column(getString(R.string.from), from));
        box.addView(column(getString(R.string.to), to));

        new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle(R.string.active_hours)
                .setView(box)
                .setPositiveButton(R.string.save, (d, w) -> {
                    store.setHours(from.getValue(), to.getValue());
                    ReminderScheduler.scheduleNext(this);
                    refresh();
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private NumberPicker picker(String[] labels, int value) {
        NumberPicker p = new NumberPicker(this);
        p.setMinValue(0);
        p.setMaxValue(23);
        p.setDisplayedValues(labels);
        p.setValue(value);
        return p;
    }

    private View column(String title, View child) {
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setGravity(Gravity.CENTER_HORIZONTAL);
        col.setPadding(dp(16), 0, dp(16), 0);
        TextView t = new TextView(this);
        t.setText(title);
        col.addView(t);
        col.addView(child, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));
        return col;
    }

    private void pinWidget() {
        AppWidgetManager mgr = getSystemService(AppWidgetManager.class);
        if (mgr != null && mgr.isRequestPinAppWidgetSupported()) {
            mgr.requestPinAppWidget(new ComponentName(this, GlassWidgetProvider.class), null, null);
        } else {
            Toast.makeText(this, R.string.widget_manual, Toast.LENGTH_LONG).show();
        }
    }

    // ------------------------------------------------------------ permissions

    private boolean hasNotifPermission() {
        return Build.VERSION.SDK_INT < 33 || checkSelfPermission(
                android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestNotifPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 5);
        }
    }

    // ------------------------------------------------------------------ utils

    private String hourLabel(int h) {
        int h12 = h % 12 == 0 ? 12 : h % 12;
        return h12 + (h < 12 ? " ص" : " م");
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
