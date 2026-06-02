package com.notpas.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmPlugin")
public class AlarmPlugin extends Plugin {

    @PluginMethod
    public void schedule(PluginCall call) {
        Integer alarmId = call.getInt("alarmId");
        String title = call.getString("title", "Alarm");
        String body = call.getString("body", "");
        Long atMs = call.getLong("atMs");

        if (alarmId == null || atMs == null || atMs <= System.currentTimeMillis()) {
            call.resolve();
            return;
        }

        Context ctx = getContext();
        Intent intent = new Intent(ctx, AlarmReceiver.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("alarmId", (int) alarmId);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);

        PendingIntent pi = PendingIntent.getBroadcast(ctx, alarmId, intent, piFlags);

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, atMs, pi);
        }

        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        Integer alarmId = call.getInt("alarmId");
        if (alarmId == null) { call.resolve(); return; }

        Context ctx = getContext();
        Intent intent = new Intent(ctx, AlarmReceiver.class);
        int piFlags = PendingIntent.FLAG_NO_CREATE
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);

        PendingIntent pi = PendingIntent.getBroadcast(ctx, alarmId, intent, piFlags);
        if (pi != null) {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            am.cancel(pi);
            pi.cancel();
        }
        call.resolve();
    }
}
