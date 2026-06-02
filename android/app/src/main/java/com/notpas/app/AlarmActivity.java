package com.notpas.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AlarmActivity extends AppCompatActivity {

    static final String ACTION_DISMISS = "com.notpas.app.ALARM_DISMISS";

    private Ringtone ringtone;
    private int alarmId;
    private final Handler clockHandler = new Handler(Looper.getMainLooper());

    private final BroadcastReceiver dismissReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.getIntExtra("alarmId", -1) == alarmId) {
                stopAndFinish();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Show over lock screen and turn screen on
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_alarm);

        alarmId = getIntent().getIntExtra("alarmId", 0);
        String title = getIntent().getStringExtra("title");
        String body = getIntent().getStringExtra("body");

        TextView tvTitle = findViewById(R.id.alarm_title);
        TextView tvBody = findViewById(R.id.alarm_body);
        TextView tvTime = findViewById(R.id.alarm_time);
        Button btnDismiss = findViewById(R.id.btn_dismiss);
        Button btnSnooze = findViewById(R.id.btn_snooze);

        if (title != null) tvTitle.setText(title);
        if (body != null && !body.isEmpty()) tvBody.setText(body);

        // Live clock
        updateClock(tvTime);

        // Register dismiss broadcast
        IntentFilter filter = new IntentFilter(ACTION_DISMISS);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(dismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(dismissReceiver, filter);
        }

        // Play alarm ringtone on STREAM_ALARM (bypasses silent mode)
        Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmUri == null) {
            alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        }
        ringtone = RingtoneManager.getRingtone(getApplicationContext(), alarmUri);
        if (ringtone != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ringtone.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
                ringtone.setLooping(true);
            } else {
                ringtone.setStreamType(AudioManager.STREAM_ALARM);
            }
            ringtone.play();
        }

        btnDismiss.setOnClickListener(v -> stopAndFinish());
        btnSnooze.setOnClickListener(v -> snooze());
    }

    private void updateClock(TextView tvTime) {
        tvTime.setText(new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date()));
        clockHandler.postDelayed(() -> updateClock(tvTime), 30_000);
    }

    private void snooze() {
        // Reschedule 5 minutes from now
        long snoozeAt = System.currentTimeMillis() + 5 * 60 * 1000L;
        Intent intent = new Intent(this, AlarmReceiver.class);
        intent.putExtra("title", getIntent().getStringExtra("title"));
        intent.putExtra("body", "Ertelendi");
        intent.putExtra("alarmId", alarmId);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getBroadcast(this, alarmId, intent, piFlags);

        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, snoozeAt, pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, snoozeAt, pi);
        }

        stopAndFinish();
    }

    private void stopAndFinish() {
        clockHandler.removeCallbacksAndMessages(null);
        if (ringtone != null && ringtone.isPlaying()) ringtone.stop();
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        nm.cancel(alarmId);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        clockHandler.removeCallbacksAndMessages(null);
        try { unregisterReceiver(dismissReceiver); } catch (Exception ignored) {}
        if (ringtone != null && ringtone.isPlaying()) ringtone.stop();
    }

    @Override
    public void onBackPressed() {
        // Prevent closing with back button — must use dismiss or snooze
    }
}
