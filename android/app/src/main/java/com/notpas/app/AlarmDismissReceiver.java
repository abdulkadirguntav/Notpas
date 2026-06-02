package com.notpas.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AlarmDismissReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        int alarmId = intent.getIntExtra("alarmId", 0);
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.cancel(alarmId);
        // Stop ringtone in AlarmActivity if it's running
        context.sendBroadcast(new Intent(AlarmActivity.ACTION_DISMISS).putExtra("alarmId", alarmId));
    }
}
