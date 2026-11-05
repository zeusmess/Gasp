package com.dailyhabits.glass;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.SweepGradient;
import android.graphics.Typeface;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.DecelerateInterpolator;

/** Circular glowing progress ring with the percentage in the middle. */
public class ProgressRingView extends View {
    private final Paint track = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint arc = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint sub = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF box = new RectF();
    private float progress = 0f;
    private String label = "";

    public ProgressRingView(Context c, AttributeSet a) {
        super(c, a);
        float d = getResources().getDisplayMetrics().density;
        track.setStyle(Paint.Style.STROKE);
        track.setStrokeWidth(12 * d);
        track.setColor(0x33FFFFFF);
        arc.setStyle(Paint.Style.STROKE);
        arc.setStrokeWidth(12 * d);
        arc.setStrokeCap(Paint.Cap.ROUND);
        glow.set(arc);
        glow.setStrokeWidth(22 * d);
        glow.setAlpha(70);
        text.setColor(Color.WHITE);
        text.setTextAlign(Paint.Align.CENTER);
        text.setTextSize(30 * d);
        text.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        sub.setColor(0xCCFFFFFF);
        sub.setTextAlign(Paint.Align.CENTER);
        sub.setTextSize(12 * d);
        setLayerType(LAYER_TYPE_SOFTWARE, null);
    }

    public void setProgress(float target, String label) {
        this.label = label;
        ValueAnimator va = ValueAnimator.ofFloat(progress, target);
        va.setDuration(700);
        va.setInterpolator(new DecelerateInterpolator());
        va.addUpdateListener(a -> {
            progress = (float) a.getAnimatedValue();
            invalidate();
        });
        va.start();
    }

    @Override
    protected void onSizeChanged(int w, int h, int ow, int oh) {
        float pad = 16 * getResources().getDisplayMetrics().density;
        float s = Math.min(w, h);
        box.set((w - s) / 2f + pad, (h - s) / 2f + pad, (w + s) / 2f - pad, (h + s) / 2f - pad);
        SweepGradient g = new SweepGradient(w / 2f, h / 2f,
                new int[]{0xFF6EE7F9, 0xFFA78BFA, 0xFFF472B6, 0xFF6EE7F9}, null);
        Matrix m = new Matrix();
        m.setRotate(-90, w / 2f, h / 2f);
        g.setLocalMatrix(m);
        arc.setShader(g);
        glow.setShader(g);
        glow.setMaskFilter(new android.graphics.BlurMaskFilter(10 * getResources().getDisplayMetrics().density,
                android.graphics.BlurMaskFilter.Blur.NORMAL));
    }

    @Override
    protected void onDraw(Canvas c) {
        c.drawArc(box, 0, 360, false, track);
        float sweep = 360f * progress;
        if (sweep > 0.5f) {
            c.drawArc(box, -90, sweep, false, glow);
            c.drawArc(box, -90, sweep, false, arc);
        }
        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        c.drawText(Math.round(progress * 100) + "%", cx, cy + text.getTextSize() * 0.25f, text);
        c.drawText(label, cx, cy + text.getTextSize() * 0.25f + sub.getTextSize() * 1.6f, sub);
    }
}
