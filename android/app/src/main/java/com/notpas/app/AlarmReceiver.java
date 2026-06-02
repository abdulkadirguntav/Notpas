package com.notpas.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

public class AlarmReceiver extends BroadcastReceiver {

    static final String CHANNEL_ID = "notpas_fullscreen_alarm";

    @Override
    public void onReceive(Context context, Intent intent) {
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        int alarmId = intent.getIntExtra("alarmId", 0);

        createChannel(context);

        // Full-screen intent → opens AlarmActivity (shows over lock screen)
        Intent fullScreenIntent = new Intent(context, AlarmActivity.class);
        fullScreenIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("body", body);
        fullScreenIntent.putExtra("alarmId", alarmId);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);

        PendingIntent fsPi = PendingIntent.getActivity(context, alarmId, fullScreenIntent, piFlags);

        // Dismiss action from notification shade
        Intent dismissIntent = new Intent(context, AlarmDismissReceiver.class);
        dismissIntent.putExtra("alarmId", alarmId);
        PendingIntent dismissPi = PendingIntent.getBroadcast(context, alarmId + 100000, dismissIntent, piFlags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title != null ? title : "Alarm")
                .setContentText(body != null && !body.isEmpty() ? body : "Alarm vakti!")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(fsPi, true)
                .setAutoCancel(false)
                .setOngoing(true)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Kapat", dismissPi);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(alarmId, builder.build());
    }

    private void createChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel ch = new NotificationChannel(
                        CHANNEL_ID,
                        "Notpas Alarmlar",
                        NotificationManager.IMPORTANCE_HIGH
                );
                ch.setDescription("Alışkanlık alarmları");
                ch.setBypassDnd(true);
                nm.createNotificationChannel(ch);
            }
        }
    }
}
